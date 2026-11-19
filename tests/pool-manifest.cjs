const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { collectImages, validateFilename } = require('./generate-pool-manifest.cjs');

const valid = 'Obrero-de-la-Caldera_Criatura_Rara_Marte_3_1_2.webp';
assert.deepEqual(validateFilename(valid), []);
assert.deepEqual(validateFilename('Token_Cofre-de-Algas_Neptuno.webp'), []);
assert.deepEqual(validateFilename('Sello_Pluton.webp'), []);
assert(validateFilename('Carta_Criatura_Rara_Marte_2_2.webp').length > 0);
assert(validateFilename('Carta_Criatura_Rara_Nepturno_2_2_2.webp').some(x => x.includes('elemento desconocido')));

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'deckbuilder-pool-'));
try {
  fs.mkdirSync(path.join(root, 'SET-1'));
  fs.mkdirSync(path.join(root, 'SET-8'));
  fs.mkdirSync(path.join(root, 'otros'));
  fs.writeFileSync(path.join(root, 'SET-1', valid), '');
  fs.writeFileSync(path.join(root, 'SET-8', 'Token_Cofre-de-Algas_Neptuno.webp'), '');
  fs.writeFileSync(path.join(root, 'otros', 'ignorar.webp'), '');
  fs.writeFileSync(path.join(root, 'SET-8', 'notas.txt'), '');
  const result = collectImages(root);
  assert.equal(result.images.length, 2);
  assert(result.images.some(x => x.startsWith('SET-1/')));
  assert(result.images.some(x => x.startsWith('SET-8/')));
  assert.equal(result.warnings.length, 0);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

const projectCartas = path.join(__dirname, '..', 'cartas');
const projectPool = collectImages(projectCartas);
assert(projectPool.images.some(file => file.startsWith('SET-7/')), 'SET-7 must be discovered automatically');
assert.equal(new Set(projectPool.images).size, projectPool.images.length, 'manifest paths must be unique');
assert.equal(new Set(projectPool.images.map(file => file.split('/')[0])).size, 7, 'all seven set folders should be included');

console.log('Pool manifest: SET discovery, image filtering, SET-7 inclusion and filename validation passed');
