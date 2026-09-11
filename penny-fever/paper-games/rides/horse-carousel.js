/** Horse carousel — full-trip ride. Florence barks the intro; the horses keep you. */
import {npc, advanceTrip, beat, easeInOut} from '../ride-kit.js';

const TAU = Math.PI * 2;
const DURATION = 56;
const W = 900;
const H = 1200;

const BEATS = [
  {at: 0, id: 'board'},
  {at: 0.07, id: 'lift'},
  {at: 0.16, id: 'waltz'},
  {at: 0.34, id: 'neighbours'},
  {at: 0.50, id: 'lanterns'},
  {at: 0.66, id: 'night'},
  {at: 0.82, id: 'slow'},
  {at: 0.92, id: 'gate'},
];

const NOTES = {
  board: 'The cream horse takes your weight. Calliope holds a first note.',
  lift: 'Poles rise. The painted meadow starts to turn.',
  waltz: 'The waltz finds you. Lanterns catch every gold leaf.',
  neighbours: 'Maisie laughs as her horse out-climbs yours.',
  lanterns: 'A ring of lanterns. You could almost pluck one.',
  night: 'Full revolutions under the canopy. The world is a gold ring.',
  slow: 'Calliope winds down. The painted gate comes around.',
  gate: 'One last rise — mind the step at the painted gate.',
};

const NPC_BEAT = {
  board: {
    Maisie: {look: 'hold-on', line: 'Hold the mane!'},
    Ned: {look: 'idle', line: 'Always liked this one.'},
    Pippa: {look: 'look-up', line: 'Listen — the pipes.'},
  },
  lift: {
    Maisie: {look: 'laugh', line: 'We’re going up!'},
    Ned: {look: 'hold-on', line: 'Easy now.'},
    Pippa: {look: 'look-up', line: 'The lanterns woke.'},
  },
  waltz: {
    Maisie: {look: 'wave', line: 'Faster than the organ!'},
    Ned: {look: 'idle', line: 'Three turns. That’s the bargain.'},
    Pippa: {look: 'laugh', line: 'Gold all the way round.'},
  },
  neighbours: {
    Maisie: {look: 'laugh', line: 'Mine’s higher!'},
    Ned: {look: 'tip-hat', line: 'Evening, neighbour.'},
    Pippa: {look: 'wave', line: 'Wave, or she’ll win.'},
  },
  lanterns: {
    Maisie: {look: 'look-up', line: 'I could steal that light.'},
    Ned: {look: 'idle', line: 'Florence polishes them nightly.'},
    Pippa: {look: 'look-up', line: 'Hearts in the valance.'},
  },
  night: {
    Maisie: {look: 'wave', line: 'Another ring!'},
    Ned: {look: 'look-up', line: 'Don’t look down.'},
    Pippa: {look: 'laugh', line: 'The stars are paper too.'},
  },
  slow: {
    Maisie: {look: 'hold-on', line: 'Oh — we’re settling.'},
    Ned: {look: 'tip-hat', line: 'Gate’s coming round.'},
    Pippa: {look: 'idle', line: 'I could ride till morning.'},
  },
  gate: {
    Maisie: {look: 'wave', line: 'Same time tomorrow?'},
    Ned: {look: 'tip-hat', line: 'Mind the step.'},
    Pippa: {look: 'wave', line: 'The cream horse will miss you.'},
  },
};

const HORSES = [
  {id: 'guest', guest: true, coat: '#f4ead4', mane: '#d4b878', saddle: '#8b3a42', blanket: '#374333', hoof: '#5c4030'},
  {id: 'maisie', rider: 'Maisie', coat: '#efe0c8', mane: '#8a5a32', saddle: '#4a5c3a', blanket: '#b78b48', hoof: '#4a3828'},
  {id: 'spare-a', coat: '#e4d3b4', mane: '#6b2436', saddle: '#374333', blanket: '#c9ae7b', hoof: '#5c4030'},
  {id: 'ned', rider: 'Ned', coat: '#d8c4a0', mane: '#3d2a1c', saddle: '#6b2436', blanket: '#e8c484', hoof: '#3a2a1c'},
  {id: 'spare-b', coat: '#f0e4cc', mane: '#b78b48', saddle: '#4a5c3a', blanket: '#6b2436', hoof: '#5c4030'},
  {id: 'pippa', rider: 'Pippa', coat: '#f6ecd8', mane: '#d4a574', saddle: '#8b3a42', blanket: '#374333', hoof: '#4a3828'},
];

