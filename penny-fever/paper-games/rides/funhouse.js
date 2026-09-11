/** Funhouse — on-rails walk through warped corridors and mirror gags.
 * Guest boards once, rides the moving boards with other guests, exits the far door.
 * Not a maze. Not a skill game. No stamps, no treasure, no hop-off.
 */
import { npc, advanceTrip, beat, easeInOut } from '../ride-kit.js';

const TAU = Math.PI * 2;
const DURATION = 58;

const BEATS = [
  { at: 0, id: 'mouth' },
  { at: 0.10, id: 'corridor' },
  { at: 0.24, id: 'mirrors' },
  { at: 0.40, id: 'barrel' },
  { at: 0.54, id: 'tilt' },
  { at: 0.68, id: 'glass' },
  { at: 0.84, id: 'gag' },
  { at: 0.94, id: 'exit' },
];

const NOTES = {
  mouth: 'Through the painted mouth…',
  corridor: 'The corridor takes a stretch.',
  mirrors: 'Glass that fibs about your height.',
  barrel: 'The barrel of fun turns the world.',
  tilt: 'Boards tilt. The house giggles.',
  glass: 'A crowd of you in the mirrors.',
  gag: 'A paper clown pops — then bows.',
  exit: 'The far door. Alley light.',
};

const CAST = {
  mouth: {
    Pip: { look: 'point', line: 'We\'re going in the mouth!' },
    Marla: { look: 'idle', line: 'Smile for the painted man.' },
    Ned: { look: 'gawk', line: 'Boards are moving. Good.' },
  },
  corridor: {
    Pip: { look: 'gawk', line: 'The walls are chewing!' },
    Marla: { look: 'wobble', line: 'Hold my hat, someone.' },
    Ned: { look: 'idle', line: 'Just paper, just paper…' },
  },
  mirrors: {
    Pip: { look: 'gawk', line: 'I\'m a beanpole!' },
    Marla: { look: 'laugh', line: 'Darling, I am statuesque.' },
    Ned: { look: 'point', line: 'That fellow\'s wearing my coat.' },
  },
  barrel: {
    Pip: { look: 'wobble', line: 'Wheee—oh no—wheee!' },
    Marla: { look: 'wobble', line: 'I shall not be spun.' },
    Ned: { look: 'gawk', line: 'Hats. Hold. Hats.' },
  },
  tilt: {
    Pip: { look: 'wobble', line: 'The floor\'s a liar!' },
    Marla: { look: 'idle', line: 'Lean with it, dears.' },
    Ned: { look: 'wobble', line: 'Left. No, right. Left.' },
  },
  glass: {
    Pip: { look: 'gawk', line: 'There\'s twelve of me.' },
    Marla: { look: 'wave', line: 'Hello, hello, and hello.' },
    Ned: { look: 'point', line: 'Don\'t trust any of them.' },
  },
  gag: {
    Pip: { look: 'gawk', line: 'AH— wait, he\'s paper.' },
    Marla: { look: 'laugh', line: 'The house\'s old jump-clown.' },
    Ned: { look: 'laugh', line: 'Harmless as a postcard.' },
  },
  exit: {
    Pip: { look: 'wave', line: 'Daylight!' },
    Marla: { look: 'wave', line: 'The honest door at last.' },
    Ned: { look: 'wave', line: 'Mind the step, all.' },
  },
};

const PAL = {
  pip: { skin: '#f0d4b0', hair: '#3a2a22', cloth: '#c45c4a', cloth2: '#efe0b8', accent: '#2a4a48', hat: '#6b2c2c' },
  marla: { skin: '#e8c4a0', hair: '#4a2030', cloth: '#6b2c3c', cloth2: '#c9a15b', accent: '#e8d5a3', hat: '#3a1824' },
  ned: { skin: '#d4b08c', hair: '#2c241c', cloth: '#c4a15a', cloth2: '#3d4a42', accent: '#8b3a3a', hat: '#2c241c' },
  guest: { skin: '#f3dcc0', hair: '#5a4638', cloth: '#3d5e56', cloth2: '#efe0b8', accent: '#c9a15b', hat: '#3d5e56' },
};

