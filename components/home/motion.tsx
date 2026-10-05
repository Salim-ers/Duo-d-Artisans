'use client';

/**
 * Mouvement lié au défilement (Framer Motion, chargé à la demande avec LazyMotion) :
 * uniquement transform / clip-path, jamais de mise en page recalculée.
 * Les apparitions de texte restent en CSS (components/layout/Motion.tsx) : tout est lisible sans JavaScript.
 * Si l'utilisateur demande moins d'animations, chaque effet se fige dans sa position finale.
 */
import { LazyMotion, m, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
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

/** Une image de la scène du récit : elle se dévoile de bas en haut à l'arrivée de son étape. */
function StageLayer({ progress, index, count, children }: { progress: MotionValue<number>; index: number; count: number; children: ReactNode }) {
  const reduce = useReducedMotion();
  const start = index / count;
  const shown = useTransform(progress, (p) => {
    if (index === 0) return 1;
    if (reduce) return p >= start ? 1 : 0;
    return Math.min(1, Math.max(0, (p - (start - 0.07)) / 0.09));
  });
  const clipPath = useTransform(shown, (v) => `inset(${(1 - v) * 100}% 0 0 0)`);
  const scale = useTransform(shown, [0, 1], reduce ? [1, 1] : [1.12, 1]);
  return (
    <m.div className="story-layer" style={{ clipPath, zIndex: index }}>
      <m.div className="story-layer-img" style={{ scale }}>
        {children}
      </m.div>
    </m.div>
  );
}

/**
 * Récit « Du fournil à la vitrine » : une scène fixe (images) et des étapes qui défilent.
 * L'image change selon l'étape qui traverse la ligne de lecture ; sur téléphone la scène reste en haut.
 */
export function Story({ images, steps }: { images: ReactNode[]; steps: { n: string; word: string; text: string }[] }) {
  const list = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: list, offset: ['start 62%', 'end 62%'] });
  const count = steps.length;
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <div className="story-track">
      <div className="story-stage">
        {images.map((img, i) => (
          <StageLayer key={i} progress={scrollYProgress} index={i} count={count}>
            {img}
          </StageLayer>
        ))}
        <div className="story-meter" aria-hidden="true">
          <m.span style={{ scaleY: bar }} />
        </div>
      </div>
      <ol ref={list} className="story-steps">
        {steps.map((s, i) => (
          <StoryStep key={s.n} progress={scrollYProgress} index={i} count={count} step={s} />
        ))}
      </ol>
    </div>
  );
}

/** Étape du récit : pleinement lisible quand elle est sur la ligne de lecture, estompée sinon. */
function StoryStep({ progress, index, count, step }: { progress: MotionValue<number>; index: number; count: number; step: { n: string; word: string; text: string } }) {
  const a = index / count;
  const b = (index + 1) / count;
  const opacity = useTransform(progress, [a - 0.12, a + 0.02, b - 0.04, b + 0.08], [0.72, 1, 1, index === count - 1 ? 1 : 0.72]);
  return (
    <m.li className="story-step" style={{ opacity }}>
      <span className="story-n">{step.n}</span>
      <h3 className="story-word">{step.word}</h3>
      <p className="story-text">{step.text}</p>
    </m.li>
  );
}
