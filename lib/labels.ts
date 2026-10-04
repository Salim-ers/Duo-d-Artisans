import type { CustomStatus } from '@/lib/db/schema';

export const customStatusLabel: Record<CustomStatus, string> = {
  new_request: 'Nouvelle demande',
  reviewing: 'À étudier',
  quote_sent: 'Devis envoyé',
  accepted: 'Acceptée',
  refused: 'Refusée',
  in_preparation: 'En préparation',
  ready: 'Prête',
  collected: 'Retirée',
};

export const customStatuses = Object.keys(customStatusLabel) as CustomStatus[];

/** Catégories de la galerie publique (/creations). */
export const galleryCategories = [
  { id: 'pain', label: 'Pain' },
  { id: 'viennoiserie', label: 'Viennoiserie' },
  { id: 'patisserie', label: 'Pâtisserie' },
  { id: 'sale', label: 'Salé' },
  { id: 'gateaux', label: 'Gâteaux' },
  { id: 'boutique', label: 'Boutique' },
] as const;
export const roleLabel = { SUPER_ADMIN: 'Super administrateur', ADMIN: 'Administrateur', STAFF: 'Équipe' } as const;
