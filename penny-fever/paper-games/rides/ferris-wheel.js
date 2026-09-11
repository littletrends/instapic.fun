/** Ferris wheel — full-trip boarding experience. Not a skill stall. */
import { npc, advanceTrip, beat, easeInOut } from '../ride-kit.js';

const TAU = Math.PI * 2;
const DURATION = 60;
const GONDOLAS = 8;
const CX = 450;
const CY = 548;
const R = 308;
const GOLD = '#b78b48';
const GREEN = '#374333';
const CREAM = '#f3e6c8';
const INK = '#2a241c';

const BEATS = [
  {
    at: 0, id: 'board',
    note: 'Gondola three — squeeze in with the strangers.',
    looks: { Maude: 'idle', Wynn: 'look', Cora: 'idle' },
    lines: {
      Maude: 'In you get — hats in laps.',
      Wynn: 'Does it really go all the way over?',
      Cora: 'Slow as a sigh. That’s how I like it.',
    },
  },
  {
    at: 0.07, id: 'lift',
    note: 'The wheel takes you. No hopping off.',
    looks: { Maude: 'hold', Wynn: 'look', Cora: 'hold' },
    lines: {
      Maude: 'There we go. Don’t look down yet.',
      Wynn: 'The boards are getting small.',
      Cora: 'It only creaks for show.',
    },
  },
  {
    at: 0.20, id: 'climb',
    note: 'Climbing — the alley drops away.',
    looks: { Maude: 'hold', Wynn: 'point', Cora: 'look' },
    lines: {
      Maude: 'My hat would like a word.',
      Wynn: 'That’s Florence’s horses down there.',
      Cora: 'Paper alley looks like a toy box.',
    },
  },
  {
    at: 0.40, id: 'approach',
    note: 'Almost the top. The wheel pauses to look.',
    looks: { Maude: 'awe', Wynn: 'point', Cora: 'awe' },
    lines: {
      Maude: 'Crest coming. Nobody breathe.',
      Wynn: 'I think I see the whole midway.',
      Cora: 'There — the lantern string.',
    },
  },
  {
    at: 0.48, id: 'crest',
    note: 'Crest. The paper alley is a map of lanterns.',
    looks: { Maude: 'awe', Wynn: 'point', Cora: 'awe' },
    lines: {
      Maude: 'Would you look at that.',
      Wynn: 'The whole paper alley.',
      Cora: 'Don’t you dare rush this.',
    },
  },
  {
    at: 0.62, id: 'leave',
    note: 'Over the top. A gentle descent.',
    looks: { Maude: 'look', Wynn: 'wave', Cora: 'look' },
    lines: {
      Maude: 'And down we go, easy.',
      Wynn: 'I want to stay up.',
      Cora: 'The wind’s in the guy-wires.',
    },
  },
  {
    at: 0.78, id: 'descent',
    note: 'Coming down the other side.',
    looks: { Maude: 'hold', Wynn: 'look', Cora: 'idle' },
    lines: {
      Maude: 'Hats back on, dears.',
      Wynn: 'The ground’s coming to meet us.',
      Cora: 'I always like the last turn best.',
    },
  },
  {
    at: 0.92, id: 'dock',
    note: 'Bottom. Unload when she kisses the boards.',
    looks: { Maude: 'idle', Wynn: 'wave', Cora: 'idle' },
    lines: {
      Maude: 'Mind the step.',
      Wynn: 'Already? One more?',
      Cora: 'Jasper’ll have us off in a blink.',
    },
  },
];
const MARKS = BEATS.map(({ at, id }) => ({ at, id }));

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function mix(a, b, t) {
  const pa = hex(a), pb = hex(b);
  const m = n => Math.round(lerp(pa[n], pb[n], t));
  return `rgb(${m(0)},${m(1)},${m(2)})`;
}
function hex(c) {
  const n = c.replace('#', '');
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

/** Linger at board, crest, and unload. */
function tripTurn(p) {
  return p - 0.055 * Math.sin(p * Math.PI * 4);
}

function guestAngle(progress) {
  return Math.PI / 2 + tripTurn(progress) * TAU;
}

function elevation(progress) {
  return 0.5 - 0.5 * Math.sin(guestAngle(progress));
}

function applyBeat(s, id) {
  const b = BEATS.find(x => x.id === id);
  if (!b) return;
  s.note = b.note;
  for (const n of s.npcs) {
    n.look = b.looks[n.name] || 'idle';
    n.line = b.lines[n.name] || n.line;
  }
}

function speaker(s) {
  const i = Math.floor((s.t || 0) / 3.6) % Math.max(1, s.npcs.length);
  return s.npcs[i];
}

export default {
  title: 'Ferris wheel',
  intro: 'Jasper’s Ferris wheel — a penny a turn, three strangers to a gondola. “All aboard the paper moon,” he calls. “Hats in laps, hands on the rail, and nobody hops till the boards kiss us back.” Slow climb, a look over the alley, a gentle come-down.',

  create() {
    const npcs = [
      npc('Maude', 'left', 'idle', 'In you get — hats in laps.'),
      npc('Wynn', 'right', 'look', 'Does it really go all the way over?'),
      npc('Cora', 'far', 'idle', 'Slow as a sigh. That’s how I like it.'),
    ];
    return {
      phase: 'riding',
      t: 0,
      progress: 0,
      npcs,
      note: 'Gondola three — squeeze in with the strangers.',
      exitNote: 'All off — mind the step. Jasper tips his hat for the next load.',
      beat: 'board',
      lean: 0,
      look: 0,
      wave: 0,
      swing: 0,
      fare: '1¢',
    };
  },

  update(s, dt) {
    if (s.phase === 'done') return;
    const finished = advanceTrip(s, dt, DURATION);
    s.lean *= Math.pow(0.22, dt);
    s.look *= Math.pow(0.28, dt);
    s.wave = Math.max(0, (s.wave || 0) - dt * 1.55);
    const ang = guestAngle(s.progress);
    const prev = s.angle ?? ang;
    s.omega = (ang - prev) / Math.max(dt, 1 / 120);
    s.angle = ang;
    s.swing += (-s.omega * 0.22 - s.swing * 3.4) * dt;
    s.swing = clamp(s.swing, -0.22, 0.22);
    for (const n of s.npcs) n.wave = Math.max(0, (n.wave || 0) - dt * 1.15);
    const id = beat(s.progress, MARKS);
    if (id !== s.beat) {
      s.beat = id;
      if (s.phase === 'riding') applyBeat(s, id);
    }
    if (s.beat === 'crest') {
      s.npcs.forEach(n => { if (n.look === 'point' || n.look === 'awe') n.wave = Math.max(n.wave, 0.35); });
    }
    if (finished) {
      s.lean = 0;
      s.wave = 0;
      s.swing = 0;
      for (const n of s.npcs) { n.wave = 0; n.look = 'idle'; }
    }
  },

  pointer(s, type, pos) {
    if (!s || s.phase !== 'riding' || !pos) return;
    if (type === 'up' || type === 'cancel') return;
    s.lean = clamp((pos.x - 450) / 260, -1, 1);
    s.look = clamp((pos.y - 560) / 340, -1, 1);
    if (type === 'down') {
      s.wave = 1;
      for (const n of s.npcs) n.wave = 0.85;
      const who = speaker(s);
      if (who) s.note = who.name + ' waves back. The wheel does not hurry.';
    }
  },

  readout(s) {
    if (!s) return '';
    if (s.phase === 'done') return s.note || 'All off — mind the step.';
    const who = speaker(s);
    const line = who?.line ? who.name + ': ' + who.line : '';
    const pct = Math.round((s.progress || 0) * 100);
    return (s.note || 'Riding') + (line ? ' · ' + line : '') + ' · ' + pct + '%';
  },

  draw(s, d) {
    const ctx = d.ctx;
    const w = d.w || 900;
    const h = d.h || 1200;
    ctx.save();
    ctx.scale(w / 900, h / 1200);
    paint(s, ctx);
    ctx.restore();
  },
};

function paint(s, ctx) {
  const p = s.progress || 0;
  const elev = elevation(p);
  const t = s.t || 0;
  const ang0 = guestAngle(p);
  const camY = (Math.sin(ang0) - 1) * 18 * easeInOut(elev);
  ctx.save();
  ctx.translate(0, camY);

  sky(ctx, elev, t);
  alley(ctx, elev, t);
  ground(ctx, elev);
  legs(ctx);
  wheel(ctx, elev, t);
  const cars = [];
  for (let i = 0; i < GONDOLAS; i++) {
    const a = ang0 + i * TAU / GONDOLAS;
    const x = CX + Math.cos(a) * R;
    const y = CY + Math.sin(a) * R * 0.98;
    const depth = 0.72 + 0.28 * (0.5 + 0.5 * Math.cos(a - 0.35));
    cars.push({ i, a, x, y, depth, guest: i === 0 });
  }
  cars.sort((a, b) => a.depth - b.depth);
  for (const c of cars) gondola(ctx, s, c, elev, t);

  platform(ctx, p, elev);
  fareStub(ctx);
  caption(ctx, s, cars.find(c => c.guest));
  ctx.restore();
}

function sky(ctx, elev, t) {
  const g = ctx.createLinearGradient(0, 0, 0, 1200);
  g.addColorStop(0, mix('#1a2838', '#141e2c', elev));
  g.addColorStop(0.45, mix('#3d4a58', '#243044', elev));
  g.addColorStop(1, mix('#6a5b4a', '#3a403c', elev * 0.6));
  ctx.fillStyle = g;
  ctx.fillRect(-20, -40, 940, 1280);

  ctx.globalAlpha = 0.25 + elev * 0.55;
  const moonX = 720, moonY = 168;
  cutout(ctx, c => {
    c.arc(moonX, moonY, 46, 0, TAU);
  }, CREAM, '#f7edd4', 1.2);
  ctx.globalAlpha = 1;
  ctx.fillStyle = mix('#3d4a58', '#243044', elev);
  ctx.beginPath();
  ctx.arc(moonX + 16, moonY - 8, 38, 0, TAU);
  ctx.fill();

  ctx.globalAlpha = 0.35 + elev * 0.5;
  for (let i = 0; i < 22; i++) {
    const sx = 40 + ((i * 137) % 820);
    const sy = 30 + ((i * 89) % 420);
    const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.7 + i));
    ctx.globalAlpha = (0.2 + elev * 0.55) * tw;
    star(ctx, sx, sy, 3.2 + (i % 3));
  }
  ctx.globalAlpha = 1;

  cloud(ctx, 160 + Math.sin(t * 0.07) * 18, 210, 70, 0.55 - elev * 0.15);
  cloud(ctx, 780 + Math.cos(t * 0.05) * 14, 150, 54, 0.4 - elev * 0.1);
  cloud(ctx, 520, 120 + Math.sin(t * 0.08) * 8, 42, 0.3);
}

