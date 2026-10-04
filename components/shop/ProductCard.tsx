'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ProductView } from '@/lib/catalog';
import { dayLabels } from '@/data/opening-hours';
import { money } from '@/lib/format';
import { CloseIcon } from '@/components/ui/Icons';
import './shop.css';
import { Qty } from './CartSheet';
import { useCart } from './CartProvider';

const shortDays = (days: number[]) => {
  if (!days.length) return null;
  const order = [1, 2, 3, 4, 5, 6, 0].filter((d) => days.includes(d));
  return order.map((d) => (dayLabels[d] ?? '').slice(0, 3).toLowerCase() + '.').join(' ');
};

/** Mentions de disponibilité : délai, jours, stock faible. */
export function availabilityNotes(p: ProductView) {
  const notes: string[] = [];
  if (p.leadTimeHours >= 24) notes.push(`À commander ${Math.round(p.leadTimeHours / 24)} jour${p.leadTimeHours >= 48 ? 's' : ''} à l’avance`);
  else if (p.leadTimeHours > 0) notes.push(`À commander ${p.leadTimeHours} h à l’avance`);
  const days = shortDays(p.availableDays);
  if (days && p.availableDays.length < 7) notes.push(`Retrait ${days}`);
  if (p.stock !== null && p.stock > 0 && p.stock <= Math.max(3, p.stockAlert)) notes.push(`Plus que ${p.stock}`);
  return notes;
}

const configurable = (p: ProductView) => p.variants.length > 0 || p.flavors.length > 0 || p.extras.length > 0;

export function ProductCard({ product: p, orderingOpen, index = 0, priority }: { product: ProductView; orderingOpen: boolean; index?: number; priority?: boolean }) {
  const media = useRef<HTMLDivElement>(null);
  const notes = availabilityNotes(p);
  return (
    <article className="pcard" id={p.slug} style={{ ['--i' as string]: index }} data-off={!p.orderable || undefined}>
      <div className="pcard-media photo" ref={media}>
        {p.image && <Image src={p.image} alt={p.name} fill sizes="(max-width: 560px) 34vw, (max-width: 1100px) 45vw, 22vw" priority={priority} quality={75} />}
        <span className="pcard-tags">
          {p.demo && <span className="demo-tag">Exemple</span>}
          {p.unavailable && <span className="pcard-flag">{p.unavailable}</span>}
        </span>
      </div>
      <div className="pcard-body">
        <h3 className="pcard-name">{p.name}</h3>
        {p.description && <p className="pcard-desc">{p.description}</p>}
        {notes.length > 0 && <p className="pcard-notes">{notes.join(' · ')}</p>}
        {p.allergens.length > 0 && <p className="pcard-allergens">Allergènes : {p.allergens.join(', ')}</p>}
        <div className="pcard-foot">
          <p className="pcard-price price">
            {p.fromPrice && <small>dès </small>}
            {money(p.priceCents)}
          </p>
          {orderingOpen && p.orderable && <AddToCart product={p} media={media} />}
        </div>
      </div>
    </article>
  );
}

function AddToCart({ product: p, media }: { product: ProductView; media: React.RefObject<HTMLDivElement | null> }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [sheet, setSheet] = useState(false);
  const [done, setDone] = useState(false);

  if (configurable(p))
    return (
      <>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => setSheet(true)}>
          Choisir
        </button>
        {sheet && <ProductSheet product={p} onClose={() => setSheet(false)} />}
      </>
    );

  return (
    <span className="pcard-add">
      <Qty value={qty} max={p.maxPerOrder} label={p.name} onChange={(v) => setQty(Math.max(1, v))} />
      <button
        type="button"
        className="btn btn--primary btn--sm"
        data-done={done || undefined}
        onClick={() => {
          add({ productId: p.id, variantId: null, flavorId: null, extraIds: [], quantity: qty, name: p.name, detail: null, unitCents: p.priceCents, image: p.image, max: p.maxPerOrder, demo: p.demo }, media.current);
          setDone(true);
          setQty(1);
          window.setTimeout(() => setDone(false), 1400);
        }}
      >
        {done ? 'Ajouté' : 'Ajouter'}
      </button>
    </span>
  );
}

