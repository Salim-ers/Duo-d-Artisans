'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { gallery, galleryFilters, type GalleryFilter } from '@/data/gallery';
import { media } from '@/data/media';

/** Galerie éditoriale en masonry + lightbox accessible (clavier, swipe, Échap). */
export function GalleryGrid() {
  const [filter, setFilter] = useState<GalleryFilter>('tout');
  const [index, setIndex] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef(0);

  const items = useMemo(
    () => gallery.filter((g) => filter === 'tout' || g.filter === filter),
    [filter],
  );

  const move = useCallback((delta: number) => {
    setIndex((i) => (i === null ? i : (i + delta + items.length) % items.length));
  }, [items.length]);

  useEffect(() => {
    if (index === null) return;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndex(null);
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowLeft') move(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [index, move]);

  const current = index !== null ? items[index] : undefined;
  const currentMedia = current ? media[current.key] : undefined;

  return (
    <>
      <div className="filters" role="group" aria-label="Filtrer la galerie">
        {galleryFilters.map((f) => (
          <button key={f.id} data-filter={f.id} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="masonry">
        {items.map((item, i) => {
          const img = media[item.key];
          return (
            <button
              key={item.key}
              className={`card${item.glaze ? ' card--glaze' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Agrandir : ${img.alt}`}
            >
              <Image src={img.src} alt={img.alt} width={1200} height={Math.round(1200 / img.ratio)} sizes="(max-width:820px) 100vw, 32vw" />
            </button>
          );
        })}
      </div>

      <div className={`lightbox${current ? ' is-open' : ''}`} aria-hidden={!current} role="dialog" aria-modal="true" aria-label="Galerie photo"
        onClick={(e) => { if (e.target === e.currentTarget) setIndex(null); }}
        onTouchStart={(e) => { touchX.current = e.touches[0]!.clientX; }}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0]!.clientX - touchX.current;
          if (Math.abs(dx) > 50) move(dx < 0 ? 1 : -1);
        }}
      >
        <button ref={closeRef} className="x" aria-label="Fermer" onClick={() => setIndex(null)}><X size={18} /></button>
        <button className="nav-b prev" aria-label="Image précédente" onClick={() => move(-1)}><ChevronLeft size={18} /></button>
        <button className="nav-b next" aria-label="Image suivante" onClick={() => move(1)}><ChevronRight size={18} /></button>
        {currentMedia && (
          <div>
            <Image src={currentMedia.src} alt={currentMedia.alt} width={1600} height={Math.round(1600 / currentMedia.ratio)} sizes="92vw" quality={88} />
            <p className="cap">{currentMedia.alt}</p>
          </div>
        )}
      </div>
    </>
  );
}
