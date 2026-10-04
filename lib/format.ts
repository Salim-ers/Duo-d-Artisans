/** Formatage partagé client / serveur (fr-FR, Europe/Paris). */
const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
export const money = (cents: number) => eur.format(cents / 100);

/** 1250 → "12,50" (champ de saisie). */
export const centsInput = (cents: number | null | undefined) => (cents == null ? '' : (cents / 100).toFixed(2).replace('.', ','));

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

