import { SectionMark } from '@/components/ui/SectionMark';

/**
 * Repères éditoriaux de la journée en boutique.
 * Ce ne sont PAS des horaires de fabrication : aucune affirmation technique.
 */
const moments = [
  { time: '06:30', title: 'Le fournil s’éveille', text: 'Les portes ouvrent, le pain sort.' },
  { time: '08:00', title: 'Viennoiseries', text: 'Feuilletés dorés et cafés à emporter.' },
  { time: '12:00', title: 'Pause déjeuner', text: 'Sandwichs, salades et formules du midi.' },
  { time: '16:00', title: 'Pause gourmande', text: 'Le moment des pâtisseries et du goûter.' },
  { time: '19:00', title: 'Derniers plaisirs', text: 'Le pain du soir avant la fermeture.' },
];

export function DayTimeline() {
  return (
    <section className="section section--tight bg-paper timeline">
      <div className="container">
        <div className="tl-head">
          <div>
            <SectionMark>Du matin au soir</SectionMark>
            <h2 className="display d-l reveal" data-delay=".06s">Une journée<br />en boutique</h2>
          </div>
          <p className="lede reveal" data-delay=".12s" style={{ maxWidth: '38ch' }}>
            Repères indicatifs : la vitrine évolue au fil de la journée, du premier pain chaud aux
            derniers plaisirs du soir.
          </p>
        </div>

        <div className="tl-track">
          <span className="tl-rail" /><span className="tl-progress" />
          <ol className="tl-items">
            {moments.map((m) => (
              <li className="tl-item" key={m.time}>
                <p className="tl-h mono-num">{m.time}</p>
                <p className="tl-t">{m.title}</p>
                <p className="tl-d">{m.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
