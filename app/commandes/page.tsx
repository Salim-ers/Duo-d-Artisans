import type { Metadata } from 'next';
import { PageHero } from '@/components/sections/PageHero';
import { OrderForm } from '@/components/forms/OrderForm';
import { SectionMark } from '@/components/ui/SectionMark';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { media } from '@/data/media';
import { site } from '@/data/site';

export const metadata: Metadata = {
  title: 'Commandes & événements',
  description:
    'Gâteaux d’anniversaire, desserts à partager, demandes particulières : contactez Le Duo d’Artisans à Rantigny pour connaître les possibilités et les délais.',
  alternates: { canonical: '/commandes' },
};

const kinds = [
  { title: 'Gâteaux', text: 'Pièces d’anniversaire et créations à partager.' },
  { title: 'Événements', text: 'Desserts pour une occasion, propositions traiteur.' },
  { title: 'Demandes particulières', text: 'Une idée précise ? Parlons-en directement.' },
];

export default function CommandesPage() {
  return (
    <>
      <PageHero
        crumb="Commandes & événements"
        title={<>Quelque chose<br />à célébrer ?</>}
        lede="Anniversaires, événements, desserts à partager : la boutique étudie chaque demande."
        image={media.numberCake}
        position="center 40%"
      />

      <section className="section bg-cream">
        <div className="container info-grid">
          <div>
            <SectionMark>Ce qui est possible</SectionMark>
            <h2 className="display d-m reveal" data-delay=".06s">Dites-nous ce que vous avez en tête.</h2>
            <p className="lede reveal" data-delay=".12s" style={{ marginTop: 22 }}>
              Contactez directement la boutique pour connaître les possibilités, disponibilités,
              délais et tarifs. Vous pouvez aussi passer nous voir : c’est souvent plus simple pour
              choisir une pièce ou un format.
            </p>

            <div className="values" style={{ gridTemplateColumns: '1fr', marginTop: 36 }}>
              {kinds.map((kind, i) => (
                <div className="value reveal" data-delay={`${i * 0.08}s`} key={kind.title}>
                  <h3>{kind.title}</h3>
                  <p>{kind.text}</p>
                </div>
              ))}
            </div>

            <p className="info-block reveal" style={{ marginTop: 34 }}>
              <span className="info-label">Le plus direct</span>
              <a className="info-value" href={site.phone.href}>{site.phone.display}</a>
            </p>
          </div>

          <OrderForm />
        </div>
      </section>

      <FinalCTA />
    </>
  );
}
