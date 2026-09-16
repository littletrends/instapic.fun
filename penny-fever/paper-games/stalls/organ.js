/*
 * Calliope Keys (organ) — Amusement 2 · Otto
 * LOCKED remix: organ as cockpit. Notes climb brass pipes. TAP the live mouth.
 * Tempest lanes + piano-tile timing + instrument-panel clarity. Not Simon-says.
 *
 * SHIPPED: Chapter 1 Three Bright Notes · Chapter 2 Bell and Pipe.
 * SHIPPED: Chapter 3 Paper Roll · Chapter 4 Echo Chamber.
 * SHIPPED: Chapter 5 Broken Bar · Chapter 6 The Grand Calliope.
 * CHROME: no canvas drawHud/drawCoach; slim pipe mouths; verbs in #actions.
 *
 * organ.png is the court behind the canvas. Do not paint a full-screen background.
 * draw.glow() — 6-digit hex only (#rrggbb).
 */
import {clamp} from '../draw.js';
import {spriteKey} from '../prizes.js?v=ritual-3';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure, logAction,
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
const BELL_GLOW = '#e8c070'; // 6-digit only for d.glow
const ROLL_GLOW = '#d8c090'; // 6-digit only for d.glow
const ECHO_GLOW = '#b8d0e8'; // 6-digit only for d.glow
const BROKEN_GLOW = '#c08080'; // 6-digit only for d.glow
const GEAR_GLOW = '#d0b878'; // 6-digit only for d.glow
const MOUTH_R = 52; // hit radius
const MOUTH_DRAW = 30; // slim in-world mouth (not a plaque)
const CLIMB_SECS = 3.6;
const READY_SECS = 1.6;
const HOLD_SECS = 3.8;
const BELL_WARN_SECS = 3.4; // Ch2 teach: long warn with bell alone before climb
const ROLL_WARN_SECS = 3.6; // Ch3 teach: long warn with roll alone before climb
const ECHO_WARN_SECS = 3.4; // Ch4 teach: long warn with echo alone before climb
const BROKEN_WARN_SECS = 3.4; // Ch5 teach: long warn with broken bar alone before climb
const GEAR_WARN_SECS = 3.4; // Ch6 teach: long warn with gear alone before climb
const HIT_MIN = 0.55;
const HIT_MAX = 1.08;
const COUGH_SECS = 0.7;
const CHAMBER_SECS = 8.5;
const BYPASS_SECS = 2.2;
const RIDE_SECS = 48;
const CH2_SECS = 52;
const CH3_SECS = 54;
const CH4_SECS = 56;
const CH5_SECS = 58;
const CH6_SECS = 60;

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
  // Ch2–Ch6 slightly slower so a competent first play can land 3/3 (~50–60s).
  const slow = (s.level === 1 || s.level === 2 || s.level === 3 || s.level === 4 || s.level === 5) ? 1.12 : 1;
  return (reduced(s) ? 1.35 : 1) * slow;
}

function ch1Notes() {
  // Three sequential climbs. TAP whatever is live — no memory of a phrase.
  return [
    {pipe: 0, at: 0.15},
    {pipe: 1, at: 0.15},
    {pipe: 2, at: 0.15},
  ];
}

function ch2Notes() {
  // Deepen TAP. ONE teach hazard alone: a ringing bell on a wrong mouth.
  // Later climbs stay clean — no mixing hazards (helter Ch2 bar).
  return [
    {pipe: 1, bell: 0, teach: true, at: 0.15}, // live Mi; bell decoy on Do
    {pipe: 0, at: 0.15},
    {pipe: 2, at: 0.15},
  ];
}

function ch3Notes() {
  // Deepen TAP. ONE teach hazard alone: a punched-paper ROLL on a wrong mouth.
  // Later climbs stay clean — no roll, no bell (helter Ch3 bar).
  return [
    {pipe: 0, roll: 2, teach: true, at: 0.15}, // live Do; roll decoy on Sol
    {pipe: 1, at: 0.15},
    {pipe: 2, at: 0.15},
  ];
}


