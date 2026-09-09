// CPU-only maths, draw-call and lifecycle checks. No browser or GPU process.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as model from '../experiments/celestes-starlight/model.js';
import { Observatory, GLASS_NAMES } from '../experiments/celestes-starlight/scene.js';
const { WORLD, CHAPTERS, STEP, createGame, start, refresh, trace, beginTurn, previewTurn, endTurn, nudge, undo, hint, launch, tick, pointOnRay, raySegment, rayCircle } = model;
const root = fileURLToPath(new URL('../experiments/celestes-starlight/', import.meta.url));
const near = (a, b, epsilon = 1e-5) => assert(Math.abs(a - b) < epsilon, `${a} != ${b}`);
near(raySegment([0, 0], [1, 0], [10, -5], [10, 5]), 10);
assert.equal(raySegment([0, 0], [1, 0], [10, 3], [20, 3]), null);
assert.equal(raySegment([0, 0], [1, 0], [-10, -5], [-10, 5]), null);
near(rayCircle([0, 0], [1, 0], [10, 0], 2), 8);
assert.equal(rayCircle([0, 0], [1, 0], [10, 10], 2), null);
let g = createGame(); assert.equal(beginTurn(g, 0), false); assert.equal(launch(g), false);
start(g); assert(beginTurn(g, 0)); previewTurn(g, NaN); near(g.angles[0], 0);
previewTurn(g, Math.PI / 4); assert(g.ray.lit.every(v => typeof v === 'boolean')); endTurn(g, true);
near(g.angles[0], 0); assert.equal(g.turns, 0); assert.equal(g.history.length, 0);
assert(nudge(g, 0, 1)); near(g.angles[0], STEP); assert.equal(g.turns, 1);
assert(undo(g)); near(g.angles[0], 0); assert.equal(g.history.length, 0);
assert.equal(nudge(g, 100, 1), false); assert.equal(nudge(g, 0, NaN), false);
// Actual light paths, not just matching a hard-coded answer array.
const solvedRuns = [];
for (let index = 0; index < CHAPTERS.length; index++) {
  const s = createGame(index), c = CHAPTERS[index];
  assert(!s.ray.solved, `chapter ${index} starts solved`); start(s);
  for (let i = 0; i < 10 && !s.ray.solved; i++) {
    const h = hint(s); assert(h, 'hints must lead to a working path');
    for (let j = 0; j < Math.abs(h.clicks); j++) nudge(s, h.index, Math.sign(h.clicks));
  }
  assert(s.ray.solved); assert(s.ray.receiverLit); assert(s.ray.lit.every(Boolean));
  assert.equal(s.ray.segments.length, c.mirrors.length + 1);
  const end = pointOnRay(s.ray, s.ray.length + 500);
  near(Math.hypot(end[0] - c.receiver[0], end[1] - c.receiver[1]), 24);
  assert(launch(s)); const angles = [...s.angles]; assert.equal(nudge(s, 0, 1), false);
  tick(s, NaN); near(s.flight, 0); tick(s, 999); near(s.flight, 41);
  for (let frame = 0; frame < 600 && s.phase !== 'won'; frame++) tick(s, 1 / 30);
  assert.equal(s.phase, 'won'); assert.deepEqual(s.angles, angles);
  solvedRuns.push({ chapter: index + 1, mirrors: c.mirrors.length, stars: c.stars.length, turns: s.turns });
}
// Reduced-motion option finishes the same solved path, not a separate game.
g = createGame(); start(g); g.angles = [...CHAPTERS[0].solution]; refresh(g); launch(g); tick(g, 1 / 30, true); assert.equal(g.phase, 'won');
// Every notch combination in the introductory chapter terminates safely.
let solutions = 0, loops = 0;
for (let value = 0; value < 512; value++) {
  const s = createGame(); s.angles = [value % 8, (value >> 3) % 8, (value >> 6) % 8].map(i => i * STEP);
  refresh(s); assert(s.ray.segments.length <= 32); assert(Number.isFinite(s.ray.length));
  solutions += Number(s.ray.solved); loops += Number(s.ray.loop);
}
assert(solutions > 0);
// Fixed seeded angle stress on the harder chapters and the shadow collider.
let seed = 713;
for (let i = 0; i < 2000; i++) {
  const s = createGame(i % 3);
  s.angles = s.angles.map(() => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32 * Math.PI; });
  refresh(s); assert(s.ray.segments.length <= 32 && s.ray.length < 52000);
  for (const segment of s.ray.segments) assert([...segment.a, ...segment.b, segment.length].every(Number.isFinite));
}
g = createGame(2); g.angles[0] = Math.PI / 2; refresh(g); assert.equal(g.ray.blocked, 'moon');
g = createGame(); start(g); for (let i = 0; i < 150; i++) nudge(g, 0, 1); assert.equal(g.history.length, 100);

