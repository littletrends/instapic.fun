const ROOT = new URL('../assets/restyle/paper-dolls/', import.meta.url);
const STORE = 'pf-paper-dolls-v11';
const W = 1536, H = 512, CELL = 384;
const images = new Map();
const strips = new Map();
const renderedSheets = new Map();
const pendingSheets = new Map();

export const BODIES = [
  { id: 'girl', label: 'Girl' },
];
export const SKINS = [
  { id: 'cardboard', label: 'Natural', rgb: null },
  { id: 'fair', label: 'Fair', rgb: [236, 198, 170] },
  { id: 'peach', label: 'Peach', rgb: [224, 172, 132] },
  { id: 'golden', label: 'Golden', rgb: [210, 154, 96] },
  { id: 'tan', label: 'Tan', rgb: [186, 132, 90] },
  { id: 'olive', label: 'Olive', rgb: [168, 124, 78] },
  { id: 'brown', label: 'Brown', rgb: [128, 84, 56] },
  { id: 'deep', label: 'Deep', rgb: [78, 50, 36] },
];
export const EYE_COLORS = [
  { id: 'blue', label: 'Blue', rgb: [72, 138, 196] },
  { id: 'brown', label: 'Brown', rgb: [86, 52, 32] },
  { id: 'hazel', label: 'Hazel', rgb: [110, 78, 36] },
  { id: 'green', label: 'Green', rgb: [62, 102, 58] },
  { id: 'grey', label: 'Grey', rgb: [96, 104, 112] },
  { id: 'amber', label: 'Amber', rgb: [176, 112, 36] },
  { id: 'violet', label: 'Violet', rgb: [96, 72, 150] },
];
export const HAIR_STYLES = [
  { id: 'none', label: 'None' },
  { id: 'pigtails', label: 'Pigtails', fit: 'sheet' },
  { id: 'bob', label: 'Bob', fit: 'sheet' },
  { id: 'curls', label: 'Curls', fit: 'sheet' },
  { id: 'waves', label: 'Waves', fit: 'sheet' },
  { id: 'bun', label: 'Bun', fit: 'sheet' },
  { id: 'braid', label: 'Braid', fit: 'sheet' },
  { id: 'pixie', label: 'Pixie', fit: 'sheet' },
];
export const HATS = [
  { id: 'none', label: 'None' },
  { id: 'straw', label: 'Straw hat' },
  { id: 'sailor', label: 'Sailor cap' },
  { id: 'rain', label: 'Rain hat' },
  { id: 'crown', label: 'Crown' },
  { id: 'cowboy', label: 'Cowboy hat' },
  { id: 'witchhat', label: 'Witch hat' },
  { id: 'flower', label: 'Flower crown' },
  { id: 'chefhat', label: 'Chef hat' },
  { id: 'piratehat', label: 'Pirate hat' },
  { id: 'beret', label: 'Beret' },
  { id: 'postiecap', label: 'Postie cap' },
];
export const OUTFITS = [
  { id: 'none', label: 'Undershirt', book: null },
  { id: 'garden', label: 'Rose pinafore' },
  { id: 'seaside', label: 'Sailor set' },
  { id: 'winter', label: 'Starry coat' },
  { id: 'moonlight', label: 'Moon pinafore' },
  { id: 'floss', label: 'Candy stripe' },
  { id: 'picnic', label: 'Gingham picnic' },
  { id: 'rain', label: 'Yellow mac' },
  { id: 'bedtime', label: 'Star pyjamas' },
  { id: 'midway', label: 'Admit one' },
  { id: 'sunday', label: 'Sunday best' },
  { id: 'fortune', label: 'Mystic lilac' },
  { id: 'ballet', label: 'Ballet wrap' },
  { id: 'cowgirl', label: 'Star dungarees' },
  { id: 'circus', label: 'Ringmaster' },
  { id: 'witch', label: 'Plum pinafore' },
  { id: 'sundae', label: 'Cherry soda' },
  { id: 'detective', label: 'Trench coat' },
  { id: 'princess', label: 'Blue sash' },
  { id: 'mechanic', label: 'Dungarees' },
  { id: 'florist', label: 'Garden apron' },
  { id: 'ranch', label: 'Ranch day' },
  { id: 'library', label: 'Library cardigan' },
  { id: 'birthday', label: 'Birthday dress' },
  { id: 'kimono', label: 'Festival kimono' },
  { id: 'chef', label: 'Little chef' },
  { id: 'explorer', label: 'Explorer' },
  { id: 'soccer', label: 'Green kit' },
  { id: 'icecream', label: 'Ice-cream parlour' },
  { id: 'artist', label: 'Paint smock' },
  { id: 'conductor', label: 'Conductor' },
  { id: 'postie', label: 'Postie' },
  { id: 'school', label: 'School day' },
  { id: 'iceskate', label: 'Ice skate' },
  { id: 'scientist', label: 'Lab coat' },
  { id: 'bee', label: 'Honeybee' },
  { id: 'pirate', label: 'Pirate pinafore' },
];
export const DOLL_PAGES = {
  garden: 'assets/restyle/paper-dolls/pages/garden.jpg',
  seaside: 'assets/restyle/paper-dolls/pages/seaside.jpg',
  winter: 'assets/restyle/paper-dolls/pages/winter.jpg',
  moonlight: 'assets/restyle/paper-dolls/pages/moonlight.jpg',
  'garden-party-book': 'assets/restyle/paper-dolls/pages/garden.jpg',
  'seaside-day-book': 'assets/restyle/paper-dolls/pages/seaside.jpg',
  'winter-lantern-book': 'assets/restyle/paper-dolls/pages/winter.jpg',
  'moonlight-wardrobe': 'assets/restyle/paper-dolls/pages/moonlight.jpg',
};
const P = 'assets/restyle/paper-dolls';
const hair = (id, label) => ({ slot: 'hair', id, label, src: `${P}/hair-clean/${id}.png` });
const hat = (id, label) => ({ slot: 'hat', id, label, src: `${P}/hats-clean/${id}.png` });
const clothes = (id, label) => ({ slot: 'outfit', id, label, src: `${P}/outfits/${id}.png` });
export const COLLECTIONS = [
  { id: 'garden', label: 'Garden party', page: DOLL_PAGES.garden, pieces: [hair('pigtails','Pigtails'), hair('bob','Bob'), hat('straw','Straw hat'), clothes('garden','Rose pinafore')] },
  { id: 'seaside', label: 'Seaside day', page: DOLL_PAGES.seaside, pieces: [hair('curls','Curls'), hair('waves','Waves'), hat('sailor','Sailor cap'), clothes('seaside','Sailor set')] },
  { id: 'winter', label: 'Winter lantern', page: DOLL_PAGES.winter, pieces: [hair('waves','Waves'), hair('bob','Bob'), clothes('winter','Starry coat')] },
  { id: 'moonlight', label: 'Moonlight', page: DOLL_PAGES.moonlight, pieces: [hair('waves','Waves'), hair('pigtails','Pigtails'), clothes('moonlight','Moon pinafore')] },
  { id: 'floss', label: 'Fairy floss', page: `${P}/outfits/floss.png`, pieces: [hair('pigtails','Pigtails'), hair('curls','Curls'), clothes('floss','Candy stripe')] },
  { id: 'picnic', label: 'Picnic', page: `${P}/outfits/picnic.png`, pieces: [hair('bob','Bob'), hair('pigtails','Pigtails'), clothes('picnic','Gingham')] },
  { id: 'rain', label: 'Rainy day', page: `${P}/outfits/rain.png`, pieces: [hair('bob','Bob'), hair('waves','Waves'), hat('rain','Rain hat'), clothes('rain','Yellow mac')] },
  { id: 'bedtime', label: 'Bedtime', page: `${P}/outfits/bedtime.png`, pieces: [hair('waves','Waves'), hair('curls','Curls'), clothes('bedtime','Star pyjamas')] },
  { id: 'midway', label: 'Admit one', page: `${P}/outfits/midway.png`, pieces: [hair('pigtails','Pigtails'), hair('curls','Curls'), hat('crown','Crown'), clothes('midway','Ticket pinafore')] },
  { id: 'sunday', label: 'Sunday best', page: `${P}/outfits/sunday.png`, pieces: [hair('bob','Bob'), hair('waves','Waves'), clothes('sunday','Navy pinafore')] },
  { id: 'fortune', label: 'Iris’s hour', page: `${P}/outfits/fortune.png`, pieces: [hair('waves','Waves'), hair('bob','Bob'), clothes('fortune','Mystic lilac')] },
  { id: 'ballet', label: 'Ballet', page: `${P}/outfits/ballet.png`, pieces: [hair('bob','Bob'), hair('pigtails','Pigtails'), clothes('ballet','Wrap and tutu')] },
  { id: 'cowgirl', label: 'Cowgirl', page: `${P}/outfits/cowgirl.png`, pieces: [hair('braid','Braid'), hair('bun','Bun'), hat('cowboy','Cowboy hat'), clothes('cowgirl','Star dungarees')] },
  { id: 'circus', label: 'Circus', page: `${P}/outfits/circus.png`, pieces: [hair('pixie','Pixie'), hair('curls','Curls'), clothes('circus','Ringmaster')] },
  { id: 'witch', label: 'Witching hour', page: `${P}/outfits/witch.png`, pieces: [hair('waves','Waves'), hair('bun','Bun'), hat('witchhat','Witch hat'), clothes('witch','Plum pinafore')] },
  { id: 'sundae', label: 'Soda shop', page: `${P}/outfits/sundae.png`, pieces: [hair('pigtails','Pigtails'), hair('curls','Curls'), clothes('sundae','Cherry soda')] },
  { id: 'detective', label: 'Clue hunt', page: `${P}/outfits/detective.png`, pieces: [hair('bob','Bob'), hair('pixie','Pixie'), clothes('detective','Trench coat')] },
  { id: 'princess', label: 'Paper princess', page: `${P}/outfits/princess.png`, pieces: [hair('bun','Bun'), hair('waves','Waves'), hat('flower','Flower crown'), clothes('princess','Blue sash')] },
  { id: 'mechanic', label: 'Fix-it', page: `${P}/outfits/mechanic.png`, pieces: [hair('pixie','Pixie'), hair('braid','Braid'), clothes('mechanic','Dungarees')] },
  { id: 'florist', label: 'Flower stall', page: `${P}/outfits/florist.png`, pieces: [hair('braid','Braid'), hair('bun','Bun'), hat('flower','Flower crown'), clothes('florist','Garden apron')] },
  { id: 'ranch', label: 'Ranch day', page: `${P}/outfits/ranch.png`, pieces: [hair('braid','Braid'), hat('cowboy','Cowboy hat'), clothes('ranch','Ranch day')] },
  { id: 'library', label: 'Library', page: `${P}/outfits/library.png`, pieces: [hair('bob','Bob'), clothes('library','Library cardigan')] },
  { id: 'birthday', label: 'Birthday', page: `${P}/outfits/birthday.png`, pieces: [hair('pigtails','Pigtails'), clothes('birthday','Birthday dress')] },
  { id: 'kimono', label: 'Festival', page: `${P}/outfits/kimono.png`, pieces: [hair('bun','Bun'), clothes('kimono','Festival kimono')] },
  { id: 'chef', label: 'Little chef', page: `${P}/outfits/chef.png`, pieces: [hair('pixie','Pixie'), hat('chefhat','Chef hat'), clothes('chef','Little chef')] },
  { id: 'explorer', label: 'Explorer', page: `${P}/outfits/explorer.png`, pieces: [hair('braid','Braid'), clothes('explorer','Explorer')] },
  { id: 'soccer', label: 'Green kit', page: `${P}/outfits/soccer.png`, pieces: [hair('pixie','Pixie'), clothes('soccer','Green kit')] },
  { id: 'icecream', label: 'Ice-cream parlour', page: `${P}/outfits/icecream.png`, pieces: [hair('pigtails','Pigtails'), clothes('icecream','Ice-cream parlour')] },
  { id: 'artist', label: 'Paint smock', page: `${P}/outfits/artist.png`, pieces: [hair('bob','Bob'), hat('beret','Beret'), clothes('artist','Paint smock')] },
  { id: 'conductor', label: 'Conductor', page: `${P}/outfits/conductor.png`, pieces: [hair('bob','Bob'), clothes('conductor','Conductor')] },
  { id: 'postie', label: 'Postie', page: `${P}/outfits/postie.png`, pieces: [hair('bob','Bob'), hat('postiecap','Postie cap'), clothes('postie','Postie')] },
  { id: 'school', label: 'School day', page: `${P}/outfits/school.png`, pieces: [hair('bob','Bob'), clothes('school','School day')] },
  { id: 'iceskate', label: 'Ice skate', page: `${P}/outfits/iceskate.png`, pieces: [hair('bun','Bun'), clothes('iceskate','Ice skate')] },
  { id: 'scientist', label: 'Lab coat', page: `${P}/outfits/scientist.png`, pieces: [hair('pixie','Pixie'), clothes('scientist','Lab coat')] },
  { id: 'bee', label: 'Honeybee', page: `${P}/outfits/bee.png`, pieces: [hair('pigtails','Pigtails'), clothes('bee','Honeybee')] },
  { id: 'pirate', label: 'Pirate', page: `${P}/outfits/pirate.png`, pieces: [hair('waves','Waves'), hat('piratehat','Pirate hat'), clothes('pirate','Pirate pinafore')] },
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
    skinHex: '',
    hair: 'none',
    eyes: 'blue',
    eyesHex: '',
    outfit: 'none',
    hat: 'none',
    collection: null,
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
    img.fetchPriority = 'high';
    const timer = setTimeout(() => { img.src = ''; reject(new Error('Doll image timed out: ' + url)); }, 12000);
    img.onload = () => { clearTimeout(timer); resolve(img); };
    img.onerror = () => { clearTimeout(timer); reject(new Error(url)); };
    img.src = url;
  });
  images.set(url, job);
  job.catch(() => images.delete(url));
  return job;
}

