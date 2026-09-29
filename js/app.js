import { escapeHtml } from './cardsData.js';
/**
 * AETHERIUM TCG DECKBUILDER - APPLICATION BOOTSTRAP
 */

import { state, loadInitialState, subscribeToDeck, subscribeToFilters, subscribeToBanlist, clearDeck, exportDeckToText, exportDeckToJSON, exportDeckToOfficialFormat, importDeckFromText, importDeckFromJSON, importDeckFromOfficialFormat } from './state.js';
import { initCardInspector } from './cardInspector.js';
import { initDeckView, renderDeck } from './deckManager.js';
import { initFilters, renderLibrary } from './filterManager.js';
import { initDragAndDrop } from './dragAndDrop.js';
import { initTestHandModal } from './testHand.js';
import { initSoundState, initAudioFiles, getBgmVolume, getSfxVolume, setBgmVolume, setSfxVolume, playClick, playCardDrop, playCardRemove, playCardAddSfx } from './sound.js';
import { initIndexedDB, processImageFiles, clearCustomCardsDB } from './customCardImporter.js';
import { initBanlistModal } from './banlistManager.js';
import { initSavedDecksModal } from './savedDecksManager.js';
import { initPoolCards, checkForPoolUpdates } from './poolManager.js';

// ==================== TOAST NOTIFICATIONS ====================
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '✨',
    warning: '⚠️',
    danger: '🛑',
    info: 'ℹ️'
  };

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

// ==================== VOLUMEN (MÚSICA / EFECTOS) ====================
function initVolumeControl() {
  const root = document.getElementById('volume-control');
  const btn = document.getElementById('btn-volume');
  const panel = document.getElementById('volume-panel');
  const icon = document.getElementById('volume-icon');
  if (!root || !btn || !panel) return;

  initSoundState();

  const sliders = [
    { input: document.getElementById('volume-bgm'), output: document.getElementById('volume-bgm-value'), get: getBgmVolume, set: setBgmVolume, preview: false },
    { input: document.getElementById('volume-sfx'), output: document.getElementById('volume-sfx-value'), get: getSfxVolume, set: setSfxVolume, preview: true }
  ];

  const updateIcon = () => {
    if (icon) icon.textContent = getBgmVolume() === 0 && getSfxVolume() === 0 ? '🔇' : '🔊';
  };

  const paint = (s) => {
    const pct = Math.round(s.get() * 100);
    s.input.value = pct;
    s.input.style.setProperty('--fill', pct + '%');
    if (s.output) s.output.textContent = pct + '%';
  };

  for (const s of sliders) {
    if (!s.input) continue;
    paint(s);
    s.input.addEventListener('input', () => {
      s.set(Number(s.input.value) / 100);
      paint(s);
      updateIcon();
    });
    // Al soltar el slider de efectos suena uno de muestra para juzgar el nivel.
    if (s.preview) s.input.addEventListener('change', () => playCardAddSfx());
  }
  updateIcon();

  const setOpen = (open) => {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  };
  btn.addEventListener('click', () => setOpen(panel.hidden));
  document.addEventListener('pointerdown', (e) => {
    if (!panel.hidden && !root.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      setOpen(false);
      btn.focus();
    }
  });
}

// ==================== CLEAR DECK MODAL / CONFIRM ====================
// ==================== BASE POOL UPDATES (cartas/SET-N) ====================
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
          // The user closed the folder picker: not an error, nothing to report
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

// ==================== EXPORT / IMPORT MODAL ====================
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

  // Tab Switching
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

  // Open Modal & Populate current deck representations
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      playClick();
      if (textArea) textArea.value = exportDeckToText();
      if (jsonArea) jsonArea.value = exportDeckToJSON();
      if (officialArea) officialArea.value = exportDeckToOfficialFormat();
      if (modal) modal.classList.add('is-open');
    });
  }

  // Close Modal
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('is-open'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('is-open');
    });
  }

  // Copy to Clipboard
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
        showToast('No se pudo copiar automáticamente. Por favor selecciona y copia manualmente.', 'warning');
      }
    });
  }

  // Import / Load Deck from Text/JSON/Official Format
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      playClick();
      let res;
      if (currentTab === 'tab-text-deck') {
        const text = textArea ? textArea.value : '';
        res = importDeckFromText(text);
      } else if (currentTab === 'tab-json-deck') {
        const json = jsonArea ? jsonArea.value : '';
        res = importDeckFromJSON(json);
      } else {
        const official = officialArea ? officialArea.value : '';
        res = importDeckFromOfficialFormat(official);
      }

      if (res.success) {
        document.getElementById('deck-name-input').value = state.deckName;
        showToast(`¡Mazo cargado exitosamente (${res.count} cartas)!`, 'success');
        if (modal) modal.classList.remove('is-open');
      } else {
        showToast(res.reason || 'Error al importar el mazo.', 'danger');
      }
    });
  }
}

