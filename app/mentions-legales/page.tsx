import type { Metadata } from 'next';
import { site, fullAddress } from '@/data/site';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales du site Le Duo d’Artisans, boulangerie-pâtisserie à Rantigny.',
  alternates: { canonical: '/mentions-legales' },
  robots: { index: false, follow: true },
};

export default function MentionsPage() {
  return (
    <section className="section bg-cream" style={{ paddingTop: 'calc(var(--space-section) + 70px)' }}>
      <div className="container" style={{ maxWidth: 820 }}>
        <h1 className="display d-l">Mentions légales</h1>

        <div className="lede" style={{ marginTop: 36, display: 'grid', gap: 28 }}>
          <div>
            <h2 className="info-label">Éditeur du site</h2>
            <p>{site.legal.name} — {site.legal.form}<br />{fullAddress}<br />Téléphone : {site.phone.display}</p>
          </div>
          <div>
            <h2 className="info-label">Immatriculation</h2>
            <p>SIREN {site.legal.siren} · SIRET {site.legal.siret}<br />Activité : {site.legal.activity}</p>
          </div>
          <div>
            <h2 className="info-label">Directeur de la publication</h2>
            <p>{site.legal.director ?? '[À compléter par la boutique]'}</p>
          </div>
          <div>
            <h2 className="info-label">Hébergement</h2>
            <p>{site.legal.host.name}<br />{site.legal.host.address}</p>
          </div>
          <div>
            <h2 className="info-label">Propriété intellectuelle</h2>
            <p>
              Les photographies présentées sur ce site ont été fournies par {site.legal.name} et sont
              protégées. Toute reproduction sans autorisation est interdite.
            </p>
          </div>
          <div>
            <h2 className="info-label">Crédits</h2>
            <p>Conception et développement : [agence à compléter]. Photographies : {site.legal.name}.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
