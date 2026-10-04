import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { requireAction } from '@/lib/auth/session';
import { productionSheet } from '@/lib/admin';
import { isIsoDate, today } from '@/lib/dates';
import { capitalize, formatDate, formatTime } from '@/lib/format';
import { site } from '@/data/site';

/** Caractères hors WinAnsi (police standard du PDF) remplacés proprement. */
const WIN_ANSI_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
const clean = (t: string) =>
  t
    .replace(/[\u202f\u00a0]/g, ' ')
    .split('')
    .map((c) => {
      const code = c.charCodeAt(0);
      return (code < 0x80 || (code >= 0xa0 && code <= 0xff) || WIN_ANSI_EXTRA.includes(c)) ? c : '?';
    })
    .join('');

/** Feuille de production en PDF (A4) : totaux à fabriquer, puis détail par heure de retrait. */
export async function GET(req: Request) {
  try {
    await requireAction('STAFF');
  } catch {
    return new Response('Non autorisé', { status: 401 });
  }
  const param = new URL(req.url).searchParams.get('date') ?? '';
  const date = isIsoDate(param) ? param : today();
  const sheet = await productionSheet(date);

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Feuille de production — ${date}`);
  pdf.setAuthor(site.displayName);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.11, 0.09, 0.07);
  const muted = rgb(0.4, 0.36, 0.32);
  const line = rgb(0.85, 0.82, 0.77);

  const W = 595.28;
  const H = 841.89;
  const M = 48;
  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;

  const ensure = (needed: number) => {
    if (y - needed < M) {
      page = pdf.addPage([W, H]);
      y = H - M;
    }
  };
  const text = (t: string, x: number, size: number, font: PDFFont = regular, color = ink) => page.drawText(clean(t), { x, y, size, font, color });
  const right = (t: string, xRight: number, size: number, font: PDFFont = regular) => {
    const s = clean(t);
    page.drawText(s, { x: xRight - font.widthOfTextAtSize(s, size), y, size, font, color: ink });
  };
  const rule = () => page.drawLine({ start: { x: M, y: y + 6 }, end: { x: W - M, y: y + 6 }, thickness: 0.6, color: line });

  text(site.displayName.toUpperCase(), M, 9, bold, muted);
  y -= 26;
  text(capitalize(formatDate(date, 'full')).toUpperCase(), M, 20, bold);
  y -= 18;
  text(`Feuille de production — ${sheet.orderCount} commande(s)`, M, 10, regular, muted);
  y -= 30;

  if (!sheet.products.length && !sheet.custom.length) {
    text('Aucune commande pour cette date.', M, 12);
  }

  let category = '';
  for (const p of sheet.products) {
    ensure(40 + p.detail.length * 14);
    if (p.category !== category) {
      category = p.category;
      y -= 6;
      text(category.toUpperCase(), M, 9, bold, muted);
      y -= 16;
    }
    rule();
    text(p.name, M, 13, bold);
    right(String(p.qty), W - M, 15, bold);
    y -= 18;
    for (const d of p.detail) {
      text(`· ${d.label}`, M + 12, 10, regular, muted);
      right(String(d.qty), W - M, 10);
      y -= 14;
    }
  }

  if (sheet.custom.length) {
    ensure(60);
    y -= 14;
    text('COMMANDES PERSONNALISÉES', M, 9, bold, muted);
    y -= 18;
    for (const c of sheet.custom) {
      ensure(40);
      rule();
      text(`${c.pickupTime ? formatTime(c.pickupTime) + ' — ' : ''}${c.type} · ${c.servings} pers.`, M, 12, bold);
      y -= 15;
      const info = [c.flavors, c.theme, c.inscription ? `« ${c.inscription} »` : null].filter(Boolean).join(' · ');
      if (info) {
        text(info.slice(0, 110), M + 12, 10, regular, muted);
        y -= 15;
      }
    }
  }

  if (sheet.slots.length) {
    ensure(60);
    y -= 18;
    text('DÉTAIL PAR HEURE DE RETRAIT', M, 9, bold, muted);
    y -= 18;
    for (const [time, orders] of sheet.slots) {
      ensure(30);
      rule();
      text(formatTime(time), M, 13, bold);
      y -= 16;
      for (const o of orders) {
        const items = o.items.map((i) => `${i.quantity} × ${i.name}${i.variantLabel ? ' (' + i.variantLabel + ')' : ''}${i.options ? ' [' + i.options + ']' : ''}`);
        ensure(14 + items.length * 13);
        text(`${o.number} — ${o.lastName.toUpperCase()} ${o.firstName}`, M + 12, 10, bold);
        y -= 13;
        for (const it of items) {
          text(it.slice(0, 100), M + 24, 9.5);
          y -= 12;
        }
        if (o.customerNote) {
          text(`Note : ${o.customerNote}`.slice(0, 110), M + 24, 9, regular, muted);
          y -= 12;
        }
        y -= 4;
      }
    }
  }

  const bytes = await pdf.save();
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="production-${date}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
