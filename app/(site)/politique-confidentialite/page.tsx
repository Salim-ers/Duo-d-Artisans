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

      <h2>Responsable du traitement</h2>
      <p>
        {site.legal.name}, {site.legal.form}, {site.address.street}, {site.address.postalCode} {site.address.city} — {site.phone.display}.
      </p>

      <h2>Données collectées et finalités</h2>
      <ul>
        <li>
          <b>Commande de gâteau</b> : prénom, nom, téléphone, e-mail, description de votre demande et, si vous en joignez, vos images
          d’inspiration — pour étudier la demande, vous envoyer une proposition et préparer le gâteau. Ces images ne sont visibles que
          par l’équipe de la boutique.
        </li>
        <li>
          <b>Formulaire de contact</b> : nom, e-mail, téléphone facultatif et message — pour vous répondre.
        </li>
      </ul>
      <p>
        Une fiche client regroupe vos demandes afin que la boutique puisse retrouver votre historique. Aucune donnée n’est revendue ni
        utilisée à des fins publicitaires. Base légale : traitement de votre demande. Aucun paiement n’est réalisé sur ce site.
      </p>

      <h2>Destinataires et sous-traitants</h2>
      <p>L’équipe de la boutique ; l’hébergeur du site ({site.legal.host.name}) ; l’hébergeur de la base de données ; le prestataire d’envoi d’e-mails.</p>

      <h2>Durée de conservation</h2>
      <p>
        Les demandes sont conservées le temps nécessaire à leur traitement et à la relation commerciale. Les messages sont supprimés
        lorsqu’ils ne sont plus utiles.
      </p>

      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation et d’opposition. Pour les
        exercer, contactez la boutique au {site.phone.display} ou en boutique. Vous pouvez aussi saisir la CNIL (cnil.fr).
      </p>

      <h2 id="cookies">Cookies et stockage local</h2>
      <p>
        Ce site ne dépose aucun cookie de mesure d’audience ni de publicité : aucun bandeau n’est donc nécessaire. Le plan Google Maps
        de la page Contact n’est chargé que si vous cliquez sur « Afficher le plan » : Google peut alors déposer ses propres cookies.
      </p>
    </article>
  );
}
