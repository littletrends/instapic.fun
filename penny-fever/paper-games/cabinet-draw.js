export const W = 900, H = 1200, TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const lerp = (a, b, t) => a + (b - a) * t;
export function seeded(seed = 41) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
export function done(s, title, detail, extra = {}) {
  s.result = { title, detail, ...extra };
}
export class Draw {
  constructor(canvas) {
    this.canvas = canvas;
    this.c = canvas.getContext("2d");
    if (!this.c) throw Error("Canvas is unavailable.");
    this.art = {};
    this.resize(450, 600, 1);
  }
  resize(w, h, r = 1) {
    this.cssWidth = w;
    this.cssHeight = h;
    r = clamp(r, 1, 2);
    this.canvas.width = Math.max(1, Math.round(w * r));
    this.canvas.height = Math.max(1, Math.round(h * r));
  }
  clear() {
    const c = this.c;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.setTransform(this.canvas.width / W, 0, 0, this.canvas.height / H, 0, 0);
    c.lineCap = "round";
    c.lineJoin = "round";
  }
  text(text, x, y, size = 20, color = "#fff0cb", align = "center") {
    const c = this.c;
    size = Math.max(size, 12 * 900 / (this.cssWidth || 450), 12 * 1200 / (this.cssHeight || 600));
    c.font = `600 ${size}px Georgia,serif`;
    c.textAlign = align;
    c.fillStyle = color;
    const hex = /^#[0-9a-f]{6}$/i.test(color) ? color.slice(1) : null;
    const light = hex ? (parseInt(hex.slice(0, 2), 16) * .299 + parseInt(hex.slice(2, 4), 16) * .587 + parseInt(hex.slice(4, 6), 16) * .114) > 145 : true;
    c.save();
    c.strokeStyle = light ? "#241820d9" : "#fff3ddd9";
    c.lineWidth = Math.max(2, size * .10);
    const maxW = align === "center" ? Math.max(100, Math.min(x, 900 - x) * 2 - 20) : Math.max(100, 900 - x - 20);
    c.strokeText(String(text), x, y, maxW);
    c.restore();
    c.fillText(String(text), x, y, maxW);
  }
  glow(x, y, r, color = "#edcd8b") {
    const g = this.c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color + "55");
    g.addColorStop(1, color + "00");
    this.circle(x, y, r, g);
  }
  circle(x, y, r, fill, stroke = null, width = 1) {
    const c = this.c;
    c.beginPath();
    c.arc(x, y, Math.max(0, r), 0, TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  sprite(img, x, y, opts = {}) {
    if (!img) return false;
    const w = opts.w || img.width, h = opts.h || w * (img.height || 1) / (img.width || 1);
    const c = this.c;
    c.save();
    c.globalAlpha = opts.alpha ?? 1;
    c.translate(x, y);
    if (opts.angle) c.rotate(opts.angle);
    if (opts.flip) c.scale(-1, 1);
    c.drawImage(img, -w / 2, -h / 2, w, h);
    c.restore();
    return true;
  }
  wrap(text, x, y, size, color, maxW, lineGap = 8) {
    const c = this.c;
    c.font = `500 ${size}px Georgia,serif`;
    const words = String(text).split(" ");
    let line = "", ly = y;
    for (const word of words) {
      const trial = line ? line + " " + word : word;
      if (line && c.measureText(trial).width > maxW) {
        this.text(line, x, ly, size, color);
        line = word;
        ly += size + lineGap;
      } else line = trial;
    }
    if (line) this.text(line, x, ly, size, color);
    return ly;
  }
  dispose() {
    this.canvas.width = 1;
    this.canvas.height = 1;
    this.art = null;
  }
}
