'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { submitOrder, type FormState } from '@/app/actions';
import { occasions, creationTypes, LIMITS } from '@/lib/form-options';
import { parisToday } from '@/lib/dates';
import { site } from '@/data/site';
import { Field, Honeypot, Turnstile, FormMessage } from './parts';
import { Arrow } from '@/components/ui/Arrow';

const STEPS = [
  { title: 'Occasion', fields: ['occasion'] },
  { title: 'Nombre de personnes', fields: ['personnes'] },
  { title: 'Date souhaitée', fields: ['date'] },
  { title: 'Type de création', fields: ['creation'] },
  { title: 'Coordonnées', fields: ['prenom', 'nom', 'telephone', 'email'] },
  { title: 'Message', fields: ['message'] },
] as const;

const initial: FormState = { status: 'idle', message: '' };
const frDate = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));

/**
 * Tunnel de demande en six étapes.
 * Sans JavaScript : les six étapes s'affichent d'un bloc et le formulaire
 * s'envoie normalement (Server Action). Avec JavaScript : une étape à la fois.
 */
export function OrderForm() {
  const [state, action, pending] = useActionState(submitOrder, initial);
  const [enhanced, setEnhanced] = useState(false);
  const [step, setStep] = useState(0);
  const [minDate, setMinDate] = useState<string>();
  const [recap, setRecap] = useState<string[]>([]);
  const form = useRef<HTMLFormElement>(null);
  const sets = useRef<(HTMLFieldSetElement | null)[]>([]);
  const moved = useRef(false);

  useEffect(() => {
    setEnhanced(true);
    setMinDate(parisToday());
  }, []);

  // Erreur serveur : retour à la première étape concernée.
  useEffect(() => {
    const errors = state.fieldErrors;
    if (!errors) return;
    const index = STEPS.findIndex((s) => s.fields.some((f) => errors[f]));
    if (index >= 0) goTo(index);
  }, [state]);

  useEffect(() => {
    if (!enhanced || !moved.current) return;
    sets.current[step]?.focus();
  }, [step, enhanced]);

  function goTo(index: number) {
    moved.current = true;
    if (index === STEPS.length - 1 && form.current) {
      const data = new FormData(form.current);
      const get = (k: string) => String(data.get(k) ?? '');
      setRecap(
        [get('occasion'), get('personnes') && `${get('personnes')} pers.`, get('date') && frDate(get('date')), get('creation')].filter(Boolean),
      );
    }
    setStep(index);
  }

  /** Valide l'étape visible avec les contraintes natives du navigateur. */
  function stepIsValid() {
    const fields = sets.current[step]?.querySelectorAll<HTMLInputElement>('input, select, textarea');
    for (const field of fields ?? []) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }
    return true;
  }

  if (state.status === 'success') {
    return (
      <div className="form-done" role="status" tabIndex={-1} ref={(el) => el?.focus()}>
        <p className="form-done-title">Demande transmise.</p>
        <p>{state.message}</p>
        <p className="form-done-note">
          Votre demande sera confirmée par la boutique. Pour toute précision : <a className="lnk" href={site.phone.href}>{site.phone.display}</a>.
        </p>
      </div>
    );
  }

  const last = STEPS.length - 1;
  const hide = (i: number) => enhanced && i !== step;

  return (
    <form ref={form} action={action} className="order" noValidate={enhanced} data-enhanced={enhanced || undefined}>
      {enhanced && (
        <ol className="order-steps" aria-label="Étapes de la demande">
          {STEPS.map((s, i) => (
            <li key={s.title} aria-current={i === step ? 'step' : undefined} data-done={i < step || undefined}>
              <button type="button" disabled={i >= step} onClick={() => goTo(i)}>
                <span>{String(i + 1).padStart(2, '0')}</span> {s.title}
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="order-body">
        <FormMessage state={state} />

        <fieldset ref={(el) => { sets.current[0] = el; }} hidden={hide(0)} tabIndex={-1} className="order-set">
          <legend><span className="order-n">01</span> Quelle est l’occasion ?</legend>
          <div className="choices">
            {occasions.map((o, i) => (
              <label key={o} className="choice">
                <input type="radio" name="occasion" value={o} required={i === 0} defaultChecked={state.values?.occasion === o} />
                <span>{o}</span>
              </label>
            ))}
          </div>
          {state.fieldErrors?.occasion && <p className="field-err">{state.fieldErrors.occasion}</p>}
        </fieldset>

        <fieldset ref={(el) => { sets.current[1] = el; }} hidden={hide(1)} tabIndex={-1} className="order-set">
          <legend><span className="order-n">02</span> Pour combien de personnes ?</legend>
          <Field id="o-personnes" name="personnes" label="Nombre de personnes (environ)" state={state}>
            {(a) => <input {...a} type="number" inputMode="numeric" min={1} max={LIMITS.people} step={1} required className="input-big" />}
          </Field>
        </fieldset>

        <fieldset ref={(el) => { sets.current[2] = el; }} hidden={hide(2)} tabIndex={-1} className="order-set">
          <legend><span className="order-n">03</span> Pour quelle date ?</legend>
          <Field id="o-date" name="date" label="Date souhaitée" hint="Les délais possibles dépendent de la demande : la boutique vous les précisera." state={state}>
            {(a) => <input {...a} type="date" min={minDate} required />}
          </Field>
        </fieldset>

        <fieldset ref={(el) => { sets.current[3] = el; }} hidden={hide(3)} tabIndex={-1} className="order-set">
          <legend><span className="order-n">04</span> Quel type de création ?</legend>
          <div className="choices choices--list">
            {creationTypes.map((c, i) => (
              <label key={c} className="choice">
                <input type="radio" name="creation" value={c} required={i === 0} defaultChecked={state.values?.creation === c} />
                <span>{c}</span>
              </label>
            ))}
          </div>
          {state.fieldErrors?.creation && <p className="field-err">{state.fieldErrors.creation}</p>}
        </fieldset>

        <fieldset ref={(el) => { sets.current[4] = el; }} hidden={hide(4)} tabIndex={-1} className="order-set">
          <legend><span className="order-n">05</span> Vos coordonnées</legend>
          <div className="fields-2">
            <Field id="o-prenom" name="prenom" label="Prénom" state={state}>
              {(a) => <input {...a} autoComplete="given-name" maxLength={LIMITS.name} required />}
            </Field>
            <Field id="o-nom" name="nom" label="Nom" state={state}>
              {(a) => <input {...a} autoComplete="family-name" maxLength={LIMITS.name} required />}
            </Field>
            <Field id="o-tel" name="telephone" label="Téléphone" state={state}>
              {(a) => <input {...a} type="tel" autoComplete="tel" maxLength={25} pattern="[0-9 +().\-]{9,25}" required />}
            </Field>
            <Field id="o-email" name="email" label="E-mail" optional state={state}>
              {(a) => <input {...a} type="email" autoComplete="email" maxLength={254} />}
            </Field>
          </div>
        </fieldset>

        <fieldset ref={(el) => { sets.current[5] = el; }} hidden={hide(5)} tabIndex={-1} className="order-set">
          <legend><span className="order-n">06</span> Un mot sur votre projet</legend>
          {enhanced && recap.length > 0 && <p className="order-recap">{recap.join(' · ')}</p>}
          <Field id="o-message" name="message" label="Message" optional hint="Parfums, inscription, allergies, budget… tout ce qui peut aider." state={state}>
            {(a) => <textarea {...a} rows={5} maxLength={LIMITS.message} />}
          </Field>
          <Honeypot />
          <Turnstile />
          <p className="order-notice">
            <strong>Votre demande sera confirmée par la boutique.</strong> L’envoi de ce formulaire ne vaut pas
            commande : la boutique vous recontacte pour valider possibilités, délais et tarif.
          </p>
        </fieldset>

        <div className="order-nav">
          {enhanced && step > 0 && (
            <button type="button" className="btn btn--line" onClick={() => goTo(step - 1)}>
              <Arrow direction="left" /> Retour
            </button>
          )}
          {enhanced && step < last ? (
            <button type="button" className="btn btn--primary" onClick={() => stepIsValid() && goTo(step + 1)}>
              Continuer <Arrow />
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn--primary"
              disabled={pending}
              onClick={(e) => { if (enhanced && !stepIsValid()) e.preventDefault(); }}
            >
              {pending ? 'Envoi…' : 'Envoyer ma demande'} <Arrow />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
