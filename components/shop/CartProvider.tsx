'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

/**
 * Panier conservé dans le navigateur (localStorage). L'affichage est indicatif :
 * le serveur recalcule prix, stock, options et disponibilité à chaque étape.
 */
export type CartLine = {
  key: string;
  productId: string;
  variantId: string | null;
  flavorId: string | null;
  extraIds: string[];
  quantity: number;
  name: string;
  detail: string | null;
  unitCents: number;
  image: string | null;
  max: number;
  demo: boolean;
};

export const lineKey = (l: Pick<CartLine, 'productId' | 'variantId' | 'flavorId' | 'extraIds'>) =>
  [l.productId, l.variantId ?? '', l.flavorId ?? '', [...l.extraIds].sort().join('+')].join('|');

type Ctx = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (l: Omit<CartLine, 'key'>, from?: HTMLElement | null) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  bump: number;
  toast: { id: number; text: string } | null;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = 'duo-cart-v1';

/** Vol de la photo du produit vers l'icône du panier visible (en-tête ou barre mobile). */
function flyToCart(from: HTMLElement | null | undefined) {
  if (!from || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const target = [...document.querySelectorAll<HTMLElement>('[data-cart-target]')].find((el) => el.offsetParent !== null);
  const img = from.querySelector('img');
  if (!target || !img) return;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = Math.min(a.width, a.height, 160);
  const fly = document.createElement('div');
  fly.className = 'fly';
  fly.style.cssText = `left:${a.left + a.width / 2 - size / 2}px;top:${a.top + a.height / 2 - size / 2}px;width:${size}px;height:${size}px`;
  const clone = document.createElement('img');
  clone.src = img.currentSrc || img.src;
  clone.alt = '';
  fly.appendChild(clone);
  document.body.appendChild(fly);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = fly.animate(
    [
      { transform: 'translate3d(0,0,0) scale(1)', opacity: 1, borderRadius: '10px' },
      { transform: `translate3d(${dx * 0.35}px, ${dy * 0.35 - 90}px, 0) scale(0.7)`, opacity: 1, offset: 0.4 },
      { transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.12)`, opacity: 0.4, borderRadius: '50%' },
    ],
    { duration: 820, easing: 'cubic-bezier(0.55, 0, 0.2, 1)', fill: 'forwards' },
  );
  anim.onfinish = () => fly.remove();
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpenState] = useState(false);
  const [bump, setBump] = useState(0);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) setLines(parsed.filter((l) => l && typeof l.productId === 'string' && l.quantity > 0));
      }
    } catch {
      /* stockage indisponible : panier en mémoire */
    }
    setReady(true);
    const sync = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      try {
        setLines(e.newValue ? JSON.parse(e.newValue) : []);
      } catch {
        /* ignoré */
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* ignoré */
    }
  }, [lines, ready]);

  const add = useCallback((l: Omit<CartLine, 'key'>, from?: HTMLElement | null) => {
    const key = lineKey(l);
    setLines((prev) => {
      const found = prev.find((x) => x.key === key);
      if (found) return prev.map((x) => (x.key === key ? { ...x, ...l, key, quantity: Math.min(l.max, x.quantity + l.quantity) } : x));
      return [...prev, { ...l, key, quantity: Math.min(l.max, l.quantity) }];
    });
    flyToCart(from);
    window.setTimeout(() => setBump((b) => b + 1), 700);
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), text: `${l.quantity} × ${l.name} ajouté${l.quantity > 1 ? 's' : ''} au panier` });
    timer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) => (qty <= 0 ? prev.filter((x) => x.key !== key) : prev.map((x) => (x.key === key ? { ...x, quantity: Math.min(x.max, qty) } : x))));
  }, []);
  const remove = useCallback((key: string) => setLines((prev) => prev.filter((x) => x.key !== key)), []);
  const clear = useCallback(() => setLines([]), []);
  const setOpen = useCallback((v: boolean) => {
    setOpenState(v);
    if (v) setToast(null);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lines,
      ready,
      open,
      setOpen,
      add,
      setQty,
      remove,
      clear,
      bump,
      toast,
      count: lines.reduce((t, l) => t + l.quantity, 0),
      subtotal: lines.reduce((t, l) => t + l.quantity * l.unitCents, 0),
    }),
    [lines, ready, open, setOpen, add, setQty, remove, clear, bump, toast],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error('useCart hors de CartProvider');
  return c;
}
