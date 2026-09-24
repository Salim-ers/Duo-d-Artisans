'use client';

import { contactSchema } from '@/lib/validation';
import { useFormState } from './useFormState';
import { Arrow } from '@/components/ui/Arrow';

export function ContactForm() {
  const { status, message, errors, submit } = useFormState(contactSchema, '/api/contact');

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="field" data-invalid={Boolean(errors.prenom)}>
        <label htmlFor="c-prenom">Prénom <span className="req">*</span></label>
        <input id="c-prenom" name="prenom" autoComplete="given-name" />
        <span className="err">{errors.prenom}</span>
      </div>
      <div className="field" data-invalid={Boolean(errors.nom)}>
        <label htmlFor="c-nom">Nom <span className="req">*</span></label>
        <input id="c-nom" name="nom" autoComplete="family-name" />
        <span className="err">{errors.nom}</span>
      </div>
      <div className="field" data-invalid={Boolean(errors.telephone)}>
        <label htmlFor="c-tel">Téléphone</label>
        <input id="c-tel" name="telephone" type="tel" autoComplete="tel" />
        <span className="err">{errors.telephone}</span>
      </div>
      <div className="field" data-invalid={Boolean(errors.email)}>
        <label htmlFor="c-email">E-mail <span className="req">*</span></label>
        <input id="c-email" name="email" type="email" autoComplete="email" />
        <span className="err">{errors.email}</span>
      </div>
      <div className="field full" data-invalid={Boolean(errors.sujet)}>
        <label htmlFor="c-sujet">Sujet <span className="req">*</span></label>
        <input id="c-sujet" name="sujet" />
        <span className="err">{errors.sujet}</span>
      </div>
      <div className="field full" data-invalid={Boolean(errors.message)}>
        <label htmlFor="c-message">Message <span className="req">*</span></label>
        <textarea id="c-message" name="message" />
        <span className="err">{errors.message}</span>
      </div>

      <p className="form-note">
        Pour une réponse immédiate, le téléphone reste le plus simple : 03 44 28 55 61.
      </p>
      {status !== 'idle' && (
        <p className={`form-status ${status === 'success' ? 'ok' : status === 'error' ? 'ko' : ''}`} role="status" aria-live="polite">
          {message}
        </p>
      )}
      <div className="field full">
        <button className="btn btn--primary" type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Envoi…' : 'Envoyer ma demande'}<Arrow />
        </button>
      </div>
    </form>
  );
}
