/*
 * Calliope Keys (organ) — Amusement 2 · Otto
 * LOCKED remix: organ as cockpit. Notes climb brass pipes. TAP the live mouth.
 * Tempest lanes + piano-tile timing + instrument-panel clarity. Not Simon-says.
 *
 * SHIPPED: Chapter 1 Three Bright Notes.
 * UNFINISHED: Bell and Pipe · Paper Roll · Echo Chamber · Broken Bar · The Grand Calliope
 *
 * organ.png is the court behind the canvas. Do not paint a full-screen background.
 */
import {clamp} from '../draw.js';
import {spriteKey} from '../prizes.js?v=ritual-3';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure, logAction, drawHud,
  prefersReducedMotion,
} from '../ride-seek.js?v=ride-seek-4';

const RIDE = 'organ';
const ORDINARY = ['everyday-penny', 'star-token', 'moon-penny'];
const TREASURES = [
  'organ-music-box', 'star-token', 'moon-penny',
  'swing-spinner', 'ride-ticket', 'aura-keepsake',
];
const LEVEL_NAMES = [
  'Three Bright Notes',
  'Bell and Pipe',
  'Paper Roll',
  'Echo Chamber',
  'Broken Bar',
  'The Grand Calliope',
];

const TAU = Math.PI * 2;
const GOLD = '#e8c878';
const CREAM = '#efe6d0';
const INK = '#f0d18f';
const MOUTH_R = 56;
const CLIMB_SECS = 3.6;
const READY_SECS = 1.6;
const HOLD_SECS = 3.2;
const HIT_MIN = 0.55;
const HIT_MAX = 1.08;
const COUGH_SECS = 0.7;
const CHAMBER_SECS = 8.5;
const BYPASS_SECS = 2.2;
const RIDE_SECS = 48;

const PIPES = [
  {i: 0, x: 250, mouthY: 760, topY: 250, label: 'Do', shape: 'circle', fill: '#c9a227', glow: '#ffe6a4'},
  {i: 1, x: 450, mouthY: 780, topY: 230, label: 'Mi', shape: 'diamond', fill: '#5a8f4a', glow: '#b8e0a8'},
  {i: 2, x: 650, mouthY: 760, topY: 250, label: 'Sol', shape: 'triangle', fill: '#6b2030', glow: '#e8a0b0'},
];

