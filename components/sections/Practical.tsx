import { site } from '@/data/site';
import { OpenNowBig } from '@/components/ui/OpenNow';
import { HoursTable } from '@/components/ui/HoursTable';
import { Arrow } from '@/components/ui/Arrow';

/** Infos pratiques : adresse, téléphone, horaires, statut et itinéraire. */
export function Practical({ headingLevel = 2, title = true }: { headingLevel?: 1 | 2; title?: boolean }) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <section className="practical" id="infos" aria-labelledby="practical-title">
      <div className="wrap practical-grid">
        <div className="practical-main">
          <Heading id="practical-title" className={title ? 't-l' : 'sr-only'}>
            On se retrouve
            <br />
            <em>à Rantigny.</em>
          </Heading>

          <OpenNowBig />
          <p className="practical-note">
            Statut calculé sur les horaires habituels. Jours fériés et fermetures exceptionnelles :
            un appel suffit pour vérifier.
          </p>

          <div className="practical-actions">
            <a className="btn btn--primary" href={site.maps.directions} target="_blank" rel="noopener noreferrer">
              Itinéraire <Arrow direction="up-right" />
            </a>
            <a className="btn btn--line" href={site.phone.href}>Appeler · {site.phone.display}</a>
          </div>
        </div>

        <div className="practical-details">
          <dl className="facts">
            <div>
              <dt>Adresse</dt>
              <dd>
                {site.address.street}
                <br />
                {site.address.postalCode} {site.address.city}
              </dd>
            </div>
            <div>
              <dt>Téléphone</dt>
              <dd><a href={site.phone.href}>{site.phone.display}</a></dd>
            </div>
          </dl>
          <HoursTable />
        </div>
      </div>
    </section>
  );
}
