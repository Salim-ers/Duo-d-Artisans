import Link from 'next/link';
import type { Interval } from '@/data/opening-hours';
import type { DayException } from '@/lib/hours';
import type { ReviewsSettings } from '@/lib/settings-shared';
import { media, type Media } from '@/data/media';
import { reviewQuotes } from '@/data/reviews';
import { reviewsUrl, site } from '@/data/site';
import { Split } from '@/components/ui/Split';
import { Arrow } from '@/components/ui/Arrow';
import { StarIcon } from '@/components/ui/Icons';
import { OpenNowLine } from '@/components/ui/OpenNow';
import { HoursTable } from '@/components/ui/HoursTable';
import { ArtShot, Shot } from '@/components/ui/Shot';
import { Drift } from './motion';
import { Strip } from './Strip';

/*
 * Toutes les photos de l'accueil sont fixes et n'apparaissent qu'une fois.
 * Chacune s'affiche ENTIÈRE, à son ratio d'origine : jamais recadrée, jamais zoomée.
 *   hero ............ façade                     vitrine ......... vitrine (pâtisseries) + vitrine (éclairs)
 *   duo ............. baguettes, gâteau fruits    produits ........ pains au chocolat, macarons, flans,
 *   fournil ......... pétrin                                        entremets, cookies, baguettes du fournil
 *   sur mesure ...... number cake                 salé ............ sandwichs, salades
 *   boutique ........ intérieur de la boutique
 */

/** Légende sobre : nom en serif, précision en petites capitales. */
function Cap({ name, detail }: { name: string; detail: string }) {
  return (
    <>
      <span className="cap-name">{name}</span>
      <span className="cap-detail">{detail}</span>
    </>
  );
}

/* ---------- 2. Deux savoir-faire, une seule maison ---------- */
function Universe({ n, name, title, items, href, cta }: { n: string; name: string; title: [string, string]; items: string[]; href: string; cta: string }) {
  return (
    <div className="uni-text">
      <p className="uni-label">
        <span>{n}</span>
        {name}
      </p>
      <h3 className="uni-title" data-reveal>
        {title[0]}
        <br />
        <em>{title[1]}</em>
      </h3>
      <p className="uni-items" data-reveal>
        {items.join(' · ')}
      </p>
      <Link className="ulink" href={href}>
        {cta} <Arrow />
      </Link>
    </div>
  );
}

export function Duo() {
  return (
    <section className="duo" id="maison" aria-labelledby="duo-title">
      <div className="wrap">
        <header className="duo-head">
          <span className="hlabel">Le Duo</span>
          <Split id="duo-title" lines={['Deux savoir-faire.', { em: 'Une seule maison.' }]} className="d-1" />
        </header>

        <article className="duo-row duo-row--a">
          <Shot image={media.baguettesTradition} sizes="(max-width: 899px) 92vw, 60vw" className="duo-shot" />
          <Drift className="duo-side" from={40} to={-40}>
            <Universe
              n="01"
              name="Boulangerie"
              title={['Le quotidien,', 'croustillant.']}
              items={['Pain', 'Baguettes', 'Viennoiseries', 'Fournées']}
              href="/creations?filtre=pain"
              cta="Découvrir la boulangerie"
            />
          </Drift>
        </article>

        <p className="duo-x" aria-hidden="true">
          ×
        </p>

        <article className="duo-row duo-row--b">
          <Drift className="duo-side" from={40} to={-40}>
            <Universe
              n="02"
              name="Pâtisserie"
              title={['La gourmandise,', 'pièce par pièce.']}
              items={['Entremets', 'Macarons', 'Gâteaux', 'Créations']}
              href="/creations?filtre=patisserie"
              cta="Découvrir la pâtisserie"
            />
          </Drift>
          <Shot image={media.gateauFruits} sizes="(max-width: 899px) 92vw, 52vw" className="duo-shot" />
        </article>
      </div>
    </section>
  );
}

