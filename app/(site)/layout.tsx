import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBar } from '@/components/layout/MobileBar';
import { Motion } from '@/components/layout/Motion';
import { CartProvider } from '@/components/shop/CartProvider';
import { CartSheet } from '@/components/shop/CartSheet';
import { JsonLd } from '@/components/ui/JsonLd';
import { shopData } from '@/lib/site-data';
import { bakerySchema } from '@/lib/schema';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const shop = await shopData();
  return (
    <CartProvider>
      <JsonLd data={bakerySchema(shop.week)} />
      <a className="skip" href="#contenu">
        Aller au contenu
      </a>
      <Header />
      <main id="contenu" tabIndex={-1}>
        {children}
      </main>
      <Footer week={shop.week} />
      <MobileBar />
      <CartSheet />
      <Motion />
    </CartProvider>
  );
}
