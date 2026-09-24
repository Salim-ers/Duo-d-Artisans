/** Marqueur de section : une incision de lame, pas un label décoratif. */
export function SectionMark({ children }: { children: React.ReactNode }) {
  return <p className="mark reveal">{children}</p>;
}
