import type { Metadata } from 'next';
import { PageHero } from '@/components/sections/PageHero';
import { PracticalInfo } from '@/components/sections/PracticalInfo';
import { ContactForm } from '@/components/forms/ContactForm';
import { SectionMark } from '@/components/ui/SectionMark';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { media } from '@/data/media';
import { site } from '@/data/site';
import { breadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Contact & horaires',
  description:
    'Le Duo d’Artisans, 7 Rue Anatole France, 60290 Rantigny. Téléphone 03 44 28 55 61. Horaires, itinéraire et formulaire de contact.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([{ name: 'Accueil', path: '/' }, { name: 'Contact', path: '/contact' }]),
          ),
        }}
      />

      <PageHero
        crumb="Contact"
        title={<>Une envie ? Une question ?<br />Passez nous voir.</>}
        lede={`${site.address.street}, ${site.address.postalCode} ${site.address.city} — ${site.phone.display}`}
        image={media.facade}
        position="center 48%"
      />

      <PracticalInfo />

      <section className="section bg-paper">
        <div className="container info-grid">
          <div>
            <SectionMark>Écrire à la boutique</SectionMark>
            <h2 className="display d-m reveal" data-delay=".06s">
              Pour tout le reste,<br />ce formulaire suffit.
            </h2>
            <p className="lede reveal" data-delay=".12s" style={{ marginTop: 22 }}>
              Question sur un produit, une commande, une disponibilité : écrivez-nous, la boutique
              vous répond. Pour une réponse immédiate, le téléphone reste le plus rapide.
            </p>
          </div>
          <ContactForm />
        </div>
      </section>

      <FinalCTA />
    </>
  );
}
