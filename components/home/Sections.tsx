import Link from 'next/link';
import Image from 'next/image';
import type { GalleryItem } from '@/lib/db/schema';
import type { Interval } from '@/data/opening-hours';
import type { DayException } from '@/lib/hours';
import type { ReviewsSettings } from '@/lib/settings-shared';
import { media, type Media } from '@/data/media';
import { reviewQuotes } from '@/data/reviews';
import { reviewsUrl, site } from '@/data/site';
import { galleryCategories } from '@/lib/labels';
import { Photo } from '@/components/ui/Photo';
import { Split } from '@/components/ui/Split';
import { Arrow } from '@/components/ui/Arrow';
import { StarIcon } from '@/components/ui/Icons';
import { OpenNowLine } from '@/components/ui/OpenNow';
import { HoursTable } from '@/components/ui/HoursTable';
import { heroPhoto } from './Hero';
import { Drift, Pan, Settle } from './motion';

/* ------------------------------------------------------------------
   Photos fixes de l'accueil : chacune n'apparaît qu'une fois.
   La « vitrine » (galerie administrable) écarte automatiquement toutes celles-ci.
   ------------------------------------------------------------------ */
const duoPhotos = { pain: media.baguettesFournil, patisserie: media.entremets };

const pausePhoto = media.petrin;
const occasionPhoto = media.numberCake;
const maisonPhoto = media.facadeHd;

export const fixedHomePhotos = [heroPhoto, duoPhotos.pain, duoPhotos.patisserie, pausePhoto, occasionPhoto, maisonPhoto].map((p) => p.src);

/* ---------- 2. Deux savoir-faire, une seule maison ---------- */
function Universe({
  n,
  name,
  image,
  title,
  items,
  href,
  cta,
  sizes,
}: {
  n: string;
  name: string;
  image: Media;
  title: [string, string];
  items: string[];
  href: string;
  cta: string;
  sizes: string;
}) {
  return (
    <article className="uni">
      <p className="uni-label">
        <span>{n}</span>
        {name}
      </p>
      <Photo image={image} sizes={sizes} className="uni-photo" />
      <h3 className="uni-title">
        {title[0]}
        <br />
        <em>{title[1]}</em>
      </h3>
      <p className="uni-items">{items.join(' · ')}</p>
      <Link className="uni-link" href={href}>
        {cta} <Arrow />
      </Link>
    </article>
  );
}

export function Duo() {
  return (
    <section className="duo" aria-labelledby="duo-title">
      <div className="wrap">
        <Split id="duo-title" lines={['Deux savoir-faire.', { em: 'Une seule maison.' }]} className="d-2 duo-title" />
        <div className="duo-grid">
          <Drift className="duo-side duo-side--a" from={60} to={-90}>
            <Universe
              n="01"
              name="Boulangerie"
              image={duoPhotos.pain}
              title={['Le quotidien,', 'croustillant.']}
              items={['Pain', 'Viennoiseries', 'Fournées']}
              href="/creations?filtre=pain"
              cta="Découvrir la boulangerie"
              sizes="(max-width: 899px) 92vw, 40vw"
            />
          </Drift>
          <p className="duo-x" aria-hidden="true">
            ×
          </p>
          <Drift className="duo-side duo-side--b" from={-40} to={120}>
            <Universe
              n="02"
              name="Pâtisserie"
              image={duoPhotos.patisserie}
              title={['La gourmandise,', 'pièce par pièce.']}
              items={['Entremets', 'Macarons', 'Gâteaux', 'Créations']}
              href="/creations?filtre=patisserie"
              cta="Découvrir la pâtisserie"
              sizes="(max-width: 899px) 92vw, 38vw"
            />
          </Drift>
        </div>
      </div>
    </section>
  );
}

