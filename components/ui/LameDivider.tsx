/**
 * Easter egg 01 & 04 — « le coup de lame » :
 * quatre scarifications de baguette qui se dessinent au scroll (GSAP, classe .draw).
 */
export function LameDivider() {
  return (
    <div className="container draw-trigger" style={{ marginTop: 'clamp(46px,6vw,84px)' }}>
      <svg className="lame draw" viewBox="0 0 1200 26" preserveAspectRatio="none" aria-hidden="true">
        <path d="M10 20 C 120 20, 150 6, 250 6" />
        <path d="M300 20 C 410 20, 440 6, 540 6" />
        <path d="M590 20 C 700 20, 730 6, 830 6" />
        <path d="M880 20 C 990 20, 1020 6, 1120 6" />
      </svg>
    </div>
  );
}
