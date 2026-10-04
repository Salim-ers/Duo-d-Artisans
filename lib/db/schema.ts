/**
 * Schéma de la base (PostgreSQL — Neon en production, PGlite en local).
 * Montants en centimes, TVA en points de base (550 = 5,5 %).
 * Dates de retrait en "YYYY-MM-DD" + heure "HH:MM", heure de Paris.
 *
 * Toute donnée d'exemple porte `is_demo = true` : elle n'est visible (site et gestion)
 * que lorsque le mode démonstration est activé dans Gestion → Paramètres.
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

const id = () => uuid('id').primaryKey().defaultRandom();
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();
const isDemo = () => boolean('is_demo').notNull().default(false);

export const roleEnum = pgEnum('role', ['SUPER_ADMIN', 'ADMIN', 'STAFF']);
export const orderStatusEnum = pgEnum('order_status', [
  'new',
  'confirmed',
  'to_prepare',
  'in_preparation',
  'ready',
  'collected',
  'cancelled',
]);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'on_site', 'refunded', 'failed']);
export const customStatusEnum = pgEnum('custom_status', [
  'new_request',
  'reviewing',
  'quote_sent',
  'accepted',
  'refused',
  'in_preparation',
  'ready',
  'collected',
]);

/* ---------- Équipe (administrateurs) ---------- */
export const users = pgTable('users', {
  id: id(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull().default('STAFF'),
  active: boolean('active').notNull().default(true),
  /** Incrémenté pour invalider toutes les sessions d'un utilisateur. */
  tokenVersion: integer('token_version').notNull().default(0),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: createdAt(),
});

/* ---------- Clients : créés automatiquement à la première commande ou demande ---------- */
export const customers = pgTable('customers', {
  id: id(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  isDemo: isDemo(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* ---------- Catalogue ---------- */
export const categories = pgTable('categories', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  tagline: text('tagline'),
  /** Chemin d'une photo du site (/images/…) ou d'une image envoyée (/api/img/…). */
  image: text('image'),
  position: integer('position').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: createdAt(),
});

export const products = pgTable(
  'products',
  {
    id: id(),
    slug: text('slug').notNull().unique(),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    description: text('description'),
    image: text('image'),
    priceCents: integer('price_cents').notNull(),
    vatRate: integer('vat_rate').notNull().default(550),
    allergens: jsonb('allergens').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    /** Visible sur le site. */
    active: boolean('active').notNull().default(true),
    /** Peut être ajouté au panier (sinon : présenté, « en boutique uniquement »). */
    orderable: boolean('orderable').notNull().default(true),
    featured: boolean('featured').notNull().default(false),
    position: integer('position').notNull().default(0),
    /** Délai minimal de préparation avant retrait. */
    leadTimeHours: integer('lead_time_hours').notNull().default(0),
    /** Jours de retrait possibles (0 = dimanche … 6 = samedi). Vide = tous les jours d'ouverture. */
    availableDays: jsonb('available_days').$type<number[]>().notNull().default(sql`'[]'::jsonb`),
    /** Stock géré : sinon disponibilité illimitée (fabrication à la demande). */
    stockManaged: boolean('stock_managed').notNull().default(false),
    stock: integer('stock').notNull().default(0),
    stockAlert: integer('stock_alert').notNull().default(0),
    maxPerOrder: integer('max_per_order').notNull().default(20),
    isDemo: isDemo(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('products_category_idx').on(t.categoryId)],
);

/** Formats exclusifs d'un produit (taille, nombre de personnes) — chacun avec son prix. */
export const productVariants = pgTable(
  'product_variants',
  {
    id: id(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    servings: integer('servings'),
    priceCents: integer('price_cents').notNull(),
    position: integer('position').notNull().default(0),
    active: boolean('active').notNull().default(true),
  },
  (t) => [index('variants_product_idx').on(t.productId)],
);

/**
 * Options d'un produit :
 * - `flavor` : saveur, un seul choix (obligatoire si au moins une saveur existe) ;
 * - `extra`  : supplément facultatif, plusieurs possibles, avec supplément de prix.
 */
export const productOptions = pgTable(
  'product_options',
  {
    id: id(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    kind: text('kind').$type<'flavor' | 'extra'>().notNull(),
    label: text('label').notNull(),
    priceDeltaCents: integer('price_delta_cents').notNull().default(0),
    position: integer('position').notNull().default(0),
    active: boolean('active').notNull().default(true),
  },
  (t) => [index('options_product_idx').on(t.productId)],
);

/** Historique des mouvements de stock (commande, annulation, ajustement manuel). */
export const stockMovements = pgTable(
  'stock_movements',
  {
    id: id(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    delta: integer('delta').notNull(),
    quantityAfter: integer('quantity_after').notNull(),
    reason: text('reason').$type<'order' | 'cancel' | 'manual' | 'restock'>().notNull(),
    orderId: uuid('order_id'),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [index('stock_movements_product_idx').on(t.productId, t.createdAt)],
);

/* ---------- Événements / collections saisonnières ---------- */
export const events = pgTable('events', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  /** Modèle d'origine : noel, paques, epiphanie, saint-valentin, fete-des-meres, custom. */
  kind: text('kind').notNull().default('custom'),
  headline: text('headline'),
  text: text('text'),
  image: text('image'),
  /** Fenêtre d'affichage automatique sur l'accueil (incluse). */
  startsOn: date('starts_on'),
  endsOn: date('ends_on'),
  published: boolean('published').notNull().default(false),
  ctaLabel: text('cta_label'),
  position: integer('position').notNull().default(0),
  isDemo: isDemo(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const eventProducts = pgTable(
  'event_products',
  {
    eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.productId] })],
);

/* ---------- Promotions ---------- */
export const promotions = pgTable('promotions', {
  id: id(),
  /**
   * code      : code promotionnel saisi au panier ;
   * auto      : remise appliquée automatiquement si les conditions sont remplies ;
   * highlight : produit mis en avant sur l'accueil pendant la période (sans remise).
   */
  kind: text('kind').$type<'code' | 'auto' | 'highlight'>().notNull(),
  label: text('label').notNull(),
  code: text('code').unique(),
  type: text('type').$type<'percent' | 'amount'>().notNull().default('percent'),
  value: integer('value').notNull().default(0),
  minSubtotalCents: integer('min_subtotal_cents').notNull().default(0),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  maxUses: integer('max_uses'),
  uses: integer('uses').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: createdAt(),
});

/* ---------- Commandes (retrait en boutique) ---------- */
export const orders = pgTable(
  'orders',
  {
    id: id(),
    /** DUO-20261004-0042 */
    number: text('number').notNull().unique(),
    /** Jeton non devinable : le client consulte sa commande sans compte. */
    accessToken: text('access_token').notNull(),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    status: orderStatusEnum('status').notNull().default('new'),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    pickupDate: date('pickup_date').notNull(),
    pickupTime: text('pickup_time').notNull(),
    subtotalCents: integer('subtotal_cents').notNull(),
    discountCents: integer('discount_cents').notNull().default(0),
    totalCents: integer('total_cents').notNull(),
    amountPaidCents: integer('amount_paid_cents').notNull().default(0),
    paymentMethod: text('payment_method').$type<'online' | 'on_site'>().notNull(),
    paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
    stripeSessionId: text('stripe_session_id'),
    stripePaymentIntent: text('stripe_payment_intent'),
    promotionId: uuid('promotion_id').references(() => promotions.id, { onDelete: 'set null' }),
    promoLabel: text('promo_label'),
    customerNote: text('customer_note'),
    internalNote: text('internal_note'),
    stockReleased: boolean('stock_released').notNull().default(false),
    isDemo: isDemo(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    readyAt: timestamp('ready_at', { withTimezone: true }),
    collectedAt: timestamp('collected_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  },
  (t) => [
    index('orders_pickup_idx').on(t.pickupDate, t.pickupTime),
    index('orders_customer_idx').on(t.customerId),
    index('orders_created_idx').on(t.createdAt),
    index('orders_status_idx').on(t.status),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: id(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
    categoryName: text('category_name'),
    name: text('name').notNull(),
    variantLabel: text('variant_label'),
    /** Saveur et suppléments choisis, figés au moment de la commande. */
    options: text('options'),
    unitPriceCents: integer('unit_price_cents').notNull(),
    quantity: integer('quantity').notNull(),
    vatRate: integer('vat_rate').notNull(),
  },
  (t) => [index('order_items_order_idx').on(t.orderId), index('order_items_product_idx').on(t.productId)],
);

/* ---------- Créneaux : exceptions au planning généré depuis les horaires ---------- */
export const pickupSlots = pgTable(
  'pickup_slots',
  {
    id: id(),
    date: date('date').notNull(),
    /** null = journée entière. */
    time: text('time'),
    /** Fermeture (journée ou créneau). */
    closed: boolean('closed').notNull().default(false),
    /** Capacité spécifique (journée ou créneau). */
    capacity: integer('capacity'),
    /** Horaires exceptionnels pour la journée (ouverture spéciale, horaires réduits). */
    opens: text('opens'),
    closes: text('closes'),
    /** Affiché aux clients (ex. « Fermeture exceptionnelle »). */
    note: text('note'),
    createdAt: createdAt(),
  },
  (t) => [index('pickup_slots_date_idx').on(t.date)],
);

/* ---------- Commandes personnalisées : des DEMANDES, jamais acceptées d'office ---------- */
export const customOrders = pgTable(
  'custom_orders',
  {
    id: id(),
    number: text('number').notNull().unique(),
    accessToken: text('access_token').notNull(),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    status: customStatusEnum('status').notNull().default('new_request'),
    type: text('type').notNull(),
    desiredDate: date('desired_date').notNull(),
    pickupTime: text('pickup_time'),
    servings: integer('servings').notNull(),
    flavors: text('flavors'),
    theme: text('theme'),
    inscription: text('inscription'),
    budget: text('budget'),
    comment: text('comment'),
    /** Références d'images privées (db:<uuid>), lisibles uniquement par l'équipe. */
    images: jsonb('images').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    quoteCents: integer('quote_cents'),
    quoteMessage: text('quote_message'),
    internalNote: text('internal_note'),
    isDemo: isDemo(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('custom_orders_date_idx').on(t.desiredDate), index('custom_orders_status_idx').on(t.status)],
);

/* ---------- Notifications (tableau de bord, e-mail, push, SMS) ---------- */
export const notifications = pgTable(
  'notifications',
  {
    id: id(),
    channel: text('channel').$type<'dashboard' | 'email' | 'push' | 'sms'>().notNull(),
    audience: text('audience').$type<'customer' | 'staff'>().notNull(),
    type: text('type').notNull(),
    recipient: text('recipient'),
    subject: text('subject'),
    body: text('body'),
    href: text('href'),
    status: text('status').$type<'queued' | 'sent' | 'failed' | 'skipped'>().notNull().default('sent'),
    error: text('error'),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
    customOrderId: uuid('custom_order_id').references(() => customOrders.id, { onDelete: 'cascade' }),
    isDemo: isDemo(),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index('notifications_created_idx').on(t.createdAt)],
);

/* ---------- Messages du formulaire de contact ---------- */
export const messages = pgTable('messages', {
  id: id(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  body: text('body').notNull(),
  read: boolean('read').notNull().default(false),
  isDemo: isDemo(),
  createdAt: createdAt(),
});

/* ---------- Galerie publique ---------- */
export const gallery = pgTable('gallery', {
  id: id(),
  src: text('src').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  alt: text('alt').notNull(),
  title: text('title'),
  description: text('description'),
  /** pain, viennoiserie, patisserie, sale, gateaux, boutique */
  category: text('category').notNull().default('boutique'),
  showOnHome: boolean('show_on_home').notNull().default(false),
  position: integer('position').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: createdAt(),
});

/* ---------- Divers ---------- */
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: updatedAt(),
});

/** Images stockées directement en base (aucun service de stockage externe nécessaire). */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => 'bytea' });

export const files = pgTable('files', {
  id: id(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  width: integer('width'),
  height: integer('height'),
  /** Public : produits, galerie, catégories. Privé : photos d'inspiration envoyées par les clients. */
  isPublic: boolean('is_public').notNull().default(true),
  data: bytea('data').notNull(),
  createdAt: createdAt(),
});

export const counters = pgTable('counters', {
  key: text('key').primaryKey(),
  value: integer('value').notNull().default(0),
});

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: id(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: createdAt(),
});

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: id(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entity: text('entity'),
    entityId: text('entity_id'),
    data: jsonb('data'),
    createdAt: createdAt(),
  },
  (t) => [index('audit_created_idx').on(t.createdAt)],
);

export type User = typeof users.$inferSelect;
export type Role = User['role'];
export type Customer = typeof customers.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type ProductOption = typeof productOptions.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderStatus = Order['status'];
export type PaymentStatus = Order['paymentStatus'];
export type CustomOrder = typeof customOrders.$inferSelect;
export type CustomStatus = CustomOrder['status'];
export type Event = typeof events.$inferSelect;
export type Promotion = typeof promotions.$inferSelect;
export type GalleryItem = typeof gallery.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type PickupException = typeof pickupSlots.$inferSelect;
