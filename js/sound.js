/**
 * AUDIO SYNTHESIZER (Web Audio API)
 * Procedural sound effects for card pickup, card placement, delete, and UI interactions.
 */

let audioCtx = null;
let soundEnabled = true;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isSoundEnabled() {
  return soundEnabled;
}

export function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem('aetherium_sound_enabled', JSON.stringify(soundEnabled));
  if (soundEnabled) startMusic(); else pauseMusic();
  return soundEnabled;
}

export function initSoundState() {
  const saved = localStorage.getItem('aetherium_sound_enabled');
  if (saved !== null) {
    try {
      soundEnabled = JSON.parse(saved);
    } catch {
      soundEnabled = true;
    }
  }
  return soundEnabled;
}

// 1. Play Card Pickup Sound (Light Air Whoosh)
export function playCardPickup() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(280, now);
  osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.08);
}

// 2. Play Card Drop Sound (Card Placement Chime / Thud)
export function playCardDrop() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Primary crystal chime
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(440, now);
  osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);

  gain1.gain.setValueAtTime(0.12, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.15);

  // Soft low thud
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(140, now);
  osc2.frequency.exponentialRampToValueAtTime(60, now + 0.1);

  gain2.gain.setValueAtTime(0.15, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now);
  osc2.stop(now + 0.1);
}

// 3. Play Card Remove / Trash Sound (Swoosh Down)
export function playCardRemove() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.14);

  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.14);
}

// 4. Play Generic Click / Button Sound
export function playClick() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.03);

  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.03);
}

// 5. Play Shuffle / Mulligan Sound
export function playShuffle() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  for (let i = 0; i < 4; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = now + (i * 0.04);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350 + (i * 120), startTime);
    osc.frequency.exponentialRampToValueAtTime(600 + (i * 80), startTime + 0.04);

    gain.gain.setValueAtTime(0.06, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.04);
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
export async function initAudioFiles() {
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
export function playCardAddSfx() {
  if (!soundEnabled) return;
  if (!playSfxFile()) playCardDrop();
}

export function playCardRemoveSfx() {
  if (!soundEnabled) return;
  if (!playSfxFile()) playCardRemove();
}
