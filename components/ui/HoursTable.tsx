import { openingHours, weekOrder, formatIntervals } from '@/data/opening-hours';

/**
 * Horaires rendus en HTML côté serveur : lisibles sans JavaScript.
 * Le jour courant est surligné par CSS grâce à l'attribut data-today posé par Motion.tsx.
 */
export function HoursTable({ caption = 'Horaires habituels' }: { caption?: string }) {
  return (
    <table className="hours">
      <caption>{caption}</caption>
      <tbody>
        {weekOrder.map((day) => {
          const entry = openingHours.find((d) => d.day === day)!;
          return (
            <tr key={day} data-day={day} data-closed={entry.intervals.length === 0 || undefined}>
              <th scope="row">{entry.label}</th>
              <td>{formatIntervals(entry.intervals)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
