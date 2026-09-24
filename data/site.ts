/**
 * ------------------------------------------------------------------
 * CONFIGURATION CENTRALE — Le Duo d'Artisans
 * Toute information métier se modifie ICI et nulle part ailleurs.
 * ------------------------------------------------------------------
 */

/** Variable vide ou sans protocole → URL valide (sinon `new URL()` fait échouer le build). */
function resolveSiteUrl(raw: string | undefined): string {
  const value = raw?.trim().replace(/\/+$/, '');
  if (!value) return 'https://www.leduodartisans.fr';
  return /^https?:\/\//.test(value) ? value : `https://${value}`;
}

const addressQuery = '7 Rue Anatole France 60290 Rantigny';

export const site = {
  name: "Le Duo d'Artisans",
  displayName: 'Le Duo d’Artisans',
  baseline: 'Deux savoir-faire. Une même passion.',
  shortDescription:
    'Boulangerie-pâtisserie artisanale au 7 rue Anatole France à Rantigny (Oise) : pains, viennoiseries, pâtisseries, gâteaux sur commande et snacking.',
  url: resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),

  phone: { display: '03 44 28 55 61', href: 'tel:+33344285561', international: '+33344285561' },

  /** Adresse e-mail publique de la boutique (null = non communiquée, non affichée). */
  email: null as string | null,

  address: {
    street: '7 Rue Anatole France',
    postalCode: '60290',
    city: 'Rantigny',
    region: 'Hauts-de-France',
    department: 'Oise',
    countryCode: 'FR',
  },

  /** Coordonnées GPS : absentes du JSON-LD tant qu'elles ne sont pas vérifiées. */
  geo: null as { lat: number; lng: number } | null,

  maps: {
    directions: 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(addressQuery),
    search:
      'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent(`Le Duo d'Artisans ${addressQuery}`),
    embed: 'https://www.google.com/maps?q=' + encodeURIComponent(addressQuery) + '&output=embed',
  },

  /** Lien direct vers la fiche Google (null = recherche Maps construite depuis l'adresse). */
  googleBusinessUrl: null as string | null,

  social: { instagram: null as string | null, facebook: null as string | null },

  activities: ['Boulangerie', 'Pâtisserie', 'Viennoiserie', 'Chocolaterie', 'Confiserie', 'Glaces', 'Traiteur', 'Snacking'],

  legal: {
    name: 'LE DUO D’ARTISANS',
    form: 'SARL',
    siren: '987 907 607',
    siret: '987 907 607 00012',
    activity: 'Boulangerie et boulangerie-pâtisserie',
    /** Nom du directeur de la publication (null = mention du représentant légal). */
    director: null as string | null,
    host: { name: 'Vercel Inc.', address: '440 N Barranca Ave #4133, Covina, CA 91723, USA' },
  },
} as const;

export const nav = [
  { label: 'La Maison', href: '/la-maison' },
  { label: 'Savoir-faire', href: '/savoir-faire' },
  { label: 'Nos créations', href: '/nos-creations' },
  { label: 'Commandes', href: '/commandes' },
  { label: 'Contact', href: '/contact' },
] as const;

export const fullAddress = `${site.address.street}, ${site.address.postalCode} ${site.address.city}`;
export const reviewsUrl = site.googleBusinessUrl ?? site.maps.search;
