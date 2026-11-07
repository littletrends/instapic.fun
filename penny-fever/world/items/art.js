const cache = new Map();
const VIEWS = ['front', 'left', 'back', 'right'];
const phone = () => window.matchMedia('(max-width: 700px), (pointer: coarse)').matches;
const faceSize = () => phone() ? 256 : 384;
const cacheCap = () => phone() ? 8 : 16;

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(src));
    im.src = src;
  });
}
function drawFit(image, size) {
  const c = canvas(size, size);
  const ctx = c.getContext('2d');
  const pad = 8;
  const scale = Math.min(1, (size - pad) / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
  const w = Math.max(1, Math.round((image.naturalWidth || size) * scale));
  const h = Math.max(1, Math.round((image.naturalHeight || size) * scale));
  ctx.drawImage(image, (size - w) / 2, (size - h) / 2, w, h);
  return {canvas: c, w, h};
}
function pack(parts, size) {
  const first = parts[0];
  return {
    faces: parts.map(p => p.canvas),
    width: first.w / size * 3,
    height: first.h / size * 3,
    turnaround: parts.length >= 4,
  };
}

export async function loadArt(item) {
  if (cache.has(item.id)) return cache.get(item.id);
  const size = faceSize();
  const pending = (async () => {
    if (item.turnaround && item.collection) {
      const root = item.asset.replace(/front\.png$/, '');
      const loaded = await Promise.all(VIEWS.map(view =>
        loadImage(root + view + '.png').catch(() => null)
      ));
      if (!loaded[0]) throw new Error('The item picture could not be loaded.');
      return pack(loaded.filter(Boolean).map(image => drawFit(image, size)), size);
    }
    const {removeBackground, alphaBounds} = await import('./pixels.js?v=treasures-1');
    const image = await loadImage(item.asset);
    const c = canvas(size, size);
    const ctx = c.getContext('2d', {willReadFrequently: true});
    ctx.drawImage(image, 0, 0, size, size);
    const pixels = ctx.getImageData(0, 0, size, size);
    if (!item.alpha) removeBackground(pixels.data, size, size, ['whisper-charm', 'gyro-ghost', 'shutter-click'].includes(item.id));
    ctx.putImageData(pixels, 0, 0);
    const bounds = alphaBounds(pixels.data, size, size);
    if (!bounds) throw new Error('The item picture is empty.');
    const cut = canvas(size, size);
    const fit = (size - 8) / Math.max(bounds.width, bounds.height);
    const w = bounds.width * fit, h = bounds.height * fit;
    cut.getContext('2d').drawImage(c, bounds.x, bounds.y, bounds.width, bounds.height, (size - w) / 2, (size - h) / 2, w, h);
    return {faces: [cut], width: w / size * 3, height: h / size * 3, turnaround: false};
  })();
  cache.set(item.id, pending);
  while (cache.size > cacheCap()) {
    const first = cache.keys().next().value;
    if (first === item.id) break;
    cache.delete(first);
  }
  try { return await pending; }
  catch (error) { cache.delete(item.id); throw error; }
}

export function paintIcon(target, art, face = 0) {
  target.width = 96; target.height = 96;
  target.getContext('2d').drawImage(art.faces[face] || art.faces[0], 0, 0, 96, 96);
}
