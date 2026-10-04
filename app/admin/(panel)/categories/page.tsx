import { sql } from 'drizzle-orm';
import { Card, PageTitle } from '@/components/admin/bits';
import { ImageInput, Submit } from '@/components/admin/ui';
import { requirePage } from '@/lib/auth/session';
import { listCategories } from '@/lib/catalog';
import { getDb, schema as s } from '@/lib/db';
import { categoryDelete, categoryMove, categorySave, categoryToggle } from '../../actions';

export const metadata = { title: 'Catégories' };

/** L'ordre ici est exactement celui des familles sur la page Commander et sur l'accueil. */
export default async function CategoriesPage() {
  await requirePage('ADMIN');
  const db = await getDb();
  const [categories, counts] = await Promise.all([
    listCategories(false),
    db.select({ id: s.products.categoryId, n: sql<number>`count(*)::int` }).from(s.products).groupBy(s.products.categoryId),
  ]);
  const count = (id: string) => counts.find((c) => c.id === id)?.n ?? 0;
  return (
    <>
      <PageTitle title="Catégories" sub="Créer, renommer, réorganiser, désactiver — l’ordre est celui de la page Commander." />
      <div className="astack">
        {categories.map((c, i) => (
          <Card
            key={c.id}
            title={
              <>
                {String(i + 1).padStart(2, '0')} · {c.name}{' '}
                <span className="amuted">
                  ({count(c.id)} produit{count(c.id) > 1 ? 's' : ''})
                </span>{' '}
                {!c.active && <span className="atag">Désactivée</span>}
              </>
            }
            action={
              <div className="abtns">
                <form action={categoryMove}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="dir" value="up" />
                  <Submit className="abtn abtn--ghost abtn--sm" title="Monter">
                    ↑
                  </Submit>
                </form>
                <form action={categoryMove}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="dir" value="down" />
                  <Submit className="abtn abtn--ghost abtn--sm" title="Descendre">
                    ↓
                  </Submit>
                </form>
                <form action={categoryToggle}>
                  <input type="hidden" name="id" value={c.id} />
                  <Submit className="abtn abtn--ghost abtn--sm">{c.active ? 'Désactiver' : 'Activer'}</Submit>
                </form>
                {count(c.id) === 0 && (
                  <form action={categoryDelete}>
                    <input type="hidden" name="id" value={c.id} />
                    <Submit className="abtn abtn--danger abtn--sm" confirm={`Supprimer la catégorie « ${c.name} » ?`}>
                      Supprimer
                    </Submit>
                  </form>
                )}
              </div>
            }
          >
            <form action={categorySave} className="aform aform--grid">
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="active" value={c.active ? 'on' : ''} />
              {c.image && <input type="hidden" name="image" value={c.image} />}
              <label className="afield">
                <span>Nom</span>
                <input name="name" defaultValue={c.name} required maxLength={80} />
              </label>
              <label className="afield">
                <span>Accroche (accueil)</span>
                <input name="tagline" defaultValue={c.tagline ?? ''} maxLength={160} />
              </label>
              <label className="afield">
                <span>Adresse (slug)</span>
                <input name="slug" defaultValue={c.slug} maxLength={80} />
              </label>
              <ImageInput current={c.image} label="Photo (accueil)" />
              <Submit>Enregistrer</Submit>
            </form>
          </Card>
        ))}
        <Card title="Nouvelle catégorie">
          <form action={categorySave} className="aform aform--grid">
            <label className="afield">
              <span>Nom</span>
              <input name="name" required maxLength={80} placeholder="Ex. Traiteur" />
            </label>
            <label className="afield">
              <span>Accroche</span>
              <input name="tagline" maxLength={160} />
            </label>
            <ImageInput label="Photo" />
            <Submit>Créer</Submit>
          </form>
        </Card>
      </div>
    </>
  );
}
