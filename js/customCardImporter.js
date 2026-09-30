/**
 * CUSTOM CARDS IMPORT ENGINE & INDEXED-DB PERSISTENCE
 * Supports:
 * 1. Standard cards: Nombre_Tipo_Rareza_Faccion_ATK_DEF_Coste.png
 * 2. Token cards: Token_Nombre_Faccion.png (or Token_Faccion.png)
 * 3. Sello cards: Sello_Faccion.png (or Sello_Nombre_Faccion.png)
 */

import { CARDS_DATA } from './cardsData.js';

const DB_NAME = 'AetheriumTCG_CustomCardsDB';
const STORE_NAME = 'custom_cards';
let dbInstance = null;

// ==================== INDEXED-DB STORAGE ====================

export function initIndexedDB() {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 3);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        // Added in v3 for the base card pool (poolManager.js); kept separate from
        // custom_cards so "Borrar Cartas Personalizadas" never touches it.
        if (!db.objectStoreNames.contains('pool_cards')) {
          db.createObjectStore('pool_cards', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('app_config')) {
          db.createObjectStore('app_config', { keyPath: 'key' });
        }
      };

      request.onsuccess = (e) => {
        dbInstance = e.target.result;
        loadSavedCustomCards().then(resolve);
      };

      request.onerror = () => resolve([]);
    } catch (e) {
      resolve([]);
    }
  });
}

export function saveCustomCardToDB(card) {
  if (!dbInstance) return Promise.reject(new Error('No está disponible el almacenamiento de cartas en este navegador.'));
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(card);
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () => reject(tx.error || new Error('No se pudo guardar la carta. Revisá el espacio disponible.'));
  });
}

export function loadSavedCustomCards() {
  if (!dbInstance) return Promise.resolve([]);
  return new Promise((resolve) => {
    try {
      const tx = dbInstance.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const cards = request.result || [];
        cards.forEach(card => {
          if (!CARDS_DATA.some(c => c.id === card.id)) {
            CARDS_DATA.push(card);
          }
        });
        resolve(cards);
      };
      request.onerror = () => resolve([]);
    } catch (e) {
      resolve([]);
    }
  });
}

export function clearCustomCardsDB() {
  if (!dbInstance) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch (e) {
      resolve();
    }
  });
}

// ==================== FILENAME PARSER ====================

const TYPE_MAP = {
  // Criatura
  criatura: 'Criatura', creature: 'Criatura', monstruo: 'Criatura', unidad: 'Criatura',
  // Hechizo Rápido
  hechizorapido: 'HechizoRapido', hechizo_rapido: 'HechizoRapido', fastspell: 'HechizoRapido', instant: 'HechizoRapido', rapido: 'HechizoRapido',
  // Hechizo Lento
  hechizolento: 'HechizoLento', hechizo_lento: 'HechizoLento', slowspell: 'HechizoLento', sorcery: 'HechizoLento', hechizo: 'HechizoLento', lento: 'HechizoLento', spell: 'HechizoLento',
  // Estructura
  estructura: 'Estructura', structure: 'Estructura', landmark: 'Estructura', monumento: 'Estructura',
  // Artefacto
  artefacto: 'Artefacto', artifact: 'Artefacto', reliquia: 'Artefacto', objeto: 'Artefacto',
  // Sello (Recurso / Tierra)
  sello: 'Sello', seal: 'Sello', tierra_mana: 'Sello', land: 'Sello', mana: 'Sello',
  // Terreno (Campo de batalla / Field)
  terreno: 'Terreno', field: 'Terreno', campo: 'Terreno', habitat: 'Terreno',
  // Token (Mazo extra)
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
  return rawName
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
}

/**
 * Parse card filenames supporting:
 * 1. Sello_Faccion.png or Sello_Nombre_Faccion.png
 * 2. Token_Nombre_Faccion.png or Token_Faccion.png
 * 3. Nombre_Tipo_Rareza_Faccion_ATK_DEF_Coste.png
 */
