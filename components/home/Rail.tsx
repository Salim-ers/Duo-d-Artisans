'use client';

import { useEffect, useRef, useState } from 'react';
import { Arrow } from '@/components/ui/Arrow';

/**
 * Défilement horizontal natif (swipe, trackpad, clavier).
 * JavaScript n'ajoute que les boutons précédent / suivant pour la souris.
 */
export function Rail({ label, children }: { label: string; children: React.ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () =>
      setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const move = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <div className="rail">
      <div className="rail-track" ref={track} tabIndex={0} role="region" aria-label={label}>
        {children}
      </div>
      <div className="rail-controls">
        <button type="button" onClick={() => move(-1)} disabled={edges.start} aria-label="Photos précédentes"><Arrow direction="left" /></button>
        <button type="button" onClick={() => move(1)} disabled={edges.end} aria-label="Photos suivantes"><Arrow /></button>
      </div>
    </div>
  );
}
