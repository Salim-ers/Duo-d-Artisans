import Link from 'next/link';
import { media } from '@/data/media';
import { Photo } from '@/components/ui/Photo';
import { Arrow } from '@/components/ui/Arrow';

const trades = [
  { id: 'boulangerie', title: 'Boulangerie', line: 'Le quotidien, croustillant.', image: media.baguettesTradition, href: '/nos-creations?filtre=pain', cta: 'Le pain et la viennoiserie' },
  { id: 'patisserie', title: 'Pâtisserie', line: 'L’instant gourmand.', image: media.vitrineEclairs, href: '/nos-creations?filtre=patisserie', cta: 'La pâtisserie' },
];

/**
 * Signature du site : l'écran coupé en deux métiers.
 * Desktop : la moitié survolée (ou focalisée au clavier) passe de 50 % à 65 %.
 * Mobile : deux panneaux empilés, entièrement utilisables sans survol.
 */
export function Trades() {
  return (
    <section className="trades" aria-labelledby="trades-title">
      <div className="wrap trades-head">
        <h2 id="trades-title" className="t-l" data-reveal>Deux métiers,<br /><em>une seule maison.</em></h2>
        <p className="t-body" data-reveal style={{ ['--i' as string]: 1 }}>
          Le pain et la viennoiserie d’un côté, la pâtisserie et les gourmandises de l’autre,
          et de quoi composer son déjeuner entre les deux.
        </p>
      </div>

      <div className="trades-split">
        {trades.map((t) => (
          <Link key={t.id} className={`trade trade--${t.id}`} href={t.href}>
            <Photo image={t.image} sizes="(max-width: 820px) 100vw, 65vw" reveal={false} className="trade-photo" />
            <span className="trade-body">
              <span className="trade-title">{t.title}</span>
              <span className="trade-line">{t.line}</span>
              <span className="trade-cta">{t.cta} <Arrow /></span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
