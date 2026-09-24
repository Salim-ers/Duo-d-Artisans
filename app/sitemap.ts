import type { MetadataRoute } from 'next';
import { site } from '@/data/site';

/** Pages indexables uniquement (les pages légales sont en noindex). */
const routes: { path: string; priority: number }[] = [
  { path: '/', priority: 1 },
  { path: '/nos-creations', priority: 0.9 },
  { path: '/commandes', priority: 0.9 },
  { path: '/contact', priority: 0.9 },
  { path: '/la-maison', priority: 0.7 },
  { path: '/savoir-faire', priority: 0.7 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${site.url}${route.path === '/' ? '' : route.path}`,
    changeFrequency: 'monthly',
    priority: route.priority,
  }));
}
