import Link from 'next/link';
import { site } from '@/data/site';
import { dayLabels, formatIntervals, weekOrder, type Interval } from '@/data/opening-hours';

const links = [
  { label: 'Boulangerie', href: '/creations?filtre=pain' },
  { label: 'Pâtisserie', href: '/creations?filtre=patisserie' },
  { label: 'Gâteaux', href: '/commander' },
  { label: 'Contact', href: '/contact' },
  { label: 'Horaires', href: '/contact#infos' },
];

/** Pied de page éditorial : le nom en très grand sur bleu nuit, puis l'essentiel pour venir. */
export function Footer({ week }: { week: Interval[][] }) {
  const socials = Object.entries(site.social).filter((e): e is [string, string] => !!e[1]);
  return (
    <footer className="footer">
      <div className="wrap">
        <p className="footer-mark" aria-hidden="true">
          Le Duo <em>d’Artisans</em>
        </p>

        <div className="footer-top">
          <div>
            <h2 className="footer-h">La boutique</h2>
            <p>
              {site.address.street}
              <br />
              {site.address.postalCode} {site.address.city}
            </p>
            <p className="footer-gap">
              <a href={site.phone.href}>{site.phone.display}</a>
            </p>
            <p>
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
            <h2 className="footer-h">La maison</h2>
            <ul className="footer-links">
              {links.map((item) => (
                <li key={item.label}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
            {socials.length > 0 && (
              <p className="footer-gap">
                {socials.map(([name, url]) => (
                  <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="footer-social">
                    {name}
                  </a>
                ))}
              </p>
            )}
          </div>

          <div className="footer-order">
            <h2 className="footer-h">Sur mesure</h2>
            <p>Un anniversaire, un événement, une envie particulière ?</p>
            <Link className="footer-cta" href="/commander">
              Commander un gâteau →
            </Link>
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
