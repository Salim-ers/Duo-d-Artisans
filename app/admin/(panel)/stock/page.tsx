import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { Card, DemoTag, Empty, PageTitle } from '@/components/admin/bits';
import { Submit } from '@/components/admin/ui';
import { adminProducts } from '@/lib/admin';
import { getDb, schema as s } from '@/lib/db';
import { formatDateTime } from '@/lib/format';
import { stockAdjust, stockSave } from '../../actions';

export const metadata = { title: 'Stock' };

const reason = { order: 'Commande', cancel: 'Annulation', manual: 'Correction', restock: 'Réassort' } as const;

/** Stock simple : quantité disponible, seuil d'alerte, indisponible automatiquement à zéro — ou illimité. */
export default async function StockPage() {
  const db = await getDb();
  const [products, moves] = await Promise.all([
    adminProducts(),
    db
      .select({ m: s.stockMovements, name: s.products.name })
      .from(s.stockMovements)
      .innerJoin(s.products, eq(s.stockMovements.productId, s.products.id))
      .orderBy(desc(s.stockMovements.createdAt))
      .limit(25),
  ]);
  const managed = products.filter((p) => p.stockManaged);
  const low = managed.filter((p) => p.stock <= p.stockAlert);
  return (
    <>
      <PageTitle title="Stock" sub={`${managed.length} produit(s) suivi(s) · ${low.length} sous le seuil d’alerte · les autres sont en disponibilité illimitée`} />
      {products.length ? (
        <div className="atable-wrap">
          <table className="atable">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Mode et quantité</th>
                <th>Ajustement rapide</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={p.active ? undefined : 'aoff'}>
                  <td>
                    <Link href={`/admin/produits/${p.id}`} className="atable-link">
                      {p.name}
                    </Link>{' '}
                    <DemoTag show={p.isDemo} />
                    <div className="amuted">{p.category ?? '—'}</div>
                  </td>
                  <td>
                    <form action={stockSave} className="astock-form">
                      <input type="hidden" name="id" value={p.id} />
                      <select name="managed" defaultValue={p.stockManaged ? 'on' : ''} aria-label="Mode de stock" style={{ width: 'auto' }}>
                        <option value="">Illimité (à la demande)</option>
                        <option value="on">Stock limité</option>
                      </select>
                      <input name="stock" type="number" min={0} defaultValue={p.stock} aria-label="Quantité disponible" title="Quantité disponible" />
                      <input name="alert" type="number" min={0} defaultValue={p.stockAlert} aria-label="Seuil d’alerte" title="Seuil d’alerte" />
                      <Submit className="abtn abtn--sm">OK</Submit>
                      {p.stockManaged && (
                        <span className={p.stock === 0 ? 'azero' : p.stock <= p.stockAlert ? 'alow' : 'amuted'}>
                          {p.stock === 0 ? 'Épuisé — retiré de la vente' : p.stock <= p.stockAlert ? 'Stock faible' : 'En stock'}
                        </span>
                      )}
                    </form>
                  </td>
                  <td>
                    {p.stockManaged && (
                      <div className="abtns">
                        {[-1, 1, 6, 12].map((delta) => (
                          <form key={delta} action={stockAdjust}>
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="delta" value={delta} />
                            <Submit className="abtn abtn--ghost abtn--sm">{delta > 0 ? `+${delta}` : delta}</Submit>
                          </form>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Aucun produit.</Empty>
      )}
      <p className="amuted" style={{ margin: '8px 0 16px' }}>
        Colonnes : quantité disponible, puis seuil d’alerte.
      </p>
      <Card title="Derniers mouvements">
        {moves.length ? (
          <ul className="aitems">
            {moves.map(({ m, name }) => (
              <li key={m.id}>
                <span className="aqty" style={{ color: m.delta < 0 ? 'var(--a-err)' : 'var(--a-ok)' }}>
                  {m.delta > 0 ? '+' : ''}
                  {m.delta}
                </span>
                <span>
                  {name}
                  <small>
                    {reason[m.reason]} · {formatDateTime(m.createdAt)}
                  </small>
                </span>
                <span className="amuted">→ {m.quantityAfter}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Aucun mouvement enregistré.</Empty>
        )}
      </Card>
    </>
  );
}
