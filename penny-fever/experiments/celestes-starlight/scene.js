import { WORLD, CHAPTERS, mirrorEnds, pointOnRay } from './model.js';
export const GLASS_NAMES = ['I', 'II', 'III', 'IV', 'V'];

// Page-owned Canvas2D props over a static art layer. No internal loop or network.
export class Observatory {
  constructor(canvas) {
    this.canvas = canvas; this.c = canvas.getContext('2d');
    if (!this.c) throw new Error('This browser cannot open the paper observatory.');
    this.resize(450, 600, 1);
  }
  resize(w, h, ratio = 1) {
    const r = Math.max(1, Math.min(1.5, ratio));
    this.canvas.width = Math.max(1, Math.round(w * r)); this.canvas.height = Math.max(1, Math.round(h * r));
    this.sx = this.canvas.width / WORLD.width; this.sy = this.canvas.height / WORLD.height;
  }
  line(a, b, colour, width = 1) {
    const c = this.c; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.strokeStyle = colour; c.lineWidth = width; c.stroke();
  }
  ellipse(x, y, rx, ry, fill, stroke, width = 1) {
    const c = this.c; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  poly(points, fill, stroke, width = 1) {
    const c = this.c; c.beginPath(); points.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.closePath();
    c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  text(str, x, y, size = 16, colour = '#f2d7a0') {
    const c = this.c; c.font = `500 ${size}px Georgia, serif`; c.textAlign = 'center'; c.fillStyle = colour; c.fillText(str, x, y);
  }
  star(x, y, radius, fill, stroke = '#f6ddb0') {
    const points = Array.from({ length: 10 }, (_, i) => {
      const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? radius * .46 : radius;
      return [x + Math.cos(a) * r, y + Math.sin(a) * r];
    });
    this.poly(points, fill, stroke, 1.4);
  }
  halo(x, y, radius, colour = '#eec981') {
    const c = this.c, grad = c.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, colour + '38'); grad.addColorStop(1, colour + '00');
    this.ellipse(x, y, radius, radius, grad);
  }
  mirror(p, angle, index, selected, time, reduced) {
    const c = this.c, [x, y] = p;
    this.ellipse(x + 8, y + 17, 60, 23, '#020c275c');
    this.ellipse(x, y + 9, 57, 49, '#5b4742', '#b38c56', 2);
    this.ellipse(x, y, 57, 49, '#172c50', '#e0b773', 3);
    this.ellipse(x, y, 48, 41, '#324961', '#8c846d', 1.5);
    // Eight physical detents, matching the eight meaningful reflection angles.
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8;
      this.line([x + Math.cos(a) * 51, y + Math.sin(a) * 44], [x + Math.cos(a) * 55, y + Math.sin(a) * 48], '#d9b67f', 1);
    }
    if (selected) {
      this.ellipse(x, y, 66, 59, null, '#a5e4ee', 2);
      const swing = reduced ? 0 : Math.sin(time * 2) * 2;
      c.save(); c.translate(x + 68, y + swing);
      this.poly([[0, -6], [7, 0], [0, 6]], '#d7f4e8'); c.restore();
    }
    // The luminous glass line is the actual reflecting plane; no hidden collider.
    const [a, b] = mirrorEnds(p, angle);
    this.line([a[0] + 2, a[1] + 9], [b[0] + 2, b[1] + 9], '#06122670', 20);
    this.line(a, b, '#bd975c', 19); this.line(a, b, '#a0d7e6', 12);
    this.line([a[0], a[1] - 2], [b[0], b[1] - 2], '#effff9', 2.5);
    for (const end of [a, b]) { this.ellipse(...end, 8, 8, '#cda768', '#f1ddb2', 2); this.ellipse(...end, 2, 2, '#765e49'); }
    this.text(GLASS_NAMES[index], x, y + 82, 21, selected ? '#d9ffff' : '#edce91');
  }
  telescope(p, time, reduced) {
    const c = this.c, [x, y] = p;
    this.ellipse(x + 9, y + 37, 59, 25, '#00091f69');
    this.ellipse(x, y + 30, 43, 20, '#483f40', '#d1a76c', 3);
    for (const dx of [-29, 0, 29]) this.line([x, y + 6], [x + dx, y + 29], '#d1ad76', 5);
    this.line([x - 17, y + 18], [x + 17, y + 18], '#ebcc96', 3);
    c.save(); c.translate(x, y - 7);
    this.poly([[-14, 33], [-20, -10], [-18, -20], [18, -20], [20, -10], [14, 33]], '#957748', '#f2d3a1', 2);
    this.poly([[-9, 32], [-12, -12], [-3, -12], [1, 32]], '#dec18b');
    this.ellipse(0, -18, 22, 9, '#ccad7b', '#ffe0a1', 3);
    this.ellipse(0, -18, 16, 6, '#b7e9ee', '#efffff', 2);
    c.restore(); this.halo(x, y - 25, reduced ? 40 : 45 + Math.sin(time * 3) * 4, '#b1e4ff');
    this.text('CELESTE’S STARLIGHT', x, y + 68, 14);
  }
  stars(g, time, reduced) {
    const c = CHAPTERS[g.chapter];
    c.stars.forEach(([x, y], i) => {
      const lit = g.ray.lit[i], bob = reduced ? 0 : Math.sin(time * 2 + i) * 1.5;
      this.ellipse(x + 4, y + 12, 23, 8, '#060b2340');
      this.ellipse(x, y, 27, 27, '#16244788', lit ? '#e8ce9180' : '#879bad88', 1);
      if (lit) this.halo(x, y, 49, '#ffda8a');
      this.star(x, y + bob, lit ? 20 : 18, lit ? '#f4d692' : '#54677f', lit ? '#fff1c9' : '#a1adb2');
      this.line([x, y + bob - 16], [x, y + bob + 9], lit ? '#fff0c0' : '#81949f', .8);
    });
  }
  moon([x, y, r]) {
    const c = this.c;
    this.ellipse(x + 10, y + 16, r + 5, r * .95, '#050b2666');
    this.ellipse(x, y + 6, r, r, '#877954', '#d9c599', 2);
    const grad = c.createLinearGradient(x - r, y - r, x + r, y + r);
    grad.addColorStop(0, '#f1dfb2'); grad.addColorStop(1, '#a5aa9f');
    this.ellipse(x, y, r, r, grad, '#ffebc0', 2);
    for (const [dx, dy, rr] of [[-23, -22, 13], [17, -9, 7], [7, 28, 15], [-31, 20, 6], [36, 21, 6]]) {
      this.ellipse(x + dx, y + dy, rr, rr * .86, '#8190a445', '#f6e9c655', 2);
    }
    this.text('THE MOON’S SHADOW', x, y + r + 31, 14, '#d9d3ba');
  }
  receiver(g, time, reduced) {
    const [x, y] = CHAPTERS[g.chapter].receiver;
    const open = g.ray.receiverLit, c = this.c;
    this.ellipse(x + 4, y + 14, 40, 13, '#00091f50');
    if (open) this.halo(x, y, 75);
    this.ellipse(x, y, 38, 38, '#121f3ecc', '#caac6f', 3);
    c.save(); c.translate(x, y); c.rotate(reduced ? 0 : time * .13);
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      this.line([Math.cos(a) * 32, Math.sin(a) * 32], [Math.cos(a) * 41, Math.sin(a) * 41], '#dbc894', 2);
    }
    c.restore(); this.star(x, y, 26, open ? '#ffe8a6' : '#635e68', '#f1cf8f');
    this.ellipse(x, y, 7, 7, open ? '#fffbd8' : '#172440', '#e0d19f', 2);
    this.text('SKY BELL', x, y - 56, 15, '#e3dcbb');
  }
  beam(g, time, reduced) {
    const c = this.c, ray = g.phase === 'flying' ? g.frozenRay : g.ray;
    c.save(); c.globalAlpha = g.phase === 'won' ? .14 : .85;
    for (const s of ray.segments) {
      this.line(s.a, s.b, '#a3d7ed16', 15); this.line(s.a, s.b, '#c5edf44a', 6); this.line(s.a, s.b, '#eef9d8', 1.6);
      if (!reduced && g.phase !== 'won') {
        const f = (time * .3 + .15) % 1;
        this.ellipse(s.a[0] + (s.b[0] - s.a[0]) * f, s.a[1] + (s.b[1] - s.a[1]) * f, 2, 2, '#fffbe9');
      }
    }
    c.restore();
    if (g.phase === 'flying') {
      for (let i = 12; i >= 0; i--) {
        const p = pointOnRay(ray, Math.max(0, g.flight - i * 9));
        this.ellipse(...p, 1.5 + (12 - i) / 3, 1.5 + (12 - i) / 3, `rgba(255,225,155,${(1 - i / 13) * .7})`);
      }
      const p = pointOnRay(ray, g.flight); this.halo(...p, 60); this.star(...p, 12, '#fffce3');
    }
  }
  creature(g, time, reduced) {
    const c = this.c; c.save(); c.translate(450, 580);
    const motion = reduced ? 0 : Math.sin(time * 2) * 4;
    c.translate(0, motion); this.halo(0, 0, 145);
    this.ellipse(0, 65, 90, 18, '#030b2935');
    this.ellipse(0, 0, 131, 105, null, '#dfc38760', 1);
    const cream = '#e9ddbd', blue = '#769ab7', edge = '#f3d895';
    if (g.chapter === 0) {
      // A folded swallow, with separately creased wing planes.
      this.poly([[-6, 16], [-105, -55 - motion], [-73, 11], [-28, 32]], blue, edge, 2);
      this.poly([[7, 16], [105, -65 + motion], [70, 17], [24, 33]], '#afc2ca', edge, 2);
      this.poly([[-15, -8], [-26, 58], [0, 45], [25, 59], [17, -7], [0, -26]], cream, edge, 2);
      this.poly([[8, -18], [39, -22], [14, -7]], '#bda16d', edge, 1);
      this.line([-6, 16], [-105, -55 - motion], '#f8e5b2', 1); this.ellipse(8, -13, 2, 2, '#253755');
    } else if (g.chapter === 1) {
      this.poly([[-24, 35], [-90, 58], [-111, 19], [-49, 32]], blue, edge, 2);
      this.poly([[-30, -6], [-52, 56], [38, 56], [48, -2]], '#a0b3ba', edge, 2);
      this.poly([[-47, -40], [-64, -88], [-16, -56], [10, -56], [58, -88], [42, -28], [0, 5]], cream, edge, 2);
      this.poly([[-35, -26], [0, 5], [-9, -20]], '#769ab7'); this.poly([[35, -26], [0, 5], [9, -20]], '#9cb6c0');
      this.ellipse(-22, -30, 3, 3, '#233250'); this.ellipse(22, -30, 3, 3, '#233250'); this.ellipse(0, -1, 4, 3, '#304367');
    } else {
      this.poly([[-44, 13], [-68, 48], [-15, 62], [43, 40], [31, -6]], blue, edge, 2);
      this.poly([[-14, -17], [-40, -106], [-15, -110], [8, -23]], cream, edge, 2);
      this.poly([[10, -19], [31, -106], [50, -94], [30, -5]], '#a9c1c8', edge, 2);
      this.poly([[-22, -37], [-42, 1], [-15, 28], [26, 27], [45, 0], [19, -37]], cream, edge, 2);
      this.line([-25, -5], [-12, -1], '#42506b', 2); this.line([12, -1], [25, -5], '#42506b', 2);
      this.poly([[-5, 10], [5, 10], [0, 15]], '#b28679');
    }
    for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7; this.star(Math.cos(a) * 132, Math.sin(a) * 105, 5, '#e6d5a2'); }
    c.restore(); this.text(CHAPTERS[g.chapter].name.toUpperCase(), 450, 420, 21, '#fff0ce');
  }
  render(g, time = 0, reduced = false) {
    const c = this.c; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.setTransform(this.sx, 0, 0, this.sy, 0, 0); c.lineCap = 'round'; c.lineJoin = 'round';
    const chapter = CHAPTERS[g.chapter];
    this.beam(g, time, reduced);
    if (g.phase === 'won') {
      c.fillStyle = '#08153475'; c.fillRect(150, 290, 600, 810); this.creature(g, time, reduced); return;
    }
    chapter.moons.forEach(m => this.moon(m));
    this.stars(g, time, reduced); this.receiver(g, time, reduced);
    chapter.mirrors.forEach((p, i) => this.mirror(p, g.angles[i], i, g.selected === i, time, reduced));
    this.telescope(chapter.source, time, reduced);
    if (g.chapter === 0 && g.phase === 'playing' && g.turns === 0 && !g.gesture) {
      const p = chapter.mirrors[0]; this.text('TAP A GLASS TO TURN IT', p[0], p[1] - 105, 16, '#d0edf2');
    }
  }
  dispose() { this.canvas.width = 1; this.canvas.height = 1; }
}
