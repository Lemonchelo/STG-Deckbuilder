/**
 * BASE CARD POOL MANAGER
 * Builds the base card pool two ways:
 *
 * A) From the server (loadPoolFromServer, automatic): fetches cartas/pool-manifest.json
 *    (a flat list of image paths) and cartas/catalogo-original.json, then references
 *    each image by its plain relative URL (cartas/SET-N/archivo.webp) — no folder
 *    picker, no per-image download at startup (the <img loading="lazy"> tag only
 *    fetches a card's art when it actually scrolls into view). This is what makes
 *    the base pool show up on any device (phones included) once the app + cartas/
 *    folder are served over HTTP(S) (GitHub Pages, Netlify, a local dev server).
 *    It does nothing (silently) when fetch() isn't usable — e.g. opened via file://,
 *    or the manifest hasn't been generated yet — so file:// keeps working as before.
 *    Run `node tests/generate-pool-manifest.cjs` after adding cards to a SET-N
 *    folder so the manifest matches what's actually on disk.
 *
 * B) Using the File System Access API (window.showDirectoryPicker), kept for local
 *    development: lets you point at a `cartas` folder anywhere on disk (e.g. before
 *    committing new art) without waiting on the manifest. This is separate from the
 *    custom card importer: pool cards live in their own IndexedDB store ('pool_cards')
 *    so "Borrar Cartas Personalizadas" never touches them.
 *
 * Flow:
 * 1. First click on "Buscar Actualizaciones": the browser asks the user to pick the
 *    project's `cartas` folder. The picked folder handle is persisted in IndexedDB
 *    ('app_config') so future visits do not need to pick it again (only re-confirm
 *    permission, which the browser may still ask for).
 * 2. On every app load, initPoolCards() loads whatever was cached in 'pool_cards' on
 *    a previous scan (no folder access needed), then runs loadPoolFromServer() to
 *    pick up anything the manifest has that isn't cached yet.
 * 3. Clicking "Buscar Actualizaciones" again re-reads the linked folder and adds only
 *    the images not seen before (matched by their relative path), so adding a new
 *    SET-N folder and re-scanning is enough to pick it up.
 *
 * Browsers without showDirectoryPicker (Firefox, Safari, every mobile browser) simply
 * don't get the "Buscar Actualizaciones" button's functionality — they still get the
 * base pool via loadPoolFromServer() as long as the app is served over HTTP(S).
 */

import { CARDS_DATA } from './cardsData.js';

const DB_NAME = 'AetheriumTCG_CustomCardsDB';
const POOL_STORE = 'pool_cards';
const CONFIG_STORE = 'app_config';
const CONFIG_KEY_HANDLE = 'cartasDirHandle';
const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp)$/i;

let dbInstance = null;

function openDB() {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, 3);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('custom_cards')) {
          db.createObjectStore('custom_cards', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(POOL_STORE)) {
          db.createObjectStore(POOL_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(CONFIG_STORE)) {
          db.createObjectStore(CONFIG_STORE, { keyPath: 'key' });
        }
      };
      request.onsuccess = (e) => { dbInstance = e.target.result; resolve(dbInstance); };
      request.onerror = () => reject(request.error || new Error('No se pudo abrir el almacenamiento local.'));
    } catch (err) {
      reject(err);
    }
  });
}

async function getDB() {
  return dbInstance || openDB();
}

function savePoolCardToDB(card) {
  return getDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(POOL_STORE, 'readwrite');
    tx.objectStore(POOL_STORE).put(card);
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () => reject(tx.error || new Error('No se pudo guardar una carta de la pool base.'));
  }));
}

function loadSavedPoolCards() {
  return getDB().then(db => new Promise((resolve) => {
    try {
      const request = db.transaction(POOL_STORE, 'readonly').objectStore(POOL_STORE).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    } catch (err) {
      resolve([]);
    }
  })).catch(() => []);
}

function saveDirHandle(handle) {
  return getDB().then(db => new Promise((resolve) => {
    try {
      const tx = db.transaction(CONFIG_STORE, 'readwrite');
      tx.objectStore(CONFIG_STORE).put({ key: CONFIG_KEY_HANDLE, handle });
      tx.oncomplete = () => resolve(true);
      tx.onerror = tx.onabort = () => resolve(false); // not fatal: the user can just pick the folder again next time
    } catch (err) {
      resolve(false);
    }
  })).catch(() => false);
}

function loadDirHandle() {
  return getDB().then(db => new Promise((resolve) => {
    try {
      const request = db.transaction(CONFIG_STORE, 'readonly').objectStore(CONFIG_STORE).get(CONFIG_KEY_HANDLE);
      request.onsuccess = () => resolve(request.result ? request.result.handle : null);
      request.onerror = () => resolve(null);
    } catch (err) {
      resolve(null);
    }
  })).catch(() => null);
}

