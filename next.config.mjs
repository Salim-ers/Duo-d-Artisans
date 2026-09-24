const isDev = process.env.NODE_ENV !== 'production';

/**
 * CSP statique compatible avec le rendu statique de Next.js :
 * - 'unsafe-inline' pour les scripts est requis par l'hydratation Next sans nonce
 *   (un nonce imposerait un rendu dynamique de toutes les pages) ;
 * - aucune 'unsafe-eval' en production ;
 * - Google Maps (iframe à la demande), Cloudflare Turnstile (facultatif),
 *   vercel.live (barre d'outils des déploiements de prévisualisation).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://challenges.cloudflare.com https://vercel.live`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://vercel.live https://vercel.com",
  "font-src 'self' data:",
  `connect-src 'self' https://vercel.live https://challenges.cloudflare.com${isDev ? ' ws:' : ''}`,
  'frame-src https://www.google.com https://maps.google.com https://challenges.cloudflare.com https://vercel.live',
  "frame-ancestors 'none'",
  "form-action 'self'",
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
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1440, 1672],
    imageSizes: [160, 256, 384],
    qualities: [75, 82],
    minimumCacheTTL: 2678400,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    // L'ancienne rubrique Actualités ne contenait aucun article réel.
    return [{ source: '/actualites', destination: '/', permanent: true }];
  },
};

export default nextConfig;
