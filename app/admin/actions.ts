'use server';

/**
 * Actions de la gestion. Chaque action revérifie la session ET le rôle côté serveur,
 * revalide toutes les entrées (Zod), journalise les opérations sensibles (audit_logs),
 * puis redirige avec un message (?ok= / ?err=) — jamais de détail technique.
 */
import bcrypt from 'bcryptjs';
import { and, asc, eq, ne, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { AuthError, endSession, hasRole, requireAction, startSession } from '@/lib/auth/session';
import { RequestError, setCustomStatus } from '@/lib/custom';
import { getDb, schema as s } from '@/lib/db';
import type { CustomStatus, Role, User } from '@/lib/db/schema';
import { purgeDemo, seedDemo } from '@/lib/db/demo';
import { isIsoDate } from '@/lib/dates';
import { canSignSessions } from '@/lib/env';
import { customStatuses, galleryCategories } from '@/lib/labels';
import { audit, clientIp, logError, rateLimit, RateLimitError } from '@/lib/security';
import { saveSetting } from '@/lib/settings';
import { catalogSchema, customSchema, hoursSchema, notifySchema, reviewsSchema } from '@/lib/settings-shared';
import { readImage, savePublicImage, UploadError } from '@/lib/storage';
import { email as emailSchema, firstError, text } from '@/lib/validation';

/* ---------- Outils ---------- */
const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const opt = (fd: FormData, k: string) => str(fd, k) || null;
const bool = (fd: FormData, k: string) => fd.get(k) === 'on' || fd.get(k) === 'true' || fd.get(k) === '1';
const int = (fd: FormData, k: string) => {
  const v = str(fd, k);
  if (v === '') return null;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n) : null;
};
/** "12,50" → 1250 */
const cents = (v: string) => {
  const n = Number(v.replace(/\s/g, '').replace('€', '').replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > 100000) throw new RequestError('Montant invalide : ' + v);
  return Math.round(n * 100);
};
const uuid = z.string().uuid();
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure invalide (HH:MM).');

function safeBack(fd: FormData, fallback: string) {
  const b = str(fd, 'back');
  return b.startsWith('/admin') && !b.startsWith('//') ? b : fallback;
}

function withMsg(url: string, key: 'ok' | 'err', msg: string) {
  const [path, qs = ''] = url.split('?');
  const p = new URLSearchParams(qs);
  p.delete('ok');
  p.delete('err');
  p.set(key, msg);
  return `${path}?${p.toString()}`;
}

const isRedirect = (e: unknown) => typeof e === 'object' && e !== null && 'digest' in e && String((e as { digest: unknown }).digest).startsWith('NEXT_REDIRECT');

function errorMessage(e: unknown) {
  if (e instanceof z.ZodError) return firstError(e);
  if (e instanceof AuthError || e instanceof RequestError || e instanceof UploadError || e instanceof RateLimitError) return e.message;
  logError('admin.action', e);
  return 'Erreur inattendue — rien n’a été modifié.';
}

/** Exécute une action protégée, puis redirige avec un message. */
async function run(fd: FormData, min: Role, fallback: string, fn: (u: User) => Promise<string | void>) {
  const back = safeBack(fd, fallback);
  let target: string;
  try {
    const u = await requireAction(min);
    const msg = await fn(u);
    // Gestion ET pages publiques mises en cache (galerie, horaires, avis…).
    revalidatePath('/', 'layout');
    target = withMsg(back, 'ok', msg || 'Enregistré');
  } catch (e) {
    if (isRedirect(e)) throw e;
    if (e instanceof AuthError && /Session/.test(e.message)) redirect('/admin/login');
    target = withMsg(back, 'err', errorMessage(e));
  }
  redirect(target);
}

