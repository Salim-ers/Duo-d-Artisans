import type { Metadata } from 'next';
import '../shop-pages.css';
import { Checkout } from '@/components/shop/Checkout';
import { shopData } from '@/lib/site-data';

export const metadata: Metadata = { title: 'Panier et retrait', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function PanierPage({ searchParams }: { searchParams: Promise<{ annule?: string }> }) {
  const [shop, sp] = await Promise.all([shopData(), searchParams]);
  return (
    <section className="co-page" aria-labelledby="co-title">
      <div className="wrap">
        <header className="co-intro">
          <span className="kicker">Retrait en boutique</span>
          <h1 id="co-title" className="t-xl">
            Votre <em>commande</em>
          </h1>
        </header>
        <Checkout onlinePayment={shop.onlinePayment} onSitePayment={shop.onSitePayment} orderingOpen={shop.orderingOpen} cancelled={sp.annule === '1'} />
      </div>
    </section>
  );
}
