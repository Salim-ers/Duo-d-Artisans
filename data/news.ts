import { type MediaKey } from './media';

/**
 * Rubrique actualités : structure prête à recevoir de vrais contenus.
 * Les entrées ci-dessous sont des MODÈLES non publiés (draft: true) —
 * aucune fausse actualité datée n'est affichée en production.
 */
export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  image: MediaKey;
  category: string;
  date: string | null;
  draft: boolean;
};

export const posts: Post[] = [
  { slug: 'creations-du-moment', title: 'Les créations du moment', category: 'Vitrine', date: null, draft: true,
    excerpt: 'Emplacement prévu pour présenter les nouveautés de la vitrine au fil des semaines.',
    image: 'vitrineEclairs' },
  { slug: 'coulisses-du-fournil', title: 'Dans les coulisses du fournil', category: 'Coulisses', date: null, draft: true,
    excerpt: 'Emplacement prévu pour raconter une étape du travail, en photo.', image: 'petrin' },
  { slug: 'idees-evenements', title: 'Nos idées pour vos événements', category: 'Commandes', date: null, draft: true,
    excerpt: 'Emplacement prévu pour les pièces d’anniversaire et les demandes particulières.', image: 'numberCake' },
  { slug: 'gourmandises-de-saison', title: 'Les gourmandises de saison', category: 'Saisons', date: null, draft: true,
    excerpt: 'Emplacement prévu pour les temps forts : galettes, Pâques, Noël, Saint-Valentin.', image: 'macarons' },
];

export const publishedPosts = posts.filter((p) => !p.draft);
