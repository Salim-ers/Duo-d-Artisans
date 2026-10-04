import type { Metadata } from 'next';
import './home.css';
import { Hero } from '@/components/home/Hero';
import { Categories, CreationsMosaic, Duo, EventBanner, OrderTeaser, Practical, Reviews } from '@/components/home/Sections';
import { JsonLd } from '@/components/ui/JsonLd';
import { listCategories } from '@/lib/catalog';
import { activeEvents, featuredProducts, galleryItems } from '@/lib/content';
import { websiteSchema } from '@/lib/schema';
import { shopData } from '@/lib/site-data';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/** Régénérée au plus toutes les 5 min, et immédiatement après chaque modification dans la gestion. */
export const revalidate = 300;

export default async function HomePage() {
  const [shop, categories, gallery, featured, events] = await Promise.all([shopData(), listCategories(), galleryItems(true), featuredProducts(4), activeEvents()]);
  const event = events[0];
  return (
    <>
      <JsonLd data={websiteSchema()} />
      <Hero week={shop.week} exceptions={shop.exceptions} />
      <Categories categories={categories} />
      {event && <EventBanner event={event} />}
      <CreationsMosaic items={gallery} />
      <OrderTeaser products={featured} orderingOpen={shop.orderingOpen} />
      <Duo />
      <Reviews reviews={shop.reviews} />
      <Practical week={shop.week} exceptions={shop.exceptions} />
    </>
  );
}
