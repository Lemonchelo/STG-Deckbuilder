// Prueba de la música de fondo (snd/bgm), los efectos (snd/sfx) y los volúmenes (bgm/sfx)
// con Audio, fetch, localStorage y document simulados.
// Se ejecuta contra el bundle y contra el módulo js/sound.js. Uso: node tests/audio.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const bundle = fs.readFileSync(path.join(root, 'js/bundle.js'), 'utf8');
const soundModule = fs.readFileSync(path.join(root, 'js/sound.js'), 'utf8').replace(/^export /gm, '');

const API = `;globalThis.__audio = { initAudioFiles, playCardAddSfx, playCardRemoveSfx, playClick,
  initSoundState, getBgmVolume, getSfxVolume, setBgmVolume, setSfxVolume,
  bgm: () => bgmAudio, sfx: () => sfxPlayable.slice() };`;

// files: url -> 'ok' | 'error' | 'hang'; manifest: objeto, o null para simular file:// (fetch falla)
function makeEnv({ manifest, files = {}, autoplayBlocked = false, storage = {} }) {
  const env = { created: [], oscillators: 0, gains: [], gestureGiven: !autoplayBlocked, listeners: {}, fetched: [] };
  class FakeAudio {
    constructor(src) {
      this.handlers = {}; this.loop = false; this.volume = 1; this.paused = true; this.playCalls = 0;
      env.created.push(this);
      if (src !== undefined) this.src = src;
    }
    addEventListener(name, fn) { (this.handlers[name] ||= []).push(fn); }
    set src(url) {
      this._src = url;
      const result = files[url] || 'error';
      if (result === 'hang') return;
      Promise.resolve().then(() => (this.handlers[result === 'ok' ? 'loadedmetadata' : 'error'] || []).forEach(fn => fn()));
    }
    get src() { return this._src; }
    play() {
      this.playCalls++;
      if (!env.gestureGiven) return Promise.reject(new Error('NotAllowedError'));
      this.paused = false;
      return Promise.resolve();
    }
    pause() { this.paused = true; }
  }
  function makeGainNode() {
    const node = { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connected: null };
    node.connect = (dest) => { node.connected = dest; };
    return node;
  }
  const ctx = vm.createContext({
    console, Math, Promise, JSON, Array, Object, Number, encodeURIComponent, Audio: FakeAudio,
    setTimeout: (fn, ms) => setTimeout(fn, ms > 1000 ? 20 : ms), clearTimeout,
    fetch: async (p) => {
      env.fetched.push(p);
      if (manifest === null) throw new TypeError('Failed to fetch');
      return { ok: true, json: async () => manifest };
    },
    document: {
      addEventListener(n, fn) { (env.listeners[n] ||= new Set()).add(fn); },
      removeEventListener(n, fn) { env.listeners[n] && env.listeners[n].delete(fn); },
    },
    window: {
      AudioContext: class {
        constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; }
        createOscillator() { env.oscillators++; return { type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
        createGain() { const g = makeGainNode(); env.gains.push(g); return g; }
      },
    },
    localStorage: { getItem: (k) => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); } },
  });
  env.ctx = ctx; env.storage = storage;
  return env;
}

function load(source, env) {
  const code = source.includes('(function()') ? source.replace(/\}\)\(\);\s*$/, API + '})();') : source + '\n' + API;
  vm.runInContext(code, env.ctx);
  return env.ctx.__audio;
}

const tick = () => new Promise(r => setTimeout(r, 60));
const fireGesture = (env) => { env.gestureGiven = true; [...(env.listeners.pointerdown || [])].forEach(fn => fn()); };

