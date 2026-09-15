/**
 * Pocket Wheel (Jasper · ferris) — Ride & Seek stall
 * Tagline: Rise above the midway. Look closer.
 * LOCKED lane: Tempest/Robotron-lite quiet carnival gallery.
 *   Gondola is the hub; targets climb the spokes; SNAP them in the brass
 *   glow before they reach you. Quiet Jasper, loud gallery verb: SNAP.
 * Feel: Duck Hunt gallery + Tempest spokes + Perfect Hit timing.
 * Dropped: soft dwell-FOCUS meter as the core loop.
 *
 * SHIPPED: Chapter 1 First Look — slow spokes, fat glow, one climb at a
 *   time; scream SNAP in the first 5s. Playtest: climb crawls while lit
 *   so the SNAP window is hittable (not a dwell-FOCUS meter).
 *   Attest PASS note: further widened glow/crawl for first-timers. Unique ferris.png court stays hero
 *   (no full-screen overpaint). Soft outside-lens dim only.
 *
 * UNFINISHED CHAPTERS (keep names; do not rename treasures):
 *   2 Gondola Secrets — cabin emblems as gallery silhouettes; tighter glow
 *   3 Rooftop Trail — three roof targets in order; next arms after prior SNAP
 *   4 Cloud Crossing — clouds occlude glow; armed state does not reset
 *   5 Ferris at Midnight — moonlight markings; practice preview once
 *   6 The Highest View — Tempest depth rings + decoys/balloons; ≤2 depths
 */
import {clamp} from '../draw.js';
import {spriteKey} from '../prizes.js?v=ritual-3';
import {
  makeRideState, ensureBoarded, finishRide, recordFind, recordTreasure, logAction, drawHud,
  prefersReducedMotion,
} from '../ride-seek.js?v=ride-seek-4';

const RIDE = 'ferris';
const ORDINARY = ['everyday-penny', 'star-token', 'moon-penny'];
const TREASURES = [
  'pocket-wheel', 'star-token', 'moon-penny',
  'ride-ticket', 'ride-stamp-book', 'ride-explorer-pennant',
];
const LEVELS = [
  'First Look', 'Gondola Secrets', 'Rooftop Trail',
  'Cloud Crossing', 'Ferris at Midnight', 'The Highest View',
];

const W = 900;
const H = 1200;
const CX = 450;
const CY = 560;
const WHEEL_R = 250;
const HUB_X = CX;
const HUB_Y = 820; // gondola hub — targets climb toward you

const LENS_R = 96;
const RETICLE_R = 56; // fat Ch1 sweet glow — attest: widen for first-timers
const LENS_FINGER_Y = 96;
const HUD_TOP = 110;
const HUD_BOT = 1040;
const LENS_X_MIN = 90;
const LENS_X_MAX = 810;
const LENS_Y_MIN = HUD_TOP + LENS_R + 8;
const LENS_Y_MAX = HUD_BOT - LENS_R - 8;

const RIDE_SECS = 48;
const GOAL = 3;
const LENS_MOVE_LOG_MS = 280;
const COLLECT_FLASH = 0.45;
const CLARITY_SECS = 5;
const TEACH = 'SNAP when it’s in the glow.';
const GLOW_PAD = 36; // Ch1 forgiving — attest PASS note: widen more overnight

function wheelSpin(level, reduced) {
  // Slow afternoon spin of the spoke field. Eligibility never changes this.
  const base = 0.08 + Math.min(0.03, level * 0.008);
  return reduced ? base * 0.5 : base;
}

function climbSpeed(level, reduced) {
  // How fast targets climb spokes toward the gondola.
  // Ch1 is deliberately slow so SNAP can land in the glow (playtest gate).
  const base = level <= 0 ? 0.020 : (0.055 + Math.min(0.04, level * 0.01));
  return reduced ? base * 0.65 : base;
}

function wheelEase(progress) {
  if (progress < 0.82) return 1;
  const u = (progress - 0.82) / 0.18;
  return 1 - 0.55 * u * u;
}

/** Ch1 gallery targets — large silhouettes on distinct spokes. */
function ch1Targets() {
  return [
    {id: 'roof', label: 'tent roof', spoke: -0.9, size: 34, art: ORDINARY[0]},
    {id: 'gondola', label: 'cabin emblem', spoke: 0.55, size: 32, art: ORDINARY[1]},
    {id: 'horizon', label: 'horizon lamp', spoke: 2.4, size: 30, art: ORDINARY[2]},
    {id: 'framework', label: 'spoke pennant', spoke: -2.2, size: 28, art: ORDINARY[0]},
  ];
}

