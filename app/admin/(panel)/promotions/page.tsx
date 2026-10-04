import Link from 'next/link';
import { desc } from 'drizzle-orm';
import { Card, Empty, F, PageTitle } from '@/components/admin/bits';
import { Submit } from '@/components/admin/ui';
import { adminProducts } from '@/lib/admin';
import { requirePage } from '@/lib/auth/session';
import { listCategories } from '@/lib/catalog';
import { getDb, schema as s } from '@/lib/db';
import type { Promotion } from '@/lib/db/schema';
import { centsInput, formatDateTime, money, toParisInput } from '@/lib/format';
import { promoLive } from '@/lib/pricing';
import { promotionDelete, promotionSave, promotionToggle } from '../../actions';

export const metadata = { title: 'Promotions' };

const kinds = {
  code: { label: 'Code promotionnel', help: 'Le client saisit le code au panier.' },
  auto: { label: 'Promotion automatique', help: 'Appliquée d’office si les conditions sont remplies (la meilleure remise l’emporte, sans cumul).' },
  highlight: { label: 'Produit mis en avant', help: 'Le produit apparaît en tête de l’accueil pendant la période. Aucune remise.' },
} as const;

const describe = (p: Promotion) =>
  p.kind === 'highlight' ? 'Mise en avant' : `${p.type === 'percent' ? `−${p.value} %` : `−${money(p.value)}`}${p.minSubtotalCents ? ` dès ${money(p.minSubtotalCents)}` : ''}`;

