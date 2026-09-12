const ROOT = new URL('../assets/restyle/paper-dolls/', import.meta.url);
const STORE = 'pf-paper-dolls-v1';
const W = 1536, H = 512, CELL = 384;
const images = new Map();
const strips = new Map();

export const BODIES = [
  { id: 'boy', label: 'Boy silhouette' },
  { id: 'girl', label: 'Girl silhouette' },
];
export const SKINS = [
  { id: 'cardboard', label: 'Cardboard', rgb: null },
  { id: 'fair', label: 'Fair', rgb: [236, 198, 170] },
  { id: 'peach', label: 'Peach', rgb: [224, 172, 132] },
  { id: 'tan', label: 'Tan', rgb: [186, 132, 90] },
  { id: 'brown', label: 'Brown', rgb: [128, 84, 56] },
  { id: 'deep', label: 'Deep', rgb: [78, 50, 36] },
];
export const HAIR_STYLES = [
  { id: 'none', label: 'None' },
  { id: 'short', label: 'Short curls' },
  { id: 'bob', label: 'Wavy bob' },
  { id: 'pigtails', label: 'Pigtails' },
];
export const HAIR_COLORS = [
  { id: 'brown', label: 'Brown', rgb: [122, 78, 48] },
  { id: 'black', label: 'Black', rgb: [32, 24, 20] },
  { id: 'blonde', label: 'Blonde', rgb: [214, 176, 92] },
  { id: 'red', label: 'Auburn', rgb: [164, 68, 40] },
  { id: 'ink', label: 'Blue-black', rgb: [36, 48, 88] },
];
export const EYE_COLORS = [
  { id: 'none', label: 'None', rgb: null },
  { id: 'brown', label: 'Brown', rgb: [86, 52, 32] },
  { id: 'hazel', label: 'Hazel', rgb: [110, 78, 36] },
  { id: 'green', label: 'Green', rgb: [62, 102, 58] },
  { id: 'blue', label: 'Blue', rgb: [70, 110, 158] },
  { id: 'grey', label: 'Grey', rgb: [96, 104, 112] },
];
export const OUTFITS = [
  { id: 'none', label: 'Undressed' },
  { id: 'fairy', label: 'Fairy' },
  { id: 'goth', label: 'Goth' },
  { id: 'hippy', label: 'Hippy' },
];

export function blankDraft() {
  return {
    body: 'boy',
    skin: 'cardboard',
    hair: 'none',
    hairColor: 'brown',
    eyes: 'none',
    outfit: 'none',
    name: '',
  };
}

function src(folder, file) {
  return new URL(`${folder}/${file}`, ROOT).href;
}

function load(url) {
  if (images.has(url)) return images.get(url);
  const job = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(url));
    img.src = url;
  });
  images.set(url, job);
  return job;
}

export function preloadDollArt() {
  const urls = [
    src('bodies', 'boy.png'),
    src('bodies', 'girl.png'),
    src('hair', 'short.png'),
    src('hair', 'bob.png'),
    src('hair', 'pigtails.png'),
    ...['boy', 'girl'].flatMap(g => ['fairy', 'goth', 'hippy'].map(o => src('outfits', `${g}-${o}.png`))),
  ];
  return Promise.all(urls.map(u => load(u).catch(() => null)));
}

function recolorTo(ctx, rgb) {
  if (!rgb) return;
  const data = ctx.getImageData(0, 0, W, H);
  const d = data.data;
  const [tr, tg, tb] = rgb;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 12) continue;
    const lum = (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 155;
    const lift = 0.22 + lum * 0.9;
    d[i] = Math.min(255, tr * lift);
    d[i + 1] = Math.min(255, tg * lift);
    d[i + 2] = Math.min(255, tb * lift);
  }
  ctx.putImageData(data, 0, 0);
}

function opaqueBox(pix, x0, y0, x1, y1) {
  let t = H, b = 0, l = W, r = 0, n = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (pix[(y * W + x) * 4 + 3] < 40) continue;
      n++;
      if (y < t) t = y;
      if (y > b) b = y;
      if (x < l) l = x;
      if (x > r) r = x;
    }
  }
  return n ? { x: l, y: t, w: r - l + 1, h: b - t + 1 } : null;
}

