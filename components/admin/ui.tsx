'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { compressImage } from '@/lib/resize-image';
import { AIcon } from './icons';

/* ---------- Barre latérale ---------- */
export type NavItem = { href: string; label: string; icon: string; badge?: number } | { sep: string };

export function Sidebar({ items, user, role, footer }: { items: NavItem[]; user: string; role: string; footer: ReactNode }) {
  const pathname = usePathname() || '/admin';
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const active = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));
  const total = items.reduce((t, i) => t + ('badge' in i && i.badge ? i.badge : 0), 0);
  return (
    <>
      <div className="adm-top">
        <button type="button" className="adm-burger" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
          <AIcon name="menu" />
        </button>
        <Link href="/admin" className="adm-brand">
          Le Duo <em>d’Artisans</em>
        </Link>
        {total > 0 && <span className="adm-pill adm-top-count">{total}</span>}
      </div>
      <aside className="adm-side" data-open={open ? '' : undefined}>
        <div className="adm-side-head">
          <Link href="/admin" className="adm-brand">
            Le Duo <em>d’Artisans</em>
            <span>Gestion</span>
          </Link>
          <button type="button" className="adm-close" onClick={() => setOpen(false)} aria-label="Fermer le menu">
            ×
          </button>
        </div>
        <nav className="adm-nav" aria-label="Gestion">
          {items.map((i) =>
            'sep' in i ? (
              <p key={i.sep} className="adm-nav-sep">
                {i.sep}
              </p>
            ) : (
              <Link key={i.href} href={i.href} className="adm-link" aria-current={active(i.href) ? 'page' : undefined}>
                <AIcon name={i.icon} />
                <span>{i.label}</span>
                {!!i.badge && <span className="adm-pill">{i.badge}</span>}
              </Link>
            ),
          )}
        </nav>
        <div className="adm-user">
          <span className="adm-user-name">{user}</span>
          <span className="adm-user-role">{role}</span>
          <div className="adm-user-links">{footer}</div>
        </div>
      </aside>
      {open && <div className="adm-scrim" onClick={() => setOpen(false)} />}
    </>
  );
}

/* ---------- Messages de retour des actions (?ok= / ?err=) ---------- */
export function Flash() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const ok = params.get('ok');
  const err = params.get('err');
  const [shown, setShown] = useState<{ ok?: string | null; err?: string | null } | null>(null);
  useEffect(() => {
    if (!ok && !err) return;
    setShown({ ok, err });
    const p = new URLSearchParams(params.toString());
    p.delete('ok');
    p.delete('err');
    router.replace(pathname + (p.size ? '?' + p.toString() : ''), { scroll: false });
    const t = window.setTimeout(() => setShown(null), err ? 7000 : 3200);
    return () => window.clearTimeout(t);
  }, [ok, err]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!shown) return null;
  return (
    <div className={'adm-flash' + (shown.err ? ' adm-flash--err' : '')} role={shown.err ? 'alert' : 'status'} onClick={() => setShown(null)}>
      {shown.err ?? shown.ok}
    </div>
  );
}

/* ---------- Notifications en direct ---------- */
type Last = { id: string; type: string; subject: string | null; body: string | null; href: string | null; at: string } | null;

let audio: AudioContext | null = null;
/** Carillon doux de deux notes, joué UNE fois (jamais en boucle). */
function chime(strong = false) {
  try {
    audio ??= new AudioContext();
    const now = audio.currentTime;
    const notes = strong ? [659.25, 880, 1046.5] : [659.25, 880];
    notes.forEach((f, i) => {
      const o = audio!.createOscillator();
      const g = audio!.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, now + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.22, now + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.5);
      o.connect(g).connect(audio!.destination);
      o.start(now + i * 0.18);
      o.stop(now + i * 0.18 + 0.55);
    });
  } catch {
    /* audio indisponible */
  }
}

