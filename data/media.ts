/**
 * Photographies de la boutique et photos d'ambiance libres de droits, servies depuis /public.
 * Règle : une même photo n'apparaît jamais deux fois sur une page.
 *
 * `width` / `height` sont les dimensions RÉELLES du fichier : le script
 * scripts/check-images.mjs les vérifie avant chaque build. Une image absente,
 * mal nommée (casse comprise) ou aux dimensions divergentes fait échouer le build.
 *
 * Pour remplacer une photo : déposer le fichier dans /public/images/…,
 * puis mettre à jour src, width et height ici.
 */
export type Media = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Photo libre de droits (licence Pexels) : auteur et page d'origine, repris dans les mentions légales. */
  credit?: { author: string; url: string };
};

export const media = {
  facade: {
    src: '/images/facade/le-duo-artisans-rantigny-facade.webp',
    alt: "Façade bleue de la boulangerie Le Duo d'Artisans, 7 rue Anatole France à Rantigny",
    width: 1672,
    height: 941,
  },
  /**
   * Visuel d'accueil : la vraie devanture, restaurée et agrandie par IA (3200 × 3200).
   * Au format carré, un même fichier couvre les écrans larges comme les téléphones.
   */
  devanture: {
    src: '/images/accueil/le-duo-artisans-devanture-rantigny.webp',
    alt: "La devanture bleue du Duo d'Artisans, 7 rue Anatole France à Rantigny",
    width: 3200,
    height: 3200,
  },

  /* ---------- Ambiance : ingrédients et gestes, photos libres de droits (jamais présentées comme des produits de la boutique) ---------- */
  ambBle: {
    src: '/images/ambiance/le-duo-artisans-ambiance-ble.webp',
    alt: 'Épis de blé mûrs dans un champ',
    width: 2400,
    height: 1600,
    credit: { author: 'David Roberts', url: 'https://www.pexels.com/photo/close-up-photograph-of-brown-wheat-12873375/' },
  },
  ambRouleau: {
    src: '/images/ambiance/le-duo-artisans-ambiance-rouleau-patisserie.webp',
    alt: 'Rouleau à pâtisserie et pâte abaissée sur un plan de travail fariné',
    width: 2400,
    height: 1600,
    credit: { author: 'Klaus Nielsen', url: 'https://www.pexels.com/photo/thin-dough-on-rolling-pin-on-messy-table-6287325/' },
  },
  ambFramboises: {
    src: '/images/ambiance/le-duo-artisans-ambiance-framboises.webp',
    alt: 'Framboises fraîches sur une planche en bois sombre',
    width: 2400,
    height: 1600,
    credit: { author: 'Lisa Fotios', url: 'https://www.pexels.com/photo/raspberries-on-black-wooden-board-1046350/' },
  },
  ambChocolat: {
    src: '/images/ambiance/le-duo-artisans-ambiance-chocolat.webp',
    alt: 'Chocolat fondu travaillé au fouet dans un cul-de-poule',
    width: 1600,
    height: 2400,
    credit: { author: 'Nano Erdozain', url: 'https://www.pexels.com/photo/rich-chocolate-batter-being-whipped-in-a-bowl-33775604/' },
  },
  ambTomates: {
    src: '/images/ambiance/le-duo-artisans-ambiance-tomates.webp',
    alt: 'Tomates anciennes sur une table en bois',
    width: 1600,
    height: 2407,
    credit: { author: 'Dilara', url: 'https://www.pexels.com/photo/fresh-heirloom-tomatoes-on-rustic-wooden-table-29081091/' },
  },
  ambCierge: {
    src: '/images/ambiance/le-duo-artisans-ambiance-cierge-magique.webp',
    alt: 'Cierge magique allumé, tenu à la main un soir de fête',
    width: 2400,
    height: 1800,
    credit: { author: 'energepic.com', url: 'https://www.pexels.com/photo/person-holding-lighted-firecracker-288478/' },
  },

  /* ---------- Photographies de la boutique ---------- */
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
