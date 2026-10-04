import 'server-only';
/** Lecture du catalogue : produits, formats, options, stock, disponibilité. */
import { and, asc, eq, inArray, isNull, or } from 'drizzle-orm';
import { getDb, schema as s } from '@/lib/db';
import type { Category, Product } from '@/lib/db/schema';
import { demoVisible } from '@/lib/settings';

export type VariantView = { id: string; label: string; servings: number | null; priceCents: number };
export type OptionView = { id: string; label: string; priceDeltaCents: number };

export type ProductView = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  priceCents: number;
  /** Plusieurs formats à des prix différents : « à partir de ». */
  fromPrice: boolean;
  allergens: string[];
  category: { id: string; slug: string; name: string } | null;
  variants: VariantView[];
  flavors: OptionView[];
  extras: OptionView[];
  featured: boolean;
  leadTimeHours: number;
  /** Jours de retrait possibles (vide = tous). */
  availableDays: number[];
  /** null = disponibilité illimitée. */
  stock: number | null;
  stockAlert: number;
  maxPerOrder: number;
  orderable: boolean;
  /** Raison d'indisponibilité affichée (« Épuisé », « En boutique uniquement »). */
  unavailable: string | null;
  /** Donnée d'exemple : toujours signalée comme telle, jamais présentée comme une vraie offre. */
  demo: boolean;
  position: number;
};

export async function listCategories(activeOnly = true): Promise<Category[]> {
  const db = await getDb();
  return db
    .select()
    .from(s.categories)
    .where(activeOnly ? eq(s.categories.active, true) : undefined)
    .orderBy(asc(s.categories.position), asc(s.categories.name));
}

type Filter = { ids?: string[]; featured?: boolean; categoryId?: string };

/** Produits visibles, enrichis de leurs formats, options et disponibilité. */
export async function listProducts(f: Filter = {}): Promise<ProductView[]> {
  if (f.ids && !f.ids.length) return [];
  const db = await getDb();
  const showDemo = await demoVisible();
  const rows = await db
    .select({ p: s.products, c: s.categories })
    .from(s.products)
    .leftJoin(s.categories, eq(s.products.categoryId, s.categories.id))
    .where(
      and(
        eq(s.products.active, true),
        or(isNull(s.products.categoryId), eq(s.categories.active, true)),
        showDemo ? undefined : eq(s.products.isDemo, false),
        f.ids ? inArray(s.products.id, f.ids) : undefined,
        f.featured ? eq(s.products.featured, true) : undefined,
        f.categoryId ? eq(s.products.categoryId, f.categoryId) : undefined,
      ),
    )
    .orderBy(asc(s.categories.position), asc(s.products.position), asc(s.products.name));
  if (!rows.length) return [];

  const ids = rows.map((r) => r.p.id);
  const [variants, options] = await Promise.all([
    db
      .select()
      .from(s.productVariants)
      .where(and(inArray(s.productVariants.productId, ids), eq(s.productVariants.active, true)))
      .orderBy(asc(s.productVariants.position)),
    db
      .select()
      .from(s.productOptions)
      .where(and(inArray(s.productOptions.productId, ids), eq(s.productOptions.active, true)))
      .orderBy(asc(s.productOptions.position)),
  ]);
  return rows.map(({ p, c }) => toView(p, c, variants, options));
}

function toView(p: Product, c: Category | null, variants: (typeof s.productVariants.$inferSelect)[], options: (typeof s.productOptions.$inferSelect)[]): ProductView {
  const vs = variants.filter((v) => v.productId === p.id).map((v) => ({ id: v.id, label: v.label, servings: v.servings, priceCents: v.priceCents }));
  const own = options.filter((o) => o.productId === p.id);
  const opt = (kind: 'flavor' | 'extra') => own.filter((o) => o.kind === kind).map((o) => ({ id: o.id, label: o.label, priceDeltaCents: o.priceDeltaCents }));
  const stock = p.stockManaged ? Math.max(0, p.stock) : null;

  let unavailable: string | null = null;
  if (!p.orderable) unavailable = 'En boutique uniquement';
  else if (stock === 0) unavailable = 'Épuisé';

  const prices = vs.length ? vs.map((v) => v.priceCents) : [p.priceCents];
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    image: p.image,
    priceCents: Math.min(...prices),
    fromPrice: new Set(prices).size > 1,
    allergens: p.allergens,
    category: c ? { id: c.id, slug: c.slug, name: c.name } : null,
    variants: vs,
    flavors: opt('flavor'),
    extras: opt('extra'),
    featured: p.featured,
    leadTimeHours: p.leadTimeHours,
    availableDays: p.availableDays,
    stock,
    stockAlert: p.stockAlert,
    maxPerOrder: Math.max(1, stock === null ? p.maxPerOrder : Math.min(p.maxPerOrder, stock || 1)),
    orderable: unavailable === null,
    unavailable,
    demo: p.isDemo,
    position: p.position,
  };
}

/** Catalogue public : familles qui contiennent au moins un produit visible. */
export async function publicCatalog() {
  const [categories, products] = await Promise.all([listCategories(true), listProducts()]);
  const used = new Set(products.map((p) => p.category?.id));
  return { categories: categories.filter((c) => used.has(c.id)), products };
}
