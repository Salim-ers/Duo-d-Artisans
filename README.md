# Le Duo d’Artisans — site vitrine

Site vitrine de la boulangerie-pâtisserie **Le Duo d’Artisans**, 7 Rue Anatole France, 60290 Rantigny.
Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind · GSAP + ScrollTrigger.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de production
npm run typecheck
```

> Le build télécharge les polices Google (Instrument Serif + Manrope) via `next/font` :
> une connexion est nécessaire au moment du build.

## Où modifier quoi

| Besoin | Fichier |
| --- | --- |
| Nom, téléphone, adresse, réseaux, note Google, mentions légales | `data/site.ts` |
| Horaires d’ouverture (et JSON-LD, et statut « ouvert/fermé ») | `data/opening-hours.ts` |
| Photographies (chemins + textes alternatifs) | `data/media.ts` |
| Créations et catégories de la page catalogue | `data/products.ts` |
| Galerie et filtres | `data/gallery.ts` |
| Actualités | `data/news.ts` |
| Couleurs, typo, espacements, rayons | variables CSS en haut de `app/globals.css` |

Une information modifiée dans ces fichiers se répercute partout : en-tête, pages, pied de page,
données structurées et balises SEO.

## Structure

```
app/            pages (App Router) + sitemap, robots, 404, route API
components/
  layout/       en-tête, pied de page, loader, barre mobile
  sections/     sections de page (hero, duo, timeline, créations…)
  animations/   Motion.tsx : tout GSAP en un seul point d’entrée
  gallery/      galerie masonry + lightbox
  forms/        formulaires (validation Zod, états idle/loading/success/error)
  ui/           briques réutilisables (flèche, marqueur, statut horaires, lame)
data/           toutes les données métier
lib/            statut d’ouverture, JSON-LD, schémas de validation
public/images/  photographies classées par univers
```

## À fournir avant la mise en ligne

- [ ] **Logo officiel** (SVG de préférence) — actuellement composition typographique provisoire
      (`components/layout/Header.tsx`, `Footer.tsx`, `Loader.tsx`).
- [ ] **URL de la fiche Google Business** → `site.googleBusinessUrl` (aucune URL n’a été inventée :
      les boutons pointent aujourd’hui vers une recherche Maps construite depuis l’adresse).
- [ ] **Adresse e-mail** de la boutique → `site.email`.
- [ ] **Directeur de la publication**, capital, RCS, TVA → `site.legal` (mentions légales).
- [ ] **Coordonnées GPS vérifiées** → `site.geo` (le JSON-LD les omet tant qu’elles ne sont pas sûres).
- [ ] **Réception des formulaires** : `RESEND_API_KEY` + `CONTACT_TO_EMAIL` (voir `.env.example`).
      Sans ces variables, l’API répond explicitement que l’envoi n’est pas configuré — elle ne
      fait jamais croire à un envoi réussi.
- [ ] Domaine définitif → `NEXT_PUBLIC_SITE_URL`.

## Ce qui n’a volontairement pas été écrit

Aucun prix, aucune récompense, aucun label, aucun témoignage client, aucune ancienneté, aucune
origine de farine, aucun taux de « fait maison », aucun nom d’artisan, aucune commande en ligne.
Seules figurent les informations vérifiées : raison sociale, SIREN/SIRET, adresse, téléphone,
horaires, note et nombre d’avis Google.

## Accessibilité & performance

- Navigation clavier complète, focus visible, `aria-label` sur les contrôles, formulaires labellisés
  avec messages d’erreur explicites.
- `prefers-reduced-motion` : parallaxe, défilement horizontal, particules et loader sont désactivés.
- Les horaires sont rendus en HTML côté serveur ; JavaScript n’ajoute que le surlignage du jour et
  le statut « ouvert / fermé ».
- Images en AVIF/WebP via `next/image`, dimensions explicites, chargement différé hors hero.
- GSAP est chargé dynamiquement : il ne pèse pas sur le bundle initial (~113 kB First Load sur l’accueil).

## Easter eggs

1. **Le coup de lame** — séparateurs en scarifications de baguette qui se dessinent au scroll.
2. **La farine** — particules imperceptibles réagissant à la souris, section finale, desktop seulement.
3. **La pâte qui lève** — loader : deux traits se rejoignent avant la signature (< 1 s).
4. **La baguette** — le séparateur reprend la forme des grignes.
5. **Le glaçage** — reflet lumineux traversant certaines cartes pâtisserie au survol.
6. **Le duo** — deux points parcourent des trajectoires opposées et se rejoignent au centre.
7. **La croûte** — révélations d’images par `clip-path` plutôt que par simple fondu.
8. **Les horaires** — statut d’ouverture calculé en direct sur le fuseau Europe/Paris.
