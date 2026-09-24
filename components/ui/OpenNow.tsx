'use client';

import { useEffect, useState } from 'react';
import { getBusinessStatus, type BusinessStatus } from '@/lib/business-status';

/**
 * Statut calculé dans le navigateur à partir des horaires habituels (Europe/Paris).
 * Le rendu serveur affiche une mention neutre : jamais d'affirmation figée dans le HTML.
 */
function useStatus() {
  const [status, setStatus] = useState<BusinessStatus | null>(null);
  useEffect(() => {
    const update = () => setStatus(getBusinessStatus());
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return status;
}

/** Ligne compacte : hero, en-tête mobile. */
export function OpenNowLine() {
  const s = useStatus();
  return (
    <p className="now" data-open={s ? String(s.open) : undefined} aria-live="polite">
      <span className="now-dot" aria-hidden="true" />
      {s ? (
        <>
          <b>{s.open ? 'Ouvert' : 'Fermé'}</b>
          <span>{s.detail}</span>
          <span className="now-today">Aujourd’hui · {s.today}</span>
        </>
      ) : (
        <span>Du mardi au dimanche</span>
      )}
    </p>
  );
}

/** Grand statut : section infos pratiques. */
export function OpenNowBig() {
  const s = useStatus();
  return (
    <div className="now-big" data-open={s ? String(s.open) : undefined} aria-live="polite">
      <p className="now-big-word">{s ? (s.open ? 'Ouvert' : 'Fermé') : 'Horaires'}</p>
      <p className="now-big-detail">
        {s ? (s.detail ? `En ce moment · ${s.detail}` : 'En ce moment') : 'Du mardi au dimanche'}
      </p>
    </div>
  );
}
