import Link from 'next/link';
import Image from 'next/image';
import { media } from '@/data/media';
import type { Interval } from '@/data/opening-hours';
import type { DayException } from '@/lib/hours';
import { OpenNowLine } from '@/components/ui/OpenNow';
import { Arrow } from '@/components/ui/Arrow';

/** Découpe un mot en lettres animées (le texte lisible est porté par .sr-only). */
function Letters({ text, from = 0 }: { text: string; from?: number }) {
  return (
    <>
      {[...text].map((ch, i) => (
        <span key={i} className="hero-ch" style={{ ['--c' as string]: from + i }}>
          {ch === ' ' ? '\u00a0' : ch}
        </span>
      ))}
    </>
  );
}

/** Bandeau défilant : des mots seulement (aucune photo, pour ne rien répéter de la page). */
const ribbon = ['Baguettes', 'Viennoiseries', 'Grands macarons', 'Entremets', 'Number cakes', 'Sandwichs', 'Cookies garnis'];

/**
 * La devanture, image carrée 3200 px : en paysage elle couvre la largeur, sur téléphone la hauteur.
 * `sizes` suit ce comportement pour que le navigateur charge une image assez grande (net sur écran Retina).
 */
function HeroPicture() {
  return (
    <Image
      src={media.devanture.src}
      alt={media.devanture.alt}
      fill
      priority
      quality={90}
      sizes="(max-aspect-ratio: 1/1) 100vh, 100vw"
    />
  );
}

/**
 * Hero plein cadre : l'image s'ouvre comme une vitrine en arche, le nom se compose lettre à lettre,
 * puis la vitrine du jour défile. Tout est en CSS : sans JavaScript, le hero s'affiche dans son état final.
 */
export function Hero({ week, exceptions }: { week: Interval[][]; exceptions: DayException[] }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-stage">
        <div className="hero-media">
          <div className="photo hero-photo">
            <HeroPicture />
          </div>
        </div>
        <div className="hero-veil" aria-hidden="true" />

        <p className="hero-kicker">
          <span>Boulangerie · Pâtisserie · Gourmandise</span>
          <span>Rantigny · Oise</span>
        </p>

        <div className="hero-content">
          <h1 id="hero-title" className="hero-title">
            <span className="sr-only">Le Duo d’Artisans</span>
            <span className="hero-line" aria-hidden="true">
              <Letters text="Le Duo" />
            </span>
            <span className="hero-line hero-line--2" aria-hidden="true">
              <em>
                <Letters text="d’" from={6} />
              </em>
              <Letters text="Artisans" from={8} />
            </span>
          </h1>

          <div className="hero-aside">
            <p className="hero-baseline">
              Deux savoir-faire.
              <br />
              <em>Une même passion.</em>
            </p>
            <OpenNowLine week={week} exceptions={exceptions} className="hero-now" />
            <p className="hero-actions">
              <Link className="btn btn--light" href="/commander">
                Commander un gâteau <Arrow />
              </Link>
              <Link className="btn btn--line-light" href="/creations">
                Découvrir nos créations
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="hero-ribbon" aria-hidden="true">
        <div className="hero-ribbon-track">
          {[0, 1].map((copy) => (
            <ul key={copy}>
              {ribbon.map((word) => (
                <li key={word}>
                  {word}
                  <svg className="hero-ribbon-star" viewBox="0 0 20 20">
                    <path d="M10 1v18M1 10h18M3.6 3.6l12.8 12.8M16.4 3.6 3.6 16.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