function spokePos(spokeAngle, climb) {
  // climb 0 = rim (safe), 1 = hub (reaches you — miss if unsnapped).
  const rimX = CX + Math.cos(spokeAngle) * WHEEL_R;
  const rimY = CY + Math.sin(spokeAngle) * WHEEL_R * 0.72;
  return {
    x: rimX + (HUB_X - rimX) * climb,
    y: rimY + (HUB_Y - rimY) * climb,
  };
}

function clampLens(x, y) {
  return {
    x: clamp(x, LENS_X_MIN, LENS_X_MAX),
    y: clamp(y, LENS_Y_MIN, LENS_Y_MAX),
  };
}

function fingerToLens(p) {
  return clampLens(p.x, p.y - LENS_FINGER_Y);
}

function inGlow(lx, ly, x, y) {
  return Math.hypot(x - lx, y - ly) <= RETICLE_R + GLOW_PAD;
}

function inLens(lx, ly, x, y, pad = 0) {
  return Math.hypot(x - lx, y - ly) <= LENS_R + pad;
}

function scheduleCh1(s) {
  const rows = ch1Targets();
  // Stagger climbs so the player learns SNAP on one subject at a time.
  s.targets = rows.map((row, i) => ({
    ...row,
    climb: 0,
    alive: true,
    snapped: false,
    missed: false,
    open: 0.4 + i * 9.5,
    active: false,
  }));
  s.goal = GOAL;
  s.found = 0;
  s.glowId = null;
  s.treasure = null;
  if (s.eligible && s.spawnId) {
    const host = s.targets.find(o => o.id === s.spawnId) || s.targets[0];
    s.treasure = {id: s.treasureId, spot: host.id, taken: false};
  }
}

function maybeAttachTreasure(s) {
  if (!s.eligible || s.treasure || !s.spawnId) return;
  const host = (s.targets || []).find(o => o.id === s.spawnId) || (s.targets || [])[0];
  if (!host) return;
  s.treasure = {id: s.treasureId, spot: host.id, taken: false};
}

function spawnSparks(s, x, y, n = 10) {
  s.sparks = s.sparks || [];
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + (s.t || 0);
    s.sparks.push({
      x, y,
      vx: Math.cos(a) * (50 + (i % 3) * 16),
      vy: Math.sin(a) * (50 + (i % 3) * 16) - 24,
      life: COLLECT_FLASH,
      r: 3 + (i % 3),
    });
  }
}

function snapTarget(s, target) {
  if (!target || !target.alive || target.snapped) return false;
  target.snapped = true;
  target.alive = false;
  s.found += 1;
  s.didSnapOnce = true;
  const art = target.art || ORDINARY[(s.found - 1) % ORDINARY.length];
  recordFind(s, art, RIDE);
  logAction(s, 'collect', {id: target.id, kind: 'ordinary', verb: 'snap'});
  s.flash = COLLECT_FLASH;
  s.flashX = target.x;
  s.flashY = target.y;
  spawnSparks(s, target.x, target.y, 12);

  if (s.treasure && !s.treasure.taken && s.treasure.spot === target.id) {
    s.treasure.taken = true;
    s.treasureCollected = true;
    recordTreasure(s, s.treasure.id);
    logAction(s, 'collect', {id: target.id, kind: 'treasure', verb: 'snap'});
    s.note = 'Keepsake snapped — Jasper will stamp the card.';
  } else {
    s.note = s.found >= s.goal
      ? 'Three snaps — the gondola carries you home.'
      : (s.found + ' / ' + s.goal + ' · ' + TEACH);
  }
  return true;
}

function missTarget(s, target) {
  if (!target || !target.alive) return;
  target.alive = false;
  target.missed = true;
  logAction(s, 'miss', {id: target.id});
  if (s.glowId === target.id) s.glowId = null;
  s.note = 'It reached the gondola — watch the next spoke.';
}

function drawSoftOutsideLens(d, lx, ly) {
  const c = d.c;
  if (!c) return;
  c.save();
  c.beginPath();
  c.rect(0, 0, W, H);
  c.arc(lx, ly, LENS_R + 2, 0, Math.PI * 2, true);
  c.clip('evenodd');
  c.fillStyle = 'rgba(18, 14, 22, 0.26)';
  c.fillRect(0, 0, W, H);
  c.restore();
}

