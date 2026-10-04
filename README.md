# Le Duo d’Artisans — site, commande en ligne et gestion

Boulangerie · Pâtisserie · Viennoiserie · Snacking — 7 rue Anatole France, 60290 Rantigny.

Une seule application Next.js, deux expériences :

- **Site public** (4 pages : Accueil, Commander, Créations, Contact) — photographie, typographie, mouvement.
  Catalogue filtrable, panier (tiroir / feuille mobile), **retrait en boutique sur créneau**, paiement
  **Stripe Checkout** ou **en boutique**, **commande personnalisée** (une demande, jamais acceptée d’office),
  galerie avec visionneuse, infos pratiques avec statut d’ouverture calculé en direct.
- **Gestion `/admin`** — tableau de bord du jour, commandes (statut rapide + panneau détaillé), **mode production
  tablette**, **feuille de production** (impression, PDF), planning jour / semaine, commandes personnalisées et devis,
  clients (RGPD), produits, catégories, stock, événements saisonniers, promotions, messages, galerie,
  statistiques, paramètres, équipe et rôles, notifications (son, push).

Stack : Next.js 15 (App Router) · React 19 · TypeScript strict · CSS natif · PostgreSQL (Neon) via Drizzle ORM ·
PGlite en local · Stripe · Resend · Zod · jose / bcrypt · web-push · pdf-lib.

## Démarrer en local (aucun compte externe)

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # vérifie les images (prebuild) puis construit
npm run typecheck
npm run db:generate    # après modification de lib/db/schema.ts
npm run db:reset-local # repart d’une base locale vierge
```

Sans `DATABASE_URL`, une vraie base PostgreSQL embarquée (PGlite) est créée dans `.data/pglite`, migrée et remplie.
Gestion : http://localhost:3000/admin — `admin@duo.local` / `boulangerie-dev` (compte de développement uniquement).

## Mise en production (Vercel + Neon, gratuit)

1. **Base** : Vercel → projet → **Storage** → **Create Database** → **Neon** (offre Free, région Europe) → *Connect*.
   `DATABASE_URL` et `DATABASE_URL_UNPOOLED` sont ajoutées automatiquement.
2. **Variables** : `ADMIN_EMAIL`, `ADMIN_PASSWORD` (10 caractères min.), `AUTH_SECRET` (recommandé),
   `NEXT_PUBLIC_SITE_URL` (domaine définitif). Voir `.env.example`.
3. **Redéployer**. Au premier démarrage : tables créées, Row Level Security activé, familles, galerie et horaires
   insérés, compte super administrateur créé.
4. **Stripe** (facultatif) : `STRIPE_SECRET_KEY` + webhook `https://<domaine>/api/stripe/webhook` → `STRIPE_WEBHOOK_SECRET`.
5. **E-mails** (facultatif) : `RESEND_API_KEY`, `EMAIL_FROM`, `STAFF_EMAIL`.
6. **Push tablette** (facultatif) : `npx web-push generate-vapid-keys` → `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`.
7. Dans **Gestion → Paramètres** : saisir les vrais produits, vérifier horaires, créneaux, paiements, avis Google,
   puis **désactiver le mode démonstration**.

Sans base permanente (Vercel sans Neon), le site reste visible mais la commande en ligne, les demandes et le contact
sont fermés, et la gestion l’indique en rouge.

## Mode démonstration — ne rien inventer

Toute donnée fictive porte `is_demo = true` : produits (vraies photos, **prix d’exemple**), commandes, clients
(`@example.com`), demandes, messages, notifications. Elles sont signalées « Exemple » partout et **disparaissent
entièrement** (site et gestion) dès que le mode démonstration est désactivé. Aucun allergène, avis, promotion ou
campagne n’est inventé. Les paramètres jamais enregistrés sont marqués « Valeurs par défaut — à confirmer ».

## Où modifier quoi