export function LivePulse({ initial, sound }: { initial: Last; sound: 'off' | 'all' | 'large' }) {
  const router = useRouter();
  const last = useRef(initial?.id ?? null);
  const [toasts, setToasts] = useState<NonNullable<Last>[]>([]);

  useEffect(() => {
    // Le navigateur n'autorise le son qu'après un geste de l'utilisateur.
    const unlock = () => {
      try {
        audio ??= new AudioContext();
        if (audio.state === 'suspended') void audio.resume();
      } catch {
        /* ignoré */
      }
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    const tick = async () => {
      if (document.visibilityState !== 'visible' && !('Notification' in window && Notification.permission === 'granted')) return;
      try {
        const res = await fetch('/api/admin/pulse', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { unread: number; last: Last };
        document.title = (data.unread ? `(${data.unread}) ` : '') + document.title.replace(/^\(\d+\)\s*/, '');
        if (data.last && data.last.id !== last.current) {
          const fresh = data.last;
          const first = last.current === null;
          last.current = fresh.id;
          if (first) return;
          setToasts((t) => [fresh, ...t].slice(0, 3));
          window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== fresh.id)), 9000);
          const important = /^(order|custom)\./.test(fresh.type);
          if (sound === 'all' && important) chime(fresh.type === 'order.large');
          if (sound === 'large' && fresh.type === 'order.large') chime(true);
          if (document.visibilityState !== 'visible' && 'Notification' in window && Notification.permission === 'granted') {
            const n = new Notification(fresh.subject ?? 'Le Duo d’Artisans', { body: fresh.body ?? '', tag: fresh.id, icon: '/icon.svg' });
            n.onclick = () => {
              window.focus();
              if (fresh.href) router.push(fresh.href);
            };
          }
          router.refresh();
        }
      } catch {
        /* réseau momentanément indisponible */
      }
    };
    void tick();
    const t = window.setInterval(tick, 20_000);
    return () => {
      window.clearInterval(t);
      window.removeEventListener('pointerdown', unlock);
    };
  }, [router, sound]);

  if (!toasts.length) return null;
  return (
    <div className="alive" aria-live="assertive">
      {toasts.map((t) => (
        <Link key={t.id} href={t.href ?? '/admin'} onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>
          <span>
            <AIcon name={t.type.startsWith('custom') ? 'cake' : t.type.startsWith('message') ? 'messages' : t.type.startsWith('stock') ? 'stock' : 'orders'} />
          </span>
          <b>{t.subject}</b>
          <small>{t.body}</small>
        </Link>
      ))}
    </div>
  );
}

/** Active les notifications de cet appareil (et le push si configuré) ; enregistre la gestion comme application. */
export function EnableNotifications({ vapidKey }: { vapidKey: string | null }) {
  const [state, setState] = useState<'idle' | 'on' | 'denied' | 'unsupported'>('idle');
  useEffect(() => {
    if (!('Notification' in window)) return setState('unsupported');
    if (Notification.permission === 'granted') setState('on');
    if (Notification.permission === 'denied') setState('denied');
    if ('serviceWorker' in navigator) void navigator.serviceWorker.register('/admin-sw.js', { scope: '/admin/' }).catch(() => undefined);
  }, []);
  const enable = async () => {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return setState(perm === 'denied' ? 'denied' : 'idle');
    setState('on');
    if (!vapidKey || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const reg = await navigator.serviceWorker.register('/admin-sw.js', { scope: '/admin/' });
      await navigator.serviceWorker.ready;
      const key = Uint8Array.from(atob(vapidKey.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (vapidKey.length % 4)) % 4)), (c) => c.charCodeAt(0));
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }));
      await fetch('/api/admin/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub.toJSON()) });
    } catch {
      /* push indisponible : les notifications à l'écran restent actives */
    }
  };
  if (state === 'unsupported') return null;
  if (state === 'on') return <span>Notifications activées</span>;
  if (state === 'denied') return <span title="Autorisez les notifications dans les réglages du navigateur">Notifications bloquées</span>;
  return (
    <button type="button" onClick={enable}>
      Activer les notifications
    </button>
  );
}

/* ---------- Formulaires ---------- */
export function Submit({ children, className = 'abtn', confirm, name, value, title }: { children: ReactNode; className?: string; confirm?: string; name?: string; value?: string; title?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      name={name}
      value={value}
      title={title}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? '…' : children}
    </button>
  );
}

