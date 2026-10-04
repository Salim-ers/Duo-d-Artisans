/** Écran de chargement entre deux pages de gestion. */
export default function Loading() {
  return (
    <div className="aload" aria-busy="true" aria-label="Chargement">
      <span className="aload-bar" />
      <span className="aload-block aload-block--title" />
      <span className="aload-block" />
      <span className="aload-block aload-block--tall" />
    </div>
  );
}
