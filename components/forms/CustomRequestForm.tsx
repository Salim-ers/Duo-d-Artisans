'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef, useState, startTransition } from 'react';
import { submitCustomRequest, type FormState } from '@/app/(site)/actions';
import { site } from '@/data/site';
import { formatDate } from '@/lib/format';
import { compressImage } from '@/lib/resize-image';
import { Arrow } from '@/components/ui/Arrow';
import { CloseIcon } from '@/components/ui/Icons';
import { Honeypot, Turnstile, FormMessage } from './parts';

const initial: FormState = { status: 'idle', message: '' };
const MAX_IMAGES = 3;

type A11y = { id: string; name: string; 'aria-invalid'?: true; 'aria-describedby'?: string; defaultValue?: string };

/** Une question du bloc-note : numéro dans la marge, question, ligne de réponse, erreur reliée. */
function Question({
  n,
  id,
  name,
  label,
  hint,
  optional,
  state,
  children,
}: {
  n: number;
  id: string;
  name: string;
  label: string;
  hint?: string;
  optional?: boolean;
  state: FormState;
  children: (a: A11y) => React.ReactNode;
}) {
  const error = state.fields?.[name];
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <li className="pad-q" data-invalid={error ? '' : undefined}>
      <span className="pad-n" aria-hidden="true">{n}</span>
      <label className="pad-label" htmlFor={id}>
        {label}
        {optional && <span className="pad-opt">facultatif</span>}
      </label>
      {hint && (
        <p className="pad-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {children({ id, name, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy, defaultValue: state.values?.[name] })}
      {error && (
        <p className="field-err" id={`${id}-err`}>
          {error}
        </p>
      )}
    </li>
  );
}

/** Petite ligne libellée (coordonnées) à l'intérieur d'une question. */
function Line({ id, name, label, state, children }: { id: string; name: string; label: string; state: FormState; children: (a: A11y) => React.ReactNode }) {
  const error = state.fields?.[name];
  return (
    <div className="pad-line" data-invalid={error ? '' : undefined}>
      <label className="pad-mini" htmlFor={id}>
        {label}
      </label>
      {children({ id, name, 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? `${id}-err` : undefined, defaultValue: state.values?.[name] })}
      {error && (
        <p className="field-err" id={`${id}-err`}>
          {error}
        </p>
      )}
    </div>
  );
}

const kb = (n: number) => `${Math.max(1, Math.round(n / 1024)).toLocaleString('fr-FR')} Ko`;

/**
 * Demande de gâteau sur mesure, présentée comme un bloc-note : toutes les questions sont visibles,
 * on répond dans l'ordre, sans étapes ni photos.
 * Sans JavaScript, le formulaire s'envoie normalement (Server Action) ; avec, les images jointes sont compressées.
 */
export function CustomRequestForm({ types, minDate }: { types: string[]; minDate: string }) {
  const [state, action, pending] = useActionState(submitCustomRequest, initial);
  const [enhanced, setEnhanced] = useState(false);
  const [type, setType] = useState('');
  const [files, setFiles] = useState<{ file: File; name: string; key: string }[]>([]);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setEnhanced(true);
    const t = new URLSearchParams(window.location.search).get('type');
    if (t && types.includes(t)) setType(t);
  }, [types]);

  // Après un refus du serveur : la valeur choisie revient, et le curseur va à la première réponse à corriger.
  useEffect(() => {
    if (state.values?.type) setType(state.values.type);
    if (!state.fields) return;
    const first = form.current?.querySelector<HTMLElement>('[data-invalid] :is(input, textarea)');
    first?.focus();
    first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [state]);

  async function addFiles(list: FileList | null) {
    if (!list) return;
    const room = MAX_IMAGES - files.length;
    const picked = [...list].filter((f) => /^image\//.test(f.type)).slice(0, room);
    const ready = await Promise.all(picked.map(async (f) => ({ file: await compressImage(f), name: f.name, key: `${f.name}-${f.size}-${f.lastModified}` })));
    setFiles((cur) => [...cur, ...ready.filter((r) => !cur.some((c) => c.key === r.key))]);
  }

  if (state.status === 'success')
    return (
      <div className="form-done pad-done" role="status" tabIndex={-1} ref={(el) => el?.focus()}>
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

  return (
    <form
      ref={form}
      action={action}
      className="pad"
      data-enhanced={enhanced || undefined}
      onSubmit={(e) => {
        if (!enhanced) return;
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.delete('images');
        files.forEach((f) => fd.append('images', f.file));
        startTransition(() => action(fd));
      }}
    >
      <div className="pad-head">
        <p className="pad-title">Ma commande de gâteau</p>
        <p className="pad-sub">Le Duo d’Artisans · Rantigny</p>
      </div>

      <div className="pad-body">
        <FormMessage state={state} />

        <ol className="pad-list">
          <li className="pad-q" data-invalid={state.fields?.type ? '' : undefined}>
            <span className="pad-n" aria-hidden="true">1</span>
            <fieldset className="pad-set" aria-describedby={state.fields?.type ? 'cr-type-err' : undefined}>
              <legend className="pad-label">Quel gâteau souhaitez-vous ?</legend>
              <div className="pad-chips">
                {types.map((t, i) => (
                  <label key={t} className="pad-chip">
                    <input type="radio" name="type" value={t} required={i === 0} checked={type === t} onChange={() => setType(t)} />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {state.fields?.type && (
              <p className="field-err" id="cr-type-err">
                {state.fields.type}
              </p>
            )}
          </li>

          <Question n={2} id="cr-date" name="desiredDate" label="Pour quelle date ?" hint={`Au plus tôt le ${formatDate(minDate)}. Le gâteau se retire en boutique.`} state={state}>
            {(a) => <input {...a} className="pad-input pad-input--date" type="date" min={minDate} required />}
          </Question>

          <Question n={3} id="cr-servings" name="servings" label="Pour combien de personnes ?" state={state}>
            {(a) => (
              <span className="pad-inline">
                <input {...a} className="pad-input pad-input--num" type="number" inputMode="numeric" min={1} max={300} step={1} required />
                <span aria-hidden="true">personnes</span>
              </span>
            )}
          </Question>

          <Question n={4} id="cr-flavors" name="flavors" label="Quelles saveurs vous font envie ?" optional state={state}>
            {(a) => <input {...a} className="pad-input" maxLength={300} placeholder="Chocolat, fruits rouges, vanille…" />}
          </Question>

          <Question n={5} id="cr-theme" name="theme" label="Un thème, des couleurs ?" optional state={state}>
            {(a) => <input {...a} className="pad-input" maxLength={200} placeholder="Licorne, bleu et blanc, champêtre…" />}
          </Question>

          <Question n={6} id="cr-inscription" name="inscription" label="Un texte à écrire sur le gâteau ?" optional state={state}>
            {(a) => <input {...a} className="pad-input" maxLength={120} placeholder="Joyeux anniversaire Léa" />}
          </Question>

          <Question n={7} id="cr-budget" name="budget" label="Un budget en tête ?" optional state={state}>
            {(a) => <input {...a} className="pad-input" maxLength={60} placeholder="Ex. 60 €" />}
          </Question>

          <Question n={8} id="cr-comment" name="comment" label="Une allergie, une contrainte, une idée ?" optional state={state}>
            {(a) => <textarea {...a} className="pad-input pad-area" rows={3} maxLength={2000} placeholder="Tout ce qui peut nous aider à préparer votre gâteau." />}
          </Question>

          <li className="pad-q">
            <span className="pad-n" aria-hidden="true">9</span>
            <p className="pad-label" id="cr-files-label">
              Une image pour nous inspirer ?<span className="pad-opt">facultatif</span>
            </p>
            {files.length > 0 && (
              <ul className="pad-files" aria-labelledby="cr-files-label">
                {files.map((f) => (
                  <li key={f.key}>
                    <span className="pad-file-name">{f.name}</span>
                    <span className="pad-file-size">{kb(f.file.size)}</span>
                    <button type="button" className="pad-file-x" aria-label={`Retirer ${f.name}`} onClick={() => setFiles((cur) => cur.filter((x) => x !== f))}>
                      <CloseIcon />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {files.length < MAX_IMAGES && (
              <label className="pad-attach">
                <input
                  type="file"
                  name="images"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  aria-describedby="cr-files-hint"
                  onChange={(e) => {
                    if (!enhanced) return;
                    addFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
                <span>+ Joindre une image</span>
              </label>
            )}
            <p className="pad-hint" id="cr-files-hint">
              Une photo trouvée en ligne, un dessin… {MAX_IMAGES} au maximum, vues uniquement par la boutique.
            </p>
          </li>

          <li className="pad-q">
            <span className="pad-n" aria-hidden="true">10</span>
            <fieldset className="pad-set">
              <legend className="pad-label">À qui la boutique répond-elle ?</legend>
              <div className="pad-grid">
                <Line id="cr-first" name="firstName" label="Prénom" state={state}>
                  {(a) => <input {...a} className="pad-input" autoComplete="given-name" maxLength={60} required />}
                </Line>
                <Line id="cr-last" name="lastName" label="Nom" state={state}>
                  {(a) => <input {...a} className="pad-input" autoComplete="family-name" maxLength={60} required />}
                </Line>
                <Line id="cr-phone" name="phone" label="Téléphone" state={state}>
                  {(a) => <input {...a} className="pad-input" type="tel" autoComplete="tel" maxLength={25} pattern="[0-9 +.\-]{9,25}" required />}
                </Line>
                <Line id="cr-email" name="email" label="E-mail" state={state}>
                  {(a) => <input {...a} className="pad-input" type="email" autoComplete="email" maxLength={160} required />}
                </Line>
              </div>
            </fieldset>
          </li>
        </ol>

        <Honeypot />
        <Turnstile />

        <div className="pad-foot">
          <p className="pad-notice">
            <strong>C’est une demande, pas encore une commande.</strong> La boutique vous recontacte pour confirmer faisabilité, délai et prix. Rien n’est à
            payer en ligne.
          </p>
          <button type="submit" className="btn btn--primary pad-send" disabled={pending}>
            {pending ? 'Envoi…' : 'Envoyer ma demande'} <Arrow />
          </button>
        </div>
      </div>
    </form>
  );
}
