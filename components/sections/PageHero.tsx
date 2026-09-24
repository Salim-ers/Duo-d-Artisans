import Image from 'next/image';
import type { Media } from '@/data/media';

/** En-tête commun aux pages intérieures : même grammaire visuelle que l'accueil. */
export function PageHero({
  crumb, title, lede, image, position = 'center',
}: { crumb: string; title: React.ReactNode; lede?: string; image: Media; position?: string }) {
  return (
    <section className="phero">
      <Image src={image.src} alt={image.alt} fill priority sizes="100vw" style={{ objectFit: 'cover', objectPosition: position }} />
      <div className="container b">
        <p className="crumb">{crumb}</p>
        <h1 className="display d-xl">{title}</h1>
        {lede && <p className="lede" style={{ color: 'rgba(252,250,246,.8)', marginTop: 22 }}>{lede}</p>}
      </div>
    </section>
  );
}
