/**
 * Painted Bay — Arlo (mural / alley-wall-bay)
 * LOCKED remix: Crush Roller + Paperboy in carnival clothes.
 * Verb: SPLASH. The mural rolls past; splash faded patches on the wall;
 * they FILL/flood. No mix-then-HOLD PAINT chrome.
 *
 * Implemented:
 *   1 First Wash — SPLASH any 2 of 3 patches (lantern, balloons, horse)
 *   2 Lantern Row — medallion match; ONE decoy soft-wash taught alone;
 *     then 3 matching SPLASHes (~50s first-play). Soft fails never abort.
 *     On goal, guardWinClock so dry-out cannot beat Practice complete.
 *
 * Unfinished:
 *   3 Carousel Frieze — horse patch only in the window
 *   4 Evening Panorama — splash floods into neighbours
 *   5 Midway Memories — remembered fragments in order
 *   6 The Living Bay — long Sunday route; panorama wakes
 *
 * Hard rule: d.glow() takes 6-digit #rrggbb only.
 */
import {clamp} from '../draw.js';
import {spriteKey} from '../prizes.js?v=ritual-3';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure, logAction, drawHud,
  prefersReducedMotion,
} from '../ride-seek.js?v=ride-seek-4';

const RIDE = 'mural';
const ORDINARY = ['everyday-penny', 'star-token', 'moon-penny'];
const TREASURES = [
  'painted-bay', 'pocket-wheel', 'music-carousel',
  'laughing-doorway', 'balloon-bouquet', 'ride-explorer-pennant',
];
const LEVELS = [
  'First Wash', 'Lantern Row', 'Carousel Frieze',
  'Evening Panorama', 'Midway Memories', 'The Living Bay',
];
const MOTIFS = [
  {id: 'lantern', label: 'Lantern'},
  {id: 'balloons', label: 'Balloons'},
  {id: 'horse', label: 'Horse'},
];
const COLOURS = {
  burgundy: {id: 'burgundy', glyph: '♥', name: 'Burgundy', color: '#6b2030'},
  gold: {id: 'gold', glyph: '★', name: 'Gold', color: '#d2a65b'},
  green: {id: 'green', glyph: '●', name: 'Green', color: '#3a6a4a'},
};

const FRAME = {x: 450, y: 488, w: 260, h: 220};
const GOLD = '#d2a65b';
const BURG = '#6b2030';
const CREAM = '#fff6d8';
const MIX = '#8a4060';
const CURTAIN = 0.9;

function chapterPlan(level, reduced) {
  if (level === 1) {
    // Lantern Row — deepen SPLASH with one teach decoy, then 3 matches.
    const target = COLOURS.burgundy;
    const panels = [
      {id: 'decoy-star', motif: 'balloons', colour: 'gold', match: false, teach: true},
      {id: 'match-lantern', motif: 'lantern', colour: 'burgundy', match: true},
      {id: 'match-horse', motif: 'horse', colour: 'burgundy', match: true},
      {id: 'match-balloons', motif: 'balloons', colour: 'burgundy', match: true},
    ];
    return {
      goal: 3,
      house: 62,
      dwell: reduced ? 7.5 : 6.0,
      speed: reduced ? 70 : 96,
      warn: 4.5,
      target,
      panels,
      foldMedallion: true,
    };
  }
  // First Wash
  return {
    goal: 2,
    house: 70,
    dwell: reduced ? 9.5 : 8.5,
    speed: reduced ? 64 : 88,
    warn: 0,
    target: null,
    foldMedallion: false,
    panels: MOTIFS.map((m) => ({
      id: m.id, motif: m.id, colour: 'burgundy', match: true, teach: false,
    })),
  };
}

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

function screenX(panel, scroll) {
  return panel.world - scroll;
}

function inWindow(panel, scroll) {
  return Math.abs(screenX(panel, scroll) - FRAME.x) < FRAME.w * 0.62;
}

function inFrame(p) {
  return Math.abs(p.x - FRAME.x) < FRAME.w / 2 + 36 && Math.abs(p.y - FRAME.y) < FRAME.h / 2 + 48;
}

