import 'server-only';
/**
 * Accès base de données — côté serveur uniquement.
 * - DATABASE_URL (ou POSTGRES_URL) défini — Neon ou tout PostgreSQL : connexion postgres-js.
 *   Migrations et données initiales appliquées automatiquement au premier démarrage.
 * - Sinon : PGlite, un vrai PostgreSQL embarqué. En local il est conservé dans `.data/pglite` ;
 *   sur Vercel il est temporaire (/tmp) : le site s'affiche, mais la commande en ligne reste fermée.
 */
import path from 'node:path';
import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { env } from '@/lib/env';
import * as schema from './schema';

export type DB = PostgresJsDatabase<typeof schema>;
export type Tx = Parameters<Parameters<DB['transaction']>[0]>[0];

const MIGRATIONS = path.join(process.cwd(), 'drizzle');

type GlobalDb = { __duoDb?: Promise<DB> };
const g = globalThis as unknown as GlobalDb;

async function latestMigration(): Promise<number> {
  const { readFile } = await import('node:fs/promises');
  const journal = JSON.parse(await readFile(path.join(MIGRATIONS, 'meta', '_journal.json'), 'utf8')) as { entries: { when: number }[] };
  return Math.max(0, ...journal.entries.map((e) => e.when));
}

/** Base déjà à jour : une seule requête, sans connexion directe ni verrou. */
async function upToDate(db: DB): Promise<boolean> {
  try {
    const [expected, rows] = await Promise.all([
      latestMigration(),
      db.execute<{ at: string | null }>(sql`select max(created_at)::text as at from drizzle.__drizzle_migrations`),
    ]);
    return Number(rows[0]?.at ?? 0) >= expected;
  } catch {
    return false;
  }
}

async function connectPostgres(url: string): Promise<DB> {
  const { default: postgres } = await import('postgres');
  const { drizzle } = await import('drizzle-orm/postgres-js');
  const { migrate } = await import('drizzle-orm/postgres-js/migrator');

  // prepare:false : compatible avec les poolers (Neon, PgBouncer).
  const client = postgres(url, { max: env.dbPoolMax, prepare: false, onnotice: () => {} });
  const db = drizzle(client, { schema });

  if (await upToDate(db)) {
    const { ensureAdmin } = await import('./seed');
    await ensureAdmin(db);
    return db;
  }

  // Migrations sur une connexion directe (hors pooler), sérialisées entre instances par un verrou.
  const direct = postgres(env.databaseDirectUrl ?? url, { max: 1, prepare: false, onnotice: () => {} });
  try {
    const mdb = drizzle(direct, { schema });
    await mdb.execute(sql`select pg_advisory_lock(606290)`);
    try {
      await migrate(mdb, { migrationsFolder: MIGRATIONS });
      const { seed, ensureAdmin } = await import('./seed');
      await seed(mdb as unknown as DB);
      await ensureAdmin(mdb as unknown as DB);
    } finally {
      await mdb.execute(sql`select pg_advisory_unlock(606290)`);
    }
  } finally {
    await direct.end({ timeout: 5 });
  }
  return db;
}

async function connectLocal(): Promise<DB> {
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  const { mkdirSync } = await import('node:fs');
  // Pendant `next build`, plusieurs processus pré-génèrent les pages en parallèle : chacun sa base en mémoire.
  const building = process.env.NEXT_PHASE === 'phase-production-build';
  const dir = building ? null : env.ephemeralDb ? '/tmp/duo-pglite' : path.join(process.cwd(), env.localDbDir);
  if (dir) mkdirSync(dir, { recursive: true });
  const db = drizzle(dir ? new PGlite(dir) : new PGlite(), { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  const { seed, ensureAdmin } = await import('./seed');
  await seed(db as unknown as DB);
  await ensureAdmin(db as unknown as DB);
  return db as unknown as DB;
}

export function getDb(): Promise<DB> {
  if (!g.__duoDb) {
    g.__duoDb = (env.databaseUrl ? connectPostgres(env.databaseUrl) : connectLocal()).catch((e) => {
      g.__duoDb = undefined;
      throw e;
    });
  }
  return g.__duoDb;
}

export { schema };