export default async function PromotionsPage({ searchParams }: { searchParams: Promise<{ edit?: string; type?: string }> }) {
  await requirePage('ADMIN');
  const sp = await searchParams;
  const db = await getDb();
  const [promos, products, categories] = await Promise.all([db.select().from(s.promotions).orderBy(desc(s.promotions.createdAt)), adminProducts(), listCategories(false)]);
  const editing = promos.find((p) => p.id === sp.edit);
  const kind = (editing?.kind ?? (sp.type as keyof typeof kinds)) in kinds ? (editing?.kind ?? (sp.type as keyof typeof kinds)) : 'code';
  const name = (id: string | null) => products.find((p) => p.id === id)?.name ?? categories.find((c) => c.id === id)?.name;

  return (
    <>
      <PageTitle title="Promotions" sub="Codes, remises automatiques et produits mis en avant. Rien n’est actif sans votre action." />
      <div className="agrid">
        <Card title="Promotions enregistrées">
          {promos.length ? (
            <div className="atable-wrap">
              <table className="atable">
                <thead>
                  <tr>
                    <th>Promotion</th>
                    <th>Effet</th>
                    <th>Période</th>
                    <th className="num">Utilisations</th>
                    <th>État</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {promos.map((p) => (
                    <tr key={p.id} className={p.active ? undefined : 'aoff'}>
                      <td>
                        <Link href={`/admin/promotions?edit=${p.id}`} className="atable-link">
                          {p.label}
                        </Link>
                        <div className="amuted">
                          {kinds[p.kind].label}
                          {p.code && (
                            <>
                              {' '}
                              · <span className="amono">{p.code}</span>
                            </>
                          )}
                          {(p.productId || p.categoryId) && ` · ${name(p.productId ?? p.categoryId)}`}
                        </div>
                      </td>
                      <td>{describe(p)}</td>
                      <td className="amuted">
                        {p.startsAt ? formatDateTime(p.startsAt) : '—'} → {p.endsAt ? formatDateTime(p.endsAt) : '—'}
                      </td>
                      <td className="num">
                        {p.uses}
                        {p.maxUses !== null && ` / ${p.maxUses}`}
                      </td>
                      <td>{promoLive(p) ? <span className="abadge abadge--live">Active</span> : <span className="abadge abadge--off">{p.active ? 'Hors période' : 'Désactivée'}</span>}</td>
                      <td>
                        <div className="arow-actions">
                          <form action={promotionToggle}>
                            <input type="hidden" name="id" value={p.id} />
                            <Submit className="abtn abtn--ghost abtn--sm">{p.active ? 'Désactiver' : 'Activer'}</Submit>
                          </form>
                          <form action={promotionDelete}>
                            <input type="hidden" name="id" value={p.id} />
                            <Submit className="abtn abtn--danger abtn--sm" confirm="Supprimer cette promotion ?">
                              ×
                            </Submit>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>Aucune promotion. Créez-en une ci-contre quand vous le souhaitez.</Empty>
          )}
          <p className="amuted">
            Campagnes saisonnières (Noël, Pâques, Épiphanie, Saint-Valentin, fête des mères) : voir{' '}
            <Link href="/admin/evenements" className="alink">
              Événements
            </Link>
            .
          </p>
        </Card>

        <Card title={editing ? `Modifier « ${editing.label} »` : 'Nouvelle promotion'}>
          {!editing && (
            <nav className="asegs" aria-label="Type">
              {Object.entries(kinds).map(([k, v]) => (
                <Link key={k} href={`/admin/promotions?type=${k}`} aria-current={kind === k ? 'page' : undefined}>
                  {v.label}
                </Link>
              ))}
            </nav>
          )}
          <p className="amuted">{kinds[kind].help}</p>
          <form action={promotionSave} className="aform" key={editing?.id ?? kind}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <input type="hidden" name="kind" value={kind} />
            <F label="Libellé (affiché au client)">
              <input name="label" required maxLength={80} defaultValue={editing?.label} placeholder={kind === 'highlight' ? 'Nouveauté' : 'Offre de bienvenue'} />
            </F>
            {kind === 'code' && (
              <F label="Code">
                <input name="code" required maxLength={30} defaultValue={editing?.code ?? ''} placeholder="BIENVENUE" style={{ textTransform: 'uppercase' }} />
              </F>
            )}
            {kind !== 'highlight' && (
              <div className="aform aform--grid">
                <F label="Type de remise">
                  <select name="type" defaultValue={editing?.type ?? 'percent'}>
                    <option value="percent">Pourcentage</option>
                    <option value="amount">Montant (€)</option>
                  </select>
                </F>
                <F label="Valeur" hint="% ou €">
                  <input name="value" required inputMode="decimal" defaultValue={editing ? (editing.type === 'percent' ? String(editing.value) : centsInput(editing.value)) : ''} />
                </F>
                <F label="Minimum d’achat (€)">
                  <input name="min" inputMode="decimal" defaultValue={centsInput(editing?.minSubtotalCents ?? 0)} />
                </F>
                <F label="Utilisations max.">
                  <input name="maxUses" type="number" min={1} defaultValue={editing?.maxUses ?? ''} placeholder="Illimité" />
                </F>
              </div>
            )}
            <F label={kind === 'highlight' ? 'Produit mis en avant' : 'Limiter à un produit (facultatif)'}>
              <select name="productId" defaultValue={editing?.productId ?? ''} required={kind === 'highlight'}>
                <option value="">{kind === 'highlight' ? 'Choisir…' : 'Tout le panier'}</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </F>
            {kind !== 'highlight' && (
              <F label="…ou à une catégorie (facultatif)">
                <select name="categoryId" defaultValue={editing?.categoryId ?? ''}>
                  <option value="">—</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </F>
            )}
            <div className="aform aform--grid">
              <F label="Début">
                <input type="datetime-local" name="startsAt" defaultValue={toParisInput(editing?.startsAt ?? null)} />
              </F>
              <F label="Fin">
                <input type="datetime-local" name="endsAt" defaultValue={toParisInput(editing?.endsAt ?? null)} />
              </F>
            </div>
            <label className="acheck">
              <input type="checkbox" name="active" defaultChecked={editing?.active ?? false} /> Activer
            </label>
            <div className="abtns">
              <Submit>{editing ? 'Enregistrer' : 'Créer'}</Submit>
              {editing && (
                <Link href="/admin/promotions" className="alink">
                  Annuler
                </Link>
              )}
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
