import 'server-only';
/**
 * Cycle de vie des commandes. Prix, stock, créneaux et promotions sont recalculés ici,
 * côté serveur, dans une transaction (verrous sur le créneau et le stock).
 */
import { and, eq, isNull, lt, or, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { site } from '@/data/site';
import { getDb, schema as s, type Tx } from '@/lib/db';
import type { Order, OrderStatus } from '@/lib/db/schema';
import { paris } from '@/lib/dates';
import { env } from '@/lib/env';
import { formatDate, formatTime, money } from '@/lib/format';
import { mails, notifyStaff, sendEmail } from '@/lib/notify';
import { bestPromotion, OrderError, priceCart } from '@/lib/pricing';
import { logError, safeEqual, token } from '@/lib/security';
import { demoVisible, getSetting } from '@/lib/settings';
import { assertSlot } from '@/lib/slots';
import { createCheckout, stripe } from '@/lib/stripe';
import { orderInput, type OrderInput } from '@/lib/validation';

export { OrderError };

export const ORDERING_CLOSED = `La commande en ligne n’est pas ouverte pour le moment. Appelez la boutique au ${site.phone.display} ou passez nous voir.`;

/** Sans base de données permanente, aucune commande n'est acceptée (elle serait perdue). */
export async function assertOrderingOpen() {
  if (env.ephemeralDb) throw new OrderError(ORDERING_CLOSED);
  if (!(await getSetting('ordering')).enabled) throw new OrderError(ORDERING_CLOSED);
}

/* ---------- Numérotation : DUO-20261004-0042 / PERSO-20261004-0003 ---------- */
export async function nextNumber(tx: Tx, kind: 'order' | 'custom') {
  const day = paris().date.replace(/-/g, '');
  const key = `${kind}-${day}`;
  const [row] = await tx
    .insert(s.counters)
    .values({ key, value: 1 })
    .onConflictDoUpdate({ target: s.counters.key, set: { value: sql`${s.counters.value} + 1` } })
    .returning();
  return `${kind === 'order' ? site.orderPrefix : 'PERSO'}-${day}-${String(row!.value).padStart(4, '0')}`;
}

/* ---------- Clients : fiche créée ou mise à jour automatiquement ---------- */
export async function upsertCustomer(tx: Tx, c: { firstName: string; lastName: string; email: string; phone: string }, isDemo: boolean) {
  const [row] = await tx
    .insert(s.customers)
    .values({ ...c, isDemo })
    .onConflictDoUpdate({
      target: s.customers.email,
      // Une vraie commande rend la fiche réelle ; une commande d'exemple ne rend jamais une vraie fiche « exemple ».
      set: { firstName: c.firstName, lastName: c.lastName, phone: c.phone, isDemo: sql`${s.customers.isDemo} and excluded.is_demo`, updatedAt: new Date() },
    })
    .returning();
  return row!;
}

/* ---------- Stock ---------- */
async function moveStock(tx: Tx, productId: string, delta: number, reason: 'order' | 'cancel', orderId: string) {
  const [p] = await tx.select().from(s.products).where(eq(s.products.id, productId)).for('update');
  if (!p?.stockManaged) return null;
  const after = p.stock + delta;
  if (after < 0) throw new OrderError(p.stock > 0 ? `Plus que ${p.stock} « ${p.name} » disponible(s).` : `« ${p.name} » est épuisé.`);
  await tx.update(s.products).set({ stock: after, updatedAt: new Date() }).where(eq(s.products.id, productId));
  await tx.insert(s.stockMovements).values({ productId, delta, quantityAfter: after, reason, orderId });
  return { name: p.name, after, alert: p.stockAlert, isDemo: p.isDemo };
}

async function restoreStock(tx: Tx, orderId: string) {
  const items = await tx.select().from(s.orderItems).where(eq(s.orderItems.orderId, orderId));
  const qty = new Map<string, number>();
  for (const i of items) if (i.productId) qty.set(i.productId, (qty.get(i.productId) ?? 0) + i.quantity);
  for (const [productId, q] of qty) await moveStock(tx, productId, q, 'cancel', orderId);
}

/* ---------- Création ---------- */
export async function placeOrder(raw: OrderInput): Promise<{ redirect: string }> {
  await assertOrderingOpen();
  const input = orderInput.parse(raw);
  await releaseExpiredPayments();
  const [payments, hours, ordering, showDemo] = await Promise.all([getSetting('payments'), getSetting('hours'), getSetting('ordering'), demoVisible()]);
  if (input.paymentMethod === 'online' && (!payments.online || !stripe())) throw new OrderError('Le paiement en ligne est momentanément indisponible.');
  if (input.paymentMethod === 'on_site' && !payments.onSite) throw new OrderError('Le paiement en boutique n’est pas proposé.');

  const cart = await priceCart(input.items);
  const { promo } = await bestPromotion(cart, input.promoCode, true);
  const discount = promo?.discount ?? 0;
  const total = cart.subtotal - discount;
  if (input.paymentMethod === 'online' && total < 50) throw new OrderError('Montant minimum pour un paiement en ligne : 0,50 €.');

  const db = await getDb();
  const low: { name: string; after: number; isDemo: boolean }[] = [];
  const order = await db.transaction(async (tx) => {
    await assertSlot(tx, { hours, ordering, showDemo }, input.pickupDate, input.pickupTime, { leadHours: cart.leadHours, weekdays: cart.weekdays });

    if (promo) {
      const done = await tx
        .update(s.promotions)
        .set({ uses: sql`${s.promotions.uses} + 1` })
        .where(and(eq(s.promotions.id, promo.id), or(isNull(s.promotions.maxUses), lt(s.promotions.uses, s.promotions.maxUses))))
        .returning();
      if (!done.length) throw new OrderError('Cette promotion a atteint sa limite d’utilisation.');
    }

    const customer = await upsertCustomer(tx, input, cart.demo);
    const [o] = await tx
      .insert(s.orders)
      .values({
        number: await nextNumber(tx, 'order'),
        accessToken: token(),
        customerId: customer.id,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        pickupDate: input.pickupDate,
        pickupTime: input.pickupTime,
        subtotalCents: cart.subtotal,
        discountCents: discount,
        totalCents: total,
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentMethod === 'online' ? 'pending' : 'on_site',
        promotionId: promo?.id ?? null,
        promoLabel: promo?.label ?? null,
        customerNote: input.note,
        isDemo: cart.demo,
      })
      .returning();
    await tx.insert(s.orderItems).values(
      cart.lines.map((l) => ({
        orderId: o!.id,
        productId: l.product.id,
        variantId: l.variantId,
        categoryName: l.product.category?.name ?? null,
        name: l.product.name,
        variantLabel: l.variantLabel,
        options: l.options,
        unitPriceCents: l.unit,
        quantity: l.quantity,
        vatRate: 0,
      })),
    );
    // TVA figée au moment de la commande.
    await tx.execute(sql`update order_items oi set vat_rate = p.vat_rate from products p where oi.product_id = p.id and oi.order_id = ${o!.id}`);

    const qty = new Map<string, number>();
    for (const l of cart.lines) qty.set(l.product.id, (qty.get(l.product.id) ?? 0) + l.quantity);
    for (const [productId, q] of qty) {
      const m = await moveStock(tx, productId, -q, 'order', o!.id);
      if (m && m.after <= m.alert) low.push(m);
    }
    return o!;
  });

  revalidatePath('/commander');
  for (const m of low)
    await notifyStaff('stock.low', `Stock faible — ${m.name}`, m.after > 0 ? `Il reste ${m.after} pièce(s).` : 'Produit épuisé : il n’est plus proposé à la commande.', '/admin/stock', { isDemo: m.isDemo });

  const confirmation = `/commande?n=${encodeURIComponent(order.number)}&t=${order.accessToken}`;
  if (input.paymentMethod === 'on_site') {
    await afterOrderPlaced(order.id);
    return { redirect: confirmation };
  }

  try {
    const session = await createCheckout({
      label: `Commande ${order.number} — ${site.displayName}`,
      description: cart.lines.map((l) => `${l.quantity} × ${l.product.name}${l.variantLabel ? ' (' + l.variantLabel + ')' : ''}`).join(', '),
      amountCents: total,
      email: order.email,
      orderId: order.id,
      successPath: confirmation + '&paiement=ok',
      cancelPath: confirmation + '&paiement=annule',
    });
    await db.update(s.orders).set({ stripeSessionId: session.id }).where(eq(s.orders.id, order.id));
    return { redirect: session.url! };
  } catch (e) {
    logError('checkout', e);
    await cancelOrder(order.id, { silent: true });
    throw new OrderError('Le paiement n’a pas pu être initialisé. Aucun montant n’a été prélevé : merci de réessayer.');
  }
}

async function loadOrder(id: string) {
  const db = await getDb();
  const [o] = await db.select().from(s.orders).where(eq(s.orders.id, id));
  if (!o) return null;
  const items = await db.select().from(s.orderItems).where(eq(s.orderItems.orderId, id));
  return { order: o, items };
}

async function afterOrderPlaced(orderId: string) {
  const data = await loadOrder(orderId);
  if (!data) return;
  const { order, items } = data;
  await sendEmail(order.email, 'order.received', mails.orderReceived(order, items), { orderId, isDemo: order.isDemo });
  const notifyCfg = await getSetting('notify');
  const large = order.totalCents >= notifyCfg.largeOrderCents;
  await notifyStaff(
    large ? 'order.large' : 'order.new',
    `Nouvelle commande ${order.number}`,
    `${order.firstName} ${order.lastName} — ${money(order.totalCents)} — retrait ${formatDate(order.pickupDate, 'day')} à ${formatTime(order.pickupTime)}`,
    `/admin/commandes?ouvrir=${order.id}`,
    { orderId, isDemo: order.isDemo },
  );
}

/* ---------- Paiement en ligne ---------- */
/** Idempotent : appelé par le webhook Stripe comme par la page de retour. */
export async function onOrderPaid(orderId: string, sessionId: string, paymentIntent: string | null, amount: number) {
  const db = await getDb();
  const [o] = await db
    .update(s.orders)
    .set({ amountPaidCents: amount, paymentStatus: 'paid', stripeSessionId: sessionId, stripePaymentIntent: paymentIntent, updatedAt: new Date() })
    .where(and(eq(s.orders.id, orderId), sql`${s.orders.paymentStatus} <> 'paid'`))
    .returning();
  if (!o) return;
  if (o.status === 'cancelled') {
    // Paiement arrivé après expiration : la commande revient dans le circuit, l'équipe vérifie.
    await db.update(s.orders).set({ status: 'new', cancelledAt: null }).where(eq(s.orders.id, orderId));
    await notifyStaff('order.late_payment', `Paiement tardif — ${o.number}`, 'Commande annulée automatiquement puis payée : vérifier le créneau et le stock.', `/admin/commandes?ouvrir=${o.id}`, {
      orderId,
    });
  }
  await afterOrderPlaced(orderId);
}

/** Paiement abandonné ou expiré : créneau, stock et promotion libérés. */
export async function onCheckoutExpired(orderId: string) {
  const db = await getDb();
  const [o] = await db.select().from(s.orders).where(eq(s.orders.id, orderId));
  if (o && o.paymentMethod === 'online' && o.paymentStatus === 'pending') {
    await db.update(s.orders).set({ paymentStatus: 'failed' }).where(eq(s.orders.id, orderId));
    await cancelOrder(o.id, { silent: true });
  }
}

/** Libère les paiements en ligne abandonnés (> 45 min), même sans webhook. */
export async function releaseExpiredPayments() {
  try {
    const db = await getDb();
    const stale = await db
      .select({ id: s.orders.id })
      .from(s.orders)
      .where(
        and(
          eq(s.orders.paymentMethod, 'online'),
          eq(s.orders.paymentStatus, 'pending'),
          sql`${s.orders.status} <> 'cancelled'`,
          lt(s.orders.createdAt, new Date(Date.now() - 45 * 60 * 1000)),
        ),
      );
    for (const o of stale) await onCheckoutExpired(o.id);
  } catch (e) {
    logError('releaseExpired', e);
  }
}

/** Vérifie directement auprès de Stripe (retour de paiement, utile sans webhook). */
export async function reconcileOrderPayment(order: Order) {
  const st = stripe();
  if (!st || !order.stripeSessionId || order.paymentStatus === 'paid') return;
  try {
    const session = await st.checkout.sessions.retrieve(order.stripeSessionId);
    if (session.payment_status === 'paid')
      await onOrderPaid(order.id, session.id, typeof session.payment_intent === 'string' ? session.payment_intent : null, session.amount_total ?? order.totalCents);
  } catch (e) {
    logError('reconcile', e);
  }
}

/* ---------- Statuts (gestion) ---------- */
export async function cancelOrder(orderId: string, opts: { silent?: boolean } = {}) {
  const db = await getDb();
  const o = await db.transaction(async (tx) => {
    const [o] = await tx.select().from(s.orders).where(eq(s.orders.id, orderId)).for('update');
    if (!o || o.status === 'cancelled') return null;
    if (!o.stockReleased) await restoreStock(tx, o.id);
    if (o.promotionId) await tx.update(s.promotions).set({ uses: sql`greatest(${s.promotions.uses} - 1, 0)` }).where(eq(s.promotions.id, o.promotionId));
    const [u] = await tx
      .update(s.orders)
      .set({ status: 'cancelled', cancelledAt: new Date(), stockReleased: true, updatedAt: new Date() })
      .where(eq(s.orders.id, o.id))
      .returning();
    return u!;
  });
  revalidatePath('/commander');
  if (o && !opts.silent) await sendEmail(o.email, 'order.cancelled', mails.orderCancelled(o), { orderId, isDemo: o.isDemo });
  return o;
}

export async function setOrderStatus(orderId: string, status: OrderStatus) {
  if (status === 'cancelled') return cancelOrder(orderId);
  const db = await getDb();
  const now = new Date();
  const stamps: Partial<Order> =
    status === 'confirmed'
      ? { confirmedAt: now }
      : status === 'in_preparation'
        ? { startedAt: now }
        : status === 'ready'
          ? { readyAt: now }
          : status === 'collected'
            ? { collectedAt: now }
            : {};
  const [before] = await db.select({ status: s.orders.status }).from(s.orders).where(eq(s.orders.id, orderId));
  if (!before) return null;
  if (before.status === 'cancelled') throw new OrderError('Commande annulée : elle ne peut plus changer de statut.');
  const [o] = await db.update(s.orders).set({ status, ...stamps, updatedAt: now }).where(eq(s.orders.id, orderId)).returning();
  if (!o || before.status === status) return o;
  const cfg = await getSetting('notify');
  if (status === 'confirmed' && cfg.emailOnConfirmed) await sendEmail(o.email, 'order.confirmed', mails.orderConfirmed(o), { orderId, isDemo: o.isDemo });
  if (status === 'ready' && cfg.emailOnReady) await sendEmail(o.email, 'order.ready', mails.orderReady(o), { orderId, isDemo: o.isDemo });
  // Retrait d'une commande à régler en boutique : encaissement enregistré.
  if (status === 'collected' && o.paymentStatus === 'on_site') {
    await db.update(s.orders).set({ amountPaidCents: o.totalCents, paymentStatus: 'paid' }).where(eq(s.orders.id, orderId));
  }
  return o;
}

/** Commandes « réelles » : exclut les paiements en ligne non aboutis. */
export const visibleOrder = sql`not (${s.orders.paymentMethod} = 'online' and ${s.orders.paymentStatus} in ('pending','failed') and ${s.orders.amountPaidCents} = 0)`;

/** Accès client à sa commande : numéro + jeton secret. */
export async function findOrderForCustomer(number: string, secret: string) {
  if (!number || !secret || number.length > 40 || secret.length > 64) return null;
  const db = await getDb();
  const [o] = await db.select().from(s.orders).where(eq(s.orders.number, number.trim()));
  if (!o || !safeEqual(secret, o.accessToken)) return null;
  const items = await db.select().from(s.orderItems).where(eq(s.orderItems.orderId, o.id));
  return { order: o, items };
}

/** Annulation par le client au retour d'un paiement abandonné (libère tout de suite le créneau). */
export async function cancelUnpaid(order: Order) {
  if (order.paymentMethod === 'online' && order.paymentStatus === 'pending' && order.status !== 'cancelled') await onCheckoutExpired(order.id);
}

