/** Horaires officiels (source : fiche Google + affichage en vitrine). */
export type Interval = { open: string; close: string };
export type DayHours = { day: number; label: string; intervals: Interval[] };

export const openingHours: DayHours[] = [
  { day: 1, label: 'Lundi', intervals: [] },
  { day: 2, label: 'Mardi', intervals: [{ open: '06:30', close: '19:30' }] },
  { day: 3, label: 'Mercredi', intervals: [{ open: '06:30', close: '19:30' }] },
  { day: 4, label: 'Jeudi', intervals: [{ open: '06:30', close: '19:30' }] },
  { day: 5, label: 'Vendredi', intervals: [{ open: '06:30', close: '19:30' }] },
  { day: 6, label: 'Samedi', intervals: [{ open: '06:30', close: '19:00' }] },
  { day: 0, label: 'Dimanche', intervals: [{ open: '07:00', close: '13:30' }] },
];

/** Ordre d'affichage : du lundi au dimanche. */
export const weekOrder = [1, 2, 3, 4, 5, 6, 0];

export const hoursByDay = (day: number) => openingHours.find((d) => d.day === day);
