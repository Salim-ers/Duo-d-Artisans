/** Calendrier en heure de Paris (partagé client / serveur, sans dépendance). */
const parts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Date "YYYY-MM-DD" et minutes écoulées depuis minuit, à Paris. */
export function paris(at: Date = new Date()) {
  const p = Object.fromEntries(parts.formatToParts(at).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

export const today = () => paris().date;

export function addDays(d: string, n: number) {
  const t = new Date(d + 'T12:00:00Z');
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

/** 0 = dimanche … 6 = samedi */
export const weekday = (d: string) => new Date(d + 'T12:00:00Z').getUTCDay();

/** Lundi de la semaine de `d`. */
export const mondayOf = (d: string) => addDays(d, -((weekday(d) + 6) % 7));

export const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

export const isIsoDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));

