import { desc } from 'drizzle-orm';
import { DemoTag, Empty, PageTitle } from '@/components/admin/bits';
import { Submit } from '@/components/admin/ui';
import { realOnly } from '@/lib/admin';
import { getDb, schema as s } from '@/lib/db';
import { formatDateTime } from '@/lib/format';
import { messageDelete, messageRead } from '../../actions';

export const metadata = { title: 'Messages' };

export default async function MessagesPage() {
  const db = await getDb();
  const rows = await db.select().from(s.messages).where(await realOnly(s.messages)).orderBy(desc(s.messages.createdAt)).limit(200);
  const unread = rows.filter((m) => !m.read).length;
  return (
    <>
      <PageTitle title="Messages" sub={`${unread} non lu(s) — reçus depuis le formulaire de contact`} />
      {rows.length ? (
        <ul className="amsgs">
          {rows.map((m) => (
            <li key={m.id} data-unread={!m.read || undefined}>
              <div className="amsg-head">
                <strong>{m.name}</strong>
                <a href={`mailto:${m.email}`}>{m.email}</a>
                {m.phone && <a href={`tel:${m.phone}`}>{m.phone}</a>}
                <DemoTag show={m.isDemo} />
                <small>{formatDateTime(m.createdAt)}</small>
              </div>
              <p className="amsg-body">{m.body}</p>
              <div className="abtns">
                <a className="abtn abtn--sm" href={`mailto:${m.email}?subject=${encodeURIComponent('Le Duo d’Artisans — votre message')}`}>
                  Répondre
                </a>
                <form action={messageRead}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="read" value={m.read ? '' : 'on'} />
                  <Submit className="abtn abtn--ghost abtn--sm">{m.read ? 'Marquer non lu' : 'Marquer lu'}</Submit>
                </form>
                <form action={messageDelete}>
                  <input type="hidden" name="id" value={m.id} />
                  <Submit className="abtn abtn--danger abtn--sm" confirm="Supprimer ce message ?">
                    Supprimer
                  </Submit>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Aucun message.</Empty>
      )}
    </>
  );
}
