/** Helter-skelter — full-trip corkscrew. On rails. No prizes. No hop-off. */
import { npc, advanceTrip, beat, easeInOut } from '../ride-kit.js';

const TAU = Math.PI * 2;
const DURATION = 58;

const C = {
  night: '#141b27',
  night2: '#243044',
  dusk: '#3a2c38',
  cream: '#f3e6c8',
  cream2: '#e8d4a6',
  paper: '#efe0bc',
  burgundy: '#7a3038',
  burgundy2: '#5a222a',
  gold: '#c9a45c',
  gold2: '#e8c878',
  wood: '#8a5a3a',
  wood2: '#6a422c',
  ink: '#1a1420',
  rail: '#d4b06a',
  skyline: '#1c2836',
};

const GUEST = { coat: '#e7eee8', vest: '#3d6a6e', skin: '#f0c9a8', hair: '#3a2a28', pants: '#4a3836' };
const PALS = {
  Pip: { coat: '#d4a04a', vest: '#8a4030', skin: '#efc4a0', hair: '#5a3a28', hat: '#7a3038', pants: '#5a3830' },
  Maren: { coat: '#8aa078', vest: '#6a3850', skin: '#f0c8b0', hair: '#2a1c1a', hat: '#c9a45c', pants: '#4a3040' },
  Ned: { coat: '#8a5a40', vest: '#3a3a48', skin: '#e8c09a', hair: '#c8b090', hat: '#efe0bc', pants: '#3a3030' },
};

const MARKS = [
  { at: 0, id: 'board' },
  { at: 0.05, id: 'climb' },
  { at: 0.12, id: 'summit' },
  { at: 0.18, id: 'commit' },
  { at: 0.26, id: 'first-turn' },
  { at: 0.40, id: 'windows' },
  { at: 0.56, id: 'rush' },
  { at: 0.74, id: 'last-coil' },
  { at: 0.86, id: 'tumble' },
  { at: 0.94, id: 'mat' },
];

const NOTES = {
  board: 'Penny taken. Mats at the stair — climb’s the easy part.',
  climb: 'Up the painted stair. Someone just flashed past a window.',
  summit: 'Hatch and night air. The corkscrew waits.',
  commit: 'Mat down. No hop-off now — the chute has you.',
  'first-turn': 'First coil. Painted stars in the window.',
  windows: 'Windows: moon, wheel, lanterns — not doors.',
  rush: 'The Slide of Joy talks. Hold the mat.',
  'last-coil': 'Last wrap. Cream square of mat below.',
  tumble: 'Tumble — paper limbs, landing pad.',
  mat: 'All off. Mind the step.',
};

const CHAT = {
  board: { Pip: 'Mats are the ticket, duck.', Maren: 'After you — I hate the stair.', Ned: 'Gallery’s lovely. Don’t linger.' },
  climb: { Pip: 'Not a door, that window.', Maren: 'How many steps is this?', Ned: 'I can see you in the pane!' },
  summit: { Pip: 'Hatch is open — night’s out.', Maren: 'I changed my mind.', Ned: 'Too late, Maren.' },
  commit: { Pip: 'Mat down. That’s the whole trick.', Maren: 'Oh—oh no—', Ned: 'Corkscrew does the talking!' },
  'first-turn': { Pip: 'First coil! Hat off!', Maren: 'Too fast already!', Ned: 'Painted stars — look left.' },
  windows: { Pip: 'Moon in that one.', Maren: 'They’re not doors, they’re not doors.', Ned: 'Wheel, lantern, heart — keep counting.' },
  rush: { Pip: 'Hold the mat!', Maren: 'The chute has us!', Ned: 'Slide of Joy, they said!' },
  'last-coil': { Pip: 'Mat below — cream square!', Maren: 'I want the stair back.', Ned: 'Tumble coming, toes in.' },
  tumble: { Pip: 'Whoops—', Maren: 'Paper over teakettle.', Ned: 'Mind the step!' },
  mat: { Pip: 'That’s the trip.', Maren: 'Never again. Tomorrow, maybe.', Ned: 'Tilly’ll want the mats.' },
};

const WAVE_LINE = {
  Pip: 'Hullo from the coil!',
  Maren: 'I am waving AND holding on!',
  Ned: 'That’s the spirit!',
};

const SEAT_AHEAD = 0.07;
const SEAT_BEHIND = -0.055;
const SEAT_COIL = 0.155;

const STARS = Array.from({ length: 32 }, (_, i) => {
  const u = frac(Math.sin(i * 12.9898) * 43758.5453);
  const v = frac(Math.sin(i * 78.233) * 23421.631);
  return { x: u, y: v, r: 1.1 + (i % 3) };
});

