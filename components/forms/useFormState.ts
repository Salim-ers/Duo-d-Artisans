'use client';

import { useState } from 'react';
import type { ZodSchema } from 'zod';

export type Status = 'idle' | 'loading' | 'success' | 'error';

/** Petite fabrique commune aux deux formulaires : validation Zod + états d'envoi. */
export function useFormState<T>(schema: ZodSchema<T>, endpoint: string) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      setStatus('error');
      setMessage('Quelques champs sont à compléter avant l’envoi.');
      return;
    }

    setErrors({});
    setStatus('loading');
    setMessage('Envoi en cours…');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) throw new Error(await response.text());
      setStatus('success');
      setMessage('Demande envoyée. La boutique vous recontacte pour confirmer.');
      form.reset();
    } catch {
      setStatus('error');
      setMessage('L’envoi n’a pas abouti. Appelez directement la boutique au 03 44 28 55 61.');
    }
  }

  return { status, message, errors, submit };
}
