import {spriteKey} from '../prizes.js?v=ritual-3';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure, logAction, drawHud,
} from '../ride-seek.js?v=ride-seek-4';

const RIDE = 'organ';
const TREASURES = ['organ-music-box', 'star-token', 'moon-penny', 'swing-spinner', 'ride-ticket', 'aura-keepsake'];
const KEYS = [
  {id: 0, name: 'Pipe', color: '#c45a3a', glyph: '●'},
  {id: 1, name: 'Bell', color: '#d2a65b', glyph: '★'},
  {id: 2, name: 'Drum', color: '#3a7aaa', glyph: '■'},
];
const KEY_Y = 1040;
const KEY_W = 210;

function phrases(level) {
  const a = [0, 1, 2];
  const b = [2, 1, 0];
  const c = [0, 2, 1];
  if (level <= 0) return [a, a];
  if (level === 1) return [a, b];
  return [a, b, c].slice(0, Math.min(4, 2 + Math.floor(level / 2)));
}

function keyAt(p) {
  if (p.y < 920) return -1;
  const i = Math.floor((p.x - 75) / (KEY_W + 24));
  return i >= 0 && i < KEYS.length ? i : -1;
}

function beginGate(s) {
  s.gate = (s.gate || 0);
  s.phrase = s.phrases[s.gate] || s.phrases[0];
  s.phase = 'demo';
  s.phaseT = 0;
  s.heard = 0;
  s.typed = [];
  s.tries = 0;
  s.note = 'Watch the three notes.';
}

function openChamber(s) {
  s.correct += 1;
  s.phase = 'chamber';
  s.phaseT = 0;
  s.note = 'The door opens — look as you pass.';
  const findId = ['everyday-penny', 'star-token', 'moon-penny'][s.correct % 3];
  s.chamberFind = {id: findId, x: 620, y: 430, taken: false};
  if (s.eligible && s.spawnId === 'chamber-' + s.gate && !s.treasureCollected) {
    s.treasure = {id: s.treasureId, x: 300, y: 400, taken: false};
    s.treasureRevealed = true;
  } else s.treasure = null;
}

function missGate(s) {
  s.tries += 1;
  if (s.tries < 2 && s.level < 2) {
    s.phase = 'demo';
    s.phaseT = 0;
    s.heard = 0;
    s.typed = [];
    s.note = 'A cough from the pipes. Watch once more.';
    return;
  }
  s.phase = 'bypass';
  s.phaseT = 0;
  s.note = 'The ordinary corridor. Keep riding.';
  s.chamberFind = null;
  s.treasure = null;
}

function tapKey(s, i) {
  if (i < 0 || s.phase !== 'reply') return;
  logAction(s, 'key', {i, gate: s.gate});
  s.flash = i;
  s.typed.push(i);
  const need = s.phrase[s.typed.length - 1];
  if (i !== need) {
    missGate(s);
    return;
  }
  if (s.typed.length >= s.phrase.length) openChamber(s);
}

