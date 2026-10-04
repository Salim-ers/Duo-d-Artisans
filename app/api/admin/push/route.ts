import { z } from 'zod';
import { requireAction } from '@/lib/auth/session';
import { removeSubscription, saveSubscription } from '@/lib/push';

const sub = z.object({ endpoint: z.string().url().max(1000), keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }) });

/** Abonnement (POST) / désabonnement (DELETE) d'un appareil de l'équipe aux notifications push. */
export async function POST(req: Request) {
  try {
    const u = await requireAction('STAFF');
    await saveSubscription(u.id, sub.parse(await req.json()));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAction('STAFF');
    const { endpoint } = z.object({ endpoint: z.string().url().max(1000) }).parse(await req.json());
    await removeSubscription(endpoint);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
}
