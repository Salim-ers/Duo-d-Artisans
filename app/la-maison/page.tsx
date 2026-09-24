import Link from 'next/link';
import { media } from '@/data/media';
import { site } from '@/data/site';
import { Photo } from '@/components/ui/Photo';
import { Arrow } from '@/components/ui/Arrow';
import { JsonLd } from '@/components/ui/JsonLd';
import { Practical } from '@/components/sections/Practical';
import { pageMetadata } from '@/lib/seo';
import { breadcrumbSchema } from '@/lib/schema';

export const metadata = pageMetadata({
  title: 'La Maison — boulangerie pâtisserie à Rantigny',
  description:
    'Derrière la devanture bleue du 7 rue Anatole France à Rantigny : une boulangerie et une pâtisserie réunies sous une même enseigne.',
  path: '/la-maison',
  image: media.facade,
});

const values = [
  { word: 'Le goût', text: 'Un pain que l’on reprend le lendemain, une pâtisserie que l’on finit sans commentaire. C’est le seul indicateur qui compte.' },
  { word: 'Le geste', text: 'La fabrication se fait ici, dans le laboratoire de la boutique, tôt le matin comme en cours de journée.' },
  { word: 'La proximité', text: 'Une adresse de quartier à Rantigny : on y vient pour le pain du soir autant que pour le gâteau du dimanche.' },
];

export default function LaMaisonPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'La Maison', path: '/la-maison' }])} />

      <section className="opening-plate" aria-labelledby="maison-title">
        <Photo image={media.facade} sizes="(max-width: 1520px) 100vw, 1440px" priority reveal={false} className="opening-plate-photo" position="50% 45%" />
        <div className="wrap opening-plate-text">
          <p className="folio">La Maison</p>
          <h1 id="maison-title" className="t-xxl">
            Deux artisans.
            <br />
            <em>Une même maison.</em>
          </h1>
        </div>
      </section>

      <section className="story" aria-label="Histoire de la maison">
        <div className="wrap story-grid">
          <p className="story-lead dropcap" data-reveal>
            Le Duo d’Artisans a ouvert ses portes au 7 rue Anatole France, à Rantigny, derrière une
            devanture bleue difficile à manquer.
          </p>
          <div className="story-body" data-reveal style={{ ['--i' as string]: 1 }}>
            <p>
              La maison réunit deux métiers sous une même enseigne : la boulangerie d’un côté,
              la pâtisserie de l’autre. S’y ajoutent la viennoiserie, le chocolat, les gourmandises,
              le snacking du midi et les propositions traiteur.
            </p>
            <p>Une boutique de proximité, ouverte du mardi au dimanche matin.</p>
          </div>
        </div>
      </section>

      <section className="pair" aria-labelledby="pair-title">
        <div className="wrap">
          <h2 id="pair-title" className="t-l pair-title" data-reveal>Les deux métiers</h2>
          <div className="pair-grid">
            <article className="pair-item">
              <Photo image={media.baguettesTradition} sizes="(max-width: 820px) 92vw, 48vw" className="pair-photo pair-photo--wide" />
              <h3 className="t-m">La boulangerie</h3>
              <p>Pains, baguettes et viennoiseries : la base de la journée, du premier client du matin au pain du soir.</p>
            </article>
            <article className="pair-item pair-item--low">
              <Photo image={media.entremets} sizes="(max-width: 820px) 92vw, 36vw" className="pair-photo pair-photo--tall" />
              <h3 className="t-m">La pâtisserie</h3>
              <p>Entremets, tartes, macarons, gâteaux à partager : la vitrine se compose pièce par pièce.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="atelier" aria-labelledby="atelier-title">
        <div className="wrap atelier-grid">
          <h2 id="atelier-title" className="atelier-title t-l" data-reveal>Côté<br /><em>atelier.</em></h2>
          <Photo image={media.petrin} sizes="(max-width: 820px) 92vw, 40vw" className="atelier-a" />
          <Photo image={media.baguettesFournil} sizes="(max-width: 820px) 60vw, 26vw" className="atelier-b" />
          <Photo image={media.painsChocolat} sizes="(max-width: 820px) 60vw, 22vw" className="atelier-c" />
        </div>
      </section>

      <section className="values" aria-labelledby="values-title">
        <div className="wrap">
          <h2 id="values-title" className="t-l" data-reveal>Trois choses<br /><em>que l’on ne négocie pas.</em></h2>
          <ol className="values-list">
            {values.map((v, i) => (
              <li key={v.word} data-reveal style={{ ['--i' as string]: i }}>
                <span className="values-word">{v.word}</span>
                <p>{v.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="shop" aria-labelledby="shop-title">
        <Photo image={media.boutique} sizes="(max-width: 1520px) 100vw, 1440px" className="shop-photo" />
        <div className="wrap shop-text">
          <h2 id="shop-title" className="t-l" data-reveal>La boutique</h2>
          <p className="shop-list">{site.activities.join(' · ')}</p>
          <p>
            <Link className="lnk" href="/nos-creations">Voir les créations <Arrow /></Link>
          </p>
        </div>
      </section>

      <Practical />
    </>
  );
}
