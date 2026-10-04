'use server';

/**
 * Server Actions publiques (demande de gâteau, devis, contact). Chaque entrée est revalidée (Zod),
 * avec limitation de débit, pot de miel et Turnstile facultatif.
 * Messages d'erreur génériques côté visiteur, aucun détail technique.
 */
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { site } from '@/data/site';
import { acceptQuote, createCustomRequest, findCustomForCustomer, MAX_INSPIRATION_IMAGES, RequestError } from '@/lib/custom';
import { getDb, schema as s } from '@/lib/db';
import { env } from '@/lib/env';
import { notifyStaff } from '@/lib/notify';
import { clientIp, limitOrThrow, logError, RateLimitError } from '@/lib/security';
import { UploadError } from '@/lib/storage';
import { verifyTurnstile } from '@/lib/turnstile';
import { contactInput, fieldErrors, firstError } from '@/lib/validation';

const GENERIC = `Une erreur est survenue. Réessayez, ou appelez la boutique au ${site.phone.display}.`;

function known(e: unknown) {
  if (e instanceof RequestError || e instanceof RateLimitError || e instanceof UploadError) return e.message;
  if (e instanceof z.ZodError) return firstError(e);
  logError('site.action', e);
  return GENERIC;
}

/* ---------- Demande personnalisée ---------- */
export type FormState = { status: 'idle' | 'success' | 'error'; message: string; fields?: Record<string, string>; values?: Record<string, string>; ref?: string; link?: string };

const read = (fd: FormData, keys: string[]) => Object.fromEntries(keys.map((k) => [k, String(fd.get(k) ?? '').slice(0, 4000)]));

export async function submitCustomRequest(_prev: FormState, fd: FormData): Promise<FormState> {
  const keys = ['type', 'desiredDate', 'servings', 'flavors', 'theme', 'inscription', 'budget', 'comment', 'firstName', 'lastName', 'email', 'phone'];
  const values = read(fd, keys);
  if (fd.get('website')) return { status: 'success', message: 'Demande transmise.' };
  try {
    await limitOrThrow('custom', 5, 900);
    const token = fd.get('cf-turnstile-response');
    if (!(await verifyTurnstile(typeof token === 'string' ? token : null, await clientIp()))) throw new RequestError(GENERIC);
    const files = fd.getAll('images').filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > MAX_INSPIRATION_IMAGES) throw new UploadError(`${MAX_INSPIRATION_IMAGES} images maximum.`);
    const c = await createCustomRequest(values as never, files);
    revalidatePath('/admin', 'layout');
    return {
      status: 'success',
      message: 'Votre demande est bien transmise. Ce n’est pas encore une commande : la boutique l’étudie et revient vers vous avec une proposition.',
      ref: c.number,
      link: `/commander/suivi?n=${encodeURIComponent(c.number)}&t=${c.accessToken}`,
    };
  } catch (e) {
    if (e instanceof z.ZodError) return { status: 'error', message: 'Quelques informations sont à vérifier.', fields: fieldErrors(e), values };
    return { status: 'error', message: known(e), values };
  }
}

export async function acceptCustomQuote(fd: FormData) {
  const n = String(fd.get('n') ?? '');
  const t = String(fd.get('t') ?? '');
  try {
    await limitOrThrow('quote', 10, 600);
    const c = await findCustomForCustomer(n, t);
    if (c) await acceptQuote(c);
  } catch (e) {
    logError('quote.accept', e);
  }
  revalidatePath('/commander/suivi');
}

/* ---------- Contact ---------- */
export async function submitContact(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = read(fd, ['name', 'email', 'phone', 'message']);
  if (fd.get('website')) return { status: 'success', message: 'Message envoyé.' };
  try {
    if (env.ephemeralDb) throw new RequestError(`Le formulaire est momentanément indisponible : appelez la boutique au ${site.phone.display}.`);
    await limitOrThrow('contact', 5, 600);
    const token = fd.get('cf-turnstile-response');
    if (!(await verifyTurnstile(typeof token === 'string' ? token : null, await clientIp()))) throw new RequestError(GENERIC);
    const d = contactInput.parse(values);
    const db = await getDb();
    const [m] = await db.insert(s.messages).values({ name: d.name, email: d.email, phone: d.phone, body: d.message }).returning();
    await notifyStaff('message.new', `Nouveau message — ${d.name}`, d.message.slice(0, 180), '/admin/messages');
    revalidatePath('/admin', 'layout');
    return { status: 'success', message: 'Message envoyé. La boutique vous répondra dès que possible.', ref: m?.id };
  } catch (e) {
    if (e instanceof z.ZodError) return { status: 'error', message: 'Quelques informations sont à vérifier.', fields: fieldErrors(e), values };
    return { status: 'error', message: known(e), values };
  }
}
