'use client';

import { useEffect } from 'react';

/**
 * Amélioration JS des filtres (qui fonctionnent déjà en CSS pur) :
 * lit ?filtre= à l'arrivée et garde l'URL à jour pour le partage.
 * Aucune dépendance à useSearchParams : la page reste entièrement statique.
 */
export function FilterSync({ name }: { name: string }) {
  useEffect(() => {
    const current = new URLSearchParams(window.location.search).get('filtre');
    if (current) {
      const input = document.querySelector<HTMLInputElement>(`input[name="${name}"][value="${CSS.escape(current)}"]`);
      if (input) input.checked = true;
    }
    const onChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.name !== name) return;
      const url = new URL(window.location.href);
      if (target.value === 'tout') url.searchParams.delete('filtre');
      else url.searchParams.set('filtre', target.value);
      window.history.replaceState(null, '', url);
    };
    document.addEventListener('change', onChange);
    return () => document.removeEventListener('change', onChange);
  }, [name]);

  return null;
}