function roundRect(c, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

function reduced(s) {
  try { return !!(s.reduced || prefersReducedMotion()); } catch { return !!s.reduced; }
}

function tempo(s) {
  return reduced(s) ? 1.35 : 1;
}

function ch1Notes() {
  // Three sequential climbs. TAP whatever is live — no memory of a phrase.
  return [
    {pipe: 0, at: 0.15},
    {pipe: 1, at: 0.15},
    {pipe: 2, at: 0.15},
  ];
}

function chapterNotes(level) {
  // Ch2–6: one easy climb stub so the ride still exits.
  if (level <= 0) return ch1Notes();
  return [{pipe: level % 3, at: 0.2}];
}

function spawnIds() {
  return ['chamber-0'];
}

function hitMouth(p) {
  for (const pipe of PIPES) {
    if (Math.hypot(p.x - pipe.x, p.y - pipe.mouthY) <= MOUTH_R + 12) return pipe.i;
    if (Math.abs(p.x - pipe.x) <= 36 && p.y >= pipe.topY + 40 && p.y <= pipe.mouthY + MOUTH_R) return pipe.i;
  }
  return -1;
}

function notePos(pipe, climb) {
  const t = clamp(climb, 0, 1);
  return {
    x: pipe.x,
    y: pipe.topY + (pipe.mouthY - pipe.topY) * t,
    scale: 0.45 + t * 0.7,
  };
}

function startClimb(s, idx) {
  const notes = s.notes;
  if (idx !== s.noteIndex) s.misses = 0;
  s.skipAhead = false;
  if (idx >= notes.length) {
    s.phase = s.hits >= s.goal ? 'chamber' : 'bypass';
    s.phaseT = 0;
    if (s.phase === 'chamber') openChamber(s);
    else {
      s.note = 'The ordinary corridor carries you on.';
      logAction(s, 'bypass', {hits: s.hits, goal: s.goal});
    }
    return;
  }
  s.noteIndex = idx;
  s.phase = 'ready';
  s.phaseT = 0;
  s.climb = 0;
  s.livePipe = notes[idx].pipe;
  s.tapped = false;
  s.holdT = 0;
  s.note = 'TAP the glowing pipe.';
  logAction(s, 'climb', {i: idx, pipe: s.livePipe});
}

function openChamber(s) {
  s.phase = 'chamber';
  s.phaseT = 0;
  s.door = 0;
  s.chamberFindTaken = false;
  s.note = 'TAP what you see inside.';
  logAction(s, 'open', {gate: 'chamber-0'});
  if (s.eligible && s.spawnId === 'chamber-0' && !s.treasure) {
    s.treasure = {id: s.treasureId, taken: false};
    s.treasureRevealed = true;
  }
}

function missClimb(s) {
  s.misses += 1;
  logAction(s, 'miss', {pipe: s.livePipe, misses: s.misses});
  s.phase = 'cough';
  s.phaseT = 0;
  s.shake = reduced(s) ? 0.2 : 0.55;
  if (s.misses <= 1) {
    s.retrySame = true;
    s.note = 'The pipes cough — TAP that mouth again.';
  } else if (s.practice) {
    s.retrySame = false;
    s.skipAhead = true;
    s.note = 'The pipes cough — next note.';
  } else {
    s.retrySame = false;
    s.skipAhead = false;
    s.note = 'The pipes cough — ordinary corridor.';
  }
}

function hitClimb(s) {
  s.hits += 1;
  s.tapped = true;
  s.flash = 0.35;
  s.note = 'Open.';
  logAction(s, 'tap', {pipe: s.livePipe, hits: s.hits});
  s.phase = 'hit';
  s.phaseT = 0;
}

function drawNoteShape(d, shape, x, y, r, fill, stroke) {
  if (shape === 'circle') d.circle(x, y, r, fill, stroke, 2);
  else if (shape === 'diamond') d.poly([[x, y - r], [x + r, y], [x, y + r], [x - r, y]], fill, stroke, 2);
  else d.poly([[x, y - r], [x + r * 0.95, y + r * 0.75], [x - r * 0.95, y + r * 0.75]], fill, stroke, 2);
}

function drawCockpit(d, s) {
  // Light pipe bank on the court — no full cover.
  PIPES.forEach((pipe) => {
    const live = s.livePipe === pipe.i && (s.phase === 'ready' || s.phase === 'climb' || s.phase === 'hit' || s.phase === 'cough');
    d.poly([
      [pipe.x - 16, pipe.topY],
      [pipe.x + 16, pipe.topY],
      [pipe.x + 22, pipe.mouthY],
      [pipe.x - 22, pipe.mouthY],
    ], live ? pipe.fill + 'cc' : '#b78b4833', GOLD, live ? 5 : 1.5);
    d.ellipse(pipe.x, pipe.topY, 14, 7, '#d2a65bcc', GOLD, 1);
  });
}

function drawMouths(d, s) {
  PIPES.forEach((pipe) => {
    const live = s.livePipe === pipe.i && (s.phase === 'ready' || s.phase === 'climb' || s.phase === 'cough') && !s.tapped;
    const inWindow = live && s.climb >= HIT_MIN && s.climb <= HIT_MAX;
    const r = MOUTH_R * (inWindow ? 1.08 : 1);
    if (d.c) {
      roundRect(d.c, pipe.x - r, pipe.mouthY - r, r * 2, r * 2, 18);
      d.c.fillStyle = live ? pipe.fill : '#3a2418ee';
      d.c.fill();
      d.c.strokeStyle = GOLD;
      d.c.lineWidth = live ? 5 : 3;
      d.c.stroke();
    } else {
      d.circle(pipe.x, pipe.mouthY, r, live ? pipe.fill : '#3a2418ee', GOLD, 3);
    }
    if (live) d.glow(pipe.x, pipe.mouthY, r + 24, pipe.glow);
    drawNoteShape(d, pipe.shape, pipe.x, pipe.mouthY - 8, 18, pipe.fill, '#f8e4b3');
    d.text(live ? 'TAP' : pipe.label, pipe.x, pipe.mouthY + r - 14, 16, CREAM);
  });
}

function drawClimbingNote(d, s) {
  if (s.phase !== 'climb' || s.livePipe < 0) return;
  const pipe = PIPES[s.livePipe];
  const p = notePos(pipe, s.climb);
  drawNoteShape(d, pipe.shape, p.x, p.y, 14 * p.scale, pipe.fill, '#fff6d8');
  d.glow(p.x, p.y, 18 * p.scale, pipe.glow);
}

function drawPractice(d, s) {
  if (!s.practice) return;
  if (d.c) {
    roundRect(d.c, 300, 176, 300, 44, 12);
    d.c.fillStyle = '#3a2418ee';
    d.c.fill();
    d.c.strokeStyle = GOLD;
    d.c.lineWidth = 3;
    d.c.stroke();
  }
  d.text('PRACTICE', 450, 206, 22, CREAM);
}

function drawCoach(d, s) {
  if (d.c) {
    roundRect(d.c, 50, 900, 800, 64, 12);
    d.c.fillStyle = '#122335d8';
    d.c.fill();
    d.c.strokeStyle = GOLD;
    d.c.lineWidth = 2;
    d.c.stroke();
  }
  const line = s.phase === 'chamber' ? 'TAP what you see inside.'
    : s.phase === 'bypass' ? 'The ordinary corridor.'
    : 'TAP the glowing pipe.';
  d.text(line, 450, 938, 22, CREAM);
}

function drawChamber(d, s) {
  const cx = 450, cy = 430;
  const open = s.door || 0;
  d.ellipse(cx, cy, 200, 150, '#5a3a2244', GOLD, 3);
  if (open < 0.98 && d.c) {
    d.c.save();
    d.c.beginPath();
    d.c.ellipse(cx, cy, 200, 150, 0, 0, TAU);
    d.c.clip();
    const wing = 200 * (1 - open);
    d.c.fillStyle = '#4a1824cc';
    d.c.fillRect(cx - 200, cy - 150, wing, 300);
    d.c.fillRect(cx + 200 - wing, cy - 150, wing, 300);
    d.c.restore();
  }
  d.text('pipe chamber', cx, cy - 110, 18, INK);
  if (!s.chamberFindTaken) {
    d.glow(cx, cy + 36, 40, '#ffe6a4');
    d.item(spriteKey(ORDINARY[s.hits % ORDINARY.length]), cx, cy + 36, {
      w: 54, shadow: false, fallback: () => d.star(cx, cy + 36, 14, '#f4d590'),
    });
    d.text('TAP', cx, cy + 74, 14, CREAM);
  }
  if (s.treasure && !s.treasure.taken) {
    d.glow(cx, cy - 50, 50, '#ffe6a4');
    d.item(spriteKey(s.treasure.id), cx, cy - 50, {
      w: 68, shadow: false, fallback: () => d.star(cx, cy - 50, 18, '#ffe6a4'),
    });
  }
}

function tryTap(s, mouth) {
  if (s.result || s.broke || mouth < 0) return;
  // Cough on the live pipe still scores — guest is answering the cough.
  if (s.phase === 'cough' && mouth === s.livePipe && !s.tapped) {
    logAction(s, 'key', {pipe: mouth, live: s.livePipe, recover: true});
    hitClimb(s);
    return;
  }
  if ((s.phase !== 'ready' && s.phase !== 'climb') || s.tapped) return;
  logAction(s, 'key', {pipe: mouth, live: s.livePipe});
  if (mouth !== s.livePipe) {
    missClimb(s);
    return;
  }
  // Live mouth TAP always scores — timing window is juice, not a trap.
  hitClimb(s);
}

export default {
  title: 'Calliope Keys',
  intro: 'Otto’s organ is the cockpit. Notes climb the brass. TAP the glowing pipe mouth.',
  instructions: 'Tap the glowing pipe. The mouth lights before the note climbs; TAP it then, or as the note arrives. Sound is optional — shape and colour mark each pipe. First chapter ride is free practice and keeps nothing. A miss coughs; a second miss takes the ordinary corridor.',
  levels: LEVEL_NAMES,
  sprites: TREASURES.concat(['everyday-penny', 'star-token', 'moon-penny']),
  prizes: TREASURES,
  houseSeconds: 80,
  create(level, rng) {
    const notes = chapterNotes(level);
    return makeRideState(level, rng, {
      treasureId: TREASURES[Math.max(0, Math.min(level, TREASURES.length - 1))],
      notes,
      noteIndex: -1,
      livePipe: -1,
      climb: 0,
      tapped: false,
      hits: 0,
      misses: 0,
      goal: notes.length,
      phase: 'boot',
      phaseT: 0,
      flash: 0,
      shake: 0,
      door: 0,
      retrySame: false,
      skipAhead: false,
      chamberFindTaken: false,
      duration: RIDE_SECS + level * 2,
      stubChapter: level > 0,
    });
  },
  update(s, dt) {
    if (s.result || s.broke) return;
    if (ensureBoarded(s, RIDE, s.treasureId, spawnIds())) {
      s.note = 'TAP the glowing pipe.';
      if (s.eligible && !s.spawnId) s.spawnId = 'chamber-0';
      startClimb(s, 0);
    }
    if (s.result) return;

    const t = tempo(s);
    s.t += dt;
    if (s.flash > 0) s.flash = Math.max(0, s.flash - dt);
    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 2.2);
    if (s.phase === 'chamber') s.door = Math.min(1, (s.door || 0) + dt * 1.8);

    if (s.phase === 'ready') {
      s.phaseT += dt;
      if (s.phaseT >= READY_SECS * t) {
        s.phase = 'climb';
        s.climb = 0;
      }
    } else if (s.phase === 'climb') {
      if (s.climb < 1) s.climb += dt / (CLIMB_SECS * t);
      if (s.climb >= 1) {
        s.climb = 1;
        s.holdT = (s.holdT || 0) + dt;
        if (s.holdT > HOLD_SECS * t && !s.tapped) missClimb(s);
      }
    } else if (s.phase === 'hit') {
      s.phaseT += dt;
      if (s.phaseT > 0.35 * t) startClimb(s, s.noteIndex + 1);
    } else if (s.phase === 'cough') {
      s.phaseT += dt;
      if (s.phaseT >= COUGH_SECS * t) {
        if (s.retrySame) startClimb(s, s.noteIndex);
        else if (s.practice || s.skipAhead) startClimb(s, s.noteIndex + 1);
        else {
          s.phase = 'bypass';
          s.phaseT = 0;
          logAction(s, 'bypass', {hits: s.hits});
        }
      }
    } else if (s.phase === 'chamber') {
      s.phaseT += dt;
      if (s.phaseT >= CHAMBER_SECS * t) {
        s.phase = 'exit';
        s.phaseT = 0;
      }
    } else if (s.phase === 'bypass') {
      s.phaseT += dt;
      if (s.phaseT >= BYPASS_SECS) {
        s.phase = 'exit';
        s.phaseT = 0;
      }
    } else if (s.phase === 'exit') {
      s.phaseT += dt;
      s.progress = 1;
      finishRide(s, {
        rideId: RIDE,
        treasureId: s.treasureId,
        challengeOk: s.hits >= s.goal,
        completionFind: 'star-token',
      });
    }

    s.progress = clamp(
      (s.noteIndex + clamp(s.climb, 0, 1)) / Math.max(1, s.goal),
      0,
      0.99,
    );
    if (!s.result && s.t >= s.duration + 6) {
      finishRide(s, {
        rideId: RIDE,
        treasureId: s.treasureId,
        challengeOk: s.hits >= s.goal,
        completionFind: 'star-token',
      });
    }
  },
  pointer(s, type, p) {
    if (type !== 'down' || s.result || s.broke) return;
    if (s.phase === 'chamber') {
      const cx = 450, cy = 430;
      if (!s.chamberFindTaken && Math.hypot(p.x - cx, p.y - (cy + 36)) < 70) {
        s.chamberFindTaken = true;
        recordFind(s, ORDINARY[s.hits % ORDINARY.length], RIDE);
        logAction(s, 'find', {id: ORDINARY[s.hits % ORDINARY.length]});
        s.note = 'A find among the pipes.';
      }
      if (s.treasure && !s.treasure.taken && Math.hypot(p.x - cx, p.y - (cy - 50)) < 78) {
        s.treasure.taken = true;
        recordTreasure(s, s.treasure.id);
        logAction(s, 'treasure', {id: s.treasure.id});
        s.note = 'The calliope keepsake!';
      }
      return;
    }
    tryTap(s, hitMouth(p));
  },
  action(s, id) {
    const m = String(id || '').match(/^p(\d)$/);
    if (!m) return;
    const pipe = PIPES[Number(m[1])];
    if (!pipe) return;
    tryTap(s, pipe.i);
  },
  key(s, k, down) {
    if (!down || s.result || s.broke) return;
    if (k === '1' || k === 'a') this.action(s, 'p0');
    if (k === '2' || k === 's') this.action(s, 'p1');
    if (k === '3' || k === 'd') this.action(s, 'p2');
  },
  draw(s, d) {
    const c = d.c;
    const shakeX = (s.shake || 0) && !reduced(s) ? Math.sin(s.t * 40) * s.shake * 8 : 0;
    if (c) { c.save(); c.translate(shakeX, 0); }

    d.ellipse(450, 520, 360, 420, '#4a182412');
    drawCockpit(d, s);
    drawClimbingNote(d, s);
    if (s.phase === 'chamber') drawChamber(d, s);
    else if (s.phase === 'bypass') d.text('ordinary corridor', 450, 430, 22, INK);
    else if (s.phase === 'cough') d.text('cough', 450, 400, 24, INK);
    drawMouths(d, s);
    drawCoach(d, s);
    drawHud(d, s, {goal: s.goal, count: s.hits, label: 'notes'});
    if (c) c.restore();
  },
  readout: (s) => s.note || 'TAP the glowing pipe.',
  actions: PIPES.map((p) => ({id: 'p' + p.i, label: 'TAP ' + p.label})),
};
