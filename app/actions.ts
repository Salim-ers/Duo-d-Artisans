'use server';

import { headers } from 'next/headers';
import { orderSchema, contactSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { sendMail } from '@/lib/mail';
import { site } from '@/data/site';

export type FormState = {
  status: 'idle' | 'success' | 'error';
  message: string;
  fieldErrors?: Record<string, string>;
  /** Valeurs saisies, renvoyées en cas d'erreur pour ne rien faire retaper. */
  values?: Record<string, string>;
};

const GENERIC_ERROR = `Une erreur est survenue. Réessayez, ou appelez la boutique au ${site.phone.display}.`;
const MAX_FIELD = 4000;

/** Lecture défensive du formulaire : uniquement des chaînes, tronquées. */
function readForm(formData: FormData, keys: string[]) {
  const values: Record<string, string> = {};
  for (const key of keys) {
    const raw = formData.get(key);
    values[key] = typeof raw === 'string' ? raw.slice(0, MAX_FIELD) : '';
  }
  return values;
}

async function clientIp() {
  const h = await headers();
  return h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

function fieldErrorsOf(issues: { path: (string | number)[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0]);
    errors[key] ??= issue.message;
  }
  return errors;
}

/** Contrôles communs : honeypot, débit, Turnstile. Renvoie un état final ou null pour continuer. */
async function guard(formData: FormData, values: Record<string, string>, success: FormState): Promise<FormState | null> {
  // Robot : on simule un succès pour ne pas l'aider à s'adapter.
  if (values.site_web) return success;

  const ip = await clientIp();
  if (!rateLimit(ip)) {
    return { status: 'error', message: `Trop de demandes en peu de temps. Réessayez plus tard ou appelez le ${site.phone.display}.`, values };
  }
  const token = formData.get('cf-turnstile-response');
  if (!(await verifyTurnstile(typeof token === 'string' ? token : null, ip))) {
    return { status: 'error', message: GENERIC_ERROR, values };
  }
  return null;
}

export async function submitOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = readForm(formData, ['occasion', 'personnes', 'date', 'creation', 'prenom', 'nom', 'telephone', 'email', 'message', 'site_web']);
  const success: FormState = {
    status: 'success',
    message: 'Votre demande a bien été transmise. Elle n’est pas encore une commande : la boutique vous recontacte pour la confirmer.',
  };

  const blocked = await guard(formData, values, success);
  if (blocked) return blocked;

  const parsed = orderSchema.safeParse(values);
  if (!parsed.success) {
    return { status: 'error', message: 'Quelques informations sont à vérifier.', fieldErrors: fieldErrorsOf(parsed.error.issues), values };
  }

  const d = parsed.data;
  try {
    await sendMail({
      subject: `Demande de commande — ${d.occasion} — ${d.date}`,
      replyTo: d.email,
      lines: [
        ['Occasion', d.occasion],
        ['Nombre de personnes', d.personnes],
        ['Date souhaitée', d.date],
        ['Type de création', d.creation],
        ['Prénom', d.prenom],
        ['Nom', d.nom],
        ['Téléphone', d.telephone],
        ['E-mail', d.email],
        ['Message', d.message],
      ],
    });
  } catch (error) {
    console.error('[commande] envoi impossible', error instanceof Error ? error.message : 'unknown');
    return { status: 'error', message: GENERIC_ERROR, values };
  }
  return success;
}

export async function submitContact(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = readForm(formData, ['prenom', 'nom', 'telephone', 'email', 'sujet', 'message', 'site_web']);
  const success: FormState = { status: 'success', message: 'Message envoyé. La boutique vous répondra dès que possible.' };

  const blocked = await guard(formData, values, success);
  if (blocked) return blocked;

  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    return { status: 'error', message: 'Quelques informations sont à vérifier.', fieldErrors: fieldErrorsOf(parsed.error.issues), values };
  }

  const d = parsed.data;
  try {
    await sendMail({
      subject: `Message du site — ${d.sujet}`,
      replyTo: d.email,
      lines: [
        ['Sujet', d.sujet],
        ['Prénom', d.prenom],
        ['Nom', d.nom],
        ['E-mail', d.email],
        ['Téléphone', d.telephone],
        ['Message', d.message],
      ],
    });
  } catch (error) {
    console.error('[contact] envoi impossible', error instanceof Error ? error.message : 'unknown');
    return { status: 'error', message: GENERIC_ERROR, values };
  }
  return success;
}
