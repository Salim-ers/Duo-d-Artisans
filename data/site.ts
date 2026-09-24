/**
 * ------------------------------------------------------------------
 * CONFIGURATION CENTRALE — Le Duo d'Artisans
 * Toute information métier se modifie ICI et nulle part ailleurs.
 * ------------------------------------------------------------------
 */

/** Variable vide ou sans protocole → URL valide (sinon `new URL()` fait échouer le build). */
function resolveSiteUrl(raw: string | undefined): string {
  const value = raw?.trim();
  if (!value) return 'https://www.leduodartisans.fr';
  return /^https?:\/\//.test(value) ? value : `https://${value}`;
}

export const site = {
  name: "Le Duo d'Artisans",
  legalName: 'LE DUO D’ARTISANS',
  baseline: 'Deux savoir-faire. Une même passion.',
  shortDescription:
    'Boulangerie-pâtisserie artisanale au 7 Rue Anatole France à Rantigny : pains, viennoiseries, pâtisseries, snacking et créations gourmandes.',
  /** Remplacer par le domaine définitif avant la mise en ligne. */
  url: resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),

  phone: { display: '03 44 28 55 61', href: 'tel:+33344285561', international: '+33 3 44 28 55 61' },

  /** Adresse e-mail non communiquée à ce jour — à renseigner. */
  email: null as string | null,

  address: {
    street: '7 Rue Anatole France',
    postalCode: '60290',
    city: 'Rantigny',
    region: 'Hauts-de-France',
    department: 'Oise',
    country: 'France',
    countryCode: 'FR',
  },

  /** Coordonnées GPS non vérifiées : volontairement absentes du JSON-LD. */
  geo: null as { lat: number; lng: number } | null,

  maps: {
    /** URL générique Google Maps construite à partir de l'adresse (aucune URL inventée). */
    directions:
      'https://www.google.com/maps/dir/?api=1&destination=' +
      encodeURIComponent('7 Rue Anatole France 60290 Rantigny'),
    search:
      'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent("Le Duo D'artisans 7 Rue Anatole France 60290 Rantigny"),
    embed:
      'https://www.google.com/maps?q=' +
      encodeURIComponent('7 Rue Anatole France 60290 Rantigny') +
      '&output=embed',
  },

  /** Lien de la fiche Google Business à coller dès qu'il sera fourni. */
  googleBusinessUrl: null as string | null,

  reviews: { rating: 4.5, count: 287, source: 'Google' },

  social: { instagram: null as string | null, facebook: null as string | null },

  activities: [
    'Boulangerie',
    'Pâtisserie',
    'Viennoiserie',
    'Chocolaterie',
    'Confiserie',
    'Glaces',
    'Traiteur',
    'Sandwichs',
    'Snacking',
  ],

  legal: {
    name: 'LE DUO D’ARTISANS',
    form: 'SARL',
    siren: '987 907 607',
    siret: '987 907 607 00012',
    activity: 'Boulangerie et boulangerie-pâtisserie',
    /** Champs à compléter par le client avant publication. */
    director: null as string | null,
    capital: null as string | null,
    rcs: null as string | null,
    vat: null as string | null,
    host: { name: 'Vercel Inc.', address: '440 N Barranca Ave #4133, Covina, CA 91723, USA' },
  },
} as const;

export const nav = [
  { label: 'Accueil', href: '/' },
  { label: 'La Maison', href: '/la-maison' },
  { label: 'Nos créations', href: '/nos-creations' },
  { label: 'Savoir-faire', href: '/savoir-faire' },
  { label: 'Commandes', href: '/commandes' },
  { label: 'Actualités', href: '/actualites' },
  { label: 'Contact', href: '/contact' },
] as const;

export const fullAddress = `${site.address.street}, ${site.address.postalCode} ${site.address.city}`;
