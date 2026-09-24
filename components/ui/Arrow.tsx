/** Flèche fine, dessinée pour la typographie du site (pas une icône de bibliothèque). */
export function Arrow({ direction = 'right' }: { direction?: 'right' | 'left' | 'up-right' }) {
  const rotate = direction === 'left' ? 180 : direction === 'up-right' ? -45 : 0;
  return (
    <svg className="arrow" viewBox="0 0 22 10" aria-hidden="true" style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}>
      <path d="M0 5h20M16 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
