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
import { setCustomStatus } from '@/lib/custom';
import { getDb, schema as s } from '@/lib/db';
import type { CustomStatus, OrderStatus, Role, User } from '@/lib/db/schema';
import { purgeDemo, seedDemo } from '@/lib/db/demo';
import { isIsoDate } from '@/lib/dates';
import { canSignSessions } from '@/lib/env';
import { eventTemplates } from '@/lib/event-templates';
import { slugify } from '@/lib/format';
import { ALLERGENS, customStatuses, galleryCategories, orderStatuses } from '@/lib/labels';
import { mails, sendEmail } from '@/lib/notify';
import { OrderError, setOrderStatus } from '@/lib/orders';
import { audit, clientIp, logError, rateLimit, RateLimitError } from '@/lib/security';
import { saveSetting } from '@/lib/settings';
import { catalogSchema, customSchema, hoursSchema, notifySchema, orderingSchema, paymentSchema, reviewsSchema } from '@/lib/settings-shared';
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
  if (!Number.isFinite(n) || n < 0 || n > 100000) throw new OrderError('Montant invalide : ' + v);
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
  if (e instanceof AuthError || e instanceof OrderError || e instanceof UploadError || e instanceof RateLimitError) return e.message;
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
    // Gestion ET pages publiques mises en cache (catalogue, galerie, horaires…).
    revalidatePath('/', 'layout');
    target = withMsg(back, 'ok', msg || 'Enregistré');
  } catch (e) {
    if (isRedirect(e)) throw e;
    if (e instanceof AuthError && /Session/.test(e.message)) redirect('/admin/login');
    target = withMsg(back, 'err', errorMessage(e));
  }
  redirect(target);
}

/** Variante sans redirection, pour les écrans interactifs (production, statut rapide). */
async function act(min: Role, fn: (u: User) => Promise<void>): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const u = await requireAction(min);
    await fn(u);
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
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

/* ---------- Commandes ---------- */
const orderStatus = z.enum(orderStatuses as [OrderStatus, ...OrderStatus[]]);

export async function orderStatusAction(fd: FormData) {
  await run(fd, 'STAFF', '/admin/commandes', async (u) => {
    const id = uuid.parse(str(fd, 'id'));
    const status = orderStatus.parse(str(fd, 'status'));
    await setOrderStatus(id, status);
    await audit(u.id, 'order.status', 'order', id, { status });
    return 'Statut mis à jour';
  });
}

/** Changement de statut instantané (tableau, tablette de production). */
export async function quickOrderStatus(id: string, status: string) {
  return act('STAFF', async (u) => {
    const oid = uuid.parse(id);
    const st = orderStatus.parse(status);
    await setOrderStatus(oid, st);
    await audit(u.id, 'order.status', 'order', oid, { status: st });
  });
}

export async function quickCustomStatus(id: string, status: string) {
  return act('STAFF', async (u) => {
    const cid = uuid.parse(id);
    const st = z.enum(customStatuses as [CustomStatus, ...CustomStatus[]]).parse(status);
    await setCustomStatus(cid, st);
    await audit(u.id, 'custom.status', 'custom_order', cid, { status: st });
  });
}

export async function orderUpdate(fd: FormData) {
  await run(fd, 'STAFF', '/admin/commandes', async (u) => {
    const id = uuid.parse(str(fd, 'id'));
    const date = str(fd, 'pickupDate');
    if (!isIsoDate(date)) throw new OrderError('Date invalide.');
    const time = hhmm.parse(str(fd, 'pickupTime'));
    const db = await getDb();
    await db
      .update(s.orders)
      .set({ pickupDate: date, pickupTime: time, internalNote: text(2000).parse(str(fd, 'internalNote')) || null, updatedAt: new Date() })
      .where(eq(s.orders.id, id));
    await audit(u.id, 'order.update', 'order', id, { date, time });
    return 'Commande modifiée';
  });
}

