import 'server-only';
/**
 * Créneaux de retrait : générés depuis les horaires d'ouverture et les réglages de commande,
 * moins les fermetures, les créneaux complets, le délai de préparation et les jours non proposés.
 * Le client ne peut JAMAIS commander pour un créneau impossible : la vérification est refaite
 * dans la transaction de commande (assertSlot).
 */
import { and, asc, eq, gte, lte, ne, sql } from 'drizzle-orm';
import { getDb, schema as s, type Tx } from '@/lib/db';
import { addDays, fromMinutes, nowStamp, paris, stamp, toMinutes, weekday } from '@/lib/dates';
import type { DayException } from '@/lib/hours';
import type { HoursSettings, OrderingSettings } from '@/lib/settings-shared';
import { demoVisible, getSetting } from '@/lib/settings';

export type Slot = { time: string; remaining: number; full: boolean };
export type PickupDay = { date: string; slots: Slot[]; closed: boolean; note: string | null };

type Override = typeof s.pickupSlots.$inferSelect;
export type SlotQuery = { leadHours?: number; weekdays?: number[] | null };

export function buildDay(
  date: string,
  hours: HoursSettings,
  ordering: OrderingSettings,
  overrides: Override[],
  counts: Map<string, number>,
  earliest: number,
  weekdays: number[] | null,
): PickupDay {
  const own = overrides.filter((o) => o.date === date);
  const whole = own.find((o) => o.time === null);
  const wd = weekday(date);
  if (whole?.closed) return { date, slots: [], closed: true, note: whole.note || 'Fermeture exceptionnelle' };
  const special = whole?.opens && whole.closes ? [{ open: whole.opens, close: whole.closes }] : null;
  // Une ouverture exceptionnelle rend le retrait possible même un jour habituellement fermé.
  if (!special && !ordering.pickupDays[wd]) return { date, slots: [], closed: true, note: null };
  if (weekdays && !weekdays.includes(wd)) return { date, slots: [], closed: false, note: 'Un produit du panier n’est pas proposé ce jour-là' };
  const ranges = special ?? hours.week[wd] ?? [];
  const slots: Slot[] = [];
  for (const r of ranges) {
    const first = toMinutes(r.open) + ordering.firstPickupAfterOpenMinutes;
    const last = toMinutes(r.close) - ordering.lastPickupBeforeCloseMinutes;
    for (let m = first; m <= last; m += ordering.slotMinutes) {
      const time = fromMinutes(m);
      if (stamp(date, m) < earliest) continue;
      const o = own.find((x) => x.time === time);
      if (o?.closed) continue;
      const capacity = o?.capacity ?? whole?.capacity ?? ordering.slotCapacity;
      const used = counts.get(date + '|' + time) ?? 0;
      slots.push({ time, remaining: Math.max(0, capacity - used), full: used >= capacity });
    }
  }
  return { date, slots, closed: ranges.length === 0, note: special ? whole?.note || 'Horaires exceptionnels' : null };
}

async function loadRange(from: string, to: string, showDemo: boolean, tx?: Tx) {
  const db = tx ?? (await getDb());
  const [overrides, used] = await Promise.all([
    db.select().from(s.pickupSlots).where(and(gte(s.pickupSlots.date, from), lte(s.pickupSlots.date, to))),
    db
      .select({ d: s.orders.pickupDate, t: s.orders.pickupTime, n: sql<number>`count(*)::int` })
      .from(s.orders)
      .where(
        and(
          gte(s.orders.pickupDate, from),
          lte(s.orders.pickupDate, to),
          ne(s.orders.status, 'cancelled'),
          showDemo ? undefined : eq(s.orders.isDemo, false),
        ),
      )
      .groupBy(s.orders.pickupDate, s.orders.pickupTime),
  ]);
  return { overrides, counts: new Map(used.map((u) => [u.d + '|' + u.t, u.n])) };
}

const earliestFor = (ordering: OrderingSettings, q: SlotQuery) => nowStamp() + Math.max(ordering.minLeadMinutes, (q.leadHours ?? 0) * 60);

/** Jours et créneaux proposés au client. */
export async function availableDays(q: SlotQuery = {}): Promise<PickupDay[]> {
  const [hours, ordering, showDemo] = await Promise.all([getSetting('hours'), getSetting('ordering'), demoVisible()]);
  const start = paris().date;
  const dates = Array.from({ length: ordering.maxDaysAhead + 1 }, (_, i) => addDays(start, i));
  const { overrides, counts } = await loadRange(dates[0]!, dates[dates.length - 1]!, showDemo);
  const earliest = earliestFor(ordering, q);
  return dates.map((d) => buildDay(d, hours, ordering, overrides, counts, earliest, q.weekdays ?? null));
}

export class SlotError extends Error {}

/**
 * Vérification au moment de la commande, dans la transaction (le créneau a pu se remplir entre-temps).
 * Les réglages sont lus AVANT la transaction et passés en paramètre : aucune requête hors transaction
 * ne doit s'y glisser (PGlite n'a qu'une connexion).
 */
export async function assertSlot(
  tx: Tx,
  cfg: { hours: HoursSettings; ordering: OrderingSettings; showDemo: boolean },
  date: string,
  time: string,
  q: SlotQuery,
) {
  const { hours, ordering } = cfg;
  if (date > addDays(paris().date, ordering.maxDaysAhead)) throw new SlotError('Cette date de retrait est trop éloignée.');
  // Sérialise les commandes sur un même créneau.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${'slot:' + date + '|' + time}))`);
  const { overrides, counts } = await loadRange(date, date, cfg.showDemo, tx);
  const day = buildDay(date, hours, ordering, overrides, counts, earliestFor(ordering, q), q.weekdays ?? null);
  const slot = day.slots.find((x) => x.time === time);
  if (!slot) throw new SlotError('Ce créneau n’est plus disponible. Merci d’en choisir un autre.');
  if (slot.full) throw new SlotError('Ce créneau vient d’être complet. Merci d’en choisir un autre.');
}

/** Exceptions publiques des prochains jours (statut d'ouverture, horaires affichés). */
export async function upcomingExceptions(days = 21): Promise<DayException[]> {
  const db = await getDb();
  const from = paris().date;
  const rows = await db
    .select()
    .from(s.pickupSlots)
    .where(and(gte(s.pickupSlots.date, from), lte(s.pickupSlots.date, addDays(from, days)), sql`${s.pickupSlots.time} is null`))
    .orderBy(asc(s.pickupSlots.date));
  return rows
    .filter((r) => r.closed || (r.opens && r.closes))
    .map((r) => ({ date: r.date, closed: r.closed, opens: r.opens, closes: r.closes, note: r.note }));
}
