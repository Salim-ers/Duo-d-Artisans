import type { Metadata } from 'next';
import { site } from '@/data/site';
import { media, type Media } from '@/data/media';

type PageSeo = {
  /** Titre court : le suffixe « | Le Duo d'Artisans » est ajouté par le layout. */
  title: string;
  description: string;
  path: string;
  image?: Media;
  noindex?: boolean;
};

/** Métadonnées complètes d'une page : canonical, Open Graph, Twitter. */
export function pageMetadata({ title, description, path, image = media.facade, noindex }: PageSeo): Metadata {
  const ogTitle = `${title} | ${site.displayName}`;
  const images = [{ url: image.src, width: image.width, height: image.height, alt: image.alt }];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      siteName: site.displayName,
      url: path,
      title: ogTitle,
      description,
      images,
    },
    twitter: { card: 'summary_large_image', title: ogTitle, description, images: [image.src] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