const ROOM = {
  mouth: { wallA: '#3a2428', wallB: '#2a181c', floor: '#4a3228', ceil: '#241418', accent: '#c9a15b' },
  corridor: { wallA: '#2f4a46', wallB: '#243a38', floor: '#6b5340', ceil: '#1e2e2c', accent: '#e8d5a3' },
  mirrors: { wallA: '#243836', wallB: '#1c2c2c', floor: '#5a4638', ceil: '#152422', accent: '#d4b56a' },
  barrel: { wallA: '#8b3a3a', wallB: '#efe0b8', floor: '#5a3028', ceil: '#4a2020', accent: '#f3e6c8' },
  tilt: { wallA: '#3a3a52', wallB: '#2a4a48', floor: '#4a3a48', ceil: '#1c1c2c', accent: '#c9a15b' },
  glass: { wallA: '#1c3038', wallB: '#243844', floor: '#3a3a42', ceil: '#102028', accent: '#b8d0d4' },
  gag: { wallA: '#2c1c24', wallB: '#3a242c', floor: '#4a3428', ceil: '#1a1014', accent: '#e8c484' },
  exit: { wallA: '#3d4a40', wallB: '#2a382c', floor: '#6b5340', ceil: '#3a4030', accent: '#f0d49b' },
};

function applyBeat(s) {
  const id = beat(s.progress, BEATS);
  if (s.beat === id) return;
  s.beat = id;
  s.note = NOTES[id] || s.note;
  const pack = CAST[id];
  if (!pack) return;
  for (const n of s.npcs) {
    const bit = pack[n.name];
    if (!bit) continue;
    n.look = bit.look;
    n.line = bit.line;
    if (bit.look === 'wave' || bit.look === 'point') n.wave = 1;
  }
}

function seatOf(seat, w, h, lean) {
  const mid = w * 0.5 + lean * w * 0.05;
  const deck = h * 0.80;
  if (seat === 'left') return { x: mid - w * 0.20, y: deck - 6, s: 0.92 };
  if (seat === 'right') return { x: mid + w * 0.21, y: deck - 2, s: 0.96 };
  if (seat === 'ahead') return { x: mid + w * 0.015, y: deck - 124, s: 0.70 };
  return { x: mid, y: deck + 54, s: 1.10 };
}

function poly(ctx, pts, fill, stroke, width) {
  if (!pts.length) return;
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width || 1.5; ctx.stroke(); }
}

function paperPoly(ctx, pts, fill, stroke) {
  poly(ctx, pts.map(p => [p[0] + 3, p[1] + 4]), 'rgba(12,10,16,0.32)');
  poly(ctx, pts, fill, stroke || '#f0e0bc', 1.45);
}

function ellipseFill(ctx, x, y, rx, ry, fill, stroke, width) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width || 1.3; ctx.stroke(); }
}

function star(ctx, x, y, r, fill) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI / 5 - Math.PI / 2;
    const rr = i % 2 ? r * 0.42 : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  paperPoly(ctx, pts, fill || '#e7c789', '#f8e4b3');
}

