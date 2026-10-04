/** Transition entre pages : chaque navigation remonte ce gabarit, qui rejoue un fondu montant (CSS). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page">{children}</div>;
}