function drawGondolaHub(d, s) {
  // Light paper cabin at the hub — court PNG stays full-bleed behind.
  const sway = Math.sin((s.angle || 0) * 2) * (s.reduced ? 2 : 5);
  d.glow(HUB_X + sway, HUB_Y + 20, 110, '#4a1824');
  d.poly([
    [HUB_X - 112 + sway, HUB_Y - 40],
    [HUB_X + 112 + sway, HUB_Y - 40],
    [HUB_X + 102 + sway, HUB_Y + 108],
    [HUB_X - 102 + sway, HUB_Y + 108],
  ], '#3a1018c8', '#d2a65b', 4);
  d.circle(HUB_X - 22 + sway, HUB_Y + 14, 28, '#6b2030bb', '#f4d590', 2);
  d.circle(HUB_X + 22 + sway, HUB_Y + 14, 28, '#6b2030bb', '#f4d590', 2);
  d.poly([
    [HUB_X - 48 + sway, HUB_Y + 24],
    [HUB_X + sway, HUB_Y + 78],
    [HUB_X + 48 + sway, HUB_Y + 24],
  ], '#6b2030bb', '#f4d590', 2);
  d.text('you', HUB_X + sway, HUB_Y + 100, 15, '#f0d09a');
}

function drawSpokeGuides(d, s) {
  // Faint Tempest-ish spoke lines — light ink, never covers the court.
  const spin = s.angle || 0;
  for (let i = 0; i < 8; i++) {
    const a = spin + (i / 8) * Math.PI * 2;
    const rimX = CX + Math.cos(a) * WHEEL_R;
    const rimY = CY + Math.sin(a) * WHEEL_R * 0.72;
    d.line({x: HUB_X, y: HUB_Y}, {x: rimX, y: rimY}, '#d2a65b33', 2);
  }
}

function drawTarget(d, s, t) {
  if (!t.alive && !t.snapped) return;
  if (t.snapped) return;
  const inSweet = s.glowId === t.id;
  const r = t.size * (1 - 0.25 * t.climb);
  d.glow(t.x, t.y, r + (inSweet ? 36 : 18), inSweet ? '#ffe6a4' : '#e8d0a0');
  // Paper silhouette (roof / cabin / lamp) — readable gallery target, not an orb.
  if (t.id === 'roof') {
    d.poly([
      [t.x - r, t.y],
      [t.x, t.y - r * 0.9],
      [t.x + r, t.y],
      [t.x + r * 0.7, t.y + r * 0.55],
      [t.x - r * 0.7, t.y + r * 0.55],
    ], inSweet ? '#f4d590ee' : '#c9a04acc', '#d2a65b', 2);
  } else if (t.id === 'gondola') {
    d.circle(t.x, t.y, r * 0.7, inSweet ? '#f4d590ee' : '#6b2030cc', '#d2a65b', 2);
    d.text('◆', t.x, t.y + 6, 18, '#ffe6a4');
  } else if (t.id === 'horizon') {
    d.circle(t.x, t.y, r * 0.45, '#ffe6a4', '#d2a65b', 2);
    d.glow(t.x, t.y, r + 10, '#f4d590');
  } else {
    d.poly([
      [t.x, t.y - r],
      [t.x + r * 0.55, t.y + r * 0.2],
      [t.x, t.y + r * 0.55],
      [t.x - r * 0.55, t.y + r * 0.2],
    ], inSweet ? '#f4d590ee' : '#e8d0a0bb', '#d2a65b', 2);
  }
  if (inSweet || t.climb < 0.25) {
    d.text(t.label, t.x, t.y - r - 16, 14, inSweet ? '#ffe6a4' : '#f0d09a');
  }
  if (s.treasure && s.treasure.spot === t.id && !s.treasure.taken && t.alive) {
    d.item(spriteKey(s.treasure.id), t.x, t.y - r - 36, {
      w: inSweet ? 56 : 32,
      alpha: inSweet ? 1 : 0.55,
      shadow: false,
      fallback: () => d.star(t.x, t.y - r - 36, 12),
    });
  }
}

function drawLens(d, s) {
  const lx = s.lensX;
  const ly = s.lensY;
  const hot = !!s.glowId;
  const pulse = hot ? 1 + 0.04 * Math.sin((s.t || 0) * 12) : 1;
  const rim = LENS_R * pulse;
  d.glow(lx, ly, rim + 30, hot ? '#ffe6a4' : '#d2a65b');
  d.circle(lx, ly, rim, 'rgba(244, 232, 180, 0.08)', '#d2a65b', 8);
  d.circle(lx, ly, rim - 10, null, '#f4d590', 2.4);
  // Sweet glow reticle
  d.circle(lx, ly, RETICLE_R, hot ? 'rgba(255,230,164,0.22)' : 'rgba(244,217,144,0.08)', '#f8e4b3', 2.2);
  d.line({x: lx - 18, y: ly}, {x: lx + 18, y: ly}, '#f4d590', 1.4);
  d.line({x: lx, y: ly - 18}, {x: lx, y: ly + 18}, '#f4d590', 1.4);
  if (hot) {
    d.text('SNAP', lx, ly + rim + 28, 28, '#ffe6a4');
  } else if ((s.t || 0) < CLARITY_SECS || !s.didSnapOnce) {
    d.text('LENS', lx, ly + rim + 26, 20, '#f4d590');
  }
}

