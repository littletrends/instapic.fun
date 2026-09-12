import {clamp, dist, done} from '../draw.js?v=ink-1';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, credit, keep} from '../wallet.js?v=felix-safari-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';

const WIND = {x: 726, y: 992, pull: 50};
const CLOCK = 48;
const SETS = [
  {prize: 'shutter-click', felt: '#2a3c2ccc', wood: '#5a3a28', sky: '#7a9a78', clock: 48, dart: 0.28, sway: 22, hide: 0, kinds: ['rabbit'], hw: 100, hh: 76, need: 0.68},
  {prize: 'photo-accordion', felt: '#24362acc', wood: '#4a3224', sky: '#6a8a72', clock: 42, dart: 0.38, sway: 30, hide: 0.08, kinds: ['rabbit', 'bird'], hw: 94, hh: 72, need: 0.68},
  {prize: 'memory-camera', felt: '#243038cc', wood: '#3a2a22', sky: '#5a6a78', clock: 38, dart: 0.48, sway: 38, hide: 0.12, kinds: ['fox', 'bird'], hw: 88, hh: 68, need: 0.70},
  {prize: 'safari-frame', felt: '#1c3228cc', wood: '#4a2818', sky: '#4a6a68', clock: 34, dart: 0.58, sway: 46, hide: 0.16, kinds: ['duck', 'rabbit'], hw: 82, hh: 64, need: 0.72},
  {prize: 'first-visit-badge', felt: '#241828cc', wood: '#3a1c18', sky: '#3a3a52', clock: 30, dart: 0.68, sway: 52, hide: 0.22, kinds: ['rabbit', 'fox', 'bird', 'duck'], hw: 76, hh: 60, need: 0.74},
  {prize: 'paper-negative', felt: '#141820ee', wood: '#2a1814', sky: '#1c2438', clock: 26, dart: 0.80, sway: 60, hide: 0.30, kinds: ['fox', 'duck', 'bird'], hw: 70, hh: 56, need: 0.76},
];
const SPRITES = ['memory-camera', 'shutter-click', 'photo-accordion', 'ride-stamp-book',
  'first-visit-badge', 'pocket-theatre', 'penny-purse', 'everyday-penny'];
const TREES = [
  {x: 168, y: 560, a: -0.5, s: 54}, {x: 210, y: 720, a: -0.2, s: 46},
  {x: 250, y: 430, a: 0.3, s: 40}, {x: 720, y: 540, a: 0.45, s: 52},
  {x: 690, y: 740, a: 0.15, s: 44}, {x: 650, y: 400, a: -0.35, s: 38},
];

