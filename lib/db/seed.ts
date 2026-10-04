/**
 * Données initiales — exécutées une seule fois, sur une base vide.
 *
 * DONNÉES RÉELLES : photographies de la boutique (galerie) et horaires relevés. Rien d'autre.
 * Les demandes, clients et messages d'exemple sont dans ./demo (tous marqués `is_demo`).
 */
import bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import { media, type MediaKey } from '@/data/media';
import { defaultSettings } from '@/lib/settings-shared';
import type { DB } from './index';
import * as s from './schema';
import { seedDemo } from './demo';

/**
 * Photographies réelles de la boutique → galerie administrable (ordre, catégorie, accueil).
 * La devanture n'y figure pas (image d'accueil) ; le number cake et le gâteau aux fruits illustrent déjà l'encart « Sur mesure ».
 */
const photos: { key: MediaKey; title: string; description: string; category: string; home?: boolean }[] = [
  { key: 'vitrineEclairs', title: 'La vitrine', description: 'Éclairs, Paris-Brest, tartes aux fruits.', category: 'boutique', home: true },
  { key: 'macarons', title: 'Grands macarons', description: 'Framboise, pistache, fruits frais.', category: 'patisserie', home: true },
  { key: 'painsChocolat', title: 'Viennoiseries', description: 'Pains au chocolat, feuilletage doré.', category: 'viennoiserie', home: true },
  { key: 'numberCake', title: 'Number cake', description: 'Chiffres et lettres, sur commande.', category: 'gateaux' },
  { key: 'baguettesTradition', title: 'Baguettes', description: 'La base de la journée, croustillante.', category: 'pain', home: true },
  { key: 'entremets', title: 'Entremets citron & framboise', description: 'Pâtisseries individuelles.', category: 'patisserie', home: true },
  { key: 'cookies', title: 'Cookies garnis', description: 'Chocolat, caramel, fruits rouges.', category: 'patisserie', home: true },
  { key: 'gateauFruits', title: 'Gâteau aux fruits frais', description: 'À partager, sur commande.', category: 'gateaux' },
  { key: 'sandwichs', title: 'Sandwichs', description: 'En baguette, prêts à emporter.', category: 'sale', home: true },
  { key: 'baguettesFournil', title: 'Pains', description: 'À la sortie du four.', category: 'pain' },
  { key: 'boutique', title: 'La boutique', description: 'Le comptoir et ses vitrines.', category: 'boutique' },
  { key: 'salades', title: 'Salades composées', description: 'Salades et taboulés du jour.', category: 'sale' },
  { key: 'flans', title: 'Flans individuels', description: 'Chocolat, pistache.', category: 'patisserie', home: true },
  { key: 'petrin', title: 'Au pétrin', description: 'La pâte, avant le pain.', category: 'pain' },
  { key: 'vitrineFlans', title: 'Gourmandises', description: 'Flans, macarons, tartelettes en vitrine.', category: 'boutique' },
  { key: 'vitrinePatisseries', title: 'Pâtisseries du jour', description: 'La sélection change au fil des jours.', category: 'boutique' },
];

export async function seed(db: DB) {
  // Une seule fois : le compteur « seeded » sert de verrou logique.
  const done = await db.insert(s.counters).values({ key: 'seeded', value: 1 }).onConflictDoNothing().returning();
  if (!done.length) return;

  await db.insert(s.gallery).values(
    photos.map((p, i) => ({
      src: media[p.key].src,
      width: media[p.key].width,
      height: media[p.key].height,
      alt: media[p.key].alt,
      title: p.title,
      description: p.description,
      category: p.category,
      showOnHome: !!p.home,
      position: i,
    })),
  );

  // Horaires relevés sur la fiche Google et en vitrine : données réelles, enregistrées.
  await db.insert(s.settings).values({ key: 'hours', value: defaultSettings.hours }).onConflictDoNothing();

  await seedDemo(db);
}

/**
 * Premier compte super administrateur, créé tant qu'aucun compte n'existe :
 * ADMIN_EMAIL / ADMIN_PASSWORD, ou en développement uniquement un compte local.
 */
export async function ensureAdmin(db: DB) {
  const [{ n }] = (await db.select({ n: sql<number>`count(*)::int` }).from(s.users)) as [{ n: number }];
  if (n > 0) return;
  const isProd = process.env.NODE_ENV === 'production';
  const email = (process.env.ADMIN_EMAIL || (isProd ? '' : 'admin@duo.local')).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || (isProd ? '' : 'boulangerie-dev');
  if (!email || password.length < 10) return;
  const [exists] = await db.select().from(s.users).where(eq(s.users.email, email));
  if (exists) return;
  await db
    .insert(s.users)
    .values({ email, name: 'Administrateur', role: 'SUPER_ADMIN', passwordHash: await bcrypt.hash(password, 12) })
    .onConflictDoNothing();
}
