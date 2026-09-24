import { z } from 'zod';
import { parisToday } from './dates';
import { occasions, creationTypes, subjects, LIMITS } from './form-options';

/**
 * Schémas de validation SERVEUR (source de vérité).
 * Le navigateur ne fait que des contrôles de confort (attributs HTML) :
 * toute donnée est revalidée ici avant d'être envoyée par e-mail.
 */

/** Supprime caractères de contrôle et espaces superflus (conserve les retours à la ligne). */
const clean = (value: string) =>
  value
    .normalize('NFC')
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F\u200B-\u200F\u2028\u2029]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const text = (max: number) => z.string().max(max * 2).transform(clean).pipe(z.string().max(max));

const name = (label: string) =>
  text(LIMITS.name).pipe(
    z
      .string()
      .min(1, `Indiquez votre ${label}.`)
      .regex(/^[\p{L}\p{M}' ’.-]+(?: [\p{L}\p{M}' ’.-]+)*$/u, `Votre ${label} contient des caractères inattendus.`),
  );

const phone = z
  .string()
  .max(40)
  .transform((v) => v.replace(/[\s.\-()]/g, ''))
  .pipe(z.string().regex(/^(?:\+|00)?\d{9,15}$/, 'Numéro de téléphone invalide.'));

const email = z.string().max(254).trim().toLowerCase().pipe(z.string().email('Adresse e-mail invalide.'));
const optionalEmail = z.union([z.literal(''), email]).optional().transform((v) => v || undefined);

const futureDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choisissez une date.')
  .refine((d) => !Number.isNaN(Date.parse(d)), 'Date invalide.')
  .refine((d) => d >= parisToday(), 'La date doit être à venir.')
  .refine((d) => Date.parse(d) - Date.parse(parisToday()) <= 366 * 86_400_000, 'Date trop éloignée.');

/** Champ piège : invisible pour un humain, rempli par les robots. */
const honeypot = z.string().max(500).optional();

export const orderSchema = z.object({
  occasion: z.enum(occasions, { message: 'Choisissez une occasion.' }),
  personnes: z.coerce
    .number({ message: 'Indiquez un nombre de personnes.' })
    .int('Nombre entier attendu.')
    .min(1, 'Au moins 1 personne.')
    .max(LIMITS.people, 'Au-delà de 300 personnes, appelez la boutique.'),
  date: futureDate,
  creation: z.enum(creationTypes, { message: 'Choisissez un type de création.' }),
  prenom: name('prénom'),
  nom: name('nom'),
  telephone: phone,
  email: optionalEmail,
  message: text(LIMITS.message).optional().transform((v) => v || undefined),
  site_web: honeypot,
});

export const contactSchema = z.object({
  prenom: name('prénom'),
  nom: name('nom'),
  telephone: z.union([z.literal(''), phone]).optional().transform((v) => v || undefined),
  email,
  sujet: z.enum(subjects, { message: 'Choisissez un sujet.' }),
  message: text(LIMITS.contactMessage).pipe(z.string().min(10, 'Votre message est un peu court.')),
  site_web: honeypot,
});

export type OrderInput = z.infer<typeof orderSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