function closeRide(s) {
  finishRide(s, {
    rideId: RIDE,
    treasureId: s.treasureId,
    challengeOk: s.restored >= s.goal,
    completionFind: 'star-token',
  });
}

function guardWinClock(s) {
  // Runtime dry-out sets result with won:false while !result.
  // After goal, keep enough clock for discovery + arrive so Practice complete wins.
  if (s.restored < s.goal || s.result) return;
  const need = (s.discoverySecs || 1.55) + 3.2;
  if (s.houseLeft == null || s.houseLeft < need) s.houseLeft = need;
}

function maybeArrive(s) {
  if (s.arriving || s.result) return;
  if (s.restored >= s.goal) {
    guardWinClock(s);
    s.arriving = true;
    s.arriveAt = s.t + 0.55;
  }
}

function nextPending(s) {
  const n = s.panels.length;
  for (let i = 0; i < n; i++) {
    const idx = (s.index + 1 + i) % n;
    const row = s.panels[idx];
    if (!row.restored && !row.spent) return idx;
  }
  return -1;
}

function spawnAt(s, idx) {
  s.paused = false;
  if (idx < 0 || s.restored >= s.goal) {
    maybeArrive(s);
    return;
  }
  s.index = idx;
  const row = s.panels[idx];
  row.held = false;
  row.dwell = 0;
  row.wash = 0;
  row.world = s.scroll + 680;
  s.medalOpen = 1;
  if (row.teach) {
    s.warnLeft = s.warn;
    s.note = 'Wrong colour washes away — wait for ' + (s.target?.glyph || '♥') + '.';
  } else {
    s.warnLeft = 0;
    if (s.target) s.note = 'SPLASH the ' + s.target.glyph + ' match.';
    else s.note = 'SPLASH inside the frame.';
  }
}

function advance(s) {
  if (s.restored >= s.goal) {
    maybeArrive(s);
    return;
  }
  let idx = nextPending(s);
  if (idx < 0) {
    // Recycle unmatched match-patches only (never re-teach spent decoys).
    s.panels.forEach((row) => {
      if (row.match && !row.restored) row.spent = false;
    });
    idx = nextPending(s);
  }
  spawnAt(s, idx);
}

function missPanel(s, row) {
  if (row.restored) return;
  row.held = false;
  row.dwell = 0;
  row.retries = (row.retries || 0) + 1;
  // Teach decoy seats once — miss or soft-wash both spend it so it cannot loop the clock dry.
  if (!row.match || row.teach) {
    row.spent = true;
    s.warnLeft = 0;
  }
  s.note = 'Missed — another patch is rolling in.';
  spawnAt(s, nextPending(s));
}

function softWash(s, panel) {
  // Soft fail — never aborts the ride. Spend the decoy so it does not loop forever.
  panel.wash = 1;
  panel.held = false;
  panel.dwell = 0;
  panel.spent = true;
  s.warnLeft = 0;
  s.paused = true;
  s.softUntil = s.t + 0.75;
  logAction(s, 'wash', {id: panel.id, colour: panel.colour});
  s.note = 'Soft wash — ride continues. Wait for ' + (s.target?.glyph || '♥') + '.';
  s.juice = true;
}

function splash(s, panel) {
  if (!panel || panel.restored || panel.flooding) return;
  if (s.warnLeft > 0 && panel.teach) {
    // Still in teach warn — treat as soft if they tap early on decoy.
  }
  if (!panel.match) {
    softWash(s, panel);
    return;
  }
  panel.restored = true;
  panel.flood = 0.001;
  panel.flooding = true;
  panel.bloom = 1;
  s.restored += 1;
  s.juice = true;
  s.paused = true;
  s.discovery = s.discoverySecs;
  s.liveId = panel.id;
  recordFind(s, ORDINARY[s.restored % ORDINARY.length], RIDE);
  logAction(s, 'splash', {id: panel.id, n: s.restored, colour: panel.colour});
  logAction(s, 'restore', {id: panel.id});
  s.note = 'The wall wakes — ' + s.restored + ' / ' + s.goal + '.';
  if (s.restored >= s.goal) guardWinClock(s);
  if (s.eligible && s.spawnId === panel.id && !s.treasure) {
    s.treasure = {
      id: s.treasureId,
      taken: false,
      panel: panel.id,
      x: FRAME.x,
      y: FRAME.y - 24,
    };
    s.treasureRevealed = true;
    s.note = 'A real glint in the wet paint — tap it.';
  }
}

