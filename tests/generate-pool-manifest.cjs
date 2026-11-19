#!/usr/bin/env node
/**
 * Generates cartas/pool-manifest.json from the image files stored directly in
 * cartas/SET-N/. Run locally with `node tests/generate-pool-manifest.cjs`.
 * GitHub Actions runs it automatically before publishing GitHub Pages.
 */

const fs = require('node:fs');
const path = require('node:path');

const CARTAS_DIR = path.join(__dirname, '..', 'cartas');
const MANIFEST_PATH = path.join(CARTAS_DIR, 'pool-manifest.json');
const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp)$/i;
const SET_DIRECTORY = /^SET-\d+$/i;

const TYPES = new Set([
  'criatura', 'hechizorapido', 'hechizolento', 'estructura', 'artefacto',
  'sello', 'terreno', 'token'
]);
const RARITIES = new Set(['comun', 'común', 'rara', 'epica', 'épica', 'legendaria']);
const ELEMENTS = new Set([
  'marte', 'mars', 'fuego', 'rojo', 'red', 'neptuno', 'neptune', 'agua', 'azul', 'blue',
  'jupiter', 'júpiter', 'oro', 'dorado', 'gold', 'ambar', 'tierra', 'earth', 'terra',
  'verde', 'green', 'naturaleza', 'saturno', 'saturn', 'morado', 'violeta', 'purple',
  'mercurio', 'mercury', 'plata', 'plateado', 'silver', 'gris', 'pluton', 'plutón',
  'pluto', 'vacio', 'vacío', 'sombra', 'negro', 'arcano', 'neutral', 'incoloro', 'colorless'
]);

function validateFilename(filename) {
  const base = filename.replace(IMAGE_EXTENSIONS, '');
  const parts = base.split('_');
  const first = (parts[0] || '').toLowerCase();
  const problems = [];

  if (first === 'token') {
    if (parts.length !== 3) problems.push('los tokens deben usar Token_Nombre_Elemento.ext');
    else if (!ELEMENTS.has(parts[2].toLowerCase())) problems.push(`elemento desconocido: ${parts[2]}`);
    return problems;
  }

  if (first === 'sello') {
    if (parts.length !== 2 && parts.length !== 3) problems.push('los sellos deben usar Sello_Elemento.ext o Sello_Nombre_Elemento.ext');
    const element = parts.length === 3 ? parts[2] : parts[1];
    if (element && !ELEMENTS.has(element.toLowerCase())) problems.push(`elemento desconocido: ${element}`);
    return problems;
  }

  if (parts.length !== 7) {
    problems.push('se esperan 7 campos: Nombre_Tipo_Rareza_Elemento_Ataque_Vida_Coste.ext');
    return problems;
  }
  if (!TYPES.has(parts[1].toLowerCase())) problems.push(`tipo desconocido: ${parts[1]}`);
  if (!RARITIES.has(parts[2].toLowerCase())) problems.push(`rareza desconocida: ${parts[2]}`);
  if (!ELEMENTS.has(parts[3].toLowerCase())) problems.push(`elemento desconocido: ${parts[3]}`);
  for (const [index, label] of [[4, 'ataque'], [5, 'vida'], [6, 'coste']]) {
    if (!/^\d+$/.test(parts[index])) problems.push(`${label} debe ser un número entero: ${parts[index]}`);
  }
  return problems;
}

function collectImages(cartasDir) {
  const images = [];
  const warnings = [];
  if (!fs.existsSync(cartasDir)) throw new Error(`No se encontró la carpeta cartas/: ${cartasDir}`);

  const sets = fs.readdirSync(cartasDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && SET_DIRECTORY.test(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));

  for (const set of sets) {
    const setPath = path.join(cartasDir, set.name);
    const entries = fs.readdirSync(setPath, { withFileTypes: true })
      .filter(entry => entry.isFile() && IMAGE_EXTENSIONS.test(entry.name))
      .sort((a, b) => a.name.localeCompare(b.name, 'en'));

    for (const entry of entries) {
      const relPath = `${set.name}/${entry.name}`;
      images.push(relPath);
      const problems = validateFilename(entry.name);
      if (problems.length) warnings.push({ path: relPath, problems });
    }
  }

  return { images, warnings };
}

function main() {
  const { images, warnings } = collectImages(CARTAS_DIR);
  const previous = fs.existsSync(MANIFEST_PATH)
    ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
    : [];

  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(images, null, 2)}\n`);

  const added = images.filter(file => !previous.includes(file));
  const removed = previous.filter(file => !images.includes(file));
  console.log(`cartas/pool-manifest.json: ${images.length} imágenes encontradas en ${new Set(images.map(file => file.split('/')[0])).size} sets.`);
  if (added.length) console.log(`  + ${added.length} nueva(s): ${added.slice(0, 10).join(', ')}${added.length > 10 ? ', ...' : ''}`);
  if (removed.length) console.log(`  - ${removed.length} eliminada(s): ${removed.slice(0, 10).join(', ')}${removed.length > 10 ? ', ...' : ''}`);
  if (!added.length && !removed.length) console.log('  (sin cambios respecto al manifest anterior)');

  if (warnings.length) {
    console.warn(`\nAVISO: ${warnings.length} imagen(es) tienen nombres que podrían impedir interpretar correctamente sus datos:`);
    for (const warning of warnings) {
      console.warn(`  - ${warning.path}: ${warning.problems.join('; ')}`);
    }
    console.warn('La imagen se incluye igualmente en el manifest. Corregí el nombre para que la carta se interprete bien.');
  }
}

if (require.main === module) main();
module.exports = { collectImages, validateFilename };
