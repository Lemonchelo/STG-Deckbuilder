/**
 * DECK VIEW MANAGER
 * Renders Main Deck, Side Deck (shares copy limits with Main Deck), composition stats,
 * and Automated Extra Deck (Tokens).
 */

import { state, removeCardFromDeck, getDeckTotalCount, setDeckName, getActiveExtraDeckTokens } from './state.js';
import { getCardById, ELEMENTS, renderElementIcon } from './cardsData.js';
import { createCardElement, openCardInspector } from './cardInspector.js';
import { renderManaCurve } from './manaCurve.js';
import { playCardRemove, playCardRemoveSfx } from './sound.js';

export function initDeckView() {
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

  // Event Delegation on Extra Deck (Tokens - View only, click opens inspector)
  if (extraDeckGrid) {
    extraDeckGrid.addEventListener('click', (e) => {
      const cardWrapper = e.target.closest('.tcg-card-wrapper');
      if (cardWrapper && cardWrapper.dataset.cardId) {
        openCardInspector(cardWrapper.dataset.cardId, { context: 'extra' });
      }
    });
  }
}

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

export function renderDeck() {
  const deckGrid = document.getElementById('deck-grid');
  const emptyState = document.getElementById('deck-empty-state');
  const totalCountElem = document.getElementById('deck-total-count');
  const statusBadge = document.getElementById('deck-status-badge');
  const countPill = document.getElementById('deck-count-pill');

  if (!deckGrid) return;

  const totalCount = getDeckTotalCount('main');

  // 1. Update Navbar Count and Legality Status
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

  // 2. Render Main Deck Grid
  renderDeckGrid(deckGrid, state.deck, emptyState);

  // 3. Render Side Deck
  renderSideDeck();

  // 4. Render Automated Extra Deck (Tokens)
  const extraDeckGrid = document.getElementById('extra-deck-grid');
  const extraEmptyState = document.getElementById('extra-empty-state');
  const extraCountElem = document.getElementById('extra-tokens-count');
  const activeTokens = getActiveExtraDeckTokens();
  if (extraCountElem) extraCountElem.textContent = activeTokens.length;

  if (extraDeckGrid) {
    if (activeTokens.length === 0) {
      extraDeckGrid.innerHTML = '';
      if (extraEmptyState) extraEmptyState.style.display = 'flex';
    } else {
      if (extraEmptyState) extraEmptyState.style.display = 'none';
      extraDeckGrid.innerHTML = '';

      activeTokens.forEach(token => {
        const tokenElem = createCardElement(token, {
          isDeckItem: false,
          draggable: false
        });
        extraDeckGrid.appendChild(tokenElem);
      });
    }
  }

  // 5. Update Composition Breakdown
  updateDeckComposition();

  // 6. Update Mana Curve Chart
  renderManaCurve();

  // 7. Resize the cards so every deck stays visible without scrolling
  fitDeckLayout();
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

  if (!sideDeckGrid) return;
  renderDeckGrid(sideDeckGrid, state.sideDeck, sideEmptyState);
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

function updateDeckComposition() {
  const creaturesPill = document.getElementById('pill-creatures');
  const fastSpellsPill = document.getElementById('pill-fast-spells');
  const slowSpellsPill = document.getElementById('pill-slow-spells');
  const structuresPill = document.getElementById('pill-structures');
  const artifactsPill = document.getElementById('pill-artifacts');
  const sellosPill = document.getElementById('pill-sellos');
  const terrainsPill = document.getElementById('pill-terrains');
  const elementDotsContainer = document.getElementById('element-distribution-dots');

  let typeCounts = {
    Criatura: 0,
    HechizoRapido: 0,
    HechizoLento: 0,
    Estructura: 0,
    Artefacto: 0,
    Sello: 0,
    Terreno: 0
  };

  let elementCounts = {
    marte: 0, neptuno: 0, jupiter: 0, tierra: 0, saturno: 0, mercurio: 0, pluton: 0, neutral: 0
  };

  state.deck.forEach(item => {
    const card = getCardById(item.cardId);
    if (!card) return;
    if (typeCounts[card.type] !== undefined) typeCounts[card.type] += item.count;
    if (elementCounts[card.element] !== undefined) elementCounts[card.element] += item.count;
  });

  if (creaturesPill) creaturesPill.textContent = `Criaturas: ${typeCounts.Criatura}`;
  if (fastSpellsPill) fastSpellsPill.textContent = `H. Rápido: ${typeCounts.HechizoRapido}`;
  if (slowSpellsPill) slowSpellsPill.textContent = `H. Lento: ${typeCounts.HechizoLento}`;
  if (structuresPill) structuresPill.textContent = `Estructuras: ${typeCounts.Estructura}`;
  if (artifactsPill) artifactsPill.textContent = `Artefactos: ${typeCounts.Artefacto}`;
  if (sellosPill) sellosPill.textContent = `Sellos: ${typeCounts.Sello}`;
  if (terrainsPill) terrainsPill.textContent = `Terrenos: ${typeCounts.Terreno}`;

  if (elementDotsContainer) {
    elementDotsContainer.innerHTML = '';
    for (const [elemKey, count] of Object.entries(elementCounts)) {
      if (count > 0 && elemKey !== 'neutral') {
        const info = ELEMENTS[elemKey];
        const dotDiv = document.createElement('div');
        dotDiv.className = 'elem-dot-item';
        dotDiv.title = `${info ? info.name : elemKey}: ${count} cartas en el mazo`;
        dotDiv.innerHTML = `
          ${renderElementIcon(elemKey)}
          <span>${count}</span>
        `;
        elementDotsContainer.appendChild(dotDiv);
      }
    }
  }
}
