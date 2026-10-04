/**
 * Statut d'ouverture calculé à partir des horaires ENREGISTRÉS (Gestion → Paramètres)
 * et des exceptions du calendrier (fermetures, horaires exceptionnels).
 * Partagé client / serveur : le navigateur recalcule en direct, à l'heure de Paris.
 */
import { dayLabels, formatIntervals, type Interval } from '@/data/opening-hours';
import { addDays, paris, toMinutes, weekday } from '@/lib/dates';

/** Exception publique d'une journée : fermée, ou horaires spéciaux. */
export type DayException = { date: string; closed: boolean; opens: string | null; closes: string | null; note: string | null };

export type BusinessStatus = {
  open: boolean;
  /** Horaires du jour, formatés (« Fermé » si fermé toute la journée). */
  today: string;
  /** « jusqu’à 19h30 », « ouvre à 06h30 », « réouverture demain à 06h30 ». */
  detail: string;
  /** Phrase complète pour le hero : « Ouvert aujourd’hui jusqu’à 19h30 ». */
  sentence: string;
  /** Note de fermeture exceptionnelle éventuelle. */
  note: string | null;
};

const h = (t: string) => t.replace(':', 'h');

export function dayIntervals(week: Interval[][], exceptions: DayException[], date: string): { intervals: Interval[]; note: string | null } {
  const ex = exceptions.find((e) => e.date === date);
  if (ex?.closed) return { intervals: [], note: ex.note || 'Fermeture exceptionnelle' };
  if (ex?.opens && ex.closes) return { intervals: [{ open: ex.opens, close: ex.closes }], note: ex.note || 'Horaires exceptionnels' };
  return { intervals: week[weekday(date)] ?? [], note: null };
}

export function getBusinessStatus(week: Interval[][], exceptions: DayException[] = [], now: Date = new Date()): BusinessStatus {
  const { date, minutes } = paris(now);
  const { intervals, note } = dayIntervals(week, exceptions, date);
  const today = formatIntervals(intervals);

  for (const { open, close } of intervals) {
    if (minutes < toMinutes(open))
      return { open: false, today, note, detail: `ouvre à ${h(open)}`, sentence: `Ouvre aujourd’hui à ${h(open)}` };
    if (minutes < toMinutes(close))
      return { open: true, today, note, detail: `jusqu’à ${h(close)}`, sentence: `Ouvert aujourd’hui jusqu’à ${h(close)}` };
  }

  for (let i = 1; i <= 14; i++) {
    const d = addDays(date, i);
    const first = dayIntervals(week, exceptions, d).intervals[0];
    if (first) {
      const when = i === 1 ? 'demain' : (dayLabels[weekday(d)] ?? '').toLowerCase();
      return { open: false, today, note, detail: `réouverture ${when} à ${h(first.open)}`, sentence: `Fermé · réouverture ${when} à ${h(first.open)}` };
    }
  }
  return { open: false, today, note, detail: '', sentence: 'Fermé' };
}
