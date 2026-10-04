import { site } from '@/data/site';

/**
 * robots.txt — route classique plutôt que app/robots.ts : le chargeur de métadonnées de Next
 * échoue quand le chemin du projet contient une apostrophe (« Duo d'artisans »).
 */
export const dynamic = 'force-static';

export function GET() {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    'Disallow: /commander/suivi',
    '',
    `Host: ${site.url}`,
    `Sitemap: ${site.url}/sitemap.xml`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
