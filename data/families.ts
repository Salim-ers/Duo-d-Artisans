import type { MediaKey } from './media';

/**
 * Les familles de la boutique (accueil). Chacune ouvre la galerie filtrée correspondante ;
 * les gâteaux mènent à la commande sur mesure.
 */
export const families: { name: string; tagline: string; image: MediaKey; href: string }[] = [
  { name: 'Boulangerie', tagline: 'Le quotidien, croustillant.', image: 'baguettesTradition', href: '/creations?filtre=pain' },
  { name: 'Viennoiseries', tagline: 'Le feuilletage du matin.', image: 'painsChocolat', href: '/creations?filtre=viennoiserie' },
  { name: 'Pâtisseries', tagline: 'La vitrine, pièce par pièce.', image: 'entremets', href: '/creations?filtre=patisserie' },
  { name: 'Gourmandises', tagline: 'Pour le goûter, ou sans raison.', image: 'cookies', href: '/creations?filtre=patisserie' },
  { name: 'Snacking', tagline: 'Le midi, préparé en boutique.', image: 'sandwichs', href: '/creations?filtre=sale' },
  { name: 'Gâteaux sur mesure', tagline: 'Pour les jours qui comptent.', image: 'numberCake', href: '/commander' },
];
