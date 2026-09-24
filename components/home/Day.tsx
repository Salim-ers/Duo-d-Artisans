/**
 * Repères éditoriaux d'une journée en boutique.
 * Ce ne sont PAS des horaires de fabrication : la mention « repères indicatifs » l'indique.
 */
const moments = [
  { time: '06:30', title: 'Le fournil', text: 'Les portes ouvrent, le pain sort.' },
  { time: '08:00', title: 'Les viennoiseries', text: 'Feuilletés dorés pour bien commencer.' },
  { time: '12:00', title: 'Le déjeuner', text: 'Sandwichs, salades et propositions salées.' },
  { time: '16:00', title: 'La gourmandise', text: 'Le moment des pâtisseries et du goûter.' },
  { time: '19:00', title: 'Le pain du soir', text: 'Une dernière baguette avant la fermeture.' },
];

/** Desktop : le repère avance avec le scroll (section « collante »). Mobile : ligne verticale. */
export function Day() {
  return (
    <section className="day" aria-labelledby="day-title" data-progress data-steps={moments.length}>
      <div className="day-sticky">
        <div className="wrap">
          <header className="day-head">
            <h2 id="day-title" className="t-l">Une journée<br /><em>en boutique.</em></h2>
            <p className="t-small">Repères indicatifs, du premier pain chaud aux derniers plaisirs du soir.</p>
          </header>

          <div className="day-track">
            <span className="day-rail" aria-hidden="true"><span className="day-fill" /></span>
            <ol className="day-list">
              {moments.map((m, i) => (
                <li key={m.time} className="day-item" data-index={i}>
                  <time className="day-time">{m.time.replace(':', 'h')}</time>
                  <p className="day-title">{m.title}</p>
                  <p className="day-text">{m.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