/* ---------- Authentification ---------- */
let DUMMY: string | undefined;
export async function login(_: unknown, fd: FormData) {
  if (!canSignSessions()) return { error: 'Base de données non connectée : connectez Neon dans Vercel (Storage), puis redéployez.' };
  const email = str(fd, 'email').toLowerCase().slice(0, 160);
  const password = String(fd.get('password') ?? '').slice(0, 200);
  const ip = await clientIp();
  if (!rateLimit('login:' + ip, 10, 900) || !rateLimit('login:' + email, 6, 900)) return { error: 'Trop de tentatives. Réessayez dans 15 minutes.' };
  const db = await getDb();
  const [u] = await db.select().from(s.users).where(eq(s.users.email, email));
  // Comparaison systématique : le temps de réponse ne révèle pas l'existence du compte.
  const ok = await bcrypt.compare(password, u?.passwordHash ?? (DUMMY ??= bcrypt.hashSync('timing-equalizer', 12)));
  if (!u || !ok || !u.active) {
    await audit(u?.id ?? null, 'login.failed', 'user', email, { ip });
    return { error: 'Identifiants incorrects.' };
  }
  await db.update(s.users).set({ lastLoginAt: new Date() }).where(eq(s.users.id, u.id));
  await startSession(u);
  await audit(u.id, 'login', 'user', u.id, { ip });
  redirect('/admin');
}

export async function logout() {
  await endSession();
  redirect('/admin/login');
}

export async function markNotificationsRead(fd: FormData) {
  await run(fd, 'STAFF', '/admin', async () => {
    const db = await getDb();
    await db.update(s.notifications).set({ readAt: new Date() }).where(and(eq(s.notifications.audience, 'staff'), sql`${s.notifications.readAt} is null`));
    return 'Notifications lues';
  });
}

/* ---------- Commandes de gâteaux ---------- */
export async function customUpdate(fd: FormData) {
  await run(fd, 'STAFF', '/admin/personnalisees', async (u) => {
    const id = uuid.parse(str(fd, 'id'));
    const db = await getDb();
    const intent = z.enum(['status', 'quote', 'note']).parse(str(fd, 'intent'));
    if (intent === 'note') {
      await db.update(s.customOrders).set({ internalNote: text(2000).parse(str(fd, 'internalNote')) || null, updatedAt: new Date() }).where(eq(s.customOrders.id, id));
      return 'Note enregistrée';
    }
    const time = opt(fd, 'pickupTime');
    const data = {
      message: text(1500).parse(str(fd, 'message')) || null,
      pickupTime: time ? hhmm.parse(time) : null,
      quoteCents: str(fd, 'quote') ? cents(str(fd, 'quote')) : null,
    };
    const status = intent === 'quote' ? 'quote_sent' : z.enum(customStatuses as [CustomStatus, ...CustomStatus[]]).parse(str(fd, 'status'));
    await setCustomStatus(id, status, intent === 'quote' ? data : {});
    await audit(u.id, 'custom.' + status, 'custom_order', id, data);
    return intent === 'quote' ? 'Devis envoyé au client' : 'Statut mis à jour';
  });
}

/* ---------- Clients (RGPD) ---------- */
export async function customerForget(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/clients', async (u) => {
    const id = uuid.parse(str(fd, 'id'));
    const db = await getDb();
    const anon = { firstName: 'Client', lastName: 'supprimé', email: `supprime-${id.slice(0, 8)}@example.invalid`, phone: '0000000000' };
    await db.transaction(async (tx) => {
      await tx.update(s.customOrders).set({ ...anon, customerId: null, comment: null, images: [] }).where(eq(s.customOrders.customerId, id));
      await tx.delete(s.customers).where(eq(s.customers.id, id));
    });
    await audit(u.id, 'customer.forget', 'customer', id);
    redirect(withMsg('/admin/clients', 'ok', 'Fiche supprimée et demandes anonymisées'));
  });
}

/* ---------- Messages ---------- */
export async function messageRead(fd: FormData) {
  await run(fd, 'STAFF', '/admin/messages', async () => {
    const db = await getDb();
    await db.update(s.messages).set({ read: bool(fd, 'read') }).where(eq(s.messages.id, uuid.parse(str(fd, 'id'))));
    return 'Message mis à jour';
  });
}

