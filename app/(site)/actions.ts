'use server';

/**
 * Server Actions publiques. Rien de ce qui vient du navigateur n'est pris pour acquis :
 * prix, stock, créneaux et promotions sont recalculés ; chaque entrée est revalidée (Zod).
 * Messages d'erreur génériques côté visiteur, aucun détail technique.
 */
import { z } from 'zod';
import { site } from '@/data/site';
import { acceptQuote, createCustomRequest, findCustomForCustomer, MAX_INSPIRATION_IMAGES } from '@/lib/custom';
import { getDb, schema as s } from '@/lib/db';
import { env } from '@/lib/env';
import { notifyStaff } from '@/lib/notify';
import { placeOrder, ORDERING_CLOSED } from '@/lib/orders';
import { bestPromotion, OrderError, priceCart } from '@/lib/pricing';
import { limitOrThrow, logError, RateLimitError } from '@/lib/security';
import { availableDays, SlotError, type PickupDay } from '@/lib/slots';
import { UploadError } from '@/lib/storage';
import { verifyTurnstile } from '@/lib/turnstile';
import { cartLine, contactInput, fieldErrors, firstError, type CartLineInput } from '@/lib/validation';
import { clientIp } from '@/lib/security';
import { shopData } from '@/lib/site-data';
import { revalidatePath } from 'next/cache';

const GENERIC = `Une erreur est survenue. Réessayez, ou appelez la boutique au ${site.phone.display}.`;
const lines = z.array(cartLine).min(1).max(40);

function known(e: unknown) {
  if (e instanceof OrderError || e instanceof SlotError || e instanceof RateLimitError || e instanceof UploadError) return e.message;
  if (e instanceof z.ZodError) return firstError(e);
  logError('site.action', e);
  return GENERIC;
}

/* ---------- Panier ---------- */
export type QuotedLine = { key: string; name: string; detail: string | null; unit: number; quantity: number };
export type Quote =
  | {
      ok: true;
      lines: QuotedLine[];
      subtotal: number;
      discount: number;
      promoLabel: string | null;
      codeError: string | null;
      total: number;
      demo: boolean;
    }
  | { ok: false; error: string };

/** Prix réels du panier (et promotion applicable), tels que la boutique les facturera. */
export async function quoteCart(items: CartLineInput[], code: string | null): Promise<Quote> {
  try {
    const input = lines.parse(items);
    const cart = await priceCart(input);
    const { promo, codeError } = await bestPromotion(cart, code?.trim().slice(0, 40) || null, false);
    const discount = promo?.discount ?? 0;
    return {
      ok: true,
      lines: cart.lines.map((l, i) => ({
        key: [input[i]!.productId, input[i]!.variantId ?? '', input[i]!.flavorId ?? '', [...input[i]!.extraIds].sort().join('+')].join('|'),
        name: l.product.name,
        detail: [l.variantLabel, l.options].filter(Boolean).join(' · ') || null,
        unit: l.unit,
        quantity: l.quantity,
      })),
      subtotal: cart.subtotal,
      discount,
      promoLabel: promo?.label ?? null,
      codeError,
      total: cart.subtotal - discount,
      demo: cart.demo,
    };
  } catch (e) {
    return { ok: false, error: known(e) };
  }
}

/** Jours et créneaux réellement possibles pour CE panier (délais et jours propres aux produits). */
export async function pickupDays(items: CartLineInput[]): Promise<{ ok: true; days: PickupDay[] } | { ok: false; error: string }> {
  try {
    const cart = await priceCart(lines.parse(items));
    return { ok: true, days: await availableDays({ leadHours: cart.leadHours, weekdays: cart.weekdays }) };
  } catch (e) {
    return { ok: false, error: known(e) };
  }
}

/** Validation de la commande : renvoie l'adresse de confirmation ou de paiement Stripe. */
export async function submitOrder(raw: unknown): Promise<{ ok: true; redirect: string } | { ok: false; error: string; fields?: Record<string, string> }> {
  try {
    await limitOrThrow('order', 8, 600);
    const shop = await shopData();
    if (!shop.orderingOpen) throw new OrderError(ORDERING_CLOSED);
    const { redirect } = await placeOrder(raw as never);
    return { ok: true, redirect };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: 'Quelques informations sont à vérifier.', fields: fieldErrors(e) };
    return { ok: false, error: known(e) };
  }
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
    if (!(await verifyTurnstile(typeof token === 'string' ? token : null, await clientIp()))) throw new OrderError(GENERIC);
    const files = fd.getAll('images').filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > MAX_INSPIRATION_IMAGES) throw new UploadError(`${MAX_INSPIRATION_IMAGES} images maximum.`);
    const c = await createCustomRequest(values as never, files);
    revalidatePath('/admin', 'layout');
    return {
      status: 'success',
      message: 'Votre demande est bien transmise. Ce n’est pas encore une commande : la boutique l’étudie et revient vers vous avec une proposition.',
      ref: c.number,
      link: `/commande-personnalisee/suivi?n=${encodeURIComponent(c.number)}&t=${c.accessToken}`,
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
  revalidatePath('/commande-personnalisee/suivi');
}

/* ---------- Contact ---------- */
export async function submitContact(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = read(fd, ['name', 'email', 'phone', 'message']);
  if (fd.get('website')) return { status: 'success', message: 'Message envoyé.' };
  try {
    if (env.ephemeralDb) throw new OrderError(`Le formulaire est momentanément indisponible : appelez la boutique au ${site.phone.display}.`);
    await limitOrThrow('contact', 5, 600);
    const token = fd.get('cf-turnstile-response');
    if (!(await verifyTurnstile(typeof token === 'string' ? token : null, await clientIp()))) throw new OrderError(GENERIC);
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
