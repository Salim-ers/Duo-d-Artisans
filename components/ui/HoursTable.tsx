'use client';

import { dayLabels, formatIntervals, weekOrder, type Interval } from '@/data/opening-hours';
import { useParisDay } from './OpenNow';

/** Horaires rendus en HTML (lisibles sans JavaScript) ; le jour courant est surligné après hydratation. */
export function HoursTable({ week, caption = 'Horaires', note }: { week: Interval[][]; caption?: string; note?: string | null }) {
  const today = useParisDay();
  return (
    <>
      <table className="hours">
        <caption>{caption}</caption>
        <tbody>
          {weekOrder.map((day) => {
            const intervals = week[day] ?? [];
            return (
              <tr key={day} data-closed={intervals.length === 0 || undefined} data-today={today === day || undefined}>
                <th scope="row">{dayLabels[day]}</th>
                <td>{formatIntervals(intervals)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {note && <p className="hours-note">{note}</p>}
    </>
  );
}
