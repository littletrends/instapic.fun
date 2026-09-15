/**
 * Painted Bay — Arlo (mural / alley-wall-bay)
 * LOCKED remix: Crush Roller + Paperboy in carnival clothes.
 * Verb: SPLASH. The mural rolls past; splash faded patches on the wall;
 * they FILL/flood. No mix-then-HOLD PAINT chrome.
 *
 * SHIPPED: Ch1 First Wash — three patches (lantern, balloons, horse).
 * Splash any two as they pass. Pre-dipped ♥+★ (mix waits for Ch2).
 * ≥3.2s discovery after flood; treasure is a real glint in restored art
 * only when eligible && spawnId === that panel.
 * mural.png is the hero court (transparent clear; no full-screen fill).
 *
 * Unfinished:
 *  2 Lantern Row — three colours; splash the medallion match
 *  3 Carousel Frieze — horse patch only in the window
 *  4 Evening Panorama — splash floods into neighbours
 *  5 Midway Memories — remembered fragments in order
 *  6 The Living Bay — long Sunday route; panorama wakes
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

const GOAL = 2;
const DISCOVERY = 3.2;
const CURTAIN = 1.15;
const RETRY = 1;
const DWELL = 5.6;
const HOUSE = 80;
const FRAME = {x: 450, y: 488, w: 260, h: 220};
const GOLD = '#d2a65b';
const BURG = '#6b2030';
const CREAM = '#fff6d8';
const MIX = '#8a4060';

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

function maybeArrive(s) {
  if (s.arriving || s.result) return;
  if (s.restored >= s.goal || s.index >= s.panels.length) {
    s.arriving = true;
    s.arriveAt = s.t + 0.7;
  }
}

function spawnNext(s) {
  s.paused = false;
  const row = s.panels[s.index];
  if (!row || s.restored >= s.goal) {
    maybeArrive(s);
    return;
  }
  row.world = s.scroll + 760;
  row.dwell = 0;
  row.held = false;
}

function advance(s) {
  s.index += 1;
  spawnNext(s);
}

function missPanel(s, row) {
  if (row.restored || row.done) return;
  row.dwell = 0;
  row.held = false;
  row.retries += 1;
  if (row.retries <= RETRY) {
    row.world = s.scroll + 760;
    s.paused = false;
    s.note = 'One more pass — SPLASH inside the frame.';
  } else {
    row.done = true;
    advance(s);
  }
}

function splash(s, panel) {
  if (!panel || panel.restored || panel.flooding) return;
  panel.restored = true;
  panel.flood = 0.001;
  panel.flooding = true;
  panel.bloom = 1;
  s.restored += 1;
  s.juice = true;
  s.paused = true;
  s.discovery = DISCOVERY;
  s.liveId = panel.id;
  recordFind(s, ORDINARY[s.restored % ORDINARY.length], RIDE);
  logAction(s, 'splash', {id: panel.id, n: s.restored});
  logAction(s, 'restore', {id: panel.id});
  s.note = 'The wall wakes — ' + s.restored + ' / ' + s.goal + '.';
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
  if (!s.boarded || s.result || s.juice || s.t >= 5.2) return;
  const c = d.c;
  c.save();
  roundRect(c, 90, 248, 720, 58, 14);
  c.fillStyle = '#1a1210ee';
  c.fill();
  c.strokeStyle = GOLD;
  c.lineWidth = 3;
  c.stroke();
  c.restore();
  d.text('SPLASH the faded patch', 450, 286, 28, CREAM);
}

export default {
  title: 'Painted Bay',
  intro: 'Arlo’s platform rolls along the living mural. Splash faded patches as they pass — the wall floods awake.',
  instructions: 'SPLASH the faded patch when it sits in the frame. Restore any two of three. First ride is free practice and keeps nothing.',
  levels: LEVELS,
  sprites: TREASURES.concat(ORDINARY),
  prizes: TREASURES,
  houseSeconds: HOUSE,
  houseTitle: 'The paint dried',
  houseDetail: 'The bay went still before the wall woke. Try this chapter again.',
  actions: [],
  create(level, rng) {
    const reduced = prefersReducedMotion();
    const gap = reduced ? 720 : 640;
    const panels = MOTIFS.map((m, i) => ({
      ...m,
      world: i === 0 ? 980 : 4000,
      restored: false,
      done: false,
      retries: 0,
      dwell: 0,
      held: false,
      flood: 0,
      flooding: false,
      bloom: 0,
    }));
    return makeRideState(level, rng, {
      reduced,
      panels,
      index: 0,
      scroll: 0,
      speed: reduced ? 70 : 96,
      restored: 0,
      goal: GOAL,
      paused: false,
      discovery: 0,
      liveId: null,
      arriving: false,
      arriveAt: 0,
      juice: false,
      treasureId: TREASURES[Math.max(0, Math.min(level, TREASURES.length - 1))],
      note: 'SPLASH the faded patch.',
    });
  },
  update(s, dt) {
    if (s.result || s.broke) return;
    if (ensureBoarded(s, RIDE, s.treasureId, MOTIFS.map((m) => m.id))) {
      s.note = 'SPLASH the faded patch.';
    }
    if (s.result) return;
    s.t += dt;
    s.progress = Math.min(1, (s.index + (s.panels[s.index]?.dwell || 0) / DWELL) / 3);

    s.panels.forEach((row) => {
      if (row.bloom > 0) row.bloom = Math.max(0, row.bloom - dt * 0.7);
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

    if (s.discovery > 0) {
      s.discovery -= dt;
      if (s.discovery <= 0) {
        s.paused = false;
        const live = s.panels.find((row) => row.id === s.liveId);
        if (live) live.done = true;
        s.liveId = null;
        if (s.restored >= s.goal) maybeArrive(s);
        else advance(s);
      }
      return;
    }

    const live = s.panels[s.index];
    if (!live || live.done || live.restored) {
      if (!s.arriving) advance(s);
      return;
    }
    if (inWindow(live, s.scroll) || live.held) {
      live.held = true;
      live.world = s.scroll + FRAME.x;
      live.dwell += dt;
      s.paused = true;
      if (live.dwell >= DWELL) missPanel(s, live);
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
    if (s.discovery > 0 || s.arriving) return;
    const live = s.panels[s.index];
    if (live && !live.restored && !live.done && (live.held || inWindow(live, s.scroll)) && inFrame(p)) {
      splash(s, live);
    }
  },
  draw(s, d) {
    // mural.png owns the court.

    d.poly([[120, 168], [780, 168], [772, 186], [128, 186]], '#6b203088', GOLD, 2);
    d.poly([[110, 742], [790, 742], [808, 776], [92, 776]], '#6b203066', GOLD, 2);

    const bob = s.reduced ? 0 : Math.sin(s.t * 1.3) * 3;
    d.poly([[250, 700 + bob], [650, 700 + bob], [630, 738 + bob], [270, 738 + bob]], '#6b2030aa', GOLD, 2.5);
    d.text('painter’s platform', 450, 724 + bob, 13, GOLD);

    const fx = FRAME.x, fy = FRAME.y, fw = FRAME.w, fh = FRAME.h;
    const live = s.panels[s.index] && !s.panels[s.index].restored && !s.panels[s.index].done
      ? s.panels[s.index]
      : null;
    d.poly(
      [[fx - fw / 2, fy - fh / 2], [fx + fw / 2, fy - fh / 2], [fx + fw / 2, fy + fh / 2], [fx - fw / 2, fy + fh / 2]],
      null, live ? '#f4d590' : GOLD, live ? 6 : 3,
    );
    d.text('splash here', fx, fy + fh / 2 + 20, 14, live ? CREAM : GOLD);

    s.panels.forEach((row) => {
      const x = screenX(row, s.scroll);
      if (x < -80 || x > 980) return;
      const faded = !row.restored;
      drawMotif(d, row.id, x, FRAME.y, faded, row.flood || 0, s.t);
      if (live && live.id === row.id && !s.discovery) {
        d.circle(FRAME.x, FRAME.y, 96, null, CREAM, 4);
        d.text('SPLASH', FRAME.x, FRAME.y + 10, 34, CREAM);
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
      d.text('SPLASH', 450, top + 220, 44, CREAM);
      d.text('the faded patch', 450, top + 268, 22, GOLD);
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
      if (live && !live.restored && !live.done) splash(s, live);
    }
  },
  readout: (s) => s.note || '',
};
