import 'server-only';
/**
 * Stockage des images directement dans PostgreSQL (table `files`) : aucun service externe à configurer.
 * - Publiques (produits, galerie, catégories, événements) : /api/img/<id>, mises en cache longue durée.
 * - Privées (photos d'inspiration des clients) : /api/admin/files/<id>, réservées à l'équipe connectée.
 *
 * Le type réel est vérifié par signature binaire (jamais l'extension ni le type MIME annoncé).
 */
import { and, eq } from 'drizzle-orm';
import { getDb, schema as s } from '@/lib/db';

// Vercel limite le corps d'une requête à 4,5 Mo : les images sont compressées dans le navigateur avant l'envoi.
const MAX_BYTES = 4 * 1024 * 1024;

type Sniffed = { ext: 'jpg' | 'png' | 'webp'; mime: string };

function sniff(b: Uint8Array): Sniffed | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: 'png', mime: 'image/png' };
  const riff = String.fromCharCode(...b.slice(0, 4));
  const webp = String.fromCharCode(...b.slice(8, 12));
  if (riff === 'RIFF' && webp === 'WEBP') return { ext: 'webp', mime: 'image/webp' };
  return null;
}

/** Dimensions lues dans l'en-tête du fichier (même logique que scripts/check-images.mjs). */
function dimensions(b: Buffer, ext: Sniffed['ext']): { w: number; h: number } | null {
  try {
    if (ext === 'webp') {
      const chunk = b.toString('ascii', 12, 16);
      if (chunk === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
      if (chunk === 'VP8L') {
        const v = b.readUInt32LE(21);
        return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 };
      }
      return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    }
    if (ext === 'png') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    let i = 2;
    while (i < b.length) {
      const marker = b[i + 1]!;
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  } catch {
    /* en-tête illisible */
  }
  return null;
}

export class UploadError extends Error {}

export async function readImage(file: unknown, maxBytes = MAX_BYTES) {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > maxBytes) throw new UploadError(`Image trop lourde (${Math.round(maxBytes / 1024 / 1024)} Mo maximum).`);
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type) throw new UploadError('Format non accepté : JPG, PNG ou WEBP uniquement.');
  const dim = dimensions(buf, type.ext);
  if (!dim || dim.w < 1 || dim.h < 1 || dim.w > 12000 || dim.h > 12000) throw new UploadError('Image illisible ou dimensions invalides.');
  return { buf, ...type, width: dim.w, height: dim.h };
}

export type StoredImage = NonNullable<Awaited<ReturnType<typeof readImage>>>;

async function store(img: StoredImage, isPublic: boolean) {
  const db = await getDb();
  const [row] = await db
    .insert(s.files)
    .values({ mime: img.mime, size: img.buf.byteLength, width: img.width, height: img.height, isPublic, data: img.buf })
    .returning({ id: s.files.id });
  return row!.id;
}

/** Image publique → URL affichable. */
export async function savePublicImage(img: StoredImage) {
  return '/api/img/' + (await store(img, true));
}

/** Image privée (photo d'inspiration client) → référence interne, lisible uniquement depuis l'administration. */
export async function savePrivateImage(img: StoredImage) {
  return 'db:' + (await store(img, false));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function readFile(id: string, publicOnly: boolean) {
  if (!UUID.test(id)) return null;
  const db = await getDb();
  const [f] = await db
    .select()
    .from(s.files)
    .where(and(eq(s.files.id, id), publicOnly ? eq(s.files.isPublic, true) : undefined));
  return f ? { body: f.data, mime: f.mime } : null;
}

