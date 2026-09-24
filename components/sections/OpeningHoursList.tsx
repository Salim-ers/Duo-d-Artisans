'use client';

import { useEffect, useState } from 'react';
import { openingHours, weekOrder } from '@/data/opening-hours';
import { parisTime } from '@/lib/business-status';

/**
 * Les horaires sont rendus en HTML côté serveur (information essentielle).
 * Le surlignage du jour courant est le seul apport de JavaScript.
 */
export function OpeningHoursList() {
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => setToday(parisTime().day), []);

  return (
    <ul className="hours">
      {weekOrder.map((day) => {
        const entry = openingHours.find((d) => d.day === day)!;
        const closed = entry.intervals.length === 0;
        return (
          <li
            key={day}
            data-day={day}
            className={`${closed ? 'is-closed' : ''}${today === day ? ' is-today' : ''}`}
            suppressHydrationWarning
          >
            <span>{entry.label}</span>
            <b>{closed ? 'Fermé' : entry.intervals.map((i) => `${i.open} – ${i.close}`).join(' · ')}</b>
          </li>
        );
      })}
    </ul>
  );
}
