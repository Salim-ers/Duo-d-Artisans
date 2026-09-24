import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PageHero } from '@/components/sections/PageHero';
import { LameDivider } from '@/components/ui/LameDivider';
import { SectionMark } from '@/components/ui/SectionMark';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { media } from '@/data/media';
import { site } from '@/data/site';
import { Arrow } from '@/components/ui/Arrow';

export const metadata: Metadata = {
  title: 'La Maison',
  description:
    'Le Duo d’Artisans, boulangerie-pâtisserie au 7 Rue Anatole France à Rantigny : pain, viennoiserie, pâtisserie, chocolat, snacking et traiteur.',
  alternates: { canonical: '/la-maison' },
};

const values = [
  { title: 'Le goût', text: 'Un pain que l’on reprend le lendemain, une pâtisserie que l’on finit sans commentaire. C’est le seul indicateur qui compte.' },
  { title: 'Le geste', text: 'La fabrication se fait ici, dans le laboratoire de la boutique, tôt le matin comme en cours de journée.' },
  { title: 'La proximité', text: 'Une adresse de quartier à Rantigny : on y vient pour le pain du soir autant que pour le gâteau du dimanche.' },
];

export default function LaMaisonPage() {
  return (
    <>
      <PageHero
        crumb="La Maison"
        title={<>Deux artisans.<br />Une même maison.</>}
        lede="Une adresse gourmande à Rantigny, ouverte du mardi au dimanche matin."
        image={media.facade}
        position="center 45%"
      />

      <section className="section bg-cream grain">
        <div className="container intro-grid">
          <div className="intro-copy">
            <SectionMark>Une nouvelle adresse gourmande</SectionMark>
            <p className="big reveal" data-delay=".08s">
              Le Duo d’Artisans a ouvert ses portes au 7 Rue Anatole France, derrière une devanture bleue
              difficile à manquer.
            </p>
            <p className="lede reveal" data-delay=".14s" style={{ marginTop: 24 }}>
              La maison réunit deux métiers sous une même enseigne : la boulangerie d’un côté,
              la pâtisserie de l’autre. S’y ajoutent la viennoiserie, le chocolat, les gourmandises,
              le snacking du midi et les propositions traiteur.
            </p>
            <ul className="lede reveal" data-delay=".2s" style={{ marginTop: 24, columns: 2, columnGap: 28 }}>
              {site.activities.map((activity) => <li key={activity}>· {activity}</li>)}
            </ul>
          </div>

          <figure className="intro-media clip" style={{ margin: 0 }}>
            <Image src={media.boutique.src} alt={media.boutique.alt} fill sizes="(max-width:1100px) 100vw, 45vw" data-parallax style={{ objectFit: 'cover' }} />
            <figcaption className="intro-tag">En boutique</figcaption>
          </figure>
        </div>
        <LameDivider />
      </section>

      <section className="section bg-blue grain on-blue">
        <div className="container">
          <SectionMark>Notre philosophie</SectionMark>
          <h2 className="display d-l reveal" data-delay=".06s" style={{ color: 'var(--paper)', marginBottom: 'clamp(34px,4vw,56px)' }}>
            Trois choses<br />que l’on ne négocie pas.
          </h2>
          <div className="values">
            {values.map((value, i) => (
              <div className="value reveal" data-delay={`${i * 0.08}s`} key={value.title}>
                <h3 style={{ color: 'var(--paper)' }}>{value.title}</h3>
                <p>{value.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="showcase" aria-label="Le fournil">
        <Image src={media.petrin.src} alt={media.petrin.alt} fill sizes="100vw" data-parallax style={{ objectFit: 'cover' }} />
        <div className="b">
          <p className="q reveal">Du fournil</p>
          <p className="a reveal" data-delay=".12s">à la vitrine.</p>
          <p className="reveal" data-delay=".2s" style={{ marginTop: 34 }}>
            <Link className="btn btn--light" href="/savoir-faire">Voir le savoir-faire<Arrow /></Link>
          </p>
        </div>
      </section>

      <FinalCTA />
    </>
  );
}
