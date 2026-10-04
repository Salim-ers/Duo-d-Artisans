import Link from 'next/link';
import { DemoTag, Empty, PageTitle } from '@/components/admin/bits';
import { listCustomers } from '@/lib/admin';
import { formatDateTime } from '@/lib/format';

export const metadata = { title: 'Clients' };

/** Fiches créées automatiquement à la première demande. Seules les données utiles sont conservées. */
export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const rows = await listCustomers(sp.q);
  return (
    <>
      <PageTitle title="Clients" sub={`${rows.length} fiche(s)${sp.q ? ' trouvée(s)' : ''}`} />
      <form className="afilters" action="/admin/clients">
        <input name="q" defaultValue={sp.q} placeholder="Nom, téléphone, e-mail…" aria-label="Rechercher un client" />
        <button className="abtn" type="submit">
          Rechercher
        </button>
        {sp.q && (
          <Link href="/admin/clients" className="alink">
            Effacer
          </Link>
        )}
      </form>
      {rows.length ? (
        <div className="atable-wrap">
          <table className="atable">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Téléphone</th>
                <th>E-mail</th>
                <th className="num">Demandes</th>
                <th>Dernière demande</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ c, n, last }) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/clients/${c.id}`} className="atable-link">
                      {c.lastName} {c.firstName}
                    </Link>{' '}
                    <DemoTag show={c.isDemo} />
                  </td>
                  <td className="nowrap">
                    <a href={`tel:${c.phone}`}>{c.phone}</a>
                  </td>
                  <td>{c.email}</td>
                  <td className="num">{n}</td>
                  <td className="nowrap">{last ? formatDateTime(last) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Aucun client pour le moment : les fiches se créent automatiquement à la première demande.</Empty>
      )}
    </>
  );
}