function star(ctx, x, y, r) {
  ctx.fillStyle = CREAM;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 - Math.PI / 2;
    const rr = i % 2 ? r * 0.38 : r;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function cloud(ctx, x, y, s, a) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, a);
  cutout(ctx, c => {
    c.arc(x - s * 0.45, y, s * 0.38, 0, TAU);
    c.arc(x, y - s * 0.12, s * 0.48, 0, TAU);
    c.arc(x + s * 0.42, y + 4, s * 0.34, 0, TAU);
  }, '#efe4cf', '#d9c7a4', 1);
  ctx.restore();
}

function alley(ctx, elev, t) {
  const a = 0.18 + easeInOut(elev) * 0.72;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(0, lerp(40, -10, elev));
  const base = 902;
  const tents = [
    { x: 70, h: 90, w: 70, c: '#5a3f36' },
    { x: 160, h: 120, w: 64, c: '#6b4a38' },
    { x: 760, h: 100, w: 72, c: '#5c4034' },
    { x: 840, h: 80, w: 58, c: '#4e3a32' },
  ];
  for (const tent of tents) {
    cutout(ctx, c => {
      c.moveTo(tent.x, base);
      c.lineTo(tent.x + tent.w * 0.5, base - tent.h);
      c.lineTo(tent.x + tent.w, base);
      c.closePath();
    }, tent.c, GOLD, 1);
    lantern(ctx, tent.x + tent.w * 0.5, base - tent.h + 18, t);
  }
  // carousel ring
  cutout(ctx, c => { c.arc(300, base - 28, 36, 0, TAU); }, '#4a4036', GOLD, 1.4);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(300, base - 54, 22, 0, TAU);
  ctx.stroke();
  // helter-skelter cone
  cutout(ctx, c => {
    c.moveTo(430, base);
    c.lineTo(456, base - 150);
    c.lineTo(482, base);
    c.closePath();
  }, '#6a3d3a', GOLD, 1.2);
  // organ
  for (let i = 0; i < 5; i++) {
    const h = 40 + (i % 3) * 18;
    cutout(ctx, c => {
      c.rect(540 + i * 12, base - h, 10, h);
    }, '#4a5344', GOLD, 0.8);
  }
  // balloon tree
  cutout(ctx, c => { c.arc(660, base - 78, 22, 0, TAU); }, '#7a4a55', '#e8c4b0', 1);
  cutout(ctx, c => { c.arc(678, base - 58, 16, 0, TAU); }, '#4a6a62', '#cde0d4', 1);
  ctx.strokeStyle = '#2a241c88';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(666, base);
  ctx.lineTo(666, base - 58);
  ctx.stroke();
  ctx.restore();
}

