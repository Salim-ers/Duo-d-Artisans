import 'server-only';
/** Requêtes de la gestion (lecture). Toutes les pages appelantes vérifient la session avant. */
import { and, asc, desc, eq, gte, ilike, inArray, isNull, lte, ne, or, sql, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { getDb, schema as s } from '@/lib/db';
import type { CustomStatus } from '@/lib/db/schema';
import { addDays, today } from '@/lib/dates';
import { demoVisible } from '@/lib/settings';

/** Masque les données d'exemple hors mode démonstration. */
export async function realOnly(t: { isDemo: AnyPgColumn }): Promise<SQL | undefined> {
  return (await demoVisible()) ? undefined : eq(t.isDemo, false);
}

/** Demandes à réaliser (acceptées, en préparation, prêtes). */
const toMake: CustomStatus[] = ['accepted', 'in_preparation', 'ready'];

export async function dashboardStats() {
  const db = await getDb();
  const d = today();
  const real = await realOnly(s.customOrders);
  const [byStatus, [week], [msgs]] = await Promise.all([
    db
      .select({ status: s.customOrders.status, n: sql<number>`count(*)::int` })
      .from(s.customOrders)
      .where(real)
      .groupBy(s.customOrders.status),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(s.customOrders)
      .where(and(real, inArray(s.customOrders.status, toMake), gte(s.customOrders.desiredDate, d), lte(s.customOrders.desiredDate, addDays(d, 6)))),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(s.messages)
      .where(and(eq(s.messages.read, false), await realOnly(s.messages))),
  ]);
  const n = (st: CustomStatus) => byStatus.find((r) => r.status === st)?.n ?? 0;
  return {
    date: d,
    fresh: n('new_request'),
    reviewing: n('reviewing'),
    quotes: n('quote_sent'),
    thisWeek: week!.n,
    ready: n('ready'),
    unreadMessages: msgs!.n,
  };
}

/** Gâteaux à réaliser dans les prochains jours, du plus proche au plus lointain. */
export async function upcomingCakes(days = 21) {
  const db = await getDb();
  const d = today();
  return db
    .select()
    .from(s.customOrders)
    .where(and(await realOnly(s.customOrders), inArray(s.customOrders.status, toMake), gte(s.customOrders.desiredDate, d), lte(s.customOrders.desiredDate, addDays(d, days))))
    .orderBy(asc(s.customOrders.desiredDate), asc(s.customOrders.pickupTime));
}

/** Demandes à traiter (nouvelles et à étudier), les plus anciennes d'abord. */
export async function pendingRequests() {
  const db = await getDb();
  return db
    .select()
    .from(s.customOrders)
    .where(and(await realOnly(s.customOrders), inArray(s.customOrders.status, ['new_request', 'reviewing'])))
    .orderBy(asc(s.customOrders.createdAt))
    .limit(12);
}

/* ---------- Planning ---------- */
export async function planning(from: string, to: string) {
  const db = await getDb();
  const [custom, exceptions] = await Promise.all([
    db
      .select()
      .from(s.customOrders)
      .where(and(gte(s.customOrders.desiredDate, from), lte(s.customOrders.desiredDate, to), ne(s.customOrders.status, 'refused'), await realOnly(s.customOrders)))
      .orderBy(asc(s.customOrders.desiredDate), asc(s.customOrders.pickupTime)),
    db
      .select()
      .from(s.pickupSlots)
      .where(and(gte(s.pickupSlots.date, from), lte(s.pickupSlots.date, to)))
      .orderBy(asc(s.pickupSlots.date)),
  ]);
  return { custom, exceptions };
}

/* ---------- Clients ---------- */
export async function listCustomers(q?: string) {
  const db = await getDb();
  const term = q?.trim().slice(0, 80);
  return db
    .select({
      c: s.customers,
      n: sql<number>`count(${s.customOrders.id})::int`,
      last: sql<string | null>`max(${s.customOrders.createdAt})`,
    })
    .from(s.customers)
    .leftJoin(s.customOrders, eq(s.customOrders.customerId, s.customers.id))
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
    .orderBy(sql`max(${s.customOrders.createdAt}) desc nulls last`)
    .limit(300);
}

export async function getCustomer(id: string) {
  const db = await getDb();
  const [c] = await db.select().from(s.customers).where(eq(s.customers.id, id));
  if (!c) return null;
  const customs = await db.select().from(s.customOrders).where(eq(s.customOrders.customerId, id)).orderBy(desc(s.customOrders.createdAt));
  return { customer: c, customs };
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
