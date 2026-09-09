// CPU-only. Do NOT launch a browser/GPU test on Mother PC.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  WORLD, SHORE, COURSES, BOAT_RADIUS, createGame, startGame, step,
  pointInHarbour, closestPoint, gatePose, ferryPose,
} from '../experiments/brasswater-harbour/model.js';
import { HarbourScene } from '../experiments/brasswater-harbour/scene.js';

const root = fileURLToPath(new URL('../experiments/brasswater-harbour/', import.meta.url));
function run(g, seconds, control = () => ({}), hz = 60) {
  for (let i = 0; i < seconds * hz; i++) step(g, control(g, i), 1 / hz);
}
function near(a, b, epsilon = .01) { assert(Math.abs(a - b) < epsilon, `${a} not near ${b}`); }
let g = createGame();
step(g, { active: true, x: 450, y: 1030 }, 1); near(g.time, 0);
startGame(g); run(g, 2); near(g.boat.x, COURSES[0].start[0]); near(g.boat.y, COURSES[0].start[1]);
// Jet pushes away from its source, not toward it; release recharges the tank.
const initialY = g.boat.y;
run(g, .7, s => ({ active: true, x: s.boat.x, y: s.boat.y + 80 }));
assert(g.boat.y < initialY - 20); assert(g.pressure < .9);
run(g, 4, s => ({ active: true, x: s.boat.x, y: s.boat.y + 80 }));
assert(g.pressure < .06); run(g, 4, () => ({ anchor: true })); near(g.pressure, 1);
assert(Math.hypot(g.boat.vx, g.boat.vy) < .1);
// Invalid / distant inputs cannot teleport or force NaNs into state.
g = createGame(); startGame(g);
run(g, 1, () => ({ active: true, x: NaN, y: Infinity }));
run(g, 1, () => ({ active: true, x: -10000, y: -10000 }));
near(g.boat.x, 445); near(g.boat.y, 966);
const timeBefore = g.time; step(g, {}, 10000); near(g.time - timeBefore, .1);
step(g, {}, NaN); step(g, {}, -5); assert(Number.isFinite(g.time));
// Different display rates give the same fixed-step result.
const rateRuns = [30, 60, 120].map(hz => {
  const s = createGame(); startGame(s);
  run(s, 1, () => ({ active: true, x: 360, y: 1011 }), hz);
  return s;
});
for (const r of rateRuns.slice(1)) { near(r.boat.x, rateRuns[0].boat.x); near(r.boat.y, rateRuns[0].boat.y); }
// The dock is not an early win and cannot be rushed at high speed.
g = createGame(); startGame(g); [g.boat.x, g.boat.y] = COURSES[0].dock;
run(g, 2, () => ({ anchor: true })); assert.equal(g.phase, 'playing');
g.letters = [true, true, true]; g.boat.vx = 150; step(g, {}, 1 / 60); assert.equal(g.dockTime, 0);
[g.boat.x, g.boat.y] = COURSES[0].dock; g.boat.vx = 0; g.boat.vy = 0;
run(g, 1.2, () => ({ anchor: true })); assert.equal(g.phase, 'won');
const final = JSON.stringify(g.boat); run(g, 2, () => ({ active: true, x: 200, y: 200 })); assert.equal(JSON.stringify(g.boat), final);
// Capsule contact prevents tunnelling through islands at the speed cap.
g = createGame(); startGame(g); Object.assign(g.boat, { x: 450, y: 850, vx: 0, vy: -175 });
run(g, 1, s => ({ active: true, x: s.boat.x, y: s.boat.y + 70 }));
assert(Math.hypot(g.boat.x - 450, g.boat.y - 735) >= 63 + BOAT_RADIUS - .01);
// Reachability via ordinary jet/anchor inputs. No teleports or item-state edits.
const routes = [
  [[300, 900], [300, 790], [300, 851], [623, 851], [627, 589], [625, 405], [361, 360], [460, 285]],
  [[315, 950], [320, 819], [320, 885], [650, 885], [625, 644], [580, 579], [450, 574], [450, 373], [365, 340], [460, 285]],
  [[300, 960], [300, 828], [300, 945], [643, 945], [666, 875], [644, 687], [692, 578], [450, 572], [450, 375], [351, 355], [460, 285]],
];
function steer(s, target) {
  const b = s.boat, dx = target[0] - b.x, dy = target[1] - b.y;
  const ax = dx * 3 - b.vx * 3.8, ay = dy * 3 - b.vy * 3.8;
  const force = Math.hypot(ax, ay), distance = Math.hypot(dx, dy);
  if (s.pressure < .14) return { anchor: true };
  if (distance < 18 && Math.hypot(b.vx, b.vy) < 25) return { anchor: true };
  if (force < 64) return { anchor: true };
  const range = Math.max(10, Math.min(230, (1 - Math.min(force, 345) / 360) * 280));
  return { active: true, x: b.x - ax / force * range, y: b.y - ay / force * range };
}
const results = [];
for (let index = 0; index < COURSES.length; index++) {
  const s = createGame(index); startGame(s); let waypoint = 0, recharge = false;
  for (let i = 0; i < 60 * 300 && s.phase === 'playing'; i++) {
    const target = routes[index][waypoint];
    if (Math.hypot(s.boat.x - target[0], s.boat.y - target[1]) < 24 && waypoint < routes[index].length - 1) waypoint++;
    if (s.pressure < .15) recharge = true;
    if (s.pressure > .8) recharge = false;
    step(s, recharge ? { anchor: true } : steer(s, routes[index][waypoint]), 1 / 60);
    assert(pointInHarbour(s.boat.x, s.boat.y), `left harbour on course ${index}`);
  }
  assert.equal(s.phase, 'won', `course ${index} stuck at waypoint ${waypoint}: ${JSON.stringify(s.boat)} letters ${s.letters}`);
  results.push({ course: index + 1, time: Math.round(s.time), bumps: s.bumps, letters: s.letters.filter(Boolean).length });
}
// Seeded sustained stress against moving gates/ferry and banks, bounded state.
let seed = 719;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
for (let index = 0; index < 3; index++) {
  const s = createGame(index); startGame(s);
  for (let i = 0; i < 5000; i++) {
    const a = random() * Math.PI * 2;
    step(s, { active: random() > .25, x: s.boat.x + Math.cos(a) * 75, y: s.boat.y + Math.sin(a) * 75 }, 1 / 30);
    assert(pointInHarbour(s.boat.x, s.boat.y)); assert(s.pressure >= 0 && s.pressure <= 1);
    assert([s.boat.x, s.boat.y, s.boat.vx, s.boat.vy, s.boat.angle].every(Number.isFinite));
  }
}
const gate = createGame(1); near(gatePose(gate).open, 0); gate.time = 3.5; near(gatePose(gate).open, 1);
const ferry = ferryPose(createGame(2)); assert(ferry.vx > 0);
// Renderer contract: exercise all code paths on a CPU-only Canvas call stub.
// This validates calls/state limits, NOT appearance, layout or browser support.
let calls = 0;
const context = new Proxy({}, { get(target, key) {
  if (key in target) return target[key];
  return (...args) => { calls++; for (const arg of args) if (typeof arg === 'number') assert(Number.isFinite(arg), `${key}: non-finite coordinate`); };
} });
const scene = new HarbourScene({ width: 0, height: 0, getContext: () => context });
for (const size of [[360, 480], [600, 800], [750, 1000]]) {
  scene.resize(...size, 3); assert.equal(scene.canvas.width, size[0] * 1.5);
  for (let index = 0; index < 3; index++) {
    const s = createGame(index); scene.render(s); startGame(s);
    for (let i = 0; i < 20; i++) {
      step(s, { active: true, x: s.boat.x, y: s.boat.y + 70 }, 1 / 30);
      scene.event({ type: ['letter', 'won', 'bump'][i % 3], x: s.boat.x, y: s.boat.y }, i / 30);
      scene.render(s, { time: i / 30, reduced: i % 2 === 0, pointer: { x: 400, y: 900 } });
    }
  }
}
assert(scene.confetti.length <= 34); assert(scene.rings.length <= 16); assert(scene.wake.length <= 20);
scene.dispose(); assert.equal(scene.canvas.width, 1); assert.equal(scene.rings.length, 0);
// All local browser module/style/art references exist; no operational imports.
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const m of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) assert(fs.existsSync(path.join(root, m[1])), `missing ${m[1]}`);
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
for (const m of app.matchAll(/\$\('([^']+)'\)/g)) assert(ids.has(m[1]), `missing element ${m[1]}`);
for (const file of ['app.js', 'scene.js', 'model.js']) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  assert(!/\b(?:fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB)\b/.test(source), `unexpected integration in ${file}`);
  assert(!/6000|square|motherpc|flow\.js/i.test(source), `operational reference in ${file}`);
}
assert(/cancelAnimationFrame/.test(app) && /lifetime\.abort/.test(app) && /observer\.disconnect/.test(app));
// Execute the real app handlers against a tiny DOM/timer stub. This is not a
// browser and does not rasterise anything; it catches lifecycle/input regressions.
class StubTarget {
  constructor() { this.handlers = new Map(); }
  addEventListener(name, fn, opts = {}) {
    const entries = this.handlers.get(name) || []; entries.push({ fn, signal: opts.signal }); this.handlers.set(name, entries);
  }
  emit(name, fields = {}) {
    const event = { target: this, preventDefault() {}, type: name, ...fields };
    for (const { fn, signal } of this.handlers.get(name) || []) if (!signal?.aborted) fn(event);
  }
}
class StubElement extends StubTarget {
  constructor(id) { super(); this.id = id; this.attrs = {}; this.dataset = {}; this.hidden = false; this.open = false; this.captures = new Set(); }
  setAttribute(k, v) { this.attrs[k] = v; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 450, height: 600 }; }
  getContext() { return context; }
  focus() { dom.activeElement = this; }
  scrollIntoView() {}
  closest() { return ['sea', 'body'].includes(this.id) ? null : this; }
  setPointerCapture(id) { this.captures.add(id); }
  hasPointerCapture(id) { return this.captures.has(id); }
  releasePointerCapture(id) { this.captures.delete(id); }
  showModal() { this.open = true; }
}
const elements = Object.fromEntries([...ids].map(id => [id, new StubElement(id)]));
const buttons = [0, 1, 2].map(index => { const el = new StubElement(`course-${index}`); el.dataset.course = String(index); return el; });
elements.backdrop.complete = true; elements.backdrop.naturalWidth = 1088;
const dom = new StubTarget(); dom.hidden = false;
dom.getElementById = id => elements[id]; dom.querySelectorAll = () => buttons;
const win = new StubTarget(); win.devicePixelRatio = 1;
const media = new StubTarget(); media.matches = false;
let resizeDisconnected = false;
class StubResize { constructor(callback) { this.callback = callback; } observe() {} disconnect() { resizeDisconnected = true; } }
const scheduled = new Map(); let sequence = 0, clock = 0;
const api = new Function('document', 'window', 'matchMedia', 'ResizeObserver', 'requestAnimationFrame', 'cancelAnimationFrame',
  'WORLD', 'COURSES', 'createGame', 'startGame', 'step', 'allLetters', 'HarbourScene',
  app.replace(/^import .*?;\n/gm, '') + '\nreturn { state:()=>({game,paused,disposed,held,anchorHeld,raf}), dispose };')(
  dom, win, () => media, StubResize, fn => { scheduled.set(++sequence, fn); return sequence; }, id => scheduled.delete(id),
  WORLD, COURSES, createGame, startGame, step, s => s.letters.every(Boolean), HarbourScene);
