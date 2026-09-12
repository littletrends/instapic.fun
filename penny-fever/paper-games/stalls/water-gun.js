import {clamp, segmentDistance, dist, done} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, spend, keep, owned} from '../wallet.js?v=marina-harbour-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=prize-fly-1';

const nozzle = {x: 450, y: 1050};
const G = 470;
const HALF = G / 2;
const SHORE = [
  {x: 260, y: 232}, {x: 655, y: 232}, {x: 733, y: 395}, {x: 750, y: 880},
  {x: 639, y: 1040}, {x: 315, y: 1040}, {x: 200, y: 880}, {x: 177, y: 535}, {x: 250, y: 355},
];
const SETS = [
  {prize: 'little-sailboat', throws: 1, towers: [{x: 450, y: 840, n: 4}]},
  {prize: 'message-bottle', throws: 1, towers: [{x: 310, y: 840, n: 3}, {x: 600, y: 840, n: 3}]},
  {prize: 'harbour-washer', throws: 1, towers: [{x: 300, y: 850, n: 4}, {x: 620, y: 720, n: 3}], ferry: true},
  {prize: 'seaside-day-book', throws: 1, towers: [{x: 250, y: 840, n: 3}, {x: 450, y: 700, n: 4}, {x: 650, y: 840, n: 3}]},
  {prize: 'picnic-parcel', throws: 1, towers: [{x: 270, y: 860, n: 4}, {x: 450, y: 620, n: 3}, {x: 640, y: 860, n: 4}], eddy: true},
  {prize: 'return-postcard', throws: 1, towers: [{x: 320, y: 870, n: 5}, {x: 620, y: 720, n: 4}], ferry: true, eddy: true},
];

function topple(b, vx = 80) {
  if (b.fallen) return;
  b.fallen = true;
  b.vx = vx;
  b.vy = -70;
  b.w = (vx >= 0 ? 1 : -1) * (1.4 + Math.abs(vx) * .01);
}
function ferryPose(t) {
  const x = 450 + Math.sin(t * .47) * 168;
  return {x, y: 655, a: {x: x - 52, y: 655}, b: {x: x + 52, y: 655}};
}
function squeeze(s) {
  if (s.jet || s.won || s.lost) return;
  if (s.squeezes >= s.limit) {
    s.note = 'That burst is spent. Another penny for another squeeze.';
    return;
  }
  if (alleyPlay) {
    if (!spend(1)) {
      s.note = 'Need a penny in the purse. Bank loan, or cash a ticket.';
      return;
    }
  }
  const t = .7;
  const vx = (s.aim.x - nozzle.x) / t;
  const vy = (s.aim.y - nozzle.y - HALF * t * t) / t;
  s.jet = {x: nozzle.x, y: nozzle.y, vx, vy};
  s.spray = [];
  s.squeezes++;
  s.note = 'Burst ' + s.squeezes + ' of ' + s.limit + ' · a penny a squeeze.';
}
function build(level) {
  const set = SETS[level] || SETS[0];
  const bottles = [];
  const towers = set.towers.map(t => ({...t}));
  for (const tower of towers) {
    let below = [];
    for (let row = 0; row < tower.n; row++) {
      const ids = [];
      for (let i = 0; i < tower.n - row; i++) {
        const id = bottles.length;
        ids.push(id);
        const x = tower.x + (i - (tower.n - row - 1) / 2) * 51;
        const y = tower.y - row * 77;
        bottles.push({
          id, restX: x, restY: y, x, y,
          angle: 0, w: 0, vx: 0, vy: 0, fallen: false,
          support: row ? [below[i], below[i + 1]] : [],
          kind: row === tower.n - 1 ? 'boat' : 'bottle',
        });
      }
      below = ids;
    }
  }
  return {bottles, towers, prize: set.prize, limit: set.throws, ferry: !!set.ferry, eddy: !!set.eddy};
}

