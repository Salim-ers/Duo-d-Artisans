import Link from 'next/link';
import { site, fullAddress } from '@/data/site';

const columns = [
  { title: 'La Maison', links: [
    { label: 'Notre maison', href: '/la-maison' },
    { label: 'Savoir-faire', href: '/savoir-faire' },
    { label: 'Galerie', href: '/nos-creations#galerie' },
  ]},
  { title: 'Nos créations', links: [
    { label: 'Boulangerie', href: '/nos-creations?c=boulangerie' },
    { label: 'Pâtisserie', href: '/nos-creations?c=patisserie' },
    { label: 'Snacking', href: '/nos-creations?c=snacking' },
    { label: 'Gourmandises', href: '/nos-creations?c=gourmandises' },
  ]},
  { title: 'Infos', links: [
    { label: 'Horaires', href: '/contact#horaires' },
    { label: 'Adresse', href: '/contact' },
    { label: 'Commandes', href: '/commandes' },
    { label: 'Actualités', href: '/actualites' },
  ]},
  { title: 'Légal', links: [
    { label: 'Mentions légales', href: '/mentions-legales' },
    { label: 'Politique de confidentialité', href: '/politique-confidentialite' },
    { label: 'Gestion des cookies', href: '/politique-confidentialite#cookies' },
  ]},
];

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="brand-f">
            <b>Le Duo d’Artisans</b>
            <p>Deux savoir-faire.<br />Une même passion.</p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}><Link href={l.href}>{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <p>
            {site.legal.name} — {site.legal.form} · SIREN {site.legal.siren}
            <br />{fullAddress}
          </p>
          <p>
            {site.activities.slice(0, 5).join(' · ')}
            <br />Logo officiel à intégrer — composition typographique provisoire.
          </p>
        </div>
      </div>
    </footer>
  );
}
