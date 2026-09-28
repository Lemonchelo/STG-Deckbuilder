/**
 * AETHERIUM TCG DECKBUILDER STUDIO - STANDALONE BUNDLE
 * Zero-dependency standalone application bundle.
 * Fully supports direct local execution via file:/// double-click on Windows.
 *
 * Rules:
 * - 40 Cards Main Deck
 * - Dynamic Rarity Limits: Common (4), Rare (3), Epic (2), Legendary (1)
 * - Sellos: No rarity, no limit (up to 40)
 * - Automated Token Extra Deck
 * - Card Types: Criatura, HechizoRapido, HechizoLento, Estructura, Artefacto, Sello, Terreno, Token
 * - Solar System Factions (no Venus, no Sun)
 */

(function() {
  'use strict';
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
}


  // ==========================================================================
  // 1. CARDS DATA & CONSTANTS
  // ==========================================================================
  const ELEMENTS = {
    marte: { iconSrc: 'assets/factions/marte.png', name: 'Marte', icon: '🔴', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.45)' },
    neptuno: { iconSrc: 'assets/factions/neptuno.png', name: 'Neptuno', icon: '🔵', color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.45)' },
    jupiter: { iconSrc: 'assets/factions/jupiter.png', name: 'Júpiter', icon: '🟠', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.45)' },
    tierra: { iconSrc: 'assets/factions/tierra.png', name: 'Tierra', icon: '🟢', color: '#10b981', glow: 'rgba(16, 185, 129, 0.45)' },
    saturno: { iconSrc: 'assets/factions/saturno.png', name: 'Saturno', icon: '🪐', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.45)' },
    mercurio: { iconSrc: 'assets/factions/mercurio.png', name: 'Mercurio', icon: '⚪', color: '#cbd5e1', glow: 'rgba(203, 213, 225, 0.45)' },
    pluton: { iconSrc: 'assets/factions/pluton.png', name: 'Plutón', icon: '🌌', color: '#ec4899', glow: 'rgba(236, 72, 153, 0.45)' },
    neutral: { name: 'Arcano', icon: '🔮', color: '#94a3b8', glow: 'rgba(148, 163, 184, 0.3)' }
  };

  function renderElementIcon(elementKey) {
    const element = ELEMENTS[elementKey] || ELEMENTS.neutral;
    return element.iconSrc
      ? `<img class="faction-icon" src="${element.iconSrc}" alt="" width="20" height="20" draggable="false">`
      : element.icon;
  }

  const CARD_TYPES = [
    { id: 'all', label: 'Todos' },
    { id: 'Criatura', label: 'Criatura' },
    { id: 'HechizoRapido', label: 'Hechizo Rápido' },
    { id: 'HechizoLento', label: 'Hechizo Lento' },
    { id: 'Estructura', label: 'Estructura' },
    { id: 'Artefacto', label: 'Artefacto' },
    { id: 'Sello', label: 'Sello (Recurso)' },
    { id: 'Terreno', label: 'Terreno' }
  ];

  function makeFullCardSvg(name, planetKey, type, rarity, cost, atk, def, desc, bgGrad1, bgGrad2, accentColor) {
    const elem = ELEMENTS[planetKey] || ELEMENTS.neutral;
    const isCreatureOrToken = (atk !== null && def !== null);
    const isSello = type === 'Sello';

    return `<svg viewBox="0 0 250 350" xmlns="http://www.w3.org/2000/svg" class="full-card-svg">
      <defs>
        <linearGradient id="bg_${name.replace(/\s+/g, '')}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgGrad1 || '#1e293b'}" />
          <stop offset="50%" stop-color="#0a0f1d" />
          <stop offset="100%" stop-color="${bgGrad2 || '#0f172a'}" />
        </linearGradient>
        <radialGradient id="gem_${name.replace(/\s+/g, '')}" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="40%" stop-color="${accentColor || '#38bdf8'}" />
          <stop offset="100%" stop-color="#090d18" />
        </radialGradient>
        <filter id="glow_${name.replace(/\s+/g, '')}">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Outer Card Frame -->
      <rect width="250" height="350" rx="14" fill="url(#bg_${name.replace(/\s+/g, '')})" stroke="${accentColor || '#38bdf8'}" stroke-width="${isSello ? 4.5 : 3.5}"/>
      <rect x="8" y="8" width="234" height="334" rx="10" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>

      <!-- Top Header Banner -->
      <rect x="12" y="14" width="226" height="34" rx="6" fill="rgba(8,12,24,0.85)" stroke="${accentColor || '#38bdf8'}" stroke-width="1.5"/>

      <!-- Cost / Sello Icon -->
      <circle cx="30" cy="31" r="15" fill="url(#gem_${name.replace(/\s+/g, '')})" stroke="#ffffff" stroke-width="2" filter="url(#glow_${name.replace(/\s+/g, '')})"/>
      <text x="30" y="36" font-family="'JetBrains Mono', monospace" font-size="${isSello ? '11' : '14'}" font-weight="900" fill="#ffffff" text-anchor="middle">${isSello ? '💎' : cost}</text>

      <!-- Card Title -->
      <text x="125" y="36" font-family="'Cinzel', serif" font-size="11.5" font-weight="800" fill="#ffffff" text-anchor="middle">${name}</text>

      <!-- Planet Symbol -->
      ${elem.iconSrc
      ? `<image href="${elem.iconSrc}" x="212" y="21" width="20" height="20"/>`
      : `<text x="222" y="36" font-size="14" text-anchor="middle">${elem.icon}</text>`}

      <!-- Central Art Window -->
      <rect x="16" y="54" width="218" height="155" rx="8" fill="#060913" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
      <circle cx="125" cy="130" r="50" fill="${accentColor || '#38bdf8'}" opacity="0.25" filter="url(#glow_${name.replace(/\s+/g, '')})"/>

      ${isSello ? `
        <circle cx="125" cy="130" r="40" fill="none" stroke="${accentColor || '#38bdf8'}" stroke-width="4" stroke-dasharray="8 4"/>
        <polygon points="125,95 155,145 95,145" fill="${accentColor || '#38bdf8'}" opacity="0.8"/>
        <circle cx="125" cy="130" r="16" fill="#ffffff"/>
      ` : `
        <polygon points="125,75 165,130 145,175 105,175 85,130" fill="${accentColor || '#38bdf8'}" opacity="0.8"/>
        <circle cx="125" cy="130" r="24" fill="#ffffff" opacity="0.9"/>
        <circle cx="125" cy="130" r="14" fill="#0a0f1d"/>
      `}

      <!-- Ribbon -->
      <rect x="16" y="213" width="218" height="20" rx="4" fill="rgba(12,18,34,0.95)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <text x="26" y="227" font-family="'Outfit', sans-serif" font-size="9.5" font-weight="700" fill="${accentColor || '#38bdf8'}" text-transform="uppercase">${elem.name} • ${type}</text>
      <text x="224" y="227" font-family="'Outfit', sans-serif" font-size="9.5" font-weight="700" fill="#fbbf24" text-anchor="end">${rarity || ''}</text>

      <!-- Ability Box -->
      <rect x="16" y="238" width="218" height="66" rx="6" fill="rgba(8,12,24,0.92)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
      <foreignObject x="22" y="242" width="206" height="58">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Outfit', sans-serif; font-size: 10px; line-height: 1.35; color: #e2e8f0; text-align: center; display: flex; align-items: center; justify-content: center; height: 100%;">
          ${desc || ''}
        </div>
      </foreignObject>

      ${isCreatureOrToken ? `
        <polygon points="32,298 48,312 48,332 32,342 16,332 16,312" fill="#dc2626" stroke="#f87171" stroke-width="1.5"/>
        <text x="32" y="326" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle">${atk}</text>

        <polygon points="218,298 234,312 234,332 218,342 202,332 202,312" fill="#16a34a" stroke="#4ade80" stroke-width="1.5"/>
        <text x="218" y="326" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle">${def}</text>
      ` : ''}
    </svg>`;
  }

  // Master Card Array (Starts clean and empty)
  const CARDS_DATA = [];

  function getCardById(id) {
    return CARDS_DATA.find(c => c.id === id);
  }

  // ==========================================================================
  // 2. CUSTOM CARDS IMPORT ENGINE & INDEXED-DB
  // ==========================================================================
  const DB_NAME = 'AetheriumTCG_CustomCardsDB';
  const STORE_NAME = 'custom_cards';
  let dbInstance = null;

  function initIndexedDB() {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, 3);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
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

  function saveCustomCardToDB(card) {
    if (!dbInstance) return Promise.reject(new Error('No está disponible el almacenamiento de cartas en este navegador.'));
    return new Promise((resolve, reject) => {
      const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(card);
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () => reject(tx.error || new Error('No se pudo guardar la carta. Revisá el espacio disponible.'));
    });
  }

  function loadSavedCustomCards() {
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

  function clearCustomCardsDB() {
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

  const TYPE_MAP = {
    criatura: 'Criatura', creature: 'Criatura', monstruo: 'Criatura', unidad: 'Criatura',
    hechizorapido: 'HechizoRapido', hechizo_rapido: 'HechizoRapido', fastspell: 'HechizoRapido', instant: 'HechizoRapido', rapido: 'HechizoRapido',
    hechizolento: 'HechizoLento', hechizo_lento: 'HechizoLento', slowspell: 'HechizoLento', sorcery: 'HechizoLento', hechizo: 'HechizoLento', lento: 'HechizoLento', spell: 'HechizoLento',
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
    return rawName
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();
  }

  function parseCardFilename(filename, dataUrl) {
    const base = filename.substring(0, filename.lastIndexOf('.')) || filename;
    const parts = base.split('_');
    const firstPart = parts[0].toLowerCase().trim();

    // 1. PATTERN: Sello_Faccion
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
        rarity: null, // Sellos have NO rarity!
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

    // 2. PATTERN: Token_Nombre_Faccion
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

  async function processImageFiles(files, onProgress) {
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

  // ==========================================================================
  // 3. REACTIVE STATE & DECK RULES
  // ==========================================================================
  const STORAGE_KEY = 'aetherium_tcg_active_deck';
  const STORAGE_KEY_BANLIST = 'aetherium_tcg_banlist';

  const RARITY_LIMITS = {
    Common: 4,
    Rare: 3,
    Epic: 2,
    Legendary: 1
  };

  const state = {
    deckName: 'Mi Mazo',
    deck: [], // Main Deck
    sideDeck: [], // Side Deck (shares copy limits with Main Deck)
    maxDeckSize: 40,
    maxSideDeckSize: 15,
    banlist: {}, // { [cardId]: customCopyLimit } — persists independently of the active deck
    filters: {
      search: '',
      element: 'all',
      type: 'all',
      rarity: 'all',
      maxMana: 10,
      sort: 'cost-asc',
      cardScale: 1.0
    }
  };

  function deckArrayFor(target) {
    return target === 'side' ? state.sideDeck : state.deck;
  }

  const listeners = {
    deck: [],
    filters: [],
    banlist: []
  };

  function subscribeToDeck(callback) {
    listeners.deck.push(callback);
  }

  function subscribeToFilters(callback) {
    listeners.filters.push(callback);
  }

  function subscribeToBanlist(callback) {
    listeners.banlist.push(callback);
  }

  function notifyDeckChanged() {
    saveToLocalStorage();
    listeners.deck.forEach(cb => cb(state.deck, state));
  }

  function notifyFiltersChanged() {
    listeners.filters.forEach(cb => cb(state.filters, state));
  }

  function notifyBanlistChanged() {
    listeners.banlist.forEach(cb => cb(state.banlist, state));
  }

  function saveToLocalStorage() {
    try {
      const dataToSave = {
        deckName: state.deckName,
        deck: state.deck,
        sideDeck: state.sideDeck,
        cardScale: state.filters.cardScale
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (err) {}
  }

  function saveBanlistToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_BANLIST, JSON.stringify(state.banlist));
    } catch (err) {}
  }

  function loadBanlistFromLocalStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BANLIST);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        Object.entries(parsed).forEach(([cardId, limit]) => {
          if (Number.isSafeInteger(limit) && limit >= 0 && limit <= state.maxDeckSize) {
            state.banlist[cardId] = limit;
          }
        });
      }
    } catch (err) {}
  }

  function isValidDeckItem(item) {
    const card = item && getCardById(item.cardId);
    return !!(item && Number.isSafeInteger(item.count) && item.count > 0 && card && card.type !== 'Token' && !card.isToken);
  }

  function loadInitialState() {
    loadBanlistFromLocalStorage();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.deckName) state.deckName = parsed.deckName;
        if (Array.isArray(parsed.deck)) {
          state.deck = parsed.deck.filter(isValidDeckItem);
        }
        if (Array.isArray(parsed.sideDeck)) {
          state.sideDeck = parsed.sideDeck.filter(isValidDeckItem);
        }
        if (parsed.cardScale) {
          state.filters.cardScale = Math.max(0.75, Math.min(1.35, parsed.cardScale));
        }
      } else {
        state.deck = [];
        state.sideDeck = [];
      }
    } catch (err) {
      state.deck = [];
      state.sideDeck = [];
    }
  }

  function getDeckTotalCount(target = 'main') {
    return deckArrayFor(target).reduce((sum, item) => sum + item.count, 0);
  }

  function getCardCountInDeck(cardId, target = 'main') {
    const found = deckArrayFor(target).find(item => item.cardId === cardId);
    return found ? found.count : 0;
  }

  function getCombinedCardCount(cardId) {
    return getCardCountInDeck(cardId, 'main') + getCardCountInDeck(cardId, 'side');
  }

  // ── Banlist ──────────────────────────────────────────────────────────────

  function getBanlistLimit(cardId) {
    return state.banlist[cardId];
  }

  function isCardBanlisted(cardId) {
    return state.banlist[cardId] !== undefined;
  }

  function setBanlistLimit(cardId, limit) {
    const card = getCardById(cardId);
    if (!card) return { success: false, reason: 'Carta no encontrada' };
    if (card.type === 'Token' || card.isToken) {
      return { success: false, reason: 'Las cartas Token no pueden tener un límite de banlist.' };
    }
    const n = Number(limit);
    if (!Number.isSafeInteger(n) || n < 0 || n > state.maxDeckSize) {
      return { success: false, reason: `El límite debe ser un entero entre 0 y ${state.maxDeckSize}.` };
    }
    state.banlist[cardId] = n;
    saveBanlistToLocalStorage();
    notifyBanlistChanged();
    return { success: true };
  }

  function clearBanlistLimit(cardId) {
    if (state.banlist[cardId] === undefined) return;
    delete state.banlist[cardId];
    saveBanlistToLocalStorage();
    notifyBanlistChanged();
  }

  function getMaxAllowedCopies(cardId) {
    const card = getCardById(cardId);
    if (!card) return 4;
    if (card.type === 'Token' || card.isToken) return 0;
    const override = state.banlist[cardId];
    if (override !== undefined) return override;
    if (card.type === 'Sello' || card.isSello || !card.rarity || card.rarity === 'None' || card.rarity === 'Sello') {
      return state.maxDeckSize;
    }
    return RARITY_LIMITS[card.rarity] || 4;
  }

  function canAddCardToDeck(cardId, target = 'main') {
    const card = getCardById(cardId);
    if (!card) return { allowed: false, reason: 'Carta no encontrada' };

    if (card.type === 'Token' || card.isToken) {
      return {
        allowed: false,
        reason: 'Las cartas Token pertenecen al Mazo Extra y se agregan automáticamente según las facciones del mazo.'
      };
    }

    const sizeLimit = target === 'side' ? state.maxSideDeckSize : state.maxDeckSize;
    const totalCount = getDeckTotalCount(target);
    if (totalCount >= sizeLimit) {
      return {
        allowed: false,
        reason: target === 'side'
          ? `El Side Deck ya tiene ${sizeLimit} cartas (tamaño máximo).`
          : `El mazo principal ya tiene ${sizeLimit} cartas (tamaño máximo).`
      };
    }

    const combinedCount = getCombinedCardCount(cardId);
    const maxAllowed = getMaxAllowedCopies(cardId);
    const isSello = card.type === 'Sello' || card.isSello || !card.rarity;
    const isBanlisted = isCardBanlisted(cardId);

    if (combinedCount >= maxAllowed) {
      if (isBanlisted) {
        return {
          allowed: false,
          reason: `Límite de Banlist alcanzado para ${card.name} (máx. ${maxAllowed} copias entre Mazo Principal y Side Deck).`
        };
      }
      if (isSello) {
        return {
          allowed: false,
          reason: `El mazo ya alcanzó el límite de ${state.maxDeckSize} cartas.`
        };
      }
      const rarityLabel = card.rarity === 'Legendary' ? 'Legendarias (máx. 1)' :
        card.rarity === 'Epic' ? 'Épicas (máx. 2)' :
        card.rarity === 'Rare' ? 'Raras (máx. 3)' : 'Comunes (máx. 4)';

      return {
        allowed: false,
        reason: `Límite alcanzado para cartas ${rarityLabel} (compartido entre Mazo Principal y Side Deck)`
      };
    }

    return { allowed: true };
  }

  function addCardToDeck(cardId, target = 'main') {
    const check = canAddCardToDeck(cardId, target);
    if (!check.allowed) {
      return { success: false, reason: check.reason };
    }

    const deckArr = deckArrayFor(target);
    const existingIndex = deckArr.findIndex(item => item.cardId === cardId);
    if (existingIndex !== -1) {
      deckArr[existingIndex].count += 1;
    } else {
      deckArr.push({ cardId, count: 1 });
    }

    notifyDeckChanged();
    return { success: true };
  }

  function removeCardFromDeck(cardId, removeAll = false, target = 'main') {
    const deckArr = deckArrayFor(target);
    const existingIndex = deckArr.findIndex(item => item.cardId === cardId);
    if (existingIndex === -1) return;

    if (removeAll || deckArr[existingIndex].count <= 1) {
      deckArr.splice(existingIndex, 1);
    } else {
      deckArr[existingIndex].count -= 1;
    }

    notifyDeckChanged();
  }

  // Moves a single copy of a card from one deck to the other (Main <-> Side),
  // one copy at a time for comfort when adjusting the split. The combined copy
  // count across Main + Side stays the same, so the per-card rarity/banlist
  // limit is never affected by a move — only the destination deck's own size
  // limit (40 for Main, 15 for Side) can block it.
  function moveCardBetweenDecks(cardId, fromTarget) {
    const toTarget = fromTarget === 'side' ? 'main' : 'side';
    const fromArr = deckArrayFor(fromTarget);
    const fromIndex = fromArr.findIndex(item => item.cardId === cardId);
    if (fromIndex === -1) {
      return { success: false, reason: 'Esa carta no está en ese mazo.' };
    }

    const toArr = deckArrayFor(toTarget);
    const toSizeLimit = toTarget === 'side' ? state.maxSideDeckSize : state.maxDeckSize;
    const toCurrentTotal = getDeckTotalCount(toTarget);

    if (toCurrentTotal + 1 > toSizeLimit) {
      return {
        success: false,
        reason: toTarget === 'side'
          ? `El Side Deck ya tiene ${toSizeLimit} cartas (tamaño máximo).`
          : `El Mazo Principal ya tiene ${toSizeLimit} cartas (tamaño máximo).`
      };
    }

    if (fromArr[fromIndex].count <= 1) {
      fromArr.splice(fromIndex, 1);
    } else {
      fromArr[fromIndex].count -= 1;
    }

    const toExistingIndex = toArr.findIndex(item => item.cardId === cardId);
    if (toExistingIndex !== -1) {
      toArr[toExistingIndex].count += 1;
    } else {
      toArr.push({ cardId, count: 1 });
    }

    notifyDeckChanged();
    return { success: true, moved: 1, to: toTarget };
  }

  function reorderDeck(fromIndex, toIndex, target = 'main') {
    const deckArr = deckArrayFor(target);
    if (fromIndex < 0 || fromIndex >= deckArr.length || toIndex < 0 || toIndex >= deckArr.length) return;
    const [movedItem] = deckArr.splice(fromIndex, 1);
    deckArr.splice(toIndex, 0, movedItem);
    notifyDeckChanged();
  }

  function clearDeck() {
    state.deck = [];
    state.sideDeck = [];
    notifyDeckChanged();
  }

  function setDeckName(name) {
    state.deckName = name.trim() || 'Mi Mazo';
    saveToLocalStorage();
  }

  function getActiveFactionsInDeck() {
    const factions = new Set();
    const addFactionsFrom = (deckArr) => {
      deckArr.forEach(item => {
        const card = getCardById(item.cardId);
        if (card && card.element && card.element !== 'neutral') {
          factions.add(card.element.toLowerCase());
        }
      });
    };
    addFactionsFrom(state.deck);
    addFactionsFrom(state.sideDeck);
    return factions;
  }

  function getActiveExtraDeckTokens() {
    const activeFactions = getActiveFactionsInDeck();
    if (activeFactions.size === 0) return [];

    return CARDS_DATA.filter(card => {
      return (card.type === 'Token' || card.isToken) && activeFactions.has(card.element.toLowerCase());
    });
  }

  function setFilter(key, value) {
    state.filters[key] = value;
    notifyFiltersChanged();
  }

  function resetFilters() {
    state.filters.search = '';
    state.filters.element = 'all';
    state.filters.type = 'all';
    state.filters.rarity = 'all';
    state.filters.maxMana = 10;
    state.filters.sort = 'cost-asc';
    notifyFiltersChanged();
  }

  function exportDeckToText() {
    const total = getDeckTotalCount('main');
    const sideTotal = getDeckTotalCount('side');
    const extraTokens = getActiveExtraDeckTokens();
    let text = `// Deck: ${state.deckName}\n`;
    text += `// Main Deck (${total}/${state.maxDeckSize} cartas):\n`;

    state.deck.forEach(item => {
      const card = getCardById(item.cardId);
      if (card) {
        const typeStr = card.type === 'Sello' ? '[Sello]' : `[${card.rarity || 'Sin Rareza'}]`;
        text += `${item.count}x ${escapeHtml(card.name)} ${typeStr} (${card.element.toUpperCase()})\n`;
      }
    });

    if (state.sideDeck.length > 0) {
      text += `\n// Side Deck (${sideTotal}/${state.maxSideDeckSize} cartas):\n`;
      state.sideDeck.forEach(item => {
        const card = getCardById(item.cardId);
        if (card) {
          const typeStr = card.type === 'Sello' ? '[Sello]' : `[${card.rarity || 'Sin Rareza'}]`;
          text += `${item.count}x ${escapeHtml(card.name)} ${typeStr} (${card.element.toUpperCase()})\n`;
        }
      });
    }

    if (extraTokens.length > 0) {
      text += `\n// Extra Deck (Tokens Automáticos):\n`;
      extraTokens.forEach(token => {
        text += `1x ${token.name} [Token] (${token.element.toUpperCase()})\n`;
      });
    }

    return text;
  }

  // ── Official site format (export/import) ────────────────────────────────────
  // Matches the format the official card game site produces when exporting a deck:
  // section headers "Mazo principal" / "Sidedeck", cards grouped under "(Faccion)"
  // headers (one per element present in that section), with the Sello of that
  // faction listed first when present, followed by the rest of the cards sorted
  // alphabetically. Faction headers use the plain element key, capitalized
  // (no accents), e.g. "pluton" -> "(Pluton)", even though the card itself is
  // named "Sello de Plutón".
  function capitalizeFactionKey(key) {
    if (!key) return 'Arcano';
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  function buildOfficialSection(deckArr) {
    const byFaction = new Map(); // elementKey -> { sello: {name,count}|null, others: [{name,count}] }

    deckArr.forEach(item => {
      const card = getCardById(item.cardId);
      if (!card) return;
      const key = card.element || 'neutral';
      if (!byFaction.has(key)) byFaction.set(key, { sello: null, others: [] });
      const group = byFaction.get(key);
      if (card.isSello || card.type === 'Sello') {
        group.sello = { name: card.name, count: item.count };
      } else {
        group.others.push({ name: card.name, count: item.count });
      }
    });

    const factionKeys = [...byFaction.keys()].sort((a, b) =>
      capitalizeFactionKey(a).localeCompare(capitalizeFactionKey(b), 'es', { sensitivity: 'base' })
    );

    return factionKeys.map(key => {
      const group = byFaction.get(key);
      const lines = [];
      if (group.sello) lines.push(`${group.sello.name} x${group.sello.count}`);
      group.others
        .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
        .forEach(c => lines.push(`${c.name} x${c.count}`));
      return `(${capitalizeFactionKey(key)})\n${lines.join('\n')}`;
    }).join('\n\n');
  }

  function exportDeckToOfficialFormat() {
    let text = 'Mazo principal\n\n' + buildOfficialSection(state.deck);
    if (state.sideDeck.length > 0) {
      text += '\n\nSidedeck\n\n' + buildOfficialSection(state.sideDeck);
    }
    return text;
  }

  function importDeckFromOfficialFormat(textString) {
    try {
      const data = { deck: [], sideDeck: [] };
      let section = 'main'; // 'main' | 'side' | 'extra'

      for (const rawLine of textString.split('\n')) {
        const line = rawLine.trim();
        if (!line) continue;

        if (/^mazo\s*principal$/i.test(line)) { section = 'main'; continue; }
        if (/^side\s*deck$/i.test(line)) { section = 'side'; continue; }
        if (/^mazo\s*extra$/i.test(line) || /^extra\s*deck$/i.test(line)) { section = 'extra'; continue; }
        if (/^\(.+\)$/.test(line)) continue; // faction header, e.g. "(Mercurio)"
        if (section === 'extra') continue;

        const match = line.match(/^(.+)\s+x(\d+)$/i);
        if (!match) throw new Error('Línea inválida: ' + line);
        const name = match[1].trim();
        const count = Number(match[2]);
        if (!Number.isSafeInteger(count) || count <= 0) throw new Error('Cantidad inválida: ' + line);

        const entry = { name, cardId: name, count };
        if (section === 'side') data.sideDeck.push(entry);
        else data.deck.push(entry);
      }

      if (!data.deck.length && !data.sideDeck.length) throw new Error('No se encontraron cartas en el texto.');
      return importDeckFromJSON(JSON.stringify(data));
    } catch (err) {
      return { success: false, error: err.message, reason: err.message };
    }
  }

  // ── Saved decks (browser storage) ────────────────────────────────────────────
  // Named decks kept in localStorage so they can be saved and loaded without going through
  // export/import. Each entry stores the object exportDeckToJSON() produces and loading goes
  // through importDeckFromJSON(), so every load is validated and atomic (a failed load never
  // changes the current deck). Export / Import (text and JSON) keeps working independently.
  const STORAGE_KEY_SAVED_DECKS = 'aetherium_tcg_saved_decks';
  const MAX_SAVED_DECK_NAME = 32;

  function readSavedDecks() {
    let raw;
    try {
      raw = localStorage.getItem(STORAGE_KEY_SAVED_DECKS);
    } catch (err) {
      return { error: 'No se pudo acceder al almacenamiento del navegador.' };
    }
    if (!raw) return { decks: [] };
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('Formato inesperado');
      const decks = parsed.filter(entry => entry && typeof entry.id === 'string' && typeof entry.name === 'string' &&
        entry.data && Array.isArray(entry.data.deck));
      return { decks };
    } catch (err) {
      // Never overwrite data we cannot read: the user gets a visible error instead
      return { error: 'Los mazos guardados están dañados; no se modificaron.' };
    }
  }

  function writeSavedDecks(decks) {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_DECKS, JSON.stringify(decks));
      return { success: true };
    } catch (err) {
      return { success: false, reason: 'No se pudo guardar en el navegador (almacenamiento lleno o bloqueado).' };
    }
  }

  function deckSignature(deck, sideDeck) {
    const part = list => (Array.isArray(list) ? list : []).map(item => item.cardId + ':' + item.count).sort().join('|');
    return part(deck) + '#' + part(sideDeck);
  }

  function listSavedDecks() {
    const result = readSavedDecks();
    if (result.error) return { success: false, reason: result.error };
    return { success: true, decks: [...result.decks].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)) };
  }

  function saveCurrentDeck(rawName, { overwrite = false } = {}) {
    const name = String(rawName === undefined || rawName === null ? '' : rawName).trim().slice(0, MAX_SAVED_DECK_NAME);
    if (!name) return { success: false, reason: 'Escribe un nombre para guardar el mazo.' };
    if (state.deck.length === 0 && state.sideDeck.length === 0) {
      return { success: false, reason: 'El mazo está vacío: no hay nada que guardar.' };
    }

    const current = readSavedDecks();
    if (current.error) return { success: false, reason: current.error };

    const existing = current.decks.find(entry => entry.name.toLowerCase() === name.toLowerCase());
    if (existing && !overwrite) {
      return { success: false, exists: true, reason: `Ya existe un mazo guardado llamado «${existing.name}».` };
    }

    const data = JSON.parse(exportDeckToJSON());
    data.deckName = name;
    const entry = {
      id: existing ? existing.id : 'saved_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
      name,
      savedAt: Date.now(),
      data
    };
    const next = existing ? current.decks.map(item => (item === existing ? entry : item)) : [...current.decks, entry];

    const written = writeSavedDecks(next);
    if (!written.success) return written;

    // The active deck takes the saved name so the navbar and the saved list agree
    if (state.deckName !== name) {
      state.deckName = name;
      notifyDeckChanged();
    }
    return { success: true, overwritten: Boolean(existing), id: entry.id };
  }

  function deleteSavedDeck(id) {
    const current = readSavedDecks();
    if (current.error) return { success: false, reason: current.error };
    const next = current.decks.filter(entry => entry.id !== id);
    if (next.length === current.decks.length) return { success: false, reason: 'El mazo guardado ya no existe.' };
    return writeSavedDecks(next);
  }

  function loadSavedDeck(id) {
    const current = readSavedDecks();
    if (current.error) return { success: false, reason: current.error };
    const entry = current.decks.find(item => item.id === id);
    if (!entry) return { success: false, reason: 'El mazo guardado ya no existe.' };
    const result = importDeckFromJSON(JSON.stringify(entry.data));
    return result.success ? { ...result, name: entry.name } : result;
  }

  /** True when the current deck (main + side) is identical to one of the saved decks. */
  function isCurrentDeckSaved() {
    const current = readSavedDecks();
    if (current.error) return false;
    const signature = deckSignature(state.deck, state.sideDeck);
    return current.decks.some(entry => deckSignature(entry.data.deck, entry.data.sideDeck) === signature);
  }

  function exportDeckToJSON() {
    const exportObject = {
      format: 'aetherium-tcg-v1',
      deckName: state.deckName,
      createdAt: new Date().toISOString(),
      deck: state.deck.map(item => {
        const card = getCardById(item.cardId);
        return {
          cardId: item.cardId,
          name: card ? card.name : 'Unknown Card',
          count: item.count
        };
      }),
      sideDeck: state.sideDeck.map(item => {
        const card = getCardById(item.cardId);
        return {
          cardId: item.cardId,
          name: card ? card.name : 'Unknown Card',
          count: item.count
        };
      })
    };
    return JSON.stringify(exportObject, null, 2);
  }

  function importDeckFromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !Array.isArray(data.deck)) throw new Error('Formato JSON inválido: falta el array deck.');
      const sideInput = Array.isArray(data.sideDeck) ? data.sideDeck : [];

      const mainCounts = new Map();
      const sideCounts = new Map();
      const combinedCounts = new Map();

      const processList = (list, countsMap, label) => {
        for (const item of list) {
          if (!item || !Number.isSafeInteger(item.count) || item.count <= 0) throw new Error(`Cada cantidad de ${label} debe ser un entero positivo.`);
          const card = getCardById(item.cardId) || (typeof item.name === 'string' && CARDS_DATA.find(c => c.name.toLowerCase() === item.name.toLowerCase()));
          if (!card) throw new Error('Carta no encontrada: ' + (item.name || item.cardId || '(sin nombre)'));
          if (card.isToken || card.type === 'Token') throw new Error('Los tokens no pertenecen al mazo principal ni al side deck.');
          countsMap.set(card.id, (countsMap.get(card.id) || 0) + item.count);
          combinedCounts.set(card.id, (combinedCounts.get(card.id) || 0) + item.count);
        }
      };

      processList(data.deck, mainCounts, 'el mazo principal');
      processList(sideInput, sideCounts, 'el side deck');

      for (const [cardId, combined] of combinedCounts) {
        if (combined > getMaxAllowedCopies(cardId)) {
          const card = getCardById(cardId);
          throw new Error('Límite de copias excedido (compartido entre Mazo Principal y Side Deck): ' + (card ? card.name : cardId));
        }
      }

      const mainTotal = [...mainCounts.values()].reduce((a,b) => a+b, 0);
      const sideTotal = [...sideCounts.values()].reduce((a,b) => a+b, 0);
      if (mainTotal > state.maxDeckSize) throw new Error(`El mazo principal no puede superar las ${state.maxDeckSize} cartas.`);
      if (sideTotal > state.maxSideDeckSize) throw new Error(`El side deck no puede superar las ${state.maxSideDeckSize} cartas.`);
      if (data.deckName !== undefined && typeof data.deckName !== 'string') throw new Error('Nombre de mazo inválido.');
      state.deck = [...mainCounts].map(([cardId,count]) => ({cardId,count}));
      state.sideDeck = [...sideCounts].map(([cardId,count]) => ({cardId,count}));
      if (data.deckName !== undefined) state.deckName = data.deckName.trim().slice(0,32) || 'Mi Mazo de Batalla';
      notifyDeckChanged();
      return {success:true, count:mainTotal, sideCount:sideTotal};
    } catch (err) {
      return {success:false, error:err.message, reason:err.message};
    }
  }

  function importDeckFromText(textString) {
    try {
      const data = {deck: [], sideDeck: []};
      let section = 'main';
      for (const line of textString.split('\n')) {
        const value = line.trim();
        if (!value) continue;
        if (value.startsWith('// Side Deck')) { section = 'side'; continue; }
        if (value.startsWith('// Extra Deck')) { section = 'extra'; continue; }
        if (value.startsWith('// Deck:')) data.deckName = value.slice(8).trim();
        if (value.startsWith('//') || value.startsWith('#') || section === 'extra') continue;
        const match = value.match(/^(\d+)[xX]?\s+(.+)$/);
        if (!match) throw new Error('Línea inválida: ' + value);
        const name = match[2].replace(/\s+\[[^\]]*\]\s+\([^)]*\)$/, '').trim();
        const entry = {name, cardId:name, count:Number(match[1])};
        if (section === 'side') data.sideDeck.push(entry);
        else data.deck.push(entry);
      }
      if (!data.deck.length && !data.sideDeck.length) throw new Error('No se encontraron cartas en el texto.');
      return importDeckFromJSON(JSON.stringify(data));
    } catch (err) {
      return {success:false, error:err.message, reason:err.message};
    }
  }

  // ==========================================================================
  // 4. SOUND SYNTHESIS
  // ==========================================================================
  let audioCtx = null;
  let soundEnabled = true;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function isSoundEnabled() { return soundEnabled; }
  function initSoundState() {
    try {
      const saved = localStorage.getItem('aetherium_sound_enabled');
      if (saved !== null) soundEnabled = JSON.parse(saved) !== false;
    } catch (err) {
      soundEnabled = true;
    }
    return soundEnabled;
  }
  function toggleSound() {
    soundEnabled = !soundEnabled;
    try { localStorage.setItem('aetherium_sound_enabled', JSON.stringify(soundEnabled)); } catch (err) {}
    if (soundEnabled) startMusic(); else pauseMusic();
    return soundEnabled;
  }

  function playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.1) {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function playCardPickup() { playTone(520, 'sine', 0.05, 0.08); }
  function playCardDrop() { playTone(380, 'triangle', 0.09, 0.12); }
  function playCardRemove() { playTone(240, 'sawtooth', 0.08, 0.09); }
  function playClick() { playTone(780, 'sine', 0.03, 0.05); }
  function playShuffle() {
    if (!soundEnabled) return;
    for (let i = 0; i < 4; i++) {
      setTimeout(() => playTone(300 + Math.random() * 300, 'triangle', 0.04, 0.06), i * 45);
    }
  }

  // ==================== ARCHIVOS DE AUDIO (snd/bgm y snd/sfx) ====================
  // Igual que cartas/pool-manifest.json: GitHub Pages no lista carpetas, así que los
  // nombres salen de snd/sound-manifest.json ({ "bgm": [...], "sfx": [...] }), que se
  // regenera con `node tests/generate-sound-manifest.cjs` tras sumar o sacar archivos.
  // Sin manifest (file://, host sin snd/) no pasa nada: no hay música y los efectos
  // vuelven a los sonidos sintetizados de arriba.
  const SOUND_MANIFEST_PATH = 'snd/sound-manifest.json';
  const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg)$/i;
  const AUDIO_LOAD_TIMEOUT_MS = 8000;
  const BGM_VOLUME = 0.3;   // 0 a 1
  const SFX_VOLUME = 0.7;   // 0 a 1
  const GESTURE_EVENTS = ['pointerdown', 'pointerup', 'keydown', 'touchend'];

  let bgmCandidates = [];   // URLs de snd/bgm listadas en el manifest
  let sfxPlayable = [];     // URLs de snd/sfx que el navegador pudo cargar
  let bgmAudio = null;      // pista elegida (en loop)
  let bgmLoading = false;
  let bgmWaitingForGesture = false;

  function audioUrl(folder, name) {
    return 'snd/' + folder + '/' + name.split('/').map(encodeURIComponent).join('/');
  }

  function shuffled(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // Resuelve con el elemento <audio> si el archivo carga (existe y es decodificable), o con null.
  function probeAudio(url) {
    return new Promise((resolve) => {
      const audio = new Audio();
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(ok ? audio : null);
      };
      const timer = setTimeout(() => finish(false), AUDIO_LOAD_TIMEOUT_MS);
      audio.addEventListener('loadedmetadata', () => finish(true), { once: true });
      audio.addEventListener('error', () => finish(false), { once: true });
      audio.preload = 'auto';
      audio.src = url;
    });
  }

  async function fetchSoundManifest() {
    try {
      const res = await fetch(SOUND_MANIFEST_PATH, { cache: 'no-cache' });
      if (!res.ok) return null;
      const manifest = await res.json();
      return manifest && typeof manifest === 'object' ? manifest : null;
    } catch (err) {
      return null; // file:// o manifest inexistente: sin archivos de audio
    }
  }

  function manifestUrls(manifest, folder) {
    const names = Array.isArray(manifest[folder]) ? manifest[folder] : [];
    return names.filter(n => typeof n === 'string' && AUDIO_EXTENSIONS.test(n)).map(n => audioUrl(folder, n));
  }

  // Lee el manifest, valida los efectos y arranca la música. No bloquea el arranque: llamar sin await.
  async function initAudioFiles() {
    const manifest = await fetchSoundManifest();
    if (!manifest) return;

    bgmCandidates = manifestUrls(manifest, 'bgm');
    if (soundEnabled) startMusic();

    const probed = await Promise.all(manifestUrls(manifest, 'sfx').map(async (url) => (await probeAudio(url)) ? url : null));
    sfxPlayable = probed.filter(Boolean);
  }

  // Elige una pista al azar entre las válidas (baraja y toma la primera que carga) y la deja en loop.
  async function startMusic() {
    if (!soundEnabled || bgmLoading) return;
    if (bgmAudio) { tryPlayMusic(); return; }
    if (!bgmCandidates.length) return;

    bgmLoading = true;
    try {
      for (const url of shuffled(bgmCandidates)) {
        const audio = await probeAudio(url);
        if (audio) {
          audio.loop = true;
          audio.volume = BGM_VOLUME;
          bgmAudio = audio;
          break;
        }
      }
    } finally {
      bgmLoading = false;
    }
    if (bgmAudio) tryPlayMusic();
  }

  function pauseMusic() {
    if (bgmAudio) bgmAudio.pause();
  }

  // Los navegadores bloquean el audio hasta el primer gesto del usuario: si falla, se reintenta en el próximo.
  function tryPlayMusic() {
    if (!bgmAudio || !soundEnabled) return;
    try {
      const playing = bgmAudio.play();
      if (playing && typeof playing.catch === 'function') playing.catch(waitForGestureToPlayMusic);
    } catch (err) {
      waitForGestureToPlayMusic();
    }
  }

  function waitForGestureToPlayMusic() {
    if (bgmWaitingForGesture) return;
    bgmWaitingForGesture = true;
    const retry = () => {
      GESTURE_EVENTS.forEach(name => document.removeEventListener(name, retry, true));
      bgmWaitingForGesture = false;
      tryPlayMusic();
    };
    GESTURE_EVENTS.forEach(name => document.addEventListener(name, retry, true));
  }

  // Reproduce un efecto al azar de snd/sfx. Devuelve false si no hay ninguno válido.
  function playSfxFile() {
    if (!sfxPlayable.length) return false;
    try {
      const audio = new Audio(sfxPlayable[Math.floor(Math.random() * sfxPlayable.length)]);
      audio.volume = SFX_VOLUME;
      const playing = audio.play();
      if (playing && typeof playing.catch === 'function') playing.catch(() => {});
      return true;
    } catch (err) {
      return false;
    }
  }

  // Clic derecho: agregar / quitar carta. Sin archivos en snd/sfx suena el efecto sintetizado de siempre.
  function playCardAddSfx() {
    if (!soundEnabled) return;
    if (!playSfxFile()) playCardDrop();
  }

  function playCardRemoveSfx() {
    if (!soundEnabled) return;
    if (!playSfxFile()) playCardRemove();
  }

  // ==========================================================================
  // 5. 3D CARD COMPONENT & INSPECTOR
  // ==========================================================================
  function createCardElement(card, options = {}) {
    const {
      isDeckItem = false,
      deckCount = 0,
      isMaxInDeck = false,
      isHandItem = false,
      draggable = true
    } = options;

    const wrapper = document.createElement('div');
    wrapper.className = `tcg-card-wrapper ${isHandItem ? 'hand-card-wrapper' : ''}`;
    wrapper.dataset.cardId = card.id;

    const maxCopies = getMaxAllowedCopies(card.id);
    const isSello = card.type === 'Sello' || card.isSello || !card.rarity;
    const banlisted = isCardBanlisted(card.id);
    const combined = getCombinedCardCount(card.id);

    let inDeckBadgeHtml = '';
    if (!isDeckItem && !isHandItem) {
      if (combined > 0) {
        const badgeText = isSello && !banlisted ? `x${combined}` : `${combined}/${maxCopies}`;
        inDeckBadgeHtml = `
          <div class="library-card-in-deck-badge ${!isSello && combined >= maxCopies ? 'is-max' : ''}" title="${combined} ${isSello && !banlisted ? 'copias' : `de ${maxCopies} copias`} entre Mazo Principal y Side Deck">
            ${badgeText}
          </div>
        `;
      }
    }

    let banlistBadgeHtml = '';
    if (banlisted && !isHandItem) {
      banlistBadgeHtml = `<div class="card-banlist-badge" title="Restricción de Banlist: máximo ${maxCopies} copias entre Mazo Principal y Side Deck">🚫 ${maxCopies}</div>`;
    }

    let deckQtyBadgeHtml = '';
    if (isDeckItem) {
      const atSharedMax = !isSello && combined >= maxCopies;
      deckQtyBadgeHtml = `
        <div class="deck-card-qty-badge ${atSharedMax ? 'is-max' : ''}">
          x${deckCount}
        </div>
      `;
    }

    const cardGraphic = card.imageUrl
      ? `<img src="${escapeHtml(card.imageUrl)}" alt="${escapeHtml(card.name)}" class="full-card-image" loading="lazy">`
      : (card.artSvg || '');

    wrapper.innerHTML = `
      <div class="tcg-card ${isMaxInDeck ? 'is-max-in-deck' : ''} ${banlisted ? 'is-banlisted' : ''}"
           data-element="${card.element || 'neutral'}"
           data-rarity="${card.rarity || 'none'}"
           draggable="${draggable}"
           tabindex="0"
           role="button"
           aria-label="${escapeHtml(card.name)}, ${escapeHtml(card.element)}, Coste ${card.cost}">
        ${cardGraphic}
        <div class="card-foil-sheen"></div>
        ${inDeckBadgeHtml}
        ${banlistBadgeHtml}
        ${deckQtyBadgeHtml}
        ${isHandItem ? '<div class="mulligan-tag">DESCARTAR</div>' : ''}
      </div>
    `;

    attach3DTiltEffect(wrapper);
    return wrapper;
  }

  function attach3DTiltEffect(wrapper) {
    const card = wrapper.querySelector('.tcg-card');
    if (!card) return;
    let frame = 0, latest;
    const reset = () => {
      cancelAnimationFrame(frame); frame = 0;
      card.style.transform = '';
    };
    wrapper.addEventListener('mousemove', e => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      latest = e;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const bounds = wrapper.getBoundingClientRect();
        const x = (latest.clientX - bounds.left) / bounds.width;
        const y = (latest.clientY - bounds.top) / bounds.height;
        card.style.transform = `perspective(1000px) rotateX(${(0.5-y)*16}deg) rotateY(${(x-0.5)*16}deg) translateY(-3px)`;
        card.style.setProperty('--foil-x', `${x*100}%`);
        card.style.setProperty('--foil-y', `${y*100}%`);
      });
    });
    wrapper.addEventListener('mouseleave', reset);
    wrapper.addEventListener('dragstart', reset);
  }

  // Ids of the cards in whichever list (Mazo Principal / Side / Extra / Colección)
  // the inspector was opened from, in the same order they're shown there — used
  // so the nav arrows know what "previous"/"next" means. Main/Side/Extra are
  // recomputed live from state every render; Colección's filtered+sorted list is
  // supplied by the caller as `contextIds`, since it depends on the active
  // search/filter/sort — passed forward unchanged across toggle/add/remove/nav
  // re-renders of the same inspector session.
  function getContextCardIds(context, providedIds) {
    switch (context) {
      case 'main': return state.deck.map(item => item.cardId);
      case 'side': return state.sideDeck.map(item => item.cardId);
      case 'extra': return getActiveExtraDeckTokens().map(token => token.id);
      default: return Array.isArray(providedIds) ? providedIds : [];
    }
  }

  function openCardInspector(cardId, options = {}) {
    const { target = 'main', context = 'library', contextIds: providedContextIds = null } = options;
    const card = getCardById(cardId);
    if (!card) return;

    const modal = document.getElementById('modal-card-inspector');
    const content = document.getElementById('inspector-content');
    if (!modal || !content) return;

    playClick();

    const contextIds = getContextCardIds(context, providedContextIds);
    const contextIndex = contextIds.indexOf(card.id);
    const hasPrev = contextIndex > 0;
    const hasNext = contextIndex !== -1 && contextIndex < contextIds.length - 1;

    const elementInfo = ELEMENTS[card.element] || ELEMENTS.neutral;
    const currentInMain = getCardCountInDeck(card.id, 'main');
    const currentInSide = getCardCountInDeck(card.id, 'side');
    const currentCombined = getCombinedCardCount(card.id);
    const maxCopies = getMaxAllowedCopies(card.id);
    const isSello = card.type === 'Sello' || card.isSello || !card.rarity;
    const isToken = card.type === 'Token' || card.isToken;
    const banlistLimit = getBanlistLimit(card.id);
    const banlisted = banlistLimit !== undefined;

    const rarityBadgeHtml = banlisted
      ? `<span class="inspector-badge" style="background: rgba(248,113,113,0.15); color: #f87171; border: 1px solid #ef4444;">🚫 Banlist: máx. ${banlistLimit}</span>`
      : (isSello
        ? `<span class="inspector-badge" style="background: rgba(52,211,153,0.15); color: #34d399; border: 1px solid #10b981;">🏛️ Sello (Sin Límite)</span>`
        : `<span class="inspector-badge" style="background: rgba(255,255,255,0.06); color: #fbbf24; border: 1px solid #fbbf24;">💎 ${escapeHtml(card.rarity)}</span>`);

    const targetLabel = target === 'side' ? 'Side Deck' : 'Mazo Principal';
    const targetCount = target === 'side' ? currentInSide : currentInMain;
    const addResolvedTarget = target === 'side'
      ? 'side'
      : (getDeckTotalCount('main') >= state.maxDeckSize ? 'side' : 'main');

    const addBtnText = isSello && !banlisted
      ? `<span>+</span> Agregar a ${targetLabel} (x${targetCount})`
      : `<span>+</span> Agregar a ${targetLabel} (${currentCombined}/${maxCopies})`;
    const removeBtnText = `<span>−</span> Quitar de ${targetLabel} (x${targetCount})`;

    const canAdd = !isToken && canAddCardToDeck(card.id, addResolvedTarget).allowed;
    const canRemove = !isToken && targetCount > 0;

    content.innerHTML = `
      <div class="inspector-card-col" id="inspector-card-container">
        <span class="inspector-zoom-hint">🔍 Clic en la carta para verla en pantalla completa</span>
      </div>
      <div class="inspector-details-col">
        <div class="inspector-name">${escapeHtml(card.name)}</div>
        <div class="inspector-meta-row">
          <span class="inspector-badge" style="background: ${elementInfo.glow}; color: #ffffff; border: 1px solid ${elementInfo.color};">
            ${renderElementIcon(card.element)} ${elementInfo.name}
          </span>
          <span class="inspector-badge" style="background: rgba(255,255,255,0.06); color: var(--text-secondary); border: 1px solid var(--border-medium);">
            ${escapeHtml(card.type)}
          </span>
          ${rarityBadgeHtml}
          <span class="inspector-badge" style="background: rgba(56,189,248,0.15); color: #38bdf8; border: 1px solid #38bdf8;">
            💧 Coste: ${card.cost}
          </span>
          ${card.attack !== null ? `
            <span class="inspector-badge" style="background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid #ef4444;">
              ⚔️ ${card.attack}
            </span>
            <span class="inspector-badge" style="background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid #10b981;">
              ❤️ ${card.health}
            </span>
          ` : ''}
        </div>

        <div class="inspector-desc-box">
          <p>${escapeHtml(card.description)}</p>
        </div>

        <div class="inspector-flavor">
          ${escapeHtml(card.flavor)}
        </div>

        ${!isToken ? `
          <div class="inspector-target-toggle" role="group" aria-label="Elegir mazo destino">
            <button type="button" class="target-toggle-btn ${target === 'main' ? 'active' : ''}" data-target="main">Mazo Principal</button>
            <button type="button" class="target-toggle-btn ${target === 'side' ? 'active' : ''}" data-target="side">Side Deck</button>
          </div>
          <div class="inspector-actions">
            <button id="btn-inspector-remove" class="btn btn-secondary" ${!canRemove ? 'disabled' : ''}>
              ${removeBtnText}
            </button>
            <button id="btn-inspector-add" class="btn btn-primary" ${!canAdd ? 'disabled' : ''}>
              ${addBtnText}
            </button>
          </div>
        ` : ''}
      </div>
    `;

    const cardElem = createCardElement(card, { draggable: false });
    const cardContainer = content.querySelector('#inspector-card-container');
    cardContainer.insertBefore(cardElem, cardContainer.firstChild);

    const inspectFace = cardElem.querySelector('.tcg-card');
    if (inspectFace) {
      inspectFace.classList.add('is-zoomable');
      inspectFace.addEventListener('click', (e) => {
        e.stopPropagation();
        openCardFullscreen(card);
      });
    }

    content.querySelectorAll('.target-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.target === target) return;
        playClick();
        openCardInspector(card.id, { target: btn.dataset.target, context, contextIds: providedContextIds });
      });
    });

    const addBtn = content.querySelector('#btn-inspector-add');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const result = addCardToDeck(card.id, addResolvedTarget);
        if (result.success) {
          playCardDrop();
          openCardInspector(card.id, { target, context, contextIds: providedContextIds });
        }
      });
    }

    const removeBtn = content.querySelector('#btn-inspector-remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        removeCardFromDeck(card.id, false, target);
        playCardRemove();
        openCardInspector(card.id, { target, context, contextIds: providedContextIds });
      });
    }

    const prevBtn = document.getElementById('btn-inspector-prev');
    const nextBtn = document.getElementById('btn-inspector-next');
    if (prevBtn) {
      prevBtn.disabled = !hasPrev;
      prevBtn.onclick = () => {
        if (!hasPrev) return;
        openCardInspector(contextIds[contextIndex - 1], { target, context, contextIds: providedContextIds });
      };
    }
    if (nextBtn) {
      nextBtn.disabled = !hasNext;
      nextBtn.onclick = () => {
        if (!hasNext) return;
        openCardInspector(contextIds[contextIndex + 1], { target, context, contextIds: providedContextIds });
      };
    }

    if (!modal.classList.contains('is-open')) modal.returnFocus = document.activeElement;
  modal.classList.add('is-open');
  document.getElementById('btn-close-inspector')?.focus();
  }

