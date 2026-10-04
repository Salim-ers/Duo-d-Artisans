import Link from 'next/link';
import { DemoTag, Empty, PageTitle } from '@/components/admin/bits';
import { Submit } from '@/components/admin/ui';
import { requirePage } from '@/lib/auth/session';
import { listCategories } from '@/lib/catalog';
import { adminProducts } from '@/lib/admin';
import { money } from '@/lib/format';
import { productToggle } from '../../actions';

export const metadata = { title: 'Produits' };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ categorie?: string; q?: string }> }) {
  await requirePage('ADMIN');
  const sp = await searchParams;
  const [categories, all] = await Promise.all([listCategories(false), adminProducts()]);
  const q = sp.q?.trim().toLowerCase();
  const products = all.filter((p) => (!sp.categorie || p.categoryId === sp.categorie) && (!q || p.name.toLowerCase().includes(q)));
  const here = `/admin/produits${sp.categorie ? '?categorie=' + sp.categorie : ''}`;
  const Toggle = ({ id, field, on, label }: { id: string; field: string; on: boolean; label: string }) => (
    <form action={productToggle}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="back" value={here} />
      <Submit className={'abtn abtn--sm ' + (on ? '' : 'abtn--ghost')} title={label}>
        {on ? 'Oui' : 'Non'}
      </Submit>
    </form>
  );
  return (
    <>
      <PageTitle title="Produits" sub={`${products.length} produit(s) — l’ordre d’affichage suit les catégories puis la position`}>
        <Link href="/admin/produits/nouveau" className="abtn">
          + Nouveau produit
        </Link>
      </PageTitle>
      <form className="afilters" action="/admin/produits">
        <input name="q" defaultValue={sp.q} placeholder="Rechercher un produit" aria-label="Rechercher" />
        <select name="categorie" defaultValue={sp.categorie ?? ''} aria-label="Catégorie">
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="abtn" type="submit">
          Filtrer
        </button>
      </form>
      {products.length ? (
        <div className="atable-wrap">
          <table className="atable">
            <thead>
              <tr>
                <th />
                <th>Produit</th>
                <th>Catégorie</th>
                <th className="num">Prix</th>
                <th>Stock</th>
                <th>Visible</th>
                <th>À la commande</th>
                <th>Vedette</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={p.active ? undefined : 'aoff'}>
                  <td>
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="athumb" src={p.image} alt="" />
                    ) : (
                      <span className="athumb" />
                    )}
                  </td>
                  <td>
                    <Link className="atable-link" href={`/admin/produits/${p.id}`}>
                      {p.name}
                    </Link>{' '}
                    <DemoTag show={p.isDemo} />
                    {p.variants > 0 && <div className="amuted">{p.variants} format(s)</div>}
                  </td>
                  <td>{p.category ?? '—'}</td>
                  <td className="num">
                    {p.variants > 0 && 'dès '}
                    {money(p.priceCents)}
                  </td>
                  <td>{!p.stockManaged ? <span className="amuted">Illimité</span> : <span className={p.stock === 0 ? 'azero' : p.stock <= p.stockAlert ? 'alow' : ''}>{p.stock}</span>}</td>
                  <td>
                    <Toggle id={p.id} field="active" on={p.active} label="Visible sur le site" />
                  </td>
                  <td>
                    <Toggle id={p.id} field="orderable" on={p.orderable} label="Commandable en ligne" />
                  </td>
                  <td>
                    <Toggle id={p.id} field="featured" on={p.featured} label="Mis en avant sur l’accueil" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Aucun produit. Créez le premier produit de la boutique.</Empty>
      )}
    </>
  );
}
