import Image from 'next/image';
import Link from 'next/link';
import { media } from '@/data/media';
import { SectionMark } from '@/components/ui/SectionMark';
import { Arrow } from '@/components/ui/Arrow';

const gestures = ['Pétrir', 'Façonner', 'Cuire', 'Dresser', 'Partager'];

export function CraftWords() {
  return (
    <section className="section bg-blue grain on-blue craft">
      <div className="container craft-grid">
        <figure className="craft-media clip" style={{ margin: 0 }}>
          <Image
            src={media.petrin.src}
            alt={media.petrin.alt}
            fill
            sizes="(max-width:1100px) 100vw, 42vw"
            data-parallax
            style={{ objectFit: 'cover' }}
          />
        </figure>

        <div>
          <SectionMark>Savoir-faire</SectionMark>
          <h2 className="display d-l reveal" data-delay=".06s" style={{ color: 'var(--paper)' }}>
            Derrière chaque vitrine,<br />il y a des gestes.
          </h2>
          <p className="lede reveal" data-delay=".12s" style={{ marginTop: 24 }}>
            Pétrir. Façonner. Cuire. Dresser. Recommencer le lendemain, à la même heure.
          </p>

          <div className="craft-words">
            {gestures.map((word, i) => (
              <p className="craft-word" key={word}>
                <span className="i">{String(i + 1).padStart(2, '0')}</span>
                {word}
              </p>
            ))}
          </div>

          <p className="reveal" style={{ marginTop: 34 }}>
            <Link className="btn btn--light" href="/savoir-faire">Voir le savoir-faire<Arrow /></Link>
          </p>
        </div>
      </div>
    </section>
  );
}
