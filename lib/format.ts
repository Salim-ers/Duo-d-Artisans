/** Formatage partagé client / serveur (fr-FR, Europe/Paris). */
const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
export const money = (cents: number) => eur.format(cents / 100);

/** 1250 → "12,50" (champ de saisie). */
export const centsInput = (cents: number | null | undefined) => (cents == null ? '' : (cents / 100).toFixed(2).replace('.', ','));

export const slugify = (v: string) =>
  v
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const noon = (d: string) => new Date(d + 'T12:00:00Z');

export function formatDate(d: string, style: 'long' | 'short' | 'day' | 'full' | 'weekday' = 'long') {
  const opts: Intl.DateTimeFormatOptions =
    style === 'long'
      ? { weekday: 'long', day: 'numeric', month: 'long' }
      : style === 'full'
        ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
        : style === 'short'
          ? { day: 'numeric', month: 'short' }
          : style === 'weekday'
            ? { weekday: 'long' }
            : { weekday: 'short', day: 'numeric' };
  return new Intl.DateTimeFormat('fr-FR', { ...opts, timeZone: 'UTC' }).format(noon(d));
}

export const formatTime = (t: string) => t.replace(':', 'h');

export const formatDateTime = (d: Date | string) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(d));

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Valeur pour <input type="datetime-local"> exprimée en heure de Paris. */
export function toParisInput(d: Date | null) {
  if (!d) return '';
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