/* ---------- 3. La vitrine : une grille nette, trois par trois ---------- */
export function Vitrine({ items }: { items: GalleryItem[] }) {
  // Toujours des rangées complètes de trois (6 ou 3 photos) : rien ne dépasse, rien ne manque.
  const shown = items.slice(0, items.length >= 6 ? 6 : items.length >= 3 ? 3 : items.length);
  if (!shown.length) return null;
  const category = (g: GalleryItem) => galleryCategories.find((c) => c.id === g.category)?.label ?? '';
  // « Viennoiseries » / « Viennoiserie » : la catégorie n'est pas répétée sous un nom qui la dit déjà.
  const base = (t: string) => t.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '').replace(/s$/, '');
  const same = (title: string | null, cat: string) => !title || base(title) === base(cat);
  return (
    <section className="vt" id="vitrine" aria-labelledby="vt-title">
      <div className="wrap">
        <div className="vt-head">
          <Split id="vt-title" lines={['La', { em: 'vitrine.' }]} className="d-1" />
          <div className="vt-aside" data-reveal>
            <p>Ce qui sort du fournil et ce qui passe en vitrine change au fil des jours et des saisons.</p>
            <Link className="vt-all" href="/creations">
              Toute la galerie <Arrow />
            </Link>
          </div>
        </div>
        <ul className="vt-grid" role="list">
          {shown.map((g, i) => (
            <li key={g.id} className="vt-item" data-reveal style={{ ['--i' as string]: i % 3 }}>
              <Link href={`/creations?filtre=${g.category}`} className="vt-link">
                <Photo image={{ src: g.src, alt: g.alt }} sizes="(max-width: 599px) 92vw, (max-width: 999px) 46vw, 30vw" className="vt-photo" reveal={false} />
                <span className="vt-cap">
                  <span className="vt-name">{g.title ?? category(g)}</span>
                  {!same(g.title, category(g)) && <span className="vt-cat">{category(g)}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- 4. Respiration plein écran, puis les commandes qui glissent par-dessus ---------- */
export function Pause() {
  return (
    <section className="ps" aria-labelledby="ps-title">
      <Settle className="ps-media">
        <Image src={pausePhoto.src} alt={pausePhoto.alt} fill sizes="100vw" quality={82} />
      </Settle>
      <Split as="h2" id="ps-title" lines={['Fait ici,', { em: 'à Rantigny.' }]} className="d-1 ps-title" />
    </section>
  );
}

const occasions = [
  { label: 'Anniversaire.', type: 'Anniversaire' },
  { label: 'Événement.', type: 'Événement' },
  { label: 'Envie particulière.', type: 'Autre' },
];

export function Occasions() {
  return (
    <section className="oc" aria-labelledby="oc-title">
      <div className="wrap oc-grid">
        <Drift className="oc-media" from={70} to={-70}>
          <Photo image={occasionPhoto} sizes="(max-width: 899px) 92vw, 46vw" className="oc-photo" />
        </Drift>
        <div className="oc-body">
          <span className="hlabel hlabel--light">Gâteaux sur mesure</span>
          <Split id="oc-title" lines={['Les jours', { em: 'qui comptent.' }]} className="d-1" />
          <ul className="oc-list" role="list">
            {occasions.map((o, i) => (
              <li key={o.type} data-reveal style={{ ['--i' as string]: i }}>
                <Link href={`/commander?type=${encodeURIComponent(o.type)}`}>
                  {o.label} <Arrow />
                </Link>
              </li>
            ))}
          </ul>
          <p className="oc-note" data-reveal>
            Décrivez votre envie : la boutique vous répond avec une proposition.
          </p>
          <Link className="oc-cta" href="/commander">
            Imaginer votre gâteau <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- 5. Preuve sociale : la note, et trois voix ---------- */
const fr = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
const frMonth = (iso: string) => new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z'));
const featured = ['Amandine R.', 'Marie-Laure D.', 'Samantha D.'];

export function Proof({ reviews }: { reviews: ReviewsSettings }) {
  const { rating, count } = reviews;
  const url = reviews.url ?? reviewsUrl;
  const quotes = reviewQuotes.filter((q) => featured.includes(q.author));
  return (
    <section className="pf" aria-labelledby="pf-title">
      <div className="wrap pf-grid">
        <div className="pf-score">
          <h2 id="pf-title" className="hlabel">
            Ce qu’en disent les clients
          </h2>
          {rating !== null && count !== null && (
            <>
              <p className="pf-value" data-reveal>
                {fr(rating)}
                <small>/ 5</small>
              </p>
              <p className="pf-meta" data-reveal>
                <span className="pf-stars" style={{ ['--r' as string]: rating / 5 }} role="img" aria-label={`${fr(rating)} sur 5`}>
                  <span>{Array.from({ length: 5 }, (_, i) => <StarIcon key={i} />)}</span>
                  <span aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <StarIcon key={i} />)}</span>
                </span>
                {count.toLocaleString('fr-FR')} avis Google
              </p>
            </>
          )}
          <a className="pf-link" href={url} target="_blank" rel="noopener noreferrer">
            Lire les avis sur Google <Arrow direction="up-right" />
          </a>
        </div>
        <ul className="pf-quotes" role="list">
          {quotes.map((q, i) => (
            <li key={q.author} data-reveal style={{ ['--i' as string]: i }}>
              <blockquote>
                <p>{q.text}</p>
              </blockquote>
              <p className="pf-by">
                {q.author}
                <span>
                  {q.topic} · avis Google, {frMonth(q.date)}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- 6. La maison : la devanture, l'adresse, les horaires ---------- */
export function Maison({ week, exceptions }: { week: Interval[][]; exceptions: DayException[] }) {
  const next = exceptions[0];
  const note = next
    ? `${next.closed ? 'Fermeture exceptionnelle' : 'Horaires exceptionnels'} le ${new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(next.date + 'T12:00:00Z'))}${next.note ? ' — ' + next.note : ''}`
    : null;
  return (
    <section className="ms" id="infos" aria-labelledby="ms-title">
      <Pan className="ms-photo" amount={5}>
        <Image src={maisonPhoto.src} alt={maisonPhoto.alt} fill sizes="100vw" quality={82} />
      </Pan>
      <div className="wrap ms-wrap">
        <div className="ms-panel">
          <div className="ms-intro">
            <span className="hlabel hlabel--light">La maison</span>
            <Split id="ms-title" lines={['Rendez-vous', { em: 'à Rantigny.' }]} className="d-2" />
            <OpenNowLine week={week} exceptions={exceptions} className="ms-now" />
          </div>
          <dl className="ms-facts">
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
          <div className="ms-hours">
            <HoursTable week={week} note={note} />
          </div>
          <div className="ms-actions">
            <a className="ms-go" href={site.maps.directions} target="_blank" rel="noopener noreferrer">
              Itinéraire <Arrow direction="up-right" />
            </a>
            <a className="ms-call" href={site.phone.href}>
              Appeler
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
