/**
 * DONNÉES DE DÉMONSTRATION — toutes marquées `is_demo = true`, visibles uniquement dans la gestion
 * quand le mode démonstration est activé : demandes de gâteaux, clients (adresses @example.com,
 * numéros 06 00 00 00 xx), messages et notifications fictifs. Rien n'est jamais affiché sur le site.
 */
import { eq, sql } from 'drizzle-orm';
import { addDays, paris } from '@/lib/dates';
import type { DB } from './index';
import * as s from './schema';

const people = [
  ['Camille', 'Martin'],
  ['Lucas', 'Bernard'],
  ['Inès', 'Dubois'],
  ['Hugo', 'Thomas'],
  ['Léa', 'Robert'],
  ['Nathan', 'Richard'],
  ['Chloé', 'Petit'],
  ['Mathis', 'Durand'],
] as const;

type Req = Omit<typeof s.customOrders.$inferInsert, 'number' | 'accessToken' | 'firstName' | 'lastName' | 'email' | 'phone'>;

/** Adresse e-mail d'exemple sans accents (prénom.nom@example.com). */
const ascii = (v: string) =>
  v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z]/g, '');

/** Supprime toutes les données d'exemple. */
export async function purgeDemo(db: DB) {
  await db.delete(s.notifications).where(eq(s.notifications.isDemo, true));
  await db.delete(s.customOrders).where(eq(s.customOrders.isDemo, true));
  await db.delete(s.messages).where(eq(s.messages.isDemo, true));
  await db.delete(s.customers).where(sql`${s.customers.isDemo} and not exists (select 1 from ${s.customOrders} c where c.customer_id = ${s.customers.id})`);
}

/** (Re)crée la démonstration autour de la date du jour. */
export async function seedDemo(db: DB) {
  await purgeDemo(db);
  const today = paris().date;

  const customers = [];
  for (const [i, [first, last]] of people.entries()) {
    const [c] = await db
      .insert(s.customers)
      .values({ firstName: first, lastName: last, email: `${ascii(first)}.${ascii(last)}@example.com`, phone: `06000000${String(i).padStart(2, '0')}`, isDemo: true })
      .onConflictDoUpdate({ target: s.customers.email, set: { isDemo: true } })
      .returning();
    customers.push(c!);
  }

  const requests: Req[] = [
    { type: 'Anniversaire', desiredDate: addDays(today, 9), servings: 12, flavors: 'Chocolat, framboise', theme: 'Licornes, tons pastel', inscription: 'Joyeux anniversaire Lina', budget: '60 – 80 €', status: 'new_request' },
    { type: 'Number cake', desiredDate: addDays(today, 12), servings: 20, flavors: 'Vanille, fruits rouges', theme: 'Chiffre 30, fleurs fraîches', budget: '100 €', status: 'new_request' },
    { type: 'Entremets', desiredDate: addDays(today, 6), servings: 8, flavors: 'Citron, framboise', comment: 'Pour un repas de famille, sans fruits à coque si possible.', status: 'reviewing' },
    { type: 'Événement', desiredDate: addDays(today, 15), servings: 40, flavors: 'Assortiment', theme: 'Pot de départ en entreprise', status: 'quote_sent', quoteCents: 18000, quoteMessage: 'Proposition : assortiment de pâtisseries individuelles et un grand gâteau à partager.' },
    { type: 'Number cake', desiredDate: addDays(today, 2), servings: 15, flavors: 'Pistache, framboise', inscription: '18', status: 'accepted', quoteCents: 7500, pickupTime: '11:30' },
    { type: 'Anniversaire', desiredDate: addDays(today, 1), servings: 10, flavors: 'Chocolat', theme: 'Football', status: 'in_preparation', quoteCents: 4500, pickupTime: '16:00' },
    { type: 'Dessert à partager', desiredDate: today, servings: 6, flavors: 'Fruits frais', status: 'ready', quoteCents: 2800, pickupTime: '17:30' },
    { type: 'Anniversaire', desiredDate: addDays(today, -5), servings: 12, flavors: 'Vanille', status: 'collected', quoteCents: 5200, pickupTime: '10:00' },
  ];
  for (const [i, r] of requests.entries()) {
    const c = customers[i % customers.length]!;
    const [row] = await db
      .insert(s.customOrders)
      .values({
        ...r,
        number: `DEMO-P-${String(i + 1).padStart(4, '0')}`,
        accessToken: `demo-p-${i}`,
        customerId: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        isDemo: true,
        createdAt: new Date(Date.now() - (requests.length - i) * 7 * 3600_000),
      })
      .returning();
    if (r.status === 'new_request')
      await db.insert(s.notifications).values({
        channel: 'dashboard',
        audience: 'staff',
        type: 'custom.new',
        subject: `Nouvelle demande — ${r.type}`,
        body: `${c.firstName} ${c.lastName} — ${r.servings} pers.`,
        href: `/admin/personnalisees/${row!.id}`,
        customOrderId: row!.id,
        isDemo: true,
      });
  }

  await db.insert(s.messages).values([
    { name: 'Inès Dubois', email: 'ines.dubois@example.com', body: 'Bonjour, faites-vous des plateaux de viennoiseries pour une réunion de 15 personnes ? Merci !', isDemo: true },
    { name: 'Hugo Thomas', email: 'hugo.thomas@example.com', phone: '0600000003', body: 'Bonjour, serez-vous ouverts le lundi de Pâques ? Bonne journée.', isDemo: true, read: true },
  ]);
  await db.insert(s.notifications).values({
    channel: 'dashboard',
    audience: 'staff',
    type: 'message.new',
    subject: 'Nouveau message — Inès Dubois',
    body: 'Bonjour, faites-vous des plateaux de viennoiseries…',
    href: '/admin/messages',
    isDemo: true,
  });
}
