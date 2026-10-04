import type Stripe from 'stripe';
import { env } from '@/lib/env';
import { onCheckoutExpired, onOrderPaid } from '@/lib/orders';
import { logError } from '@/lib/security';
import { stripe } from '@/lib/stripe';

/**
 * Webhook Stripe — signature vérifiée, traitement idempotent.
 * Événements : checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.expired.
 */
export async function POST(req: Request) {
  const st = stripe();
  if (!st || !env.stripeWebhookSecret) return new Response('Stripe non configuré', { status: 503 });
  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('Signature manquante', { status: 400 });
  let event: Stripe.Event;
  try {
    event = st.webhooks.constructEvent(await req.text(), signature, env.stripeWebhookSecret);
  } catch {
    return new Response('Signature invalide', { status: 400 });
  }
  try {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      if ((event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') && session.payment_status === 'paid') {
        await onOrderPaid(orderId, session.id, typeof session.payment_intent === 'string' ? session.payment_intent : null, session.amount_total ?? 0);
      }
      if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') await onCheckoutExpired(orderId);
    }
  } catch (e) {
    logError('stripe.webhook', e);
    return new Response('Erreur', { status: 500 });
  }
  return Response.json({ received: true });
}