function initCardInspector() {
  const modal = document.getElementById('modal-card-inspector');
  const close = document.getElementById('btn-close-inspector');
  close?.addEventListener('click', closeCardInspector);
  modal?.addEventListener('click', event => {
    if (event.target === modal) closeCardInspector();
  });

  const fsModal = document.getElementById('modal-card-fullscreen');
  const fsClose = document.getElementById('btn-close-fullscreen-card');
  fsClose?.addEventListener('click', closeCardFullscreen);
  fsModal?.addEventListener('click', event => {
    if (event.target === fsModal) closeCardFullscreen();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Tab' && modal?.classList.contains('is-open')) {
      const controls = [...modal.querySelectorAll('button:not(:disabled), [tabindex="0"]')];
      const index = controls.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); controls.at(-1)?.focus(); }
      else if (!event.shiftKey && (index < 0 || index === controls.length-1)) { event.preventDefault(); controls[0]?.focus(); }
    }
    if (event.key === 'Escape') {
      if (fsModal?.classList.contains('is-open')) { event.preventDefault(); closeCardFullscreen(); return; }
      if (modal?.classList.contains('is-open')) { event.preventDefault(); closeCardInspector(); }
    }
  });
}

  function closeCardInspector() {
    const modal = document.getElementById('modal-card-inspector');
    if (modal) { modal.classList.remove('is-open'); modal.returnFocus?.focus(); }
  }

  function openCardFullscreen(card) {
    const modal = document.getElementById('modal-card-fullscreen');
    const container = document.getElementById('fullscreen-card-container');
    if (!modal || !container) return;

    container.innerHTML = '';
    const cardElem = createCardElement(card, { draggable: false });
    const face = cardElem.querySelector('.tcg-card');
    if (face) {
      face.classList.add('is-fullscreen-face');
      cardElem.addEventListener('click', () => closeCardFullscreen());
    }
    container.appendChild(cardElem);

    if (!modal.classList.contains('is-open')) modal.returnFocus = document.activeElement;
    modal.classList.add('is-open');
    document.getElementById('btn-close-fullscreen-card')?.focus();
  }

  function closeCardFullscreen() {
    const modal = document.getElementById('modal-card-fullscreen');
    if (modal) { modal.classList.remove('is-open'); modal.returnFocus?.focus(); }
  }

  // ==========================================================================
  // 6. MANA CURVE & SELLO ANALYTICS
  // ==========================================================================
  function renderManaCurve() {
    const container = document.getElementById('mana-curve-bars');
    const avgDisplay = document.getElementById('avg-mana-display');
    if (!container) return;

    let selloCount = 0;
    const buckets = [0, 0, 0, 0, 0, 0, 0, 0];
    let nonSelloCardsSum = 0;
    let nonSelloManaSum = 0;

    state.deck.forEach(item => {
      const card = getCardById(item.cardId);
      if (!card) return;

      if (card.type === 'Sello' || card.isSello) {
        selloCount += item.count;
      } else {
        const cost = Math.max(0, card.cost);
        const bucketIndex = cost >= 7 ? 7 : cost;
        buckets[bucketIndex] += item.count;
        nonSelloCardsSum += item.count;
        nonSelloManaSum += (card.cost * item.count);
      }
    });

    const avgCost = nonSelloCardsSum > 0 ? (nonSelloManaSum / nonSelloCardsSum).toFixed(1) : '0.0';
    if (avgDisplay) {
      avgDisplay.innerHTML = `Coste Medio: <strong>${avgCost}</strong> &bull; <span style="color:#10b981;">Sellos: ${selloCount}</span>`;
    }

    const maxCount = Math.max(...buckets, selloCount, 1);
    container.innerHTML = '';

    // Sello Bar
    const selloCol = document.createElement('div');
    selloCol.className = 'mana-bar-col';
    selloCol.title = `Sellos (Recursos): ${selloCount} cartas. Clic para filtrar Sellos.`;
    const selloHeightPercent = selloCount > 0 ? Math.max(14, Math.round((selloCount / maxCount) * 100)) : 0;
    selloCol.innerHTML = `
      <div class="mana-bar-track">
        ${selloCount > 0 ? `<span class="mana-bar-count">${selloCount}</span>` : ''}
        <div class="mana-bar-fill" style="height: ${selloHeightPercent}%; background: linear-gradient(180deg, #34d399, #059669); box-shadow: 0 0 8px rgba(16,185,129,0.5);"></div>
      </div>
      <span class="mana-bar-label" style="color: #34d399; font-weight: 700;">💎S</span>
    `;
    selloCol.addEventListener('click', () => {
      playClick();
      setFilter('type', 'Sello');
    });
    container.appendChild(selloCol);

    // Cost Bars 1 to 7+
    const labels = ['0', '1', '2', '3', '4', '5', '6', '7+'];
    for (let idx = 0; idx <= 7; idx++) {
      const count = buckets[idx];
      const heightPercent = count > 0 ? Math.max(14, Math.round((count / maxCount) * 100)) : 0;

      const col = document.createElement('div');
      col.className = 'mana-bar-col';
      col.title = `Coste ${labels[idx]}: ${count} carta(s). Clic para filtrar.`;

      col.innerHTML = `
        <div class="mana-bar-track">
          ${count > 0 ? `<span class="mana-bar-count">${count}</span>` : ''}
          <div class="mana-bar-fill" style="height: ${heightPercent}%;"></div>
        </div>
        <span class="mana-bar-label">${labels[idx]}</span>
      `;

      col.addEventListener('click', () => {
        playClick();
        const targetCost = idx >= 7 ? 10 : idx;
        const slider = document.getElementById('mana-cost-slider');
        const display = document.getElementById('mana-slider-val');
        if (slider) slider.value = targetCost;
        if (display) display.textContent = targetCost >= 10 ? 'Todos (10+)' : `≤ ${targetCost} Maná`;
        setFilter('maxMana', targetCost);
      });

      container.appendChild(col);
    }
  }

  // ==========================================================================
  // 7. DECK VIEW & COMPOSITION
  // ==========================================================================
  function setupDeckGridInteractions(gridEl, target) {
    if (!gridEl) return;

    // Left click on a card: inspect it
    gridEl.addEventListener('click', (e) => {
      const cardWrapper = e.target.closest('.tcg-card-wrapper');
      if (!cardWrapper) return;
      const cardId = cardWrapper.dataset.cardId;
      if (!cardId) return;
      openCardInspector(cardId, { target, context: target });
    });

    // Right click on a card: remove 1 copy from this deck
    gridEl.addEventListener('contextmenu', (e) => {
      const cardWrapper = e.target.closest('.tcg-card-wrapper');
      if (!cardWrapper) return;
      e.preventDefault();
      const cardId = cardWrapper.dataset.cardId;
      if (!cardId) return;
      removeCardFromDeck(cardId, false, target);
      playCardRemoveSfx();
    });

    gridEl.addEventListener('dblclick', (e) => {
      const cardWrapper = e.target.closest('.tcg-card-wrapper');
      if (cardWrapper && cardWrapper.dataset.cardId) {
        e.stopPropagation();
        removeCardFromDeck(cardWrapper.dataset.cardId, false, target);
        playCardRemove();
      }
    });
  }

  function initDeckView() {
    const deckGrid = document.getElementById('deck-grid');
    const sideDeckGrid = document.getElementById('side-deck-grid');
    const extraDeckGrid = document.getElementById('extra-deck-grid');
    const deckNameInput = document.getElementById('deck-name-input');

    if (deckNameInput) {
      deckNameInput.value = state.deckName;
      deckNameInput.addEventListener('input', (e) => {
        setDeckName(e.target.value);
      });
    }

    // Keep every deck visible without scrolling: recompute the card size when the space changes
    const deckArea = document.querySelector('.deck-scrollable-area');
    if (deckArea && typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(fitDeckLayout).observe(deckArea);
    } else {
      window.addEventListener('resize', fitDeckLayout);
    }

    setupDeckGridInteractions(deckGrid, 'main');
    setupDeckGridInteractions(sideDeckGrid, 'side');

    if (extraDeckGrid) {
      extraDeckGrid.addEventListener('click', (e) => {
        const cardWrapper = e.target.closest('.tcg-card-wrapper');
        if (cardWrapper && cardWrapper.dataset.cardId) {
          openCardInspector(cardWrapper.dataset.cardId, { context: 'extra' });
        }
      });
    }
  }

  function renderDeckGrid(gridEl, deckArr, emptyStateEl) {
    if (!gridEl) return;
    if (deckArr.length === 0) {
      gridEl.innerHTML = '';
      if (emptyStateEl) emptyStateEl.style.display = 'flex';
    } else {
      if (emptyStateEl) emptyStateEl.style.display = 'none';
      gridEl.innerHTML = '';

      deckArr.forEach((item, index) => {
        const card = getCardById(item.cardId);
        if (!card) return;

        const cardElem = createCardElement(card, {
          isDeckItem: true,
          deckCount: item.count,
          draggable: true
        });
        cardElem.dataset.deckIndex = index;
        gridEl.appendChild(cardElem);
      });
    }
  }

  function renderSideDeck() {
    const sideDeckGrid = document.getElementById('side-deck-grid');
    const sideEmptyState = document.getElementById('side-deck-empty-state');
    const sideTotalElem = document.getElementById('side-deck-total-count');
    const sideCountPill = document.getElementById('side-deck-count-pill');

    const sideTotal = getDeckTotalCount('side');
    if (sideTotalElem) sideTotalElem.textContent = sideTotal;
    if (sideCountPill) {
      sideCountPill.classList.toggle('is-over', sideTotal > state.maxSideDeckSize);
      sideCountPill.classList.toggle('is-valid', sideTotal === state.maxSideDeckSize);
    }

    renderDeckGrid(sideDeckGrid, state.sideDeck, sideEmptyState);
  }

  function renderDeck() {
    const deckGrid = document.getElementById('deck-grid');
    const extraDeckGrid = document.getElementById('extra-deck-grid');
    const emptyState = document.getElementById('deck-empty-state');
    const extraEmptyState = document.getElementById('extra-empty-state');
    const totalCountElem = document.getElementById('deck-total-count');
    const extraCountElem = document.getElementById('extra-tokens-count');
    const statusBadge = document.getElementById('deck-status-badge');
    const countPill = document.getElementById('deck-count-pill');

    if (!deckGrid) return;

    const totalCount = getDeckTotalCount('main');

    if (totalCountElem) totalCountElem.textContent = totalCount;

    if (countPill && statusBadge) {
      countPill.classList.remove('is-valid', 'is-over');
      statusBadge.className = 'deck-status-badge';

      if (totalCount === state.maxDeckSize) {
        countPill.classList.add('is-valid');
        statusBadge.classList.add('is-ready');
        statusBadge.textContent = `Listo (${totalCount}/${state.maxDeckSize})`;
      } else if (totalCount > state.maxDeckSize) {
        countPill.classList.add('is-over');
        statusBadge.classList.add('is-overlimit');
        statusBadge.textContent = `Exceso (${totalCount}/${state.maxDeckSize})`;
      } else {
        statusBadge.classList.add('is-incomplete');
        statusBadge.textContent = `Incompleto (${totalCount}/${state.maxDeckSize})`;
      }
    }

    renderDeckGrid(deckGrid, state.deck, emptyState);

    renderSideDeck();

    const activeTokens = getActiveExtraDeckTokens();
    if (extraCountElem) extraCountElem.textContent = activeTokens.length;

    if (extraDeckGrid) {
      if (activeTokens.length === 0) {
        extraDeckGrid.innerHTML = '';
        if (extraEmptyState) extraEmptyState.style.display = 'block';
      } else {
        if (extraEmptyState) extraEmptyState.style.display = 'none';
        extraDeckGrid.innerHTML = '';

        activeTokens.forEach(token => {
          const cardElem = createCardElement(token, {
            isDeckItem: false,
            draggable: false
          });
          extraDeckGrid.appendChild(cardElem);
        });
      }
    }

    updateDeckCompositionStats();
    renderManaCurve();

    fitDeckLayout();
  }

  // ── Fit-to-window layout ─────────────────────────────────────────────────────
  // Main, Side and Extra decks are always fully visible: instead of scrolling, the card
  // size is recomputed from the free space and the number of cards in each deck.
  const FIT_CARD_ASPECT = 1.4;   // card height / width (5:7 cards)
  const FIT_MAX_CARD_W = 150;
  const FIT_MIN_CARD_W = 44;     // below this size the area scrolls as a last resort
  const FIT_EXTRA_SCALE = 0.75;  // tokens are automatic and shown smaller than Main/Side cards

  function fitGapFor(cardW) {
    return Math.round(Math.min(12, Math.max(4, cardW * 0.09)));
  }

  function fitDeckLayout() {
    const area = document.querySelector('.deck-scrollable-area');
    if (!area) return;

    const areaStyle = getComputedStyle(area);
    const availableH = area.clientHeight - parseFloat(areaStyle.paddingTop) - parseFloat(areaStyle.paddingBottom);
    const areaGap = parseFloat(areaStyle.rowGap) || 0;

    const decks = [
      { gridId: 'deck-grid', sectionSelector: '.deck-main-section', scale: 1 },
      { gridId: 'side-deck-grid', sectionSelector: '#side-deck-panel', scale: 1 },
      { gridId: 'extra-deck-grid', sectionSelector: '#extra-deck-panel', scale: FIT_EXTRA_SCALE }
    ].map(deck => {
      const grid = document.getElementById(deck.gridId);
      const section = area.querySelector(deck.sectionSelector);
      if (!grid || !section) return null;
      return {
        grid,
        scale: deck.scale,
        count: grid.children.length,
        width: grid.clientWidth,
        // Everything in the section that is not the card grid (title, padding, borders)
        overhead: section.offsetHeight - grid.offsetHeight
      };
    }).filter(Boolean);

    if (decks.length === 0 || availableH <= 0) return;

    const budget = availableH - areaGap * (decks.length - 1);

    // Total height needed by all decks when main/side cards are `w` pixels wide
    const neededHeight = (w) => decks.reduce((total, deck) => {
      const cardW = Math.max(FIT_MIN_CARD_W * deck.scale, Math.floor(w * deck.scale));
      const gap = fitGapFor(cardW);
      const columns = Math.max(1, Math.floor((deck.width + gap) / (cardW + gap)));
      const rows = Math.max(1, Math.ceil(deck.count / columns)); // an empty deck keeps one row as drop target
      return total + deck.overhead + rows * Math.ceil(cardW * FIT_CARD_ASPECT) + (rows - 1) * gap;
    }, 0);

    let low = FIT_MIN_CARD_W;
    let high = FIT_MAX_CARD_W;
    let best = FIT_MIN_CARD_W;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (neededHeight(mid) <= budget) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    decks.forEach(deck => {
      const cardW = Math.max(FIT_MIN_CARD_W * deck.scale, Math.floor(best * deck.scale));
      deck.grid.style.setProperty('--fit-card-w', cardW + 'px');
      deck.grid.style.setProperty('--fit-card-h', Math.ceil(cardW * FIT_CARD_ASPECT) + 'px');
      deck.grid.style.setProperty('--fit-gap', fitGapFor(cardW) + 'px');
      deck.grid.dataset.cardSize = cardW >= 110 ? 'lg' : (cardW >= 80 ? 'md' : (cardW >= 60 ? 'sm' : 'xs'));
    });
  }

  function updateDeckCompositionStats() {
    let creatures = 0, fastSpells = 0, slowSpells = 0, structures = 0, artifacts = 0, sellos = 0, terrains = 0;
    const planetCounts = {};

    state.deck.forEach(item => {
      const card = getCardById(item.cardId);
      if (!card) return;

      const count = item.count;
      switch (card.type) {
        case 'Criatura': creatures += count; break;
        case 'HechizoRapido': fastSpells += count; break;
        case 'HechizoLento': slowSpells += count; break;
        case 'Estructura': structures += count; break;
        case 'Artefacto': artifacts += count; break;
        case 'Sello': sellos += count; break;
        case 'Terreno': terrains += count; break;
      }

      if (card.element && card.element !== 'neutral') {
        planetCounts[card.element] = (planetCounts[card.element] || 0) + count;
      }
    });

    const setPill = (id, count) => {
      const el = document.getElementById(id);
      if (el) el.textContent = `${el.textContent.split(':')[0]}: ${count}`;
    };

    setPill('pill-creatures', creatures);
    setPill('pill-fast-spells', fastSpells);
    setPill('pill-slow-spells', slowSpells);
    setPill('pill-structures', structures);
    setPill('pill-artifacts', artifacts);
    setPill('pill-sellos', sellos);
    setPill('pill-terrains', terrains);

    const dotsContainer = document.getElementById('element-distribution-dots');
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      Object.keys(planetCounts).forEach(planetKey => {
        const count = planetCounts[planetKey];
        const info = ELEMENTS[planetKey] || ELEMENTS.neutral;
        const badge = document.createElement('span');
        badge.className = 'planet-dot-badge';
        badge.style.background = info.glow;
        badge.style.borderColor = info.color;
        badge.innerHTML = `${renderElementIcon(planetKey)} ${info.name}: <strong>${count}</strong>`;
        dotsContainer.appendChild(badge);
      });
    }
  }

  // ==========================================================================
  // 8. FILTER & LIBRARY MANAGER
  // ==========================================================================
  function initFilters() {
    const searchInput = document.getElementById('filter-search');
    const clearSearchBtn = document.getElementById('btn-clear-search');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        setFilter('search', val);
        if (clearSearchBtn) clearSearchBtn.style.display = val ? 'block' : 'none';
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        setFilter('search', '');
      });
    }

    const scaleSlider = document.getElementById('card-scale-slider');
    const scaleValueText = document.getElementById('card-scale-value');

    if (scaleSlider) {
      scaleSlider.value = state.filters.cardScale || 1.0;
      if (scaleValueText) scaleValueText.textContent = `${Math.round(scaleSlider.value * 100)}%`;

      scaleSlider.addEventListener('input', (e) => {
        const scale = parseFloat(e.target.value);
        state.filters.cardScale = scale;
        saveToLocalStorage();
        if (scaleValueText) scaleValueText.textContent = `${Math.round(scale * 100)}%`;
        applyCardScale(scale);
      });
    }

    const elementButtons = document.querySelectorAll('#element-filters .element-btn');
    elementButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        elementButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        playClick();
        setFilter('element', btn.dataset.element);
      });
    });

    const typeButtons = document.querySelectorAll('#type-filters .pill-filter-btn');
    typeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        typeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        playClick();
        setFilter('type', btn.dataset.type);
      });
    });

    const raritySelect = document.getElementById('rarity-filter');
    if (raritySelect) {
      raritySelect.addEventListener('change', (e) => {
        playClick();
        setFilter('rarity', e.target.value);
      });
    }

    const manaSlider = document.getElementById('mana-cost-slider');
    const manaSliderVal = document.getElementById('mana-slider-val');
    if (manaSlider) {
      manaSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (manaSliderVal) {
          manaSliderVal.textContent = val >= 10 ? 'Todos (10+)' : `≤ ${val} Maná`;
        }
        setFilter('maxMana', val);
      });
    }

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        playClick();
        setFilter('sort', e.target.value);
      });
    }

    const resetBtn = document.getElementById('btn-reset-filters');
    const clearFiltersEmptyBtn = document.getElementById('btn-clear-filters-empty');

    const handleReset = () => {
      playClick();
      resetFilters();
      if (searchInput) searchInput.value = '';
      if (clearSearchBtn) clearSearchBtn.style.display = 'none';
      if (raritySelect) raritySelect.value = 'all';
      if (manaSlider) {
        manaSlider.value = 10;
        if (manaSliderVal) manaSliderVal.textContent = 'Todos (10+)';
      }
      if (sortSelect) sortSelect.value = 'cost-asc';

      elementButtons.forEach(b => b.classList.toggle('active', b.dataset.element === 'all'));
      typeButtons.forEach(b => b.classList.toggle('active', b.dataset.type === 'all'));
    };

    if (resetBtn) resetBtn.addEventListener('click', handleReset);
    if (clearFiltersEmptyBtn) clearFiltersEmptyBtn.addEventListener('click', handleReset);

    const libraryGrid = document.getElementById('library-grid');
    if (libraryGrid) {
      // Left click only inspects the card. A card is added to the deck with a right click
      // (or by dragging it to the deck), so a stray click never changes the deck.
      libraryGrid.addEventListener('click', (e) => {
        const cardWrapper = e.target.closest('.tcg-card-wrapper');
        if (cardWrapper && cardWrapper.dataset.cardId) {
          openCardInspector(cardWrapper.dataset.cardId, { context: 'library', contextIds: getVisibleLibraryCardIds() });
        }
      });

      libraryGrid.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const cardWrapper = e.target.closest('.tcg-card-wrapper');
        if (!cardWrapper) return;

        const cardId = cardWrapper.dataset.cardId;
        if (!cardId) return;

        // If the Main Deck is already full, a right-click adds the card to the Side Deck instead
        const target = getDeckTotalCount('main') >= state.maxDeckSize ? 'side' : 'main';

        const check = canAddCardToDeck(cardId, target);
        if (check.allowed) {
          addCardToDeck(cardId, target);
          playCardAddSfx();
          const card = CARDS_DATA.find(c => c.id === cardId);
          showToast(`Agregado: ${card ? card.name : 'Carta'} al ${target === 'side' ? 'Side Deck' : 'mazo'}`, 'success');
        } else {
          showToast(check.reason, 'warning');
        }
      });
    }

    applyCardScale(state.filters.cardScale || 1.0);
  }

  function applyCardScale(scale) {
    const libraryGrid = document.getElementById('library-grid');
    if (libraryGrid) {
      libraryGrid.style.setProperty('--grid-scale', scale);
    }
  }

  const RARITY_WEIGHT = {
    Legendary: 4,
    Epic: 3,
    Rare: 2,
    Common: 1
  };

  function getFilteredSortedCards() {
    const { search, element, type, rarity, maxMana, sort } = state.filters;

    let filtered = CARDS_DATA.filter(card => {
      if ((card.type === 'Token' || card.isToken) && type !== 'Token') {
        return false;
      }

      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = card.name.toLowerCase().includes(query);
        const matchDesc = card.description && card.description.toLowerCase().includes(query);
        const matchFlavor = card.flavor && card.flavor.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchFlavor) return false;
      }

      if (element !== 'all' && card.element !== element) return false;
      if (type !== 'all' && card.type !== type) return false;

      if (rarity !== 'all') {
        if (card.type === 'Sello' || card.isSello || !card.rarity) return false;
        if (card.rarity !== rarity) return false;
      }

      if (maxMana < 10 && card.cost > maxMana) return false;

      return true;
    });

    filtered.sort((a, b) => {
      switch (sort) {
        case 'cost-asc': return a.cost - b.cost || a.name.localeCompare(b.name);
        case 'cost-desc': return b.cost - a.cost || a.name.localeCompare(b.name);
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'rarity-asc': return (RARITY_WEIGHT[a.rarity] || 0) - (RARITY_WEIGHT[b.rarity] || 0) || a.cost - b.cost;
        case 'rarity-desc': return (RARITY_WEIGHT[b.rarity] || 0) - (RARITY_WEIGHT[a.rarity] || 0) || a.cost - b.cost;
        case 'attack-desc': return (b.attack || 0) - (a.attack || 0) || a.cost - b.cost;
        case 'health-desc': return (b.health || 0) - (a.health || 0) || a.cost - b.cost;
        default: return 0;
      }
    });

    return filtered;
  }

  // Exposes the Colección grid's current filtered + sorted card ids, in the same
  // order they're rendered in, so the inspector's prev/next navigation can walk
  // through exactly what the user is looking at.
  function getVisibleLibraryCardIds() {
    return getFilteredSortedCards().map(card => card.id);
  }

  function renderLibrary() {
    const libraryGrid = document.getElementById('library-grid');
    const emptyState = document.getElementById('library-empty');
    const filteredCountElem = document.getElementById('filtered-card-count');
    const totalCountElem = document.getElementById('total-card-count');

    if (!libraryGrid) return;

    const filtered = getFilteredSortedCards();

    const nonTokenTotal = CARDS_DATA.filter(c => c.type !== 'Token' && !c.isToken).length;
    if (totalCountElem) totalCountElem.textContent = nonTokenTotal;
    if (filteredCountElem) filteredCountElem.textContent = filtered.length;

    if (CARDS_DATA.length === 0) {
      if (emptyState) emptyState.style.display = 'none';
      libraryGrid.innerHTML = `
        <div class="library-empty-collection">
          <div class="empty-icon-shield">📂</div>
          <h3>Tu colección está vacía</h3>
          <p>Aún no has agregado cartas a tu biblioteca.</p>
          <p class="empty-subtext">Puedes importar imágenes o carpetas de cartas con los formatos:<br>
            <code>Nombre_Tipo_Rareza_Faccion_ATK_DEF_Coste.png</code><br>
            <code>Sello_Faccion.png</code> (Sin límite / recurso)<br>
            <code>Token_Nombre_Faccion.png</code> (Mazo Extra automático)
          </p>
          <button id="btn-import-from-empty" class="btn btn-primary" style="margin-top: 16px;">
            <span>📁</span> Abrir Importador de Cartas
          </button>
        </div>
      `;

      const importFromEmptyBtn = document.getElementById('btn-import-from-empty');
      if (importFromEmptyBtn) {
        importFromEmptyBtn.addEventListener('click', () => {
          const modal = document.getElementById('modal-import-images');
          if (modal) modal.classList.add('is-open');
        });
      }
    } else if (filtered.length === 0) {
      libraryGrid.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
    } else {
      if (emptyState) emptyState.style.display = 'none';
      const previous = new Map([...libraryGrid.querySelectorAll('.tcg-card-wrapper')].map(node => [node.dataset.cardId, node]));
    const fragment = document.createDocumentFragment();

      filtered.forEach(card => {
        const currentInDeck = getCombinedCardCount(card.id);
        const maxAllowed = getMaxAllowedCopies(card.id);
        const isSello = card.type === 'Sello' || card.isSello || !card.rarity;
        const banlisted = isCardBanlisted(card.id);
        const isMaxInDeck = !isSello && currentInDeck >= maxAllowed;

        const cardElem = previous.get(card.id) || createCardElement(card, {
          isDeckItem: false,
          isMaxInDeck,
          draggable: card.type !== 'Token' && !card.isToken
        });
        const face = cardElem.querySelector('.tcg-card');
      face.classList.toggle('is-max-in-deck', isMaxInDeck);
      face.classList.toggle('is-banlisted', banlisted);
      let badge = face.querySelector('.library-card-in-deck-badge');
      if (currentInDeck > 0) {
        if (!badge) { badge = document.createElement('div'); face.appendChild(badge); }
        badge.className = 'library-card-in-deck-badge' + (isMaxInDeck ? ' is-max' : '');
        badge.textContent = isSello && !banlisted ? `x${currentInDeck}` : `${currentInDeck}/${maxAllowed}`;
        badge.title = `${currentInDeck} copias entre Mazo Principal y Side Deck`;
      } else if (badge) badge.remove();
      let banBadge = face.querySelector('.card-banlist-badge');
      if (banlisted) {
        if (!banBadge) { banBadge = document.createElement('div'); banBadge.className = 'card-banlist-badge'; face.appendChild(banBadge); }
        banBadge.textContent = `🚫 ${maxAllowed}`;
        banBadge.title = `Restricción de Banlist: máximo ${maxAllowed} copias entre Mazo Principal y Side Deck`;
      } else if (banBadge) banBadge.remove();
      fragment.appendChild(cardElem);
      });
    libraryGrid.replaceChildren(fragment);
    }
  }

  // ==========================================================================
  // 9. DRAG AND DROP ENGINE
  // ==========================================================================
  let draggedData = null;

  function parseDragPayload(e) {
    let payload = draggedData;
    if (!payload) {
      try {
        const json = e.dataTransfer.getData('application/json');
        if (json) payload = JSON.parse(json);
      } catch {
        const textCardId = e.dataTransfer.getData('text/plain');
        if (textCardId) payload = { source: 'library', cardId: textCardId, index: -1 };
      }
    }
    return payload;
  }

  function setupDeckDropzone(dropzoneEl, gridSelector, target) {
    if (!dropzoneEl) return;

    dropzoneEl.addEventListener('dragenter', (e) => {
      e.preventDefault();
      if (draggedData) dropzoneEl.classList.add('is-drag-over');
    });

    dropzoneEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = draggedData && draggedData.source === 'library' ? 'copy' : 'move';
    });

    dropzoneEl.addEventListener('dragleave', (e) => {
      if (!dropzoneEl.contains(e.relatedTarget)) {
        dropzoneEl.classList.remove('is-drag-over');
      }
    });

    dropzoneEl.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzoneEl.classList.remove('is-drag-over');

      const payload = parseDragPayload(e);
      if (!payload || !payload.cardId) return;

      if (payload.source === 'library') {
        const check = canAddCardToDeck(payload.cardId, target);
        if (check.allowed) {
          addCardToDeck(payload.cardId, target);
          playCardDrop();
          const card = getCardById(payload.cardId);
          showToast(`Agregado: ${card ? card.name : 'Carta'} al ${target === 'side' ? 'Side Deck' : 'mazo'}`, 'success');
        } else {
          showToast(check.reason, 'warning');
        }
      } else if (payload.source === target) {
        const targetCardWrapper = e.target.closest(`${gridSelector} .tcg-card-wrapper`);
        if (targetCardWrapper && targetCardWrapper.dataset.deckIndex !== undefined) {
          const targetIndex = parseInt(targetCardWrapper.dataset.deckIndex, 10);
          if (payload.index !== -1 && targetIndex !== payload.index) {
            reorderDeck(payload.index, targetIndex, target);
            playCardDrop();
          }
        }
      } else if (payload.source === 'main' || payload.source === 'side') {
        // Dropped a Main Deck card onto the Side Deck, or vice versa: move 1 copy across
        const result = moveCardBetweenDecks(payload.cardId, payload.source);
        const card = getCardById(payload.cardId);
        if (result.success) {
          playCardDrop();
          showToast(`Movida 1 copia de ${card ? card.name : 'la carta'} al ${target === 'side' ? 'Side Deck' : 'Mazo Principal'}`, 'success');
        } else {
          showToast(result.reason, 'warning');
        }
      }
    });
  }

  function initDragAndDrop() {
    const deckDropzone = document.getElementById('deck-dropzone');
    const sideDeckDropzone = document.getElementById('side-deck-dropzone');
    const libraryGrid = document.getElementById('library-grid');

    document.addEventListener('dragstart', (e) => {
      const cardElem = e.target.closest('.tcg-card');
      if (!cardElem) return;

      const wrapper = cardElem.closest('.tcg-card-wrapper');
      if (!wrapper) return;

      const cardId = wrapper.dataset.cardId;
      if (!cardId) return;

      const isMainItem = wrapper.closest('#deck-grid') !== null;
      const isSideItem = wrapper.closest('#side-deck-grid') !== null;
      const isLibraryItem = wrapper.closest('#library-grid') !== null;

      const source = isMainItem ? 'main' : (isSideItem ? 'side' : (isLibraryItem ? 'library' : 'other'));
      const index = (isMainItem || isSideItem) ? parseInt(wrapper.dataset.deckIndex, 10) : -1;

      draggedData = { source, cardId, index };

      e.dataTransfer.effectAllowed = 'copyMove';
      e.dataTransfer.setData('application/json', JSON.stringify(draggedData));
      e.dataTransfer.setData('text/plain', cardId);

      cardElem.classList.add('is-dragging');
      playCardPickup();

      if ((isMainItem || isSideItem) && libraryGrid) {
        libraryGrid.classList.add('is-remove-target');
      }
    });

    document.addEventListener('dragend', (e) => {
      const cardElem = e.target.closest('.tcg-card');
      if (cardElem) cardElem.classList.remove('is-dragging');

      if (deckDropzone) deckDropzone.classList.remove('is-drag-over');
      if (sideDeckDropzone) sideDeckDropzone.classList.remove('is-drag-over');
      if (libraryGrid) {
        libraryGrid.classList.remove('is-remove-target');
        libraryGrid.classList.remove('is-drag-over');
      }

      draggedData = null;
    });

    setupDeckDropzone(deckDropzone, '#deck-grid', 'main');
    setupDeckDropzone(sideDeckDropzone, '#side-deck-grid', 'side');

    if (libraryGrid) {
      libraryGrid.addEventListener('dragenter', (e) => {
        if (draggedData && (draggedData.source === 'main' || draggedData.source === 'side')) {
          e.preventDefault();
          libraryGrid.classList.add('is-drag-over');
        }
      });

      libraryGrid.addEventListener('dragover', (e) => {
        if (draggedData && (draggedData.source === 'main' || draggedData.source === 'side')) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }
      });

      libraryGrid.addEventListener('dragleave', (e) => {
        if (!libraryGrid.contains(e.relatedTarget)) {
          libraryGrid.classList.remove('is-drag-over');
        }
      });

      libraryGrid.addEventListener('drop', (e) => {
        const payload = parseDragPayload(e);
        libraryGrid.classList.remove('is-drag-over');

        if (payload && (payload.source === 'main' || payload.source === 'side') && payload.cardId) {
          e.preventDefault();
          removeCardFromDeck(payload.cardId, true, payload.source);
          playCardRemove();
          const card = getCardById(payload.cardId);
          showToast(`Removido: ${card ? card.name : 'Carta'} del ${payload.source === 'side' ? 'Side Deck' : 'mazo'}`, 'info');
        }
      });
    }
  }

  // ==========================================================================
  // 10. SAMPLE HAND SIMULATOR (MULLIGAN)
  // ==========================================================================
  let currentHand = [];
  let remainingDeck = [];

  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildFullDeckArray() {
    const fullList = [];
    state.deck.forEach(item => {
      const card = getCardById(item.cardId);
      if (card) {
        for (let i = 0; i < item.count; i++) {
          fullList.push(card);
        }
      }
    });
    return fullList;
  }

  function initTestHandModal() {
    const modal = document.getElementById('modal-test-hand');
    const openBtn = document.getElementById('btn-test-hand');
    const closeBtn = document.getElementById('btn-close-test-hand');
    const mulliganBtn = document.getElementById('btn-mulligan');
    const drawOneBtn = document.getElementById('btn-draw-one');
    const resetBtn = document.getElementById('btn-reset-hand');

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        const totalCount = getDeckTotalCount();
        if (totalCount < 5) {
          showToast('Necesitas al menos 5 cartas en el mazo para simular una mano inicial.', 'warning');
          return;
        }
        playShuffle();
        startNewHand();
        if (modal) modal.classList.add('is-open');
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.remove('is-open'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('is-open');
      });
    }

    if (mulliganBtn) mulliganBtn.addEventListener('click', executeMulligan);
    if (drawOneBtn) drawOneBtn.addEventListener('click', drawOneCard);
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        playShuffle();
        startNewHand();
      });
    }
  }

  function startNewHand() {
    const fullDeck = buildFullDeckArray();
    const shuffled = shuffleArray(fullDeck);

    currentHand = shuffled.slice(0, 5).map(card => ({ card, selectedForMulligan: false }));
    remainingDeck = shuffled.slice(5);

    renderHand();
  }

  function executeMulligan() {
    const selectedIndexes = [];
    currentHand.forEach((item, idx) => {
      if (item.selectedForMulligan) selectedIndexes.push(idx);
    });

    if (selectedIndexes.length === 0) {
      showToast('Selecciona al menos 1 carta haciendo clic en ella para redibujarla.', 'info');
      return;
    }

    playShuffle();

    const discarded = [];
    selectedIndexes.forEach(idx => {
      discarded.push(currentHand[idx].card);
    });

    remainingDeck.push(...discarded);
    remainingDeck = shuffleArray(remainingDeck);

    selectedIndexes.forEach(idx => {
      if (remainingDeck.length > 0) {
        currentHand[idx] = { card: remainingDeck.shift(), selectedForMulligan: false };
      }
    });

    showToast(`Mulligan completado: ${selectedIndexes.length} carta(s) reemplazada(s).`, 'success');
    renderHand();
  }

  function drawOneCard() {
    if (remainingDeck.length === 0) {
      showToast('¡No quedan más cartas en el mazo para robar!', 'warning');
      return;
    }

    playCardDrop();
    const newCard = remainingDeck.shift();
    currentHand.push({ card: newCard, selectedForMulligan: false });
    renderHand();
  }

  function renderHand() {
    const cardsContainer = document.getElementById('test-hand-cards');
    const statsContainer = document.getElementById('test-hand-stats');
    const avgManaSpan = document.getElementById('hand-avg-mana');

    if (!cardsContainer) return;
    cardsContainer.innerHTML = '';

    let manaSum = 0;
    currentHand.forEach((item, index) => {
      manaSum += item.card.cost;

      const cardElem = createCardElement(item.card, {
        isHandItem: true,
        draggable: false
      });

      if (item.selectedForMulligan) {
        cardElem.classList.add('is-selected-mulligan');
      }

      // Toggle selection on click
      cardElem.addEventListener('click', () => {
        playClick();
        item.selectedForMulligan = !item.selectedForMulligan;
        cardElem.classList.toggle('is-selected-mulligan', item.selectedForMulligan);
      });

      cardsContainer.appendChild(cardElem);
    });

    const avgCost = currentHand.length > 0 ? (manaSum / currentHand.length).toFixed(1) : '0.0';
    if (avgManaSpan) avgManaSpan.textContent = `Coste promedio en mano: ${avgCost}`;
    if (statsContainer) {
      statsContainer.innerHTML = `
        <span>Mano actual: <strong>${currentHand.length}</strong> cartas</span> &bull;
        <span>Restantes en mazo: <strong>${remainingDeck.length}</strong></span> &bull;
        <span>Coste medio: <strong>${avgCost}</strong></span>
      `;
    }
  }

  // ==========================================================================
  // 11. BOOTSTRAP, MODALS & GLOBAL APPLICATION
  // ==========================================================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✨', warning: '⚠️', danger: '🛑', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || '✨'}</span>
      <span class="toast-text">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  function initSoundButton() {
    const btn = document.getElementById('btn-sound-toggle');
    const icon = document.getElementById('sound-icon');
    const updateIcon = () => {
      if (icon) icon.textContent = isSoundEnabled() ? '🔊' : '🔇';
    };

    initSoundState();
    updateIcon();
    if (btn) {
      btn.addEventListener('click', () => {
        const enabled = toggleSound();
        updateIcon();
        showToast(enabled ? 'Sonido activado' : 'Sonido silenciado', 'info');
      });
    }
  }

  function initPoolUpdatesButton() {
    const btn = document.getElementById('btn-check-pool-updates');
    if (!btn) return;

    const defaultLabel = btn.querySelector('.btn-label')?.textContent || 'Buscar Actualizaciones';

    btn.addEventListener('click', async () => {
      if (btn.disabled) return;
      btn.disabled = true;
      const label = btn.querySelector('.btn-label');
      if (label) label.textContent = 'Buscando...';

      try {
        const result = await checkForPoolUpdates((current, total) => {
          if (label) label.textContent = `Cargando ${current}/${total}...`;
        });

        if (!result.success) {
          if (result.cancelled) {
            // closed the picker: not an error
          } else if (result.unsupported) {
            showToast(result.reason, 'warning');
          } else {
            showToast(result.reason || 'No se pudo actualizar la pool base.', 'danger');
          }
          return;
        }

        if (result.added === 0) {
          showToast('La pool base ya está actualizada: no se encontraron cartas nuevas.', 'info');
        } else {
          const setsText = result.sets.length ? ` (${result.sets.join(', ')})` : '';
          showToast(`Se agregaron ${result.added} carta${result.added === 1 ? '' : 's'} nueva${result.added === 1 ? '' : 's'} de la pool base${setsText}.`, 'success');
          renderLibrary();
          renderDeck();
        }
      } catch (err) {
        showToast('No se pudo actualizar la pool base: ' + (err && err.message ? err.message : err), 'danger');
      } finally {
        btn.disabled = false;
        if (label) label.textContent = defaultLabel;
      }
    });
  }

  function initClearDeckButton() {
    const btn = document.getElementById('btn-clear-deck');
    if (btn) {
      btn.addEventListener('click', () => {
        if (state.deck.length === 0) {
          showToast('El mazo ya está vacío.', 'info');
          return;
        }
        if (confirm('¿Estás seguro de que deseas vaciar todas las cartas del mazo?')) {
          clearDeck();
          playCardRemove();
          showToast('Se ha vaciado el mazo por completo.', 'info');
        }
      });
    }
  }

  function initExportImportModal() {
    const modal = document.getElementById('modal-export-import');
    const openBtn = document.getElementById('btn-export-deck');
    const closeBtn = document.getElementById('btn-close-export');
    const copyBtn = document.getElementById('btn-copy-clipboard');
    const applyBtn = document.getElementById('btn-import-apply');

    const textArea = document.getElementById('export-text-area');
    const jsonArea = document.getElementById('export-json-area');
    const officialArea = document.getElementById('export-official-area');
    const tabButtons = modal ? modal.querySelectorAll('.tab-btn') : [];

    let currentTab = 'tab-text-deck';

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.dataset.tab;

        modal.querySelectorAll('.tab-content').forEach(tabEl => {
          tabEl.classList.toggle('active', tabEl.id === currentTab);
        });
        playClick();
      });
    });

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        playClick();
        if (textArea) textArea.value = exportDeckToText();
        if (jsonArea) jsonArea.value = exportDeckToJSON();
        if (officialArea) officialArea.value = exportDeckToOfficialFormat();
        if (modal) modal.classList.add('is-open');
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.remove('is-open'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('is-open');
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        playClick();
        let contentToCopy = '';
        if (currentTab === 'tab-text-deck') contentToCopy = textArea ? textArea.value : '';
        else if (currentTab === 'tab-json-deck') contentToCopy = jsonArea ? jsonArea.value : '';
        else contentToCopy = officialArea ? officialArea.value : '';
        try {
          await navigator.clipboard.writeText(contentToCopy);
          showToast('¡Copiado al portapapeles con éxito!', 'success');
        } catch {
          showToast('Por favor selecciona y copia manualmente.', 'warning');
        }
      });
    }

    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        playClick();
        let res;
        if (currentTab === 'tab-text-deck') {
          res = importDeckFromText(textArea ? textArea.value : '');
        } else if (currentTab === 'tab-json-deck') {
          res = importDeckFromJSON(jsonArea ? jsonArea.value : '');
        } else {
          res = importDeckFromOfficialFormat(officialArea ? officialArea.value : '');
        }

        if (res.success) {
        document.getElementById('deck-name-input').value = state.deckName;
          showToast(`¡Mazo importado con éxito (${res.count} cartas cargadas)!`, 'success');
          if (modal) modal.classList.remove('is-open');
        } else {
          showToast(`Error al importar: ${res.error || 'Formato no reconocido'}`, 'danger');
        }
      });
    }
  }

  function initCardImporterModal() {
    const modal = document.getElementById('modal-import-images');
    const openBtn = document.getElementById('btn-import-folder');
    const closeBtn = document.getElementById('btn-close-import-images');
    const confirmCloseBtn = document.getElementById('btn-confirm-import-close');
    const dropArea = document.getElementById('import-drop-area');
    const inputFolder = document.getElementById('input-import-folder');
    const inputFiles = document.getElementById('input-import-files');
    const selectFolderBtn = document.getElementById('btn-select-folder');
    const selectFilesBtn = document.getElementById('btn-select-files');
    const clearDbBtn = document.getElementById('btn-clear-custom-cards');
    const progressBox = document.getElementById('import-progress-box');
    const progressFill = document.getElementById('import-progress-fill');
    const progressText = document.getElementById('import-progress-text');
    const resultsSummary = document.getElementById('import-results-summary');
    const cardsPreview = document.getElementById('import-cards-preview');

    const closeModal = () => { if (modal) modal.classList.remove('is-open'); };

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        playClick();
        if (modal) modal.classList.add('is-open');
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (confirmCloseBtn) confirmCloseBtn.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    if (selectFolderBtn && inputFolder) {
      selectFolderBtn.addEventListener('click', () => inputFolder.click());
    }

    if (selectFilesBtn && inputFiles) {
      selectFilesBtn.addEventListener('click', () => inputFiles.click());
    }

    let importing = false;
  const handleFiles = async (files) => {
      if (!files || files.length === 0) return;
    if (importing) return;
    importing = true;
    try {

      if (progressBox) progressBox.style.display = 'flex';
      if (resultsSummary) resultsSummary.style.display = 'none';
      if (cardsPreview) cardsPreview.innerHTML = '';

      const imported = await processImageFiles(files, (curr, total, card) => {
        const pct = Math.round((curr / total) * 100);
        if (progressFill) progressFill.style.width = `${pct}%`;
        if (progressText) progressText.textContent = `Procesando: ${curr}/${total}${card ? ' (' + card.name + ')' : ''}`;
      });

      if (progressBox) progressBox.style.display = 'none';

      if (imported.length > 0) {
        playCardDrop();
        showToast(`¡Se importaron ${imported.length} cartas al catálogo!`, 'success');

        if (resultsSummary && cardsPreview) {
          resultsSummary.style.display = 'block';
          imported.forEach(c => {
            const chip = document.createElement('div');
            chip.className = 'preview-chip';
            chip.innerHTML = `
              <span class="preview-chip-name" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</span>
              <span class="preview-chip-meta">${escapeHtml(c.type)} • ${c.cost}💧</span>
            `;
            cardsPreview.appendChild(chip);
          });
        }

        renderLibrary();
        renderDeck();
      } else {
        showToast('No hay imágenes nuevas: la selección está vacía, no contiene imágenes o ya fue importada.', 'warning');
      }
    } catch (error) {
      showToast(error.message || 'No se pudo completar la importación.', 'danger');
    } finally {
      importing = false;
      if (progressBox) progressBox.style.display = 'none';
      document.getElementById('input-import-folder').value = '';
      document.getElementById('input-import-files').value = '';
      renderLibrary();
    }

    };

    if (inputFolder) {
      inputFolder.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        inputFolder.value = '';
      });
    }

    if (inputFiles) {
      inputFiles.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        inputFiles.value = '';
      });
    }

    if (dropArea) {
      dropArea.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dropArea.classList.add('is-drag-over');
      });

      dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      });

      dropArea.addEventListener('dragleave', (e) => {
        if (!dropArea.contains(e.relatedTarget)) {
          dropArea.classList.remove('is-drag-over');
        }
      });

      dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('is-drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFiles(e.dataTransfer.files);
        }
      });
    }

    if (clearDbBtn) {
      clearDbBtn.addEventListener('click', async () => {
        if (confirm('¿Estás seguro de que deseas eliminar todas las cartas personalizadas importadas?')) {
          await clearCustomCardsDB();
          CARDS_DATA.length = 0;
          clearDeck();
          renderLibrary();
          renderDeck();
          if (resultsSummary) resultsSummary.style.display = 'none';
          showToast('Se eliminaron todas las cartas importadas de la memoria local.', 'info');
        }
      });
    }
  }

  // ==========================================================================
  // 12. BANLIST MANAGER (PERSISTENT PER-CARD COPY LIMIT OVERRIDES)
  // ==========================================================================
  function defaultLimitFor(card) {
    const isSello = card.type === 'Sello' || card.isSello || !card.rarity;
    if (isSello) return state.maxDeckSize;
    return RARITY_LIMITS[card.rarity] || 4;
  }

  function initSavedDecksModal() {
    const modal = document.getElementById('modal-saved-decks');
    const openBtn = document.getElementById('btn-saved-decks');
    const closeBtn = document.getElementById('btn-close-saved-decks');
    const closeFooterBtn = document.getElementById('btn-close-saved-decks-footer');
    const nameInput = document.getElementById('saved-deck-name-input');
    const saveBtn = document.getElementById('btn-save-deck');
    const currentInfo = document.getElementById('saved-decks-current-info');
    const listEl = document.getElementById('saved-decks-list');
    const emptyMsg = document.getElementById('saved-decks-empty-msg');
    const errorMsg = document.getElementById('saved-decks-error');

    const closeModal = () => modal?.classList.remove('is-open');
    const countOf = list => (Array.isArray(list) ? list : [])
      .reduce((sum, item) => sum + (Number.isSafeInteger(item.count) ? item.count : 0), 0);

    function formatDate(timestamp) {
      try {
        return new Date(timestamp).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
      } catch (err) {
        return '';
      }
    }

    function syncDeckNameInput() {
      const input = document.getElementById('deck-name-input');
      if (input) input.value = state.deckName;
    }

    function renderCurrentInfo() {
      if (!currentInfo) return;
      currentInfo.textContent = `Mazo actual: ${getDeckTotalCount('main')} cartas en el principal y ${getDeckTotalCount('side')} en el side deck.`;
    }

    function renderList() {
      if (!listEl) return;
      const result = listSavedDecks();

      if (!result.success) {
        listEl.innerHTML = '';
        if (emptyMsg) emptyMsg.style.display = 'none';
        if (errorMsg) {
          errorMsg.textContent = result.reason;
          errorMsg.style.display = 'block';
        }
        return;
      }

      if (errorMsg) errorMsg.style.display = 'none';
      if (emptyMsg) emptyMsg.style.display = result.decks.length === 0 ? 'block' : 'none';

      listEl.innerHTML = result.decks.map(deck => `
        <div class="saved-deck-row" data-deck-id="${escapeHtml(deck.id)}">
          <div class="saved-deck-info">
            <span class="saved-deck-name" title="${escapeHtml(deck.name)}">${escapeHtml(deck.name)}</span>
            <span class="saved-deck-meta">${countOf(deck.data.deck)} cartas &middot; Side ${countOf(deck.data.sideDeck)} &middot; ${escapeHtml(formatDate(deck.savedAt))}</span>
          </div>
          <button class="btn btn-primary btn-sm" data-action="load">Cargar</button>
          <button class="btn btn-danger btn-sm" data-action="delete">Eliminar</button>
        </div>
      `).join('');
    }

    function saveDeck() {
      let result = saveCurrentDeck(nameInput ? nameInput.value : '');
      if (!result.success && result.exists) {
        if (!confirm('Ya existe un mazo guardado con ese nombre. ¿Quieres sobrescribirlo?')) return;
        result = saveCurrentDeck(nameInput ? nameInput.value : '', { overwrite: true });
      }

      if (result.success) {
        playCardDrop();
        syncDeckNameInput();
        showToast(result.overwritten ? `Mazo «${state.deckName}» sobrescrito.` : `Mazo «${state.deckName}» guardado en este navegador.`, 'success');
        renderCurrentInfo();
        renderList();
      } else {
        showToast(result.reason, 'warning');
      }
    }

    function loadDeck(id, name) {
      const hasCards = state.deck.length > 0 || state.sideDeck.length > 0;
      if (hasCards && !isCurrentDeckSaved() &&
          !confirm(`El mazo actual no está guardado y se reemplazará por «${name}». ¿Quieres continuar?`)) {
        return;
      }

      const result = loadSavedDeck(id);
      if (result.success) {
        playCardDrop();
        syncDeckNameInput();
        const sideText = result.sideCount ? ` + ${result.sideCount} en el side deck` : '';
        showToast(`Mazo «${name}» cargado (${result.count} cartas${sideText}).`, 'success');
        closeModal();
      } else {
        showToast(result.reason || 'No se pudo cargar el mazo.', 'danger');
      }
    }

    function deleteDeck(id, name) {
      if (!confirm(`¿Eliminar el mazo guardado «${name}»? Esta acción no se puede deshacer.`)) return;
      const result = deleteSavedDeck(id);
      if (result.success) {
        showToast(`Mazo guardado «${name}» eliminado.`, 'info');
      } else {
        showToast(result.reason, 'warning');
      }
      renderList();
    }

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        playClick();
        if (nameInput) nameInput.value = state.deckName;
        renderCurrentInfo();
        renderList();
        modal?.classList.add('is-open');
        if (nameInput) {
          nameInput.focus();
          nameInput.select();
        }
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeFooterBtn) closeFooterBtn.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal?.classList.contains('is-open')) closeModal();
    });

    if (saveBtn) saveBtn.addEventListener('click', saveDeck);
    if (nameInput) {
      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveDeck();
      });
    }

    if (listEl) {
      listEl.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        const row = e.target.closest('.saved-deck-row');
        if (!btn || !row) return;

        const id = row.dataset.deckId;
        const listed = listSavedDecks();
        const entry = listed.success ? listed.decks.find(deck => deck.id === id) : null;
        if (!entry) {
          showToast('El mazo guardado ya no existe.', 'warning');
          renderList();
          return;
        }

        if (btn.dataset.action === 'load') loadDeck(id, entry.name);
        else if (btn.dataset.action === 'delete') deleteDeck(id, entry.name);
      });
    }
  }

  const POOL_DB_NAME = 'AetheriumTCG_CustomCardsDB';
  const POOL_STORE = 'pool_cards';
  const CONFIG_STORE = 'app_config';
  const CONFIG_KEY_HANDLE = 'cartasDirHandle';
  const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp)$/i;

  let poolDbInstance = null;

  function openDB() {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(POOL_DB_NAME, 3);
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
        request.onsuccess = (e) => { poolDbInstance = e.target.result; resolve(poolDbInstance); };
        request.onerror = () => reject(request.error || new Error('No se pudo abrir el almacenamiento local.'));
      } catch (err) {
        reject(err);
      }
    });
  }

  async function getDB() {
    return poolDbInstance || openDB();
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
  async function initPoolCards() {
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

  function isPoolUpdateSupported() {
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

  // Filename parsing reuses the TYPE_MAP / RARITY_MAP / ELEMENT_MAP / cleanCardName
  // already defined above for the custom card importer (same documented format).

  /**
   * Parses one image's relative path (e.g. "SET-1/Nombre_Tipo_Rareza_Faccion_ATK_DEF_Coste.webp")
   * into a pool card object. `catalogEntry`, when a matching row from catalogo-original.json
   * exists for this path, is used only to fill in `description`/`flavor` with the real card
   * text — it never overrides the type, rarity, element or stats the filename encodes, since
   * that format is the one documented in cartas/README.md and covered by the app's tests.
   */
  function parsePoolCardFromPath(relPath, dataUrl, catalogEntry) {
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
  async function checkForPoolUpdates(onProgress) {
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

  function initBanlistModal() {
    const modal = document.getElementById('modal-banlist');
    const openBtn = document.getElementById('btn-banlist');
    const closeBtn = document.getElementById('btn-close-banlist');
    const closeFooterBtn = document.getElementById('btn-close-banlist-footer');
    const searchInput = document.getElementById('banlist-search');
    const searchResults = document.getElementById('banlist-search-results');
    const activeList = document.getElementById('banlist-active-list');
    const emptyMsg = document.getElementById('banlist-empty-msg');

    const closeModal = () => modal?.classList.remove('is-open');

    function renderSearchResults(query) {
      if (!searchResults) return;
      const q = query.trim().toLowerCase();
      if (!q) { searchResults.innerHTML = ''; return; }

      const matches = CARDS_DATA
        .filter(c => c.type !== 'Token' && !c.isToken && c.name.toLowerCase().includes(q))
        .slice(0, 15);

      if (matches.length === 0) {
        searchResults.innerHTML = `<div class="banlist-no-results">No se encontraron cartas.</div>`;
        return;
      }

      searchResults.innerHTML = matches.map(card => {
        const base = defaultLimitFor(card);
        const current = getBanlistLimit(card.id);
        return `
          <div class="banlist-row" data-card-id="${escapeHtml(card.id)}">
            <span class="banlist-row-name" title="${escapeHtml(card.name)}">${escapeHtml(card.name)}</span>
            <span class="banlist-row-default">Límite base: ${base}</span>
            <input type="number" min="0" max="${state.maxDeckSize}" step="1" class="banlist-limit-input" value="${current !== undefined ? current : base}">
            <button class="btn btn-secondary btn-sm" data-action="apply">Aplicar</button>
            ${current !== undefined ? `<button class="btn btn-danger btn-sm" data-action="clear">Quitar</button>` : ''}
          </div>
        `;
      }).join('');
    }

    function renderActiveList() {
      if (!activeList) return;
      const entries = Object.entries(state.banlist);
      if (entries.length === 0) {
        activeList.innerHTML = '';
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
      }
      if (emptyMsg) emptyMsg.style.display = 'none';
      activeList.innerHTML = entries.map(([cardId, limit]) => {
        const card = CARDS_DATA.find(c => c.id === cardId);
        const name = card ? card.name : cardId;
        return `
          <div class="banlist-active-row" data-card-id="${escapeHtml(cardId)}">
            <span class="banlist-row-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
            <span class="banlist-row-limit">🚫 Límite: ${limit}</span>
            <button class="btn btn-danger btn-sm" data-action="clear">Quitar</button>
          </div>
        `;
      }).join('');
    }

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        playClick();
        if (searchInput) searchInput.value = '';
        renderSearchResults('');
        renderActiveList();
        modal?.classList.add('is-open');
        searchInput?.focus();
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeFooterBtn) closeFooterBtn.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal?.classList.contains('is-open')) closeModal();
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => renderSearchResults(e.target.value));
    }

    function handleRowAction(container, rowSelector) {
      container.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const row = e.target.closest(rowSelector);
        if (!row) return;
        const cardId = row.dataset.cardId;
        const card = CARDS_DATA.find(c => c.id === cardId);
        const cardName = card ? card.name : cardId;

        if (btn.dataset.action === 'apply') {
          const input = row.querySelector('.banlist-limit-input');
          const res = setBanlistLimit(cardId, input ? input.value : NaN);
          if (res.success) {
            showToast(`Límite de banlist actualizado para ${cardName}`, 'success');
          } else {
            showToast(res.reason, 'warning');
          }
        } else if (btn.dataset.action === 'clear') {
          clearBanlistLimit(cardId);
          showToast(`Restricción eliminada para ${cardName}`, 'info');
        }

        renderSearchResults(searchInput ? searchInput.value : '');
        renderActiveList();
      });
    }

    if (searchResults) handleRowAction(searchResults, '.banlist-row');
    if (activeList) handleRowAction(activeList, '.banlist-active-row');

    subscribeToBanlist(() => {
      if (modal?.classList.contains('is-open')) {
        renderSearchResults(searchInput ? searchInput.value : '');
        renderActiveList();
      }
    });
  }

  // ==========================================================================
  // INITIALIZATION ON DOM READY
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', async () => {
  initCardInspector();
    // 1. Initialize IndexedDB and load saved custom cards
    await initIndexedDB();

    // 1b. Load whatever base pool (cartas/SET-N) was already scanned in a previous visit
    await initPoolCards();

    // 2. Load Active Deck State
    loadInitialState();

    // 3. Initialize UI Subsystems
    initDeckView();
    initFilters();
    initDragAndDrop();
    initTestHandModal();
    initSoundButton();
    initAudioFiles(); // música y efectos de snd/ (no bloquea el arranque)
    initClearDeckButton();
    initExportImportModal();
    initCardImporterModal();
    initBanlistModal();
    initSavedDecksModal();
    initPoolUpdatesButton();

    // 4. Bind Subscriptions
    subscribeToDeck(() => {
      renderDeck();
      renderLibrary();
    });

    subscribeToFilters(() => {
      renderLibrary();
    });

    subscribeToBanlist(() => {
      renderDeck();
      renderLibrary();
    });

    // 5. Initial Render
    renderLibrary();
    renderDeck();
  });

})();
