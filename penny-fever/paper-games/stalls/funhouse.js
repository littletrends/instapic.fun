/* Laughing Doorway — Juno
 * cache: maze-all-1
 *
 * ALL 6 chapters = Pac-Man carnival maze (MOVE / CHOMP / chase). ONE shared
 *   maze LAYOUT — same corridors every chapter. Fairness/strategy varies per
 *   chapter (clearGoal, faceSpeed, playerSpeed, powerSec, faceCount, house timer).
 *   maze-chase–inspired carnival comedy — NOT a licensed-maze clone names/art.
 *
 * CHAPTER BONUSES: path chips (star/moon/penny) + exclusive keepsake per chapter
 *   (d.item via spriteKey → ride-keepsakes/<id>/front.png).
 * SCENERY: #backdrop = assets/funhouse.png (cream court). Maze drawn inside oval
 *   only. Tent_26_Bea dress BUILD still HELD — maze props only: split cutouts from
 *   assets/funhouse-bea/ scenery 01/03-06; bea-player.png = SHARED player sprite
 *   placed around cream oval OUTSIDE maze lanes. No whole-backdrop overpaint.
 * CONTROLS: centre-bottom virtual joystick (helter ← JUMP → pad band under court)
 *   drives MOVE; arrow keys / shell actions / swipe still work.
 * FAIRNESS baseline Ch1: MAZE_HOUSE 110s; clearGoal 16; faceSpeed 56; playerSpeed 168;
 *   powerSec 7.5. Soft fails never abort paid ride.
 *
 * Shell #actions + .play-hud; no canvas drawHud menu panel.
 * d.glow() 6-digit hex only. Oval-only draw — don’t overpaint whole court.
 *
 * Source of truth: Lorie GREENLIGHT + addendum (tagline: Every door tells a different joke).
 */
import {spriteKey} from '../prizes.js?v=ritual-3';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure, logAction,
  prefersReducedMotion,
} from '../ride-seek.js?v=ride-seek-4';
import {
  RIDE, TREASURES, ORDINARY, LEVEL_NAMES, CHOICE_SECONDS, PHASE_SECONDS, SPAWN_IDS,
  STAGE, chapterGraph, roomOf,
} from './funhouse-rooms.js?v=maze-all-1';

const GOLD = '#e8b84a';
const CREAM = '#f3e2bd';
const INK = '#f0d09a';
const BURGUNDY = '#c42848';
const WOOD = '#7a3420';
/** Door Door weight — hold ~160ms then SHUT commits (Ch2–6). */
const PRESS_MS = 0.16;
const TREASURE_HOLD = 0.7;
const NUDGE_SEC = 2;
const PURSE_X = 86;
const PURSE_Y = 64;
const FLY_DUR = 0.62;
const FACE_R = 28;
const PLAYER_R = 26;
const FACE_SPEED = 78;
const TAG_STUN = 0.55;
const GULP_DUR = 0.42;
/** Ch1 maze house clock — fair first-play ~60–90s (was too tight at 60). */
const MAZE_HOUSE = 110;
const FACE_RESPAWN = 3.8;

/** Tent_26_Bea split cutouts — maze scenery only (dress BUILD still held). */
const BEA_PROP_FILES = {
  curtain: 'Tent_26_Bea_piece-01.png',
  moon: 'Tent_26_Bea_piece-03.png',
  spotlight: 'Tent_26_Bea_piece-04.png',
  starKey: 'Tent_26_Bea_piece-05.png',
  doorway: 'Tent_26_Bea_piece-06.png',
};
const BEA_PLAYER_FILE = 'bea-player.png';
const BEA_CACHE_VER = 'maze-all-1';
let beaPropImgs = null;
let beaPlayerImg = null;

function ensureBeaProps() {
  if (beaPropImgs) return beaPropImgs;
  beaPropImgs = {};
  for (const [key, file] of Object.entries(BEA_PROP_FILES)) {
    const img = new Image();
    img.decoding = 'async';
    img.src = `../assets/funhouse-bea/${file}?v=${BEA_CACHE_VER}`;
    beaPropImgs[key] = img;
  }
  if (!beaPlayerImg) {
    beaPlayerImg = new Image();
    beaPlayerImg.decoding = 'async';
    beaPlayerImg.src = `../assets/funhouse-bea/${BEA_PLAYER_FILE}?v=${BEA_CACHE_VER}`;
  }
  return beaPropImgs;
}

/** Place cutouts on cream oval edges — never on maze path cells. */
/** Place cutouts on cream oval edges — never on maze path cells.
 *  scenery flag (full/dense/finale) only changes prop density — not the maze grid.
 */
