import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { Card, F, PageTitle } from '@/components/admin/bits';
import { ImageInput, Submit } from '@/components/admin/ui';
import { adminProducts } from '@/lib/admin';
import { requirePage } from '@/lib/auth/session';
import { getDb, schema as s } from '@/lib/db';
import { eventDelete, eventSave } from '../../../actions';
import { eventState } from '@/lib/event-templates';

export const metadata = { title: 'Collection' };

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage('ADMIN');
  const { id } = await params;
  const isNew = id === 'nouveau';
  const db = await getDb();
  const [event, products, links] = await Promise.all([
    isNew ? Promise.resolve(null) : db.select().from(s.events).where(eq(s.events.id, id)).then((r) => r[0] ?? null).catch(() => null),
    adminProducts(),
    isNew ? Promise.resolve([]) : db.select().from(s.eventProducts).where(eq(s.eventProducts.eventId, id)).orderBy(asc(s.eventProducts.position)).catch(() => []),
  ]);
  if (!isNew && !event) notFound();
  const e = event;
  const chosen = new Set(links.map((l) => l.productId));
  const st = e ? eventState(e) : null;
  return (
    <>
      <PageTitle title={e?.name ?? 'Nouvelle collection'} sub={st?.label}>
        <Link className="abtn abtn--ghost" href="/admin/evenements">
          ← Événements
        </Link>
        {e && (
          <Link className="abtn abtn--ghost" href={`/commander?collection=${e.slug}`} target="_blank">
            Voir la collection ↗
          </Link>
        )}
      </PageTitle>
      <form action={eventSave} className="astack">
        <input type="hidden" name="back" value={isNew ? '/admin/evenements' : `/admin/evenements/${id}`} />
        {e && <input type="hidden" name="id" value={e.id} />}
        {e?.image && <input type="hidden" name="image" value={e.image} />}
        <div className="agrid">
          <div className="astack">
            <Card title="Bloc d’accueil">
              <div className="aform aform--grid">
                <F label="Nom interne">
                  <input name="name" required maxLength={120} defaultValue={e?.name} />
                </F>
                <F label="Bouton">
                  <input name="ctaLabel" maxLength={40} defaultValue={e?.ctaLabel ?? ''} placeholder="Découvrir la collection" />
                </F>
                <F label="Titre affiché" full>
                  <input name="headline" maxLength={140} defaultValue={e?.headline ?? ''} placeholder="Les bûches de Noël arrivent" />
                </F>
                <F label="Texte" full>
                  <textarea name="text" rows={3} maxLength={600} defaultValue={e?.text ?? ''} />
                </F>
              </div>
            </Card>
            <Card title="Produits de la collection">
              <p className="amuted">Ils sont regroupés sur la page Commander, accessible depuis le bloc d’accueil.</p>
              <div className="achecks achecks--grid">
                {products.map((p) => (
                  <label key={p.id} className="acheck">
                    <input type="checkbox" name="products" value={p.id} defaultChecked={chosen.has(p.id)} /> {p.name}
                  </label>
                ))}
              </div>
            </Card>
          </div>
          <div className="astack">
            <Card title="Période d’affichage">
              <F label="Du">
                <input type="date" name="startsOn" defaultValue={e?.startsOn ?? ''} />
              </F>
              <F label="Au (inclus)">
                <input type="date" name="endsOn" defaultValue={e?.endsOn ?? ''} />
              </F>
              <label className="acheck">
                <input type="checkbox" name="published" defaultChecked={e?.published} /> Publiée (s’affiche pendant la période)
              </label>
              <F label="Ordre (si plusieurs en même temps)">
                <input type="number" name="position" defaultValue={e?.position ?? 0} />
              </F>
            </Card>
            <Card title="Photo">
              <ImageInput current={e?.image} />
            </Card>
          </div>
        </div>
        <div className="asticky-save">
          <Submit className="abtn abtn--lg">{isNew ? 'Créer' : 'Enregistrer'}</Submit>
        </div>
      </form>
      {e && (
        <Card title="Supprimer">
          <form action={eventDelete}>
            <input type="hidden" name="id" value={e.id} />
            <Submit className="abtn abtn--danger" confirm="Supprimer cette collection ?">
              Supprimer la collection
            </Submit>
          </form>
        </Card>
      )}
    </>
  );
}
