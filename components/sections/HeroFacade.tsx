import Image from 'next/image';
import Link from 'next/link';
import { media } from '@/data/media';
import { site, fullAddress } from '@/data/site';
import { OpenStatus } from '@/components/ui/OpenStatus';
import { Arrow } from '@/components/ui/Arrow';

/** Hero : la vraie façade, reconnaissable dès la première seconde. */
export function HeroFacade() {
  return (
    <section className="hero">
      <div className="hero-media">
        <Image
          src={media.facade.src}
          alt={media.facade.alt}
          fill
          priority
          sizes="100vw"
          quality={86}
          style={{ objectFit: 'cover', objectPosition: 'center 42%' }}
        />
      </div>

      {/* Signature : le trait de lame qui traverse le hero */}
      <svg className="hero-lame" viewBox="0 0 1600 200" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-20 150 C 300 120, 520 60, 820 74 C 1120 88, 1340 140, 1620 96" strokeDasharray="1800" strokeDashoffset="1800" />
      </svg>

      <div className="hero-inner container">
        <div className="hero-top">
          <OpenStatus />
          <span className="scroll-cue" aria-hidden="true"><i className="line" />Découvrir</span>
        </div>

        <h1 className="display d-xxl">
          <span className="l"><span>Le Duo</span></span>
          <span className="l"><span>d’Artisans</span></span>
        </h1>

        <p className="hero-baseline">{site.baseline}</p>

        <div className="hero-bottom">
          <p className="hero-meta">
            Boulangerie · Pâtisserie · Snacking
            <br />
            <strong>{fullAddress}</strong>
          </p>
          <div className="hero-actions">
            <Link className="btn btn--light" href="/nos-creations">Découvrir nos créations<Arrow /></Link>
            <Link className="btn btn--outline-light" href="/contact">Nous trouver</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