function drawBeaScenery(d, s) {
  const imgs = ensureBeaProps();
  const density = s?.graph?.scenery || 'full';
  const place = (key, x, y, w, angle = 0) => {
    const img = imgs[key];
    if (!img || !img.complete || !(img.naturalWidth > 0)) return false;
    return d.sprite(img, x, y, {w, angle, shadow: true});
  };
  // Scenery exclusive: doorway, curtain, spotlight, moon, star key (piece-02 = shared player).
  place('doorway', 165, 655, 96);
  place('curtain', 735, 635, 90);
  place('spotlight', 285, 462, 54, -0.18);
  place('moon', 655, 478, 82);
  if (density === 'full' || density === 'dense' || density === 'finale') {
    place('starKey', 780, 860, 42, 0.12);
  }
  if (density === 'dense' || density === 'finale') {
    place('spotlight', 620, 900, 44, 0.22);
    place('moon', 200, 880, 64, -0.1);
  }
  if (density === 'finale') {
    place('curtain', 120, 520, 70, -0.08);
    place('doorway', 780, 520, 72, 0.06);
  }
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function hitCircle(p, x, y, r) {
  return Math.hypot(p.x - x, p.y - y) <= r;
}

function hitDoor(p, door) {
  return Math.abs(p.x - door.x) <= door.w / 2 && Math.abs(p.y - door.y) <= door.h / 2;
}

function spinDur(room) {
  if (room?.teachRotate) return PHASE_SECONDS.spinTeach ?? 1.05;
  return PHASE_SECONDS.spin ?? 0.85;
}

function isMaze(s) {
  return !!(s?.graph?.mode === 'maze' || s?.maze);
}

/**
 * Centre-bottom MOVE stick — helter cream-pad band under the court
 * (canvas 900×1200; pads sit ~y=1088+, below cream oval / maze lanes).
 */
function mazeStickLayout() {
  return {
    cx: 450,
    cy: 1136,
    baseRx: 86,
    baseRy: 56,
    knobR: 30,
    dead: 16,
    maxPull: 46,
  };
}

function hitMazeStick(p) {
  if (!p || typeof p.x !== 'number') return false;
  const L = mazeStickLayout();
  const dx = (p.x - L.cx) / L.baseRx;
  const dy = (p.y - L.cy) / L.baseRy;
  return (dx * dx + dy * dy) <= 1.15;
}

function stickDirFromPull(dx, dy, dead) {
  const len = Math.hypot(dx, dy);
  if (len < dead) return null;
  // Maze is cardinal-only corridors — 4-way stick.
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

function applyMazeStick(s, p) {
  const L = mazeStickLayout();
  const dx = (p?.x ?? L.cx) - L.cx;
  const dy = (p?.y ?? L.cy) - L.cy;
  const len = Math.hypot(dx, dy) || 1;
  const pull = Math.min(len, L.maxPull);
  const kx = (dx / len) * pull;
  const ky = (dy / len) * pull;
  const dir = stickDirFromPull(dx, dy, L.dead);
  const prev = s.stick?.dir || null;
  if (prev && prev !== dir) setWantDir(s, prev, false);
  if (dir) setWantDir(s, dir, true);
  s.stick = {active: true, kx, ky, dir};
}

function releaseMazeStick(s) {
  if (!s.stick?.active) {
    s.stick = null;
    return;
  }
  const dir = s.stick.dir;
  s.stick = null;
  if (dir) setWantDir(s, dir, false);
}

function drawMazeStick(s, d) {
  const L = mazeStickLayout();
  const armed = !!(s.stick && s.stick.active);
  const kx = armed ? (s.stick.kx || 0) : 0;
  const ky = armed ? (s.stick.ky || 0) : 0;
  const pulse = 0.55 + 0.45 * Math.sin((s.t || 0) * 3.2);
  // Shadow + paper base (cream / gold / burgundy — oval only)
  d.ellipse(L.cx + 3, L.cy + 5, L.baseRx, L.baseRy, '#3a1a1266');
  d.ellipse(L.cx, L.cy, L.baseRx, L.baseRy, CREAM + 'ee', GOLD, 2.4);
  d.ellipse(L.cx, L.cy, L.baseRx * 0.72, L.baseRy * 0.62, '#f8e4b3cc', BURGUNDY, 1.6);
  if (armed) d.glow(L.cx, L.cy, 54 + pulse * 10, '#f4d590');
  // Knobby top
  const nx = L.cx + kx;
  const ny = L.cy + ky;
  d.ellipse(nx + 2, ny + 4, L.knobR * 0.95, L.knobR * 0.72, '#3a1a1244');
  d.ellipse(nx, ny, L.knobR, L.knobR * 0.82, armed ? GOLD : BURGUNDY, GOLD, 2.2);
  d.ellipse(nx - 4, ny - 6, L.knobR * 0.42, L.knobR * 0.28, CREAM + 'aa');
  d.text('MOVE', L.cx, L.cy + L.baseRy + 18, 14, armed ? GOLD : INK);
}

/** Live door views — rotate swap, or shrink near/far scale + hitboxes. */
function doorViews(s, room) {
  const raw = room?.doors || [];
  if (room?.shrink) {
    return raw.map(row => {
      const near = !!row.near;
      const scale = near ? 1.08 : 0.55;
      const yLift = near ? 8 : -52;
      const xPull = near ? 0 : (row.id === 'left' ? 42 : -42);
      return {
        ...row,
        x: row.x + xPull,
        y: row.y + yLift,
        w: row.w * scale,
        h: row.h * scale,
        scale,
        near,
      };
    });
  }
  if (!room?.rotate || raw.length < 2) return raw;
  const left = raw.find(row => row.id === 'left');
  const right = raw.find(row => row.id === 'right');
  if (!left || !right) return raw;

  let u = 0;
  if (s.phase === 'spin') u = clamp((s.spinT || 0) / spinDur(room), 0, 1);
  else if (s.spun) u = 1;
  const ease = u * u * (3 - 2 * u);
  const arc = Math.sin(ease * Math.PI) * -22;
  const swapped = ease >= 0.5;

  return [
    {
      ...left,
      id: swapped ? 'right' : 'left',
      x: left.x + (right.x - left.x) * ease,
      y: left.y + arc,
    },
    {
      ...right,
      id: swapped ? 'left' : 'right',
      x: right.x + (left.x - right.x) * ease,
      y: right.y + arc,
    },
  ];
}

function spawnFaces(s, room) {
  s.faces = [];
  if (room.kind !== 'main') return;
  const n = Math.max(1, room.faces || 1);
  for (let i = 0; i < n; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    s.faces.push({
      x: clamp(450 + side * 160, STAGE.xMin + 30, STAGE.xMax - 30),
      y: STAGE.yMin + 40 + i * 18,
      vx: 0,
      vy: 0,
      r: FACE_R,
      alive: true,
      gulp: 0,
      giggle: 0,
    });
  }
}

function clearFacesPowerPellet(s) {
  for (const f of s.faces || []) {
    if (!f.alive) continue;
    f.alive = false;
    f.gulp = GULP_DUR;
  }
}

function updateFaces(s, dt, room) {
  const faces = s.faces || [];
  if (!faces.length) return;
  const reduced = s.reduced;
  const px = s.player?.x ?? 450;
  const py = s.player?.y ?? 720;
  const chasing = s.phase === 'reveal' || s.phase === 'inspect' || s.phase === 'spin' || s.phase === 'choose';
  const speed = reduced ? FACE_SPEED * 0.45 : FACE_SPEED;

  for (const f of faces) {
    if (f.gulp > 0) {
      f.gulp = Math.max(0, f.gulp - dt);
      continue;
    }
    if (!f.alive) continue;
    if (f.giggle > 0) f.giggle = Math.max(0, f.giggle - dt);

    if (chasing && room.kind === 'main') {
      const dx = px - f.x;
      const dy = py - f.y;
      const dist = Math.hypot(dx, dy) || 1;
      f.vx = (dx / dist) * speed;
      f.vy = (dy / dist) * speed;
      f.x = clamp(f.x + f.vx * dt, STAGE.xMin, STAGE.xMax);
      f.y = clamp(f.y + f.vy * dt, STAGE.yMin, STAGE.yMax);

      if (s.phase === 'choose' && !s.doorPress && dist < f.r + PLAYER_R) {
        f.giggle = 0.35;
        s.tagStun = TAG_STUN;
        s.note = 'Giggle bump! Still SHUT a punchline.';
        const wrong = doorViews(s, room).find(d => !d.correct);
        if (wrong && s.player) {
          const sx = Math.sign(wrong.x - s.player.x) || 1;
          s.player.x = clamp(s.player.x + sx * 18, STAGE.xMin + 40, STAGE.xMax - 40);
        }
        f.x = clamp(f.x - (dx / dist) * 36, STAGE.xMin, STAGE.xMax);
        f.y = clamp(f.y - (dy / dist) * 36, STAGE.yMin, STAGE.yMax);
      }
    }
  }
  s.faces = faces.filter(f => f.alive || f.gulp > 0);
}

function enterRoom(s, id) {
  const room = roomOf(s.graph, id);
  s.roomId = room.id;
  s.phase = 'enter';
  s.phaseT = 0;
  s.clueDone = false;
  s.choiceLeft = CHOICE_SECONDS;
  s.panel = 0;
  s.tapping = false;
  s.timerNoted = false;
  s.nudgeT = 0;
  s.doorPress = null;
  s.inspectPulse = 0;
  s.tagStun = 0;
  s.spinT = 0;
  s.spun = false;
  s.faces = [];
  s.player = {x: 450, y: 720};
  if (room.kind === 'main' && !s.seenMain[room.id]) {
    s.seenMain[room.id] = true;
    s.mainsEntered += 1;
  }
  logAction(s, 'room-enter', {room: room.id, kind: room.kind});
  s.note = room.kind === 'detour'
    ? (room.revealNote || 'Joke detour — then back on route.')
    : 'SHUT THE PUNCHLINE';
}

function startChoose(s, room) {
  s.phase = 'choose';
  s.phaseT = 0;
  s.choiceLeft = CHOICE_SECONDS;
  s.timerNoted = false;
  s.nudgeT = 0;
  s.note = room.chooseNote || 'SHUT THE PUNCHLINE';
  maybeRevealTreasure(s, room);
}

function maybeRevealTreasure(s, room) {
  if (!room?.treasure || s.treasureCollected) return;
  if (!s.eligible) return;
  if (s.spawnId && room.treasure.spawnId && s.spawnId !== room.treasure.spawnId) return;
  if (!s.treasure) {
    let tx = room.treasure.x;
    let ty = room.treasure.y;
    if (tx == null && room.treasure.col != null && s.maze) {
      const c = cellCenter(s.maze, room.treasure.col, room.treasure.row);
      tx = c.x; ty = c.y;
    }
    s.treasure = {
      id: s.treasureId,
      x: tx ?? 450,
      y: ty ?? 470,
      r: room.treasure.r || 58,
      taken: false,
    };
  }
  if (!s.treasure.taken) {
    s.treasureRevealed = true;
    s.treasureWindow = true;
  }
}

function takeTreasure(s) {
  if (!s.treasure || s.treasure.taken || !s.eligible) return false;
  s.treasure.taken = true;
  s.treasureWindow = false;
  recordTreasure(s, s.treasure.id);
  s.holdBeat = TREASURE_HOLD;
  s.note = 'Laughing-doorway keepsake! A beat to keep it.';
  logAction(s, 'treasure', {id: s.treasure.id});
  return true;
}

function beginDoorPress(s, door) {
  if (!door || s.phase !== 'choose' || s.doorPress) return;
  s.doorPress = {id: door.id, t: 0, door};
  s.note = door.lastLaugh
    ? 'The last laughing door lets you through.'
    : (door.correct
      ? 'Shutting the punchline…'
      : 'A joke door. The house has a detour for that.');
  if (s.player) {
    s.player.x = clamp(s.player.x + Math.sign(door.x - s.player.x) * 12, STAGE.xMin + 40, STAGE.xMax - 40);
  }
}

function releaseDoorPress(s) {
  if (!s.doorPress) return;
  s.doorPress = null;
  if (s.phase === 'choose') s.note = 'SHUT a door · hold or ← →';
}

function commitDoor(s, door) {
  if (!door) return;
  const room = roomOf(s.graph, s.roomId);
  logAction(s, 'door', {room: room.id, door: door.id, correct: !!door.correct, punchline: door.punchline || ''});
  s.picked = (s.picked || 0) + 1;
  if (door.correct) {
    s.cleared += 1;
    clearFacesPowerPellet(s);
  }
  s.doorPress = null;
  s.phase = 'transition';
  s.phaseT = 0;
  s.panel = 0;
  if (door.to === 'exit' || door.lastLaugh) {
    s.pendingExit = true;
    s.nextRoom = null;
    s.note = 'The last laughing door lets you through.';
    return;
  }
  s.pendingExit = false;
  s.nextRoom = door.to;
  s.note = door.correct
    ? 'Punchline shut — faces gulp and vanish.'
    : 'Wrong punchline — joke detour, then rejoin.';
}

function pickDoor(s, door) {
  if (!door || s.phase !== 'choose' || s.doorPress) return;
  if (s.reduced) {
    commitDoor(s, door);
    return;
  }
  beginDoorPress(s, door);
}

function inspectSpot(s, spot) {
  if (!spot) return;
  logAction(s, 'inspect', {room: s.roomId, id: spot.id});
  s.inspectPulse = 1;
  if (spot.kind === 'clue' || spot.id === 'setup-prop') {
    s.note = spot.flavor || 'The setup is on the oval. Finish it on a door.';
    return;
  }
  if (spot.kind === 'find' && spot.find && !s.findsTaken[spot.id]) {
    s.findsTaken[spot.id] = true;
    recordFind(s, spot.find, RIDE);
    s.flies = s.flies || [];
    s.flies.push({
      id: spot.find,
      x: spot.x,
      y: spot.y,
      t: 0,
      dur: FLY_DUR,
    });
    s.note = spot.flavor || 'A small find.';
    return;
  }
  s.note = spot.flavor || 'Nothing more here.';
}

function leaveRide(s) {
  finishRide(s, {
    rideId: RIDE,
    treasureId: s.treasureId,
    challengeOk: true,
    completionFind: 'everyday-penny',
  });
}

function doorByAction(s, room, id) {
  if (!room) return null;
  if (id !== 'left' && id !== 'right') return null;
  return doorViews(s, room).find(row => row.id === id) || null;
}

function beginSpin(s, room) {
  s.phase = 'spin';
  s.phaseT = 0;
  s.spinT = 0;
  s.spun = false;
  s.doorPress = null;
  s.note = room.teachRotate
    ? 'MARKED — the room turns…'
    : 'Room turns…';
}


/* ─── Ch1 Laughing Maze ─────────────────────────────────────────── */

const DIRS = {
  up: {dc: 0, dr: -1},
  down: {dc: 0, dr: 1},
  left: {dc: -1, dr: 0},
  right: {dc: 1, dr: 0},
};

function parseMaze(spec) {
  const rows = spec.layout;
  const grid = [];
  const pellets = [];
  const powers = [];
  let start = {c: 5, r: 11};
  const faceSpawns = [];
  let doorCell = null;
  for (let r = 0; r < rows.length; r++) {
    const line = rows[r];
    const row = [];
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      const wall = ch === '#';
      row.push(wall ? 1 : 0);
      if (ch === '.' || ch === 'o') {
        const kind = ch === 'o' ? 'power' : (['star', 'moon', 'penny'][(c + r) % 3]);
        const entry = {c, r, kind, taken: false};
        pellets.push(entry);
        if (ch === 'o') powers.push(entry);
      }
      if (ch === 'S') start = {c, r};
      if (ch === 'F') faceSpawns.push({c, r});
      if (ch === 'D') doorCell = {c, r};
    }
    grid.push(row);
  }
  if (!faceSpawns.length) faceSpawns.push({c: 5, r: 5});
  const pelletTotal = pellets.length;
  const clearGoal = Math.max(1, Math.min(spec.clearGoal || pelletTotal, pelletTotal));
  return {
    cols: spec.cols,
    rows: spec.rows,
    cell: spec.cell,
    ox: spec.ox,
    oy: spec.oy,
    powerSec: spec.powerSec,
    faceSpeed: spec.faceSpeed,
    playerSpeed: spec.playerSpeed,
    faceCount: spec.faceCount || 3,
    clearGoal,
    grid,
    pellets,
    powers,
    start,
    faceSpawns,
    doorCell,
    pelletTotal,
  };
}

function cellCenter(maze, c, r) {
  return {
    x: maze.ox + (c + 0.5) * maze.cell,
    y: maze.oy + (r + 0.5) * maze.cell,
  };
}

function worldToCell(maze, x, y) {
  const c = Math.floor((x - maze.ox) / maze.cell);
  const r = Math.floor((y - maze.oy) / maze.cell);
  return {c, r};
}

function inBounds(maze, c, r) {
  return r >= 0 && c >= 0 && r < maze.rows && c < maze.cols;
}

function isOpen(maze, c, r) {
  return inBounds(maze, c, r) && maze.grid[r][c] === 0;
}

function initMazePlay(s) {
  const maze = parseMaze(s.graph.maze);
  s.maze = maze;
  s.phase = 'play';
  s.phaseT = 0;
  s.pelletsLeft = maze.pelletTotal;
  s.pelletsTaken = 0;
  s.powerLeft = 0;
  s.facesGulped = 0;
  s.dir = null;
  s.wantDir = null;
  s.heldDirs = {up: false, down: false, left: false, right: false};
  s.swipe = null;
  s.stick = null;
  s.doorShut = false;
  s.cleared = 0;
  s.goal = maze.clearGoal;
  const sc = cellCenter(maze, maze.start.c, maze.start.r);
  s.player = {
    x: sc.x, y: sc.y,
    c: maze.start.c, r: maze.start.r,
    tx: sc.x, ty: sc.y,
    moving: false,
  };
  s.faces = [];
  const n = maze.faceCount;
  for (let i = 0; i < n; i++) {
    const sp = maze.faceSpawns[i % maze.faceSpawns.length];
    const fc = cellCenter(maze, sp.c, sp.r);
    // Spread faces along pocket so they don’t stack.
    const jitter = (i - (n - 1) / 2) * 6;
    s.faces.push({
      x: fc.x + jitter, y: fc.y,
      c: sp.c, r: sp.r,
      tx: fc.x + jitter, ty: fc.y,
      spawn: {...sp},
      alive: true,
      gulp: 0,
      giggle: 0,
      respawn: 0,
      rHit: FACE_R * 0.72,
      wanderT: i * 0.4,
      mode: 'chase',
    });
  }
  s.roomId = 'maze';
  maybeRevealTreasure(s, roomOf(s.graph, 'maze'));
  logAction(s, 'maze-start', {pellets: maze.pelletTotal, clearGoal: maze.clearGoal});
  s.note = s.practice
    ? `Free practice · nothing kept. Chomp ${maze.clearGoal}+ chips · POWER chase-back.`
    : `MOVE · CHOMP ${maze.clearGoal}+ chips · POWER to chase laugh-faces.`;
}

function setWantDir(s, id, down) {
  if (!DIRS[id]) return;
  s.heldDirs[id] = !!down;
  if (down) s.wantDir = id;
  else if (s.wantDir === id) {
    s.wantDir = ['up', 'down', 'left', 'right'].find(k => s.heldDirs[k]) || null;
  }
}

function tryStep(s, dirId) {
  const maze = s.maze;
  const p = s.player;
  if (!maze || !p || !dirId || !DIRS[dirId]) return false;
  const d = DIRS[dirId];
  const nc = p.c + d.dc;
  const nr = p.r + d.dr;
  if (!isOpen(maze, nc, nr)) return false;
  p.c = nc;
  p.r = nr;
  const ctr = cellCenter(maze, nc, nr);
  p.tx = ctr.x;
  p.ty = ctr.y;
  p.moving = true;
  s.dir = dirId;
  return true;
}

function arriveCell(s) {
  const maze = s.maze;
  const p = s.player;
  p.x = p.tx;
  p.y = p.ty;
  p.moving = false;
  // Chomp pellet on this cell
  for (const pel of maze.pellets) {
    if (pel.taken || pel.c !== p.c || pel.r !== p.r) continue;
    pel.taken = true;
    s.pelletsTaken += 1;
    s.pelletsLeft = Math.max(0, s.pelletsLeft - 1);
    s.cleared = s.pelletsTaken;
    if (pel.kind === 'power') {
      s.powerLeft = maze.powerSec;
      s.note = 'PUNCHLINE POWER! Chase the laugh-faces!';
      logAction(s, 'power', {via: 'pellet'});
    } else {
      s.note = `Chomp! ${s.pelletsLeft} chips left.`;
    }
    // Tiny find flavor on some chips (practice-safe recordFind only if not practice? recordFind handles?)
    if (!s.practice && (pel.kind === 'star' || pel.kind === 'moon' || pel.kind === 'penny') && Math.random() < 0.08) {
      const id = pel.kind === 'star' ? 'star-token' : (pel.kind === 'moon' ? 'moon-penny' : 'everyday-penny');
      recordFind(s, id, RIDE);
    }
  }
  // Punchline door set-piece — stepping on D slams the gag (power moment).
  if (maze.doorCell && p.c === maze.doorCell.c && p.r === maze.doorCell.r && !s.doorShut) {
    shutPunchlineDoor(s);
  }
  // Treasure pickup by proximity
  if (s.treasureWindow && s.treasure && !s.treasure.taken) {
    if (hitCircle(p, s.treasure.x, s.treasure.y, s.treasure.r)) takeTreasure(s);
  }
  maybeRevealTreasure(s, roomOf(s.graph, 'maze'));
  if (s.phase === 'play' && s.pelletsTaken >= (maze.clearGoal || maze.pelletTotal)) {
    s.cleared = s.goal;
    s.note = 'Midway cleared — the laughing doorway bows!';
    s.holdBeat = Math.max(s.holdBeat || 0, 0.45);
    s.pendingExit = true;
    s.phase = 'finish';
    s.phaseT = 0;
    logAction(s, 'maze-clear', {gulped: s.facesGulped, taken: s.pelletsTaken, clearGoal: maze.clearGoal});
  }
}

function shutPunchlineDoor(s) {
  const maze = s.maze;
  const p = s.player;
  if (!maze?.doorCell || !p || s.doorShut) return false;
  const dc = maze.doorCell;
  const near = Math.abs(p.c - dc.c) + Math.abs(p.r - dc.r) <= 1;
  if (!near) return false;
  s.doorShut = true;
  s.powerLeft = maze.powerSec;
  s.note = 'Punchline SHUT — faces flee! Chase them!';
  logAction(s, 'power', {via: 'door'});
  return true;
}

function updatePlayerMaze(s, dt) {
  const maze = s.maze;
  const p = s.player;
  if (!maze || !p) return;
  if (s.tagStun > 0) return;
  const speed = (s.reduced ? maze.playerSpeed * 0.7 : maze.playerSpeed);
  if (!p.moving) {
    // Prefer queued wantDir, else current dir
    const tryOrder = s.wantDir ? [s.wantDir, s.dir] : [s.dir];
    for (const id of tryOrder) {
      if (id && tryStep(s, id)) break;
    }
  }
  if (!p.moving) return;
  const dx = p.tx - p.x;
  const dy = p.ty - p.y;
  const dist = Math.hypot(dx, dy);
  const step = speed * dt;
  if (dist <= step || dist < 0.5) {
    arriveCell(s);
  } else {
    p.x += (dx / dist) * step;
    p.y += (dy / dist) * step;
  }
}

function faceNextDir(s, f, toward) {
  const maze = s.maze;
  const options = ['up', 'down', 'left', 'right'];
  // Shuffle lightly by wander
  const scored = [];
  for (const id of options) {
    const d = DIRS[id];
    const nc = f.c + d.dc;
    const nr = f.r + d.dr;
    if (!isOpen(maze, nc, nr)) continue;
    const ctr = cellCenter(maze, nc, nr);
    const px = s.player.x;
    const py = s.player.y;
    const dist = Math.hypot(ctr.x - px, ctr.y - py);
    scored.push({id, dist, nc, nr, ctr});
  }
  if (!scored.length) return null;
  scored.sort((a, b) => toward ? a.dist - b.dist : b.dist - a.dist);
  // Occasional wander pick #2
  f.wanderT = (f.wanderT || 0);
  if (scored.length > 1 && f.wanderT % 1 > 0.72) return scored[1];
  return scored[0];
}

function updateFacesMaze(s, dt) {
  const maze = s.maze;
  if (!maze) return;
  const powered = s.powerLeft > 0;
  const speed = (s.reduced ? maze.faceSpeed * 0.5 : maze.faceSpeed) * (powered ? 0.72 : 1);
  for (const f of s.faces || []) {
    if (f.gulp > 0) {
      f.gulp = Math.max(0, f.gulp - dt);
      if (f.gulp === 0 && !f.alive) f.respawn = FACE_RESPAWN;
      continue;
    }
    if (!f.alive) {
      f.respawn = Math.max(0, (f.respawn || 0) - dt);
      if (f.respawn === 0) {
        f.alive = true;
        f.c = f.spawn.c;
        f.r = f.spawn.r;
        const ctr = cellCenter(maze, f.c, f.r);
        f.x = ctr.x; f.y = ctr.y; f.tx = ctr.x; f.ty = ctr.y;
        f.moving = false;
      }
      continue;
    }
    if (f.giggle > 0) f.giggle = Math.max(0, f.giggle - dt);
    f.wanderT = (f.wanderT || 0) + dt;
    f.mode = powered ? 'flee' : 'chase';

    if (!f.moving) {
      const pick = faceNextDir(s, f, !powered);
      if (pick) {
        f.c = pick.nc;
        f.r = pick.nr;
        f.tx = pick.ctr.x;
        f.ty = pick.ctr.y;
        f.moving = true;
        f.dir = pick.id;
      }
    }
    if (f.moving) {
      const dx = f.tx - f.x;
      const dy = f.ty - f.y;
      const dist = Math.hypot(dx, dy);
      const step = speed * dt;
      if (dist <= step || dist < 0.5) {
        f.x = f.tx; f.y = f.ty; f.moving = false;
      } else {
        f.x += (dx / dist) * step;
        f.y += (dy / dist) * step;
      }
    }

    // Collide with player
    const distP = Math.hypot(f.x - s.player.x, f.y - s.player.y);
    if (distP < (f.rHit || 20) + PLAYER_R * 0.65) {
      if (powered) {
        f.alive = false;
        f.gulp = GULP_DUR;
        f.moving = false;
        s.facesGulped = (s.facesGulped || 0) + 1;
        s.note = 'Gulp! Laugh-face tagged.';
        logAction(s, 'gulp-face', {});
      } else if (s.tagStun <= 0) {
        f.giggle = 0.4;
        s.tagStun = TAG_STUN;
        s.note = 'Giggle bump! Keep chomping.';
        // Soft shove opposite face
        const sx = Math.sign(s.player.x - f.x) || 1;
        const sy = Math.sign(s.player.y - f.y) || 1;
        // Nudge back toward open neighbor if possible
        s.player.x = clamp(s.player.x + sx * 10, maze.ox + 8, maze.ox + maze.cols * maze.cell - 8);
        s.player.y = clamp(s.player.y + sy * 10, maze.oy + 8, maze.oy + maze.rows * maze.cell - 8);
      }
    }
  }
}

function updateMaze(s, dt) {
  if (s.powerLeft > 0) {
    s.powerLeft = Math.max(0, s.powerLeft - dt);
    if (s.powerLeft === 0 && s.phase === 'play') s.note = 'Power faded — chomp on!';
  }
  if (s.phase === 'play') {
    updatePlayerMaze(s, dt);
    updateFacesMaze(s, dt);
    maybeRevealTreasure(s, roomOf(s.graph, 'maze'));
  } else if (s.phase === 'finish') {
    s.phaseT += dt;
    const need = s.reduced ? 0.15 : (s.holdBeat > 0 ? 0.55 : 0.35);
    if (s.phaseT >= need) leaveRide(s);
  }
  s.progress = Math.min(1, (s.pelletsTaken || 0) / Math.max(1, s.goal || 1));
}

function drawMazeCourt(s, d) {
  const maze = s.maze;
  const t = s.t || 0;
  const room = roomOf(s.graph, s.roomId || 'maze');
  // Cream oval stage only — façade stays visible.
  d.ellipse(450, 720, 310, 268, '#f4e6c888', '#e8b84a55', 2);
  d.path([{x: 200, y: 430}, {x: 450, y: 390}, {x: 700, y: 430}], GOLD, 3, false);
  for (let i = 0; i < 7; i++) diamond(d, 210 + i * 80, 428, 11, i % 2 ? BURGUNDY : GOLD, '#f8e4b3');
  drawCurtain(d, 'left', 0.35, t);
  drawCurtain(d, 'right', 0.3, t);
  d.text(room?.title || 'Laughing Maze', 450, 456, 22, INK);
  // Soft wash only — Tent_26_Bea cutouts supply the funhouse set-pieces.
  d.glow(450, 410, 42, '#f4d590');
  d.ellipse(450, 404, 36, 10, '#f4d59055', GOLD, 1.2);
  // Bea maze props around cream oval (outside lanes) — dress BUILD still held.
  drawBeaScenery(d, s);

  if (!maze) return;
  const cell = maze.cell;
  // Corridors + walls as paper wood / cream lanes
  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      const x = maze.ox + c * cell;
      const y = maze.oy + r * cell;
      if (maze.grid[r][c] === 1) {
        d.poly(
          [[x + 2, y + 2], [x + cell - 2, y + 2], [x + cell - 2, y + cell - 2], [x + 2, y + cell - 2]],
          WOOD, GOLD, 1.2,
        );
        // Inner burgundy trim for carnival density
        if ((c + r) % 2 === 0) {
          d.poly(
            [[x + 8, y + 8], [x + cell - 8, y + 8], [x + cell - 8, y + cell - 8], [x + 8, y + cell - 8]],
            '#5c2818', BURGUNDY, 1,
          );
        }
      } else {
        d.poly(
          [[x + 1, y + 1], [x + cell - 1, y + 1], [x + cell - 1, y + cell - 1], [x + 1, y + cell - 1]],
          '#f7ebcfaa', '#e8b84a33', 1,
        );
      }
    }
  }

  // Punchline door set-piece
  if (maze.doorCell) {
    const dc = cellCenter(maze, maze.doorCell.c, maze.doorCell.r);
    const shut = s.doorShut;
    d.poly(
      [[dc.x - 14, dc.y - 16], [dc.x + 14, dc.y - 16], [dc.x + 14, dc.y + 16], [dc.x - 14, dc.y + 16]],
      shut ? '#5a2018' : WOOD, GOLD, 2,
    );
    d.text(shut ? 'SHUT' : 'HA!', dc.x, dc.y + 4, 11, INK);
    if (!shut) d.glow(dc.x, dc.y, 28, '#f4d590');
  }

  // Pellets
  for (const pel of maze.pellets) {
    if (pel.taken) continue;
    const ctr = cellCenter(maze, pel.c, pel.r);
    if (pel.kind === 'power') {
      const pulse = 0.55 + 0.45 * Math.sin(t * 5 + pel.c);
      d.glow(ctr.x, ctr.y, 18 + pulse * 8, '#f4d590');
      d.circle(ctr.x, ctr.y, 9, GOLD, BURGUNDY, 2);
      d.text('!', ctr.x, ctr.y + 4, 12, BURGUNDY);
    } else if (pel.kind === 'star') {
      if (typeof d.star === 'function') d.star(ctr.x, ctr.y, 7, GOLD);
      else diamond(d, ctr.x, ctr.y, 6, GOLD, BURGUNDY);
    } else if (pel.kind === 'moon') {
      d.circle(ctr.x, ctr.y, 5.5, CREAM, GOLD, 1.4);
      d.circle(ctr.x + 2, ctr.y - 1, 3.5, '#f7ebcf');
    } else {
      // penny chip
      d.circle(ctr.x, ctr.y, 4.5, GOLD, WOOD, 1.2);
      d.circle(ctr.x, ctr.y, 2.2, CREAM);
    }
  }

  // Faces
  for (const f of s.faces || []) {
    if (!f.alive && f.gulp <= 0) continue;
    if (s.powerLeft > 0 && f.alive) {
      // Flee tint — cream with burgundy rings
      d.glow(f.x, f.y, 34, '#f4d590');
    }
    drawLaughFace(d, f, t);
  }

  // Player
  if (s.powerLeft > 0) d.glow(s.player.x, s.player.y, 36, '#ffe6a4');
  drawPlayer(d, s);

  if (s.treasure && !s.treasure.taken && s.treasureWindow && s.eligible) {
    d.glow(s.treasure.x, s.treasure.y, 48, '#f4d590');
    d.item(spriteKey(s.treasure.id), s.treasure.x, s.treasure.y, {
      w: 62, shadow: false,
      fallback: () => d.heart(s.treasure.x, s.treasure.y, 16),
    });
  }
  drawFlies(d, s);

  // Lean chip — clearGoal progress (extras remain as bonus chomp)
  const taken = s.pelletsTaken ?? 0;
  const need = s.goal || maze.clearGoal || 24;
  const chip = s.powerLeft > 0
    ? `POWER ${Math.ceil(s.powerLeft)}s · ${taken}/${need}`
    : `${taken}/${need} chips · stick / arrows`;
  drawChip(d, chip, 168, 14);
  // MOVE stick under cream court (helter pad band) — never over maze lanes.
  if (!s.result && !s.broke) drawMazeStick(s, d);
}


