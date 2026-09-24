'use client';

import Script from 'next/script';
import type { FormState } from '@/app/actions';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type FieldProps = {
  id: string;
  label: string;
  state: FormState;
  name: string;
  hint?: string;
  optional?: boolean;
  children: (a11y: { id: string; name: string; 'aria-invalid'?: true; 'aria-describedby'?: string; defaultValue?: string }) => React.ReactNode;
};

/** Champ libellé, avec message d'erreur relié (aria-describedby) et valeur restaurée après erreur. */
export function Field({ id, label, state, name, hint, optional, children }: FieldProps) {
  const error = state.fieldErrors?.[name];
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field" data-invalid={error ? '' : undefined}>
      <label htmlFor={id}>
        {label}
        {optional && <span className="field-opt"> — facultatif</span>}
      </label>
      {hint && <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
      {children({ id, name, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy, defaultValue: state.values?.[name] })}
      {error && <p className="field-err" id={`${id}-err`}>{error}</p>}
    </div>
  );
}

/** Champ piège anti-robots : hors écran, hors tabulation, ignoré des lecteurs d'écran. */
export function Honeypot() {
  return (
    <div className="hp" aria-hidden="true">
      <label>
        Site web
        <input type="text" name="site_web" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

/** Cloudflare Turnstile, chargé uniquement si une clé publique est configurée. */
export function Turnstile() {
  if (!TURNSTILE_SITE_KEY) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-language="fr" />
    </>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.status !== 'error') return null;
  return <p className="form-error" role="alert">{state.message}</p>;
}
