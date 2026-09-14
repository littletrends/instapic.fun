/** Isolated Catch the Fortune: rings, symbols, fortunes, 1–100. */

export const SYMBOLS = [
  {id: 'key', name: 'Key'},
  {id: 'moon', name: 'Moon'},
  {id: 'eye', name: 'Eye'},
  {id: 'crown', name: 'Crown'},
  {id: 'moth', name: 'Moth'},
  {id: 'hand', name: 'Hand'},
  {id: 'star', name: 'Star'},
  {id: 'bottle', name: 'Bottle'},
];

export const DECOYS = [
  {id: 'crescent', name: 'Crescent', decoyOf: 'moon'},
  {id: 'spark', name: 'Spark', decoyOf: 'star'},
  {id: 'lid', name: 'Lid', decoyOf: 'eye'},
];

export const IRIS_CHAPTERS = [
  {id: 'clear', title: 'The Clear Sign', rings: 1, flash: 2.2, hide: false, opposite: false, decoys: false, prize: 'fortune-slip'},
  {id: 'paired', title: 'The Paired Sign', rings: 2, flash: 2.0, hide: false, opposite: false, decoys: false, prize: 'moon-lantern'},
  {id: 'crossing', title: 'The Crossing Sign', rings: 2, flash: 1.8, hide: false, opposite: true, decoys: false, prize: 'moon-brooch'},
  {id: 'fading', title: 'The Fading Sign', rings: 2, flash: 0.9, hide: true, opposite: false, decoys: false, prize: 'fortune-journal'},
  {id: 'false', title: 'The False Sign', rings: 2, flash: 1.6, hide: false, opposite: true, decoys: true, prize: 'moon-festival-fan'},
  {id: 'mystery', title: 'The Mystery Sign', rings: 3, flash: 2.4, hide: true, opposite: true, decoys: true, prize: 'paper-crown'},
];

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15. Editable. */
export const IRIS_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isIrisWin(level, n) {
  return (IRIS_WINS[level] || IRIS_WINS[0]).includes(n);
}

export function resultNumber(seed) {
  const raw = Math.abs((Number(seed) || 0) * 19 + 7);
  const n = raw % 100;
  return n === 0 ? 100 : n;
}

export function ordinaryFor(n) {
  if (n % 10 === 0) return 'moon-penny';
  if (n % 2 === 0) return 'star-token';
  return 'everyday-penny';
}

export function symbolName(id) {
  const hit = SYMBOLS.find(s => s.id === id) || DECOYS.find(s => s.id === id);
  return hit ? hit.name : id;
}

const LINES = {
  'key|moon': 'Something hidden will open after dark.',
  'heart|moth': 'An old feeling is changing shape.',
  'crown|eye': 'Someone important has noticed you.',
  'bottle|star': 'A small wish has been safely kept.',
  'key|star': 'A door you forgot still has a key in it.',
  'moon|eye': 'Look twice at what the night is showing you.',
  'crown|moth': 'A title sits lightly. Do not crush it.',
  'hand|bottle': 'Hold the small thing. It is already a gift.',
  'hand|star': 'Reach up; the light is closer than it looks.',
  'key|eye': 'What you notice next is meant to be opened.',
  'moon|moth': 'A quiet change, the colour of dust on glass.',
  'crown|star': 'A little ceremony, and then the work.',
  'bottle|moon': 'Keep the wish corked until morning.',
  'hand|moon': 'Offer the night your open palm.',
  'key|crown': 'Authority is only a well-cut tooth.',
  'eye|star': 'A bright noticing. Write it down.',
  'moth|star': 'Follow the small wing, not the lantern.',
  'key|hand': 'You already hold the way through.',
  'crown|bottle': 'A toast to a name you have not spoken.',
  'eye|moth': 'Do not flinch from the soft thing in the glass.',
};