function drawLantern(d, x, y, faded, flood, t) {
  const a = faded ? 0.28 : 0.92;
  const c = d.c;
  c.save();
  c.globalAlpha = a + flood * 0.7;
  d.line({x, y: y - 78}, {x, y: y - 50}, GOLD, 3);
  d.poly([[x - 26, y - 48], [x + 26, y - 48], [x + 34, y + 36], [x - 34, y + 36]], faded ? '#6b203044' : MIX, GOLD, 2);
  d.poly([[x - 18, y - 64], [x + 18, y - 64], [x + 12, y - 48], [x - 12, y - 48]], BURG, GOLD, 2);
  if (!faded || flood > 0.4) d.glow(x, y - 4, 48 + flood * 30, '#f4d590');
  d.ellipse(x, y - 6, 12, 16, flood > 0.3 ? '#fff6d8' : '#d2a65b55', GOLD, 1);
  c.restore();
}

function drawBalloons(d, x, y, faded, flood, t) {
  const c = d.c;
  c.save();
  c.globalAlpha = (faded ? 0.3 : 0.95) + flood * 0.6;
  const bob = faded ? 0 : Math.sin(t * 2.2) * 5;
  [[-32, -8, '#e8a0b8'], [0, -24, '#7eb8b0'], [30, -4, '#f0d09a']].forEach(([dx, dy, col], i) => {
    const b = bob * (i === 1 ? 1 : 0.6);
    d.ellipse(x + dx, y + dy + b, 20, 26, faded ? col + '55' : col, GOLD, 2);
  });
  d.line({x: x - 32, y: y + 16}, {x, y: y + 62}, GOLD, 1.5);
  d.line({x, y: y + 4}, {x, y: y + 62}, GOLD, 1.5);
  d.line({x: x + 30, y: y + 20}, {x, y: y + 62}, GOLD, 1.5);
  if (flood > 0.4) d.glow(x, y - 10, 40, '#f4d590');
  c.restore();
}

function drawHorse(d, x, y, faded, flood, t) {
  const c = d.c;
  c.save();
  c.globalAlpha = (faded ? 0.3 : 0.95) + flood * 0.6;
  const g = faded ? 0 : Math.sin(t * 4.2) * 4;
  d.poly([
    [x - 64, y + 10 + g], [x + 52, y - 8], [x + 72, y + 22 + g], [x - 48, y + 34],
  ], faded ? '#f7efe044' : '#f7efe0cc', GOLD, 2);
  d.circle(x + 64, y - 2 + g * 0.4, 16, faded ? '#f7efe044' : '#f7efe0cc', GOLD, 2);
  d.poly([[x - 10, y - 8], [x + 24, y - 8], [x + 28, y + 16], [x - 14, y + 18]], BURG, GOLD, 1.5);
  if (flood > 0.4) d.glow(x, y, 36, '#f4d590');
  c.restore();
}

function drawMotif(d, id, x, y, faded, flood, t) {
  if (id === 'balloons') drawBalloons(d, x, y, faded, flood, t);
  else if (id === 'horse') drawHorse(d, x, y, faded, flood, t);
  else drawLantern(d, x, y, faded, flood, t);
}

function drawColourMark(d, colourId, x, y) {
  const col = COLOURS[colourId] || COLOURS.burgundy;
  d.circle(x, y, 22, col.color, GOLD, 2);
  d.text(col.glyph, x, y + 8, 22, CREAM);
}

