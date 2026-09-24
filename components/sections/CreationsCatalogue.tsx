'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { categories, creations, type Category } from '@/data/products';
import { media } from '@/data/media';
import { Arrow } from '@/components/ui/Arrow';

/** Catalogue éditorial (pas un e-commerce) : filtres réellement fonctionnels, aucun prix. */
export function CreationsCatalogue() {
  const params = useSearchParams();
  const [active, setActive] = useState<Category | 'tout'>('tout');

  useEffect(() => {
    const c = params.get('c') as Category | null;
    if (c && categories.some((cat) => cat.id === c)) setActive(c);
  }, [params]);

  const items = creations.filter((c) => active === 'tout' || c.category === active);

  return (
    <>
      <div className="filters" role="group" aria-label="Filtrer les créations">
        {categories.map((cat) => (
          <button key={cat.id} aria-pressed={active === cat.id} onClick={() => setActive(cat.id)}>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="cr-grid">
        {items.map((creation, i) => {
          const img = media[creation.image];
          const wide = i % 5 === 0;
          return (
            <article
              key={creation.id}
              className={`card ${wide ? 'sp-8 ar-169' : 'sp-4 ar-45'} reveal${creation.category === 'patisserie' ? ' card--glaze' : ''}`}
            >
              <Image src={img.src} alt={img.alt} fill sizes="(max-width:820px) 100vw, 45vw" style={{ objectFit: 'cover' }} />
              <span className="rule" />
              <span className="cap">
                <span>
                  <span className="k">{categories.find((c) => c.id === creation.category)?.label}</span>
                  <span className="n">{creation.name}</span>
                  {creation.description && <span className="k" style={{ display: 'block', marginTop: 8, letterSpacing: 0, textTransform: 'none', fontSize: '.85rem' }}>{creation.description}</span>}
                </span>
                {creation.availability === 'commande' ? (
                  <Link href="/commandes" className="arw-c" aria-label={`Nous contacter à propos de : ${creation.name}`}><Arrow className="" /></Link>
                ) : (
                  <span className="k" style={{ whiteSpace: 'nowrap' }}>En boutique</span>
                )}
              </span>
            </article>
          );
        })}
      </div>
    </>
  );
}
