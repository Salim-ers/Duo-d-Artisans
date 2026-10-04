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
          <b>Commande en ligne</b> : prénom, nom, téléphone, e-mail, produits, créneau de retrait, remarque éventuelle — pour préparer la
          commande, vous prévenir et vous la remettre.
        </li>
        <li>
          <b>Commande personnalisée</b> : les mêmes coordonnées, la description de votre demande et, si vous en joignez, vos images
          d’inspiration — pour étudier la demande et vous répondre. Ces images ne sont visibles que par l’équipe de la boutique.
        </li>
        <li>
          <b>Formulaire de contact</b> : nom, e-mail, téléphone facultatif et message — pour vous répondre.
        </li>
      </ul>
      <p>
        Une fiche client regroupe vos commandes (nombre, montant, dates) afin que la boutique puisse retrouver votre historique.
        Aucune donnée n’est revendue ni utilisée à des fins publicitaires. Base légale : exécution de la commande ou de la demande.
      </p>

      <h2>Paiement</h2>
      <p>
        Le paiement en ligne, lorsqu’il est proposé, est assuré par Stripe sur sa propre page sécurisée. La boutique ne reçoit ni ne
        conserve aucune donnée de carte bancaire.
      </p>

      <h2>Destinataires et sous-traitants</h2>
      <p>
        L’équipe de la boutique ; l’hébergeur du site ({site.legal.host.name}) ; l’hébergeur de la base de données ; le prestataire
        d’envoi d’e-mails ; Stripe pour les paiements en ligne.
      </p>

      <h2>Durée de conservation</h2>
      <p>
        Les données de commande sont conservées le temps nécessaire à la relation commerciale et aux obligations comptables. Les
        messages et demandes non suivies de commande sont supprimés lorsqu’ils ne sont plus utiles.
      </p>

      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation et d’opposition. Pour les
        exercer, contactez la boutique au {site.phone.display} ou en boutique. Vous pouvez aussi saisir la CNIL (cnil.fr).
      </p>

      <h2 id="cookies">Cookies et stockage local</h2>
      <p>
        Ce site ne dépose aucun cookie de mesure d’audience ni de publicité : aucun bandeau n’est donc nécessaire. Votre panier est
        conservé dans votre navigateur (stockage local) jusqu’à la commande. Le plan Google Maps de la page Contact n’est chargé que si
        vous cliquez sur « Afficher le plan » : Google peut alors déposer ses propres cookies.
      </p>
    </article>
  );
}
