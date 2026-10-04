import type { Metadata } from 'next';
import '../pages.css';
import { media } from '@/data/media';
import { site } from '@/data/site';
import { pageMetadata } from '@/lib/seo';
import { shopData } from '@/lib/site-data';
import { Practical } from '@/components/home/Sections';
import { ContactForm } from '@/components/forms/ContactForm';
import { MapEmbed } from '@/components/contact/MapEmbed';

export const metadata: Metadata = pageMetadata({
  title: 'Contact, horaires et accès — boulangerie à Rantigny',
  description:
    'Le Duo d’Artisans, 7 rue Anatole France, 60290 Rantigny — 03 44 28 55 61. Horaires d’ouverture, itinéraire, plan d’accès et formulaire de contact.',
  path: '/contact',
  image: media.facade,
});

export const revalidate = 300;

export default async function ContactPage() {
  const shop = await shopData();
  return (
    <>
      <Practical week={shop.week} exceptions={shop.exceptions} headingLevel={1} />
      <section className="contact-more" aria-labelledby="write-title">
        <div className="wrap contact-grid">
          <div className="contact-side">
            <h2 id="write-title" className="t-l">
              Écrire
              <br />
              <em>à la boutique.</em>
            </h2>
            <p className="t-body">
              Une question sur un produit ou une disponibilité ? Le plus simple reste d’appeler au{' '}
              <a className="lnk" href={site.phone.href}>
                {site.phone.display}
              </a>
              . Pour un gâteau sur mesure, utilisez plutôt la{' '}
              <a className="lnk" href="/commande-personnalisee">
                commande personnalisée
              </a>
              .
            </p>
            <MapEmbed />
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