export async function orderMarkPaid(fd: FormData) {
  await run(fd, 'STAFF', '/admin/commandes', async (u) => {
    const id = uuid.parse(str(fd, 'id'));
    const db = await getDb();
    const [o] = await db.select().from(s.orders).where(eq(s.orders.id, id));
    if (!o) throw new OrderError('Commande introuvable.');
    if (o.amountPaidCents >= o.totalCents) return 'Déjà réglée';
    await db.update(s.orders).set({ amountPaidCents: o.totalCents, paymentStatus: 'paid', updatedAt: new Date() }).where(eq(s.orders.id, id));
    await audit(u.id, 'order.paid', 'order', id, { amount: o.totalCents - o.amountPaidCents });
    return 'Encaissement enregistré';
  });
}

export async function orderResend(fd: FormData) {
  await run(fd, 'STAFF', '/admin/commandes', async (u) => {
    if (!rateLimit('admin-mail:' + u.id, 30, 600)) throw new RateLimitError();
    const id = uuid.parse(str(fd, 'id'));
    const kind = z.enum(['received', 'confirmed', 'ready']).parse(str(fd, 'kind'));
    const db = await getDb();
    const [o] = await db.select().from(s.orders).where(eq(s.orders.id, id));
    if (!o) throw new OrderError('Commande introuvable.');
    if (kind === 'received') await sendEmail(o.email, 'order.received', mails.orderReceived(o, await db.select().from(s.orderItems).where(eq(s.orderItems.orderId, id))), { orderId: id, isDemo: o.isDemo });
    if (kind === 'confirmed') await sendEmail(o.email, 'order.confirmed', mails.orderConfirmed(o), { orderId: id, isDemo: o.isDemo });
    if (kind === 'ready') await sendEmail(o.email, 'order.ready', mails.orderReady(o), { orderId: id, isDemo: o.isDemo });
    await audit(u.id, 'order.notify', 'order', id, { kind });
    return 'E-mail envoyé (voir l’historique)';
  });
}

export async function markNotificationsRead(fd: FormData) {
  await run(fd, 'STAFF', '/admin', async () => {
    const db = await getDb();
    await db.update(s.notifications).set({ readAt: new Date() }).where(and(eq(s.notifications.audience, 'staff'), sql`${s.notifications.readAt} is null`));
    return 'Notifications lues';
  });
}

/* ---------- Commandes personnalisées ---------- */
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
    await setCustomStatus(id, status, intent === 'quote' ? data : { pickupTime: data.pickupTime ?? undefined });
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
      await tx.update(s.orders).set({ ...anon, customerNote: null, customerId: null }).where(eq(s.orders.customerId, id));
      await tx.update(s.customOrders).set({ ...anon, customerId: null, comment: null, images: [] }).where(eq(s.customOrders.customerId, id));
      await tx.delete(s.customers).where(eq(s.customers.id, id));
    });
    await audit(u.id, 'customer.forget', 'customer', id);
    redirect(withMsg('/admin/clients', 'ok', 'Fiche supprimée et commandes anonymisées'));
  });
}

