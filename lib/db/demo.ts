/**
 * DONNÉES DE DÉMONSTRATION — toutes marquées `is_demo = true`.
 *
 * Les produits reprennent les vraies photographies de la boutique, mais leurs PRIX, formats et délais
 * sont des EXEMPLES non validés par la boutique. Les commandes, clients, demandes et messages
 * sont fictifs (adresses @example.com, numéros 06 00 00 00 xx).
 * Rien de tout cela n'est visible une fois le mode démonstration désactivé (Gestion → Paramètres).
 * Aucun allergène n'est renseigné : c'est une information de sécurité que seule la boutique peut fournir.
 */
import { and, eq, inArray, sql } from 'drizzle-orm';
import { media, type MediaKey } from '@/data/media';
import { addDays, paris, parisDayBounds } from '@/lib/dates';
import type { DB } from './index';
import * as s from './schema';

type DemoProduct = {
  slug: string;
  category: string;
  name: string;
  description: string;
  image: MediaKey;
  price: number;
  featured?: boolean;
  lead?: number;
  days?: number[];
  stock?: [number, number];
  variants?: [string, number | null, number][];
  flavors?: string[];
  extras?: [string, number][];
};

const products: DemoProduct[] = [
  { slug: 'baguette-tradition', category: 'boulangerie', name: 'Baguette tradition', description: 'Croûte croustillante, mie alvéolée.', image: 'baguettesTradition', price: 130, featured: true },
  { slug: 'baguette', category: 'boulangerie', name: 'Baguette', description: 'La baguette du quotidien.', image: 'baguettesFournil', price: 110 },
  { slug: 'pain-au-chocolat', category: 'viennoiseries', name: 'Pain au chocolat', description: 'Feuilletage doré, deux barres de chocolat.', image: 'painsChocolat', price: 140, featured: true, stock: [24, 6] },
  { slug: 'entremets-individuel', category: 'patisseries', name: 'Entremets individuel', description: 'En forme de fruit, mousse légère.', image: 'entremets', price: 490, flavors: ['Citron', 'Framboise'] },
  { slug: 'grand-macaron', category: 'patisseries', name: 'Grand macaron', description: 'Garni de crème et de fruits frais.', image: 'macarons', price: 550, featured: true, flavors: ['Framboise', 'Pistache'] },
  { slug: 'flan-individuel', category: 'patisseries', name: 'Flan individuel', description: 'Portion individuelle.', image: 'flans', price: 320, flavors: ['Chocolat', 'Pistache'] },
  { slug: 'cookie-garni', category: 'gourmandises', name: 'Cookie garni', description: 'Épais, généreusement garni.', image: 'cookies', price: 280, flavors: ['Chocolat', 'Caramel', 'Fruits rouges'], stock: [18, 4] },
  { slug: 'sandwich-baguette', category: 'snacking', name: 'Sandwich baguette', description: 'Garni de crudités, prêt à emporter.', image: 'sandwichs', price: 550 },
  { slug: 'salade-composee', category: 'snacking', name: 'Salade composée', description: 'Selon l’arrivage du jour.', image: 'salades', price: 690 },
  {
    slug: 'number-cake',
    category: 'gateaux',
    name: 'Number cake',
    description: 'Chiffre ou lettre, décor de macarons et de fruits.',
    image: 'numberCake',
    price: 4500,
    featured: true,
    lead: 72,
    days: [3, 4, 5, 6, 0],
    variants: [
      ['1 chiffre — 8 personnes', 8, 4500],
      ['2 chiffres — 15 personnes', 15, 7500],
    ],
    extras: [['Inscription en chocolat', 300]],
  },
  {
    slug: 'gateau-fruits-frais',
    category: 'gateaux',
    name: 'Gâteau aux fruits frais',
    description: 'À partager, garni de fruits frais.',
    image: 'gateauFruits',
    price: 2400,
    lead: 48,
    variants: [
      ['6 personnes', 6, 2400],
      ['8 personnes', 8, 3200],
      ['10 personnes', 10, 4000],
    ],
    extras: [['Inscription en chocolat', 300]],
  },
];

const people = [
  ['Camille', 'Martin'],
  ['Lucas', 'Bernard'],
  ['Inès', 'Dubois'],
  ['Hugo', 'Thomas'],
  ['Léa', 'Robert'],
  ['Nathan', 'Richard'],
  ['Chloé', 'Petit'],
  ['Mathis', 'Durand'],
  ['Manon', 'Leroy'],
  ['Théo', 'Moreau'],
] as const;

