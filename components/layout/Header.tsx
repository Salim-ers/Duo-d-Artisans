'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { nav, site, fullAddress } from '@/data/site';

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    document.documentElement.dataset.menu = 'open';
    panel.current?.querySelector<HTMLElement>('a')?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
      // Piège de focus minimal dans le menu ouvert.
      if (e.key === 'Tab' && panel.current) {
        const items = [toggle.current, ...panel.current.querySelectorAll<HTMLElement>('a')].filter(Boolean) as HTMLElement[];
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      delete document.documentElement.dataset.menu;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="masthead" data-open={open || undefined}>
      <div className="masthead-row">
        <Link className="wordmark" href="/" aria-label={`${site.displayName} — accueil`}>
          <span>Le Duo</span> <em>d’Artisans</em>
        </Link>

        <nav className="primary-nav" aria-label="Navigation principale">
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={isCurrent(item.href) ? 'page' : undefined}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <a className="masthead-tel" href={site.phone.href}>{site.phone.display}</a>

        <button
          ref={toggle}
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span>{open ? 'Fermer' : 'Menu'}</span>
          <i aria-hidden="true" />
        </button>
      </div>

      <div className="menu" id="menu" ref={panel} hidden={!open}>
        <nav aria-label="Navigation mobile">
          <ol>
            <li><Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>Accueil</Link></li>
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={isCurrent(item.href) ? 'page' : undefined}>{item.label}</Link>
              </li>
            ))}
          </ol>
        </nav>
        <div className="menu-foot">
          <a href={site.phone.href}>{site.phone.display}</a>
          <a href={site.maps.directions} target="_blank" rel="noopener noreferrer">{fullAddress}</a>
        </div>
      </div>
    </header>
  );
}
