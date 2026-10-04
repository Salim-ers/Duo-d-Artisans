/**
 * Schéma de la base (PostgreSQL — Neon en production, PGlite en local).
 * Montants en centimes. Dates en "YYYY-MM-DD" + heure "HH:MM", heure de Paris.
 * Le site ne vend rien en ligne : il reçoit des DEMANDES de gâteaux sur mesure.
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
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

const id = () => uuid('id').primaryKey().defaultRandom();
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();
const isDemo = () => boolean('is_demo').notNull().default(false);

export const roleEnum = pgEnum('role', ['SUPER_ADMIN', 'ADMIN', 'STAFF']);
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

/* ---------- Clients : créés automatiquement à la première demande ---------- */
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

/* ---------- Calendrier : fermetures et horaires exceptionnels (une ligne par journée) ---------- */
export const pickupSlots = pgTable(
  'pickup_slots',
  {
    id: id(),
    date: date('date').notNull(),
    /** Boutique fermée toute la journée. */
    closed: boolean('closed').notNull().default(false),
    /** Sinon : horaires exceptionnels (ouverture spéciale, horaires réduits). */
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
export type CustomOrder = typeof customOrders.$inferSelect;
export type CustomStatus = CustomOrder['status'];
export type GalleryItem = typeof gallery.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Message = typeof messages.$inferSelect;
