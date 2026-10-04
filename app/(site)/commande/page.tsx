import type { Metadata } from 'next';
import Link from 'next/link';
import '../shop-pages.css';
import { fullAddress, site } from '@/data/site';
import { capitalize, formatDate, formatTime, money } from '@/lib/format';
import { customerSteps, paymentStatusLabel } from '@/lib/labels';
import { cancelUnpaid, findOrderForCustomer, reconcileOrderPayment } from '@/lib/orders';
import { getSetting } from '@/lib/settings';
import { Arrow } from '@/components/ui/Arrow';
import { CalendarLink, ClearCart } from '@/components/shop/OrderDone';

export const metadata: Metadata = { title: 'Votre commande', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

type SP = Promise<{ n?: string; t?: string; paiement?: string }>;

export default async function OrderPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  let found = await findOrderForCustomer(sp.n ?? '', sp.t ?? '');
  if (found && sp.paiement && found.order.paymentMethod === 'online') {
    // Retour de Stripe : on vérifie directement le paiement (utile même sans webhook).
    await reconcileOrderPayment(found.order);
    if (sp.paiement === 'annule') {
      const fresh = await findOrderForCustomer(sp.n ?? '', sp.t ?? '');
      if (fresh && fresh.order.paymentStatus !== 'paid') await cancelUnpaid(fresh.order);
    }
    found = await findOrderForCustomer(sp.n ?? '', sp.t ?? '');
  }

  if (!found)
    return (
      <section className="wrap co-done">
        <h1 className="t-xl">Commande introuvable</h1>
        <p className="t-lead">Le lien est peut-être incomplet. Retrouvez-le dans l’e-mail de confirmation, ou appelez la boutique au {site.phone.display}.</p>
        <Link className="btn btn--primary" href="/commander">
          Retour à la boutique <Arrow />
        </Link>
      </section>
    );

  const { order: o, items } = found;
  const ordering = await getSetting('ordering');
  const unpaid = o.paymentMethod === 'online' && o.paymentStatus !== 'paid';
  const cancelled = o.status === 'cancelled';
  const stepIndex = customerSteps.findIndex((s) => s.key.includes(o.status));

  if (cancelled && unpaid)
    return (
      <section className="wrap co-done">
        <span className="kicker">Paiement non abouti</span>
        <h1 className="t-xl">
          Aucun montant
          <br />
          <em>n’a été prélevé.</em>
        </h1>
        <p className="t-lead">Le paiement a été annulé ou n’a pas abouti : la commande n’est pas enregistrée et votre panier est conservé.</p>
        <Link className="btn btn--primary" href="/panier">
          Reprendre ma commande <Arrow />
        </Link>
      </section>
    );

  return (
    <section className="wrap co-done" aria-labelledby="done-title">
      {!unpaid && !cancelled && <ClearCart />}
      <div className="done-head">
        <span className="done-check" aria-hidden="true">
          <svg viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="24" />
            <path d="m15 27 7.5 7.5L37 19" />
          </svg>
        </span>
        <div>
          <span className="kicker">{cancelled ? 'Commande annulée' : unpaid ? 'Paiement en cours de vérification' : 'Merci !'}</span>
          <h1 id="done-title" className="t-xl">
            {cancelled ? 'Commande annulée' : unpaid ? 'Paiement en attente' : 'Commande confirmée'}
          </h1>
          {o.isDemo && <p className="demo-notice">Commande de démonstration : elle ne sera pas préparée.</p>}
        </div>
      </div>

      <div className="done-grid">
        <div className="done-main">
          <p className="done-number">
            <small>Numéro de commande</small>
            {o.number}
          </p>
          <div className="done-pickup">
            <p>
              <small>Retrait</small>
              <b>{capitalize(formatDate(o.pickupDate, 'full'))}</b>
              <b>à {formatTime(o.pickupTime)}</b>
            </p>
            <p>
              <small>Adresse</small>
              {fullAddress}
            </p>
          </div>
          {!cancelled && stepIndex >= 0 && (
            <ol className="done-steps" aria-label="Avancement">
              {customerSteps.map((s, i) => (
                <li key={s.label} data-done={i <= stepIndex || undefined} aria-current={i === stepIndex ? 'step' : undefined}>
                  {s.label}
                </li>
              ))}
            </ol>
          )}
          {ordering.instructions && !cancelled && <p className="done-instructions">{ordering.instructions}</p>}
          <div className="done-actions">
            <a className="btn btn--primary" href={site.maps.directions} target="_blank" rel="noopener noreferrer">
              Itinéraire <Arrow direction="up-right" />
            </a>
            {!cancelled && <CalendarLink title={`Retrait commande ${o.number} — ${site.displayName}`} date={o.pickupDate} time={o.pickupTime} location={fullAddress} />}
          </div>
          <p className="t-small">
            Un e-mail de confirmation est envoyé à {o.email}. Une question ? <a className="lnk" href={site.phone.href}>{site.phone.display}</a>
          </p>
        </div>

        <aside className="co-recap">
          <h2>Votre commande</h2>
          <ul className="co-recap-lines">
            {items.map((i) => (
              <li key={i.id}>
                <span>
                  {i.quantity} × {i.name}
                  {(i.variantLabel || i.options) && <small>{[i.variantLabel, i.options].filter(Boolean).join(' · ')}</small>}
                </span>
                <span className="price">{money(i.unitPriceCents * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="co-totals">
            {o.discountCents > 0 && (
              <div>
                <dt>{o.promoLabel ?? 'Remise'}</dt>
                <dd className="price">− {money(o.discountCents)}</dd>
              </div>
            )}
            <div className="co-total">
              <dt>Total</dt>
              <dd className="price">{money(o.totalCents)}</dd>
            </div>
            <div>
              <dt>Paiement</dt>
              <dd>{paymentStatusLabel[o.paymentStatus]}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
