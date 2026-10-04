'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CakeIcon, HomeIcon, PinIcon, ShopIcon } from '@/components/ui/Icons';

/** Barre basse sur téléphone : les quatre gestes essentiels, toujours à portée de pouce. */
export function MobileBar() {
  const pathname = usePathname();
  const current = (href: string) => ((href === '/' ? pathname === '/' : pathname.startsWith(href)) ? 'page' : undefined);
  return (
    <nav className="mobile-bar" aria-label="Raccourcis">
      <Link href="/" aria-current={current('/')}>
        <HomeIcon />
        Accueil
      </Link>
      <Link href="/commander" aria-current={current('/commander')}>
        <CakeIcon />
        Commander
      </Link>
      <Link href="/creations" aria-current={current('/creations')}>
        <ShopIcon />
        Créations
      </Link>
      <Link href="/contact" aria-current={current('/contact')}>
        <PinIcon />
        Infos
      </Link>
    </nav>
  );
}