/** Loads whatever the base pool already has cached; called once on app startup, no folder access needed. */
export async function initPoolCards() {
  let cachedCards = [];
  try {
    cachedCards = await openDB().then(loadSavedPoolCards);
  } catch (err) {
    cachedCards = [];
  }
  cachedCards.forEach(card => {
    if (!CARDS_DATA.some(c => c.id === card.id)) CARDS_DATA.push(card);
  });

  await loadPoolFromServer();

  return CARDS_DATA.filter(c => c.isPool);
}

export function isPoolUpdateSupported() {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

// ── Server-side loading (works on GitHub Pages, Netlify, any HTTP host, and on
//    phones/browsers without showDirectoryPicker) ─────────────────────────────
const MANIFEST_PATH = 'cartas/pool-manifest.json';
const CATALOG_PATH = 'cartas/catalogo-original.json';

async function fetchJSON(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Same shape as readCatalog(dirHandle), but fetched over HTTP instead of read from a picked folder. */
async function loadCatalogFromServer() {
  try {
    const parsed = await fetchJSON(CATALOG_PATH);
    const list = Array.isArray(parsed) ? parsed : (parsed.cards || []);
    const map = new Map();
    for (const entry of list) {
      if (entry && typeof entry.archivo === 'string') {
        map.set(entry.archivo.replace(/\\/g, '/'), entry);
      }
    }
    return map;
  } catch (err) {
    return new Map(); // optional file: filename-only parsing still works without it
  }
}

/**
 * Builds the base pool from cartas/pool-manifest.json + the images already
 * committed alongside the app, referencing each image by its plain relative URL
 * (no download, no base64 conversion — the browser only fetches an image once it
 * actually scrolls into view, same as any other <img loading="lazy">).
 * Silently does nothing if the manifest can't be fetched: opened via file://,
 * running on a host that doesn't serve cartas/, or the manifest doesn't exist yet.
 */
async function loadPoolFromServer() {
  let manifest;
  try {
    manifest = await fetchJSON(MANIFEST_PATH);
  } catch (err) {
    return; // no manifest reachable: nothing to do, the folder-picker flow still works
  }
  if (!Array.isArray(manifest) || manifest.length === 0) return;

  const catalog = await loadCatalogFromServer();
  const known = new Set(CARDS_DATA.map(c => c.id));

  for (const relPath of manifest) {
    const id = 'pool_' + hashPath(relPath);
    if (known.has(id)) continue;
    const imageUrl = 'cartas/' + relPath;
    const card = parsePoolCardFromPath(relPath, imageUrl, catalog.get(relPath));
    CARDS_DATA.push(card);
    known.add(card.id);
  }
}

// ── Deterministic ids ─────────────────────────────────────────────────────────
// Pool card ids are derived from their path (e.g. "SET-1/Alazul_..."), not random,
// so the same file always gets the same id across scans, app restarts and saved decks.
function hashPath(text) {
  // FNV-1a 32-bit: small, dependency-free, stable across sessions and browsers.
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

// ── Filename parser (mirrors customCardImporter.js's documented format) ────────
const TYPE_MAP = {
  criatura: 'Criatura', creature: 'Criatura', monstruo: 'Criatura', unidad: 'Criatura',
  hechizorapido: 'HechizoRapido', fastspell: 'HechizoRapido', instant: 'HechizoRapido', rapido: 'HechizoRapido',
  hechizolento: 'HechizoLento', slowspell: 'HechizoLento', sorcery: 'HechizoLento', hechizo: 'HechizoLento', lento: 'HechizoLento', spell: 'HechizoLento',
  estructura: 'Estructura', structure: 'Estructura', landmark: 'Estructura', monumento: 'Estructura',
  artefacto: 'Artefacto', artifact: 'Artefacto', reliquia: 'Artefacto', objeto: 'Artefacto',
  sello: 'Sello', seal: 'Sello', tierra_mana: 'Sello', land: 'Sello', mana: 'Sello',
  terreno: 'Terreno', field: 'Terreno', campo: 'Terreno', habitat: 'Terreno',
  token: 'Token', ficha: 'Token'
};

const RARITY_MAP = {
  comun: 'Common', común: 'Common', common: 'Common',
  rara: 'Rare', rare: 'Rare',
  epica: 'Epic', épica: 'Epic', epic: 'Epic',
  legendaria: 'Legendary', legendary: 'Legendary', mitica: 'Legendary', mítica: 'Legendary'
};

const ELEMENT_MAP = {
  marte: 'marte', mars: 'marte', fuego: 'marte', rojo: 'marte', red: 'marte',
  neptuno: 'neptuno', neptune: 'neptuno', agua: 'neptuno', azul: 'neptuno', blue: 'neptuno', water: 'neptuno',
  jupiter: 'jupiter', júpiter: 'jupiter', oro: 'jupiter', dorado: 'jupiter', gold: 'jupiter', ambar: 'jupiter',
  tierra: 'tierra', earth: 'tierra', terra: 'tierra', verde: 'tierra', green: 'tierra', naturaleza: 'tierra',
  saturno: 'saturno', saturn: 'saturno', morado: 'saturno', violeta: 'saturno', purple: 'saturno',
  mercurio: 'mercurio', mercury: 'mercurio', plata: 'mercurio', plateado: 'mercurio', silver: 'mercurio', gris: 'mercurio',
  pluton: 'pluton', plutón: 'pluton', pluto: 'pluton', vacio: 'pluton', vacío: 'pluton', sombra: 'pluton', negro: 'pluton',
  arcano: 'neutral', neutral: 'neutral', incoloro: 'neutral', colorless: 'neutral'
};

function cleanCardName(rawName) {
  return rawName.replace(/[-_]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
}

/**
 * Parses one image's relative path (e.g. "SET-1/Nombre_Tipo_Rareza_Faccion_ATK_DEF_Coste.webp")
 * into a pool card object. `catalogEntry`, when a matching row from catalogo-original.json
 * exists for this path, is used only to fill in `description`/`flavor` with the real card
 * text — it never overrides the type, rarity, element or stats the filename encodes, since
 * that format is the one documented in cartas/README.md and covered by the app's tests.
 */
export function parsePoolCardFromPath(relPath, dataUrl, catalogEntry) {
  const filename = relPath.split('/').pop();
  const base = filename.substring(0, filename.lastIndexOf('.')) || filename;
  const parts = base.split('_');
  const firstPart = (parts[0] || '').toLowerCase().trim();
  const id = 'pool_' + hashPath(relPath);

  const common = { id, source: relPath, imageUrl: dataUrl, isPool: true };

  if (firstPart === 'sello') {
    const planetKey = parts.length > 2 ? parts[2].toLowerCase().trim() : (parts[1] || 'marte').toLowerCase().trim();
    const element = ELEMENT_MAP[planetKey] || 'neutral';
    const name = parts.length > 2 ? `Sello de ${cleanCardName(parts[1])}` : `Sello de ${cleanCardName(planetKey)}`;
    return {
      ...common,
      name,
      element,
      type: 'Sello',
      rarity: null,
      cost: 0,
      attack: null,
      health: null,
      description: (catalogEntry && catalogEntry.description) || `Sello elemental de ${element.toUpperCase()}. Genera 1 punto de maná de ${element.toUpperCase()}.`,
      flavor: (catalogEntry && catalogEntry.lore) || `"La resonancia cósmica de ${element} fluye a través de este sello sagrado."`,
      isSello: true
    };
  }

  if (firstPart === 'token') {
    const planetKey = parts.length > 2 ? parts[2].toLowerCase().trim() : (parts[1] || 'marte').toLowerCase().trim();
    const element = ELEMENT_MAP[planetKey] || 'neutral';
    const tokenName = parts.length > 2 ? cleanCardName(parts[1]) : `Token de ${cleanCardName(planetKey)}`;
    return {
      ...common,
      name: tokenName,
      element,
      type: 'Token',
      rarity: 'Common',
      cost: 0,
      attack: 1,
      health: 1,
      description: (catalogEntry && catalogEntry.description) || `Token de Facción (${element.toUpperCase()}). Se invoca automáticamente en el Mazo Extra cuando tu mazo contiene cartas de ${element.toUpperCase()}.`,
      flavor: (catalogEntry && catalogEntry.lore) || `"Ficha elemental invocada por la presencia de ${element}."`,
      isToken: true
    };
  }

  const name = cleanCardName(parts[0] || 'Carta');
  const rawType = (parts[1] || 'Criatura').toLowerCase().replace(/\s+/g, '').trim();
  const rawRarity = (parts[2] || 'Comun').toLowerCase().trim();
  const rawColor = (parts[3] || 'Neutral').toLowerCase().trim();
  const rawAtk = parts[4];
  const rawDef = parts[5];
  const rawCost = parts[6] || parts[parts.length - 1];

  const type = TYPE_MAP[rawType] || 'Criatura';
  let rarity = RARITY_MAP[rawRarity] || 'Common';
  const element = ELEMENT_MAP[rawColor] || 'neutral';
  const isSello = type === 'Sello';
  if (isSello) rarity = null;

  let attack = null;
  let health = null;
  if (type === 'Criatura') {
    const pAtk = parseInt(rawAtk, 10);
    const pDef = parseInt(rawDef, 10);
    attack = isNaN(pAtk) ? 1 : Math.max(0, pAtk);
    health = isNaN(pDef) ? 1 : Math.max(1, pDef);
  }

  let cost = 0;
  if (!isSello && rawCost !== undefined) {
    const match = String(rawCost).match(/\d+/);
    if (match) cost = parseInt(match[0], 10);
  }

  return {
    ...common,
    name: (catalogEntry && catalogEntry.name) || name,
    element,
    type,
    rarity,
    cost: Math.max(0, Math.min(20, cost)),
    attack,
    health,
    description: (catalogEntry && catalogEntry.description) || `Carta de tipo ${type} alineada con el planeta ${element.toUpperCase()}.`,
    flavor: (catalogEntry && catalogEntry.lore) || `"${name} se manifiesta desde los archivos de la pool base."`,
    isToken: type === 'Token',
    isSello
  };
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reader.onabort = () => reject(new Error('No se pudo leer: ' + file.name));
    reader.readAsDataURL(file);
  });
}

/** Recursively walks a directory handle, yielding { relPath, fileHandle } for every image file. */
async function* walkImages(dirHandle, prefix = '') {
  for await (const entry of dirHandle.values()) {
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.kind === 'directory') {
      yield* walkImages(entry, relPath);
    } else if (entry.kind === 'file' && IMAGE_EXTENSIONS.test(entry.name)) {
      yield { relPath, fileHandle: entry };
    }
  }
}

/** Best-effort read of catalogo-original.json at the folder root, keyed by its `archivo` field. */
async function readCatalog(dirHandle) {
  try {
    const fileHandle = await dirHandle.getFileHandle('catalogo-original.json');
    const file = await fileHandle.getFile();
    const parsed = JSON.parse(await file.text());
    const list = Array.isArray(parsed) ? parsed : (parsed.cards || []);
    const map = new Map();
    for (const entry of list) {
      if (entry && typeof entry.archivo === 'string') {
        map.set(entry.archivo.replace(/\\\\/g, '/'), entry);
      }
    }
    return map;
  } catch (err) {
    return new Map(); // optional file: filename-only parsing still works without it
  }
}

async function ensurePermission(handle) {
  const opts = { mode: 'read' };
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  return (await handle.requestPermission(opts)) === 'granted';
}

/**
 * Scans the linked `cartas` folder and adds any image not already in the pool.
 * Must be called directly from a click handler the first time (showDirectoryPicker
 * needs a user gesture); once a folder is linked, later calls only need read
 * permission, which the browser may grant silently.
 */
export async function checkForPoolUpdates(onProgress) {
  if (!isPoolUpdateSupported()) {
    return { success: false, unsupported: true, reason: 'Tu navegador no admite esta función (probá con Chrome o Edge). Usá "Importar Cartas" para cargar la pool base a mano.' };
  }

  let dirHandle = await loadDirHandle();
  try {
    if (dirHandle) {
      if (!(await ensurePermission(dirHandle))) {
        dirHandle = null; // permission revoked: fall through to asking again below
      }
    }
    if (!dirHandle) {
      dirHandle = await window.showDirectoryPicker({ id: 'tcg-deckbuilder-cartas', mode: 'read' });
      await saveDirHandle(dirHandle);
    }
  } catch (err) {
    if (err && err.name === 'AbortError') return { success: false, cancelled: true };
    return { success: false, reason: 'No se pudo acceder a la carpeta: ' + (err && err.message ? err.message : err) };
  }

  const known = new Set(CARDS_DATA.filter(c => c.isPool && c.source).map(c => c.source));
  const catalog = await readCatalog(dirHandle);

  const toImport = [];
  const setsSeen = new Set();
  try {
    for await (const { relPath, fileHandle } of walkImages(dirHandle)) {
      setsSeen.add(relPath.split('/')[0]);
      if (!known.has(relPath)) toImport.push({ relPath, fileHandle });
    }
  } catch (err) {
    return { success: false, reason: 'No se pudo leer el contenido de la carpeta: ' + (err && err.message ? err.message : err) };
  }

  if (toImport.length === 0) {
    return { success: true, added: 0, sets: [...setsSeen].sort() };
  }

  const newSets = new Set();
  for (let i = 0; i < toImport.length; i++) {
    const { relPath, fileHandle } = toImport[i];
    const file = await fileHandle.getFile();
    const dataUrl = await readFileAsDataURL(file);
    const card = parsePoolCardFromPath(relPath, dataUrl, catalog.get(relPath));
    if (!CARDS_DATA.some(c => c.id === card.id)) {
      await savePoolCardToDB(card);
      CARDS_DATA.push(card);
      newSets.add(relPath.split('/')[0]);
    }
    if (onProgress) onProgress(i + 1, toImport.length, card);
  }

  return { success: true, added: toImport.length, sets: [...newSets].sort() };
}
