import type { Interval } from '@/data/opening-hours';
import type { DayException } from '@/lib/hours';
import { site, fullAddress } from '@/data/site';
import { Arrow } from '@/components/ui/Arrow';
import { OpenNowBig } from '@/components/ui/OpenNow';
import { HoursTable } from '@/components/ui/HoursTable';

/** Infos pratiques (page Contact) : statut d’ouverture, adresse, téléphone, horaires. */
export function Practical({ week, exceptions, headingLevel = 2 }: { week: Interval[][]; exceptions: DayException[]; headingLevel?: 1 | 2 }) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const next = exceptions[0];
  return (
    <section className="practical" id="infos" aria-labelledby="practical-title">
      <div className="wrap practical-grid">
        <div className="practical-main">
          <span className="kicker">Infos pratiques</span>
          <Heading id="practical-title" className="t-l">
            On se retrouve
            <br />
            <em>à Rantigny.</em>
          </Heading>
          <OpenNowBig week={week} exceptions={exceptions} />
          <div className="practical-actions">
            <a className="btn btn--primary" href={site.maps.directions} target="_blank" rel="noopener noreferrer">
              Itinéraire <Arrow direction="up-right" />
            </a>
            <a className="btn btn--line" href={site.phone.href}>
              Appeler · {site.phone.display}
            </a>
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
              <dd>
                <a href={site.phone.href}>{site.phone.display}</a>
              </dd>
            </div>
          </dl>
          <HoursTable
            week={week}
            note={next ? `${next.closed ? 'Fermeture exceptionnelle' : 'Horaires exceptionnels'} le ${new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(next.date + 'T12:00:00Z'))}${next.note ? ' — ' + next.note : ''}` : null}
          />
          <p className="sr-only">{fullAddress}</p>
        </div>
      </div>
    </section>
  );
}
