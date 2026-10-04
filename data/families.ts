import type { MediaKey } from './media';

/**
 * Les familles de la boutique (accueil). Chacune ouvre la galerie filtrée correspondante ;
 * les gâteaux mènent à la commande sur mesure.
 *
 * Les visuels sont des photos d'ambiance (ingrédients, gestes) libres de droits : les vraies
 * créations de la boutique s'affichent juste en dessous, dans « Nos créations », sans doublon.
 */
export const families: { name: string; tagline: string; image: MediaKey; position?: string; href: string }[] = [
  { name: 'Boulangerie', tagline: 'Le quotidien, croustillant.', image: 'ambBle', position: '52% 50%', href: '/creations?filtre=pain' },
  { name: 'Viennoiseries', tagline: 'Le feuilletage du matin.', image: 'ambRouleau', position: '48% 50%', href: '/creations?filtre=viennoiserie' },
  { name: 'Pâtisseries', tagline: 'La vitrine, pièce par pièce.', image: 'ambFramboises', position: '40% 50%', href: '/creations?filtre=patisserie' },
  { name: 'Gourmandises', tagline: 'Pour le goûter, ou sans raison.', image: 'ambChocolat', position: '50% 40%', href: '/creations?filtre=patisserie' },
  { name: 'Snacking', tagline: 'Le midi, préparé en boutique.', image: 'ambTomates', position: '50% 50%', href: '/creations?filtre=sale' },
  { name: 'Gâteaux sur mesure', tagline: 'Pour les jours qui comptent.', image: 'ambCierge', position: '62% 50%', href: '/commander' },
];
