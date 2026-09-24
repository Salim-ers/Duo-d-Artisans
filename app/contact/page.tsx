import Link from 'next/link';
import { media } from '@/data/media';
import { site } from '@/data/site';
import { JsonLd } from '@/components/ui/JsonLd';
import { Practical } from '@/components/sections/Practical';
import { ContactForm } from '@/components/forms/ContactForm';
import { MapEmbed } from '@/components/contact/MapEmbed';
import { pageMetadata } from '@/lib/seo';
import { breadcrumbSchema } from '@/lib/schema';

export const metadata = pageMetadata({
  title: 'Contact, horaires et accès',
  description:
    'Le Duo d’Artisans, 7 rue Anatole France, 60290 Rantigny — 03 44 28 55 61. Horaires d’ouverture, itinéraire, plan d’accès et formulaire de contact.',
  path: '/contact',
  image: media.facade,
});

export default function ContactPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Contact', path: '/contact' }])} />

      <section className="opening-type opening-type--compact" aria-labelledby="contact-title">
        <div className="wrap opening-type-grid">
          <div>
            <p className="folio">Contact</p>
            <h1 id="contact-title" className="t-xxl">Passez<br /><em>nous voir.</em></h1>
          </div>
          <p className="t-lead">
            Le plus simple reste d’appeler la boutique au{' '}
            <a className="lnk" href={site.phone.href}>{site.phone.display}</a> ou de pousser la porte.
            Pour le reste, le formulaire est plus bas.
          </p>
        </div>
      </section>

      <Practical title={false} />

      <section className="contact-more" aria-labelledby="write-title">
        <div className="wrap contact-grid">
          <div>
            <h2 id="write-title" className="t-l">Écrire<br /><em>à la boutique.</em></h2>
            <p className="t-body">
              Une question sur un produit, une disponibilité ? Écrivez-nous, la boutique vous répond.
              Pour une commande, utilisez plutôt la <Link className="lnk" href="/commandes">demande de commande</Link>.
            </p>
            <MapEmbed />
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
