// Decode turnaround fronts once, trim empty alpha, rasterize to a small canvas.
const root = new URL('../assets/restyle/game-sprites/', import.meta.url);
const cache = new Map();

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(src));
    image.src = src;
  });
}

function bounds(data, width, height) {
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 24) {
      if (x < left) left = x;
      if (y < top) top = y;
      if (x > right) right = x;
      if (y > bottom) bottom = y;
    }
  }
  return right < left ? null : {x: left, y: top, width: right - left + 1, height: bottom - top + 1};
}

function raster(image, size) {
  const work = document.createElement('canvas');
  const max = 512;
  const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
  work.width = Math.max(1, Math.round(image.naturalWidth * scale));
  work.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = work.getContext('2d', {willReadFrequently: true});
  ctx.drawImage(image, 0, 0, work.width, work.height);
  const box = bounds(ctx.getImageData(0, 0, work.width, work.height).data, work.width, work.height);
  const out = document.createElement('canvas');
  if (!box) { out.width = out.height = size; return out; }
  const fit = (size - 4) / Math.max(box.width, box.height);
  out.width = Math.max(1, Math.round(box.width * fit) + 4);
  out.height = Math.max(1, Math.round(box.height * fit) + 4);
  out.getContext('2d').drawImage(work, box.x, box.y, box.width, box.height, 2, 2, out.width - 4, out.height - 4);
  return out;
}

export function frontUrl(key) {
  return new URL(key.replace(/^\/+/, '') + '/front.png', root).href;
}

export async function loadSprite(key, size = 160) {
  const id = key + ':' + size;
  if (cache.has(id)) return cache.get(id);
  const pending = loadImage(frontUrl(key)).then(image => raster(image, size)).catch(() => null);
  cache.set(id, pending);
  return pending;
}

export async function loadSprites(keys, size = 160) {
  const unique = [...new Set(keys.filter(Boolean))];
  const entries = await Promise.all(unique.map(async key => [key, await loadSprite(key, size)]));
  return Object.fromEntries(entries);
}