function frac(n) { return n - Math.floor(n); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

function riderProgress(s, seat) {
  const off = seat === 'ahead' ? SEAT_AHEAD : seat === 'behind' ? SEAT_BEHIND : SEAT_COIL;
  return clamp(s.progress + off, 0, 1);
}

function slideT(p) {
  return clamp((p - 0.18) / 0.68, 0, 1);
}

function slideTheta(p) {
  const t = slideT(p);
  return t * t * TAU * 5.6;
}

function lookFor(id) {
  if (id === 'board' || id === 'climb') return 'climb';
  if (id === 'tumble' || id === 'mat') return 'tumble';
  if (id === 'rush' || id === 'last-coil' || id === 'first-turn') return 'whoa';
  if (id === 'commit') return 'gasp';
  return 'idle';
}

function chatter(s, id) {
  const lines = CHAT[id] || {};
  for (const n of s.npcs) {
    if (lines[n.name]) n.line = lines[n.name];
    n.look = lookFor(id);
  }
}

function poly(ctx, pts, fill, stroke, width = 1.6) {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    if (i) ctx.lineTo(pts[i][0], pts[i][1]);
    else ctx.moveTo(pts[i][0], pts[i][1]);
  }
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.stroke(); }
}

function oval(ctx, x, y, rx, ry, fill, stroke, width = 1) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.4, rx), Math.max(0.4, ry), 0, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function paperPath(ctx, build, fill, stroke, ox = 3, oy = 5) {
  ctx.save();
  ctx.translate(ox, oy);
  ctx.globalAlpha *= 0.16;
  build();
  ctx.fillStyle = C.ink;
  ctx.fill();
  ctx.restore();
  build();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.7;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

function drawSky(ctx, w, h, t, spin) {
  const g = ctx.createLinearGradient(0, 0, 0, h * 0.7);
  g.addColorStop(0, '#0e1622');
  g.addColorStop(0.45, C.night2);
  g.addColorStop(1, C.dusk);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w * 0.5, h * 0.22);
  ctx.rotate(spin * 0.04);
  ctx.translate(-w * 0.5, -h * 0.22);
  for (const s of STARS) {
    const x = s.x * w, y = s.y * h * 0.48;
    const tw = 0.55 + 0.45 * Math.abs(Math.sin(t * 1.7 + s.x * 9));
    oval(ctx, x, y, s.r * tw, s.r * tw, C.cream);
  }
  ctx.restore();
  oval(ctx, w * 0.78, h * 0.14, 34, 34, '#f0e2b8');
  oval(ctx, w * 0.76, h * 0.13, 26, 26, C.night2);
}

function drawMidway(ctx, w, h, theta) {
  const horizon = h * 0.42;
  ctx.fillStyle = C.skyline;
  ctx.fillRect(0, horizon, w, h - horizon);
  for (let i = 0; i < 10; i++) {
    const a = theta * 0.12 + i * 0.62;
    const z = Math.cos(a);
    if (z < 0.05) continue;
    const x = w * 0.52 + Math.sin(a) * w * 0.48;
    const sc = 0.28 + z * 0.45;
    ctx.save();
    ctx.translate(x, horizon + 8);
    ctx.scale(sc, sc);
    ctx.globalAlpha = 0.35 + z * 0.5;
    if (i % 3 === 0) {
      oval(ctx, 0, -52, 40, 40, null, C.gold, 3);
      ctx.beginPath();
      ctx.arc(0, -52, 40, 0, TAU);
      ctx.stroke();
      for (let k = 0; k < 6; k++) {
        const aa = k * TAU / 6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(aa) * 8, -52 + Math.sin(aa) * 8);
        ctx.lineTo(Math.cos(aa) * 40, -52 + Math.sin(aa) * 40);
        ctx.strokeStyle = C.gold;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    } else {
      poly(ctx, [[-28, 0], [0, -46], [28, 0]], i % 2 ? C.burgundy2 : '#35504a', C.gold, 1.2);
      poly(ctx, [[-22, 0], [-22, 22], [22, 22], [22, 0]], '#2a3844', C.gold, 1);
    }
    ctx.restore();
  }
}

function drawSpiralRibbon(ctx, theta, yTop, yBot, turns, rIn, rOut) {
  const N = 52;
  for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 1) / N;
    const a0 = theta + t0 * turns * TAU;
    const a1 = theta + t1 * turns * TAU;
    const z0 = Math.cos(a0), z1 = Math.cos(a1);
    if (z0 < -0.4 && z1 < -0.4) continue;
    const y0 = yTop + (yBot - yTop) * t0;
    const y1 = yTop + (yBot - yTop) * t1;
    const x0 = Math.sin(a0), x1 = Math.sin(a1);
    ctx.beginPath();
    ctx.moveTo(x0 * rOut, y0);
    ctx.lineTo(x1 * rOut, y1);
    ctx.lineTo(x1 * rIn, y1 + 5);
    ctx.lineTo(x0 * rIn, y0 + 5);
    ctx.closePath();
    ctx.fillStyle = (z0 + z1) > 0 ? C.cream2 : '#c4a878';
    ctx.fill();
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0 * rOut, y0);
    ctx.lineTo(x1 * rOut, y1);
    ctx.lineTo(x1 * (rOut + 9), y1 + 3);
    ctx.lineTo(x0 * (rOut + 9), y0 + 3);
    ctx.closePath();
    ctx.fillStyle = C.burgundy;
    ctx.fill();
  }
}