function lantern(ctx, x, y, t) {
  ctx.save();
  ctx.globalAlpha = 0.55 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2.2 + x));
  ctx.fillStyle = '#f4d590';
  ctx.beginPath();
  ctx.ellipse(x, y, 5, 7, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function ground(ctx, elev) {
  cutout(ctx, c => {
    c.moveTo(-30, 1040);
    c.quadraticCurveTo(220, 990, 450, 1002);
    c.quadraticCurveTo(720, 1014, 940, 988);
    c.lineTo(940, 1260);
    c.lineTo(-30, 1260);
    c.closePath();
  }, mix('#4a5344', '#2f382f', elev * 0.3), '#8a7a58', 2);
  ctx.fillStyle = '#2a241c22';
  ctx.fillRect(-30, 1088, 960, 200);
}

function legs(ctx) {
  cutout(ctx, c => {
    c.moveTo(CX - 28, CY + 20);
    c.lineTo(268, 1048);
    c.lineTo(318, 1054);
    c.lineTo(CX - 8, CY + 40);
    c.closePath();
  }, GREEN, GOLD, 2);
  cutout(ctx, c => {
    c.moveTo(CX + 28, CY + 20);
    c.lineTo(632, 1048);
    c.lineTo(582, 1054);
    c.lineTo(CX + 8, CY + 40);
    c.closePath();
  }, GREEN, GOLD, 2);
  cutout(ctx, c => {
    c.rect(300, 1018, 300, 16);
  }, '#4a4034', GOLD, 1.5);
}

function wheel(ctx, elev, t) {
  ctx.save();
  ctx.translate(CX, CY);
  // paper disc
  cutout(ctx, c => { c.arc(0, 0, R + 18, 0, TAU); }, '#2c352c', '#1a201a', 2);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(0, 0, R + 4, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, R - 16, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = '#c9ae7b88';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.55, 0, TAU);
  ctx.stroke();

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  for (let i = 0; i < GONDOLAS; i++) {
    const a = i * TAU / GONDOLAS;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 28, Math.sin(a) * 28);
    ctx.lineTo(Math.cos(a) * (R - 8), Math.sin(a) * (R - 8));
    ctx.stroke();
  }

  const glow = 0.25 + elev * 0.7;
  for (let i = 0; i < GONDOLAS * 2; i++) {
    const a = i * TAU / (GONDOLAS * 2) + t * 0.02;
    const x = Math.cos(a) * (R + 4);
    const y = Math.sin(a) * (R + 4);
    ctx.globalAlpha = glow * (0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 3 + i)));
    ctx.fillStyle = '#f4e0a8';
    ctx.beginPath();
    ctx.arc(x, y, 4.2, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  cutout(ctx, c => { c.arc(0, 0, 42, 0, TAU); }, GREEN, GOLD, 3);
  cutout(ctx, c => { c.arc(0, 0, 22, 0, TAU); }, '#c4a46a', CREAM, 1.5);
  starAt(ctx, 0, 0, 11);
  ctx.restore();
}

