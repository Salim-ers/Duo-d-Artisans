/**
 * ------------------------------------------------------------------
 * AVIS GOOGLE — valeurs administrées à la main
 * ------------------------------------------------------------------
 * Aucune API n'est branchée : ces chiffres sont recopiés depuis la fiche
 * Google de la boutique. Ils ne sont écrits nulle part ailleurs dans le code.
 *
 * - Mettre à jour `rating`, `count` et `checkedOn` en même temps.
 * - Mettre `rating` ou `count` à null pour masquer les chiffres : la section
 *   n'affiche alors qu'un lien vers les avis, sans aucune valeur.
 * - Ces valeurs ne sont PAS injectées dans le JSON-LD (Google interdit
 *   les avis auto-déclarés sur la fiche d'un établissement).
 */
export const googleReviews = {
  rating: 4.5 as number | null,
  count: 287 as number | null,
  /** Date du relevé (AAAA-MM-JJ). null = date inconnue, non affichée. */
  checkedOn: null as string | null,
};

/**
 * AVIS AFFICHÉS SUR L'ACCUEIL — de vrais avis Google 5 étoiles, publiés depuis la reprise de la boutique.
 * Relevés le 4 octobre 2026 sur la fiche Google (reprise publique : boulangerie.contact/f/le-duo-d-artisans-6505669/).
 *
 * Règles :
 * - texte recopié MOT POUR MOT (orthographe comprise) ; un passage coupé est signalé par « … » ;
 * - prénom + initiale du nom uniquement ;
 * - ne jamais rédiger, reformuler ni « améliorer » un avis ;
 * - aucun balisage JSON-LD (avis auto-publiés non autorisés par Google).
 */
export type ReviewQuote = { author: string; date: string; topic: string; text: string };

export const reviewQuotes: ReviewQuote[] = [
  {
    author: 'Amandine R.',
    date: '2025-10-06',
    topic: 'Mariage',
    text: 'Nous voulions vous remercier du fond du cœur pour la magnifique pièce montée que vous avez réalisée pour notre mariage. Elle était splendide et surtout délicieuse.',
  },
  {
    author: 'Stephanie T.',
    date: '2025-09-16',
    topic: 'Anniversaire',
    text: 'Le gâteau trois chocolats pour l’anniversaire de notre fille était délicieux, avec un parfait équilibre en sucre. Les macarons sont tout aussi réussis.',
  },
  {
    author: 'Louis M.',
    date: '2026-04-20',
    topic: 'Commande de dernière minute',
    text: '… la réactivité des artisans à l’arrière et des vendeurs de devant est irréprochable (j’ai organisé un évènement professionnel en leur passant commande la veille en catastrophe à 19h et ils étaient au rendez-vous le lendemain à 9h !)',
  },
  {
    author: 'Marie-Laure D.',
    date: '2026-04-21',
    topic: 'Pâtisserie',
    text: 'Une adresse en or massif pour ceux qui aiment la pâtisserie. J\'ai goûté le citron trompe l\'oeil, mes papilles en sont encore toute chamboulées. Un délice !',
  },
  {
    author: 'Samantha D.',
    date: '2026-02-13',
    topic: 'Boulangerie',
    text: 'Produits frais et faits maison, je suis vraiment très satisfaite ! Une équipe adorable, toujours gentille et souriante, c’est un vrai plaisir d’y aller. Le pain est aussi excellent que les pâtisseries et les produits salés …',
  },
  {
    author: 'Vincent A.',
    date: '2026-04-22',
    topic: 'Le midi',
    text: 'Le Burger maison était excellent. Le flan à la pistache juste incroyable. À tel point que nous sommes retournés à la boulangerie en fin de journée. Bravo !',
  },
];