/* ---------- Produits ---------- */
async function uniqueSlug(table: typeof s.products | typeof s.categories | typeof s.events, base: string, exceptId?: string) {
  const db = await getDb();
  const root = slugify(base) || 'element';
  let slug = root;
  for (let i = 2; i < 60; i++) {
    const [hit] = await db.select({ id: table.id }).from(table).where(eq(table.slug, slug));
    if (!hit || hit.id === exceptId) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

export async function productSave(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/produits', async (u) => {
    const db = await getDb();
    const id = opt(fd, 'id');
    const name = text(120, 1, 'Le nom').parse(str(fd, 'name'));
    const img = await readImage(fd.get('imageFile'));
    const categoryId = opt(fd, 'categoryId');
    const days = fd.getAll('availableDays').map(Number).filter((d) => d >= 0 && d <= 6);
    const values = {
      name,
      slug: await uniqueSlug(s.products, opt(fd, 'slug') ?? name, id ?? undefined),
      categoryId: categoryId ? uuid.parse(categoryId) : null,
      description: text(400).parse(str(fd, 'description')) || null,
      image: img ? await savePublicImage(img) : opt(fd, 'image'),
      priceCents: cents(str(fd, 'price') || '0'),
      vatRate: z.number().int().min(0).max(2000).parse(Math.round(Number(str(fd, 'vat').replace(',', '.') || '5.5') * 100)),
      allergens: fd.getAll('allergens').map(String).filter((a) => ALLERGENS.includes(a)),
      active: bool(fd, 'active'),
      orderable: bool(fd, 'orderable'),
      featured: bool(fd, 'featured'),
      position: int(fd, 'position') ?? 0,
      leadTimeHours: z.number().int().min(0).max(720).parse(int(fd, 'leadTimeHours') ?? 0),
      availableDays: days.length === 7 ? [] : [...new Set(days)].sort(),
      stockManaged: bool(fd, 'stockManaged'),
      stockAlert: z.number().int().min(0).max(10000).parse(int(fd, 'stockAlert') ?? 0),
      maxPerOrder: z.number().int().min(1).max(500).parse(int(fd, 'maxPerOrder') ?? 20),
      isDemo: bool(fd, 'isDemo'),
      updatedAt: new Date(),
    };
    const productId = await db.transaction(async (tx) => {
      const [p] = id
        ? await tx.update(s.products).set(values).where(eq(s.products.id, uuid.parse(id))).returning()
        : await tx.insert(s.products).values({ ...values, stock: int(fd, 'stock') ?? 0 }).returning();
      const pid = p!.id;

      // Formats (désactivés plutôt que supprimés : l'historique des commandes y fait référence).
      const vIds = fd.getAll('vId').map(String);
      const vLabels = fd.getAll('vLabel').map(String);
      const vServings = fd.getAll('vServings').map(String);
      const vPrices = fd.getAll('vPrice').map(String);
      const keptV: string[] = [];
      for (let i = 0; i < vLabels.length; i++) {
        const label = vLabels[i]!.trim().slice(0, 60);
        if (!label) continue;
        const v = { label, servings: vServings[i] ? Math.round(Number(vServings[i])) || null : null, priceCents: cents(vPrices[i] || '0'), position: i, active: true };
        if (vIds[i]) {
          await tx.update(s.productVariants).set(v).where(and(eq(s.productVariants.id, uuid.parse(vIds[i])), eq(s.productVariants.productId, pid)));
          keptV.push(vIds[i]!);
        } else {
          const [nv] = await tx.insert(s.productVariants).values({ ...v, productId: pid }).returning({ id: s.productVariants.id });
          keptV.push(nv!.id);
        }
      }
      const allV = await tx.select({ id: s.productVariants.id }).from(s.productVariants).where(eq(s.productVariants.productId, pid));
      for (const v of allV) if (!keptV.includes(v.id)) await tx.update(s.productVariants).set({ active: false }).where(eq(s.productVariants.id, v.id));

      // Options : saveurs et suppléments.
      const oIds = fd.getAll('oId').map(String);
      const oKinds = fd.getAll('oKind').map(String);
      const oLabels = fd.getAll('oLabel').map(String);
      const oPrices = fd.getAll('oPrice').map(String);
      const keptO: string[] = [];
      for (let i = 0; i < oLabels.length; i++) {
        const label = oLabels[i]!.trim().slice(0, 60);
        if (!label) continue;
        const kind = z.enum(['flavor', 'extra']).parse(oKinds[i] || 'flavor');
        const o = { kind, label, priceDeltaCents: kind === 'extra' ? cents(oPrices[i] || '0') : 0, position: i, active: true };
        if (oIds[i]) {
          await tx.update(s.productOptions).set(o).where(and(eq(s.productOptions.id, uuid.parse(oIds[i])), eq(s.productOptions.productId, pid)));
          keptO.push(oIds[i]!);
        } else {
          const [no] = await tx.insert(s.productOptions).values({ ...o, productId: pid }).returning({ id: s.productOptions.id });
          keptO.push(no!.id);
        }
      }
      const allO = await tx.select({ id: s.productOptions.id }).from(s.productOptions).where(eq(s.productOptions.productId, pid));
      for (const o of allO) if (!keptO.includes(o.id)) await tx.update(s.productOptions).set({ active: false }).where(eq(s.productOptions.id, o.id));
      return pid;
    });
    await audit(u.id, id ? 'product.update' : 'product.create', 'product', productId, { name, price: values.priceCents });
    if (!id) redirect(withMsg('/admin/produits/' + productId, 'ok', 'Produit créé'));
    return 'Produit enregistré';
  });
}

