import type { CustomStatus, OrderStatus, PaymentStatus } from '@/lib/db/schema';

export const orderStatusLabel: Record<OrderStatus, string> = {
  new: 'Nouvelle',
  confirmed: 'Confirmée',
  to_prepare: 'À préparer',
  in_preparation: 'En préparation',
  ready: 'Prête',
  collected: 'Retirée',
  cancelled: 'Annulée',
};

export const orderStatuses = Object.keys(orderStatusLabel) as OrderStatus[];
/** Statuts « en cours » (ni retirée, ni annulée). */
export const openStatuses: OrderStatus[] = ['new', 'confirmed', 'to_prepare', 'in_preparation', 'ready'];

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  pending: 'Paiement en attente',
  paid: 'Payée',
  on_site: 'À régler en boutique',
  refunded: 'Remboursée',
  failed: 'Paiement échoué',
};

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

/** Étapes visibles par le client sur sa confirmation. */
export const customerSteps: { key: OrderStatus[]; label: string }[] = [
  { key: ['new'], label: 'Reçue' },
  { key: ['confirmed', 'to_prepare'], label: 'Confirmée' },
  { key: ['in_preparation'], label: 'En préparation' },
  { key: ['ready'], label: 'Prête' },
  { key: ['collected'], label: 'Retirée' },
];

/** Les 14 allergènes à déclaration obligatoire (règlement UE 1169/2011). */
export const ALLERGENS = [
  'Gluten',
  'Crustacés',
  'Œufs',
  'Poissons',
  'Arachides',
  'Soja',
  'Lait',
  'Fruits à coque',
  'Céleri',
  'Moutarde',
  'Sésame',
  'Sulfites',
  'Lupin',
  'Mollusques',
];

/** Catégories de la galerie publique (/creations). */
export const galleryCategories = [
  { id: 'pain', label: 'Pain' },
  { id: 'viennoiserie', label: 'Viennoiserie' },
  { id: 'patisserie', label: 'Pâtisserie' },
  { id: 'sale', label: 'Salé' },
  { id: 'gateaux', label: 'Gâteaux' },
  { id: 'boutique', label: 'Boutique' },
] as const;
export type GalleryCategory = (typeof galleryCategories)[number]['id'];

export const roleLabel = { SUPER_ADMIN: 'Super administrateur', ADMIN: 'Administrateur', STAFF: 'Équipe' } as const;
