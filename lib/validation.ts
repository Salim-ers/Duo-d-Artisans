import { z } from 'zod';

const phone = z
  .string()
  .min(10, 'Numéro de téléphone trop court.')
  .regex(/^[0-9+\s().-]{10,20}$/, 'Numéro de téléphone invalide.');

export const orderSchema = z.object({
  prenom: z.string().min(2, 'Merci d’indiquer votre prénom.'),
  nom: z.string().min(2, 'Merci d’indiquer votre nom.'),
  telephone: phone,
  email: z.string().email('Adresse e-mail invalide.').optional().or(z.literal('')),
  type: z.enum(['Anniversaire', 'Événement', 'Gâteau', 'Traiteur', 'Autre']),
  date: z.string().optional().or(z.literal('')),
  personnes: z.string().optional().or(z.literal('')),
  message: z.string().min(10, 'Décrivez votre projet en quelques mots.'),
});

export const contactSchema = z.object({
  prenom: z.string().min(2, 'Merci d’indiquer votre prénom.'),
  nom: z.string().min(2, 'Merci d’indiquer votre nom.'),
  telephone: phone.optional().or(z.literal('')),
  email: z.string().email('Adresse e-mail invalide.'),
  sujet: z.string().min(2, 'Merci d’indiquer un sujet.'),
  message: z.string().min(10, 'Votre message est un peu court.'),
});

export type OrderInput = z.infer<typeof orderSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