/** Liste déroulante qui enregistre dès qu'on change la valeur (statut rapide). */
export function AutoSelect({ name, defaultValue, options, label }: { name: string; defaultValue: string; options: { value: string; label: string }[]; label: string }) {
  return (
    <select name={name} defaultValue={defaultValue} aria-label={label} onChange={(e) => e.currentTarget.form?.requestSubmit()}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function PrintButton({ label = 'Imprimer' }: { label?: string }) {
  return (
    <button type="button" className="abtn abtn--ghost" onClick={() => window.print()}>
      {label}
    </button>
  );
}

/** Champ image : compression dans le navigateur avant l'envoi, aperçu immédiat. */
export function ImageInput({ name = 'imageFile', current, label = 'Photo' }: { name?: string; current?: string | null; label?: string }) {
  const [preview, setPreview] = useState<string | null>(current ?? null);
  return (
    <div className="afield">
      <span>{label}</span>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="apreview" />
      )}
      <input
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp"
        onChange={async (e) => {
          const input = e.currentTarget;
          const file = input.files?.[0];
          if (!file) return;
          const small = await compressImage(file);
          if (small !== file && typeof DataTransfer !== 'undefined') {
            const dt = new DataTransfer();
            dt.items.add(small);
            input.files = dt.files;
          }
          setPreview(URL.createObjectURL(small));
        }}
      />
      <small>JPG, PNG ou WEBP — compressée automatiquement.</small>
    </div>
  );
}

/** Lignes répétables (formats, options) ajoutées côté client. */
export function RepeatRows({
  initial,
  columns,
  addLabel,
  rowClass = 'arepeat-row',
}: {
  initial: Record<string, string>[];
  columns: { name: string; placeholder: string; type?: string; options?: { value: string; label: string }[]; width?: string }[];
  addLabel: string;
  rowClass?: string;
}) {
  const [rows, setRows] = useState(initial.length ? initial : []);
  return (
    <div className="arepeat">
      {rows.map((r, i) => (
        <div key={(r.id || 'n') + i} className={rowClass}>
          <input type="hidden" name={`${columns[0]!.name.replace(/[A-Z].*/, '')}Id`} value={r.id ?? ''} />
          {columns.map((c) =>
            c.options ? (
              <select key={c.name} name={c.name} defaultValue={r[c.name] ?? c.options[0]?.value} aria-label={c.placeholder}>
                {c.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input key={c.name} name={c.name} defaultValue={r[c.name] ?? ''} placeholder={c.placeholder} aria-label={c.placeholder} inputMode={c.type === 'money' || c.type === 'int' ? 'decimal' : undefined} />
            ),
          )}
          <button type="button" className="abtn abtn--ghost abtn--sm" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="Retirer la ligne">
            ×
          </button>
        </div>
      ))}
      <button type="button" className="abtn abtn--ghost abtn--sm" style={{ alignSelf: 'flex-start' }} onClick={() => setRows([...rows, {}])}>
        + {addLabel}
      </button>
    </div>
  );
}

/** Horloge (mode production). */
export function Clock() {
  const [now, setNow] = useState('');
  useEffect(() => {
    const f = () => setNow(new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).format(new Date()));
    f();
    const t = window.setInterval(f, 15_000);
    return () => window.clearInterval(t);
  }, []);
  return <span className="akitchen-clock">{now}</span>;
}

/** Rafraîchit la page à intervalle régulier quand elle est visible (production, planning). */
export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = window.setInterval(() => document.visibilityState === 'visible' && router.refresh(), seconds * 1000);
    return () => window.clearInterval(t);
  }, [router, seconds]);
  return null;
}

/** Plusieurs photos : compressées dans le navigateur pour rester sous la limite d'envoi. */
export function ImagesInput({ name = 'files', max = 8 }: { name?: string; max?: number }) {
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp"
        multiple
        required
        onChange={async (e) => {
          const input = e.currentTarget;
          const files = [...(input.files ?? [])].slice(0, max);
          setBusy(true);
          const small = await Promise.all(files.map((f) => compressImage(f, 2000, 0.8)));
          if (typeof DataTransfer !== 'undefined') {
            const dt = new DataTransfer();
            small.forEach((f) => dt.items.add(f));
            input.files = dt.files;
          }
          setCount(small.length);
          setBusy(false);
        }}
      />
      <small>{busy ? 'Compression…' : count ? `${count} photo(s) prête(s)` : `JPG, PNG ou WEBP, ${max} maximum — compressées automatiquement.`}</small>
    </>
  );
}
