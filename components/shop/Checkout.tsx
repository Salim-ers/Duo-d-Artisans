'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { pickupDays, quoteCart, submitOrder, type Quote } from '@/app/(site)/actions';
import { fullAddress, site } from '@/data/site';
import { capitalize, formatDate, formatTime, money } from '@/lib/format';
import type { PickupDay } from '@/lib/slots';
import { Arrow } from '@/components/ui/Arrow';
import { CheckIcon } from '@/components/ui/Icons';
import { CartLines } from './CartSheet';
import { useCart } from './CartProvider';

type Props = { onlinePayment: boolean; onSitePayment: boolean; orderingOpen: boolean; cancelled?: boolean };
type Contact = { firstName: string; lastName: string; phone: string; email: string; note: string };

const STEPS = ['Panier', 'Retrait', 'Coordonnées', 'Paiement'] as const;

function dayLabel(d: string, i: number) {
  if (i === 0) return 'Aujourd’hui';
  if (i === 1) return 'Demain';
  return capitalize(formatDate(d, 'day'));
}

const period = (t: string) => (t < '12:00' ? 'Matin' : t < '14:00' ? 'Midi' : 'Après-midi');

export function Checkout({ onlinePayment, onSitePayment, orderingOpen, cancelled }: Props) {
  const { lines, ready } = useCart();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [code, setCode] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [days, setDays] = useState<PickupDay[] | null>(null);
  const [daysError, setDaysError] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [contact, setContact] = useState<Contact>({ firstName: '', lastName: '', phone: '', email: '', note: '' });
  const [payment, setPayment] = useState<'online' | 'on_site' | null>(onlinePayment && !onSitePayment ? 'online' : !onlinePayment && onSitePayment ? 'on_site' : null);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(cancelled ? 'Paiement annulé : aucun montant n’a été prélevé. Votre panier est conservé.' : null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const heading = useRef<HTMLDivElement>(null);

  const items = useMemo(() => lines.map((l) => ({ productId: l.productId, variantId: l.variantId, flavorId: l.flavorId, extraIds: l.extraIds, quantity: l.quantity })), [lines]);
  const itemsKey = JSON.stringify(items);

  // Prix réels, recalculés par le serveur à chaque changement de panier ou de code.
  useEffect(() => {
    if (!ready || !items.length) return;
    let live = true;
    const t = window.setTimeout(() => quoteCart(items, appliedCode).then((q) => live && setQuote(q)), 150);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, appliedCode, ready]);

  // Créneaux propres à CE panier (délais, jours de retrait des produits).
  useEffect(() => {
    if (!ready || !items.length || step < 1) return;
    let live = true;
    setDaysError(null);
    pickupDays(items).then((r) => {
      if (!live) return;
      if (!r.ok) return setDaysError(r.error);
      setDays(r.days);
      const stillThere = r.days.find((d) => d.date === date)?.slots.find((s) => s.time === time && !s.full);
      if (!stillThere) setTime(null);
      if (!date || !r.days.some((d) => d.date === date && d.slots.some((s) => !s.full))) setDate(r.days.find((d) => d.slots.some((s) => !s.full))?.date ?? null);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, ready, step >= 1]);

  const go = (n: number) => {
    setStep(n);
    setError(null);
    window.setTimeout(() => document.getElementById(`co-step-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const contactValid = () => {
    const f: Record<string, string> = {};
    if (!contact.firstName.trim()) f.firstName = 'Indiquez votre prénom.';
    if (!contact.lastName.trim()) f.lastName = 'Indiquez votre nom.';
    if (!/^(\+\d{9,15}|0[1-9]\d{8})$/.test(contact.phone.replace(/[\s.\-()]/g, ''))) f.phone = 'Numéro de téléphone invalide.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) f.email = 'Adresse e-mail invalide.';
    setFields(f);
    return !Object.keys(f).length;
  };

  const submit = () => {
    if (!date || !time || !payment) return;
    if (!terms) return setError('Merci d’accepter les conditions de vente.');
    setError(null);
    start(async () => {
      const r = await submitOrder({ items, pickupDate: date, pickupTime: time, ...contact, paymentMethod: payment, promoCode: appliedCode, acceptTerms: terms });
      if (!r.ok) {
        setError(r.error);
        if (r.fields) {
          setFields(r.fields);
          if (r.fields.firstName || r.fields.lastName || r.fields.phone || r.fields.email) go(2);
        }
        if (/créneau/i.test(r.error)) {
          setDays(null);
          go(1);
        }
        return;
      }
      if (/^https?:\/\//.test(r.redirect)) window.location.href = r.redirect;
      else router.push(r.redirect);
    });
  };

  if (!ready) return <div className="co-loading" aria-busy="true" />;

  if (!lines.length)
    return (
      <div className="co-empty">
        {error && <p className="form-error">{error}</p>}
        <p className="t-lead">Votre panier est vide.</p>
        <Link className="btn btn--primary" href="/commander">
          Voir la boutique <Arrow />
        </Link>
      </div>
    );

  const q = quote?.ok ? quote : null;
  const day = days?.find((d) => d.date === date);
  const freeDays = days?.filter((d) => d.slots.some((s) => !s.full)) ?? [];
  const summary = [
    q ? `${lines.reduce((t, l) => t + l.quantity, 0)} article(s) · ${money(q.total)}` : '',
    date && time ? `${capitalize(formatDate(date))} à ${formatTime(time)}` : '',
    contact.firstName ? `${contact.firstName} ${contact.lastName} · ${contact.phone}` : '',
    payment === 'online' ? 'Paiement en ligne' : payment === 'on_site' ? 'Paiement en boutique' : '',
  ];

  return (
    <div className="checkout">
      <div className="co-main" ref={heading}>
        <ol className="co-progress" aria-label="Étapes">
          {STEPS.map((s, i) => (
            <li key={s} aria-current={i === step ? 'step' : undefined} data-done={i < step || undefined}>
              <span>{i < step ? <CheckIcon /> : String(i + 1)}</span>
              {s}
            </li>
          ))}
        </ol>

        {quote?.ok && quote.demo && (
          <p className="demo-notice">
            <b>Démonstration.</b> Ce panier contient des produits d’exemple : la commande sera enregistrée comme commande de démonstration.
          </p>
        )}
        {!orderingOpen && (
          <p className="form-error">
            La commande en ligne n’est pas ouverte pour le moment. Appelez la boutique au {site.phone.display}.
          </p>
        )}

        {/* 1. Panier */}
        <section className="co-step" id="co-step-0" data-open={step === 0 || undefined} data-done={step > 0 || undefined}>
          <header className="co-step-head">
            <h2>
              <span>01</span> Votre panier
            </h2>
            {step > 0 && (
              <button type="button" className="lnk" onClick={() => go(0)}>
                Modifier
              </button>
            )}
          </header>
          {step > 0 ? (
            <p className="co-summary">{summary[0]}</p>
          ) : (
            <div className="co-body">
              <CartLines lines={lines} />
              {quote && !quote.ok && <p className="form-error">{quote.error}</p>}
              <form
                className="co-promo"
                onSubmit={(e) => {
                  e.preventDefault();
                  setAppliedCode(code.trim() || null);
                }}
              >
                <label htmlFor="promo">Code promo</label>
                <input id="promo" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={40} autoComplete="off" placeholder="Facultatif" />
                <button type="submit" className="btn btn--line btn--sm">
                  Appliquer
                </button>
              </form>
              {q?.codeError && appliedCode && <p className="field-err">{q.codeError}</p>}
              {q?.promoLabel && <p className="co-promo-ok">Remise appliquée : {q.promoLabel}</p>}
              <button type="button" className="btn btn--primary" disabled={!q || !orderingOpen} onClick={() => go(1)}>
                Choisir mon créneau <Arrow />
              </button>
            </div>
          )}
        </section>

        {/* 2. Retrait */}
        <section className="co-step" id="co-step-1" data-open={step === 1 || undefined} data-done={step > 1 || undefined}>
          <header className="co-step-head">
            <h2>
              <span>02</span> Retrait en boutique
            </h2>
            {step > 1 && (
              <button type="button" className="lnk" onClick={() => go(1)}>
                Modifier
              </button>
            )}
          </header>
          {step > 1 && <p className="co-summary">{summary[1]}</p>}
          {step === 1 && (
            <div className="co-body">
              <p className="t-small">{fullAddress}</p>
              {daysError && <p className="form-error">{daysError}</p>}
              {!days && !daysError && <div className="co-loading" aria-busy="true" />}
              {days && !freeDays.length && <p className="form-error">Aucun créneau disponible pour ce panier dans les prochains jours. Appelez la boutique au {site.phone.display}.</p>}
              {days && freeDays.length > 0 && (
                <>
                  <div className="co-days" role="radiogroup" aria-label="Jour de retrait">
                    {days.map((d, i) => {
                      const open = d.slots.some((s) => !s.full);
                      const why = d.closed ? 'Fermé' : d.slots.length ? 'Complet' : 'Indisponible';
                      return (
                        <button
                          key={d.date}
                          type="button"
                          role="radio"
                          aria-checked={date === d.date}
                          disabled={!open}
                          title={!open ? (d.note ?? (d.closed ? 'Pas de retrait ce jour' : d.slots.length ? 'Tous les créneaux sont pris' : 'Délai de préparation insuffisant')) : undefined}
                          className="co-day"
                          onClick={() => {
                            setDate(d.date);
                            setTime(null);
                          }}
                        >
                          <span>{dayLabel(d.date, i)}</span>
                          <b>{formatDate(d.date, 'short')}</b>
                          {!open && <small>{why}</small>}
                        </button>
                      );
                    })}
                  </div>
                  {day?.note && <p className="t-small">{day.note}</p>}
                  {day && (
                    <div className="co-slots" key={day.date}>
                      {['Matin', 'Midi', 'Après-midi'].map((p) => {
                        const slots = day.slots.filter((s) => period(s.time) === p);
                        if (!slots.length) return null;
                        return (
                          <fieldset key={p} className="co-period">
                            <legend>{p}</legend>
                            <div className="co-times">
                              {slots.map((s, i) => (
                                <label key={s.time} className="co-time" style={{ ['--i' as string]: i }}>
                                  <input type="radio" name="slot" value={s.time} checked={time === s.time} disabled={s.full} onChange={() => setTime(s.time)} />
                                  <span>
                                    {formatTime(s.time)}
                                    {s.full ? <small>Complet</small> : s.remaining <= 2 ? <small>Dernières places</small> : null}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </fieldset>
                        );
                      })}
                    </div>
                  )}
                  <button type="button" className="btn btn--primary" disabled={!date || !time} onClick={() => go(2)}>
                    Continuer <Arrow />
                  </button>
                </>
              )}
            </div>
          )}
        </section>

        {/* 3. Coordonnées */}
        <section className="co-step" id="co-step-2" data-open={step === 2 || undefined} data-done={step > 2 || undefined}>
          <header className="co-step-head">
            <h2>
              <span>03</span> Vos coordonnées
            </h2>
            {step > 2 && (
              <button type="button" className="lnk" onClick={() => go(2)}>
                Modifier
              </button>
            )}
          </header>
          {step > 2 && <p className="co-summary">{summary[2]}</p>}
          {step === 2 && (
            <form
              className="co-body"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (contactValid()) go(3);
              }}
            >
              <div className="fields-2">
                {(
                  [
                    ['firstName', 'Prénom', 'given-name', 'text'],
                    ['lastName', 'Nom', 'family-name', 'text'],
                    ['phone', 'Téléphone', 'tel', 'tel'],
                    ['email', 'E-mail', 'email', 'email'],
                  ] as const
                ).map(([k, label, ac, type]) => (
                  <div key={k} className="field" data-invalid={fields[k] ? '' : undefined}>
                    <label htmlFor={`co-${k}`}>{label}</label>
                    <input
                      id={`co-${k}`}
                      type={type}
                      autoComplete={ac}
                      inputMode={k === 'phone' ? 'tel' : k === 'email' ? 'email' : undefined}
                      value={contact[k]}
                      maxLength={k === 'email' ? 160 : 60}
                      aria-invalid={fields[k] ? true : undefined}
                      aria-describedby={fields[k] ? `co-${k}-err` : undefined}
                      onChange={(e) => setContact({ ...contact, [k]: e.target.value })}
                      required
                    />
                    {fields[k] && (
                      <p className="field-err" id={`co-${k}-err`}>
                        {fields[k]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="field">
                <label htmlFor="co-note">
                  Une précision <span className="field-opt">— facultatif</span>
                </label>
                <textarea id="co-note" rows={3} maxLength={500} value={contact.note} onChange={(e) => setContact({ ...contact, note: e.target.value })} />
              </div>
              <p className="t-small">Vos coordonnées servent uniquement au suivi de cette commande.</p>
              <button type="submit" className="btn btn--primary">
                Continuer <Arrow />
              </button>
            </form>
          )}
        </section>

        {/* 4. Paiement */}
        <section className="co-step" id="co-step-3" data-open={step === 3 || undefined}>
          <header className="co-step-head">
            <h2>
              <span>04</span> Paiement
            </h2>
          </header>
          {step === 3 && (
            <div className="co-body">
              <div className="co-pay" role="radiogroup" aria-label="Mode de paiement">
                {onlinePayment && (
                  <label className="co-pay-option">
                    <input type="radio" name="pay" checked={payment === 'online'} onChange={() => setPayment('online')} />
                    <span>
                      <b>Payer en ligne</b>
                      <small>Carte bancaire via Stripe, paiement sécurisé. Aucune donnée bancaire n’est conservée par la boutique.</small>
                    </span>
                  </label>
                )}
                {onSitePayment && (
                  <label className="co-pay-option">
                    <input type="radio" name="pay" checked={payment === 'on_site'} onChange={() => setPayment('on_site')} />
                    <span>
                      <b>Payer en boutique</b>
                      <small>Vous réglez au moment du retrait.</small>
                    </span>
                  </label>
                )}
                {!onlinePayment && !onSitePayment && <p className="form-error">Aucun moyen de paiement n’est disponible pour le moment.</p>}
              </div>
              <label className="check">
                <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
                <span>
                  J’accepte les{' '}
                  <Link className="lnk" href="/conditions-de-vente" target="_blank">
                    conditions de vente
                  </Link>{' '}
                  et la{' '}
                  <Link className="lnk" href="/politique-confidentialite" target="_blank">
                    politique de confidentialité
                  </Link>
                  .
                </span>
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button type="button" className="btn btn--primary btn--block co-submit" disabled={!payment || pending || !q || !orderingOpen} data-pending={pending || undefined} onClick={submit}>
                {pending ? 'Un instant…' : payment === 'online' ? `Payer ${q ? money(q.total) : ''}` : `Valider ma commande${q ? ' · ' + money(q.total) : ''}`}
              </button>
            </div>
          )}
        </section>
        {error && step < 3 && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <aside className="co-recap" aria-label="Récapitulatif">
        <h2>Récapitulatif</h2>
        {q ? (
          <>
            <ul className="co-recap-lines">
              {q.lines.map((l) => (
                <li key={l.key}>
                  <span>
                    {l.quantity} × {l.name}
                    {l.detail && <small>{l.detail}</small>}
                  </span>
                  <span className="price">{money(l.unit * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="co-totals">
              <div>
                <dt>Sous-total</dt>
                <dd className="price">{money(q.subtotal)}</dd>
              </div>
              {q.discount > 0 && (
                <div>
                  <dt>{q.promoLabel}</dt>
                  <dd className="price">− {money(q.discount)}</dd>
                </div>
              )}
              <div className="co-total">
                <dt>Total</dt>
                <dd className="price">{money(q.total)}</dd>
              </div>
            </dl>
          </>
        ) : (
          <div className="co-loading" aria-busy="true" />
        )}
        <div className="co-recap-pickup">
          <p>
            <b>Retrait</b> {date && time ? `${capitalize(formatDate(date))} à ${formatTime(time)}` : 'à choisir'}
          </p>
          <p>{fullAddress}</p>
        </div>
      </aside>
    </div>
  );
}
