import { fullAddress, site } from '@/data/site';
import { pageMetadata } from '@/lib/seo';
import { getSetting } from '@/lib/settings';
import { stripeEnabled } from '@/lib/env';

export const metadata = pageMetadata({
  title: 'Conditions de vente',
  description: 'Conditions de vente de la commande en ligne avec retrait en boutique — Le Duo d’Artisans, Rantigny.',
  path: '/conditions-de-vente',
  noindex: true,
});

export const revalidate = 3600;

/**
 * Conditions générales de vente : uniquement des règles certaines (identité, prix affichés,
 * moyens de paiement réellement activés, retrait en boutique) et des rappels légaux.
 * À relire et compléter par la boutique (voir README).
 */
export default async function CgvPage() {
  const payments = await getSetting('payments');
  const online = payments.online && stripeEnabled();
  return (
    <article className="legal wrap">
      <h1 className="t-xl">Conditions de vente</h1>

      <h2>Vendeur</h2>
      <p>
        {site.legal.name}, {site.legal.form} — SIREN {site.legal.siren} — {fullAddress} — {site.phone.display}.
      </p>

      <h2>Commande</h2>
      <p>
        Les commandes passées sur ce site sont des commandes de produits à retirer en boutique, au jour et au créneau choisis lors de
        la commande parmi ceux proposés. Un numéro de commande et un récapitulatif sont affichés à la validation, puis envoyés par
        e-mail.
      </p>
      <p>
        Les commandes personnalisées (gâteaux, événements) font l’objet d’une demande : elles ne deviennent des commandes qu’après
        proposition de la boutique et accord du client.
      </p>

      <h2>Prix</h2>
      <p>Les prix sont indiqués en euros toutes taxes comprises. Le prix facturé est celui affiché au moment de la validation de la commande.</p>

      <h2>Paiement</h2>
      <p>
        {online && payments.onSite
          ? 'Le paiement s’effectue en ligne par carte bancaire (page sécurisée Stripe) ou en boutique au moment du retrait, selon le choix fait à la commande.'
          : online
            ? 'Le paiement s’effectue en ligne par carte bancaire, sur la page sécurisée de Stripe.'
            : 'Le paiement s’effectue en boutique, au moment du retrait.'}{' '}
        Aucune donnée bancaire n’est conservée par la boutique.
      </p>

      <h2>Retrait</h2>
      <p>
        Les produits sont à retirer à la boutique, {fullAddress}, au créneau choisi. Présentez votre numéro de commande. Pour tout
        empêchement, prévenez la boutique au {site.phone.display}.
      </p>

      <h2>Droit de rétractation</h2>
      <p>
        Conformément à l’article L221-28 du Code de la consommation, le droit de rétractation ne s’applique pas aux denrées
        susceptibles de se détériorer ou de se périmer rapidement, ni aux biens confectionnés selon les spécifications du client.
      </p>

      <h2>Allergènes</h2>
      <p>
        Les allergènes renseignés figurent sur la fiche de chaque produit. Pour toute allergie ou intolérance, interrogez la boutique
        avant de commander.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Voir la <a className="lnk" href="/politique-confidentialite">politique de confidentialité</a>.
      </p>
    </article>
  );
}