export async function productToggle(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/produits', async (u) => {
    const id = uuid.parse(str(fd, 'id'));
    const field = z.enum(['active', 'orderable', 'featured']).parse(str(fd, 'field') || 'active');
    const db = await getDb();
    await db.update(s.products).set({ [field]: sql`not ${s.products[field]}`, updatedAt: new Date() }).where(eq(s.products.id, id));
    await audit(u.id, 'product.toggle', 'product', id, { field });
    return 'Produit mis à jour';
  });
}

export async function productDelete(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/produits', async (u) => {
    const id = uuid.parse(str(fd, 'id'));
    const db = await getDb();
    // L'historique des commandes conserve nom et prix : la suppression ne l'altère pas.
    await db.delete(s.products).where(eq(s.products.id, id));
    await audit(u.id, 'product.delete', 'product', id);
    redirect(withMsg('/admin/produits', 'ok', 'Produit supprimé'));
  });
}

/* ---------- Catégories ---------- */
export async function categorySave(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/categories', async (u) => {
    const db = await getDb();
    const id = opt(fd, 'id');
    const name = text(80, 1, 'Le nom').parse(str(fd, 'name'));
    const img = await readImage(fd.get('imageFile'));
    const values = {
      name,
      slug: await uniqueSlug(s.categories, opt(fd, 'slug') ?? name, id ?? undefined),
      tagline: text(160).parse(str(fd, 'tagline')) || null,
      image: img ? await savePublicImage(img) : opt(fd, 'image'),
      active: id ? bool(fd, 'active') : true,
    };
    if (id) await db.update(s.categories).set(values).where(eq(s.categories.id, uuid.parse(id)));
    else {
      const [{ max }] = (await db.select({ max: sql<number>`coalesce(max(${s.categories.position}), -1)::int` }).from(s.categories)) as [{ max: number }];
      await db.insert(s.categories).values({ ...values, position: max + 1 });
    }
    await audit(u.id, 'category.save', 'category', id ?? values.slug);
    return 'Catégorie enregistrée';
  });
}

/** Réordonne (monter / descendre) : l'ordre est celui de la page Commander. */
async function move(table: typeof s.categories | typeof s.gallery, id: string, dir: 'up' | 'down') {
  const db = await getDb();
  const rows = await db.select({ id: table.id, position: table.position }).from(table).orderBy(asc(table.position), asc(table.createdAt));
  const i = rows.findIndex((r) => r.id === id);
  const j = dir === 'up' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return;
  [rows[i], rows[j]] = [rows[j]!, rows[i]!];
  await db.transaction(async (tx) => {
    for (const [k, r] of rows.entries()) await tx.update(table).set({ position: k }).where(eq(table.id, r.id));
  });
}

export async function categoryMove(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/categories', async () => {
    await move(s.categories, uuid.parse(str(fd, 'id')), str(fd, 'dir') === 'up' ? 'up' : 'down');
    return 'Ordre mis à jour';
  });
}

export async function categoryToggle(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/categories', async (u) => {
    const id = uuid.parse(str(fd, 'id'));
    const db = await getDb();
    await db.update(s.categories).set({ active: sql`not ${s.categories.active}` }).where(eq(s.categories.id, id));
    await audit(u.id, 'category.toggle', 'category', id);
    return 'Catégorie mise à jour';
  });
}

export async function categoryDelete(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/categories', async (u) => {
    const id = uuid.parse(str(fd, 'id'));
    const db = await getDb();
    const [{ n }] = (await db.select({ n: sql<number>`count(*)::int` }).from(s.products).where(eq(s.products.categoryId, id))) as [{ n: number }];
    if (n > 0) throw new OrderError(`Cette catégorie contient ${n} produit(s) : déplacez-les ou désactivez-la plutôt.`);
    await db.delete(s.categories).where(eq(s.categories.id, id));
    await audit(u.id, 'category.delete', 'category', id);
    return 'Catégorie supprimée';
  });
}

