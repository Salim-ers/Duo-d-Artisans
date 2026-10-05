'use client';

/**
 * Mouvement lié au défilement (Framer Motion, chargé à la demande avec LazyMotion) :
 * uniquement transform / clip-path, jamais de mise en page recalculée.
 * Les apparitions de texte restent en CSS (components/layout/Motion.tsx) : tout est lisible sans JavaScript.
 * Si l'utilisateur demande moins d'animations, chaque effet se fige dans sa position finale.
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

/** Progression (0 → 1) d'un élément qui traverse l'écran, de son entrée par le bas à sa sortie par le haut. */
function useCrossing() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  return { ref, progress: scrollYProgress };
}

/**
 * Glissement vertical léger pendant le défilement (`from` → `to`, en pixels).
 * Deux colonnes aux sens opposés « se croisent ».
 */
export function Drift({ children, from = 48, to = -48, className }: { children: ReactNode; from?: number; to?: number; className?: string }) {
  const { ref, progress } = useCrossing();
  const reduce = useReducedMotion();
  const y = useTransform(progress, [0, 1], reduce ? [0, 0] : [from, to]);
  return (
    <div ref={ref} className={className}>
      <m.div style={{ y }}>{children}</m.div>
    </div>
  );
}

/** Image qui glisse dans son cadre (parallaxe interne) : le cadre reste fixe, la photo bouge de ±`amount` %. */
export function Pan({ children, amount = 7, className }: { children: ReactNode; amount?: number; className?: string }) {
  const { ref, progress } = useCrossing();
  const reduce = useReducedMotion();
  const y = useTransform(progress, [0, 1], reduce ? ['0%', '0%'] : [`-${amount}%`, `${amount}%`]);
  return (
    <div ref={ref} className={className}>
      <m.div className="pan-layer" style={{ y, scale: reduce ? 1 : 1 + (amount * 2.4) / 100 }}>
        {children}
      </m.div>
    </div>
  );
}

/** Photo plein écran qui recule doucement en entrant (1,14 → 1). */
export function Settle({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start start'] });
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1.14, 1]);
  return (
    <div ref={ref} className={className}>
      <m.div className="pan-layer" style={{ scale }}>
        {children}
      </m.div>
    </div>
  );
}