function drawPracticeBadge(d, s) {
  if (!s.boarded) return;
  const c = d.c;
  const label = s.practice ? 'PRACTICE' : 'PAID';
  const w = s.practice ? 168 : 110;
  c.save();
  roundRect(c, 28, 178, w, 42, 12);
  c.fillStyle = s.practice ? '#6b2030ee' : '#2a1c18ee';
  c.fill();
  c.strokeStyle = GOLD;
  c.lineWidth = 2.5;
  c.stroke();
  c.restore();
  d.text(label, 28 + w / 2, 207, 20, CREAM);
}

function drawCoach(d, s) {
  if (!s.boarded || s.result) return;
  let line = null;
  if (s.warnLeft > 0) {
    line = 'Wrong colour washes — wait for ' + (s.target?.glyph || '♥');
  } else if (!s.juice && s.t < 5.2 && s.level === 0) {
    line = 'SPLASH the faded patch';
  } else if (!s.juice && s.t < 6.5 && s.level === 1) {
    line = 'SPLASH only the ' + (s.target?.glyph || '♥') + ' match';
  }
  if (!line) return;
  const c = d.c;
  c.save();
  roundRect(c, 90, 248, 720, 58, 14);
  c.fillStyle = '#1a1210ee';
  c.fill();
  c.strokeStyle = GOLD;
  c.lineWidth = 3;
  c.stroke();
  c.restore();
  d.text(line, 450, 286, 26, CREAM);
}

function drawMedallion(d, s) {
  if (!s.target) return;
  const open = clamp(s.medalOpen ?? 1, 0, 1);
  if (open <= 0.02) return;
  const x = 780;
  const y = 250;
  const c = d.c;
  c.save();
  c.globalAlpha = open;
  d.circle(x, y, 48, '#3a1c28cc', GOLD, 3);
  d.circle(x, y, 36, s.target.color, GOLD, 2);
  d.text(s.target.glyph, x, y + 10, 28, CREAM);
  d.text('match', x, y + 62, 14, GOLD);
  c.restore();
}