function paperTower(ctx, x, y, sc, theta = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  oval(ctx, 4, 14, 92, 18, '#120c1444');

  poly(ctx, [[-48, 8], [-28, -18], [28, -18], [48, 8], [38, 8], [22, -8], [-22, -8], [-38, 8]], C.wood, C.gold, 1.4);
  for (let i = 0; i < 5; i++) {
    const yy = 6 - i * 5;
    const ww = 44 - i * 3;
    poly(ctx, [[-ww, yy], [ww, yy], [ww - 3, yy - 4], [-ww + 3, yy - 4]], i % 2 ? C.wood2 : '#9a6a48', C.gold, 0.8);
  }

  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-58, -18);
    ctx.lineTo(-42, -188);
    ctx.lineTo(42, -188);
    ctx.lineTo(58, -18);
    ctx.closePath();
  };
  paperPath(ctx, body, C.cream, C.gold, 4, 6);

  ctx.save();
  body();
  ctx.clip();
  for (let i = 0; i < 7; i++) {
    const x0 = -60 + i * 18;
    ctx.fillStyle = i % 2 ? C.burgundy : C.cream;
    ctx.fillRect(x0, -190, 18, 180);
  }
  ctx.restore();
  body();
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 2;
  ctx.stroke();

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const wx = -22 + col * 22;
      const wy = -58 - row * 42;
      paintedWindow(ctx, wx, wy, 14, 22, (row * 3 + col) % 6, false);
    }
  }

  drawSpiralRibbon(ctx, theta, -40, -175, 2.15, 38, 64);

  poly(ctx, [[-40, -188], [-36, -214], [36, -214], [40, -188]], C.burgundy2, C.gold, 1.4);
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI + i * Math.PI / 5;
    ctx.beginPath();
    ctx.arc(0, -210, 22, a, a + 0.35);
    ctx.strokeStyle = C.gold2;
    ctx.lineWidth = 2;
    ctx.stroke();
    oval(ctx, Math.cos(a) * 20, -210 + Math.sin(a) * 8, 3, 5, C.cream, C.gold, 0.8);
  }

  ctx.beginPath();
  ctx.moveTo(-38, -214);
  ctx.bezierCurveTo(-38, -250, -8, -268, 0, -278);
  ctx.bezierCurveTo(8, -268, 38, -250, 38, -214);
  ctx.closePath();
  ctx.fillStyle = C.burgundy;
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (let i = -4; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 10, -214);
    ctx.lineTo(0, -278);
    ctx.lineTo((i + 1) * 10, -214);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? C.cream : C.burgundy;
    ctx.fill();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(-38, -214);
  ctx.bezierCurveTo(-38, -250, -8, -268, 0, -278);
  ctx.bezierCurveTo(8, -268, 38, -250, 38, -214);
  ctx.closePath();
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  oval(ctx, 0, -282, 5, 5, C.gold2, C.gold, 1);
  ctx.beginPath();
  ctx.moveTo(0, -286);
  ctx.lineTo(0, -302);
  ctx.strokeStyle = C.gold2;
  ctx.lineWidth = 2;
  ctx.stroke();

  poly(ctx, [[-36, -8], [36, -28], [32, -38], [-40, -18]], C.burgundy2, C.gold, 1.4);
  ctx.font = '9px Georgia,serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = C.gold2;
  ctx.fillText('SLIDE OF JOY', 0, -20);

  ctx.beginPath();
  ctx.moveTo(-16, -4);
  ctx.quadraticCurveTo(0, -36, 16, -4);
  ctx.closePath();
  ctx.fillStyle = C.ink;
  ctx.fill();
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.restore();
}