function diamond(d, x, y, size, fill, stroke) {
  d.poly([[x, y - size], [x + size * 0.72, y], [x, y + size], [x - size * 0.72, y]], fill, stroke || GOLD, 1.4);
}

function drawSetupProp(d, room, t, pulse) {
  const prop = room.setupProp || 'ladder';
  const x = 450;
  const y = 548;
  if (pulse > 0.05) d.glow(x, y - 8, 70 + pulse * 20, '#ffe6a4');

  if (prop === 'ladder') {
    d.ellipse(x + 4, y + 40, 50, 14, '#12233533');
    d.poly([[x - 28, y + 50], [x - 18, y - 70], [x - 8, y - 70], [x - 18, y + 50]], WOOD, GOLD, 2);
    d.poly([[x + 18, y + 50], [x + 8, y - 70], [x + 18, y - 70], [x + 28, y + 50]], WOOD, GOLD, 2);
    for (let i = 0; i < 5; i++) {
      const yy = y - 55 + i * 24;
      d.path([{x: x - 22 + i * 1.2, y: yy}, {x: x + 22 - i * 1.2, y: yy}], GOLD, 2.2, false);
    }
  } else if (prop === 'flat') {
    d.ellipse(x + 3, y + 18, 70, 16, '#12233533');
    d.poly([[x - 70, y + 8], [x + 70, y + 8], [x + 62, y + 28], [x - 62, y + 28]], BURGUNDY, GOLD, 2);
    d.ellipse(x, y - 6, 54, 22, CREAM, GOLD, 2);
    d.text('flat', x, y, 18, BURGUNDY);
  } else if (prop === 'boo') {
    d.ellipse(x + 3, y + 20, 56, 16, '#12233533');
    d.ellipse(x, y, 58, 48, CREAM, GOLD, 3);
    d.circle(x - 16, y - 6, 7, BURGUNDY);
    d.circle(x + 16, y - 6, 7, BURGUNDY);
    d.arc(x, y + 12, 16, 0.15, Math.PI - 0.15, BURGUNDY, 2.6);
    d.text('BOO', x, y - 52, 20, INK);
  } else if (prop === 'mirror') {
    d.ellipse(x + 3, y + 22, 48, 14, '#12233533');
    d.ellipse(x, y, 40, 54, '#8a9aaa', GOLD, 3);
    d.ellipse(x, y, 30, 42, '#c8d8e8', '#e8f2fa', 2);
    d.path([{x: x - 18, y: y - 20}, {x: x + 10, y: y + 24}], '#ffffff88', 2.2, false);
    d.text('looking-glass', x, y - 66, 15, INK);
  } else if (prop === 'pane') {
    d.ellipse(x + 3, y + 20, 54, 14, '#12233533');
    d.poly([[x - 40, y - 36], [x + 40, y - 36], [x + 40, y + 36], [x - 40, y + 36]],
      '#b8c8d8', GOLD, 2.4);
    d.path([{x: x, y: y - 36}, {x: x, y: y + 36}], GOLD, 1.6, false);
    d.path([{x: x - 40, y: y}, {x: x + 40, y: y}], GOLD, 1.6, false);
    d.text('looking-glass', x, y - 52, 15, INK);
  } else if (prop === 'knock') {
    d.ellipse(x + 3, y + 20, 56, 16, '#12233533');
    d.ellipse(x, y, 58, 48, CREAM, GOLD, 3);
    d.circle(x - 16, y - 6, 7, BURGUNDY);
    d.circle(x + 16, y - 6, 7, BURGUNDY);
    d.arc(x, y + 12, 16, 0.15, Math.PI - 0.15, BURGUNDY, 2.6);
    d.text('KNOCK', x, y - 52, 18, INK);
  } else if (prop === 'spin') {
    d.ellipse(x + 3, y + 22, 54, 14, '#12233533');
    d.ellipse(x, y, 50, 50, WOOD, GOLD, 3);
    d.ellipse(x, y, 34, 34, BURGUNDY, GOLD, 2);
    d.ellipse(x, y, 14, 14, CREAM, GOLD, 2);
    d.arc(x, y, 42, -0.4, Math.PI * 1.2, INK, 2.4);
    d.text('spin', x, y - 66, 16, INK);
  } else if (prop === 'turn') {
    d.ellipse(x + 3, y + 20, 54, 14, '#12233533');
    d.poly([[x - 48, y - 8], [x + 48, y - 18], [x + 42, y + 22], [x - 42, y + 28]],
      BURGUNDY, GOLD, 2.4);
    d.path([{x: x - 30, y: y + 4}, {x: x + 28, y: y - 4}], GOLD, 2, false);
    d.text('turn', x, y - 52, 16, INK);
  } else if (prop === 'flip') {
    d.ellipse(x + 3, y + 20, 56, 16, '#12233533');
    d.ellipse(x, y, 58, 48, CREAM, GOLD, 3);
    d.circle(x - 16, y - 6, 7, BURGUNDY);
    d.circle(x + 16, y - 6, 7, BURGUNDY);
    d.arc(x, y + 12, 16, 0.15, Math.PI - 0.15, BURGUNDY, 2.6);
    d.text('UPSIDE', x, y - 52, 17, INK);
  } else if (prop === 'depth') {
    d.ellipse(x + 3, y + 22, 54, 14, '#12233533');
    // Perspective diamond stack — near large, far tiny.
    d.poly([[x - 48, y + 28], [x + 48, y + 28], [x + 28, y - 8], [x - 28, y - 8]],
      BURGUNDY, GOLD, 2.2);
    d.poly([[x - 22, y - 4], [x + 22, y - 4], [x + 12, y - 36], [x - 12, y - 36]],
      WOOD, GOLD, 2);
    d.poly([[x - 8, y - 34], [x + 8, y - 34], [x + 4, y - 52], [x - 4, y - 52]],
      CREAM, GOLD, 1.6);
    d.text('depth', x, y - 68, 16, INK);
  } else if (prop === 'hall') {
    d.ellipse(x + 3, y + 20, 54, 14, '#12233533');
    d.path([{x: x - 50, y: y + 30}, {x: x - 12, y: y - 50}], GOLD, 2.4, false);
    d.path([{x: x + 50, y: y + 30}, {x: x + 12, y: y - 50}], GOLD, 2.4, false);
    d.path([{x: x - 12, y: y - 50}, {x: x + 12, y: y - 50}], GOLD, 2, false);
    for (let i = 0; i < 4; i++) {
      const u = i / 3;
      const ww = 48 - u * 34;
      const yy = y + 26 - u * 70;
      d.path([{x: x - ww, y: yy}, {x: x + ww, y: yy}], i % 2 ? BURGUNDY : GOLD, 1.8, false);
    }
    d.text('hall', x, y - 66, 16, INK);
  } else if (prop === 'near') {
    d.ellipse(x + 3, y + 20, 56, 16, '#12233533');
    d.ellipse(x, y, 58, 48, CREAM, GOLD, 3);
    d.circle(x - 16, y - 6, 7, BURGUNDY);
    d.circle(x + 16, y - 6, 7, BURGUNDY);
    d.arc(x, y + 12, 16, 0.15, Math.PI - 0.15, BURGUNDY, 2.6);
    d.text('NEAR', x, y - 52, 18, INK);
  } else if (prop === 'carousel' || prop === 'swings' || prop === 'balloons'
    || prop === 'wheel' || prop === 'calliope' || prop === 'slide' || prop === 'bay') {
    // Truthful SETUP plate — names the true ride echo (not a warped decoy).
    d.ellipse(x + 3, y + 22, 54, 14, '#12233533');
    d.ellipse(x, y, 52, 52, WOOD, GOLD, 3);
    d.ellipse(x, y, 38, 38, CREAM, GOLD, 2);
    drawRideEcho(d, prop, x, y, 1, false);
    d.text(String(prop).toUpperCase(), x, y - 66, 16, INK);
  } else {
    d.ellipse(x, y, 44, 36, CREAM, GOLD, 2);
  }

  if (room.setup) {
    const lines = wrapShort(room.setup, 28);
    let yy = 412;
    drawChip(d, 'SETUP', yy, 13);
    yy += 26;
    for (const line of lines) {
      drawChip(d, line, yy, 17);
      yy += 30;
    }
  }
}

