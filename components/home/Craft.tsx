import Link from 'next/link';
import { media, type MediaKey } from '@/data/media';
import { Photo } from '@/components/ui/Photo';
import { Arrow } from '@/components/ui/Arrow';

const steps: { word: string; image: MediaKey }[] = [
  { word: 'La pâte', image: 'petrin' },
  { word: 'La fournée', image: 'baguettesFournil' },
  { word: 'Le feuilletage', image: 'painsChocolat' },
  { word: 'La finition', image: 'entremets' },
  { word: 'La vitrine', image: 'vitrineEclairs' },
];

/** Savoir-faire : très grands chiffres, vraies photos, presque pas de texte. */
export function Craft() {
  return (
    <section className="craft" aria-labelledby="craft-title">
      <div className="wrap">
        <header className="craft-head">
          <h2 id="craft-title" className="t-xl" data-reveal>Avant la vitrine,<br /><em>il y a le geste.</em></h2>
          <Link className="lnk lnk--light" href="/savoir-faire">Le savoir-faire, étape par étape <Arrow /></Link>
        </header>

        <ol className="craft-grid">
          {steps.map((s, i) => (
            <li key={s.word} className={`craft-item craft-item--${i + 1}`}>
              <span className="craft-n" aria-hidden="true" data-reveal="fade">{String(i + 1).padStart(2, '0')}</span>
              <Photo image={media[s.image]} sizes="(max-width: 820px) 80vw, 34vw" className="craft-photo" />
              <p className="craft-word">{s.word}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