export async function messageDelete(fd: FormData) {
  await run(fd, 'STAFF', '/admin/messages', async (u) => {
    const id = uuid.parse(str(fd, 'id'));
    const db = await getDb();
    await db.delete(s.messages).where(eq(s.messages.id, id));
    await audit(u.id, 'message.delete', 'message', id);
    return 'Message supprimé';
  });
}

/* ---------- Galerie ---------- */
const galleryCat = z.enum(galleryCategories.map((c) => c.id) as [string, ...string[]]);

export async function galleryUpload(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/galerie', async (u) => {
    const files = fd.getAll('files').filter((f): f is File => f instanceof File && f.size > 0).slice(0, 8);
    if (!files.length) throw new UploadError('Choisissez au moins une photo.');
    const db = await getDb();
    const [{ max }] = (await db.select({ max: sql<number>`coalesce(max(${s.gallery.position}), -1)::int` }).from(s.gallery)) as [{ max: number }];
    let pos = max;
    for (const f of files) {
      const img = await readImage(f);
      if (!img) continue;
      await db.insert(s.gallery).values({
        src: await savePublicImage(img),
        width: img.width,
        height: img.height,
        alt: text(200).parse(str(fd, 'alt')) || f.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' '),
        title: text(80).parse(str(fd, 'title')) || null,
        category: galleryCat.parse(str(fd, 'category') || 'boutique'),
        position: ++pos,
      });
    }
    await audit(u.id, 'gallery.upload', 'gallery', undefined, { n: files.length });
    return `${files.length} photo(s) ajoutée(s)`;
  });
}

export async function galleryUpdate(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/galerie', async () => {
    const db = await getDb();
    await db
      .update(s.gallery)
      .set({
        alt: text(200, 1, 'Le texte alternatif').parse(str(fd, 'alt')),
        title: text(80).parse(str(fd, 'title')) || null,
        description: text(200).parse(str(fd, 'description')) || null,
        category: galleryCat.parse(str(fd, 'category')),
        active: bool(fd, 'active'),
      })
      .where(eq(s.gallery.id, uuid.parse(str(fd, 'id'))));
    return 'Photo mise à jour';
  });
}

/** Avance ou recule une photo d'un rang (ordre de la page Créations). */
export async function galleryMove(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/galerie', async () => {
    const id = uuid.parse(str(fd, 'id'));
    const dir = str(fd, 'dir') === 'up' ? -1 : 1;
    const db = await getDb();
    const rows = await db.select({ id: s.gallery.id }).from(s.gallery).orderBy(asc(s.gallery.position), asc(s.gallery.createdAt));
    const i = rows.findIndex((r) => r.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= rows.length) return 'Déjà en place';
    [rows[i], rows[j]] = [rows[j]!, rows[i]!];
    await db.transaction(async (tx) => {
      for (const [k, r] of rows.entries()) await tx.update(s.gallery).set({ position: k }).where(eq(s.gallery.id, r.id));
    });
    return 'Ordre mis à jour';
  });
}

export async function galleryDelete(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/galerie', async (u) => {
    const id = uuid.parse(str(fd, 'id'));
    const db = await getDb();
    const [g] = await db.delete(s.gallery).where(eq(s.gallery.id, id)).returning();
    // Fichier envoyé depuis la gestion : supprimé aussi. Les photos d'origine du site restent sur le disque.
    const fileId = g?.src.match(/^\/api\/img\/([0-9a-f-]{36})$/)?.[1];
    if (fileId) await db.delete(s.files).where(eq(s.files.id, fileId));
    await audit(u.id, 'gallery.delete', 'gallery', id);
    return 'Photo retirée de la galerie';
  });
}

