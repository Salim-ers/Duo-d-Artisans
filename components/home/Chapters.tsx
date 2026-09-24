import Link from 'next/link';
import { chapters } from '@/data/products';
import { media } from '@/data/media';
import { Photo } from '@/components/ui/Photo';
import { Arrow } from '@/components/ui/Arrow';

/** Catalogue éditorial : six entrées numérotées, composées en alternance. */
export function Chapters() {
  return (
    <section className="chapters" aria-labelledby="chapters-title">
      <div className="wrap">
        <header className="chapters-head">
          <h2 id="chapters-title" className="t-l" data-reveal>Au fil<br />du comptoir.</h2>
          <p className="t-body" data-reveal style={{ ['--i' as string]: 1 }}>
            Ce que l’on trouve en boutique, du premier pain du matin à la dernière part de gâteau.
            La sélection évolue au fil des jours et des saisons.
          </p>
        </header>

        <ol className="chapter-list">
          {chapters.map((c, i) => (
            <li key={c.n} className={`chapter chapter--${i % 2 ? 'right' : 'left'}`}>
              <Photo image={media[c.image]} sizes="(max-width: 820px) 92vw, 50vw" className="chapter-photo" />
              <div className="chapter-text">
                <span className="chapter-n" aria-hidden="true">{c.n}</span>
                <h3 className="chapter-title" data-reveal>{c.title}</h3>
                <p className="chapter-line" data-reveal style={{ ['--i' as string]: 1 }}>{c.line}</p>
                <Link className="lnk" href={c.href}>{c.cta} <Arrow /></Link>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
