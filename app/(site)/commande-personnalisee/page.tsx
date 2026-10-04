import type { Metadata } from 'next';
import '../pages.css';
import { media, type MediaKey } from '@/data/media';
import { site } from '@/data/site';
import { addDays, paris } from '@/lib/dates';
import { getSetting } from '@/lib/settings';
import { pageMetadata } from '@/lib/seo';
import { Photo } from '@/components/ui/Photo';
import { Split } from '@/components/ui/Split';
import { CustomRequestForm } from '@/components/forms/CustomRequestForm';

export const metadata: Metadata = pageMetadata({
  title: 'Gâteau d’anniversaire et commande personnalisée à Rantigny',
  description:
    'Gâteau d’anniversaire, number cake, entremets, dessert pour un événement : décrivez votre envie au Duo d’Artisans, boulangerie pâtisserie à Rantigny. La boutique vous fait une proposition.',
  path: '/commande-personnalisee',
  image: media.numberCake,
});

export const dynamic = 'force-dynamic';

/** Vraies photos de la boutique associées aux types de création connus. */
const typeImages: Record<string, MediaKey> = {
  Anniversaire: 'gateauFruits',
  'Number cake': 'numberCake',
  Entremets: 'entremets',
  Événement: 'macarons',
  'Dessert à partager': 'vitrineFlans',
  Autre: 'vitrinePatisseries',
};

export default async function CustomPage() {
  const cfg = await getSetting('custom');
  const minDate = addDays(paris().date, cfg.minDaysNotice);
  return (
    <>
      <section className="cp-hero" aria-labelledby="cp-title">
        <div className="wrap cp-grid">
          <div className="cp-text">
            <span className="kicker">Commande personnalisée</span>
            <Split as="h1" id="cp-title" lines={['Un gâteau', { em: 'pour une occasion ?' }]} className="t-xl" />
            <p className="t-lead" data-reveal>
              Anniversaire, number cake, événement : décrivez votre envie. La boutique étudie votre demande et revient vers vous avec une proposition.
            </p>
            <p className="t-small" data-reveal>
              Plus direct : <a className="lnk" href={site.phone.href}>{site.phone.display}</a>
            </p>
          </div>
          <Photo image={media.numberCake} sizes="(max-width: 900px) 92vw, 40vw" priority reveal={false} className="cp-photo" />
        </div>
      </section>
      <section className="cp-form" aria-label="Formulaire de demande">
        <div className="wrap">
          <CustomRequestForm types={cfg.types.map((label) => ({ label, image: typeImages[label] ? media[typeImages[label]!].src : null }))} minDate={minDate} />
        </div>
      </section>
    </>
  );
}
