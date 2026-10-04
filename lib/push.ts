import 'server-only';
/**
 * Notifications push (Web Push, VAPID) vers les tablettes et téléphones de l'équipe
 * qui ont installé la gestion et accepté les notifications.
 * Inactif tant que VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY ne sont pas définis.
 */
import { eq, inArray } from 'drizzle-orm';
import { getDb, schema as s } from '@/lib/db';
import { env, pushEnabled } from '@/lib/env';
import { logError } from '@/lib/security';

let configured = false;

async function client() {
  if (!pushEnabled()) return null;
  const webpush = (await import('web-push')).default;
  if (!configured) {
    webpush.setVapidDetails(env.vapidSubject, env.vapidPublic!, env.vapidPrivate!);
    configured = true;
  }
  return webpush;
}

export async function pushToStaff(payload: { title: string; body: string; url: string; tag?: string }) {
  const wp = await client();
  if (!wp) return;
  try {
    const db = await getDb();
    const subs = await db.select().from(s.pushSubscriptions);
    const dead: string[] = [];
    await Promise.all(
      subs.map(async (sub) => {
        try {
          await wp.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload), { TTL: 3600 });
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) dead.push(sub.id);
          else logError('push.send', e);
        }
      }),
    );
    if (dead.length) await db.delete(s.pushSubscriptions).where(inArray(s.pushSubscriptions.id, dead));
  } catch (e) {
    logError('push', e);
  }
}

export async function saveSubscription(userId: string, sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const db = await getDb();
  await db
    .insert(s.pushSubscriptions)
    .values({ userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth })
    .onConflictDoUpdate({ target: s.pushSubscriptions.endpoint, set: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth } });
}

export async function removeSubscription(endpoint: string) {
  const db = await getDb();
  await db.delete(s.pushSubscriptions).where(eq(s.pushSubscriptions.endpoint, endpoint));
}