function person(ctx, x, y, scale, pal, pose) {
  const look = pose.look || 'idle';
  const wave = pose.wave || 0;
  const t = pose.t || 0;
  const ghost = pose.ghost || 0;
  let lean = pose.lean || 0;
  if (look === 'wobble') lean += Math.sin(t * 7 + pose.phase) * 0.18;
  if (look === 'laugh') y += Math.sin(t * 10) * 3;
  const sx = (pose.sx || 1) * (look === 'gawk' && pose.mirror ? 0.55 : 1);
  const sy = (pose.sy || 1) * (1 + Math.sin(t * 2.2 + pose.phase) * 0.012) * (look === 'gawk' && pose.mirror ? 1.45 : 1);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(scale * sx, scale * sy);
  if (ghost) ctx.globalAlpha = 0.55 * (pose.alpha ?? 1);
  else if (pose.alpha != null) ctx.globalAlpha = pose.alpha;

  ellipseFill(ctx, 2, 6, 22, 7, 'rgba(12,10,16,0.28)');

  const armL = -0.55 - wave * 1.55 - (look === 'laugh' ? 0.4 : 0);
  const armR = look === 'point' ? 1.25 : 0.55 + wave * 0.35;
  const sleeve = pal.cloth2;

  ctx.save();
  ctx.rotate(armL);
  paperPoly(ctx, [[-6, -38], [6, -38], [8, 8], [-8, 10]], sleeve, pal.accent);
  ellipseFill(ctx, 0, 14, 7, 6, pal.skin, '#f0e0bc', 1);
  ctx.restore();

  paperPoly(ctx, [[-10, -6], [-14, 18], [-6, 18], [-4, -4]], pal.cloth, '#e8d5a3');
  paperPoly(ctx, [[10, -6], [14, 18], [6, 18], [4, -4]], pal.cloth, '#e8d5a3');

  if (pose.stripes) {
    paperPoly(ctx, [[-18, -52], [18, -52], [22, -8], [-22, -8]], pal.cloth2, '#e8d5a3');
    for (let i = 0; i < 4; i++) {
      const yy = -46 + i * 9;
      poly(ctx, [[-17, yy], [17, yy], [18, yy + 5], [-18, yy + 5]], pal.cloth);
    }
  } else if (pose.dress) {
    paperPoly(ctx, [[-16, -52], [16, -52], [28, -4], [-28, -4]], pal.cloth, '#e8d5a3');
    poly(ctx, [[-10, -40], [10, -40], [12, -18], [-12, -18]], pal.cloth2);
  } else {
    paperPoly(ctx, [[-18, -52], [18, -52], [22, -8], [-22, -8]], pal.cloth, '#e8d5a3');
    poly(ctx, [[-12, -28], [12, -28], [14, -10], [-14, -10]], pal.cloth2);
  }

  ctx.save();
  ctx.rotate(armR);
  paperPoly(ctx, [[-6, -40], [6, -40], [8, 10], [-7, 8]], sleeve, pal.accent);
  ellipseFill(ctx, 0, 16, 7, 6, pal.skin, '#f0e0bc', 1);
  ctx.restore();

  const headY = -72;
  ellipseFill(ctx, 2, headY + 4, 20, 22, 'rgba(12,10,16,0.22)');
  ellipseFill(ctx, 0, headY, 19, 21, pal.skin, '#f0e0bc', 1.5);
  paperPoly(ctx, [[-16, headY - 6], [-10, headY - 22], [12, headY - 24], [16, headY - 4], [8, headY + 2], [-8, headY + 2]], pal.hair, '#e8d5a3');

  if (pose.face !== 'back') {
    const gawk = look === 'gawk' ? 1 : 0;
    ellipseFill(ctx, -6, headY - 2 - gawk * 2, 2.2, 2.6, '#2a241c');
    ellipseFill(ctx, 6, headY - 2 - gawk * 2, 2.2, 2.6, '#2a241c');
    ctx.beginPath();
    ctx.strokeStyle = '#8b5a4a';
    ctx.lineWidth = 1.6;
    if (look === 'laugh') {
      ctx.arc(0, headY + 6, 6, 0.15, Math.PI - 0.15);
    } else if (look === 'gawk') {
      ellipseFill(ctx, 0, headY + 7, 3.2, 4.2, '#6b2c2c', '#f0e0bc', 1);
    } else {
      ctx.arc(0, headY + 4, 6, 0.2, Math.PI - 0.2);
    }
    ctx.stroke();
  }

  if (pose.hat === 'cap') {
    paperPoly(ctx, [[-16, headY - 10], [16, headY - 12], [14, headY - 20], [-12, headY - 18]], pal.hat, '#e8d5a3');
    paperPoly(ctx, [[10, headY - 12], [26, headY - 8], [22, headY - 4], [10, headY - 8]], pal.accent, '#e8d5a3');
  } else if (pose.hat === 'brim') {
    paperPoly(ctx, [[-28, headY - 8], [28, headY - 10], [22, headY - 16], [-22, headY - 14]], pal.hat, '#e8d5a3');
    paperPoly(ctx, [[-12, headY - 14], [12, headY - 16], [10, headY - 26], [-8, headY - 24]], pal.cloth, '#e8d5a3');
    paperPoly(ctx, [[10, headY - 24], [22, headY - 40], [16, headY - 18]], pal.accent, '#f8e4b3');
  } else if (pose.hat === 'porkpie') {
    paperPoly(ctx, [[-18, headY - 10], [18, headY - 12], [14, headY - 22], [-14, headY - 20]], pal.hat, '#e8d5a3');
    poly(ctx, [[-10, headY - 20], [10, headY - 22], [8, headY - 28], [-8, headY - 26]], pal.cloth2);
  }

  ctx.restore();
}

function riderPose(n, s, extra) {
  const wob = n.look === 'wobble' ? Math.sin(s.t * 6 + (extra?.phase || 0)) * 0.12 : 0;
  return {
    look: n.look,
    wave: n.wave || 0,
    t: s.t,
    lean: (s.leanNow || 0) * 0.22 + wob + (extra?.lean || 0),
    phase: extra?.phase || 0,
    sx: extra?.sx,
    sy: extra?.sy,
    ghost: extra?.ghost,
    mirror: extra?.mirror,
    alpha: extra?.alpha,
    face: extra?.face,
    hat: extra?.hat,
    stripes: extra?.stripes,
    dress: extra?.dress,
  };
}

