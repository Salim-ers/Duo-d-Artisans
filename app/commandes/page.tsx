import { media } from '@/data/media';
import { site } from '@/data/site';
import { Photo } from '@/components/ui/Photo';
import { JsonLd } from '@/components/ui/JsonLd';
import { OrderForm } from '@/components/forms/OrderForm';
import { pageMetadata } from '@/lib/seo';
import { breadcrumbSchema } from '@/lib/schema';

export const metadata = pageMetadata({
  title: 'Commandes — gâteau d’anniversaire à Rantigny',
  description:
    'Gâteau d’anniversaire, number cake, entremets pour un événement : faites votre demande au Duo d’Artisans à Rantigny. Confirmation par la boutique.',
  path: '/commandes',
  image: media.numberCake,
});

export default function CommandesPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Commandes', path: '/commandes' }])} />

      <section className="opening-split" aria-labelledby="cmd-title">
        <div className="wrap opening-split-grid">
          <div className="opening-split-text">
            <p className="folio">Commandes</p>
            <h1 id="cmd-title" className="t-xl">Quelque chose<br /><em>à célébrer ?</em></h1>
            <p className="t-lead">
              Anniversaire, fête de famille, événement : décrivez votre projet en six étapes.
              La boutique étudie chaque demande et vous recontacte.
            </p>
            <p className="confirm-note">Votre demande sera confirmée par la boutique.</p>
            <p className="t-small">
              Plus direct : <a className="lnk" href={site.phone.href}>{site.phone.display}</a>, ou en passant en boutique.
            </p>
          </div>
          <Photo image={media.numberCake} sizes="(max-width: 820px) 92vw, 44vw" priority reveal={false} className="opening-split-photo" />
        </div>
      </section>

      <section className="order-section" aria-label="Formulaire de demande">
        <div className="wrap">
          <OrderForm />
        </div>
      </section>
    </>
  );
}
