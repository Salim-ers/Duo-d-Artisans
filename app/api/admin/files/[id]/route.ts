import { requireAction } from '@/lib/auth/session';
import { readFile } from '@/lib/storage';

/** Photos d'inspiration envoyées par les clients : réservées à l'équipe connectée. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAction('STAFF');
  } catch {
    return new Response('Non autorisé', { status: 401 });
  }
  const { id } = await params;
  const f = await readFile(id, false);
  if (!f) return new Response('Introuvable', { status: 404 });
  return new Response(new Uint8Array(f.body), {
    headers: { 'Content-Type': f.mime, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'" },
  });
}
