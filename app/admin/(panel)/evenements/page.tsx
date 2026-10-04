import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { Card, DemoTag, Empty, PageTitle } from '@/components/admin/bits';
import { Submit } from '@/components/admin/ui';
import { realOnly } from '@/lib/admin';
import { requirePage } from '@/lib/auth/session';
import { getDb, schema as s } from '@/lib/db';
import { eventState, eventTemplates } from '@/lib/event-templates';
import { formatDate } from '@/lib/format';
import { eventFromTemplate, eventToggle } from '../../actions';

export const metadata = { title: 'Événements' };

export default async function EventsPage() {
  await requirePage('ADMIN');
  const db = await getDb();
  const events = await db.select().from(s.events).where(await realOnly(s.events)).orderBy(asc(s.events.startsOn), asc(s.events.position));
  return (
    <>
      <PageTitle title="Événements et collections" sub="Mettez temporairement en avant une collection : le bloc apparaît automatiquement sur l’accueil pendant sa période.">
        <Link className="abtn" href="/admin/evenements/nouveau">
          + Nouvelle collection
        </Link>
      </PageTitle>
      <div className="agrid">
        <Card title="Collections">
          {events.length ? (
            <ul className="aitems">
              {events.map((e) => {
                const st = eventState(e);
                return (
                  <li key={e.id}>
                    <span className={'abadge abadge--' + st.cls}>{st.cls === 'live' ? 'En ligne' : st.cls === 'soon' ? 'Programmée' : 'Inactive'}</span>
                    <span>
                      <Link className="atable-link" href={`/admin/evenements/${e.id}`}>
                        {e.name}
                      </Link>{' '}
                      <DemoTag show={e.isDemo} />
                      <small>
                        {st.label}
                        {e.startsOn && e.endsOn && ` · du ${formatDate(e.startsOn, 'short')} au ${formatDate(e.endsOn, 'short')}`}
                      </small>
                    </span>
                    <form action={eventToggle}>
                      <input type="hidden" name="id" value={e.id} />
                      <Submit className={'abtn abtn--sm ' + (e.published ? 'abtn--ghost' : '')}>{e.published ? 'Dépublier' : 'Publier'}</Submit>
                    </form>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty>Aucune collection pour le moment.</Empty>
          )}
        </Card>
        <Card title="Partir d’un modèle">
          <p className="amuted">Crée un brouillon non publié, sans date ni produit : rien n’apparaît sur le site tant que vous ne le publiez pas.</p>
          <div className="abtns">
            {eventTemplates.map((t) => (
              <form key={t.kind} action={eventFromTemplate}>
                <input type="hidden" name="kind" value={t.kind} />
                <Submit className="abtn abtn--ghost">{t.label}</Submit>
              </form>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
