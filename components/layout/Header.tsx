'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { nav, site, fullAddress } from '@/data/site';
import { OpenStatus } from '@/components/ui/OpenStatus';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) firstLink.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <header className={`header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="container">
          <Link className="brand" href="/" aria-label={`${site.name}, accueil`}>
            {/* Logo officiel à intégrer — composition typographique provisoire. */}
            <b>Le Duo d’Artisans</b>
            <span>Rantigny · Oise</span>
          </Link>

          <nav className="nav" aria-label="Navigation principale">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} aria-current={pathname === item.href ? 'page' : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="header-cta">
            <a className="tel" href={site.phone.href}>{site.phone.display}</a>
            <Link className="btn btn--nav" href="/contact">Nous trouver</Link>
            <button
              className="burger"
              aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={open}
              aria-controls="menu-mobile"
              onClick={() => setOpen((v) => !v)}
            >
              <i /><i />
            </button>
          </div>
        </div>
      </header>

      <div className={`drawer${open ? ' is-open' : ''}`} id="menu-mobile" aria-hidden={!open}>
        <button className="close" onClick={() => setOpen(false)}>Fermer</button>
        <nav aria-label="Navigation mobile">
          {nav.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              ref={i === 0 ? firstLink : undefined}
              style={{ ['--d' as string]: `${0.12 + i * 0.05}s` }}
              tabIndex={open ? 0 : -1}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="drawer-foot">
          <OpenStatus />
          <a href={site.phone.href}>{site.phone.display}</a>
          <span>{fullAddress}</span>
        </div>
      </div>
    </>
  );
}