| Besoin | Où |
| --- | --- |
| Produits, prix, formats, saveurs, suppléments, allergènes, jours, délais | Gestion → Produits |
| Familles et leur ordre (= ordre de la page Commander) | Gestion → Catégories |
| Stock, seuils d’alerte | Gestion → Stock |
| Horaires d’ouverture, créneaux, capacité, délais, paiements | Gestion → Paramètres |
| Fermetures et horaires exceptionnels | Gestion → Planning |
| Photos de la galerie et de l’accueil | Gestion → Galerie |
| Collection saisonnière sur l’accueil | Gestion → Événements |
| Codes promo, remises automatiques, produit mis en avant | Gestion → Promotions |
| Note et nombre d’avis Google | Gestion → Paramètres → Avis |
| Nom, téléphone, adresse, mentions légales | `data/site.ts` |
| Photographies d’origine (chemins, dimensions vérifiées au build) | `data/media.ts`, `public/images/` |
| Couleurs, typographie | variables en tête de `app/globals.css` (site) et `app/admin/admin.css` |

## Structure

```
app/(site)/            site public : accueil, commander, panier, commande, commande-personnalisee, creations, contact…
app/(site)/actions.ts  Server Actions publiques (prix, créneaux, commande, demande, contact)
app/admin/             gestion : login, (panel)/…, production (tablette), actions.ts
app/api/               img (images publiques), admin/* (fichiers privés, pouls, push, PDF), stripe/webhook
lib/db/                schéma Drizzle, connexion Neon / PGlite, données initiales, démonstration
lib/orders.ts          commandes : prix, stock, créneaux, paiement, statuts      lib/custom.ts   demandes personnalisées
lib/slots.ts           créneaux de retrait      lib/pricing.ts   prix et promotions      lib/admin.ts   requêtes de gestion
lib/notify.ts          e-mails, tableau de bord, push      lib/hours.ts   statut d’ouverture (client et serveur)
drizzle/               migrations SQL (dont RLS)
```

## Sécurité

- Gestion protégée côté serveur : middleware + session JWT signée (cookie `httpOnly`, `SameSite=Lax`) relue en base à
  chaque requête ; rôles **SUPER_ADMIN / ADMIN / STAFF** revérifiés dans chaque action ; journal d’audit.
- Mots de passe bcrypt ; limitation de débit (connexion, commande, demande, contact) ; pot de miel ; Turnstile facultatif.
- Toutes les entrées revalidées avec Zod ; prix, stock, créneaux et promotions **recalculés côté serveur** dans une
  transaction (verrou par créneau) : un créneau impossible ne peut jamais être réservé.
- Images : type vérifié par signature binaire, 4 Mo max., compressées dans le navigateur ; photos clients privées.
- Stripe Checkout (aucune donnée bancaire ne transite) ; webhook signé ; paiements abandonnés libérés après 45 min.
- En-têtes : CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP. Secrets uniquement côté serveur.

## SEO local

Métadonnées par page, canonical, Open Graph, `robots.txt`, `sitemap.xml`, JSON-LD `Bakery` (adresse, téléphone,
horaires **enregistrés**, action de commande) et `Product` / `Offer` pour les vrais produits uniquement.
Les anciennes adresses (`/la-maison`, `/savoir-faire`, `/nos-creations`, `/commandes`) redirigent en 301.

## À obtenir ou valider par la boutique

- [ ] Produits réels, prix, formats, **allergènes**, délais → Gestion, puis désactiver la démonstration.
- [ ] Horaires (l’affichette en vitrine semble indiquer une coupure 13h30–15h30) et téléphone.
- [ ] Réglages de créneaux (durée, capacité, délai minimal) — valeurs par défaut à confirmer.
- [ ] Relevé daté des avis Google et lien de la fiche.
- [ ] Relecture des conditions de vente (`/conditions-de-vente`) et des mentions légales (directeur de la publication).
- [ ] Photographies originales en haute définition, logo officiel (SVG) si disponible.
- [ ] Coordonnées GPS vérifiées → `site.geo`.

## Note de développement

Le dossier local contient une apostrophe (« Duo d’artisans ») qui casse le chargeur de métadonnées de Next.js :
l’icône est servie depuis `public/icon.svg` et `robots.txt` / `sitemap.xml` sont des routes classiques.
