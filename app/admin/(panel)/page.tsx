import Link from 'next/link';
import { Card, DemoTag, Empty, Kpi, PageTitle, PayBadge, StatusBadge } from '@/components/admin/bits';
import { AIcon } from '@/components/admin/icons';
import { Submit } from '@/components/admin/ui';
import { todayStats, unreadNotifications, upcomingPickups } from '@/lib/admin';
import { today } from '@/lib/dates';
import { capitalize, formatDate, formatDateTime, formatTime, money } from '@/lib/format';
import { releaseExpiredPayments } from '@/lib/orders';
import { markNotificationsRead } from '../actions';

export const metadata = { title: 'Tableau de bord' };

const noteIcon = (type: string) => (type.startsWith('custom') ? 'cake' : type.startsWith('message') ? 'messages' : type.startsWith('stock') ? 'stock' : 'orders');

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ interdit?: string }> }) {
  const [sp, t, next, notes] = await Promise.all([searchParams, todayStats(), upcomingPickups(12), unreadNotifications(), releaseExpiredPayments()]);
  const d = today();
  return (
    <>
      <PageTitle title="Aujourd’hui" sub={capitalize(formatDate(d, 'full'))}>
        <Link href="/admin/commandes?status=open" className="abtn abtn--ghost">
          Commandes en cours
        </Link>
        <Link href={`/admin/feuille?date=${d}`} className="abtn">
          <AIcon name="sheet" /> Feuille de production
        </Link>
      </PageTitle>
      {sp.interdit && <p className="aerr">Cette section est réservée aux administrateurs.</p>}

      <div className="akpis">
        <Kpi label="Commandes aujourd’hui" value={t.orders} tone="accent" href={`/admin/commandes?date=${d}`} />
        <Kpi label="CA aujourd’hui" value={money(t.revenue)} tone="accent" />
        <Kpi label="À préparer" value={t.toPrepare} tone="warn" href={`/admin/commandes?date=${d}&status=open`} />
        <Kpi label="En préparation" value={t.inPreparation} tone="info" href={`/admin/commandes?date=${d}&status=in_preparation`} />
        <Kpi label="Prêtes" value={t.ready} tone="ok" href={`/admin/commandes?date=${d}&status=ready`} />
        <Kpi label="Retirées" value={t.collected} tone="muted" href={`/admin/commandes?date=${d}&status=collected`} />
      </div>

      <div className="agrid">
        <Card
          title="Prochains retraits"
          action={
            <Link href="/admin/production" className="alink">
              Mode production →
            </Link>
          }
        >
          {next.length ? (
            <ul className="apickups">
              {next.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/commandes?ouvrir=${o.id}${o.pickupDate === d ? `&date=${d}` : ''}`} className="apickup">
                    <span className="apickup-time">
                      {o.pickupDate !== d && <small>{formatDate(o.pickupDate, 'day')}</small>}
                      {formatTime(o.pickupTime)}
                    </span>
                    <span className="apickup-who">
                      <span>
                        <strong>{o.lastName}</strong> {o.firstName} <span className="amuted">· {o.number}</span> <DemoTag show={o.isDemo} />
                      </span>
                      <small>{o.items.map((i) => `${i.quantity} × ${i.name}${i.variantLabel ? ' (' + i.variantLabel + ')' : ''}`).join(', ')}</small>
                    </span>
                    <span className="apickup-side">
                      <b>{money(o.totalCents)}</b>
                      <StatusBadge status={o.status} />
                      {o.paymentStatus !== 'on_site' && <PayBadge status={o.paymentStatus} />}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Aucun retrait prévu pour le moment.</Empty>
          )}
        </Card>

        <div className="astack">
          <Card title="À traiter">
            <ul className="atodo">
              <li>
                <Link href="/admin/personnalisees?status=a-traiter">
                  Demandes personnalisées <b data-zero={!t.customPending || undefined}>{t.customPending}</b>
                </Link>
              </li>
              <li>
                <Link href="/admin/messages">
                  Messages non lus <b data-zero={!t.unreadMessages || undefined}>{t.unreadMessages}</b>
                </Link>
              </li>
              <li>
                <Link href={`/admin/commandes?date=${d}`}>
                  Retraits du jour <b data-zero={!t.pickupsToday || undefined}>{t.pickupsToday}</b>
                </Link>
              </li>
            </ul>
          </Card>
          <Card
            title="Notifications"
            action={
              notes.length ? (
                <form action={markNotificationsRead}>
                  <input type="hidden" name="back" value="/admin" />
                  <Submit className="alink">Tout marquer lu</Submit>
                </form>
              ) : undefined
            }
          >
            {notes.length ? (
              <ul className="anotes">
                {notes.map((n) => (
                  <li key={n.id}>
                    <Link href={n.href ?? '/admin'}>
                      <span className="anote-icon">
                        <AIcon name={noteIcon(n.type)} />
                      </span>
                      <strong>
                        {n.subject} <DemoTag show={n.isDemo} />
                      </strong>
                      <span>{n.body}</span>
                      <small>{formatDateTime(n.createdAt)}</small>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Rien de nouveau.</Empty>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
