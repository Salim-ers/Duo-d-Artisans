import { site } from '@/data/site';
import { media } from '@/data/media';
import { openingHours } from '@/data/opening-hours';

const EN_DAYS: Record<number, string> = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Regroupe les jours aux horaires identiques (une spécification par plage). */
function hoursSpecification() {
  const groups = new Map<string, string[]>();
  for (const d of openingHours) {
    for (const i of d.intervals) {
      const key = `${i.open}-${i.close}`;
      groups.set(key, [...(groups.get(key) ?? []), EN_DAYS[d.day] ?? '']);
    }
  }
  return [...groups].map(([key, days]) => {
    const [opens, closes] = key.split('-');
    return { '@type': 'OpeningHoursSpecification', dayOfWeek: days, opens, closes };
  });
}

/**
 * JSON-LD Bakery (sous-type de LocalBusiness) — uniquement des données vérifiées :
 * nom, adresse, téléphone, horaires. Pas de note, pas de prix, pas de GPS non vérifié.
 */
export function bakerySchema() {
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
    openingHoursSpecification: hoursSpecification(),
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

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Accueil', path: '/' }, ...items].map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${site.url}${item.path === '/' ? '' : item.path}`,
    })),
  };
}

/** Sérialisation sûre pour <script type="application/ld+json"> (pas d'injection de </script>). */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
