'use client';

import { useActionState } from 'react';
import { login } from '../actions';

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null as { error?: string } | null);
  return (
    <form action={action} className="aform">
      {state?.error && (
        <p className="aerr" role="alert">
          {state.error}
        </p>
      )}
      <label className="afield">
        <span>E-mail</span>
        <input name="email" type="email" autoComplete="username" required maxLength={160} autoFocus />
      </label>
      <label className="afield">
        <span>Mot de passe</span>
        <input name="password" type="password" autoComplete="current-password" required maxLength={200} />
      </label>
      <button type="submit" className="abtn abtn--lg abtn--block" disabled={pending}>
        {pending ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  );
}
