import type { Metadata } from 'next';
import { Hero } from '@/components/home/Hero';
import { Morning } from '@/components/home/Morning';
import { Trades } from '@/components/home/Trades';
import { Chapters } from '@/components/home/Chapters';
import { Vitrine } from '@/components/home/Vitrine';
import { Day } from '@/components/home/Day';
import { Craft } from '@/components/home/Craft';
import { Reviews } from '@/components/home/Reviews';
import { Practical } from '@/components/sections/Practical';
import { JsonLd } from '@/components/ui/JsonLd';
import { websiteSchema } from '@/lib/schema';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={websiteSchema()} />
      <Hero />
      <Morning />
      <Trades />
      <Chapters />
      <Vitrine />
      <Day />
      <Craft />
      <Reviews />
      <Practical />
    </>
  );
}
