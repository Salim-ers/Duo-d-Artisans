'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { parisTime } from '@/lib/business-status';

/**
 * Unique script d'amélioration progressive du site (~1 ko) :
 * - révélations au scroll (transform / opacity uniquement) ;
 * - progression liée au scroll pour les éléments [data-progress] (variable CSS --p) ;
 * - jour courant pour le surlignage des horaires ;
 * - repli propre si une photo ne se charge pas.
 *
 * Tant que ce script n'a pas tourné, TOUT le contenu est visible :
 * l'état « caché avant révélation » n'existe que sous html[data-motion].
 */
export function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.today = String(parisTime().day);

    /* Photos cassées : on masque l'icône du navigateur, le cadre reste. */
    const hideBroken = (img: HTMLImageElement) => img.closest('.photo')?.setAttribute('data-broken', '');
    document.querySelectorAll<HTMLImageElement>('.photo img').forEach((img) => {
      if (img.complete && img.naturalWidth === 0) hideBroken(img);
    });
    const onError = (e: Event) => {
      if (e.target instanceof HTMLImageElement) hideBroken(e.target);
    };
    window.addEventListener('error', onError, true);

    /* Révélations */
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
    let observer: IntersectionObserver | undefined;
    if (!reduce && 'IntersectionObserver' in window) {
      const vh = window.innerHeight;
      targets.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.92) el.dataset.shown = '';
      });
      observer = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            (entry.target as HTMLElement).dataset.shown = '';
            observer?.unobserve(entry.target);
          }),
        { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
      );
      targets.forEach((el) => el.dataset.shown === undefined && observer!.observe(el));
      root.dataset.motion = 'on';
    }

    /* Progression liée au scroll */
    const tracks = [...document.querySelectorAll<HTMLElement>('[data-progress]')];
    let frame = 0;
    const measure = () => {
      frame = 0;
      const vh = window.innerHeight;
      tracks.forEach((el) => {
        const r = el.getBoundingClientRect();
        const total = r.height - vh * 0.5;
        const p = Math.min(1, Math.max(0, (vh * 0.5 - r.top) / (total > 0 ? total : 1)));
        el.style.setProperty('--p', p.toFixed(4));
        const steps = Number(el.dataset.steps || 0);
        if (steps) el.dataset.step = String(Math.min(steps - 1, Math.floor(p * steps * 0.999)));
      });
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(measure); };
    if (tracks.length) {
      measure();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
    }

    return () => {
      observer?.disconnect();
      window.removeEventListener('error', onError, true);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
