import type { Metadata, Viewport } from 'next';
import { Newsreader, Manrope, Instrument_Serif } from 'next/font/google';
import './globals.css';

import { site } from '@/data/site';
import { media } from '@/data/media';

/** Sans l'axe de taille optique : polices deux fois plus légères. */
const serif = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400'],
  variable: '--f-serif',
  display: 'swap',
  // Textes courants seulement : pas de préchargement, l'image principale passe d'abord.
  preload: false,
});

/** Textes et interface : sans-serif contemporaine. */
const sans = Manrope({
  subsets: ['latin'],
  variable: '--f-sans',
  display: 'swap',
});

/** Serif d'affichage : uniquement pour les très grands titres (accueil, marque, pied de page). */
const display = Instrument_Serif({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: '400',
  variable: '--f-display',
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
  icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }] },
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#176A9A',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${serif.variable} ${sans.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