function ch4Notes() {
  // Deepen TAP. ONE teach hazard alone: a ghost ECHO decoy on a wrong mouth.
  // Later climbs stay clean — no echo, no bell, no roll (helter Ch4 bar).
  return [
    {pipe: 2, echo: 1, teach: true, at: 0.15}, // live Sol; echo decoy on Mi
    {pipe: 0, at: 0.15},
    {pipe: 1, at: 0.15},
  ];
}

function ch5Notes() {
  // Deepen TAP. ONE teach hazard alone: a BROKEN bar/mouth decoy on a wrong (unavailable) pipe.
  // Later climbs stay clean — no broken, no bell, no roll, no echo (helter Ch5 bar).
  return [
    {pipe: 1, broken: 0, teach: true, at: 0.15}, // live Mi; broken decoy on Do
    {pipe: 2, at: 0.15},
    {pipe: 0, at: 0.15},
  ];
}

function ch6Notes() {
  // Finale deepen TAP. ONE teach hazard alone: a GEAR / music-box tooth decoy on a wrong mouth.
  // Climbs 2–3 stay clean — no gear, no bell, no roll, no echo, no broken (helter Ch6 bar).
  return [
    {pipe: 0, gear: 2, teach: true, at: 0.15}, // live Do; gear decoy on Sol
    {pipe: 1, at: 0.15},
    {pipe: 2, at: 0.15},
  ];
}

