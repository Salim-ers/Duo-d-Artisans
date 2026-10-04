import 'server-only';
/**
 * Commandes de gâteaux sur mesure : le formulaire crée une DEMANDE (aucun prix affiché,
 * aucun paiement en ligne). La boutique l'étudie, envoie un devis, puis la fait avancer.
 */
import { eq, sql } from 'drizzle-orm';
import { getDb, schema as s, type Tx } from '@/lib/db';
import type { CustomOrder, CustomStatus } from '@/lib/db/schema';
import { addDays, paris } from '@/lib/dates';
import { env } from '@/lib/env';
import { formatDate } from '@/lib/format';
import { mails, notifyStaff, sendEmail } from '@/lib/notify';
import { safeEqual, token } from '@/lib/security';
import { getSetting } from '@/lib/settings';
import { readImage, savePrivateImage } from '@/lib/storage';
import { customInput } from '@/lib/validation';
import type { z } from 'zod';

/** Erreur métier affichable telle quelle au visiteur ou à l'équipe. */
export class RequestError extends Error {}

export const MAX_INSPIRATION_IMAGES = 3;

/** Numérotation : PERSO-20261004-0003 (compteur du jour). */
async function nextNumber(tx: Tx) {
  const day = paris().date.replace(/-/g, '');
  const [row] = await tx
    .insert(s.counters)
    .values({ key: `custom-${day}`, value: 1 })
    .onConflictDoUpdate({ target: s.counters.key, set: { value: sql`${s.counters.value} + 1` } })
    .returning();
  return `PERSO-${day}-${String(row!.value).padStart(4, '0')}`;
}

/** Fiche client créée ou mise à jour automatiquement. */
async function upsertCustomer(tx: Tx, c: { firstName: string; lastName: string; email: string; phone: string }) {
  const [row] = await tx
    .insert(s.customers)
    .values(c)
    .onConflictDoUpdate({
      target: s.customers.email,
      // Une vraie demande rend la fiche réelle, même si elle venait de la démonstration.
      set: { firstName: c.firstName, lastName: c.lastName, phone: c.phone, isDemo: false, updatedAt: new Date() },
    })
    .returning();
  return row!;
}

export async function createCustomRequest(values: z.input<typeof customInput>, files: File[]) {
  if (env.ephemeralDb) throw new RequestError('Les demandes en ligne ne sont pas disponibles pour le moment : appelez la boutique.');
  const input = customInput.parse(values);
  const cfg = await getSetting('custom');
  if (!cfg.types.includes(input.type)) throw new RequestError('Choisissez un type de gâteau.');
  const min = addDays(paris().date, cfg.minDaysNotice);
  if (input.desiredDate < min) throw new RequestError(`La date souhaitée doit être au plus tôt le ${formatDate(min)}.`);
  if (input.desiredDate > addDays(paris().date, 366)) throw new RequestError('Date trop éloignée.');

  // Images lues et vérifiées AVANT la transaction (signature binaire, poids).
  const images: string[] = [];
  for (const f of files.slice(0, MAX_INSPIRATION_IMAGES)) {
    const img = await readImage(f);
    if (img) images.push(await savePrivateImage(img));
  }

  const db = await getDb();
  const c = await db.transaction(async (tx) => {
    const customer = await upsertCustomer(tx, input);
    const [row] = await tx
      .insert(s.customOrders)
      .values({
        number: await nextNumber(tx),
        accessToken: token(),
        customerId: customer.id,
        type: input.type,
        desiredDate: input.desiredDate,
        servings: input.servings,
        flavors: input.flavors,
        theme: input.theme,
        inscription: input.inscription,
        budget: input.budget,
        comment: input.comment,
        images,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
      })
      .returning();
    return row!;
  });

  await sendEmail(c.email, 'custom.received', mails.customReceived(c), { customOrderId: c.id });
  await notifyStaff(
    'custom.new',
    `Nouvelle demande — ${c.type}`,
    `${c.firstName} ${c.lastName} — ${c.servings} pers. — pour le ${formatDate(c.desiredDate)}`,
    `/admin/personnalisees/${c.id}`,
    { customOrderId: c.id },
  );
  return c;
}

export async function findCustomForCustomer(number: string, secret: string) {
  if (!number || !secret || number.length > 40 || secret.length > 64) return null;
  const db = await getDb();
  const [c] = await db.select().from(s.customOrders).where(eq(s.customOrders.number, number.trim()));
  return c && safeEqual(secret, c.accessToken) ? c : null;
}

/** Messages envoyés au client à chaque étape. */
const customerLine: Partial<Record<CustomStatus, [string, string]>> = {
  accepted: ['Commande confirmée', 'votre gâteau est confirmé. La boutique se met au travail !'],
  refused: ['Votre demande', 'la boutique ne peut malheureusement pas réaliser cette demande à la date souhaitée.'],
  ready: ['Votre gâteau est prêt', 'il vous attend en boutique.'],
};

/** Changement de statut par l'équipe (et devis). */
export async function setCustomStatus(id: string, status: CustomStatus, data: { quoteCents?: number | null; message?: string | null; pickupTime?: string | null } = {}) {
  const db = await getDb();
  const [before] = await db.select().from(s.customOrders).where(eq(s.customOrders.id, id));
  if (!before) throw new RequestError('Demande introuvable.');
  if (status === 'quote_sent' && !(data.quoteCents && data.quoteCents > 0)) throw new RequestError('Indiquez le prix du devis.');
  const [c] = await db
    .update(s.customOrders)
    .set({
      status,
      ...(data.quoteCents !== undefined ? { quoteCents: data.quoteCents } : {}),
      ...(data.message !== undefined ? { quoteMessage: data.message } : {}),
      ...(data.pickupTime !== undefined ? { pickupTime: data.pickupTime } : {}),
      updatedAt: new Date(),
    })
    .where(eq(s.customOrders.id, id))
    .returning();
  if (!c || c.isDemo) return c;
  if (status === 'quote_sent') await sendEmail(c.email, 'custom.quote', mails.customQuote(c), { customOrderId: c.id });
  else if (before.status !== status && customerLine[status]) {
    const [title, line] = customerLine[status]!;
    await sendEmail(c.email, 'custom.' + status, mails.customStatus(c, title, line), { customOrderId: c.id });
  }
  return c;
}

/** Le client accepte le devis depuis son lien de suivi. */
export async function acceptQuote(c: CustomOrder) {
  if (c.status !== 'quote_sent') throw new RequestError('Ce devis ne peut plus être accepté en ligne : appelez la boutique.');
  const db = await getDb();
  await db.update(s.customOrders).set({ status: 'accepted', updatedAt: new Date() }).where(eq(s.customOrders.id, c.id));
  await notifyStaff('custom.accepted', `Devis accepté — ${c.number}`, `${c.firstName} ${c.lastName} a accepté le devis.`, `/admin/personnalisees/${c.id}`, {
    customOrderId: c.id,
  });
}
