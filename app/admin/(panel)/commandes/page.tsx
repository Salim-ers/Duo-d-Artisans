import Link from 'next/link';
import { Card, DemoTag, Empty, PageTitle, PayBadge, StatusBadge } from '@/components/admin/bits';
import { AutoSelect, PrintButton, Submit } from '@/components/admin/ui';
import { getOrder, listOrders, slotTimes } from '@/lib/admin';
import { isIsoDate, today } from '@/lib/dates';
import { capitalize, formatDate, formatDateTime, formatTime, money } from '@/lib/format';
import { orderStatusLabel, orderStatuses } from '@/lib/labels';
import { orderMarkPaid, orderResend, orderStatusAction, orderUpdate } from '../../actions';

export const metadata = { title: 'Commandes' };

type SP = { q?: string; status?: string; date?: string; time?: string; client?: string; page?: string; ouvrir?: string };

const statusOptions = orderStatuses.map((s) => ({ value: s, label: orderStatusLabel[s] }));

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const date = sp.date && isIsoDate(sp.date) ? sp.date : undefined;
  const filter = { q: sp.q, status: sp.status, date, time: sp.time, customer: sp.client, page: Number(sp.page) || 1 };
  const [list, times, opened] = await Promise.all([listOrders(filter), date ? slotTimes(date) : Promise.resolve([]), sp.ouvrir ? getOrder(sp.ouvrir) : Promise.resolve(null)]);

  const qs = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ q: sp.q, status: sp.status, date, time: sp.time, client: sp.client, ...extra })) if (v) p.set(k, v);
    const s = p.toString();
    return '/admin/commandes' + (s ? '?' + s : '');
  };
  const here = qs({ page: sp.page, ouvrir: sp.ouvrir });
  const total = list.rows.reduce((t, o) => t + (o.status !== 'cancelled' ? o.totalCents : 0), 0);
  const d = today();

  return (
    <>
      <PageTitle title="Commandes" sub={date ? `Retraits du ${formatDate(date, 'full')}` : 'Toutes les commandes, les plus récentes d’abord'}>
        <Link href={qs({ date: d, page: undefined })} className="abtn abtn--ghost">
          Aujourd’hui
        </Link>
        <Link href={`/admin/feuille?date=${date ?? d}`} className="abtn">
          Feuille de production
        </Link>
      </PageTitle>

      <form className="afilters" action="/admin/commandes">
        <input name="q" defaultValue={sp.q} placeholder="Numéro, nom, téléphone, e-mail…" aria-label="Rechercher" />
        <input name="date" type="date" defaultValue={date} aria-label="Date de retrait" />
        <select name="status" defaultValue={sp.status ?? ''} aria-label="Statut">
          <option value="">Tous les statuts</option>
          <option value="open">En cours</option>
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {date && times.length > 0 && (
          <select name="time" defaultValue={sp.time ?? ''} aria-label="Créneau">
            <option value="">Tous les créneaux</option>
            {times.map((t) => (
              <option key={t} value={t}>
                {formatTime(t)}
              </option>
            ))}
          </select>
        )}
        {sp.client && <input type="hidden" name="client" value={sp.client} />}
        <button type="submit" className="abtn">
          Filtrer
        </button>
        {(sp.q || sp.status || date || sp.client) && (
          <Link href="/admin/commandes" className="alink">
            Effacer
          </Link>
        )}
      </form>

      {list.rows.length ? (
        <div className="atable-wrap">
          <table className="atable">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Retrait</th>
                <th>Produits</th>
                <th className="num">Montant</th>
                <th>Paiement</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((o) => (
                <tr key={o.id} data-selected={sp.ouvrir === o.id || undefined} className={o.status === 'cancelled' ? 'aoff' : undefined}>
                  <td className="nowrap">
                    <Link href={qs({ page: sp.page, ouvrir: o.id })} className="atable-link amono" scroll={false}>
                      {o.number}
                    </Link>{' '}
                    <DemoTag show={o.isDemo} />
                  </td>
                  <td>
                    <strong>{o.lastName}</strong> {o.firstName}
                    <br />
                    <span className="amuted">{o.phone}</span>
                  </td>
                  <td className="nowrap">
                    <strong>{formatTime(o.pickupTime)}</strong>
                    <br />
                    <span className="amuted">{o.pickupDate === d ? 'Aujourd’hui' : formatDate(o.pickupDate, 'day')}</span>
                  </td>
                  <td className="atable-items">{o.items.map((i) => `${i.quantity} × ${i.name}${i.variantLabel ? ' (' + i.variantLabel + ')' : ''}`).join(', ')}</td>
                  <td className="num">{money(o.totalCents)}</td>
                  <td>
                    <PayBadge status={o.paymentStatus} />
                  </td>
                  <td>
                    <form action={orderStatusAction}>
                      <input type="hidden" name="id" value={o.id} />
                      <input type="hidden" name="back" value={here} />
                      <AutoSelect name="status" defaultValue={o.status} options={statusOptions} label={`Statut de ${o.number}`} />
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="amuted">
                  {list.rows.length} commande(s) affichée(s)
                </td>
                <td className="num strong">{money(total)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <Empty>Aucune commande ne correspond à ces critères.</Empty>
      )}

      {(list.page > 1 || list.more) && (
        <nav className="apager" aria-label="Pages">
          {list.page > 1 && (
            <Link className="abtn abtn--ghost" href={qs({ page: String(list.page - 1) })}>
              ← Précédentes
            </Link>
          )}
          {list.more && (
            <Link className="abtn abtn--ghost" href={qs({ page: String(list.page + 1) })}>
              Suivantes →
            </Link>
          )}
        </nav>
      )}

      {opened && <OrderPanel data={opened} back={here} close={qs({ page: sp.page })} />}
    </>
  );
}

/** Panneau détaillé d'une commande (ouvert par ?ouvrir=…). */
function OrderPanel({ data, back, close }: { data: NonNullable<Awaited<ReturnType<typeof getOrder>>>; back: string; close: string }) {
  const { order: o, items, notifications } = data;
  const due = o.totalCents - o.amountPaidCents;
  const flow = ['confirmed', 'in_preparation', 'ready', 'collected'] as const;
  return (
    <>
      <Link href={close} className="apanel-scrim" aria-label="Fermer le panneau" scroll={false} />
      <aside className="apanel" aria-label={`Commande ${o.number}`}>
        <div className="apanel-head">
          <div>
            <h2 className="amono">{o.number}</h2>
            <span className="amuted">Passée le {formatDateTime(o.createdAt)}</span>
          </div>
          <div className="abtns">
            <PrintButton />
            <Link href={close} className="abtn abtn--ghost" scroll={false}>
              Fermer
            </Link>
          </div>
        </div>
        <div className="apanel-body">
          {o.isDemo && <p className="awarn">Commande d’exemple (mode démonstration).</p>}
          <div className="abtns">
            <StatusBadge status={o.status} />
            <PayBadge status={o.paymentStatus} />
          </div>

          {o.status !== 'cancelled' && (
            <Card title="Avancement">
              <div className="astatus-flow">
                {flow.map((st) => (
                  <form key={st} action={orderStatusAction}>
                    <input type="hidden" name="id" value={o.id} />
                    <input type="hidden" name="status" value={st} />
                    <input type="hidden" name="back" value={back} />
                    <Submit className={'abtn abtn--sm ' + (o.status === st ? '' : 'abtn--ghost')}>{orderStatusLabel[st]}</Submit>
                  </form>
                ))}
                <form action={orderStatusAction}>
                  <input type="hidden" name="id" value={o.id} />
                  <input type="hidden" name="status" value="cancelled" />
                  <input type="hidden" name="back" value={back} />
                  <Submit className="abtn abtn--sm abtn--danger" confirm="Annuler cette commande ? Le stock et le créneau seront libérés et le client prévenu.">
                    Annuler
                  </Submit>
                </form>
              </div>
            </Card>
          )}

          <Card title="Retrait">
            <p className="strong" style={{ fontSize: 18 }}>
              {capitalize(formatDate(o.pickupDate, 'full'))} à {formatTime(o.pickupTime)}
            </p>
            {o.customerNote && <p className="ainstr">« {o.customerNote} »</p>}
          </Card>

          <Card title="Produits">
            <ul className="aitems">
              {items.map((i) => (
                <li key={i.id}>
                  <span className="aqty">{i.quantity}×</span>
                  <span>
                    {i.name}
                    {(i.variantLabel || i.options) && <small>{[i.variantLabel, i.options].filter(Boolean).join(' · ')}</small>}
                  </span>
                  <span className="num">{money(i.unitPriceCents * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="adl">
              {o.discountCents > 0 && (
                <div>
                  <dt>Remise</dt>
                  <dd>
                    − {money(o.discountCents)} ({o.promoLabel})
                  </dd>
                </div>
              )}
              <div>
                <dt>Total</dt>
                <dd className="strong">{money(o.totalCents)}</dd>
              </div>
              <div>
                <dt>Paiement</dt>
                <dd>
                  {o.paymentMethod === 'online' ? 'En ligne (Stripe)' : 'En boutique'} — réglé {money(o.amountPaidCents)}
                  {due > 0 && o.status !== 'cancelled' && (
                    <form action={orderMarkPaid} style={{ marginTop: 6 }}>
                      <input type="hidden" name="id" value={o.id} />
                      <input type="hidden" name="back" value={back} />
                      <Submit className="abtn abtn--sm abtn--ok">Encaisser {money(due)}</Submit>
                    </form>
                  )}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Client">
            <dl className="adl">
              <div>
                <dt>Nom</dt>
                <dd>
                  {o.firstName} {o.lastName}
                  {o.customerId && (
                    <>
                      {' '}
                      ·{' '}
                      <Link className="alink" href={`/admin/clients/${o.customerId}`}>
                        fiche client
                      </Link>
                    </>
                  )}
                </dd>
              </div>
              <div>
                <dt>Téléphone</dt>
                <dd>
                  <a href={`tel:${o.phone}`}>{o.phone}</a>
                </dd>
              </div>
              <div>
                <dt>E-mail</dt>
                <dd>
                  <a href={`mailto:${o.email}`}>{o.email}</a>
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Modifier">
            <form action={orderUpdate} className="aform aform--grid">
              <input type="hidden" name="id" value={o.id} />
              <input type="hidden" name="back" value={back} />
              <label className="afield">
                <span>Date de retrait</span>
                <input type="date" name="pickupDate" defaultValue={o.pickupDate} required />
              </label>
              <label className="afield">
                <span>Heure</span>
                <input type="time" name="pickupTime" defaultValue={o.pickupTime} required />
              </label>
              <label className="afield afield--full">
                <span>Note interne (non visible du client)</span>
                <textarea name="internalNote" rows={2} defaultValue={o.internalNote ?? ''} maxLength={2000} />
              </label>
              <Submit>Enregistrer</Submit>
            </form>
          </Card>

          <Card title="E-mails au client">
            <div className="abtns">
              {(['received', 'confirmed', 'ready'] as const).map((k) => (
                <form key={k} action={orderResend}>
                  <input type="hidden" name="id" value={o.id} />
                  <input type="hidden" name="kind" value={k} />
                  <input type="hidden" name="back" value={back} />
                  <Submit className="abtn abtn--ghost abtn--sm">{{ received: 'Renvoyer la confirmation', confirmed: 'Commande confirmée', ready: 'Commande prête' }[k]}</Submit>
                </form>
              ))}
            </div>
            {notifications.length > 0 && (
              <ul className="alist">
                {notifications.map((n) => (
                  <li key={n.id} className="alist-row">
                    {formatDateTime(n.createdAt)} — {n.subject} — <span className={'astatus-' + n.status}>{{ sent: 'envoyé', failed: 'échec', skipped: 'non envoyé (e-mail non configuré)', queued: 'en attente' }[n.status]}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </aside>
    </>
  );
}
