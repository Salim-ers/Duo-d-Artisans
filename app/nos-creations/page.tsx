import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHero } from '@/components/sections/PageHero';
import { CreationsCatalogue } from '@/components/sections/CreationsCatalogue';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { SectionMark } from '@/components/ui/SectionMark';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { media } from '@/data/media';

export const metadata: Metadata = {
  title: 'Nos créations',
  description:
    'Pains, viennoiseries, pâtisseries, gâteaux, snacking, salades et gourmandises du Duo d’Artisans à Rantigny. Disponibilités variables selon les jours.',
  alternates: { canonical: '/nos-creations' },
};

export default function CreationsPage() {
  return (
    <>
      <PageHero
        crumb="Nos créations"
        title={<>Ce qu’il y a<br />dans la vitrine.</>}
        lede="Un aperçu de ce que l’on trouve en boutique. La sélection évolue au fil des jours et des saisons."
        image={media.vitrineFlans}
        position="center 55%"
      />

      <section className="section bg-cream">
        <div className="container">
          <Suspense fallback={<p className="lede">Chargement des créations…</p>}>
            <CreationsCatalogue />
          </Suspense>
          <p className="form-note" style={{ marginTop: 34 }}>
            Les disponibilités varient selon les jours. Pour une pièce particulière ou une commande,
            le plus simple reste d’appeler la boutique.
          </p>
        </div>
      </section>

      <section className="section bg-paper" id="galerie">
        <div className="container">
          <div className="tl-head">
            <div>
              <SectionMark>Galerie</SectionMark>
              <h2 className="display d-l reveal" data-delay=".06s">La boutique,<br />en images</h2>
            </div>
          </div>
          <GalleryGrid />
        </div>
      </section>

      <FinalCTA />
    </>
  );
}
