import { site } from '@/data/site';
import { openingHours } from '@/data/opening-hours';

const EN_DAYS: Record<number, string> = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday',
};

/** JSON-LD LocalBusiness / Bakery — uniquement des données vérifiées. */
export function bakerySchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    '@id': `${site.url}/#bakery`,
    name: site.name,
    legalName: site.legal.name,
    description: site.shortDescription,
    url: site.url,
    telephone: site.phone.international.replace(/\s/g, ''),
    priceRange: '€',
    servesCuisine: ['Boulangerie', 'Pâtisserie', 'Viennoiserie', 'Snacking'],
    image: `${site.url}/images/facade/le-duo-artisans-rantigny-facade.webp`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      postalCode: site.address.postalCode,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      addressCountry: site.address.countryCode,
    },
    ...(site.geo ? { geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng } } : {}),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: site.reviews.rating,
      reviewCount: site.reviews.count,
      bestRating: 5,
    },
    openingHoursSpecification: openingHours
      .filter((d) => d.intervals.length > 0)
      .flatMap((d) =>
        d.intervals.map((i) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: EN_DAYS[d.day],
          opens: i.open,
          closes: i.close,
        })),
      ),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${site.url}${item.path}`,
    })),
  };
}
