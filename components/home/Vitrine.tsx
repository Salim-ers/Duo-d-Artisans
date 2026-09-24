import Link from 'next/link';
import { media, type MediaKey } from '@/data/media';
import { Photo } from '@/components/ui/Photo';
import { Rail } from './Rail';
import { Arrow } from '@/components/ui/Arrow';

/** Proportions volontairement variées : paysage, carré, portrait recadré. */
const pieces: { key: MediaKey; name: string; shape: 'wide' | 'square' | 'tall' }[] = [
  { key: 'vitrineEclairs', name: 'Éclairs, Paris-Brest, tartes', shape: 'wide' },
  { key: 'macarons', name: 'Grands macarons', shape: 'tall' },
  { key: 'gateauFruits', name: 'Gâteau aux fruits frais', shape: 'square' },
  { key: 'vitrineFlans', name: 'Flans, macarons, tartelettes', shape: 'wide' },
  { key: 'flans', name: 'Flans individuels', shape: 'tall' },
  { key: 'entremets', name: 'Entremets citron & framboise', shape: 'square' },
  { key: 'vitrinePatisseries', name: 'La vitrine du jour', shape: 'wide' },
  { key: 'cookies', name: 'Cookies garnis', shape: 'tall' },
];

const sizes = { wide: '(max-width: 820px) 88vw, 46vw', square: '(max-width: 820px) 70vw, 30vw', tall: '(max-width: 820px) 62vw, 24vw' };

export function Vitrine() {
  return (
    <section className="vitrine" aria-labelledby="vitrine-title">
      <div className="wrap vitrine-head">
        <h2 id="vitrine-title" className="t-l" data-reveal>La vitrine</h2>
        <p className="t-body" data-reveal style={{ ['--i' as string]: 1 }}>
          Elle change au fil des jours. Voici ce qu’on a pu y voir.
        </p>
        <Link className="lnk lnk--light" href="/nos-creations">Toutes les créations <Arrow /></Link>
      </div>

      <Rail label="La vitrine en photos — faites défiler horizontalement">
        {pieces.map((p) => (
          <figure key={p.key} className={`piece piece--${p.shape}`}>
            <Photo image={media[p.key]} sizes={sizes[p.shape]} reveal={false} className="piece-photo" />
            <figcaption>{p.name}</figcaption>
          </figure>
        ))}
      </Rail>
    </section>
  );
}
