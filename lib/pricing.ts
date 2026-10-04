import 'server-only';
/**
 * Prix du panier, recalculés côté serveur à partir de la base (jamais à partir du navigateur),
 * et promotions (code, remise automatique, produit mis en avant).
 */
import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb, schema as s } from '@/lib/db';
import type { Promotion } from '@/lib/db/schema';
import { listProducts, type ProductView } from '@/lib/catalog';
import { money } from '@/lib/format';
import type { CartLineInput } from '@/lib/validation';

export class OrderError extends Error {}

export type PricedLine = {
  product: ProductView;
  variantId: string | null;
  variantLabel: string | null;
  options: string | null;
  unit: number;
  quantity: number;
};

export type AppliedPromo = { id: string; label: string; kind: 'code' | 'auto'; discount: number };

/** Promotion utilisable maintenant (période, activation, quota). */
export const promoLive = (p: Promotion, now = new Date()) =>
  p.active && (!p.startsAt || p.startsAt <= now) && (!p.endsAt || p.endsAt >= now) && (p.maxUses === null || p.uses < p.maxUses);

function discountOf(p: Promotion, lines: PricedLine[]) {
  const scoped = lines.filter((l) => (p.productId ? l.product.id === p.productId : p.categoryId ? l.product.category?.id === p.categoryId : true));
  const base = scoped.reduce((t, l) => t + l.unit * l.quantity, 0);
  if (!base) return 0;
  return p.type === 'percent' ? Math.round((base * Math.min(100, p.value)) / 100) : Math.min(base, p.value);
}

export async function priceCart(input: CartLineInput[]) {
  const products = await listProducts({ ids: [...new Set(input.map((l) => l.productId))] });
  const lines: PricedLine[] = [];
  const perProduct = new Map<string, number>();
  for (const l of input) {
    const p = products.find((x) => x.id === l.productId);
    if (!p) throw new OrderError('Un produit de votre panier n’est plus proposé. Merci de mettre à jour votre panier.');
    if (!p.orderable) throw new OrderError(`« ${p.name} » : ${p.unavailable?.toLowerCase() ?? 'indisponible'}.`);

    let unit = p.priceCents;
    let variantLabel: string | null = null;
    if (p.variants.length) {
      const v = p.variants.find((x) => x.id === l.variantId);
      if (!v) throw new OrderError(`Merci de choisir un format pour « ${p.name} ».`);
      unit = v.priceCents;
      variantLabel = v.label;
    } else if (l.variantId) throw new OrderError(`Format inconnu pour « ${p.name} ».`);

    const parts: string[] = [];
    if (p.flavors.length) {
      const f = p.flavors.find((x) => x.id === l.flavorId);
      if (!f) throw new OrderError(`Merci de choisir une saveur pour « ${p.name} ».`);
      parts.push(f.label);
    } else if (l.flavorId) throw new OrderError(`Saveur inconnue pour « ${p.name} ».`);
    for (const id of new Set(l.extraIds)) {
      const e = p.extras.find((x) => x.id === id);
      if (!e) throw new OrderError(`Supplément inconnu pour « ${p.name} ».`);
      unit += e.priceDeltaCents;
      parts.push('+ ' + e.label);
    }

    const total = (perProduct.get(p.id) ?? 0) + l.quantity;
    perProduct.set(p.id, total);
    if (total > p.maxPerOrder) throw new OrderError(`« ${p.name} » : ${p.maxPerOrder} maximum par commande.`);
    if (p.stock !== null && total > p.stock) throw new OrderError(p.stock > 0 ? `Plus que ${p.stock} « ${p.name} » disponible(s).` : `« ${p.name} » est épuisé.`);

    lines.push({ product: p, variantId: p.variants.length ? l.variantId : null, variantLabel, options: parts.join(', ') || null, unit, quantity: l.quantity });
  }

  const subtotal = lines.reduce((t, l) => t + l.unit * l.quantity, 0);
  const leadHours = Math.max(0, ...lines.map((l) => l.product.leadTimeHours));
  // Jours de retrait communs à tous les produits restreints.
  const restricted = lines.map((l) => l.product.availableDays).filter((d) => d.length);
  const weekdays = restricted.length ? [0, 1, 2, 3, 4, 5, 6].filter((d) => restricted.every((r) => r.includes(d))) : null;
  if (weekdays && !weekdays.length) throw new OrderError('Ces produits ne sont pas proposés le même jour : merci de passer deux commandes.');
  return { lines, subtotal, leadHours, weekdays, demo: lines.some((l) => l.product.demo) };
}

export type PricedCart = Awaited<ReturnType<typeof priceCart>>;

/**
 * Meilleure remise applicable : le code saisi (s'il est valable) ou une remise automatique.
 * Les remises ne se cumulent pas. `strict` : un code invalide lève une erreur (validation de commande).
 */
export async function bestPromotion(cart: PricedCart, code: string | null, strict: boolean): Promise<{ promo: AppliedPromo | null; codeError: string | null }> {
  const db = await getDb();
  const now = new Date();
  let codeError: string | null = null;
  const candidates: { p: Promotion; kind: 'code' | 'auto' }[] = [];

  if (code) {
    const [p] = await db.select().from(s.promotions).where(and(eq(s.promotions.kind, 'code'), sql`upper(${s.promotions.code}) = ${code.trim().toUpperCase()}`));
    if (!p || !p.active) codeError = 'Code promo inconnu.';
    else if (!promoLive(p, now)) codeError = 'Ce code promo n’est pas valable actuellement.';
    else if (cart.subtotal < p.minSubtotalCents) codeError = `Ce code est valable dès ${money(p.minSubtotalCents)} d’achat.`;
    else if (!discountOf(p, cart.lines)) codeError = 'Ce code ne s’applique à aucun produit de votre panier.';
    else candidates.push({ p, kind: 'code' });
    if (codeError && strict) throw new OrderError(codeError);
  }

  const autos = await db.select().from(s.promotions).where(and(eq(s.promotions.kind, 'auto'), eq(s.promotions.active, true))).orderBy(desc(s.promotions.createdAt));
  for (const p of autos) if (promoLive(p, now) && cart.subtotal >= p.minSubtotalCents) candidates.push({ p, kind: 'auto' });

  let best: AppliedPromo | null = null;
  for (const c of candidates) {
    const discount = discountOf(c.p, cart.lines);
    if (discount > 0 && (!best || discount > best.discount)) best = { id: c.p.id, label: c.p.label, kind: c.kind, discount };
  }
  return { promo: best, codeError };
}

/** Produits mis en avant pendant une période (promotions « highlight »). */
export async function highlightedProductIds() {
  const db = await getDb();
  const rows = await db.select().from(s.promotions).where(and(eq(s.promotions.kind, 'highlight'), eq(s.promotions.active, true)));
  return rows.filter((p) => promoLive(p) && p.productId).map((p) => p.productId!);
}
