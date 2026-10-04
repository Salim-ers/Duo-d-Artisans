import 'server-only';
/** Données publiques partagées par les pages du site (horaires, exceptions, avis, commande). */
import { cache } from 'react';
import { env, stripeEnabled } from '@/lib/env';
import { getSetting } from '@/lib/settings';
import { upcomingExceptions } from '@/lib/slots';

export const shopData = cache(async () => {
  const [hours, exceptions, reviews, ordering, payments, catalog] = await Promise.all([
    getSetting('hours'),
    upcomingExceptions(),
    getSetting('reviews'),
    getSetting('ordering'),
    getSetting('payments'),
    getSetting('catalog'),
  ]);
  const onlinePayment = payments.online && stripeEnabled();
  return {
    week: hours.week,
    exceptions,
    reviews,
    /** Commande en ligne réellement possible (base permanente + réglage + au moins un moyen de paiement). */
    orderingOpen: ordering.enabled && !env.ephemeralDb && (onlinePayment || payments.onSite),
    onlinePayment,
    onSitePayment: payments.onSite,
    demo: catalog.demo,
  };
});
