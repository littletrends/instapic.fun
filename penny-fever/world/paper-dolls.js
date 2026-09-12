const ROOT = new URL('../assets/restyle/paper-dolls/', import.meta.url);
const STORE = 'pf-paper-dolls-v5';
const W = 1536, H = 512, CELL = 384;
const images = new Map();
const strips = new Map();

export const BODIES = [
  { id: 'girl', label: 'Girl' },
];
export const SKINS = [
  { id: 'cardboard', label: 'Natural', rgb: null },
  { id: 'fair', label: 'Fair', rgb: [236, 198, 170] },
  { id: 'peach', label: 'Peach', rgb: [224, 172, 132] },
  { id: 'tan', label: 'Tan', rgb: [186, 132, 90] },
  { id: 'brown', label: 'Brown', rgb: [128, 84, 56] },
  { id: 'deep', label: 'Deep', rgb: [78, 50, 36] },
];
export const EYE_COLORS = [
  { id: 'blue', label: 'Blue', rgb: null },
  { id: 'brown', label: 'Brown', rgb: [86, 52, 32] },
  { id: 'hazel', label: 'Hazel', rgb: [110, 78, 36] },
  { id: 'green', label: 'Green', rgb: [62, 102, 58] },
  { id: 'grey', label: 'Grey', rgb: [96, 104, 112] },
];
export const OUTFITS = [
  { id: 'none', label: 'Undershirt', book: null },
  { id: 'garden', label: 'Garden party', book: 'garden-party-book' },
  { id: 'seaside', label: 'Seaside day', book: 'seaside-day-book' },
  { id: 'winter', label: 'Winter lantern', book: 'winter-lantern-book' },
  { id: 'moonlight', label: 'Moonlight', book: 'moonlight-wardrobe' },
];
export const NOSES = [
  { id: 'none', label: 'None' },
  { id: 'button', label: 'Button' },
  { id: 'dash', label: 'Dash' },
];
export const MOUTHS = [
  { id: 'none', label: 'None' },
  { id: 'smile', label: 'Smile' },
  { id: 'o', label: 'O' },
  { id: 'line', label: 'Line' },
];
export const EARS = [
  { id: 'body', label: 'As cut' },
];

export const MINE_ID = 'mine';

export function blankDraft() {
  return {
    id: MINE_ID,
    body: 'girl',
    skin: 'cardboard',
    hair: 'none',
    hairColor: 'blonde',
    eyes: 'blue',
    outfit: 'none',
    name: 'Paper doll',
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
    src('bodies', 'girl.png'),
    ...OUTFITS.filter(o => o.id !== 'none').map(o => src('outfits', `${o.id}.png`)),
  ];
  return Promise.all(urls.map(u => load(u).catch(() => null)));
}

function recolorTo(ctx, rgb, {skinOnly=false}={}) {
  if (!rgb) return;
  const data = ctx.getImageData(0, 0, W, H);
  const d = data.data;
  const [tr, tg, tb] = rgb;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 12) continue;
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (skinOnly) {
      if (mx > 210 && mx - mn < 45) continue;
      if (r > 150 && g > 110 && b < 90 && r - b > 60) continue;
      if (b >= r) continue;
      if (r < g + 6) continue;
    }
    const lum = (0.3 * r + 0.59 * g + 0.11 * b) / 155;
    const lift = 0.22 + lum * 0.9;
    d[i] = Math.min(255, tr * lift);
    d[i + 1] = Math.min(255, tg * lift);
    d[i + 2] = Math.min(255, tb * lift);
  }
  ctx.putImageData(data, 0, 0);
}

function recolorEyes(ctx, rgb) {
  if (!rgb) return;
  const data = ctx.getImageData(0, 0, W, H);
  const d = data.data;
  const [tr, tg, tb] = rgb;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 12) continue;
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (b < r + 8 || b <= g) continue;
    if (mx > 225 && mx - mn < 40) continue;
    if (mx < 50) continue;
    const lum = (0.3 * r + 0.59 * g + 0.11 * b) / 140;
    const lift = 0.35 + lum * 0.85;
    d[i] = Math.min(255, tr * lift);
    d[i + 1] = Math.min(255, tg * lift);
    d[i + 2] = Math.min(255, tb * lift);
  }
  ctx.putImageData(data, 0, 0);
}

function isSkinPixel(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx > 210 && mx - mn < 45) return false;
  if (b >= r) return false;
  if (r < g + 6) return false;
  if ((r + g + b) / 3 < 95) return false;
  return true;
}

