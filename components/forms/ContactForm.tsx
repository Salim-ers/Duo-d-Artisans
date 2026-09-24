'use client';

import { useActionState } from 'react';
import { submitContact, type FormState } from '@/app/actions';
import { subjects, LIMITS } from '@/lib/form-options';
import { Field, Honeypot, Turnstile, FormMessage } from './parts';
import { Arrow } from '@/components/ui/Arrow';

const initial: FormState = { status: 'idle', message: '' };

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initial);

  if (state.status === 'success') {
    return (
      <div className="form-done" role="status" tabIndex={-1} ref={(el) => el?.focus()}>
        <p className="form-done-title">Message envoyé.</p>
        <p>{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="contact-form">
      <FormMessage state={state} />
      <div className="fields-2">
        <Field id="c-prenom" name="prenom" label="Prénom" state={state}>
          {(a) => <input {...a} autoComplete="given-name" maxLength={LIMITS.name} required />}
        </Field>
        <Field id="c-nom" name="nom" label="Nom" state={state}>
          {(a) => <input {...a} autoComplete="family-name" maxLength={LIMITS.name} required />}
        </Field>
        <Field id="c-email" name="email" label="E-mail" state={state}>
          {(a) => <input {...a} type="email" autoComplete="email" maxLength={254} required />}
        </Field>
        <Field id="c-tel" name="telephone" label="Téléphone" optional state={state}>
          {(a) => <input {...a} type="tel" autoComplete="tel" maxLength={25} pattern="[0-9 +().\-]{9,25}" />}
        </Field>
      </div>
      <Field id="c-sujet" name="sujet" label="Sujet" state={state}>
        {(a) => (
          <select {...a} required defaultValue={a.defaultValue ?? ''}>
            <option value="" disabled>Choisir…</option>
            {subjects.map((s) => <option key={s}>{s}</option>)}
          </select>
        )}
      </Field>
      <Field id="c-message" name="message" label="Message" state={state}>
        {(a) => <textarea {...a} rows={6} minLength={10} maxLength={LIMITS.contactMessage} required />}
      </Field>
      <Honeypot />
      <Turnstile />
      <button type="submit" className="btn btn--primary" disabled={pending}>
        {pending ? 'Envoi…' : 'Envoyer le message'} <Arrow />
      </button>
    </form>
  );
}
