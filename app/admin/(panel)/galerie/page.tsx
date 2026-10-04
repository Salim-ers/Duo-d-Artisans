import { asc } from 'drizzle-orm';
import { Card, Empty, F, PageTitle } from '@/components/admin/bits';
import { ImagesInput, Submit } from '@/components/admin/ui';
import { requirePage } from '@/lib/auth/session';
import { getDb, schema as s } from '@/lib/db';
import { galleryCategories } from '@/lib/labels';
import { galleryDelete, galleryMove, galleryUpdate, galleryUpload } from '../../actions';

export const metadata = { title: 'Galerie' };

/** La galerie publique (/creations) et la mosaïque de l'accueil ne dépendent plus d'un développeur. */
export default async function GalleryPage() {
  await requirePage('ADMIN');
  const db = await getDb();
  const items = await db.select().from(s.gallery).orderBy(asc(s.gallery.position), asc(s.gallery.createdAt));
  const onHome = items.filter((i) => i.active && i.showOnHome).length;
  return (
    <>
      <PageTitle title="Galerie" sub={`${items.length} photo(s) · ${onHome} sur l’accueil (6 à 8 recommandées, dans l’ordre ci-dessous)`} />
      <Card title="Ajouter des photos">
        <form action={galleryUpload} className="aform aform--grid">
          <F label="Photos (8 maximum)" full>
            <ImagesInput />
          </F>
          <F label="Titre (facultatif)">
            <input name="title" maxLength={80} />
          </F>
          <F label="Texte alternatif (SEO, accessibilité)" hint="Décrivez ce que montre la photo.">
            <input name="alt" maxLength={200} placeholder="Ex. Tarte aux fraises en vitrine" />
          </F>
          <F label="Catégorie">
            <select name="category" defaultValue="patisserie">
              {galleryCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </F>
          <label className="acheck">
            <input type="checkbox" name="showOnHome" /> Afficher sur l’accueil
          </label>
          <Submit>Ajouter</Submit>
        </form>
      </Card>

      <div className="amedia" style={{ marginTop: 16 }}>
        {items.length === 0 && <Empty>Aucune photo.</Empty>}
        {items.map((g, i) => (
          <div key={g.id} className="amedia-item" data-off={!g.active || undefined}>
            <div className="amedia-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.src} alt={g.alt} loading="lazy" />
              {g.showOnHome && g.active && <span className="atag">Accueil · {i + 1}</span>}
            </div>
            <div className="amedia-row">
              <form action={galleryMove}>
                <input type="hidden" name="id" value={g.id} />
                <input type="hidden" name="dir" value="up" />
                <Submit className="abtn abtn--ghost abtn--sm abtn--block" title="Avancer">
                  ← Avant
                </Submit>
              </form>
              <form action={galleryMove}>
                <input type="hidden" name="id" value={g.id} />
                <input type="hidden" name="dir" value="down" />
                <Submit className="abtn abtn--ghost abtn--sm abtn--block" title="Reculer">
                  Après →
                </Submit>
              </form>
            </div>
            <form action={galleryUpdate} className="aform">
              <input type="hidden" name="id" value={g.id} />
              <input name="title" defaultValue={g.title ?? ''} placeholder="Titre" aria-label="Titre" maxLength={80} />
              <input name="description" defaultValue={g.description ?? ''} placeholder="Petite description" aria-label="Description" maxLength={200} />
              <input name="alt" defaultValue={g.alt} required placeholder="Texte alternatif" aria-label="Texte alternatif" maxLength={200} />
              <select name="category" defaultValue={g.category} aria-label="Catégorie">
                {galleryCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <label className="acheck">
                <input type="checkbox" name="showOnHome" defaultChecked={g.showOnHome} /> Accueil
              </label>
              <label className="acheck">
                <input type="checkbox" name="active" defaultChecked={g.active} /> Visible
              </label>
              <Submit className="abtn abtn--sm">Enregistrer</Submit>
            </form>
            <form action={galleryDelete}>
              <input type="hidden" name="id" value={g.id} />
              <Submit className="abtn abtn--danger abtn--sm abtn--block" confirm="Retirer cette photo de la galerie ?">
                Supprimer
              </Submit>
            </form>
          </div>
        ))}
      </div>
    </>
  );
}
