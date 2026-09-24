import Link from 'next/link';
import type { Metadata } from 'next';
import { Arrow } from '@/components/ui/Arrow';

export const metadata: Metadata = { title: 'Page introuvable', robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <section className="lost wrap">
      <p className="lost-code" aria-hidden="true">404</p>
      <h1 className="t-xl">Cette page n’est plus<br /><em>en vitrine.</em></h1>
      <p className="t-lead">Elle a peut-être changé d’adresse. Le reste de la boutique vous attend.</p>
      <p className="lost-links">
        <Link className="lnk lnk--strong" href="/">Retour à l’accueil <Arrow /></Link>
        <Link className="lnk" href="/nos-creations">Nos créations <Arrow /></Link>
        <Link className="lnk" href="/contact">Horaires et accès <Arrow /></Link>
      </p>
    </section>
  );
}