/* ---------- Paramètres ---------- */
export async function saveHours(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/parametres', async (u) => {
    const week = Array.from({ length: 7 }, (_, d) => {
      if (!bool(fd, `open-${d}`)) return [];
      const r = [{ open: str(fd, `o1-${d}`), close: str(fd, `c1-${d}`) }];
      if (str(fd, `o2-${d}`) && str(fd, `c2-${d}`)) r.push({ open: str(fd, `o2-${d}`), close: str(fd, `c2-${d}`) });
      return r;
    });
    const v = hoursSchema.parse({ week });
    await saveSetting('hours', v);
    await audit(u.id, 'settings.hours', 'settings', 'hours', v);
    return 'Horaires enregistrés : ils s’affichent partout sur le site';
  });
}

const lines = (v: string) => v.split('\n').map((l) => l.trim()).filter(Boolean);

export async function saveCustomSettings(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/parametres', async (u) => {
    const v = customSchema.parse({ types: lines(str(fd, 'types')), minDaysNotice: int(fd, 'minDaysNotice') });
    await saveSetting('custom', v);
    await audit(u.id, 'settings.custom', 'settings', 'custom', v);
    return 'Commandes de gâteaux enregistrées';
  });
}

export async function saveReviews(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/parametres', async (u) => {
    const rating = str(fd, 'rating') ? Number(str(fd, 'rating').replace(',', '.')) : null;
    const v = reviewsSchema.parse({ rating, count: int(fd, 'count'), checkedOn: opt(fd, 'checkedOn'), url: opt(fd, 'url') });
    await saveSetting('reviews', v);
    await audit(u.id, 'settings.reviews', 'settings', 'reviews', v);
    return 'Avis Google enregistrés';
  });
}

export async function saveNotify(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/parametres', async (u) => {
    const v = notifySchema.parse({ staffEmail: opt(fd, 'staffEmail'), sound: bool(fd, 'sound') });
    await saveSetting('notify', v);
    await audit(u.id, 'settings.notify', 'settings', 'notify', v);
    return 'Notifications enregistrées';
  });
}

export async function saveCatalog(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/parametres', async (u) => {
    const v = catalogSchema.parse({ demo: bool(fd, 'demo') });
    await saveSetting('catalog', v);
    await audit(u.id, 'settings.catalog', 'settings', 'catalog', v);
    return v.demo ? 'Exemples affichés dans la gestion' : 'Exemples masqués : seules les vraies demandes sont visibles';
  });
}

export async function demoRegenerate(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/parametres', async (u) => {
    await seedDemo(await getDb());
    await audit(u.id, 'demo.regenerate', 'settings', 'catalog');
    return 'Exemples régénérés autour d’aujourd’hui';
  });
}

export async function demoPurge(fd: FormData) {
  await run(fd, 'SUPER_ADMIN', '/admin/parametres', async (u) => {
    await purgeDemo(await getDb());
    await saveSetting('catalog', { demo: false });
    await audit(u.id, 'demo.purge', 'settings', 'catalog');
    return 'Toutes les données d’exemple ont été supprimées';
  });
}

/* ---------- Calendrier : fermetures et horaires exceptionnels ---------- */
export async function exceptionAdd(fd: FormData) {
  await run(fd, 'STAFF', '/admin/planning', async (u) => {
    const date = str(fd, 'date');
    if (!isIsoDate(date)) throw new RequestError('Date invalide.');
    const kind = z.enum(['closed', 'hours']).parse(str(fd, 'kind'));
    const note = text(160).parse(str(fd, 'note')) || null;
    const db = await getDb();
    await db.delete(s.pickupSlots).where(eq(s.pickupSlots.date, date));
    if (kind === 'closed') await db.insert(s.pickupSlots).values({ date, closed: true, note: note ?? 'Fermeture exceptionnelle' });
    else {
      const opens = hhmm.parse(str(fd, 'opens'));
      const closes = hhmm.parse(str(fd, 'closes'));
      if (closes <= opens) throw new RequestError('La fermeture doit suivre l’ouverture.');
      await db.insert(s.pickupSlots).values({ date, opens, closes, note: note ?? 'Horaires exceptionnels' });
    }
    await audit(u.id, 'calendar.add', 'pickup_slots', date, { kind });
    return kind === 'closed' ? 'Fermeture enregistrée : elle s’affiche sur le site' : 'Horaires exceptionnels enregistrés';
  });
}

