# Le Duo d’Artisans — site et gestion

Boulangerie · Pâtisserie · Viennoiserie · Snacking — 7 rue Anatole France, 60290 Rantigny.

- **Site public** (Accueil, Commander, Créations, Contact) — photographie, typographie, mouvement.
  L’accueil est une page éditoriale en huit temps : hero (panneau bleu nuit × photo des pains au chocolat, le nom qui
  franchit la frontière), « Deux savoir-faire, une seule maison », la vitrine, « Du fournil à la vitrine » (scène fixe et
  étapes), une respiration plein écran, « Les jours qui comptent » (gâteaux sur mesure), la note et trois avis, la maison.
  « Commander » = **commande de gâteau sur mesure**, présentée comme un **bloc-note** : dix questions visibles d’un coup
  (type, date, nombre de personnes, saveurs, thème, texte, budget, remarques, image d’inspiration facultative, coordonnées).
  C’est une **demande** : aucun prix affiché, aucun paiement en ligne. La boutique répond avec un devis que le client
  accepte depuis son lien de suivi.
- **Gestion `/admin`** — volontairement simple : tableau de bord, commandes de gâteaux (devis, statuts),
  planning (gâteaux de la semaine, fermetures et horaires exceptionnels), clients (RGPD), messages, galerie,
  paramètres (horaires, types de gâteaux, avis Google, notifications, équipe).

Stack : Next.js 15 (App Router) · React 19 · TypeScript strict · CSS natif · Framer Motion (`motion`, effets liés au
défilement de l’accueil uniquement) · PostgreSQL (Neon) via Drizzle ORM · PGlite en local · Resend · Zod · jose / bcrypt ·
web-push. Typographies : Instrument Serif (très grands titres), Newsreader (textes), Hanken Grotesk.

## Démarrer en local (aucun compte externe)

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # vérifie les images (prebuild) puis construit
npm run typecheck
npm run db:generate    # après modification de lib/db/schema.ts
npm run db:reset-local # repart d’une base locale vierge
```

Sans `DATABASE_URL`, une base PostgreSQL embarquée (PGlite) est créée dans `.data/pglite`, migrée et remplie.
Gestion : http://localhost:3000/admin — `admin@duo.local` / `boulangerie-dev` (compte de développement uniquement).

## Mise en production (Vercel + Neon, gratuit)

1. **Base** : Vercel → projet → **Storage** → **Create Database** → **Neon** (offre Free, région Europe) → *Connect*.
2. **Variables** : `ADMIN_EMAIL`, `ADMIN_PASSWORD` (10 caractères min.), `AUTH_SECRET` (recommandé). Voir `.env.example`.
3. **Redéployer**. Au premier démarrage : tables créées, Row Level Security activé, galerie et horaires insérés,
   compte super administrateur créé.
4. **E-mails** (facultatif) : `RESEND_API_KEY`, `EMAIL_FROM`, `STAFF_EMAIL`.
5. **Push tablette / téléphone** (facultatif) : `npx web-push generate-vapid-keys` → `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`.

Sans base permanente, le site reste visible mais les demandes et le contact sont fermés.

## Mode démonstration

Les demandes, clients, messages et notifications d’exemple portent `is_demo = true` : ils ne s’affichent que dans la
gestion, signalés « Exemple », et disparaissent dès que le mode démonstration est désactivé (Paramètres).
Rien de fictif n’apparaît sur le site public.

## Où modifier quoi

| Besoin | Où |
| --- | --- |
| Demandes de gâteaux, devis, statuts | Gestion → Commandes de gâteaux |
| Types de gâteaux proposés, délai minimum | Gestion → Paramètres |
| Horaires d’ouverture | Gestion → Paramètres |
| Fermetures et horaires exceptionnels | Gestion → Planning |
| Photos de la galerie (et de « La vitrine » sur l’accueil) | Gestion → Galerie |
| Photos fixes de l’accueil (hero, savoir-faire, étapes, plein écran, gâteaux, maison) | `components/home/Hero.tsx`, `components/home/Sections.tsx` |
| Note et nombre d’avis Google | Gestion → Paramètres → Avis |
| Avis cités sur l’accueil (vrais avis Google, recopiés mot pour mot ; trois sont affichés) | `data/reviews.ts`, `components/home/Sections.tsx` |
| Nom, téléphone, adresse, mentions légales | `data/site.ts` |
| Photographies (chemins, dimensions vérifiées au build) | `data/media.ts`, `public/images/` |
| Couleurs (bleu nuit, crème, beurre, chocolat), typographie | variables en tête de `app/globals.css` (site) et `app/admin/admin.css` |
| Mise en page et mouvement de l’accueil | `app/(site)/home.css`, `components/home/motion.tsx` |

Toutes les photos de l’accueil sont celles de la boutique (la devanture en 3840 × 2160 a été fournie par la boutique),
sauf une : le rouleau à pâtisserie de l’étape « Façonner », photo libre de droits (licence Pexels, crédit dans
`data/media.ts` et les mentions légales), qui illustre un geste et n’est jamais présentée comme un produit.

**Règle : jamais deux fois la même photo sur une page.** « La vitrine » de l’accueil écarte d’office toutes les photos
fixes de la page (`fixedHomePhotos`) et les photos de la boutique ; la devanture n’apparaît pas dans la page Créations.

## Structure

```
app/(site)/            accueil, commander (+ suivi), creations, contact, pages légales
app/(site)/actions.ts  demande de gâteau, acceptation du devis, contact
app/admin/             gestion : login, (panel)/…, actions.ts
app/api/               img (images publiques), admin/* (fichiers privés, pouls, push)
lib/db/                schéma Drizzle, connexion Neon / PGlite, données initiales, démonstration
lib/custom.ts          demandes de gâteaux      lib/admin.ts   requêtes de gestion
lib/notify.ts          e-mails, tableau de bord, push      lib/hours.ts   statut d’ouverture
drizzle/               migrations SQL (dont RLS)
```

## Sécurité

- Gestion protégée côté serveur : middleware + session JWT signée (cookie `httpOnly`, `SameSite=Lax`) relue en base
  à chaque requête ; rôles **SUPER_ADMIN / ADMIN / STAFF** revérifiés dans chaque action ; journal d’audit.
- Mots de passe bcrypt ; limitation de débit (connexion, demande, contact) ; pot de miel ; Turnstile facultatif.
- Entrées revalidées avec Zod ; images vérifiées par signature binaire, 4 Mo max., photos clients privées.
- En-têtes : CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP. Secrets uniquement côté serveur.

## SEO local

Métadonnées par page, canonical, Open Graph, `robots.txt`, `sitemap.xml`, JSON-LD `Bakery` (adresse, téléphone,
horaires enregistrés). Les anciennes adresses (`/la-maison`, `/savoir-faire`, `/nos-creations`, `/commandes`,
`/commande-personnalisee`, `/panier`) redirigent en 301.

## À obtenir ou valider par la boutique

- [ ] Horaires (l’affichette en vitrine semble indiquer une coupure 13h30–15h30) et téléphone.
- [ ] Types de gâteaux proposés et délai minimum de commande.
- [ ] Relevé daté des avis Google et lien de la fiche.
- [ ] Nom du directeur de la publication (mentions légales), coordonnées GPS → `site.geo`.

## Note de développement

Le dossier local contient une apostrophe (« Duo d’artisans ») qui casse le chargeur de métadonnées de Next.js :
l’icône est servie depuis `public/icon.svg` et `robots.txt` / `sitemap.xml` sont des routes classiques.
