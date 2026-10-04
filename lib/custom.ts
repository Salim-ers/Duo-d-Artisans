import 'server-only';
/**
 * Commandes personnalisées (gâteaux, événements) : un parcours DISTINCT de la commande classique.
 * Le formulaire crée une DEMANDE ; la boutique l'étudie, envoie un devis, puis la fait avancer.
 */
import { eq } from 'drizzle-orm';
import { getDb, schema as s } from '@/lib/db';
import type { CustomOrder, CustomStatus } from '@/lib/db/schema';
import { addDays, paris } from '@/lib/dates';
import { env } from '@/lib/env';
import { formatDate } from '@/lib/format';
import { customStatusLabel } from '@/lib/labels';
import { mails, notifyStaff, sendEmail } from '@/lib/notify';
import { nextNumber, OrderError, upsertCustomer } from '@/lib/orders';
import { safeEqual, token } from '@/lib/security';
import { getSetting } from '@/lib/settings';
import { readImage, savePrivateImage } from '@/lib/storage';
import { customInput } from '@/lib/validation';
import type { z } from 'zod';

export const MAX_INSPIRATION_IMAGES = 3;

export async function createCustomRequest(values: z.input<typeof customInput>, files: File[]) {
  if (env.ephemeralDb) throw new OrderError('Les demandes en ligne ne sont pas disponibles pour le moment : appelez la boutique.');
  const input = customInput.parse(values);
  const cfg = await getSetting('custom');
  if (!cfg.types.includes(input.type)) throw new OrderError('Choisissez un type de création.');
  const min = addDays(paris().date, cfg.minDaysNotice);
  if (input.desiredDate < min) throw new OrderError(`La date souhaitée doit être au plus tôt le ${formatDate(min)}.`);
  if (input.desiredDate > addDays(paris().date, 366)) throw new OrderError('Date trop éloignée.');

  // Images lues et vérifiées AVANT la transaction (signature binaire, poids).
  const images: string[] = [];
  for (const f of files.slice(0, MAX_INSPIRATION_IMAGES)) {
    const img = await readImage(f);
    if (img) images.push(await savePrivateImage(img));
  }

  const db = await getDb();
  const c = await db.transaction(async (tx) => {
    const customer = await upsertCustomer(tx, input, false);
    const [row] = await tx
      .insert(s.customOrders)
      .values({
        number: await nextNumber(tx, 'custom'),
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
  accepted: ['Demande acceptée', 'votre commande personnalisée est confirmée. La boutique se met au travail !'],
  refused: ['Votre demande', 'la boutique ne peut malheureusement pas réaliser cette demande à la date souhaitée.'],
  ready: ['Votre commande est prête', 'votre création vous attend en boutique.'],
};

/** Changement de statut par l'équipe (et devis). */
export async function setCustomStatus(id: string, status: CustomStatus, data: { quoteCents?: number | null; message?: string | null; pickupTime?: string | null } = {}) {
  const db = await getDb();
  const [before] = await db.select().from(s.customOrders).where(eq(s.customOrders.id, id));
  if (!before) throw new OrderError('Demande introuvable.');
  if (status === 'quote_sent' && !(data.quoteCents && data.quoteCents > 0)) throw new OrderError('Indiquez le prix du devis.');
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
  if (c.status !== 'quote_sent') throw new OrderError('Ce devis ne peut plus être accepté en ligne : appelez la boutique.');
  const db = await getDb();
  await db.update(s.customOrders).set({ status: 'accepted', updatedAt: new Date() }).where(eq(s.customOrders.id, c.id));
  await notifyStaff('custom.accepted', `Devis accepté — ${c.number}`, `${c.firstName} ${c.lastName} a accepté le devis (${customStatusLabel.accepted}).`, `/admin/personnalisees/${c.id}`, {
    customOrderId: c.id,
  });
}