async function check(label, source) {
  // 1. Sin manifest (file:// o sin snd/): no falla, no hay música y los efectos usan el sonido sintetizado
  {
    const env = makeEnv({ manifest: null });
    const a = load(source, env);
    a.initSoundState();
    await a.initAudioFiles();
    assert.equal(a.bgm(), null);
    a.playCardAddSfx(); a.playCardRemoveSfx();
    assert(env.oscillators > 0, 'sin archivos debe sonar el efecto sintetizado');
    assert.equal(env.created.length, 0);
  }
  // 2. Música: al azar entre las válidas, nunca una inválida, en loop y con el volumen guardado
  {
    const chosen = new Set();
    for (let i = 0; i < 40; i++) {
      const env = makeEnv({
        manifest: { bgm: ['a.mp3', 'b.wav', 'roto.mp3', 'colgado.ogg', 'nota.txt'], sfx: [] },
        files: { 'snd/bgm/a.mp3': 'ok', 'snd/bgm/b.wav': 'ok', 'snd/bgm/roto.mp3': 'error', 'snd/bgm/colgado.ogg': 'hang' },
      });
      const a = load(source, env);
      a.initSoundState();
      await a.initAudioFiles(); await tick();
      const bgm = a.bgm();
      assert(bgm, 'debe haber una pista elegida');
      assert(['snd/bgm/a.mp3', 'snd/bgm/b.wav'].includes(bgm.src), 'eligió un archivo inválido: ' + bgm.src);
      assert.equal(bgm.loop, true);
      assert.equal(bgm.volume, a.getBgmVolume());
      assert(bgm.volume > 0 && bgm.volume < 1);
      assert.equal(bgm.paused, false);
      chosen.add(bgm.src);
    }
    assert.equal(chosen.size, 2, 'la elección debería variar entre las pistas válidas');
  }
  // 3. Sin ninguna pista válida: no hay música y no se rompe
  {
    const env = makeEnv({ manifest: { bgm: ['roto.mp3'], sfx: [] }, files: {} });
    const a = load(source, env);
    a.initSoundState();
    await a.initAudioFiles(); await tick();
    assert.equal(a.bgm(), null);
  }
  // 4. Efectos: solo archivos válidos, al azar, sin usar el sintetizado; los nombres se codifican en la URL
  {
    const env = makeEnv({
      manifest: { bgm: [], sfx: ['uno.wav', 'dos tres#.mp3', 'roto.ogg', 'x.txt'] },
      files: { 'snd/sfx/uno.wav': 'ok', 'snd/sfx/dos%20tres%23.mp3': 'ok', 'snd/sfx/roto.ogg': 'error' },
    });
    const a = load(source, env);
    a.initSoundState();
    await a.initAudioFiles();
    assert.deepEqual(a.sfx().sort(), ['snd/sfx/dos%20tres%23.mp3', 'snd/sfx/uno.wav']);
    const before = env.created.length, used = new Set();
    for (let i = 0; i < 40; i++) { a.playCardAddSfx(); a.playCardRemoveSfx(); }
    env.created.slice(before).forEach(x => { used.add(x.src); assert(x.playCalls === 1 && x.volume === a.getSfxVolume()); });
    assert.equal(used.size, 2);
    assert.equal(env.oscillators, 0);
  }
  // 5. Autoplay bloqueado: la música arranca en el primer gesto y se limpian los listeners de gesto
  {
    const env = makeEnv({ manifest: { bgm: ['a.mp3'], sfx: [] }, files: { 'snd/bgm/a.mp3': 'ok' }, autoplayBlocked: true });
    const a = load(source, env);
    a.initSoundState();
    await a.initAudioFiles(); await tick();
    assert.equal(a.bgm().paused, true);
    fireGesture(env); await tick();
    assert.equal(a.bgm().paused, false);
    for (const name of ['pointerdown', 'pointerup', 'keydown', 'touchend']) {
      assert.equal((env.listeners[name] || new Set()).size, 0, 'quedó un listener de ' + name);
    }
  }
  // 6. Slider de música: bajarlo a 0 pausa; volver a subirlo reanuda; el valor se guarda
  {
    const env = makeEnv({ manifest: { bgm: ['a.mp3'], sfx: [] }, files: { 'snd/bgm/a.mp3': 'ok' } });
    const a = load(source, env);
    a.initSoundState();
    await a.initAudioFiles(); await tick();
    assert.equal(a.bgm().paused, false);
    a.setBgmVolume(0);
    assert.equal(a.bgm().paused, true);
    assert.equal(env.storage.aetherium_bgm_volume, '0');
    a.setBgmVolume(0.5);
    await tick();
    assert.equal(a.bgm().paused, false);
    assert.equal(a.bgm().volume, 0.5);
    assert.equal(env.storage.aetherium_bgm_volume, '0.5');
  }
  // 7. Slider de efectos: en 0 no suena ni el archivo ni el sintetizado; > 0 vuelve a sonar con ese volumen
  {
    const env = makeEnv({ manifest: { bgm: [], sfx: ['x.wav'] }, files: { 'snd/sfx/x.wav': 'ok' } });
    const a = load(source, env);
    a.initSoundState();
    await a.initAudioFiles();
    a.setSfxVolume(0);
    const n = env.created.length, osc = env.oscillators;
    a.playCardAddSfx(); a.playCardRemoveSfx();
    assert.equal(env.created.length, n);
    assert.equal(env.oscillators, osc);
    a.setSfxVolume(0.9);
    a.playCardAddSfx();
    assert.equal(env.created[env.created.length - 1].volume, 0.9);
    assert.equal(env.storage.aetherium_sfx_volume, '0.9');
  }
  // 8. El sonido sintetizado (playClick) pasa por un nodo de ganancia que respeta el volumen de efectos
  {
    const env = makeEnv({ manifest: null });
    const a = load(source, env);
    a.initSoundState();
    a.setSfxVolume(0.35);
    a.playClick();
    assert(env.gains.length > 0, 'debe crear al menos un nodo de ganancia para los efectos');
    const bus = env.gains[env.gains.length - 1];
    assert(Math.abs(bus.gain.value - 0.5) < 0.05, `ganancia esperada ~0.5 (0.35/0.7), fue ${bus.gain.value}`);
  }
  // 9. Volúmenes guardados de una visita anterior se restauran; sin nada guardado se usan los valores por defecto
  {
    const env = makeEnv({ manifest: { bgm: ['a.mp3'], sfx: [] }, files: { 'snd/bgm/a.mp3': 'ok' }, storage: { aetherium_bgm_volume: '0', aetherium_sfx_volume: '0.1' } });
    const a = load(source, env);
    a.initSoundState();
    assert.equal(a.getBgmVolume(), 0);
    assert.equal(a.getSfxVolume(), 0.1);
    await a.initAudioFiles(); await tick();
    assert.equal(a.bgm(), null, 'con música en 0 no debería arrancar la pista');
  }
  {
    const env = makeEnv({ manifest: null });
    const a = load(source, env);
    a.initSoundState();
    assert(a.getBgmVolume() > 0 && a.getSfxVolume() > 0, 'sin nada guardado debe haber volumen por defecto');
  }
  // 10. Silencio previo con el interruptor viejo (versión anterior a los sliders): sigue en silencio
  {
    const env = makeEnv({ manifest: { bgm: ['a.mp3'], sfx: [] }, files: { 'snd/bgm/a.mp3': 'ok' }, storage: { aetherium_sound_enabled: 'false' } });
    const a = load(source, env);
    a.initSoundState();
    assert.equal(a.getBgmVolume(), 0);
    assert.equal(a.getSfxVolume(), 0);
    await a.initAudioFiles(); await tick();
    assert.equal(a.bgm(), null);
  }
  console.log(label + ': manifest ausente, música/efectos al azar, autoplay, sliders de volumen, bus de ganancia y migración desde el interruptor viejo passed');
}

(async () => {
  await check('Standalone bundle', bundle);
  await check('Modules', soundModule);
})().catch(err => { console.error(err); process.exit(1); });
