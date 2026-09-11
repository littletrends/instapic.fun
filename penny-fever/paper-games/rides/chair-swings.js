/** Chair swings — full-trip amusement ride. Hugo’s barker flavour lives in intro only. */
import { npc, advanceTrip, beat, easeInOut } from '../ride-kit.js';

const TAU = Math.PI * 2;
const DURATION = 62;
const CHAIRS = 8;
const GUEST_SEAT = 0;

const BEATS = [
  { at: 0, id: 'board' },
  { at: 0.06, id: 'lift' },
  { at: 0.15, id: 'spinup' },
  { at: 0.28, id: 'out' },
  { at: 0.42, id: 'flight' },
  { at: 0.55, id: 'wave' },
  { at: 0.68, id: 'tilt' },
  { at: 0.80, id: 'settle' },
  { at: 0.93, id: 'land' },
];

const LINES = {
  board: { who: '', text: 'Hugo rings the bell. Chains clink. Sit still a moment.' },
  lift: { who: 'Pip', text: 'Oh— the chairs are climbing!' },
  spinup: { who: 'Marigold', text: 'There it is — the little music-box waltz.' },
  out: { who: 'Ned', text: 'Hold your hats! We’re going out!' },
  flight: { who: 'Lila', text: 'The whole midway is a music box.' },
  wave: { who: 'Marigold', text: 'Wave, wave! They can see us from the alley!' },
  tilt: { who: 'Pip', text: 'The world is leaning — I love it—' },
  settle: { who: 'Ned', text: 'Coming in… chains folding home.' },
  land: { who: '', text: 'Platform. Mind the step.' },
};

const FACES = {
  You: { skin: '#edd2b0', hair: '#3d2a1c', coat: '#e8d4a8', accent: '#7a3040', hat: '#5c3a28', size: 1.08 },
  Pip: { skin: '#e6c19a', hair: '#2c2018', coat: '#c9a24e', accent: '#6b4428', hat: '#6b4428', size: 0.86 },
  Marigold: { skin: '#f0d0b4', hair: '#8a3040', coat: '#c45c6a', accent: '#f3dfb2', hat: '', size: 1 },
  Ned: { skin: '#d9b08a', hair: '#4a3424', coat: '#3d5c52', accent: '#d4b36a', hat: '#3a2a20', size: 1.06 },
  Lila: { skin: '#efd4c0', hair: '#5c3a58', coat: '#8a6aa8', accent: '#f0d9b0', hat: '', size: 0.96 },
  Bess: { skin: '#e8c8a8', hair: '#c4a070', coat: '#d4896a', accent: '#7a3040', hat: '#c4a070', size: 0.92 },
  Cal: { skin: '#cfa882', hair: '#241814', coat: '#4a6e62', accent: '#e8c878', hat: '', size: 1 },
  Wren: { skin: '#e2c4a4', hair: '#5a4030', coat: '#7a4e3a', accent: '#d4b36a', hat: '#4a3020', size: 0.9 },
};

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function remap(p, a, b) {
  return clamp((p - a) / (b - a || 1), 0, 1);
}

function rideMotion(p) {
  let height = 0;
  let swing = 0;
  let rpm = 0;
  if (p < 0.06) {
    height = 0;
    swing = 0;
    rpm = 0;
  } else if (p < 0.14) {
    const t = easeInOut(remap(p, 0.06, 0.14));
    height = t * 0.5;
    swing = t * 0.06;
    rpm = t * 0.12;
  } else if (p < 0.30) {
    const t = easeInOut(remap(p, 0.14, 0.30));
    height = 0.5 + t * 0.38;
    swing = 0.06 + t * 0.74;
    rpm = 0.12 + t * 0.88;
  } else if (p < 0.78) {
    const u = remap(p, 0.30, 0.78);
    const breath = Math.sin(u * Math.PI * 4);
    height = 0.88 + breath * 0.04;
    swing = 0.80 + Math.sin(u * Math.PI * 3) * 0.1;
    rpm = 1.0 + Math.sin(u * Math.PI * 2) * 0.06;
    if (p > 0.64 && p < 0.74) swing += Math.sin(remap(p, 0.64, 0.74) * Math.PI) * 0.08;
  } else if (p < 0.92) {
    const t = easeInOut(remap(p, 0.78, 0.92));
    height = lerp(0.88, 0.06, t);
    swing = 0.82 * (1 - t);
    rpm = (1 - t) * (1 - t);
  } else {
    const t = easeInOut(remap(p, 0.92, 1));
    height = 0.06 * (1 - t);
    swing = 0;
    rpm = 0;
  }
  return { height, swing, rpm };
}

