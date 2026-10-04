import type { Metadata } from 'next';
import Link from 'next/link';
import '../shop-pages.css';
import { site } from '@/data/site';
import { media } from '@/data/media';
import { Catalog } from '@/components/shop/Catalog';
import { JsonLd } from '@/components/ui/JsonLd';
import { Split } from '@/components/ui/Split';
import { publicCatalog } from '@/lib/catalog';
import { activeEvents } from '@/lib/content';
import { productListSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';
import { shopData } from '@/lib/site-data';

export const metadata: Metadata = pageMetadata({
  title: 'Commander — retrait en boutique à Rantigny',
  description:
    'Commandez pains, viennoiseries, pâtisseries et gâteaux au Duo d’Artisans, boulangerie pâtisserie à Rantigny : choisissez votre créneau et récupérez en boutique.',
  path: '/commander',
  image: media.vitrineEclairs,
});

export const revalidate = 300;

export default async function CommanderPage() {
  const [shop, { categories, products }, events] = await Promise.all([shopData(), publicCatalog(), activeEvents()]);
  const real = products.filter((p) => !p.demo);
  const hasDemo = products.some((p) => p.demo);
  return (
    <>
      {real.length > 0 && <JsonLd data={productListSchema(real)} />}
      <section className="intro intro--shop" aria-labelledby="shop-title">
        <div className="wrap intro-grid">
          <div>
            <span className="kicker">Retrait en boutique · Rantigny</span>
            <Split as="h1" id="shop-title" lines={['Commander']} className="t-xxl" />
          </div>
          <div className="shop-steps" data-reveal>
            <ol>
              <li>
                <b>01</b> Choisissez
              </li>
              <li>
                <b>02</b> Réservez un créneau
              </li>
              <li>
                <b>03</b> Récupérez en boutique
              </li>
            </ol>
          </div>
        </div>
        <div className="wrap shop-notices">
          {hasDemo && (
            <p className="demo-notice">
              <b>Catalogue de démonstration.</b> Les produits marqués « Exemple » et leurs prix ne sont pas encore validés par la boutique.
            </p>
          )}
          {!shop.orderingOpen && (
            <p className="demo-notice">
              <b>La commande en ligne ouvre bientôt.</b> En attendant, appelez la boutique au{' '}
              <a className="lnk" href={site.phone.href}>
                {site.phone.display}
              </a>{' '}
              ou passez nous voir.
            </p>
          )}
        </div>
      </section>

      {products.length ? (
        <Catalog
          categories={categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name, tagline: c.tagline }))}
          products={products}
          collections={events.map((e) => ({ slug: e.slug, name: e.name, headline: e.headline, text: e.text, productIds: e.productIds }))}
          orderingOpen={shop.orderingOpen}
        />
      ) : (
        <section className="wrap catalog-empty">
          <p className="t-lead">Le catalogue en ligne arrive. En attendant, toute la vitrine vous attend en boutique.</p>
          <p>
            <Link className="btn btn--primary" href="/commande-personnalisee">
              Demander un gâteau sur mesure
            </Link>
          </p>
        </section>
      )}
    </>
  );
}
