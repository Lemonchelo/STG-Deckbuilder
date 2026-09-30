#!/usr/bin/env node
/**
 * Regenerates cartas/pool-manifest.json: a flat, sorted JSON array of every
 * card image's path relative to cartas/ (e.g. "SET-1/Alazul_Criatura_..._4.webp").
 *
 * js/poolManager.js's loadPoolFromServer() fetches this file to build the base
 * pool over plain HTTP (GitHub Pages, Netlify, a local dev server, a phone) —
 * without it, or if it's stale, cards added since the last run won't show up
 * for anyone except people who used "Buscar Actualizaciones" locally.
 *
 * Run this after adding or removing images under cartas/SET-N/, then commit
 * the updated cartas/pool-manifest.json alongside the new images.
 *
 * Usage: node tests/generate-pool-manifest.cjs
 */

const fs = require('node:fs');
const path = require('node:path');

const CARTAS_DIR = path.join(__dirname, '..', 'cartas');
const MANIFEST_PATH = path.join(CARTAS_DIR, 'pool-manifest.json');
const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp)$/i;

function walk(dir, prefix, results) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, relPath, results);
    } else if (IMAGE_EXTENSIONS.test(entry.name)) {
      results.push(relPath);
    }
  }
}

function main() {
  if (!fs.existsSync(CARTAS_DIR)) {
    console.error(`No se encontró la carpeta cartas/ en ${CARTAS_DIR}`);
    process.exit(1);
  }

  const images = [];
  walk(CARTAS_DIR, '', images);
  images.sort();

  const previous = fs.existsSync(MANIFEST_PATH)
    ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
    : [];

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(images));

  const added = images.filter(p => !previous.includes(p));
  const removed = previous.filter(p => !images.includes(p));

  console.log(`cartas/pool-manifest.json: ${images.length} imágenes.`);
  if (added.length) console.log(`  + ${added.length} nueva(s): ${added.slice(0, 10).join(', ')}${added.length > 10 ? ', ...' : ''}`);
  if (removed.length) console.log(`  - ${removed.length} ya no existen: ${removed.slice(0, 10).join(', ')}${removed.length > 10 ? ', ...' : ''}`);
  if (!added.length && !removed.length) console.log('  (sin cambios respecto al manifest anterior)');
}

main();
