'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { money } from '@/lib/format';
import { CloseIcon } from '@/components/ui/Icons';
import { Arrow } from '@/components/ui/Arrow';
import { useCart, type CartLine } from './CartProvider';

export function Qty({ value, max, onChange, label }: { value: number; max: number; onChange: (v: number) => void; label: string }) {
  return (
    <span className="qty" role="group" aria-label={`Quantité — ${label}`}>
      <button type="button" onClick={() => onChange(value - 1)} aria-label="Retirer un" disabled={value <= 0}>
        −
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} aria-label="Ajouter un" disabled={value >= max}>
        +
      </button>
    </span>
  );
}

export function CartLines({ lines, editable = true }: { lines: CartLine[]; editable?: boolean }) {
  const { setQty, remove } = useCart();
  return (
    <ul className="lines">
      {lines.map((l) => (
        <li key={l.key} className="line">
          <span className="photo line-thumb">{l.image && <Image src={l.image} alt="" fill sizes="72px" quality={70} />}</span>
          <p className="line-name">
            {l.name}
            {l.detail && <span className="line-detail">{l.detail}</span>}
            {l.demo && <span className="line-detail">Prix d’exemple</span>}
          </p>
          <span className="line-price">{money(l.unitCents * l.quantity)}</span>
          {editable && (
            <span className="line-actions">
              <Qty value={l.quantity} max={l.max} label={l.name} onChange={(v) => setQty(l.key, v)} />
              <button type="button" className="line-remove" onClick={() => remove(l.key)}>
                Retirer
              </button>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Panier : tiroir à droite sur grand écran, feuille montante sur téléphone. */
export function CartSheet() {
  const { lines, open, setOpen, subtotal, count, toast } = useCart();
  const [closing, setClosing] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const close = () => {
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      setOpen(false);
    }, 320);
  };

  useEffect(() => setOpen(false), [pathname, setOpen]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.dataset.sheet = 'open';
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>('button, a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab' && panel.current) {
        const items = [...panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      delete root.dataset.sheet;
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      {toast && !open && (
        <div className="toast" role="status" key={toast.id}>
          {toast.text}
          <button type="button" className="lnk" onClick={() => setOpen(true)}>
            Voir
          </button>
        </div>
      )}
      {open && (
        <>
          <div className="sheet-scrim" data-closing={closing || undefined} onClick={close} aria-hidden="true" />
          <div ref={panel} className="sheet" role="dialog" aria-modal="true" aria-labelledby="cart-title" data-closing={closing || undefined}>
            <span className="sheet-grip" aria-hidden="true" />
            <div className="sheet-head">
              <h2 id="cart-title">
                Votre panier {count > 0 && <small>{count} article{count > 1 ? 's' : ''}</small>}
              </h2>
              <button type="button" className="icon-btn" onClick={close} aria-label="Fermer le panier">
                <CloseIcon />
              </button>
            </div>
            <div className="sheet-body">
              {lines.length ? (
                <CartLines lines={lines} />
              ) : (
                <div className="sheet-empty">
                  <p>Votre panier est vide.</p>
                  <p className="t-small">Choisissez vos envies, puis un créneau de retrait en boutique.</p>
                  <Link className="btn btn--primary" href="/commander">
                    Commander <Arrow />
                  </Link>
                </div>
              )}
            </div>
            {lines.length > 0 && (
              <div className="sheet-foot">
                <p className="sheet-total">
                  <span>Sous-total</span>
                  <b className="price">{money(subtotal)}</b>
                </p>
                <p className="sheet-hint">Retrait en boutique : vous choisissez le jour et l’heure à l’étape suivante.</p>
                <Link className="btn btn--primary btn--block" href="/panier">
                  Choisir mon créneau <Arrow />
                </Link>
                <button type="button" className="btn btn--line btn--block btn--sm" onClick={close}>
                  Continuer mes achats
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
