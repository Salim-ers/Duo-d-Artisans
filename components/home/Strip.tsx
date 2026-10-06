'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Photo panoramique : sur grand écran elle s'affiche entière en pleine largeur ; sur téléphone elle garde
 * une hauteur confortable et se parcourt au doigt (défilement horizontal), au lieu d'être recadrée.
 * Au chargement, la bande se place au centre de la photo.
 */
export function Strip({ children, label, className = '' }: { children: ReactNode; label: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let centered = false;
    const update = () => {
      const can = el.scrollWidth > el.clientWidth + 4;
      setScrollable(can);
      if (can && !centered && el.scrollLeft === 0) {
        el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
        centered = true;
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.querySelector('img')?.addEventListener('load', update);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`strip ${className}`}
      role={scrollable ? 'region' : undefined}
      aria-label={scrollable ? label : undefined}
      tabIndex={scrollable ? 0 : undefined}
      data-scrollable={scrollable || undefined}
    >
      {children}
    </div>
  );
}