/** Générateur déterministe : la démonstration est identique d'une régénération à l'autre. */
function rng(seed: number) {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

async function insertProducts(db: DB) {
  const cats = await db.select().from(s.categories);
  for (const [i, p] of products.entries()) {
    const category = cats.find((c) => c.slug === p.category);
    const [row] = await db
      .insert(s.products)
      .values({
        slug: p.slug,
        categoryId: category?.id ?? null,
        name: p.name,
        description: p.description,
        image: media[p.image].src,
        priceCents: p.price,
        featured: !!p.featured,
        position: i,
        leadTimeHours: p.lead ?? 0,
        availableDays: p.days ?? [],
        stockManaged: !!p.stock,
        stock: p.stock?.[0] ?? 0,
        stockAlert: p.stock?.[1] ?? 0,
        isDemo: true,
      })
      .onConflictDoNothing()
      .returning();
    if (!row) continue;
    if (p.variants) await db.insert(s.productVariants).values(p.variants.map(([label, servings, price], j) => ({ productId: row.id, label, servings, priceCents: price, position: j })));
    const opts = [
      ...(p.flavors ?? []).map((label, j) => ({ productId: row.id, kind: 'flavor' as const, label, priceDeltaCents: 0, position: j })),
      ...(p.extras ?? []).map(([label, delta], j) => ({ productId: row.id, kind: 'extra' as const, label, priceDeltaCents: delta, position: j })),
    ];
    if (opts.length) await db.insert(s.productOptions).values(opts);
  }
}

/** Supprime les commandes, clients, demandes, messages et notifications d'exemple (et les produits si demandé). */
export async function purgeDemo(db: DB, opts: { products?: boolean } = {}) {
  await db.delete(s.notifications).where(eq(s.notifications.isDemo, true));
  await db.delete(s.orders).where(eq(s.orders.isDemo, true));
  await db.delete(s.customOrders).where(eq(s.customOrders.isDemo, true));
  await db.delete(s.messages).where(eq(s.messages.isDemo, true));
  await db.delete(s.customers).where(
    and(eq(s.customers.isDemo, true), sql`not exists (select 1 from ${s.orders} o where o.customer_id = ${s.customers.id})`),
  );
  if (opts.products) {
    const demo = await db.select({ id: s.products.id }).from(s.products).where(eq(s.products.isDemo, true));
    if (demo.length) {
      await db.delete(s.promotions).where(inArray(s.promotions.productId, demo.map((d) => d.id)));
      await db.delete(s.products).where(eq(s.products.isDemo, true));
    }
  }
}

/** (Re)crée la démonstration autour de la date du jour. */
export async function seedDemo(db: DB, opts: { withProducts?: boolean } = {}) {
  await purgeDemo(db);
  if (opts.withProducts) await insertProducts(db);

  const catalog = await db.select().from(s.products).where(eq(s.products.isDemo, true));
  const variants = await db.select().from(s.productVariants);
  const cats = await db.select().from(s.categories);
  if (!catalog.length) return;

  const random = rng(42);
  const pick = <T,>(a: readonly T[]) => a[Math.floor(random() * a.length)]!;
  const today = paris().date;
  const times = ['07:30', '08:00', '08:30', '09:00', '10:00', '11:30', '12:00', '12:30', '16:00', '16:30', '17:00', '18:00'];

  const customers = [];
  for (const [i, [first, last]] of people.entries()) {
    const [c] = await db
      .insert(s.customers)
      .values({ firstName: first, lastName: last, email: `${first.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${last.toLowerCase()}@example.com`, phone: `06000000${String(i).padStart(2, '0')}`, isDemo: true })
      .onConflictDoUpdate({ target: s.customers.email, set: { isDemo: true } })
      .returning();
    customers.push(c!);
  }

  /** Statut cohérent avec la date et l'heure de retrait. */
  const statusFor = (offset: number, idx: number): s.Order['status'] => {
    if (offset < 0) return idx % 11 === 0 ? 'cancelled' : 'collected';
    if (offset > 0) return idx % 3 === 0 ? 'confirmed' : 'new';
    return (['new', 'confirmed', 'to_prepare', 'in_preparation', 'ready', 'collected'] as const)[idx % 6]!;
  };

  let n = 0;
  for (let offset = -28; offset <= 3; offset++) {
    const date = addDays(today, offset);
    // Jamais de commande d'exemple un lundi (jour de fermeture habituel).
    if (offset !== 0 && new Date(date + 'T12:00:00Z').getUTCDay() === 1) continue;
    const count = offset === 0 ? 8 : offset > 0 ? 3 : Math.floor(random() * 3) + (new Date(date + 'T12:00:00Z').getUTCDay() === 6 ? 2 : 0);
    for (let k = 0; k < count; k++) {
      n++;
      const c = pick(customers);
      const lines = Array.from({ length: 1 + Math.floor(random() * 3) }, () => pick(catalog));
      const items = [...new Map(lines.map((p) => [p.id, p])).values()].map((p) => {
        const v = variants.find((x) => x.productId === p.id);
        const qty = v ? 1 : 1 + Math.floor(random() * (p.priceCents < 200 ? 6 : 3));
        return { p, v, qty, unit: v?.priceCents ?? p.priceCents };
      });
      const total = items.reduce((t, i) => t + i.unit * i.qty, 0);
      const status = statusFor(offset, n);
      const online = n % 3 === 0;
      const created = new Date(parisDayBounds(addDays(date, offset >= 0 ? -1 : 0)).start.getTime() + (8 + (n % 10)) * 3600_000);
      const [o] = await db
        .insert(s.orders)
        .values({
          number: `DEMO-${date.replace(/-/g, '')}-${String(n).padStart(4, '0')}`,
          accessToken: `demo-${n}-${date}`,
          customerId: c.id,
          status,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          pickupDate: date,
          pickupTime: offset === 0 ? times[(k * 2 + 1) % times.length]! : pick(times),
          subtotalCents: total,
          totalCents: total,
          amountPaidCents: online || status === 'collected' ? total : 0,
          paymentMethod: online ? 'online' : 'on_site',
          paymentStatus: online || status === 'collected' ? 'paid' : 'on_site',
          customerNote: n % 7 === 0 ? 'Merci de bien emballer, c’est pour offrir.' : null,
          isDemo: true,
          createdAt: created,
          collectedAt: status === 'collected' ? new Date() : null,
          cancelledAt: status === 'cancelled' ? new Date() : null,
          stockReleased: true,
        })
        .returning();
      await db.insert(s.orderItems).values(
        items.map((i) => ({
          orderId: o!.id,
          productId: i.p.id,
          variantId: i.v?.id ?? null,
          categoryName: cats.find((x) => x.id === i.p.categoryId)?.name ?? null,
          name: i.p.name,
          variantLabel: i.v?.label ?? null,
          unitPriceCents: i.unit,
          quantity: i.qty,
          vatRate: i.p.vatRate,
        })),
      );
      if (offset === 0 && k < 2)
        await db.insert(s.notifications).values({
          channel: 'dashboard',
          audience: 'staff',
          type: 'order.new',
          subject: `Nouvelle commande ${o!.number}`,
          body: `${c.firstName} ${c.lastName} — retrait aujourd’hui à ${o!.pickupTime.replace(':', 'h')}`,
          href: `/admin/commandes?ouvrir=${o!.id}`,
          orderId: o!.id,
          isDemo: true,
        });
    }
  }

  type Req = Omit<typeof s.customOrders.$inferInsert, 'number' | 'accessToken' | 'firstName' | 'lastName' | 'email' | 'phone'>;
  const requests: Req[] = [
    { type: 'Anniversaire', desiredDate: addDays(today, 9), servings: 12, flavors: 'Chocolat, framboise', theme: 'Licornes, tons pastel', inscription: 'Joyeux anniversaire Lina', budget: '60 – 80 €', status: 'new_request' },
    { type: 'Number cake', desiredDate: addDays(today, 5), servings: 20, flavors: 'Vanille, fruits rouges', theme: 'Chiffre 30, fleurs fraîches', budget: '100 €', status: 'quote_sent', quoteCents: 9500, quoteMessage: 'Proposition : deux chiffres, crème vanille, fruits rouges et macarons.' },
    { type: 'Événement', desiredDate: addDays(today, 2), servings: 40, flavors: 'Assortiment', theme: 'Pot de départ en entreprise', status: 'accepted', quoteCents: 18000, pickupTime: '11:30' },
  ];
  for (const [i, r] of requests.entries()) {
    const c = customers[i + 2]!;
    const [row] = await db
      .insert(s.customOrders)
      .values({ ...r, number: `DEMO-P-${String(i + 1).padStart(4, '0')}`, accessToken: `demo-p-${i}`, customerId: c.id, firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone, isDemo: true })
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
}
