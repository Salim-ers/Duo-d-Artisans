import { openingHours, hoursByDay } from '@/data/opening-hours';

export type BusinessStatus = {
  status: 'open' | 'closed';
  label: string;
  /** Heure de fermeture si ouvert. */
  closesAt?: string;
  /** Heure de prochaine ouverture si fermé. */
  opensAt?: string;
  /** Jour courant à Paris (0 = dimanche). */
  day: number;
};

const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

/** Heure locale de la boutique, indépendante du fuseau du visiteur. */
export function parisTime(now: Date = new Date()): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  const map: Record<string, number> = { dim: 0, lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6 };
  const day = map[get('weekday').slice(0, 3).toLowerCase()] ?? 0;
  return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

export function getBusinessStatus(now: Date = new Date()): BusinessStatus {
  const { day, minutes } = parisTime(now);
  const today = hoursByDay(day);

  if (today) {
    for (const { open, close } of today.intervals) {
      if (minutes < toMinutes(open)) return { status: 'closed', label: `Ouvre à ${open}`, opensAt: open, day };
      if (minutes < toMinutes(close)) return { status: 'open', label: `Ouvert · ferme à ${close}`, closesAt: close, day };
    }
  }

  // Prochaine ouverture : on avance jour par jour, dimanche/lundi inclus.
  for (let i = 1; i <= 7; i++) {
    const next = openingHours.find((d) => d.day === (day + i) % 7);
    const first = next?.intervals[0];
    if (first) {
      const prefix = i === 1 ? 'Ouvre demain à' : `Ouvre ${next!.label.toLowerCase()} à`;
      return { status: 'closed', label: `${prefix} ${first.open}`, opensAt: first.open, day };
    }
  }
  return { status: 'closed', label: 'Fermé', day };
}
