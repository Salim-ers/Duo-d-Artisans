import type { Metadata } from 'next';
import { site } from '@/data/site';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Traitement des données personnelles et usage des cookies sur le site Le Duo d’Artisans.',
  alternates: { canonical: '/politique-confidentialite' },
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <section className="section bg-cream" style={{ paddingTop: 'calc(var(--space-section) + 70px)' }}>
      <div className="container" style={{ maxWidth: 820 }}>
        <h1 className="display d-l">Politique de confidentialité</h1>

        <div className="lede" style={{ marginTop: 36, display: 'grid', gap: 28 }}>
          <div>
            <h2 className="info-label">Données collectées</h2>
            <p>
              Les formulaires de contact et de demande de commande collectent uniquement les
              informations nécessaires au traitement de votre demande : nom, prénom, téléphone,
              e-mail et contenu du message.
            </p>
          </div>
          <div>
            <h2 className="info-label">Finalité et conservation</h2>
            <p>
              Ces données servent exclusivement à répondre à votre demande. Elles ne sont ni revendues,
              ni transmises à des tiers à des fins commerciales, et sont conservées le temps nécessaire
              au traitement de la demande.
            </p>
          </div>
          <div>
            <h2 className="info-label">Vos droits</h2>
            <p>
              Conformément au RGPD, vous disposez d’un droit d’accès, de rectification et de suppression
              de vos données. Pour l’exercer, contactez la boutique au {site.phone.display}.
            </p>
          </div>
          <div id="cookies">
            <h2 className="info-label">Cookies</h2>
            <p>
              Ce site ne dépose aucun cookie de mesure d’audience ni de publicité. Aucune bannière de
              consentement n’est donc affichée. Si un outil de statistiques était ajouté par la suite,
              un bandeau de consentement conforme serait mis en place au préalable.
            </p>
          </div>
          <div>
            <h2 className="info-label">Services tiers</h2>
            <p>
              La carte d’accès est fournie par Google Maps : son affichage peut entraîner un dépôt de
              cookies par Google. Elle n’est chargée qu’au moment de l’affichage de la section concernée.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
