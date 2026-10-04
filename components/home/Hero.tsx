import Link from 'next/link';
import Image, { getImageProps } from 'next/image';
import { preload } from 'react-dom';
import { media, type MediaKey } from '@/data/media';
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

const ribbon: { word: string; image: MediaKey }[] = [
  { word: 'Baguettes', image: 'baguettesTradition' },
  { word: 'Viennoiseries', image: 'painsChocolat' },
  { word: 'Grands macarons', image: 'macarons' },
  { word: 'Entremets', image: 'entremets' },
  { word: 'Number cakes', image: 'numberCake' },
  { word: 'Sandwichs', image: 'sandwichs' },
  { word: 'Cookies garnis', image: 'cookies' },
];

/** Écrans plus larges que hauts : cadrage paysage ; sinon (téléphones, tablettes en portrait) : cadrage portrait. */
const WIDE = '(min-aspect-ratio: 1/1)';
const TALL = '(max-aspect-ratio: 1/1)';

/** Image 4K en deux cadrages, optimisée par next/image (AVIF / WebP à la bonne largeur). */
function HeroPicture() {
  const common = { alt: media.heroLandscape.alt, fill: true, sizes: '100vw', quality: 82 } as const;
  const wide = getImageProps({ ...common, src: media.heroLandscape.src }).props;
  const { srcSet: tall, ...img } = getImageProps({ ...common, src: media.heroPortrait.src }).props;
  // Préchargement de la seule variante utile à l'écran (image principale = LCP).
  preload(wide.src, { as: 'image', imageSrcSet: wide.srcSet, imageSizes: '100vw', fetchPriority: 'high', media: WIDE });
  preload(img.src, { as: 'image', imageSrcSet: tall, imageSizes: '100vw', fetchPriority: 'high', media: TALL });
  return (
    <picture>
      <source media={WIDE} srcSet={wide.srcSet} sizes="100vw" />
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <img {...img} srcSet={tall} fetchPriority="high" loading="eager" />
    </picture>
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
              {ribbon.map((item) => (
                <li key={item.word}>
                  <span className="hero-ribbon-thumb">
                    <Image src={media[item.image].src} alt="" fill sizes="64px" quality={70} />
                  </span>
                  {item.word}
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
