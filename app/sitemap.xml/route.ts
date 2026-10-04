import { site } from '@/data/site';

/** sitemap.xml — pages indexables uniquement (panier, suivi et pages légales sont en noindex). */
export const dynamic = 'force-static';

const routes: { path: string; priority: number; freq: 'weekly' | 'monthly' }[] = [
  { path: '/', priority: 1, freq: 'weekly' },
  { path: '/commander', priority: 0.9, freq: 'weekly' },
  { path: '/commande-personnalisee', priority: 0.9, freq: 'monthly' },
  { path: '/creations', priority: 0.8, freq: 'monthly' },
  { path: '/contact', priority: 0.8, freq: 'monthly' },
];

export function GET() {
  const urls = routes
    .map((r) => `  <url>\n    <loc>${site.url}${r.path === '/' ? '' : r.path}</loc>\n    <changefreq>${r.freq}</changefreq>\n    <priority>${r.priority.toFixed(1)}</priority>\n  </url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
