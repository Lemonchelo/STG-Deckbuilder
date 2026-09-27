/**
 * REACTIVE STATE MANAGER & PERSISTENCE
 * Dynamic Rarity Limits: Common (4), Rare (3), Epic (2), Legendary (1).
 * Sellos: No rarity and unlimited copies (up to deck size of 40).
 * Automated Extra Deck (Tokens linked to active factions).
 * Side Deck: 15 cards that share the per-card copy limit with the Main Deck.
 * Banlist: persistent per-card copy limit override (replaces the rarity default).
 */

import { CARDS_DATA, getCardById } from './cardsData.js';

const STORAGE_KEY = 'aetherium_tcg_active_deck';
const STORAGE_KEY_BANLIST = 'aetherium_tcg_banlist';

export const RARITY_LIMITS = {
  Common: 4,
  Rare: 3,
  Epic: 2,
  Legendary: 1
};

export const state = {
  deckName: 'Mi Mazo de Batalla',
  deck: [], // Array of { cardId: string, count: number } — Main Deck
  sideDeck: [], // Array of { cardId: string, count: number } — Side Deck (shares copy limits with Main Deck)
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

export function subscribeToDeck(callback) {
  listeners.deck.push(callback);
}

export function subscribeToFilters(callback) {
  listeners.filters.push(callback);
}

export function subscribeToBanlist(callback) {
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
  // Tokens cannot be in the main or side deck, and cards must exist in CARDS_DATA
  return !!(item && Number.isSafeInteger(item.count) && item.count > 0 && card && card.type !== 'Token' && !card.isToken);
}

export function loadInitialState() {
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
      preloadStarterDeck();
    }
  } catch (err) {
    preloadStarterDeck();
  }
}

function preloadStarterDeck() {
  state.deck = [];
  state.sideDeck = [];
}

// Deck Query Helpers
export function getDeckTotalCount(target = 'main') {
  return deckArrayFor(target).reduce((sum, item) => sum + item.count, 0);
}

export function getCardCountInDeck(cardId, target = 'main') {
  const found = deckArrayFor(target).find(item => item.cardId === cardId);
  return found ? found.count : 0;
}

/**
 * Combined copies of a card across Main Deck + Side Deck.
 * The per-card copy limit (rarity-based or banlist override) is shared between both.
 */
export function getCombinedCardCount(cardId) {
  return getCardCountInDeck(cardId, 'main') + getCardCountInDeck(cardId, 'side');
}

// ==================== BANLIST ====================

export function getBanlistLimit(cardId) {
  return state.banlist[cardId];
}

export function isCardBanlisted(cardId) {
  return state.banlist[cardId] !== undefined;
}

export function getBanlistEntries() {
  return { ...state.banlist };
}

/**
 * Sets a persistent custom copy limit for a card, overriding its rarity-based limit.
 * 0 effectively bans the card. Applies across Main Deck + Side Deck.
 */