// ==================== CUSTOM CARD / FOLDER IMPORTER MODAL ====================
function initCardImportModal() {
  const modal = document.getElementById('modal-import-images');
  const openBtn = document.getElementById('btn-import-folder');
  const closeBtn = document.getElementById('btn-close-import-images');
  const confirmCloseBtn = document.getElementById('btn-confirm-import-close');

  const folderInput = document.getElementById('input-import-folder');
  const filesInput = document.getElementById('input-import-files');
  const selectFolderBtn = document.getElementById('btn-select-folder');
  const selectFilesBtn = document.getElementById('btn-select-files');
  const dropArea = document.getElementById('import-drop-area');

  const progressBox = document.getElementById('import-progress-box');
  const progressFill = document.getElementById('import-progress-fill');
  const progressText = document.getElementById('import-progress-text');
  const resultsSummary = document.getElementById('import-results-summary');
  const cardsPreview = document.getElementById('import-cards-preview');
  const clearCustomBtn = document.getElementById('btn-clear-custom-cards');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      playClick();
      if (modal) modal.classList.add('is-open');
    });
  }

  const closeModal = () => {
    if (modal) modal.classList.remove('is-open');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (confirmCloseBtn) confirmCloseBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Trigger File Dialogs
  if (selectFolderBtn && folderInput) {
    selectFolderBtn.addEventListener('click', () => folderInput.click());
  }

  if (selectFilesBtn && filesInput) {
    selectFilesBtn.addEventListener('click', () => filesInput.click());
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

    const imported = await processImageFiles(files, (current, total, card) => {
      const pct = Math.round((current / total) * 100);
      if (progressFill) progressFill.style.width = `${pct}%`;
      if (progressText) progressText.textContent = `Procesando: ${current}/${total} (${escapeHtml(card.name)})`;
    });

    if (progressBox) progressBox.style.display = 'none';

    if (imported.length > 0) {
      playCardDrop();
      showToast(`¡Se importaron ${imported.length} cartas al catálogo!`, 'success');

      if (resultsSummary && cardsPreview) {
        resultsSummary.style.display = 'block';
        cardsPreview.innerHTML = '';
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

  if (folderInput) {
    folderInput.addEventListener('change', (e) => handleFiles(e.target.files));
  }

  if (filesInput) {
    filesInput.addEventListener('change', (e) => handleFiles(e.target.files));
  }

  // Drag & Drop on Modal Drop Area
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

  // Clear Custom Cards Button
  if (clearCustomBtn) {
    clearCustomBtn.addEventListener('click', async () => {
      if (confirm('¿Deseas eliminar todas las cartas personalizadas importadas?')) {
        await clearCustomCardsDB();
        showToast('Cartas personalizadas eliminadas. Recargando catálogo...', 'info');
        setTimeout(() => location.reload(), 600);
      }
    });
  }
}

// ==================== APP INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
  initCardInspector();
  // 1. Initialize IndexedDB for custom card persistence
  await initIndexedDB();

  // 1b. Load whatever base pool (cartas/SET-N) was already scanned in a previous visit
  await initPoolCards();

  // 2. Load Stored Data
  loadInitialState();

  // 3. Initialize Views and Controllers
  initVolumeControl();
  initAudioFiles(); // música y efectos de snd/ (no bloquea el arranque)
  initDeckView();
  initFilters();
  initDragAndDrop();
  initTestHandModal();
  initExportImportModal();
  initCardImportModal();
  initClearDeckButton();
  initBanlistModal();
  initSavedDecksModal();
  initPoolUpdatesButton();

  // 4. Subscribe to reactive state
  subscribeToDeck(() => {
    renderDeck();
    renderLibrary(); // update in-deck counters on library cards
  });

  subscribeToFilters(() => {
    renderLibrary();
  });

  subscribeToBanlist(() => {
    renderDeck();
    renderLibrary();
  });

  // 5. Initial Render
  renderDeck();
  renderLibrary();
});
