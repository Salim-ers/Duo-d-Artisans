'use client';

import { useState } from 'react';
import { site, fullAddress } from '@/data/site';
import { Arrow } from '@/components/ui/Arrow';

/**
 * Carte Google chargée seulement à la demande : aucun cookie tiers
 * tant que le visiteur n'a pas cliqué. Sans JavaScript, le lien reste utilisable.
 */
export function MapEmbed() {
  const [show, setShow] = useState(false);

  if (show) {
    return (
      <div className="map">
        <iframe
          src={site.maps.embed}
          title={`Plan d’accès — ${site.displayName}, ${fullAddress}`}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="map map--idle">
      <p className="map-address">{site.address.street}<br />{site.address.postalCode} {site.address.city}</p>
      <div className="map-actions">
        <button type="button" className="btn btn--line" onClick={() => setShow(true)}>Afficher le plan</button>
        <a className="lnk" href={site.maps.search} target="_blank" rel="noopener noreferrer">Ouvrir dans Google Maps <Arrow direction="up-right" /></a>
      </div>
      <p className="t-small">Le plan est fourni par Google Maps, qui peut déposer des cookies.</p>
    </div>
  );
}
