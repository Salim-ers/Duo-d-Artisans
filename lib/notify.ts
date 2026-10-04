import 'server-only';
/**
 * Notifications : e-mail (Resend), push (équipe), tableau de bord.
 * Chaque envoi est tracé dans la table `notifications`. Sans fournisseur configuré,
 * l'envoi est journalisé « skipped » : rien n'est perdu, rien n'est prétendu envoyé.
 */
import { fullAddress, site } from '@/data/site';
import { getDb, schema as s } from '@/lib/db';
import type { CustomOrder } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { formatDate, formatTime, money } from '@/lib/format';
import { pushToStaff } from '@/lib/push';
import { logError } from '@/lib/security';
import { getSetting } from '@/lib/settings';

type Ref = { customOrderId?: string | null; isDemo?: boolean };

async function record(v: typeof s.notifications.$inferInsert) {
  try {
    const db = await getDb();
    await db.insert(s.notifications).values(v);
  } catch (e) {
    logError('notify.record', e);
  }
}

export type Mail = { subject: string; html: string; text: string };

export async function sendEmail(to: string, type: string, mail: Mail, ref: Ref = {}, audience: 'customer' | 'staff' = 'customer') {
  const base = { channel: 'email' as const, audience, type, recipient: to, subject: mail.subject, body: mail.text, ...ref };
  if (!env.resendKey) {
    if (!env.isProd) console.info(`[email:${type}] → ${to} — ${mail.subject}`);
    return record({ ...base, status: 'skipped', error: 'RESEND_API_KEY non configurée' });
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.emailFrom, to: [to], subject: mail.subject, html: mail.html, text: mail.text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
    await record({ ...base, status: 'sent' });
  } catch (e) {
    logError('notify.email', e);
    await record({ ...base, status: 'failed', error: e instanceof Error ? e.message.slice(0, 500) : 'erreur' });
  }
}

/** Alerte de l'équipe : tableau de bord, push (si installé) et e-mail (si configuré). */
export async function notifyStaff(type: string, subject: string, body: string, href: string, ref: Ref = {}) {
  await record({ channel: 'dashboard', audience: 'staff', type, subject, body, href, status: 'sent', ...ref });
  if (ref.isDemo) return;
  await pushToStaff({ title: subject, body, url: href, tag: type });
  const cfg = await getSetting('notify');
  const to = cfg.staffEmail ?? env.staffEmail;
  if (to) await sendEmail(to, 'staff.' + type, layout(subject, [p(body)], { label: 'Ouvrir dans la gestion', href: env.siteUrl + href }), ref, 'staff');
}

/* ---------- Gabarits ---------- */
const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const p = (t: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3A2E24">${esc(t)}</p>`;

function rows(pairs: [string, string | null | undefined][]) {
  const html = pairs
    .filter((r): r is [string, string] => !!r[1])
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 14px 8px 0;border-bottom:1px solid #EFE7DA;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8A7562;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:8px 0;border-bottom:1px solid #EFE7DA;font-size:14px;color:#2A2018">${esc(v)}</td></tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 20px">${html}</table>`;
}

function layout(title: string, blocks: string[], cta?: { label: string; href: string }): Mail {
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#F3EDE2;font-family:Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3EDE2;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFDF9">
<tr><td style="background:#1C1814;color:#F3EDE2;padding:26px 32px;font-family:Georgia,serif;font-size:24px">Le Duo <em style="color:#C8A263">d’Artisans</em></td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 20px;font-family:Georgia,serif;font-weight:400;font-size:26px;line-height:1.2;color:#1C1814">${esc(title)}</h1>
${blocks.join('')}
${cta ? `<p style="margin:26px 0 0"><a href="${esc(cta.href)}" style="display:inline-block;background:#1C1814;color:#F3EDE2;padding:14px 22px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;text-decoration:none">${esc(cta.label)}</a></p>` : ''}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #E6DCCB;font-size:12px;line-height:1.6;color:#8A7562">${esc(site.displayName)} — ${esc(fullAddress)} — ${esc(site.phone.display)}</td></tr>
</table></td></tr></table></body></html>`;
  const text = [title, '', ...blocks.map((b) => b.replace(/<\/tr>/g, '\n').replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ').trim()), cta ? `${cta.label} : ${cta.href}` : '', '', `${site.displayName} — ${fullAddress} — ${site.phone.display}`].join('\n');
  return { subject: `${title} — ${site.displayName}`, html, text };
}

export const customUrl = (c: Pick<CustomOrder, 'number' | 'accessToken'>) => `${env.siteUrl}/commander/suivi?n=${encodeURIComponent(c.number)}&t=${c.accessToken}`;

export const mails = {
  customReceived: (c: CustomOrder) =>
    layout('Demande reçue', [
      p(`Bonjour ${c.firstName}, merci pour votre demande. Elle n’est pas encore une commande : la boutique l’étudie puis revient vers vous pour confirmer faisabilité et tarif.`),
      rows([
        ['Référence', c.number],
        ['Création', c.type],
        ['Date souhaitée', formatDate(c.desiredDate)],
        ['Personnes', String(c.servings)],
      ]),
    ], { label: 'Suivre ma demande', href: customUrl(c) }),
  customQuote: (c: CustomOrder) =>
    layout('Votre devis', [
      p(`Bonjour ${c.firstName}, voici la proposition de la boutique pour votre demande ${c.number}.`),
      rows([
        ['Création', c.type],
        ['Date', formatDate(c.desiredDate) + (c.pickupTime ? ' à ' + formatTime(c.pickupTime) : '')],
        ['Personnes', String(c.servings)],
        ['Prix', c.quoteCents != null ? money(c.quoteCents) : null],
      ]),
      c.quoteMessage ? p(c.quoteMessage) : '',
      p('Pour valider, acceptez le devis en ligne ou appelez la boutique.'),
    ], { label: 'Voir et accepter le devis', href: customUrl(c) }),
  customStatus: (c: CustomOrder, title: string, line: string) =>
    layout(title, [p(`Bonjour ${c.firstName}, ${line}`), c.quoteMessage ? p(c.quoteMessage) : ''], { label: 'Voir ma demande', href: customUrl(c) }),
};