export function fortuneFor(caught) {
  const ids = (caught || []).filter(Boolean);
  if (!ids.length) return 'The glass is shy. Gaze again.';
  if (ids.length === 1) {
    const one = {
      key: 'A lock somewhere is waiting for you.',
      moon: 'Tonight keeps a secret, not a threat.',
      eye: 'You are being seen, kindly.',
      crown: 'A small honour, not a burden.',
      moth: 'Something tender is changing shape.',
      hand: 'Offer help; it will be taken well.',
      star: 'A small light after the noise. Follow it.',
      bottle: 'A wish is corked and safe.',
    };
    return one[ids[0]] || 'The globe has spoken, quietly.';
  }
  const pair = [ids[0], ids[1]].sort().join('|');
  if (LINES[pair]) return LINES[pair];
  if (ids.length > 2) {
    const pair2 = [ids[1], ids[2]].sort().join('|');
    if (LINES[pair2]) return LINES[pair2];
  }
  return symbolName(ids[0]) + ' with ' + symbolName(ids[ids.length - 1]) + ': the globe is being theatrical. Believe the kind part.';
}

function rng(seed) {
  let s = (Number(seed) || 1) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function shuffle(roll, list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(roll() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TAU = Math.PI * 2;

export function slotAt(angle, n) {
  const turns = ((angle / TAU) % 1 + 1) % 1;
  return Math.round(turns * n) % n;
}

export function snapAngle(angle, n) {
  const slot = slotAt(angle, n);
  return (slot / n) * TAU;
}

export function makeGlobe(level, seed) {
  const ch = IRIS_CHAPTERS[level] || IRIS_CHAPTERS[0];
  const roll = rng(seed);
  const pool = SYMBOLS.map(s => s.id);
  const flash = [];
  for (let i = 0; i < ch.rings; i++) {
    let pick = pool[Math.floor(roll() * pool.length)];
    while (flash.includes(pick)) pick = pool[Math.floor(roll() * pool.length)];
    flash.push(pick);
  }
  const rings = [];
  for (let r = 0; r < ch.rings; r++) {
    let glyphs = shuffle(roll, pool);
    if (ch.decoys) {
      const decoy = DECOYS.find(d => d.decoyOf === flash[r]) || DECOYS[r % DECOYS.length];
      glyphs = glyphs.filter(id => id !== decoy.id);
      glyphs[1] = decoy.id;
    }
    if (!glyphs.includes(flash[r])) glyphs[0] = flash[r];
    const n = glyphs.length;
    const targetSlot = glyphs.indexOf(flash[r]);
    const dir = ch.opposite && r % 2 === 1 ? -1 : 1;
    const speed = (0.55 + level * 0.12 + r * 0.08) * dir;
    rings.push({
      glyphs, n, target: flash[r], targetSlot,
      angle: roll() * TAU, speed, stopped: false,
    });
  }
  return {level, seed, flash, rings, flashSecs: ch.flash, hide: ch.hide, opposite: ch.opposite};
}

export function caughtOf(globe) {
  return (globe.rings || []).map(ring => ring.glyphs[slotAt(ring.angle, ring.n)]);
}

export function allMatch(globe) {
  const got = caughtOf(globe);
  return globe.flash.every((id, i) => got[i] === id);
}

export function allStopped(globe) {
  return (globe.rings || []).every(r => r.stopped);
}

export function brakeRing(globe, index) {
  const ring = globe.rings[index];
  if (!ring || ring.stopped) return false;
  ring.angle = snapAngle(ring.angle, ring.n);
  ring.stopped = true;
  ring.speed = 0;
  return true;
}

export function nextLiveRing(globe) {
  return (globe.rings || []).findIndex(r => !r.stopped);
}

export function stepGlobe(globe, dt, reduced) {
  const slow = reduced ? 0.35 : 1;
  for (const ring of globe.rings) {
    if (ring.stopped) continue;
    ring.angle += ring.speed * dt * slow;
  }
}