function recolorSkinFromMask(ctx, maskImg, rgb) {
  if (!rgb) return;
  const tmp = document.createElement('canvas');
  tmp.width = W; tmp.height = H;
  const t = tmp.getContext('2d');
  t.drawImage(maskImg, 0, 0, W, H);
  const mask = t.getImageData(0, 0, W, H).data;
  const data = ctx.getImageData(0, 0, W, H);
  const d = data.data;
  const [tr, tg, tb] = rgb;
  for (let i = 0; i < d.length; i += 4) {
    if (mask[i + 3] < 12 || d[i + 3] < 12) continue;
    if (!isSkinPixel(mask[i], mask[i + 1], mask[i + 2])) continue;
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

function headBox(pix, side) {
  const x0 = side * CELL;
  return opaqueBox(pix, x0 + 22, 0, x0 + CELL - 22, Math.floor(H * 0.48));
}

function paperStroke(ctx) {
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = '#3a2418';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

function fillPaper(ctx, rgb) {
  ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

function drawEyes(ctx, head, side, style, rgb) {
  if (!head || style === 'none' || side === 2) return;
  const cy = head.y + head.h * 0.50;
  const sleepy = style === 'sleepy';
  const eyeR = Math.max(3, head.h * (sleepy ? 0.028 : 0.036));
  const spread = head.w * (side === 0 ? 0.13 : 0.08);
  const xs = side === 0 ? [head.x + head.w / 2 - spread, head.x + head.w / 2 + spread]
    : side === 1 ? [head.x + head.w * 0.38]
    : [head.x + head.w * 0.62];
  for (const x of xs) {
    ctx.beginPath();
    ctx.ellipse(x, cy, eyeR * 1.05, eyeR * (sleepy ? 0.55 : 0.95), 0, 0, Math.PI * 2);
    fillPaper(ctx, rgb);
    ctx.fill();
    ctx.strokeStyle = '#3a2418';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x + eyeR * 0.28, cy - eyeR * 0.22, eyeR * 0.32, eyeR * 0.32, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(248,242,230,0.9)';
    ctx.fill();
  }
}

function drawNose(ctx, head, side, style) {
  if (!head || style === 'none' || side === 2) return;
  const cx = side === 0 ? head.x + head.w / 2
    : side === 1 ? head.x + head.w * 0.22
    : head.x + head.w * 0.78;
  const cy = head.y + head.h * 0.56;
  const s = Math.max(2, head.h * 0.028);
  ctx.beginPath();
  ctx.ellipse(cx, cy, s * (style === 'dash' ? 0.45 : 0.85), s * (style === 'dash' ? 1.1 : 0.7), 0, 0, Math.PI * 2);
  fillPaper(ctx, [168, 118, 88]);
  ctx.fill();
}

function drawMouth(ctx, head, side, style) {
  if (!head || style === 'none' || side === 2) return;
  const cx = side === 0 ? head.x + head.w / 2
    : side === 1 ? head.x + head.w * 0.28
    : head.x + head.w * 0.72;
  const cy = head.y + head.h * 0.58;
  const w = head.w * 0.07;
  ctx.strokeStyle = '#7a3030';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (style === 'smile') {
    ctx.arc(cx, cy, w, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else if (style === 'o') {
    ctx.ellipse(cx, cy + w * 0.2, w * 0.35, w * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.moveTo(cx - w * 0.7, cy);
    ctx.lineTo(cx + w * 0.7, cy);
    ctx.stroke();
  }
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
    const destW = head.w * 1.05;
    const destH = hair.h * (destW / hair.w);
    const dx = head.x + head.w / 2 - destW / 2;
    const dy = head.y - head.h * 0.12;
    ctx.drawImage(layer, hair.x, hair.y, hair.w, hair.h, dx, dy, destW, destH);
  }
}

function drawFace(ctx, bodyImg, spec) {
  const tmp = document.createElement('canvas');
  tmp.width = W; tmp.height = H;
  const t = tmp.getContext('2d');
  t.drawImage(bodyImg, 0, 0, W, H);
  const pix = t.getImageData(0, 0, W, H).data;
  const eyeRgb = EYE_COLORS.find(e => e.id === spec.eyes)?.rgb || [86, 52, 32];
  for (let side = 0; side < 4; side++) {
    const head = headBox(pix, side);
    drawEyes(ctx, head, side, spec.eyeStyle || 'none', eyeRgb);
    drawNose(ctx, head, side, spec.nose || 'none');
    drawMouth(ctx, head, side, spec.mouth || 'none');
  }
}

export async function composeDoll(spec) {
  const key = JSON.stringify(spec);
  if (strips.has(key)) return strips.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const bodyImg = await load(src('bodies', 'girl.png'));
  const wear = spec.outfit && spec.outfit !== 'none' ? spec.outfit : null;
  const wearImg = wear ? await load(src('outfits', `${wear}.png`)) : bodyImg;
  ctx.drawImage(wearImg, 0, 0, W, H);
  const skin = SKINS.find(s => s.id === spec.skin);
  if (skin?.rgb) recolorSkinFromMask(ctx, bodyImg, skin.rgb);
  const eyes = EYE_COLORS.find(e => e.id === spec.eyes);
  if (eyes?.rgb) recolorEyes(ctx, eyes.rgb);
  const url = canvas.toDataURL('image/png');
  strips.set(key, url);
  return url;
}

export function bodyStrip() {
  return `assets/restyle/paper-dolls/bodies/girl.png`;
}

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE) || 'null') || { mine: null };
  } catch {
    return { mine: null };
  }
}
function writeStore(data) {
  try { localStorage.setItem(STORE, JSON.stringify(data)); } catch {}
}

export function getMine() {
  return readStore().mine || null;
}

export function keepMine(spec) {
  const saved = { ...blankDraft(), ...spec, id: MINE_ID, at: Date.now() };
  writeStore({ mine: saved });
  strips.clear();
  return saved;
}

export function forgetMine() {
  writeStore({ mine: null });
  strips.clear();
}