const STARS = Array.from({length: 52}, (_, i) => ({
  x: (i * 137.508) % W,
  y: 18 + (i * 89.3) % 430,
  r: 0.7 + (i % 5) * 0.38,
  tw: i * 0.73,
}));

const RIDER_LOOK = {
  Maisie: {coat: '#7a3340', hat: 'straw', hair: '#6b3a24'},
  Ned: {coat: '#2f3d38', hat: 'bowler', hair: '#2a221c'},
  Pippa: {coat: '#4a5c3a', hat: 'ribbons', hair: '#8a4a38'},
  You: {coat: '#c9ae7b', hat: 'ticket', hair: '#5c4030'},
};

function tripSpin(p) {
  const a = 0.12, b = 0.84;
  const inP = 0.12, outP = 0.16, midP = 1 - inP - outP;
  let u;
  if (p <= a) u = easeInOut(p / a) * inP;
  else if (p >= b) u = inP + midP + easeInOut((p - b) / (1 - b)) * outP;
  else u = inP + ((p - a) / (b - a)) * midP;
  return u * 3 * TAU;
}

function bobAmp(p) {
  if (p < 0.08) return 6 + 22 * easeInOut(p / 0.08);
  if (p > 0.9) return 28 * (1 - easeInOut((p - 0.9) / 0.1));
  return 28;
}

function applyBeat(s, id) {
  s.beat = id;
  s.note = NOTES[id] || s.note;
  const rows = NPC_BEAT[id] || {};
  for (const n of s.npcs) {
    const row = rows[n.name];
    if (!row) continue;
    n.look = row.look;
    n.line = row.line;
    if (row.look === 'wave' || row.look === 'laugh' || row.look === 'tip-hat') n.wave = 1;
  }
}

function layout(s) {
  const n = HORSES.length;
  const amp = bobAmp(s.progress);
  const cx = 450 + s.lean * 16;
  return HORSES.map((h, i) => {
    const a = s.spin + i * TAU / n + Math.PI / 2;
    const depth = Math.sin(a);
    const bob = Math.sin(s.t * 1.68 + i * Math.PI) * amp;
    return {
      ...h, i, a, depth,
      x: cx + Math.cos(a) * 248,
      y: 758 + depth * 82 + bob,
      bob,
      facing: -Math.sin(a) >= 0 ? 1 : -1,
      scale: 0.68 + 0.34 * (depth * 0.5 + 0.5),
    };
  });
}

function npcAt(s, name) {
  return s.npcs.find(n => n.name === name);
}