function wrapShort(text, max) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (next.length > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function drawLaughFace(d, f, t) {
  if (!f) return;
  const gulping = f.gulp > 0;
  const u = gulping ? 1 - f.gulp / GULP_DUR : 0;
  const scale = gulping ? Math.max(0.08, 1 - u) : 1;
  const x = f.x;
  const y = f.y - (gulping ? u * 30 : 0);
  const bounce = gulping ? 0 : Math.sin(t * 7 + f.x * 0.02) * 3;
  if (f.giggle > 0) d.glow(x, y + bounce, 40, '#ffe6a4');
  d.ellipse(x + 3, y + 18 * scale + bounce, 34 * scale, 12 * scale, '#12233533');
  d.ellipse(x, y + bounce, 32 * scale, 28 * scale, CREAM, BURGUNDY, 2.4);
  // Cream/burgundy comedy mask
  diamond(d, x - 14 * scale, y - 2 * scale + bounce, 8 * scale, BURGUNDY, GOLD);
  diamond(d, x + 14 * scale, y - 2 * scale + bounce, 8 * scale, GOLD, BURGUNDY);
  d.circle(x - 10 * scale, y - 6 * scale + bounce, 4.2 * scale, BURGUNDY);
  d.circle(x + 10 * scale, y - 6 * scale + bounce, 4.2 * scale, BURGUNDY);
  if (gulping) {
    d.ellipse(x, y + 8 * scale + bounce, 14 * scale * (1 + u), 10 * scale * (1 + u), '#1a1010');
  } else {
    d.arc(x, y + 6 + bounce, 12, 0.2, Math.PI - 0.2, BURGUNDY, 2.4);
  }
}

function drawPlayer(d, s) {
  const p = s.player;
  if (!p) return;
  const stun = s.tagStun > 0;
  const shake = stun ? Math.sin((s.t || 0) * 28) * 4 : 0;
  const x = p.x + shake;
  const y = p.y;
  d.ellipse(x + 3, y + 22, 28, 10, '#12233533');
  ensureBeaProps();
  const img = beaPlayerImg;
  if (isMaze(s) && img && img.complete && img.naturalWidth > 0 && typeof d.sprite === 'function') {
    d.sprite(img, x, y - 6, {w: 44, shadow: true});
  } else if (isMaze(s) && img && img.complete && img.naturalWidth > 0) {
    // Fallback if draw.sprite missing — canvas image via item-like ellipse stand-in still OK
    try {
      const ctx = d.c || d.ctx;
      if (ctx && img) {
        const w = 44, h = w * (img.naturalHeight / img.naturalWidth);
        ctx.drawImage(img, x - w / 2, y - h * 0.72, w, h);
      } else {
        d.ellipse(x, y, 22, 28, CREAM, GOLD, 2);
        d.circle(x, y - 28, 14, CREAM, BURGUNDY, 2);
      }
    } catch {
      d.ellipse(x, y, 22, 28, CREAM, GOLD, 2);
      d.circle(x, y - 28, 14, CREAM, BURGUNDY, 2);
    }
  } else {
    d.ellipse(x, y, 22, 28, CREAM, GOLD, 2);
    d.circle(x, y - 28, 14, CREAM, BURGUNDY, 2);
    d.arc(x, y - 24, 7, 0.2, Math.PI - 0.2, BURGUNDY, 1.8);
  }
  if (stun) d.text('!', x + 22, y - 36, 18, INK);
}

function drawCurtain(d, side, puff, t) {
  const left = side === 'left';
  const x0 = left ? 168 : 732;
  const dir = left ? 1 : -1;
  const wave = Math.sin(t * 5.5) * puff * 10;
  const pts = [];
  for (let i = 0; i <= 6; i++) {
    const yy = 430 + i * 42;
    const xx = x0 + dir * (18 + Math.sin(i * 0.9 + t * 3) * (8 + puff * 10) + (i === 2 ? wave : 0));
    pts.push([xx, yy]);
  }
  pts.push([x0 + dir * 4, 690], [x0 - dir * 8, 690], [x0 - dir * 8, 430]);
  d.poly(pts, left ? '#c42848cc' : '#8e1c34cc', GOLD, 1.6);
}

function punchlineTag(door) {
  if (door.lastLaugh) return 'LAUGH';
  const pl = door.punchline || door.label || door.id;
  // Prefer full punchline; wrap handled by larger plate + slightly smaller long lines.
  return String(pl);
}


/** Tiny oval ride glyphs for Midway Echoes — warped = decoy distortion. */
function drawRideEcho(d, ride, x, y, scale = 1, warp = false) {
  const s = Math.max(0.45, scale);
  const wob = warp ? 1.22 : 1;
  const skew = warp ? 8 : 0;
  const fill = warp ? '#8a3040' : BURGUNDY;
  const rim = warp ? '#c87840' : GOLD;
  if (ride === 'carousel') {
    d.ellipse(x + skew * 0.3, y + 2, 22 * s * wob, 10 * s, '#12233533');
    d.ellipse(x + skew, y - 4 * s, 20 * s * wob, 16 * s, fill, rim, 2);
    d.ellipse(x + skew * 0.5, y - 18 * s, 10 * s, 10 * s, CREAM, rim, 1.6);
    d.ellipse(x + skew, y + 6 * s, 16 * s * wob, 6 * s, WOOD, rim, 1.4);
  } else if (ride === 'swings') {
    d.ellipse(x, y + 10 * s, 18 * s, 8 * s, '#12233533');
    d.path([{x: x - 12 * s + skew, y: y - 18 * s}, {x: x - 6 * s, y: y + 8 * s}], rim, 2, false);
    d.path([{x: x + 12 * s - skew, y: y - 18 * s}, {x: x + 6 * s, y: y + 8 * s}], rim, 2, false);
    d.ellipse(x - 6 * s + skew * 0.4, y + 10 * s, 8 * s * wob, 6 * s, fill, rim, 1.6);
    d.ellipse(x + 6 * s - skew * 0.4, y + 10 * s, 8 * s * wob, 6 * s, fill, rim, 1.6);
    d.ellipse(x, y - 20 * s, 16 * s * wob, 5 * s, WOOD, rim, 1.4);
  } else if (ride === 'balloons') {
    d.ellipse(x + skew * 0.2, y + 12 * s, 14 * s, 6 * s, '#12233533');
    d.ellipse(x - 8 * s + skew, y - 6 * s, 10 * s * wob, 12 * s, fill, rim, 1.8);
    d.ellipse(x + 8 * s - skew, y - 10 * s, 9 * s * wob, 11 * s, CREAM, rim, 1.8);
    d.path([{x: x - 8 * s, y: y + 4 * s}, {x: x, y: y + 16 * s}], rim, 1.4, false);
    d.path([{x: x + 8 * s, y: y}, {x: x, y: y + 16 * s}], rim, 1.4, false);
  } else if (ride === 'wheel') {
    d.ellipse(x + skew * 0.2, y + 10 * s, 18 * s, 7 * s, '#12233533');
    d.ellipse(x + skew * 0.5, y, 18 * s * wob, 18 * s, WOOD, rim, 2.2);
    d.ellipse(x + skew * 0.3, y, 10 * s, 10 * s, CREAM, rim, 1.6);
    d.ellipse(x, y, 4 * s, 4 * s, fill, rim, 1.2);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + (warp ? 0.35 : 0);
      d.path([
        {x: x, y: y},
        {x: x + Math.cos(a) * 15 * s + skew * 0.2, y: y + Math.sin(a) * 15 * s},
      ], rim, 1.4, false);
    }
  } else if (ride === 'calliope') {
    d.ellipse(x, y + 12 * s, 16 * s, 6 * s, '#12233533');
    d.ellipse(x + skew * 0.4, y + 2 * s, 18 * s * wob, 14 * s, WOOD, rim, 2);
    d.ellipse(x - 6 * s + skew, y - 14 * s, 5 * s, 12 * s * wob, fill, rim, 1.4);
    d.ellipse(x + skew * 0.2, y - 16 * s, 5 * s, 14 * s * wob, CREAM, rim, 1.4);
    d.ellipse(x + 6 * s - skew, y - 12 * s, 5 * s, 10 * s * wob, fill, rim, 1.4);
  } else if (ride === 'slide') {
    d.ellipse(x, y + 12 * s, 18 * s, 7 * s, '#12233533');
    d.ellipse(x - 10 * s + skew, y - 14 * s, 10 * s, 10 * s, fill, rim, 1.8);
    d.path([
      {x: x - 6 * s + skew, y: y - 10 * s},
      {x: x + 14 * s - skew, y: y + 10 * s},
    ], rim, 3.2, false);
    d.ellipse(x + 12 * s - skew * 0.5, y + 10 * s, 8 * s * wob, 5 * s, CREAM, rim, 1.4);
  } else if (ride === 'bay') {
    d.ellipse(x, y + 10 * s, 20 * s, 8 * s, '#12233533');
    d.ellipse(x + skew * 0.3, y, 22 * s * wob, 14 * s, '#4a6a88', rim, 2);
    d.ellipse(x, y + 4 * s, 16 * s, 6 * s, CREAM, rim, 1.4);
    d.ellipse(x - 6 * s + skew, y - 8 * s, 6 * s, 6 * s, fill, rim, 1.2);
  } else {
    d.ellipse(x, y, 14 * s, 12 * s, CREAM, rim, 1.6);
  }
}

