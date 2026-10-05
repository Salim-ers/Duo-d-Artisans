'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { nav, site, fullAddress } from '@/data/site';
import { Arrow } from '@/components/ui/Arrow';

export function Header() {
  const [open, setOpen] = useState(false);
  const [over, setOver] = useState(true);
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const home = pathname === '/';

  useEffect(() => setOpen(false), [pathname]);

  // Transparente et intégrée au hero de l'accueil ; voilée (flou + légère opacité) dès que l'on défile.
  useEffect(() => {
    if (!home) return;
    let frame = 0;
    // Transparente seulement tant qu'elle survole la photo du hero (élément marqué data-masthead-over).
    const measure = () => {
      frame = 0;
      const zone = document.querySelector('[data-masthead-over]');
      const mast = document.querySelector('.masthead')?.getBoundingClientRect().height ?? 76;
      setOver(zone ? zone.getBoundingClientRect().bottom > mast + 8 : window.scrollY < window.innerHeight * 0.85);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [home]);

  useEffect(() => {
    if (!open) return;
    document.documentElement.dataset.menu = 'open';
    panel.current?.querySelector<HTMLElement>('a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
      if (e.key === 'Tab' && panel.current) {
        const items = [toggle.current, ...panel.current.querySelectorAll<HTMLElement>('a')].filter(Boolean) as HTMLElement[];
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      delete document.documentElement.dataset.menu;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isCurrent = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <header className="masthead" data-open={open || undefined} data-over={(home && over && !open) || undefined}>
      <div className="masthead-row">
        <Link className="wordmark" href="/" aria-label={`${site.displayName} — accueil`}>
          <span>Le Duo</span> <em>d’Artisans</em>
        </Link>

        <nav className="primary-nav" aria-label="Navigation principale">
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={isCurrent(item.href) ? 'page' : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="masthead-actions">
          <a className="masthead-tel" href={site.phone.href}>
            {site.phone.display}
          </a>
          <Link className="masthead-cta" href="/commander">
            Commander
          </Link>
          <button
            ref={toggle}
            className="menu-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="menu"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <i aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="menu" id="menu" ref={panel} hidden={!open}>
        <nav aria-label="Navigation mobile">
          <ol>
            {nav.map((item, i) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={isCurrent(item.href) ? 'page' : undefined} style={{ ['--i' as string]: i }}>
                  {item.label}
                  <Arrow />
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        <div className="menu-foot">
          <p>{fullAddress}</p>
          <a className="btn btn--line-light" href={site.phone.href}>
            Appeler · {site.phone.display}
          </a>
        </div>
      </div>
    </header>
  );
}
