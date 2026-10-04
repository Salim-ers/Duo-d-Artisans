'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useActionState, useEffect, useRef, useState, startTransition } from 'react';
import { submitCustomRequest, type FormState } from '@/app/(site)/actions';
import { site } from '@/data/site';
import { capitalize, formatDate } from '@/lib/format';
import { compressImage } from '@/lib/resize-image';
import { Arrow } from '@/components/ui/Arrow';
import { CloseIcon } from '@/components/ui/Icons';
import { Field, Honeypot, Turnstile, FormMessage } from './parts';

const STEPS = [
  { title: 'Création', fields: ['type'] },
  { title: 'Date et parts', fields: ['desiredDate', 'servings'] },
  { title: 'Votre envie', fields: ['flavors', 'theme', 'inscription', 'budget', 'comment'] },
  { title: 'Coordonnées', fields: ['firstName', 'lastName', 'phone', 'email'] },
] as const;

const initial: FormState = { status: 'idle', message: '' };
const MAX_IMAGES = 3;

export type TypeChoice = { label: string; image: string | null };

/**
 * Demande de création sur mesure en quatre étapes.
 * Sans JavaScript : tout s'affiche d'un bloc et le formulaire s'envoie normalement (Server Action).
 * Avec JavaScript : une étape à la fois, photos d'inspiration compressées avant l'envoi.
 */