export async function exceptionRemove(fd: FormData) {
  await run(fd, 'STAFF', '/admin/planning', async (u) => {
    const id = uuid.parse(str(fd, 'id'));
    const db = await getDb();
    await db.delete(s.pickupSlots).where(eq(s.pickupSlots.id, id));
    await audit(u.id, 'calendar.remove', 'pickup_slots', id);
    return 'Exception supprimée';
  });
}

/* ---------- Équipe ---------- */
const password = z.string().min(10, 'Mot de passe : 10 caractères minimum.').max(200);

export async function userCreate(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/parametres', async (u) => {
    const role = z.enum(['STAFF', 'ADMIN', 'SUPER_ADMIN']).parse(str(fd, 'role'));
    if (role !== 'STAFF' && !hasRole(u, 'SUPER_ADMIN')) throw new AuthError('Seul un super administrateur peut créer un administrateur.');
    const db = await getDb();
    const [created] = await db
      .insert(s.users)
      .values({ email: emailSchema.parse(str(fd, 'email')), name: text(80, 1, 'Le nom').parse(str(fd, 'name')), role, passwordHash: await bcrypt.hash(password.parse(String(fd.get('password') ?? '')), 12) })
      .onConflictDoNothing()
      .returning();
    if (!created) throw new RequestError('Un compte existe déjà avec cet e-mail.');
    await audit(u.id, 'user.create', 'user', created.id, { role });
    return 'Compte créé';
  });
}

export async function userUpdate(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/parametres', async (u) => {
    const db = await getDb();
    const id = uuid.parse(str(fd, 'id'));
    const [target] = await db.select().from(s.users).where(eq(s.users.id, id));
    if (!target) throw new RequestError('Compte introuvable.');
    if (target.role !== 'STAFF' && !hasRole(u, 'SUPER_ADMIN')) throw new AuthError('Seul un super administrateur peut modifier un administrateur.');
    const op = z.enum(['toggle', 'password', 'revoke']).parse(str(fd, 'op'));
    if (op === 'toggle') {
      if (target.id === u.id) throw new RequestError('Vous ne pouvez pas désactiver votre propre compte.');
      if (target.role === 'SUPER_ADMIN' && target.active) {
        const [{ n }] = (await db.select({ n: sql<number>`count(*)::int` }).from(s.users).where(and(eq(s.users.role, 'SUPER_ADMIN'), eq(s.users.active, true), ne(s.users.id, id)))) as [{ n: number }];
        if (!n) throw new RequestError('Il doit rester au moins un super administrateur actif.');
      }
      await db.update(s.users).set({ active: !target.active, tokenVersion: target.tokenVersion + 1 }).where(eq(s.users.id, id));
    }
    if (op === 'password') await db.update(s.users).set({ passwordHash: await bcrypt.hash(password.parse(String(fd.get('password') ?? '')), 12), tokenVersion: target.tokenVersion + 1 }).where(eq(s.users.id, id));
    if (op === 'revoke') await db.update(s.users).set({ tokenVersion: target.tokenVersion + 1 }).where(eq(s.users.id, id));
    await audit(u.id, 'user.' + op, 'user', id);
    return 'Compte mis à jour';
  });
}

export async function passwordChange(fd: FormData) {
  await run(fd, 'STAFF', '/admin/parametres', async (u) => {
    if (!(await bcrypt.compare(String(fd.get('current') ?? ''), u.passwordHash))) throw new RequestError('Mot de passe actuel incorrect.');
    const db = await getDb();
    const [fresh] = await db
      .update(s.users)
      .set({ passwordHash: await bcrypt.hash(password.parse(String(fd.get('password') ?? '')), 12), tokenVersion: u.tokenVersion + 1 })
      .where(eq(s.users.id, u.id))
      .returning();
    await startSession(fresh!);
    await audit(u.id, 'user.password', 'user', u.id);
    return 'Mot de passe modifié';
  });
}
