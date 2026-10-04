import Link from 'next/link';
import { Card, Empty, Kpi, PageTitle } from '@/components/admin/bits';
import { stats } from '@/lib/admin';
import { requirePage } from '@/lib/auth/session';
import { dayLabels, weekOrder } from '@/data/opening-hours';
import { addDays, dateRange, isIsoDate, today } from '@/lib/dates';
import { formatDate, formatTime, money } from '@/lib/format';

export const metadata = { title: 'Statistiques' };

const periods = [
  { key: 'jour', label: 'Aujourd’hui', days: 1 },
  { key: '7j', label: '7 jours', days: 7 },
  { key: '30j', label: '30 jours', days: 30 },
] as const;

function delta(cur: number, prev: number, fmt: (n: number) => string) {
  if (!prev) return cur ? { text: 'Aucune donnée sur la période précédente', dir: 'flat' as const } : undefined;
  const pct = Math.round(((cur - prev) / prev) * 100);
  return { text: `${pct > 0 ? '+' : ''}${pct} % vs ${fmt(prev)}`, dir: pct > 0 ? ('up' as const) : pct < 0 ? ('down' as const) : ('flat' as const) };
}

/** Barres horizontales d'une seule série : valeur à l'extrémité, tableau disponible. */
function Bars({ rows, unit }: { rows: { label: string; value: number; display: string }[]; unit: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.some((r) => r.value)) return <Empty>Pas encore de données sur la période.</Empty>;
  return (
    <>
      <ul className="abars">
        {rows.map((r) => (
          <li key={r.label} title={`${r.label} : ${r.display}`}>
            <span>{r.label}</span>
            <span className="abars-track">
              <span className="abars-fill" style={{ width: `${(r.value / max) * 100}%` }} />
            </span>
            <b>{r.display}</b>
          </li>
        ))}
      </ul>
      <details className="atable-view">
        <summary>Voir le tableau</summary>
        <div className="atable-wrap">
          <table className="atable">
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <td>{r.label}</td>
                  <td className="num">
                    {r.display} {unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ p?: string; du?: string; au?: string }> }) {
  await requirePage('ADMIN');
  const sp = await searchParams;
  const t = today();
  const custom = sp.p === 'perso' && sp.du && sp.au && isIsoDate(sp.du) && isIsoDate(sp.au) && sp.du <= sp.au;
  const preset = periods.find((x) => x.key === sp.p) ?? periods[2];
  const from = custom ? sp.du! : addDays(t, -(preset.days - 1));
  const to = custom ? sp.au! : t;
  const st = await stats(from, to > addDays(from, 366) ? addDays(from, 366) : to);

  const days = dateRange(st.from, st.to);
  const byDay = new Map(st.daily.map((d) => [d.d, d]));
  const series = days.map((d) => ({ d, ca: byDay.get(d)?.ca ?? 0, n: byDay.get(d)?.n ?? 0 }));
  const maxCa = Math.max(1, ...series.map((s) => s.ca));
  const busiest = Math.max(...st.weekdays);

  return (
    <>
      <PageTitle title="Statistiques" sub={`Du ${formatDate(st.from, 'long')} au ${formatDate(st.to, 'long')} · commandes engagées (payées ou à régler en boutique), hors annulations`}>
        <nav className="asegs" aria-label="Période" style={{ margin: 0 }}>
          {periods.map((x) => (
            <Link key={x.key} href={`/admin/statistiques?p=${x.key}`} aria-current={!custom && preset.key === x.key ? 'page' : undefined}>
              {x.label}
            </Link>
          ))}
        </nav>
        <form className="aform--inline aform" action="/admin/statistiques">
          <input type="hidden" name="p" value="perso" />
          <input type="date" name="du" defaultValue={custom ? from : ''} aria-label="Du" required style={{ width: 150 }} />
          <input type="date" name="au" defaultValue={custom ? to : ''} aria-label="Au" required style={{ width: 150 }} />
          <button className={'abtn ' + (custom ? '' : 'abtn--ghost')} type="submit">
            Période personnalisée
          </button>
        </form>
      </PageTitle>

      <div className="akpis">
        <Kpi label="Chiffre d’affaires" value={money(st.current.ca)} tone="accent" delta={delta(st.current.ca, st.previous.ca, money)} />
        <Kpi label="Commandes" value={st.current.n} tone="ok" delta={delta(st.current.n, st.previous.n, String)} />
        <Kpi label="Panier moyen" value={st.current.avg ? money(st.current.avg) : '—'} tone="info" delta={delta(st.current.avg, st.previous.avg, money)} />
      </div>
      <p className="amuted" style={{ marginTop: -6, marginBottom: 16 }}>
        Comparaison avec la période précédente de même durée ({formatDate(st.previous.from, 'short')} – {formatDate(st.previous.to, 'short')}).
      </p>

      {days.length > 1 && (
        <Card title="Chiffre d’affaires par jour">
          <figure className="achart">
            <div className="achart-wrap">
              <div className="achart-scale" aria-hidden="true">
                <span>{money(maxCa)}</span>
                <span>{money(Math.round(maxCa / 2))}</span>
                <span>0 €</span>
              </div>
              <div className="achart-plot" role="img" aria-label={`Chiffre d’affaires quotidien, maximum ${money(maxCa)}`}>
                {series.map((s) => (
                  <span key={s.d} className="achart-col" tabIndex={0} data-tip={`${formatDate(s.d, 'day')} · ${money(s.ca)} · ${s.n} cde(s)`}>
                    <span className="achart-bar" style={{ height: `${(s.ca / maxCa) * 100}%` }} />
                  </span>
                ))}
              </div>
            </div>
            <figcaption className="achart-axis" style={{ marginLeft: 56 }}>
              <span>{formatDate(st.from, 'short')}</span>
              <span>{formatDate(st.to, 'short')}</span>
            </figcaption>
          </figure>
          <details className="atable-view">
            <summary>Voir le tableau</summary>
            <div className="atable-wrap">
              <table className="atable">
                <thead>
                  <tr>
                    <th>Jour</th>
                    <th className="num">Commandes</th>
                    <th className="num">CA</th>
                  </tr>
                </thead>
                <tbody>
                  {series.map((s) => (
                    <tr key={s.d}>
                      <td>{formatDate(s.d, 'day')}</td>
                      <td className="num">{s.n}</td>
                      <td className="num">{money(s.ca)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </Card>
      )}

      <div className="agrid-2" style={{ marginTop: 16 }}>
        <Card title="Produits les plus commandés">
          <Bars rows={st.top.map((p) => ({ label: p.name, value: p.qty, display: `${p.qty} · ${money(p.ca)}` }))} unit="" />
        </Card>
        <div className="astack">
          <Card title="Jours les plus actifs">
            <p className="amuted">Nombre de retraits par jour de la semaine.</p>
            <Bars rows={weekOrder.map((d) => ({ label: dayLabels[d]! + (st.weekdays[d] === busiest && busiest > 0 ? ' ★' : ''), value: st.weekdays[d]!, display: String(st.weekdays[d]) }))} unit="retrait(s)" />
          </Card>
          <Card title="Créneaux les plus demandés">
            <Bars rows={st.slots.map((s) => ({ label: formatTime(s.t), value: s.n, display: String(s.n) }))} unit="commande(s)" />
          </Card>
        </div>
      </div>
    </>
  );
}