// Canvas call contract, not an image or a browser screenshot.
let calls = 0;
const context = new Proxy({}, { get(target, key) {
  if (key in target) return target[key];
  return (...args) => {
    calls++; for (const a of args) if (typeof a === 'number') assert(Number.isFinite(a), `${key}: invalid coordinate`);
    if (key === 'createRadialGradient' || key === 'createLinearGradient') return { addColorStop() {} };
  };
} });
const scene = new Observatory({ getContext: () => context });
for (const [w, h] of [[360, 480], [600, 800], [750, 1000]]) {
  scene.resize(w, h, 3); assert.equal(scene.canvas.width, w * 1.5);
  for (let index = 0; index < 3; index++) {
    const s = createGame(index); scene.render(s); start(s); scene.render(s, 1);
    s.angles = [...CHAPTERS[index].solution]; refresh(s); scene.render(s, 2, true); launch(s);
    for (let i = 0; i < 200; i++) { tick(s, 1 / 24); scene.render(s, i / 24, i % 2 === 0); }
    assert.equal(s.phase, 'won');
  }
}
scene.dispose(); assert.equal(scene.canvas.width, 1);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8'), app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
for (const m of app.matchAll(/\$\('([^']+)'\)/g)) assert(ids.has(m[1]), `missing id ${m[1]}`);
for (const m of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) assert(fs.existsSync(path.join(root, m[1])), `missing ${m[1]}`);
for (const file of ['model.js', 'scene.js', 'app.js']) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  assert(!/\b(?:fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB)\b/.test(source));
  assert(!/6000|motherpc|square|flow\.js/i.test(source));
}
// Execute real application handlers in a CPU DOM/timer stub.
class Target {
  constructor() { this.handlers = new Map(); }
  addEventListener(name, fn, options = {}) { const a = this.handlers.get(name) || []; a.push({ fn, signal: options.signal }); this.handlers.set(name, a); }
  emit(name, fields = {}) { const event = { target: this, type: name, preventDefault() {}, ...fields }; for (const h of this.handlers.get(name) || []) if (!h.signal?.aborted) h.fn(event); }
}
class Element extends Target {
  constructor(id) { super(); this.id = id; this.attrs = {}; this.dataset = {}; this.children = []; this.open = false; this.captures = new Set(); }
  setAttribute(k, v) { this.attrs[k] = v; }
  getContext() { return context; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 450, height: 600 }; }
  focus() { dom.activeElement = this; }
  scrollIntoView() {}
  closest(selector) { if (selector === '[data-glass]') return this.dataset.glass !== undefined ? this : null; return this.id === 'sky' ? null : this; }
  setPointerCapture(i) { this.captures.add(i); }
  hasPointerCapture(i) { return this.captures.has(i); }
  releasePointerCapture(i) { this.captures.delete(i); }
  showModal() { this.open = true; }
  replaceChildren(...kids) { this.children = kids; }
  querySelectorAll() { return this.children; }
}
const elements = Object.fromEntries([...ids].map(id => [id, new Element(id)]));
elements.backdrop.complete = true; elements.backdrop.naturalWidth = 1088;
const chapters = [0, 1, 2].map(i => { const e = new Element('chapter'); e.dataset.chapter = String(i); return e; });
const dom = new Target(); dom.getElementById = id => elements[id]; dom.querySelectorAll = () => chapters; dom.createElement = tag => new Element(tag); dom.hidden = false;
const win = new Target(); win.devicePixelRatio = 1;
const media = new Target(); media.matches = false;
let resizeDisconnected = false;
class Resize { observe() {} disconnect() { resizeDisconnected = true; } }
const queue = new Map(); let sequence = 0, clock = 0;
const imports = { WORLD, CHAPTERS, createGame, start, beginTurn, previewTurn, endTurn, nudge, undo, hint, launch, tick, Observatory, GLASS_NAMES };
const api = new Function('document', 'window', 'matchMedia', 'ResizeObserver', 'requestAnimationFrame', 'cancelAnimationFrame', ...Object.keys(imports),
  app.replace(/^import .*?;\n/gm, '') + '\nreturn {state:()=>({game, paused, disposed, drag})};')(
  dom, win, () => media, Resize, fn => { queue.set(++sequence, fn); return sequence; }, id => queue.delete(id), ...Object.values(imports));
