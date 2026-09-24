import type { Metadata } from 'next';
import Image from 'next/image';
import { PageHero } from '@/components/sections/PageHero';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { LameDivider } from '@/components/ui/LameDivider';
import { media, type MediaKey } from '@/data/media';

export const metadata: Metadata = {
  title: 'Savoir-faire artisanal',
  description:
    'La matière, le geste, le temps, la cuisson, la finition, la vitrine : les étapes du travail au quotidien chez Le Duo d’Artisans à Rantigny.',
  alternates: { canonical: '/savoir-faire' },
};

/** Narration générale de l'artisanat : aucun procédé propriétaire inventé. */
const steps: { n: string; title: string; text: string; image: MediaKey }[] = [
  { n: '01', title: 'La matière', image: 'petrin',
    text: 'Tout part d’une pâte. On la prépare, on la surveille, on la laisse prendre son temps.' },
  { n: '02', title: 'Le geste', image: 'baguettesFournil',
    text: 'Façonner reste un travail de main. C’est là que se joue la forme, la régularité, le détail.' },
  { n: '03', title: 'Le temps', image: 'baguettesTradition',
    text: 'Rien ne se presse vraiment : entre chaque étape, il y a de l’attente, et elle compte.' },
  { n: '04', title: 'La cuisson', image: 'painsChocolat',
    text: 'Le four décide de la couleur, du croustillant et de l’odeur qui traverse la boutique.' },
  { n: '05', title: 'La finition', image: 'entremets',
    text: 'Côté pâtisserie, la dernière minute est la plus minutieuse : glaçage, fruits, décor.' },
  { n: '06', title: 'La vitrine', image: 'vitrineEclairs',
    text: 'Puis tout est dressé, aligné, prêt pour la journée. Le reste vous appartient.' },
];

export default function SavoirFairePage() {
  return (
    <>
      <PageHero
        crumb="Savoir-faire"
        title={<>Avant la vitrine,<br />il y a le geste.</>}
        lede="Pétrir, façonner, cuire, dresser, recommencer. Six étapes qui rythment chaque journée."
        image={media.petrin}
      />

      <section className="section bg-cream grain">
        <div className="container draw-trigger">
          <div className="steps">
            {steps.map((step) => {
              const img = media[step.image];
              return (
                <article className="step" key={step.n}>
                  <figure className="step-media clip" style={{ margin: 0 }}>
                    <Image src={img.src} alt={img.alt} fill sizes="(max-width:1100px) 100vw, 45vw" style={{ objectFit: 'cover' }} />
                  </figure>
                  <div>
                    <p className="step-n display">{step.n}</p>
                    <h2>{step.title}</h2>
                    <p>{step.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
          <LameDivider />
        </div>
      </section>

      <FinalCTA />
    </>
  );
}