/* ---------- Stock ---------- */
export async function stockSave(fd: FormData) {
  await run(fd, 'STAFF', '/admin/stock', async (u) => {
    const id = uuid.parse(str(fd, 'id'));
    const managed = bool(fd, 'managed');
    const qty = z.number().int().min(0).max(100000).parse(int(fd, 'stock') ?? 0);
    const alert = z.number().int().min(0).max(10000).parse(int(fd, 'alert') ?? 0);
    const db = await getDb();
    await db.transaction(async (tx) => {
      const [p] = await tx.select().from(s.products).where(eq(s.products.id, id)).for('update');
      if (!p) throw new OrderError('Produit introuvable.');
      await tx.update(s.products).set({ stockManaged: managed, stock: qty, stockAlert: alert, updatedAt: new Date() }).where(eq(s.products.id, id));
      if (managed && qty !== p.stock) await tx.insert(s.stockMovements).values({ productId: id, delta: qty - p.stock, quantityAfter: qty, reason: 'manual', userId: u.id });
    });
    await audit(u.id, 'stock.save', 'product', id, { managed, qty, alert });
    return 'Stock mis à jour';
  });
}

export async function stockAdjust(fd: FormData) {
  await run(fd, 'STAFF', '/admin/stock', async (u) => {
    const id = uuid.parse(str(fd, 'id'));
    const delta = z.number().int().min(-10000).max(10000).parse(int(fd, 'delta') ?? 0);
    const db = await getDb();
    await db.transaction(async (tx) => {
      const [p] = await tx.select().from(s.products).where(eq(s.products.id, id)).for('update');
      if (!p) throw new OrderError('Produit introuvable.');
      const after = Math.max(0, p.stock + delta);
      await tx.update(s.products).set({ stockManaged: true, stock: after, updatedAt: new Date() }).where(eq(s.products.id, id));
      await tx.insert(s.stockMovements).values({ productId: id, delta: after - p.stock, quantityAfter: after, reason: delta > 0 ? 'restock' : 'manual', userId: u.id });
    });
    await audit(u.id, 'stock.adjust', 'product', id, { delta });
    return delta > 0 ? `+${delta} en stock` : `${delta} en stock`;
  });
}

/* ---------- Événements / collections ---------- */
export async function eventSave(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/evenements', async (u) => {
    const db = await getDb();
    const id = opt(fd, 'id');
    const name = text(120, 1, 'Le nom').parse(str(fd, 'name'));
    const img = await readImage(fd.get('imageFile'));
    const startsOn = opt(fd, 'startsOn');
    const endsOn = opt(fd, 'endsOn');
    if ((startsOn && !isIsoDate(startsOn)) || (endsOn && !isIsoDate(endsOn))) throw new OrderError('Dates invalides.');
    if (startsOn && endsOn && endsOn < startsOn) throw new OrderError('La fin doit suivre le début.');
    const published = bool(fd, 'published');
    if (published && (!startsOn || !endsOn)) throw new OrderError('Indiquez la période d’affichage avant de publier.');
    const values = {
      name,
      slug: await uniqueSlug(s.events, opt(fd, 'slug') ?? name, id ?? undefined),
      headline: text(140).parse(str(fd, 'headline')) || null,
      text: text(600).parse(str(fd, 'text')) || null,
      ctaLabel: text(40).parse(str(fd, 'ctaLabel')) || null,
      image: img ? await savePublicImage(img) : opt(fd, 'image'),
      startsOn,
      endsOn,
      published,
      position: int(fd, 'position') ?? 0,
      updatedAt: new Date(),
    };
    const products = fd.getAll('products').map((p) => uuid.parse(String(p)));
    const eventId = await db.transaction(async (tx) => {
      const [e] = id ? await tx.update(s.events).set(values).where(eq(s.events.id, uuid.parse(id))).returning() : await tx.insert(s.events).values(values).returning();
      await tx.delete(s.eventProducts).where(eq(s.eventProducts.eventId, e!.id));
      if (products.length) await tx.insert(s.eventProducts).values(products.map((productId, position) => ({ eventId: e!.id, productId, position })));
      return e!.id;
    });
    await audit(u.id, id ? 'event.update' : 'event.create', 'event', eventId, { name, published });
    if (!id) redirect(withMsg('/admin/evenements/' + eventId, 'ok', 'Collection créée'));
    return 'Collection enregistrée';
  });
}