function advance(n = 1) { for (let i = 0; i < n; i++) { clock += 45; const a = [...queue.values()]; queue.clear(); a.forEach(fn => fn(clock)); assert(queue.size <= 1); } }
assert.equal(queue.size, 0); elements.start.emit('click'); advance(1); assert.equal(api.state().game.phase, 'playing');
const tap = { pointerId: 1, pointerType: 'touch', button: 0, clientX: 225, clientY: 395 };
elements.sky.emit('pointerdown', tap); elements.sky.emit('pointerup', tap); near(api.state().game.angles[0], STEP);
const before = [...api.state().game.angles];
elements.sky.emit('pointerdown', tap); elements.sky.emit('pointermove', { ...tap, clientX: 254 }); elements.sky.emit('pointercancel', tap); assert.deepEqual(api.state().game.angles, before);
elements.pause.emit('click'); assert(api.state().paused); assert.equal(queue.size, 0);
elements.resume.emit('click'); assert.equal(queue.size, 1);
elements.help.emit('click'); assert(elements['help-dialog'].open); assert.equal(queue.size, 0);
elements['help-dialog'].open = false; elements['help-dialog'].emit('close'); assert.equal(queue.size, 1);
dom.hidden = true; dom.emit('visibilitychange'); assert(api.state().paused); assert.equal(queue.size, 0);
dom.hidden = false; dom.emit('visibilitychange'); assert.equal(queue.size, 0);
elements.resume.emit('click'); chapters[2].emit('click'); assert.equal(api.state().game.chapter, 2); assert.equal(queue.size, 0);
elements.start.emit('click'); advance(2);
win.emit('pagehide', { persisted: true }); assert(api.state().paused); assert(!api.state().disposed);
win.emit('pageshow', { persisted: true }); assert.equal(queue.size, 0); elements.resume.emit('click');
elements.exit.emit('click', { ctrlKey: true }); assert(!api.state().disposed, 'new-tab link must not dispose current game');
elements['harbour-link'].emit('click'); assert(api.state().disposed); assert(resizeDisconnected); assert.equal(queue.size, 0);
elements.start.emit('click'); advance(4); assert.equal(queue.size, 0);
console.log('PASS: optics, authored paths via player controls, 512 combinations, 2000 seeded ray traces, shadow, cancellation, undo, bounded history, comet and reduced motion.');
console.log('PASS: CPU Canvas/DOM contracts, pointer input, help, visibility, pause, navigation and disposal. No browser or GPU launched.');
console.table(solvedRuns); console.log(`${calls} checked Canvas calls; ${solutions} intro solutions; ${loops} safely bounded loop arrangements.`);