function drawSnapChrome(d, s) {
  const y = s.practice ? 198 : 168;
  d.poly([[40, y], [560, y], [560, y + 58], [40, y + 58]], '#122335f2', '#d2a65b', 3);
  if (s.glowId) {
    d.text('SNAP', 300, y + 40, 36, '#ffe6a4');
  } else if ((s.t || 0) < CLARITY_SECS || !s.didSnapOnce) {
    d.text('SNAP', 300, y + 40, 36, '#ffe6a4');
  } else {
    d.text(TEACH, 300, y + 40, 22, '#f0d09a');
  }
  if (((s.t || 0) < CLARITY_SECS || !s.didSnapOnce) && !s.glowId) {
    d.text('Drag lens · snap in the glow', 300, y + 78, 18, '#e8d0a0');
  }
  if (s.practice) {
    d.poly([[640, 188], [870, 188], [870, 248], [640, 248]], '#5a1c28f0', '#f4d590', 3);
    d.text('PRACTICE', 755, 228, 28, '#ffe6a4');
  }
  // Big bottom SNAP control (Fortune-style chrome) when a target is in the glow.
  if (s.glowId) {
    d.poly([[260, 1080], [640, 1080], [640, 1165], [260, 1165]], '#5a1c28f2', '#f4d590', 4);
    d.text('SNAP', 450, 1135, 40, '#ffe6a4');
  }
}

function hitSnapControl(p) {
  return p.y >= 1080 && p.y <= 1165 && p.x >= 260 && p.x <= 640;
}

