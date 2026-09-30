// Prueba de la banlist predefinida (cartas/banlist-default.json): aplicación al
// arrancar, y que un límite o una eliminación propios del usuario siempre ganan
// sobre el archivo del repo, hoy y en cualquier visita futura.
// Se ejecuta contra el bundle y contra los módulos. Uso: node tests/default-banlist.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const bundle = fs.readFileSync(path.join(root, 'js/bundle.js'), 'utf8');
const modules = ['cardsData.js', 'state.js']
  .map(p => fs.readFileSync(path.join(root, 'js', p), 'utf8').replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, ''))
  .join('\n');

const API = `;globalThis.__dl = { CARDS_DATA, state, loadInitialState, loadDefaultBanlist,
  applyDefaultBanlistEntries, setBanlistLimit, clearBanlistLimit, getBanlistLimit };`;

function makeEnv({ manifest, storage = {} }) {
  const env = { fetched: [], storage };
  const ctx = vm.createContext({
    console, Math, Promise, JSON, Array, Object, Number, String,
    document: { addEventListener() {}, removeEventListener() {} },
    fetch: async (p) => {
      env.fetched.push(p);
      if (manifest === null) throw new TypeError('Failed to fetch');
      return { ok: true, json: async () => manifest };
    },
    localStorage: { getItem: (k) => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); } },
  });
  env.ctx = ctx;
  return env;
}

function load(source, env) {
  const code = source.includes('(function()') ? source.replace(/\}\)\(\);\s*$/, API + '})();') : source + '\n' + API;
  vm.runInContext(code, env.ctx);
  const a = env.ctx.__dl;
  a.CARDS_DATA.push(
    { id: 'a', name: 'Avaricia', rarity: 'Legendary', type: 'Criatura', element: 'marte' },
    { id: 'z', name: 'Cañón de Zagh', rarity: 'Legendary', type: 'Estructura', element: 'pluton' },
    { id: 't', name: 'Ficha Rara', rarity: 'Common', type: 'Token', isToken: true, element: 'marte' }
  );
  return a;
}

async function check(label, source) {
  // 1. Se aplica al arrancar cuando el usuario no tiene banlist propia
  {
    const env = makeEnv({ manifest: { 'Avaricia': 1, 'Cañón de Zagh': 0 } });
    const a = load(source, env);
    a.loadInitialState();
    await a.loadDefaultBanlist();
    assert.equal(a.getBanlistLimit('a'), 1);
    assert.equal(a.getBanlistLimit('z'), 0);
    assert.deepEqual(env.fetched, ['cartas/banlist-default.json']);
  }
  // 2. Nombres que no existen en el pool, límites inválidos y Tokens se ignoran sin romper nada
  {
    const env = makeEnv({ manifest: { 'Carta Inexistente': 2, 'Avaricia': -1, 'Ficha Rara': 0 } });
    const a = load(source, env);
    a.loadInitialState();
    await a.loadDefaultBanlist();
    assert.equal(a.getBanlistLimit('a'), undefined);
    assert.equal(a.getBanlistLimit('t'), undefined);
  }
  // 3. Sin archivo (file:// o ausente): no rompe nada y no hay banlist predefinida
  {
    const env = makeEnv({ manifest: null });
    const a = load(source, env);
    a.loadInitialState();
    await a.loadDefaultBanlist();
    assert.equal(a.getBanlistLimit('a'), undefined);
  }
  // 4. Un límite que el usuario ya fijó por su cuenta nunca se pisa con el del archivo
  {
    const env = makeEnv({ manifest: { 'Avaricia': 1 } });
    const a = load(source, env);
    a.loadInitialState();
    assert(a.setBanlistLimit('a', 3).success);
    await a.loadDefaultBanlist();
    assert.equal(a.getBanlistLimit('a'), 3);
  }
  // 5. Si el usuario quita explícitamente una carta de su banlist, el archivo no la vuelve a poner
  //    ni en esta sesión ni en una visita futura (se recuerda en localStorage)
  {
    const storage = {};
    const env1 = makeEnv({ manifest: { 'Avaricia': 1 }, storage });
    const a1 = load(source, env1);
    a1.loadInitialState();
    await a1.loadDefaultBanlist();
    assert.equal(a1.getBanlistLimit('a'), 1);
    a1.clearBanlistLimit('a');
    assert.equal(a1.getBanlistLimit('a'), undefined);

    // "Nueva visita": módulo recién cargado, mismo localStorage
    const env2 = makeEnv({ manifest: { 'Avaricia': 1 }, storage: env1.storage });
    const a2 = load(source, env2);
    a2.loadInitialState();
    await a2.loadDefaultBanlist();
    assert.equal(a2.getBanlistLimit('a'), undefined, 'la carta quitada no debería reaparecer');
  }
  // 6. Una carta agregada al archivo después de que el usuario ya cargó su banlist
  //    (sin tocar esa carta) se aplica en la próxima visita
  {
    const storage = {};
    const env1 = makeEnv({ manifest: {}, storage });
    const a1 = load(source, env1);
    a1.loadInitialState();
    await a1.loadDefaultBanlist();
    assert.equal(a1.getBanlistLimit('z'), undefined);

    const env2 = makeEnv({ manifest: { 'Cañón de Zagh': 0 }, storage: env1.storage });
    const a2 = load(source, env2);
    a2.loadInitialState();
    await a2.loadDefaultBanlist();
    assert.equal(a2.getBanlistLimit('z'), 0);
  }
  console.log(label + ': banlist predefinida aplicada al arrancar, límites/eliminaciones propios del usuario ganan siempre, y nombres inválidos ignorados passed');
}

(async () => {
  await check('Standalone bundle', bundle);
  await check('Modules', modules);
})().catch(err => { console.error(err); process.exit(1); });
