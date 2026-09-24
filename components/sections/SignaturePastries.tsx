import Image from 'next/image';
import { media, type MediaKey } from '@/data/media';
import { SectionMark } from '@/components/ui/SectionMark';
import { MoveRight } from 'lucide-react';

/** Défilement horizontal piloté par le scroll vertical (desktop) — swipe natif sur mobile. */
const cards: { key: MediaKey; title: string; text: string }[] = [
  { key: 'gateauFruits', title: 'Gâteau aux fruits frais', text: 'Fruits de saison, crème et finition soignée.' },
  { key: 'macarons', title: 'Grands macarons', text: 'Framboise, pistache, garnis de fruits frais.' },
  { key: 'entremets', title: 'Citron & framboise', text: 'Entremets individuels, effet velours.' },
  { key: 'numberCake', title: 'Number cake', text: 'Sur demande, pour les anniversaires.' },
  { key: 'flans', title: 'Flans individuels', text: 'Chocolat, pistache — part généreuse.' },
  { key: 'cookies', title: 'Cookies garnis', text: 'Chocolat, caramel, fruits rouges.' },
  { key: 'vitrineFlans', title: 'Et tout le reste', text: 'Le plus simple : venir voir la vitrine.' },
];

export function SignaturePastries() {
  return (
    <section className="section sig bg-paper">
      <div className="container sig-head">
        <div>
          <SectionMark>En vitrine</SectionMark>
          <h2 className="display d-l reveal" data-delay=".06s">
            Difficile de choisir.<br />C’est plutôt bon signe.
          </h2>
        </div>
        <p className="lede reveal" data-delay=".12s" style={{ maxWidth: '32ch' }}>
          Les pâtisseries changent régulièrement. Voici quelques créations sorties du laboratoire.
        </p>
      </div>

      <div className="sig-viewport">
        <div className="sig-track">
          {cards.map((card) => {
            const img = media[card.key];
            return (
              <article className="sig-card" key={card.key}>
                <div className="ph">
                  <Image src={img.src} alt={img.alt} fill sizes="(max-width:900px) 78vw, 400px" style={{ objectFit: 'cover' }} />
                </div>
                <h3 className="t">{card.title}</h3>
                <p className="s">{card.text}</p>
              </article>
            );
          })}
        </div>
        <p className="sig-hint" aria-hidden="true"><MoveRight size={16} strokeWidth={1.6} /> Faites défiler</p>
      </div>
    </section>
  );
}
