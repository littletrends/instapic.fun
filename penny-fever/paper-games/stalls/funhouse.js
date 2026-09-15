/* Laughing Doorway — Juno
 *
 * Chapter 1 Two Doors: ENTER → REVEAL → INSPECT → CHOOSE → TRANSITION
 * Locked lane: Pac-Man chase energy × Door Door SHUT × Finish the Joke comedy.
 * Primary verb: SHUT — slam the punchline door that finishes the setup so
 * chasing laugh-faces vanish (power-pellet = correct punchline).
 *
 * Clue: punchline labels on doors finish the setup prop/text on the oval.
 * NOT wink / look-direction Simon.
 *
 * Source of truth: Lorie’s Amusement 6 brief (tagline: Every door tells a different joke).
 * Unfinished chapters (reuse Ch1 graph until authored):
 *   2 Mirror Joke     — one reflection tells truth; another reverses the clue
 *   3 Upside Down     — doors move when the room rotates; remember positions
 *   4 Shrinking Hall  — perspective: floor tiles / shadows prove near vs far
 *   5 Midway Echoes   — distorted versions of the other five rides as clues
 *   6 The Last Laugh  — recombine mirrors, rotation, false treasures; ≤6 rooms
 */
import {spriteKey} from '../prizes.js?v=ritual-3';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure, logAction, drawHud,
  prefersReducedMotion,
} from '../ride-seek.js?v=ride-seek-4';
import {
  RIDE, TREASURES, ORDINARY, LEVEL_NAMES, CHOICE_SECONDS, PHASE_SECONDS, SPAWN_IDS,
  STAGE, chapterGraph, roomOf,
} from './funhouse-rooms.js?v=shut-ch1-1';

const GOLD = '#d2a65b';
const CREAM = '#f3e2bd';
const INK = '#f0d09a';
const BURGUNDY = '#6b2030';
const WOOD = '#4a2418';
/** Door Door weight — hold ~160ms then SHUT commits. */
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

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function hitCircle(p, x, y, r) {
  return Math.hypot(p.x - x, p.y - y) <= r;
}

function hitDoor(p, door) {
  return Math.abs(p.x - door.x) <= door.w / 2 && Math.abs(p.y - door.y) <= door.h / 2;
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
  const chasing = s.phase === 'reveal' || s.phase === 'inspect' || s.phase === 'choose';
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

      // Soft tag during CHOOSE — comedy bump, never instant loss.
      if (s.phase === 'choose' && !s.doorPress && dist < f.r + PLAYER_R) {
        f.giggle = 0.35;
        s.tagStun = TAG_STUN;
        s.note = 'Giggle bump! Still SHUT a punchline.';
        // Comedy shove toward stage center-ish, slight wrong-door feel.
        const wrong = (room.doors || []).find(d => !d.correct);
        if (wrong && s.player) {
          const sx = Math.sign(wrong.x - s.player.x) || 1;
          s.player.x = clamp(s.player.x + sx * 18, STAGE.xMin + 40, STAGE.xMax - 40);
        }
        // Nudge face back so it doesn't sticky-tag every frame.
        f.x = clamp(f.x - (dx / dist) * 36, STAGE.xMin, STAGE.xMax);
        f.y = clamp(f.y - (dy / dist) * 36, STAGE.yMin, STAGE.yMax);
      }
    }
  }
  // Drop finished gulps
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
    s.treasure = {
      id: s.treasureId,
      x: room.treasure.x,
      y: room.treasure.y,
      r: room.treasure.r,
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
  s.note = 'The laughing doorway is yours — a beat to keep it.';
  logAction(s, 'treasure', {id: s.treasure.id});
  return true;
}

