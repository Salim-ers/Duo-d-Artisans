'use client';

import { useEffect } from 'react';
import { useCart } from './CartProvider';

/** Vide le panier une fois la commande enregistrée (paiement en boutique ou payé en ligne). */
export function ClearCart() {
  const { clear, ready } = useCart();
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);
  return null;
}

/** Ajout au calendrier du téléphone (.ics généré dans le navigateur). */
export function CalendarLink({ title, date, time, location, minutes = 15 }: { title: string; date: string; time: string; location: string; minutes?: number }) {
  const onClick = () => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const start = `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
    const [h, m] = time.split(':').map(Number) as [number, number];
    const endMin = h * 60 + m + minutes;
    const end = `${date.replace(/-/g, '')}T${pad(Math.floor(endMin / 60))}${pad(endMin % 60)}00`;
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Le Duo d’Artisans//Commande//FR',
      'BEGIN:VEVENT',
      `UID:${date}-${time}-${Math.random().toString(36).slice(2)}@leduodartisans`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
      `DTSTART;TZID=Europe/Paris:${start}`,
      `DTEND;TZID=Europe/Paris:${end}`,
      `SUMMARY:${title}`,
      `LOCATION:${location}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'retrait-le-duo-d-artisans.ics';
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  return (
    <button type="button" className="btn btn--line" onClick={onClick}>
      Ajouter à mon agenda
    </button>
  );
}