export async function eventToggle(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/evenements', async (u) => {
    const id = uuid.parse(str(fd, 'id'));
    const db = await getDb();
    const [e] = await db.select().from(s.events).where(eq(s.events.id, id));
    if (!e) throw new OrderError('Collection introuvable.');
    if (!e.published && (!e.startsOn || !e.endsOn)) throw new OrderError('Indiquez d’abord la période d’affichage.');
    await db.update(s.events).set({ published: !e.published, updatedAt: new Date() }).where(eq(s.events.id, id));
    await audit(u.id, 'event.toggle', 'event', id, { published: !e.published });
    return !e.published ? `« ${e.name} » publiée` : `« ${e.name} » dépubliée`;
  });
}

export async function eventDelete(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/evenements', async (u) => {
    const id = uuid.parse(str(fd, 'id'));
    const db = await getDb();
    await db.delete(s.events).where(eq(s.events.id, id));
    await audit(u.id, 'event.delete', 'event', id);
    redirect(withMsg('/admin/evenements', 'ok', 'Collection supprimée'));
  });
}

export async function eventFromTemplate(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/evenements', async (u) => {
    const t = eventTemplates.find((x) => x.kind === str(fd, 'kind'));
    if (!t) throw new OrderError('Modèle inconnu.');
    const name = `${t.label} ${new Date().getFullYear()}`;
    const db = await getDb();
    const [e] = await db
      .insert(s.events)
      .values({ name, slug: await uniqueSlug(s.events, name), kind: t.kind, headline: t.headline, ctaLabel: t.cta, published: false })
      .returning();
    await audit(u.id, 'event.create', 'event', e!.id, { template: t.kind });
    redirect(withMsg('/admin/evenements/' + e!.id, 'ok', `« ${name} » créé en brouillon : ajoutez période, photo et produits, puis publiez.`));
  });
}

/* ---------- Promotions ---------- */
/** Saisie « YYYY-MM-DDTHH:MM » en heure de Paris → instant UTC. */
function parisDateTime(v: string) {
  if (!v) return null;
  const guess = new Date(v + ':00Z');
  if (Number.isNaN(guess.getTime())) throw new OrderError('Date invalide.');
  const local = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', hourCycle: 'h23' }).format(guess));
  const offset = (local - guess.getUTCHours() + 24) % 24;
  return new Date(guess.getTime() - offset * 3600000);
}

export async function promotionSave(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/promotions', async (u) => {
    const db = await getDb();
    const id = opt(fd, 'id');
    const kind = z.enum(['code', 'auto', 'highlight']).parse(str(fd, 'kind'));
    const type = z.enum(['percent', 'amount']).parse(str(fd, 'type') || 'percent');
    const productId = opt(fd, 'productId');
    const categoryId = opt(fd, 'categoryId');
    if (kind === 'highlight' && !productId) throw new OrderError('Choisissez le produit à mettre en avant.');
    const values = {
      kind,
      label: text(80, 1, 'Le libellé').parse(str(fd, 'label')),
      code: kind === 'code' ? z.string().regex(/^[A-Z0-9_-]{3,30}$/, 'Code : 3 à 30 caractères, lettres majuscules et chiffres.').parse(str(fd, 'code').toUpperCase()) : null,
      type,
      value: kind === 'highlight' ? 0 : type === 'percent' ? z.number().int().min(1, 'Remise : 1 % minimum.').max(100).parse(int(fd, 'value') ?? 0) : cents(str(fd, 'value') || '0'),
      minSubtotalCents: cents(str(fd, 'min') || '0'),
      productId: productId ? uuid.parse(productId) : null,
      categoryId: kind !== 'highlight' && categoryId ? uuid.parse(categoryId) : null,
      startsAt: parisDateTime(str(fd, 'startsAt')),
      endsAt: parisDateTime(str(fd, 'endsAt')),
      maxUses: int(fd, 'maxUses'),
      active: bool(fd, 'active'),
    };
    if (values.startsAt && values.endsAt && values.endsAt <= values.startsAt) throw new OrderError('La fin doit suivre le début.');
    if (id) await db.update(s.promotions).set(values).where(eq(s.promotions.id, uuid.parse(id)));
    else {
      const done = await db.insert(s.promotions).values(values).onConflictDoNothing().returning();
      if (!done.length) throw new OrderError('Ce code existe déjà.');
    }
    await audit(u.id, 'promotion.save', 'promotion', id ?? values.code ?? values.label, values);
    return 'Promotion enregistrée';
  });
}

