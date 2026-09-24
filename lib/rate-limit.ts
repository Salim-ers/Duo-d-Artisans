import 'server-only';

/**
 * Limitation de débit en mémoire (fenêtre glissante, par IP).
 * Sur Vercel, chaque instance a sa propre mémoire : c'est un frein
 * « best effort » contre les rafales, complété par le honeypot et,
 * si le spam devient important, par Cloudflare Turnstile (voir lib/turnstile.ts).
 */
const WINDOW_MS = 10 * 60_000;
const MAX_HITS = 5;
const hits = new Map<string, number[]>();

export function rateLimit(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_HITS) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 5_000) {
    for (const [k, times] of hits) if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return true;
}
