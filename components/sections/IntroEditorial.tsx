import Image from 'next/image';
import Link from 'next/link';
import { media } from '@/data/media';
import { SectionMark } from '@/components/ui/SectionMark';
import { LameDivider } from '@/components/ui/LameDivider';

export function IntroEditorial() {
  return (
    <section className="section intro bg-cream grain">
      <span className="intro-word" aria-hidden="true">Artisans</span>

      <div className="container intro-grid">
        <div className="intro-copy">
          <SectionMark>Ici, tout commence</SectionMark>
          <p className="big reveal" data-delay=".08s">
            Le matin commence par le parfum du pain chaud. La journée continue derrière la vitrine.
            Entre les deux : du temps, des gestes et beaucoup de gourmandise.
          </p>
          <p className="lede reveal" data-delay=".16s" style={{ marginTop: 26 }}>
            Le Duo d’Artisans, c’est une boulangerie-pâtisserie de proximité à Rantigny. Le pain et la
            viennoiserie d’un côté, la pâtisserie et les gourmandises de l’autre, et de quoi composer
            son déjeuner entre les deux.
          </p>
          <p className="reveal" data-delay=".24s" style={{ marginTop: 30 }}>
            <Link className="ulink" href="/nos-creations">Voir ce qu’il y a en vitrine</Link>
          </p>
        </div>

        <figure className="intro-media clip" style={{ margin: 0 }}>
          <Image
            src={media.baguettesFournil.src}
            alt={media.baguettesFournil.alt}
            fill
            sizes="(max-width:1100px) 100vw, 45vw"
            data-parallax
            style={{ objectFit: 'cover', objectPosition: 'center 55%' }}
          />
          <figcaption className="intro-tag">Chaque matin</figcaption>
        </figure>
      </div>

      <LameDivider />
    </section>
  );
}