function paintedWindow(ctx, x, y, rw, rh, kind, glow = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(-rw, rh * 0.45);
  ctx.lineTo(-rw, -rh * 0.15);
  ctx.quadraticCurveTo(-rw, -rh, 0, -rh);
  ctx.quadraticCurveTo(rw, -rh, rw, -rh * 0.15);
  ctx.lineTo(rw, rh * 0.45);
  ctx.closePath();
  ctx.fillStyle = '#1a2434';
  ctx.fill();
  if (glow) {
    ctx.fillStyle = '#e8c87822';
    ctx.fill();
  }
  ctx.save();
  ctx.clip();
  if (kind === 0) {
    oval(ctx, 3, -rh * 0.15, rw * 0.35, rw * 0.35, '#f0e2b8');
    oval(ctx, -rw * 0.35, -rh * 0.4, 1.6, 1.6, C.cream);
    oval(ctx, rw * 0.4, 4, 1.2, 1.2, C.cream);
  } else if (kind === 1) {
    oval(ctx, 0, -2, rw * 0.45, rw * 0.45, null, C.gold, 1.4);
    for (let k = 0; k < 4; k++) {
      const a = k * TAU / 4;
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(Math.cos(a) * rw * 0.45, -2 + Math.sin(a) * rw * 0.45);
      ctx.strokeStyle = C.gold;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  } else if (kind === 2) {
    oval(ctx, 0, 4, rw * 0.5, rh * 0.22, '#c8b080');
    oval(ctx, rw * 0.25, -rh * 0.15, rw * 0.22, rh * 0.18, '#c8b080');
  } else if (kind === 3) {
    ctx.beginPath();
    ctx.moveTo(0, rh * 0.2);
    ctx.bezierCurveTo(-rw, -rh * 0.1, -rw * 0.3, -rh * 0.7, 0, -rh * 0.25);
    ctx.bezierCurveTo(rw * 0.3, -rh * 0.7, rw, -rh * 0.1, 0, rh * 0.2);
    ctx.fillStyle = '#c67483';
    ctx.fill();
  } else if (kind === 4) {
    oval(ctx, 0, -rh * 0.2, rw * 0.28, rh * 0.22, C.gold2);
    poly(ctx, [[-2, -rh * 0.05], [2, -rh * 0.05], [3, rh * 0.4], [-3, rh * 0.4]], C.gold, C.gold, 0.6);
  } else {
    for (let k = 0; k < 6; k++) {
      const a = k * TAU / 6 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * rw * 0.7, Math.sin(a) * rh * 0.55);
      ctx.strokeStyle = C.gold2;
      ctx.lineWidth = 1.3;
      ctx.stroke();
    }
    oval(ctx, 0, 0, 3, 3, C.cream);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(-rw, rh * 0.45);
  ctx.lineTo(-rw, -rh * 0.15);
  ctx.quadraticCurveTo(-rw, -rh, 0, -rh);
  ctx.quadraticCurveTo(rw, -rh, rw, -rh * 0.15);
  ctx.lineTo(rw, rh * 0.45);
  ctx.closePath();
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.restore();
}

function drawMat(ctx, x, y, sc, rolled = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  if (rolled) {
    oval(ctx, 2, 4, 16, 7, '#120c1433');
    oval(ctx, 0, 0, 16, 7, C.paper, C.gold, 1.3);
    oval(ctx, 0, 0, 10, 4.5, C.burgundy);
    oval(ctx, 0, 0, 5, 2.2, C.paper);
  } else {
    poly(ctx, [[-42, 6], [42, -2], [46, 16], [-38, 24]], '#120c1430', null);
    poly(ctx, [[-44, 0], [44, -8], [48, 14], [-40, 22]], C.paper, C.gold, 1.6);
    poly(ctx, [[-30, 4], [34, -2], [36, 6], [-28, 12]], C.burgundy, null);
  }
  ctx.restore();
}

function paperRider(ctx, x, y, sc, spec) {
  const pal = spec.pal;
  const pose = spec.pose || 'sit';
  const lean = spec.lean || 0;
  const wave = spec.wave || 0;
  const facing = spec.facing || 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc * facing, sc);
  let rot = lean * 0.38;
  if (pose === 'whoa') rot += Math.sin((spec.t || 0) * 14) * 0.06;
  if (pose === 'tumble') rot += (spec.spin || 0);
  ctx.rotate(rot);

  if (pose === 'sit' || pose === 'slide' || pose === 'whoa' || pose === 'gasp') {
    drawMat(ctx, 0, 28, 1, false);
  }

  const leg = pose === 'climb'
    ? [[-10, 18], [-6, 38], [2, 36], [-2, 18]]
    : pose === 'tumble'
      ? [[-18, 10], [-28, 28], [-16, 32], [-6, 16]]
      : [[-8, 16], [-18, 30], [-8, 32], [2, 18]];
  const leg2 = pose === 'climb'
    ? [[6, 18], [14, 34], [22, 30], [12, 16]]
    : pose === 'tumble'
      ? [[8, 14], [26, 8], [28, 18], [10, 22]]
      : [[8, 16], [22, 28], [14, 34], [2, 20]];
  poly(ctx, leg, pal.pants, C.ink, 1);
  poly(ctx, leg2, pal.pants, C.ink, 1);

  const torso = () => {
    ctx.beginPath();
    ctx.moveTo(-14, 4);
    ctx.lineTo(-12, 22);
    ctx.lineTo(12, 22);
    ctx.lineTo(14, 4);
    ctx.quadraticCurveTo(0, 0, -14, 4);
  };
  paperPath(ctx, torso, pal.vest, C.gold, 2, 3);
  poly(ctx, [[-14, 6], [-18, 20], [-8, 22], [-6, 8]], pal.coat, C.gold, 1);
  poly(ctx, [[14, 6], [18, 20], [8, 22], [6, 8]], pal.coat, C.gold, 1);

  const armWave = wave > 0.12 || pose === 'wave';
  const armY = armWave ? -28 : (pose === 'climb' ? -6 : 10);
  const armX = armWave ? 16 : 20;
  ctx.beginPath();
  ctx.moveTo(10, 6);
  ctx.quadraticCurveTo(armX, armY * 0.4, armX + (armWave ? 2 : 6), armY);
  ctx.strokeStyle = pal.coat;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.stroke();
  oval(ctx, armX + (armWave ? 2 : 6), armY, 4.5, 4.5, pal.skin, C.ink, 0.8);

  ctx.beginPath();
  ctx.moveTo(-10, 6);
  ctx.quadraticCurveTo(-18, 12, pose === 'climb' ? -8 : -16, pose === 'climb' ? 2 : 16);
  ctx.strokeStyle = pal.coat;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.stroke();

  if (pose === 'climb') drawMat(ctx, -18, 8, 0.45, true);

  oval(ctx, 0, -10, 13, 14, pal.skin, C.ink, 1.1);
  oval(ctx, -5, -12, 2.1, 2.4, C.ink);
  oval(ctx, 5, -12, 2.1, 2.4, C.ink);
  ctx.beginPath();
  ctx.arc(0, -6, 5, 0.2, Math.PI - 0.2);
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  oval(ctx, 0, -20, 14, 8, pal.hair, C.ink, 0.8);
  if (pal.hat) {
    poly(ctx, [[-16, -18], [16, -18], [10, -30], [-10, -30]], pal.hat, C.gold, 1.2);
    ctx.fillStyle = C.cream;
    ctx.fillRect(-6, -22, 12, 3);
  }

  ctx.restore();

  if (spec.name && sc > 0.32) {
    ctx.save();
    ctx.font = `${Math.max(11, 12.5 * sc)}px Georgia,serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = C.cream;
    ctx.fillText(spec.name, x, y - 78 * sc);
    ctx.restore();
  }
}

function caption(ctx, w, text) {
  ctx.save();
  const tw = Math.min(w * 0.72, 420);
  poly(ctx, [[w / 2 - tw / 2, 36], [w / 2 + tw / 2, 36], [w / 2 + tw / 2 - 8, 68], [w / 2 - tw / 2 + 8, 68]], C.burgundy2, C.gold, 1.6);
  ctx.font = '16px Georgia,serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = C.gold2;
  ctx.fillText(text, w / 2, 58);
  ctx.restore();
}

function vignette(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h * 0.45, h * 0.2, w / 2, h * 0.5, h * 0.78);
  g.addColorStop(0, '#0000');
  g.addColorStop(1, '#0a0810aa');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function poseOf(look, falling) {
  if (falling) return 'tumble';
  if (look === 'climb') return 'climb';
  if (look === 'wave') return 'wave';
  if (look === 'whoa') return 'whoa';
  if (look === 'gasp') return 'gasp';
  return 'sit';
}

function drawBoard(s, ctx, w, h) {
  drawSky(ctx, w, h, s.t, 0);
  drawMidway(ctx, w, h, 0.4);
  const ground = ctx.createLinearGradient(0, h * 0.62, 0, h);
  ground.addColorStop(0, '#2a241c');
  ground.addColorStop(1, '#1a1612');
  ctx.fillStyle = ground;
  ctx.fillRect(0, h * 0.62, w, h * 0.38);
  oval(ctx, w * 0.5, h * 0.78, 260, 48, '#3a322855');
  paperTower(ctx, w * 0.52, h * 0.78, 1.55, s.t * 0.15);
  const bob = Math.sin(s.t * 5) * 3;
  paperRider(ctx, w * 0.52 + 38, h * 0.78 - 328, 0.5, {
    pal: PALS.Ned, pose: 'wave', wave: Math.max(0.6, s.npcs[2].wave), name: 'Ned', t: s.t,
  });
  paperRider(ctx, w * 0.38, h * 0.82 + bob, 0.9, {
    pal: GUEST, pose: 'climb', lean: s.lean, wave: s.wave, name: 'You', t: s.t,
  });
  paperRider(ctx, w * 0.28, h * 0.86, 0.78, {
    pal: PALS.Maren, pose: 'climb', name: 'Maren', t: s.t, lean: -0.1, wave: s.npcs[1].wave,
  });
  paperRider(ctx, w * 0.46, h * 0.70, 0.62, {
    pal: PALS.Pip, pose: 'climb', name: 'Pip', t: s.t, lean: 0.15, wave: s.npcs[0].wave,
  });
  caption(ctx, w, 'THE STAIR · 1¢');
}

function drawClimb(s, ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#2a1c1c');
  g.addColorStop(1, '#4a342c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const climb = clamp(s.progress / 0.12, 0, 1);
  for (let i = 14; i >= 0; i--) {
    const u = i / 14;
    const y = h * 0.12 + u * h * 0.78 - climb * 90 + s.look * 20;
    const ww = 70 + u * 340;
    const x = w * 0.5 + Math.sin(u * 4.2 + climb * 2.4) * 54 + s.lean * 28;
    const step = () => {
      ctx.beginPath();
      ctx.moveTo(x - ww, y);
      ctx.lineTo(x + ww, y);
      ctx.lineTo(x + ww * 0.82, y + 28);
      ctx.lineTo(x - ww * 0.82, y + 28);
      ctx.closePath();
    };
    paperPath(ctx, step, i % 2 ? C.wood : '#9a6a48', C.gold, 2, 4);
  }

  ctx.fillStyle = C.burgundy2;
  ctx.fillRect(0, 0, w * 0.16, h);
  ctx.fillRect(w * 0.84, 0, w * 0.16, h);
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(w * 0.16, 0); ctx.lineTo(w * 0.16, h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w * 0.84, 0); ctx.lineTo(w * 0.84, h); ctx.stroke();

  paintedWindow(ctx, w * 0.08, h * 0.28, 28, 48, 0);
  paintedWindow(ctx, w * 0.92, h * 0.46, 28, 48, 1);
  paintedWindow(ctx, w * 0.08, h * 0.64, 26, 44, 4);
  paintedWindow(ctx, w * 0.92, h * 0.22, 24, 40, 3);

  const nedP = riderProgress(s, 'coil');
  if (nedP > 0.18) {
    ctx.save();
    ctx.translate(w * 0.92, h * 0.46);
    ctx.scale(0.28, 0.28);
    paperRider(ctx, 0, 20, 1, { pal: PALS.Ned, pose: 'whoa', name: 'Ned', t: s.t, lean: 0.4 });
    ctx.restore();
  }

  ctx.save();
  ctx.translate(w * 0.5, h * 0.08);
  ctx.beginPath();
  ctx.moveTo(-70, 40);
  ctx.bezierCurveTo(-60, -30, -10, -70, 0, -78);
  ctx.bezierCurveTo(10, -70, 60, -30, 70, 40);
  ctx.closePath();
  ctx.fillStyle = C.burgundy;
  ctx.fill();
  ctx.clip();
  for (let i = -5; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 16, 40);
    ctx.lineTo(0, -78);
    ctx.lineTo((i + 1) * 16, 40);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? C.cream : C.burgundy;
    ctx.fill();
  }
  ctx.restore();

  const bob = Math.sin(s.t * 7) * 4;
  paperRider(ctx, w * 0.52 + s.lean * 40, h * 0.66 + bob + s.look * 16, 1.05, {
    pal: GUEST, pose: 'climb', lean: s.lean * 0.5, wave: s.wave, name: 'You', t: s.t,
  });
  paperRider(ctx, w * 0.58, h * 0.42 - climb * 20, 0.72, {
    pal: PALS.Pip, pose: 'climb', name: 'Pip', t: s.t, lean: 0.1, wave: s.npcs[0].wave,
  });
  paperRider(ctx, w * 0.40, h * 0.84, 0.8, {
    pal: PALS.Maren, pose: 'climb', name: 'Maren', t: s.t, lean: -0.12, wave: s.npcs[1].wave,
  });
  caption(ctx, w, 'THE CLIMB');
}

function drawCommit(s, ctx, w, h) {
  drawSky(ctx, w, h, s.t, 0.2);
  drawMidway(ctx, w, h, 0.6);
  const g = ctx.createLinearGradient(0, h * 0.4, 0, h);
  g.addColorStop(0, '#0000');
  g.addColorStop(1, C.burgundy2);
  ctx.fillStyle = g;
  ctx.fillRect(0, h * 0.35, w, h * 0.65);

  poly(ctx, [[40, h * 0.42], [w - 40, h * 0.38], [w - 20, h * 0.58], [30, h * 0.62]], C.cream2, C.gold, 2);
  poly(ctx, [[30, h * 0.62], [w - 20, h * 0.58], [w * 0.7, h * 0.92], [w * 0.12, h], [0, h * 0.82]], C.burgundy, C.gold, 2);
  poly(ctx, [[w * 0.18, h * 0.64], [w * 0.78, h * 0.6], [w * 0.62, h * 0.88], [w * 0.2, h * 0.9]], C.paper, C.gold, 1.6);

  paintedWindow(ctx, w * 0.16, h * 0.28, 36, 58, 0);
  paintedWindow(ctx, w * 0.84, h * 0.26, 32, 52, 5);

  paperRider(ctx, w * 0.72, h * 0.78, 0.48, {
    pal: PALS.Pip, pose: 'whoa', name: 'Pip', t: s.t, lean: 0.5, wave: s.npcs[0].wave,
  });
  paperRider(ctx, w * 0.46 + s.lean * 36, h * 0.62 + s.look * 12, 1.12, {
    pal: GUEST, pose: 'gasp', lean: s.lean, wave: s.wave, name: 'You', t: s.t,
  });
  paperRider(ctx, w * 0.28, h * 0.54, 0.7, {
    pal: PALS.Maren, pose: 'gasp', name: 'Maren', t: s.t, lean: -0.2, wave: s.npcs[1].wave,
  });
  paperRider(ctx, w * 0.8, h * 0.48, 0.4, {
    pal: PALS.Ned, pose: 'whoa', name: 'Ned', t: s.t, lean: 0.3, wave: s.npcs[2].wave,
  });
  caption(ctx, w, 'COMMIT');
}

function drawInnerWall(ctx, w, h, theta, lean) {
  const cx = w * 0.3 + lean * 36;
  const top = h * 0.1, bot = h * 0.78;
  const facets = [];
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a0 = theta + (i / n) * TAU;
    const a1 = a0 + TAU / n;
    facets.push({ i, a0, a1, z: (Math.cos(a0) + Math.cos(a1)) / 2 });
  }
  facets.sort((a, b) => a.z - b.z);
  for (const f of facets) {
    if (f.z < -0.05) continue;
    const x0 = cx + Math.sin(f.a0) * w * 0.24;
    const x1 = cx + Math.sin(f.a1) * w * 0.24;
    if (Math.abs(x1 - x0) < 6) continue;
    const left = Math.min(x0, x1), right = Math.max(x0, x1);
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(right, top);
    ctx.lineTo(right, bot);
    ctx.lineTo(left, bot);
    ctx.closePath();
    ctx.fillStyle = f.i % 2 ? C.burgundy : C.cream;
    ctx.fill();
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    if (f.i % 2 === 1 && f.z > 0.25) {
      const mx = (left + right) / 2;
      const my = top + 70 + (f.i * 41) % 210;
      paintedWindow(ctx, mx, my, Math.min(28, (right - left) * 0.32), 50, f.i % 6);
    }
  }
}

function drawChute(ctx, w, h, theta, lean, speed) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(w * 0.06, h * 0.3);
  ctx.lineTo(w * 0.96, h * 0.26);
  ctx.lineTo(w * 1.08, h * 0.94);
  ctx.lineTo(w * -0.08, h * 0.98);
  ctx.closePath();
  ctx.clip();
  const shift = (theta * 22) % 64;
  for (let i = -2; i < 18; i++) {
    const y0 = h * 0.26 + i * 58 + shift;
    ctx.fillStyle = i % 2 ? C.cream2 : '#d7c090';
    ctx.fillRect(-20, y0, w + 40, 32);
  }
  ctx.restore();

  ctx.save();
  ctx.translate(lean * 20, 0);
  ctx.beginPath();
  ctx.moveTo(w * 0.02, h * 0.32);
  for (let i = 0; i <= 10; i++) {
    const yy = lerp(h * 0.32, h * 0.96, i / 10);
    const xx = 18 + Math.sin(theta * 2 + i * 0.5) * 10;
    ctx.lineTo(xx, yy);
  }
  ctx.lineTo(0, h);
  ctx.lineTo(0, h * 0.3);
  ctx.closePath();
  ctx.fillStyle = C.burgundy;
  ctx.fill();
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(w * 0.98, h * 0.28);
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const yy = lerp(h * 0.28, h * 0.95, t);
    const scall = Math.sin(t * 18 + theta * 3) * 16;
    ctx.lineTo(w - 26 + scall, yy);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(w, h * 0.26);
  ctx.closePath();
  ctx.fillStyle = C.burgundy2;
  ctx.fill();
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  if (speed > 0.35) {
    ctx.save();
    ctx.strokeStyle = `rgba(243,230,200,${0.15 + speed * 0.25})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const x = (i * 89 + smod(theta * 80, w));
      const y = 80 + i * 90;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 18 * speed, y + 40, x - 12 + lean * 24, y + 70 + speed * 40);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function smod(v, m) {
  return ((v % m) + m) % m;
}

function drawSlide(s, ctx, w, h) {
  const p = s.progress;
  const theta = slideTheta(p);
  const tSlide = slideT(p);
  const speed = clamp(tSlide * 1.6, 0, 1.4);
  drawSky(ctx, w, h, s.t, theta);
  drawMidway(ctx, w, h, theta);
  drawInnerWall(ctx, w, h, theta, s.lean);
  drawChute(ctx, w, h, theta, s.lean, speed);

  const sway = Math.sin(theta) * 22 + s.lean * 18;
  const guestBob = Math.sin(s.t * (8 + speed * 6)) * (3 + speed * 5);

  paperRider(ctx, w * 0.22 + Math.sin(theta + 1.1) * 36, h * 0.34 + Math.cos(theta) * 16, 0.44, {
    pal: PALS.Ned,
    pose: poseOf(s.npcs[2].look, false),
    lean: Math.sin(theta) * 0.35,
    wave: s.npcs[2].wave,
    name: 'Ned',
    t: s.t,
  });
  paperRider(ctx, w * 0.6 + sway * 0.45, lerp(h * 0.38, h * 0.52, tSlide) + guestBob * 0.4, 0.56, {
    pal: PALS.Pip,
    pose: poseOf(s.npcs[0].look, false),
    lean: 0.35 + s.lean * 0.2,
    wave: s.npcs[0].wave,
    name: 'Pip',
    t: s.t,
  });
  paperRider(ctx, w * 0.5 + s.lean * 48, h * 0.7 + guestBob + s.look * 18, 1.18, {
    pal: GUEST,
    pose: tSlide > 0.85 ? 'whoa' : (s.wave > 0.2 ? 'wave' : 'whoa'),
    lean: s.lean + Math.sin(s.t * 10) * 0.08 * speed,
    wave: s.wave,
    name: 'You',
    t: s.t,
  });
  paperRider(ctx, w * 0.32 + s.lean * 22, h * 0.88 + guestBob * 0.3, 0.86, {
    pal: PALS.Maren,
    pose: poseOf(s.npcs[1].look, false),
    lean: -0.25 + s.lean * 0.2,
    wave: s.npcs[1].wave,
    name: 'Maren',
    t: s.t,
  });

  const label = p < 0.4 ? 'FIRST COIL' : p < 0.56 ? 'PAINTED WINDOWS' : p < 0.74 ? 'THE CORKSCREW' : 'LAST WRAP';
  caption(ctx, w, label);
}

function drawTumble(s, ctx, w, h) {
  const u = clamp((s.progress - 0.86) / 0.14, 0, 1);
  const spin = (1 - easeInOut(u)) * 1.15;
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(spin);
  ctx.translate(-w / 2, -h / 2);
  drawSky(ctx, w, h, s.t, 0.4);
  drawMidway(ctx, w, h, 1.2);
  const ground = ctx.createLinearGradient(0, h * 0.5, 0, h);
  ground.addColorStop(0, '#2c2620');
  ground.addColorStop(1, '#1a1612');
  ctx.fillStyle = ground;
  ctx.fillRect(0, h * 0.52, w, h * 0.48);
  paperTower(ctx, w * 0.5, h * 0.58, lerp(1.1, 0.72, u), 1.4);
  drawMat(ctx, w * 0.5, h * 0.82, 2.4, false);
  oval(ctx, w * 0.5, h * 0.86, 180, 28, '#efe0bc55');

  const flop = (1 - u) * 2.2;
  paperRider(ctx, w * 0.5 + s.lean * 20, h * 0.78, 1.05, {
    pal: GUEST, pose: u < 0.55 ? 'tumble' : 'sit', spin: flop, lean: s.lean, wave: s.wave, name: 'You', t: s.t,
  });
  paperRider(ctx, w * 0.28, h * 0.80, 0.82, {
    pal: PALS.Pip, pose: u < 0.45 ? 'tumble' : 'sit', spin: -flop * 0.7, name: 'Pip', t: s.t, wave: s.npcs[0].wave,
  });
  paperRider(ctx, w * 0.7, h * 0.81, 0.78, {
    pal: PALS.Maren, pose: u < 0.6 ? 'tumble' : 'sit', spin: flop * 0.5, name: 'Maren', t: s.t, wave: s.npcs[1].wave,
  });
  paperRider(ctx, w * 0.6, h * 0.72, 0.7, {
    pal: PALS.Ned, pose: 'sit', name: 'Ned', t: s.t, wave: Math.max(s.npcs[2].wave, 0.4), lean: 0.15,
  });

  for (let i = 0; i < 8; i++) {
    const a = i * TAU / 8 + s.t;
    const rr = 40 + u * 90;
    oval(ctx, w * 0.5 + Math.cos(a) * rr, h * 0.84 + Math.sin(a) * 16, 10 - u * 4, 5, '#f3e6c833');
  }
  ctx.restore();
  caption(ctx, w, u > 0.7 ? 'ALL OFF · MIND THE MAT' : 'TUMBLE');
}

function create() {
  return {
    phase: 'riding',
    t: 0,
    progress: 0,
    npcs: [
      npc('Pip', 'ahead', 'idle', 'Mats are the ticket, duck.'),
      npc('Maren', 'behind', 'idle', 'After you — I hate the stair.'),
      npc('Ned', 'coil', 'wave', 'Gallery’s lovely. Don’t linger.'),
    ],
    note: NOTES.board,
    exitNote: 'All off — mind the mat. Tilly’ll want it back.',
    beat: 'board',
    lean: 0,
    leanTo: 0,
    look: 0,
    lookTo: 0,
    wave: 0,
    fare: '1¢',
  };
}

function update(s, dt) {
  const finished = advanceTrip(s, dt, DURATION);
  s.lean += ((s.leanTo || 0) - s.lean) * Math.min(1, dt * 7);
  s.look += ((s.lookTo || 0) - s.look) * Math.min(1, dt * 6);
  s.leanTo = (s.leanTo || 0) * Math.exp(-dt * 1.7);
  s.lookTo = (s.lookTo || 0) * Math.exp(-dt * 1.5);
  s.wave = Math.max(0, (s.wave || 0) - dt * 1.35);
  const id = beat(s.progress, MARKS);
  if (id !== s.beat) {
    s.beat = id;
    s.note = NOTES[id] || s.note;
    chatter(s, id);
  }
  for (const n of s.npcs) {
    n.wave = Math.max(0, (n.wave || 0) - dt * 1.15);
    if (n.wave > 0.35) n.look = 'wave';
    else n.look = lookFor(s.beat);
  }
  if (finished) {
    s.beat = 'mat';
    s.note = s.exitNote;
    chatter(s, 'mat');
  }
}

function pointer(s, type, pos) {
  if (type !== 'down' || s.phase !== 'riding') return;
  const x = pos?.x ?? 450;
  const y = pos?.y ?? 600;
  s.leanTo = clamp((x - 450) / 260, -1, 1);
  s.lookTo = clamp((y - 580) / 380, -1, 1);
  s.wave = 1;
  for (const n of s.npcs) {
    n.wave = 0.9;
    n.look = 'wave';
    n.line = WAVE_LINE[n.name] || 'Hullo!';
  }
}

function readout(s) {
  const talk = s.npcs.find((n) => n.line);
  const fare = s.progress < 0.08 ? '1¢ trip · ' : '';
  return fare + (s.note || '') + (talk ? ' · ' + talk.name + ': “' + talk.line + '”' : '');
}

function draw(s, d) {
  const ctx = d.ctx, w = d.w, h = d.h;
  const id = s.beat || beat(s.progress, MARKS);
  if (id === 'board') drawBoard(s, ctx, w, h);
  else if (id === 'climb') drawClimb(s, ctx, w, h);
  else if (id === 'summit' || id === 'commit') drawCommit(s, ctx, w, h);
  else if (id === 'tumble' || id === 'mat' || s.phase === 'done') drawTumble(s, ctx, w, h);
  else drawSlide(s, ctx, w, h);
  vignette(ctx, w, h);
}

export default {
  title: 'Helter-skelter',
  intro: 'Tilly thumps a rolled mat against her palm. “Penny on the stair, love — climb’s the easy part. Corkscrew does the talking. Hold the mat and don’t hop off halfway; the painted windows aren’t doors.”',
  create,
  update,
  draw,
  readout,
  pointer,
};
