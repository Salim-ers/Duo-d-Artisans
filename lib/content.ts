import 'server-only';
/** Contenus publics administrables : galerie, collection du moment, produits mis en avant. */
import { and, asc, eq, gte, inArray, lte } from 'drizzle-orm';
import { getDb, schema as s } from '@/lib/db';
import { today } from '@/lib/dates';
import { listProducts, type ProductView } from '@/lib/catalog';
import { highlightedProductIds } from '@/lib/pricing';
import { demoVisible } from '@/lib/settings';

export async function galleryItems(homeOnly = false) {
  const db = await getDb();
  return db
    .select()
    .from(s.gallery)
    .where(and(eq(s.gallery.active, true), homeOnly ? eq(s.gallery.showOnHome, true) : undefined))
    .orderBy(asc(s.gallery.position), asc(s.gallery.createdAt));
}

/** Événements publiés dont la période d'affichage couvre aujourd'hui. */
export async function activeEvents() {
  const db = await getDb();
  const d = today();
  const showDemo = await demoVisible();
  const events = await db
    .select()
    .from(s.events)
    .where(and(eq(s.events.published, true), lte(s.events.startsOn, d), gte(s.events.endsOn, d), showDemo ? undefined : eq(s.events.isDemo, false)))
    .orderBy(asc(s.events.position), asc(s.events.startsOn));
  if (!events.length) return [];
  const links = await db
    .select()
    .from(s.eventProducts)
    .where(inArray(s.eventProducts.eventId, events.map((e) => e.id)))
    .orderBy(asc(s.eventProducts.position));
  return events.map((e) => ({ ...e, productIds: links.filter((l) => l.eventId === e.id).map((l) => l.productId) }));
}

/** Produits mis en avant : promotions « produit mis en avant » d'abord, puis produits vedettes. */
export async function featuredProducts(limit = 4): Promise<ProductView[]> {
  const [highlighted, featured] = await Promise.all([highlightedProductIds(), listProducts({ featured: true })]);
  const first = highlighted.length ? await listProducts({ ids: highlighted }) : [];
  const seen = new Set<string>();
  return [...first, ...featured].filter((p) => !seen.has(p.id) && seen.add(p.id) && p.orderable).slice(0, limit);
}