export default {
  title: 'Pocket Wheel',
  intro: 'Rise above the midway. Look closer. Targets climb the spokes — SNAP them in Jasper’s brass glow before they reach your gondola.',
  instructions: TEACH + ' Drag the lens (it sits above your thumb). First ride is practice.',
  levels: LEVELS,
  sprites: TREASURES.concat(['everyday-penny', 'star-token', 'moon-penny']),
  prizes: TREASURES,
  houseSeconds: 80,
  create(level, rng) {
    const reduced = prefersReducedMotion();
    return makeRideState(level, rng, {
      lensX: CX,
      lensY: 620,
      found: 0,
      targets: [],
      goal: GOAL,
      angle: -0.35,
      drag: null,
      pointerDown: null,
      moved: false,
      lastLensLog: 0,
      treasureId: TREASURES[Math.max(0, Math.min(level, TREASURES.length - 1))],
      reduced,
      scheduled: false,
      sparks: [],
      flash: 0,
      flashX: CX,
      flashY: CY,
      treasureCollected: false,
      didSnapOnce: false,
      glowId: null,
    });
  },
  update(s, dt) {
    if (s.result || s.broke) return;

    if (ensureBoarded(s, RIDE, s.treasureId, ch1Targets().map(o => o.id))) {
      scheduleCh1(s);
      s.scheduled = true;
      s.note = TEACH;
    }
    if (s.result) return;
    if (!s.scheduled) return;

    maybeAttachTreasure(s);

    s.t += dt;
    s.progress = Math.min(1, s.t / RIDE_SECS);
    const spin = wheelSpin(s.level, s.reduced) * wheelEase(s.progress);
    s.angle += spin * dt;
    const climb = climbSpeed(s.level, s.reduced);

    let glow = null;
    for (const t of s.targets) {
      if (!t.alive) continue;
      if (s.t >= t.open) t.active = true;
      if (!t.active) continue;
      const spoke = t.spoke + s.angle * 0.15; // slight field drift
      let pos = spokePos(spoke, t.climb);
      t.x = pos.x;
      t.y = pos.y;
      const lit = inGlow(s.lensX, s.lensY, t.x, t.y);
      // Ch1 teach: while lit, crawl — gives time to SNAP without a dwell meter.
      const rate = lit ? climb * 0.08 : climb; // stronger crawl-while-lit for first SNAP
      t.climb = Math.min(1, t.climb + rate * dt);
      pos = spokePos(spoke, t.climb);
      t.x = pos.x;
      t.y = pos.y;
      if (t.climb >= 1) {
        missTarget(s, t);
        continue;
      }
      if (lit || inGlow(s.lensX, s.lensY, t.x, t.y)) {
        if (!glow) glow = t;
      }
    }
    const prev = s.glowId;
    s.glowId = glow ? glow.id : null;
    if (s.glowId && s.glowId !== prev) {
      logAction(s, 'glow-ready', {id: s.glowId});
      s.note = 'In the glow — SNAP!';
    }

    if (s.sparks && s.sparks.length) {
      for (const sp of s.sparks) {
        sp.life -= dt;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.vy += 70 * dt;
      }
      s.sparks = s.sparks.filter(sp => sp.life > 0);
    }
    if (s.flash > 0) s.flash = Math.max(0, s.flash - dt);

    if (s.t >= RIDE_SECS) {
      finishRide(s, {
        rideId: RIDE,
        treasureId: s.treasureId,
        challengeOk: s.found >= s.goal,
        completionFind: 'moon-penny',
      });
    }
  },
  pointer(s, type, p) {
    if (s.result || s.broke) return;

    if (type === 'down') {
      s.pointerDown = {x: p.x, y: p.y, t: s.t};
      s.moved = false;
      s.drag = p;
      // Big SNAP chrome can fire immediately if something is in the glow.
      if (s.glowId && hitSnapControl(p)) {
        const target = s.targets.find(o => o.id === s.glowId && o.alive);
        if (target) snapTarget(s, target);
        s.drag = null;
        s.pointerDown = null;
        return;
      }
      const lens = fingerToLens(p);
      s.lensX = lens.x;
      s.lensY = lens.y;
      return;
    }

    if (type === 'move' && s.drag) {
      if (s.pointerDown && Math.hypot(p.x - s.pointerDown.x, p.y - s.pointerDown.y) > 12) {
        s.moved = true;
      }
      s.drag = p;
      const lens = fingerToLens(p);
      s.lensX = lens.x;
      s.lensY = lens.y;
      const now = (s.t || 0) * 1000;
      if (now - (s.lastLensLog || 0) >= LENS_MOVE_LOG_MS) {
        s.lastLensLog = now;
        logAction(s, 'lens-move', {x: Math.round(s.lensX), y: Math.round(s.lensY)});
      }
      return;
    }

    if (type === 'up') {
      const wasDrag = s.drag;
      s.drag = null;
      if (!wasDrag) return;
      const down = s.pointerDown;
      const moved = s.moved;
      const dtTouch = down ? Math.max(0, (s.t || 0) - (down.t || 0)) : 1;
      s.pointerDown = null;
      s.moved = false;

      const isTap = !moved || dtTouch < 0.22;
      if (!isTap) return;

      // SNAP: target must be in the sweet glow; tap glass or SNAP chrome.
      if (!s.glowId) {
        if ((s.t || 0) < CLARITY_SECS) s.note = TEACH;
        return;
      }
      const ok = hitSnapControl(p)
        || inLens(s.lensX, s.lensY, p.x, p.y, 20)
        || inLens(s.lensX, s.lensY, p.x, p.y - LENS_FINGER_Y * 0.35, 28);
      if (!ok) {
        s.note = 'Tap SNAP or tap inside the glass.';
        return;
      }
      const target = s.targets.find(o => o.id === s.glowId && o.alive);
      if (target) snapTarget(s, target);
      return;
    }

    if (type === 'cancel') {
      s.drag = null;
      s.pointerDown = null;
      s.moved = false;
    }
  },
  draw(s, d) {
    // ferris.png is the unique court — never clear or full-bleed overpaint.
    drawSpokeGuides(d, s);
    drawGondolaHub(d, s);

    (s.targets || []).forEach(t => {
      if (t.active && (t.alive || t.snapped)) drawTarget(d, s, t);
    });

    drawSoftOutsideLens(d, s.lensX, s.lensY);
    drawLens(d, s);

    if (s.sparks && s.sparks.length) {
      for (const sp of s.sparks) {
        const a = Math.max(0, sp.life / COLLECT_FLASH);
        d.circle(sp.x, sp.y, sp.r * (0.5 + 0.5 * a), '#ffe6a4', '#d2a65b', 1);
      }
    }
    if (s.flash > 0) {
      const k = s.flash / COLLECT_FLASH;
      d.glow(s.flashX || CX, s.flashY || CY, 28 + 70 * k, '#ffe6a4');
    }

    drawHud(d, s, {goal: s.goal, count: s.found, label: 'snapped'});
    drawSnapChrome(d, s);
  },
  readout: s => s.note || TEACH,
};
