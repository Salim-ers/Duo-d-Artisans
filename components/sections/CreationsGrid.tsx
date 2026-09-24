import Image from 'next/image';
import Link from 'next/link';
import { media, type MediaKey } from '@/data/media';
import { SectionMark } from '@/components/ui/SectionMark';
import { Arrow } from '@/components/ui/Arrow';

type Tile = {
  index: string; label: string; name: string; href: string;
  image: MediaKey; span: string; ratio: string; glaze?: boolean; delay?: string;
};

/** Compositions volontairement inégales : trois rangées, aucune grille 3×3 répétitive. */
const rows: Tile[][] = [
  [
    { index: '01', label: 'Boulangerie', name: 'Pains & baguettes', href: '/nos-creations?c=boulangerie', image: 'baguettesTradition', span: 'sp-7', ratio: 'ar-169' },
    { index: '02', label: 'Viennoiserie', name: 'Viennoiseries', href: '/nos-creations?c=viennoiserie', image: 'painsChocolat', span: 'sp-5', ratio: 'ar-43', delay: '.08s' },
  ],
  [
    { index: '03', label: 'Pâtisserie', name: 'Pâtisseries', href: '/nos-creations?c=patisserie', image: 'entremets', span: 'sp-4', ratio: 'ar-45', glaze: true },
    { index: '04', label: 'Gâteaux', name: 'Gâteaux d’occasion', href: '/commandes', image: 'numberCake', span: 'sp-4', ratio: 'ar-45', delay: '.08s' },
    { index: '05', label: 'Gourmandises', name: 'Gourmandises', href: '/nos-creations?c=gourmandises', image: 'cookies', span: 'sp-4', ratio: 'ar-45', delay: '.16s' },
  ],
  [
    { index: '06', label: 'Salades', name: 'Salades & fraîcheur', href: '/nos-creations?c=salades', image: 'salades', span: 'sp-5', ratio: 'ar-43' },
    { index: '07', label: 'Snacking', name: 'Sandwichs & snacking', href: '/nos-creations?c=snacking', image: 'sandwichs', span: 'sp-7', ratio: 'ar-169', delay: '.08s' },
  ],
];

function Tile({ tile }: { tile: Tile }) {
  const img = media[tile.image];
  return (
    <Link
      href={tile.href}
      className={`card ${tile.span} ${tile.ratio} reveal${tile.glaze ? ' card--glaze' : ''}`}
      data-delay={tile.delay}
    >
      <Image src={img.src} alt={img.alt} fill sizes="(max-width:820px) 100vw, 45vw" style={{ objectFit: 'cover' }} />
      <span className="rule" />
      <span className="cap">
        <span>
          <span className="k">{tile.index} · {tile.label}</span>
          <span className="n">{tile.name}</span>
        </span>
        <span className="arw-c"><Arrow className="" /></span>
      </span>
    </Link>
  );
}

export function CreationsGrid() {
  return (
    <section className="section bg-cream">
      <div className="container">
        <div className="tl-head" style={{ marginBottom: 'clamp(30px,4vw,56px)' }}>
          <div>
            <SectionMark>Nos créations</SectionMark>
            <h2 className="display d-l reveal" data-delay=".06s">
              Tout ce qui passe<br />de l’autre côté du comptoir
            </h2>
          </div>
          <p className="lede reveal" data-delay=".12s" style={{ maxWidth: '34ch' }}>
            Sept univers, une seule vitrine. Ce qui est disponible change au fil des jours et des saisons.
          </p>
        </div>

        {rows.map((row, i) => (
          <div className="cr-grid" key={i} style={{ marginBottom: i < rows.length - 1 ? 'clamp(12px,1.6vw,22px)' : undefined }}>
            {row.map((tile) => <Tile tile={tile} key={tile.index} />)}
          </div>
        ))}
      </div>
    </section>
  );
}
