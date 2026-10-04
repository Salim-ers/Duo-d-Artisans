'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Unique script d'amélioration progressive du site public (~1 ko) :
 * - révélations au scroll (transform / opacity / clip-path uniquement, 60 i/s) ;
 * - repli propre si une photo ne se charge pas.
 *
 * Tant que ce script n'a pas tourné, TOUT le contenu est visible :
 * l'état « caché avant révélation » n'existe que sous html[data-motion].
 */
export function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;

    const hideBroken = (img: HTMLImageElement) => img.closest('.photo')?.setAttribute('data-broken', '');
    document.querySelectorAll<HTMLImageElement>('.photo img').forEach((img) => {
      if (img.complete && img.naturalWidth === 0) hideBroken(img);
    });
    const onError = (e: Event) => {
      if (e.target instanceof HTMLImageElement) hideBroken(e.target);
    };
    window.addEventListener('error', onError, true);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let observer: IntersectionObserver | undefined;
    if (!reduce && 'IntersectionObserver' in window) {
      const vh = window.innerHeight;
      const targets = [...document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-shown])')];
      // Ce qui est déjà à l'écran apparaît tout de suite (après un court délai pour l'effet d'entrée).
      targets.forEach((el) => {
        if (el.getBoundingClientRect().top < vh * 0.9) requestAnimationFrame(() => (el.dataset.shown = ''));
      });
      observer = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            (entry.target as HTMLElement).dataset.shown = '';
            observer?.unobserve(entry.target);
          }),
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
      );
      targets.forEach((el) => observer!.observe(el));
      root.dataset.motion = 'on';
    }

    return () => {
      observer?.disconnect();
      window.removeEventListener('error', onError, true);
    };
  }, [pathname]);

  return null;
}
