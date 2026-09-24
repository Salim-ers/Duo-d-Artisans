'use client';

import { orderSchema } from '@/lib/validation';
import { useFormState } from './useFormState';
import { Arrow } from '@/components/ui/Arrow';

export function OrderForm() {
  const { status, message, errors, submit } = useFormState(orderSchema, '/api/contact');

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="field" data-invalid={Boolean(errors.prenom)}>
        <label htmlFor="prenom">Prénom <span className="req">*</span></label>
        <input id="prenom" name="prenom" autoComplete="given-name" aria-describedby="err-prenom" />
        <span className="err" id="err-prenom">{errors.prenom}</span>
      </div>
      <div className="field" data-invalid={Boolean(errors.nom)}>
        <label htmlFor="nom">Nom <span className="req">*</span></label>
        <input id="nom" name="nom" autoComplete="family-name" aria-describedby="err-nom" />
        <span className="err" id="err-nom">{errors.nom}</span>
      </div>
      <div className="field" data-invalid={Boolean(errors.telephone)}>
        <label htmlFor="telephone">Téléphone <span className="req">*</span></label>
        <input id="telephone" name="telephone" type="tel" autoComplete="tel" aria-describedby="err-telephone" />
        <span className="err" id="err-telephone">{errors.telephone}</span>
      </div>
      <div className="field" data-invalid={Boolean(errors.email)}>
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="email" aria-describedby="err-email" />
        <span className="err" id="err-email">{errors.email}</span>
      </div>
      <div className="field">
        <label htmlFor="type">Type de demande</label>
        <select id="type" name="type" defaultValue="Anniversaire">
          <option>Anniversaire</option><option>Événement</option><option>Gâteau</option>
          <option>Traiteur</option><option>Autre</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="date">Date souhaitée</label>
        <input id="date" name="date" type="date" />
      </div>
      <div className="field">
        <label htmlFor="personnes">Nombre approximatif de personnes</label>
        <input id="personnes" name="personnes" type="number" min={1} inputMode="numeric" />
      </div>
      <div className="field full" data-invalid={Boolean(errors.message)}>
        <label htmlFor="message">Message <span className="req">*</span></label>
        <textarea id="message" name="message" aria-describedby="err-message" />
        <span className="err" id="err-message">{errors.message}</span>
      </div>

      <p className="form-note">
        Cette demande ne constitue pas une commande ferme. Votre demande sera confirmée directement
        par la boutique, qui vous précisera possibilités, disponibilités, délais et tarifs.
      </p>
      {status !== 'idle' && (
        <p className={`form-status ${status === 'success' ? 'ok' : status === 'error' ? 'ko' : ''}`} role="status" aria-live="polite">
          {message}
        </p>
      )}
      <div className="field full">
        <button className="btn btn--primary" type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Envoi…' : 'Parler de mon projet'}<Arrow />
        </button>
      </div>
    </form>
  );
}