function drawDoor(d, door, s) {
  const x = door.x, y = door.y;
  let hw = door.w / 2, hh = door.h / 2;
  const press = s.doorPress && s.doorPress.id === door.id
    ? Math.min(1, s.doorPress.t / PRESS_MS)
    : 0;
  // Sliding shut squash
  const squash = 1 - press * 0.14;
  const slide = press * 10;
  hw *= squash;
  hh *= squash;
  const pulse = (s.phase === 'choose' && s.choiceLeft <= 0)
    ? 0.55 + 0.45 * Math.sin((s.t || 0) * 4.2)
    : 0;
  if ((s.phase === 'choose' && door.lastLaugh) || pulse > 0.05) {
    d.glow(x, y - 20, 90 + pulse * 24, '#f4d590');
  }
  if (press > 0) d.glow(x, y - 10, 70 + press * 40, '#ffe6a4');
  d.poly(
    [[x - hw, y - hh + 18 + slide], [x + hw, y - hh + 18 + slide], [x + hw, y + hh], [x - hw, y + hh]],
    WOOD, INK, 3,
  );
  d.ellipse(x, y - hh + 18 + slide, hw, 28, WOOD, GOLD, 3);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 2; c++) {
      diamond(d, x - 28 * squash + c * 56 * squash, y - 70 * squash + r * 52 * squash + slide, 16 * squash,
        (r + c) % 2 ? BURGUNDY : GOLD, '#f8e4b3');
    }
  }
  d.circle(x + hw - 22, y + 10 + slide * 0.4, 6, GOLD);
  if (door.lastLaugh) {
    d.ellipse(x, y - 18 + slide, 38, 26, BURGUNDY, INK, 2);
    d.ellipse(x, y - 10 + slide, 24, 14, '#1a1010');
  }
  // Midway Echoes — miniature ride glyph on the door (warped = decoy).
  if (door.echo) {
    const sc = (door.scale || 1) * 0.95;
    drawRideEcho(d, door.echo, x, y - 28 * sc + slide, sc, !!door.warp);
  }
  // Punchline words (primary, large) + side as secondary — plate scales with door (near/far).
  const side = door.id === 'left' ? 'LEFT' : door.id === 'right' ? 'RIGHT' : '';
  const tag = punchlineTag(door);
  const long = tag.length > 14;
  const sc = door.scale || 1;
  const plateW = Math.max(36, 84 * sc);
  const plateH = (long ? 82 : 68) * Math.max(0.55, Math.min(1.1, sc));
  d.poly(
    [[x - plateW, y + hh - plateH], [x + plateW, y + hh - plateH], [x + plateW, y + hh - 6], [x - plateW, y + hh - 6]],
    s.phase === 'choose' ? '#2a1818f2' : '#2a181888', GOLD, 2.6,
  );
  const size = (s.phase === 'choose' ? (long ? 17 : 20) : (long ? 14 : 16)) * Math.max(0.7, Math.min(1.05, sc));
  if (long) {
    const mid = Math.ceil(tag.length / 2);
    let split = tag.lastIndexOf(' ', mid);
    if (split < 6) split = mid;
    d.text(tag.slice(0, split).trim(), x, y + hh - (plateH - 22), size, INK);
    d.text(tag.slice(split).trim(), x, y + hh - (plateH - 42), size, INK);
  } else {
    d.text(tag, x, y + hh - (plateH - 28), size, INK);
  }
  if (side) d.text(side, x, y + hh - 16, 13, GOLD);
  if (press > 0.05) {
    d.text('SHUT', x, y - hh - 8, 20, INK);
  }
}

