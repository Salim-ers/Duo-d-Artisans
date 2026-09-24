import Link from 'next/link';
import { nav, site } from '@/data/site';
import { openingHours, weekOrder, formatIntervals } from '@/data/opening-hours';

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <p className="footer-mark" aria-hidden="true">Le Duo <em>d’Artisans</em></p>

        <div className="footer-grid">
          <div>
            <h2 className="footer-h">La boutique</h2>
            <p>
              {site.address.street}
              <br />
              {site.address.postalCode} {site.address.city}
            </p>
            <p><a className="lnk" href={site.phone.href}>{site.phone.display}</a></p>
            <p><a className="lnk" href={site.maps.directions} target="_blank" rel="noopener noreferrer">Itinéraire</a></p>
          </div>

          <div>
            <h2 className="footer-h">Horaires habituels</h2>
            <dl className="footer-hours">
              {weekOrder.map((day) => {
                const d = openingHours.find((o) => o.day === day)!;
                return (
                  <div key={day}>
                    <dt>{d.label}</dt>
                    <dd>{formatIntervals(d.intervals)}</dd>
                  </div>
                );
              })}
            </dl>
          </div>

          <nav aria-label="Pied de page">
            <h2 className="footer-h">La maison</h2>
            <ul>
              {nav.map((item) => (
                <li key={item.href}><Link href={item.href}>{item.label}</Link></li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="footer-legal">
          <p>{site.legal.name} · {site.legal.form} · SIREN {site.legal.siren}</p>
          <p>
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/politique-confidentialite">Confidentialité</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
