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
  /** Carillon court à l'arrivée d'une demande ou d'un message : jamais en boucle. */
  sound: z.boolean(),
});
export type NotifySettings = z.infer<typeof notifySchema>;

/**
 * DONNÉES RÉELLES / DONNÉES DE DÉMONSTRATION.
 * Les demandes, clients et messages marqués `is_demo` ne sont visibles que si `demo` est activé.
 */
export const catalogSchema = z.object({ demo: z.boolean() });
export type CatalogSettings = z.infer<typeof catalogSchema>;

export const defaultSettings = {
  hours: { week: defaultWeek } satisfies HoursSettings,
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
  notify: { staffEmail: null, sound: true } satisfies NotifySettings,
  catalog: { demo: true } satisfies CatalogSettings,
};

export type SettingsMap = {
  hours: HoursSettings;
  custom: CustomSettings;
  reviews: ReviewsSettings;
  notify: NotifySettings;
  catalog: CatalogSettings;
};
export type SettingsKey = keyof SettingsMap;

export const settingsSchemas: { [K in SettingsKey]: z.ZodType<SettingsMap[K], z.ZodTypeDef, unknown> } = {
  hours: hoursSchema,
  custom: customSchema,
  reviews: reviewsSchema,
  notify: notifySchema,
  catalog: catalogSchema,
};
