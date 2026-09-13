import vm from 'node:vm';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../paper-games');
const request = JSON.parse(await new Promise(resolve => {
  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { data += chunk; });
  process.stdin.on('end', () => resolve(data));
}));
if (!['balloons', 'fortune', 'coin-pusher'].includes(request.game)) throw new Error('unsupported_game');
let randomState = request.snapshot?.randomState ?? (parseInt(request.seed.slice(0, 8), 16) >>> 0);
const random = () => { randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0; return randomState / 4294967296; };
const math = Object.create(Math);
math.random = random;
const effects = {spent: 0, credits: [], keeps: []};
const inventory = structuredClone(request.snapshot?.inventory || request.inventory || {});
const wallet = {
  alleyPlay: true,
  pocket: () => request.game === 'fortune' ? 1 : request.pennies - effects.spent + effects.credits.reduce((total, value) => total + value, 0),
  spend(amount) {
    if (request.game === 'fortune') return true;
    if (!Number.isSafeInteger(amount) || amount < 0 || wallet.pocket() < amount) return false;
    effects.spent += amount;
    return true;
  },
  credit(amount) { effects.credits.push(amount); return amount; },
  keep(id) { effects.keeps.push(id); inventory[id] = inventory[id] || {qty: 1}; return true; },
  owned: id => !!inventory[id],
  keptQty: id => Number(inventory[id]?.qty) || (inventory[id] ? 1 : 0),
  loadMachine: () => request.legacyTable || null,
  saveMachine() {},
};
const context = vm.createContext({Math: math, Date: class extends Date { static now() { return 0; } }});
const modules = new Map();
async function load(filename) {
  filename = path.resolve(filename.split('?')[0]);
  if (path.dirname(filename) !== root && path.dirname(filename) !== path.join(root, 'stalls')) throw new Error('module_outside_engine');
  if (modules.has(filename)) return modules.get(filename);
  let module;
  if (filename === path.join(root, 'wallet.js')) {
    module = new vm.SyntheticModule(Object.keys(wallet), function () {
      for (const [key, value] of Object.entries(wallet)) this.setExport(key, value);
    }, {context});
  } else {
    module = new vm.SourceTextModule(await fs.readFile(filename, 'utf8'), {context, identifier: filename});
  }
  modules.set(filename, module);
  await module.link((specifier, parent) => load(path.resolve(path.dirname(parent.identifier), specifier)));
  return module;
}
const engineModule = await load(path.join(root, 'stalls', `${request.game}.js`));
await engineModule.evaluate({timeout: 2000});
const prizesModule = await load(path.join(root, 'prizes.js'));
if (prizesModule.status !== 'evaluated') await prizesModule.evaluate();
const chapterModule = await load(path.join(root, 'chapter-kit.js'));
if (chapterModule.status !== 'evaluated') await chapterModule.evaluate();
const engine = engineModule.namespace.default;
engine.prizes = prizesModule.namespace.kits[request.game]?.prizes || engine.prizes;
const state = request.snapshot?.state || engine.create(request.chapter, random);
if (!request.snapshot) {
  state.houseLeft = request.game === 'balloons' ? 40 : request.game === 'fortune' ? 50 : 90;
  if (request.game === 'fortune') {
    state.topic = request.topic;
    state.reads = request.reads || 0;
    engine.action(state, 'gaze');
  }
}
const input = {keys: new Set(), actions: new Set(), pointer: null, down: false};
for (const event of request.events || []) {
  if (state.result) break;
  if (request.game === 'fortune' && state.phase === 'wait') break;
  if (event.type === 'tick') {
    if (!Number.isFinite(event.dt) || event.dt <= 0 || event.dt > .05) throw new Error('invalid_tick');
    input.keys = new Set(event.keys || []);
    input.actions = new Set(event.actions || []);
    engine.update(state, event.dt, input);
    if (request.game !== 'coin-pusher' && !state.result) {
      state.houseLeft = Math.max(0, state.houseLeft - event.dt);
      if (!state.houseLeft) state.result = {won: false, title: 'The house closes', detail: 'This attempt has ended.'};
    }
    chapterModule.namespace.stepPrize(state, event.dt);
  } else if (event.type === 'pointer') {
    if (!['down', 'move', 'up', 'cancel'].includes(event.phase) ||
        !Number.isFinite(event.point?.x) || !Number.isFinite(event.point?.y)) throw new Error('invalid_pointer');
    if (request.game === 'fortune' && state.phase !== 'seek') continue;
    engine.pointer?.(state, event.phase, event.point, input);
  } else if (event.type === 'action') {
    if (!engine.actions.some(action => action.id === event.id)) throw new Error('invalid_action');
    if (request.game === 'fortune') continue;
    engine.action?.(state, event.id, event.down !== false, input);
  } else if (event.type === 'key') {
    if (typeof event.key !== 'string' || event.key.length > 20) throw new Error('invalid_key');
    if (request.game === 'fortune') continue;
    engine.key?.(state, event.key, event.down !== false, input);
  } else throw new Error('invalid_event');
}
if (state.result && state.result.won !== false && request.game !== 'coin-pusher') {
  const prize = state.result.prize || engine.prizes[request.chapter];
  if (prize) { chapterModule.namespace.takePrize(state, prize); wallet.keep(prize); }
}
const terminal = request.game === 'coin-pusher' ? null : state.result ?
  (state.result.won === false ? 'failed' : 'completed') :
  request.game === 'fortune' && state.phase === 'wait' ? 'failed' : null;
const motion = request.game === 'coin-pusher' && (state.queue > 0 || state.stroke > 0 ||
  state.coins.some(piece => piece.falling || piece.vx * piece.vx + piece.vy * piece.vy > 2.2));
process.stdout.write(JSON.stringify({snapshot: {state, randomState, inventory}, effects, terminal, motion}));