const advance = (count = 1) => {
  for (let i = 0; i < count; i++) {
    clock += 34;
    const current = [...scheduled.values()]; scheduled.clear(); current.forEach(fn => fn(clock));
    assert(scheduled.size <= 1, 'stacked animation loops');
  }
};
assert.equal(scheduled.size, 0, 'ready must be idle');
elements.launch.emit('click'); assert.equal(api.state().game.phase, 'playing'); assert.equal(scheduled.size, 1);
const down = { pointerId: 1, pointerType: 'touch', button: 0, clientX: 222.5, clientY: 523 };
elements.sea.emit('pointerdown', down); advance(20); assert(api.state().game.boat.y < 946);
elements.sea.emit('pointercancel', down); assert.equal(api.state().held, false);
elements.pause.emit('click'); assert.equal(api.state().paused, true); assert.equal(scheduled.size, 0);
const frozenTime = api.state().game.time; advance(10); near(api.state().game.time, frozenTime);
elements.resume.emit('click'); advance(2); assert.equal(scheduled.size, 1);
elements.help.emit('click'); assert(elements['help-dialog'].open); assert.equal(scheduled.size, 0);
elements['help-dialog'].open = false; elements['help-dialog'].emit('close'); assert.equal(scheduled.size, 1);
dom.hidden = true; dom.emit('visibilitychange'); assert.equal(scheduled.size, 0); assert(api.state().paused);
dom.hidden = false; dom.emit('visibilitychange'); assert.equal(scheduled.size, 0, 'return from hidden must wait for resume');
elements.resume.emit('click'); advance(1);
buttons[2].emit('click'); assert.equal(api.state().game.course, 2); assert.equal(api.state().game.phase, 'ready'); assert.equal(scheduled.size, 0);
elements.launch.emit('click'); advance(1);
elements.anchor.emit('pointerdown', down); assert(api.state().anchorHeld);
elements.anchor.emit('lostpointercapture', down); assert.equal(api.state().anchorHeld, false);
win.emit('pagehide', { persisted: true }); assert(api.state().paused); assert.equal(api.state().disposed, false);
win.emit('pageshow', { persisted: true }); assert.equal(scheduled.size, 0);
elements.resume.emit('click'); assert.equal(scheduled.size, 1);
elements.exit.emit('click'); assert(api.state().disposed); assert.equal(scheduled.size, 0); assert(resizeDisconnected);
elements.launch.emit('click'); advance(4); assert.equal(scheduled.size, 0, 'disposed handlers must stay aborted');
console.log('PASS: jet direction, refill, braking, docking, frame rates, boundaries, moving props, all three input-driven routes, renderer contract and isolation.');
console.log('PASS: real app handlers for launch, input cancellation, help, pause, hidden tab, restart, back-forward cache and exit (CPU DOM stubs only).');
console.table(results);
console.log(`${calls} validated Canvas calls; no browser, renderer process or GPU launched.`);