function chapterPrize(s) { return SETS[s.level]?.prize || null; }
function canAfford(s) {
  if (!alleyPlay) return s.ammo > 0;
  return (pocket() || 0) >= 1;
}
function framed(s, p) {
  if (!p) return false;
  return Math.abs(p.x - s.camera.x) < s.set.hw && Math.abs(p.y - s.camera.y) < s.set.hh;
}
function occluded(s, p) {
  if (!p || s.set.hide <= 0) return false;
  const r = 40 + s.set.hide * 36;
  return s.animals.some(a => Math.hypot(a.x - p.x, a.y - p.y) < r);
}
function subject(s) {
  if (framed(s, s.prizeSpot)) return {type: 'prize', x: s.prizeSpot.x, y: s.prizeSpot.y};
  const a = s.animals.find(x => framed(s, x));
  return a ? {type: 'animal', kind: a.kind, x: a.x, y: a.y} : null;
}
function fly(s, id, x, y, prize) {
  s.fly.push({id, x, y, t: 0, dur: 0.7, prize: !!prize});
}
function hangPrize(s) {
  const still = s.still ? 0.34 : 1;
  const d = s.set.dart, w = s.set.sway * still;
  s.prizeSpot.x = 450 + Math.sin(s.t * (0.7 + d)) * w;
  s.prizeSpot.y = 338 + Math.cos(s.t * (0.5 + d * 0.5)) * w * 0.28;
}
function wander(s) {
  const live = s.mode === 'live';
  const rate = (live ? s.set.dart : s.set.dart * 0.32) * 6.1;
  const spread = s.animals.length > 3 ? 138 : 176;
  s.animals.forEach((a, i) => {
    a.x = 450 + Math.sin(s.t * rate + i * 2.2) * (208 + s.level * 10);
    a.y = 486 + i * spread + Math.sin(s.t * 0.62 + i) * (28 + s.set.sway * 0.18);
    if (live && s.set.hide > 0) {
      const sweep = Math.sin(s.t * (0.85 + i * 0.18) + i);
      if (sweep > 0.62) {
        a.x += (s.prizeSpot.x - a.x) * (0.03 + s.set.hide * 0.08);
        a.y += (s.prizeSpot.y - a.y) * (0.03 + s.set.hide * 0.08);
      }
    }
    a.x = clamp(a.x, 200, 700);
    a.y = clamp(a.y, 280, 980);
  });
}
function seatLane(s) {
  s.mode = 'lane';
  s.charge = 0;
  s.charging = false;
  s.pointerWind = false;
  s.holding = false;
  s.focus = 0;
  s.still = false;
  s.album = [];
  s.note = alleyPlay
    ? 'A penny winds a plate. Snap the prize off the branch before the light goes.'
    : 'Wind a practice plate. Snap the prize off the branch.';
}
function beginWind(s) {
  if (s.mode !== 'lane' || s.charging || s.won) return;
  if (!canAfford(s)) {
    s.note = alleyPlay ? 'Need a penny to wind a plate.' : 'Practice plates are spent.';
    return;
  }
  s.charging = true;
  s.charge = 0.02;
}
function releaseWind(s) {
  if (s.mode !== 'lane' || !s.charging) { s.charging = false; return; }
  const power = s.charge;
  s.charging = false;
  s.charge = 0;
  if (power < 0.1) {
    s.note = 'A timid wind. Draw the crank further.';
    return;
  }
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny to wind a plate.';
      return;
    }
  } else s.ammo--;
  s.mode = 'live';
  s.clock = s.clockMax || CLOCK;
  s.plates++;
  s.holding = false;
  s.focus = 0;
  s.still = false;
  s.album = [];
  s.note = power > 0.72
    ? 'A strong wind. The plate is open — catch the prize.'
    : 'The plate is open. Frame, hold, and snap the hanging prize.';
}
function drain(s) {
  s.mode = 'dead';
  s.deadAt = s.t;
  s.charging = false;
  s.charge = 0;
  s.holding = false;
  s.focus = 0;
  s.still = false;
  s.note = alleyPlay
    ? 'The light is gone. Another penny for another plate.'
    : (s.ammo > 0 ? 'The light is gone. Wind another practice plate.' : 'Practice plates are spent.');
}
function portrait(s, t) {
  const quality = Math.round(66 + s.focus * 18 + (1 - dist(t, s.camera) / 120) * 14);
  s.score += quality;
  s.album.push({kind: t.kind, quality});
  fly(s, 'shutter-click', t.x, t.y, false);
  if (s.album.length >= 3 && !s.still) {
    s.still = true;
    s.note = 'Three portraits — the woodland holds still.';
  } else if (quality > 90 && Math.random() < 0.1) {
    if (alleyPlay) credit(1);
    s.note = 'A penny for a lovely ' + t.kind + ' portrait.';
  } else {
    s.note = 'A lovely ' + t.kind + ' — ' + quality + '/100. The prize still hangs.';
  }
}
function claim(s) {
  const prize = chapterPrize(s);
  if (!prize || s.prizeOut || s.won) return;
  s.prizeOut = true;
  s.won = true;
  s.score += 2500;
  s.prizeSpot.flash = 0.45;
  if (alleyPlay) keep(prize, 'snap');
  takePrize(s, prize);
  fly(s, prize, s.prizeSpot.x, s.prizeSpot.y, true);
  s.note = itemName(prize) + ' — you snapped it off the branch!';
  done(s, 'A moment worth keeping',
    itemName(prize) + ' flies into the treasure book.',
    {prize, won: true});
}
function shutter(s) {
  if (s.mode !== 'live' || !s.holding || s.won) return;
  s.holding = false;
  s.shots++;
  s.flash = 0.18;
  const t = subject(s);
  const inside = !!t;
  if (!inside) {
    s.note = 'The subject slipped the frame. The plate is still open.';
    s.focus = 0;
    return;
  }
  if (s.focus < s.set.need) {
    s.note = 'Nearly. Hold steadier until the focus ring turns green.';
    s.focus = 0;
    return;
  }
  if (t.type === 'prize') {
    if (occluded(s, s.prizeSpot)) {
      s.note = 'A wanderer stepped across the plate. Wait for a clear branch.';
      s.focus = 0;
      return;
    }
    if (s.prizeOut) {
      s.score += 120;
      s.note = 'Already kept. The light is still yours.';
    } else claim(s);
    return;
  }
  portrait(s, t);
}

