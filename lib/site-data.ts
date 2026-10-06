import 'server-only';
/** Données publiques partagées par les pages du site : horaires, exceptions, avis, galerie (page Créations). */
import { cache } from 'react';
import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { media } from '@/data/media';
import { getDb, schema as s } from '@/lib/db';
import { addDays, paris } from '@/lib/dates';
import type { DayException } from '@/lib/hours';
import { getSetting } from '@/lib/settings';

/** Fermetures et horaires exceptionnels des trois prochaines semaines. */
async function upcomingExceptions(days = 21): Promise<DayException[]> {
  const db = await getDb();
  const from = paris().date;
  const rows = await db
    .select()
    .from(s.pickupSlots)
    .where(and(gte(s.pickupSlots.date, from), lte(s.pickupSlots.date, addDays(from, days))))
    .orderBy(asc(s.pickupSlots.date));
  return rows.filter((r) => r.closed || (r.opens && r.closes)).map((r) => ({ date: r.date, closed: r.closed, opens: r.opens, closes: r.closes, note: r.note }));
}

export const shopData = cache(async () => {
  const [hours, exceptions, reviews] = await Promise.all([getSetting('hours'), upcomingExceptions(), getSetting('reviews')]);
  return { week: hours.week, exceptions, reviews };
});

/** La devanture n'est pas une création : elle n'apparaît pas dans la galerie (elle a sa section sur l'accueil). */
const notInGalleries = new Set([media.facade.src]);

/** Galerie publique (page Créations), dans l'ordre choisi dans la gestion. */
export async function galleryItems() {
  const db = await getDb();
  const rows = await db
    .select()
    .from(s.gallery)
    .where(eq(s.gallery.active, true))
    .orderBy(asc(s.gallery.position), asc(s.gallery.createdAt));
  return rows.filter((g) => !notInGalleries.has(g.src));
}
