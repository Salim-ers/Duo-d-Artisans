import type { Metadata } from 'next';
import Image from 'next/image';
import { PageHero } from '@/components/sections/PageHero';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { media } from '@/data/media';
import { posts, publishedPosts } from '@/data/news';

export const metadata: Metadata = {
  title: 'Actualités & saisons',
  description:
    'Nouveautés, créations de saison, temps forts et horaires exceptionnels du Duo d’Artisans à Rantigny.',
  alternates: { canonical: '/actualites' },
};

export default function ActualitesPage() {
  /** Aucune fausse actualité n'est publiée : tant que le client n'a rien fourni,
   *  la page affiche la structure prête à l'emploi. */
  const items = publishedPosts.length > 0 ? publishedPosts : posts;
  const isPlaceholder = publishedPosts.length === 0;

  return (
    <>
      <PageHero
        crumb="Actualités"
        title={<>Les nouvelles<br />de la boutique.</>}
        lede="Créations de saison, temps forts et informations pratiques au fil de l’année."
        image={media.vitrinePatisseries}
        position="center 60%"
      />

      <section className="section bg-cream">
        <div className="container">
          {isPlaceholder && (
            <p className="form-note" style={{ marginBottom: 34 }}>
              Rubrique prête à publier : les quatre modèles ci-dessous montrent la mise en page.
              Ils ne sont pas visibles tant qu’un contenu réel n’a pas été ajouté dans
              <code> data/news.ts</code>.
            </p>
          )}

          <div className="news">
            {items.map((post) => {
              const img = media[post.image];
              return (
                <article className="post reveal" key={post.slug}>
                  <div className="ph">
                    <Image src={img.src} alt={img.alt} fill sizes="(max-width:1100px) 100vw, 32vw" style={{ objectFit: 'cover' }} />
                  </div>
                  <p className="m">{post.category}{post.date ? ` · ${post.date}` : ''}</p>
                  <h2>{post.title}</h2>
                  <p>{post.excerpt}</p>
                  {post.draft && <span className="badge-draft">Modèle — non publié</span>}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <FinalCTA />
    </>
  );
}
