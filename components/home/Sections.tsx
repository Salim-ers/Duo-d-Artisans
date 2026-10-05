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
import { Drift, Pan, Settle, Story } from './motion';

/* ------------------------------------------------------------------
   Photos fixes de l'accueil : chacune n'apparaît qu'une fois.
   La « vitrine » (galerie administrable) écarte automatiquement toutes celles-ci.
   ------------------------------------------------------------------ */
const duoPhotos = { pain: media.baguettesFournil, patisserie: media.entremets };

const steps: { n: string; word: string; text: string; image: Media; position?: string }[] = [
  { n: '01', word: 'Pétrir', text: 'Tout commence au pétrin : la pâte prend corps.', image: media.petrin },
  { n: '02', word: 'Façonner', text: 'Chaque pièce prend sa forme.', image: media.ambRouleau, position: '58% 50%' },
  { n: '03', word: 'Cuire', text: 'Le four donne la croûte, la couleur, le croustillant.', image: media.baguettesTradition, position: '46% 50%' },
  { n: '04', word: 'Dresser', text: 'Fruits, crèmes, finitions : la pâtisserie se compose.', image: media.gateauFruits },
  { n: '05', word: 'Partager', text: 'Au comptoir, 7 rue Anatole France.', image: media.boutique, position: '40% 50%' },
];

const pausePhoto = media.vitrineEclairs;
const occasionPhoto = media.numberCake;
const maisonPhoto = media.facadeHd;

export const fixedHomePhotos = [heroPhoto, duoPhotos.pain, duoPhotos.patisserie, ...steps.map((s) => s.image), pausePhoto, occasionPhoto, maisonPhoto].map((p) => p.src);

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

/* ---------- 3. La vitrine : galerie éditoriale asymétrique ---------- */
/** Largeur réelle de chaque case (voir home.css) : sur téléphone, les cases 2-3 et 5-6 vont par deux. */
function vitrineSizes(i: number, n: number) {
  const half = i === 1 || i === 2 || i === 5 || (i === 4 && n > 5);
  const mobile = half ? '46vw' : '92vw';
  const desktop = i === 0 ? '56vw' : i === 3 ? '48vw' : '36vw';
  return `(max-width: 899px) ${mobile}, ${desktop}`;
}
export function Vitrine({ items }: { items: GalleryItem[] }) {
  if (!items.length) return null;
  const label = (g: GalleryItem) => g.title ?? galleryCategories.find((c) => c.id === g.category)?.label ?? '';
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
          {items.map((g, i) => (
            <li key={g.id} className="vt-item">
              <Link href={`/creations?filtre=${g.category}`} className="vt-link">
                <Photo image={{ src: g.src, alt: g.alt }} sizes={vitrineSizes(i, items.length)} className="vt-photo" index={i % 2} />
                <span className="vt-cap">
                  <span className="vt-n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="vt-name">{label(g)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- 4. Du fournil à la vitrine : récit à scène fixe ---------- */
export function Savoir() {
  return (
    <section className="st" aria-labelledby="st-title">
      <div className="wrap st-head">
        <span className="hlabel hlabel--light">Le savoir-faire</span>
        <Split id="st-title" lines={['Du fournil', { em: 'à la vitrine.' }]} className="d-1" />
      </div>
      <Story
        steps={steps.map(({ n, word, text }) => ({ n, word, text }))}
        images={steps.map((s) => (
          <Image key={s.n} src={s.image.src} alt={s.image.alt} fill sizes="(max-width: 899px) 100vw, 50vw" quality={82} style={s.position ? { objectPosition: s.position } : undefined} />
        ))}
      />
    </section>
  );
}

/* ---------- 5. Respiration plein écran, puis les commandes qui glissent par-dessus ---------- */
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

/* ---------- 6. Preuve sociale : la note, et trois voix ---------- */
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

/* ---------- 7. La maison : la devanture, l'adresse, les horaires ---------- */
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
