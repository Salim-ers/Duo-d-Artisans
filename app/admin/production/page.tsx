import Link from 'next/link';
import { KitchenBoard, type KCustom, type KOrder } from '@/components/admin/Kitchen';
import { AutoRefresh, Clock } from '@/components/admin/ui';
import { requirePage } from '@/lib/auth/session';
import { kitchenBoard } from '@/lib/admin';
import { addDays, isIsoDate, paris } from '@/lib/dates';
import { formatDate } from '@/lib/format';
import { demoVisible } from '@/lib/settings';

export const metadata = { title: 'Production' };
export const dynamic = 'force-dynamic';

/**
 * Mode production — pensé pour une tablette en cuisine : très lisible, gros boutons,
 * aucune donnée client superflue (prénom + initiale du nom).
 */
export default async function ProductionPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requirePage('STAFF');
  const sp = await searchParams;
  const now = paris();
  const date = sp.date && isIsoDate(sp.date) ? sp.date : now.date;
  const [{ orders, custom }, demo] = await Promise.all([kitchenBoard(date), demoVisible()]);
  const cards: (KOrder | KCustom)[] = [
    ...orders.map(
      (o): KOrder => ({
        kind: 'order',
        id: o.id,
        number: o.number,
        time: o.pickupTime,
        name: `${o.firstName} ${o.lastName.charAt(0)}.`,
        status: o.status,
        items: o.items.map((i) => ({ quantity: i.quantity, name: i.name, variantLabel: i.variantLabel, options: i.options })),
        note: o.customerNote,
      }),
    ),
    ...custom.map(
      (c): KCustom => ({
        kind: 'custom',
        id: c.id,
        number: c.number,
        time: c.pickupTime,
        name: `${c.firstName} ${c.lastName.charAt(0)}.`,
        status: c.status,
        type: c.type,
        servings: c.servings,
        details: [c.flavors, c.theme, c.inscription ? `« ${c.inscription} »` : null].filter(Boolean).join(' · ') || null,
      }),
    ),
  ].sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'));
  const collected = cards.filter((c) => c.status === 'collected').length;

  return (
    <div className="akitchen">
      <AutoRefresh seconds={20} />
      <header className="akitchen-top">
        <Link href="/admin" className="abtn abtn--ghost">
          ← Gestion
        </Link>
        <h1>
          {date === now.date ? 'Aujourd’hui' : formatDate(date)} {demo && <small style={{ fontSize: 13, color: '#c8a263' }}>· démonstration</small>}
        </h1>
        <span style={{ color: '#a8998a' }}>{collected} retirée(s)</span>
        <Link href={`/admin/production?date=${addDays(date, -1)}`} className="abtn abtn--ghost">
          ← Veille
        </Link>
        <Link href={`/admin/production?date=${addDays(date, 1)}`} className="abtn abtn--ghost">
          Lendemain →
        </Link>
        <Link href={`/admin/feuille?date=${date}`} className="abtn">
          Feuille de production
        </Link>
        <Clock />
      </header>
      <KitchenBoard cards={cards} nowMinutes={date === now.date ? now.minutes : date < now.date ? 24 * 60 : -1440} />
    </div>
  );
}
