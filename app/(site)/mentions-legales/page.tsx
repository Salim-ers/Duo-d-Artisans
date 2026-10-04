import { media, type Media } from '@/data/media';
import { site, fullAddress } from '@/data/site';
import { pageMetadata } from '@/lib/seo';

/** Crédits des photos libres de droits, lus directement dans data/media.ts. */
const credits = Object.values(media as Record<string, Media>).flatMap((m) => (m.credit ? [{ alt: m.alt, ...m.credit }] : []));

export const metadata = pageMetadata({
  title: 'Mentions légales',
  description: 'Mentions légales du site Le Duo d’Artisans, boulangerie-pâtisserie à Rantigny.',
  path: '/mentions-legales',
  noindex: true,
});

export default function MentionsPage() {
  return (
    <article className="legal wrap">
      <h1 className="t-xl">Mentions légales</h1>

      <h2>Éditeur du site</h2>
      <p>
        {site.legal.name}, {site.legal.form}
        <br />
        {fullAddress}
        <br />
        Téléphone : <a className="lnk" href={site.phone.href}>{site.phone.display}</a>
      </p>

      <h2>Immatriculation</h2>
      <p>
        SIREN {site.legal.siren} · SIRET {site.legal.siret}
        <br />
        Activité : {site.legal.activity}
      </p>

      <h2>Directeur de la publication</h2>
      <p>{site.legal.director ?? `Le représentant légal de la société ${site.legal.name}.`}</p>

      <h2>Hébergement</h2>
      <p>
        {site.legal.host.name}
        <br />
        {site.legal.host.address}
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les photographies de la boutique et de ses créations appartiennent à {site.legal.name}. Toute reproduction sans
        autorisation est interdite.
      </p>
      <p>
        La photographie de la devanture affichée en page d’accueil a été restaurée et agrandie à l’aide d’un outil
        d’intelligence artificielle ; le haut de la façade et la rue ont été prolongés pour le format carré.
      </p>

      <h2>Photos d’ambiance</h2>
      <p>
        Les photos d’ingrédients et de gestes de la page d’accueil (blé, rouleau à pâtisserie, framboises, chocolat,
        tomates, cierge magique) sont des photos libres de droits publiées sur Pexels (licence Pexels). Elles illustrent
        les rayons de la boutique et ne représentent pas ses produits.
      </p>
      <ul className="legal-credits">
        {credits.map((c) => (
          <li key={c.url}>
            {c.alt} —{' '}
            <a className="lnk" href={c.url} target="_blank" rel="noopener noreferrer">
              {c.author}
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}