function drawLayerOnHead(ctx, bodyImg, layerImg) {
  const body = document.createElement('canvas');
  body.width = W; body.height = H;
  const bctx = body.getContext('2d');
  bctx.drawImage(bodyImg, 0, 0, W, H);
  const bp = bctx.getImageData(0, 0, W, H).data;
  const layer = document.createElement('canvas');
  layer.width = W; layer.height = H;
  const lctx = layer.getContext('2d');
  lctx.drawImage(layerImg, 0, 0, W, H);
  const lp = lctx.getImageData(0, 0, W, H).data;
  for (let side = 0; side < 4; side++) {
    const x0 = side * CELL, x1 = x0 + CELL;
    const head = opaqueBox(bp, x0 + 24, 0, x1 - 24, Math.floor(H * 0.48));
    const hair = opaqueBox(lp, x0, 0, x1, H);
    if (!head || !hair) continue;
    const destW = Math.min(CELL * 0.92, head.w * 1.55);
    const destH = hair.h * (destW / hair.w);
    const dx = head.x + head.w / 2 - destW / 2;
    const dy = head.y - destH * 0.18;
    ctx.drawImage(layer, hair.x, hair.y, hair.w, hair.h, dx, dy, destW, destH);
  }
}

function paintEyes(ctx, bodyImg, rgb) {
  if (!rgb || !bodyImg) return;
  const tmp = document.createElement('canvas');
  tmp.width = W; tmp.height = H;
  const t = tmp.getContext('2d');
  t.drawImage(bodyImg, 0, 0, W, H);
  const pix = t.getImageData(0, 0, W, H).data;
  for (let side = 0; side < 4; side++) {
    if (side === 2) continue;
    const x0 = side * CELL;
    const head = opaqueBox(pix, x0 + 28, 0, x0 + CELL - 28, Math.floor(H * 0.42));
    if (!head) continue;
    const cx = head.x + head.w / 2;
    const cy = head.y + head.h * 0.46;
    const eyeR = Math.max(4, head.h * 0.09);
    const irisR = eyeR * 0.52;
    const spread = head.w * 0.16;
    const spots = side === 0 ? [cx - spread, cx + spread] : side === 1 ? [cx - spread * 0.55] : [cx + spread * 0.55];
    for (const x of spots) {
      ctx.beginPath();
      ctx.fillStyle = '#f4efe4';
      ctx.arc(x, cy, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
      ctx.arc(x, cy, irisR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = '#1a120e';
      ctx.arc(x + eyeR * 0.1, cy, irisR * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export async function composeDoll(spec) {
  const key = JSON.stringify(spec);
  if (strips.has(key)) return strips.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const bodyImg = await load(src('bodies', `${spec.body || 'boy'}.png`));
  ctx.drawImage(bodyImg, 0, 0, W, H);
  const skin = SKINS.find(s => s.id === spec.skin);
  if (skin?.rgb) recolorTo(ctx, skin.rgb);
  const eyes = EYE_COLORS.find(e => e.id === spec.eyes);
  if (eyes?.rgb) paintEyes(ctx, bodyImg, eyes.rgb);
  if (spec.outfit && spec.outfit !== 'none') {
    const file = `${spec.body || 'boy'}-${spec.outfit}.png`;
    try {
      const clothes = await load(src('outfits', file));
      ctx.drawImage(clothes, 0, 0, W, H);
    } catch {}
  }
  if (spec.hair && spec.hair !== 'none') {
    const hairImg = await load(src('hair', `${spec.hair}.png`));
    const hcan = document.createElement('canvas');
    hcan.width = W; hcan.height = H;
    const hctx = hcan.getContext('2d');
    hctx.drawImage(hairImg, 0, 0, W, H);
    const hc = HAIR_COLORS.find(c => c.id === spec.hairColor);
    if (hc?.rgb) recolorTo(hctx, hc.rgb);
    drawLayerOnHead(ctx, bodyImg, hcan);
  }
  const url = canvas.toDataURL('image/png');
  strips.set(key, url);
  return url;
}

export function bodyStrip(id) {
  return src('bodies', `${id === 'girl' || id === 'cardboard-girl' ? 'girl' : 'boy'}.png`);
}

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE) || 'null') || { dolls: [] };
  } catch {
    return { dolls: [] };
  }
}
function writeStore(data) {
  try { localStorage.setItem(STORE, JSON.stringify(data)); } catch {}
}

export function listCustomDolls() {
  return readStore().dolls;
}

export function getCustomDoll(id) {
  return readStore().dolls.find(d => d.id === id) || null;
}

export function keepDoll(spec) {
  const data = readStore();
  const id = spec.id || ('doll-' + Math.random().toString(36).slice(2, 8));
  const saved = {
    id,
    name: (spec.name || '').trim() || 'Paper doll',
    body: spec.body || 'boy',
    skin: spec.skin || 'cardboard',
    hair: spec.hair || 'none',
    hairColor: spec.hairColor || 'brown',
    eyes: spec.eyes || 'none',
    outfit: spec.outfit || 'none',
    at: Date.now(),
  };
  const i = data.dolls.findIndex(d => d.id === id);
  if (i >= 0) data.dolls[i] = saved;
  else data.dolls.push(saved);
  writeStore(data);
  strips.clear();
  return saved;
}

export function forgetDoll(id) {
  const data = readStore();
  data.dolls = data.dolls.filter(d => d.id !== id);
  writeStore(data);
}