export default {
  title: 'Paper Harbour',
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  intro: 'Marina’s paper harbour. One penny, one squeeze of the brass hose. The jet must send every boat off its quay in that single burst. Leave one at berth and she keeps the prize.',
  instructions: alleyPlay
    ? 'Aim the hose and squeeze (one penny a burst). Lead the tide. The prize only sails if the whole quay goes over in that one jet. A leftover boat means try again — another penny. Arrows aim, Space squeezes. Later berths hide a post ferry and a harbour eddy.'
    : 'One squeeze. Clear every boat from the quay in that burst to finish the chapter. Lead the tide; later berths add a ferry and an eddy.',
  tableDetail: alleyPlay
    ? 'One penny. One squeeze. The whole quay must go over in that burst, or Marina keeps the prize. Lead the tide. Wait for the post ferry. The eddy will bend a jet if you let it.'
    : 'One practice burst. Clear every boat from the quay.',
  levels: ['The quiet quay', 'Twin berths', 'The post ferry', 'Three little harbours', 'Tide and eddy', 'The grand harbour'],
  sprites: ['little-sailboat', 'trade-envelope', 'message-bottle', 'splash-ring', 'seaside-day-book', 'picnic-parcel', 'stamp-passport', 'penny-purse', 'everyday-penny'],
  prizes: SETS.map(s => s.prize),
  actions: [{id: 'squeeze', label: alleyPlay ? 'Squeeze · 1 penny' : 'Squeeze the brass hose'}],
  create(level) {
    const s = {
      ...build(level),
      level, aim: {x: 450, y: 770}, jet: null, spray: [], squeezes: 0, t: 0, settle: 0, won: false, lost: false,
      note: alleyPlay ? 'One penny. One squeeze. All off the quay, or the prize stays.' : 'One practice burst. Clear the quay.',
    };
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt, input) {
    s.t += dt;
    const dx = (input.keys.has('ArrowRight') ? 1 : 0) - (input.keys.has('ArrowLeft') ? 1 : 0);
    const dy = (input.keys.has('ArrowDown') ? 1 : 0) - (input.keys.has('ArrowUp') ? 1 : 0);
    s.aim.x = clamp(s.aim.x + dx * 220 * dt, 220, 680);
    s.aim.y = clamp(s.aim.y + dy * 220 * dt, 430, 900);
    const tide = 6 + s.level * 3.2;
    for (const b of s.bottles) {
      if (!b.fallen) {
        b.x = b.restX + Math.sin(s.t * 1.35 + b.id * 1.1) * tide;
        b.y = b.restY + Math.cos(s.t * .9 + b.id * .7) * tide * .32;
        if (b.support.some(i => s.bottles[i].fallen)) topple(b, (b.x < 450 ? -1 : 1) * 45);
      } else {
        b.vy += 460 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.angle += b.w * dt;
        if (b.y > 1060) { b.y = 1060; b.vy = -Math.abs(b.vy) * .22; b.vx *= .8; b.w *= .85; }
        b.x = clamp(b.x, 185, 715);
      }
    }
    if (s.jet) {
      const p = s.jet, old = {x: p.x, y: p.y};
      p.vy += G * dt;
      if (s.eddy && dist(p, {x: 465, y: 753}) < 96) {
        const a = 2.1 * dt, c = Math.cos(a), n = Math.sin(a);
        const vx = p.vx * c - p.vy * n, vy = p.vx * n + p.vy * c;
        p.vx = vx; p.vy = vy;
      }
      p.x += p.vx * dt; p.y += p.vy * dt;
      s.spray.push({x: p.x, y: p.y, r: 7});
      if (s.spray.length > 16) s.spray.shift();
      if (s.ferry) {
        const f = ferryPose(s.t);
        if (segmentDistance(p, f.a, f.b) < 22) {
          s.note = 'The post ferry took the splash. Wait for a clear lane.';
          s.jet = null;
        }
      }
      if (s.jet) {
        const hit = s.bottles.find(b => !b.fallen && segmentDistance({x: b.x, y: b.y - 36}, old, p) < (b.kind === 'boat' ? 40 : 36));
        if (hit) {
          const shove = p.vx * .55 + (p.x < hit.x ? 90 : -90);
          topple(hit, shove);
          for (const b of s.bottles) if (!b.fallen && dist({x: hit.x, y: hit.y - 30}, {x: b.x, y: b.y - 30}) < 46)
            topple(b, shove * .5 + (b.x < hit.x ? -36 : 36));
          p.vx *= .58; p.vy *= .42;
          s.note = hit.kind === 'boat' ? 'The little boat is off its berth.' : 'A crate takes the splash.';
        }
        if (p.y > 1100 || p.y < 310 || p.x < 150 || p.x > 750) s.jet = null;
      }
    }
    for (const drop of s.spray) drop.r *= .92;
    for (const a of s.bottles) if (a.fallen && Math.abs(a.vx) > 20)
      for (const b of s.bottles) if (!b.fallen && dist({x: a.x, y: a.y - 30}, {x: b.x, y: b.y - 30}) < 43)
        topple(b, a.vx * .65);
    if (!s.won && !s.lost && s.bottles.every(b => b.fallen)) {
      s.settle += dt;
      if (s.settle > 1.1) {
        const clean = s.squeezes === 1;
        s.won = clean;
        s.lost = !clean;
        if (alleyPlay && s.prize && clean) keep(s.prize, 'water-gun');
        if (clean) takePrize(s, s.prize);
        done(s,
          clean ? 'Not a boat left at berth' : 'They drifted — but not in one burst',
          clean
            ? itemName(s.prize) + ' sails into the treasure book.'
            : 'The prize wanted a single clean jet. Another penny for another squeeze.',
          {prize: clean ? s.prize : null, won: clean});
      }
    } else if (!s.won && !s.lost && !s.jet && s.squeezes >= s.limit && s.bottles.some(b => !b.fallen)) {
      s.lost = true;
      const left = s.bottles.filter(b => !b.fallen).length;
      done(s, 'The quay still holds',
        left + ' boat' + (left === 1 ? '' : 's') + ' still at berth. Another penny for another squeeze.', {won: false});
    }
  },
  pointer(s, type, p) {
    if (type === 'move' || type === 'down') s.aim = {x: clamp(p.x, 220, 680), y: clamp(p.y, 430, 900)};
    if (type === 'up') squeeze(s);
  },
  action(s, id) { if (id === 'squeeze') squeeze(s); },
  key(s, k, down) { if (k === ' ' && down) squeeze(s); },
  draw(s, d) {
    d.path(SHORE, '#d7ffe335', 2, true, '#effcdb22');
    d.ellipse(450, 1088, 268, 28, '#35677155', '#cfb98a', 2);
    d.poly([[70, 108], [250, 108], [250, 292], [70, 292]], '#243a44cc', '#e4c48a', 2);
    d.text('this harbour', 160, 130, 13, '#ead6a4');
    d.item(spriteKey(s.prize), 160, 188, {w: 84, fallback: () => d.star(160, 188, 28)});
    d.text(itemName(s.prize), 160, 246, 12, '#fff0cb');
    d.text((s.limit - s.squeezes) + ' squeeze' + (s.limit - s.squeezes === 1 ? '' : 's') + ' left', 160, 272, 12, '#f0d6a8');
    for (let i = 0; i < SETS.length; i++) {
      const x = 92 + (i % 3) * 52, y = 330 + Math.floor(i / 3) * 58;
      const got = owned(SETS[i].prize) || (s.won && i === s.level);
      d.item(spriteKey(SETS[i].prize), x, y, {w: 36, fallback: () => d.star(x, y, 12)});
      if (got) d.text('✓', x + 14, y - 10, 16, '#f6e2a2');
      else d.circle(x, y, 20, '#1a120866');
    }
    const n = alleyPlay ? (pocket() ?? 0) : '∞';
    d.item(spriteKey('penny-purse'), 790, 160, {w: 92, fallback: () => d.heart(790, 160, 28, '#6a7a52')});
    d.text(String(n), 790, 218, 18, '#fff6d8');
    d.text(n === 1 ? 'penny' : 'pennies', 790, 236, 12, '#ead6a4');
    if (s.eddy) {
      const c = d.c; c.save(); c.translate(465, 753); c.rotate(s.t * .4);
      for (let i = 0; i < 8; i++) { c.rotate(Math.PI / 4); d.arc(0, 0, 90, -.4, .6, '#d7ffe335', 3); }
      c.restore();
    }
    if (s.ferry) {
      const f = ferryPose(s.t);
      d.ellipse(f.x, f.y + 16, 60, 22, '#113f4940');
      d.poly([[f.x - 48, f.y], [f.x + 48, f.y - 18], [f.x + 48, f.y + 18]], '#974d43', '#eac389', 2);
      d.text('POST', f.x, f.y + 4, 12);
    }
    for (const t of s.towers) {
      const w = t.n * 30 + 24;
      d.line({x: t.x - w, y: t.y + 7}, {x: t.x + w, y: t.y + 7}, '#9b7c57', 18);
      d.line({x: t.x - w, y: t.y}, {x: t.x + w, y: t.y}, '#e1c294', 5);
      for (const x of [t.x - w + 14, t.x + w - 14]) d.line({x, y: t.y + 12}, {x, y: 970}, '#9d8b69', 10);
    }
    for (const b of s.bottles) {
      if (b.kind === 'boat') {
        d.item(spriteKey('little-sailboat'), b.x, b.y - 18, {
          w: 52, angle: b.angle,
          fallback: () => { d.ellipse(b.x, b.y, 24, 12, '#174f54', '#eac389', 2); d.line({x: b.x, y: b.y}, {x: b.x, y: b.y - 36}, '#ebc581', 3); },
        });
      } else {
        d.item(spriteKey('message-bottle'), b.x, b.y - 32, {
          w: 48, angle: b.angle,
          fallback: () => d.bottle(b.x, b.y, 1, '#e5e5cc', b.angle),
        });
      }
    }
    for (const drop of s.spray) d.circle(drop.x, drop.y, Math.max(2, drop.r), '#d4fff288');
    if (s.jet) d.circle(s.jet.x, s.jet.y, 9, '#e7fff0cc', '#9ad4c4', 1);
    else if (!s.won && !s.lost && s.squeezes < s.limit) {
      const t = .7, vx = (s.aim.x - nozzle.x) / t, vy = (s.aim.y - nozzle.y - HALF * t * t) / t;
      for (let i = 1; i <= 14; i++) {
        const u = t * i / 14;
        d.circle(nozzle.x + vx * u, nozzle.y + vy * u + HALF * u * u, 2.2, '#7aa7a499');
      }
      d.poly([[nozzle.x - 18, nozzle.y + 8], [nozzle.x + 18, nozzle.y + 8], [nozzle.x + 10, nozzle.y - 10], [nozzle.x - 10, nozzle.y - 10]], '#8a6a3a', '#eac389', 2);
      d.circle(nozzle.x, nozzle.y - 14, 8, '#c9a15a', '#f0d6a8', 2);
      d.ring(s.aim.x, s.aim.y, 17, '#7aa7a4', 2);
    }
  },
  readout: s => {
    const down = s.bottles.filter(b => b.fallen).length;
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice bursts' : n + (n === 1 ? ' penny' : ' pennies') + ' in the purse';
    return down + ' / ' + s.bottles.length + ' off the quay · ' + s.squeezes + '/' + s.limit + ' squeezes · ' + purse + ' · ' + s.note;
  },
};