function styleOf(name) {
  if (name === 'Pip') return { hat: 'cap', stripes: true, pal: PAL.pip, phase: 0.2 };
  if (name === 'Marla') return { hat: 'brim', dress: true, pal: PAL.marla, phase: 1.4 };
  if (name === 'Ned') return { hat: 'porkpie', pal: PAL.ned, phase: 2.1 };
  return { pal: PAL.guest, phase: 0.7, face: 'back' };
}

const LEAD = {
  mouth: 'Pip', corridor: 'Marla', mirrors: 'Marla', barrel: 'Pip',
  tilt: 'Ned', glass: 'Marla', gag: 'Pip', exit: 'Ned',
};

function nameplate(ctx, x, y, name) {
  const bw = Math.max(40, name.length * 8 + 16);
  paperPoly(ctx, [
    [x - bw / 2, y], [x + bw / 2, y], [x + bw / 2 - 3, y + 18], [x - bw / 2 + 3, y + 18],
  ], '#f3e6c8', '#c9a15b');
  ctx.fillStyle = '#6b2c2c';
  ctx.font = '12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, x, y + 14);
}

function bubble(ctx, x, y, name, line, side) {
  if (!line) return;
  ctx.save();
  ctx.font = '15px Georgia, serif';
  const textW = ctx.measureText ? ctx.measureText(line).width : line.length * 8;
  const bw = Math.min(248, Math.max(120, textW + 28));
  const bh = 48;
  const bx = side === 'right' ? x - 12 : x - bw + 12;
  const by = y - 168;
  paperPoly(ctx, [
    [bx, by], [bx + bw, by], [bx + bw, by + bh],
    [bx + bw * 0.55 + 8, by + bh], [x, y - 118], [bx + bw * 0.55 - 8, by + bh],
    [bx, by + bh],
  ], '#f3e6c8', '#c9a15b');
  ctx.fillStyle = '#8b3a3a';
  ctx.font = '11px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(name, bx + 12, by + 16);
  ctx.fillStyle = '#2a241c';
  ctx.font = '15px Georgia, serif';
  ctx.fillText(line, bx + 12, by + 36);
  ctx.restore();
}

function tunnel(ctx, w, h, s, pal, warp, spin) {
  const vx = w * 0.5 + s.leanNow * w * 0.04;
  const vy = h * 0.26;
  const nearY = h * 0.74;
  const slices = 14;
  const scroll = (s.progress * 16) % 1;
  ctx.save();
  if (s.beat === 'barrel') {
    ctx.translate(vx, vy + 80);
    ctx.rotate(spin);
    ctx.translate(-vx, -(vy + 80));
  }
  for (let i = slices; i >= 0; i--) {
    const u0 = (i + scroll) / (slices + 1);
    const u1 = (i + 1 + scroll) / (slices + 1);
    const z0 = u0 * u0;
    const z1 = Math.min(1, u1 * u1);
    const y0 = vy + (nearY - vy) * z0;
    const y1 = vy + (nearY - vy) * z1;
    const half0 = 18 + (w * 0.5 - 18) * z0;
    const half1 = 18 + (w * 0.5 - 18) * z1;
    const wob0 = Math.sin(s.progress * 18 + i * 0.65 + s.t * 0.4) * warp * (12 + i * 2.2);
    const wob1 = Math.sin(s.progress * 18 + (i + 1) * 0.65 + s.t * 0.4) * warp * (12 + (i + 1) * 2.2);
    const stripe = (i + Math.floor(s.progress * 16)) % 2 === 0;
    const wall = s.beat === 'barrel' ? (stripe ? pal.wallA : pal.wallB) : (stripe ? pal.wallA : pal.wallB);
    const floor = stripe ? pal.floor : '#3a2a22';
    poly(ctx, [
      [vx - half0 + wob0, y0], [vx + half0 + wob0 * 0.3, y0],
      [vx + half1 + wob1 * 0.3, y1], [vx - half1 + wob1, y1],
    ], wall);
    poly(ctx, [
      [vx - half0 * 0.92 + wob0, y0], [vx + half0 * 0.92 + wob0 * 0.3, y0],
      [vx + half1 * 0.92 + wob1 * 0.3, y1], [vx - half1 * 0.92 + wob1, y1],
    ], floor);
    if (i % 3 === 0 && s.beat !== 'barrel') {
      const sx = vx - half1 * 0.7 + wob1;
      const sy = (y0 + y1) * 0.5;
      star(ctx, sx, sy, 5 + i * 0.4, pal.accent);
    }
    poly(ctx, [
      [vx - half0 + wob0, y0], [vx - half1 + wob1, y1],
      [vx - half1 + wob1, y1 - (y1 - y0) * 0.08], [vx - half0 + wob0, y0 - (y1 - y0) * 0.08],
    ], pal.ceil);
    poly(ctx, [
      [vx + half0 + wob0 * 0.3, y0], [vx + half1 + wob1 * 0.3, y1],
      [vx + half1 + wob1 * 0.3, y1 - (y1 - y0) * 0.08], [vx + half0 + wob0 * 0.3, y0 - (y1 - y0) * 0.08],
    ], pal.ceil);
  }
  ctx.restore();
  return { vx, vy, nearY };
}

