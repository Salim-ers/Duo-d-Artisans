import Link from 'next/link';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { CustomBadge, DemoTag, Empty, PageTitle } from '@/components/admin/bits';
import { realOnly } from '@/lib/admin';
import { getDb, schema as s } from '@/lib/db';
import type { CustomStatus } from '@/lib/db/schema';
import { formatDate, formatDateTime, money } from '@/lib/format';
import { customStatusLabel, customStatuses } from '@/lib/labels';

export const metadata = { title: 'Commandes personnalisées' };

const groups: { key: string; label: string; statuses: CustomStatus[] }[] = [
  { key: 'a-traiter', label: 'À traiter', statuses: ['new_request', 'reviewing'] },
  { key: 'devis', label: 'Devis envoyés', statuses: ['quote_sent'] },
  { key: 'en-cours', label: 'En cours', statuses: ['accepted', 'in_preparation', 'ready'] },
  { key: 'terminees', label: 'Terminées', statuses: ['collected', 'refused'] },
];

export default async function CustomListPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const group = groups.find((g) => g.key === sp.status);
  const single = customStatuses.find((x) => x === sp.status);
  const db = await getDb();
  const real = await realOnly(s.customOrders);
  const [rows, counts] = await Promise.all([
    db
      .select()
      .from(s.customOrders)
      .where(and(real, group ? inArray(s.customOrders.status, group.statuses) : single ? eq(s.customOrders.status, single) : undefined))
      .orderBy(...(group?.key === 'terminees' ? [desc(s.customOrders.desiredDate)] : [asc(s.customOrders.desiredDate)]))
      .limit(200),
    db.select({ status: s.customOrders.status, n: sql<number>`count(*)::int` }).from(s.customOrders).where(real).groupBy(s.customOrders.status),
  ]);
  const n = (sts: CustomStatus[]) => counts.filter((c) => sts.includes(c.status)).reduce((t, c) => t + c.n, 0);

  return (
    <>
      <PageTitle title="Commandes personnalisées" sub="Des demandes : rien n’est accepté d’office. Étudiez, envoyez un devis, puis suivez la préparation." />
      <nav className="asegs" aria-label="Filtrer">
        <Link href="/admin/personnalisees" aria-current={!sp.status ? 'page' : undefined}>
          Toutes <small>{n(customStatuses)}</small>
        </Link>
        {groups.map((g) => (
          <Link key={g.key} href={`/admin/personnalisees?status=${g.key}`} aria-current={sp.status === g.key ? 'page' : undefined}>
            {g.label} <small>{n(g.statuses)}</small>
          </Link>
        ))}
      </nav>
      {rows.length ? (
        <ul className="acustoms">
          {rows.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/personnalisees/${c.id}`} className="acustom">
                <span className="acustom-main">
                  <strong>
                    {c.type} · {c.servings} pers. <DemoTag show={c.isDemo} />
                  </strong>
                  <span>
                    {c.firstName} {c.lastName} · {c.phone}
                  </span>
                  <span className="amuted">{[c.flavors, c.theme, c.budget ? 'Budget ' + c.budget : null].filter(Boolean).join(' · ') || 'Sans précision'}</span>
                </span>
                <span className="acustom-side">
                  <strong>Pour le {formatDate(c.desiredDate)}</strong>
                  <CustomBadge status={c.status} />
                  {c.quoteCents != null && <span>{money(c.quoteCents)}</span>}
                  <span className="amuted">
                    {c.number} · reçue le {formatDateTime(c.createdAt)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Aucune demande {group ? `« ${group.label.toLowerCase()} »` : single ? `« ${customStatusLabel[single].toLowerCase()} »` : ''} pour le moment.</Empty>
      )}
    </>
  );
}