export default {
  title: 'Calliope Keys',
  intro: 'Otto’s paper roll carries you through the organ. Watch the notes, tap the brass keys, then look inside the opened chamber.',
  instructions: 'Three large keys. Watch the phrase, then tap it back. A correct phrase opens a chamber. The first ride of a chapter is free practice and keeps nothing.',
  levels: ['Three Bright Notes', 'Bell and Pipe', 'Paper Roll', 'Echo Chamber', 'Broken Bar', 'The Grand Calliope'],
  sprites: TREASURES.concat(['everyday-penny', 'star-token', 'moon-penny']),
  prizes: TREASURES,
  houseSeconds: 80,
  actions: KEYS.map((k, i) => ({id: 'k' + i, label: k.name + ' · ' + k.glyph})),
  create(level, rng) {
    const list = phrases(level);
    return makeRideState(level, rng, {
      phrases: list, phrase: list[0], gate: 0, correct: 0, goal: list.length, phase: 'demo', phaseT: 0,
      heard: 0, typed: [], tries: 0, flash: -1, scroll: 0, treasureId: TREASURES[level] || TREASURES[0],
    });
  },
  update(s, dt) {
    if (s.result || s.broke) return;
    if (ensureBoarded(s, RIDE, s.treasureId, s.phrases.map((_, i) => 'chamber-' + i))) beginGate(s);
    if (s.result) return;
    s.t += dt;
    s.scroll += dt * 80;
    s.phaseT += dt;
    s.progress = (s.gate + Math.min(1, s.phaseT / 6)) / Math.max(1, s.goal);
    if (s.phase === 'demo' && s.phrase) {
      s.heard = Math.min(s.phrase.length, Math.floor(s.phaseT / 0.7));
      if (s.phaseT > s.phrase.length * 0.7 + 0.45) {
        s.phase = 'reply';
        s.phaseT = 0;
        s.note = 'Tap the keys in that order.';
      }
    } else if (s.phase === 'chamber' || s.phase === 'bypass') {
      if (s.phaseT > 3.6) {
        s.gate += 1;
        if (s.gate >= s.goal) finishRide(s, {rideId: RIDE, treasureId: s.treasureId, challengeOk: s.correct >= s.goal, completionFind: 'star-token'});
        else beginGate(s);
      }
    }
  },
  action(s, id) {
    if (String(id).startsWith('k')) tapKey(s, Number(String(id).slice(1)));
  },
  pointer(s, type, p) {
    if (type === 'down') tapKey(s, keyAt(p));
    if (s.phase === 'chamber' && type === 'down') {
      if (s.chamberFind && !s.chamberFind.taken && Math.hypot(p.x - s.chamberFind.x, p.y - s.chamberFind.y) < 54) {
        s.chamberFind.taken = true;
        recordFind(s, s.chamberFind.id, RIDE);
        s.note = 'A little find in the pipes.';
      }
      if (s.treasure && !s.treasure.taken && Math.hypot(p.x - s.treasure.x, p.y - s.treasure.y) < 58) {
        s.treasure.taken = true;
        recordTreasure(s, s.treasure.id);
        s.note = 'The music-box keepsake! Ride to the printer.';
      }
    }
  },
  draw(s, d) {
    d.ellipse(450, 520, 420, 280, '#2a1814');
    d.poly([[80, 200], [820, 200], [780, 820], [120, 820]], '#4a1824', '#d2a65b', 4);
    for (let i = 0; i < 7; i++) {
      const x = 180 + i * 90;
      const h = 120 + (i % 3) * 40;
      d.ellipse(x, 360, 22, h, '#d2a65b', '#f0d09a', 2);
    }
    const phrase = s.phrase || s.phrases?.[0] || [0, 1, 2];
    const demoI = s.phase === 'demo' ? Math.min(phrase.length - 1, Math.floor((s.phaseT || 0) / 0.7)) : -1;
    KEYS.forEach((k, i) => {
      const x = 180 + i * (KEY_W + 24);
      const lit = s.flash === i || demoI >= 0 && phrase[demoI] === i;
      d.poly([[x - 90, KEY_Y - 70], [x + 90, KEY_Y - 70], [x + 90, KEY_Y + 70], [x - 90, KEY_Y + 70]], lit ? k.color : '#3a2418', '#f0d09a', 3);
      d.text(k.glyph, x, KEY_Y - 8, 42, '#fff6d8');
      d.text(k.name, x, KEY_Y + 36, 16, '#f0d09a');
    });
    if (s.chamberFind && !s.chamberFind.taken && s.phase === 'chamber') {
      d.glow(s.chamberFind.x, s.chamberFind.y, 40, '#ffe6a4');
      d.item(spriteKey(s.chamberFind.id), s.chamberFind.x, s.chamberFind.y, {w: 52, shadow: false, fallback: () => d.star(s.chamberFind.x, s.chamberFind.y, 14)});
    }
    if (s.treasure && !s.treasure.taken && s.phase === 'chamber') {
      d.glow(s.treasure.x, s.treasure.y, 56, '#f4d590');
      d.item(spriteKey(s.treasure.id), s.treasure.x, s.treasure.y, {w: 70, shadow: false, fallback: () => d.heart(s.treasure.x, s.treasure.y, 16)});
    }
    drawHud(d, s, {goal: s.goal, count: s.correct, label: 'gates'});
  },
  readout: s => s.note || '',
};
