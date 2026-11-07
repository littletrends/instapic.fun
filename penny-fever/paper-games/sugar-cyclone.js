import {firstPrizeEligible} from './first-prize.js?v=first-prize-1';
/** Isolated Sugar Cyclone: bowl, recipe, trail, 1–100. */

export const SUGAR = {
  rose: {name: 'Rose', mark: '♥', color: '#e2a0b4'},
  mint: {name: 'Mint', mark: '●', color: '#a6c9ba'},
  cream: {name: 'Cream', mark: '▬', color: '#f4e6c8'},
  peach: {name: 'Peach', mark: '❀', color: '#f0b896'},
  star: {name: 'Star', mark: '★', color: '#fff0a8'},
  moon: {name: 'Moon', mark: '☽', color: '#c8d8f0'},
  burnt: {name: 'Burnt', mark: '✕', color: '#6b5043'},
};

export const FLOSSIE_CHAPTERS = [
  {id: 'pink', title: 'Little Pink Cloud', recipe: ['rose', 'rose', 'rose'], speed: 0.92, turn: 2.4, burnt: false, decoys: false, recoveries: 1, heat: 30, prize: 'fairy-floss', shape: 'cloud'},
  {id: 'twirl', title: 'Two-Colour Twirl', recipe: ['rose', 'mint', 'rose', 'mint'], speed: 1.02, turn: 2.5, burnt: false, decoys: false, recoveries: 1, heat: 28, prize: 'pocket-cloud', shape: 'heart'},
  {id: 'stripe', title: 'Striped Daydream', recipe: ['rose', 'mint', 'cream', 'rose', 'mint'], speed: 1.08, turn: 2.6, burnt: false, decoys: true, recoveries: 1, heat: 26, prize: 'cloud-jar', shape: 'stripe'},
  {id: 'heart', title: 'Heart in the Clouds', recipe: ['rose', 'peach', 'rose', 'peach', 'rose', 'peach'], speed: 1.14, turn: 2.7, burnt: true, decoys: true, recoveries: 1, heat: 24, prize: 'toffee-apple', shape: 'heart'},
  {id: 'starry', title: 'Starry Sugar', recipe: ['mint', 'star', 'cream', 'star', 'mint', 'star'], speed: 1.22, turn: 2.85, burnt: true, decoys: true, recoveries: 0, heat: 22, prize: 'swirl-lolly', shape: 'star'},
  {id: 'crown', title: 'Sugar Crown', recipe: ['rose', 'mint', 'cream', 'peach', 'star', 'moon', 'rose'], speed: 1.3, turn: 3.0, burnt: true, decoys: true, recoveries: 0, heat: 20, prize: 'birthday-crown-box', shape: 'crown'},
];

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15. Editable. */
export const FLOSSIE_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isFlossieWin(level, n) {
  if(firstPrizeEligible('fairy-floss',level))return true;
  return (FLOSSIE_WINS[level] || FLOSSIE_WINS[0]).includes(n);
}

export function resultNumber(seed) {
  const raw = Math.abs((Number(seed) || 0) * 29 + 3);
  const n = raw % 100;
  return n === 0 ? 100 : n;
}

export function ordinaryFor(n) {
  if (n % 10 === 0) return 'moon-penny';
  if (n % 2 === 0) return 'star-token';
  return 'everyday-penny';
}

export function sugarName(id) {
  return SUGAR[id]?.name || id;
}