export async function promotionToggle(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/promotions', async (u) => {
    const id = uuid.parse(str(fd, 'id'));
    const db = await getDb();
    await db.update(s.promotions).set({ active: sql`not ${s.promotions.active}` }).where(eq(s.promotions.id, id));
    await audit(u.id, 'promotion.toggle', 'promotion', id);
    return 'Promotion mise à jour';
  });
}

export async function promotionDelete(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/promotions', async (u) => {
    const id = uuid.parse(str(fd, 'id'));
    const db = await getDb();
    await db.delete(s.promotions).where(eq(s.promotions.id, id));
    await audit(u.id, 'promotion.delete', 'promotion', id);
    return 'Promotion supprimée';
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
        showOnHome: bool(fd, 'showOnHome'),
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
        showOnHome: bool(fd, 'showOnHome'),
        active: bool(fd, 'active'),
      })
      .where(eq(s.gallery.id, uuid.parse(str(fd, 'id'))));
    return 'Photo mise à jour';
  });
}

export async function galleryMove(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/galerie', async () => {
    await move(s.gallery, uuid.parse(str(fd, 'id')), str(fd, 'dir') === 'up' ? 'up' : 'down');
    return 'Ordre mis à jour';
  });
}

export async function galleryDelete(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/galerie', async (u) => {
    const id = uuid.parse(str(fd, 'id'));
    const db = await getDb();
    const [g] = await db.delete(s.gallery).where(eq(s.gallery.id, id)).returning();
    // Fichier envoyé depuis la gestion : supprimé aussi. Les photos d'origine du site (/images/…) restent sur le disque.
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

export async function saveOrdering(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/parametres', async (u) => {
    const v = orderingSchema.parse({
      enabled: bool(fd, 'enabled'),
      pickupDays: Array.from({ length: 7 }, (_, d) => bool(fd, `pickup-${d}`)),
      slotMinutes: int(fd, 'slotMinutes'),
      slotCapacity: int(fd, 'slotCapacity'),
      minLeadMinutes: (int(fd, 'minLeadHours') ?? 0) * 60 + (int(fd, 'minLeadMinutes') ?? 0),
      maxDaysAhead: int(fd, 'maxDaysAhead'),
      firstPickupAfterOpenMinutes: int(fd, 'firstPickupAfterOpenMinutes'),
      lastPickupBeforeCloseMinutes: int(fd, 'lastPickupBeforeCloseMinutes'),
      instructions: text(400).parse(str(fd, 'instructions')),
    });
    await saveSetting('ordering', v);
    await audit(u.id, 'settings.ordering', 'settings', 'ordering', v);
    return 'Commande en ligne et créneaux enregistrés';
  });
}

export async function savePayments(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/parametres', async (u) => {
    const v = paymentSchema.parse({ online: bool(fd, 'online'), onSite: bool(fd, 'onSite') });
    if (!v.online && !v.onSite) throw new OrderError('Gardez au moins un moyen de paiement.');
    await saveSetting('payments', v);
    await audit(u.id, 'settings.payments', 'settings', 'payments', v);
    return 'Paiements enregistrés';
  });
}

const lines = (v: string) => v.split('\n').map((l) => l.trim()).filter(Boolean);

export async function saveCustomSettings(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/parametres', async (u) => {
    const v = customSchema.parse({ types: lines(str(fd, 'types')), minDaysNotice: int(fd, 'minDaysNotice') });
    await saveSetting('custom', v);
    await audit(u.id, 'settings.custom', 'settings', 'custom', v);
    return 'Commandes personnalisées enregistrées';
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
    const v = notifySchema.parse({
      staffEmail: opt(fd, 'staffEmail'),
      emailOnConfirmed: bool(fd, 'emailOnConfirmed'),
      emailOnReady: bool(fd, 'emailOnReady'),
      sound: str(fd, 'sound') || 'all',
      largeOrderCents: cents(str(fd, 'largeOrder') || '0'),
    });
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
    return v.demo ? 'Mode démonstration activé' : 'Mode production : plus aucune donnée d’exemple n’est visible';
  });
}