export default {
  title: 'Painted Bay',
  intro: 'Arlo’s platform rolls along the living mural. Splash faded patches as they pass — the wall floods awake. From Lantern Row, match the medallion colour; a wrong splash only washes soft.',
  instructions: 'SPLASH the faded patch when it sits in the frame. Chapter 1: restore any two of three. Chapter 2 (Lantern Row): splash only the medallion match — a wrong colour soft-washes and the ride continues. First ride of each chapter is free practice and keeps nothing.',
  levels: LEVELS,
  sprites: TREASURES.concat(ORDINARY),
  prizes: TREASURES,
  houseSeconds: 70,
  houseTitle: 'The paint dried',
  houseDetail: 'The bay went still before the wall woke. Try this chapter again.',
  actions: [],
  create(level, rng) {
    const reduced = prefersReducedMotion();
    const plan = chapterPlan(level, reduced);
    const panels = plan.panels.map((p, i) => ({
      ...p,
      world: i === 0 ? (p.teach ? 5000 : 900) : 5000,
      restored: false,
      retries: 0,
      dwell: 0,
      held: false,
      flood: 0,
      flooding: false,
      bloom: 0,
      wash: 0,
      spent: false,
    }));
    const spawnIds = panels.filter((p) => p.match).map((p) => p.id);
    return makeRideState(level, rng, {
      reduced,
      panels,
      spawnIds,
      index: 0,
      scroll: 0,
      speed: plan.speed,
      dwellMax: plan.dwell,
      discoverySecs: level === 1 ? 1.55 : 2.6,
      warn: plan.warn,
      warnLeft: plan.panels[0]?.teach ? plan.warn : 0,
      softUntil: 0,
      restored: 0,
      goal: plan.goal,
      target: plan.target,
      foldMedallion: plan.foldMedallion,
      medalOpen: 1,
      paused: false,
      discovery: 0,
      liveId: null,
      arriving: false,
      arriveAt: 0,
      juice: false,
      houseStamp: plan.house,
      treasureId: TREASURES[Math.max(0, Math.min(level, TREASURES.length - 1))],
      note: level === 1 ? 'SPLASH only the ♥ match.' : 'SPLASH the faded patch.',
    });
  },
  update(s, dt) {
    if (s.result || s.broke) return;
    if (ensureBoarded(s, RIDE, s.treasureId, s.spawnIds || s.panels.map((p) => p.id))) {
      if (s.houseStamp && s.houseLeft != null) s.houseLeft = s.houseStamp;
      s.note = s.level === 1 ? 'SPLASH only the ♥ match.' : 'SPLASH the faded patch.';
    }
    if (s.result) return;
    s.t += dt;
    s.progress = Math.min(1, s.restored / Math.max(1, s.goal));
    if (s.restored >= s.goal) guardWinClock(s);

    if (s.warnLeft > 0) s.warnLeft = Math.max(0, s.warnLeft - dt);
    if (s.medalOpen > 0 && s.foldMedallion) {
      // Fold away before / as the patch seats.
      const live = s.panels[s.index];
      if (live && (live.held || inWindow(live, s.scroll))) s.medalOpen = Math.max(0, s.medalOpen - dt / 0.7);
      else if (s.medalOpen < 1) s.medalOpen = Math.min(1, s.medalOpen + dt / 0.35);
    }

    s.panels.forEach((row) => {
      if (row.bloom > 0) row.bloom = Math.max(0, row.bloom - dt * 0.7);
      if (row.wash > 0) row.wash = Math.max(0, row.wash - dt * 0.9);
      if (row.flooding) {
        row.flood = Math.min(1, row.flood + dt / 0.55);
        if (row.flood >= 1) row.flooding = false;
      }
    });

    if (s.arriving) {
      if (s.t >= s.arriveAt) closeRide(s);
      return;
    }

    if (s.t < CURTAIN) return;

    if (s.softUntil && s.t < s.softUntil) return;
    if (s.softUntil && s.t >= s.softUntil) {
      s.softUntil = 0;
      s.paused = false;
      // Recycle the decoy / wrong splash and continue.
      advance(s);
      return;
    }

    if (s.discovery > 0) {
      s.discovery -= dt;
      if (s.discovery <= 0) {
        s.discovery = 0;
        s.paused = false;
        s.liveId = null;
        if (s.restored >= s.goal) maybeArrive(s);
        else advance(s);
      }
      return;
    }

    if (s.restored >= s.goal) {
      maybeArrive(s);
      return;
    }
    let live = s.panels[s.index];
    if (!live || live.restored) {
      advance(s);
      return;
    }
    // Teach warn: hold decoy off-frame until warn drains, then seat it.
    if (live.teach && s.warnLeft > 0) {
      live.world = s.scroll + 820;
      s.paused = true;
      return;
    }
    if (inWindow(live, s.scroll) || live.held) {
      live.held = true;
      live.world = s.scroll + FRAME.x;
      live.dwell += dt;
      s.paused = true;
      if (live.dwell >= s.dwellMax) missPanel(s, live);
    } else {
      s.paused = false;
      s.scroll += dt * s.speed;
    }
  },
  pointer(s, type, p) {
    if (s.result || s.broke || !s.boarded) return;
    if (type !== 'down') return;
    if (s.treasure && !s.treasure.taken && s.discovery > 0) {
      if (Math.hypot(p.x - s.treasure.x, p.y - s.treasure.y) < 64) {
        s.treasure.taken = true;
        recordTreasure(s, s.treasure.id);
        logAction(s, 'treasure', {id: s.treasure.id});
        s.note = 'A real miniature in the wet paint.';
        return;
      }
    }
    if (s.discovery > 0 || s.arriving || (s.softUntil && s.t < s.softUntil)) return;
    const live = s.panels[s.index];
    if (live && !live.restored && (live.held || inWindow(live, s.scroll)) && inFrame(p)) {
      splash(s, live);
    }
  },
  draw(s, d) {
    d.poly([[120, 168], [780, 168], [772, 186], [128, 186]], '#6b203088', GOLD, 2);
    d.poly([[110, 742], [790, 742], [808, 776], [92, 776]], '#6b203066', GOLD, 2);

    const bob = s.reduced ? 0 : Math.sin(s.t * 1.3) * 3;
    d.poly([[250, 700 + bob], [650, 700 + bob], [630, 738 + bob], [270, 738 + bob]], '#6b2030aa', GOLD, 2.5);
    d.text('painter’s platform', 450, 724 + bob, 13, GOLD);

    drawMedallion(d, s);

    const fx = FRAME.x, fy = FRAME.y, fw = FRAME.w, fh = FRAME.h;
    const live = s.panels[s.index] && !s.panels[s.index].restored ? s.panels[s.index] : null;
    d.poly(
      [[fx - fw / 2, fy - fh / 2], [fx + fw / 2, fy - fh / 2], [fx + fw / 2, fy + fh / 2], [fx - fw / 2, fy + fh / 2]],
      null, live ? '#f4d590' : GOLD, live ? 6 : 3,
    );
    d.text(live && !live.match ? 'soft wash if you splash' : 'splash here', fx, fy + fh / 2 + 20, 14, live ? CREAM : GOLD);

    s.panels.forEach((row) => {
      const x = screenX(row, s.scroll);
      if (x < -80 || x > 980) return;
      const faded = !row.restored;
      drawMotif(d, row.motif || row.id, x, FRAME.y, faded, row.flood || 0, s.t);
      if (s.level >= 1) drawColourMark(d, row.colour, x + 70, FRAME.y - 70);
      if (row.wash > 0) {
        d.glow(x, FRAME.y, 70, '#8ab4c8');
        d.text('wash', x, FRAME.y, 22, '#c8e0f0');
      }
      if (live && live.id === row.id && !s.discovery && !(s.softUntil && s.t < s.softUntil)) {
        d.circle(FRAME.x, FRAME.y, 110, '#6b203066', CREAM, 5);
        d.text(live.match ? 'SPLASH' : 'DECOY', FRAME.x, FRAME.y + 12, 36, CREAM);
        d.text(live.match ? 'tap here' : 'soft fail', FRAME.x, FRAME.y + 48, 18, GOLD);
      }
    });

    if (s.treasure && !s.treasure.taken && s.discovery > 0) {
      const pulse = 1 + Math.sin(s.t * 4) * 0.1;
      d.glow(s.treasure.x, s.treasure.y, 40 * pulse, '#ffe6a4');
      d.item(spriteKey(s.treasure.id), s.treasure.x, s.treasure.y, {
        w: 64 * pulse, shadow: false,
        fallback: (dd, x, y) => dd.star(x, y, 16, '#ffe6a4'),
      });
    }

    if (s.arriving || s.result) {
      const c = d.c;
      c.save();
      c.strokeStyle = GOLD;
      c.lineWidth = 5;
      roundRect(c, 120, 220, 660, 500, 16);
      c.stroke();
      d.text('Gallery', 450, 250, 22, GOLD);
      c.restore();
    }

    const u = clamp(s.t / CURTAIN, 0, 1);
    if (u < 1) {
      const top = 150 - u * u * 420;
      const c = d.c;
      c.save();
      roundRect(c, 130, top, 640, 520, 18);
      c.fillStyle = '#4a1830ee';
      c.fill();
      c.strokeStyle = GOLD;
      c.lineWidth = 3;
      c.stroke();
      d.text('SPLASH', 450, top + 210, 44, CREAM);
      d.text(s.level === 1 ? 'match the medallion' : 'the faded patch', 450, top + 262, 22, GOLD);
      c.restore();
    }

    drawPracticeBadge(d, s);
    drawCoach(d, s);
    drawHud(d, s, {goal: s.goal, count: s.restored, label: 'patches'});
  },
  key(s, k, down) {
    if (!down || s.result || !s.boarded) return;
    if (k === ' ' || k === 'Enter' || k === 'p' || k === 'P') {
      const live = s.panels[s.index];
      if (live && !live.restored) splash(s, live);
    }
  },
  readout: (s) => s.note || '',
};
