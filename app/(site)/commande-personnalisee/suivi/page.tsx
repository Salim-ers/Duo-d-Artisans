import type { Metadata } from 'next';
import Link from 'next/link';
import '../../pages.css';
import '../../shop-pages.css';
import { site } from '@/data/site';
import { acceptCustomQuote } from '@/app/(site)/actions';
import { findCustomForCustomer } from '@/lib/custom';
import { capitalize, formatDate, formatTime, money } from '@/lib/format';
import { customStatusLabel } from '@/lib/labels';
import { Arrow } from '@/components/ui/Arrow';

export const metadata: Metadata = { title: 'Suivi de votre demande', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const flow = ['new_request', 'reviewing', 'quote_sent', 'accepted', 'in_preparation', 'ready', 'collected'] as const;

export default async function CustomTrackPage({ searchParams }: { searchParams: Promise<{ n?: string; t?: string }> }) {
  const sp = await searchParams;
  const c = await findCustomForCustomer(sp.n ?? '', sp.t ?? '');
  if (!c)
    return (
      <section className="wrap co-done">
        <h1 className="t-xl">Demande introuvable</h1>
        <p className="t-lead">Le lien est peut-être incomplet. Appelez la boutique au {site.phone.display}.</p>
      </section>
    );
  const idx = flow.indexOf(c.status as (typeof flow)[number]);
  return (
    <section className="wrap track" aria-labelledby="track-title">
      <span className="kicker">Demande {c.number}</span>
      <h1 id="track-title" className="t-xl">
        {customStatusLabel[c.status]}
      </h1>
      {c.status === 'refused' ? (
        <p className="t-lead">La boutique ne peut malheureusement pas réaliser cette demande. {c.quoteMessage}</p>
      ) : (
        <ol className="track-steps">
          {['Reçue', 'Étudiée', 'Devis', 'Acceptée', 'En préparation', 'Prête', 'Retirée'].map((label, i) => (
            <li key={label} data-done={i <= idx || undefined}>
              {label}
            </li>
          ))}
        </ol>
      )}
      <dl className="track-facts">
        <div>
          <dt>Création</dt>
          <dd>{c.type}</dd>
        </div>
        <div>
          <dt>Date souhaitée</dt>
          <dd>
            {capitalize(formatDate(c.desiredDate, 'full'))}
            {c.pickupTime ? ` à ${formatTime(c.pickupTime)}` : ''}
          </dd>
        </div>
        <div>
          <dt>Personnes</dt>
          <dd>{c.servings}</dd>
        </div>
        {c.quoteCents != null && (
          <div>
            <dt>Prix proposé</dt>
            <dd>{money(c.quoteCents)}</dd>
          </div>
        )}
      </dl>
      {c.quoteMessage && c.status !== 'refused' && <p className="done-instructions">{c.quoteMessage}</p>}
      {c.status === 'quote_sent' && (
        <form action={acceptCustomQuote} className="track-accept">
          <input type="hidden" name="n" value={c.number} />
          <input type="hidden" name="t" value={sp.t} />
          <button type="submit" className="btn btn--primary">
            J’accepte le devis <Arrow />
          </button>
          <p className="t-small">Le règlement se fait en boutique. Une question avant d’accepter ? {site.phone.display}</p>
        </form>
      )}
      <Link className="lnk" href="/">
        Retour à l’accueil <Arrow />
      </Link>
    </section>
  );
}