function chapterNotes(level) {
  if (level <= 0) return ch1Notes();
  if (level === 1) return ch2Notes();
  if (level === 2) return ch3Notes();
  if (level === 3) return ch4Notes();
  if (level === 4) return ch5Notes();
  if (level === 5) return ch6Notes();
  // No higher chapters — stub one note.
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

function readySecs(s) {
  const note = s.notes[s.noteIndex];
  // Hazard-specific warn — do not let other taught flags steal this chapter's warn.
  if (note && note.teach && note.gear != null && !s.gearTaught) return GEAR_WARN_SECS;
  if (note && note.teach && note.broken != null && !s.brokenTaught) return BROKEN_WARN_SECS;
  if (note && note.teach && note.echo != null && !s.echoTaught) return ECHO_WARN_SECS;
  if (note && note.teach && note.roll != null && !s.rollTaught) return ROLL_WARN_SECS;
  if (note && note.teach && note.bell != null && !s.bellTaught) return BELL_WARN_SECS;
  return READY_SECS;
}

function startClimb(s, idx) {
  const notes = s.notes;
  if (idx !== s.noteIndex) s.misses = 0;
  s.skipAhead = false;
  if (idx >= notes.length) {
    s.phase = s.hits >= s.goal ? 'chamber' : 'bypass';
    s.phaseT = 0;
    s.bellPipe = -1;
    s.rollPipe = -1;
    s.echoPipe = -1;
    s.brokenPipe = -1;
    s.gearPipe = -1;
    if (s.phase === 'chamber') openChamber(s);
    else {
      s.note = 'The ordinary corridor carries you on.';
      logAction(s, 'bypass', {hits: s.hits, goal: s.goal});
    }
    return;
  }
  const note = notes[idx];
  s.noteIndex = idx;
  s.phase = 'ready';
  s.phaseT = 0;
  s.climb = 0;
  s.livePipe = note.pipe;
  s.bellPipe = (note.teach && note.bell != null) ? note.bell : -1;
  s.rollPipe = (note.teach && note.roll != null) ? note.roll : -1;
  s.echoPipe = (note.teach && note.echo != null) ? note.echo : -1;
  s.brokenPipe = (note.teach && note.broken != null) ? note.broken : -1;
  s.gearPipe = (note.teach && note.gear != null) ? note.gear : -1;
  s.tapped = false;
  s.holdT = 0;
  if (s.gearPipe >= 0 && !s.gearTaught) {
    s.note = 'Gears spin beside — TAP the climbing pipe.';
  } else if (s.brokenPipe >= 0 && !s.brokenTaught) {
    s.note = 'That bar is broken — TAP the climbing pipe.';
  } else if (s.echoPipe >= 0 && !s.echoTaught) {
    s.note = 'Echo ghosts a wrong mouth — TAP the climbing pipe.';
  } else if (s.rollPipe >= 0 && !s.rollTaught) {
    s.note = 'Paper roll marks a wrong mouth — TAP the climbing pipe.';
  } else if (s.bellPipe >= 0 && !s.bellTaught) {
    s.note = 'Bell rings beside — TAP the climbing pipe, not the bell.';
  } else {
    s.note = 'TAP the glowing pipe.';
  }
  logAction(s, 'climb', {i: idx, pipe: s.livePipe, bell: s.bellPipe, roll: s.rollPipe, echo: s.echoPipe, broken: s.brokenPipe, gear: s.gearPipe});
}

function openChamber(s) {
  s.phase = 'chamber';
  s.phaseT = 0;
  s.door = 0;
  s.bellPipe = -1;
  s.rollPipe = -1;
  s.echoPipe = -1;
  s.brokenPipe = -1;
  s.gearPipe = -1;
  s.chamberFindTaken = false;
  s.note = s.level === 5 ? 'TAP what you see in the music-box chamber.' : 'TAP what you see inside.';
  logAction(s, 'open', {gate: 'chamber-0'});
  if (s.eligible && s.spawnId === 'chamber-0' && !s.treasure) {
    s.treasure = {id: s.treasureId, taken: false};
    s.treasureRevealed = true;
  }
}

function missClimb(s, reason) {
  s.misses += 1;
  logAction(s, 'miss', {pipe: s.livePipe, misses: s.misses, reason: reason || 'miss'});
  s.phase = 'cough';
  s.phaseT = 0;
  s.shake = reduced(s) ? 0.2 : 0.55;
  if (reason === 'gear') {
    s.retrySame = true;
    s.skipAhead = false;
    s.note = 'Gears spin beside — TAP the climbing pipe.';
  } else if (reason === 'broken') {
    s.retrySame = true;
    s.skipAhead = false;
    s.note = 'That bar is broken — TAP the climbing pipe.';
  } else if (reason === 'echo') {
    s.retrySame = true;
    s.skipAhead = false;
    s.note = 'Echo ghosts a wrong mouth — TAP the climbing pipe.';
  } else if (reason === 'roll') {
    s.retrySame = true;
    s.skipAhead = false;
    s.note = 'Paper roll marks a wrong mouth — TAP the climbing pipe.';
  } else if (reason === 'bell') {
    s.retrySame = true;
    s.skipAhead = false;
    s.note = 'That was the bell — TAP the climbing pipe.';
  } else if (s.practice) {
    // Practice stays on this pipe until TAP lands — teach the verb.
    s.retrySame = true;
    s.skipAhead = false;
    s.note = 'The pipes cough — TAP that mouth again.';
  } else if (s.misses <= 1) {
    s.retrySame = true;
    s.note = 'The pipes cough — TAP that mouth again.';
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
  if (s.bellPipe >= 0) s.bellTaught = true;
  if (s.rollPipe >= 0) s.rollTaught = true;
  if (s.echoPipe >= 0) s.echoTaught = true;
  if (s.brokenPipe >= 0) s.brokenTaught = true;
  if (s.gearPipe >= 0) s.gearTaught = true;
  s.bellPipe = -1;
  s.rollPipe = -1;
  s.echoPipe = -1;
  s.brokenPipe = -1;
  s.gearPipe = -1;
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

function drawBellMark(d, x, y, r) {
  // Simple calliope bell — shape only, no 8-digit glow.
  d.ellipse(x, y - 6, r * 0.55, r * 0.4, '#d2a65b', GOLD, 2);
  d.poly([
    [x - r * 0.7, y - 2],
    [x + r * 0.7, y - 2],
    [x + r * 0.55, y + r * 0.55],
    [x - r * 0.55, y + r * 0.55],
  ], '#c9a227', GOLD, 2);
  d.circle(x, y + r * 0.7, 4, '#efe6d0', GOLD, 1);
}

function drawRollMark(d, x, y, r) {
  // Punched paper strip + holes — shape only; glow uses 6-digit hex elsewhere.
  const w = r * 1.55;
  const h = r * 0.85;
  if (d.c) {
    roundRect(d.c, x - w / 2, y - h / 2 - 4, w, h, 4);
    d.c.fillStyle = '#efe6d0';
    d.c.fill();
    d.c.strokeStyle = GOLD;
    d.c.lineWidth = 2;
    d.c.stroke();
  } else {
    d.poly([
      [x - w / 2, y - h / 2 - 4],
      [x + w / 2, y - h / 2 - 4],
      [x + w / 2, y + h / 2 - 4],
      [x - w / 2, y + h / 2 - 4],
    ], '#efe6d0', GOLD, 2);
  }
  // Punch holes along the strip.
  const holes = [-0.28, -0.08, 0.12, 0.32];
  for (const hx of holes) {
    d.circle(x + w * hx, y - 4, 3.2, '#3a2418', GOLD, 1);
  }
  d.text('ROLL', x, y + r * 0.7, 10, CREAM);
}


function drawEchoMark(d, x, y, r) {
  // Ghostly duplicate mouth — faded oval + ECHO label; glow uses 6-digit hex elsewhere.
  d.ellipse(x, y - 4, r * 0.85, r * 0.65, '#b8d0e866', '#b8d0e8', 2);
  d.ellipse(x, y - 4, r * 0.55, r * 0.4, '#d0e4f044', '#b8d0e8', 1);
  d.text('ECHO', x, y + r * 0.55, 14, CREAM);
}

function drawBrokenMark(d, x, y, r) {
  // Cracked / crossed-out mouth — X over bar + BROKEN label; glow uses 6-digit hex elsewhere.
  const s = r * 0.75;
  if (d.c) {
    d.c.save();
    d.c.strokeStyle = '#c08080';
    d.c.lineWidth = 4;
    d.c.lineCap = 'round';
    d.c.beginPath();
    d.c.moveTo(x - s, y - s * 0.7);
    d.c.lineTo(x + s, y + s * 0.7);
    d.c.moveTo(x + s, y - s * 0.7);
    d.c.lineTo(x - s, y + s * 0.7);
    d.c.stroke();
    // Crack notch across the mouth bar.
    d.c.strokeStyle = '#a06060';
    d.c.lineWidth = 2;
    d.c.beginPath();
    d.c.moveTo(x - s * 0.9, y - 2);
    d.c.lineTo(x - s * 0.2, y + 4);
    d.c.lineTo(x + s * 0.15, y - 3);
    d.c.lineTo(x + s * 0.9, y + 2);
    d.c.stroke();
    d.c.restore();
  } else {
    d.poly([[x - s, y - s * 0.7], [x + s, y + s * 0.7]], null, '#c08080', 4);
    d.poly([[x + s, y - s * 0.7], [x - s, y + s * 0.7]], null, '#c08080', 4);
  }
  d.text('BROKEN', x, y + r * 0.55, 14, CREAM);
}

function drawGearMark(d, x, y, r) {
  // Calliope gear / music-box tooth — simple teeth circle + GEAR label; glow uses 6-digit hex elsewhere.
  const outer = r * 0.85;
  const inner = r * 0.42;
  const teeth = 8;
  if (d.c) {
    d.c.save();
    d.c.translate(x, y - 4);
    d.c.fillStyle = '#c9a878';
    d.c.strokeStyle = GOLD;
    d.c.lineWidth = 2;
    d.c.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a0 = (i / teeth) * Math.PI * 2 - Math.PI / teeth;
      const a1 = ((i + 0.45) / teeth) * Math.PI * 2 - Math.PI / teeth;
      const a2 = ((i + 0.55) / teeth) * Math.PI * 2 - Math.PI / teeth;
      const a3 = ((i + 1) / teeth) * Math.PI * 2 - Math.PI / teeth;
      if (i === 0) d.c.moveTo(Math.cos(a0) * inner, Math.sin(a0) * inner);
      d.c.lineTo(Math.cos(a0) * outer, Math.sin(a0) * outer);
      d.c.lineTo(Math.cos(a1) * (outer + 4), Math.sin(a1) * (outer + 4));
      d.c.lineTo(Math.cos(a2) * (outer + 4), Math.sin(a2) * (outer + 4));
      d.c.lineTo(Math.cos(a3) * outer, Math.sin(a3) * outer);
    }
    d.c.closePath();
    d.c.fill();
    d.c.stroke();
    d.c.beginPath();
    d.c.arc(0, 0, inner * 0.55, 0, Math.PI * 2);
    d.c.fillStyle = '#3a2418';
    d.c.fill();
    d.c.strokeStyle = GOLD;
    d.c.stroke();
    d.c.restore();
  } else {
    d.circle(x, y - 4, outer, '#c9a878', GOLD, 2);
    d.circle(x, y - 4, inner * 0.55, '#3a2418', GOLD, 1);
  }
  d.text('GEAR', x, y + r * 0.55, 14, CREAM);
}

function drawCockpit(d, s) {
  // Light pipe bank on the court — no full cover.
  PIPES.forEach((pipe) => {
    const live = s.livePipe === pipe.i && (s.phase === 'ready' || s.phase === 'climb' || s.phase === 'hit' || s.phase === 'cough');
    const bell = s.bellPipe === pipe.i && (s.phase === 'ready' || s.phase === 'climb' || s.phase === 'cough');
    const roll = s.rollPipe === pipe.i && (s.phase === 'ready' || s.phase === 'climb' || s.phase === 'cough');
    const echo = s.echoPipe === pipe.i && (s.phase === 'ready' || s.phase === 'climb' || s.phase === 'cough');
    const broken = s.brokenPipe === pipe.i && (s.phase === 'ready' || s.phase === 'climb' || s.phase === 'cough');
    const gear = s.gearPipe === pipe.i && (s.phase === 'ready' || s.phase === 'climb' || s.phase === 'cough');
    const tint = live ? pipe.fill + 'cc' : (bell ? '#c9a22766' : (roll ? '#d8c09066' : (echo ? '#b8d0e866' : (broken ? '#c0808066' : (gear ? '#d0b87866' : '#b78b4833')))));
    const lw = live ? 5 : (bell || roll || echo || broken || gear ? 3 : 1.5);
    d.poly([
      [pipe.x - 16, pipe.topY],
      [pipe.x + 16, pipe.topY],
      [pipe.x + 22, pipe.mouthY],
      [pipe.x - 22, pipe.mouthY],
    ], tint, GOLD, lw);
    d.ellipse(pipe.x, pipe.topY, 14, 7, '#d2a65bcc', GOLD, 1);
  });
}

function drawMouths(d, s) {
  PIPES.forEach((pipe) => {
    const live = s.livePipe === pipe.i && (s.phase === 'ready' || s.phase === 'climb' || s.phase === 'cough') && !s.tapped;
    const bell = s.bellPipe === pipe.i && (s.phase === 'ready' || s.phase === 'climb' || s.phase === 'cough') && !s.tapped;
    const roll = s.rollPipe === pipe.i && (s.phase === 'ready' || s.phase === 'climb' || s.phase === 'cough') && !s.tapped;
    const echo = s.echoPipe === pipe.i && (s.phase === 'ready' || s.phase === 'climb' || s.phase === 'cough') && !s.tapped;
    const broken = s.brokenPipe === pipe.i && (s.phase === 'ready' || s.phase === 'climb' || s.phase === 'cough') && !s.tapped;
    const gear = s.gearPipe === pipe.i && (s.phase === 'ready' || s.phase === 'climb' || s.phase === 'cough') && !s.tapped;
    const decoy = bell || roll || echo || broken || gear;
    const inWindow = live && s.climb >= HIT_MIN && s.climb <= HIT_MAX;
    const r = MOUTH_DRAW * (inWindow ? 1.12 : (decoy ? 1.06 : 1));
    const fill = live ? pipe.fill : (bell ? '#5a3a18ee' : (roll ? '#4a3820ee' : (echo ? '#2a3848ee' : (broken ? '#482828ee' : (gear ? '#483828ee' : '#3a2418cc')))));
    d.ellipse(pipe.x, pipe.mouthY, r * 1.05, r * 0.72, fill, GOLD, live ? 3.5 : (decoy ? 2.5 : 1.5));
    if (live) d.glow(pipe.x, pipe.mouthY, r + 16, pipe.glow);
    if (bell) d.glow(pipe.x, pipe.mouthY, r + 12, BELL_GLOW);
    if (roll) d.glow(pipe.x, pipe.mouthY, r + 12, ROLL_GLOW);
    if (echo) d.glow(pipe.x, pipe.mouthY, r + 12, ECHO_GLOW);
    if (broken) d.glow(pipe.x, pipe.mouthY, r + 12, BROKEN_GLOW);
    if (gear) d.glow(pipe.x, pipe.mouthY, r + 12, GEAR_GLOW);
    if (bell) drawBellMark(d, pipe.x, pipe.mouthY - 2, 12);
    else if (roll) drawRollMark(d, pipe.x, pipe.mouthY - 2, 12);
    else if (echo) drawEchoMark(d, pipe.x, pipe.mouthY - 2, 12);
    else if (broken) drawBrokenMark(d, pipe.x, pipe.mouthY - 2, 12);
    else if (gear) drawGearMark(d, pipe.x, pipe.mouthY - 2, 12);
    else drawNoteShape(d, pipe.shape, pipe.x, pipe.mouthY - 4, 11, pipe.fill, '#f8e4b3');
  });
}

function drawClimbingNote(d, s) {
  if (s.phase !== 'climb' || s.livePipe < 0) return;
  const pipe = PIPES[s.livePipe];
  const p = notePos(pipe, s.climb);
  drawNoteShape(d, pipe.shape, p.x, p.y, 14 * p.scale, pipe.fill, '#fff6d8');
  d.glow(p.x, p.y, 18 * p.scale, pipe.glow);
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
  d.text(s.level === 5 ? 'grand calliope chamber' : 'pipe chamber', cx, cy - 110, 18, INK);
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
  logAction(s, 'key', {pipe: mouth, live: s.livePipe, bell: s.bellPipe, roll: s.rollPipe, echo: s.echoPipe, broken: s.brokenPipe, gear: s.gearPipe});
  // Soft fail: tapping the teach gear coughs and retries — never aborts alone.
  if (s.gearPipe >= 0 && mouth === s.gearPipe) {
    missClimb(s, 'gear');
    return;
  }
  // Soft fail: tapping the teach broken bar coughs and retries — never aborts alone.
  if (s.brokenPipe >= 0 && mouth === s.brokenPipe) {
    missClimb(s, 'broken');
    return;
  }
  // Soft fail: tapping the teach echo coughs and retries — never aborts alone.
  if (s.echoPipe >= 0 && mouth === s.echoPipe) {
    missClimb(s, 'echo');
    return;
  }
  // Soft fail: tapping the teach roll coughs and retries — never aborts alone.
  if (s.rollPipe >= 0 && mouth === s.rollPipe) {
    missClimb(s, 'roll');
    return;
  }
  // Soft fail: tapping the teach bell coughs and retries — never aborts alone.
  if (s.bellPipe >= 0 && mouth === s.bellPipe) {
    missClimb(s, 'bell');
    return;
  }
  if (mouth !== s.livePipe) {
    missClimb(s);
    return;
  }
  // Live mouth TAP always scores — timing window is juice, not a trap.
  hitClimb(s);
}

function rideDuration(level) {
  if (level === 5) return CH6_SECS + level * 2;
  if (level === 4) return CH5_SECS + level * 2;
  if (level === 3) return CH4_SECS + level * 2;
  if (level === 2) return CH3_SECS + level * 2;
  if (level === 1) return CH2_SECS + level * 2;
  return RIDE_SECS + level * 2;
}

function boardingNote(level) {
  if (level === 5) return 'Gears spin beside — TAP the climbing pipe.';
  if (level === 4) return 'That bar is broken — TAP the climbing pipe.';
  if (level === 3) return 'Echo ghosts a wrong mouth — TAP the climbing pipe.';
  if (level === 2) return 'Paper roll marks a wrong mouth — TAP the climbing pipe.';
  if (level === 1) return 'Bell rings beside — TAP the climbing pipe, not the bell.';
  return 'TAP the glowing pipe.';
}

export default {
  title: 'Calliope Keys',
  intro: 'Otto’s organ is the cockpit. Notes climb the brass. TAP the glowing pipe mouth. From chapter 2, a calliope bell may ring on a wrong mouth — TAP the climbing pipe, not the bell. From chapter 3, a punched-paper ROLL may mark a wrong mouth — TAP the climbing pipe, not the roll. From chapter 4, a ghost ECHO may decoy a wrong mouth — TAP the climbing pipe, not the echo. From chapter 5, a BROKEN bar may mark an unavailable mouth — TAP the climbing pipe, not the broken bar. Chapter 6 is the Grand Calliope finale — a music-box GEAR may spin on a wrong mouth; TAP the climbing pipe, not the gear.',
  instructions: 'Tap the glowing pipe. The mouth lights before the note climbs; TAP it then, or as the note arrives. Sound is optional — shape and colour mark each pipe. From chapter 2 (Bell and Pipe), one teach bell rings beside the live climb — soft cough if you TAP the bell; keep TAP on the climbing pipe. From chapter 3 (Paper Roll), one punched-paper ROLL decoy sits on a wrong mouth on the first climb only — soft cough if you TAP the roll; climbs 2–3 stay clean TAP. From chapter 4 (Echo Chamber), one ghost ECHO decoy sits on a wrong mouth on the first climb only — soft cough if you TAP the echo; climbs 2–3 stay clean TAP. From chapter 5 (Broken Bar), one BROKEN bar/mouth decoy sits on a wrong (unavailable) pipe on the first climb only — soft cough if you TAP the broken mouth; climbs 2–3 stay clean TAP. Chapter 6 (The Grand Calliope) is the music-box finale — one GEAR decoy sits on a wrong mouth on the first climb only — soft cough if you TAP the gear; climbs 2–3 stay clean TAP. First chapter ride is free practice and keeps nothing. A miss coughs; a second miss on a paid ride takes the ordinary corridor.',
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
      bellPipe: -1,
      bellTaught: false,
      rollPipe: -1,
      rollTaught: false,
      echoPipe: -1,
      echoTaught: false,
      brokenPipe: -1,
      brokenTaught: false,
      gearPipe: -1,
      gearTaught: false,
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
      duration: rideDuration(level),
      stubChapter: level > 5,
    });
  },
  update(s, dt) {
    if (s.result || s.broke) return;
    if (ensureBoarded(s, RIDE, s.treasureId, spawnIds())) {
      s.note = boardingNote(s.level);
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
      if (s.phaseT >= readySecs(s) * t) {
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
    if (c) c.restore();
  },
  readout: (s) => s.note || 'TAP the glowing pipe.',
  actions: PIPES.map((p) => ({id: 'p' + p.i, label: 'TAP ' + p.label})),
};
