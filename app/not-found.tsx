import Link from 'next/link';
import type { Metadata } from 'next';
import { Arrow } from '@/components/ui/Arrow';

export const metadata: Metadata = { title: 'Page introuvable', robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <section className="section bg-deep grain final" style={{ minHeight: '78vh', display: 'grid', placeItems: 'center' }}>
      <div className="container b">
        <p className="mark" style={{ justifyContent: 'center', color: '#9EC7DF' }}>Erreur 404</p>
        <h1 className="display d-xl">Oups.<br />Cette gourmandise n’est plus en vitrine.</h1>
        <p className="lede sub">La page a peut-être changé d’adresse. Le reste de la boutique vous attend.</p>
        <div className="final-actions">
          <Link className="btn btn--light" href="/">Retourner à l’accueil<Arrow /></Link>
          <Link className="btn btn--outline-light" href="/nos-creations">Voir nos créations</Link>
        </div>
      </div>
    </section>
  );
}
