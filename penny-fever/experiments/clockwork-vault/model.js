// Pure puzzle rules. No DOM, wallet, saved progress, network or Instapic hooks.
export const NOTCHES = 12;
export const STEP = Math.PI * 2 / NOTCHES;
export const DIALS = ['Crown', 'Star', 'Moon'];
export const LEVELS = [
  {
    title: 'The apprentice’s lock', label: '01 · Find the feeling',
    story: '“A patient hand opens more doors than a heavy hammer.”',
    instruction: 'Drag each brass ring. Bring its coloured jewel to the matching socket at twelve o’clock.',
    start: [3, 8, 5], links: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    rules: ['Crown turns alone.', 'Star turns alone.', 'Moon turns alone.'],
  },
  {
    title: 'Borrowed motion', label: '02 · Follow the connections',
    story: '“Some wheels have a habit of taking their neighbours along.”',
    instruction: 'The rings are coupled now. Watch which other jewel moves when you turn a ring.',
    start: [7, 4, 9], links: [[1, -1, 0], [0, 1, -1], [0, 0, 1]],
    rules: ['Crown drives Star backwards.', 'Star drives Moon backwards.', 'Moon turns alone.'],
  },
  {
    title: 'The keeper’s secret', label: '03 · Unpick the clockwork',
    story: '“The moon bargains in twos. Mind what it takes along.”',
    instruction: 'A hidden reduction gear joins the circuit. Each Moon notch moves Crown two notches backwards. Read the workshop notes and try a different order.',
    start: [5, 9, 2], links: [[1, -1, 0], [0, 1, -1], [-2, 0, 1]],
    rules: ['Crown drives Star backwards.', 'Star drives Moon backwards.', 'Moon drives Crown backwards two notches.'],
  },
  {
    title: 'Three hands at once', label: '04 · A crowded axle',
    story: '“When one wheel moves, the others like to gossip.”',
    instruction: 'Crown now turns every ring. Set Star and Moon with the quieter wheels, then bring Crown home last.',
    start: [4, 10, 7], links: [[1, 1, 1], [0, 1, 1], [0, 0, 1]],
    rules: ['Crown drives Star and Moon forwards.', 'Star drives Moon forwards.', 'Moon turns alone.'],
  },
  {
    title: 'Crossed springs', label: '05 · Listen twice',
    story: '“A spring remembers every neighbour it was wound against.”',
    instruction: 'Crown turns all three, but Moon travels backwards. Star still leads Moon forward. Order matters more than force.',
    start: [8, 3, 11], links: [[1, 1, -1], [0, 1, 1], [0, 0, 1]],
    rules: ['Crown drives Star forwards and Moon backwards.', 'Star drives Moon forwards.', 'Moon turns alone.'],
  },
  {
    title: 'The closed circuit', label: '06 · Finish the round',
    story: '“The last lock is a little conversation between all three rings.”',
    instruction: 'Moon has joined the circuit. It turns Crown backwards and Star forwards. Unpick the loop a notch at a time.',
    start: [6, 2, 9], links: [[1, -1, 0], [0, 1, -1], [-1, 1, 1]],
    rules: ['Crown drives Star backwards.', 'Star drives Moon backwards.', 'Moon drives Crown backwards and Star forwards.'],
  },
];
export const wrap = n => ((n % NOTCHES) + NOTCHES) % NOTCHES;
export const signedAngle = n => Math.atan2(Math.sin(n), Math.cos(n));
export const aligned = values => values.every(n => wrap(n) === 0);
export function moved(values, level, dial, steps) {
  if (!Number.isInteger(dial) || dial < 0 || dial > 2 || !Number.isFinite(steps)) return [...values];
  return values.map((n, i) => n + LEVELS[level].links[dial][i] * steps);
}

export class VaultPuzzle {
  constructor(level = 0) { this.reset(level); }
  reset(level = this.level) {
    this.level = Math.max(0, Math.min(LEVELS.length - 1, Math.trunc(level) || 0));
    this.positions = [...LEVELS[this.level].start];
    this.history = []; this.turns = 0; this.phase = 'locked';
  }
  turn(dial, steps) {
    if (this.phase !== 'locked' || !Number.isInteger(steps) || !steps || Math.abs(steps) > 120 || !Number.isInteger(dial) || dial < 0 || dial > 2) return false;
    this.history.push([...this.positions]);
    this.positions = moved(this.positions, this.level, dial, steps);
    this.turns++;
    return true;
  }
  undo() {
    if (this.phase !== 'locked' || !this.history.length) return false;
    this.positions = this.history.pop(); this.turns = Math.max(0, this.turns - 1);
    return true;
  }
  open() {
    if (this.phase !== 'locked' || !aligned(this.positions)) return false;
    this.phase = 'opening'; return true;
  }
  doorOpened() { if (this.phase === 'opening') this.phase = 'drawer'; }
  take() { if (this.phase !== 'drawer') return false; this.phase = 'treasure'; return true; }
  // Shortest sequence of single notches; finite authored graph (12³ states).
  hint() {
    if (this.phase !== 'locked' || aligned(this.positions)) return null;
    const initial = this.positions.map(wrap), key = v => v.join(',');
    const queue = [{v: initial, first: null}], seen = new Set([key(initial)]);
    for (let at = 0; at < queue.length; at++) {
      const node = queue[at];
      for (let dial = 0; dial < 3; dial++) for (const step of [-1, 1]) {
        const v = moved(node.v, this.level, dial, step).map(wrap), k = key(v);
        if (seen.has(k)) continue;
        const first = node.first || {dial, step};
        if (aligned(v)) return first;
        seen.add(k); queue.push({v, first});
      }
    }
    return null;
  }
}

// Time-based, damped motion: no dependence on the display's refresh rate.
export function spring(value, velocity, target, dt, stiffness = 180, damping = 27) {
  let x = value, v = velocity;
  const elapsed = Math.max(0, Math.min(.05, dt));
  const ticks = Math.max(1, Math.ceil(elapsed / .008));
  for (let i = 0; i < ticks; i++) {
    const h = elapsed / ticks;
    v += ((target - x) * stiffness - v * damping) * h;
    x += v * h;
  }
  if (Math.abs(target - x) < .0005 && Math.abs(v) < .001) return [target, 0];
  return [x, v];
}
