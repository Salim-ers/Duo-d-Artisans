import { type MediaKey } from './media';

export type GalleryFilter = 'tout' | 'pain' | 'viennoiserie' | 'patisserie' | 'sale' | 'boutique';

export const galleryFilters: { id: GalleryFilter; label: string }[] = [
  { id: 'tout', label: 'Tout' },
  { id: 'pain', label: 'Pain' },
  { id: 'viennoiserie', label: 'Viennoiserie' },
  { id: 'patisserie', label: 'Pâtisserie' },
  { id: 'sale', label: 'Salé' },
  { id: 'boutique', label: 'Boutique' },
];

export const gallery: { key: MediaKey; filter: Exclude<GalleryFilter, 'tout'>; glaze?: boolean }[] = [
  { key: 'vitrinePatisseries', filter: 'boutique' },
  { key: 'baguettesFournil', filter: 'pain' },
  { key: 'gateauFruits', filter: 'patisserie', glaze: true },
  { key: 'painsChocolat', filter: 'viennoiserie' },
  { key: 'vitrineEclairs', filter: 'boutique' },
  { key: 'macarons', filter: 'patisserie', glaze: true },
  { key: 'sandwichs', filter: 'sale' },
  { key: 'numberCake', filter: 'patisserie' },
  { key: 'salades', filter: 'sale' },
  { key: 'flans', filter: 'patisserie' },
  { key: 'baguettesTradition', filter: 'pain' },
  { key: 'boutique', filter: 'boutique' },
  { key: 'entremets', filter: 'patisserie', glaze: true },
  { key: 'cookies', filter: 'patisserie' },
  { key: 'vitrineFlans', filter: 'boutique' },
  { key: 'petrin', filter: 'pain' },
];
