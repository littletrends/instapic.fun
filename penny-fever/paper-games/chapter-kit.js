// Shared helpers so extra chapters can keep scaling instead of falling off a 3-long table.
// Chapter prize: runtime plants kits[stall].prizes[level] at PRIZE_HOME after create().
// Call takePrize(s) when the player hits it, or set result.won with a prize id.
// Override s.chapterPrize.x / s.chapterPrize.y in create if this oval is busy.
// Do not store the flying prize on s.prize — many stalls already use that as an id string.
import {spriteKey} from './prizes.js?v=align-1';

export const pick = (arr, i) => arr[Math.max(0, Math.min(i, arr.length - 1))];
export const pace = (level, start, step, floor) => Math.max(floor, start - level * step);
export const swell = (level, start, step, cap) => Math.min(cap, start + level * step);

export const PRIZE_HOME = {x: 708, y: 332, w: 70};
export const PRIZE_FLY_TO = {x: 868, y: 42};

export function bindPrize(s, id, spot) {
  if (!s || !id || s.chapterPrize) return s;
  const home = spot || PRIZE_HOME;
  s.prizeId = id;
  s.chapterPrize = {
    id, key: spriteKey(id),
    x: home.x ?? PRIZE_HOME.x,
    y: home.y ?? PRIZE_HOME.y,
    w: home.w || PRIZE_HOME.w,
    phase: 'rest', t: 0, angle: 0, scale: 1, alpha: 1,
    field: !!home.field,
  };
  return s;
}

export function takePrize(s, id, spot) {
  if (!s || s.prizeKept) return false;
  if (id && !s.chapterPrize) bindPrize(s, id, spot);
  const p = s.chapterPrize;
  if (!p) return false;
  if (spot && Number.isFinite(spot.x) && Number.isFinite(spot.y)) {
    p.x = spot.x;
    p.y = spot.y;
  }
  s.prizeKept = true;
  p.field = false;
  p.phase = 'pop';
  p.t = 0;
  p.alpha = 1;
  p.scale = 1;
  return true;
}

export function stepPrize(s, dt) {
  const p = s?.chapterPrize;
  if (!p || p.phase === 'rest' || p.phase === 'gone') return;
  p.t += dt;
  if (p.phase === 'pop') {
    const u = Math.min(1, p.t / 0.32);
    p.scale = 1 + Math.sin(u * Math.PI) * 0.62;
    p.angle = p.t * 16;
    if (p.t > 0.4) { p.phase = 'spin'; p.t = 0; }
  } else if (p.phase === 'spin') {
    p.scale = 1.38;
    p.angle += dt * 20;
    if (p.t > 0.55) {
      p.phase = 'fly'; p.t = 0;
      p.x0 = p.x; p.y0 = p.y;
    }
  } else if (p.phase === 'fly') {
    const u = Math.min(1, p.t / 0.58);
    const e = u * u * (3 - 2 * u);
    p.x = p.x0 + (PRIZE_FLY_TO.x - p.x0) * e;
    p.y = p.y0 + (PRIZE_FLY_TO.y - p.y0) * e;
    p.scale = 1.38 * (1 - u) + 0.18 * u;
    p.alpha = 1 - u * 0.2;
    p.angle += dt * 24;
    if (u >= 1) {
      p.phase = 'gone';
      p.alpha = 0;
      s.prizeDeliver = true;
    }
  }
}

export function paintPrize(s, d) {
  const p = s?.chapterPrize;
  if (!p || p.phase === 'gone' || p.alpha <= 0) return;
  if (p.phase === 'rest' && p.field) return;
  if (p.phase !== 'rest') d.glow(p.x, p.y, 28 + p.scale * 22, '#f4d590');
  d.item(p.key, p.x, p.y, {
    w: p.w * p.scale,
    angle: p.angle,
    alpha: p.alpha,
    shadow: p.phase === 'rest',
    fallback: () => d.star(p.x, p.y, 14 * p.scale),
  });
}
