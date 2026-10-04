'use client';

import { useRouter } from 'next/navigation';
import { useOptimistic, useTransition } from 'react';
import { quickCustomStatus, quickOrderStatus } from '@/app/admin/actions';

type Item = { quantity: number; name: string; variantLabel: string | null; options: string | null };
export type KOrder = { kind: 'order'; id: string; number: string; time: string; name: string; status: string; items: Item[]; note: string | null };
export type KCustom = { kind: 'custom'; id: string; number: string; time: string | null; name: string; status: string; type: string; servings: number; details: string | null };
type Card = KOrder | KCustom;

/** Colonne d'un statut, et statut suivant / précédent (commandes et demandes personnalisées). */
const column = (c: Card) =>
  c.kind === 'order'
    ? ['new', 'confirmed', 'to_prepare'].includes(c.status)
      ? 'todo'
      : c.status === 'in_preparation'
        ? 'prep'
        : c.status === 'ready'
          ? 'ready'
          : 'done'
    : c.status === 'accepted'
      ? 'todo'
      : c.status === 'in_preparation'
        ? 'prep'
        : c.status === 'ready'
          ? 'ready'
          : 'done';
const nextStatus = { todo: 'in_preparation', prep: 'ready', ready: 'collected' } as const;
const prevStatus = (c: Card) => ({ prep: c.kind === 'order' ? 'to_prepare' : 'accepted', ready: 'in_preparation', todo: null, done: 'ready' })[column(c)];

const label = { todo: 'Commencer', prep: 'Prête', ready: 'Retirée' } as const;
const btn = { todo: 'akbtn--start', prep: 'akbtn--ready', ready: 'akbtn--done' } as const;

export function KitchenBoard({ cards, nowMinutes }: { cards: Card[]; nowMinutes: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [view, setView] = useOptimistic(cards, (state: Card[], change: { id: string; status: string }) => state.map((c) => (c.id === change.id ? { ...c, status: change.status } : c)));

  const move = (c: Card, status: string) =>
    start(async () => {
      setView({ id: c.id, status });
      const r = c.kind === 'order' ? await quickOrderStatus(c.id, status) : await quickCustomStatus(c.id, status);
      if (!r.ok) window.alert(r.error);
      router.refresh();
    });

  const cols = [
    { key: 'todo', title: 'À préparer', cls: 'akitchen-col--todo' },
    { key: 'prep', title: 'En préparation', cls: 'akitchen-col--prep' },
    { key: 'ready', title: 'Prêtes', cls: 'akitchen-col--ready' },
  ] as const;

  return (
    <div className="akitchen-cols" aria-busy={pending || undefined}>
      {cols.map((col) => {
        const list = view.filter((c) => column(c) === col.key);
        return (
          <section key={col.key} className={'akitchen-col ' + col.cls} aria-label={col.title}>
            <h2>
              {col.title} <span>{list.length}</span>
            </h2>
            {list.length === 0 && <p className="akempty">Rien ici.</p>}
            {list.map((c) => {
              const [h, m] = (c.time ?? '23:59').split(':').map(Number) as [number, number];
              const late = col.key !== 'ready' && h * 60 + m - nowMinutes < 15;
              const prev = prevStatus(c);
              return (
                <article key={c.id} className="akcard" data-late={late || undefined}>
                  <div className="akcard-head">
                    <span className="akcard-time">{c.time ? c.time.replace(':', 'h') : '—'}</span>
                    <span className="akcard-num">{c.number}</span>
                  </div>
                  {c.kind === 'custom' && <span className="akcard-tag">Personnalisée · {c.type}</span>}
                  <span className="akcard-name">{c.name}</span>
                  {c.kind === 'order' ? (
                    <ul>
                      {c.items.map((i, k) => (
                        <li key={k}>
                          <b>{i.quantity}</b>
                          <span>
                            {i.name}
                            {(i.variantLabel || i.options) && <small>{[i.variantLabel, i.options].filter(Boolean).join(' · ')}</small>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul>
                      <li>
                        <b>{c.servings}</b>
                        <span>
                          personnes
                          {c.details && <small>{c.details}</small>}
                        </span>
                      </li>
                    </ul>
                  )}
                  {c.kind === 'order' && c.note && <p className="akcard-note">{c.note}</p>}
                  <button type="button" className={'akbtn ' + btn[col.key]} onClick={() => move(c, nextStatus[col.key])}>
                    {label[col.key]}
                  </button>
                  {prev && (
                    <button type="button" className="akbtn-back" onClick={() => move(c, prev)}>
                      ↩ Revenir en arrière
                    </button>
                  )}
                </article>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