function starAt(ctx, x, y, r) {
  ctx.fillStyle = CREAM;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI / 5 - Math.PI / 2;
    const rr = i % 2 ? r * 0.42 : r;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function gondola(ctx, s, car, elev, t) {
  const sc = 0.78 + car.depth * 0.32;
  const sway = (car.guest ? (s.swing || 0) : Math.sin(t * 1.15 + car.i) * 0.04) + (car.guest ? (s.lean || 0) * 0.1 : 0);
  const pal = ['#f0dcc0', '#e8c8b4', '#d7e0c8', '#ead7a8'][car.i % 4];
  ctx.save();
  ctx.translate(car.x, car.y + 36);
  ctx.rotate(sway);
  ctx.scale(sc, sc);

  // hanger
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -52);
  ctx.lineTo(0, -18);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(0, -52, 5, 0, TAU);
  ctx.fill();

  // canopy
  cutout(ctx, c => {
    c.moveTo(-58, -16);
    c.quadraticCurveTo(0, -44, 58, -16);
    c.lineTo(50, -6);
    c.quadraticCurveTo(0, -28, -50, -6);
    c.closePath();
  }, car.guest ? '#6a3d3a' : pal, GOLD, 1.6);

  // basket
  cutout(ctx, c => {
    c.moveTo(-54, -8);
    c.lineTo(54, -8);
    c.lineTo(44, 38);
    c.quadraticCurveTo(0, 48, -44, 38);
    c.closePath();
  }, car.guest ? '#efe2c8' : pal, GOLD, 1.8);

  // rail
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-46, 8);
  ctx.lineTo(46, 8);
  ctx.stroke();

  if (car.guest) party(ctx, s);
  else extras(ctx, car.i);

  ctx.restore();
}

