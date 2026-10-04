/** Icônes au trait de la gestion (17 px). */
const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const paths: Record<string, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="8" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
      <rect x="3.5" y="14.5" width="7" height="6" rx="1.5" />
    </>
  ),
  orders: (
    <>
      <path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 11.5h6M9 15h3" />
    </>
  ),
  production: (
    <>
      <path d="M7 10a5 5 0 1 1 10 0v1H7z" />
      <path d="M7 11v6.5h10V11M9.5 20.5h5" />
    </>
  ),
  sheet: (
    <>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  planning: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4M7.5 14h3M13.5 14h3M7.5 17h3" />
    </>
  ),
  clients: (
    <>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M3 20a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a5.5 5.5 0 0 1 3 5.5" />
    </>
  ),
  products: (
    <>
      <path d="M4 9.5c0-3 3.6-5.5 8-5.5s8 2.5 8 5.5v1.5H4z" />
      <path d="M5 11v7.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V11" />
    </>
  ),
  categories: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  stock: (
    <>
      <path d="M3.5 8 12 3.5 20.5 8v9L12 21.5 3.5 17z" />
      <path d="M3.5 8 12 12.5 20.5 8M12 12.5v9" />
    </>
  ),
  cake: (
    <>
      <path d="M4 20.5h16M5 20.5v-6.5h14v6.5M7 14v-3.5h10V14" />
      <path d="M12 10.5V7.5M12 3.5c1 1 1 2.5 0 3-1-.5-1-2 0-3z" />
    </>
  ),
  events: <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z" />,
  promotions: (
    <>
      <path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8L21 12l-8.5 8.5z" />
      <circle cx="8.5" cy="8.5" r="1.5" />
    </>
  ),
  messages: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  stats: <path d="M4 20.5h16M7 17v-5M12 17V7M17 17v-8" />,
  gallery: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="9.5" r="1.8" />
      <path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
};

export function AIcon({ name, className }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...p}>
      {paths[name] ?? paths.dashboard}
    </svg>
  );
}
