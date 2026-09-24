import { media, type MediaKey } from './media';

export type Category =
  | 'boulangerie' | 'viennoiserie' | 'patisserie' | 'gateaux' | 'snacking' | 'salades' | 'gourmandises';

export type Creation = {
  id: string;
  name: string;
  category: Category;
  image: MediaKey;
  /** Description volontairement générique : aucune recette ni origine inventée. */
  description?: string;
  /** "boutique" = disponible en boutique · "commande" = sur demande. */
  availability: 'boutique' | 'commande';
};

export const categories: { id: Category | 'tout'; label: string }[] = [
  { id: 'tout', label: 'Tout' },
  { id: 'boulangerie', label: 'Boulangerie' },
  { id: 'viennoiserie', label: 'Viennoiserie' },
  { id: 'patisserie', label: 'Pâtisserie' },
  { id: 'gateaux', label: 'Gâteaux' },
  { id: 'snacking', label: 'Snacking' },
  { id: 'salades', label: 'Salades' },
  { id: 'gourmandises', label: 'Gourmandises' },
];

export const creations: Creation[] = [
  { id: 'baguettes', name: 'Baguettes', category: 'boulangerie', image: 'baguettesTradition',
    description: 'La base de la journée, croustillante.', availability: 'boutique' },
  { id: 'pains', name: 'Pains', category: 'boulangerie', image: 'baguettesFournil',
    description: 'Cuits sur place, du matin au soir.', availability: 'boutique' },
  { id: 'viennoiseries', name: 'Viennoiseries', category: 'viennoiserie', image: 'painsChocolat',
    description: 'Pains au chocolat et feuilletés dorés.', availability: 'boutique' },
  { id: 'macarons', name: 'Grands macarons', category: 'patisserie', image: 'macarons',
    description: 'Framboise, pistache, garnis de fruits frais.', availability: 'boutique' },
  { id: 'entremets', name: 'Entremets citron & framboise', category: 'patisserie', image: 'entremets',
    description: 'Pâtisseries individuelles, finition velours.', availability: 'boutique' },
  { id: 'flans', name: 'Flans individuels', category: 'patisserie', image: 'flans',
    description: 'Chocolat, pistache — part généreuse.', availability: 'boutique' },
  { id: 'vitrine-patisseries', name: 'Tartes, éclairs & tartelettes', category: 'patisserie', image: 'vitrineEclairs',
    description: 'La vitrine change au fil des jours.', availability: 'boutique' },
  { id: 'gateau-fruits', name: 'Gâteau aux fruits frais', category: 'gateaux', image: 'gateauFruits',
    description: 'Pièce à partager, fruits de saison.', availability: 'commande' },
  { id: 'number-cake', name: 'Number cake', category: 'gateaux', image: 'numberCake',
    description: 'Chiffres et lettres pour les grandes occasions.', availability: 'commande' },
  { id: 'sandwichs', name: 'Sandwichs', category: 'snacking', image: 'sandwichs',
    description: 'Préparés en boutique, prêts à emporter.', availability: 'boutique' },
  { id: 'salades', name: 'Salades composées', category: 'salades', image: 'salades',
    description: 'Salades et taboulés du jour.', availability: 'boutique' },
  { id: 'cookies', name: 'Cookies garnis', category: 'gourmandises', image: 'cookies',
    description: 'Chocolat, caramel, fruits rouges.', availability: 'boutique' },
  { id: 'vitrine-gourmandises', name: 'Gourmandises', category: 'gourmandises', image: 'vitrineFlans',
    description: 'Meringues, confiseries et douceurs du comptoir.', availability: 'boutique' },
];

export const creationImage = (c: Creation) => media[c.image];
