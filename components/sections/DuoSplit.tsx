import Image from 'next/image';
import Link from 'next/link';
import { media } from '@/data/media';
import { Arrow } from '@/components/ui/Arrow';

/** Le concept DUO, matérialisé : deux univers, une seule couture centrale. */
const halves = [
  { href: '/nos-creations?c=boulangerie', title: 'Boulangerie', phrase: 'Le quotidien, croustillant.',
    cta: 'Découvrir nos pains', image: media.baguettesTradition },
  { href: '/nos-creations?c=patisserie', title: 'Pâtisserie', phrase: 'L’instant gourmand.',
    cta: 'Découvrir nos pâtisseries', image: media.vitrineEclairs },
];

export function DuoSplit() {
  return (
    <section className="duo" aria-label="Boulangerie et pâtisserie">
      <span className="duo-seam" aria-hidden="true" />
      <span className="duo-dot a" aria-hidden="true" />
      <span className="duo-dot b" aria-hidden="true" />
      {halves.map((half) => (
        <Link className="duo-half" href={half.href} key={half.title}>
          <Image src={half.image.src} alt={half.image.alt} fill sizes="(max-width:820px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
          <span className="body">
            <h3>{half.title}</h3>
            <span className="ph">{half.phrase}</span>
            <span className="go">{half.cta}<Arrow /></span>
          </span>
        </Link>
      ))}
    </section>
  );
}
