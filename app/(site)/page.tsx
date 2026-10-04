import type { Metadata } from 'next';
import './home.css';
import { Hero } from '@/components/home/Hero';
import { CakeTeaser, Categories, CreationsMosaic, Duo, Practical, Reviews } from '@/components/home/Sections';
import { JsonLd } from '@/components/ui/JsonLd';
import { websiteSchema } from '@/lib/schema';
import { galleryItems, shopData } from '@/lib/site-data';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/** Régénérée au plus toutes les 5 min, et immédiatement après chaque modification dans la gestion. */
export const revalidate = 300;

export default async function HomePage() {
  const [shop, gallery] = await Promise.all([shopData(), galleryItems(true)]);
  return (
    <>
      <JsonLd data={websiteSchema()} />
      <Hero week={shop.week} exceptions={shop.exceptions} />
      <Categories />
      <CreationsMosaic items={gallery} />
      <CakeTeaser />
      <Duo />
      <Reviews reviews={shop.reviews} />
      <Practical week={shop.week} exceptions={shop.exceptions} />
    </>
  );
}
