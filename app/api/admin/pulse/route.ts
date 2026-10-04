import { requireAction } from '@/lib/auth/session';
import { pulse } from '@/lib/admin';

/** Sondé toutes les 20 s par la gestion : compteurs et dernière notification (nouvelle commande, demande, message). */
export async function GET() {
  try {
    await requireAction('STAFF');
  } catch {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  return Response.json(await pulse(), { headers: { 'Cache-Control': 'no-store' } });
}
