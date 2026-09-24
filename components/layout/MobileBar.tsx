'use client';

import { useEffect, useState } from 'react';
import { Phone, MapPin } from 'lucide-react';
import { site } from '@/data/site';

/** Barre d'action mobile : apparaît après un peu de scroll, disparaît près du footer. */
export function MobileBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const footer = document.querySelector('footer.footer');
      const nearFooter = footer ? footer.getBoundingClientRect().top < window.innerHeight - 40 : false;
      setVisible(window.scrollY > 520 && !nearFooter);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={`mbar${visible ? ' is-on' : ''}`} aria-label="Actions rapides">
      <a className="p" href={site.phone.href}><Phone size={16} strokeWidth={1.8} aria-hidden="true" />Appeler</a>
      <a className="s" href={site.maps.directions} target="_blank" rel="noopener">
        <MapPin size={16} strokeWidth={1.8} aria-hidden="true" />Itinéraire
      </a>
    </div>
  );
}