export function parseCardFilename(filename, dataUrl) {
  const base = filename.substring(0, filename.lastIndexOf('.')) || filename;
  const parts = base.split('_');
  const firstPart = parts[0].toLowerCase().trim();

  // 1. PATTERN: Sello_Faccion (e.g. Sello_Marte.png or Sello_MagmaAncestral_Marte.png)
  if (firstPart === 'sello') {
    const planetKey = parts.length > 2 ? parts[2].toLowerCase().trim() : (parts[1] || 'marte').toLowerCase().trim();
    const element = ELEMENT_MAP[planetKey] || 'neutral';
    const name = parts.length > 2 ? `Sello de ${cleanCardName(parts[1])}` : `Sello de ${cleanCardName(planetKey)}`;
    const id = 'sello_' + element + '_' + Math.random().toString(36).substring(2, 7);

    return {
      id,
      name,
      element,
      type: 'Sello',
      rarity: null, // Sellos have NO rarity and NO copy limit!
      cost: 0,
      attack: null,
      health: null,
      description: `Sello elemental de ${element.toUpperCase()}. Genera 1 punto de maná de ${element.toUpperCase()}.`,
      flavor: `"La resonancia cósmica de ${element} fluye a través de este sello sagrado."`,
      imageUrl: dataUrl,
      isCustom: true,
      isSello: true
    };
  }

  // 2. PATTERN: Token_Nombre_Faccion (e.g. Token_GuerreroMarciano_Marte.png or Token_Marte.png)
  if (firstPart === 'token') {
    const planetKey = parts.length > 2 ? parts[2].toLowerCase().trim() : (parts[1] || 'marte').toLowerCase().trim();
    const element = ELEMENT_MAP[planetKey] || 'neutral';
    const tokenName = parts.length > 2 ? cleanCardName(parts[1]) : `Token de ${cleanCardName(planetKey)}`;
    const id = 'token_' + element + '_' + Math.random().toString(36).substring(2, 7);

    return {
      id,
      name: tokenName,
      element,
      type: 'Token',
      rarity: 'Common',
      cost: 0,
      attack: 1,
      health: 1,
      description: `Token de Facción (${element.toUpperCase()}). Se invoca automáticamente en el Mazo Extra cuando tu mazo contiene cartas de ${element.toUpperCase()}.`,
      flavor: `"Ficha elemental invocada por la presencia de ${element}."`,
      imageUrl: dataUrl,
      isCustom: true,
      isToken: true
    };
  }

  // 3. PATTERN: Standard Nombre_Tipo_Rareza_Faccion_ATK_DEF_Coste
  const name = cleanCardName(parts[0] || 'Carta Personalizada');
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

  if (isSello) {
    rarity = null; // Sellos have NO rarity!
  }

  let attack = null;
  let health = null;
  if (type === 'Criatura') {
    const pAtk = parseInt(rawAtk, 10);
    const pDef = parseInt(rawDef, 10);
    attack = isNaN(pAtk) ? 1 : Math.max(0, pAtk);
    health = isNaN(pDef) ? 1 : Math.max(1, pDef);
  }

  let cost = 0;
  if (isSello) {
    cost = 0;
  } else if (rawCost !== undefined) {
    const match = String(rawCost).match(/\d+/);
    if (match) cost = parseInt(match[0], 10);
  }

  const id = 'custom_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);

  return {
    id,
    name,
    element,
    type,
    rarity,
    cost: Math.max(0, Math.min(20, cost)),
    attack,
    health,
    description: `Carta de tipo ${type} alineada con el planeta ${element.toUpperCase()}.`,
    flavor: `"${name} se manifiesta desde los archivos cósmicos locales."`,
    imageUrl: dataUrl,
    isCustom: true,
    isToken: type === 'Token',
    isSello: isSello
  };
}

export async function processImageFiles(files, onProgress) {
  const images = Array.from(files).filter(f => f.type.startsWith('image/'));
  const imported = [];
  for (let i = 0; i < images.length; i++) {
    const file = images[i];
    const dataUrl = await readFileAsDataURL(file);
    const card = parseCardFilename(file.name, dataUrl);
    const exists = CARDS_DATA.some(c => c.name === card.name && c.type === card.type && c.element === card.element && c.imageUrl === dataUrl);
    if (!exists) {
      await saveCustomCardToDB(card);
      CARDS_DATA.push(card);
      imported.push(card);
    }
    if (onProgress) onProgress(i + 1, images.length, card);
  }
  return imported;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reader.onabort = () => reject(new Error('No se pudo leer: ' + file.name));
    reader.readAsDataURL(file);
  });
}
