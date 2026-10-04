'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BagIcon, HomeIcon, PinIcon, ShopIcon } from '@/components/ui/Icons';
import { useCart } from '@/components/shop/CartProvider';
import { CartCount } from './Header';

/** Barre basse sur téléphone : les quatre gestes essentiels, toujours à portée de pouce. */
export function MobileBar() {
  const pathname = usePathname();
  const { count, bump, setOpen, ready } = useCart();
  const current = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href)) || undefined;
  return (
    <nav className="mobile-bar" aria-label="Raccourcis">
      <Link href="/" aria-current={current('/') && 'page'}>
        <HomeIcon />
        Accueil
      </Link>
      <Link href="/commander" aria-current={current('/commander') && 'page'}>
        <ShopIcon />
        Commander
      </Link>
      <button type="button" onClick={() => setOpen(true)} data-cart-target aria-label={`Panier, ${count} article${count > 1 ? 's' : ''}`}>
        <BagIcon />
        Panier
        {ready && <CartCount count={count} bump={bump} />}
      </button>
      <Link href="/contact" aria-current={current('/contact') && 'page'}>
        <PinIcon />
        Infos
      </Link>
    </nav>
  );
}
