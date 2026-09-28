#!/usr/bin/env node
/**
 * Regenera snd/sound-manifest.json: los nombres de los archivos de audio de
 * snd/bgm (música de fondo) y snd/sfx (efectos), ordenados.
 *
 * js/sound.js (y su copia en js/bundle.js) lee este archivo por fetch() porque
 * GitHub Pages no permite listar carpetas. Igual que cartas/pool-manifest.json:
 * correr esto tras sumar o sacar archivos y commitear el manifest junto con ellos.
 *
 * Extensiones válidas: mp3, wav, ogg.
 *
 * Uso: node tests/generate-sound-manifest.cjs
 */

const fs = require('node:fs');
const path = require('node:path');

const SND_DIR = path.join(__dirname, '..', 'snd');
const MANIFEST_PATH = path.join(SND_DIR, 'sound-manifest.json');
const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg)$/i;
const FOLDERS = ['bgm', 'sfx'];

function listAudio(folder) {
  const dir = path.join(SND_DIR, folder);
  if (!fs.existsSync(dir)) {
    console.warn(`  (no existe snd/${folder}/, se deja vacío)`);
    return [];
  }
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile() && AUDIO_EXTENSIONS.test(entry.name))
    .map(entry => entry.name)
    .sort();
}

function main() {
  fs.mkdirSync(SND_DIR, { recursive: true });

  const previous = fs.existsSync(MANIFEST_PATH)
    ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
    : {};

  const manifest = {};
  for (const folder of FOLDERS) manifest[folder] = listAudio(folder);

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest));

  console.log('snd/sound-manifest.json:');
  for (const folder of FOLDERS) {
    const before = Array.isArray(previous[folder]) ? previous[folder] : [];
    const added = manifest[folder].filter(n => !before.includes(n));
    const removed = before.filter(n => !manifest[folder].includes(n));
    console.log(`  ${folder}: ${manifest[folder].length} archivo(s)`);
    if (added.length) console.log(`    + ${added.join(', ')}`);
    if (removed.length) console.log(`    - ${removed.join(', ')}`);
  }
}

main();