function party(ctx, s) {
  const look = (s.look || 0) * 4;
  const lean = (s.lean || 0) * 6;
  const people = [
    { npc: s.npcs[0], x: -34 + lean * 0.3, y: 6, coat: '#6b4a38', hair: '#3a2a22', hat: '#8a5a3a' },
    { npc: null, x: -8 + lean, y: 8, coat: '#3d5348', hair: '#2c241c', hat: GOLD, guest: true },
    { npc: s.npcs[1], x: 16 + lean * 0.2, y: 6, coat: '#4a5360', hair: '#5a3a28', hat: null },
    { npc: s.npcs[2], x: 38 + lean * 0.15, y: 7, coat: '#7a4a55', hair: '#2a2018', hat: CREAM },
  ];
  for (const p of people) {
    const n = p.npc;
    doll(ctx, p.x, p.y + look * 0.15, {
      coat: p.coat,
      hair: p.hair,
      hat: p.hat,
      guest: !!p.guest,
      look: n ? n.look : (s.look < -0.2 ? 'awe' : 'look'),
      wave: p.guest ? (s.wave || 0) : (n?.wave || 0),
      lean: p.guest ? (s.lean || 0) : 0,
    });
  }
  ctx.font = '500 9px Georgia,serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.fillText('Maude', -34, 44);
  ctx.fillText('you', -8, 44);
  ctx.fillText('Wynn', 16, 44);
  ctx.fillText('Cora', 38, 44);
}

function extras(ctx, i) {
  const n = 1 + (i % 3 === 0 ? 1 : 0);
  for (let k = 0; k < n; k++) {
    doll(ctx, (k - (n - 1) / 2) * 22, 8, {
      coat: k ? '#5a4638' : '#44504a',
      hair: '#2a241c',
      hat: i % 2 ? '#8a6a44' : null,
      look: 'idle',
      wave: 0,
      lean: 0,
      scale: 0.82,
    });
  }
}

