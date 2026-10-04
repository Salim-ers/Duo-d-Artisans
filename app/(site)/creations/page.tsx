import type { Metadata } from 'next';
import Link from 'next/link';
import '../pages.css';
import { media } from '@/data/media';
import { galleryCategories } from '@/lib/labels';
import { galleryItems } from '@/lib/site-data';
import { pageMetadata } from '@/lib/seo';
import { Gallery } from '@/components/creations/Gallery';
import { Split } from '@/components/ui/Split';
import { Arrow } from '@/components/ui/Arrow';

export const metadata: Metadata = pageMetadata({
  title: 'Nos créations — pains, pâtisseries, gâteaux',
  description:
    'Baguettes, viennoiseries, entremets, macarons, number cakes, snacking : les créations du Duo d’Artisans, boulangerie pâtisserie à Rantigny, en photos.',
  path: '/creations',
  image: media.vitrineEclairs,
});

export const revalidate = 300;

export default async function CreationsPage() {
  const items = await galleryItems();
  const used = new Set(items.map((i) => i.category));
  return (
    <>
      <section className="intro" aria-labelledby="cr-title">
        <div className="wrap intro-grid">
          <div>
            <span className="kicker">Galerie</span>
            <Split as="h1" id="cr-title" lines={['Nos', { em: 'créations.' }]} className="t-xxl" />
          </div>
          <p className="t-lead" data-reveal>
            Ce qui sort du fournil, ce qui passe en vitrine. La sélection change au fil des jours et des saisons.
          </p>
        </div>
      </section>
      <section className="creations" aria-label="Photographies">
        <Gallery
          items={items.map(({ id, src, width, height, alt, title, description, category }) => ({ id, src, width, height, alt, title, description, category }))}
          filters={galleryCategories.filter((c) => used.has(c.id)).map((c) => ({ id: c.id, label: c.label }))}
        />
      </section>
      <section className="next-row" aria-label="Pour aller plus loin">
        <div className="wrap next-grid">
          <Link className="next-link" href="/commander">
            <span>Pour une occasion</span>
            <b>
              Commander un gâteau <Arrow />
            </b>
          </Link>
          <Link className="next-link" href="/contact">
            <span>Passer en boutique</span>
            <b>
              Horaires et accès <Arrow />
            </b>
          </Link>
        </div>
      </section>
    </>
  );
}
