import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { Card, F, PageTitle } from '@/components/admin/bits';
import { ImageInput, RepeatRows, Submit } from '@/components/admin/ui';
import { requirePage } from '@/lib/auth/session';
import { listCategories } from '@/lib/catalog';
import { getDb, schema as s } from '@/lib/db';
import { dayLabels, weekOrder } from '@/data/opening-hours';
import { centsInput } from '@/lib/format';
import { ALLERGENS } from '@/lib/labels';
import { productDelete, productSave } from '../../../actions';

export const metadata = { title: 'Produit' };

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage('ADMIN');
  const { id } = await params;
  const isNew = id === 'nouveau';
  const db = await getDb();
  const [categories, product] = await Promise.all([
    listCategories(false),
    isNew ? Promise.resolve(null) : db.select().from(s.products).where(eq(s.products.id, id)).then((r) => r[0] ?? null).catch(() => null),
  ]);
  if (!isNew && !product) notFound();
  const [variants, options] = product
    ? await Promise.all([
        db.select().from(s.productVariants).where(eq(s.productVariants.productId, product.id)).orderBy(asc(s.productVariants.position)),
        db.select().from(s.productOptions).where(eq(s.productOptions.productId, product.id)).orderBy(asc(s.productOptions.position)),
      ])
    : [[], []];
  const p = product;
  const days = p?.availableDays.length ? p.availableDays : [0, 1, 2, 3, 4, 5, 6];
  const back = isNew ? '/admin/produits' : `/admin/produits/${id}`;

  return (
    <>
      <PageTitle title={p ? p.name : 'Nouveau produit'} sub={p?.isDemo ? 'Produit d’exemple : prix et informations non validés' : undefined}>
        <Link className="abtn abtn--ghost" href="/admin/produits">
          ← Produits
        </Link>
        {p && (
          <Link className="abtn abtn--ghost" href={`/commander#${p.slug}`} target="_blank">
            Voir sur le site ↗
          </Link>
        )}
      </PageTitle>

      <form action={productSave} className="astack">
        <input type="hidden" name="back" value={back} />
        {p && <input type="hidden" name="id" value={p.id} />}
        {p?.image && <input type="hidden" name="image" value={p.image} />}

        <div className="agrid">
          <div className="astack">
            <Card title="Fiche">
              <div className="aform aform--grid">
                <F label="Nom">
                  <input name="name" required maxLength={120} defaultValue={p?.name} />
                </F>
                <F label="Catégorie">
                  <select name="categoryId" defaultValue={p?.categoryId ?? categories[0]?.id ?? ''}>
                    <option value="">— Aucune —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </F>
                <F label="Prix TTC (€)" hint="Prix de base ; les formats ci-dessous ont leur propre prix.">
                  <input name="price" inputMode="decimal" required defaultValue={centsInput(p?.priceCents ?? 0)} />
                </F>
                <F label="TVA (%)">
                  <input name="vat" inputMode="decimal" defaultValue={p ? String(p.vatRate / 100).replace('.', ',') : '5,5'} />
                </F>
                <F label="Description courte" full>
                  <textarea name="description" rows={2} maxLength={400} defaultValue={p?.description ?? ''} />
                </F>
                <F label="Adresse (slug)" hint="Laissez vide pour la générer depuis le nom.">
                  <input name="slug" maxLength={80} defaultValue={p?.slug} />
                </F>
                <F label="Ordre d’affichage">
                  <input name="position" type="number" defaultValue={p?.position ?? 0} />
                </F>
              </div>
            </Card>

            <Card title="Formats (taille, nombre de personnes)">
              <p className="amuted">Chaque format a son prix. Le client doit en choisir un.</p>
              <RepeatRows
                initial={variants.filter((v) => v.active).map((v) => ({ id: v.id, vLabel: v.label, vServings: v.servings ? String(v.servings) : '', vPrice: centsInput(v.priceCents) }))}
                columns={[
                  { name: 'vLabel', placeholder: 'Libellé (ex. 6 personnes)' },
                  { name: 'vServings', placeholder: 'Parts', type: 'int' },
                  { name: 'vPrice', placeholder: 'Prix €', type: 'money' },
                ]}
                addLabel="Ajouter un format"
              />
            </Card>

            <Card title="Saveurs et suppléments">
              <p className="amuted">Saveur : un choix obligatoire si au moins une existe. Supplément : facultatif, avec supplément de prix.</p>
              <RepeatRows
                initial={options.filter((o) => o.active).map((o) => ({ id: o.id, oKind: o.kind, oLabel: o.label, oPrice: centsInput(o.priceDeltaCents) }))}
                columns={[
                  {
                    name: 'oKind',
                    placeholder: 'Type',
                    options: [
                      { value: 'flavor', label: 'Saveur' },
                      { value: 'extra', label: 'Supplément' },
                    ],
                  },
                  { name: 'oLabel', placeholder: 'Libellé' },
                  { name: 'oPrice', placeholder: '+ € (supplément)', type: 'money' },
                ]}
                addLabel="Ajouter une option"
                rowClass="arepeat-row arepeat-row--opt"
              />
            </Card>

            <Card title="Allergènes">
              <p className="amuted">À renseigner par la boutique. Ils s’affichent sur la fiche du produit.</p>
              <div className="achecks achecks--grid">
                {ALLERGENS.map((a) => (
                  <label key={a} className="acheck">
                    <input type="checkbox" name="allergens" value={a} defaultChecked={p?.allergens.includes(a)} /> {a}
                  </label>
                ))}
              </div>
            </Card>
          </div>

          <div className="astack">
            <Card title="Photo">
              <ImageInput current={p?.image} />
            </Card>
            <Card title="Visibilité">
              <div className="achecks" style={{ flexDirection: 'column' }}>
                <label className="acheck">
                  <input type="checkbox" name="active" defaultChecked={p?.active ?? true} /> Visible sur le site
                </label>
                <label className="acheck">
                  <input type="checkbox" name="orderable" defaultChecked={p?.orderable ?? true} /> Disponible à la commande en ligne
                </label>
                <label className="acheck">
                  <input type="checkbox" name="featured" defaultChecked={p?.featured} /> Produit vedette (accueil)
                </label>
                <label className="acheck">
                  <input type="checkbox" name="isDemo" defaultChecked={p?.isDemo} /> Donnée d’exemple (masquée hors démonstration)
                </label>
              </div>
            </Card>
            <Card title="Disponibilité">
              <F label="Délai de préparation (heures)" hint="0 = selon le délai général de la boutique.">
                <input name="leadTimeHours" type="number" min={0} max={720} defaultValue={p?.leadTimeHours ?? 0} />
              </F>
              <div className="afield">
                <span>Jours de retrait possibles</span>
                <div className="adays">
                  {weekOrder.map((d) => (
                    <label key={d}>
                      <input type="checkbox" name="availableDays" value={d} defaultChecked={days.includes(d)} />
                      <span>{dayLabels[d]!.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <F label="Quantité maximum par commande">
                <input name="maxPerOrder" type="number" min={1} max={500} defaultValue={p?.maxPerOrder ?? 20} />
              </F>
            </Card>
            <Card title="Stock">
              <label className="acheck">
                <input type="checkbox" name="stockManaged" defaultChecked={p?.stockManaged} /> Gérer le stock (sinon : illimité, fabriqué à la demande)
              </label>
              {isNew && (
                <F label="Stock initial">
                  <input name="stock" type="number" min={0} defaultValue={0} />
                </F>
              )}
              <F label="Seuil d’alerte" hint="Une notification est envoyée quand le stock descend à ce niveau.">
                <input name="stockAlert" type="number" min={0} defaultValue={p?.stockAlert ?? 0} />
              </F>
              {!isNew && (
                <Link href="/admin/stock" className="alink">
                  Ajuster le stock ({p!.stockManaged ? p!.stock : 'illimité'}) →
                </Link>
              )}
            </Card>
          </div>
        </div>

        <div className="asticky-save">
          <Submit className="abtn abtn--lg">{isNew ? 'Créer le produit' : 'Enregistrer'}</Submit>
        </div>
      </form>

      {p && (
        <Card title="Supprimer" className="noprint">
          <p className="amuted">Préférez « Visible sur le site » décoché pour masquer temporairement. La suppression est définitive (l’historique des commandes est conservé).</p>
          <form action={productDelete}>
            <input type="hidden" name="id" value={p.id} />
            <Submit className="abtn abtn--danger" confirm={`Supprimer définitivement « ${p.name} » ?`}>
              Supprimer le produit
            </Submit>
          </form>
        </Card>
      )}
    </>
  );
}
