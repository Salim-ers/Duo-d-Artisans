import Link from 'next/link';
import { creations, filters } from '@/data/products';
import { media } from '@/data/media';
import { site } from '@/data/site';
import { Photo } from '@/components/ui/Photo';
import { Arrow } from '@/components/ui/Arrow';
import { JsonLd } from '@/components/ui/JsonLd';
import { FilterSync } from '@/components/creations/FilterSync';
import { pageMetadata } from '@/lib/seo';
import { breadcrumbSchema } from '@/lib/schema';

export const metadata = pageMetadata({
  title: 'Nos créations — pains, pâtisseries, snacking',
  description:
    'Baguettes, viennoiseries, entremets, macarons, number cakes, sandwichs et salades : un aperçu de la vitrine du Duo d’Artisans, boulangerie à Rantigny.',
  path: '/nos-creations',
  image: media.vitrineEclairs,
});

/**
 * Toutes les créations sont rendues en HTML statique.
 * Les filtres sont des boutons radio pilotés en CSS (:has) : ils fonctionnent sans
 * JavaScript ; sans prise en charge de :has, tout reste simplement affiché.
 */
export default function CreationsPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Nos créations', path: '/nos-creations' }])} />

      <section className="opening-type" aria-labelledby="cr-title">
        <div className="wrap opening-type-grid">
          <div>
            <p className="folio">Nos créations</p>
            <h1 id="cr-title" className="t-xxl">Ce qu’il y a<br /><em>dans la vitrine.</em></h1>
          </div>
          <p className="t-lead">
            Un aperçu de ce que l’on trouve en boutique. La sélection évolue au fil des jours
            et des saisons : pour une pièce précise, appelez la boutique au{' '}
            <a className="lnk" href={site.phone.href}>{site.phone.display}</a>.
          </p>
        </div>
      </section>

      <section className="catalogue" aria-label="Créations">
        <FilterSync name="filtre" />
        <div className="wrap">
          <fieldset className="filters">
            <legend className="sr-only">Filtrer les créations</legend>
            {filters.map((f) => (
              <span key={f.id} className="filter">
                <input type="radio" name="filtre" id={`f-${f.id}`} value={f.id} defaultChecked={f.id === 'tout'} />
                <label htmlFor={`f-${f.id}`}>{f.label}</label>
              </span>
            ))}
          </fieldset>

          <ul className="works">
            {creations.map((c, i) => (
              <li key={c.id} className="work" data-f={c.filter}>
                <figure>
                  <Photo
                    image={media[c.image]}
                    sizes="(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 31vw"
                    className="work-photo"
                    aspect={i % 3 === 1 ? '4 / 5' : `${media[c.image].width} / ${media[c.image].height}`}
                  />
                  <figcaption>
                    <span className="work-name">{c.name}</span>
                    <span className="work-note">{c.note}</span>
                    {c.onOrder && <Link className="lnk work-order" href="/commandes">Sur commande <Arrow /></Link>}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
