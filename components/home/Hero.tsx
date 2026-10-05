import Link from 'next/link';
import Image from 'next/image';
import { media } from '@/data/media';
import type { Interval } from '@/data/opening-hours';
import type { DayException } from '@/lib/hours';
import { OpenNowLine } from '@/components/ui/OpenNow';
import { Arrow } from '@/components/ui/Arrow';

/** Photo du hero : la vitrine de la boutique. Exportée pour ne jamais la répéter plus bas. */
export const heroPhoto = media.vitrineEclairs;

/**
 * Hero éditorial : un panneau bleu nuit (la couleur de la devanture), une grande photo qui donne faim,
 * et le nom en très grand qui franchit la frontière entre les deux — le « duo » comme signature.
 * Tout le mouvement est en CSS (aucun JavaScript nécessaire pour afficher la page).
 */
export function Hero({ week, exceptions }: { week: Interval[][]; exceptions: DayException[] }) {
  return (
    <section className="hx" aria-labelledby="hx-title">
      <div className="hx-photo" data-masthead-over>
        <Image src={heroPhoto.src} alt={heroPhoto.alt} fill priority fetchPriority="high" quality={90} sizes="(max-width: 899px) 100vw, 64vw" />
        <p className="hx-caption" aria-hidden="true">
          La vitrine <span>Le Duo d’Artisans</span>
        </p>
      </div>

      <div className="hx-panel">
        <p className="hx-kicker">
          <span>
            Boulangerie <b>×</b> Pâtisserie
          </span>
          <span>Rantigny · Oise</span>
        </p>

        <h1 id="hx-title" className="hx-title">
          <span className="sr-only">Le Duo d’Artisans, boulangerie pâtisserie à Rantigny</span>
          <span className="hx-line" aria-hidden="true">
            <span>Le Duo</span>
          </span>
          <span className="hx-line hx-line--2" aria-hidden="true">
            <span>
              <em>d’</em>Artisans
            </span>
          </span>
        </h1>

        <div className="hx-foot">
          <p className="hx-line-text">
            Le pain. La pâtisserie.
            <br />
            <em>Et tout ce qu’il y a entre les deux.</em>
          </p>
          <div className="hx-actions">
            <Link className="hx-cta" href="/commander">
              Commander un gâteau <Arrow />
            </Link>
            <a className="hx-more" href="#vitrine">
              La vitrine
            </a>
          </div>
          <OpenNowLine week={week} exceptions={exceptions} className="hx-now" />
        </div>
      </div>
    </section>
  );
}