export default {
  title: 'Horse carousel',
  intro: 'Florence, burgundy sash catching the lanterns, taps the brass pole. “One penny. Whole waltz. No hopping off till the painted gate.” Calliope coughs, the cream horse nods its gold mane, and the painted meadow waits to turn.',

  create() {
    return {
      phase: 'riding',
      t: 0,
      progress: 0,
      spin: 0,
      lean: 0,
      wave: 0,
      beat: 'board',
      npcs: [
        npc('Maisie', 1, 'hold-on', 'Hold the mane!'),
        npc('Ned', 3, 'idle', 'Always liked this one.'),
        npc('Pippa', 5, 'look-up', 'Listen — the pipes.'),
      ],
      note: 'Florence nods you onto the cream horse. One penny, whole trip.',
      exitNote: 'All off — mind the step at the painted gate.',
    };
  },

  update(s, dt) {
    const finished = advanceTrip(s, dt, DURATION);
    s.spin = tripSpin(s.progress);
    s.lean *= Math.pow(0.18, dt);
    s.wave = Math.max(0, (s.wave || 0) - dt);
    for (const n of s.npcs) n.wave = Math.max(0, (n.wave || 0) - dt * 0.65);
    if (finished) {
      s.note = s.exitNote;
      for (const n of s.npcs) {
        n.look = n.name === 'Ned' ? 'tip-hat' : 'wave';
        n.line = n.name === 'Ned' ? 'Mind the step.' : n.name === 'Maisie' ? 'Same time tomorrow?' : 'The cream horse will miss you.';
      }
      return;
    }
    const id = beat(s.progress, BEATS);
    if (s.beat !== id) applyBeat(s, id);
  },

  pointer(s, type, pos) {
    if (s.phase !== 'riding' || type !== 'down' || !pos) return;
    s.lean = Math.max(-1, Math.min(1, (pos.x / W) * 2 - 1));
    s.wave = 1.15;
    const near = s.lean > 0.2 ? 'Maisie' : s.lean < -0.2 ? 'Pippa' : 'Ned';
    const pal = npcAt(s, near);
    if (pal) pal.wave = 1;
    s.note = s.lean > 0.35
      ? 'You lean out toward the lanterns.'
      : s.lean < -0.35
        ? 'You peek around the mirror drum.'
        : 'You wave from the saddle. A neighbour waves back.';
  },

  readout(s) {
    if (s.phase === 'done') return s.note || 'All off — mind the step at the painted gate.';
    const talking = s.npcs.find(n => (n.wave || 0) > 0.15 && n.line) || s.npcs[Math.floor((s.t || 0) / 3) % s.npcs.length];
    const chatter = talking?.line ? ` · ${talking.name}: “${talking.line}”` : '';
    return (s.note || '') + chatter;
  },

  draw(s, d) {
    const ctx = d.ctx;
    if (!ctx) return;
    ctx.save();
    ctx.scale((d.w || W) / W, (d.h || H) / H);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const horses = layout(s);
    paintSky(ctx, s);
    paintGround(ctx, s);
    paintGate(ctx, s, false);
    const back = horses.filter(h => h.depth < 0).sort((a, b) => a.depth - b.depth);
    const front = horses.filter(h => h.depth >= 0).sort((a, b) => a.depth - b.depth);
    for (const h of back) paintHorse(ctx, s, h);
    paintColumn(ctx, s);
    for (const h of front) paintHorse(ctx, s, h);
    paintCanopy(ctx, s);
    paintLanterns(ctx, s);
    paintGate(ctx, s, true);
    paintNotes(ctx, s);
    paintBubbles(ctx, s, horses);
    ctx.restore();
  },
};

function paintSky(ctx, s) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#140c12');
  g.addColorStop(0.42, '#2a151c');
  g.addColorStop(0.72, '#3a221c');
  g.addColorStop(1, '#241810');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const haze = ctx.createRadialGradient(450, 430, 40, 450, 520, 520);
  haze.addColorStop(0, '#c4a15a33');
  haze.addColorStop(0.45, '#7a334022');
  haze.addColorStop(1, '#0000');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, W, H);
  for (const st of STARS) {
    const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(s.t * 1.4 + st.tw));
    ctx.globalAlpha = tw;
    ctx.fillStyle = '#f3e6c8';
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.r, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#1a1218';
  tent(ctx, 70, 620, 90, 160, '#2a1c22');
  tent(ctx, 820, 600, 100, 180, '#24161c');
  ctx.fillStyle = '#3a2218';
  ctx.fillRect(0, 980, W, 220);
  ctx.fillStyle = '#2a1c14';
  ctx.beginPath();
  ctx.ellipse(450, 1040, 420, 70, 0, 0, TAU);
  ctx.fill();
}

