import Link from 'next/link';
import { media } from '@/data/media';
import type { Interval } from '@/data/opening-hours';
import type { DayException } from '@/lib/hours';
import { OpenNowLine } from '@/components/ui/OpenNow';
import { Arrow } from '@/components/ui/Arrow';
import { Shot } from '@/components/ui/Shot';
import { Strip } from './Strip';

/** Photo du hero : la vraie devanture. Exportée pour ne jamais la répéter plus bas. */
export const heroPhoto = media.facade;

/**
 * Hero « la devanture » : le bandeau bleu (le nom en très grand) puis la vraie façade, ENTIÈRE,
 * en pleine largeur, sans voile ni zoom. Les boutons sont posés sur le trottoir, jamais sur la façade.
 */
export function Hero({ week, exceptions }: { week: Interval[][]; exceptions: DayException[] }) {
  return (
    <section className="hx" aria-labelledby="hx-title">
      <div className="hx-band" data-masthead-over>
        <div className="wrap hx-top">
          <p className="hx-kicker">
            Boulangerie <span aria-hidden="true">·</span> Pâtisserie
            <span className="hx-place">Rantigny, Oise</span>
          </p>
          <OpenNowLine week={week} exceptions={exceptions} className="hx-now" />
        </div>
        <div className="wrap hx-row">
          <h1 id="hx-title" className="hx-title">
            <span className="hx-line">
              <span>Le Duo</span>
            </span>{' '}
            <span className="hx-line hx-line--2">
              <span>d’Artisans</span>
            </span>
          </h1>
          <p className="hx-tag">
            Le pain. La pâtisserie.
            <br />
            <em>Et tout ce qu’il y a entre les deux.</em>
          </p>
        </div>
      </div>

      <div className="hx-stage">
        <Strip label="La devanture en photo : faites glisser pour la parcourir" className="hx-strip">
          <Shot image={heroPhoto} priority reveal={false} quality={95} sizes="(max-width: 899px) 790px, 100vw" className="hx-shot" />
        </Strip>
        <p className="hx-swipe" aria-hidden="true">
          Faites glisser pour parcourir la devanture
        </p>
        <div className="hx-actions">
          <a className="hx-btn hx-btn--light" href="#maison">
            Découvrir la maison
          </a>
          <Link className="hx-btn" href="/commander">
            Commander un gâteau <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}
