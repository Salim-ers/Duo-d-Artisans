import 'server-only';
import { cache } from 'react';
import { getDb, schema } from '@/lib/db';
import { defaultSettings, settingsSchemas, type SettingsKey, type SettingsMap } from '@/lib/settings-shared';

/** Toutes les valeurs enregistrées, lues une fois par rendu. */
const loadAll = cache(async () => {
  const db = await getDb();
  const rows = await db.select().from(schema.settings);
  return new Map(rows.map((r) => [r.key, r.value]));
});

/** Lit un paramètre ; une valeur absente ou invalide retombe sur la valeur par défaut. */
export async function getSetting<K extends SettingsKey>(key: K): Promise<SettingsMap[K]> {
  const raw = (await loadAll()).get(key);
  const parsed = raw === undefined ? null : settingsSchemas[key].safeParse(raw);
  return parsed?.success ? parsed.data : (defaultSettings[key] as SettingsMap[K]);
}

/** Clés réellement enregistrées par la boutique (les autres sont des valeurs par défaut à confirmer). */
export async function savedSettingKeys() {
  return new Set((await loadAll()).keys());
}

export async function saveSetting<K extends SettingsKey>(key: K, value: SettingsMap[K]) {
  const data = settingsSchemas[key].parse(value);
  const db = await getDb();
  await db
    .insert(schema.settings)
    .values({ key, value: data })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: data, updatedAt: new Date() } });
}

/** Les données d'exemple ne sont visibles que si le mode démonstration est activé. */
export async function demoVisible() {
  return (await getSetting('catalog')).demo;
}