export function preloadDollArt() {
  const urls = [
    src('bodies', 'girl.png'),
    ...OUTFITS.filter(o => o.id !== 'none').map(o => src('outfits', `${o.id}.png`)),
    ...HAIR_STYLES.filter(h => h.id !== 'none').map(h => src('hair-clean', `${h.id}.png`)),
    ...HATS.filter(h => h.id !== 'none').map(h => src('hats-clean', `${h.id}.png`)),
  ];
  return Promise.all(urls.map(u => load(u).catch(() => null)));
}

// These masks always read the original artwork, never previously tinted pixels.
// In particular, brown skin must not become an eye-colour selection.
function irisWeight(x, y, r, g, b) {
  if (y < 98 || y > 136) return 0;
  const eyes = [[182, 116, 13, 16], [236, 114, 13, 16],
    [527, 118, 6, 16], [1372, 119, 6, 16]];
  if (!eyes.some(([cx, cy, rx, ry]) => ((x-cx)/rx)**2 + ((y-cy)/ry)**2 <= 1)) return 0;
  return b > r + 4 && b >= g - 6 && b > 55 ? 1 : 0;
}

function skinRegion(ctx) {
  ctx.fillStyle = '#fff';
  const polygon = points => {
    ctx.beginPath(); points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath(); ctx.fill();
  };
  // The four poses share one fixed registration. These regions describe exposed
  // skin, not a colour-key: shadowed skin and antialiased edges remain covered.
  for (const [x,w] of [[125,170],[495,150],[870,160],[1250,160]]) ctx.fillRect(x,0,w,177);
  for (const [x,w] of [[194,32],[548,39],[935,34],[1314,43]]) ctx.fillRect(x,160,w,31);
  polygon([[140,239],[161,250],[135,295],[112,329],[77,329],[97,286]]);
  polygon([[264,239],[285,239],[307,280],[340,329],[308,329],[278,289]]);
  polygon([[552,234],[592,234],[604,345],[531,345],[537,297]]);
  polygon([[872,240],[895,247],[866,290],[841,329],[815,329],[838,284]]);
  polygon([[1000,240],[1024,239],[1041,279],[1080,329],[1047,329],[1020,289]]);
  polygon([[1314,234],[1358,234],[1367,345],[1308,345]]);
  ctx.fillRect(138,355,60,157);
  ctx.fillRect(217,355,65,157);
  ctx.fillRect(510,355,92,157); ctx.fillRect(875,355,60,157); ctx.fillRect(960,355,60,157); ctx.fillRect(1297,355,100,157);
  ctx.globalCompositeOperation = 'destination-out';
  const oval = (x,y,rx,ry) => {ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
  // Brass joints stay printed. Facial details are selected from their actual
  // pixel colours below, not large ovals that leave pale rings on dark skin.
  for(const e of [[140,257,7,8],[278,257,7,8],[175,399,8,9],[242,399,8,9],
    [574,261,8,8],[557,399,6,8],[579,475,8,8],
    [879,257,8,8],[1020,257,8,8],[918,397,8,8],[984,397,8,8],
    [1333,261,8,8],[1350,399,7,8],[1318,475,8,8]]) oval(...e);
  ctx.globalCompositeOperation = 'source-over';
}

let cachedSkinMask;
function getSkinMask() {
  if (cachedSkinMask) return cachedSkinMask;
  const reference = document.createElement('canvas');
  reference.width = W; reference.height = H;
  const ref = reference.getContext('2d');
  skinRegion(ref);
  cachedSkinMask = ref.getImageData(0,0,W,H).data;
  return cachedSkinMask;
}

function smooth(lo, hi, value) {
  const t = Math.max(0, Math.min(1, (value-lo)/(hi-lo)));
  return t*t*(3-2*t);
}

function colourDoll(ctx, skinRgb, eyeRgb) {
  if (!skinRgb && !eyeRgb) return;
  const mask = skinRgb ? getSkinMask() : null;
  const result = ctx.getImageData(0, 0, W, H), d = result.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const x = (i / 4) % W, y = Math.floor(i / 4 / W);
    const r = d[i], g = d[i+1], b = d[i+2];
    if (eyeRgb && irisWeight(x, y, r, g, b)) {
      // Change the iris pigment without brightening its dark rim, pupil or
      // specular highlights. The default blue bypasses recolouring entirely.
      const blue = [72, 138, 196];
      for (let c = 0; c < 3; c++) d[i+c] = Math.min(255, d[i+c] * eyeRgb[c] / blue[c]);
      continue;
    }
    if (!skinRgb || !mask[i+3]) continue;
    // Match the uncoloured artwork's peach skin, before any tint is applied.
    // Soft chroma edges preserve texture; neutral cloth and brown shoes stay put.
    const red = Math.max(1,r);
    const localX = x % CELL;
    const pose = Math.floor(x / CELL);
    const facialDetail = pose === 0
      ? (y >= 79 && y <= 132 && localX >= 158 && localX <= 257)
        || (y >= 142 && y <= 160 && localX >= 187 && localX <= 232)
      : pose === 1 ? y >= 96 && y <= 151 && localX < 155
      : pose === 3 ? y >= 96 && y <= 151 && localX > 206 : false;
    const faceSkin = facialDetail ? smooth(5, 16, r-g) * smooth(4, 13, g-b)
      * smooth(.34, .48, b/red) : 1;
    const coverage = mask[i+3]/255 * (y < 178 ? faceSkin :
      smooth(y>435?.58:.40,y>435?.70:.52,g/red)
      * (1-smooth(.84,.89,g/red)) * smooth(12,25,r-b));
    const base = [235, 184, 148];
    const light = r*.3 + g*.59 + b*.11;
    const baseLight = 195.34;
    const detail = (light-baseLight) * (light>baseLight ? .8 : .65);
    for (let c = 0; c < 3; c++) {
      const warmth = (d[i+c]-light - (base[c]-baseLight)) * .3;
      const tinted = Math.max(0, Math.min(255, skinRgb[c] + detail + warmth));
      d[i+c] += (tinted - d[i+c]) * coverage;
    }
  }
  ctx.putImageData(result, 0, 0);
}

