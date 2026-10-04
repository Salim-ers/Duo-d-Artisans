import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CustomBadge, DemoTag, Empty, Kpi, PageTitle, StatusBadge } from '@/components/admin/bits';
import { Submit } from '@/components/admin/ui';
import { hasRole, requirePage } from '@/lib/auth/session';
import { getCustomer } from '@/lib/admin';
import { formatDate, formatDateTime, formatTime, money } from '@/lib/format';
import { customerForget } from '../../../actions';

export const metadata = { title: 'Fiche client' };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, data] = await Promise.all([requirePage('STAFF'), getCustomer(id).catch(() => null)]);
  if (!data) notFound();
  const { customer: c, orders, customs, count, total, last } = data;
  return (
    <>
      <PageTitle title={`${c.firstName} ${c.lastName}`} sub={`Client depuis le ${formatDateTime(c.createdAt)}`}>
        <Link className="abtn abtn--ghost" href="/admin/clients">
          ← Clients
        </Link>
        <Link className="abtn" href={`/admin/commandes?client=${c.id}`}>
          Ses commandes
        </Link>
      </PageTitle>
      <DemoTag show={c.isDemo} />
      <div className="akpis" style={{ marginTop: 8 }}>
        <Kpi label="Commandes" value={count} tone="accent" />
        <Kpi label="Montant total" value={money(total)} tone="ok" />
        <Kpi label="Panier moyen" value={count ? money(Math.round(total / count)) : '—'} />
        <Kpi label="Dernière commande" value={last ? formatDate(new Date(last).toISOString().slice(0, 10), 'short') : '—'} tone="muted" />
      </div>
      <div className="agrid">
        <div className="astack">
          <Card title="Historique des commandes">
            {orders.length ? (
              <ul className="aitems">
                {orders.map((o) => (
                  <li key={o.id}>
                    <span className="amono">{formatDate(o.pickupDate, 'short')}</span>
                    <span>
                      <Link className="atable-link" href={`/admin/commandes?ouvrir=${o.id}`}>
                        {o.number}
                      </Link>{' '}
                      <small>
                        Retrait {formatTime(o.pickupTime)} · <StatusBadge status={o.status} />
                      </small>
                    </span>
                    <span className="num">{money(o.totalCents)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Aucune commande.</Empty>
            )}
          </Card>
          {customs.length > 0 && (
            <Card title="Demandes personnalisées">
              <ul className="aitems">
                {customs.map((x) => (
                  <li key={x.id}>
                    <span className="amono">{formatDate(x.desiredDate, 'short')}</span>
                    <span>
                      <Link className="atable-link" href={`/admin/personnalisees/${x.id}`}>
                        {x.type} · {x.servings} pers.
                      </Link>
                    </span>
                    <CustomBadge status={x.status} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
        <div className="astack">
          <Card title="Coordonnées">
            <dl className="adl">
              <div>
                <dt>Téléphone</dt>
                <dd>
                  <a href={`tel:${c.phone}`}>{c.phone}</a>
                </dd>
              </div>
              <div>
                <dt>E-mail</dt>
                <dd>
                  <a href={`mailto:${c.email}`}>{c.email}</a>
                </dd>
              </div>
            </dl>
          </Card>
          {hasRole(user, 'ADMIN') && (
            <Card title="Données personnelles (RGPD)">
              <p className="amuted">Sur demande du client : la fiche est supprimée et ses commandes sont anonymisées (les montants restent pour la comptabilité).</p>
              <form action={customerForget}>
                <input type="hidden" name="id" value={c.id} />
                <Submit className="abtn abtn--danger" confirm="Supprimer définitivement cette fiche et anonymiser ses commandes ?">
                  Supprimer la fiche
                </Submit>
              </form>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
