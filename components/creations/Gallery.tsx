'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Arrow } from '@/components/ui/Arrow';
import { CloseIcon } from '@/components/ui/Icons';

type Item = { id: string; src: string; width: number; height: number; alt: string; title: string | null; description: string | null; category: string };
type Filter = { id: string; label: string };

/**
 * Galerie : filtres instantanés, colonnes à hauteurs naturelles, visionneuse plein écran
 * (flèches, glisser du doigt, Échap). Toutes les photos sont rendues côté serveur.
 */
export function Gallery({ items, filters }: { items: Item[]; filters: Filter[] }) {
  const [active, setActive] = useState('tout');
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get('filtre');
    if (f && filters.some((x) => x.id === f)) setActive(f);
  }, [filters]);

  const choose = (id: string) => {
    setActive(id);
    const url = new URL(window.location.href);
    if (id === 'tout') url.searchParams.delete('filtre');
    else url.searchParams.set('filtre', id);
    window.history.replaceState(null, '', url);
  };

  const shown = active === 'tout' ? items : items.filter((i) => i.category === active);
  const label = (id: string) => filters.find((f) => f.id === id)?.label ?? '';

  return (
    <>
      <div className="gfilters">
        <div className="wrap chips" role="group" aria-label="Filtrer les créations">
          {[{ id: 'tout', label: 'Tout' }, ...filters].map((f) => (
            <button key={f.id} type="button" className="chip" aria-pressed={active === f.id} onClick={() => choose(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="wrap">
        <ul className="gallery" key={active} role="list">
          {shown.map((g, i) => (
            <li key={g.id} className="gitem" style={{ ['--i' as string]: Math.min(i, 10) }}>
              <button type="button" className="gitem-btn" onClick={() => setOpen(i)} aria-label={`Agrandir : ${g.title ?? g.alt}`}>
                <span className="gitem-media" style={{ aspectRatio: `${g.width} / ${g.height}` }}>
                  <Image src={g.src} alt={g.alt} fill sizes="(max-width: 640px) 92vw, (max-width: 1100px) 46vw, 31vw" quality={75} priority={i < 3} />
                </span>
              </button>
              {(g.title || g.description) && (
                <p className="gitem-cap">
                  {g.title && <b>{g.title}</b>}
                  <span>{g.description ?? label(g.category)}</span>
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
      {open !== null && shown[open] && <Lightbox items={shown} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}

function Lightbox({ items, index, onIndex, onClose }: { items: Item[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const item = items[index]!;
  const touch = useRef<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const prev = useCallback(() => onIndex((index - 1 + items.length) % items.length), [index, items.length, onIndex]);
  const next = useCallback(() => onIndex((index + 1) % items.length), [index, items.length, onIndex]);

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    box.current?.querySelector<HTMLElement>('button')?.focus();
    return () => {
      document.body.style.overflow = overflow;
      before?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  return createPortal(
    <div
      ref={box}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={item.title ?? item.alt}
      onTouchStart={(e) => (touch.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        const start = touch.current;
        const end = e.changedTouches[0]?.clientX;
        if (start == null || end == null) return;
        if (end - start > 50) prev();
        if (start - end > 50) next();
      }}
    >
      <button type="button" className="lightbox-close icon-btn" onClick={onClose} aria-label="Fermer">
        <CloseIcon />
      </button>
      <figure className="lightbox-figure" key={item.id}>
        <span className="lightbox-media">
          <Image src={item.src} alt={item.alt} fill sizes="100vw" quality={82} />
        </span>
        <figcaption>
          {item.title && <b>{item.title}</b>}
          {item.description && <span>{item.description}</span>}
          <small>
            {index + 1} / {items.length}
          </small>
        </figcaption>
      </figure>
      {items.length > 1 && (
        <>
          <button type="button" className="lightbox-nav lightbox-prev icon-btn" onClick={prev} aria-label="Photo précédente">
            <Arrow direction="left" />
          </button>
          <button type="button" className="lightbox-nav lightbox-next icon-btn" onClick={next} aria-label="Photo suivante">
            <Arrow />
          </button>
        </>
      )}
    </div>,
    document.body,
  );
}
