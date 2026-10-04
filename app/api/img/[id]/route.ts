import { readFile } from '@/lib/storage';

/** Images publiques envoyées depuis la gestion (produits, galerie, catégories, événements). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await readFile(id, true);
  if (!f) return new Response('Introuvable', { status: 404 });
  return new Response(new Uint8Array(f.body), {
    headers: {
      'Content-Type': f.mime,
      // Contenu immuable : une nouvelle image = un nouvel identifiant.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
}