/* ---------- 3. La vitrine : une photographie immense, puis la boutique ---------- */
export function Vitrine() {
  return (
    <section className="vt" aria-labelledby="vt-title">
      <div className="wrap vt-head">
        <span className="hlabel">Au comptoir</span>
        <Split id="vt-title" lines={['La', { em: 'vitrine.' }]} className="d-xl" />
      </div>
      <Strip label="La vitrine de pâtisseries : faites glisser pour la parcourir" className="vt-strip">
        <Shot image={media.vitrinePatisseries} quality={95} sizes="(max-width: 899px) 790px, 100vw" className="vt-hero" />
      </Strip>
      <div className="wrap vt-foot">
        <Shot image={media.vitrineEclairs} sizes="(max-width: 899px) 92vw, 56vw" className="vt-boutique" caption={<Cap name="Éclairs, Paris-Brest, tartes" detail="Au fil des jours" />} />
        <div className="vt-text">
          <p className="vt-lead" data-reveal>
            Ce qui sort du fournil et ce qui passe en vitrine change au fil des jours et des saisons.
          </p>
          <Link className="btn-duo" href="/creations">
            Découvrir toutes les créations <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- 4. Les produits : grand format, puis deux, puis grand format, puis deux ---------- */
const pairs: { a: { image: Media; name: string; detail: string; href: string }; b: { image: Media; name: string; detail: string; href: string } }[] = [
  {
    a: { image: media.macarons, name: 'Grands macarons', detail: 'Framboise · pistache', href: '/creations?filtre=patisserie' },
    b: { image: media.flans, name: 'Flans individuels', detail: 'Chocolat · pistache', href: '/creations?filtre=patisserie' },
  },
  {
    a: { image: media.cookies, name: 'Cookies garnis', detail: 'Chocolat · caramel · fruits rouges', href: '/creations?filtre=patisserie' },
    b: { image: media.baguettesFournil, name: 'Baguettes', detail: 'À la sortie du four', href: '/creations?filtre=pain' },
  },
];

function Pair({ pair, offset }: { pair: (typeof pairs)[number]; offset: 'a' | 'b' }) {
  return (
    <div className={`pr-pair pr-pair--${offset}`}>
      {[pair.a, pair.b].map((p, i) => (
        <Link key={p.name} href={p.href} className="pr-link">
          <Shot image={p.image} sizes="(max-width: 899px) 92vw, 46vw" index={i} caption={<Cap name={p.name} detail={p.detail} />} />
        </Link>
      ))}
    </div>
  );
}

export function Produits() {
  return (
    <section className="pr" aria-labelledby="pr-title">
      <div className="wrap">
        <header className="pr-head">
          <span className="hlabel">Les créations</span>
          <Split id="pr-title" lines={['Pièce', { em: 'après pièce.' }]} className="d-1" />
        </header>

        <Link href="/creations?filtre=viennoiserie" className="pr-link pr-wide">
          <ArtShot
            wide={media.painsChocolatWide}
            square={media.painsChocolat}
            wideSizes="(max-width: 1440px) 92vw, 1328px"
            caption={<Cap name="Pains au chocolat" detail="Feuilletage doré" />}
          />
        </Link>
        <Pair pair={pairs[0]!} offset="a" />
        <Link href="/creations?filtre=patisserie" className="pr-link pr-wide">
          <ArtShot
            wide={media.entremetsWide}
            square={media.entremets}
            wideSizes="(max-width: 1440px) 92vw, 1328px"
            caption={<Cap name="Entremets citron & framboise" detail="Pâtisseries individuelles" />}
          />
        </Link>
        <Pair pair={pairs[1]!} offset="b" />

        <p className="pr-more">
          <Link className="ulink" href="/creations">
            Toute la galerie <Arrow />
          </Link>
        </p>
      </div>
    </section>
  );
}

/* ---------- 5. Le fournil : un écran épuré ---------- */
const gestures = ['Pétrir.', 'Façonner.', 'Cuire.', 'Créer.'];

export function Fournil() {
  return (
    <section className="fo" aria-labelledby="fo-title">
      <div className="wrap fo-grid">
        <div className="fo-text">
          <span className="hlabel hlabel--light">Le fournil</span>
          <Split id="fo-title" lines={['Fait ici.', { em: 'À Rantigny.' }]} className="d-1" />
          <ol className="fo-words">
            {gestures.map((w, i) => (
              <li key={w} data-reveal style={{ ['--i' as string]: i }}>
                {w}
              </li>
            ))}
          </ol>
        </div>
        <Drift className="fo-media" from={24} to={-24}>
          <Shot image={media.petrin} sizes="(max-width: 899px) 92vw, 46vw" />
        </Drift>
      </div>
    </section>
  );
}

/* ---------- 6. Sur mesure : les jours qui comptent ---------- */
const occasions = [
  { label: 'Anniversaire.', type: 'Anniversaire' },
  { label: 'Événement.', type: 'Événement' },
  { label: 'Envie particulière.', type: 'Autre' },
];

export function SurMesure() {
  return (
    <section className="oc" aria-labelledby="oc-title">
      <div className="wrap oc-grid">
        <Shot image={media.numberCake} sizes="(max-width: 899px) 92vw, 50vw" className="oc-shot" />
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

/* ---------- 7. Le salé : et aussi, pour midi ---------- */
export function Sale() {
  return (
    <section className="sl" aria-labelledby="sl-title">
      <div className="wrap">
        <header className="sl-head">
          <div>
            <span className="hlabel">Le salé</span>
            <Split id="sl-title" lines={['Et aussi,', { em: 'pour midi.' }]} className="d-1" />
          </div>
          <div className="sl-aside" data-reveal>
            <p>Sandwichs en baguette, salades composées, salades de pâtes : de quoi déjeuner sur le pouce.</p>
            <Link className="ulink" href="/creations?filtre=sale">
              Voir le salé <Arrow />
            </Link>
          </div>
        </header>
        <div className="sl-grid">
          <Shot image={media.sandwichs} sizes="(max-width: 899px) 92vw, 46vw" caption={<Cap name="Sandwichs" detail="En baguette" />} />
          <Shot image={media.salades} sizes="(max-width: 899px) 92vw, 46vw" index={1} caption={<Cap name="Salades" detail="Composées, à emporter" />} />
        </div>
      </div>
    </section>
  );
}

/* ---------- 8. Les avis : la note, et trois voix ---------- */
const fr = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
const frMonth = (iso: string) => new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z'));
const featured = ['Amandine R.', 'Marie-Laure D.', 'Samantha D.'];

export function Avis({ reviews }: { reviews: ReviewsSettings }) {
  const { rating, count } = reviews;
  const url = reviews.url ?? reviewsUrl;
  const quotes = reviewQuotes.filter((q) => featured.includes(q.author));
  return (
    <section className="av" aria-labelledby="av-title">
      <div className="wrap">
        <div className="av-score">
          <h2 id="av-title" className="hlabel">
            Ce qu’en disent les clients
          </h2>
          {rating !== null && count !== null && (
            <div className="av-row" data-reveal>
              <p className="av-value">
                {fr(rating)}
                <small>/ 5</small>
              </p>
              <p className="av-meta">
                <span className="av-stars" style={{ ['--r' as string]: rating / 5 }} role="img" aria-label={`${fr(rating)} sur 5`}>
                  <span>{Array.from({ length: 5 }, (_, i) => <StarIcon key={i} />)}</span>
                  <span aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <StarIcon key={i} />)}</span>
                </span>
                <span>{count.toLocaleString('fr-FR')} avis Google</span>
                <a className="ulink" href={url} target="_blank" rel="noopener noreferrer">
                  Lire les avis <Arrow direction="up-right" />
                </a>
              </p>
            </div>
          )}
        </div>
        <ul className="av-quotes" role="list">
          {quotes.map((q, i) => (
            <li key={q.author} data-reveal style={{ ['--i' as string]: i }}>
              <blockquote>
                <p>{q.text}</p>
              </blockquote>
              <p className="av-by">
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

/* ---------- 9. La boutique : le comptoir, l'adresse, les horaires (la devanture ouvre la page) ---------- */
export function Boutique({ week, exceptions }: { week: Interval[][]; exceptions: DayException[] }) {
  const next = exceptions[0];
  const note = next
    ? `${next.closed ? 'Fermeture exceptionnelle' : 'Horaires exceptionnels'} le ${new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(next.date + 'T12:00:00Z'))}${next.note ? ' — ' + next.note : ''}`
    : null;
  return (
    <section className="bq" id="boutique" aria-labelledby="bq-title">
      <Shot image={media.boutique} quality={95} sizes="100vw" className="bq-shot" />
      <div className="bq-panel">
        <div className="wrap bq-grid">
          <div className="bq-intro">
            <span className="hlabel">La boutique</span>
            <Split id="bq-title" lines={['Le Duo', { em: 'd’Artisans.' }]} className="d-1" />
            <OpenNowLine week={week} exceptions={exceptions} className="bq-now" />
          </div>
          <div className="bq-facts">
            <dl>
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
            <p className="bq-actions">
              <a className="bq-go" href={site.maps.directions} target="_blank" rel="noopener noreferrer">
                Itinéraire <Arrow direction="up-right" />
              </a>
              <a className="bq-call" href={site.phone.href}>
                Appeler
              </a>
            </p>
          </div>
          <div className="bq-hours">
            <HoursTable week={week} note={note} />
          </div>
        </div>
      </div>
    </section>
  );
}
