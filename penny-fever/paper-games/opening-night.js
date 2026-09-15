import {firstPrizeEligible} from './first-prize.js?v=first-prize-1';
/** Isolated Opening Night: golden-key frogger, 1–100. */

export const BEA_CHAPTERS = [
  {id: 'door', title: 'The Stage Door', lives: 3, need: [], prize: 'cue-script'},
  {id: 'costume', title: 'Costume Crossing', lives: 3, need: ['token'], prize: 'velvet-mask'},
  {id: 'scenery', title: 'Scenery Shift', lives: 3, need: [], prize: 'secret-door-key'},
  {id: 'spotlight', title: 'Mind the Spotlight', lives: 3, need: ['pass-a', 'pass-b'], prize: 'showman-ribbon'},
  {id: 'trap', title: 'Trapdoor Rehearsal', lives: 3, need: ['cue-1', 'cue-2'], prize: 'cue-card'},
  {id: 'opening', title: 'Opening Night', lives: 3, need: ['prop', 'costume', 'card'], prize: 'stage-door-pass'},
];

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15. Editable. */
export const BEA_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isBeaWin(level, n) {
  if(firstPrizeEligible('pass',level))return true;
  return (BEA_WINS[level] || BEA_WINS[0]).includes(n);
}

export function resultNumber(seed) {
  const raw = Math.abs((Number(seed) || 0) * 47 + 23);
  const n = raw % 100;
  return n === 0 ? 100 : n;
}

export function ordinaryFor(n) {
  if (n % 10 === 0) return 'moon-penny';
  if (n % 2 === 0) return 'star-token';
  return 'everyday-penny';
}

const DX = {up: 0, right: 1, down: 0, left: -1};
const DY = {up: -1, right: 0, down: 1, left: 0};

