import Link from 'next/link';
import { media, type MediaKey } from '@/data/media';
import { Photo } from '@/components/ui/Photo';
import { Arrow } from '@/components/ui/Arrow';
import { JsonLd } from '@/components/ui/JsonLd';
import { pageMetadata } from '@/lib/seo';
import { breadcrumbSchema } from '@/lib/schema';

export const metadata = pageMetadata({
  title: 'Savoir-faire — du pétrin à la vitrine',
  description:
    'Pétrissage, façonnage, fermentation, cuisson, finition : les étapes du travail au quotidien au Duo d’Artisans, boulangerie pâtisserie à Rantigny.',
  path: '/savoir-faire',
  image: media.petrin,
});

/** Narration générale du métier : aucun procédé propriétaire ni ingrédient inventé. */
const steps: { id: string; title: string; text: string; image?: MediaKey }[] = [
  { id: 'matiere', title: 'La matière', text: 'Farine, eau, sel. Tout commence par une matière simple, et par le soin qu’on lui porte.' },
  { id: 'petrissage', title: 'Le pétrissage', image: 'petrin', text: 'Le pétrin mélange, la pâte se forme. On la surveille jusqu’à ce qu’elle soit lisse et souple.' },
  { id: 'faconnage', title: 'Le façonnage', image: 'baguettesFournil', text: 'C’est là que se jouent la forme, la régularité, le détail.' },
  { id: 'fermentation', title: 'La fermentation', text: 'Entre deux étapes, la pâte repose. Rien ne se presse vraiment : cette attente fait partie du travail.' },
  { id: 'cuisson', title: 'La cuisson', image: 'painsChocolat', text: 'Le four décide de la couleur, du croustillant et de l’odeur qui traverse la boutique.' },
  { id: 'finition', title: 'La finition', image: 'entremets', text: 'Côté pâtisserie, la dernière minute est la plus minutieuse : glaçage, fruits, décor.' },
  { id: 'vitrine', title: 'La vitrine', image: 'vitrineEclairs', text: 'Puis tout est dressé, aligné, prêt pour la journée. Le reste vous appartient.' },
];

export default function SavoirFairePage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Savoir-faire', path: '/savoir-faire' }])} />

      <section className="opening-dark" aria-labelledby="sf-title">
        <div className="wrap opening-dark-grid">
          <div>
            <p className="folio">Savoir-faire</p>
            <h1 id="sf-title" className="t-xxl">
              Avant la vitrine,
              <br />
              <em>il y a le geste.</em>
            </h1>
          </div>
          <nav className="toc" aria-label="Les étapes">
            <ol>
              {steps.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}><span>{String(i + 1).padStart(2, '0')}</span>{s.title}</a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </section>

      <div className="stages">
        {steps.map((s, i) => {
          const n = String(i + 1).padStart(2, '0');
          return s.image ? (
            <section key={s.id} id={s.id} className={`stage stage--${i % 2 ? 'right' : 'left'}`} aria-labelledby={`${s.id}-t`}>
              <div className="wrap stage-grid">
                <Photo image={media[s.image]} sizes="(max-width: 820px) 92vw, 56vw" className="stage-photo" />
                <div className="stage-text">
                  <span className="stage-n" aria-hidden="true">{n}</span>
                  <h2 id={`${s.id}-t`} className="t-l" data-reveal>{s.title}</h2>
                  <p className="t-lead" data-reveal style={{ ['--i' as string]: 1 }}>{s.text}</p>
                </div>
              </div>
            </section>
          ) : (
            <section key={s.id} id={s.id} className="stage stage--type" aria-labelledby={`${s.id}-t`}>
              <div className="wrap">
                <span className="stage-n stage-n--huge" aria-hidden="true">{n}</span>
                <h2 id={`${s.id}-t`} className="t-l" data-reveal>{s.title}</h2>
                <p className="stage-quote" data-reveal style={{ ['--i' as string]: 1 }}>{s.text}</p>
              </div>
            </section>
          );
        })}
      </div>

      <section className="next-steps" aria-label="Pour aller plus loin">
        <div className="wrap next-steps-row">
          <Link className="next-link" href="/nos-creations">
            <span>Voir le résultat</span>
            <b>Nos créations <Arrow /></b>
          </Link>
          <Link className="next-link" href="/commandes">
            <span>Pour une occasion</span>
            <b>Demander un gâteau <Arrow /></b>
          </Link>
        </div>
      </section>
    </>
  );
}
