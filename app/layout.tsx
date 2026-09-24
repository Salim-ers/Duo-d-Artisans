import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Manrope } from 'next/font/google';
import './globals.css';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBar } from '@/components/layout/MobileBar';
import { Loader } from '@/components/layout/Loader';
import { Motion } from '@/components/animations/Motion';
import { site } from '@/data/site';
import { bakerySchema } from '@/lib/schema';

const display = Instrument_Serif({
  subsets: ['latin'], weight: ['400'], style: ['normal', 'italic'],
  variable: '--font-display-next', display: 'swap',
});

const ui = Manrope({
  subsets: ['latin'], weight: ['400', '500', '600', '700'],
  variable: '--font-ui-next', display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: 'Le Duo d’Artisans | Boulangerie Pâtisserie à Rantigny',
    template: '%s | Le Duo d’Artisans',
  },
  description: site.shortDescription,
  alternates: { canonical: '/' },
  keywords: [
    'boulangerie Rantigny', 'boulangerie pâtisserie Rantigny', 'pâtisserie Rantigny',
    'boulangerie Oise', 'sandwich Rantigny', 'snacking Rantigny', 'gâteau anniversaire Rantigny',
    'Le Duo d’Artisans Rantigny',
  ],
  openGraph: {
    type: 'website', locale: 'fr_FR', siteName: site.name, url: site.url,
    title: 'Le Duo d’Artisans | Boulangerie Pâtisserie à Rantigny',
    description: site.shortDescription,
    images: [{ url: '/images/facade/le-duo-artisans-rantigny-facade.webp', width: 1672, height: 941, alt: 'Façade du Duo d’Artisans à Rantigny' }],
  },
  twitter: { card: 'summary_large_image' },
  manifest: '/site.webmanifest',
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#1E6489',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${ui.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(bakerySchema()) }}
        />
        <Loader />
        <a className="skip" href="#contenu">Aller au contenu</a>
        <Header />
        <main id="contenu">{children}</main>
        <Footer />
        <MobileBar />
        <Motion />
      </body>
    </html>
  );
}
