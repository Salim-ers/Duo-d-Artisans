'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Système d'animation unique pour tout le site.
 * - Un seul point d'entrée GSAP (chargé dynamiquement, hors du bundle initial).
 * - Les révélations simples passent par IntersectionObserver (pas de JS lourd).
 * - Tout est désactivé si l'utilisateur préfère un mouvement réduit.
 * Timings : 0,85–1,1s pour les révélations, scrub pour tout ce qui suit le scroll.
 */
export function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* --- Révélations (toujours actives, mais instantanées si mouvement réduit) --- */
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); observer.unobserve(e.target); }
      }),
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    );
    document.querySelectorAll<HTMLElement>('.reveal,.rline,.clip').forEach((el) => {
      if (el.dataset.delay) el.style.transitionDelay = el.dataset.delay;
      observer.observe(el);
    });

    if (reduce) return () => observer.disconnect();

    let cleanup: (() => void) | undefined;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        /* Hero : zoom cinématique très lent + léger parallaxe */
        if (document.querySelector('.hero-media img')) {
          gsap.to('.hero-media img', { scale: 1, duration: 2.4, ease: 'power2.out', delay: 0.35 });
          gsap.to('.hero-media img', {
            yPercent: 8, ease: 'none',
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
          });
          gsap.from('.hero h1 .l > span', { yPercent: 108, duration: 1.05, ease: 'power4.out', stagger: 0.08, delay: 0.5 });
          gsap.from('.hero-baseline, .hero-bottom', { y: 22, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.95 });
          gsap.to('.hero-lame path', { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut', delay: 0.8 });
        }

        /* Traits de lame dessinés au scroll */
        gsap.utils.toArray<SVGPathElement>('.draw path').forEach((path) => {
          const len = path.getTotalLength();
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
          gsap.to(path, {
            strokeDashoffset: 0, ease: 'none',
            scrollTrigger: { trigger: path.closest('.draw-trigger') ?? path, start: 'top 85%', end: 'bottom 55%', scrub: 0.6 },
          });
        });

        /* Parallaxes d'images (amplitude volontairement faible) */
        gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
          gsap.fromTo(el, { yPercent: -6 }, {
            yPercent: 6, ease: 'none',
            scrollTrigger: { trigger: el.parentElement!, start: 'top bottom', end: 'bottom top', scrub: true },
          });
        });

        /* Timeline « du matin au soir » */
        const track = document.querySelector('.tl-track');
        if (track) {
          const horizontal = window.matchMedia('(min-width:821px)').matches;
          gsap.to('.tl-progress', {
            [horizontal ? 'width' : 'height']: '100%', ease: 'none',
            scrollTrigger: { trigger: track, start: 'top 78%', end: 'bottom 62%', scrub: 0.5 },
          });
          gsap.utils.toArray<HTMLElement>('.tl-item').forEach((item) => {
            ScrollTrigger.create({
              trigger: item, start: 'top 74%',
              onEnter: () => item.classList.add('is-on'),
              onLeaveBack: () => item.classList.remove('is-on'),
            });
          });
        }

        /* Pâtisseries signature : défilement horizontal épinglé (desktop uniquement) */
        const sigTrack = document.querySelector<HTMLElement>('.sig-track');
        if (sigTrack && window.matchMedia('(min-width:901px)').matches) {
          const distance = () => sigTrack.scrollWidth - window.innerWidth + 40;
          gsap.to(sigTrack, {
            x: () => -distance(), ease: 'none',
            scrollTrigger: {
              trigger: '.sig', start: 'top top', end: () => `+=${distance()}`,
              pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
            },
          });
        }

        /* Savoir-faire : les gestes s'allument un à un */
        gsap.utils.toArray<HTMLElement>('.craft-word').forEach((word) => {
          ScrollTrigger.create({
            trigger: word, start: 'top 82%',
            onEnter: () => word.classList.add('is-on'),
            onLeaveBack: () => word.classList.remove('is-on'),
          });
        });

        /* Easter egg 06 — les deux points se rejoignent au centre */
        const duo = document.querySelector('.duo');
        if (duo) {
          gsap.fromTo('.duo-dot.a', { x: -80, opacity: 0 }, {
            x: () => window.innerWidth * 0.32, opacity: 1, ease: 'none',
            scrollTrigger: { trigger: duo, start: 'top 80%', end: 'center 52%', scrub: 0.7, invalidateOnRefresh: true },
          });
          gsap.fromTo('.duo-dot.b', { x: 80, opacity: 0 }, {
            x: () => -window.innerWidth * 0.32, opacity: 1, ease: 'none',
            scrollTrigger: { trigger: duo, start: 'top 80%', end: 'center 52%', scrub: 0.7, invalidateOnRefresh: true },
          });
        }

        /* Easter egg 02 — la farine : une seule section, desktop uniquement */
        const flour = document.querySelector<HTMLElement>('.flour');
        if (flour && window.matchMedia('(min-width:901px)').matches && flour.childElementCount === 0) {
          const particles: HTMLElement[] = [];
          for (let i = 0; i < 26; i++) {
            const p = document.createElement('i');
            p.style.left = `${Math.random() * 100}%`;
            p.style.top = `${Math.random() * 100}%`;
            p.style.opacity = (0.18 + Math.random() * 0.4).toFixed(2);
            flour.appendChild(p);
            particles.push(p);
          }
          gsap.to(particles, {
            y: -26, duration: 'random(6,12)', repeat: -1, yoyo: true,
            ease: 'sine.inOut', stagger: { each: 0.18, from: 'random' },
          });
          const onMove = (e: PointerEvent) => {
            const rect = flour.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            gsap.to(particles, { x: x * 26, duration: 1.6, ease: 'power2.out', overwrite: 'auto' });
          };
          flour.parentElement?.addEventListener('pointermove', onMove);
        }
      });

      ScrollTrigger.refresh();
      cleanup = () => ctx.revert();
    })();

    return () => { observer.disconnect(); cleanup?.(); };
  }, [pathname]);

  return null;
}
