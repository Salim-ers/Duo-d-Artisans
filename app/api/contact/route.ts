import { NextResponse } from 'next/server';
import { contactSchema, orderSchema } from '@/lib/validation';

/**
 * Réception des demandes du site.
 * AUCUNE clé n'est écrite en dur : renseigner RESEND_API_KEY et CONTACT_TO_EMAIL
 * dans les variables d'environnement pour activer l'envoi réel.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });

  const parsed = orderSchema.safeParse(body).success
    ? orderSchema.safeParse(body)
    : contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides.', issues: parsed.error.issues }, { status: 422 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!apiKey || !to) {
    // Tant que la boîte de réception n'est pas configurée, on ne prétend pas avoir envoyé.
    console.info('[contact] demande reçue (envoi désactivé)', parsed.data);
    return NextResponse.json(
      { ok: false, error: "L'envoi d'e-mail n'est pas encore configuré." },
      { status: 503 },
    );
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Site Le Duo d’Artisans <site@leduodartisans.fr>',
      to: [to],
      subject: `Nouvelle demande — ${'type' in parsed.data ? parsed.data.type : parsed.data.sujet}`,
      text: Object.entries(parsed.data).map(([key, value]) => `${key} : ${value}`).join('\n'),
    }),
  });

  if (!response.ok) return NextResponse.json({ error: 'Envoi impossible.' }, { status: 502 });
  return NextResponse.json({ ok: true });
}