function applyBeat(s, id) {
  const line = LINES[id] || LINES.board;
  s.note = line.who ? `${line.who}: “${line.text}”` : line.text;
  s.speaker = line.who;
  for (const n of s.npcs) {
    n.line = n.name === line.who ? line.text : '';
    if (id === 'lift') n.look = 'up';
    else if (id === 'out' || id === 'tilt') n.look = 'lean';
    else if (id === 'settle' || id === 'land' || id === 'board') n.look = 'idle';
    else if (id === 'flight' || id === 'wave') n.look = 'wave';
    else n.look = 'idle';
    if (id === 'wave') n.wave = n.name === 'Marigold' ? 1.8 : 1.05;
    else if (id === 'flight' && (n.name === 'Lila' || n.name === 'Cal')) n.wave = 0.9;
    else if (id === 'out' && n.name === 'Ned') n.wave = 0.5;
  }
}

function create() {
  return {
    phase: 'riding',
    t: 0,
    progress: 0,
    spin: 0,
    height: 0,
    swing: 0,
    rpm: 0,
    beat: 'board',
    lean: 0,
    leanTo: 0,
    look: 0,
    lookTo: 0,
    wave: 0,
    speaker: '',
    note: LINES.board.text,
    exitNote: 'All off — mind the step. Hugo rings you home.',
    npcs: [
      npc('Marigold', 1, 'idle', ''),
      npc('Lila', 2, 'idle', ''),
      npc('Cal', 3, 'idle', ''),
      npc('Wren', 4, 'idle', ''),
      npc('Bess', 5, 'idle', ''),
      npc('Ned', 6, 'idle', ''),
      npc('Pip', 7, 'idle', ''),
    ],
  };
}

function update(s, dt) {
  const finished = advanceTrip(s, dt, DURATION);
  const motion = rideMotion(s.progress || 0);
  s.height = motion.height;
  s.swing = motion.swing;
  s.rpm = motion.rpm;
  s.spin = (s.spin || 0) + motion.rpm * 1.12 * dt;

  const id = beat(s.progress, BEATS);
  if (id !== s.beat) {
    s.beat = id;
    applyBeat(s, id);
  }

  for (const n of s.npcs) {
    if (n.wave > 0) n.wave = Math.max(0, n.wave - dt * 0.48);
  }
  if (s.wave > 0) s.wave = Math.max(0, s.wave - dt * 0.62);
  s.lean += ((s.leanTo || 0) - s.lean) * Math.min(1, dt * 4.2);
  s.look += ((s.lookTo || 0) - s.look) * Math.min(1, dt * 5);
  s.leanTo = (s.leanTo || 0) * (1 - dt * 0.32);
  s.lookTo = (s.lookTo || 0) * (1 - dt * 0.4);

  if (finished) {
    s.note = s.exitNote;
    s.speaker = '';
    for (const n of s.npcs) {
      n.line = '';
      n.look = 'idle';
      n.wave = 0;
    }
  }
}

function pointer(s, type, pos) {
  if (!s || s.phase !== 'riding' || type !== 'down' || !pos) return;
  const w = s._w || 900;
  const x = clamp((pos.x / w) * 2 - 1, -1, 1);
  s.leanTo = x;
  s.lookTo = x;
  s.wave = 1.2;
  let nearest = null;
  let best = 80;
  for (const n of s.npcs) {
    if (n._x == null) continue;
    const d = Math.abs(n._x - pos.x);
    if (d < best) {
      best = d;
      nearest = n;
    }
  }
  if (nearest) nearest.wave = Math.max(nearest.wave || 0, 1.15);
}

