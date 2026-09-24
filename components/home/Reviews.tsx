import { googleReviews } from '@/data/reviews';
import { reviewsUrl } from '@/data/site';
import { Arrow } from '@/components/ui/Arrow';

const fr = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
const frDate = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }).format(new Date(iso));

/**
 * Avis : uniquement les chiffres administrés dans data/reviews.ts.
 * Aucun témoignage n'est reproduit : on renvoie vers la fiche Google.
 */
export function Reviews() {
  const { rating, count, checkedOn } = googleReviews;
  const hasFigures = rating !== null && count !== null;

  return (
    <section className="reviews" aria-labelledby="reviews-title">
      <div className="wrap reviews-row">
        <h2 id="reviews-title" className="reviews-h">Ce qu’en disent<br />les clients</h2>

        {hasFigures ? (
          <p className="reviews-score" data-reveal>
            <span className="reviews-value">{fr(rating)}</span>
            <span className="reviews-meta">
              <span>sur 5</span>
              <span>{count} avis Google</span>
              {checkedOn && <span className="reviews-date">relevé en {frDate(checkedOn)}</span>}
            </span>
          </p>
        ) : (
          <p className="reviews-score reviews-score--text">Les avis sont publiés sur la fiche Google de la boutique.</p>
        )}

        <a className="lnk" href={reviewsUrl} target="_blank" rel="noopener noreferrer">
          Lire les avis sur Google <Arrow direction="up-right" />
        </a>
      </div>
    </section>
  );
}
