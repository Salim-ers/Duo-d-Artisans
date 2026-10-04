const isDev = process.env.NODE_ENV !== 'production';

/**
 * CSP statique :
 * - 'unsafe-inline' pour les scripts est requis par l'hydratation Next sans nonce
 *   (un nonce imposerait un rendu dynamique de toutes les pages) ; aucune 'unsafe-eval' en production ;
 * - Stripe Checkout est une page hébergée par Stripe (redirection) : aucun script Stripe chargé ici ;
 * - Google Maps (iframe à la demande), Cloudflare Turnstile (facultatif), vercel.live (prévisualisations).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://challenges.cloudflare.com https://vercel.live`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://vercel.live https://vercel.com",
  "font-src 'self' data:",
  `connect-src 'self' https://vercel.live https://challenges.cloudflare.com${isDev ? ' ws:' : ''}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  'frame-src https://www.google.com https://maps.google.com https://challenges.cloudflare.com https://vercel.live',
  "frame-ancestors 'none'",
  "form-action 'self' https://checkout.stripe.com",
  "base-uri 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), usb=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // PGlite (base locale) et postgres-js restent des modules Node natifs.
  serverExternalPackages: ['@electric-sql/pglite', 'postgres', 'web-push'],
  // Les migrations SQL sont lues au démarrage : elles doivent être embarquées dans les fonctions Vercel.
  outputFileTracingIncludes: { '/**': ['./drizzle/**/*'] },
  experimental: {
    // Images compressées côté navigateur ; Vercel plafonne de toute façon une requête à 4,5 Mo.
    serverActions: { bodySizeLimit: '4.5mb' },
    // Pages de gestion déjà visitées affichées instantanément (toute action vide ce cache).
    staleTimes: { dynamic: 30, static: 180 },
    // CSS (quelques dizaines de ko) intégré au HTML : aucune feuille bloquante avant le premier affichage.
    inlineCss: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1440, 1672, 1920, 2560, 3344],
    imageSizes: [96, 160, 256, 384],
    qualities: [70, 75, 82, 90],
    minimumCacheTTL: 2678400,
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/admin-sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }, { key: 'Service-Worker-Allowed', value: '/admin/' }] },
    ];
  },
  async redirects() {
    // Le site va à l'essentiel : quatre pages. Les anciennes adresses restent valables.
    return [
      { source: '/actualites', destination: '/', permanent: true },
      { source: '/la-maison', destination: '/#le-duo', permanent: true },
      { source: '/savoir-faire', destination: '/#le-duo', permanent: true },
      { source: '/nos-creations', destination: '/creations', permanent: true },
      { source: '/commandes', destination: '/commande-personnalisee', permanent: true },
    ];
  },
};

export default nextConfig;