function readout(s) {
  if (!s) return 'Chair swings.';
  if (s.phase === 'done') return s.note || 'All off — mind the step.';
  return s.note || 'Chair swings.';
}

function chairLayout(s, w, h) {
  const motion = rideMotion(s.progress || 0);
  const height = motion.height;
  const swing = motion.swing;
  const cx = w * 0.5 + (s.lean || 0) * 10;
  const cy = h * 0.38 - height * h * 0.02;
  const camY = h * 0.68;
  const R = lerp(Math.min(w, h) * 0.11, Math.min(w, h) * 0.33, swing);
  const waltz = Math.sin((s.t || 0) * Math.PI * 2 * 0.7) * (0.15 + motion.rpm);
  const chairs = [];
  for (let i = 0; i < CHAIRS; i++) {
    const sway = Math.sin((s.t || 0) * 2.35 + i * 1.27) * 0.045 * (0.25 + swing);
    const a = Math.PI / 2 + (i * TAU) / CHAIRS + sway;
    const depth = 0.5 + 0.5 * Math.sin(a);
    const x = cx + Math.cos(a) * R * (0.55 + 0.45 * depth);
    const hang = lerp(96, 28, swing);
    const y = camY - (1 - depth) * R * 1.05 - height * 36 + depth * 28 + hang * (0.35 + depth * 0.55) + waltz * 6 * depth;
    const sc = (0.34 + depth * 0.78) * lerp(0.92, 1, swing * 0.15);
    const outTilt = Math.cos(a) * swing * 0.5;
    const backTilt = i === GUEST_SEAT ? swing * 0.18 : swing * 0.08;
    const who = i === GUEST_SEAT
      ? { name: 'You', seat: 0, look: s.look, wave: s.wave, isGuest: true, line: '' }
      : s.npcs.find((n) => n.seat === i);
    const ax = cx + Math.cos(a) * lerp(R * 0.45, R * 0.72, 1 - swing * 0.2);
    const ay = cy - 8 + Math.sin(a) * 10;
    chairs.push({
      i, a, x, y, depth, sc,
      tilt: outTilt + (i === GUEST_SEAT ? (s.lean || 0) * 0.22 : 0) + backTilt * Math.sin(a),
      who, ax, ay,
    });
  }
  return { motion, height, swing, cx, cy, camY, R, chairs };
}