function tent(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = '#c4a15a55';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w * 0.5, y);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function paintGround(ctx, s) {
  const cx = 450 + s.lean * 10;
  ctx.fillStyle = '#12233555';
  ctx.beginPath();
  ctx.ellipse(cx + 8, 868, 340, 108, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#5c4034';
  ctx.beginPath();
  ctx.ellipse(cx, 848, 330, 102, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#c4a15a';
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.fillStyle = '#4a5c44';
  ctx.beginPath();
  ctx.ellipse(cx, 838, 300, 86, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#e8d090';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = '#6b243655';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = s.spin * 0.15 + i * TAU / 8;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * 160, 838 + Math.sin(a) * 46, 36, 12, a, 0, TAU);
    ctx.stroke();
  }
  ctx.fillStyle = '#7a3340';
  ctx.beginPath();
  ctx.ellipse(cx, 838, 54, 18, 0, 0, TAU);
  ctx.fill();
  heart(ctx, cx, 832, 10, '#c4a15a');
}

function paintColumn(ctx, s) {
  const cx = 450 + s.lean * 8;
  const top = 310, bot = 830;
  ctx.fillStyle = '#3a221c';
  roundRect(ctx, cx - 38, top, 76, bot - top, 10);
  ctx.fill();
  ctx.strokeStyle = '#c4a15a';
  ctx.lineWidth = 2.4;
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const y = 390 + i * 96;
    const a = s.spin + i * 0.7;
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, cx - 30, y, 60, 78, 8);
    ctx.clip();
    ctx.fillStyle = i % 2 ? '#4a5c3a' : '#7a3340';
    ctx.fillRect(cx - 30, y, 60, 78);
    ctx.fillStyle = '#e8d090';
    ctx.beginPath();
    ctx.arc(cx + Math.sin(a) * 10, y + 34, 16, 0, TAU);
    ctx.fill();
    heart(ctx, cx + Math.sin(a) * 8, y + 34, 8, '#7a3340');
    ctx.restore();
    ctx.strokeStyle = '#e8d090';
    ctx.lineWidth = 1.6;
    roundRect(ctx, cx - 30, y, 60, 78, 8);
    ctx.stroke();
  }
  ctx.fillStyle = '#c4a15a';
  roundRect(ctx, cx - 44, top - 8, 88, 16, 6);
  ctx.fill();
}

function paintCanopy(ctx, s) {
  const cx = 450 + s.lean * 6;
  const cy = 268;
  ctx.fillStyle = '#12233566';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 18, 310, 78, 0, 0, TAU);
  ctx.fill();
  scallops(ctx, cx, cy, 292, 72, 18, 16, '#7a3340', '#c4a15a');
  ctx.fillStyle = '#5a2832';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 6, 210, 46, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#e8d090';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 168, cy - 8);
  ctx.lineTo(cx, cy - 168);
  ctx.lineTo(cx + 168, cy - 8);
  ctx.closePath();
  const roof = ctx.createLinearGradient(cx, cy - 170, cx, cy + 10);
  roof.addColorStop(0, '#4a5c3a');
  roof.addColorStop(0.55, '#7a3340');
  roof.addColorStop(1, '#5a2832');
  ctx.fillStyle = roof;
  ctx.fill();
  ctx.strokeStyle = '#e8d090';
  ctx.lineWidth = 3.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - 168);
  ctx.lineTo(cx, cy - 6);
  ctx.strokeStyle = '#c4a15a';
  ctx.lineWidth = 2;
  ctx.stroke();
  heart(ctx, cx, cy - 70, 22, '#c4a15a');
  heart(ctx, cx, cy - 70, 13, '#7a3340');
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI + (i + 0.5) * Math.PI / 8;
    heart(ctx, cx + Math.cos(a) * 248, cy + Math.sin(a) * 62, 9, '#c4a15a');
  }
  ctx.fillStyle = '#e8d090';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 196);
  ctx.lineTo(cx - 10, cy - 164);
  ctx.lineTo(cx + 10, cy - 164);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f3e6c8';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy - 200, 7, 0, TAU);
  ctx.fillStyle = '#c4a15a';
  ctx.fill();
}

function paintLanterns(ctx, s) {
  const cx = 450 + s.lean * 6;
  const cy = 268;
  for (let i = 0; i < 12; i++) {
    const a = i * TAU / 12 - Math.PI / 2;
    const depth = Math.sin(a);
    if (depth < -0.15) continue;
    const sway = Math.sin(s.t * 2.1 + i) * 5;
    const x = cx + Math.cos(a) * 286 + sway;
    const y = cy + Math.sin(a) * 74 + 38;
    const glow = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(s.t * 3 + i * 0.8));
    ctx.strokeStyle = '#c4a15a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 270, cy + Math.sin(a) * 66);
    ctx.lineTo(x, y - 10);
    ctx.stroke();
    const rg = ctx.createRadialGradient(x, y, 2, x, y, 28);
    rg.addColorStop(0, `rgba(248, 220, 140, ${0.55 * glow})`);
    rg.addColorStop(1, 'rgba(248, 220, 140, 0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e8c484';
    roundRect(ctx, x - 8, y - 10, 16, 20, 4);
    ctx.fill();
    ctx.strokeStyle = '#c4a15a';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#7a3340';
    ctx.fillRect(x - 6, y - 12, 12, 4);
  }
}

