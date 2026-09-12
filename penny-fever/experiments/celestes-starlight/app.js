import { WORLD, CHAPTERS, createGame, start, beginTurn, previewTurn, endTurn, nudge, undo, hint, launch, tick } from './model.js';
import { Observatory, GLASS_NAMES } from './scene.js';

const $ = id => document.getElementById(id), canvas = $('sky');
const lifetime = new AbortController();
const on = (el, event, fn) => el.addEventListener(event, fn, { signal: lifetime.signal });
let scene;
try { scene = new Observatory(canvas); }
catch (e) { $('load-error').hidden = false; $('load-error').textContent = e.message; $('start').disabled = true; throw e; }
let game = createGame(), paused = false, disposed = false, imageOK = false;
let raf = 0, lastFrame = null, visualTime = 0, winUntil = 0, drag = null;
let helpResume = false, audio = null, soundOn = false;
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const active = () => game.phase === 'playing' || game.phase === 'flying';
function say(text) { if ($('feedback').textContent !== text) $('feedback').textContent = text; }
function sync() {
  const chapter = CHAPTERS[game.chapter], editable = game.phase === 'playing' && !paused;
  $('chapter-name').textContent = chapter.title;
  $('progress').textContent = `${game.ray.lit.filter(Boolean).length} / ${chapter.stars.length} stars lit`;
  $('selected').textContent = GLASS_NAMES[game.selected];
  $('welcome').hidden = game.phase !== 'ready'; $('result').hidden = game.phase !== 'won';
  $('paused').hidden = !paused || !active() || $('help-dialog').open;
  $('left').disabled = $('right').disabled = $('hint').disabled = !editable || Boolean(game.gesture);
  $('undo').disabled = !editable || Boolean(game.gesture) || !game.history.length;
  $('send').disabled = !editable || Boolean(game.gesture) || !game.ray.solved;
  $('send').textContent = game.phase === 'flying' ? 'On its way…' : game.ray.solved ? 'Send the comet ✦' : game.ray.lit.every(Boolean) ? 'Reach the sky bell' : 'Light every star';
  $('pause').disabled = !active(); $('pause').textContent = paused ? 'Resume' : 'Pause';
  $('start').disabled = !imageOK;
  for (const b of document.querySelectorAll('[data-chapter]')) b.setAttribute('aria-pressed', String(Number(b.dataset.chapter) === game.chapter));
  for (const b of $('glass-picker').querySelectorAll('button')) {
    b.setAttribute('aria-pressed', String(Number(b.dataset.glass) === game.selected)); b.disabled = !editable;
  }
}
function paint() { scene.render(game, visualTime, motion.matches); }
function cancelFrame() { if (raf) cancelAnimationFrame(raf); raf = 0; lastFrame = null; }
function cancelInput() {
  if (game.gesture) endTurn(game, true);
  const id = drag?.id; drag = null;
  if (id !== undefined && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
}
function wake() { if (!disposed && !paused && !document.hidden && !raf) raf = requestAnimationFrame(frame); }
function chime(kind = 'turn') {
  if (!soundOn || !audio || audio.state !== 'running') return;
  const at = audio.currentTime, count = kind === 'won' ? 3 : 1;
  for (let i = 0; i < count; i++) {
    const osc = audio.createOscillator(), gain = audio.createGain(), time = at + i * .12;
    osc.type = 'sine'; osc.frequency.value = (kind === 'turn' ? 420 : 660) * (1 + i * .25);
    gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(.035, time + .01); gain.gain.exponentialRampToValueAtTime(.0001, time + .27);
    osc.connect(gain); gain.connect(audio.destination); osc.start(time); osc.stop(time + .3);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
}
function guidance() {
  if (game.ray.solved) say('You’ve made a path! Send the comet and wake your constellation.');
  else if (game.ray.loop) say('The light is going round in circles. Turn a glass to give it a way out.');
  else if (game.ray.blocked === 'moon') say('The moon is in the way. Can you guide the light around it?');
  else if (game.ray.receiverLit) say('The sky bell is lit. A few hanging stars still need your light.');
  else say(`Glass ${GLASS_NAMES[game.selected]} selected. Tap to turn again, or use ↶ and ↷.`);
}
function changed(sound = true) { if (sound) chime(); guidance(); sync(); paint(); wake(); }
function rotate(direction) { if (!paused && nudge(game, game.selected, direction)) changed(); }
function frame(now) {
  raf = 0;
  if (disposed || paused || document.hidden) { lastFrame = null; return; }
  if (lastFrame !== null && now - lastFrame < 1000 / 24) { raf = requestAnimationFrame(frame); return; }
  const dt = lastFrame === null ? 0 : Math.min(.08, (now - lastFrame) / 1000);
  lastFrame = now; visualTime += dt;
  const previous = game.phase; tick(game, dt, motion.matches);
  if (previous === 'flying' && game.phase === 'won') {
    winUntil = visualTime + (motion.matches ? 0 : 3); chime('won');
    $('result-title').textContent = CHAPTERS[game.chapter].name + ' awakens.';
    $('result-copy').textContent = ['A little paper bird, folded from the light you found.', 'A curious little fox has wandered out of your stars.', 'The moon kept its secret. You found the way around.'][game.chapter];
    $('result-stats').textContent = `${game.turns} turns · ${game.hints} ${game.hints === 1 ? 'hint' : 'hints'} · playtest souvenir`;
    $('next').textContent = game.chapter === 2 ? 'Back to the first sky ↻' : 'Next constellation →';
    say('A new little wonder has woken. Which sky shall we try next?'); sync(); $('next').focus({ preventScroll: true });
  }
  paint();
  if ((active() && (!motion.matches || game.phase === 'flying')) || visualTime < winUntil) raf = requestAnimationFrame(frame); else lastFrame = null;
}
function setPaused(value) {
  if (!active()) return;
  paused = value; cancelInput(); cancelFrame();
  if (paused) audio?.suspend().catch(() => {}); else if (soundOn) audio?.resume().catch(() => {});
  sync(); paint(); if (!paused) { canvas.focus({ preventScroll: true }); wake(); }
}
function rebuildPicker() {
  const buttons = game.angles.map((_, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.glass = String(i); b.textContent = GLASS_NAMES[i];
    b.setAttribute('aria-label', `Select Glass ${GLASS_NAMES[i]}`); return b;
  });
  $('glass-picker').replaceChildren(...buttons);
}
function choose(index) {
  cancelInput(); cancelFrame(); game = createGame(index); paused = false; visualTime = 0; winUntil = 0;
  rebuildPicker(); say(CHAPTERS[game.chapter].line); sync(); paint();
}
function begin() {
  if (!imageOK) return;
  start(game); sync(); say('Tap the glowing brass Glass I. Watch the light change direction.');
  canvas.focus({ preventScroll: true }); wake();
}
function sendComet() {
  if (paused || !launch(game)) return;
  cancelInput(); say('Follow your comet through the path you made…'); chime('send'); sync(); paint(); wake();
}
function point(event) {
  const r = canvas.getBoundingClientRect();
  return [(event.clientX - r.left) / r.width * WORLD.width, (event.clientY - r.top) / r.height * WORLD.height];
}
on(canvas, 'pointerdown', e => {
  if (game.phase !== 'playing' || paused || drag || e.button !== 0) return;
  const p = point(e), mirrors = CHAPTERS[game.chapter].mirrors;
  let index = -1, best = 78;
  mirrors.forEach((m, i) => { const d = Math.hypot(p[0] - m[0], p[1] - m[1]); if (d < best) { best = d; index = i; } });
  if (index < 0 || !beginTurn(game, index)) return;
  e.preventDefault(); const center = mirrors[index];
  drag = { id: e.pointerId, index, from: game.angles[index], center, centerDrag: best < 20, lastAngle: Math.atan2(p[1] - center[1], p[0] - center[0]), total: 0, x: e.clientX, y: e.clientY, moved: false };
  canvas.setPointerCapture(e.pointerId); canvas.focus({ preventScroll: true }); sync(); paint();
});
on(canvas, 'pointermove', e => {
  if (!drag || drag.id !== e.pointerId) return;
  const p = point(e), angle = Math.atan2(p[1] - drag.center[1], p[0] - drag.center[0]);
  drag.total += Math.atan2(Math.sin(angle - drag.lastAngle), Math.cos(angle - drag.lastAngle)); drag.lastAngle = angle;
  if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 7) drag.moved = true;
  if (drag.moved) { previewTurn(game, drag.from + (drag.centerDrag ? (e.clientX - drag.x) * .025 : drag.total)); sync(); paint(); }
});
function finishPointer(e, cancel = false) {
  if (!drag || drag.id !== e.pointerId) return;
  const previous = drag; drag = null;
  if (canvas.hasPointerCapture(previous.id)) canvas.releasePointerCapture(previous.id);
  if (cancel) { endTurn(game, true); changed(false); }
  else if (previous.moved) { const did = endTurn(game); changed(did); }
  else { endTurn(game, true); nudge(game, previous.index, 1); changed(); }
}
on(canvas, 'pointerup', e => finishPointer(e));
on(canvas, 'pointercancel', e => finishPointer(e, true));
on(canvas, 'lostpointercapture', e => finishPointer(e, true));
on(canvas, 'contextmenu', e => e.preventDefault());
on($('left'), 'click', () => rotate(-1)); on($('right'), 'click', () => rotate(1));
on($('glass-picker'), 'click', e => {
  const b = e.target.closest('[data-glass]'); if (!b || game.phase !== 'playing' || paused || game.gesture) return;
  game.selected = Number(b.dataset.glass); guidance(); sync(); paint(); canvas.focus({ preventScroll: true });
});
on($('undo'), 'click', () => { if (undo(game)) changed(false); });
on($('hint'), 'click', () => {
  const h = hint(game);
  if (h) { say(`Glass ${GLASS_NAMES[h.index]}: ${h.text} Try ${Math.abs(h.clicks)} ${h.clicks > 0 ? 'clockwise ↷' : 'anticlockwise ↶'} ${Math.abs(h.clicks) === 1 ? 'notch' : 'notches'}.`); sync(); paint(); }
  else guidance();
});
on(document, 'keydown', e => {
  if ($('help-dialog').open || e.target.closest('button,a,input,select,textarea')) return;
  if (e.key.toLowerCase() === 'p' && !e.repeat) { e.preventDefault(); setPaused(!paused); return; }
  if (game.phase !== 'playing' || paused || game.gesture) return;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); rotate(e.key === 'ArrowLeft' ? -1 : 1); }
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); game.selected = (game.selected + (e.key === 'ArrowDown' ? 1 : game.angles.length - 1)) % game.angles.length; guidance(); sync(); paint(); }
  if (e.key === 'Enter') { e.preventDefault(); sendComet(); }
});
on($('start'), 'click', begin); on($('send'), 'click', sendComet);
on($('next'), 'click', () => { choose((game.chapter + 1) % CHAPTERS.length); begin(); });
on($('replay'), 'click', () => { choose(game.chapter); begin(); });
on($('restart'), 'click', () => { choose(game.chapter); $('start').focus({ preventScroll: true }); });
for (const b of document.querySelectorAll('[data-chapter]')) on(b, 'click', () => {
  choose(Number(b.dataset.chapter)); $('stage').scrollIntoView({ block: 'center', behavior: 'auto' }); $('start').focus({ preventScroll: true });
});
on($('pause'), 'click', () => setPaused(!paused)); on($('resume'), 'click', () => setPaused(false));
on($('help'), 'click', () => { helpResume = active() && !paused; setPaused(true); $('help-dialog').showModal(); sync(); });
on($('help-dialog'), 'close', () => { if (helpResume && !document.hidden) setPaused(false); else sync(); });
on(window, 'blur', () => { if (active()) setPaused(true); });
on(document, 'visibilitychange', () => {
  if (document.hidden) { if (active()) setPaused(true); cancelFrame(); audio?.suspend().catch(() => {}); }
  else { paint(); if (!paused && active()) wake(); }
});
on($('sound'), 'click', async () => {
  try {
    if (!audio) { const Audio = window.AudioContext || window.webkitAudioContext; if (!Audio) throw new Error('No audio'); audio = new Audio(); }
    soundOn = !soundOn;
    if (soundOn) { await audio.resume(); chime('send'); } else await audio.suspend();
  } catch { soundOn = false; say('This browser is keeping the observatory quiet. The puzzle still works.'); }
  $('sound').textContent = soundOn ? 'Sound on' : 'Sound off'; $('sound').setAttribute('aria-pressed', String(soundOn));
});
function resize() { if (!disposed) { const r = $('stage').getBoundingClientRect(); scene.resize(r.width, r.height, window.devicePixelRatio || 1); paint(); } }
const observer = new ResizeObserver(resize); observer.observe($('stage'));
on(motion, 'change', () => { paint(); if (active() && !paused) wake(); });
function imageReady() { imageOK = $('backdrop').naturalWidth > 0; if (!imageOK) return imageFailed(); $('load-error').hidden = true; sync(); resize(); }
function imageFailed() {
  imageOK = false; if (active()) setPaused(true);
  $('load-error').hidden = false; $('load-error').textContent = 'The observatory picture did not arrive. Reload this local preview to try again; nothing has been spent or saved.'; sync();
}
on($('backdrop'), 'load', imageReady); on($('backdrop'), 'error', imageFailed);
function dispose() {
  if (disposed) return;
  cancelInput(); disposed = true; cancelFrame(); observer.disconnect(); lifetime.abort(); scene.dispose(); audio?.close().catch(() => {}); audio = null;
}
function leaving(e) { if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && !e.defaultPrevented && (e.button === 0 || e.button === undefined)) dispose(); }
if (window.parent !== window) {
  $('exit').textContent = '← Back to the alley';
  $('exit').setAttribute('href', '../../index.html?style=paper&rail=paper&v=paper-alley-live-1#alley');
  $('exit').setAttribute('target', '_parent');
}
on($('exit'), 'click', (event) => {
  leaving(event);
  if (window.parent !== window && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
    event.preventDefault();
    try {
      window.parent.PennyFeverWorld?.stepOut?.('lookup');
      window.parent.location.hash = 'alley';
    } catch (_) { /* stay here */ }
  }
});
on($('harbour-link'), 'click', leaving);
on(window, 'pagehide', e => { if (e.persisted) { if (active()) setPaused(true); cancelFrame(); } else dispose(); });
on(window, 'pageshow', e => { if (e.persisted && !disposed) { resize(); sync(); } });
choose(0); if ($('backdrop').complete) imageReady();
