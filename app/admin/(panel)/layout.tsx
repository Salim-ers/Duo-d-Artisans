import Link from 'next/link';
import type { ReactNode } from 'react';
import { EnableNotifications, Flash, LivePulse, Sidebar, type NavItem } from '@/components/admin/ui';
import { hasRole, requirePage } from '@/lib/auth/session';
import { pulse } from '@/lib/admin';
import { env } from '@/lib/env';
import { roleLabel } from '@/lib/labels';
import { getSetting } from '@/lib/settings';
import { logout } from '../actions';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await requirePage('STAFF');
  const [p, catalog, notify] = await Promise.all([pulse(), getSetting('catalog'), getSetting('notify')]);
  const admin = hasRole(user, 'ADMIN');

  const items: NavItem[] = [
    { href: '/admin', label: 'Tableau de bord', icon: 'dashboard', badge: p.unread },
    { href: '/admin/commandes', label: 'Commandes', icon: 'orders' },
    { href: '/admin/production', label: 'Mode production', icon: 'production' },
    { href: '/admin/feuille', label: 'Feuille de production', icon: 'sheet' },
    { href: '/admin/planning', label: 'Planning', icon: 'planning' },
    { href: '/admin/personnalisees', label: 'Commandes personnalisées', icon: 'cake', badge: p.custom },
    { href: '/admin/clients', label: 'Clients', icon: 'clients' },
    { href: '/admin/messages', label: 'Messages', icon: 'messages', badge: p.messages },
    { sep: 'Catalogue' },
    ...(admin
      ? ([
          { href: '/admin/produits', label: 'Produits', icon: 'products' },
          { href: '/admin/categories', label: 'Catégories', icon: 'categories' },
        ] as NavItem[])
      : []),
    { href: '/admin/stock', label: 'Stock', icon: 'stock' },
    ...(admin
      ? ([
          { href: '/admin/evenements', label: 'Événements', icon: 'events' },
          { href: '/admin/promotions', label: 'Promotions', icon: 'promotions' },
          { href: '/admin/galerie', label: 'Galerie', icon: 'gallery' },
          { sep: 'Pilotage' },
          { href: '/admin/statistiques', label: 'Statistiques', icon: 'stats' },
        ] as NavItem[])
      : []),
    { href: '/admin/parametres', label: 'Paramètres', icon: 'settings' },
  ];

  return (
    <div className="adm">
      <Sidebar
        items={items}
        user={user.name}
        role={roleLabel[user.role]}
        footer={
          <>
            <Link href="/" target="_blank">
              Voir le site ↗
            </Link>
            <EnableNotifications vapidKey={env.vapidPublic} />
            <form action={logout}>
              <button type="submit">Déconnexion</button>
            </form>
          </>
        }
      />
      <div className="adm-main">
        {env.ephemeralDb && (
          <p className="abanner abanner--err">
            Mode temporaire : aucune base de données permanente n’est connectée. Rien de ce que vous modifiez ne sera conservé et la commande en ligne est fermée. Connectez Neon (Vercel → Storage), puis redéployez.
          </p>
        )}
        {catalog.demo && (
          <p className="abanner abanner--demo">
            <span>
              <b>Mode démonstration</b> : les produits et commandes d’exemple sont visibles. Désactiver avant la mise en production.
            </span>
            {admin && (
              <Link href="/admin/parametres#demo" className="alink">
                Paramètres →
              </Link>
            )}
          </p>
        )}
        <Flash />
        <LivePulse initial={p.last} sound={notify.sound} />
        {children}
      </div>
    </div>
  );
}
