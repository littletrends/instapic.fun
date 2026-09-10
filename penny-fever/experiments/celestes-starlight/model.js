// Pure optics and puzzle state. Independent of the alley and all saved systems.
export const WORLD = Object.freeze({ width: 900, height: 1200 });
export const STEP = Math.PI / 8;
export const MIRROR_HALF = 44;
export const norm = a => ((a % Math.PI) + Math.PI) % Math.PI;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const CHAPTERS = [
  {
    title: 'A little first light', name: 'The paper swallow',
    line: 'Three little glasses. One constellation waiting to wake.',
    route: [[450, 1025], [450, 790], [260, 790], [260, 440], [650, 440]],
    stars: [[450, 905], [260, 605], [510, 440]], initial: [0, 3, 1],
    hints: ['Send the light left, towards Glass II.', 'Send the light up, towards Glass III.', 'Send the light right, into the sky bell.'],
    moons: [],
  },
  {
    title: 'Across the midnight sky', name: 'The wandering fox',
    line: 'A diagonal detour, and a trail that crosses itself.',
    route: [[450, 1025], [450, 840], [650, 640], [350, 340], [240, 450], [600, 450]],
    stars: [[450, 930], [550, 740], [500, 490], [295, 395], [440, 450]], initial: [2, 4, 1, 0],
    hints: ['Aim up and right, towards Glass II.', 'Aim up and left, towards Glass III.', 'Aim down and left, towards Glass IV.', 'Send the light right, into the sky bell.'],
    moons: [],
  },
  {
    title: 'Around the moon', name: 'The sleeping hare',
    line: 'The moon casts a shadow. Find the long way round.',
    route: [[450, 1025], [450, 860], [230, 860], [230, 550], [650, 550], [650, 320], [450, 320]],
    stars: [[450, 948], [340, 860], [230, 695], [455, 550], [650, 419], [546, 320]], initial: [0, 2, 0, 4, 1],
    hints: ['Go left before reaching the moon.', 'Send the light up the left side.', 'Send it right, above the moon.', 'Send the light up, towards Glass V.', 'Send it left to the waiting sky bell.'],
    moons: [[455, 684, 66]],
  },
].map(c => ({ ...c, mirrors: c.route.slice(1, -1), source: c.route[0], receiver: c.route.at(-1),
  solution: c.route.slice(1, -1).map((p, i) => {
    const before = c.route[i], after = c.route[i + 2];
    return norm((Math.atan2(p[1] - before[1], p[0] - before[0]) + Math.atan2(after[1] - p[1], after[0] - p[0])) / 2);
  }),
}));
export function createGame(chapter = 0) {
  const index = clamp(Math.trunc(chapter) || 0, 0, CHAPTERS.length - 1);
  const c = CHAPTERS[index];
  const g = { chapter: index, phase: 'ready', angles: c.initial.map(i => i * STEP), selected: 0,
    turns: 0, hints: 0, history: [], gesture: null, flight: 0, ray: null, frozenRay: null };
  refresh(g); return g;
}
export function start(g) { if (g.phase === 'ready') g.phase = 'playing'; }
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
export function raySegment(origin, dir, a, b) {
  const edge = [b[0] - a[0], b[1] - a[1]], delta = [a[0] - origin[0], a[1] - origin[1]];
  const denominator = cross(dir, edge);
  if (Math.abs(denominator) < 1e-8) return null;
  const t = cross(delta, edge) / denominator, u = cross(delta, dir) / denominator;
  return t > .01 && u >= -1e-8 && u <= 1 + 1e-8 ? t : null;
}
export function rayCircle(origin, dir, center, radius) {
  const dx = origin[0] - center[0], dy = origin[1] - center[1];
  const b = dx * dir[0] + dy * dir[1], c = dx * dx + dy * dy - radius * radius;
  const discriminant = b * b - c;
  if (discriminant < 0) return null;
  const a = -b - Math.sqrt(discriminant), z = -b + Math.sqrt(discriminant);
  return a > .01 ? a : z > .01 ? z : null;
}
export function segmentDistance(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
export function mirrorEnds(center, angle) {
  const x = Math.cos(angle) * MIRROR_HALF, y = Math.sin(angle) * MIRROR_HALF;
  return [[center[0] - x, center[1] - y], [center[0] + x, center[1] + y]];
}
export function trace(g) {
  const c = CHAPTERS[g.chapter], segments = [], lit = c.stars.map(() => false), visited = new Set();
  let origin = [...c.source], dir = [0, -1], receiverLit = false, loop = false, blocked = null, length = 0;
  const bounds = [[[150, 290], [750, 290]], [[750, 290], [750, 1090]], [[750, 1090], [150, 1090]], [[150, 1090], [150, 290]]];
  for (let bounce = 0; bounce < 32; bounce++) {
    let hit = { t: 1600, kind: 'edge', index: -1 };
    const offer = (t, kind, index = -1) => { if (t !== null && t < hit.t) hit = { t, kind, index }; };
    for (const [a, b] of bounds) offer(raySegment(origin, dir, a, b), 'edge');
    c.mirrors.forEach((p, i) => { const [a, b] = mirrorEnds(p, g.angles[i]); offer(raySegment(origin, dir, a, b), 'mirror', i); });
    c.moons.forEach(([x, y, r], i) => offer(rayCircle(origin, dir, [x, y], r), 'moon', i));
    offer(rayCircle(origin, dir, c.receiver, 24), 'receiver');
    const end = [origin[0] + dir[0] * hit.t, origin[1] + dir[1] * hit.t];
    c.stars.forEach((p, i) => { if (segmentDistance(p, origin, end) <= 22) lit[i] = true; });
    segments.push({ a: [...origin], b: end, length: hit.t, end: hit.kind, mirror: hit.index }); length += hit.t;
    if (hit.kind === 'receiver') { receiverLit = true; break; }
    if (hit.kind !== 'mirror') { blocked = hit.kind; break; }
    const angle = g.angles[hit.index];
    const outAngle = 2 * angle - Math.atan2(dir[1], dir[0]);
    dir = [Math.cos(outAngle), Math.sin(outAngle)];
    const key = `${hit.index}:${dir.map(x => Math.round(x * 1000)).join(',')}`;
    if (visited.has(key)) { loop = true; break; }
    visited.add(key);
    origin = [end[0] + dir[0] * .04, end[1] + dir[1] * .04];
  }
  if (segments.length >= 32) loop = true;
  return { segments, lit, receiverLit, loop, blocked, length, solved: lit.every(Boolean) && receiverLit && !loop };
}
export function refresh(g) { g.ray = trace(g); }
export function beginTurn(g, index) {
  if (g.phase !== 'playing' || g.gesture || !Number.isInteger(index) || index < 0 || index >= g.angles.length) return false;
  g.selected = index; g.gesture = { index, from: g.angles[index] }; return true;
}
export function previewTurn(g, angle) {
  if (!g.gesture || !Number.isFinite(angle)) return;
  g.angles[g.gesture.index] = norm(angle); refresh(g);
}
export function endTurn(g, cancelled = false) {
  if (!g.gesture) return false;
  const { index, from } = g.gesture;
  const to = cancelled ? from : norm(Math.round(g.angles[index] / STEP) * STEP);
  const changed = Math.abs(Math.sin(to - from)) > 1e-6;
  if (!cancelled && changed) {
    const previous = [...g.angles]; previous[index] = from;
    g.history.push({ angles: previous, selected: index }); g.history = g.history.slice(-100); g.turns++;
  }
  g.angles[index] = to; g.gesture = null; refresh(g); return !cancelled && changed;
}
export function nudge(g, index, direction) {
  if (!Number.isFinite(direction) || !beginTurn(g, index)) return false;
  previewTurn(g, g.angles[index] + Math.sign(direction) * STEP); return endTurn(g);
}
export function undo(g) {
  if (g.phase !== 'playing' || g.gesture || !g.history.length) return false;
  const old = g.history.pop(); g.angles = old.angles; g.selected = old.selected; g.turns++; refresh(g); return true;
}
export function hint(g) {
  if (g.phase !== 'playing' || g.gesture) return null;
  const c = CHAPTERS[g.chapter];
  for (let i = 0; i < c.solution.length; i++) {
    if (Math.abs(Math.sin(g.angles[i] - c.solution[i])) < 1e-6) continue;
    g.selected = i; g.hints++;
    let clicks = ((Math.round((c.solution[i] - g.angles[i]) / STEP) % 8) + 8) % 8;
    if (clicks > 4) clicks -= 8;
    return { index: i, clicks, text: c.hints[i] };
  }
  return null;
}
export function launch(g) {
  if (g.phase !== 'playing' || g.gesture || !g.ray.solved) return false;
  g.frozenRay = g.ray; g.phase = 'flying'; g.flight = 0; return true;
}
export function tick(g, delta, reduced = false) {
  if (g.phase !== 'flying' || !Number.isFinite(delta) || delta <= 0) return;
  g.flight += Math.min(delta, .1) * 410;
  if (reduced || g.flight >= g.frozenRay.length + 25) g.phase = 'won';
}
export function pointOnRay(ray, travel) {
  let remaining = clamp(travel, 0, ray.length);
  for (const segment of ray.segments) {
    if (remaining <= segment.length) {
      const f = segment.length ? remaining / segment.length : 0;
      return [segment.a[0] + (segment.b[0] - segment.a[0]) * f, segment.a[1] + (segment.b[1] - segment.a[1]) * f];
    }
    remaining -= segment.length;
  }
  return [...ray.segments.at(-1).b];
}