export async function demoRegenerate(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/parametres', async (u) => {
    const db = await getDb();
    const [{ n }] = (await db.select({ n: sql<number>`count(*)::int` }).from(s.products).where(eq(s.products.isDemo, true))) as [{ n: number }];
    await seedDemo(db, { withProducts: n === 0 });
    await audit(u.id, 'demo.regenerate', 'settings', 'catalog');
    return 'Données d’exemple régénérées autour d’aujourd’hui';
  });
}

export async function demoPurge(fd: FormData) {
  await run(fd, 'SUPER_ADMIN', '/admin/parametres', async (u) => {
    const db = await getDb();
    await purgeDemo(db, { products: true });
    await saveSetting('catalog', { demo: false });
    await audit(u.id, 'demo.purge', 'settings', 'catalog');
    return 'Toutes les données d’exemple ont été supprimées';
  });
}

/* ---------- Calendrier : fermetures, horaires exceptionnels, capacités ---------- */
export async function exceptionAdd(fd: FormData) {
  await run(fd, 'STAFF', '/admin/planning', async (u) => {
    const date = str(fd, 'date');
    if (!isIsoDate(date)) throw new OrderError('Date invalide.');
    const kind = z.enum(['closed', 'hours', 'capacity', 'slot']).parse(str(fd, 'kind'));
    const note = text(160).parse(str(fd, 'note')) || null;
    const db = await getDb();
    if (kind === 'closed' || kind === 'hours') await db.delete(s.pickupSlots).where(and(eq(s.pickupSlots.date, date), sql`${s.pickupSlots.time} is null`));
    if (kind === 'closed') await db.insert(s.pickupSlots).values({ date, closed: true, note: note ?? 'Fermeture exceptionnelle' });
    if (kind === 'hours') {
      const opens = hhmm.parse(str(fd, 'opens'));
      const closes = hhmm.parse(str(fd, 'closes'));
      if (closes <= opens) throw new OrderError('La fermeture doit suivre l’ouverture.');
      await db.insert(s.pickupSlots).values({ date, opens, closes, note: note ?? 'Horaires exceptionnels' });
    }
    if (kind === 'capacity') await db.insert(s.pickupSlots).values({ date, time: opt(fd, 'time') ? hhmm.parse(str(fd, 'time')) : null, capacity: z.number().int().min(0).max(200).parse(int(fd, 'capacity') ?? 0), note });
    if (kind === 'slot') await db.insert(s.pickupSlots).values({ date, time: hhmm.parse(str(fd, 'time')), closed: true, note });
    await audit(u.id, 'calendar.add', 'pickup_slots', date, { kind });
    return kind === 'closed' ? 'Fermeture enregistrée : aucun retrait ne sera proposé ce jour-là' : 'Exception enregistrée';
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
    if (!created) throw new OrderError('Un compte existe déjà avec cet e-mail.');
    await audit(u.id, 'user.create', 'user', created.id, { role });
    return 'Compte créé';
  });
}

export async function userUpdate(fd: FormData) {
  await run(fd, 'ADMIN', '/admin/parametres', async (u) => {
    const db = await getDb();
    const id = uuid.parse(str(fd, 'id'));
    const [target] = await db.select().from(s.users).where(eq(s.users.id, id));
    if (!target) throw new OrderError('Compte introuvable.');
    if (target.role !== 'STAFF' && !hasRole(u, 'SUPER_ADMIN')) throw new AuthError('Seul un super administrateur peut modifier un administrateur.');
    const op = z.enum(['toggle', 'password', 'revoke']).parse(str(fd, 'op'));
    if (op === 'toggle') {
      if (target.id === u.id) throw new OrderError('Vous ne pouvez pas désactiver votre propre compte.');
      if (target.role === 'SUPER_ADMIN' && target.active) {
        const [{ n }] = (await db.select({ n: sql<number>`count(*)::int` }).from(s.users).where(and(eq(s.users.role, 'SUPER_ADMIN'), eq(s.users.active, true), ne(s.users.id, id)))) as [{ n: number }];
        if (!n) throw new OrderError('Il doit rester au moins un super administrateur actif.');
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
    if (!(await bcrypt.compare(String(fd.get('current') ?? ''), u.passwordHash))) throw new OrderError('Mot de passe actuel incorrect.');
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
