#!/usr/bin/env node
/**
 * Validation des images — exécutée avant chaque build (npm « prebuild »).
 *
 * Fait ÉCHOUER le build si :
 *  - une image référencée dans le code n'existe pas dans /public (casse comprise) ;
 *  - les dimensions déclarées dans data/media.ts ne correspondent pas au fichier ;
 *  - une image pointe vers un hébergement temporaire (Instagram, Facebook, Google Photos…).
 *
 * Affiche un inventaire (dimensions, ratio, poids) et des avertissements
 * (image trop légère pour un grand format, fichier trop lourd).
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const root = process.cwd();
const errors = [];
const warnings = [];

/* ---------- Lecture des dimensions depuis l'en-tête du fichier ---------- */
function dimensions(file) {
  const b = readFileSync(file);
  const ext = extname(file).toLowerCase();
  if (ext === '.webp') {
    const chunk = b.toString('ascii', 12, 16);
    if (chunk === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (chunk === 'VP8L') {
      const v = b.readUInt32LE(21);
      return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 };
    }
    return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  }
  if (ext === '.png') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (ext === '.jpg' || ext === '.jpeg') {
    let i = 2;
    while (i < b.length) {
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      }
      i += 2 + len;
    }
  }
  return null;
}

/* ---------- Existence avec casse exacte (Vercel est sensible à la casse) ---------- */
function existsExact(publicPath) {
  const parts = publicPath.replace(/^\//, '').split('/');
  let dir = join(root, 'public');
  for (const part of parts) {
    if (!existsSync(dir) || !readdirSync(dir).includes(part)) return false;
    dir = join(dir, part);
  }
  return true;
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx?|css|mjs)$/.test(name)) out.push(full);
  }
  return out;
}

/* ---------- 1. Inventaire déclaré dans data/media.ts ---------- */
const mediaSource = readFileSync(join(root, 'data/media.ts'), 'utf8');
const declared = [...mediaSource.matchAll(/(\w+):\s*\{\s*src:\s*'([^']+)',[\s\S]*?width:\s*(\d+),\s*height:\s*(\d+)/g)].map(
  ([, key, src, w, h]) => ({ key, src, w: Number(w), h: Number(h) }),
);
if (declared.length === 0) errors.push('Aucune image trouvée dans data/media.ts (format inattendu ?)');

const rows = [];
for (const img of declared) {
  if (/^https?:/.test(img.src)) {
    errors.push(`${img.key} : image distante (${img.src}). Les photographies doivent être servies depuis /public.`);
    continue;
  }
  if (!existsExact(img.src)) {
    errors.push(`${img.key} : fichier introuvable ou casse différente → public${img.src}`);
    continue;
  }
  const file = join(root, 'public', img.src);
  const size = statSync(file).size;
  const real = dimensions(file);
  if (!real) {
    errors.push(`${img.key} : format non lu (${extname(file)})`);
    continue;
  }
  if (real.w !== img.w || real.h !== img.h) {
    errors.push(`${img.key} : dimensions déclarées ${img.w}×${img.h}, fichier réel ${real.w}×${real.h}`);
  }
  if (real.w < 1200) warnings.push(`${img.key} : ${real.w} px de large — trop peu pour un grand visuel.`);
  if (size > 600 * 1024) warnings.push(`${img.key} : ${(size / 1024).toFixed(0)} Ko — à recompresser.`);
  rows.push({ image: img.key, fichier: img.src, dimensions: `${real.w}×${real.h}`, ratio: (real.w / real.h).toFixed(3), poids: `${(size / 1024).toFixed(0)} Ko` });
}

/* ---------- 2. Toute référence /images/… ou hébergement temporaire dans le code ---------- */
const tempHosts = /(cdninstagram|fbcdn|scontent[.-]|googleusercontent|lh\d\.google|ggpht|photos\.app\.goo\.gl|drive\.google\.com)/i;
for (const file of ['app', 'components', 'data', 'lib'].flatMap((d) => (existsSync(join(root, d)) ? walk(join(root, d)) : []))) {
  const source = readFileSync(file, 'utf8');
  for (const [, path] of source.matchAll(/['"`(](\/images\/[^'"`)\s]+)/g)) {
    if (!existsExact(path)) errors.push(`${relative(root, file)} : référence introuvable → ${path}`);
  }
  for (const [url] of source.matchAll(/https?:\/\/[^\s'"`)]+/g)) {
    if (tempHosts.test(url)) errors.push(`${relative(root, file)} : lien d'image temporaire interdit → ${url}`);
  }
}

/* ---------- Rapport ---------- */
console.log(`\nImages : ${rows.length} vérifiées`);
console.table(rows);
for (const w of warnings) console.warn(`  ! ${w}`);
if (errors.length) {
  console.error(`\n${errors.length} erreur(s) d'image — build interrompu :`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('Toutes les images référencées existent et sont conformes.\n');