/** Paper cutouts for inspect targets — stay inside the cream oval. */
function drawCutoutProp(d, spot, taken, t) {
  if (!spot || spot.id === 'setup-prop') return;
  const x = spot.x, y = spot.y;
  if (spot.id === 'cushion' || spot.prop === 'cushion') {
    d.ellipse(x + 3, y + 10, 46, 16, '#12233533');
    d.ellipse(x, y, 44, 22, BURGUNDY, GOLD, 2);
    d.ellipse(x, y - 4, 34, 12, '#8a3040', '#f8e4b3', 1.2);
    if (!taken) d.glow(x, y - 6, 22, '#ffe6a4');
    return;
  }
  if (spot.id === 'panel' || spot.prop === 'panel') {
    d.ellipse(x + 2, y + 18, 38, 12, '#12233533');
    d.poly([[x - 36, y - 28], [x + 36, y - 24], [x + 34, y + 30], [x - 34, y + 26]],
      CREAM, GOLD, 2);
    d.path([{x: x - 28, y: y - 6}, {x: x + 28, y: y - 2}], '#b78b48', 1.5, false);
    if (!taken) {
      d.glow(x, y, 24, '#ffe6a4');
      d.circle(x + 18, y + 4, 5, GOLD);
    }
    return;
  }
  if (spot.id === 'mouth' || spot.prop === 'mouth') {
    d.ellipse(x + 2, y + 14, 34, 12, '#12233533');
    d.ellipse(x, y, 36, 24, BURGUNDY, INK, 2);
    d.ellipse(x, y + 4, 22, 12, '#1a1010');
    d.arc(x, y - 2, 14, 0.15, Math.PI - 0.15, GOLD, 2);
    return;
  }
  d.ellipse(x + 2, y + 8, 18, 8, '#12233533');
  if (!taken) {
    d.glow(x, y, 22, '#ffe6a4');
    d.circle(x, y, 8, CREAM, GOLD, 2);
  }
}

function drawJoke(d, room, t) {
  const bounce = Math.sin(t * 8) * 10;
  if (room.joke === 'pie') {
    d.ellipse(450, 640 + bounce, 70, 22, '#f7efe0', GOLD, 2);
    d.ellipse(450, 628 + bounce, 54, 16, '#f0d09a');
    d.ellipse(450, 622 + bounce, 40, 12, CREAM);
    d.text('splut', 450, 700, 22, INK);
  } else if (room.joke === 'whoopee') {
    d.ellipse(450, 760, 120, 28, '#c4284888', GOLD, 2);
    d.ellipse(450, 748 + bounce * 0.4, 90, 18, BURGUNDY, INK, 2);
    d.text('whoopee', 450, 700, 24, INK);
  } else if (room.joke === 'shard') {
    d.ellipse(450, 700 + bounce * 0.3, 70, 18, '#12233533');
    d.poly([[410, 620 + bounce], [470, 600 + bounce], [490, 680 + bounce], [430, 710 + bounce]],
      '#c8d8e8', GOLD, 2.2);
    d.path([{x: 430, y: 640 + bounce}, {x: 470, y: 690 + bounce}], '#ffffff88', 2, false);
    d.text('shard', 450, 760, 22, INK);
  } else if (room.joke === 'cracked') {
    d.ellipse(450, 660, 64, 80, '#8a9aaa', GOLD, 3);
    d.ellipse(450, 660, 50, 64, '#c8d8e8', '#e8f2fa', 2);
    d.path([{x: 420, y: 620}, {x: 455, y: 660}, {x: 430, y: 710}], BURGUNDY, 2.4, false);
    d.path([{x: 455, y: 660}, {x: 490, y: 700}], BURGUNDY, 2.2, false);
    d.text('crack!', 450, 780, 22, INK);
  } else if (room.joke === 'fog') {
    d.ellipse(450, 660, 70, 86, '#8a9aaa', GOLD, 2.4);
    d.ellipse(450, 660, 56, 70, '#d0d8e0', '#e8eef4', 2);
    d.ellipse(430, 640, 22, 14, '#ffffff66');
    d.ellipse(470, 680, 26, 16, '#ffffff55');
    d.text('fog', 450, 780, 22, INK);
  } else if (room.joke === 'dizzy') {
    d.ellipse(450, 700 + bounce * 0.3, 70, 18, '#12233533');
    d.ellipse(450, 660, 54, 54, WOOD, GOLD, 3);
    d.arc(450, 660, 38, t * 4, t * 4 + Math.PI * 1.4, INK, 3);
    d.text('dizzy', 450, 760, 22, INK);
  } else if (room.joke === 'whirl') {
    d.ellipse(450, 700, 80, 18, '#12233533');
    for (let i = 0; i < 3; i++) {
      const rr = 28 + i * 14;
      d.arc(450, 660, rr, t * 3 + i, t * 3 + i + Math.PI * 1.2, i % 2 ? GOLD : BURGUNDY, 2.4);
    }
    d.text('whirl', 450, 780, 22, INK);
  } else if (room.joke === 'topsy') {
    d.ellipse(450, 700, 70, 18, '#12233533');
    d.poly([[410, 720 + bounce], [490, 720 + bounce], [470, 620 + bounce], [430, 620 + bounce]],
      WOOD, GOLD, 2.4);
    d.ellipse(450, 640 + bounce, 36, 22, CREAM, GOLD, 2);
    d.text('topsy', 450, 780, 22, INK);
  } else if (room.joke === 'tiny') {
    d.ellipse(450, 700, 70, 18, '#12233533');
    d.poly([[435, 640 + bounce], [465, 640 + bounce], [465, 700 + bounce], [435, 700 + bounce]],
      WOOD, GOLD, 2);
    d.ellipse(450, 640 + bounce, 16, 10, WOOD, GOLD, 2);
    d.text('tiny', 450, 760, 22, INK);
  } else if (room.joke === 'echo') {
    d.ellipse(450, 700, 80, 18, '#12233533');
    for (let i = 0; i < 3; i++) {
      d.arc(450, 660, 24 + i * 16, -0.6, 0.6, i % 2 ? GOLD : BURGUNDY, 2.2);
    }
    d.text('echo', 450, 780, 22, INK);
  } else if (room.joke === 'vanish') {
    d.ellipse(450, 700, 70, 18, '#12233533');
    d.ellipse(450, 660 + bounce * 0.3, 40, 50, '#c4284855', GOLD, 2);
    d.ellipse(450, 660, 22, 28, '#2a181866', GOLD, 1.6);
    d.text('vanish', 450, 780, 22, INK);
  } else if (room.joke === 'warble') {
    d.ellipse(450, 700, 70, 18, '#12233533');
    d.ellipse(450, 660 + bounce * 0.2, 36, 44, WOOD, GOLD, 2.4);
    d.arc(450, 650, 22, -0.8, 0.8, BURGUNDY, 2.2);
    d.arc(450, 670, 16, -0.6, 0.6, GOLD, 2);
    d.text('warble', 450, 780, 22, INK);
  } else if (room.joke === 'static') {
    d.ellipse(450, 700, 80, 18, '#12233533');
    for (let i = 0; i < 5; i++) {
      const yy = 620 + i * 18 + bounce * (i % 2 ? 0.3 : -0.2);
      d.path([{x: 410 + (i % 2) * 8, y: yy}, {x: 490 - (i % 2) * 8, y: yy + 4}],
        i % 2 ? GOLD : BURGUNDY, 2, false);
    }
    d.text('static', 450, 780, 22, INK);
  } else if (room.joke === 'sour') {
    d.ellipse(450, 700, 70, 18, '#12233533');
    d.ellipse(450, 660 + bounce * 0.2, 40, 48, '#8a3040', GOLD, 2.4);
    d.arc(450, 668, 14, Math.PI + 0.2, -0.2, INK, 2.4);
    d.circle(450 - 12, 648, 5, INK);
    d.circle(450 + 12, 648, 5, INK);
    d.text('sour', 450, 780, 22, INK);
  } else {
    d.poly([[410, 620], [490, 620], [490, 760], [410, 760]], WOOD, GOLD, 2);
    d.ellipse(450, 620, 40, 16, WOOD, GOLD, 2);
    d.text('honk', 450, 800, 22, INK);
  }
}

/** Mirror panel — visual lie: shows door punchlines swapped/reversed. */
function shortPunch(text, max = 16) {
  const s = String(text || '');
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trim() + '…';
}

function drawMirror(d, room, s, t) {
  if (!room?.mirror) return;
  const doors = room.doors || [];
  const left = doors.find(row => row.id === 'left');
  const right = doors.find(row => row.id === 'right');
  if (!left || !right) return;
  // Reflection swaps sides — glass lies; real doors keep truth.
  const lieLeft = shortPunch(right.punchline || right.label);
  const lieRight = shortPunch(left.punchline || left.label);
  const mx = 450;
  const my = 648;
  const teachPulse = room.teach && (s.phase === 'reveal' || s.phase === 'inspect' || s.phase === 'choose')
    ? 0.55 + 0.45 * Math.sin((t || 0) * 4.2)
    : 0;
  if (teachPulse > 0.05) d.glow(mx, my, 78 + teachPulse * 18, '#c8d8e8');
  d.ellipse(mx + 3, my + 48, 58, 16, '#12233533');
  // Paper oval mirror frame — stays on cream stage oval.
  d.ellipse(mx, my, 70, 92, WOOD, GOLD, 3);
  d.ellipse(mx, my, 56, 76, '#8a9aaa', GOLD, 2.2);
  d.ellipse(mx, my, 48, 66, '#b8cce0', '#e8f2fa', 1.8);
  // Glint
  d.path([{x: mx - 22, y: my - 36}, {x: mx - 4, y: my + 10}], '#ffffff88', 2.2, false);
  d.text('MIRROR', mx, my - 78, 13, GOLD);
  // Swapped punchline reflections (the lie)
  d.poly(
    [[mx - 44, my - 28], [mx + 44, my - 28], [mx + 44, my - 2], [mx - 44, my - 2]],
    '#2a1818cc', GOLD, 1.4,
  );
  d.text('L→ ' + lieLeft, mx, my - 10, 12, INK);
  d.poly(
    [[mx - 44, my + 6], [mx + 44, my + 6], [mx + 44, my + 32], [mx - 44, my + 32]],
    '#2a1818cc', GOLD, 1.4,
  );
  d.text('R→ ' + lieRight, mx, my + 24, 12, INK);
  d.text('lies', mx, my + 48, 12, BURGUNDY);
}

function drawChip(d, label, y, size = 16) {
  const w = Math.min(520, 28 + label.length * (size * 0.58));
  d.poly(
    [[450 - w / 2, y - 18], [450 + w / 2, y - 18], [450 + w / 2, y + 16], [450 - w / 2, y + 16]],
    '#2a1818ee', GOLD, 2.2,
  );
  d.text(label, 450, y + 5, size, INK);
}

