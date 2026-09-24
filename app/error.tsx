'use client';

import { site } from '@/data/site';

/** Erreur inattendue : message générique, aucun détail technique affiché. */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="lost wrap">
      <h1 className="t-xl">Une erreur est survenue.</h1>
      <p className="t-lead">
        Réessayez dans un instant. Pour toute urgence : <a className="lnk" href={site.phone.href}>{site.phone.display}</a>.
      </p>
      <p className="lost-links">
        <button type="button" className="btn btn--primary" onClick={reset}>Réessayer</button>
      </p>
    </section>
  );
}
