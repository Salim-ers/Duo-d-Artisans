'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { nav, site, fullAddress } from '@/data/site';
import { BagIcon } from '@/components/ui/Icons';
import { Arrow } from '@/components/ui/Arrow';
import { useCart } from '@/components/shop/CartProvider';

export function CartCount({ count, bump }: { count: number; bump: number }) {
  return (
    <span className="cart-count" data-zero={count === 0 || undefined} key={bump} data-bump={bump ? '' : undefined}>
      {count}
    </span>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [over, setOver] = useState(true);
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const { count, bump, setOpen: openCart, ready } = useCart();
  const home = pathname === '/';

  useEffect(() => setOpen(false), [pathname]);

  // Transparent tant que l'on est sur la photo du hero de l'accueil.
  useEffect(() => {
    if (!home) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      setOver(window.scrollY < window.innerHeight * 0.72);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
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
          <button type="button" className="cart-btn" onClick={() => openCart(true)} data-cart-target aria-label={`Panier, ${count} article${count > 1 ? 's' : ''}`}>
            <BagIcon />
            <span className="cart-btn-label">Panier</span>
            {ready && <CartCount count={count} bump={bump} />}
          </button>
          <Link className="btn btn--primary btn--sm masthead-cta" href="/commander">
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
            <li>
              <Link href="/commande-personnalisee" aria-current={isCurrent('/commande-personnalisee') ? 'page' : undefined} style={{ ['--i' as string]: nav.length }}>
                <em>Gâteau sur mesure</em>
                <Arrow />
              </Link>
            </li>
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
