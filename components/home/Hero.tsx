import Link from 'next/link';
import Image from 'next/image';
import { media, type MediaKey } from '@/data/media';
import { site } from '@/data/site';
import { Photo } from '@/components/ui/Photo';
import { OpenNowLine } from '@/components/ui/OpenNow';
import { Arrow } from '@/components/ui/Arrow';

/** Découpe un mot en lettres animées (le texte lisible est porté par .sr-only). */
function Letters({ text, from = 0 }: { text: string; from?: number }) {
  return (
    <>
      {[...text].map((ch, i) => (
        <span key={i} className="hero-ch" style={{ ['--c' as string]: from + i }}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </>
  );
}

const ribbon: { word: string; image: MediaKey }[] = [
  { word: 'Baguettes', image: 'baguettesTradition' },
  { word: 'Viennoiseries', image: 'painsChocolat' },
  { word: 'Grands macarons', image: 'macarons' },
  { word: 'Entremets', image: 'entremets' },
  { word: 'Number cakes', image: 'numberCake' },
  { word: 'Sandwichs', image: 'sandwichs' },
  { word: 'Cookies garnis', image: 'cookies' },
];

const badge = 'Boulangerie · Pâtisserie · Rantigny · Depuis le fournil · ';

/**
 * Hero plein cadre : la façade s'ouvre comme une vitrine en arche, le nom se
 * compose lettre à lettre, puis un bandeau fait défiler la vitrine du jour.
 * Tout est en CSS (intro + effets liés au scroll là où le navigateur les gère) :
 * sans JavaScript, le hero s'affiche simplement dans son état final.
 */
export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-stage">
        <div className="hero-media">
          <Photo
            image={media.facade}
            sizes="(max-aspect-ratio: 3/2) 150vh, 100vw"
            priority
            quality={82}
            position="50% 38%"
            reveal={false}
            className="hero-photo"
          />
        </div>
        <div className="hero-veil" aria-hidden="true" />

        <p className="hero-kicker">
          <span>Boulangerie · Pâtisserie · Snacking</span>
          <span>7 rue Anatole France — {site.address.city}</span>
        </p>

        <div className="hero-content">
          <h1 id="hero-title" className="hero-title">
            <span className="sr-only">Le Duo d’Artisans</span>
            <span className="hero-line" aria-hidden="true"><Letters text="Le Duo" /></span>
            <span className="hero-line hero-line--2" aria-hidden="true">
              <em><Letters text="d’" from={6} /></em>
              <Letters text="Artisans" from={8} />
            </span>
          </h1>

          <div className="hero-aside">
            <p className="hero-baseline">
              Deux savoir-faire.
              <br />
              <em>Une même passion.</em>
            </p>
            <OpenNowLine />
            <p className="hero-actions">
              <Link className="btn btn--light" href="/nos-creations">Nos créations <Arrow /></Link>
              <a className="lnk lnk--light" href={site.maps.directions} target="_blank" rel="noopener noreferrer">
                Itinéraire <Arrow direction="up-right" />
              </a>
            </p>
          </div>
        </div>

        <a className="hero-badge" href="#le-matin" aria-label="Faire défiler vers la suite">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <defs>
              <path id="hero-badge-path" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
            </defs>
            <text>
              <textPath href="#hero-badge-path" textLength="486">{badge}</textPath>
            </text>
          </svg>
          <span className="hero-badge-arrow" aria-hidden="true">
            <svg viewBox="0 0 10 22"><path d="M5 0v20M1 16l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
          </span>
        </a>
      </div>

      <div className="hero-ribbon" aria-hidden="true">
        <div className="hero-ribbon-track">
          {[0, 1].map((copy) => (
            <ul key={copy}>
              {ribbon.map((item) => (
                <li key={item.word}>
                  <span className="hero-ribbon-thumb">
                    <Image src={media[item.image].src} alt="" fill sizes="64px" quality={75} />
                  </span>
                  {item.word}
                  <i>✳</i>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
