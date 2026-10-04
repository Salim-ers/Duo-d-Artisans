/**
 * Variables d'environnement SERVEUR. Aucune n'est exposée au navigateur (pas de préfixe NEXT_PUBLIC_),
 * à l'exception de l'URL publique du site et des clés publiques par nature (Turnstile, VAPID public).
 */
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || null;
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

function siteUrl() {
  const raw = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  if (raw) return /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
  return vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000';
}

export const env = {
  isProd: process.env.NODE_ENV === 'production',
  databaseUrl,
  /** Connexion directe (hors pooler) pour les migrations — fournie par l'intégration Neon de Vercel. */
  databaseDirectUrl: process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || null,
  /** Sur Vercel sans base configurée : base temporaire, commande en ligne fermée. */
  ephemeralDb: !databaseUrl && !!process.env.VERCEL,
  dbPoolMax: Math.max(1, Number(process.env.DB_POOL_MAX) || 3),
  localDbDir: process.env.LOCAL_DB_DIR || '.data/pglite',
  siteUrl: siteUrl(),
  authSecret: process.env.AUTH_SECRET || null,
  adminEmail: process.env.ADMIN_EMAIL || null,
  adminPassword: process.env.ADMIN_PASSWORD || null,
  stripeSecret: process.env.STRIPE_SECRET_KEY || null,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null,
  resendKey: process.env.RESEND_API_KEY || null,
  emailFrom: process.env.EMAIL_FROM || process.env.CONTACT_FROM_EMAIL || 'Le Duo d’Artisans <onboarding@resend.dev>',
  staffEmail: process.env.STAFF_EMAIL || process.env.CONTACT_TO_EMAIL || null,
  vapidPublic: process.env.VAPID_PUBLIC_KEY || null,
  vapidPrivate: process.env.VAPID_PRIVATE_KEY || null,
  vapidSubject: process.env.VAPID_SUBJECT || 'mailto:contact@leduodartisans.fr',
};

/**
 * Clé de signature des sessions admin : AUTH_SECRET si fourni, sinon dérivée de l'URL de la base
 * (valeur secrète, déjà présente sur Vercel avec Neon) — aucune variable supplémentaire indispensable.
 */
export async function authSecret(): Promise<Uint8Array> {
  const s = env.authSecret;
  if (s && s.length >= 32) return new TextEncoder().encode(s);
  if (env.databaseUrl) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('duo-session-v1:' + env.databaseUrl));
    return new Uint8Array(digest);
  }
  if (env.isProd) throw new Error('Ni AUTH_SECRET ni base de données : connexion admin impossible.');
  return new TextEncoder().encode('dev-only-secret-never-used-in-production-0000');
}

/** La connexion admin est possible (clé de session disponible). */
export const canSignSessions = () => !env.isProd || !!env.databaseUrl || (!!env.authSecret && env.authSecret.length >= 32);

export const pushEnabled = () => !!env.vapidPublic && !!env.vapidPrivate;
export const stripeEnabled = () => !!env.stripeSecret;