/** Fiche d'options : format, saveur, suppléments, quantité. */
function ProductSheet({ product: p, onClose }: { product: ProductView; onClose: () => void }) {
  const { add } = useCart();
  const [variantId, setVariant] = useState<string | null>(p.variants[0]?.id ?? null);
  const [flavorId, setFlavor] = useState<string | null>(p.flavors.length === 1 ? p.flavors[0]!.id : null);
  const [extras, setExtras] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [closing, setClosing] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLDivElement>(null);

  const variant = p.variants.find((v) => v.id === variantId);
  const unit = (variant?.priceCents ?? p.priceCents) + p.extras.filter((e) => extras.includes(e.id)).reduce((t, e) => t + e.priceDeltaCents, 0);
  const missing = (p.variants.length > 0 && !variant) || (p.flavors.length > 0 && !flavorId);

  const close = () => {
    setClosing(true);
    window.setTimeout(onClose, 300);
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.dataset.sheet = 'open';
    panel.current?.querySelector<HTMLElement>('input, button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      delete document.documentElement.dataset.sheet;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = () => {
    if (missing) return;
    const flavor = p.flavors.find((f) => f.id === flavorId);
    const detail = [variant?.label, flavor?.label, ...p.extras.filter((e) => extras.includes(e.id)).map((e) => '+ ' + e.label)].filter(Boolean).join(' · ') || null;
    add({ productId: p.id, variantId, flavorId, extraIds: extras, quantity: qty, name: p.name, detail, unitCents: unit, image: p.image, max: p.maxPerOrder, demo: p.demo }, media.current);
    close();
  };

  // Rendu dans <body> : aucun parent animé (transform) ne doit capturer la position fixe.
  return createPortal(
    <>
      <div className="sheet-scrim" data-closing={closing || undefined} onClick={close} aria-hidden="true" />
      <div ref={panel} className="sheet psheet" role="dialog" aria-modal="true" aria-labelledby={`ps-${p.id}`} data-closing={closing || undefined}>
        <span className="sheet-grip" aria-hidden="true" />
        <div className="sheet-head">
          <h2 id={`ps-${p.id}`}>{p.name}</h2>
          <button type="button" className="icon-btn" onClick={close} aria-label="Fermer">
            <CloseIcon />
          </button>
        </div>
        <div className="sheet-body psheet-body">
          <div className="photo psheet-media" ref={media}>
            {p.image && <Image src={p.image} alt={p.name} fill sizes="(max-width: 700px) 100vw, 460px" quality={75} />}
            {p.demo && <span className="pcard-tags"><span className="demo-tag">Exemple — prix non contractuels</span></span>}
          </div>
          {p.description && <p className="t-body">{p.description}</p>}
          {availabilityNotes(p).length > 0 && <p className="pcard-notes">{availabilityNotes(p).join(' · ')}</p>}
          {p.allergens.length > 0 && <p className="pcard-allergens">Allergènes : {p.allergens.join(', ')}</p>}

          {p.variants.length > 0 && (
            <fieldset className="psheet-set">
              <legend>Format</legend>
              <div className="options">
                {p.variants.map((v) => (
                  <label key={v.id} className="option">
                    <input type="radio" name={`v-${p.id}`} checked={variantId === v.id} onChange={() => setVariant(v.id)} />
                    <span>
                      {v.label} <small>{money(v.priceCents)}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {p.flavors.length > 0 && (
            <fieldset className="psheet-set">
              <legend>Saveur</legend>
              <div className="options">
                {p.flavors.map((f) => (
                  <label key={f.id} className="option">
                    <input type="radio" name={`f-${p.id}`} checked={flavorId === f.id} onChange={() => setFlavor(f.id)} />
                    <span>{f.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {p.extras.length > 0 && (
            <fieldset className="psheet-set">
              <legend>Suppléments</legend>
              <div className="options">
                {p.extras.map((e) => (
                  <label key={e.id} className="option">
                    <input type="checkbox" checked={extras.includes(e.id)} onChange={(ev) => setExtras((x) => (ev.target.checked ? [...x, e.id] : x.filter((i) => i !== e.id)))} />
                    <span>
                      {e.label} {e.priceDeltaCents > 0 && <small>+ {money(e.priceDeltaCents)}</small>}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <fieldset className="psheet-set">
            <legend>Quantité</legend>
            <Qty value={qty} max={p.maxPerOrder} label={p.name} onChange={(v) => setQty(Math.max(1, v))} />
          </fieldset>
        </div>
        <div className="sheet-foot">
          <button type="button" className="btn btn--primary btn--block" onClick={submit} disabled={missing}>
            {missing ? (p.variants.length && !variant ? 'Choisissez un format' : 'Choisissez une saveur') : `Ajouter — ${money(unit * qty)}`}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
