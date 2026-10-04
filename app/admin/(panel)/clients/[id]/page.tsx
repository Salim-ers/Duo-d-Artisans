import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CustomBadge, DemoTag, Empty, PageTitle } from '@/components/admin/bits';
import { Submit } from '@/components/admin/ui';
import { hasRole, requirePage } from '@/lib/auth/session';
import { getCustomer } from '@/lib/admin';
import { formatDate, formatDateTime, money } from '@/lib/format';
import { customerForget } from '../../../actions';

export const metadata = { title: 'Fiche client' };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, data] = await Promise.all([requirePage('STAFF'), getCustomer(id).catch(() => null)]);
  if (!data) notFound();
  const { customer: c, customs } = data;
  return (
    <>
      <PageTitle title={`${c.firstName} ${c.lastName}`} sub={`Client depuis le ${formatDateTime(c.createdAt)} · ${customs.length} demande(s)`}>
        <Link className="abtn abtn--ghost" href="/admin/clients">
          ← Clients
        </Link>
      </PageTitle>
      <DemoTag show={c.isDemo} />
      <div className="agrid" style={{ marginTop: 8 }}>
        <Card title="Demandes de gâteaux">
          {customs.length ? (
            <ul className="aitems">
              {customs.map((x) => (
                <li key={x.id}>
                  <span className="amono">{formatDate(x.desiredDate, 'short')}</span>
                  <span>
                    <Link className="atable-link" href={`/admin/personnalisees/${x.id}`}>
                      {x.type} · {x.servings} pers.
                    </Link>
                    <small>
                      {x.number}
                      {x.quoteCents != null && ` · ${money(x.quoteCents)}`}
                    </small>
                  </span>
                  <CustomBadge status={x.status} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Aucune demande.</Empty>
          )}
        </Card>
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
              <p className="amuted">Sur demande du client : la fiche est supprimée et ses demandes sont anonymisées.</p>
              <form action={customerForget}>
                <input type="hidden" name="id" value={c.id} />
                <Submit className="abtn abtn--danger" confirm="Supprimer définitivement cette fiche et anonymiser ses demandes ?">
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
