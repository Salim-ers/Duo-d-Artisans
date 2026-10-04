import Link from 'next/link';
import { Card, CustomBadge, DemoTag, Empty, Kpi, PageTitle } from '@/components/admin/bits';
import { AIcon } from '@/components/admin/icons';
import { Submit } from '@/components/admin/ui';
import { dashboardStats, pendingRequests, unreadNotifications, upcomingCakes } from '@/lib/admin';
import { capitalize, formatDate, formatDateTime, formatTime, money } from '@/lib/format';
import { markNotificationsRead } from '../actions';

export const metadata = { title: 'Tableau de bord' };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ interdit?: string }> }) {
  const [sp, t, cakes, pending, notes] = await Promise.all([searchParams, dashboardStats(), upcomingCakes(21), pendingRequests(), unreadNotifications()]);
  return (
    <>
      <PageTitle title="Aujourd’hui" sub={capitalize(formatDate(t.date, 'full'))}>
        <Link href="/admin/planning" className="abtn">
          <AIcon name="planning" /> Planning
        </Link>
      </PageTitle>
      {sp.interdit && <p className="aerr">Cette section est réservée aux administrateurs.</p>}

      <div className="akpis">
        <Kpi label="Nouvelles demandes" value={t.fresh} tone="accent" href="/admin/personnalisees?status=a-traiter" />
        <Kpi label="À étudier" value={t.reviewing} tone="warn" href="/admin/personnalisees?status=a-traiter" />
        <Kpi label="Devis envoyés" value={t.quotes} tone="info" href="/admin/personnalisees?status=devis" />
        <Kpi label="À réaliser — 7 jours" value={t.thisWeek} tone="ok" href="/admin/planning" />
        <Kpi label="Prêtes à retirer" value={t.ready} tone="muted" href="/admin/personnalisees?status=en-cours" />
        <Kpi label="Messages non lus" value={t.unreadMessages} href="/admin/messages" />
      </div>

      <div className="agrid">
        <Card
          title="Gâteaux à réaliser"
          action={
            <Link href="/admin/planning" className="alink">
              Planning →
            </Link>
          }
        >
          {cakes.length ? (
            <ul className="apickups">
              {cakes.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/personnalisees/${c.id}`} className="apickup">
                    <span className="apickup-time">
                      <small>{c.desiredDate === t.date ? 'Aujourd’hui' : formatDate(c.desiredDate, 'day')}</small>
                      {c.pickupTime ? formatTime(c.pickupTime) : '—'}
                    </span>
                    <span className="apickup-who">
                      <span>
                        <strong>
                          {c.type} · {c.servings} pers.
                        </strong>{' '}
                        <DemoTag show={c.isDemo} />
                      </span>
                      <small>
                        {c.firstName} {c.lastName}
                        {[c.flavors, c.inscription ? `« ${c.inscription} »` : null].filter(Boolean).length > 0 && ' — ' + [c.flavors, c.inscription ? `« ${c.inscription} »` : null].filter(Boolean).join(' · ')}
                      </small>
                    </span>
                    <span className="apickup-side">
                      {c.quoteCents != null && <b>{money(c.quoteCents)}</b>}
                      <CustomBadge status={c.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Aucun gâteau à réaliser dans les trois prochaines semaines.</Empty>
          )}
        </Card>

        <div className="astack">
          <Card
            title="À traiter"
            action={
              <Link href="/admin/personnalisees?status=a-traiter" className="alink">
                Tout voir →
              </Link>
            }
          >
            {pending.length ? (
              <ul className="atodo">
                {pending.map((c) => (
                  <li key={c.id}>
                    <Link href={`/admin/personnalisees/${c.id}`}>
                      <span>
                        <strong>{c.type}</strong> · {c.firstName} {c.lastName} <DemoTag show={c.isDemo} />
                        <br />
                        <span className="amuted">Pour le {formatDate(c.desiredDate)}</span>
                      </span>
                      <CustomBadge status={c.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Toutes les demandes ont une réponse.</Empty>
            )}
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
                        <AIcon name={n.type.startsWith('message') ? 'messages' : 'cake'} />
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
