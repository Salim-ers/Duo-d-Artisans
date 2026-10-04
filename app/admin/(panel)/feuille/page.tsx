import Link from 'next/link';
import { Card, Empty, PageTitle } from '@/components/admin/bits';
import { PrintButton } from '@/components/admin/ui';
import { productionSheet } from '@/lib/admin';
import { addDays, isIsoDate, today } from '@/lib/dates';
import { formatDate, formatTime } from '@/lib/format';

export const metadata = { title: 'Feuille de production' };

/** Quantités à fabriquer pour une date, puis le détail par heure de retrait. Imprimable, exportable en PDF. */
export default async function SheetPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const sp = await searchParams;
  const date = sp.date && isIsoDate(sp.date) ? sp.date : today();
  const sheet = await productionSheet(date);
  const groups = new Map<string, typeof sheet.products>();
  for (const p of sheet.products) groups.set(p.category, [...(groups.get(p.category) ?? []), p]);
  const totalPieces = sheet.products.reduce((t, p) => t + p.qty, 0);

  return (
    <>
      <PageTitle title="Feuille de production" sub={`${sheet.orderCount} commande(s) · ${totalPieces} pièce(s) à préparer`}>
        <div className="aday-nav">
          <Link className="abtn abtn--ghost" href={`/admin/feuille?date=${addDays(date, -1)}`}>
            ←
          </Link>
          <form action="/admin/feuille" className="aday-nav">
            <input type="date" name="date" defaultValue={date} aria-label="Date" style={{ width: 160 }} />
            <button className="abtn abtn--ghost" type="submit">
              Voir
            </button>
          </form>
          <Link className="abtn abtn--ghost" href={`/admin/feuille?date=${addDays(date, 1)}`}>
            →
          </Link>
        </div>
        <PrintButton />
        <a className="abtn abtn--ghost" href={`/api/admin/feuille?date=${date}`} target="_blank" rel="noopener">
          Exporter en PDF
        </a>
        <Link className="abtn" href={`/admin/production?date=${date}`}>
          Mode tablette
        </Link>
      </PageTitle>

      <p className="aprod-big">{formatDate(date, 'full')}</p>
      <p className="amuted" style={{ marginBottom: 16 }}>
        Commandes non annulées, tous statuts confondus.
      </p>

      {sheet.products.length ? (
        <div className="aprod">
          {[...groups.entries()].map(([cat, items]) => (
            <section key={cat} className="aprod-group">
              <h2>{cat}</h2>
              <ul>
                {items.map((p) => (
                  <li key={p.name}>
                    <div className="aprod-line">
                      <span>{p.name}</span>
                      <strong>{p.qty}</strong>
                    </div>
                    {p.detail.map((d) => (
                      <div key={d.label} className="aprod-detail">
                        <span>{d.label}</span>
                        <span>{d.qty}</span>
                      </div>
                    ))}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <Empty>Aucune commande à préparer pour cette date.</Empty>
      )}

      {sheet.custom.length > 0 && (
        <Card title="Commandes personnalisées">
          <ul className="aitems">
            {sheet.custom.map((c) => (
              <li key={c.id}>
                <span className="aqty">{c.pickupTime ? formatTime(c.pickupTime) : '—'}</span>
                <span>
                  <Link href={`/admin/personnalisees/${c.id}`} className="atable-link">
                    {c.type} · {c.servings} pers.
                  </Link>
                  <small>{[c.flavors, c.theme, c.inscription ? `« ${c.inscription} »` : null].filter(Boolean).join(' · ')}</small>
                </span>
                <span className="amuted">
                  {c.firstName} {c.lastName}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {sheet.slots.length > 0 && (
        <div className="aprint-break" style={{ marginTop: 16 }}>
          <Card title="Détail par heure de retrait">
            <ul className="atimeline">
              {sheet.slots.map(([time, orders]) => (
                <li key={time}>
                  <span className="atimeline-time">{formatTime(time)}</span>
                  <div className="astack" style={{ gap: 8 }}>
                    {orders.map((o) => (
                      <div key={o.id}>
                        <Link href={`/admin/commandes?ouvrir=${o.id}&date=${date}`} className="atable-link">
                          {o.number} — {o.lastName.toUpperCase()} {o.firstName}
                        </Link>
                        <div className="amuted">{o.items.map((i) => `${i.quantity} × ${i.name}${i.variantLabel ? ' (' + i.variantLabel + ')' : ''}${i.options ? ' [' + i.options + ']' : ''}`).join(', ')}</div>
                        {o.customerNote && <div className="ainstr" style={{ marginTop: 4 }}>{o.customerNote}</div>}
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </>
  );
}
