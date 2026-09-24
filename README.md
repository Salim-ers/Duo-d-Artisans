# Le Duo d’Artisans — site vitrine

Boulangerie-pâtisserie **Le Duo d’Artisans**, 7 rue Anatole France, 60290 Rantigny.
Next.js 15 (App Router, rendu statique) · React 19 · TypeScript strict · CSS natif · Zod.

## Démarrer

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # vérifie les images (prebuild) puis construit
npm run check:images   # inventaire et validation des photographies seuls
npm run typecheck
```

## Où modifier quoi

| Besoin | Fichier |
| --- | --- |
| Nom, téléphone, adresse, liens Google, mentions légales | `data/site.ts` |
| Horaires (affichage, statut ouvert/fermé, JSON-LD) | `data/opening-hours.ts` |
| Note et nombre d’avis Google (saisis à la main) | `data/reviews.ts` |
| Photographies (chemin, texte alternatif, dimensions réelles) | `data/media.ts` |
| Créations, filtres, catalogue de l’accueil | `data/products.ts` |
| Couleurs, typographie, espacements | variables en tête de `app/globals.css` |

## Photographies

Toutes les photos sont servies depuis `public/images/` (aucun lien externe temporaire).
`scripts/check-images.mjs` s’exécute avant chaque build et **fait échouer le build** si une image
référencée est absente, mal nommée (casse comprise), hébergée sur un service temporaire, ou si ses
dimensions ne correspondent pas à celles déclarées dans `data/media.ts`.

Pour ajouter une photo : la déposer dans `public/images/…`, puis déclarer `src`, `alt`, `width`,
`height` dans `data/media.ts`. Les photos actuelles font au plus 1 672 px de large : le hero est
volontairement cadré pour ne jamais les agrandir au-delà de leur définition.

## Formulaires & sécurité

- Server Actions (`app/actions.ts`) : fonctionnent aussi sans JavaScript.
- Validation complète côté serveur avec Zod (`lib/validation.ts`), champs bornés et nettoyés.
- Honeypot, limitation de débit par IP (`lib/rate-limit.ts`), Cloudflare Turnstile facultatif.
- Messages d’erreur génériques côté visiteur ; aucun détail technique renvoyé.
- Envoi par l’API Resend, côté serveur uniquement. Variables : voir `.env.example`.
  Sans `RESEND_API_KEY` et `CONTACT_TO_EMAIL`, les formulaires affichent une erreur générique
  et invitent à appeler : ils ne prétendent jamais qu’une demande est partie.
- En-têtes HTTP (CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy, frame-ancestors) :
  `next.config.mjs`.

## SEO

Métadonnées par page (`lib/seo.ts`), canonical, Open Graph, Twitter, `sitemap.xml`, `robots.txt`,
JSON-LD `Bakery` avec uniquement des données vérifiées (nom, adresse, téléphone, horaires) et fil
d’Ariane sur les pages intérieures. La note Google n’est pas injectée dans le JSON-LD (avis
auto-déclarés interdits par Google).

## À obtenir de la boutique

- [ ] **Confirmer les horaires et le téléphone** : l’affichette visible sur la photo de façade
      semble indiquer une coupure 13h30–15h30 et un numéro se terminant par 67.
- [ ] **Photographies originales en haute définition** (≥ 2 000 px), notamment façade, fournil et gestes.
- [ ] Logo officiel (SVG), si la boutique en possède un.
- [ ] Lien direct de la fiche Google → `site.googleBusinessUrl`, et relevé daté des avis → `data/reviews.ts`.
- [ ] Adresse e-mail de réception des demandes et domaine d’envoi (Resend).
- [ ] Nom du directeur de la publication → `site.legal.director`.
- [ ] Coordonnées GPS vérifiées → `site.geo`.

## Ce qui n’est volontairement pas écrit

Aucun prix, aucune récompense, aucun label, aucun témoignage, aucune ancienneté, aucune origine
d’ingrédient, aucun nom d’artisan, aucune commande en ligne.
