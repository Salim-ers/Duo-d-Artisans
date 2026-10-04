/**
 * Schémas de validation SERVEUR (source de vérité).
 * Le navigateur ne fait que des contrôles de confort : tout est revalidé ici.
 */
import { z } from 'zod';

/** Supprime caractères de contrôle et espaces superflus (conserve les retours à la ligne). */
export const clean = (value: string) =>
  value
    .normalize('NFC')
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F\u200b-\u200f\u2028\u2029]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export const text = (max: number, min = 0, label = 'Ce champ') =>
  z
    .string({ invalid_type_error: `${label} est invalide.` })
    .max(max * 2)
    .transform(clean)
    .pipe(
      z
        .string()
        .min(min, min ? `${label} est obligatoire.` : undefined)
        .max(max, `${label} : ${max} caractères maximum.`),
    );

export const optText = (max: number, label?: string) =>
  z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? clean(v) : ''))
    .pipe(z.string().max(max, `${label ?? 'Ce champ'} : ${max} caractères maximum.`))
    .transform((v) => v || null);

export const personName = (label: string) =>
  text(60, 1, label).pipe(
    z.string().regex(/^[\p{L}\p{M}' ’.-]+(?: [\p{L}\p{M}' ’.-]+)*$/u, `Votre ${label.toLowerCase()} contient des caractères inattendus.`),
  );

export const phone = z
  .string()
  .max(40)
  .transform((v) => v.replace(/[\s.\-()]/g, ''))
  .pipe(z.string().regex(/^(\+\d{9,15}|0[1-9]\d{8})$/, 'Numéro de téléphone invalide.'));

export const email = z.string().max(160).trim().toLowerCase().pipe(z.string().email('Adresse e-mail invalide.'));
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide.');

export const contactFields = {
  firstName: personName('Prénom'),
  lastName: personName('Nom'),
  email,
  phone,
};

/** Demande personnalisée : jamais une commande acceptée d'office. */
export const customInput = z.object({
  type: text(60, 1, 'Le type de création'),
  desiredDate: isoDate,
  servings: z.coerce
    .number({ message: 'Indiquez un nombre de personnes.' })
    .int('Nombre entier attendu.')
    .min(1, 'Au moins 1 personne.')
    .max(300, 'Au-delà de 300 personnes, appelez la boutique.'),
  flavors: optText(300, 'Les saveurs'),
  theme: optText(200, 'Le thème'),
  inscription: optText(120, 'Le texte'),
  budget: optText(60, 'Le budget'),
  comment: optText(2000, 'Le commentaire'),
  ...contactFields,
});

export const contactInput = z.object({
  name: text(120, 1, 'Votre nom'),
  email,
  phone: z.union([z.literal(''), phone]).optional().transform((v) => v || null),
  message: text(3000, 10, 'Le message'),
});

/** Premier message d'erreur lisible. */
export const firstError = (e: z.ZodError) => e.issues[0]?.message ?? 'Données invalides.';

/** Erreurs par champ (première par champ). */
export const fieldErrors = (e: z.ZodError) => {
  const out: Record<string, string> = {};
  for (const i of e.issues) {
    const k = String(i.path[0] ?? '_');
    out[k] ??= i.message;
  }
  return out;
};
