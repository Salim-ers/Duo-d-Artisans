import Link from 'next/link';
import Image from 'next/image';
import type { GalleryItem } from '@/lib/db/schema';
import type { Interval } from '@/data/opening-hours';
import type { DayException } from '@/lib/hours';
import type { ReviewsSettings } from '@/lib/settings-shared';
import { media } from '@/data/media';
import { families } from '@/data/families';
import { reviewsUrl, site, fullAddress } from '@/data/site';
import { galleryCategories } from '@/lib/labels';
import { Photo } from '@/components/ui/Photo';
import { Split } from '@/components/ui/Split';
import { Arrow } from '@/components/ui/Arrow';
import { StarIcon } from '@/components/ui/Icons';
import { OpenNowBig } from '@/components/ui/OpenNow';
import { HoursTable } from '@/components/ui/HoursTable';

/* ---------- 2. Les familles : six grandes images, un geste ---------- */
export function Categories() {
  return (
    <section className="cats" aria-labelledby="cats-title">
      <div className="wrap cats-head">
        <Split id="cats-title" lines={['La boutique,', { em: 'rayon par rayon.' }]} className="t-l" />
        <Link className="lnk" href="/creations">
          Toutes les créations <Arrow />
        </Link>
      </div>
      <ul className="cats-row" role="list">
        {families.map((f, i) => (
          <li key={f.name} className="cat" data-reveal style={{ ['--i' as string]: i }}>
            <Link href={f.href} className="cat-link">
              <span className="cat-media">
                <Image src={media[f.image].src} alt="" fill sizes="(max-width: 900px) 74vw, 34vw" quality={75} />
              </span>
              <span className="cat-text">
                <span className="cat-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="cat-name">{f.name}</span>
                <span className="cat-line">{f.tagline}</span>
                <span className="cat-cta">
                  {f.href === '/commander' ? 'Commander' : 'Découvrir'} <Arrow />
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

/* ---------- 4. Commander un gâteau sur mesure ---------- */
const occasions = [
  { label: 'Anniversaire', type: 'Anniversaire' },
  { label: 'Number cake', type: 'Number cake' },
  { label: 'Entremets', type: 'Entremets' },
  { label: 'Dessert à partager', type: 'Dessert à partager' },
  { label: 'Événement', type: 'Événement' },
  { label: 'Autre envie', type: 'Autre' },
];

export function CakeTeaser() {
  return (
    <section className="cake" aria-labelledby="cake-title">
      <div className="wrap cake-grid">
        <div className="cake-media">
          <Photo image={media.numberCake} sizes="(max-width: 900px) 92vw, 46vw" className="cake-photo" />
          <Photo image={media.gateauFruits} sizes="(max-width: 900px) 44vw, 18vw" className="cake-inset" index={2} />
        </div>
        <div className="cake-body">
          <span className="kicker">Sur mesure</span>
          <Split id="cake-title" lines={['Un gâteau', { em: 'pour une occasion ?' }]} className="t-l" />
          <p className="t-lead" data-reveal>
            Décrivez votre envie : la boutique étudie votre demande et revient vers vous avec une proposition.
          </p>
          <ul className="cake-occasions">
            {occasions.map((o, i) => (
              <li key={o.label} data-reveal style={{ ['--i' as string]: i }}>
                <Link href={`/commander?type=${encodeURIComponent(o.type)}`}>
                  {o.label} <Arrow />
                </Link>
              </li>
            ))}
          </ul>
          <Link className="btn btn--light" href="/commander">
            Commander un gâteau <Arrow />
          </Link>
        </div>
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
