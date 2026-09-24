/**
 * Photographies authentiques fournies par la boutique.
 * Aucune image de banque d'images, aucune image générée : uniquement la vraie boutique.
 * Les fichiers sont nommés pour le référencement local.
 */
export type Media = { src: string; alt: string; ratio: number };

export const media = {
  facade: {
    src: '/images/facade/le-duo-artisans-rantigny-facade.webp',
    alt: "Façade bleue de la boulangerie Le Duo d'Artisans, 7 rue Anatole France à Rantigny",
    ratio: 1672 / 941,
  },
  baguettesTradition: {
    src: '/images/boulangerie/le-duo-artisans-baguettes-tradition.webp',
    alt: 'Deux baguettes croustillantes posées l’une sur l’autre',
    ratio: 1672 / 941,
  },
  baguettesFournil: {
    src: '/images/boulangerie/le-duo-artisans-baguettes-fournil.webp',
    alt: 'Baguettes alignées à la sortie du fournil',
    ratio: 1,
  },
  painsChocolat: {
    src: '/images/viennoiseries/le-duo-artisans-pains-au-chocolat.webp',
    alt: 'Pains au chocolat et viennoiseries feuilletées dorées',
    ratio: 1,
  },
  gateauFruits: {
    src: '/images/patisserie/le-duo-artisans-gateau-fruits-frais.webp',
    alt: 'Gâteau rectangulaire aux fruits frais et fraises',
    ratio: 1,
  },
  numberCake: {
    src: '/images/patisserie/le-duo-artisans-number-cake.webp',
    alt: 'Number cake décoré de macarons, roses et framboises',
    ratio: 1,
  },
  macarons: {
    src: '/images/patisserie/le-duo-artisans-macarons-framboise-pistache.webp',
    alt: 'Gros macarons framboise et pistache garnis de framboises fraîches',
    ratio: 1,
  },
  entremets: {
    src: '/images/patisserie/le-duo-artisans-entremets-citron-framboise.webp',
    alt: 'Entremets individuels en forme de citron et de framboise',
    ratio: 1,
  },
  flans: {
    src: '/images/patisserie/le-duo-artisans-flans-portions.webp',
    alt: 'Petits flans individuels chocolat et pistache',
    ratio: 1,
  },
  cookies: {
    src: '/images/patisserie/le-duo-artisans-cookies-garnis.webp',
    alt: 'Cookies épais garnis de chocolat, caramel et fruits rouges',
    ratio: 1,
  },
  sandwichs: {
    src: '/images/snacking/le-duo-artisans-sandwichs-baguette.webp',
    alt: 'Sandwichs en baguette garnis de crudités',
    ratio: 1,
  },
  salades: {
    src: '/images/snacking/le-duo-artisans-salades-fraiches.webp',
    alt: 'Salades composées et taboulés préparés en boutique',
    ratio: 1,
  },
  petrin: {
    src: '/images/atelier/le-duo-artisans-petrin-pate.webp',
    alt: 'Pâte en cours de pétrissage dans le pétrin du fournil',
    ratio: 1,
  },
  vitrinePatisseries: {
    src: '/images/vitrine/le-duo-artisans-vitrine-patisseries.webp',
    alt: 'Vitrine de pâtisseries de la boutique',
    ratio: 1672 / 941,
  },
  vitrineFlans: {
    src: '/images/vitrine/le-duo-artisans-vitrine-flans-macarons.webp',
    alt: 'Vitrine garnie de flans, macarons et tartelettes',
    ratio: 1672 / 941,
  },
  vitrineEclairs: {
    src: '/images/vitrine/le-duo-artisans-vitrine-eclairs.webp',
    alt: "Vitrine d'éclairs, Paris-Brest et tartes aux fruits",
    ratio: 1672 / 941,
  },
  boutique: {
    src: '/images/vitrine/le-duo-artisans-boutique-interieur.webp',
    alt: 'Intérieur de la boutique et comptoir de pâtisseries',
    ratio: 1672 / 941,
  },
} satisfies Record<string, Media>;

export type MediaKey = keyof typeof media;
