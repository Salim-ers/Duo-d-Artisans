'use client';

import { useEffect, useState } from 'react';
import { getBusinessStatus, type BusinessStatus } from '@/lib/business-status';

/**
 * Easter egg 08 — statut d'ouverture en direct (Europe/Paris).
 * Les horaires complets restent affichés en HTML : aucune information
 * essentielle ne dépend de JavaScript.
 */
export function OpenStatus({ dark = false }: { dark?: boolean }) {
  const [status, setStatus] = useState<BusinessStatus | null>(null);

  useEffect(() => {
    const update = () => setStatus(getBusinessStatus());
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className={`status${dark ? ' status--dark' : ''}`} data-state={status?.status ?? 'closed'} suppressHydrationWarning>
      <i className="dot" aria-hidden="true" />
      <span className="status-label">{status ? status.label : 'Horaires du jour'}</span>
    </span>
  );
}
