import {VaultPuzzle, LEVELS, DIALS, STEP, wrap, aligned, moved, signedAngle} from './model.js';

const $ = id => document.getElementById(id);
const puzzle = new VaultPuzzle();
const abort = new AbortController(), signal = abort.signal;
let view, selected = 0, drag = null, ready = false, dead = false, sound = false, audio;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const say = message => { $('status').textContent = message; };
const on = (node, event, callback) => node.addEventListener(event, callback, {signal});

function tone(kind = 'tick') {
  if (!sound || !audio || audio.state !== 'running') return;
  const osc = audio.createOscillator(), gain = audio.createGain(), now = audio.currentTime;
  const freq = {tick: 420, ready: 760, locked: 140, open: 270, treasure: 960}[kind] || 420;
  osc.type = kind === 'tick' ? 'triangle' : 'sine'; osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * .6, now + .09);
  gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.045, now + .006);
  gain.gain.exponentialRampToValueAtTime(.0001, now + .12);
  osc.connect(gain); gain.connect(audio.destination); osc.start(now); osc.stop(now + .13);
  osc.onended = () => { osc.disconnect(); gain.disconnect(); };
}
function select(dial) {
  selected = (dial + 3) % 3;
  document.querySelectorAll('[data-dial]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.dial) === selected)));
  $('connection').textContent = LEVELS[puzzle.level].rules[selected];
}
function sync() {
  const lock = LEVELS[puzzle.level], solved = aligned(puzzle.positions), phase = puzzle.phase;
  $('chapter').textContent = lock.label;
  $('level-title').textContent = lock.title; $('story').textContent = lock.story;
  $('instruction').textContent = phase === 'locked' ? lock.instruction : phase === 'opening' ? 'The key is turning. Watch the bolts pull back before the door swings.' : phase === 'drawer' ? 'There is something in the false bottom. Pull the drawer towards you, or use the button below.' : 'A little machinery, a little paper—and something worth keeping.';
  $('turns').textContent = `${puzzle.turns} ${puzzle.turns === 1 ? 'turn' : 'turns'}`;
  for (let i = 0; i < 3; i++) {
    const done = wrap(puzzle.positions[i]) === 0;
    $(`lock-${i}`).classList.toggle('aligned', done);
    $(`lock-${i}`).textContent = `${done ? '◆' : '◇'} ${DIALS[i]}${done ? ' · set' : ''}`;
  }
  $('dial-controls').disabled = !ready || phase !== 'locked';
  $('undo').disabled = !ready || phase !== 'locked' || !puzzle.history.length;
  $('hint').disabled = !ready || phase !== 'locked' || solved;
  $('reset').disabled = !ready;
  $('action').hidden = phase === 'treasure';
  $('action').disabled = !ready || phase === 'opening' || (phase === 'locked' && !solved);
  $('action').textContent = phase === 'locked' ? (solved ? 'Turn the key & open →' : 'Align the three jewels') : phase === 'opening' ? 'The vault is opening…' : 'Pull the hidden drawer →';
  $('treasure-note').hidden = phase !== 'treasure';
  $('next').textContent = puzzle.level < LEVELS.length - 1 ? 'Try the next lock →' : 'Play the three locks again ↺';
  $('stage-note').textContent = phase === 'locked' ? solved ? 'THREE JEWELS SET · TURN THE LITTLE KEY' : 'DRAG THE BRASS · FEEL THE NOTCHES' : phase === 'opening' ? 'BOLTS BACK · A DOOR WITH A SECRET' : phase === 'drawer' ? 'PULL THE DRAWER TOWARDS YOU' : 'TURN THE BUTTERFLY’S KEY · WATCH ITS WINGS';
  $('rules').replaceChildren(...lock.rules.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
  select(selected);
}
function commit(dial, steps) {
  if (!ready || !puzzle.turn(dial, steps)) { view?.setPositions(puzzle.positions); return; }
  view.setPositions(puzzle.positions); sync();
  if (aligned(puzzle.positions)) { say('All three jewels are seated. Turn the little key beneath the rings—or press Open.'); tone('ready'); }
  else { say(`${DIALS[dial]} turned ${Math.abs(steps)} ${Math.abs(steps) === 1 ? 'notch' : 'notches'} ${steps > 0 ? 'clockwise' : 'anticlockwise'}. ${LEVELS[puzzle.level].rules[dial]}`); tone(); }
}
function act() {
  if (!ready || drag) return;
  if (puzzle.phase === 'locked') {
    if (!puzzle.open()) { say('The key catches. Bring all three jewels to their top sockets first.'); tone('locked'); return; }
    view.open(); tone('open'); say('The bolts are drawing back. There is something inside…'); sync();
  } else if (puzzle.phase === 'drawer') take();
}
function take() {
  if (!ready || !puzzle.take()) return;
  view.reveal(); sync(); tone('treasure'); say('A clockwork butterfly! Wind the key to wake its wings. This workshop treasure is not added to your saved collection.');
}
function release(cancelled = false) {
  if (!drag) return;
  const old = drag; drag = null;
  $('viewport').classList.remove('dragging');
  if ($('viewport').hasPointerCapture(old.id)) $('viewport').releasePointerCapture(old.id);
  if (!ready) return;
  if (old.type === 'dial') {
    if (!cancelled) commit(old.dial, Math.round(old.angle / STEP));
    else view.setPositions(puzzle.positions);
  } else if (old.type === 'drawer') {
    if (!cancelled && old.pull >= .83) take();
    else { view.pull(0); if (!cancelled) say('Pull the drawer further towards you. Its contents stay safely inside.'); }
  } else if (old.type === 'wind') view.wind(false);
}
function reset(level = puzzle.level) {
  release(true); view?.wind(false); puzzle.reset(level); selected = 0;
  view?.reset(puzzle.positions); sync(); say('A fresh lock. Take your time; undo and hints are here if you need them.');
}
function fail(message) {
  ready = false; release(true); view?.destroy(); sync();
  $('loading').hidden = true; $('failure').hidden = false;
  if (message) $('failure-copy').textContent = message;
}

on($('reload'), 'click', () => location.reload());
on($('sound'), 'click', async () => {
  sound = !sound;
  try {
    if (sound) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error('Audio unavailable');
      audio ||= new Audio(); await audio.resume();
    } else if (audio) await audio.suspend();
  } catch { sound = false; say('Sound is unavailable here. The vault works silently too.'); }
  if (dead) return;
  $('sound').setAttribute('aria-pressed', String(sound)); $('sound').textContent = sound ? 'Sound on' : 'Sound off'; tone();
});
document.querySelectorAll('[data-dial]').forEach(b => on(b, 'click', () => select(Number(b.dataset.dial))));
on($('left'), 'click', () => commit(selected, -1)); on($('right'), 'click', () => commit(selected, 1));
on($('action'), 'click', act);
on($('reset'), 'click', () => reset());
on($('undo'), 'click', () => { release(true); if (puzzle.undo()) { view.setPositions(puzzle.positions); sync(); say('Last turn undone.'); tone(); } });
on($('hint'), 'click', () => {
  release(true); const hint = puzzle.hint();
  if (hint) { select(hint.dial); say(`Digby whispers: “Try ${DIALS[hint.dial]} one notch ${hint.step > 0 ? 'clockwise' : 'anticlockwise'}.” Nothing moved for you.`); }
});
on($('next'), 'click', () => { reset((puzzle.level + 1) % LEVELS.length); $('viewport').scrollIntoView({behavior: reduced.matches ? 'instant' : 'smooth', block: 'center'}); $('viewport').focus({preventScroll: true}); });

on($('viewport'), 'pointerdown', e => {
  if (!ready || drag || e.button !== 0 || puzzle.phase === 'opening') return;
  const hit = view.pick(e.clientX, e.clientY); if (!hit) return;
  if (hit.type === 'dial' && puzzle.phase !== 'locked') return;
  if (hit.type === 'handle') { e.preventDefault(); act(); return; }
  if (hit.type === 'drawer' && puzzle.phase !== 'drawer') return;
  if (hit.type === 'wind' && puzzle.phase !== 'treasure') return;
  e.preventDefault(); $('viewport').focus({preventScroll: true});
  if (hit.type === 'dial') {
    const at = view.dialPoint(e.clientX, e.clientY); if (at === null) return;
    select(hit.dial); drag = {...hit, id: e.pointerId, previous: at, angle: 0, notch: 0};
  } else if (hit.type === 'drawer') drag = {...hit, id: e.pointerId, y: e.clientY, pull: 0};
  else if (hit.type === 'wind') { drag = {...hit, id: e.pointerId, previous: e.clientX}; view.wind(true); }
  if (drag) { $('viewport').setPointerCapture(e.pointerId); $('viewport').classList.add('dragging'); }
});
on($('viewport'), 'pointermove', e => {
  if (!ready || drag?.id !== e.pointerId) return; e.preventDefault();
  if (drag.type === 'dial') {
    const angle = view.dialPoint(e.clientX, e.clientY); if (angle === null) return;
    drag.angle = Math.max(-Math.PI * 10, Math.min(Math.PI * 10, drag.angle + signedAngle(angle - drag.previous))); drag.previous = angle;
    // Follow the hand directly, then settle into the nearest notch after release.
    view.setPositions(moved(puzzle.positions, puzzle.level, drag.dial, drag.angle / STEP), true);
    const notch = Math.round(drag.angle / STEP); if (notch !== drag.notch) { drag.notch = notch; tone(); }
  } else if (drag.type === 'drawer') {
    drag.pull = Math.max(0, Math.min(1, (e.clientY - drag.y) / Math.min(160, $('viewport').clientHeight * .28)));
    view.pull(drag.pull);
  }
});
on($('viewport'), 'pointerup', e => { if (drag?.id === e.pointerId) release(); });
for (const event of ['pointercancel', 'lostpointercapture']) on($('viewport'), event, e => { if (drag?.id === e.pointerId) release(true); });
on($('viewport'), 'keydown', e => {
  if (!ready) return;
  if (e.key === 'Escape') { release(true); view.wind(false); return; }
  if (e.key === ' ' && puzzle.phase === 'treasure') { e.preventDefault(); view.wind(true); return; }
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
    e.preventDefault(); if (drag) return;
    if (e.key === 'Enter') act();
    else if (puzzle.phase === 'locked') {
      if (e.key === 'ArrowUp') select(selected - 1);
      else if (e.key === 'ArrowDown') select(selected + 1);
      else commit(selected, e.key === 'ArrowLeft' ? -1 : 1);
    }
  }
});
on($('viewport'), 'keyup', e => { if (e.key === ' ') view?.wind(false); });
on($('viewport'), 'blur', () => { release(true); view?.wind(false); });