function paintGate(ctx, s, overlay) {
  const p = s.progress;
  const show = p > 0.78 || s.phase === 'done';
  if (!show && overlay) return;
  if (!overlay && p < 0.7) {
    // distant painted arch on the platform rim, always a hint
    const cx = 450 + 248 + s.lean * 10;
    ctx.globalAlpha = 0.35;
    arch(ctx, cx, 780, 48, 90);
    ctx.globalAlpha = 1;
    return;
  }
  if (!overlay) return;
  const alpha = s.phase === 'done' ? 1 : Math.min(1, (p - 0.78) / 0.14);
  ctx.save();
  ctx.globalAlpha = alpha;
  const x = 450 + 210 + s.lean * 8;
  const y = 800;
  arch(ctx, x, y, 70, 150);
  ctx.fillStyle = '#f3e6c8';
  ctx.font = '600 16px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(s.phase === 'done' ? 'All off' : 'Painted gate', x, y - 118);
  ctx.restore();
}

function arch(ctx, x, y, w, h) {
  ctx.fillStyle = '#4a5c3a';
  ctx.strokeStyle = '#c4a15a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.lineTo(x - w, y - h * 0.55);
  ctx.quadraticCurveTo(x, y - h, x + w, y - h * 0.55);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - 16, y);
  ctx.lineTo(x + w - 16, y - h * 0.5);
  ctx.quadraticCurveTo(x, y - h + 28, x - w + 16, y - h * 0.5);
  ctx.lineTo(x - w + 16, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  heart(ctx, x, y - h + 36, 11, '#c4a15a');
  ctx.fillStyle = '#5c4034';
  ctx.fillRect(x - w - 8, y - 8, w * 2 + 16, 14);
}

function paintHorse(ctx, s, h) {
  const rider = h.guest
    ? {name: 'You', look: s.wave > 0 ? 'wave' : 'idle', wave: s.wave, guest: true}
    : h.rider
      ? Object.assign({name: h.rider, guest: false}, npcAt(s, h.rider) || {look: 'idle', wave: 0})
      : null;
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.scale(h.facing * h.scale, h.scale);
  ctx.fillStyle = '#12233544';
  ctx.beginPath();
  ctx.ellipse(4, 52 - h.bob * 0.15, 42, 10, 0, 0, TAU);
  ctx.fill();
  pole(ctx, 1);
  legs(ctx, h);
  body(ctx, h);
  head(ctx, h);
  saddle(ctx, h);
  if (rider) paintRider(ctx, s, rider);
  pole(ctx, 0);
  if (h.guest) pennant(ctx, s);
  ctx.restore();
}

function pole(ctx, behind) {
  ctx.fillStyle = behind ? '#8a7040' : '#e8d090';
  ctx.strokeStyle = '#c4a15a';
  ctx.lineWidth = 1.4;
  roundRect(ctx, -5, behind ? -210 : -28, 10, behind ? 280 : 86, 3);
  ctx.fill();
  ctx.stroke();
}

function legs(ctx, h) {
  ctx.strokeStyle = h.coat;
  ctx.fillStyle = h.coat;
  ctx.lineWidth = 7;
  const pairs = [
    [-30, 8, -38, 48],
    [-16, 10, -12, 50],
    [16, 8, 12, 46],
    [30, 4, 40, 28],
  ];
  for (const [x0, y0, x1, y1] of pairs) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.fillStyle = h.hoof;
    ctx.beginPath();
    ctx.ellipse(x1, y1 + 3, 7, 4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = h.coat;
  }
}

