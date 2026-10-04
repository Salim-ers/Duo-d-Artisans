import Link from 'next/link';
import type { ReactNode } from 'react';
import type { CustomStatus, OrderStatus, PaymentStatus } from '@/lib/db/schema';
import { customStatusLabel, orderStatusLabel, paymentStatusLabel } from '@/lib/labels';

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={'abadge abadge--' + status}>{orderStatusLabel[status]}</span>;
}

export function PayBadge({ status }: { status: PaymentStatus }) {
  return <span className={'abadge abadge--pay-' + status}>{paymentStatusLabel[status]}</span>;
}

export function CustomBadge({ status }: { status: CustomStatus }) {
  return <span className={'abadge abadge--c-' + status}>{customStatusLabel[status]}</span>;
}

export function DemoTag({ show }: { show: boolean }) {
  return show ? <span className="atag atag--demo">Exemple</span> : null;
}

export function PageTitle({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <header className="apage-head">
      <div>
        <h1 className="apage-title">{title}</h1>
        {sub && <p className="apage-sub">{sub}</p>}
      </div>
      {children && <div className="apage-actions">{children}</div>}
    </header>
  );
}

export function Card({ title, children, action, className = '', id }: { title?: ReactNode; children: ReactNode; action?: ReactNode; className?: string; id?: string }) {
  return (
    <section className={'acard ' + className} id={id}>
      {(title || action) && (
        <div className="acard-head">
          {title && <h2 className="acard-title">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, href, tone, delta }: { label: string; value: ReactNode; href?: string; tone?: 'warn' | 'ok' | 'info' | 'muted' | 'accent'; delta?: { text: string; dir: 'up' | 'down' | 'flat' } }) {
  const body = (
    <>
      <span className="akpi-label">{label}</span>
      <span className="akpi-value">{value}</span>
      {delta && (
        <span className="akpi-delta" data-up={delta.dir === 'up' || undefined} data-down={delta.dir === 'down' || undefined}>
          {delta.text}
        </span>
      )}
    </>
  );
  const cls = 'akpi' + (tone ? ' akpi--' + tone : '');
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="aempty">{children}</p>;
}

/** Champ libellé de formulaire de gestion. */
export function F({ label, children, full, hint }: { label: string; children: ReactNode; full?: boolean; hint?: string }) {
  return (
    <label className={'afield' + (full ? ' afield--full' : '')}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
