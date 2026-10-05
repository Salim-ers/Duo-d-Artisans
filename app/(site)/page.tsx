import type { Metadata } from 'next';
import './home.css';
import { Hero } from '@/components/home/Hero';
import { Duo, Maison, Occasions, Pause, Proof, Vitrine, fixedHomePhotos } from '@/components/home/Sections';
import { MotionRoot } from '@/components/home/motion';
import { JsonLd } from '@/components/ui/JsonLd';
import { websiteSchema } from '@/lib/schema';
import { homeGallery, shopData } from '@/lib/site-data';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/** Régénérée au plus toutes les 5 min, et immédiatement après chaque modification dans la gestion. */
export const revalidate = 300;

/**
 * Accueil — une idée forte par section :
 * hero gourmand → deux savoir-faire → la vitrine → respiration plein écran
 * → les jours qui comptent → la preuve → la maison.
 */
export default async function HomePage() {
  // La vitrine montre les créations (pas la boutique) et jamais une photo déjà utilisée ailleurs sur la page.
  const [shop, gallery] = await Promise.all([shopData(), homeGallery(fixedHomePhotos, 6, ['boutique'])]);
  return (
    <MotionRoot>
      <JsonLd data={websiteSchema()} />
      <Hero week={shop.week} exceptions={shop.exceptions} />
      <Duo />
      <Vitrine items={gallery} />
      <div className="ps-wrap">
        <Pause />
        <Occasions />
      </div>
      <Proof reviews={shop.reviews} />
      <Maison week={shop.week} exceptions={shop.exceptions} />
    </MotionRoot>
  );
}
