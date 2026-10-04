import 'server-only';
import Stripe from 'stripe';
import { env } from '@/lib/env';
import { site } from '@/data/site';

let client: Stripe | null = null;

/** null si Stripe n'est pas configuré : le paiement en ligne est alors masqué. */
export function stripe(): Stripe | null {
  if (!env.stripeSecret) return null;
  client ??= new Stripe(env.stripeSecret, { appInfo: { name: site.name } });
  return client;
}

/**
 * Session Stripe Checkout (page de paiement hébergée par Stripe) : aucune donnée bancaire
 * ne transite ni n'est stockée ici. CB, Apple Pay et Google Pay selon le tableau de bord Stripe.
 */
export async function createCheckout(opts: {
  label: string;
  description?: string;
  amountCents: number;
  email: string;
  orderId: string;
  successPath: string;
  cancelPath: string;
}) {
  const st = stripe();
  if (!st) throw new Error('Paiement en ligne indisponible.');
  return st.checkout.sessions.create({
    mode: 'payment',
    locale: 'fr',
    customer_email: opts.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: opts.amountCents,
          product_data: { name: opts.label, ...(opts.description ? { description: opts.description.slice(0, 500) } : {}) },
        },
      },
    ],
    metadata: { orderId: opts.orderId },
    payment_intent_data: { metadata: { orderId: opts.orderId } },
    // Le créneau et le stock restent réservés 30 minutes.
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    success_url: env.siteUrl + opts.successPath,
    cancel_url: env.siteUrl + opts.cancelPath,
  });
}
