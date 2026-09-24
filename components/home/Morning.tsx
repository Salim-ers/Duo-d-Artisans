import { media } from '@/data/media';
import { Photo } from '@/components/ui/Photo';

const gestures = ['Pétrir', 'Façonner', 'Fermenter', 'Cuire', 'Dresser'];

/** « Le matin commence ici » : on entre dans le fournil. */
export function Morning() {
  return (
    <section className="morning" aria-labelledby="morning-title">
      <div className="wrap morning-grid">
        <p className="morning-vertical" aria-hidden="true">Chaque matin recommence ici</p>

        <div className="morning-media">
          <Photo image={media.baguettesFournil} sizes="(max-width: 820px) 92vw, 52vw" className="morning-main" position="50% 55%" />
          <Photo image={media.petrin} sizes="(max-width: 820px) 46vw, 20vw" className="morning-inset" />
        </div>

        <div className="morning-copy">
          <h2 id="morning-title" className="t-l" data-reveal>
            Le matin
            <br />
            commence ici.
          </h2>
          <p className="t-lead" data-reveal style={{ ['--i' as string]: 1 }}>
            Il commence par le parfum du pain chaud. La journée continue derrière la vitrine.
            Entre les deux : du temps, des gestes et beaucoup de gourmandise.
          </p>

          <ol className="gestures">
            {gestures.map((g, i) => (
              <li key={g} data-reveal="slide" style={{ ['--i' as string]: i }}>
                <span className="gestures-n">{String(i + 1).padStart(2, '0')}</span>
                {g}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