export function CustomRequestForm({ types, minDate }: { types: TypeChoice[]; minDate: string }) {
  const [state, action, pending] = useActionState(submitCustomRequest, initial);
  const [enhanced, setEnhanced] = useState(false);
  const [step, setStep] = useState(0);
  const [type, setType] = useState('');
  const [files, setFiles] = useState<{ file: File; url: string }[]>([]);
  const form = useRef<HTMLFormElement>(null);
  const sets = useRef<(HTMLFieldSetElement | null)[]>([]);
  const moved = useRef(false);

  useEffect(() => {
    setEnhanced(true);
    const t = new URLSearchParams(window.location.search).get('type');
    if (t && types.some((x) => x.label === t)) setType(t);
  }, [types]);

  useEffect(() => {
    const errors = state.fields;
    if (!errors) return;
    const index = STEPS.findIndex((s) => s.fields.some((f) => errors[f]));
    if (index >= 0) goTo(index);
  }, [state]);

  useEffect(() => {
    if (enhanced && moved.current) sets.current[step]?.focus();
  }, [step, enhanced]);

  useEffect(() => () => files.forEach((f) => URL.revokeObjectURL(f.url)), [files]);

  function goTo(i: number) {
    moved.current = true;
    setStep(i);
    form.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function stepIsValid() {
    if (step === 0 && !type) return false;
    for (const el of sets.current[step]?.querySelectorAll<HTMLInputElement>('input, select, textarea') ?? []) {
      if (!el.checkValidity()) {
        el.reportValidity();
        return false;
      }
    }
    return true;
  }

  async function addFiles(list: FileList | null) {
    if (!list) return;
    const room = MAX_IMAGES - files.length;
    const picked = [...list].filter((f) => /^image\//.test(f.type)).slice(0, room);
    const ready = await Promise.all(picked.map((f) => compressImage(f)));
    setFiles((cur) => [...cur, ...ready.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  }

  if (state.status === 'success')
    return (
      <div className="form-done" role="status" tabIndex={-1} ref={(el) => el?.focus()}>
        <p className="form-done-title">Demande transmise.</p>
        {state.ref && (
          <p>
            Référence <b>{state.ref}</b>
          </p>
        )}
        <p>{state.message}</p>
        <p className="t-small">
          Une question ? <a className="lnk" href={site.phone.href}>{site.phone.display}</a>
        </p>
        {state.link && (
          <Link className="btn btn--line" href={state.link}>
            Suivre ma demande <Arrow />
          </Link>
        )}
      </div>
    );

  const hide = (i: number) => enhanced && i !== step;
  const last = STEPS.length - 1;

  return (
    <form
      ref={form}
      action={action}
      className="creq"
      noValidate={enhanced}
      data-enhanced={enhanced || undefined}
      onSubmit={(e) => {
        if (!enhanced) return;
        e.preventDefault();
        if (!stepIsValid()) return;
        const fd = new FormData(e.currentTarget);
        fd.delete('images');
        files.forEach((f) => fd.append('images', f.file));
        startTransition(() => action(fd));
      }}
    >
      {enhanced && (
        <ol className="creq-steps" aria-label="Étapes de la demande">
          {STEPS.map((s, i) => (
            <li key={s.title} aria-current={i === step ? 'step' : undefined} data-done={i < step || undefined}>
              <button type="button" disabled={i >= step} onClick={() => goTo(i)}>
                <span>{String(i + 1).padStart(2, '0')}</span> {s.title}
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="creq-body">
        <FormMessage state={state} />

        <fieldset ref={(el) => { sets.current[0] = el; }} hidden={hide(0)} tabIndex={-1} className="creq-set">
          <legend>
            <span className="creq-n">01</span> Que souhaitez-vous ?
          </legend>
          <div className="creq-types">
            {types.map((t, i) => (
              <label key={t.label} className="creq-type" style={{ ['--i' as string]: i }}>
                <input type="radio" name="type" value={t.label} required={i === 0} checked={type === t.label} onChange={() => setType(t.label)} />
                <span className="creq-type-media photo">{t.image && <Image src={t.image} alt="" fill sizes="(max-width: 700px) 45vw, 18vw" quality={70} />}</span>
                <span className="creq-type-name">{t.label}</span>
              </label>
            ))}
          </div>
          {state.fields?.type && <p className="field-err">{state.fields.type}</p>}
        </fieldset>

        <fieldset ref={(el) => { sets.current[1] = el; }} hidden={hide(1)} tabIndex={-1} className="creq-set">
          <legend>
            <span className="creq-n">02</span> Pour quand, pour combien ?
          </legend>
          <div className="fields-2">
            <Field id="cr-date" name="desiredDate" label="Date souhaitée" hint={`Au plus tôt le ${formatDate(minDate)}.`} state={state}>
              {(a) => <input {...a} type="date" min={minDate} required />}
            </Field>
            <Field id="cr-servings" name="servings" label="Nombre de personnes" state={state}>
              {(a) => <input {...a} type="number" inputMode="numeric" min={1} max={300} step={1} required />}
            </Field>
          </div>
        </fieldset>

        <fieldset ref={(el) => { sets.current[2] = el; }} hidden={hide(2)} tabIndex={-1} className="creq-set">
          <legend>
            <span className="creq-n">03</span> Racontez-nous votre envie
          </legend>
          <div className="fields-2">
            <Field id="cr-flavors" name="flavors" label="Saveurs souhaitées" optional state={state}>
              {(a) => <input {...a} maxLength={300} placeholder="Chocolat, fruits rouges…" />}
            </Field>
            <Field id="cr-theme" name="theme" label="Thème, couleurs" optional state={state}>
              {(a) => <input {...a} maxLength={200} />}
            </Field>
            <Field id="cr-inscription" name="inscription" label="Texte à inscrire" optional state={state}>
              {(a) => <input {...a} maxLength={120} placeholder="Joyeux anniversaire…" />}
            </Field>
            <Field id="cr-budget" name="budget" label="Budget indicatif" optional state={state}>
              {(a) => <input {...a} maxLength={60} placeholder="Ex. 60 €" />}
            </Field>
          </div>
          <Field id="cr-comment" name="comment" label="Commentaires" optional hint="Allergies, contraintes, idée de décor… tout ce qui peut aider." state={state}>
            {(a) => <textarea {...a} rows={4} maxLength={2000} />}
          </Field>
          <div className="field">
            <span className="field-label">
              Images d’inspiration <span className="field-opt">— facultatif, {MAX_IMAGES} maximum</span>
            </span>
            <div className="creq-files">
              {files.map((f, i) => (
                <span key={f.url} className="creq-file">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url} alt={`Inspiration ${i + 1}`} />
                  <button type="button" className="icon-btn" aria-label="Retirer cette image" onClick={() => setFiles((cur) => cur.filter((x) => x !== f))}>
                    <CloseIcon />
                  </button>
                </span>
              ))}
              {files.length < MAX_IMAGES && (
                <label className="creq-drop">
                  <input type="file" name="images" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => (enhanced ? (addFiles(e.target.files), (e.target.value = '')) : undefined)} />
                  <span>+ Ajouter</span>
                </label>
              )}
            </div>
            <p className="field-hint">JPG, PNG ou WEBP. Visibles uniquement par la boutique.</p>
          </div>
        </fieldset>

        <fieldset ref={(el) => { sets.current[3] = el; }} hidden={hide(3)} tabIndex={-1} className="creq-set">
          <legend>
            <span className="creq-n">04</span> Vos coordonnées
          </legend>
          <div className="fields-2">
            <Field id="cr-first" name="firstName" label="Prénom" state={state}>
              {(a) => <input {...a} autoComplete="given-name" maxLength={60} required />}
            </Field>
            <Field id="cr-last" name="lastName" label="Nom" state={state}>
              {(a) => <input {...a} autoComplete="family-name" maxLength={60} required />}
            </Field>
            <Field id="cr-phone" name="phone" label="Téléphone" state={state}>
              {(a) => <input {...a} type="tel" autoComplete="tel" maxLength={25} pattern="[0-9 +.\-]{9,25}" required />}
            </Field>
            <Field id="cr-email" name="email" label="E-mail" state={state}>
              {(a) => <input {...a} type="email" autoComplete="email" maxLength={160} required />}
            </Field>
          </div>
          <Honeypot />
          <Turnstile />
          <p className="creq-notice">
            <strong>Ceci est une demande, pas une commande.</strong> La boutique l’étudie puis vous recontacte pour confirmer
            faisabilité, délai et tarif. {type && `(${capitalize(type)})`}
          </p>
        </fieldset>

        <div className="creq-nav">
          {enhanced && step > 0 && (
            <button type="button" className="btn btn--line" onClick={() => goTo(step - 1)}>
              <Arrow direction="left" /> Retour
            </button>
          )}
          {enhanced && step < last ? (
            <button type="button" className="btn btn--primary" disabled={step === 0 && !type} onClick={() => stepIsValid() && goTo(step + 1)}>
              Continuer <Arrow />
            </button>
          ) : (
            <button type="submit" className="btn btn--primary" disabled={pending}>
              {pending ? 'Envoi…' : 'Envoyer ma demande'} <Arrow />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