function rng(seed) {
  let s = (Number(seed) || 1) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function tile(kind, extra = {}) {
  return {kind, ...extra};
}

function floor(level) {
  const cols = 7, rows = 11;
  const cells = Array.from({length: rows}, (_, y) => Array.from({length: cols}, (_, x) => {
    if (y === 0 || y === rows - 1 || x === 0 || x === cols - 1) return tile('wall');
    return tile('safe');
  }));
  cells[1][3] = tile('door');
  cells[rows - 2][3] = tile('start');
  const curtains = [];
  const racks = [];
  const scenery = [];
  const lights = [];
  const traps = [];
  const props = [];
  const switches = [];
  const checks = [{x: 3, y: rows - 2}];

  cells[7][1] = tile('curtain'); cells[7][2] = tile('curtain');
  cells[7][4] = tile('curtain'); cells[7][5] = tile('curtain');
  curtains.push({row: 7, cols: [1, 2, 4, 5], period: 2.2, phase: 0, open: true});

  racks.push({
    row: 5, x: 1, dir: 1, speed: level ? 1.6 : 0.7, ride: level >= 1, w: 1,
    min: 1, max: level ? cols - 2 : 2,
  });
  cells[5][1] = tile('rack');

  if (level >= 1) {
    racks.push({row: 5, x: 5, dir: -1, speed: 1.5, ride: true, w: 1});
    props.push({id: 'token', x: 1, y: 6, got: false, name: 'costume token'});
    checks.push({x: 3, y: 6});
  }
  if (level >= 2) {
    scenery.push({row: 4, x: 2, dir: 1, speed: 1.2, ride: true, w: 2, active: true});
    scenery.push({row: 4, x: 4, dir: -1, speed: 1.2, ride: true, w: 2, active: false});
    switches.push({id: 'rope', x: 5, y: 8, which: 0});
    cells[8][5] = tile('switch', {id: 'rope'});
    checks.push({x: 5, y: 8});
  }
  if (level >= 3) {
    lights.push({x: 3, y: 3, period: 2.4, phase: 0, on: false, r: 1});
    lights.push({x: 2, y: 6, period: 2.8, phase: 1.1, on: false, r: 1});
    props.push({id: 'pass-a', x: 1, y: 3, got: false, name: 'pass A'});
    props.push({id: 'pass-b', x: 5, y: 3, got: false, name: 'pass B'});
  }
  if (level >= 4) {
    traps.push({x: 3, y: 6, period: 2.0, phase: 0.4, open: false});
    traps.push({x: 2, y: 8, period: 2.3, phase: 0.8, open: false});
    cells[6][3] = tile('trap');
    cells[8][2] = tile('trap');
    props.push({id: 'cue-1', x: 1, y: 8, got: false, name: 'cue 1'});
    props.push({id: 'cue-2', x: 5, y: 4, got: false, name: 'cue 2'});
  }
  if (level >= 5) {
    traps.push({x: 4, y: 7, period: 1.8, phase: 0.2, open: false});
    lights.push({x: 4, y: 2, period: 2.0, phase: 0.5, on: false, r: 1});
    scenery.push({row: 2, x: 1, dir: 1, speed: 1.4, ride: true, w: 2, active: true});
    props.push({id: 'prop', x: 1, y: 9, got: false, name: 'prop'});
    props.push({id: 'costume', x: 5, y: 9, got: false, name: 'costume'});
    props.push({id: 'card', x: 5, y: 2, got: false, name: 'cue card'});
    curtains.push({row: 2, cols: [2, 3, 4], period: 2.6, phase: 0.7, open: true});
  }
  return {cols, rows, cells, curtains, racks, scenery, lights, traps, props, switches, checks};
}

export function makeStage(level, seed) {
  const ch = BEA_CHAPTERS[level] || BEA_CHAPTERS[0];
  rng(seed);
  const floorplan = floor(level);
  return {
    level, seed, ...floorplan,
    x: 3, y: floorplan.rows - 2,
    lives: ch.lives, need: ch.need.slice(), got: [],
    check: {x: 3, y: floorplan.rows - 2},
    t: 0, freeze: 0,
    done: false, failed: '', atDoor: false, hide: true,
  };
}

function cell(stage, x, y) {
  if (y < 0 || x < 0 || y >= stage.rows || x >= stage.cols) return {kind: 'wall'};
  return stage.cells[y][x];
}

export function curtainOpen(c, t) {
  const phase = (t + c.phase) % c.period;
  return phase < c.period * 0.55;
}

function rackOn(rack, x, y) {
  return y === rack.row && x >= rack.x && x < rack.x + rack.w;
}

function sceneryOn(sc, x, y) {
  return sc.active && y === sc.row && x >= sc.x && x < sc.x + sc.w;
}

function tileBlocked(stage, x, y) {
  const c = cell(stage, x, y);
  if (c.kind === 'wall') return true;
  for (const cur of stage.curtains) {
    if (!curtainOpen(cur, stage.t) && cur.row === y && cur.cols.includes(x)) return true;
  }
  for (const tr of stage.traps) {
    if (tr.open && tr.x === x && tr.y === y) return true;
  }
  for (const rk of stage.racks) {
    if (rackOn(rk, x, y) && !rk.ride) return true;
  }
  return false;
}

function inLight(stage, x, y) {
  return (stage.lights || []).some(l => l.on && Math.abs(l.x - x) <= l.r && Math.abs(l.y - y) <= l.r);
}

function riding(stage, x, y) {
  return (stage.racks || []).some(r => r.ride && rackOn(r, x, y))
    || (stage.scenery || []).some(s => sceneryOn(s, x, y));
}

function bumpKey(stage, reason) {
  stage.freeze = 0.35;
  if (reason === 'trap') {
    stage.lives -= 1;
    if (stage.lives <= 0) { stage.failed = 'trap'; return; }
  }
  stage.x = stage.check.x;
  stage.y = stage.check.y;
}

export function swipeKey(stage, dir) {
  if (!stage || stage.done || stage.failed || stage.freeze > 0) return false;
  const dx = DX[dir], dy = DY[dir];
  if (dx == null) return false;
  const nx = stage.x + dx, ny = stage.y + dy;
  if (tileBlocked(stage, nx, ny)) return false;
  if (inLight(stage, nx, ny) && !riding(stage, nx, ny)) return false;
  stage.x = nx;
  stage.y = ny;
  const here = cell(stage, nx, ny);
  if (here.kind === 'switch') {
    stage.scenery.forEach(s => { s.active = !s.active; });
  }
  (stage.props || []).forEach(p => {
    if (!p.got && p.x === nx && p.y === ny) {
      p.got = true;
      if (!stage.got.includes(p.id)) stage.got.push(p.id);
    }
  });
  if ((stage.checks || []).some(c => c.x === nx && c.y === ny)) stage.check = {x: nx, y: ny};
  if (here.kind === 'door') {
    const ready = (stage.need || []).every(id => stage.got.includes(id));
    if (ready) {
      stage.atDoor = true;
      stage.done = true;
    }
  }
  return true;
}

export function stepStage(stage, dt) {
  if (!stage || stage.done || stage.failed) return;
  stage.t += dt;
  if (stage.freeze > 0) stage.freeze -= dt;
  stage.curtains.forEach(c => { c.open = curtainOpen(c, stage.t); });
  stage.racks.forEach(r => {
    r.x += r.dir * r.speed * dt;
    const max = r.max ?? stage.cols - 2;
    const min = r.min ?? 1;
    if (r.x > max) { r.x = max; r.dir = -1; }
    if (r.x < min) { r.x = min; r.dir = 1; }
  });
  stage.scenery.forEach(s => {
    if (!s.active) return;
    s.x += s.dir * s.speed * dt;
    if (s.x > stage.cols - 1 - s.w) { s.x = stage.cols - 1 - s.w; s.dir = -1; }
    if (s.x < 1) { s.x = 1; s.dir = 1; }
  });
  stage.lights.forEach(l => {
    const phase = (stage.t + l.phase) % l.period;
    l.on = phase > l.period * 0.45;
  });
  stage.traps.forEach(tr => {
    const phase = (stage.t + tr.phase) % tr.period;
    tr.warn = phase > tr.period * 0.7;
    tr.open = phase > tr.period * 0.85;
  });
  if (stage.freeze > 0) return;
  if (tileBlocked(stage, stage.x, stage.y)) bumpKey(stage, 'hazard');
  else if (inLight(stage, stage.x, stage.y) && !riding(stage, stage.x, stage.y)) bumpKey(stage, 'light');
  else {
    const trap = stage.traps.find(tr => tr.open && tr.x === stage.x && tr.y === Math.round(stage.y));
    if (trap) bumpKey(stage, 'trap');
  }
}

export function propsLeft(stage) {
  return (stage.need || []).filter(id => !stage.got.includes(id));
}
