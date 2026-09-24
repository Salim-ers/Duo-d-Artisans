import Image from 'next/image';
import Link from 'next/link';
import { media, type MediaKey } from '@/data/media';
import { SectionMark } from '@/components/ui/SectionMark';
import { Arrow } from '@/components/ui/Arrow';

const cards: { key: MediaKey; title: string; text: string; delay?: string }[] = [
  { key: 'sandwichs', title: 'Sur le pouce', text: 'Sandwichs en baguette, prêts à emporter.' },
  { key: 'salades', title: 'Frais & gourmand', text: 'Salades composées et taboulés du jour.', delay: '.08s' },
  { key: 'flans', title: 'Pause déjeuner', text: 'Et de quoi finir sur une note sucrée.', delay: '.16s' },
];

export function SnackingSection() {
  return (
    <section className="section bg-cream">
      <div className="container">
        <div className="tl-head">
          <div>
            <SectionMark>Le midi</SectionMark>
            <h2 className="display d-l reveal" data-delay=".06s">
              Midi mérite mieux<br />qu’un repas par défaut.
            </h2>
          </div>
          <p className="lede reveal" data-delay=".12s" style={{ maxWidth: '34ch' }}>
            Sandwichs, salades et propositions salées à retrouver en boutique, préparés sur place.
          </p>
        </div>

        <div className="snack-grid">
          {cards.map((card) => {
            const img = media[card.key];
            return (
              <article className="snack reveal" data-delay={card.delay} key={card.title}>
                <Image src={img.src} alt={img.alt} fill sizes="(max-width:820px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
                <div className="b">
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </div>
              </article>
            );
          })}
        </div>

        <p className="reveal" style={{ marginTop: 38 }}>
          <Link className="btn btn--primary" href="/contact">Passer en boutique<Arrow /></Link>
        </p>
      </div>
    </section>
  );
}
