const TAU = Math.PI * 2;
const VIEW_NAMES = ['front', 'left', 'back', 'right'];
function viewName(angle, n = 4) {
  const count = Math.max(1, n || 4);
  const t = ((angle % TAU) + TAU) % TAU;
  const i = Math.round(t / (TAU / count)) % count;
  return count === 4 ? VIEW_NAMES[i] : (i + 1) + ' / ' + count;
}

export class Turntable {
  constructor(host) {
    this.host = host; this.dead = false; this.art = null; this.item = null;
    this.angle = 0; this.vel = 0; this.zoom = 1; this.grey = false; this.drag = null;
    this.onView = null; this._viewName = '';
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('aria-hidden', 'true');
    host.append(this.canvas);
    this.events = new AbortController();
    const signal = this.events.signal;
    host.addEventListener('pointerdown', e => {
      if (e.button !== 0 || this.dead) return;
      this.drag = {id: e.pointerId, x: e.clientX, last: e.clientX, t: performance.now()};
      this.vel = 0; host.setPointerCapture(e.pointerId); host.focus();
    }, {signal});
    host.addEventListener('pointermove', e => {
      if (this.drag?.id !== e.pointerId) return;
      const now = performance.now(), dt = Math.max(8, now - this.drag.t);
      const dx = e.clientX - this.drag.x;
      this.angle += dx * .014;
      this.vel = (e.clientX - this.drag.last) / dt * 16;
      this.drag.x = e.clientX; this.drag.last = e.clientX; this.drag.t = now;
      this.draw();
    }, {signal});
    const end = e => {
      if (this.drag?.id !== e.pointerId) return;
      this.drag = null; this.coast();
    };
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) host.addEventListener(ev, end, {signal});
    host.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); this.vel -= .08; this.coast(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); this.vel += .08; this.coast(); }
      if (e.key === 'Home') { e.preventDefault(); this.angle = 0; this.vel = 0; this.draw(); }
    }, {signal});
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
  }
  show(item, art, grey = false) {
    this.item = item; this.art = art; this.grey = grey; this.angle = 0; this.vel = 0;
    this._viewName = '';
    const n = art.faces.length;
    this.host.setAttribute('aria-label', item.name + (n > 1 ? '. Hold and spin, or tap Rotate.' : '.'));
    this.draw();
    this.emitView();
  }
  emitView() {
    if (!this.onView || !this.art) return;
    const name = viewName(this.angle, this.art.faces.length);
    if (name === this._viewName) return;
    this._viewName = name;
    this.onView(name);
  }
  magnify(amount) { this.zoom = Math.min(1.7, Math.max(.6, this.zoom + amount)); this.draw(); }
  step(dir) {
    const n = this.art?.faces?.length || 4;
    this.angle += (dir || 0) * (Math.PI * 2 / n);
    this.vel = 0;
    this.draw();
  }
  coast() {
    if (this.dead || this.raf) return;
    const step = () => {
      this.raf = 0;
      if (this.dead || this.drag) return;
      this.angle += this.vel; this.vel *= .94;
      this.draw();
      if (Math.abs(this.vel) > .002) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }
  resize() {
    if (this.dead) return;
    const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight);
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.draw();
  }
  draw() {
    if (this.dead || !this.art || this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0; if (this.dead || !this.art) return;
      const ctx = this.canvas.getContext('2d'), w = this.canvas.width, h = this.canvas.height;
      ctx.clearRect(0, 0, w, h);
      const faces = this.art.faces, n = faces.length || 1;
      const t = ((this.angle % TAU) + TAU) % TAU;
      const size = Math.min(w, h) * .92 * this.zoom;
      const x = (w - size) / 2, y = (h - size) / 2;
      ctx.save();
      if (this.grey) ctx.filter = 'grayscale(1) brightness(.55) contrast(1.05)';
      if (n === 1) {
        const swing = Math.sin(t) * .22;
        ctx.translate(w / 2, h / 2);
        ctx.transform(Math.cos(swing), 0, 0, 1, 0, 0);
        ctx.drawImage(faces[0], -size / 2, -size / 2, size, size);
      } else {
        const slice = TAU / n, idx = t / slice, a = Math.floor(idx) % n, b = (a + 1) % n, f = idx - Math.floor(idx);
        ctx.globalAlpha = 1 - f; ctx.drawImage(faces[a], x, y, size, size);
        ctx.globalAlpha = f; ctx.drawImage(faces[b], x, y, size, size);
      }
      ctx.restore();
      this.emitView();
    });
  }
  destroy() {
    this.dead = true; cancelAnimationFrame(this.frame); cancelAnimationFrame(this.raf);
    this.events.abort(); this.resizeObserver.disconnect(); this.host.replaceChildren(); this.art = null;
  }
}
