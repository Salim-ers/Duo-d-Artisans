import Link from 'next/link';
import { and, asc, gte } from 'drizzle-orm';
import { Card, Empty, PageTitle } from '@/components/admin/bits';
import { AutoRefresh, Submit } from '@/components/admin/ui';
import { planning } from '@/lib/admin';
import { getDb, schema as s } from '@/lib/db';
import { addDays, isIsoDate, mondayOf, today, weekday } from '@/lib/dates';
import { capitalize, formatDate, formatTime, money } from '@/lib/format';
import { customStatusLabel, orderStatusLabel } from '@/lib/labels';
import { getSetting } from '@/lib/settings';
import { exceptionAdd, exceptionRemove } from '../../actions';

export const metadata = { title: 'Planning' };

const legend = [
  ['#1f5a7a', 'Nouvelle'],
  ['#8a5a00', 'Confirmée / à préparer'],
  ['#6b3f86', 'En préparation'],
  ['#2f6b3a', 'Prête'],
  ['#8d8379', 'Retirée'],
  ['#9a5626', 'Personnalisée'],
  ['#b8763e', 'Événement'],
  ['#a12d22', 'Fermeture / exception'],
];

export default async function PlanningPage({ searchParams }: { searchParams: Promise<{ date?: string; vue?: string }> }) {
  const sp = await searchParams;
  const d = sp.date && isIsoDate(sp.date) ? sp.date : today();
  const view = sp.vue === 'jour' ? 'jour' : 'semaine';
  const from = view === 'jour' ? d : mondayOf(d);
  const to = view === 'jour' ? d : addDays(from, 6);
  const db = await getDb();
  const [plan, hours, ordering, upcoming] = await Promise.all([
    planning(from, to),
    getSetting('hours'),
    getSetting('ordering'),
    db.select().from(s.pickupSlots).where(and(gte(s.pickupSlots.date, today()))).orderBy(asc(s.pickupSlots.date), asc(s.pickupSlots.time)).limit(40),
  ]);
  const days = Array.from({ length: view === 'jour' ? 1 : 7 }, (_, i) => addDays(from, i));
  const step = view === 'jour' ? 1 : 7;
  const link = (date: string, vue = view) => `/admin/planning?vue=${vue}&date=${date}`;
  const t = today();

  const dayInfo = (date: string) => {
    const ex = plan.exceptions.filter((e) => e.date === date);
    const whole = ex.find((e) => e.time === null);
    const closed = whole?.closed || (!whole?.opens && (hours.week[weekday(date)] ?? []).length === 0);
    return { ex, closed, noPickup: !ordering.pickupDays[weekday(date)] && !whole?.opens };
  };

  return (
    <>
      <AutoRefresh seconds={60} />
      <PageTitle title="Planning" sub={view === 'jour' ? capitalize(formatDate(d, 'full')) : `Semaine du ${formatDate(from, 'short')} au ${formatDate(to, 'short')}`}>
        <div className="aday-nav">
          <Link className="abtn abtn--ghost" href={link(addDays(d, -step))}>
            ←
          </Link>
          <Link className="abtn abtn--ghost" href={link(t)}>
            Aujourd’hui
          </Link>
          <Link className="abtn abtn--ghost" href={link(addDays(d, step))}>
            →
          </Link>
          <Link className={'abtn ' + (view === 'jour' ? '' : 'abtn--ghost')} href={link(d, 'jour')}>
            Jour
          </Link>
          <Link className={'abtn ' + (view === 'semaine' ? '' : 'abtn--ghost')} href={link(d, 'semaine')}>
            Semaine
          </Link>
        </div>
      </PageTitle>

      <p className="alegend">
        {legend.map(([c, l]) => (
          <span key={l}>
            <i style={{ background: c }} />
            {l}
          </span>
        ))}
      </p>

      {view === 'semaine' ? (
        <div className="aweek">
          {days.map((date) => {
            const info = dayInfo(date);
            const orders = plan.orders.filter((o) => o.date === date);
            const custom = plan.custom.filter((c) => c.desiredDate === date);
            const events = plan.events.filter((e) => e.startsOn! <= date && e.endsOn! >= date);
            return (
              <div key={date} className="aweek-day" data-today={date === t || undefined} data-closed={info.closed || undefined}>
                <Link href={link(date, 'jour')} className="aweek-head">
                  <b>{formatDate(date, 'day')}</b>
                  <small>
                    {orders.length} cde{orders.length > 1 ? 's' : ''} · {money(orders.reduce((s2, o) => s2 + o.total, 0))}
                  </small>
                </Link>
                {info.ex.map((e) => (
                  <span key={e.id} className="aevt aevt--closed">
                    {e.closed ? (e.time ? `Créneau ${formatTime(e.time)} fermé` : 'Fermé') : e.opens ? `Ouvert ${formatTime(e.opens)}–${formatTime(e.closes!)}` : `Capacité ${e.capacity}${e.time ? ' à ' + formatTime(e.time) : ''}`}
                  </span>
                ))}
                {info.noPickup && !info.closed && <span className="aevt aevt--collected">Pas de retrait en ligne</span>}
                {events.map((e) => (
                  <Link key={e.id} href={`/admin/evenements/${e.id}`} className="aevt aevt--event">
                    {e.name}
                  </Link>
                ))}
                {custom.map((c) => (
                  <Link key={c.id} href={`/admin/personnalisees/${c.id}`} className="aevt aevt--custom" title={customStatusLabel[c.status]}>
                    <b>{c.pickupTime ? formatTime(c.pickupTime) : '—'}</b>
                    {c.type} · {c.servings} p.
                  </Link>
                ))}
                {orders.map((o) => (
                  <Link key={o.id} href={`/admin/commandes?ouvrir=${o.id}&date=${date}`} className={'aevt aevt--' + o.status} title={orderStatusLabel[o.status]}>
                    <b>{formatTime(o.time)}</b>
                    <span>{o.name}</span>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <DayView date={d} plan={plan} info={dayInfo(d)} />
      )}

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
                <option value="capacity">Capacité spécifique</option>
                <option value="slot">Fermer un créneau</option>
              </select>
            </label>
            <label className="afield">
              <span>Ouverture (horaires exc.)</span>
              <input type="time" name="opens" />
            </label>
            <label className="afield">
              <span>Fermeture (horaires exc.)</span>
              <input type="time" name="closes" />
            </label>
            <label className="afield">
              <span>Créneau (capacité / fermeture)</span>
              <input type="time" name="time" />
            </label>
            <label className="afield">
              <span>Nombre de commandes max.</span>
              <input type="number" name="capacity" min={0} max={200} />
            </label>
            <label className="afield afield--full">
              <span>Note affichée aux clients (facultatif)</span>
              <input name="note" maxLength={160} placeholder="Ex. Fermeture pour congés" />
            </label>
            <Submit>Ajouter</Submit>
          </form>
          <p className="amuted">Une fermeture retire automatiquement tous les créneaux de retrait de la journée et s’affiche sur le site.</p>
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
                    {e.closed ? (e.time ? `Créneau ${formatTime(e.time)} fermé` : 'Fermeture') : e.opens ? `Horaires ${formatTime(e.opens)}–${formatTime(e.closes!)}` : `Capacité ${e.capacity}${e.time ? ' à ' + formatTime(e.time) : ' (journée)'}`}
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
            <Empty>Aucune exception prévue.</Empty>
          )}
        </Card>
      </div>
    </>
  );
}

function DayView({ date, plan, info }: { date: string; plan: Awaited<ReturnType<typeof planning>>; info: { ex: Awaited<ReturnType<typeof planning>>['exceptions']; closed: boolean } }) {
  const orders = plan.orders.filter((o) => o.date === date);
  const custom = plan.custom.filter((c) => c.desiredDate === date);
  const times = [...new Set([...orders.map((o) => o.time), ...custom.map((c) => c.pickupTime ?? '—')])].sort();
  return (
    <Card title={`${orders.length} commande(s) · ${custom.length} personnalisée(s)`}>
      {info.closed && <p className="aerr">Boutique fermée ce jour-là.</p>}
      {times.length ? (
        <ul className="atimeline">
          {times.map((time) => (
            <li key={time}>
              <span className="atimeline-time">{time === '—' ? '—' : formatTime(time)}</span>
              <div className="atimeline-items">
                {custom
                  .filter((c) => (c.pickupTime ?? '—') === time)
                  .map((c) => (
                    <Link key={c.id} href={`/admin/personnalisees/${c.id}`} className="aevt aevt--custom">
                      {c.type} · {c.servings} p. — {c.firstName} {c.lastName} ({customStatusLabel[c.status]})
                    </Link>
                  ))}
                {orders
                  .filter((o) => o.time === time)
                  .map((o) => (
                    <Link key={o.id} href={`/admin/commandes?ouvrir=${o.id}&date=${date}`} className={'aevt aevt--' + o.status}>
                      <b>{o.number}</b>
                      <span>
                        {o.name} · {money(o.total)} · {orderStatusLabel[o.status]}
                      </span>
                    </Link>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Rien de prévu ce jour-là.</Empty>
      )}
    </Card>
  );
}
