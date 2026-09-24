import { openingHours, hoursByDay, formatIntervals } from '@/data/opening-hours';

export type BusinessStatus = {
  open: boolean;
  /** Jour courant à Paris (0 = dimanche). */
  day: number;
  /** Horaires du jour, déjà formatés (« Fermé » si fermé toute la journée). */
  today: string;
  /** Précision : « jusqu'à 19h30 », « ouvre à 06h30 », « réouverture mardi à 06h30 ». */
  detail: string;
};

const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const h = (time: string) => time.replace(':', 'h');

/** Heure locale de la boutique, indépendante du fuseau du visiteur. */
export function parisTime(now: Date = new Date()): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { day: map[get('weekday')] ?? 0, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

/** Statut calculé uniquement à partir des horaires habituels configurés. */
export function getBusinessStatus(now: Date = new Date()): BusinessStatus {
  const { day, minutes } = parisTime(now);
  const intervals = hoursByDay(day)?.intervals ?? [];
  const today = formatIntervals(intervals);

  for (const { open, close } of intervals) {
    if (minutes < toMinutes(open)) return { open: false, day, today, detail: `ouvre à ${h(open)}` };
    if (minutes < toMinutes(close)) return { open: true, day, today, detail: `jusqu’à ${h(close)}` };
  }

  for (let i = 1; i <= 7; i++) {
    const next = openingHours.find((d) => d.day === (day + i) % 7);
    const first = next?.intervals[0];
    if (next && first) {
      const when = i === 1 ? 'demain' : next.label.toLowerCase();
      return { open: false, day, today, detail: `réouverture ${when} à ${h(first.open)}` };
    }
  }
  return { open: false, day, today, detail: '' };
}