function body(ctx, h) {
  ctx.fillStyle = h.coat;
  ctx.strokeStyle = '#f3e6c8';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-42, 6);
  ctx.bezierCurveTo(-52, -18, 8, -30, 38, -10);
  ctx.bezierCurveTo(50, -4, 52, 10, 38, 18);
  ctx.bezierCurveTo(16, 26, -18, 26, -42, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-40, 2);
  ctx.bezierCurveTo(-70, -8, -64, 28, -48, 16);
  ctx.strokeStyle = h.mane;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = h.mane;
  ctx.beginPath();
  ctx.ellipse(-52, 10, 10, 7, -0.4, 0, TAU);
  ctx.fill();
}

function head(ctx, h) {
  ctx.fillStyle = h.coat;
  ctx.strokeStyle = '#f3e6c8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(30, -8);
  ctx.quadraticCurveTo(38, -32, 52, -36);
  ctx.quadraticCurveTo(70, -38, 78, -26);
  ctx.quadraticCurveTo(80, -16, 68, -14);
  ctx.quadraticCurveTo(52, -10, 36, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = h.mane;
  ctx.beginPath();
  ctx.moveTo(44, -36);
  ctx.lineTo(36, -54);
  ctx.lineTo(50, -40);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(40, -28);
  ctx.lineTo(22, -48);
  ctx.lineTo(18, -34);
  ctx.lineTo(32, -18);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = h.mane;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(46, -34);
  ctx.quadraticCurveTo(28, -20, 22, -4);
  ctx.stroke();
  ctx.fillStyle = '#2a221c';
  ctx.beginPath();
  ctx.ellipse(62, -28, 2.4, 2.8, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#c4a15a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(54, -22);
  ctx.lineTo(76, -20);
  ctx.stroke();
}

function saddle(ctx, h) {
  ctx.fillStyle = h.blanket;
  ctx.beginPath();
  ctx.ellipse(4, 2, 22, 12, -0.15, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#e8d090';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = h.saddle;
  ctx.beginPath();
  ctx.ellipse(2, -2, 16, 10, -0.1, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#c4a15a';
  ctx.stroke();
}

function paintRider(ctx, s, rider) {
  const pal = RIDER_LOOK[rider.name] || RIDER_LOOK.You;
  const wave = rider.wave || 0;
  const look = rider.look || 'idle';
  ctx.fillStyle = pal.coat;
  ctx.strokeStyle = '#f3e6c8';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.ellipse(4, -26, 12, 16, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  const armUp = look === 'wave' || look === 'laugh' || wave > 0;
  const armA = armUp ? -0.95 + Math.sin((s.t + wave) * 8) * 0.45 : look === 'look-up' ? -0.55 : look === 'tip-hat' ? -1.1 : -0.15;
  ctx.strokeStyle = pal.coat;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(10, -30);
  ctx.lineTo(10 + Math.cos(armA) * 22, -30 + Math.sin(armA) * 18);
  ctx.stroke();
  ctx.fillStyle = '#f0d4b4';
  ctx.beginPath();
  ctx.arc(6, -48, 9, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#e8c484';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = pal.hair;
  ctx.beginPath();
  ctx.arc(4, -50, 8, Math.PI, TAU);
  ctx.fill();
  if (pal.hat === 'straw') {
    ctx.fillStyle = '#e8c484';
    ctx.beginPath();
    ctx.ellipse(6, -56, 14, 4, 0, 0, TAU);
    ctx.fill();
    ctx.fillRect(-2, -64, 16, 10);
  } else if (pal.hat === 'bowler') {
    ctx.fillStyle = '#1a1510';
    ctx.beginPath();
    ctx.ellipse(6, -56, 12, 3.5, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(6, -62, 8, 7, 0, 0, TAU);
    ctx.fill();
  } else if (pal.hat === 'ribbons') {
    ctx.strokeStyle = '#7a3340';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(12, -54);
    ctx.quadraticCurveTo(22, -40, 16, -28);
    ctx.moveTo(10, -54);
    ctx.quadraticCurveTo(24, -46, 20, -32);
    ctx.stroke();
  } else if (pal.hat === 'ticket') {
    ctx.fillStyle = '#f3e6c8';
    ctx.strokeStyle = '#c4a15a';
    ctx.lineWidth = 1;
    roundRect(ctx, -4, -66, 18, 10, 2);
    ctx.fill();
    ctx.stroke();
  }
  if (look === 'look-up') {
    ctx.strokeStyle = '#2a221c';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(8, -50);
    ctx.lineTo(12, -54);
    ctx.stroke();
  }
}

function pennant(ctx, s) {
  const flap = Math.sin(s.t * 4) * 4;
  ctx.fillStyle = '#7a3340';
  ctx.strokeStyle = '#e8d090';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(8, -78);
  ctx.lineTo(36 + flap, -70);
  ctx.lineTo(8, -62);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f3e6c8';
  ctx.font = '600 9px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('YOU', 11, -66);
}

function paintNotes(ctx, s) {
  const id = s.beat;
  if (id !== 'waltz' && id !== 'lanterns' && id !== 'night' && id !== 'neighbours') return;
  ctx.fillStyle = '#e8d090';
  ctx.strokeStyle = '#c4a15a';
  ctx.lineWidth = 1.4;
  ctx.font = '700 22px Georgia, serif';
  ctx.textAlign = 'center';
  for (let i = 0; i < 6; i++) {
    const x = 160 + i * 120 + Math.sin(s.t * 1.15 + i) * 18;
    const y = 140 + Math.sin(s.t * 0.9 + i * 1.4) * 16;
    ctx.globalAlpha = 0.55 + 0.35 * (0.5 + 0.5 * Math.sin(s.t * 2 + i));
    ctx.fillText(i % 2 ? '♪' : '♫', x, y);
  }
  ctx.globalAlpha = 1;
}

function paintBubbles(ctx, s, horses) {
  for (const h of horses) {
    if (!h.rider && !h.guest) continue;
    const rider = h.guest
      ? {name: 'You', line: s.wave > 0.2 ? (s.note || '') : '', wave: s.wave}
      : npcAt(s, h.rider);
    if (!rider || h.depth < -0.05) continue;
    const line = h.guest ? (s.wave > 0.35 ? '—' : '') : rider.line;
    if (!line || (h.guest && s.wave <= 0.35)) continue;
    if (!h.guest && (rider.wave || 0) < 0.05 && s.beat !== 'neighbours') {
      if (h.depth < 0.35) continue;
    }
    const text = h.guest ? (s.lean > 0.3 ? 'lean' : s.lean < -0.3 ? 'peek' : 'hello!') : rider.line;
    bubble(ctx, h.x, h.y - 92 * h.scale, text, h.guest);
  }
}

function bubble(ctx, x, y, text, guest) {
  ctx.font = '500 13px Georgia, serif';
  ctx.textAlign = 'center';
  const w = Math.min(220, Math.max(72, ctx.measureText(text).width + 22));
  ctx.fillStyle = guest ? '#f3e6c8ee' : '#f8ecd4ee';
  ctx.strokeStyle = guest ? '#7a3340' : '#c4a15a';
  ctx.lineWidth = 1.6;
  roundRect(ctx, x - w / 2, y - 18, w, 28, 10);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 6, y + 10);
  ctx.lineTo(x, y + 18);
  ctx.lineTo(x + 6, y + 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2a1810';
  ctx.fillText(text, x, y + 2);
}

function scallops(ctx, x, y, rx, ry, n, depth, fill, stroke) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * TAU;
    const a1 = ((i + 1) / n) * TAU;
    const mid = (a0 + a1) / 2;
    const x0 = x + Math.cos(a0) * rx;
    const y0 = y + Math.sin(a0) * ry;
    const xm = x + Math.cos(mid) * (rx + depth);
    const ym = y + Math.sin(mid) * (ry + depth);
    if (i === 0) ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(xm, ym, x + Math.cos(a1) * rx, y + Math.sin(a1) * ry);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2.4;
  ctx.stroke();
}

function heart(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y + r);
  ctx.bezierCurveTo(x - r * 1.6, y - r * 0.05, x - r * 0.9, y - r * 1.35, x, y - r * 0.45);
  ctx.bezierCurveTo(x + r * 0.9, y - r * 1.35, x + r * 1.6, y - r * 0.05, x, y + r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
