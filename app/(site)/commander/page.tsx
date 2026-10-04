import type { Metadata } from 'next';
import '../pages.css';
import { media } from '@/data/media';
import { site } from '@/data/site';
import { addDays, paris } from '@/lib/dates';
import { getSetting } from '@/lib/settings';
import { pageMetadata } from '@/lib/seo';
import { Split } from '@/components/ui/Split';
import { CustomRequestForm } from '@/components/forms/CustomRequestForm';

export const metadata: Metadata = pageMetadata({
  title: 'Commander un gâteau sur mesure à Rantigny',
  description:
    'Gâteau d’anniversaire, number cake, entremets, dessert pour un événement : décrivez votre envie au Duo d’Artisans, boulangerie pâtisserie à Rantigny. La boutique vous fait une proposition.',
  path: '/commander',
  image: media.numberCake,
});

export const dynamic = 'force-dynamic';

const steps = [
  { title: 'Vous remplissez le bloc-note', text: 'Quelques questions, sans engagement.' },
  { title: 'La boutique vous répond', text: 'Avec une proposition et son prix.' },
  { title: 'Vous validez, puis retirez votre gâteau', text: 'En boutique, au 7 rue Anatole France.' },
];

/** Commander = demander un gâteau sur mesure. Une seule page, aucune photo : un bloc-note à remplir. */
export default async function CustomPage() {
  const cfg = await getSetting('custom');
  const minDate = addDays(paris().date, cfg.minDaysNotice);
  return (
    <section className="cp" aria-labelledby="cp-title">
      <div className="wrap cp-grid">
        <div className="cp-side">
          <span className="kicker">Commander · Sur mesure</span>
          <Split as="h1" id="cp-title" lines={['Commander', { em: 'un gâteau.' }]} className="t-xl" />
          <p className="t-lead" data-reveal>
            Anniversaire, number cake, entremets, événement : répondez aux questions du bloc-note, la boutique s’occupe du reste.
          </p>
          <ol className="cp-steps" aria-label="Comment ça se passe">
            {steps.map((s, i) => (
              <li key={s.title} data-reveal style={{ ['--i' as string]: i }}>
                <span className="cp-step-n">{i + 1}</span>
                <span>
                  <b>{s.title}</b>
                  {s.text}
                </span>
              </li>
            ))}
          </ol>
          <p className="t-small cp-phone" data-reveal>
            Plus direct : <a className="lnk" href={site.phone.href}>{site.phone.display}</a>
          </p>
        </div>
        <div className="cp-pad">
          <CustomRequestForm types={cfg.types} minDate={minDate} />
        </div>
      </div>
    </section>
  );
}
