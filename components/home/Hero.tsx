import Link from 'next/link';
import { media } from '@/data/media';
import { site } from '@/data/site';
import { Photo } from '@/components/ui/Photo';
import { OpenNowLine } from '@/components/ui/OpenNow';
import { Arrow } from '@/components/ui/Arrow';

/**
 * Hero en « planche » de beau livre : la façade réelle, cadrée dans une marge
 * (jamais étirée au-delà de sa définition native de 1672 px), et un bloc-titre
 * posé à cheval sur le bas de l'image.
 */
export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-plate">
        <Photo
          image={media.facade}
          sizes="(max-width: 1520px) 100vw, 1440px"
          priority
          quality={82}
          position="50% 46%"
          reveal={false}
          className="hero-photo"
        />
        <p className="hero-caption" aria-hidden="true">7 rue Anatole France — Rantigny</p>
      </div>

      <div className="hero-block">
        <h1 id="hero-title" className="hero-title">
          <span className="hero-l1">Le Duo</span>
          <span className="hero-l2"><em>d’</em>Artisans</span>
        </h1>

        <div className="hero-aside">
          <p className="hero-baseline">
            Deux savoir-faire.
            <br />
            Une même passion.
          </p>
          <p className="hero-trades">
            Boulangerie · Pâtisserie · Snacking
            <br />
            {site.address.city}, {site.address.department}
          </p>
          <OpenNowLine />
          <p className="hero-actions">
            <Link className="lnk lnk--strong" href="/la-maison">Découvrir la maison <Arrow /></Link>
            <a className="lnk" href={site.maps.directions} target="_blank" rel="noopener noreferrer">Itinéraire <Arrow direction="up-right" /></a>
          </p>
        </div>
      </div>
    </section>
  );
}