function clownMouth(ctx, vx, vy, amp, alpha) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ellipseFill(ctx, vx - 70, vy - 78, 22, 28, '#f0d0a8', '#e8d5a3', 2);
  ellipseFill(ctx, vx + 70, vy - 78, 22, 28, '#f0d0a8', '#e8d5a3', 2);
  ellipseFill(ctx, vx - 70, vy - 78, 8, 12, '#2a241c');
  ellipseFill(ctx, vx + 70, vy - 78, 8, 12, '#2a241c');
  ellipseFill(ctx, vx, vy - 18, 18, 16, '#c45c4a', '#f0e0bc', 2);
  paperPoly(ctx, [
    [vx - 120, vy + 10], [vx + 120, vy + 10], [vx + 90, vy + 110], [vx - 90, vy + 110],
  ], '#8b3a3a', '#e8d5a3');
  ellipseFill(ctx, vx, vy + 58, 72, 40, '#1a1014');
  const teeth = 7;
  for (let i = 0; i < teeth; i++) {
    const u = (i + 0.5) / teeth - 0.5;
    const tx = vx + u * 120;
    paperPoly(ctx, [[tx - 8, vy + 18], [tx + 8, vy + 18], [tx + 4, vy + 38], [tx - 4, vy + 38]], '#f3e6c8', '#e8d5a3');
  }
  ctx.font = '22px Georgia, serif';
  ctx.fillStyle = '#e8d5a3';
  ctx.textAlign = 'center';
  ctx.fillText('FUNHOUSE', vx, vy - 118);
  ctx.restore();
}

function goldFrame(ctx, x, y, rw, rh) {
  paperPoly(ctx, [
    [x - rw, y - rh], [x + rw, y - rh], [x + rw, y + rh], [x - rw, y + rh],
  ], '#c9a15b', '#f8e4b3');
  poly(ctx, [
    [x - rw + 10, y - rh + 10], [x + rw - 10, y - rh + 10],
    [x + rw - 10, y + rh - 10], [x - rw + 10, y + rh - 10],
  ], '#8aa0a4');
  const g = ctx.createLinearGradient(x - rw, y - rh, x + rw, y + rh);
  g.addColorStop(0, 'rgba(232,244,246,0.35)');
  g.addColorStop(0.5, 'rgba(40,70,80,0.15)');
  g.addColorStop(1, 'rgba(180,220,220,0.28)');
  ctx.fillStyle = g;
  ctx.fillRect(x - rw + 10, y - rh + 10, (rw - 10) * 2, (rh - 10) * 2);
}

function drawMirrors(ctx, w, h, s, cam) {
  const tall = s.beat === 'mirrors';
  const many = s.beat === 'glass';
  if (!tall && !many) return;
  const frames = many
    ? [[0.18, 0.42, 70, 110], [0.82, 0.40, 66, 120], [0.22, 0.62, 54, 80], [0.78, 0.64, 58, 86], [0.50, 0.36, 48, 70]]
    : [[0.16, 0.48, 78, 150], [0.84, 0.48, 78, 150]];
  s.npcs.forEach((n, i) => {
    const fr = frames[i % frames.length];
    const mx = w * fr[0] + s.leanNow * 12;
    const my = h * fr[1];
    goldFrame(ctx, mx, my, fr[2], fr[3]);
    ctx.save();
    ctx.beginPath();
    ctx.rect(mx - fr[2] + 12, my - fr[3] + 12, (fr[2] - 12) * 2, (fr[3] - 12) * 2);
    ctx.clip();
    const st = styleOf(n.name);
    const sx = tall ? (i % 2 === 0 ? 0.45 : 1.35) : 0.7 + (i % 3) * 0.15;
    const sy = tall ? (i % 2 === 0 ? 1.55 : 0.55) : 1.1;
    person(ctx, mx, my + fr[3] * 0.55, 0.72, st.pal, riderPose(n, s, {
      phase: st.phase + i, ghost: 1, mirror: true, sx, sy, hat: st.hat, stripes: st.stripes, dress: st.dress,
    }));
    ctx.restore();
    poly(ctx, [
      [mx - fr[2] + 12, my - fr[3] + 12], [mx + fr[2] - 12, my - fr[3] + 12],
      [mx + fr[2] - 12, my - fr[3] + 28], [mx - fr[2] + 12, my - fr[3] + 40],
    ], 'rgba(255,255,255,0.12)');
  });
}

