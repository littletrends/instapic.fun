import { WORLD, SHORE, COURSES, JET_RANGE, gatePose, ferryPose, allLetters } from './model.js';

// Code-native articulated paper props, drawn over a separate illustrated plate.
// One Canvas2D surface; no WebGL, libraries, render loop or listeners in this module.
export class HarbourScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    if (!this.ctx) throw new Error('Canvas 2D is unavailable in this browser.');
    this.rings = []; this.wake = []; this.confetti = [];
    this.lastWake = 0; this.lastTime = 0;
    this.resize(600, 800, 1);
  }
  resize(width, height, ratio = 1) {
    const dpr = Math.min(1.5, Math.max(1, ratio));
    this.canvas.width = Math.max(1, Math.round(width * dpr));
    this.canvas.height = Math.max(1, Math.round(height * dpr));
    this.sx = this.canvas.width / WORLD.width;
    this.sy = this.canvas.height / WORLD.height;
  }
  clearEffects() { this.rings = []; this.wake = []; this.confetti = []; this.lastWake = 0; }
  event(e, t) {
    this.rings.push({ ...e, t });
    this.rings = this.rings.slice(-16);
    if (e.type === 'won') this.confetti = Array.from({ length: 34 }, (_, i) => ({
      x: e.x, y: e.y, vx: Math.cos(i * 2.4) * (70 + i * 3),
      vy: -70 - (i % 7) * 34, t, spin: i * 1.7, color: ['#efd39a', '#eb9981', '#bbe2d3'][i % 3],
    }));
  }
  ellipse(x, y, rx, ry, fill, stroke = null, lw = 1) {
    const c = this.ctx; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
  }
  line(a, b, color, width = 1) {
    const c = this.ctx; c.beginPath(); c.moveTo(...a); c.lineTo(...b);
    c.lineWidth = width; c.strokeStyle = color; c.stroke();
  }
  polygon(points, fill, stroke = null, lw = 1) {
    const c = this.ctx; c.beginPath(); points.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.closePath();
    c.fillStyle = fill; c.fill();
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
  }
  label(text, x, y, size = 18, color = '#123d43') {
    const c = this.ctx; c.fillStyle = color; c.textAlign = 'center';
    c.font = `700 ${size}px Georgia, serif`; c.fillText(text, x, y);
  }
  water(t, reduced) {
    const c = this.ctx;
    c.save(); c.beginPath(); SHORE.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.closePath(); c.clip();
    // Sparse moving caustics: no offscreen buffers, filters or full-water simulation.
    for (let i = 0; i < 68; i++) {
      const x = 190 + (i * 97.31) % 550;
      const y = 220 + (i * 149.7) % 830;
      const phase = reduced ? i : t * .75 + i * 2.3;
      c.globalAlpha = .1 + (Math.sin(phase) + 1) * .075;
      c.beginPath(); c.ellipse(x + Math.sin(phase) * 6, y, 8 + i % 16, 2, -.3, .1, 2.5);
      c.strokeStyle = '#f2ffe6'; c.lineWidth = 1.6; c.stroke();
    }
    c.restore();
    // Deliberately visible inner-bank buoys agree with the collision shoreline.
    for (let i = 0; i < SHORE.length; i++) {
      const a = SHORE[i], b = SHORE[(i + 1) % SHORE.length];
      c.save(); c.globalAlpha = .24; c.setLineDash([2, 10]);
      this.line(a, b, '#effcdb', 2); c.restore();
      this.ellipse(a[0], a[1] + 3, 6, 3, '#06485355');
      this.ellipse(a[0], a[1], 4, 4, '#c4dfc5', '#f8ebba', 1);
    }
  }
  island(x, y, r, n) {
    const c = this.ctx;
    this.ellipse(x + 8, y + 12, r + 9, r * .88, '#07475235');
    const silhouette = Array.from({ length: 14 }, (_, i) => {
      const a = i / 14 * Math.PI * 2, rr = r * (1 + Math.sin(i * 3.1 + n) * .04);
      return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
    });
    this.polygon(silhouette.map(([a, b]) => [a, b + 10]), '#8c7050', '#755634', 2);
    this.polygon(silhouette, '#d9bd88', '#f4ddb3', 3);
    this.ellipse(x, y - 4, r * .83, r * .79, '#667e58', '#c0b380', 3);
    for (let i = 0; i < 10; i++) {
      const a = i * 2.399, rr = Math.sqrt((i + 1) / 12) * r * .7;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr - 5;
      this.ellipse(px, py, 8, 3, i % 2 ? '#8c9a64' : '#a2af76');
    }
    // A folded-paper palm, with a cast shadow and individually creased leaves.
    c.save(); c.translate(x, y - 8);
    this.line([2, 6], [16, -50], '#554e313b', 8);
    this.line([0, 5], [-6, -53], '#8c6545', 8);
    this.line([-2, 5], [-8, -53], '#d4b783', 3);
    for (let i = 0; i < 7; i++) {
      const a = i * Math.PI * 2 / 7 + n;
      const end = [-7 + Math.cos(a) * r * .67, -55 + Math.sin(a) * r * .34];
      const m = [-7 + Math.cos(a + .3) * r * .38, -60 + Math.sin(a + .3) * r * .25];
      this.polygon([[-7, -55], m, end, [m[0] - 7, m[1] + 8]], i % 2 ? '#476957' : '#85985f', '#b9b582', 1);
      this.line([-7, -55], end, '#ccb985', 1);
    }
    c.restore();
  }
  letter(x, y, i, t, collected, reduced) {
    if (collected) return;
    const c = this.ctx, bob = reduced ? 0 : Math.sin(t * 2.4 + i) * 3;
    this.ellipse(x, y + 10, 28, 10, '#16576135');
    this.ellipse(x, y + 10, 34 + Math.sin(t * 2 + i) * 3, 12, null, '#d4fff280', 1.5);
    c.save(); c.translate(x, y + bob); c.rotate(Math.sin(t + i) * .05);
    this.ellipse(0, 3, 25, 18, '#b39767', '#f3d999', 3);
    this.polygon([[-20, -9], [19, -9], [20, 14], [-20, 14]], '#f3e6c6', '#fff5dc', 1.6);
    this.polygon([[-20, -9], [0, 6], [19, -9]], '#dfd1ad', '#b59a6d', 1);
    this.ellipse(0, 4, 5, 5, '#c1695f', '#f5b597', 1);
    this.line([20, 4], [22, -47], '#ac8050', 2.5);
    this.polygon([[22, -47], [46, -43], [22, -28]], '#d06e60', '#f9c793', 1);
    this.label(String(i + 1), 31, -34, 13, '#fff6d9');
    c.restore();
  }
  dock(g, t, reduced) {
    const c = this.ctx, [x, y] = COURSES[g.course].dock, unlocked = allLetters(g);
    this.ellipse(x, y + 3, 53, 43, unlocked ? '#ffdb9125' : '#13494b20');
    c.save(); c.setLineDash([5, 6]); c.lineDashOffset = reduced ? 0 : -t * 7;
    this.ellipse(x, y, 51, 43, null, unlocked ? '#ffe3a6' : '#b0d8c0', 3); c.restore();
    // U-shaped brass mooring: an open entrance at the bottom of the berth.
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    for (const [color, width, off] of [['#0d3b4455', 12, 7], ['#8f7045', 9, 0], ['#e5ba71', 5, -2]]) {
      c.beginPath(); c.moveTo(x - 46, y + 16 + off); c.lineTo(x - 46, y - 36 + off);
      c.quadraticCurveTo(x, y - 52 + off, x + 46, y - 36 + off); c.lineTo(x + 46, y + 16 + off);
      c.strokeStyle = color; c.lineWidth = width; c.stroke();
    }
    c.restore();
    this.label(unlocked ? 'POST HERE' : 'COLLECT ALL 3', x, y - 69, 17, '#fff4d6');
    if (g.dockTime > 0) {
      c.beginPath(); c.arc(x, y, 59, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, g.dockTime / 1.1));
      c.strokeStyle = '#ffe2a0'; c.lineWidth = 5; c.stroke();
    }
  }
  gates(g) {
    const pose = gatePose(g), c = this.ctx;
    for (const arm of pose.arms) {
      this.line([arm.a[0] + 5, arm.a[1] + 9], [arm.b[0] + 5, arm.b[1] + 9], '#0b394b45', 26);
      this.line(arm.a, arm.b, '#644f3d', 25);
      this.line(arm.a, arm.b, '#e5bc82', 22);
      c.save(); c.setLineDash([22, 17]); this.line(arm.a, arm.b, '#bc6456', 17); c.restore();
      this.line([arm.a[0], arm.a[1] - 7], [arm.b[0], arm.b[1] - 7], '#ffe3ac', 2);
      this.ellipse(...arm.a, 22, 19, '#624f3f', '#eac58c', 4);
      this.ellipse(arm.a[0], arm.a[1] - 6, 12, 10, '#e7ba72', '#ffe5aa', 2);
      this.ellipse(...arm.b, 10, 10, pose.open > .48 ? '#c7e3a3' : '#d16750', '#f0cf8f', 2);
    }
  }
  eddy(t) {
    const c = this.ctx; c.save(); c.translate(465, 753); c.rotate(t * .4);
    for (let i = 0; i < 8; i++) {
      c.rotate(Math.PI / 4); c.beginPath(); c.moveTo(25, 0);
      c.bezierCurveTo(90, -35, 140, -18, 128, 45);
      c.strokeStyle = '#d7ffe335'; c.lineWidth = 3; c.stroke();
    }
    c.restore();
  }
  hull(x, y, angle, scale = 1, ferry = false) {
    const c = this.ctx; c.save(); c.translate(x, y); c.rotate(angle); c.scale(scale, scale);
    const shape = () => {
      c.beginPath(); c.moveTo(35, 0); c.bezierCurveTo(20, -22, -7, -23, -29, -14);
      c.quadraticCurveTo(-34, 0, -29, 14); c.bezierCurveTo(-7, 23, 20, 22, 35, 0); c.closePath();
    };
    c.save(); c.translate(2, 7); shape(); c.fillStyle = '#193d3c'; c.fill(); c.restore();
    shape(); c.fillStyle = ferry ? '#974d43' : '#174f54'; c.fill();
    c.strokeStyle = '#eac389'; c.lineWidth = 3; c.stroke();
    c.save(); c.scale(.82, .72); shape(); c.fillStyle = '#bd9a6b'; c.fill(); c.strokeStyle = '#f3d396'; c.lineWidth = 2; c.stroke(); c.restore();
    for (let j = -2; j <= 2; j++) this.line([-23, j * 3], [18, j * 3], '#70594180', .8);
    for (const xx of [-17, 0, 17]) this.line([xx, -12], [xx, 12], '#d9bf91', 3);
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI * 2 / 10;
      this.ellipse(Math.cos(a) * 25, Math.sin(a) * 14, 1, 1, '#ffe4a7');
    }
    c.restore();
  }
  ferry(g, t, reduced) {
    const f = ferryPose(g), c = this.ctx, bob = reduced ? 0 : Math.sin(t * 2) * 1.2;
    this.ellipse(f.x + 8, f.y + 16, 67, 29, '#113f4940');
    this.hull(f.x, f.y, f.vx < 0 ? Math.PI : 0, 1.7, true);
    c.save(); c.translate(f.x, f.y + bob);
    for (const x of [-28, 28]) this.line([x, 7], [x, -29], '#75533f', 4);
    this.polygon([[-36, -27], [-30, -46], [30, -46], [36, -27]], '#e2b685', '#f6dbad', 2);
    for (let i = 0; i < 6; i++) this.polygon([[-30 + i * 10, -46], [-36 + i * 12, -27], [-30 + i * 12, -27], [-25 + i * 10, -46]], i % 2 ? '#b8574c' : '#e9d6ab');
    this.label('POST', 0, -31, 11, '#503f30');
    this.ellipse(-39, 8, 10, 10, '#efe1b5', '#cb715a', 3);
    c.restore();
  }
  boat(g, t, reduced) {
    const b = g.boat, c = this.ctx;
    const bob = reduced ? 0 : Math.sin(t * 2.7) * 1.6;
    const heel = reduced ? 0 : b.roll * 14;
    this.ellipse(b.x + 8, b.y + 14, 32, 16, '#0a435051');
    this.hull(b.x, b.y + bob, b.angle, 1);
    // Mast remains upright in screen space; hull heading never flips the artwork.
    c.save(); c.translate(b.x, b.y + bob); c.transform(1, 0, heel / 60, 1, 0, 0);
    this.line([0, 4], [0, -70], '#6b4f32', 4);
    this.line([-1, 4], [-1, -70], '#ebc581', 1.5);
    const billow = reduced ? 0 : Math.sin(t * 4) * 2;
    c.beginPath(); c.moveTo(1, -67); c.bezierCurveTo(11, -56, 24 + billow, -32, 24, -18);
    c.quadraticCurveTo(14, -12, 2, -17); c.closePath();
    c.fillStyle = '#eee0b9'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#fff4cf'; c.stroke();
    this.polygon([[2, -42], [16 + billow / 2, -40], [20 + billow / 2, -31], [2, -33]], '#2f7176');
    this.polygon([[2, -29], [22, -27], [23, -24], [2, -26]], '#c06d5a');
    this.polygon([[-3, -61], [-22, -20], [-3, -15]], '#d8caab', '#f3e9c9', 1.3);
    this.line([-22, -20], [-3, -18], '#ad925e', 1);
    this.polygon([[0, -71], [20, -67 + billow], [15, -61 + billow], [0, -62]], '#b64c4a', '#f8bb8d', 1);
    this.label('♥', 8, -63, 7, '#ffe3b1');
    this.ellipse(-25, 5, 5, 5, '#efe0af', '#bf7859', 2);
    c.restore();
  }
  spray(g, pointer, t, reduced) {
    const c = this.ctx;
    if (pointer && g.phase === 'playing') {
      const d = Math.hypot(g.boat.x - pointer.x, g.boat.y - pointer.y);
      const valid = d < JET_RANGE && d > 6;
      this.ellipse(pointer.x, pointer.y, 12, 8, '#185e6650', valid ? '#fff0c6' : '#c3d3b9', 2);
      if (!g.jet && valid) {
        c.save(); c.setLineDash([2, 7]); this.line([pointer.x, pointer.y], [g.boat.x, g.boat.y], '#f6edbf7a', 1.5); c.restore();
      }
    }
    if (!g.jet) return;
    const j = g.jet, dx = j.tx - j.x, dy = j.ty - j.y;
    c.beginPath(); c.moveTo(j.x, j.y);
    c.quadraticCurveTo((j.x + j.tx) / 2, (j.y + j.ty) / 2 - 32, j.tx, j.ty);
    c.strokeStyle = '#dcfff084'; c.lineWidth = 7; c.stroke();
    c.strokeStyle = '#f4fff0b0'; c.lineWidth = 2; c.stroke();
    for (let i = 0; i < 18; i++) {
      const f = reduced ? i / 18 : (i / 18 + t * 2.3) % 1;
      const scatter = Math.sin(i * 5.8 + t * 3) * f * 7;
      this.ellipse(j.x + dx * f + scatter, j.y + dy * f - 128 * f * (1 - f), 1.4 + f, 1.4 + f, '#e6fff0b8');
    }
    this.ellipse(j.tx, j.ty, 21, 10, null, '#eaffd780', 2);
  }
  effects(t, reduced) {
    const c = this.ctx;
    this.rings = this.rings.filter(e => t - e.t < 1.4);
    this.wake = this.wake.filter(e => t - e.t < 2);
    for (const w of this.wake) {
      const age = t - w.t; c.save(); c.globalAlpha = (1 - age / 2) * .35;
      this.ellipse(w.x, w.y, 14 + age * 15, 5 + age * 5, null, '#edffdd', 1.5); c.restore();
    }
    for (const r of this.rings) {
      const age = t - r.t; c.save(); c.globalAlpha = Math.max(0, 1 - age / 1.4);
      this.ellipse(r.x, r.y, 10 + age * 40, 5 + age * 18, null, '#fff1bd', 3);
      if (r.type === 'letter') this.label('A LETTER ABOARD!', r.x, r.y - 30 - age * 30, 16, '#fff2cc');
      if (r.type === 'bump') this.label('easy does it…', r.x, r.y - 70 - age * 15, 15, '#fff2cc');
      c.restore();
    }
    this.confetti = this.confetti.filter(p => t - p.t < 2.8);
    if (!reduced) for (const p of this.confetti) {
      const age = t - p.t; c.save(); c.globalAlpha = Math.max(0, 1 - age / 2.8);
      c.translate(p.x + p.vx * age, p.y + p.vy * age + 100 * age * age);
      c.rotate(p.spin + age * 3); c.fillStyle = p.color; c.fillRect(-3, -6, 6, 12); c.restore();
    }
  }
  render(g, { time = 0, pointer = null, reduced = false } = {}) {
    const c = this.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.setTransform(this.sx, 0, 0, this.sy, 0, 0); c.lineCap = 'round'; c.lineJoin = 'round';
    const course = COURSES[g.course];
    this.water(time, reduced); this.dock(g, time, reduced);
    if (course.eddy) this.eddy(reduced ? 0 : time);
    if (!reduced && g.phase === 'playing' && Math.hypot(g.boat.vx, g.boat.vy) > 12 && time - this.lastWake > .12) {
      this.wake.push({ x: g.boat.x, y: g.boat.y, t: time }); this.wake = this.wake.slice(-20); this.lastWake = time;
    }
    this.effects(time, reduced);
    // Painter's order: an upstream sail passes behind a lower island/palm.
    const objects = course.islands.map(([x, y, r], i) => ({ y, draw: () => this.island(x, y, r, i) }));
    course.letters.forEach(([x, y], i) => objects.push({ y, draw: () => this.letter(x, y, i, time, g.letters[i], reduced) }));
    if (course.gate) objects.push({ y: 515, draw: () => this.gates(g) });
    if (course.ferry) objects.push({ y: 622, draw: () => this.ferry(g, time, reduced) });
    objects.push({ y: g.boat.y, draw: () => this.boat(g, time, reduced) });
    objects.sort((a, b) => a.y - b.y).forEach(o => o.draw());
    this.spray(g, pointer, time, reduced);
    if (g.phase === 'ready') {
      this.label('YOUR LITTLE SAILBOAT', g.boat.x, g.boat.y + 57, 18, '#fff1cc');
      this.line([g.boat.x, g.boat.y + 37], [g.boat.x, g.boat.y + 24], '#fff1cc', 2);
    }
  }
  dispose() { this.clearEffects(); this.canvas.width = 1; this.canvas.height = 1; }
}
