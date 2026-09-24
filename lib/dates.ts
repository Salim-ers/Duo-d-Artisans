/** Date du jour à Paris au format AAAA-MM-JJ (partagé client / serveur, sans dépendance). */
export const parisToday = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(now);
