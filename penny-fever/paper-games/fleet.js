/** Isolated Water-Gun Fleet: five guns, pressure bursts, moving boats, 1–100. */

export const BURSTS = 10;
export const MIN_PRESSURE = 0.12;
export const GUN_Y = 1048;
export const BURST_LIFE = 0.52;

export const GUNS = [
  {id: 0, x: 150, y: GUN_Y, bend: -1.1, lane: 0},
  {id: 1, x: 300, y: GUN_Y, bend: -0.5, lane: 1},
  {id: 2, x: 450, y: GUN_Y, bend: 0, lane: 1},
  {id: 3, x: 600, y: GUN_Y, bend: 0.5, lane: 1},
  {id: 4, x: 750, y: GUN_Y, bend: 1.1, lane: 2},
];

export const LANES = [340, 500, 650];

export const MARINA_CHAPTERS = [
  {id: 'calm', title: 'Calm Waters', boats: 3, speeds: [70, 90, 80], both: false, bob: false, small: false, hide: false, wind: 0, decoy: false, prize: 'little-sailboat'},
  {id: 'cross', title: 'Crossing Tides', boats: 4, speeds: [90, 70, 110], both: true, bob: false, small: false, hide: false, wind: 0, decoy: false, prize: 'message-bottle'},
  {id: 'choppy', title: 'Choppy Harbour', boats: 4, speeds: [85, 95, 100], both: true, bob: true, small: false, hide: false, wind: 0, decoy: false, prize: 'harbour-washer'},
  {id: 'small', title: 'Small Craft Warning', boats: 5, speeds: [110, 100, 120], both: true, bob: true, small: true, hide: true, wind: 0, decoy: true, prize: 'seaside-day-book'},
  {id: 'current', title: 'Changing Current', boats: 5, speeds: [100, 120, 90], both: true, bob: true, small: true, hide: false, wind: 0.35, decoy: false, prize: 'picnic-parcel'},
  {id: 'midnight', title: 'Midnight Fleet', boats: 6, speeds: [120, 140, 110], both: true, bob: true, small: true, hide: true, wind: 0.25, decoy: true, prize: 'return-postcard'},
];

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15. Editable. */
export const MARINA_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isMarinaWin(level, n) {
  return (MARINA_WINS[level] || MARINA_WINS[0]).includes(n);
}

export function resultNumber(seed) {
  const raw = Math.abs((Number(seed) || 0) * 13 + 41);
  const n = raw % 100;
  return n === 0 ? 100 : n;
}

export function ordinaryFor(n) {
  if (n % 10 === 0) return 'moon-penny';
  if (n % 2 === 0) return 'star-token';
  return 'everyday-penny';
}

export function marinaUnique(level, n, uniqueHit) {
  return !!uniqueHit && isMarinaWin(level, n);
}

function rng(seed) {
  let s = (Number(seed) || 1) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function distToSeg(p, a, b) {
  const x = b.x - a.x, y = b.y - a.y;
  const t = clamp(((p.x - a.x) * x + (p.y - a.y) * y) / (x * x + y * y || 1), 0, 1);
  return Math.hypot(p.x - a.x - x * t, p.y - a.y - y * t);
}

export function makeFleet(level, seed) {
  const ch = MARINA_CHAPTERS[level] || MARINA_CHAPTERS[0];
  const roll = rng(seed);
  const boats = [];
  for (let i = 0; i < ch.boats; i++) {
    const lane = i % 3;
    const dir = ch.both && i % 2 ? -1 : 1;
    const small = ch.small && i % 2 === 1;
    boats.push({
      id: i,
      lane,
      x: 80 + roll() * 740,
      vx: dir * ch.speeds[lane],
      w: small ? 42 : 68,
      unique: false,
      decoy: !!ch.decoy && i === ch.boats - 1,
    });
  }
  const eligible = boats.filter(b => !b.decoy);
  const pick = eligible[Math.floor(roll() * eligible.length) % eligible.length];
  if (pick) pick.unique = true;
  return {level, seed, boats, t: 0};
}

export function boatPose(boat, t, ch) {
  const base = LANES[boat.lane];
  const bob = ch.bob ? Math.sin(t * 2.2 + boat.id * 1.3) * 16 : 0;
  return {x: boat.x, y: base + bob};
}

export function stepFleet(fleet, dt, reduced = false) {
  const ch = MARINA_CHAPTERS[fleet.level] || MARINA_CHAPTERS[0];
  const slow = reduced ? 0.35 : 1;
  fleet.t += dt * slow;
  for (const b of fleet.boats) {
    b.x += b.vx * dt * slow;
    if (b.x > 980) b.x = -70;
    if (b.x < -70) b.x = 980;
  }
  return fleet;
}

export function pressureForLane(lane, gunY = GUN_Y) {
  const y = LANES[lane];
  return clamp((gunY - 210 - y) / 560, 0, 1);
}

export function waterPoint(gun, pressure, age, wind = 0) {
  const life = BURST_LIFE;
  const u = clamp(age / life, 0, 1);
  const y1 = gun.y - (210 + pressure * 560);
  const x1 = gun.x + gun.bend * 50 * (0.7 - pressure) + wind * 120 * u;
  const y = gun.y + (y1 - gun.y) * u - Math.sin(u * Math.PI) * 36;
  const x = gun.x + (x1 - gun.x) * u;
  return {x, y, u, done: u >= 1, x1, y1};
}

export function fireBurst(gunIndex, pressure, wind = 0) {
  if (pressure < MIN_PRESSURE) return null;
  const gun = GUNS[gunIndex] || GUNS[2];
  const p = clamp(pressure, 0, 1);
  const start = waterPoint(gun, p, 0, wind);
  return {
    gun: gun.id, pressure: p, wind,
    x: start.x, y: start.y, age: 0, live: true,
    hit: null, uniqueHit: false, decoyHit: false,
  };
}

export function hitRadius(boat) {
  return Math.max(24, boat.w * 0.4);
}

export function occluded(x, ch) {
  return !!(ch && ch.hide && x > 380 && x < 520);
}

export function advanceBurst(burst, dt, fleet) {
  if (!burst || !burst.live) return burst;
  const ch = MARINA_CHAPTERS[fleet.level] || MARINA_CHAPTERS[0];
  const gun = GUNS[burst.gun] || GUNS[2];
  const wind = burst.wind != null ? burst.wind : ch.wind;
  const before = {x: burst.x, y: burst.y};
  burst.age += dt;
  const p = waterPoint(gun, burst.pressure, burst.age, wind);
  burst.x = p.x;
  burst.y = p.y;
  for (const boat of fleet.boats) {
    const pose = boatPose(boat, fleet.t, ch);
    const d = distToSeg(pose, before, p);
    if (d > hitRadius(boat)) continue;
    if (boat.decoy) {
      burst.decoyHit = true;
      continue;
    }
    burst.hit = boat.id;
    burst.uniqueHit = !!boat.unique;
    burst.live = false;
    burst.x = pose.x;
    burst.y = pose.y;
    return burst;
  }
  if (p.done || burst.age >= BURST_LIFE + 0.02) {
    burst.live = false;
  }
  return burst;
}

export function simulateBurst(burst, fleet, dt = 1 / 120) {
  const b = {...burst};
  const f = {level: fleet.level, seed: fleet.seed, t: fleet.t, boats: fleet.boats.map(x => ({...x}))};
  for (let i = 0; i < 200 && b.live; i++) {
    stepFleet(f, dt, false);
    advanceBurst(b, dt, f);
  }
  if (b.live) b.live = false;
  return b;
}
