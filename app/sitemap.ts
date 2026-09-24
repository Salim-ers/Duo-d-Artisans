import type { MetadataRoute } from 'next';
import { site } from '@/data/site';

const routes = [
  { path: '/', priority: 1 },
  { path: '/la-maison', priority: 0.8 },
  { path: '/nos-creations', priority: 0.9 },
  { path: '/savoir-faire', priority: 0.8 },
  { path: '/commandes', priority: 0.8 },
  { path: '/actualites', priority: 0.6 },
  { path: '/contact', priority: 0.9 },
  { path: '/mentions-legales', priority: 0.2 },
  { path: '/politique-confidentialite', priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map((route) => ({
    url: `${site.url}${route.path}`,
    lastModified,
    changeFrequency: route.priority > 0.5 ? 'monthly' : 'yearly',
    priority: route.priority,
  }));
}
