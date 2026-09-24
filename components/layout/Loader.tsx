'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Easter egg 03 — deux traits se rejoignent avant de révéler la signature.
 * Durée maximale ~1s, jamais bloquant : désactivé si prefers-reduced-motion
 * et retiré du DOM une fois terminé.
 */
export function Loader() {
  const [done, setDone] = useState(false);
  const [hidden, setHidden] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setDone(true); setHidden(true); return; }

    document.body.style.overflow = 'hidden';
    let ctx: { revert: () => void } | undefined;

    (async () => {
      const { gsap } = await import('gsap');
      ctx = gsap.context(() => {
        gsap.timeline({ onComplete: () => setDone(true) })
          .set('.loader .bar', { xPercent: -50, yPercent: -50 })
          .fromTo('.loader .bar.a', { x: -70, opacity: 0, scaleX: 0.4 }, { x: -30, opacity: 1, scaleX: 1, duration: 0.45, ease: 'power3.out' })
          .fromTo('.loader .bar.b', { x: 70, opacity: 0, scaleX: 0.4 }, { x: 30, opacity: 1, scaleX: 1, duration: 0.45, ease: 'power3.out' }, '<')
          .to('.loader .bar.a', { x: -8, duration: 0.35, ease: 'power2.inOut' })
          .to('.loader .bar.b', { x: 8, duration: 0.35, ease: 'power2.inOut' }, '<')
          .to('.loader .lg b', { opacity: 1, duration: 0.45, stagger: 0.06, ease: 'power2.out' }, '-=.1');
      }, root);
    })();

    return () => { ctx?.revert(); document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (!done) return;
    document.body.style.overflow = '';
    const id = window.setTimeout(() => setHidden(true), 800);
    return () => window.clearTimeout(id);
  }, [done]);

  if (hidden) return null;

  return (
    <div ref={root} className={`loader${done ? ' is-done' : ''}`} aria-hidden="true">
      <div className="lg">
        <span className="bar a" /><span className="bar b" />
        <b>Le Duo</b><b>d’Artisans</b>
      </div>
    </div>
  );
}