function hexRgb(hex) {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
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

function visualKey(spec) {
  return JSON.stringify([spec.skin, spec.skinHex, spec.eyes, spec.eyesHex, spec.outfit, spec.hair, spec.hat]);
}

// The editor uses the sheet directly: no PNG encoding, data URL parsing or
// second image decode on each phone edit. Repeated callers share the same job.
export function composeDollCanvas(spec) {
  const key = visualKey(spec);
  if (renderedSheets.has(key)) return Promise.resolve(renderedSheets.get(key));
  if (pendingSheets.has(key)) return pendingSheets.get(key);
  const job = renderDollSheet({...spec}).then(canvas => {
    renderedSheets.set(key, canvas);
    while (renderedSheets.size > 3) renderedSheets.delete(renderedSheets.keys().next().value);
    return canvas;
  }).finally(() => pendingSheets.delete(key));
  pendingSheets.set(key, job);
  return job;
}

export async function composeDoll(spec) {
  const key = visualKey(spec);
  if (strips.has(key)) return strips.get(key);
  const canvas = await composeDollCanvas(spec);
  const url = canvas.toDataURL('image/png');
  strips.set(key, url);
  while (strips.size > 6) strips.delete(strips.keys().next().value);
  return url;
}

async function renderDollSheet(spec) {
  const [bodyImg, wearImg, hairImg, hatImg] = await Promise.all([
    load(src('bodies', 'girl.png')),
    spec.outfit && spec.outfit !== 'none' ? load(src('outfits', `${spec.outfit}.png`)) : null,
    spec.hair && spec.hair !== 'none' ? load(src('hair-clean', `${spec.hair}.png`)) : null,
    spec.hat && spec.hat !== 'none' ? load(src('hats-clean', `${spec.hat}.png`)) : null,
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  // The source cutout accidentally made the black pupils transparent. Restore
  // their dark backing before drawing the art, retaining its iris and highlights.
  ctx.fillStyle = '#101820';
  for (const [x,y,rx,ry] of [[184,118,8,9],[233,116,8,9],[528,119,3,9],[1371,118,3,9]]) {
    ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); ctx.fill();
  }
  ctx.drawImage(bodyImg, 0, 0, W, H);
  const skinRgb = hexRgb(spec.skinHex) || SKINS.find(s => s.id === spec.skin)?.rgb;
  const eyeRgb = hexRgb(spec.eyesHex) || (spec.eyes === 'blue' ? null : EYE_COLORS.find(e => e.id === spec.eyes)?.rgb);
  if (wearImg) {
    ctx.drawImage(wearImg, 0, 0, W, H);
  }
  colourDoll(ctx, skinRgb, eyeRgb);
  if (hairImg) {
    const style = HAIR_STYLES.find(h => h.id === spec.hair);
    if (style?.fit === 'sheet') ctx.drawImage(hairImg, 0, 0, W, H);
    else drawLayerOnHead(ctx, bodyImg, hairImg);
  }
  if (hatImg) {
    if (spec.hat === 'witchhat') {
      // The tall hat's repair master includes extra framing around each pose.
      // Register it to the existing head without moving the doll or outfit.
      for (let side=0; side<4; side++) {
        ctx.drawImage(hatImg, side*hatImg.width/4, 0, hatImg.width/4, hatImg.height,
          side*CELL + 57.6 + [8,0,-4,0][side], -45, CELL*.7, H*.7);
      }
    } else ctx.drawImage(hatImg, 0, 0, W, H);
  }
  return canvas;
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
