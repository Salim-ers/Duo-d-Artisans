'use client';

import { useEffect, useState } from 'react';
import type { Interval } from '@/data/opening-hours';
import { getBusinessStatus, type BusinessStatus, type DayException } from '@/lib/hours';

/**
 * Statut calculé dans le navigateur, en direct, à partir des horaires ENREGISTRÉS (heure de Paris).
 * Le rendu serveur n'affirme rien de figé : une mention neutre, remplacée dès l'hydratation.
 */
function useStatus(week: Interval[][], exceptions: DayException[]) {
  const [status, setStatus] = useState<BusinessStatus | null>(null);
  useEffect(() => {
    const update = () => setStatus(getBusinessStatus(week, exceptions));
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, [week, exceptions]);
  return status;
}

type Props = { week: Interval[][]; exceptions: DayException[] };

/** Ligne compacte : « Ouvert aujourd’hui jusqu’à 19h30 ». */
export function OpenNowLine({ week, exceptions, className = '' }: Props & { className?: string }) {
  const s = useStatus(week, exceptions);
  return (
    <p className={`now ${className}`} data-open={s ? String(s.open) : undefined} aria-live="polite">
      <span className="now-dot" aria-hidden="true" />
      <span>{s ? s.sentence : 'Du mardi au dimanche'}</span>
      {s?.note && <span className="now-note">{s.note}</span>}
    </p>
  );
}

/** Grand statut : infos pratiques. */
export function OpenNowBig({ week, exceptions }: Props) {
  const s = useStatus(week, exceptions);
  return (
    <div className="now-big" data-open={s ? String(s.open) : undefined} aria-live="polite">
      <p className="now-big-word">{s ? (s.open ? 'Ouvert' : 'Fermé') : 'Horaires'}</p>
      <p className="now-big-detail">{s ? [s.note, s.detail].filter(Boolean).join(' · ') || 'En ce moment' : 'Du mardi au dimanche'}</p>
    </div>
  );
}

/** Jour courant (heure de Paris) pour surligner la ligne des horaires, côté client uniquement. */
export function useParisDay() {
  const [day, setDay] = useState<number | null>(null);
  useEffect(() => {
    const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    setDay(map[new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short' }).format(new Date())] ?? null);
  }, []);
  return day;
}