function drawSky(ctx, w, h, height, spin) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  const dusk = 1 - height * 0.35;
  g.addColorStop(0, height > 0.5 ? '#141022' : '#1b1430');
  g.addColorStop(0.42, lerpTone('#2a2448', '#1a1838', height));
  g.addColorStop(0.72, `rgba(${Math.round(180 * dusk)}, ${Math.round(96 * dusk)}, ${Math.round(88 * dusk)}, 1)`);
  g.addColorStop(1, '#3a2a28');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(w * 0.5, h * 0.46);
  ctx.rotate(spin * 0.15);
  ctx.translate(-w * 0.5, -h * 0.46);
  for (let i = 0; i < 28; i++) {
    const seed = i * 19.17;
    const x = ((seed * 97) % 100) / 100 * w;
    const y = ((seed * 53) % 100) / 100 * h * 0.55;
    const r = 1.1 + (i % 3);
    ctx.fillStyle = `rgba(243,223,178,${0.25 + (i % 5) * 0.08})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  const moonA = spin * 0.2 + 0.4;
  const mx = w * 0.5 + Math.cos(moonA) * w * 0.38;
  const my = h * (0.16 - height * 0.02) + Math.sin(moonA) * 18;
  const mg = ctx.createRadialGradient(mx - 6, my - 6, 2, mx, my, 34);
  mg.addColorStop(0, '#fff6d8');
  mg.addColorStop(1, '#f3dfb200');
  ctx.fillStyle = mg;
  ctx.beginPath();
  ctx.arc(mx, my, 34, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f7ebc8';
  ctx.beginPath();
  ctx.arc(mx, my, 16, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#e8c878';
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

function lerpTone(a, b, t) {
  return t > 0.5 ? b : a;
}

function drawWorld(ctx, w, h, s, motion) {
  const { height, rpm } = motion;
  const spin = s.spin || 0;
  const horizon = h * (0.58 + height * 0.1);
  const cx = w * 0.5;

  const ground = ctx.createLinearGradient(0, horizon - 20, 0, h);
  ground.addColorStop(0, '#3d4a40');
  ground.addColorStop(0.35, '#2a322c');
  ground.addColorStop(1, '#1a1c18');
  ctx.fillStyle = ground;
  ctx.fillRect(0, horizon, w, h - horizon);

  ctx.strokeStyle = '#d4b36a55';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  ctx.lineTo(w, horizon);
  ctx.stroke();

  const rad = w * (0.62 + height * 0.42);
  for (let i = 0; i < 12; i++) {
    const a = spin * 0.9 + (i * TAU) / 12;
    const z = Math.sin(a);
    if (z < -0.15) continue;
    const x = cx + Math.cos(a) * rad * 0.52;
    const y = horizon - z * 26 - height * 48;
    const sc = (0.45 + z * 0.55) * (0.85 + height * 0.1);
    const kind = i % 5;
    if (kind === 0) drawTent(ctx, x, y, sc, i);
    else if (kind === 1) drawTree(ctx, x, y, sc);
    else if (kind === 2) drawWheel(ctx, x, y, sc, spin);
    else if (kind === 3) drawSlide(ctx, x, y, sc);
    else drawTent(ctx, x, y, sc * 0.85, i + 3);
  }

  for (let i = 0; i < 22; i++) {
    const a = spin * 1.05 + (i * TAU) / 22;
    const z = Math.sin(a);
    if (z < 0) continue;
    const x = cx + Math.cos(a) * rad * 0.38;
    const y = horizon - 10 - z * 14 - height * 30;
    const streak = rpm > 0.35 ? (rpm - 0.35) * 26 : 0;
    const tang = a + Math.PI / 2;
    ctx.save();
    ctx.globalAlpha = 0.35 + z * 0.45;
    if (streak > 2) {
      const lg = ctx.createLinearGradient(x, y, x + Math.cos(tang) * streak, y + Math.sin(tang) * streak * 0.3);
      lg.addColorStop(0, '#ffe6a4');
      lg.addColorStop(1, '#ffe6a400');
      ctx.strokeStyle = lg;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(tang) * streak, y + Math.sin(tang) * streak * 0.3);
      ctx.stroke();
    }
    ctx.fillStyle = i % 2 ? '#f3dfb2' : '#e8a878';
    ctx.beginPath();
    ctx.arc(x, y, 2.4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawTent(ctx, x, y, sc, seed) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  ctx.fillStyle = '#12201855';
  ctx.beginPath();
  ctx.ellipse(4, 10, 38, 8, 0, 0, TAU);
  ctx.fill();
  const stripe = seed % 2 ? '#7a3040' : '#3d5c52';
  ctx.fillStyle = stripe;
  ctx.beginPath();
  ctx.moveTo(0, -52);
  ctx.lineTo(40, 8);
  ctx.lineTo(-40, 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#d4b36a';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = '#f0d9b0';
  ctx.beginPath();
  ctx.moveTo(0, -52);
  ctx.lineTo(8, -20);
  ctx.lineTo(-8, -20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8c878';
  ctx.beginPath();
  ctx.arc(0, -56, 4, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawTree(ctx, x, y, sc) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  ctx.fillStyle = '#4a3428';
  ctx.fillRect(-4, -8, 8, 22);
  ctx.fillStyle = '#3d5c46';
  ctx.beginPath();
  ctx.ellipse(0, -22, 18, 22, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#c9ae7b66';
  ctx.stroke();
  ctx.restore();
}

function drawWheel(ctx, x, y, sc, spin) {
  ctx.save();
  ctx.translate(x, y - 28 * sc);
  ctx.scale(sc, sc);
  ctx.strokeStyle = '#d4b36a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 28, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, TAU);
  ctx.stroke();
  ctx.rotate(spin * 0.7);
  for (let i = 0; i < 8; i++) {
    ctx.rotate(TAU / 8);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(28, 0);
    ctx.stroke();
    ctx.fillStyle = i % 2 ? '#7a3040' : '#f0d9b0';
    ctx.fillRect(22, -5, 10, 8);
  }
  ctx.restore();
}

function drawSlide(ctx, x, y, sc) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  ctx.fillStyle = '#c45c6a';
  ctx.beginPath();
  ctx.moveTo(0, -64);
  ctx.lineTo(18, 10);
  ctx.lineTo(-18, 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e8c878';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = '#f0d9b0';
  ctx.beginPath();
  ctx.moveTo(6, -50);
  ctx.quadraticCurveTo(28, -10, 8, 8);
  ctx.stroke();
  ctx.restore();
}

function drawPlatform(ctx, w, h, layout, s) {
  const { height, cx } = layout;
  const y = h * (0.82 + height * 0.12);
  const rx = w * (0.40 - height * 0.26);
  const ry = Math.max(6, 32 - height * 22);
  ctx.save();
  ctx.fillStyle = '#12201866';
  ctx.beginPath();
  ctx.ellipse(cx + 6, y + 10, rx, ry, 0, 0, TAU);
  ctx.fill();
  const g = ctx.createLinearGradient(cx, y - ry, cx, y + ry);
  g.addColorStop(0, '#c9ae7b');
  g.addColorStop(0.45, '#8a6a40');
  g.addColorStop(1, '#5a4630');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, y, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#e8c878';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, y, rx * 0.72, ry * 0.62, 0, 0, TAU);
  ctx.strokeStyle = '#7a304088';
  ctx.stroke();
  if (height < 0.22) {
    drawHugoTiny(ctx, cx + rx * 0.55, y - 18, 0.7 * (1 - height * 3));
  }
  ctx.restore();
}

function drawHugoTiny(ctx, x, y, sc) {
  if (sc <= 0.05) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  ctx.fillStyle = '#3d5c52';
  ctx.fillRect(-8, -6, 16, 18);
  ctx.fillStyle = '#edd2b0';
  ctx.beginPath();
  ctx.arc(0, -14, 8, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#6b2c38';
  ctx.fillRect(-9, -24, 18, 7);
  ctx.fillStyle = '#d4b36a';
  ctx.beginPath();
  ctx.arc(12, -4, 4, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawCanopy(ctx, layout, spin) {
  const { cx, cy, R, swing } = layout;
  const rx = lerp(R * 0.95, R * 1.15, 1 - swing * 0.15) + 70;
  const ry = 36 + swing * 8;
  const topY = cy - 70;
  ctx.save();
  ctx.translate(cx, topY);
  const wedges = 14;
  for (let i = 0; i < wedges; i++) {
    const a0 = -Math.PI + (i * TAU) / wedges + spin * 0.04;
    const a1 = a0 + TAU / wedges;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    for (let t = 0; t <= 6; t++) {
      const a = a0 + ((a1 - a0) * t) / 6;
      ctx.lineTo(Math.cos(a) * rx, Math.sin(a) * ry + 8);
    }
    ctx.closePath();
    ctx.fillStyle = i % 2 ? '#6b2c3a' : '#f0d9b0';
    ctx.fill();
    ctx.strokeStyle = '#d4b36a';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  for (let i = 0; i < wedges; i++) {
    const a = -Math.PI + ((i + 0.5) * TAU) / wedges + spin * 0.04;
    const hx = Math.cos(a) * (rx - 18);
    const hy = Math.sin(a) * (ry - 6) + 8;
    drawHeart(ctx, hx, hy, 7, i % 2 ? '#f0d9b0' : '#7a3040');
  }
  ctx.fillStyle = '#3d5c52';
  ctx.beginPath();
  ctx.ellipse(0, 10, 42, 16, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#e8c878';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#d4b36a';
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(8, 4);
  ctx.lineTo(-8, 4);
  ctx.closePath();
  ctx.fill();
  drawHeart(ctx, 0, -26, 10, '#7a3040');
  ctx.restore();
}

function drawHeart(ctx, x, y, r, fill) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, r * 0.7);
  ctx.bezierCurveTo(-r * 1.3, -r * 0.1, -r * 0.5, -r * 1.15, 0, -r * 0.35);
  ctx.bezierCurveTo(r * 0.5, -r * 1.15, r * 1.3, -r * 0.1, 0, r * 0.7);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = '#e8c878';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawColumn(ctx, layout) {
  const { cx, cy, height } = layout;
  const top = cy - 40;
  const bot = cy + lerp(210, 160, height);
  ctx.save();
  const g = ctx.createLinearGradient(cx - 40, top, cx + 40, bot);
  g.addColorStop(0, '#5a7a70');
  g.addColorStop(0.5, '#3d5c52');
  g.addColorStop(1, '#2a4038');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx - 28, top);
  ctx.lineTo(cx + 28, top);
  ctx.lineTo(cx + 46, bot);
  ctx.lineTo(cx - 46, bot);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#d4b36a';
  ctx.lineWidth = 2;
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const y = lerp(top + 24, bot - 28, i / 3);
    ctx.strokeStyle = '#e8c878aa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 24 - i * 4, y);
    ctx.lineTo(cx + 24 + i * 4, y);
    ctx.stroke();
    drawHeart(ctx, cx, y - 10, 8, '#7a3040');
  }
  ctx.fillStyle = '#2a2218';
  ctx.beginPath();
  ctx.moveTo(cx - 10, bot - 52);
  ctx.lineTo(cx + 10, bot - 52);
  ctx.lineTo(cx + 12, bot - 12);
  ctx.lineTo(cx - 12, bot - 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawChain(ctx, x1, y1, x2, y2, depth) {
  const n = 9;
  ctx.save();
  ctx.strokeStyle = `rgba(212,179,106,${0.35 + depth * 0.55})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = lerp(x1, x2, t);
    const y = lerp(y1, y2, t);
    ctx.fillStyle = i % 2 ? '#e8c878' : '#b8924a';
    ctx.beginPath();
    ctx.ellipse(x, y, 3.2, 4.4, Math.atan2(y2 - y1, x2 - x1), 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawChairSeat(ctx, sc, isGuest) {
  ctx.save();
  ctx.scale(sc, sc);
  ctx.fillStyle = '#12201840';
  ctx.beginPath();
  ctx.ellipse(4, 28, 26, 8, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = isGuest ? '#8b3a48' : '#6b2c3a';
  ctx.beginPath();
  ctx.moveTo(-22, 6);
  ctx.lineTo(22, 6);
  ctx.lineTo(18, 20);
  ctx.lineTo(-18, 20);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#d4b36a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = isGuest ? '#f0d9b0' : '#c9ae7b';
  ctx.beginPath();
  ctx.moveTo(-20, 6);
  ctx.lineTo(-16, -22);
  ctx.lineTo(16, -22);
  ctx.lineTo(20, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  drawHeart(ctx, 0, -8, 8, '#7a3040');
  ctx.strokeStyle = '#e8c878';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-16, -20);
  ctx.lineTo(-22, 18);
  ctx.moveTo(16, -20);
  ctx.lineTo(22, 18);
  ctx.stroke();
  ctx.restore();
}

function drawRider(ctx, who, sc, tilt, t) {
  if (!who) return;
  const face = FACES[who.name] || FACES.You;
  const wave = who.wave || 0;
  const look = typeof who.look === 'number' ? who.look : who.look === 'lean' ? 0.4 : who.look === 'up' ? 0 : 0;
  const lookX = typeof who.look === 'number' ? who.look * 5 : who.look === 'lean' ? 4 : 0;
  const chin = who.look === 'up' ? -4 : 0;
  ctx.save();
  ctx.rotate(tilt * 0.35);
  ctx.scale(sc * (face.size || 1), sc * (face.size || 1));
  ctx.fillStyle = '#3a2a20';
  ctx.fillRect(-6, 10, 5, 22);
  ctx.fillRect(2, 10, 5, 22);
  ctx.fillStyle = '#4a3428';
  ctx.beginPath();
  ctx.ellipse(-3, 32, 5, 3, 0, 0, TAU);
  ctx.ellipse(5, 32, 5, 3, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = face.coat;
  ctx.beginPath();
  ctx.moveTo(-14, 8);
  ctx.lineTo(14, 8);
  ctx.lineTo(11, -16);
  ctx.lineTo(-11, -16);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = face.accent;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  const armWave = wave > 0 ? -0.9 - Math.sin((t || 0) * 11) * 0.5 : 0.35;
  ctx.save();
  ctx.translate(12, -12);
  ctx.rotate(who.isGuest && wave > 0 ? armWave : wave > 0 ? armWave : 0.4);
  ctx.fillStyle = face.coat;
  ctx.fillRect(0, -3, 18, 6);
  ctx.fillStyle = face.skin;
  ctx.beginPath();
  ctx.arc(20, 0, 4, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(-12, -12);
  ctx.rotate(0.55);
  ctx.fillStyle = face.coat;
  ctx.fillRect(-16, -3, 16, 6);
  ctx.fillStyle = face.skin;
  ctx.beginPath();
  ctx.arc(-16, 0, 4, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = face.skin;
  ctx.beginPath();
  ctx.arc(lookX, -28 + chin, 12, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#f3dfb288';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = face.hair;
  ctx.beginPath();
  ctx.ellipse(lookX, -34 + chin, 12, 8, 0, Math.PI, TAU);
  ctx.fill();
  ctx.fillStyle = '#2a2218';
  ctx.beginPath();
  ctx.arc(lookX - 4, -28 + chin, 1.6, 0, TAU);
  ctx.arc(lookX + 5, -28 + chin, 1.6, 0, TAU);
  ctx.fill();
  if (face.hat) {
    ctx.fillStyle = face.hat;
    ctx.fillRect(lookX - 13, -42 + chin, 26, 6);
    ctx.beginPath();
    ctx.ellipse(lookX, -44 + chin, 9, 6, 0, 0, TAU);
    ctx.fill();
  }
  if (who.isGuest) {
    ctx.fillStyle = '#7a3040';
    ctx.fillRect(-6, -6, 12, 5);
    ctx.fillStyle = '#f3dfb2';
    ctx.font = '600 9px Georgia,serif';
    ctx.textAlign = 'center';
    ctx.fillText('YOU', 0, -2);
  }
  ctx.restore();
}

function drawBubble(ctx, x, y, name, text) {
  if (!text) return;
  const label = `${name}: ${text}`;
  ctx.save();
  ctx.font = '500 14px Georgia,serif';
  ctx.textAlign = 'center';
  const tw = Math.min(240, Math.max(80, (ctx.measureText(label).width || label.length * 7) + 18));
  const bx = x;
  const by = y - 78;
  ctx.fillStyle = '#f3e6c8ee';
  ctx.strokeStyle = '#c9ae7b';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(bx - tw / 2, by - 18, tw, 32, 10);
  else ctx.rect(bx - tw / 2, by - 18, tw, 32);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx - 6, by + 14);
  ctx.lineTo(bx, by + 24);
  ctx.lineTo(bx + 8, by + 14);
  ctx.fill();
  ctx.fillStyle = '#3a2a20';
  ctx.fillText(label, bx, by + 4);
  ctx.restore();
}

function drawNotes(ctx, w, h, s, motion) {
  if (motion.rpm < 0.2) return;
  const beats = s.beat === 'spinup' || s.beat === 'flight' || s.beat === 'wave' || s.beat === 'tilt';
  if (!beats) return;
  ctx.save();
  ctx.fillStyle = '#f3dfb2';
  ctx.font = '20px Georgia,serif';
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.45 + motion.rpm * 0.3;
  for (let i = 0; i < 5; i++) {
    const a = (s.t || 0) * 0.7 + i * 1.3;
    const x = w * 0.5 + Math.cos(a) * (80 + i * 34);
    const y = h * 0.28 + Math.sin(a * 1.4) * 22 + i * 8;
    ctx.fillText(i % 2 ? '♪' : '♫', x, y);
  }
  ctx.restore();
}

function draw(s, d) {
  const ctx = d?.ctx;
  if (!ctx) return;
  const w = d.w || 900;
  const h = d.h || 1200;
  s._w = w;
  s._h = h;
  const layout = chairLayout(s, w, h);
  const tilt = layout.swing * 0.13 + (s.lean || 0) * 0.09;

  ctx.save();
  ctx.translate(w * 0.5, h * 0.7);
  ctx.rotate(tilt);
  ctx.translate(-w * 0.5, -h * 0.7);
  drawSky(ctx, w, h, layout.height, s.spin || 0);
  drawWorld(ctx, w, h, s, layout.motion);
  drawPlatform(ctx, w, h, layout, s);
  ctx.restore();

  ctx.save();
  ctx.translate(w * 0.5, h * 0.48);
  ctx.rotate(tilt * 0.35);
  ctx.translate(-w * 0.5, -h * 0.48);
  drawCanopy(ctx, layout, s.spin || 0);
  drawColumn(ctx, layout);

  const ordered = layout.chairs.slice().sort((a, b) => a.depth - b.depth);
  for (const c of ordered) {
    drawChain(ctx, c.ax, c.ay, c.x, c.y - 18 * c.sc, c.depth);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.tilt);
    ctx.globalAlpha = 0.4 + c.depth * 0.6;
    drawChairSeat(ctx, c.sc, c.who?.isGuest);
    drawRider(ctx, c.who, c.sc, c.tilt, s.t);
    ctx.restore();
    if (c.who && !c.who.isGuest) {
      c.who._x = c.x;
      c.who._y = c.y;
      if (c.depth > 0.52) {
        ctx.save();
        ctx.globalAlpha = 0.35 + c.depth * 0.65;
        ctx.fillStyle = '#f3dfb2';
        ctx.font = `${12 + Math.round(c.sc * 6)}px Georgia,serif`;
        ctx.textAlign = 'center';
        ctx.fillText(c.who.name, c.x, c.y + 34 * c.sc);
        ctx.restore();
      }
      if (c.who.line && c.depth > 0.4) drawBubble(ctx, c.x, c.y - 10 * c.sc, c.who.name, c.who.line);
    }
  }
  ctx.restore();
  drawNotes(ctx, w, h, s, layout.motion);

  const vg = ctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.2, w * 0.5, h * 0.5, h * 0.78);
  vg.addColorStop(0, '#0000');
  vg.addColorStop(1, '#120c08aa');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  if (s.phase === 'done' || layout.height < 0.08 && s.progress > 0.9) {
    ctx.fillStyle = '#f3e6c8';
    ctx.font = '500 22px Georgia,serif';
    ctx.textAlign = 'center';
    ctx.fillText('Mind the step.', w * 0.5, h * 0.12);
  }
}

export default {
  title: 'Chair swings',
  intro: 'Hugo rings his brass bell and tips the heart on his cap. “One penny, one chair, the whole sky on a chain. They lift, they lean, they waltz — wave to your neighbours and I’ll ring you down when the music-box runs out. Hats stay on if they can.”',
  create,
  update,
  draw,
  readout,
  pointer,
};
