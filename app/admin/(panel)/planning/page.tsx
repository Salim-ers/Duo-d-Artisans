import Link from 'next/link';
import { asc, gte } from 'drizzle-orm';
import { Card, Empty, PageTitle } from '@/components/admin/bits';
import { AutoRefresh, Submit } from '@/components/admin/ui';
import { planning } from '@/lib/admin';
import { getDb, schema as s } from '@/lib/db';
import { addDays, isIsoDate, mondayOf, today, weekday } from '@/lib/dates';
import { capitalize, formatDate, formatTime } from '@/lib/format';
import { customStatusLabel } from '@/lib/labels';
import { getSetting } from '@/lib/settings';
import { exceptionAdd, exceptionRemove } from '../../actions';

export const metadata = { title: 'Planning' };

export default async function PlanningPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const sp = await searchParams;
  const t = today();
  const d = sp.date && isIsoDate(sp.date) ? sp.date : t;
  const from = mondayOf(d);
  const to = addDays(from, 6);
  const db = await getDb();
  const [plan, hours, upcoming] = await Promise.all([
    planning(from, to),
    getSetting('hours'),
    db.select().from(s.pickupSlots).where(gte(s.pickupSlots.date, t)).orderBy(asc(s.pickupSlots.date)).limit(30),
  ]);
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
  const link = (date: string) => `/admin/planning?date=${date}`;

  return (
    <>
      <AutoRefresh seconds={60} />
      <PageTitle title="Planning" sub={`Semaine du ${formatDate(from, 'short')} au ${formatDate(to, 'short')}`}>
        <div className="aday-nav">
          <Link className="abtn abtn--ghost" href={link(addDays(d, -7))} aria-label="Semaine précédente">
            ←
          </Link>
          <Link className="abtn abtn--ghost" href={link(t)}>
            Cette semaine
          </Link>
          <Link className="abtn abtn--ghost" href={link(addDays(d, 7))} aria-label="Semaine suivante">
            →
          </Link>
        </div>
      </PageTitle>

      <div className="aweek">
        {days.map((date) => {
          const ex = plan.exceptions.find((e) => e.date === date);
          const closed = ex?.closed || (!ex?.opens && (hours.week[weekday(date)] ?? []).length === 0);
          const cakes = plan.custom.filter((c) => c.desiredDate === date);
          return (
            <div key={date} className="aweek-day" data-today={date === t || undefined} data-closed={closed || undefined}>
              <div className="aweek-head">
                <b>{capitalize(formatDate(date, 'day'))}</b>
                <small>{cakes.length ? `${cakes.length} gâteau${cakes.length > 1 ? 'x' : ''}` : ''}</small>
              </div>
              {ex && <span className="aevt aevt--closed">{ex.closed ? ex.note || 'Fermé' : `Ouvert ${formatTime(ex.opens!)}–${formatTime(ex.closes!)}`}</span>}
              {cakes.map((c) => (
                <Link key={c.id} href={`/admin/personnalisees/${c.id}`} className={'aevt aevt--c-' + c.status} title={customStatusLabel[c.status]}>
                  <b>{c.pickupTime ? formatTime(c.pickupTime) : '—'}</b>
                  {c.type} · {c.servings} p.
                  <span className="aevt-sub">
                    {c.firstName} {c.lastName} · {customStatusLabel[c.status]}
                  </span>
                </Link>
              ))}
              {!cakes.length && !ex && !closed && <span className="amuted">—</span>}
            </div>
          );
        })}
      </div>

      <div className="agrid-2" style={{ marginTop: 16 }}>
        <Card title="Fermetures et horaires exceptionnels">
          <form action={exceptionAdd} className="aform aform--grid">
            <input type="hidden" name="back" value={link(d)} />
            <label className="afield">
              <span>Date</span>
              <input type="date" name="date" required min={t} defaultValue={d >= t ? d : t} />
            </label>
            <label className="afield">
              <span>Type</span>
              <select name="kind" defaultValue="closed">
                <option value="closed">Fermeture de la journée</option>
                <option value="hours">Horaires exceptionnels</option>
              </select>
            </label>
            <label className="afield">
              <span>Ouverture (horaires exceptionnels)</span>
              <input type="time" name="opens" />
            </label>
            <label className="afield">
              <span>Fermeture (horaires exceptionnels)</span>
              <input type="time" name="closes" />
            </label>
            <label className="afield afield--full">
              <span>Note affichée aux clients (facultatif)</span>
              <input name="note" maxLength={160} placeholder="Ex. Fermeture pour congés" />
            </label>
            <Submit>Ajouter</Submit>
          </form>
          <p className="amuted">S’affiche sur le site : statut « ouvert / fermé » et horaires.</p>
        </Card>
        <Card title="À venir">
          {upcoming.length ? (
            <ul className="aitems">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <span className="aqty" style={{ fontSize: 13 }}>
                    {formatDate(e.date, 'short')}
                  </span>
                  <span>
                    {e.closed ? 'Fermeture' : `Horaires ${formatTime(e.opens!)}–${formatTime(e.closes!)}`}
                    {e.note && <small>{e.note}</small>}
                  </span>
                  <form action={exceptionRemove}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="back" value={link(d)} />
                    <Submit className="abtn abtn--danger abtn--sm" confirm="Supprimer cette exception ?">
                      Retirer
                    </Submit>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Aucune fermeture prévue.</Empty>
          )}
        </Card>
      </div>
    </>
  );
}