function rng(seed) {
  let s = (Number(seed) || 1) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const TAU = Math.PI * 2;
export const BOWL_R = 188;

function placeWisp(kind, roll, i) {
  const a = (i * 2.39996 + roll() * 0.4) % TAU;
  const r = 62 + (i % 5) * 18 + roll() * 10;
  return {id: i, kind, x: Math.cos(a) * r, y: Math.sin(a) * r, taken: false, mark: SUGAR[kind]?.mark || '•'};
}

export function makeCyclone(level, seed) {
  const ch = FLOSSIE_CHAPTERS[level] || FLOSSIE_CHAPTERS[0];
  const roll = rng(seed);
  const wisps = [];
  ch.recipe.forEach((kind, i) => wisps.push(placeWisp(kind, roll, i)));
  if (ch.decoys) {
    const decoys = Object.keys(SUGAR).filter(k => k !== 'burnt' && !ch.recipe.includes(k));
    decoys.slice(0, 1 + (level > 3 ? 1 : 0)).forEach((kind, i) => {
      wisps.push(placeWisp(kind, roll, wisps.length + i));
    });
  }
  if (ch.burnt) {
    const n = level >= 5 ? 3 : 2;
    for (let i = 0; i < n; i++) wisps.push(placeWisp('burnt', roll, wisps.length + i));
  }
  return {
    level, seed,
    recipe: ch.recipe.slice(),
    wound: 0,
    x: 0, y: 0,
    heading: roll() * TAU,
    speed: ch.speed,
    turn: ch.turn,
    trail: [{x: 0, y: 0}],
    wisps,
    recoveries: ch.recoveries,
    heatLeft: ch.heat,
    heatMax: ch.heat,
    knots: 0,
    wobble: 0,
    done: false,
    failed: '',
    shape: ch.shape,
    hide: true,
  };
}

export function recipeDone(bowl) {
  return !!bowl && (bowl.done || bowl.wound >= (bowl.recipe || []).length);
}

function eatWisp(bowl, wisp) {
  if (!wisp || wisp.taken) return false;
  wisp.taken = true;
  if (wisp.kind === 'burnt') {
    bowl.wobble = 0.9;
    bowl.heatLeft = Math.max(0, bowl.heatLeft - 2.2);
    return true;
  }
  const need = bowl.recipe[bowl.wound];
  if (wisp.kind === need) {
    bowl.wound += 1;
    for (let i = 0; i < 7; i++) {
      const a = bowl.heading + Math.PI + i * 0.18;
      bowl.trail.push({
        x: bowl.x + Math.cos(a) * (8 + i * 3),
        y: bowl.y + Math.sin(a) * (8 + i * 3),
      });
    }
    if (bowl.wound >= bowl.recipe.length) bowl.done = true;
  } else {
    bowl.knots += 1;
    bowl.heatLeft = Math.max(0, bowl.heatLeft - 1.4);
    bowl.trail.push({x: bowl.x + 6, y: bowl.y + 4});
  }
  return true;
}

export function nibbleCorrect(bowl) {
  if (!bowl || bowl.done || bowl.failed) return false;
  const need = bowl.recipe[bowl.wound];
  const wisp = (bowl.wisps || []).find(w => !w.taken && w.kind === need);
  if (!wisp) return false;
  return eatWisp(bowl, wisp);
}

export function turnStick(bowl, dir) {
  if (!bowl || bowl.done || bowl.failed) return;
  const sign = dir < 0 ? -1 : dir > 0 ? 1 : 0;
  bowl.heading += sign * bowl.turn * 0.08;
}

function tangle(bowl) {
  if (bowl.recoveries > 0) {
    bowl.recoveries -= 1;
    if (bowl.trail.length > 18) bowl.trail = bowl.trail.slice(-18);
    return;
  }
  bowl.failed = 'tangle';
}

export function stepCyclone(bowl, dt, reduced) {
  if (!bowl || bowl.done || bowl.failed) return;
  const slow = reduced ? 0.4 : 1;
  bowl.heatLeft -= dt;
  if (bowl.heatLeft <= 0) {
    bowl.failed = 'heat';
    return;
  }
  if (bowl.wobble > 0) bowl.wobble -= dt;
  const wob = bowl.wobble > 0 ? Math.sin(bowl.heatLeft * 18) * 0.55 : 0;
  const sp = bowl.speed * slow * (70 + bowl.wound * 6);
  bowl.x += Math.cos(bowl.heading + wob) * sp * dt;
  bowl.y += Math.sin(bowl.heading + wob) * sp * dt;
  const dist = Math.hypot(bowl.x, bowl.y);
  const maxR = BOWL_R - 16;
  if (dist > maxR) {
    const nx = bowl.x / dist, ny = bowl.y / dist;
    bowl.x = nx * maxR;
    bowl.y = ny * maxR;
    const dot = bowl.heading;
    const hx = Math.cos(dot), hy = Math.sin(dot);
    const refx = hx - 2 * (hx * nx + hy * ny) * nx;
    const refy = hy - 2 * (hx * nx + hy * ny) * ny;
    bowl.heading = Math.atan2(refy, refx);
    if (bowl.level >= 3) tangle(bowl);
    if (bowl.failed) return;
  }
  bowl.trail.push({x: bowl.x, y: bowl.y});
  if (bowl.trail.length > 420) bowl.trail.shift();
  const skip = 16 + bowl.wound * 2;
  for (let i = 0; i < bowl.trail.length - skip; i++) {
    const p = bowl.trail[i];
    if (Math.hypot(p.x - bowl.x, p.y - bowl.y) < 9) {
      tangle(bowl);
      break;
    }
  }
  if (bowl.failed) return;
  for (const w of bowl.wisps) {
    if (w.taken) continue;
    if (Math.hypot(w.x - bowl.x, w.y - bowl.y) < 16) eatWisp(bowl, w);
    if (bowl.done) return;
  }
}