/** Lean chrome — shell .play-hud owns practice/eligible; teach coach only. */
function drawClarityChrome(s, d) {
  // Shell `.play-hud` + `#readout` own status. Court gets ONE teach coach only —
  // no practice chips, no permanent SHUT verb chip (doors already say SHUT).
  const room = roomOf(s.graph, s.roomId);
  if (room.kind !== 'main' || s.phase === 'transition' || s.phase === 'enter') return;
  const teaching = !!(room.teach || room.teachRotate || room.teachShrink || room.teachEcho || room.teachFinale);
  if (!teaching) return;
  let coach = '';
  if (room.teachFinale) {
    coach = s.phase === 'choose' ? 'TRUST THE SETUP → SHUT' : 'LAST LAUGH — TRUST THE SETUP';
  } else if (room.teach) {
    coach = 'MIRROR LIES — finish the SETUP';
  } else if (room.teachRotate) {
    if (s.phase === 'spin') coach = 'ROOM TURNS';
    else if (s.phase === 'choose') coach = 'REMEMBER — then SHUT';
    else coach = 'MARK THE DOORS — then it turns';
  } else if (room.teachShrink) {
    coach = s.phase === 'choose' ? 'SHUT THE NEAR PUNCHLINE' : 'MARK SETUP → WHICH IS NEAR?';
  } else if (room.teachEcho) {
    coach = s.phase === 'choose' ? 'MATCH THE RIDE → SHUT' : 'HEAR THE ECHO → MATCH THE RIDE';
  }
  if (coach) drawChip(d, coach, 168, 14);
}

function drawTransitionPanel(d, s) {
  const k = s.reduced ? 1 : Math.min(1, s.panel || 0);
  if (k <= 0) return;
  const leftX = 160 + k * 290;
  const rightX = 740 - k * 290;
  const mid = 450;
  const seam = mid + Math.sin((s.t || 0) * 3) * (1 - k) * 4;
  d.poly(
    [[160, 400], [leftX, 400], [seam - 8, 690], [leftX - 10, 980], [160, 980]],
    '#f7efe0f0', GOLD, 2,
  );
  d.poly(
    [[740, 400], [rightX, 400], [seam + 8, 690], [rightX + 10, 980], [740, 980]],
    '#f3e6c8f0', GOLD, 2,
  );
  for (let i = 0; i < 5; i++) {
    const yy = 460 + i * 90;
    diamond(d, leftX - 6, yy, 9, i % 2 ? BURGUNDY : GOLD, '#f8e4b3');
    diamond(d, rightX + 6, yy, 9, i % 2 ? GOLD : BURGUNDY, '#f8e4b3');
  }
  d.path([{x: seam - 4, y: 420}, {x: seam + 4, y: 960}], GOLD, 2.2, false);
}

function drawFlies(d, s) {
  const flies = s.flies || [];
  for (const f of flies) {
    const u = Math.min(1, f.t / f.dur);
    const e = 1 - (1 - u) * (1 - u);
    const x = f.x + (PURSE_X - f.x) * e;
    const y = f.y + (PURSE_Y - f.y) * e;
    const alphaFade = 1 - u * 0.85;
    d.item(spriteKey(f.id), x, y, {
      w: 28 * (1 - u * 0.4),
      shadow: false,
      alpha: alphaFade,
      fallback: () => d.circle(x, y, 7 * (1 - u * 0.35), CREAM, GOLD, 1.5),
    });
  }
}

/** Perspective floor tiles — prove near (large) vs far (tiny) on shrink rooms. */
function drawPerspectiveFloor(d, room, s, t) {
  if (!room?.shrink || room.kind !== 'main') return;
  const teachPulse = room.teachShrink && (s.phase === 'reveal' || s.phase === 'inspect' || s.phase === 'choose')
    ? 0.45 + 0.35 * Math.sin((t || 0) * 3.6)
    : 0;
  // Vanishing lines toward upper center of the oval stage.
  const vpX = 450, vpY = 520;
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    const x0 = 450 + i * 78;
    d.path([{x: x0, y: 900}, {x: vpX + i * 8, y: vpY}], '#e8b84a66', 1.6, false);
  }
  // Horizontal tile bands — wider near, narrower far.
  for (let row = 0; row < 5; row++) {
    const u = row / 4;
    const yy = 880 - u * 280;
    const half = 250 - u * 170;
    d.path([{x: 450 - half, y: yy}, {x: 450 + half, y: yy}], row % 2 ? '#c4284855' : '#e8b84a55', 2, false);
    // Soft tile diamonds that shrink with depth.
    const tiles = 5 - row;
    for (let c = 0; c < tiles; c++) {
      const tx = 450 - half + (c + 0.5) * (half * 2 / tiles);
      const sz = 10 - row * 1.4;
      diamond(d, tx, yy - 6, Math.max(4, sz), row % 2 ? BURGUNDY : GOLD, '#f8e4b3');
    }
  }
  // Door-base shadows sized by near/far.
  for (const door of doorViews(s, room)) {
    const near = !!door.near;
    const sw = (door.w || 168) * (near ? 0.55 : 0.28);
    const sh = near ? 18 : 10;
    d.ellipse(door.x + 4, door.y + (door.h || 268) * 0.42, sw, sh, '#12233544');
    if (near && teachPulse > 0.05) {
      d.glow(door.x, door.y - 10, 50 + teachPulse * 14, '#f4d590');
    }
  }
  if (room.teachShrink && (s.phase === 'reveal' || s.phase === 'inspect')) {
  }
}


/** Midway Echoes teach cue — SETUP names the true ride; doors carry miniatures. */
function drawEchoHints(d, room, s, t) {
  if (!room?.echo || room.kind !== 'main') return;
  const teachPulse = room.teachEcho && (s.phase === 'reveal' || s.phase === 'inspect' || s.phase === 'choose')
    ? 0.45 + 0.35 * Math.sin((t || 0) * 3.6)
    : 0;
  if (teachPulse > 0.05) {
    d.glow(450, 548, 64 + teachPulse * 16, '#f4d590');
  }
  if (room.teachEcho && (s.phase === 'reveal' || s.phase === 'inspect')) {
  }
}



function tryActionInspect(s) {
  if (s.result || s.broke) return;
  if (isMaze(s)) {
    shutPunchlineDoor(s);
    return;
  }
  if (s.phase !== 'inspect' && s.phase !== 'choose') return;
  const room = roomOf(s.graph, s.roomId);
  const spots = room.inspect || [];
  const find = spots.find(row => row.kind === 'find' && !s.findsTaken[row.id]);
  const target = find || spots.find(row => row.kind === 'clue') || spots[0];
  if (target) inspectSpot(s, target);
}

function drawRoom(s, d) {
  if (isMaze(s)) {
    drawMazeCourt(s, d);
    return;
  }
  const room = roomOf(s.graph, s.roomId);
  const t = s.t;
  const puff = room.kind === 'detour' ? 0.2 : (s.phase === 'choose' ? 0.85 : 0.35);
  d.ellipse(450, 720, 310, 268, '#f4e6c888', '#e8b84a55', 2);
  d.path([{x: 200, y: 430}, {x: 450, y: 390}, {x: 700, y: 430}], GOLD, 3, false);
  for (let i = 0; i < 7; i++) diamond(d, 210 + i * 80, 428, 11, i % 2 ? BURGUNDY : GOLD, '#f8e4b3');
  drawCurtain(d, 'left', puff, t);
  drawCurtain(d, 'right', puff * 0.85, t);
  d.text(room.title, 450, 456, 22, INK);

  if (room.kind === 'detour') {
    drawJoke(d, room, t);
    drawLaughFace(d, {x: 450, y: 530, alive: true, gulp: 0, giggle: 0.5}, t);
  } else {
    drawSetupProp(d, room, t, s.inspectPulse || 0);
    (room.inspect || []).forEach(spot => {
      if (spot.id === 'setup-prop') return;
      const taken = spot.kind === 'find' && s.findsTaken[spot.id];
      drawCutoutProp(d, spot, taken, t);
    });
    drawMirror(d, room, s, t);
    drawPerspectiveFloor(d, room, s, t);
    drawEchoHints(d, room, s, t);
    const views = doorViews(s, room);
    views.forEach(door => drawDoor(d, door, s));
    if (room.rotate && s.phase === 'spin') {
      const pulse = 0.55 + 0.45 * Math.sin((t || 0) * 5);
      d.glow(450, 780, 70 + pulse * 16, '#f4d590');
    }
    drawPlayer(d, s);
    (s.faces || []).forEach(f => drawLaughFace(d, f, t));
  }

  if (s.treasure && !s.treasure.taken && s.treasureWindow && s.eligible) {
    d.glow(s.treasure.x, s.treasure.y, 48, '#f4d590');
    d.item(spriteKey(s.treasure.id), s.treasure.x, s.treasure.y, {
      w: 62, shadow: false,
      fallback: () => d.heart(s.treasure.x, s.treasure.y, 16),
    });
  }
  drawFlies(d, s);
  drawClarityChrome(s, d);
  if (s.phase === 'choose') {
    const left = Math.max(0, s.choiceLeft);
    d.arc(450, 980, 26, -Math.PI / 2, -Math.PI / 2 + (left / CHOICE_SECONDS) * Math.PI * 2, GOLD, 5);
    d.text(Math.ceil(left) + 's', 450, 986, 16, INK);
  }
  if (s.phase === 'transition') {
    drawTransitionPanel(d, s);
  }
}

function updateDoorChapter(s, dt) {
  const room = roomOf(s.graph, s.roomId);
  const reduced = s.reduced;
  updateFaces(s, dt, room);

  if (s.doorPress) {
    s.doorPress.t += dt;
    if (s.doorPress.t >= PRESS_MS) {
      const door = s.doorPress.door;
      commitDoor(s, door);
    }
    s.progress = Math.min(1, (s.cleared + 0.15) / Math.max(1, s.goal));
    return;
  }

  if (s.phase === 'enter') {
    const need = reduced ? 0.12 : PHASE_SECONDS.enter;
    if (s.phaseT >= need) {
      s.phase = 'reveal';
      s.phaseT = 0;
      s.note = room.revealNote || 'SHUT THE PUNCHLINE';
      if (room.kind === 'main') spawnFaces(s, room);
    }
  } else if (s.phase === 'reveal') {
    const revealNeed = room.kind === 'detour'
      ? (reduced ? 0.5 : PHASE_SECONDS.detourReveal)
      : (reduced ? 0.18 : (room.revealSec ?? PHASE_SECONDS.reveal));
    if (s.phaseT >= revealNeed) {
      s.clueDone = true;
      if (room.kind === 'detour') {
        s.phase = 'transition';
        s.phaseT = 0;
        s.panel = 0;
        s.nextRoom = room.rejoin;
      } else {
        s.phase = 'inspect';
        s.phaseT = 0;
        s.note = room.inspectNote
          || (room.mirror
            ? 'Glass swaps punchlines — read the real doors, then SHUT.'
            : (room.rotate
              ? 'Mark the punchline doors — then the room turns.'
              : (room.shrink
                ? 'Floor tiles prove depth — SHUT the NEAR punchline.'
                : (room.echo
                  ? 'SETUP names the true ride — match that miniature, then SHUT.'
                  : 'Read the punchline doors — then SHUT.'))));
        maybeRevealTreasure(s, room);
      }
    }
  } else if (s.phase === 'inspect') {
    maybeRevealTreasure(s, room);
    const inspectNeed = reduced ? 0.45 : (room.inspectSec ?? PHASE_SECONDS.inspect);
    if (s.phaseT >= inspectNeed) {
      if (room.rotate) {
        if (reduced) {
          s.spun = true;
          s.spinT = spinDur(room);
          startChoose(s, room);
          if (room.teachRotate) s.note = 'REMEMBER — then SHUT the door that finishes the SETUP.';
        } else {
          beginSpin(s, room);
        }
      } else {
        startChoose(s, room);
      }
    }
  } else if (s.phase === 'spin') {
    s.spinT += dt;
    const need = spinDur(room);
    if (s.spinT >= need) {
      s.spun = true;
      s.spinT = need;
      startChoose(s, room);
      if (room.teachRotate) {
        s.note = 'REMEMBER — then SHUT the door that finishes the SETUP.';
      }
    }
  } else if (s.phase === 'choose') {
    s.choiceLeft = Math.max(0, s.choiceLeft - dt);
    maybeRevealTreasure(s, room);
    if (s.choiceLeft === 0) {
      s.nudgeT = (s.nudgeT || 0) + dt;
      if (!s.timerNoted) {
        s.timerNoted = true;
        s.note = 'SHUT THE PUNCHLINE';
        s.nudgeT = 0;
      } else if (s.nudgeT >= NUDGE_SEC) {
        s.nudgeT = 0;
        s.note = 'SHUT a door · hold or ← →';
      }
    }
  } else if (s.phase === 'transition') {
    if (reduced) {
      s.panel = 1;
    } else {
      s.panel = Math.min(1, s.phaseT / PHASE_SECONDS.transition);
    }
    const holdBlock = s.pendingExit && s.holdBeat > 0;
    const need = reduced ? 0.05 : PHASE_SECONDS.transition;
    if (!holdBlock && s.phaseT >= need) {
      if (s.pendingExit) {
        leaveRide(s);
        return;
      }
      const nxt = s.nextRoom;
      s.nextRoom = null;
      enterRoom(s, nxt || s.graph.start);
    }
  }
  s.progress = Math.min(1, (s.cleared + (s.phase === 'transition' ? 0.4 : 0)) / Math.max(1, s.goal));
}

