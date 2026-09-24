import type { MediaKey } from './media';

/**
 * Créations présentées sur le site. Aucun prix, aucune recette ni origine
 * inventée : uniquement ce que montrent les photographies de la boutique.
 */

export type Filter = 'pain' | 'viennoiserie' | 'patisserie' | 'sale' | 'boutique';

export const filters: { id: Filter | 'tout'; label: string }[] = [
  { id: 'tout', label: 'Tout' },
  { id: 'pain', label: 'Pain' },
  { id: 'viennoiserie', label: 'Viennoiserie' },
  { id: 'patisserie', label: 'Pâtisserie' },
  { id: 'sale', label: 'Salé' },
  { id: 'boutique', label: 'Boutique' },
];

export type Creation = {
  id: string;
  name: string;
  note: string;
  filter: Filter;
  image: MediaKey;
  /** « commande » : pièce réalisée sur demande. */
  onOrder?: boolean;
};

export const creations: Creation[] = [
  { id: 'baguettes', name: 'Baguettes', note: 'La base de la journée, croustillante.', filter: 'pain', image: 'baguettesTradition' },
  { id: 'vitrine', name: 'La vitrine', note: 'Éclairs, Paris-Brest, tartes aux fruits.', filter: 'boutique', image: 'vitrineEclairs' },
  { id: 'macarons', name: 'Grands macarons', note: 'Framboise, pistache, fruits frais.', filter: 'patisserie', image: 'macarons' },
  { id: 'viennoiseries', name: 'Viennoiseries', note: 'Pains au chocolat, feuilletage doré.', filter: 'viennoiserie', image: 'painsChocolat' },
  { id: 'number-cake', name: 'Number cake', note: 'Chiffres et lettres, sur commande.', filter: 'patisserie', image: 'numberCake', onOrder: true },
  { id: 'sandwichs', name: 'Sandwichs', note: 'En baguette, prêts à emporter.', filter: 'sale', image: 'sandwichs' },
  { id: 'pains', name: 'Pains', note: 'À la sortie du four.', filter: 'pain', image: 'baguettesFournil' },
  { id: 'entremets', name: 'Entremets citron & framboise', note: 'Pâtisseries individuelles.', filter: 'patisserie', image: 'entremets' },
  { id: 'boutique', name: 'La boutique', note: 'Le comptoir et ses vitrines.', filter: 'boutique', image: 'boutique' },
  { id: 'gateau-fruits', name: 'Gâteau aux fruits frais', note: 'À partager, sur commande.', filter: 'patisserie', image: 'gateauFruits', onOrder: true },
  { id: 'salades', name: 'Salades composées', note: 'Salades et taboulés du jour.', filter: 'sale', image: 'salades' },
  { id: 'flans', name: 'Flans individuels', note: 'Chocolat, pistache.', filter: 'patisserie', image: 'flans' },
  { id: 'petrin', name: 'Au pétrin', note: 'La pâte, avant le pain.', filter: 'pain', image: 'petrin' },
  { id: 'cookies', name: 'Cookies garnis', note: 'Chocolat, caramel, fruits rouges.', filter: 'patisserie', image: 'cookies' },
  { id: 'gourmandises', name: 'Gourmandises', note: 'Flans, macarons, tartelettes en vitrine.', filter: 'boutique', image: 'vitrineFlans' },
  { id: 'patisseries', name: 'Pâtisseries du jour', note: 'La sélection change au fil des jours.', filter: 'boutique', image: 'vitrinePatisseries' },
];

/** Catalogue éditorial de l'accueil : six univers, six entrées. */
export const chapters: { n: string; title: string; line: string; image: MediaKey; href: string; cta: string }[] = [
  { n: '01', title: 'Pain', line: 'Le quotidien, croustillant.', image: 'baguettesTradition', href: '/nos-creations?filtre=pain', cta: 'Voir le pain' },
  { n: '02', title: 'Viennoiserie', line: 'Le feuilletage du matin.', image: 'painsChocolat', href: '/nos-creations?filtre=viennoiserie', cta: 'Voir les viennoiseries' },
  { n: '03', title: 'Pâtisserie', line: 'La vitrine, pièce par pièce.', image: 'entremets', href: '/nos-creations?filtre=patisserie', cta: 'Voir les pâtisseries' },
  { n: '04', title: 'Gourmandises', line: 'Pour le goûter, ou sans raison.', image: 'cookies', href: '/nos-creations?filtre=patisserie', cta: 'Voir les gourmandises' },
  { n: '05', title: 'Gâteaux', line: 'Pour les jours qui comptent.', image: 'numberCake', href: '/commandes', cta: 'Demander un gâteau' },
  { n: '06', title: 'Snacking', line: 'Le midi, préparé en boutique.', image: 'sandwichs', href: '/nos-creations?filtre=sale', cta: 'Voir le salé' },
];
