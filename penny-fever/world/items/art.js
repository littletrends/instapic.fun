import {removeBackground,alphaBounds} from './pixels.js?v=treasures-1';
const cache = new Map();
const VIEWS = ['front', 'left', 'back', 'right'];

function canvas(w = 512, h = 512) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(src));
    im.src = src;
  });
}
function rasterSheet(image, columns, rows, alpha, matteIds, id) {
  const parts = [];
  const sw = image.naturalWidth / columns, sh = image.naturalHeight / rows;
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const c = canvas(), ctx = c.getContext('2d', {willReadFrequently: true});
    ctx.drawImage(image, col * sw, row * sh, sw, sh, 0, 0, 512, 512);
    const pixels = ctx.getImageData(0, 0, 512, 512);
    if (!alpha) removeBackground(pixels.data, 512, 512, matteIds.includes(id));
    ctx.putImageData(pixels, 0, 0);
    const bounds = alphaBounds(pixels.data, 512, 512);
    if (!bounds) throw new Error('The item picture is empty.');
    parts.push({canvas: c, bounds});
  }
  return pack(parts);
}
function rasterViews(images) {
  const parts = images.map(image => {
    const c = canvas(), ctx = c.getContext('2d', {willReadFrequently: true});
    const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
    const w = Math.max(1, Math.round(image.naturalWidth * scale));
    const h = Math.max(1, Math.round(image.naturalHeight * scale));
    ctx.drawImage(image, (512 - w) / 2, (512 - h) / 2, w, h);
    const bounds = alphaBounds(ctx.getImageData(0, 0, 512, 512).data, 512, 512);
    if (!bounds) throw new Error('The item picture is empty.');
    return {canvas: c, bounds};
  });
  return pack(parts);
}
function pack(parts) {
  const first = parts[0].bounds, fit = 460 / Math.max(first.width, first.height);
  const width = first.width * fit, height = first.height * fit;
  const faces = parts.map(({canvas: source, bounds}) => {
    const c = canvas(), ctx = c.getContext('2d');
    ctx.drawImage(source, bounds.x, bounds.y, bounds.width, bounds.height, (512 - width) / 2, (512 - height) / 2, width, height);
    return c;
  });
  return {faces, width: width / 512 * 3, height: height / 512 * 3, turnaround: faces.length >= 4};
}

export async function loadArt(item) {
  if (cache.has(item.id)) return cache.get(item.id);
  const pending = (async () => {
    if (item.turnaround && item.collection) {
      const root = item.asset.replace(/front\.png$/, '');
      const loaded = [];
      for (const view of VIEWS) {
        try { loaded.push(await loadImage(root + view + '.png')); }
        catch { if (view === 'front') throw new Error('The item picture could not be loaded.'); }
      }
      return rasterViews(loaded);
    }
    const image = await loadImage(item.asset);
    return rasterSheet(image, item.columns, item.rows, item.alpha, ['whisper-charm', 'gyro-ghost', 'shutter-click'], item.id);
  })();
  cache.set(item.id, pending);
  while (cache.size > 32) cache.delete(cache.keys().next().value);
  try { return await pending; }
  catch (error) { cache.delete(item.id); throw error; }
}

export function paintIcon(target, art, face = 0) {
  target.width = 128; target.height = 128;
  target.getContext('2d').drawImage(art.faces[face] || art.faces[0], 0, 0, 128, 128);
}
