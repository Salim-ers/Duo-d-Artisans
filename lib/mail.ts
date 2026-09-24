import 'server-only';

/**
 * Envoi via l'API Resend, uniquement côté serveur.
 * Variables (Vercel → Settings → Environment Variables, jamais en NEXT_PUBLIC_*) :
 *   RESEND_API_KEY     clé secrète Resend
 *   CONTACT_TO_EMAIL   boîte qui reçoit les demandes
 *   CONTACT_FROM_EMAIL expéditeur sur un domaine vérifié chez Resend
 */
export async function sendMail({ subject, lines, replyTo }: { subject: string; lines: [string, string | number | undefined][]; replyTo?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || 'Site Le Duo d’Artisans <onboarding@resend.dev>';
  if (!apiKey || !to) throw new Error('mail-not-configured');

  const body = lines
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([label, value]) => `${label} : ${value}`)
    .join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text: body, ...(replyTo ? { reply_to: replyTo } : {}) }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`mail-${res.status}`);
}