function beginDoorPress(s, door) {
  if (!door || s.phase !== 'choose' || s.doorPress) return;
  // Brief tag-stun still allows SHUT — Door Door weight is the commit.
  s.doorPress = {id: door.id, t: 0, door};
  s.note = door.lastLaugh
    ? 'The last laughing door lets you through.'
    : (door.correct
      ? 'Shutting the punchline…'
      : 'A joke door. The house has a detour for that.');
  // Lean player toward the door they are shutting.
  if (s.player) {
    s.player.x = clamp(s.player.x + Math.sign(door.x - s.player.x) * 12, STAGE.xMin + 40, STAGE.xMax - 40);
  }
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

function doorByAction(room, id) {
  if (!room?.doors) return null;
  if (id === 'left' || id === 'right') {
    return room.doors.find(row => row.id === id) || null;
  }
  return null;
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
  } else {
    d.ellipse(x, y, 44, 36, CREAM, GOLD, 2);
  }

  if (room.setup) {
    const lines = wrapShort(room.setup, 34);
    let yy = 430;
    for (const line of lines) {
      drawChip(d, line, yy, 15);
      yy += 28;
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
  d.ellipse(x, y, 22, 28, CREAM, GOLD, 2);
  d.circle(x, y - 28, 14, CREAM, BURGUNDY, 2);
  d.arc(x, y - 24, 7, 0.2, Math.PI - 0.2, BURGUNDY, 1.8);
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
  d.poly(pts, left ? '#6b2030cc' : '#4a1824cc', GOLD, 1.6);
}

function punchlineTag(door) {
  if (door.lastLaugh) return 'LAUGH';
  const pl = door.punchline || door.label || door.id;
  // Keep door tag short for oval readability.
  return String(pl).length > 18 ? String(pl).slice(0, 16) + '…' : String(pl);
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
  // Punchline words (primary) + side as secondary
  const side = door.id === 'left' ? 'LEFT' : door.id === 'right' ? 'RIGHT' : '';
  const tag = punchlineTag(door);
  d.poly(
    [[x - 70, y + hh - 62], [x + 70, y + hh - 62], [x + 70, y + hh - 8], [x - 70, y + hh - 8]],
    s.phase === 'choose' ? '#2a1818ee' : '#2a181866', GOLD, 2,
  );
  d.text(tag, x, y + hh - 38, s.phase === 'choose' ? 15 : 13, INK);
  if (side) d.text(side, x, y + hh - 18, 12, GOLD);
  if (press > 0.05) {
    d.text('SHUT', x, y - hh - 8, 18, INK);
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
    d.ellipse(450, 760, 120, 28, '#6b203088', GOLD, 2);
    d.ellipse(450, 748 + bounce * 0.4, 90, 18, BURGUNDY, INK, 2);
    d.text('whoopee', 450, 700, 24, INK);
  } else {
    d.poly([[410, 620], [490, 620], [490, 760], [410, 760]], WOOD, GOLD, 2);
    d.ellipse(450, 620, 40, 16, WOOD, GOLD, 2);
    d.text('honk', 450, 800, 22, INK);
  }
}

function drawChip(d, label, y, size = 16) {
  const w = Math.min(520, 28 + label.length * (size * 0.58));
  d.poly(
    [[450 - w / 2, y - 18], [450 + w / 2, y - 18], [450 + w / 2, y + 16], [450 - w / 2, y + 16]],
    '#2a1818ee', GOLD, 2.2,
  );
  d.text(label, 450, y + 5, size, INK);
}

/** One verb + practice badge — readable in the first seconds. */
function drawClarityChrome(s, d) {
  if (s.practice) {
    drawChip(d, 'Free practice · nothing kept', 118, 15);
  } else if (s.eligible) {
    drawChip(d, 'Keepsake ride', 118, 15);
  } else {
    drawChip(d, 'Ordinary find ride', 118, 15);
  }

  const room = roomOf(s.graph, s.roomId);
  let verb = 'SHUT THE PUNCHLINE';
  if (room.kind === 'detour') verb = 'JOKE DETOUR';
  else if (s.phase === 'choose') verb = room.last ? 'SHUT THE LAST LAUGH' : 'SHUT THE PUNCHLINE';
  else if (s.phase === 'transition') verb = s.pendingExit ? 'LAST LAUGH' : 'NEXT ROOM';
  drawChip(d, verb, 168, s.phase === 'choose' ? 26 : 22);

  if (s.phase === 'choose') {
    drawChip(d, 'hold a door to SHUT · ← →', 1118, 16);
  }
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

function drawRoom(s, d) {
  const room = roomOf(s.graph, s.roomId);
  const t = s.t;
  const puff = room.kind === 'detour' ? 0.2 : (s.phase === 'choose' ? 0.85 : 0.35);
  // Paper stage on the cream oval only — façade / tents stay visible.
  d.ellipse(450, 720, 310, 268, '#f4e6c888', '#d2a65b55', 2);
  d.path([{x: 200, y: 430}, {x: 450, y: 390}, {x: 700, y: 430}], GOLD, 3, false);
  for (let i = 0; i < 7; i++) diamond(d, 210 + i * 80, 428, 11, i % 2 ? BURGUNDY : GOLD, '#f8e4b3');
  drawCurtain(d, 'left', puff, t);
  drawCurtain(d, 'right', puff * 0.85, t);
  d.text(room.title, 450, 456, 22, INK);

  if (room.kind === 'detour') {
    drawJoke(d, room, t);
    // Detour giggle face (comedy, not chase threat)
    drawLaughFace(d, {x: 450, y: 530, alive: true, gulp: 0, giggle: 0.5}, t);
  } else {
    drawSetupProp(d, room, t, s.inspectPulse || 0);
    (room.inspect || []).forEach(spot => {
      if (spot.id === 'setup-prop') return;
      const taken = spot.kind === 'find' && s.findsTaken[spot.id];
      drawCutoutProp(d, spot, taken, t);
    });
    (room.doors || []).forEach(door => drawDoor(d, door, s));
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

function tryActionDoor(s, id) {
  if (s.result || s.broke || s.phase !== 'choose') return;
  const room = roomOf(s.graph, s.roomId);
  const door = doorByAction(room, id);
  if (door) pickDoor(s, door);
}

function tryActionInspect(s) {
  if (s.result || s.broke) return;
  if (s.phase !== 'inspect' && s.phase !== 'choose') return;
  const room = roomOf(s.graph, s.roomId);
  const spots = room.inspect || [];
  const find = spots.find(row => row.kind === 'find' && !s.findsTaken[row.id]);
  const target = find || spots.find(row => row.kind === 'clue') || spots[0];
  if (target) inspectSpot(s, target);
}

export default {
  title: 'Laughing Doorway',
  intro: 'Every door tells a different joke. Read the setup, SHUT the punchline door, and laughing faces gulp away like a power-pellet clear.',
  instructions: 'SHUT THE PUNCHLINE. A short reveal shows the joke setup and a chasing laugh-face. Read which door finishes the gag, then hold that door to SHUT. Correct punchline clears the faces; wrong doors joke-detour, then rejoin. First chapter ride is free practice and keeps nothing.',
  levels: LEVEL_NAMES,
  sprites: TREASURES.concat(ORDINARY),
  prizes: TREASURES,
  houseSeconds: 90,
  actions: [
    {id: 'left', label: 'SHUT LEFT · ←'},
    {id: 'right', label: 'SHUT RIGHT · →'},
  ],
  create(level, rng) {
    const graph = chapterGraph(level);
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
      goal: graph.mainCount,
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
    });
  },
  update(s, dt) {
    if (s.result || s.broke) return;
    if (ensureBoarded(s, RIDE, s.treasureId, SPAWN_IDS)) {
      s.reduced = s.reduced || !!prefersReducedMotion?.();
      enterRoom(s, s.graph.start);
      s.note = s.practice
        ? 'Free practice · nothing kept. SHUT THE PUNCHLINE.'
        : 'SHUT THE PUNCHLINE.';
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
    const room = roomOf(s.graph, s.roomId);
    const reduced = s.reduced;

    // Chase faces run during reveal/inspect/choose (and gulp in transition).
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
      const need = room.kind === 'detour'
        ? (reduced ? 0.5 : PHASE_SECONDS.detourReveal)
        : (reduced ? 0.18 : PHASE_SECONDS.reveal);
      if (s.phaseT >= need) {
        s.clueDone = true;
        if (room.kind === 'detour') {
          s.phase = 'transition';
          s.phaseT = 0;
          s.panel = 0;
          s.nextRoom = room.rejoin;
        } else {
          s.phase = 'inspect';
          s.phaseT = 0;
          s.note = 'Read the punchline doors — then SHUT.';
          maybeRevealTreasure(s, room);
        }
      }
    } else if (s.phase === 'inspect') {
      maybeRevealTreasure(s, room);
      if (s.phaseT >= (reduced ? 0.45 : PHASE_SECONDS.inspect)) startChoose(s, room);
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
  },
  action(s, id) {
    if (s.result || s.broke) return;
    if (id === 'left' || id === 'right') tryActionDoor(s, id);
    else if (id === 'inspect') tryActionInspect(s);
  },
  pointer(s, type, p) {
    if (s.result || s.broke) return;
    if (type === 'up' || type === 'cancel') {
      s.tapping = false;
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
    const door = (room.doors || []).find(row => hitDoor(p, row));
    if (door) pickDoor(s, door);
  },
  key(s, k, down) {
    if (!down || s.result || s.broke) return;
    if (k === 'ArrowLeft') tryActionDoor(s, 'left');
    if (k === 'ArrowRight') tryActionDoor(s, 'right');
    if (k === ' ' || k === 'Enter' || k === 'i' || k === 'I') tryActionInspect(s);
  },
  draw(s, d) {
    drawRoom(s, d);
    drawHud(d, s, {goal: s.goal, count: s.cleared, label: 'rooms'});
  },
  readout: s => s.note || '',
};
