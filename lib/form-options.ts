/** Choix proposés dans les formulaires (partagés client / serveur, sans dépendance). */
export const occasions = ['Anniversaire', 'Fête de famille', 'Événement professionnel', 'Autre occasion'] as const;

export const creationTypes = [
  'Gâteau d’anniversaire',
  'Number cake',
  'Entremets ou pâtisseries',
  'Viennoiseries',
  'Pains',
  'Salé / traiteur',
  'Autre',
] as const;

export const subjects = ['Une question', 'Une commande', 'Autre chose'] as const;

export const LIMITS = { name: 60, message: 1500, contactMessage: 2000, people: 300 } as const;
