import { site } from '@/data/site';
import { media } from '@/data/media';
import type { Interval } from '@/data/opening-hours';

const EN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Regroupe les jours aux horaires identiques (une spécification par plage). */
function hoursSpecification(week: Interval[][]) {
  const groups = new Map<string, string[]>();
  week.forEach((intervals, day) => {
    for (const i of intervals) {
      const key = `${i.open}-${i.close}`;
      groups.set(key, [...(groups.get(key) ?? []), EN_DAYS[day] ?? '']);
    }
  });
  return [...groups].map(([key, days]) => {
    const [opens, closes] = key.split('-');
    return { '@type': 'OpeningHoursSpecification', dayOfWeek: days, opens, closes };
  });
}

/**
 * JSON-LD Bakery (sous-type de LocalBusiness) — uniquement des données vérifiées :
 * nom, adresse, téléphone, horaires enregistrés. Pas de note (avis auto-déclarés interdits), pas de GPS non vérifié.
 */
export function bakerySchema(week: Interval[][]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    '@id': `${site.url}/#boulangerie`,
    name: site.name,
    legalName: site.legal.name,
    description: site.shortDescription,
    url: site.url,
    telephone: site.phone.international,
    image: `${site.url}${media.facade.src}`,
    hasMap: site.googleBusinessUrl ?? site.maps.search,
    servesCuisine: 'Boulangerie, pâtisserie',
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      postalCode: site.address.postalCode,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      addressCountry: site.address.countryCode,
    },
    ...(site.geo ? { geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng } } : {}),
    areaServed: { '@type': 'City', name: site.address.city },
    openingHoursSpecification: hoursSpecification(week),
    potentialAction: {
      '@type': 'OrderAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${site.url}/commander`, inLanguage: 'fr-FR', actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'] },
      deliveryMethod: 'http://purl.org/goodrelations/v1#DeliveryModePickUp',
    },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#site`,
    name: site.name,
    url: site.url,
    inLanguage: 'fr-FR',
    publisher: { '@id': `${site.url}/#boulangerie` },
  };
}

/** Liste de produits réels (jamais les exemples) avec leur prix, pour /commander. */
export function productListSchema(products: { name: string; description: string | null; image: string | null; priceCents: number; slug: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.name,
        ...(p.description ? { description: p.description } : {}),
        ...(p.image && !p.image.startsWith('http') ? { image: `${site.url}${p.image}` } : {}),
        offers: {
          '@type': 'Offer',
          price: (p.priceCents / 100).toFixed(2),
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStoreOnly',
          url: `${site.url}/commander#${p.slug}`,
          seller: { '@id': `${site.url}/#boulangerie` },
        },
      },
    })),
  };
}

/** Sérialisation sûre pour <script type="application/ld+json"> (pas d'injection de </script>). */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
