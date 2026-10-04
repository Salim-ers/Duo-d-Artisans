import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './admin.css';

export const metadata: Metadata = {
  title: { default: 'Gestion', template: '%s — Gestion Le Duo d’Artisans' },
  robots: { index: false, follow: false, nocache: true },
  manifest: '/admin.webmanifest',
};

export const viewport: Viewport = { themeColor: '#211912' };

export default function AdminRoot({ children }: { children: ReactNode }) {
  return <div className="adm-root">{children}</div>;
}
