'use client';

/**
 * Mouvement lié au défilement (Framer Motion, chargé à la demande avec LazyMotion).
 * Uniquement des translations verticales de quelques dizaines de pixels : jamais de zoom ni de recadrage.
 * Les apparitions de texte et les masques photo restent en CSS (components/layout/Motion.tsx) :
 * tout est lisible sans JavaScript. Si l'utilisateur demande moins d'animations, rien ne bouge.
 */
import { LazyMotion, m, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef, type ReactNode } from 'react';

const loadFeatures = () => import('./motion-features').then((mod) => mod.default);

export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}

/**
 * Glissement vertical léger pendant le défilement (`from` → `to`, en pixels).
 * Deux colonnes aux sens opposés « se croisent » ; une photo glisse d'un bloc, sans changer d'échelle.
 */
export function Drift({ children, from = 32, to = -32, className }: { children: ReactNode; from?: number; to?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [from, to]);
  return (
    <div ref={ref} className={className}>
      <m.div style={{ y }}>{children}</m.div>
    </div>
  );
}
