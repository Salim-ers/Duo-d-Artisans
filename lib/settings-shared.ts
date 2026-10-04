/**
 * Paramètres administrables (table `settings`) — types, valeurs par défaut et validation.
 * Aucun import serveur ici : utilisable côté client comme côté serveur.
 *
 * Une clé absente de la base retombe sur sa valeur par défaut ; la gestion signale alors
 * « valeurs par défaut, à confirmer » tant que la boutique ne les a pas enregistrées.
 */
import { z } from 'zod';
import { defaultWeek } from '@/data/opening-hours';
import { googleReviews } from '@/data/reviews';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure au format HH:MM');
export const intervalSchema = z.object({ open: time, close: time }).refine((r) => r.open < r.close, 'L’heure de fermeture doit suivre l’ouverture');
export type Interval = z.infer<typeof intervalSchema>;

/** Horaires d'ouverture publics (0 = dimanche … 6 = samedi ; tableau vide = fermé). */
export const hoursSchema = z.object({ week: z.array(z.array(intervalSchema).max(3)).length(7) });
export type HoursSettings = z.infer<typeof hoursSchema>;

/** Commande en ligne et créneaux de retrait. */
export const orderingSchema = z.object({
  enabled: z.boolean(),
  /** Jours où le retrait est proposé (0 = dimanche … 6 = samedi). */
  pickupDays: z.array(z.boolean()).length(7),
  slotMinutes: z.number().int().min(10).max(120),
  /** Nombre maximum de commandes par créneau. */
  slotCapacity: z.number().int().min(1).max(200),
  /** Délai minimal entre la commande et le retrait. */
  minLeadMinutes: z.number().int().min(0).max(60 * 24 * 14),
  maxDaysAhead: z.number().int().min(1).max(90),
  firstPickupAfterOpenMinutes: z.number().int().min(0).max(240),
  lastPickupBeforeCloseMinutes: z.number().int().min(0).max(240),
  /** Affiché sur la confirmation de commande. */
  instructions: z.string().max(400),
});
export type OrderingSettings = z.infer<typeof orderingSchema>;

export const paymentSchema = z.object({ online: z.boolean(), onSite: z.boolean() });
export type PaymentSettings = z.infer<typeof paymentSchema>;

export const customSchema = z.object({
  types: z.array(z.string().min(1).max(60)).min(1).max(12),
  /** Nombre de jours minimum entre la demande et la date souhaitée. */
  minDaysNotice: z.number().int().min(0).max(90),
});
export type CustomSettings = z.infer<typeof customSchema>;

/** Avis Google : uniquement des chiffres relevés sur la fiche réelle (aucun avis rédigé). */
export const reviewsSchema = z.object({
  rating: z.number().min(1).max(5).nullable(),
  count: z.number().int().min(0).nullable(),
  checkedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  url: z.string().url().nullable(),
});
export type ReviewsSettings = z.infer<typeof reviewsSchema>;

export const notifySchema = z.object({
  staffEmail: z.string().email().nullable(),
  emailOnConfirmed: z.boolean(),
  emailOnReady: z.boolean(),
  /** Signal sonore à l'arrivée d'une commande : jamais en boucle. */
  sound: z.enum(['off', 'all', 'large']),
  largeOrderCents: z.number().int().min(0).max(10_000_00),
});
export type NotifySettings = z.infer<typeof notifySchema>;

/**
 * DONNÉES RÉELLES / DONNÉES DE DÉMONSTRATION.
 * Les produits, commandes, demandes et messages marqués `is_demo` ne sont visibles que si `demo` est activé.
 */
export const catalogSchema = z.object({ demo: z.boolean() });
export type CatalogSettings = z.infer<typeof catalogSchema>;

export const defaultSettings = {
  hours: { week: defaultWeek } satisfies HoursSettings,
  ordering: {
    enabled: true,
    pickupDays: [true, false, true, true, true, true, true],
    slotMinutes: 30,
    slotCapacity: 6,
    minLeadMinutes: 120,
    maxDaysAhead: 14,
    firstPickupAfterOpenMinutes: 60,
    lastPickupBeforeCloseMinutes: 30,
    instructions: 'Présentez votre numéro de commande au comptoir.',
  } satisfies OrderingSettings,
  payments: { online: true, onSite: true } satisfies PaymentSettings,
  custom: {
    types: ['Anniversaire', 'Number cake', 'Entremets', 'Événement', 'Dessert à partager', 'Autre'],
    minDaysNotice: 1,
  } satisfies CustomSettings,
  reviews: {
    rating: googleReviews.rating,
    count: googleReviews.count,
    checkedOn: googleReviews.checkedOn,
    url: null,
  } satisfies ReviewsSettings,
  notify: { staffEmail: null, emailOnConfirmed: true, emailOnReady: true, sound: 'all', largeOrderCents: 5000 } satisfies NotifySettings,
  catalog: { demo: true } satisfies CatalogSettings,
};

export type SettingsMap = {
  hours: HoursSettings;
  ordering: OrderingSettings;
  payments: PaymentSettings;
  custom: CustomSettings;
  reviews: ReviewsSettings;
  notify: NotifySettings;
  catalog: CatalogSettings;
};
export type SettingsKey = keyof SettingsMap;

export const settingsSchemas: { [K in SettingsKey]: z.ZodType<SettingsMap[K], z.ZodTypeDef, unknown> } = {
  hours: hoursSchema,
  ordering: orderingSchema,
  payments: paymentSchema,
  custom: customSchema,
  reviews: reviewsSchema,
  notify: notifySchema,
  catalog: catalogSchema,
};
