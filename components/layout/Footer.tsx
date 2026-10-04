import Link from 'next/link';
import { site } from '@/data/site';
import { dayLabels, formatIntervals, weekOrder, type Interval } from '@/data/opening-hours';

/** Pied de page minimal : marque, adresse, téléphone, horaires, mentions. */
export function Footer({ week }: { week: Interval[][] }) {
  const socials = Object.entries(site.social).filter((e): e is [string, string] => !!e[1]);
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-top">
          <div>
            <p className="footer-mark">
              Le Duo <em>d’Artisans</em>
            </p>
            <p>Boulangerie · Pâtisserie · Viennoiserie · Snacking</p>
          </div>

          <div>
            <h2 className="footer-h">La boutique</h2>
            <p>
              {site.address.street}
              <br />
              {site.address.postalCode} {site.address.city}
            </p>
            <p style={{ marginTop: 10 }}>
              <a href={site.phone.href}>{site.phone.display}</a>
            </p>
            <p style={{ marginTop: 4 }}>
              <a href={site.maps.directions} target="_blank" rel="noopener noreferrer">
                Itinéraire ↗
              </a>
            </p>
          </div>

          <div>
            <h2 className="footer-h">Horaires</h2>
            <dl className="footer-hours">
              {weekOrder.map((day) => (
                <div key={day}>
                  <dt>{dayLabels[day]}</dt>
                  <dd>{formatIntervals(week[day] ?? [])}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h2 className="footer-h">Sur mesure</h2>
            <p>
              <Link href="/commander">Commander un gâteau</Link>
            </p>
            <p style={{ marginTop: 4 }}>
              <Link href="/creations">Nos créations</Link>
            </p>
            {socials.length > 0 && (
              <p style={{ marginTop: 16 }}>
                {socials.map(([name, url]) => (
                  <a key={name} href={url} target="_blank" rel="noopener noreferrer" style={{ marginRight: 16, textTransform: 'capitalize' }}>
                    {name}
                  </a>
                ))}
              </p>
            )}
          </div>
        </div>

        <div className="footer-legal">
          <p>
            {site.legal.name} · {site.legal.form} · SIREN {site.legal.siren}
          </p>
          <nav aria-label="Informations légales">
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/politique-confidentialite">Confidentialité</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