export default {
  title: 'Laughing Doorway',
  intro: 'Every door tells a different joke. In the Laughing Maze, chomp midway chips, dodge laugh-faces, and grab punchline power to chase them back.',
  instructions: 'Laughing Maze (all 6 chapters): drag the centre-bottom MOVE stick (or swipe / arrow actions / keyboard arrows) through the cream corridors. Chomp star, moon, and penny chips. Laugh-faces chase you — pick up a glowing punchline power pellet (or SHUT the punchline door) to chase them back for a few seconds. Clear the chapter chip goal to finish — extras are bonus. Soft house clock — timer end is an ordinary exit, not a crash. Same maze layout every chapter; later chapters tighten fairness only.',
  levels: LEVEL_NAMES,
  sprites: TREASURES.concat(ORDINARY),
  prizes: TREASURES,
  houseSeconds: 90,
  actions: [
    {id: 'up', label: 'UP · ↑', hold: true},
    {id: 'down', label: 'DOWN · ↓', hold: true},
    {id: 'left', label: 'LEFT · ←', hold: true},
    {id: 'right', label: 'RIGHT · →', hold: true},
  ],
  create(level, rng) {
    const graph = chapterGraph(level);
    const mazeMode = graph.mode === 'maze';
    // All chapters are maze — house clock from chapter fairness (fallback MAZE_HOUSE).
    const houseSecs = mazeMode
      ? (graph.houseSeconds || MAZE_HOUSE)
      : ((level === 1 || level === 2 || level === 3 || level === 4 || level === 5) ? 52 : 90);
    return makeRideState(level, rng, {
      graph,
      roomId: graph.start,
      phase: 'enter',
      phaseT: 0,
      clueDone: false,
      choiceLeft: CHOICE_SECONDS,
      nextRoom: null,
      pendingExit: false,
      cleared: 0,
      mainsEntered: 0,
      seenMain: {},
      findsTaken: {},
      treasureId: TREASURES[level] || TREASURES[0],
      treasureWindow: false,
      goal: mazeMode ? (graph.maze?.clearGoal || 1) : graph.mainCount,
      panel: 0,
      doorPress: null,
      flies: [],
      holdBeat: 0,
      inspectPulse: 0,
      nudgeT: 0,
      timerNoted: false,
      faces: [],
      player: {x: 450, y: 720},
      tagStun: 0,
      spinT: 0,
      spun: false,
      houseSeconds: houseSecs,
      maze: null,
      pelletsLeft: 0,
      pelletsTaken: 0,
      powerLeft: 0,
      dir: null,
      wantDir: null,
      heldDirs: {up: false, down: false, left: false, right: false},
      stick: null,
    });
  },
  update(s, dt) {
    if (s.result || s.broke) return;
    if (ensureBoarded(s, RIDE, s.treasureId, SPAWN_IDS)) {
      s.reduced = s.reduced || !!prefersReducedMotion?.();
      if (isMaze(s) || s.graph?.mode === 'maze') {
        s.houseLeft = s.houseSeconds || s.graph?.houseSeconds || MAZE_HOUSE;
        ensureBeaProps();
        initMazePlay(s);
        return;
      }
      if (s.level === 1 || s.level === 2 || s.level === 3 || s.level === 4 || s.level === 5) {
        s.houseLeft = s.houseSeconds || 58;
      }
      enterRoom(s, s.graph.start);
      const startRoom = roomOf(s.graph, s.graph.start);
      if (s.practice) {
        if (startRoom?.teachFinale) {
          s.note = 'Free practice · nothing kept. LAST LAUGH — TRUST THE SETUP → SHUT THE PUNCHLINE.';
        } else if (startRoom?.teachEcho) {
          s.note = 'Free practice · nothing kept. HEAR THE ECHO → MATCH THE RIDE → SHUT THE PUNCHLINE.';
        } else if (startRoom?.teachShrink) {
          s.note = 'Free practice · nothing kept. MARK THE SETUP — WHICH IS NEAR? SHUT THE NEAR PUNCHLINE.';
        } else if (startRoom?.teachRotate) {
          s.note = 'Free practice · nothing kept. MARK THE DOORS — then SHUT THE PUNCHLINE.';
        } else if (startRoom?.teach) {
          s.note = 'Free practice · nothing kept. MIRROR LIES — SHUT THE PUNCHLINE.';
        } else {
          s.note = 'Free practice · nothing kept. SHUT THE PUNCHLINE.';
        }
      } else if (startRoom?.teachFinale) {
        s.note = 'LAST LAUGH — TRUST THE SETUP → SHUT THE PUNCHLINE.';
      } else if (startRoom?.teachEcho) {
        s.note = 'HEAR THE ECHO → MATCH THE RIDE → SHUT THE PUNCHLINE.';
      } else if (startRoom?.teachShrink) {
        s.note = 'MARK THE SETUP — WHICH IS NEAR? SHUT THE NEAR PUNCHLINE.';
      } else if (startRoom?.teachRotate) {
        s.note = 'MARK THE DOORS — then the room turns. SHUT THE PUNCHLINE.';
      } else if (startRoom?.teach) {
        s.note = 'MIRROR LIES — SHUT the door that finishes the SETUP.';
      } else {
        s.note = 'SHUT THE PUNCHLINE.';
      }
    }
    if (s.result) return;
    s.t += dt;
    s.phaseT += dt;
    if (s.holdBeat > 0) s.holdBeat = Math.max(0, s.holdBeat - dt);
    if (s.inspectPulse > 0) s.inspectPulse = Math.max(0, s.inspectPulse - dt * 2.4);
    if (s.tagStun > 0) s.tagStun = Math.max(0, s.tagStun - dt);
    if (s.flies?.length) {
      for (const f of s.flies) f.t += dt;
      s.flies = s.flies.filter(f => f.t < f.dur);
    }
    if (isMaze(s)) {
      updateMaze(s, dt);
      return;
    }
    updateDoorChapter(s, dt);
  },
  action(s, id, down) {
    if (s.result || s.broke) return;
    if (isMaze(s)) {
      if (id === 'up' || id === 'down' || id === 'left' || id === 'right') {
        setWantDir(s, id, down);
        return;
      }
      if (down && (id === 'inspect' || id === 'shut')) shutPunchlineDoor(s);
      return;
    }
    if (id === 'left' || id === 'right') {
      if (down) {
        const room = roomOf(s.graph, s.roomId);
        const door = doorByAction(s, room, id);
        if (door) beginDoorPress(s, door);
      } else {
        releaseDoorPress(s);
      }
      return;
    }
    if (down && id === 'inspect') tryActionInspect(s);
  },
  pointer(s, type, p) {
    if (s.result || s.broke) return;
    if (isMaze(s)) {
      if (type === 'down') {
        s.tapping = true;
        if (s.treasureWindow && s.treasure && !s.treasure.taken && hitCircle(p, s.treasure.x, s.treasure.y, s.treasure.r)) {
          takeTreasure(s);
          return;
        }
        // Centre-bottom MOVE stick (under court) — prefer over maze swipe.
        if (hitMazeStick(p)) {
          s.swipe = null;
          applyMazeStick(s, p);
          return;
        }
        s.swipe = {x: p.x, y: p.y};
        // Tap adjacent cell → face that way
        if (s.maze && s.player) {
          const cell = worldToCell(s.maze, p.x, p.y);
          const dc = cell.c - s.player.c;
          const dr = cell.r - s.player.r;
          if (Math.abs(dc) + Math.abs(dr) === 1) {
            if (dc === 1) setWantDir(s, 'right', true);
            else if (dc === -1) setWantDir(s, 'left', true);
            else if (dr === 1) setWantDir(s, 'down', true);
            else if (dr === -1) setWantDir(s, 'up', true);
          } else if (s.maze.doorCell && hitCircle(p, cellCenter(s.maze, s.maze.doorCell.c, s.maze.doorCell.r).x, cellCenter(s.maze, s.maze.doorCell.c, s.maze.doorCell.r).y, 28)) {
            shutPunchlineDoor(s);
          }
        }
        return;
      }
      if (type === 'move') {
        if (s.stick?.active) {
          applyMazeStick(s, p);
          return;
        }
        if (s.swipe) {
          const dx = p.x - s.swipe.x;
          const dy = p.y - s.swipe.y;
          if (Math.hypot(dx, dy) > 28) {
            if (Math.abs(dx) > Math.abs(dy)) setWantDir(s, dx > 0 ? 'right' : 'left', true);
            else setWantDir(s, dy > 0 ? 'down' : 'up', true);
            s.swipe = {x: p.x, y: p.y};
          }
        }
        return;
      }
      if (type === 'up' || type === 'cancel') {
        s.tapping = false;
        if (s.stick?.active) {
          releaseMazeStick(s);
          s.swipe = null;
          return;
        }
        s.swipe = null;
        // Release held swipe dirs — keep wantDir as last swipe (continuous run)
        s.heldDirs = {up: false, down: false, left: false, right: false};
        return;
      }
      return;
    }
    if (type === 'up' || type === 'cancel') {
      s.tapping = false;
      releaseDoorPress(s);
      return;
    }
    if (type !== 'down' || s.tapping) return;
    s.tapping = true;
    const room = roomOf(s.graph, s.roomId);
    if (s.phase === 'enter' || s.doorPress) return;
    if (s.treasureWindow && s.treasure && !s.treasure.taken && hitCircle(p, s.treasure.x, s.treasure.y, s.treasure.r)) {
      takeTreasure(s);
      return;
    }
    if (s.phase === 'inspect' || s.phase === 'choose') {
      const spot = (room.inspect || []).find(row => hitCircle(p, row.x, row.y, row.r));
      if (spot) {
        inspectSpot(s, spot);
        if (s.phase === 'inspect') return;
      }
    }
    if (s.phase !== 'choose') return;
    const door = doorViews(s, room).find(row => hitDoor(p, row));
    if (door) pickDoor(s, door);
  },
  key(s, k, down) {
    if (s.result || s.broke) return;
    if (isMaze(s)) {
      const map = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', W: 'up', s: 'down', S: 'down', a: 'left', A: 'left', d: 'right', D: 'right',
      };
      if (map[k]) {
        setWantDir(s, map[k], down);
        return;
      }
      if (down && (k === ' ' || k === 'Enter')) shutPunchlineDoor(s);
      return;
    }
    if (k === 'ArrowLeft' || k === 'ArrowRight') {
      const id = k === 'ArrowLeft' ? 'left' : 'right';
      if (down) {
        const room = roomOf(s.graph, s.roomId);
        const door = doorByAction(s, room, id);
        if (door) beginDoorPress(s, door);
      } else {
        releaseDoorPress(s);
      }
      return;
    }
    if (!down) return;
    if (k === ' ' || k === 'Enter' || k === 'i' || k === 'I') tryActionInspect(s);
  },
  draw(s, d) {
    drawRoom(s, d);
  },
  readout: s => s.note || '',
};