function jumpClown(ctx, w, h, s) {
  const pop = easeInOut(s.gag || 0);
  if (pop <= 0.02) return;
  const x = w * 0.72 + s.leanNow * 20;
  const y = h * 0.62 - pop * 160;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(s.t * 8) * 0.08 * pop);
  ctx.scale(0.95 + pop * 0.2, 0.95 + pop * 0.2);
  paperPoly(ctx, [[-36, 20], [36, 20], [20, 70], [-20, 70]], '#6b2c2c', '#e8d5a3');
  ellipseFill(ctx, 0, -10, 34, 36, '#f0d0a8', '#e8d5a3', 2);
  ellipseFill(ctx, -12, -16, 5, 6, '#2a241c');
  ellipseFill(ctx, 12, -16, 5, 6, '#2a241c');
  ellipseFill(ctx, 0, -2, 10, 9, '#c45c4a', '#f0e0bc', 1.5);
  ctx.beginPath();
  ctx.strokeStyle = '#8b3a3a';
  ctx.lineWidth = 2.4;
  ctx.arc(0, 8, 12, 0.15, Math.PI - 0.15);
  ctx.stroke();
  paperPoly(ctx, [[-22, -40], [22, -42], [16, -62], [-14, -58]], '#6b2c2c', '#e8d5a3');
  ctx.restore();
}

function exitDoor(ctx, cam, open) {
  const { vx, vy } = cam;
  const rw = 46 + open * 22;
  const rh = 70 + open * 18;
  paperPoly(ctx, [
    [vx - rw - 14, vy + rh + 8], [vx + rw + 14, vy + rh + 8],
    [vx + rw + 8, vy - rh - 16], [vx - rw - 8, vy - rh - 16],
  ], '#5a3a28', '#c9a15b');
  const swing = open * 0.85;
  const left = [
    [vx - rw, vy - rh], [vx - 4, vy - rh], [vx - 4, vy + rh], [vx - rw, vy + rh],
  ];
  const right = [
    [vx + 4, vy - rh], [vx + rw, vy - rh], [vx + rw, vy + rh], [vx + 4, vy + rh],
  ];
  const leftOpen = left.map((p, i) => [p[0] - swing * 36, i < 2 ? p[1] - swing * 8 : p[1]]);
  const rightOpen = right.map((p, i) => [p[0] + swing * 36, i < 2 ? p[1] - swing * 8 : p[1]]);
  const light = ctx.createRadialGradient(vx, vy, 4, vx, vy, 90);
  light.addColorStop(0, 'rgba(255,236,180,' + (0.25 + open * 0.55) + ')');
  light.addColorStop(1, 'rgba(255,220,140,0)');
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.ellipse(vx, vy + 10, 70, 88, 0, 0, TAU);
  ctx.fill();
  paperPoly(ctx, leftOpen, '#6b5340', '#e8d5a3');
  paperPoly(ctx, rightOpen, '#5a4638', '#e8d5a3');
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = '#f0d49b';
  ctx.textAlign = 'center';
  ctx.fillText('THIS WAY OUT', vx, vy - rh - 24);
}

function cart(ctx, w, h, s) {
  const y = h * 0.82;
  const lean = s.leanNow * 18;
  const slat = (s.t * 70) % 28;
  paperPoly(ctx, [
    [40 + lean, y - 18], [w - 40 + lean, y - 10],
    [w - 18 + lean, h - 52], [22 + lean, h - 58],
  ], '#6b5340', '#e8d5a3');
  for (let i = 0; i < 12; i++) {
    const yy = y + 8 + i * 14 - slat;
    if (yy < y - 8 || yy > h - 64) continue;
    poly(ctx, [
      [50 + lean, yy], [w - 50 + lean, yy + 4],
      [w - 48 + lean, yy + 10], [52 + lean, yy + 6],
    ], i % 2 ? '#5a4638' : '#7a624c');
  }
  paperPoly(ctx, [[36 + lean, y - 28], [70 + lean, y - 28], [64 + lean, y + 8], [30 + lean, y + 8]], '#c9a15b', '#f8e4b3');
  paperPoly(ctx, [[w - 70 + lean, y - 22], [w - 36 + lean, y - 22], [w - 30 + lean, y + 12], [w - 64 + lean, y + 12]], '#c9a15b', '#f8e4b3');
  paperPoly(ctx, [[w * 0.5 - 28 + lean, y + 36], [w * 0.5 + 28 + lean, y + 36], [w * 0.5 + 24 + lean, y + 58], [w * 0.5 - 24 + lean, y + 58]], '#efe0b8', '#c9a15b');
  ctx.fillStyle = '#6b2c2c';
  ctx.font = '12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('1¢ walk', w * 0.5 + lean, y + 52);
}

