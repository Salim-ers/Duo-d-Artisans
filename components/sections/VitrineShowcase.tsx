import Image from 'next/image';
import Link from 'next/link';
import { media } from '@/data/media';
import { Arrow } from '@/components/ui/Arrow';

/** Presque sans texte : on laisse la vitrine parler. */
export function VitrineShowcase() {
  return (
    <section className="showcase" aria-label="La vitrine">
      <Image
        src={media.vitrinePatisseries.src}
        alt={media.vitrinePatisseries.alt}
        fill
        sizes="100vw"
        data-parallax
        style={{ objectFit: 'cover' }}
      />
      <div className="b">
        <p className="q reveal">Vous regardez encore ?</p>
        <p className="a reveal" data-delay=".12s">Nous aussi.</p>
        <p className="reveal" data-delay=".2s" style={{ marginTop: 34 }}>
          <Link className="btn btn--light" href="/nos-creations#galerie">Voir la galerie<Arrow /></Link>
        </p>
      </div>
    </section>
  );
}
