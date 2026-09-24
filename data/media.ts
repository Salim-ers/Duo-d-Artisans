/**
 * Photographies de la boutique, servies depuis /public (stockage permanent).
 *
 * `width` / `height` sont les dimensions RÉELLES du fichier : le script
 * scripts/check-images.mjs les vérifie avant chaque build. Une image absente,
 * mal nommée (casse comprise) ou aux dimensions divergentes fait échouer le build.
 *
 * Pour remplacer une photo : déposer le fichier dans /public/images/…,
 * puis mettre à jour src, width et height ici.
 */
export type Media = { src: string; alt: string; width: number; height: number };

export const media = {
  facade: {
    src: '/images/facade/le-duo-artisans-rantigny-facade.webp',
    alt: "Façade bleue de la boulangerie Le Duo d'Artisans, 7 rue Anatole France à Rantigny",
    width: 1672,
    height: 941,
  },
  baguettesTradition: {
    src: '/images/boulangerie/le-duo-artisans-baguettes-tradition.webp',
    alt: 'Deux baguettes croustillantes posées l’une sur l’autre',
    width: 1672,
    height: 941,
  },
  baguettesFournil: {
    src: '/images/boulangerie/le-duo-artisans-baguettes-fournil.webp',
    alt: 'Baguettes alignées à la sortie du four',
    width: 1254,
    height: 1254,
  },
  painsChocolat: {
    src: '/images/viennoiseries/le-duo-artisans-pains-au-chocolat.webp',
    alt: 'Pains au chocolat et viennoiseries feuilletées dorées',
    width: 1254,
    height: 1254,
  },
  gateauFruits: {
    src: '/images/patisserie/le-duo-artisans-gateau-fruits-frais.webp',
    alt: 'Gâteau rectangulaire aux fruits frais et fraises',
    width: 1254,
    height: 1254,
  },
  numberCake: {
    src: '/images/patisserie/le-duo-artisans-number-cake.webp',
    alt: 'Number cake décoré de macarons, roses et framboises',
    width: 1254,
    height: 1254,
  },
  macarons: {
    src: '/images/patisserie/le-duo-artisans-macarons-framboise-pistache.webp',
    alt: 'Grands macarons framboise et pistache garnis de framboises fraîches',
    width: 1254,
    height: 1254,
  },
  entremets: {
    src: '/images/patisserie/le-duo-artisans-entremets-citron-framboise.webp',
    alt: 'Entremets individuels en forme de citron et de framboise',
    width: 1254,
    height: 1254,
  },
  flans: {
    src: '/images/patisserie/le-duo-artisans-flans-portions.webp',
    alt: 'Petits flans individuels chocolat et pistache',
    width: 1254,
    height: 1254,
  },
  cookies: {
    src: '/images/patisserie/le-duo-artisans-cookies-garnis.webp',
    alt: 'Cookies épais garnis de chocolat, caramel et fruits rouges',
    width: 1254,
    height: 1254,
  },
  sandwichs: {
    src: '/images/snacking/le-duo-artisans-sandwichs-baguette.webp',
    alt: 'Sandwichs en baguette garnis de crudités',
    width: 1254,
    height: 1254,
  },
  salades: {
    src: '/images/snacking/le-duo-artisans-salades-fraiches.webp',
    alt: 'Salades composées et taboulés préparés en boutique',
    width: 1254,
    height: 1254,
  },
  petrin: {
    src: '/images/atelier/le-duo-artisans-petrin-pate.webp',
    alt: 'Pâte en cours de pétrissage dans le pétrin du fournil',
    width: 1254,
    height: 1254,
  },
  vitrinePatisseries: {
    src: '/images/vitrine/le-duo-artisans-vitrine-patisseries.webp',
    alt: 'Vitrine de pâtisseries de la boutique',
    width: 1672,
    height: 941,
  },
  vitrineFlans: {
    src: '/images/vitrine/le-duo-artisans-vitrine-flans-macarons.webp',
    alt: 'Vitrine garnie de flans, macarons et tartelettes',
    width: 1672,
    height: 941,
  },
  vitrineEclairs: {
    src: '/images/vitrine/le-duo-artisans-vitrine-eclairs.webp',
    alt: "Vitrine d'éclairs, Paris-Brest et tartes aux fruits",
    width: 1672,
    height: 941,
  },
  boutique: {
    src: '/images/vitrine/le-duo-artisans-boutique-interieur.webp',
    alt: 'Intérieur de la boutique et comptoir de pâtisseries',
    width: 1672,
    height: 941,
  },
} satisfies Record<string, Media>;

export type MediaKey = keyof typeof media;