function doll(ctx, x, y, spec) {
  const sc = spec.scale || 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  ctx.rotate((spec.lean || 0) * 0.14);
  const awe = spec.look === 'awe' || spec.look === 'look' || spec.look === 'point' ? -4 : 0;
  const arm = (spec.wave || 0) > 0.05
    ? -0.9 - spec.wave * 0.8
    : spec.look === 'point' ? -0.7
      : spec.look === 'hold' ? 0.35
        : 0.15;

  // body
  cutout(ctx, c => {
    c.moveTo(-9, 2);
    c.lineTo(9, 2);
    c.lineTo(11, 26);
    c.lineTo(-11, 26);
    c.closePath();
  }, spec.coat, '#f2e2c0', 1);

  // arm
  ctx.save();
  ctx.translate(spec.look === 'point' ? 8 : -8, 8);
  ctx.rotate(arm);
  ctx.strokeStyle = spec.coat;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, spec.wave ? -16 : 12);
  ctx.stroke();
  ctx.fillStyle = '#e8d3b4';
  ctx.beginPath();
  ctx.arc(0, spec.wave ? -16 : 12, 3.2, 0, TAU);
  ctx.fill();
  ctx.restore();

  // head
  cutout(ctx, c => { c.arc(0, awe - 8, 8.5, 0, TAU); }, '#ead5b6', '#f7edd4', 1);
  ctx.fillStyle = spec.hair;
  ctx.beginPath();
  ctx.ellipse(0, awe - 12, 8, 4.5, 0, Math.PI, TAU);
  ctx.fill();
  if (spec.hat) {
    ctx.fillStyle = spec.hat;
    ctx.beginPath();
    ctx.ellipse(0, awe - 14, 11, 3, 0, 0, TAU);
    ctx.fill();
    ctx.fillRect(-6, awe - 22, 12, 9);
  }
  if (spec.guest) {
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(6, 12, 3.2, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function platform(ctx, p, elev) {
  cutout(ctx, c => {
    c.moveTo(250, 1008);
    c.lineTo(650, 1008);
    c.lineTo(670, 1088);
    c.lineTo(230, 1088);
    c.closePath();
  }, '#cbb58a', GOLD, 2);
  cutout(ctx, c => {
    c.rect(270, 1022, 360, 10);
  }, '#e8d7b0', '#a48b63', 1);
  // step
  cutout(ctx, c => {
    c.rect(390, 1040, 120, 18);
  }, '#d7c49a', GOLD, 1.2);
  // posts
  cutout(ctx, c => { c.rect(268, 960, 12, 58); }, GREEN, GOLD, 1);
  cutout(ctx, c => { c.rect(620, 960, 12, 58); }, GREEN, GOLD, 1);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(274, 968);
  ctx.lineTo(626, 968);
  ctx.stroke();

  ctx.font = '500 13px Georgia,serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.globalAlpha = 0.55 + (1 - elev) * 0.4;
  ctx.fillText(p < 0.08 || p > 0.9 ? 'BOARD · ONE PENNY' : 'FULL TRIP · NO HOP-OFF', 450, 1074);
  ctx.globalAlpha = 1;
}

function fareStub(ctx) {
  ctx.save();
  ctx.translate(48, 48);
  ctx.rotate(-0.08);
  cutout(ctx, c => {
    c.moveTo(0, 8);
    c.arc(0, 20, 8, Math.PI * 0.5, Math.PI * 1.5);
    c.lineTo(0, 4);
    c.lineTo(86, 4);
    c.lineTo(86, 52);
    c.lineTo(0, 52);
    c.closePath();
  }, '#f4e7c8', GOLD, 1.4);
  ctx.fillStyle = '#6a3d3a';
  ctx.font = '600 11px Georgia,serif';
  ctx.textAlign = 'left';
  ctx.fillText('FERRIS', 14, 22);
  ctx.fillStyle = INK;
  ctx.font = '500 10px Georgia,serif';
  ctx.fillText('1¢  ·  Jasper', 14, 40);
  ctx.restore();
}

function caption(ctx, s, guestCar) {
  const who = speaker(s);
  const text = s.phase === 'done'
    ? (s.note || 'All off — mind the step.')
    : (who ? who.name + '  ·  ' + who.line : s.note || '');
  if (!text) return;
  const x = guestCar ? clamp(guestCar.x, 160, 740) : 450;
  const y = guestCar ? clamp(guestCar.y - 78, 70, 820) : 90;
  ctx.font = '500 15px Georgia,serif';
  ctx.textAlign = 'center';
  const w = Math.min(420, Math.max(180, text.length * 7.2));
  cutout(ctx, c => {
    c.moveTo(x - w / 2, y - 16);
    c.lineTo(x + w / 2, y - 16);
    c.lineTo(x + w / 2, y + 18);
    c.lineTo(x + 10, y + 18);
    c.lineTo(x, y + 30);
    c.lineTo(x - 10, y + 18);
    c.lineTo(x - w / 2, y + 18);
    c.closePath();
  }, '#f7edd8', GOLD, 1.4);
  ctx.fillStyle = INK;
  ctx.fillText(text, x, y + 6);
}

function cutout(ctx, build, fill, stroke, width = 1.5) {
  ctx.save();
  ctx.translate(2.1, 3.1);
  ctx.beginPath();
  build(ctx);
  ctx.fillStyle = 'rgba(16,14,12,0.28)';
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  build(ctx);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}
