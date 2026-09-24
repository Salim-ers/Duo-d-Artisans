import { site } from '@/data/site';

/** Barre d'actions mobile : visible en permanence sous 820 px, sans JavaScript. */
export function MobileBar() {
  return (
    <div className="mobile-bar">
      <a href={site.phone.href}>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6.2 2.5 8.4 6 6.9 7.6a10.6 10.6 0 0 0 5.5 5.5l1.6-1.5 3.5 2.2-.8 3.1c-.2.6-.8 1-1.4.9C8.6 17.3 2.7 11.4 2.2 4.7c0-.6.3-1.2.9-1.4z" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
        Appeler
      </a>
      <a href={site.maps.directions} target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 18s6-5.4 6-10a6 6 0 1 0-12 0c0 4.6 6 10 6 10Z" fill="none" stroke="currentColor" strokeWidth="1.2" /><circle cx="10" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
        Itinéraire
      </a>
    </div>
  );
}
