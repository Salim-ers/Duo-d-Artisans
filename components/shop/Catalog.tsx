'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { ProductView } from '@/lib/catalog';
import { Arrow } from '@/components/ui/Arrow';
import { ProductCard } from './ProductCard';

type Cat = { id: string; slug: string; name: string; tagline: string | null };
type Collection = { slug: string; name: string; headline: string | null; text: string | null; productIds: string[] };

/**
 * Catalogue filtrable instantanément (aucun rechargement) ; l'adresse reste partageable (?categorie=… / ?collection=…).
 * Toutes les familles sont rendues côté serveur : la page reste statique et indexable.
 */
export function Catalog({ categories, products, collections, orderingOpen }: { categories: Cat[]; products: ProductView[]; collections: Collection[]; orderingOpen: boolean }) {
  const [active, setActive] = useState('tout');
  const bar = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const c = q.get('categorie');
    const col = q.get('collection');
    if (col && collections.some((x) => x.slug === col)) setActive('collection:' + col);
    else if (c && categories.some((x) => x.slug === c)) setActive(c);
  }, [categories, collections]);

  // La pastille active reste visible dans la barre défilante.
  useEffect(() => {
    bar.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);

  const choose = (value: string) => {
    setActive(value);
    const url = new URL(window.location.href);
    url.searchParams.delete('categorie');
    url.searchParams.delete('collection');
    if (value.startsWith('collection:')) url.searchParams.set('collection', value.slice(11));
    else if (value !== 'tout') url.searchParams.set('categorie', value);
    window.history.replaceState(null, '', url);
    const y = (top.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 140;
    if (window.scrollY > y) window.scrollTo({ top: y, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  const collection = active.startsWith('collection:') ? collections.find((c) => 'collection:' + c.slug === active) : null;
  const shown = active === 'tout' ? categories : categories.filter((c) => c.slug === active);
  const count = (id: string) => products.filter((p) => p.category?.id === id).length;

  return (
    <div className="catalog" ref={top}>
      <div className="cbar" ref={bar}>
        <div className="wrap cbar-row chips" role="group" aria-label="Familles de produits">
          <button type="button" className="chip" aria-pressed={active === 'tout'} onClick={() => choose('tout')}>
            Tout <small>{products.length}</small>
          </button>
          {collections.map((c) => (
            <button key={c.slug} type="button" className="chip chip--event" aria-pressed={active === 'collection:' + c.slug} onClick={() => choose('collection:' + c.slug)}>
              {c.name}
            </button>
          ))}
          {categories.map((c) => (
            <button key={c.id} type="button" className="chip" aria-pressed={active === c.slug} onClick={() => choose(c.slug)}>
              {c.name} <small>{count(c.id)}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="wrap catalog-body" key={active}>
        {collection ? (
          <section className="cfamily" aria-labelledby="col-title">
            <header className="cfamily-head">
              <h2 id="col-title" className="t-l">{collection.headline || collection.name}</h2>
              {collection.text && <p className="t-body">{collection.text}</p>}
            </header>
            <Grid items={products.filter((p) => collection.productIds.includes(p.id))} orderingOpen={orderingOpen} />
          </section>
        ) : (
          shown.map((c, n) => {
            const items = products.filter((p) => p.category?.id === c.id);
            return (
              <section key={c.id} className="cfamily" aria-labelledby={`fam-${c.slug}`}>
                <header className="cfamily-head">
                  <h2 id={`fam-${c.slug}`} className="t-l">
                    {c.name}
                  </h2>
                  {c.tagline && <p className="cfamily-line">{c.tagline}</p>}
                </header>
                {c.slug === 'gateaux' && (
                  <Link className="ccustom" href="/commande-personnalisee">
                    <span>
                      <b>Un gâteau sur mesure ?</b> Anniversaire, number cake, événement : décrivez votre envie, la boutique vous fait une proposition.
                    </span>
                    <span className="ccustom-cta">
                      Créer ma demande <Arrow />
                    </span>
                  </Link>
                )}
                {items.length ? (
                  <Grid items={items} orderingOpen={orderingOpen} priority={n === 0} />
                ) : (
                  <p className="cempty">Cette famille n’est pas encore proposée en ligne : elle vous attend en boutique.</p>
                )}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}

function Grid({ items, orderingOpen, priority }: { items: ProductView[]; orderingOpen: boolean; priority?: boolean }) {
  if (!items.length) return <p className="cempty">Aucun produit pour le moment.</p>;
  return (
    <div className="cgrid">
      {items.map((p, i) => (
        <ProductCard key={p.id} product={p} orderingOpen={orderingOpen} index={Math.min(i, 8)} priority={priority && i < 4} />
      ))}
    </div>
  );
}
