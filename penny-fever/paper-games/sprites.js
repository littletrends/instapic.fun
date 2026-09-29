// Load prize fronts as small canvases. No pixel-scan — that froze phones
// and left the locked prize on a fallback star until raster finished.
const root = new URL('../assets/restyle/game-sprites/', import.meta.url);
const cache = new Map();
const matteCache = new WeakMap();

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(src));
    image.src = src;
  });
}

function scaleTo(image, size) {
  const w = image.naturalWidth || image.width || 1;
  const h = image.naturalHeight || image.height || 1;
  const fit = size / Math.max(w, h);
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(w * fit));
  out.height = Math.max(1, Math.round(h * fit));
  out.getContext('2d').drawImage(image, 0, 0, out.width, out.height);
  return out;
}

/** Knock out cyan-screen and matching corner mattes on prop-kit PNGs. */
export function matteImage(image, opts = {}) {
  if (!image || !(image.naturalWidth || image.width)) return image;
  if (matteCache.has(image)) return matteCache.get(image);
  const w = image.naturalWidth || image.width;
  const h = image.naturalHeight || image.height;
  const work = document.createElement('canvas');
  work.width = w;
  work.height = h;
  const ctx = work.getContext('2d', {willReadFrequently: true});
  ctx.drawImage(image, 0, 0);
  let pix;
  try { pix = ctx.getImageData(0, 0, w, h); }
  catch {
    matteCache.set(image, image);
    return image;
  }
  const d = pix.data;
  const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + (w - 1)) * 4];
  let cr = 0, cg = 0, cb = 0;
  for (const i of corners) { cr += d[i]; cg += d[i + 1]; cb += d[i + 2]; }
  cr /= 4; cg /= 4; cb /= 4;
  const cornerTol = opts.cornerTol ?? 34;
  const cyanTol = opts.cyanTol ?? 48;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const cyan = Math.hypot(r - 0, g - 251, b - 253);
    const corner = Math.hypot(r - cr, g - cg, b - cb);
    if (cyan < cyanTol || corner < cornerTol) d[i + 3] = 0;
  }
  ctx.putImageData(pix, 0, 0);
  matteCache.set(image, work);
  return work;
}

export function frontUrl(key) {
  return new URL(key.replace(/^\/+/, '') + '/front.png', root).href;
}

export async function loadSprite(key, size = 160) {
  const id = key + ':' + size;
  if (cache.has(id)) return cache.get(id);
  const pending = loadImage(frontUrl(key)).then(image => scaleTo(image, size)).catch(() => null);
  cache.set(id, pending);
  return pending;
}

export async function loadSprites(keys, size = 160) {
  const unique = [...new Set(keys.filter(Boolean))];
  const entries = await Promise.all(unique.map(async key => [key, await loadSprite(key, size)]));
  return Object.fromEntries(entries);
}