export function setBanlistLimit(cardId, limit) {
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

export function clearBanlistLimit(cardId) {
  if (state.banlist[cardId] === undefined) return;
  delete state.banlist[cardId];
  saveBanlistToLocalStorage();
  notifyBanlistChanged();
}

/**
 * Dynamic Limit by Rarity, overridden by a Banlist entry if present:
 * Common -> 4
 * Rare -> 3
 * Epic -> 2
 * Legendary -> 1
 * Sello -> No limit (up to 40)
 * Token -> 0 (not allowed in Main/Side Deck)
 */
export function getMaxAllowedCopies(cardId) {
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

export function canAddCardToDeck(cardId, target = 'main') {
  const card = getCardById(cardId);
  if (!card) return { allowed: false, reason: 'Carta no encontrada' };

  // Tokens cannot be manually added to the main or side deck
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

// Deck Action Mutators
export function addCardToDeck(cardId, target = 'main') {
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

export function removeCardFromDeck(cardId, removeAll = false, target = 'main') {
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

/**
 * Moves a single copy of a card from one deck to the other (Main <-> Side),
 * one copy at a time for comfort when adjusting the split. The combined copy
 * count across Main + Side stays the same, so the per-card rarity/banlist
 * limit is never affected by a move — only the destination deck's own size
 * limit (40 for Main, 15 for Side) can block it.
 */
export function moveCardBetweenDecks(cardId, fromTarget) {
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

export function reorderDeck(fromIndex, toIndex, target = 'main') {
  const deckArr = deckArrayFor(target);
  if (fromIndex < 0 || fromIndex >= deckArr.length || toIndex < 0 || toIndex >= deckArr.length) return;
  const [movedItem] = deckArr.splice(fromIndex, 1);
  deckArr.splice(toIndex, 0, movedItem);
  notifyDeckChanged();
}

export function clearDeck() {
  state.deck = [];
  state.sideDeck = [];
  notifyDeckChanged();
}

export function setDeckName(name) {
  state.deckName = name.trim() || 'Mi Mazo de Batalla';
  saveToLocalStorage();
}

// ==================== EXTRA DECK & AUTOMATED TOKENS ====================

/**
 * Returns a Set of planet/faction keys currently present in the main deck
 */
/** Active factions across Main Deck + Side Deck: both feed the automatic Extra Deck (Tokens). */
export function getActiveFactionsInDeck() {
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

/**
 * Automatically computes the Extra Deck (Tokens) based on active factions in
 * Main Deck + Side Deck combined
 */
export function getActiveExtraDeckTokens() {
  const activeFactions = getActiveFactionsInDeck();
  if (activeFactions.size === 0) return [];

  return CARDS_DATA.filter(card => {
    return (card.type === 'Token' || card.isToken) && activeFactions.has(card.element.toLowerCase());
  });
}

// Filter Action Mutators
export function setFilter(key, value) {
  state.filters[key] = value;
  notifyFiltersChanged();
}

export function resetFilters() {
  state.filters.search = '';
  state.filters.element = 'all';
  state.filters.type = 'all';
  state.filters.rarity = 'all';
  state.filters.maxMana = 10;
  state.filters.sort = 'cost-asc';
  notifyFiltersChanged();
}

// ==================== EXPORT & IMPORT UTILITIES ====================

export function exportDeckToText() {
  const total = getDeckTotalCount('main');
  const sideTotal = getDeckTotalCount('side');
  const extraTokens = getActiveExtraDeckTokens();
  let text = `// Deck: ${state.deckName}\n`;
  text += `// Main Deck (${total}/${state.maxDeckSize} cartas):\n`;

  state.deck.forEach(item => {
    const card = getCardById(item.cardId);
    if (card) {
      const typeStr = card.type === 'Sello' ? '[Sello]' : `[${card.rarity || 'Sin Rareza'}]`;
      text += `${item.count}x ${card.name} ${typeStr} (${card.element.toUpperCase()})\n`;
    }
  });

  if (state.sideDeck.length > 0) {
    text += `\n// Side Deck (${sideTotal}/${state.maxSideDeckSize} cartas):\n`;
    state.sideDeck.forEach(item => {
      const card = getCardById(item.cardId);
      if (card) {
        const typeStr = card.type === 'Sello' ? '[Sello]' : `[${card.rarity || 'Sin Rareza'}]`;
        text += `${item.count}x ${card.name} ${typeStr} (${card.element.toUpperCase()})\n`;
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

// ── Official site format (export/import) ─────────────────────────────────────
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

export function exportDeckToOfficialFormat() {
  let text = 'Mazo principal\n\n' + buildOfficialSection(state.deck);
  if (state.sideDeck.length > 0) {
    text += '\n\nSidedeck\n\n' + buildOfficialSection(state.sideDeck);
  }
  return text;
}

export function importDeckFromOfficialFormat(textString) {
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
export const MAX_SAVED_DECK_NAME = 32;

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

export function listSavedDecks() {
  const result = readSavedDecks();
  if (result.error) return { success: false, reason: result.error };
  return { success: true, decks: [...result.decks].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)) };
}

export function saveCurrentDeck(rawName, { overwrite = false } = {}) {
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

export function deleteSavedDeck(id) {
  const current = readSavedDecks();
  if (current.error) return { success: false, reason: current.error };
  const next = current.decks.filter(entry => entry.id !== id);
  if (next.length === current.decks.length) return { success: false, reason: 'El mazo guardado ya no existe.' };
  return writeSavedDecks(next);
}

export function loadSavedDeck(id) {
  const current = readSavedDecks();
  if (current.error) return { success: false, reason: current.error };
  const entry = current.decks.find(item => item.id === id);
  if (!entry) return { success: false, reason: 'El mazo guardado ya no existe.' };
  const result = importDeckFromJSON(JSON.stringify(entry.data));
  return result.success ? { ...result, name: entry.name } : result;
}

/** True when the current deck (main + side) is identical to one of the saved decks. */
export function isCurrentDeckSaved() {
  const current = readSavedDecks();
  if (current.error) return false;
  const signature = deckSignature(state.deck, state.sideDeck);
  return current.decks.some(entry => deckSignature(entry.data.deck, entry.data.sideDeck) === signature);
}

export function exportDeckToJSON() {
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

export function importDeckFromJSON(jsonString) {
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

    const mainTotal = [...mainCounts.values()].reduce((a, b) => a + b, 0);
    const sideTotal = [...sideCounts.values()].reduce((a, b) => a + b, 0);
    if (mainTotal > state.maxDeckSize) throw new Error(`El mazo principal no puede superar las ${state.maxDeckSize} cartas.`);
    if (sideTotal > state.maxSideDeckSize) throw new Error(`El side deck no puede superar las ${state.maxSideDeckSize} cartas.`);
    if (data.deckName !== undefined && typeof data.deckName !== 'string') throw new Error('Nombre de mazo inválido.');

    state.deck = [...mainCounts].map(([cardId, count]) => ({ cardId, count }));
    state.sideDeck = [...sideCounts].map(([cardId, count]) => ({ cardId, count }));
    if (data.deckName !== undefined) state.deckName = data.deckName.trim().slice(0, 32) || 'Mi Mazo de Batalla';
    notifyDeckChanged();
    return { success: true, count: mainTotal, sideCount: sideTotal };
  } catch (err) {
    return { success: false, error: err.message, reason: err.message };
  }
}

export function importDeckFromText(textString) {
  try {
    const data = { deck: [], sideDeck: [] };
    let section = 'main'; // 'main' | 'side' | 'extra'
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
      const entry = { name, cardId: name, count: Number(match[1]) };
      if (section === 'side') data.sideDeck.push(entry);
      else data.deck.push(entry);
    }
    if (!data.deck.length && !data.sideDeck.length) throw new Error('No se encontraron cartas en el texto.');
    return importDeckFromJSON(JSON.stringify(data));
  } catch (err) {
    return { success: false, error: err.message, reason: err.message };
  }
}

export function setCardScale(scale) {
  state.filters.cardScale = Math.max(0.75, Math.min(1.35, scale));
  saveToLocalStorage();
}
