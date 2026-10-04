import { today } from '@/lib/dates';
import { formatDate } from '@/lib/format';

/**
 * Modèles de collections saisonnières. Ils créent un BROUILLON non publié, sans dates ni produits :
 * aucune campagne n'est jamais activée automatiquement.
 */
export const eventTemplates = [
  { kind: 'epiphanie', label: 'Épiphanie', headline: 'Les galettes des rois sont là', cta: 'Voir les galettes' },
  { kind: 'saint-valentin', label: 'Saint-Valentin', headline: 'Pour la Saint-Valentin', cta: 'Voir la collection' },
  { kind: 'paques', label: 'Pâques', headline: 'La collection de Pâques', cta: 'Voir la collection' },
  { kind: 'fete-des-meres', label: 'Fête des mères', headline: 'Pour la fête des mères', cta: 'Voir la collection' },
  { kind: 'noel', label: 'Noël', headline: 'Les bûches de Noël arrivent', cta: 'Voir les bûches' },
] as const;

/** État d'affichage d'une collection sur l'accueil. */
export function eventState(e: { published: boolean; startsOn: string | null; endsOn: string | null }) {
  const d = today();
  if (!e.published) return { cls: 'off', label: 'Brouillon' };
  if (e.startsOn && e.startsOn > d) return { cls: 'soon', label: `Programmée — dès le ${formatDate(e.startsOn, 'short')}` };
  if (e.endsOn && e.endsOn < d) return { cls: 'off', label: 'Terminée' };
  return { cls: 'live', label: 'En ligne sur l’accueil' };
}

