/**
 * Photographies de la boutique, servies depuis /public — versions 4K fournies par la boutique.
 *
 * - Photos 16:9 : fichiers 3840 × 2160 tels que livrés.
 * - Photos carrées : la photo entière (2160 × 2160), extraite des fichiers 3840 × 2160 livrés,
 *   où elle était posée au centre sur un fond flouté. Aucun pixel de la photo n'est retiré.
 * - Grand format (`…Wide`) : le fichier 3840 × 2160 livré tel quel (photo carrée + fond flouté),
 *   pour les emplacements pleine largeur.
 *
 * Règles : une même photo n'apparaît jamais deux fois sur une page ; une photo s'affiche
 * toujours ENTIÈRE, à son ratio d'origine (jamais recadrée ni zoomée).
 *
 * `width` / `height` sont les dimensions RÉELLES du fichier : scripts/check-images.mjs les vérifie
 * avant chaque build.
 */
export type Media = { src: string; alt: string; width: number; height: number };

export const media = {
  facade: {
    src: '/images/facade/le-duo-artisans-rantigny-facade.webp',
    alt: "La devanture bleue du Duo d'Artisans, 7 rue Anatole France à Rantigny",
    width: 3840,
    height: 2160,
  },
  baguettesTradition: {
    src: '/images/boulangerie/le-duo-artisans-baguettes-tradition.webp',
    alt: 'Deux baguettes croustillantes posées l’une sur l’autre',
    width: 3840,
    height: 2160,
  },
  baguettesFournil: {
    src: '/images/boulangerie/le-duo-artisans-baguettes-fournil.webp',
    alt: 'Baguettes alignées à la sortie du four',
    width: 2160,
    height: 2160,
  },
  painsChocolat: {
    src: '/images/viennoiseries/le-duo-artisans-pains-au-chocolat.webp',
    alt: 'Pains au chocolat et viennoiseries feuilletées dorées',
    width: 2160,
    height: 2160,
  },
  painsChocolatWide: {
    src: '/images/grand-format/le-duo-artisans-pains-au-chocolat-16x9.webp',
    alt: 'Pains au chocolat et viennoiseries feuilletées dorées',
    width: 3840,
    height: 2160,
  },
  gateauFruits: {
    src: '/images/patisserie/le-duo-artisans-gateau-fruits-frais.webp',
    alt: 'Gâteau rectangulaire aux fruits frais et fraises',
    width: 2160,
    height: 2160,
  },
  numberCake: {
    src: '/images/patisserie/le-duo-artisans-number-cake.webp',
    alt: 'Number cake décoré de macarons, roses et framboises',
    width: 2160,
    height: 2160,
  },
  macarons: {
    src: '/images/patisserie/le-duo-artisans-macarons-framboise-pistache.webp',
    alt: 'Grands macarons framboise et pistache garnis de framboises fraîches',
    width: 2160,
    height: 2160,
  },
  entremets: {
    src: '/images/patisserie/le-duo-artisans-entremets-citron-framboise.webp',
    alt: 'Entremets individuels en forme de citron et de framboise',
    width: 2160,
    height: 2160,
  },
  entremetsWide: {
    src: '/images/grand-format/le-duo-artisans-entremets-citron-framboise-16x9.webp',
    alt: 'Entremets individuels en forme de citron et de framboise',
    width: 3840,
    height: 2160,
  },
  flans: {
    src: '/images/patisserie/le-duo-artisans-flans-portions.webp',
    alt: 'Petits flans individuels chocolat et pistache',
    width: 2160,
    height: 2160,
  },
  cookies: {
    src: '/images/patisserie/le-duo-artisans-cookies-garnis.webp',
    alt: 'Cookies épais garnis de chocolat, caramel et fruits rouges',
    width: 2160,
    height: 2160,
  },
  sandwichs: {
    src: '/images/snacking/le-duo-artisans-sandwichs-baguette.webp',
    alt: 'Sandwichs en baguette garnis de crudités',
    width: 2160,
    height: 2160,
  },
  salades: {
    src: '/images/snacking/le-duo-artisans-salades-fraiches.webp',
    alt: 'Salades composées et salades de pâtes préparées en boutique',
    width: 2160,
    height: 2160,
  },
  petrin: {
    src: '/images/atelier/le-duo-artisans-petrin-pate.webp',
    alt: 'Pâte en cours de pétrissage dans le pétrin du fournil',
    width: 2160,
    height: 2160,
  },
  vitrinePatisseries: {
    src: '/images/vitrine/le-duo-artisans-vitrine-patisseries.webp',
    alt: 'Vitrine de pâtisseries : flans, macarons, tartelettes, religieuses et éclairs',
    width: 3840,
    height: 2160,
  },
  vitrineFlans: {
    src: '/images/vitrine/le-duo-artisans-vitrine-flans-macarons.webp',
    alt: 'Vitrine garnie de flans, macarons et tartelettes',
    width: 3840,
    height: 2160,
  },
  vitrineEclairs: {
    src: '/images/vitrine/le-duo-artisans-vitrine-eclairs.webp',
    alt: "Vitrine d'éclairs, Paris-Brest et tartes aux fruits",
    width: 3840,
    height: 2160,
  },
  boutique: {
    src: '/images/vitrine/le-duo-artisans-boutique-interieur.webp',
    alt: 'Intérieur de la boutique et comptoir de pâtisseries',
    width: 3840,
    height: 2160,
  },
} satisfies Record<string, Media>;

export type MediaKey = keyof typeof media;
