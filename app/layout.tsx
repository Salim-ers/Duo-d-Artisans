import type { Metadata, Viewport } from 'next';
import { Newsreader, Hanken_Grotesk } from 'next/font/google';
import './globals.css';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBar } from '@/components/layout/MobileBar';
import { Motion } from '@/components/layout/Motion';
import { site } from '@/data/site';
import { media } from '@/data/media';
import { bakerySchema, jsonLd } from '@/lib/schema';

const serif = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--f-serif',
  display: 'swap',
});

const sans = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--f-sans',
  display: 'swap',
});

const defaultTitle = 'Le Duo d’Artisans — Boulangerie pâtisserie à Rantigny (Oise)';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: defaultTitle, template: '%s | Le Duo d’Artisans' },
  description: site.shortDescription,
  applicationName: site.displayName,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: site.displayName,
    url: '/',
    title: defaultTitle,
    description: site.shortDescription,
    images: [{ url: media.facade.src, width: media.facade.width, height: media.facade.height, alt: media.facade.alt }],
  },
  twitter: { card: 'summary_large_image', title: defaultTitle, description: site.shortDescription, images: [media.facade.src] },
  manifest: '/site.webmanifest',
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#F3EDE2',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(bakerySchema()) }} />
        <a className="skip" href="#contenu">Aller au contenu</a>
        <Header />
        <main id="contenu" tabIndex={-1}>{children}</main>
        <Footer />
        <MobileBar />
        <Motion />
      </body>
    </html>
  );
}
