'use client';

import { useActionState } from 'react';
import { submitContact, type FormState } from '@/app/(site)/actions';
import { Field, Honeypot, Turnstile, FormMessage } from './parts';
import { Arrow } from '@/components/ui/Arrow';

const initial: FormState = { status: 'idle', message: '' };

/** Formulaire de contact minimal : nom, e-mail, téléphone facultatif, message. */
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
        <Field id="c-name" name="name" label="Nom" state={state}>
          {(a) => <input {...a} autoComplete="name" maxLength={120} required />}
        </Field>
        <Field id="c-email" name="email" label="E-mail" state={state}>
          {(a) => <input {...a} type="email" autoComplete="email" maxLength={160} required />}
        </Field>
      </div>
      <Field id="c-tel" name="phone" label="Téléphone" optional state={state}>
        {(a) => <input {...a} type="tel" autoComplete="tel" maxLength={25} pattern="[0-9 +.\-]{9,25}" />}
      </Field>
      <Field id="c-message" name="message" label="Message" state={state}>
        {(a) => <textarea {...a} rows={5} minLength={10} maxLength={3000} required />}
      </Field>
      <Honeypot />
      <Turnstile />
      <button type="submit" className="btn btn--primary" disabled={pending}>
        {pending ? 'Envoi…' : 'Envoyer'} <Arrow />
      </button>
    </form>
  );
}