const windButton = $('wind');
on(windButton, 'pointerdown', e => { if (!ready || puzzle.phase !== 'treasure' || e.button !== 0) return; e.preventDefault(); windButton.setPointerCapture(e.pointerId); view.wind(true); });
for (const event of ['pointerup', 'pointercancel', 'lostpointercapture', 'blur']) on(windButton, event, () => view?.wind(false));
on(windButton, 'keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (ready && puzzle.phase === 'treasure') view.wind(true); } });
on(windButton, 'keyup', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); view?.wind(false); } });
on(window, 'blur', () => { release(true); view?.wind(false); });
on(document, 'visibilitychange', () => {
  if (document.hidden) { release(true); view?.wind(false); audio?.suspend(); }
  else if (sound) audio?.resume().catch(() => {});
});
on(reduced, 'change', () => { if (view) { view.reduced = reduced.matches; view.wake(); } });
on(window, 'pagehide', () => {
  dead = true; release(true); ready = false; view?.destroy(); audio?.close(); abort.abort();
});
// A back/forward-cache entry had its renderer disposed; build one clean instance.
window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });

try {
  const {VaultView} = await import('./scene.js');
  if (!dead) {
    view = new VaultView($('viewport'), {reduced: reduced.matches, fail, motionDone: () => { puzzle.doorOpened(); sync(); say('The door is open. Pull the little drawer towards you.'); }});
    ready = true; $('loading').hidden = true; view.reset(puzzle.positions); sync();
  }
} catch (error) {
  console.warn('Clockwork workshop could not start:', error);
  if (!dead) fail('The 3D workbench could not start. Try reloading in Chromium. Nothing in your regular game or wallet was changed.');
}
