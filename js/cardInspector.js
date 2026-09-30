/**
 * 3D HOLOGRAPHIC TILT & FULL-CARD RENDERING / INSPECTOR
 */

import { getCardById, ELEMENTS, escapeHtml, renderElementIcon } from './cardsData.js';
import { state, addCardToDeck, removeCardFromDeck, canAddCardToDeck, getCardCountInDeck, getCombinedCardCount, getMaxAllowedCopies, getDeckTotalCount, getActiveExtraDeckTokens, getBanlistLimit, isCardBanlisted } from './state.js';
import { playClick, playCardDrop, playCardRemove } from './sound.js';

// Ids of the cards in whichever list (Mazo Principal / Side / Extra / Colección)
// the inspector was opened from, in the same order they're shown there — used
// so the nav arrows know what "previous"/"next" means. Main/Side/Extra are
// recomputed live from state every render; Colección's filtered+sorted list is
// supplied by the caller (filterManager.js) as `contextIds`, since it depends
// on the active search/filter/sort — passed forward unchanged across
// toggle/add/remove/nav re-renders of the same inspector session.
function getContextCardIds(context, providedIds) {
  switch (context) {
    case 'main': return state.deck.map(item => item.cardId);
    case 'side': return state.sideDeck.map(item => item.cardId);
    case 'extra': return getActiveExtraDeckTokens().map(token => token.id);
    default: return Array.isArray(providedIds) ? providedIds : [];
  }
}

/**
 * Generate standard HTML for a Full TCG Card
 */
export function createCardElement(card, options = {}) {
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

  // Full-bleed Card Graphic (100% of card)
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
      
      <!-- Full Card Graphic -->
      ${cardGraphic}

      <!-- Holographic Foil Overlay -->
      <div class="card-foil-sheen"></div>

      <!-- Dynamic HUD Badges / Overlays -->
      ${inDeckBadgeHtml}
      ${banlistBadgeHtml}
      ${deckQtyBadgeHtml}
      
      <!-- Mulligan Tag if in test hand -->
      ${isHandItem ? '<div class="mulligan-tag">DESCARTAR</div>' : ''}
    </div>
  `;

  // Attach 3D Tilt Event Handlers
  attach3DTiltEffect(wrapper);

  return wrapper;
}

/**
 * 3D Perspective Tilt on Mouse Movement
 */
export function attach3DTiltEffect(wrapper) {
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

/**
 * Open Card Inspector Modal (Full 3D HD View, enlarged)
 */
export function openCardInspector(cardId, options = {}) {
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

  // Which deck the Add/Remove buttons act on. Toggling to Side always targets
  // Side directly; the default (Main) keeps the existing "Main full -> add to
  // Side instead" fallback used elsewhere in the app.
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
      <!-- Full Card injected below -->
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

  // Inject Full 3D Card (enlarged)
  const cardElem = createCardElement(card, { draggable: false });
  const cardContainer = content.querySelector('#inspector-card-container');
  cardContainer.insertBefore(cardElem, cardContainer.firstChild);

  // Clicking the card opens an even bigger, fullscreen zoom view
  const inspectFace = cardElem.querySelector('.tcg-card');
  if (inspectFace) {
    inspectFace.classList.add('is-zoomable');
    inspectFace.addEventListener('click', (e) => {
      e.stopPropagation();
      openCardFullscreen(card);
    });
  }

  // Bind Main/Side Target Toggle
  content.querySelectorAll('.target-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.target === target) return;
      playClick();
      openCardInspector(card.id, { target: btn.dataset.target, context, contextIds: providedContextIds });
    });
  });

  // Bind Add Button
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

  // Bind Remove Button
  const removeBtn = content.querySelector('#btn-inspector-remove');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      removeCardFromDeck(card.id, false, target);
      playCardRemove();
      openCardInspector(card.id, { target, context, contextIds: providedContextIds });
    });
  }

  // Bind Prev/Next Navigation (these buttons live outside #inspector-content,
  // so they aren't recreated by the innerHTML above — rebind with .onclick,
  // which replaces any previous handler instead of stacking a new one).
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

export function closeCardInspector() {
  const modal = document.getElementById('modal-card-inspector');
  if (modal) { modal.classList.remove('is-open'); modal.returnFocus?.focus(); }
}

/**
 * Fullscreen zoom view of a single card (occupies the whole viewport),
 * reached by clicking the card inside the inspector.
 */
export function openCardFullscreen(card) {
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

export function closeCardFullscreen() {
  const modal = document.getElementById('modal-card-fullscreen');
  if (modal) { modal.classList.remove('is-open'); modal.returnFocus?.focus(); }
}

export function initCardInspector() {
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
