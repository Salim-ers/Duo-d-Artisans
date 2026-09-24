import { site } from '@/data/site';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Politique de confidentialité',
  description: 'Traitement des données personnelles et cookies sur le site Le Duo d’Artisans.',
  path: '/politique-confidentialite',
  noindex: true,
});

export default function PrivacyPage() {
  return (
    <article className="legal wrap">
      <h1 className="t-xl">Politique de confidentialité</h1>

      <h2>Données collectées</h2>
      <p>
        Les formulaires de contact et de demande de commande collectent uniquement les informations
        nécessaires au traitement de votre demande : prénom, nom, téléphone, e-mail, détails de la
        demande et message.
      </p>

      <h2>Finalité et conservation</h2>
      <p>
        Ces données servent exclusivement à répondre à votre demande. Elles sont transmises par e-mail
        à la boutique via un prestataire d’envoi, ne sont ni revendues ni utilisées à des fins
        commerciales, et sont conservées le temps nécessaire au traitement de la demande.
      </p>

      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d’un droit d’accès, de rectification et de suppression de
        vos données. Pour l’exercer, contactez la boutique au {site.phone.display}.
      </p>

      <h2 id="cookies">Cookies</h2>
      <p>
        Ce site ne dépose aucun cookie de mesure d’audience ni de publicité. Le plan d’accès Google Maps
        de la page Contact n’est chargé que si vous cliquez sur « Afficher le plan » : Google peut alors
        déposer ses propres cookies.
      </p>
    </article>
  );
}
