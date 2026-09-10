// Standalone deterministic simulation. No PF state, wallet, services or storage.
export const WORLD = Object.freeze({ width: 900, height: 1200 });
export const SHORE = Object.freeze([
  [260, 232], [655, 232], [733, 395], [750, 880],
  [639, 1040], [315, 1040], [200, 880], [177, 535], [250, 355],
]);
export const BOAT_RADIUS = 18;
export const JET_RANGE = 240;
export const COURSES = Object.freeze([
  {
    name: 'The lantern post', subtitle: 'A little boat. A very big first voyage.',
    hint: 'Collect the three floating letters, then settle inside the golden berth.',
    start: [445, 966], dock: [460, 285], par: 65,
    letters: [[300, 790], [627, 589], [361, 360]],
    islands: [[450, 735, 63], [450, 490, 50]], gate: false, ferry: false, eddy: false,
  },
  {
    name: 'Mind the tide', subtitle: 'The harbour has a rhythm of its own.',
    hint: 'Watch the red boom gates. Wait for the opening; short bursts beat a full tank.',
    start: [574, 966], dock: [460, 285], par: 85,
    letters: [[320, 819], [625, 644], [365, 340]],
    islands: [[462, 769, 57], [317, 410, 35]], gate: true, ferry: false, eddy: false,
  },
  {
    name: 'Special delivery', subtitle: 'A ferry, a whirlpool, and absolutely no hurry.',
    hint: 'Give the ferry room. Work around the swirling water, or use it to carry you.',
    start: [450, 976], dock: [460, 285], par: 100,
    letters: [[300, 828], [644, 687], [351, 355]],
    islands: [[566, 837, 43], [371, 612, 38]], gate: true, ferry: true, eddy: true,
  },
  {
    name: 'Postcard cove', subtitle: 'A slower garden of little islands.',
    hint: 'Weave between the three islands. Short bursts keep the letters dry.',
    start: [360, 970], dock: [460, 285], par: 75,
    letters: [[580, 860], [280, 600], [620, 380]],
    islands: [[430, 780, 50], [540, 540, 44], [330, 420, 38]], gate: false, ferry: false, eddy: false,
  },
  {
    name: 'The inner basin', subtitle: 'The boom still keeps time. The letters have moved.',
    hint: 'Wait for the red boom to open, then slip through with a short burst.',
    start: [520, 968], dock: [460, 285], par: 90,
    letters: [[300, 840], [610, 600], [340, 350]],
    islands: [[470, 800, 52], [300, 430, 36]], gate: true, ferry: false, eddy: false,
  },
  {
    name: 'Picnic on the tide', subtitle: 'Ferry, boom, whirlpool — and a picnic to deliver.',
    hint: 'Collect around the ferry, skip the eddy if it pulls, and wait for the boom.',
    start: [430, 978], dock: [460, 285], par: 110,
    letters: [[620, 850], [290, 640], [600, 360]],
    islands: [[500, 860, 40], [360, 580, 42]], gate: true, ferry: true, eddy: true,
  },
]);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function createGame(course = 0) {
  const index = clamp(Math.trunc(course) || 0, 0, COURSES.length - 1);
  const c = COURSES[index];
  return {
    course: index, phase: 'ready', time: 0, pressure: 1, bumps: 0,
    letters: c.letters.map(() => false), dockTime: 0, rating: 0,
    boat: { x: c.start[0], y: c.start[1], vx: 0, vy: 0, angle: -Math.PI / 2, roll: 0 },
    jet: null, bumpCooldown: 0, events: [], distance: 0, jetSeconds: 0,
  };
}
export function startGame(g) { if (g.phase === 'ready') g.phase = 'playing'; }
export function allLetters(g) { return g.letters.every(Boolean); }
export function gatePose(g) {
  const open = (1 - Math.cos(g.time * Math.PI * 2 / 7)) / 2;
  return {
    open,
    arms: [
      { a: [212, 515], b: [435 - open * 95, 515 - open * 108], r: 12 },
      { a: [738, 515], b: [465 + open * 95, 515 - open * 108], r: 12 },
    ],
  };
}
export function ferryPose(g) {
  const t = g.time * .47;
  const x = 502 + Math.sin(t) * 111;
  return { x, y: 622, vx: Math.cos(t) * 52.17, a: [x - 48, 622], b: [x + 48, 622], r: 20 };
}
export function closestPoint(x, y, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return { x: a[0] + t * dx, y: a[1] + t * dy };
}
function bump(g, x, y, radius, vx = 0) {
  const b = g.boat;
  const dx = b.x - x, dy = b.y - y, d = Math.hypot(dx, dy);
  const r = radius + BOAT_RADIUS;
  if (d >= r) return;
  const nx = d > .001 ? dx / d : 0, ny = d > .001 ? dy / d : -1;
  b.x = x + nx * r; b.y = y + ny * r;
  const into = (b.vx - vx) * nx + b.vy * ny;
  if (into < 0) { b.vx -= nx * into * 1.35; b.vy -= ny * into * 1.35; }
  if (into < -22 && g.bumpCooldown <= 0) {
    g.bumps++; g.bumpCooldown = .65; b.roll = clamp(into / 240, -.4, .4);
    g.events.push({ type: 'bump', x: b.x, y: b.y });
  }
}
function segmentBump(g, a, b, r, vx = 0) {
  const p = closestPoint(g.boat.x, g.boat.y, a, b);
  bump(g, p.x, p.y, r, vx);
}
export function pointInHarbour(x, y) {
  let inside = false;
  for (let i = 0, j = SHORE.length - 1; i < SHORE.length; j = i++) {
    const a = SHORE[i], b = SHORE[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
function tick(g, input, dt) {
  const c = COURSES[g.course], b = g.boat;
  g.time += dt; g.bumpCooldown -= dt;
  let ax = 0, ay = 0;
  g.jet = null;
  if (input?.active && !input.anchor && Number.isFinite(input.x) && Number.isFinite(input.y)) {
    const dx = b.x - input.x, dy = b.y - input.y, d = Math.hypot(dx, dy);
    if (d > 6 && d < JET_RANGE && g.pressure > .005) {
      const force = 360 * (1 - d / (JET_RANGE + 40));
      ax += dx / d * force; ay += dy / d * force;
      g.jet = { x: input.x, y: input.y, tx: b.x, ty: b.y, strength: force / 360 };
      g.pressure = Math.max(0, g.pressure - dt * .205);
      g.jetSeconds += dt;
    }
  } else g.pressure = Math.min(1, g.pressure + dt * .32);
  if (c.eddy) {
    const dx = b.x - 465, dy = b.y - 753, d = Math.hypot(dx, dy);
    if (d < 140 && d > 1) {
      const force = (1 - d / 140) * 135;
      ax += -dy / d * force; ay += dx / d * force;
    }
  }
  // Exponential drag gives the same response at 30, 60 or 120 Hz.
  b.vx += ax * dt; b.vy += ay * dt;
  const drag = Math.exp(-(input?.anchor ? 8 : 1.05) * dt);
  b.vx *= drag; b.vy *= drag;
  const speed = Math.hypot(b.vx, b.vy);
  if (speed > 175) { b.vx *= 175 / speed; b.vy *= 175 / speed; }
  const oldX = b.x, oldY = b.y;
  b.x += b.vx * dt; b.y += b.vy * dt;
  // Two passes resolve corners and overlapping moving boom/shore contacts.
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < SHORE.length; i++) segmentBump(g, SHORE[i], SHORE[(i + 1) % SHORE.length], 0);
    for (const [x, y, r] of c.islands) bump(g, x, y, r);
    if (c.gate) for (const arm of gatePose(g).arms) segmentBump(g, arm.a, arm.b, arm.r);
    if (c.ferry) { const f = ferryPose(g); segmentBump(g, f.a, f.b, f.r, f.vx); }
  }
  // Safety net for moving geometry: a boat is never allowed behind the scenery.
  if (!pointInHarbour(b.x, b.y)) { b.x = oldX; b.y = oldY; b.vx = 0; b.vy = 0; }
  g.distance += Math.hypot(b.x - oldX, b.y - oldY);
  if (speed > 8) {
    const target = Math.atan2(b.vy, b.vx);
    const delta = Math.atan2(Math.sin(target - b.angle), Math.cos(target - b.angle));
    b.angle += delta * (1 - Math.exp(-dt * 4));
    b.roll += (clamp(delta * speed / 350, -.22, .22) - b.roll) * dt * 4;
  } else b.roll *= Math.exp(-dt * 3);
  c.letters.forEach(([x, y], i) => {
    if (!g.letters[i] && Math.hypot(b.x - x, b.y - y) < 40) {
      g.letters[i] = true; g.events.push({ type: 'letter', x, y, index: i });
    }
  });
  const atDock = Math.hypot(b.x - c.dock[0], b.y - c.dock[1]) < 44;
  const settled = Math.hypot(b.vx, b.vy) < 38;
  if (allLetters(g) && atDock && settled) g.dockTime += dt;
  else g.dockTime = Math.max(0, g.dockTime - dt * 2);
  if (g.dockTime >= 1.1) {
    g.phase = 'won'; b.vx = 0; b.vy = 0; g.jet = null;
    g.rating = 1 + Number(g.bumps <= 4) + Number(g.time <= c.par);
    g.events.push({ type: 'won', x: b.x, y: b.y });
  }
}
export function step(g, input = {}, delta = 0) {
  g.events = [];
  if (g.phase !== 'playing' || !Number.isFinite(delta) || delta <= 0) return;
  // Never catch up a hidden tab or a suspended machine. Maximum twelve substeps.
  let remaining = Math.min(delta, .1);
  while (remaining > .000001 && g.phase === 'playing') {
    const dt = Math.min(remaining, 1 / 120);
    tick(g, input, dt); remaining -= dt;
  }
}
