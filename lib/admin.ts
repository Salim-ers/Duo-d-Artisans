import 'server-only';
/** Requêtes du back-office (lecture). Toutes les pages appelantes vérifient la session avant. */
import { and, asc, desc, eq, gte, ilike, inArray, isNull, lt, lte, ne, or, sql, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { getDb, schema as s } from '@/lib/db';
import type { OrderStatus } from '@/lib/db/schema';
import { addDays, paris, parisDayBounds, today, weekday } from '@/lib/dates';
import { openStatuses, orderStatuses } from '@/lib/labels';
import { visibleOrder } from '@/lib/orders';
import { demoVisible } from '@/lib/settings';

/** Masque les données d'exemple hors mode démonstration. */
export async function realOnly(t: { isDemo: AnyPgColumn }): Promise<SQL | undefined> {
  return (await demoVisible()) ? undefined : eq(t.isDemo, false);
}

/** Chiffre d'affaires : commandes non annulées et réellement engagées (payées ou à régler en boutique). */
const revenueOrder = and(ne(s.orders.status, 'cancelled'), visibleOrder);

export async function withItems<T extends { id: string }>(rows: T[]) {
  if (!rows.length) return rows.map((r) => ({ ...r, items: [] as (typeof s.orderItems.$inferSelect)[] }));
  const db = await getDb();
  const items = await db
    .select()
    .from(s.orderItems)
    .where(inArray(s.orderItems.orderId, rows.map((r) => r.id)));
  return rows.map((r) => ({ ...r, items: items.filter((i) => i.orderId === r.id) }));
}

export async function todayStats() {
  const db = await getDb();
  const d = today();
  const { start, end } = parisDayBounds(d);
  const real = await realOnly(s.orders);
  const [[created], pickups, [custom], [msgs]] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int`, ca: sql<number>`coalesce(sum(${s.orders.totalCents}),0)::int` })
      .from(s.orders)
      .where(and(revenueOrder, real, gte(s.orders.createdAt, start), lt(s.orders.createdAt, end))),
    db
      .select({ status: s.orders.status, n: sql<number>`count(*)::int` })
      .from(s.orders)
      .where(and(eq(s.orders.pickupDate, d), visibleOrder, real))
      .groupBy(s.orders.status),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(s.customOrders)
      .where(and(inArray(s.customOrders.status, ['new_request', 'reviewing']), await realOnly(s.customOrders))),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(s.messages)
      .where(and(eq(s.messages.read, false), await realOnly(s.messages))),
  ]);
  const count = (...st: OrderStatus[]) => pickups.filter((p) => st.includes(p.status)).reduce((t, p) => t + p.n, 0);
  return {
    date: d,
    orders: created!.n,
    revenue: created!.ca,
    pickupsToday: count('new', 'confirmed', 'to_prepare', 'in_preparation', 'ready', 'collected'),
    toPrepare: count('new', 'confirmed', 'to_prepare'),
    inPreparation: count('in_preparation'),
    ready: count('ready'),
    collected: count('collected'),
    customPending: custom!.n,
    unreadMessages: msgs!.n,
  };
}

const hhmm = (m: number) => `${String(Math.floor(Math.max(0, m) / 60)).padStart(2, '0')}:${String(Math.max(0, m) % 60).padStart(2, '0')}`;

export async function upcomingPickups(limit = 12) {
  const db = await getDb();
  const p = paris();
  const rows = await db
    .select()
    .from(s.orders)
    .where(
      and(
        visibleOrder,
        await realOnly(s.orders),
        inArray(s.orders.status, openStatuses),
        or(and(eq(s.orders.pickupDate, p.date), gte(s.orders.pickupTime, hhmm(p.minutes - 60))), gte(s.orders.pickupDate, addDays(p.date, 1))),
      ),
    )
    .orderBy(asc(s.orders.pickupDate), asc(s.orders.pickupTime))
    .limit(limit);
  return withItems(rows);
}

export type OrderFilter = { q?: string; status?: string; date?: string; time?: string; customer?: string; page?: number };

export async function listOrders(f: OrderFilter) {
  const db = await getDb();
  const size = 50;
  const page = Math.max(1, f.page ?? 1);
  const q = f.q?.trim().slice(0, 80);
  const status = orderStatuses.find((x) => x === f.status);
  const where = and(
    visibleOrder,
    await realOnly(s.orders),
    status ? eq(s.orders.status, status) : f.status === 'open' ? inArray(s.orders.status, openStatuses) : undefined,
    f.date ? eq(s.orders.pickupDate, f.date) : undefined,
    f.time ? eq(s.orders.pickupTime, f.time) : undefined,
    f.customer ? eq(s.orders.customerId, f.customer) : undefined,
    q
      ? or(
          ilike(s.orders.number, `%${q}%`),
          ilike(s.orders.lastName, `%${q}%`),
          ilike(s.orders.firstName, `%${q}%`),
          ilike(s.orders.phone, `%${q.replace(/\s/g, '')}%`),
          ilike(s.orders.email, `%${q}%`),
        )
      : undefined,
  );
  const rows = await db
    .select()
    .from(s.orders)
    .where(where)
    .orderBy(...(f.date ? [asc(s.orders.pickupTime)] : [desc(s.orders.pickupDate), desc(s.orders.pickupTime)]))
    .limit(size + 1)
    .offset((page - 1) * size);
  return { rows: await withItems(rows.slice(0, size)), more: rows.length > size, page };
}

export async function getOrder(id: string) {
  const db = await getDb();
  const [o] = await db.select().from(s.orders).where(eq(s.orders.id, id));
  if (!o) return null;
  const [items, notes] = await Promise.all([
    db.select().from(s.orderItems).where(eq(s.orderItems.orderId, id)),
    db.select().from(s.notifications).where(and(eq(s.notifications.orderId, id), ne(s.notifications.channel, 'dashboard'))).orderBy(desc(s.notifications.createdAt)),
  ]);
  return { order: o, items, notifications: notes };
}

/** Créneaux distincts d'une journée (filtre « Créneau »). */
export async function slotTimes(date: string) {
  const db = await getDb();
  const rows = await db
    .selectDistinct({ t: s.orders.pickupTime })
    .from(s.orders)
    .where(and(eq(s.orders.pickupDate, date), visibleOrder, await realOnly(s.orders)))
    .orderBy(asc(s.orders.pickupTime));
  return rows.map((r) => r.t);
}

/* ---------- Production ---------- */
/** Quantités à fabriquer pour une date, puis détail par heure de retrait. */
export async function productionSheet(date: string) {
  const db = await getDb();
  const real = await realOnly(s.orders);
  const base = and(eq(s.orders.pickupDate, date), ne(s.orders.status, 'cancelled'), visibleOrder, real);
  const totals = await db
    .select({
      category: s.orderItems.categoryName,
      name: s.orderItems.name,
      variant: s.orderItems.variantLabel,
      options: s.orderItems.options,
      qty: sql<number>`sum(${s.orderItems.quantity})::int`,
      orders: sql<number>`count(distinct ${s.orders.id})::int`,
    })
    .from(s.orderItems)
    .innerJoin(s.orders, eq(s.orderItems.orderId, s.orders.id))
    .where(base)
    .groupBy(s.orderItems.categoryName, s.orderItems.name, s.orderItems.variantLabel, s.orderItems.options)
    .orderBy(asc(s.orderItems.categoryName), asc(s.orderItems.name), asc(s.orderItems.variantLabel));

  const orders = await withItems(await db.select().from(s.orders).where(base).orderBy(asc(s.orders.pickupTime), asc(s.orders.number)));
  const slots = new Map<string, typeof orders>();
  for (const o of orders) slots.set(o.pickupTime, [...(slots.get(o.pickupTime) ?? []), o]);

  const custom = await db
    .select()
    .from(s.customOrders)
    .where(and(eq(s.customOrders.desiredDate, date), inArray(s.customOrders.status, ['accepted', 'in_preparation', 'ready']), await realOnly(s.customOrders)))
    .orderBy(asc(s.customOrders.pickupTime));

  // Regroupement par produit (toutes options confondues) pour la ligne principale.
  const byProduct = new Map<string, { category: string; name: string; qty: number; detail: { label: string; qty: number }[] }>();
  for (const t of totals) {
    const key = `${t.category ?? ''}|${t.name}`;
    const row = byProduct.get(key) ?? { category: t.category ?? 'Autres', name: t.name, qty: 0, detail: [] };
    row.qty += t.qty;
    const label = [t.variant, t.options].filter(Boolean).join(' · ');
    if (label) row.detail.push({ label, qty: t.qty });
    byProduct.set(key, row);
  }
  return { products: [...byProduct.values()], slots: [...slots.entries()], custom, orderCount: orders.length };
}

/** Tableau de production (tablette) : commandes du jour par colonne. */
export async function kitchenBoard(date: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(s.orders)
    .where(and(eq(s.orders.pickupDate, date), inArray(s.orders.status, [...openStatuses, 'collected']), visibleOrder, await realOnly(s.orders)))
    .orderBy(asc(s.orders.pickupTime), asc(s.orders.number));
  const custom = await db
    .select()
    .from(s.customOrders)
    .where(and(eq(s.customOrders.desiredDate, date), inArray(s.customOrders.status, ['accepted', 'in_preparation', 'ready', 'collected']), await realOnly(s.customOrders)))
    .orderBy(asc(s.customOrders.pickupTime));
  return { orders: await withItems(rows), custom };
}

/* ---------- Planning ---------- */
export async function planning(from: string, to: string) {
  const db = await getDb();
  const [orders, custom, events, exceptions] = await Promise.all([
    db
      .select({
        id: s.orders.id,
        number: s.orders.number,
        date: s.orders.pickupDate,
        time: s.orders.pickupTime,
        status: s.orders.status,
        name: sql<string>`${s.orders.firstName} || ' ' || ${s.orders.lastName}`,
        total: s.orders.totalCents,
      })
      .from(s.orders)
      .where(and(gte(s.orders.pickupDate, from), lte(s.orders.pickupDate, to), ne(s.orders.status, 'cancelled'), visibleOrder, await realOnly(s.orders)))
      .orderBy(asc(s.orders.pickupDate), asc(s.orders.pickupTime)),
    db
      .select()
      .from(s.customOrders)
      .where(and(gte(s.customOrders.desiredDate, from), lte(s.customOrders.desiredDate, to), ne(s.customOrders.status, 'refused'), await realOnly(s.customOrders)))
      .orderBy(asc(s.customOrders.desiredDate)),
    db
      .select()
      .from(s.events)
      .where(and(eq(s.events.published, true), lte(s.events.startsOn, to), gte(s.events.endsOn, from), await realOnly(s.events))),
    db
      .select()
      .from(s.pickupSlots)
      .where(and(gte(s.pickupSlots.date, from), lte(s.pickupSlots.date, to)))
      .orderBy(asc(s.pickupSlots.date), asc(s.pickupSlots.time)),
  ]);
  return { orders, custom, events, exceptions };
}

/* ---------- Clients ---------- */
export async function listCustomers(q?: string) {
  const db = await getDb();
  const term = q?.trim().slice(0, 80);
  return db
    .select({
      c: s.customers,
      n: sql<number>`count(${s.orders.id}) filter (where ${s.orders.status} <> 'cancelled')::int`,
      total: sql<number>`coalesce(sum(${s.orders.totalCents}) filter (where ${s.orders.status} <> 'cancelled'),0)::int`,
      last: sql<string | null>`max(${s.orders.createdAt})`,
    })
    .from(s.customers)
    .leftJoin(s.orders, and(eq(s.orders.customerId, s.customers.id), visibleOrder))
    .where(
      and(
        await realOnly(s.customers),
        term
          ? or(
              ilike(s.customers.lastName, `%${term}%`),
              ilike(s.customers.firstName, `%${term}%`),
              ilike(s.customers.email, `%${term}%`),
              ilike(s.customers.phone, `%${term.replace(/\s/g, '')}%`),
            )
          : undefined,
      ),
    )
    .groupBy(s.customers.id)
    .orderBy(sql`max(${s.orders.createdAt}) desc nulls last`)
    .limit(300);
}

export async function getCustomer(id: string) {
  const db = await getDb();
  const [c] = await db.select().from(s.customers).where(eq(s.customers.id, id));
  if (!c) return null;
  const [orders, customs] = await Promise.all([
    db.select().from(s.orders).where(and(eq(s.orders.customerId, id), visibleOrder)).orderBy(desc(s.orders.createdAt)),
    db.select().from(s.customOrders).where(eq(s.customOrders.customerId, id)).orderBy(desc(s.customOrders.createdAt)),
  ]);
  const valid = orders.filter((o) => o.status !== 'cancelled');
  return { customer: c, orders, customs, count: valid.length, total: valid.reduce((t, o) => t + o.totalCents, 0), last: orders[0]?.createdAt ?? null };
}

/* ---------- Statistiques ---------- */
export async function stats(from: string, to: string) {
  const db = await getDb();
  const real = await realOnly(s.orders);
  const range = (a: string, b: string) => and(revenueOrder, real, gte(s.orders.createdAt, parisDayBounds(a).start), lt(s.orders.createdAt, parisDayBounds(b).end));
  const days = Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1;
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(days - 1));
  const total = async (a: string, b: string) => {
    const [r] = await db
      .select({ n: sql<number>`count(*)::int`, ca: sql<number>`coalesce(sum(${s.orders.totalCents}),0)::int` })
      .from(s.orders)
      .where(range(a, b));
    return r!;
  };
  const where = range(from, to);
  const [current, previous, daily, top, byWeekday, bySlot] = await Promise.all([
    total(from, to),
    total(prevFrom, prevTo),
    db
      .select({
        d: sql<string>`to_char(${s.orders.createdAt} at time zone 'Europe/Paris', 'YYYY-MM-DD')`,
        ca: sql<number>`coalesce(sum(${s.orders.totalCents}),0)::int`,
        n: sql<number>`count(*)::int`,
      })
      .from(s.orders)
      .where(where)
      .groupBy(sql`1`)
      .orderBy(sql`1`),
    db
      .select({
        name: s.orderItems.name,
        qty: sql<number>`sum(${s.orderItems.quantity})::int`,
        ca: sql<number>`sum(${s.orderItems.quantity} * ${s.orderItems.unitPriceCents})::int`,
      })
      .from(s.orderItems)
      .innerJoin(s.orders, eq(s.orderItems.orderId, s.orders.id))
      .where(where)
      .groupBy(s.orderItems.name)
      .orderBy(desc(sql`sum(${s.orderItems.quantity})`))
      .limit(10),
    db
      .select({ d: s.orders.pickupDate, n: sql<number>`count(*)::int` })
      .from(s.orders)
      .where(where)
      .groupBy(s.orders.pickupDate),
    db
      .select({ t: s.orders.pickupTime, n: sql<number>`count(*)::int` })
      .from(s.orders)
      .where(where)
      .groupBy(s.orders.pickupTime)
      .orderBy(desc(sql`count(*)`))
      .limit(8),
  ]);
  const weekdays = [0, 0, 0, 0, 0, 0, 0];
  for (const r of byWeekday) weekdays[weekday(r.d)]! += r.n;
  return {
    from,
    to,
    days,
    previous: { ...previous, from: prevFrom, to: prevTo, avg: previous.n ? Math.round(previous.ca / previous.n) : 0 },
    current: { ...current, avg: current.n ? Math.round(current.ca / current.n) : 0 },
    daily,
    top,
    weekdays,
    slots: bySlot,
  };
}

/* ---------- Notifications ---------- */
export async function unreadNotifications(limit = 10) {
  const db = await getDb();
  return db
    .select()
    .from(s.notifications)
    .where(and(eq(s.notifications.audience, 'staff'), eq(s.notifications.channel, 'dashboard'), isNull(s.notifications.readAt), await realOnly(s.notifications)))
    .orderBy(desc(s.notifications.createdAt))
    .limit(limit);
}

/** Compteurs de la barre latérale + dernier événement (sondé toutes les 20 s par la gestion). */
export async function pulse() {
  const db = await getDb();
  const [[notes], [custom], [msgs], [last]] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(s.notifications)
      .where(and(eq(s.notifications.audience, 'staff'), eq(s.notifications.channel, 'dashboard'), isNull(s.notifications.readAt), await realOnly(s.notifications))),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(s.customOrders)
      .where(and(inArray(s.customOrders.status, ['new_request', 'reviewing']), await realOnly(s.customOrders))),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(s.messages)
      .where(and(eq(s.messages.read, false), await realOnly(s.messages))),
    db
      .select()
      .from(s.notifications)
      .where(and(eq(s.notifications.audience, 'staff'), eq(s.notifications.channel, 'dashboard'), await realOnly(s.notifications)))
      .orderBy(desc(s.notifications.createdAt))
      .limit(1),
  ]);
  return {
    unread: notes!.n,
    custom: custom!.n,
    messages: msgs!.n,
    last: last ? { id: last.id, type: last.type, subject: last.subject, body: last.body, href: last.href, at: last.createdAt.toISOString() } : null,
  };
}


/* ---------- Catalogue (gestion) ---------- */
export async function adminProducts() {
  const db = await getDb();
  const [rows, counts] = await Promise.all([
    db
      .select({ p: s.products, category: s.categories.name, catPos: s.categories.position })
      .from(s.products)
      .leftJoin(s.categories, eq(s.products.categoryId, s.categories.id))
      .where(await realOnly(s.products))
      .orderBy(asc(s.categories.position), asc(s.products.position), asc(s.products.name)),
    db
      .select({ id: s.productVariants.productId, n: sql<number>`count(*)::int` })
      .from(s.productVariants)
      .where(eq(s.productVariants.active, true))
      .groupBy(s.productVariants.productId),
  ]);
  const variants = new Map(counts.map((c) => [c.id, c.n]));
  return rows.map((r) => ({ ...r.p, category: r.category, variants: variants.get(r.p.id) ?? 0 }));
}
