import type { Metadata } from 'next';
import './home.css';
import { Hero } from '@/components/home/Hero';
import { Avis, Boutique, Duo, Fournil, Produits, Sale, SurMesure, Vitrine } from '@/components/home/Sections';
import { MotionRoot } from '@/components/home/motion';
import { JsonLd } from '@/components/ui/JsonLd';
import { websiteSchema } from '@/lib/schema';
import { shopData } from '@/lib/site-data';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/** Régénérée au plus toutes les 5 min, et immédiatement après chaque modification dans la gestion. */
export const revalidate = 300;

/**
 * Accueil — une idée forte par section, des photos entières :
 * hero (la devanture) → le duo → la vitrine → les créations → le fournil → sur mesure → le salé → les avis → la boutique.
 */
export default async function HomePage() {
  const shop = await shopData();
  return (
    <MotionRoot>
      <JsonLd data={websiteSchema()} />
      <Hero week={shop.week} exceptions={shop.exceptions} />
      <Duo />
      <Vitrine />
      <Produits />
      <Fournil />
      <SurMesure />
      <Sale />
      <Avis reviews={shop.reviews} />
      <Boutique week={shop.week} exceptions={shop.exceptions} />
    </MotionRoot>
  );
}
