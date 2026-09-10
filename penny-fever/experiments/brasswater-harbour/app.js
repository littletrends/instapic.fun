import { WORLD, COURSES, createGame, startGame, step, allLetters } from './model.js';
import { HarbourScene } from './scene.js';

const $ = id => document.getElementById(id);
const canvas = $('sea');
const lifetime = new AbortController();
const on = (el, event, handler, options = {}) => el.addEventListener(event, handler, { ...options, signal: lifetime.signal });
let scene;
try { scene = new HarbourScene(canvas); }
catch (error) { $('load-error').hidden = false; $('load-error').textContent = error.message; $('launch').disabled = true; throw error; }
let game = createGame(), paused = false, disposed = false, raf = 0, lastFrame = null;
let visualTime = 0, celebrationUntil = 0, imageOK = false;
let pointer = null, pointerId = null, held = false, anchorHeld = false;
const keys = new Set();
let feedbackUntil = 0, lastFeedback = '', wasPlayingBeforeHelp = false;
let audio = null, soundEnabled = false;
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');

function say(message, seconds = 0) {
  if (lastFeedback !== message) { $('feedback').textContent = message; lastFeedback = message; }
  feedbackUntil = visualTime + seconds;
}
function clearInput() {
  held = false; pointer = null; anchorHeld = false; keys.clear();
  const id = pointerId; pointerId = null;
  if (id !== null && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  $('anchor').setAttribute('aria-pressed', 'false');
}
function sync() {
  $('course-name').textContent = COURSES[game.course].name;
  $('letters').textContent = `${game.letters.filter(Boolean).length} / 3 letters`;
  $('pressure').value = game.pressure;
  $('anchor').disabled = game.phase !== 'playing' || paused;
  $('anchor').setAttribute('aria-pressed', String(anchorHeld || keys.has(' ')));
  $('pause').disabled = game.phase !== 'playing';
  $('pause').textContent = paused ? 'Resume' : 'Pause';
  $('welcome').hidden = game.phase !== 'ready';
  $('result').hidden = game.phase !== 'won';
  $('pause-note').hidden = !paused || game.phase !== 'playing' || $('help-dialog').open;
  $('launch').disabled = !imageOK;
  for (const button of document.querySelectorAll('[data-course]')) button.setAttribute('aria-pressed', String(Number(button.dataset.course) === game.course));
}
function input() {
  const dx = Number(keys.has('arrowright') || keys.has('d')) - Number(keys.has('arrowleft') || keys.has('a'));
  const dy = Number(keys.has('arrowdown') || keys.has('s')) - Number(keys.has('arrowup') || keys.has('w'));
  if (dx || dy) {
    const norm = Math.hypot(dx, dy);
    return { active: true, x: game.boat.x - dx / norm * 90, y: game.boat.y - dy / norm * 90, anchor: anchorHeld || keys.has(' ') };
  }
  return { active: held, x: pointer?.x, y: pointer?.y, anchor: anchorHeld || keys.has(' ') };
}
function sound(type) {
  if (!soundEnabled || !audio || audio.state !== 'running') return;
  const base = type === 'bump' ? 135 : type === 'won' ? 659 : 523;
  const now = audio.currentTime;
  for (let i = 0; i < (type === 'won' ? 3 : 1); i++) {
    const tone = audio.createOscillator(), gain = audio.createGain();
    const t = now + i * .11;
    tone.type = type === 'bump' ? 'sine' : 'triangle'; tone.frequency.value = base * (1 + i * .25);
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(.035, t + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, t + .28);
    tone.connect(gain); gain.connect(audio.destination); tone.start(t); tone.stop(t + .3);
    tone.onended = () => { tone.disconnect(); gain.disconnect(); };
  }
}
function handleEvents() {
  for (const e of game.events) {
    scene.event(e, visualTime); sound(e.type);
    if (e.type === 'letter') say(allLetters(game) ? 'All aboard! Bring the letters to the golden berth at the top.' : 'One safely aboard. On to the next floating letter!', 4);
    if (e.type === 'bump') say('A little bump. Nothing broken—try a gentler burst.', 2);
    if (e.type === 'won') {
      clearInput(); celebrationUntil = visualTime + (motionQuery.matches ? 0 : 3);
      $('rating').textContent = '✦'.repeat(game.rating) + '·'.repeat(3 - game.rating);
      $('rating').setAttribute('aria-label', `${game.rating} of 3 voyage seals`);
      $('result-copy').textContent = ['Marina has put the kettle on. Every letter is home.', 'Through the tide and safely home. A proper little captain.', 'The ferry can wait. Your special delivery has arrived.'][game.course];
      $('result-stats').textContent = `${Math.round(game.time)} seconds · ${game.bumps} gentle ${game.bumps === 1 ? 'bump' : 'bumps'}. One seal for delivery, one for at most 4 bumps, one for ${COURSES[game.course].par}s or less.`;
      $('next').textContent = game.course === 2 ? 'Back to the first voyage ↻' : 'Next voyage →';
      say('Delivered! Choose another voyage, or sail this one again.');
      sync();
      $('next').focus({ preventScroll: true });
    }
  }
}
function guidance() {
  if (game.phase !== 'playing' || visualTime < feedbackUntil) return;
  if (game.pressure < .08) say('Let go for a moment—the water tank needs to refill.');
  else if (game.dockTime > .02) say('That’s it. Hold steady while the letters are delivered…');
  else if (allLetters(game)) say('Find the golden berth at the top. Release the jet and hold to moor.');
  else if (held && !game.jet) say('Bring the jet nearer—hold just behind the boat to push it away.');
  else say(COURSES[game.course].hint);
}
function paint() {
  scene.render(game, { time: visualTime, pointer, reduced: motionQuery.matches });
}
function frame(now) {
  raf = 0;
  if (disposed || document.hidden || paused) { lastFrame = null; return; }
  if (lastFrame !== null && now - lastFrame < 1000 / 30) { raf = requestAnimationFrame(frame); return; }
  const dt = lastFrame === null ? 0 : Math.min(.06, (now - lastFrame) / 1000);
  lastFrame = now; visualTime += dt;
  if (game.phase === 'playing') { step(game, input(), dt); handleEvents(); guidance(); }
  sync(); paint();
  if (game.phase === 'playing' || visualTime < celebrationUntil) raf = requestAnimationFrame(frame);
  else lastFrame = null;
}
function wake() {
  if (!disposed && !document.hidden && !paused && !raf) raf = requestAnimationFrame(frame);
}
function cancelFrame() { if (raf) cancelAnimationFrame(raf); raf = 0; lastFrame = null; }
function setPaused(value) {
  if (game.phase !== 'playing') return;
  paused = value; clearInput(); cancelFrame();
  if (paused) audio?.suspend().catch(() => {});
  else if (soundEnabled) audio?.resume().catch(() => {});
  sync(); paint(); if (!paused) { canvas.focus({ preventScroll: true }); wake(); }
}
function selectCourse(index) {
  clearInput(); cancelFrame(); game = createGame(index); paused = false;
  visualTime = 0; celebrationUntil = 0; scene.clearEffects();
  say(COURSES[game.course].subtitle); sync(); paint();
}
function launch() {
  if (!imageOK) return;
  startGame(game); paused = false; clearInput(); sync();
  canvas.focus({ preventScroll: true }); say('Try a short burst in the water just below the boat.', 5); wake();
}
function position(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: (event.clientX - rect.left) / rect.width * WORLD.width, y: (event.clientY - rect.top) / rect.height * WORLD.height };
}
on(canvas, 'pointerdown', e => {
  if (game.phase !== 'playing' || paused || pointerId !== null || e.button !== 0) return;
  e.preventDefault(); pointerId = e.pointerId; held = true; pointer = position(e);
  canvas.setPointerCapture(pointerId); canvas.focus({ preventScroll: true }); wake();
});
on(canvas, 'pointermove', e => {
  if (pointerId !== null && e.pointerId !== pointerId) return;
  if (game.phase === 'playing' && !paused) pointer = position(e);
});
function releasePointer(e) {
  if (pointerId !== e.pointerId) return;
  const id = pointerId; pointerId = null; held = false;
  if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  if (e.pointerType !== 'mouse' || e.type !== 'pointerup') pointer = null;
}
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) on(canvas, ev, releasePointer);
on(canvas, 'pointerleave', () => { if (!held) pointer = null; });
on(canvas, 'contextmenu', e => e.preventDefault());
on($('anchor'), 'pointerdown', e => {
  if (game.phase !== 'playing' || paused || e.button !== 0) return;
  e.preventDefault(); anchorHeld = true; $('anchor').setPointerCapture(e.pointerId); sync();
});
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) on($('anchor'), ev, () => { anchorHeld = false; sync(); });
on($('anchor'), 'keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); anchorHeld = true; sync(); } });
on($('anchor'), 'keyup', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); anchorHeld = false; sync(); } });
on($('anchor'), 'blur', () => { anchorHeld = false; sync(); });
on(document, 'keydown', e => {
  if ($('help-dialog').open || e.target.closest('button,a,input,select,textarea')) return;
  const key = e.key.toLowerCase();
  if (key === 'p' && !e.repeat) { e.preventDefault(); setPaused(!paused); return; }
  if (game.phase !== 'playing' || paused) return;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(key)) { e.preventDefault(); keys.add(key); }
});
on(document, 'keyup', e => keys.delete(e.key.toLowerCase()));
on(window, 'blur', () => { clearInput(); if (game.phase === 'playing') setPaused(true); });
on(document, 'visibilitychange', () => {
  if (document.hidden) { clearInput(); cancelFrame(); if (game.phase === 'playing') setPaused(true); audio?.suspend().catch(() => {}); }
  else { paint(); if (!paused) wake(); }
});
on($('launch'), 'click', launch);
on($('pause'), 'click', () => setPaused(!paused));
on($('resume'), 'click', () => setPaused(false));
on($('restart'), 'click', () => { selectCourse(game.course); $('launch').focus({ preventScroll: true }); });
on($('replay'), 'click', () => { selectCourse(game.course); launch(); });
on($('next'), 'click', () => { selectCourse((game.course + 1) % COURSES.length); launch(); });
for (const button of document.querySelectorAll('[data-course]')) on(button, 'click', () => {
  selectCourse(Number(button.dataset.course)); $('harbour').scrollIntoView({ block: 'center', behavior: 'auto' });
  $('launch').focus({ preventScroll: true });
});
on($('help'), 'click', () => {
  wasPlayingBeforeHelp = game.phase === 'playing' && !paused;
  setPaused(true); $('help-dialog').showModal(); sync();
});
on($('help-dialog'), 'close', () => { if (wasPlayingBeforeHelp && !document.hidden) setPaused(false); else sync(); });
on($('sound'), 'click', async () => {
  try {
    if (!audio) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error('Audio unavailable');
      audio = new Audio();
    }
    soundEnabled = !soundEnabled;
    if (soundEnabled) { await audio.resume(); sound('letter'); }
    else await audio.suspend();
    $('sound').textContent = soundEnabled ? 'Sound on' : 'Sound off';
    $('sound').setAttribute('aria-pressed', String(soundEnabled));
  } catch { soundEnabled = false; say('Sound is unavailable here. The harbour still plays silently.', 4); }
});
const resize = () => {
  if (disposed) return;
  const r = $('harbour').getBoundingClientRect();
  scene.resize(r.width, r.height, window.devicePixelRatio || 1); paint();
};
const observer = new ResizeObserver(resize); observer.observe($('harbour'));
on(motionQuery, 'change', () => { scene.clearEffects(); paint(); });
function imageReady() {
  imageOK = $('backdrop').naturalWidth > 0;
  if (!imageOK) return imageFailed();
  $('load-error').hidden = true; sync(); resize();
}
function imageFailed() {
  imageOK = false; if (game.phase === 'playing') setPaused(true);
  $('load-error').hidden = false;
  $('load-error').textContent = 'The harbour picture did not arrive. Reload this local preview to try again; no progress or coins have been spent.';
  sync();
}
on($('backdrop'), 'load', imageReady); on($('backdrop'), 'error', imageFailed);
if ($('backdrop').complete) imageReady();
function dispose() {
  if (disposed) return;
  clearInput(); disposed = true; cancelFrame(); lifetime.abort(); observer.disconnect(); scene.dispose();
  audio?.close().catch(() => {}); audio = null;
}
if (window.parent !== window) {
  $('exit').textContent = '← Back to the alley';
  $('exit').setAttribute('href', '../../#alley');
  $('exit').setAttribute('target', '_parent');
}
on($('exit'), 'click', (event) => {
  dispose();
  if (window.parent !== window) {
    event.preventDefault();
    try { window.parent.location.hash = 'alley'; } catch (_) { /* stay on this page */ }
  }
});
on(window, 'pagehide', e => { if (e.persisted) { setPaused(true); cancelFrame(); } else dispose(); });
on(window, 'pageshow', e => { if (e.persisted && !disposed) { resize(); sync(); } });
selectCourse(0);
