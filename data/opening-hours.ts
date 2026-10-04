/**
 * Horaires habituels relevés sur la fiche Google et l'affichage en vitrine.
 * Ce sont les valeurs INITIALES : la boutique les modifie ensuite dans Gestion → Paramètres,
 * et ce sont alors les horaires enregistrés qui alimentent tout le site (statut, JSON-LD, créneaux).
 *
 * Index : 0 = dimanche … 6 = samedi. Tableau vide = fermé.
 */
export type Interval = { open: string; close: string };

export const defaultWeek: Interval[][] = [
  [{ open: '07:00', close: '13:30' }], // dimanche
  [], // lundi
  [{ open: '06:30', close: '19:30' }], // mardi
  [{ open: '06:30', close: '19:30' }], // mercredi
  [{ open: '06:30', close: '19:30' }], // jeudi
  [{ open: '06:30', close: '19:30' }], // vendredi
  [{ open: '06:30', close: '19:00' }], // samedi
];

export const dayLabels = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

/** Ordre d'affichage : du lundi au dimanche. */
export const weekOrder = [1, 2, 3, 4, 5, 6, 0];

const h = (t: string) => t.replace(':', 'h');

export const formatIntervals = (intervals: Interval[]) =>
  intervals.length === 0 ? 'Fermé' : intervals.map((i) => `${h(i.open)} – ${h(i.close)}`).join(' · ');
