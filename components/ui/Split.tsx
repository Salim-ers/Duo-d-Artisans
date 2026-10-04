import { Fragment, type ReactNode } from 'react';

type Line = string | { em: string };

const NBSP = String.fromCharCode(160);
/** Ponctuation haute française (? ! : ; ») collée au mot précédent par une espace insécable. */
const tokens = (text: string) =>
  text.split(' ').reduce<string[]>((out, t) => {
    if (out.length && /^[?!:;»]+$/.test(t)) out[out.length - 1] += NBSP + t;
    else out.push(t);
    return out;
  }, []);

/**
 * Titre révélé mot à mot (chaque mot glisse hors d'un masque). Le texte reste lisible tel quel
 * par les lecteurs d'écran et sans JavaScript. Une ligne = un élément du tableau ; `{ em }` = italique.
 */
export function Split({ as: Tag = 'h2', lines, className = '', id, index = 0 }: { as?: 'h1' | 'h2' | 'h3' | 'p'; lines: Line[]; className?: string; id?: string; index?: number }) {
  let w = 0;
  const words = (text: string, em: boolean): ReactNode =>
    tokens(text).map((word, i, all) => {
      const n = w++;
      const inner = <span style={{ ['--w' as string]: n }}>{word}</span>;
      return (
        <Fragment key={n}>
          <span className="w">{em ? <em>{inner}</em> : inner}</span>
          {i < all.length - 1 ? ' ' : ''}
        </Fragment>
      );
    });
  return (
    <Tag id={id} className={`split ${className}`} data-reveal style={{ ['--i' as string]: index }}>
      {lines.map((l, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {typeof l === 'string' ? words(l, false) : words(l.em, true)}
          {i < lines.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </Tag>
  );
}
