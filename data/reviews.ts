/**
 * ------------------------------------------------------------------
 * AVIS GOOGLE — valeurs administrées à la main
 * ------------------------------------------------------------------
 * Aucune API n'est branchée : ces chiffres sont recopiés depuis la fiche
 * Google de la boutique. Ils ne sont écrits nulle part ailleurs dans le code.
 *
 * - Mettre à jour `rating`, `count` et `checkedOn` en même temps.
 * - Mettre `rating` ou `count` à null pour masquer les chiffres : la section
 *   n'affiche alors qu'un lien vers les avis, sans aucune valeur.
 * - Ces valeurs ne sont PAS injectées dans le JSON-LD (Google interdit
 *   les avis auto-déclarés sur la fiche d'un établissement).
 */
export const googleReviews = {
  rating: 4.5 as number | null,
  count: 287 as number | null,
  /** Date du relevé (AAAA-MM-JJ). null = date inconnue, non affichée. */
  checkedOn: null as string | null,
};
