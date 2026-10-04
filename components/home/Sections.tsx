import Link from 'next/link';
import Image from 'next/image';
import type { Category, Event, GalleryItem } from '@/lib/db/schema';
import type { ProductView } from '@/lib/catalog';
import type { Interval } from '@/data/opening-hours';
import type { DayException } from '@/lib/hours';
import type { ReviewsSettings } from '@/lib/settings-shared';
import { media } from '@/data/media';
import { reviewsUrl, site, fullAddress } from '@/data/site';
import { galleryCategories } from '@/lib/labels';
import { Photo } from '@/components/ui/Photo';
import { Split } from '@/components/ui/Split';
import { Arrow } from '@/components/ui/Arrow';
import { StarIcon } from '@/components/ui/Icons';
import { OpenNowBig } from '@/components/ui/OpenNow';
import { HoursTable } from '@/components/ui/HoursTable';
import { ProductCard } from '@/components/shop/ProductCard';

/* ---------- 2. Catégories : six grandes images, un geste ---------- */
export function Categories({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;
  return (
    <section className="cats" aria-labelledby="cats-title">
      <div className="wrap cats-head">
        <Split id="cats-title" lines={['La boutique,', { em: 'rayon par rayon.' }]} className="t-l" />
        <Link className="lnk" href="/commander">
          Tout le catalogue <Arrow />
        </Link>
      </div>
      <ul className="cats-row" role="list">
        {categories.map((c, i) => (
          <li key={c.id} className="cat" data-reveal style={{ ['--i' as string]: i }}>
            <Link href={`/commander?categorie=${c.slug}`} className="cat-link">
              <span className="cat-media">
                {c.image && <Image src={c.image} alt="" fill sizes="(max-width: 900px) 74vw, 34vw" quality={75} />}
              </span>
              <span className="cat-text">
                <span className="cat-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="cat-name">{c.name}</span>
                {c.tagline && <span className="cat-line">{c.tagline}</span>}
                <span className="cat-cta">
                  Commander <Arrow />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- 3. Nos créations : mosaïque éditoriale ---------- */
export function CreationsMosaic({ items }: { items: GalleryItem[] }) {
  if (!items.length) return null;
  const label = (id: string) => galleryCategories.find((c) => c.id === id)?.label ?? '';
  return (
    <section className="mosaic-section" aria-labelledby="mosaic-title">
      <div className="wrap mosaic-head">
        <Split id="mosaic-title" lines={['Nos', { em: 'créations.' }]} className="t-xl" />
        <p className="t-body" data-reveal>
          Ce qui sort du fournil et ce qui passe en vitrine. La sélection change au fil des jours et des saisons.
        </p>
      </div>
      <div className="wrap">
        <ul className="mosaic" role="list">
          {items.slice(0, 8).map((g, i) => (
            <li key={g.id} className="mosaic-item">
              <Link href={`/creations?filtre=${g.category}`} className="mosaic-link">
                <Photo image={{ src: g.src, alt: g.alt }} sizes={i === 0 || i === 4 ? '(max-width: 820px) 92vw, 60vw' : '(max-width: 820px) 46vw, 30vw'} index={i % 3} className="mosaic-photo" />
                <span className="mosaic-cap">
                  <span>{g.title ?? label(g.category)}</span>
                  <small>{label(g.category)}</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mosaic-cta">
          <Link className="btn btn--line" href="/creations">
            Voir toutes les créations <Arrow />
          </Link>
        </p>
      </div>
    </section>
  );
}

/* ---------- 4. Commander ---------- */
const occasions = [
  { label: 'Anniversaire', type: 'Anniversaire' },
  { label: 'Number cake', type: 'Number cake' },
  { label: 'Dessert à partager', type: 'Dessert à partager' },
  { label: 'Événement', type: 'Événement' },
  { label: 'Demande personnalisée', type: 'Autre' },
];

export function OrderTeaser({ products, orderingOpen }: { products: ProductView[]; orderingOpen: boolean }) {
  return (
    <section className="order-teaser" aria-label="Commander">
      <div className="wrap ot-grid">
        <div className="ot-today">
          <div className="ot-head">
            <span className="kicker">Retrait en boutique</span>
            <Split lines={['Une envie', { em: 'pour aujourd’hui ?' }]} className="t-l" />
            <p className="t-lead" data-reveal>
              {orderingOpen
                ? 'Commandez en quelques gestes, choisissez votre créneau, récupérez en boutique.'
                : `La commande en ligne ouvre bientôt. En attendant : ${site.phone.display}.`}
            </p>
          </div>
          {products.length > 0 && (
            <div className="ot-products">
              {products.slice(0, 4).map((p, i) => (
                <ProductCard key={p.id} product={p} orderingOpen={orderingOpen} index={i} />
              ))}
            </div>
          )}
          <p>
            <Link className="btn btn--primary" href="/commander">
              Commander <Arrow />
            </Link>
          </p>
        </div>

        <div className="ot-cake">
          <Photo image={media.numberCake} sizes="(max-width: 900px) 100vw, 40vw" className="ot-cake-photo" reveal={false} />
          <div className="ot-cake-body">
            <span className="kicker">Sur mesure</span>
            <h2 className="t-l">
              Un gâteau
              <br />
              <em>pour une occasion&nbsp;?</em>
            </h2>
            <ul className="ot-occasions">
              {occasions.map((o) => (
                <li key={o.label}>
                  <Link href={`/commande-personnalisee?type=${encodeURIComponent(o.type)}`}>
                    {o.label} <Arrow />
                  </Link>
                </li>
              ))}
            </ul>
            <Link className="btn btn--light" href="/commande-personnalisee">
              Créer ma demande <Arrow />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Collection du moment (événement publié, dans sa période) ---------- */
export function EventBanner({ event }: { event: Event }) {
  return (
    <section className="event" aria-labelledby="event-title">
      {event.image && <Photo image={{ src: event.image, alt: '' }} sizes="100vw" className="event-photo" reveal={false} />}
      <div className="wrap event-body">
        <span className="kicker">En ce moment{event.isDemo ? ' · Exemple' : ''}</span>
        <h2 id="event-title" className="t-xl">
          {event.headline || event.name}
        </h2>
        {event.text && <p className="t-lead">{event.text}</p>}
        <Link className="btn btn--light" href={`/commander?collection=${event.slug}`}>
          {event.ctaLabel || 'Découvrir la collection'} <Arrow />
        </Link>
      </div>
    </section>
  );
}

/* ---------- 5. Le Duo : la maison et le savoir-faire, en dix secondes ---------- */
const values = [
  { word: 'Fabriqué ici', text: 'La fabrication se fait dans le laboratoire de la boutique, tôt le matin comme en cours de journée.' },
  { word: 'Le goût avant tout', text: 'Un pain que l’on reprend le lendemain, une pâtisserie que l’on finit sans commentaire.' },
  { word: 'Deux savoir-faire', text: 'La boulangerie d’un côté, la pâtisserie de l’autre, réunies sous une même enseigne.' },
];

export function Duo() {
  return (
    <section className="duo" id="le-duo" aria-labelledby="duo-title">
      <div className="wrap duo-grid">
        <div className="duo-media">
          <Photo image={media.baguettesFournil} sizes="(max-width: 900px) 92vw, 46vw" className="duo-main" position="50% 55%" />
          <Photo image={media.petrin} sizes="(max-width: 900px) 44vw, 18vw" className="duo-inset" index={2} />
        </div>
        <div className="duo-copy">
          <span className="kicker">Le Duo</span>
          <Split id="duo-title" lines={['Du pétrin', { em: 'à la vitrine.' }]} className="t-xl" />
          <p className="t-lead" data-reveal>
            Le Duo d’Artisans réunit deux métiers au 7 rue Anatole France, à Rantigny : le pain et la viennoiserie d’un côté,
            la pâtisserie et les gourmandises de l’autre.
          </p>
          <ol className="duo-values">
            {values.map((v, i) => (
              <li key={v.word} data-reveal style={{ ['--i' as string]: i }}>
                <span className="duo-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="duo-word">{v.word}</span>
                <p>{v.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ---------- 6. Avis : uniquement les chiffres relevés sur la fiche Google ---------- */
const fr = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
const frMonth = (iso: string) => new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z'));

export function Reviews({ reviews }: { reviews: ReviewsSettings }) {
  const { rating, count, checkedOn } = reviews;
  const url = reviews.url ?? reviewsUrl;
  return (
    <section className="reviews" aria-labelledby="reviews-title">
      <div className="wrap reviews-row">
        <h2 id="reviews-title" className="reviews-h">
          Ce qu’en disent
          <br />
          <em>les clients</em>
        </h2>
        {rating !== null && count !== null ? (
          <div className="reviews-score" data-reveal>
            <span className="reviews-value">{fr(rating)}</span>
            <span className="reviews-meta">
              <span className="reviews-stars" style={{ ['--r' as string]: rating / 5 }} role="img" aria-label={`${fr(rating)} sur 5`}>
                <span>{Array.from({ length: 5 }, (_, i) => <StarIcon key={i} />)}</span>
                <span aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <StarIcon key={i} />)}</span>
              </span>
              <span>{count.toLocaleString('fr-FR')} avis Google</span>
              {checkedOn && <span className="reviews-date">relevé en {frMonth(checkedOn)}</span>}
            </span>
          </div>
        ) : (
          <p className="reviews-text">Les avis sont publiés sur la fiche Google de la boutique.</p>
        )}
        <a className="btn btn--line" href={url} target="_blank" rel="noopener noreferrer">
          Voir les avis Google <Arrow direction="up-right" />
        </a>
      </div>
    </section>
  );
}

/* ---------- 7. Infos pratiques ---------- */
export function Practical({ week, exceptions, headingLevel = 2 }: { week: Interval[][]; exceptions: DayException[]; headingLevel?: 1 | 2 }) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const next = exceptions[0];
  return (
    <section className="practical" id="infos" aria-labelledby="practical-title">
      <div className="wrap practical-grid">
        <div className="practical-main">
          <span className="kicker">Infos pratiques</span>
          <Heading id="practical-title" className="t-l">
            On se retrouve
            <br />
            <em>à Rantigny.</em>
          </Heading>
          <OpenNowBig week={week} exceptions={exceptions} />
          <div className="practical-actions">
            <a className="btn btn--primary" href={site.maps.directions} target="_blank" rel="noopener noreferrer">
              Itinéraire <Arrow direction="up-right" />
            </a>
            <a className="btn btn--line" href={site.phone.href}>
              Appeler · {site.phone.display}
            </a>
          </div>
        </div>
        <div className="practical-details">
          <dl className="facts">
            <div>
              <dt>Adresse</dt>
              <dd>
                {site.address.street}
                <br />
                {site.address.postalCode} {site.address.city}
              </dd>
            </div>
            <div>
              <dt>Téléphone</dt>
              <dd>
                <a href={site.phone.href}>{site.phone.display}</a>
              </dd>
            </div>
          </dl>
          <HoursTable
            week={week}
            note={next ? `${next.closed ? 'Fermeture exceptionnelle' : 'Horaires exceptionnels'} le ${new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(next.date + 'T12:00:00Z'))}${next.note ? ' — ' + next.note : ''}` : null}
          />
          <p className="sr-only">{fullAddress}</p>
        </div>
      </div>
    </section>
  );
}