function marquee(ctx, w, beatId) {
  paperPoly(ctx, [[w * 0.5 - 160, 18], [w * 0.5 + 160, 18], [w * 0.5 + 148, 70], [w * 0.5 - 148, 70]], '#6b2c2c', '#e8d5a3');
  ctx.fillStyle = '#f3e6c8';
  ctx.font = '28px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('FUNHOUSE', w * 0.5, 52);
  ctx.fillStyle = '#c9a15b';
  ctx.font = '12px Georgia, serif';
  ctx.fillText(NOTES[beatId] || '', w * 0.5, 88);
}

function rail(ctx, w, h, progress, done) {
  const x = 48, y = h - 28, rw = w - 96, rh = 10;
  paperPoly(ctx, [[x, y], [x + rw, y], [x + rw, y + rh], [x, y + rh]], '#efe0b8', '#c9a15b');
  poly(ctx, [[x + 2, y + 2], [x + 2 + (rw - 4) * progress, y + 2], [x + 2 + (rw - 4) * progress, y + rh - 2], [x + 2, y + rh - 2]], '#8b3a3a');
  ctx.fillStyle = '#f3e6c8';
  ctx.font = '11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(done ? 'all off' : 'the walk', w * 0.5, y - 6);
}

function grain(ctx, w, h) {
  ctx.save();
  ctx.globalAlpha = 0.045;
  for (let i = 0; i < 52; i++) {
    ctx.fillStyle = i % 2 ? '#fff6dc' : '#1a120c';
    ctx.fillRect(((i * 97) % 100) / 100 * w, ((i * 53) % 100) / 100 * h, 16, 2);
  }
  ctx.restore();
}

function warpFor(beatId) {
  if (beatId === 'corridor') return 1;
  if (beatId === 'tilt') return 0.7;
  if (beatId === 'barrel') return 0.35;
  if (beatId === 'mirrors') return 0.45;
  return 0.2;
}