export default {
  title: 'Paper Safari',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  intro: alleyPlay
    ? 'Felix built a woodland that fits inside a camera. A penny winds a plate. The hanging prize is the one to keep — frame it, hold until the ring is green, and snap it off the branch before the light goes. Wanderers will step in front. Three portraits make the woods hold still.'
    : 'Workshop plates. Wind the camera, frame the hanging prize, hold focus, and snap it off the branch before the light goes.',
  instructions: alleyPlay
    ? 'Hold Wind and release to open a plate (one penny). Move the frame with the pointer or arrows. Hold Focus until the ring is green, then release to snap. The prize only keeps if that plate catches the hanging keepsake, unblocked. Clock runs while the plate is open. Space winds in the crank, then focuses on a live plate.'
    : 'Hold Wind and release. Pan, hold Focus until green, release to snap the hanging prize. Space winds, then focuses.',
  liveTitle: 'Paper Safari',
  liveDetail: alleyPlay
    ? 'A penny winds a plate. Snap the prize hanging on the branch. The light is running.'
    : 'Wind a plate. Snap the hanging prize.',
  liveButton: 'Step up to the camera',
  tableDetail: alleyPlay
    ? 'A penny winds a plate. Frame, hold, and snap this chapter’s prize off the branch before the light goes. Time runs out — another penny for another plate. Three portraits still the woods.'
    : 'Wind a practice plate. Snap the hanging prize before the light goes.',
  levels: ['A quiet morning', 'The busy afternoon', 'Twilight visitors', 'The darting duck', 'Four portraits at dusk', 'A midnight safari'],
  sprites: SPRITES,
  prizes: SETS.map(t => t.prize),
  actions: [
    {id: 'focus', label: 'Hold focus · release shutter', hold: true},
    {id: 'wind', label: alleyPlay ? 'Wind · 1 penny' : 'Wind the plate', hold: true},
  ],
  create(level) {
    const set = SETS[level] || SETS[0];
    const s = {
      level, t: 0, mode: 'lane', charge: 0, charging: false, pointerWind: false,
      camera: {x: 450, y: 640}, prevCam: {x: 450, y: 640},
      animals: set.kinds.map((kind, i) => ({kind, x: 450, y: 500 + i * 160})),
      focus: 0, holding: false, shots: 0, plates: 0, album: [], flash: 0, fly: [],
      still: false, won: false, prizeOut: false, score: 0,
      ammo: alleyPlay ? 0 : Math.max(3, 8 - level),
      clockMax: set.clock, clock: set.clock,
      prizeSpot: {x: 450, y: 338, r: 26, flash: 0},
      note: alleyPlay
        ? 'A penny winds a plate. Snap the prize off the branch to keep it.'
        : 'Wind a practice plate. Snap the prize off the branch.',
      set,
    };
    hangPrize(s);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    s.flash = Math.max(0, s.flash - dt);
    if (s.prizeSpot) s.prizeSpot.flash = Math.max(0, (s.prizeSpot.flash || 0) - dt);
    hangPrize(s);
    wander(s);
    if (s.won) {
      for (const f of s.fly) f.t += dt;
      s.fly = s.fly.filter(f => f.t < f.dur);
      return;
    }
    if (s.mode === 'live') {
      s.clock = Math.max(0, (s.clock ?? s.clockMax) - dt);
      if (s.clock <= 0) drain(s);
    }
    const holdWind = s.pointerWind || input.actions.has('wind') || (s.mode === 'lane' && input.keys.has(' '));
    if (s.mode === 'lane') {
      if (holdWind) beginWind(s);
      if (s.charging) {
        if (holdWind && !s.pointerWind) s.charge = clamp(s.charge + dt * 1.28, 0, 1);
      }
      if (s.charging && !holdWind) releaseWind(s);
    } else if (s.mode === 'dead') {
      if (s.t - s.deadAt > 0.8) seatLane(s);
    }
    const dx = (input.keys.has('ArrowRight') ? 1 : 0) - (input.keys.has('ArrowLeft') ? 1 : 0);
    const dy = (input.keys.has('ArrowDown') ? 1 : 0) - (input.keys.has('ArrowUp') ? 1 : 0);
    if (s.mode !== 'dead') {
      s.camera.x = clamp(s.camera.x + dx * 240 * dt, 220, 680);
      s.camera.y = clamp(s.camera.y + dy * 240 * dt, 250, 960);
    }
    const moved = dist(s.camera, s.prevCam);
    if (moved > 8) s.focus *= 0.72;
    s.prevCam = {x: s.camera.x, y: s.camera.y};
    if (s.mode === 'live') {
      const holdFocus = s.holding || input.actions.has('focus') || input.keys.has(' ');
      if (holdFocus) s.holding = true;
      const t = subject(s);
      const gain = 0.88 - s.level * 0.05;
      const drop = 1.55 + s.level * 0.1;
      s.focus = clamp(s.focus + (s.holding && t && moved < 10 ? gain : -drop) * dt, 0, 1);
      if (s.holding && !holdFocus) shutter(s);
    }
    for (const f of s.fly) f.t += dt;
    s.fly = s.fly.filter(f => f.t < f.dur);
  },
  pointer(s, type, p) {
    if (s.won) return;
    if (type === 'cancel') {
      s.holding = false;
      s.pointerWind = false;
      s.charging = false;
      s.focus = 0;
      return;
    }
    if (s.mode === 'lane') {
      if (type === 'down' && p.x > 640) {
        s.pointerWind = true;
        beginWind(s);
        s.charge = clamp((p.y - WIND.y) / WIND.pull, 0.05, 1);
      } else if ((type === 'down' || type === 'move') && !s.pointerWind) {
        s.camera.x = clamp(p.x, 220, 680);
        s.camera.y = clamp(p.y, 250, 960);
      }
      if (type === 'move' && s.pointerWind) s.charge = clamp((p.y - WIND.y) / WIND.pull, 0.05, 1);
      if (type === 'up') {
        if (s.pointerWind) { s.pointerWind = false; releaseWind(s); }
      }
      return;
    }
    if (s.mode !== 'live') return;
    if (type === 'down' || type === 'move') {
      const delta = dist(s.camera, p);
      s.camera.x = clamp(p.x, 220, 680);
      s.camera.y = clamp(p.y, 250, 960);
      if (delta > 30) s.focus *= 0.7;
    }
    if (type === 'down') s.holding = true;
    if (type === 'up') shutter(s);
  },
  action(s, id, down) {
    if (id === 'wind') {
      if (down) beginWind(s);
      else releaseWind(s);
    }
    if (id === 'focus') {
      if (down) s.holding = true;
      else shutter(s);
    }
  },
  key(s, k, down) {
    if (k !== ' ') return;
    if (s.mode === 'lane') {
      if (down) beginWind(s);
      else releaseWind(s);
    } else if (s.mode === 'live') {
      if (down) s.holding = true;
      else shutter(s);
    }
  },
  draw(s, d) {
    const set = s.set || SETS[s.level] || SETS[0];
    d.poly([[70, 36], [320, 36], [320, 118], [70, 118]], '#161022cc', '#e6c57a', 2);
    d.text('PAPER SAFARI', 195, 68, 16, '#fff3d0');
    d.text(String(s.score).padStart(6, '0'), 195, 96, 16, '#f0d49a');
    const remain = Math.ceil(Math.max(0, s.mode === 'live' ? s.clock : (s.clockMax || CLOCK)));
    d.text(remain + 's', 790, 68, 16, remain <= 8 && s.mode === 'live' ? '#f0a070' : '#ead6a4');
    for (const tr of TREES) d.leaf(tr.x, tr.y, tr.a, tr.s, s.level >= 4 ? '#4a5a48' : '#6a8a62');
    d.line({x: 450, y: 200}, {x: s.prizeSpot.x, y: s.prizeSpot.y - 18}, '#c4a46a', 2);
    for (const a of s.animals) {
      const next = framed(s, a) && !framed(s, s.prizeSpot);
      d.animal(a.x, a.y, a.kind, 1.45, s.t * 6);
      if (next && s.mode === 'live') d.text(a.kind, a.x, a.y - 78, 12, '#ead6a4');
    }
    if (s.prizeSpot) {
      const ps = s.prizeSpot;
      if (ps.flash > 0) d.glow(ps.x, ps.y, 78, '#f0d49a');
      d.circle(ps.x, ps.y, ps.r + 4, s.prizeOut ? '#2a242888' : '#6a3a28ee', '#f0d6a0', 3);
      d.item(spriteKey(set.prize), ps.x, ps.y, {
        w: s.prizeOut ? 34 : 48, alpha: s.prizeOut ? 0.35 : 1,
        fallback: () => d.star(ps.x, ps.y, 16, '#f4e2a8'),
      });
      if (!s.prizeOut) d.text('snap', ps.x, ps.y + ps.r + 16, 11, '#f0d6a8');
    }
    const p = s.camera, c = d.c;
    const green = s.focus >= set.need;
    c.save();
    c.strokeStyle = green ? '#bff4c4' : '#fff0c9';
    c.lineWidth = 3;
    c.strokeRect(p.x - set.hw - 6, p.y - set.hh - 6, (set.hw + 6) * 2, (set.hh + 6) * 2);
    c.restore();
    d.line({x: p.x - set.hw + 6, y: p.y}, {x: p.x + set.hw - 6, y: p.y}, '#f8e3b577', 1);
    d.line({x: p.x, y: p.y - set.hh + 6}, {x: p.x, y: p.y + set.hh - 6}, '#f8e3b577', 1);
    d.arc(p.x, p.y, 31, -Math.PI / 2, -Math.PI / 2 + s.focus * Math.PI * 2, green ? '#bff4c4' : '#f1dba3', 4);
    d.item(spriteKey('memory-camera'), p.x + set.hw + 28, p.y + set.hh + 8, {
      w: 54, fallback: () => d.circle(p.x + set.hw + 28, p.y + set.hh + 8, 16, '#6a3a48', '#ead6a4', 2),
    });
    d.poly([[118, 1020], [782, 1020], [798, 1172], [102, 1172]], '#2a1c16ee', '#e6c57a', 2);
    const n = 4;
    for (let i = 0; i < n; i++) {
      const x = 250 + i * 110;
      d.poly([[x - 42, 1040], [x + 42, 1040], [x + 42, 1136], [x - 42, 1136]], '#e4d5b3', '#bca573', 2);
      if (s.album[i]) {
        d.animal(x, 1080, s.album[i].kind, 0.62, s.t);
        d.text(s.album[i].quality, x, 1124, 14, '#485345');
      } else {
        d.item(spriteKey('shutter-click'), x, 1084, {
          w: 32, alpha: 0.45,
          fallback: () => d.text('?', x, 1086, 22, '#85836b'),
        });
      }
    }
    const springY = WIND.y + (s.mode === 'lane' ? s.charge * WIND.pull : 0);
    d.poly([[696, 1090], [758, 1090], [758, 1148], [696, 1148]], '#3a2a22cc', '#d2b07a', 2);
    d.line({x: WIND.x, y: springY + 16}, {x: WIND.x, y: 1086}, '#c5d0d6', 5);
    for (let i = 0; i < 7; i++) {
      const cy = springY + 22 + i * ((1084 - springY - 22) / 7);
      d.line({x: WIND.x - 9, y: cy}, {x: WIND.x + 9, y: cy}, '#d2b07a', 2);
    }
    d.circle(WIND.x, springY + 28, 15, s.charging ? '#f0d080' : '#8a3030', '#f0d0a8', 2);
    d.text('wind', WIND.x, 1162, 11, '#ead6a4');
    const purse = alleyPlay ? (pocket() ?? 0) : s.ammo;
    d.item(spriteKey('penny-purse'), 86, 64, {w: 72, fallback: () => d.heart(86, 64, 22, '#6a7a52')});
    d.text(String(purse), 86, 108, 18, '#fff6d8');
    d.poly([[760, 44], [828, 48], [824, 108], [756, 104]], '#6b3a3a', '#e8d4a0', 2);
    d.item(spriteKey(set.prize), 792, 76, {w: 36, fallback: () => d.star(792, 76, 12, '#f4e2a8')});
    for (const f of s.fly) {
      const u = Math.min(1, f.t / f.dur), e = 1 - (1 - u) * (1 - u);
      const destX = f.prize ? 792 : 86, destY = f.prize ? 76 : 64;
      d.item(spriteKey(f.id), f.x + (destX - f.x) * e, f.y + (destY - f.y) * e, {
        w: 28 * (1 - u * 0.35),
        fallback: () => d.ball(f.x + (destX - f.x) * e, f.y + (destY - f.y) * e, 9, '#d2b07a'),
      });
    }
    if (s.flash > 0) {
      c.fillStyle = 'rgba(255,251,224,' + (s.flash * 0.55) + ')';
      c.fillRect(0, 0, 900, 1200);
    }
  },
  readout: s => {
    const n = alleyPlay ? pocket() : s.ammo;
    const purse = (n == null ? '0' : n) + (alleyPlay ? (n === 1 ? ' penny' : ' pennies') : ' practice');
    const mode = s.mode === 'live' ? 'plate open' : s.mode === 'lane' ? (s.charging ? 'crank drawn' : 'wind a plate') : 'light gone';
    const clock = s.mode === 'live' ? Math.ceil(Math.max(0, s.clock)) + 's' : 'clock ready';
    return purse + ' · ' + clock + ' · ' + s.score + ' · ' + (s.prizeOut ? 'prize kept' : 'snap the prize') + ' · ' + mode + ' · ' + s.note;
  },
};
