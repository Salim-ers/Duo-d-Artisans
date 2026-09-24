import { site } from '@/data/site';
import { Arrow } from '@/components/ui/Arrow';

const Star = ({ half = false }: { half?: boolean }) => (
  <svg viewBox="0 0 24 24" opacity={half ? 0.45 : 1} aria-hidden="true">
    <path d="M12 2l2.9 6.3 6.8.8-5 4.7 1.3 6.8L12 17.3 6 20.6l1.3-6.8-5-4.7 6.8-.8z" />
  </svg>
);

/**
 * Aucun témoignage inventé : uniquement la note publique et le nombre d'avis,
 * modifiables dans data/site.ts.
 */
export function GoogleRating() {
  const full = Math.floor(site.reviews.rating);
  return (
    <section className="section section--tight bg-paper">
      <div className="container rating">
        <div className="rating-score reveal">
          <b className="mono-num">{site.reviews.rating.toLocaleString('fr-FR')}</b>
          <div>
            <div className="stars">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} half={i >= full} />)}
            </div>
            <p className="rating-meta" style={{ marginTop: 8 }}>
              sur 5 — {site.reviews.count} avis {site.reviews.source}
            </p>
          </div>
        </div>
        <p className="lede reveal" data-delay=".08s" style={{ maxWidth: '36ch' }}>
          La note et le nombre d’avis proviennent de la fiche {site.reviews.source} de la boutique.
        </p>
        <p className="reveal" data-delay=".12s">
          <a className="btn btn--ghost" href={site.googleBusinessUrl ?? site.maps.search} target="_blank" rel="noopener">
            Voir les avis Google<Arrow />
          </a>
        </p>
      </div>
    </section>
  );
}