export default {
  title: 'Funhouse',
  intro: 'Juno twirls her little comedy mask at the painted mouth. “Pennies stay pocketed, loves — this house walks you. Mirrors fib, floors fib, the barrel tells fibs in stripes. Keep to the moving boards. The far door is the only honest thing in the place.”',

  create() {
    return {
      phase: 'riding',
      t: 0,
      progress: 0,
      beat: 'mouth',
      lean: 0,
      leanNow: 0,
      look: 0,
      guestWave: 0,
      spin: 0,
      gag: 0,
      note: NOTES.mouth,
      exitNote: 'All off — daylight, mind the step.',
      npcs: [
        Object.assign(npc('Pip', 'left', 'point', CAST.mouth.Pip.line), { pal: PAL.pip, wave: 1 }),
        Object.assign(npc('Marla', 'right', 'idle', CAST.mouth.Marla.line), { pal: PAL.marla, wave: 0 }),
        Object.assign(npc('Ned', 'ahead', 'gawk', CAST.mouth.Ned.line), { pal: PAL.ned, wave: 0 }),
      ],
    };
  },

  update(s, dt) {
    const finished = advanceTrip(s, dt, DURATION);
    s.spin = (s.spin || 0) + dt * (s.beat === 'barrel' ? 1.7 : 0.22);
    s.leanNow += ((s.lean || 0) - s.leanNow) * Math.min(1, dt * 5);
    s.lean += (0 - (s.lean || 0)) * Math.min(1, dt * 0.65);
    s.look += ((s.leanNow || 0) - (s.look || 0)) * Math.min(1, dt * 4);
    s.guestWave = Math.max(0, (s.guestWave || 0) - dt * 1.35);
    for (const n of s.npcs) n.wave = Math.max(0, (n.wave || 0) - dt * 1.05);
    if (s.beat === 'gag') s.gag = Math.min(1, (s.gag || 0) + dt * 1.6);
    else s.gag = Math.max(0, (s.gag || 0) - dt * 2.2);
    applyBeat(s);
    if (finished) {
      s.note = s.exitNote;
      for (const n of s.npcs) { n.look = 'wave'; n.wave = 1; }
    }
  },

  pointer(s, type, pos) {
    if (type !== 'down' || s.phase !== 'riding' || !pos) return;
    const w = s._w || 900;
    const nx = pos.x / w - 0.5;
    s.lean = Math.max(-1, Math.min(1, nx * 2.2));
    s.look = s.lean;
    s.guestWave = 1;
    const seats = { left: 0.30, ahead: 0.50, right: 0.72 };
    let best = null, bestD = 1;
    for (const n of s.npcs) {
      const d = Math.abs((seats[n.seat] ?? 0.5) - pos.x / w);
      if (d < bestD) { bestD = d; best = n; }
    }
    if (best && bestD < 0.22) {
      best.wave = 1;
      best.look = 'wave';
    }
  },

  draw(s, d) {
    const ctx = d.ctx;
    const w = d.w || 900;
    const h = d.h || 1200;
    s._w = w;
    s._h = h;
    const pal = ROOM[s.beat] || ROOM.corridor;
    const tilt = s.beat === 'tilt' ? Math.sin(s.t * 1.35) * 0.16 : s.leanNow * 0.04;
    const open = easeInOut(Math.max(0, Math.min(1, (s.progress - 0.92) / 0.08)));

    ctx.save();
    ctx.fillStyle = pal.ceil;
    ctx.fillRect(0, 0, w, h);

    ctx.translate(w * 0.5, h * 0.82);
    ctx.rotate(tilt);
    ctx.translate(-w * 0.5, -h * 0.82);

    const cam = tunnel(ctx, w, h, s, pal, warpFor(s.beat), s.spin);
    clownMouth(ctx, cam.vx, cam.vy, 1, Math.max(0, 1 - s.progress / 0.16));
    if (s.progress > 0.86) exitDoor(ctx, cam, open);
    drawMirrors(ctx, w, h, s, cam);
    if (s.beat === 'gag' || s.gag > 0.02) jumpClown(ctx, w, h, s);
    cart(ctx, w, h, s);

    const order = ['ahead', 'left', 'right'];
    for (const seat of order) {
      const n = s.npcs.find(p => p.seat === seat);
      if (!n) continue;
      const xy = seatOf(n.seat, w, h, s.leanNow);
      const st = styleOf(n.name);
      const barrelSquash = s.beat === 'barrel' ? 1 + Math.sin(s.spin * 2 + st.phase) * 0.12 : 1;
      person(ctx, xy.x, xy.y, xy.s, st.pal, riderPose(n, s, {
        phase: st.phase, hat: st.hat, stripes: st.stripes, dress: st.dress,
        sx: s.beat === 'barrel' ? 1 / barrelSquash : 1,
        sy: s.beat === 'barrel' ? barrelSquash : 1,
      }));
      nameplate(ctx, xy.x, xy.y + 10, n.name);
    }

    const gxy = seatOf('guest', w, h, s.leanNow);
    const gst = styleOf('guest');
    person(ctx, gxy.x, gxy.y, gxy.s, gst.pal, {
      look: s.guestWave > 0.15 ? 'wave' : 'idle',
      wave: s.guestWave,
      t: s.t,
      lean: s.leanNow * 0.28 + s.look * 0.08,
      phase: gst.phase,
      face: 'back',
    });
    nameplate(ctx, gxy.x, gxy.y + 12, 'you');

    const talker = s.npcs.find(n => n.name === LEAD[s.beat]) || s.npcs[0];
    if (talker?.line) {
      const xy = seatOf(talker.seat, w, h, s.leanNow);
      bubble(ctx, xy.x, xy.y, talker.name, talker.line, talker.seat === 'right' ? 'right' : 'left');
    }

    ctx.restore();

    marquee(ctx, w, s.beat);
    rail(ctx, w, h, s.progress, s.phase === 'done');
    grain(ctx, w, h);

    const vg = ctx.createRadialGradient(w * 0.5, h * 0.42, h * 0.16, w * 0.5, h * 0.5, h * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(12,8,8,0.5)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);

    if (s.phase === 'done') {
      ctx.fillStyle = 'rgba(20,14,10,0.22)';
      ctx.fillRect(0, 0, w, h);
      paperPoly(ctx, [[w * 0.5 - 170, h * 0.44], [w * 0.5 + 170, h * 0.44], [w * 0.5 + 158, h * 0.56], [w * 0.5 - 158, h * 0.56]], '#f3e6c8', '#c9a15b');
      ctx.fillStyle = '#6b2c2c';
      ctx.font = '22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('All off — mind the step.', w * 0.5, h * 0.515);
    }
  },

  readout(s) {
    const who = (s.npcs || []).find(n => n.line);
    const line = who ? who.name + ': ' + who.line : '';
    return (s.note || '') + (line ? ' · ' + line : '');
  },
};
