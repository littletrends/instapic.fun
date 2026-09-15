import {clamp} from '../draw.js';
import {spriteKey, itemName} from '../prizes.js';
import {alleyPlay, pocket, credit, keep, owned} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=first-prize-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';

// Winning windows are whole elapsed seconds, including second 100.
const WIN_SECONDS = [[7,18,31,46,63,82,97],[9,24,39,58,76,94],[12,29,48,69,91],[16,37,61,88],[21,52,84],[27,59,100]];
const BALL_SECONDS = 100;
const LAYOUT_VERSION = 2;
const R = 11;
const G = 390;
const MAX = 940;
const FLIP = 118;
const REST = 0.46;
const UP = -0.64;
const LANE = {x: 726, y: 992, pull: 50};
const GATE = seg([666, 422], [708, 422]);
const BOOK = 'pennyFever.pinballAlley';
const TOKENS = [
  {id: 'everyday-penny', weight: 52, cap: 0},
  {id: 'moon-penny', weight: 7, cap: 6},
  {id: 'rose-penny', weight: 6, cap: 5},
  {id: 'star-token', weight: 5, cap: 4},
  {id: 'crown-token', weight: 4, cap: 3},
];
const ONCE = ['lightning-pin', 'thunder-marble', 'glass-kicker', 'flipper-badge', 'bullseye-clock', 'cabinet-spark'];
const SETS = [
  {prize: 'lightning-pin', felt: '#1e3a32cc', wood: '#5a3a28', bumper: '#6a3a58', bat: '#e8b8c4', unique: 1.00},
  {prize: 'thunder-marble', felt: '#24364acc', wood: '#4a3224', bumper: '#5a4a6a', bat: '#d4c4a0', unique: 0.82},
  {prize: 'glass-kicker', felt: '#2a2438cc', wood: '#3a2a22', bumper: '#7a3a4a', bat: '#e0b070', unique: 0.68},
  {prize: 'flipper-badge', felt: '#1c3228cc', wood: '#4a2818', bumper: '#8a5030', bat: '#f0c090', unique: 0.50},
  {prize: 'bullseye-clock', felt: '#241820cc', wood: '#3a1c18', bumper: '#6a2a38', bat: '#c89090', unique: 0.34},
  {prize: 'cabinet-spark', felt: '#141820ee', wood: '#2a1814', bumper: '#4a2a48', bat: '#b09088', unique: 0.22},
];
const SPRITES = ['lightning-pin', 'everyday-penny', 'star-token', 'moon-penny', 'rose-penny',
  'crown-token', 'thunder-marble', 'glass-kicker', 'flipper-badge', 'bullseye-clock', 'cabinet-spark', 'penny-purse'];

function seg(a, b) { return {a: {x: a[0], y: a[1]}, b: {x: b[0], y: b[1]}}; }
function readStore() {
  if(!alleyPlay)return {v:2,tables:{}};
  if (typeof localStorage === 'undefined') return {v: 2, tables: {}};
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || 'null');
    if (blob && blob.v === 2 && blob.tables) return blob;
    if (blob && Array.isArray(blob.seen)) return {v: 2, tables: {0: {
      seen: blob.seen, paid: blob.paid || [], score: blob.score || 0, balls: blob.balls || 0,
      wonPennies: 0, specials: 0, tokens: {},
    }}};
  } catch { /* ignore */ }
  return {v: 2, tables: {}};
}
function readTable(level) {
  const row = readStore().tables[String(level)] || {};
  return {
    seen: Array.isArray(row.seen) ? row.seen.slice() : [],
    paid: Array.isArray(row.paid) ? row.paid.slice() : [],
    score: row.score || 0, balls: row.balls || 0,
    wonPennies: row.wonPennies || 0, specials: row.specials || 0,
    tokens: row.tokens && typeof row.tokens === 'object' ? {...row.tokens} : {},
    hits: row.hits || 0, mark: row.mark || 0, credit: row.credit || 0,
    snapshot: row.snapshot?.v===1 ? row.snapshot : null,
  };
}
function writeBook(s) {
  if (!alleyPlay || typeof localStorage === 'undefined' || !s) return;
  try {
    const store = readStore();
    store.currentChapter=s.level;
    store.tables[String(s.level || 0)] = {
      seen: s.seen, paid: s.paid, score: s.score, balls: s.balls,
      wonPennies: s.wonPennies, specials: s.specials, tokens: s.tokens,
      hits: s.hits || 0, mark: s.mark || 0, credit: s.credit || 0,
      snapshot: snapshotOf(s),
    };
    localStorage.setItem(BOOK, JSON.stringify(store));
  } catch { /* quota */ }
}

const SNAPSHOT_FIELDS=['houseLeft','cabinetOn','layoutVersion','rewardAt','ballPennies','ballTokens','t','mode','activeBall','ball','flippers','bumpers','targets','slings','rolls','saucer','lights','combo','trail','fly','stuck','stuckPos','deadAt','rngState','note','chapterPrize','prizeKept','prizePosted','prizeDeliver'];
function snapshotOf(s){
 const snap={v:1};
 for(const key of SNAPSHOT_FIELDS)if(s[key]!==undefined)snap[key]=s[key];
 // A held, unlaunched spring is input, not a paid ball in motion.
 if(s.mode==='lane')snap.ball={x:LANE.x,y:LANE.y,vx:0,vy:0};
 return JSON.parse(JSON.stringify(snap));
}
function random(s){s.rngState=(Math.imul(s.rngState>>>0,1664525)+1013904223)>>>0;return s.rngState/4294967296;}
function releaseInput(s){
 s.left=false;s.right=false;s.pointerPlunge=false;s.dragPlunge=false;s.charging=false;s.charge=0;s.touches={};
 if(s.mode==='lane')s.ball={x:LANE.x,y:LANE.y,vx:0,vy:0};
}
function prizeStatus(s){
 if(!pickUnique(s))return 'Bonus collected';
 return 'Bonus: bumper hit on '+WIN_SECONDS[s.level].join(', ')+'s';
}
function collide(p, a, b, r, omega = 0, pivot = a, bounce = 1.22) {
  const dx = b.x - a.x, dy = b.y - a.y, t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  const q = {x: a.x + dx * t, y: a.y + dy * t}, x = p.x - q.x, y = p.y - q.y, dd = Math.hypot(x, y);
  const skin = r + 1.6;
  if (dd >= skin) return false;
  const nx = dd ? x / dd : 0, ny = dd ? y / dd : -1;
  p.x = q.x + nx * (skin + 0.45); p.y = q.y + ny * (skin + 0.45);
  const vx = -omega * (q.y - pivot.y), vy = omega * (q.x - pivot.x);
  const vn = (p.vx - vx) * nx + (p.vy - vy) * ny;
  if (vn < 0) { p.vx -= vn * bounce * nx; p.vy -= vn * bounce * ny; }
  return true;
}
function bounceCircle(p, c, r, kick) {
  const dx = p.x - c.x, dy = p.y - c.y, dd = Math.hypot(dx, dy);
  if (dd >= r + R) return false;
  const nx = dx / (dd || 1), ny = dy / (dd || 1);
  p.x = c.x + nx * (r + R + 0.7); p.y = c.y + ny * (r + R + 0.7);
  const speed = Math.max(kick, Math.hypot(p.vx, p.vy) * 1.02);
  p.vx = nx * speed; p.vy = ny * speed;
  return true;
}
function pickToken(s) {
  const options = TOKENS.filter(t => {
    if (t.id === 'everyday-penny') return true;
    return (s.tokens[t.id] || 0) < t.cap;
  });
  let total = 0;
  for (const t of options) total += t.weight;
  let roll = random(s) * total;
  for (const t of options) {
    roll -= t.weight;
    if (roll <= 0) return t.id;
  }
  return 'everyday-penny';
}
function chapterPrize(s) {
  return SETS[s.level]?.prize || null;
}
function pickUnique(s) {
  const prize = chapterPrize(s);
  if (!prize) return null;
  if (ONCE.includes(prize) && (s.seen.includes(prize) || s.paid.includes(prize) || owned(prize))) return null;
  const token = TOKENS.find(t => t.id === prize);
  if (token?.cap && (s.tokens[prize] || 0) >= token.cap) return null;
  return prize;
}
function fly(s, id, x, y, prize) {
  s.fly.push({id, x, y, t: 0, dur: 0.7, prize: !!prize});
}
function pay(s, id, x, y) {
  const token = TOKENS.find(t => t.id === id);
  // Collectible duplicates accumulate; they never convert into live currency.
  if (ONCE.includes(id) && (s.paid.includes(id) || s.seen.includes(id))) id = pickToken(s);
  else if (ONCE.includes(id)) { s.seen.push(id); s.paid.push(id); }
  const unique = ONCE.includes(id);
  const special = id !== 'everyday-penny';
  if (id === 'everyday-penny') {
    s.score += 50;
    s.wonPennies++;
    if (alleyPlay) credit(1);
    s.note = 'A penny back into the purse.';
  } else {
    s.score += unique ? 2500 : 400;
    s.specials++;
    s.tokens[id] = (s.tokens[id] || 0) + 1;
    if (alleyPlay) keep(id, 'pinball');
    if (id === chapterPrize(s)) takePrize(s, id, {x:x*1.35-204, y});
    s.note = itemName(id) + (unique ? ' — a rare from the glass!' : ' into the treasure book.');
  }
  if(id!==chapterPrize(s))fly(s, id, x, y, special);
  writeBook(s);
}
function loosenMark(level) {
  return [6, 8, 10, 12, 14, 16][level] || 10;
}
function bumperItem(s,b){return ['moon-penny','rose-penny','star-token','crown-token'][(s.bumpers.indexOf(b)+s.level)%4];}
function ordinaryReturn(s, id, x, y) {
  if(id==='everyday-penny'){
    if(s.t<s.rewardAt || s.ballPennies>=2)return;
    s.ballPennies++;s.rewardAt=s.t+8;
  }else s.ballTokens++;
  pay(s,id,x,y);
}
function dropFromHit(s, kind, x, y) {
  if(!s.cabinetOn || s.mode!=='live')return;
  const second=Math.min(100,Math.floor(BALL_SECONDS-s.houseLeft+1e-7)+1);
  if(kind==='bumper'){
    s.hits++;
    if(WIN_SECONDS[s.level].includes(second)){
      const id=pickUnique(s);if(id)pay(s,id,x,y);
    }
  }
  const jackpot=s.lights.every(Boolean);
  s.score+=({bumper:120,sling:40,target:250,roll:80,saucer:jackpot?1400:800})[kind]||0;
  if(kind==='bumper'){
    const b=s.bumpers.find(b=>b.x===x&&b.y===y);
    if(b)ordinaryReturn(s,bumperItem(s,b),x,y);
  }else if(kind==='saucer')ordinaryReturn(s,'everyday-penny',x,y);
  if(kind==='saucer'&&jackpot)s.lights=[false,false,false];
  writeBook(s);
}

function layout(level) {
  const pinch = Math.min(14, level * 2);
  const rails = [
    seg([210, 200], [210, 750]),
    seg([210, 750], [228, 1148]),
    seg([276 - pinch, 848], [276 - pinch, 1148]),
    seg([276 - pinch, 848], [300, 1002]),
    seg([210, 200], [640, 200]),
    seg([640, 200], [720, 188]),
    seg([720, 188], [758, 228]),
    seg([758, 228], [758, 1090]),
    seg([696, 1090], [758, 1090]),
    seg([696, 410], [696, 1090]),
    seg([696, 410], [668, 458]),
    seg([668, 458], [668, 750]),
    seg([668, 750], [650, 1148]),
    seg([618 + pinch, 848], [618 + pinch, 1148]),
    seg([618 + pinch, 848], [568, 1002]),
  ];
  const slings = [
    {kick: {x: 120, y: -310}, cool: 0, segs: [seg([328, 742], [362, 868]), seg([328, 742], [328, 868])]},
    {kick: {x: -120, y: -310}, cool: 0, segs: [seg([540, 742], [506, 868]), seg([540, 742], [540, 868])]},
  ];
  const patterns = [
    [[338,372,34],[542,372,34],[440,540,36]],
    [[470,345,32],[570,475,34],[425,620,30],[305,500,28]],
    [[315,360,28],[425,445,30],[535,535,32],[390,650,26]],
    [[305,370,30],[575,370,30],[335,575,32],[545,575,32]],
    [[470,365,26],[580,480,28],[455,565,30],[330,645,28],[560,680,22]],
    [[320,375,28],[450,455,30],[575,555,28],[355,575,26],[455,710,24]],
  ];
  const bumpers=patterns[level].map(([x,y,r])=>({x,y,r,cool:0,flash:0}));
  const posts = [
    {x: 440, y: 888, r: 9, kick: 220},
    {x: 318, y: 700, r: 8, kick: 180},
    {x: 562, y: 700, r: 8, kick: 180},
  ];
  if (level >= 2) posts.push({x: 440, y: 760, r: 7, kick: 160});
  const targetPatterns=[[[236,448],[236,518],[236,588]],[[630,420],[630,510],[630,600]],[[236,470],[630,610],[236,650]],[[236,440],[630,440],[440,690]],[[630,360],[236,470],[630,620]],[[236,480],[630,420],[236,670]]];
  const targets=targetPatterns[level].map(([x,y])=>({x,y,on:false,cool:0}));
  const rolls=[300,440,590].map((x,i)=>({x,y:235+(level%3)*12+(i%2)*12,on:false}));
  const [sx,sy]=[[440,268],[320,300],[560,290],[440,250],[330,275],[540,275]][level];
  return {
    rails, slings, bumpers, posts, targets, rolls,
    saucer: {x:sx,y:sy,cool:0,hold:0,armed:true},
    flippers: [
      {x: 292, y: 1008, a: REST, w: 0, sign: 1},
      {x: 576, y: 1008, a: Math.PI - REST, w: 0, sign: -1},
    ],
    outL: 276 - pinch, outR: 618 + pinch,
  };
}
function refreshLayout(s){
  if(s.layoutVersion===LAYOUT_VERSION)return;
  const built=layout(s.level);
  for(const key of ['bumpers','targets','rolls','saucer'])s[key]=built[key];
  s.layoutVersion=LAYOUT_VERSION;
}
function ejectSaucer(s){
  const p=s.ball, cup=s.saucer;
  p.x=cup.x;p.y=cup.y+56;
  while(p.y<740 && [...s.bumpers,...s.posts].some(b=>Math.hypot(p.x-b.x,p.y-b.y)<b.r+R+8))p.y+=16;
  p.vx=cup.x<440?180:-180;p.vy=400;
  cup.hold=0;cup.armed=false;cup.cool=2;
  s.stuckPos={x:p.x,y:p.y,t:s.t};
}
function seatLane(s) {
  if(!s.activeBall)refreshLayout(s);
  s.mode = 'lane';
  s.charge = 0;
  s.charging = false;
  s.stuck = 0;
  s.stuckPos = {x: LANE.x, y: LANE.y, t: s.t || 0};
  s.ball = {x: LANE.x, y: LANE.y, vx: 0, vy: 0};
  s.trail = [];
}
function canAfford(s) {
  if(s.activeBall)return true;
  if (!alleyPlay) return s.ammo > 0;
  return !!s.activeBall || (s.credit||0)>0 || (pocket() || 0) >= 1;
}
function returningBall(s){return s.mode==='live'&&s.activeBall&&inShooter(s.ball)&&s.ball.y>410&&s.ball.vy>=0;}
function canPull(s){return s.mode==='lane'||returningBall(s);}
function beginCharge(s) {
  if (!canPull(s) || s.charging) return;
  if (!canAfford(s)) {
    s.note = alleyPlay
      ? 'Need a penny to pull the spring. Cash a booth ticket for a five-penny stack.'
      : 'Practice balls are spent.';
    return;
  }
  s.charging = true;
  s.charge = 0.02;
}
function releasePlunger(s) {
  if (s.mode !== 'lane' || !s.charging) { s.charging = false;s.charge=0; return; }
  const power = s.charge;
  s.charging = false;
  s.charge = 0;
  if (power < 0.1) {
    s.ball.y = LANE.y;
    s.note = 'A timid pull. Draw the spring further back.';
    return;
  }
  if (!s.activeBall && alleyPlay) {
    if ((s.credit || 0) < 1) {
      if (!takeAttempt('pinball', s.level)) {
        s.note = retryNote();
        s.ball.y = LANE.y;
        return;
      }
      s.credit = 3;
    }
    s.credit -= 1;
  } else if(!s.activeBall)s.ammo--;
  s.mode = 'live';
  if(!s.activeBall){s.balls++;s.houseLeft=BALL_SECONDS;s.ballPennies=0;s.ballTokens=0;s.rewardAt=s.t+3;s.saucer.hold=0;s.saucer.armed=true;}
  s.cabinetOn=true;
  s.activeBall=true;
  s.ball.vx = -18 - power * 28;
  s.ball.vy = -460 - power * 760;
  s.note = power > 0.72 ? 'A strong plunge.' : 'The silver ball is in play.';
  writeBook(s);
}
function drain(s) {
  s.mode = 'dead';
  s.activeBall=false;
  s.cabinetOn=false;s.lights=[false,false,false];s.saucer.hold=0;
  s.deadAt = s.t;
  s.charging = false;
  s.charge = 0;
  s.combo = 0;
  s.stuck = 0;
  s.note = alleyPlay
    ? ((s.credit || 0) > 0 ? 'Drained. ' + s.credit + ' ball' + (s.credit === 1 ? '' : 's') + ' left on this penny.' : 'Drained. Another penny for three more balls.')
    : (s.ammo > 0 ? 'Drained. Pull the spring for another practice ball.' : 'Practice balls spent.');
  writeBook(s);
}
function inShooter(p) { return p.x > 690; }
function shouldDrain(s, p) {
  if (inShooter(p)) return false;
  if (p.y > 1138) return true;
  if (p.y > 1028 && p.x < s.outL) return true;
  if (p.y > 1028 && p.x > s.outR && p.x < 690) return true;
  if (p.y > 1108 && p.x > 310 && p.x < 558) return true;
  return false;
}

export default {
  title: 'Pinball Alley',
  winningSeconds:level=>WIN_SECONDS[level].slice(),
  live: alleyPlay,
  chapterNavigation:true,
  fullInstructions:true,
  houseSeconds:BALL_SECONDS,
  // The engine counts each physics substep so an impact uses its exact second.
  clockRuns:()=>false,
  onTimeout(s){
    if(!s.activeBall)return;
    s.houseLeft=0;drain(s);
    s.note='100 seconds — lights out. Launch the next ball.';
    writeBook(s);
  },
  selectedChapter(){return Math.max(0,Math.min(5,Number(readStore().currentChapter)||0));},
  releaseInput,
  cancelAction(s,id){if(id==='plunge'){s.pointerPlunge=false;s.dragPlunge=false;s.charging=false;s.charge=0;if(s.mode==='lane')s.ball={x:LANE.x,y:LANE.y,vx:0,vy:0};}else if(id==='left'||id==='right')s[id]=false;},
  hud(s){return {cash:alleyPlay?(pocket()||0)+' pennies':'Practice',keep:(s.mode==='live'?'Ball in play · ':'')+(alleyPlay?Math.max(0,s.credit||0)+' ready':s.ammo+' ready')};},
  actionStates(s,input){return {left:s.left||input.actions.has('left')||input.keys.has('z')||input.keys.has('ArrowLeft'),right:s.right||input.actions.has('right')||input.keys.has('x')||input.keys.has('ArrowRight'),plunge:s.charging};},
  actionEnabled(s){return {plunge:canPull(s)&&canAfford(s)};},
  actionLabels(s){return {plunge:returningBall(s)?'Pull back · ball returning':s.mode==='live'?'Ball in play':s.mode==='dead'?'Next ball…':s.activeBall?'Relaunch · same ball':(alleyPlay?(s.credit>0?'Plunge · '+s.credit+' ready':'Plunge · 1 penny'):'Plunge')};},
  tables: true,
  intro: alleyPlay
    ? 'Six different tables. One penny buys three balls, each with 100 seconds of play. Hit a bumper during a winning second to release the chapter bonus. The timer and unused balls stay saved.'
    : 'Workshop pin tables. Pull the plunger, tap the flippers, chase the lights. Practice balls never enter the alley purse.',
  instructions: alleyPlay
    ? 'Hold Plunge to charge, then release to launch. Hold the left and right flippers independently, including two fingers at once. Z/X and Space also work. One penny buys three balls; relaunching a ball that rolls back down the shooter lane is included. Each new ball has 100 seconds; the lights go out when time ends. Match a listed whole second with a bumper impact to collect the bonus, available from the first ball. Chapters have different winning seconds and layouts. Each bumper awards its pictured collectible on impact; duplicates accumulate in Treasures. The holding pocket returns an Everyday penny, up to two per ball and at least eight seconds apart. You can pull the spring while the ball comes down the shooter lane; hold until it lands, then release. Letting go before it arrives releases the empty spring. Menus pause the timer; a same-ball relaunch keeps the time remaining.'
    : 'Hold Plunge and release. Tap Left and Right flippers. Z, X and Space work on a keyboard. Each chapter is a different cabinet.',
  liveTitle: 'Pinball Alley',
  liveDetail: alleyPlay
    ? 'Hold the plunger, let go, then tap the flippers. One penny, three balls. Each ball lasts up to 100 seconds.'
    : 'Pull the spring and tap the flippers.',
  liveButton: 'Step up to the table',
  tableDetail: alleyPlay
    ? 'One penny, three balls. Each ball gets 100 seconds. Bounce on a winning second for the bonus. When the lights go out, launch again; unused balls stay saved.'
    : 'A different cabinet. Pull the spring, tap the bats. Practice balls stay in the workshop.',
  levels: ['Thunder Garden', 'Moonlit Bumpers', 'Lantern Lanes', 'Brass Orchard', 'Storm Glass', 'Midnight Spark'],
  sprites: SPRITES,
  prizes: SETS.map(t => t.prize),
  actions: [
    {id: 'left', label: 'Left flipper · Z', hold: true},
    {id: 'plunge', label: alleyPlay ? 'Plunge · 3 balls / penny' : 'Plunge', hold: true},
    {id: 'right', label: 'Right flipper · X', hold: true},
  ],
  persist(s) { writeBook(s); },
  create(level) {
    const book = readTable(level);
    const set = SETS[level] || SETS[0];
    const built = layout(level);
    const s = {
      level,houseLeft:BALL_SECONDS,cabinetOn:false,layoutVersion:LAYOUT_VERSION,rewardAt:0,ballPennies:0,ballTokens:0, t: 0, mode: 'lane', activeBall:false, charge: 0, charging: false, pointerPlunge: false, touches:{}, rngState:(level+1)*4099,
      left: false, right: false, combo: 0, lights: [false, false, false],
      balls: book.balls, score: book.score, wonPennies: book.wonPennies, specials: book.specials,
      seen: book.seen, paid: book.paid, tokens: book.tokens, fly: [], trail: [], stuck: 0,
      hits: book.hits || 0, mark: book.mark || loosenMark(level), credit: book.credit || 0,
      ammo: alleyPlay ? 0 : Math.max(4, 9 - level),
      note: alleyPlay ? 'Launch a ball: 100 seconds. Match a winning second with a bumper hit.' : 'Pull the spring.',
      set, ...built,
    };
    seatLane(s);
    if(book.snapshot){for(const key of SNAPSHOT_FIELDS)if(book.snapshot[key]!==undefined)s[key]=JSON.parse(JSON.stringify(book.snapshot[key]));}
    if(book.snapshot?.layoutVersion==null&&book.snapshot){s.layoutVersion=1;s.cabinetOn=!!s.activeBall;s.saucer.armed=s.saucer.hold<=0;if(!s.activeBall)refreshLayout(s);}
    releaseInput(s);
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    return s;
  },
  update(s, dt, input) {
    if(!Number.isFinite(dt)||dt<=0)return;
    dt=Math.min(dt,.05);
    s.t += dt;
    const hunger = 1 + s.level * 0.055;
    for (const b of s.bumpers) { b.cool = Math.max(0, b.cool - dt); b.flash = Math.max(0, b.flash - dt); }
    for (const t of s.targets) t.cool = Math.max(0, t.cool - dt);
    for (const sl of s.slings) sl.cool = Math.max(0, sl.cool - dt);
    s.saucer.cool = Math.max(0, s.saucer.cool - dt);
    const keys = input?.keys || new Set();
    const actions = input?.actions || new Set();
    const wantL = s.left || actions.has('left') || keys.has('z') || keys.has('Z') || keys.has('ArrowLeft');
    const wantR = s.right || actions.has('right') || keys.has('x') || keys.has('X') || keys.has('ArrowRight');
    const holdPlunge = s.pointerPlunge || actions.has('plunge') || keys.has(' ');
    if (canPull(s)) {
      if (holdPlunge) beginCharge(s);
      if (s.charging) {
        if (holdPlunge && !s.dragPlunge) s.charge = clamp(s.charge + dt * 1.28, 0, 1);
        if(s.mode==='lane'){s.ball.x=LANE.x;s.ball.y=LANE.y+s.charge*LANE.pull;}
      }
      if (s.charging && !holdPlunge) releasePlunger(s);
    } else if (s.mode === 'dead') {
      if (s.t - s.deadAt > 0.8) seatLane(s);
    }
    const steps = 6;
    for (let n = 0; n < steps; n++) {
      const h = dt / steps;
      s.flippers.forEach((f, i) => {
        const rest = i ? Math.PI - REST : REST;
        const up = i ? Math.PI - UP : UP;
        const target = (i ? wantR : wantL) ? up : rest;
        const change = clamp(target - f.a, -18 * h, 18 * h);
        f.w = change / h;
        f.a += change;
      });
      if (s.mode !== 'live') continue;
      if(s.houseLeft<=0){this.onTimeout(s);continue;}
      const p = s.ball;
      // Count only time with the ball in play, including a held pocket ball.
      s.houseLeft=Math.max(0,s.houseLeft-h);
      if(s.houseLeft<=0){this.onTimeout(s);continue;}
      if(!s.saucer.armed && p.y>s.saucer.y+200)s.saucer.armed=true;
      if(s.saucer.hold>0){
        s.saucer.hold-=h;p.x=s.saucer.x;p.y=s.saucer.y;p.vx=0;p.vy=0;
        if(s.saucer.hold<=0)ejectSaucer(s);
        continue;
      }
      p.vy += G * hunger * h;
      p.vx *= Math.exp(-0.016 * h);
      p.x += p.vx * h; p.y += p.vy * h;
      if (inShooter(p) && p.y < 280 && p.vy < 0) p.vx = Math.min(p.vx, -280 - Math.abs(p.vy) * 0.12);
      for (const r of s.rails) collide(p, r.a, r.b, R, 0, r.a, 1.2);
      if (!(inShooter(p) && p.vy < -24)) collide(p, GATE.a, GATE.b, R, 0, GATE.a, 1.18);
      for (const f of s.flippers) {
        const tip = {x: f.x + Math.cos(f.a) * FLIP, y: f.y + Math.sin(f.a) * FLIP};
        const slap = Math.abs(f.w) > 2 ? 1.96 : 1.26;
        collide(p, f, tip, 13, f.w, f, slap);
      }
      for (const b of s.bumpers) {
        if (bounceCircle(p, b, b.r, 430 + s.combo * 8)) {
          if (b.cool === 0) {
            b.cool = 0.12; b.flash = 0.2; s.combo++;
            dropFromHit(s, 'bumper', b.x, b.y);
            if (s.combo === 3) s.lights[0] = true;
            if (s.combo === 6) s.lights[1] = true;
            if (s.combo === 9) s.lights[2] = true;
          }
        }
      }
      for (const post of s.posts) bounceCircle(p, post, post.r, post.kick);
      for (const sl of s.slings) {
        for (const r of sl.segs) {
          if (collide(p, r.a, r.b, R, 0, r.a, 1.5)) {
            if (sl.cool === 0) {
              sl.cool = 0.16;
              p.vx += sl.kick.x; p.vy += sl.kick.y;
              dropFromHit(s, 'sling', p.x, p.y);
            }
          }
        }
      }
      for (const t of s.targets) {
        if (t.cool > 0) continue;
        if (Math.hypot(p.x - t.x, p.y - t.y) < 22) {
          t.on = true; t.cool = 0.45;
          p.vx = (t.x>440?-1:1)*(Math.abs(p.vx)*.7+90);
          dropFromHit(s, 'target', t.x, t.y);
          if (s.targets.every(x => x.on)) {
            s.lights = [true, true, true];
            s.targets.forEach(x => { x.on = false; });
            s.note = 'The saucer is hungry.';
          }
        }
      }
      for (const r of s.rolls) {
        if (!r.on && p.vy > 40 && Math.abs(p.x - r.x) < 22 && p.y > r.y - 16 && p.y < r.y + 18) {
          r.on = true;
          dropFromHit(s, 'roll', r.x, r.y);
          s.lights[s.rolls.indexOf(r)] = true;
        }
      }
      if (s.saucer.armed && s.saucer.cool === 0 && Math.hypot(p.x - s.saucer.x, p.y - s.saucer.y) < 24) {
        s.saucer.armed=false;
        s.saucer.cool = 2;
        s.saucer.hold = 0.38;
        p.vx *= 0.08; p.vy *= 0.08;
        p.x = s.saucer.x; p.y = s.saucer.y;
        dropFromHit(s, 'saucer', s.saucer.x, s.saucer.y);
        s.combo = 0;
        s.rolls.forEach(r => { r.on = false; });
      }
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > MAX) { p.vx *= MAX / speed; p.vy *= MAX / speed; }
      if (shouldDrain(s, p)) drain(s);
    }
    if (s.mode === 'live' && inShooter(s.ball) && s.ball.y >= LANE.y+s.charge*LANE.pull && s.ball.vy >= 0) {
      s.mode = 'lane';
      s.ball = {x: LANE.x, y: LANE.y+s.charge*LANE.pull, vx: 0, vy: 0};
      s.trail = [];
      s.note = s.charging?'Ball ready — release the spring.':'Back down the lane. Same ball — pull the spring again.';
    }
    if (s.mode === 'live') {
      s.trail.push({x: s.ball.x, y: s.ball.y});
      if (s.trail.length > 14) s.trail.shift();
      const pos = s.stuckPos || {x: s.ball.x, y: s.ball.y, t: s.t};
      if (Math.hypot(s.ball.x - pos.x, s.ball.y - pos.y) > 18) s.stuckPos = {x: s.ball.x, y: s.ball.y, t: s.t};
      else if (s.t - pos.t > 1.35 && !inShooter(s.ball) && !(s.ball.y>950&&(wantL||wantR))) {
        s.ball.vx += (440 - s.ball.x) * 0.9;
        s.ball.vy = -300;
        s.stuckPos = {x: s.ball.x, y: s.ball.y, t: s.t};
      }
    }
    for (const f of s.fly) f.t += dt;
    s.fly = s.fly.filter(f => f.t < f.dur);
    s.saveClock=(s.saveClock||0)+dt;if(s.saveClock>=.5){s.saveClock=0;writeBook(s);}
  },
  pointer(s, type, p) {
    const id=String(p.pointerId??'primary');p={...p,x:(p.x+204)/1.35};s.touches ||= {};
    if(type==='down'){
      const role=canPull(s)&&p.x>690&&p.x<780&&p.y>850&&p.y<1120?'plunge':p.x<450?'left':'right';
      s.touches[id]=role;
      if(role==='plunge'){s.pointerPlunge=true;s.dragPlunge=false;s.plungeY=p.y;beginCharge(s);}
    }
    const role=s.touches[id];
    if(type==='move'&&role==='plunge'&&canPull(s)&&Math.abs(p.y-s.plungeY)>5){
      s.dragPlunge=true;s.charge=clamp((p.y-s.plungeY)/100,0.05,1);
    }
    if(type==='up'||type==='cancel'){
      delete s.touches[id];
      if(role==='plunge'){
        s.pointerPlunge=false;s.dragPlunge=false;
        if(type==='up')releasePlunger(s);else this.cancelAction(s,'plunge');
      }
    }
    s.left=Object.values(s.touches).includes('left');s.right=Object.values(s.touches).includes('right');
  },
  action(s, id, down) {
    if (id === 'left') s.left = !!down;
    if (id === 'right') s.right = !!down;
    if (id === 'plunge') {
      if (down) beginCharge(s);
      else releasePlunger(s);
    }
  },
  key(s, k, down) {
    if ((k === 'z' || k === 'Z' || k === 'ArrowLeft') && !down) s.left = false;
    if ((k === 'x' || k === 'X' || k === 'ArrowRight') && !down) s.right = false;
    if (k === ' ') {
      if (down) beginCharge(s);
      else releasePlunger(s);
    }
  },
  draw(s, d, _t, input) {
    const set = s.set || SETS[s.level] || SETS[0];
    const leftOn = s.left || input?.keys?.has('z') || input?.keys?.has('Z') || input?.keys?.has('ArrowLeft') || input?.actions?.has('left');
    const rightOn = s.right || input?.keys?.has('x') || input?.keys?.has('X') || input?.keys?.has('ArrowRight') || input?.actions?.has('right');
    d.poly([[96, 30], [804, 30], [804, 172], [96, 172]], '#161022f2', '#e6c57a', 2);
    d.text('PIP’S', 450, 58, 14, '#e8c878');
    d.text('PINBALL ALLEY', 450, 90, 34, '#fff3d0');
    d.text(String(s.score).padStart(6, '0')+'  ·  '+(s.cabinetOn?Math.min(100,Math.floor(100-s.houseLeft)+1)+'/100':'LIGHTS OUT'),450,128,23,'#f0d49a');
    for (let i = 0; i < 3; i++) d.circle(390 + i * 50, 152, 8, s.lights[i] ? '#f0c060' : '#2a2428', '#e8d4a0', 1);
    const c=d.c;c.save();c.translate(-204,0);c.scale(1.35,1);
    d.text(['THUNDER GARDEN','MOONLIT BUMPERS','LANTERN LANES','BRASS ORCHARD','STORM GLASS','MIDNIGHT SPARK'][s.level],440,925,18,'#d3c293');
    for (const r of s.rails) {
      d.line(r.a, r.b, '#4a3a28', 14);
      d.line(r.a, r.b, '#e6c57a', 3);
    }
    d.line(GATE.a, GATE.b, '#c4a46a', 6);
    for (const sl of s.slings) for (const r of sl.segs) d.line(r.a, r.b, sl.cool > 0 ? '#f0d080' : '#c9a56a', 9);
    for (const post of s.posts) d.circle(post.x, post.y, post.r, '#8a6a48', '#f0d6a0', 2);
    for (const b of s.bumpers) {
      if (b.flash > 0) d.glow(b.x, b.y, 68, '#f0d49a');
      d.item(spriteKey(bumperItem(s,b)), b.x, b.y, {
        w: (b.r*2+8)*(b.flash>0?1.12:1), alpha: 1,
        fallback: () => d.star(b.x, b.y, 12, '#f4e2a8'),
      });
    }
    for (const t of s.targets) {
      d.poly([[t.x - 10, t.y - 16], [t.x + 12, t.y - 8], [t.x + 12, t.y + 8], [t.x - 10, t.y + 16]], t.on ? '#c45a6a' : '#8a6a48', '#ead6a4', 2);
    }
    for (const r of s.rolls) {
      d.ellipse(r.x, r.y, 16, 8, r.on ? '#f0d08055' : '#00000033', r.on ? '#f0d080' : '#c4a46a', 2);
    }
    d.item(spriteKey('everyday-penny'),s.saucer.x,s.saucer.y,{w:46,fallback:()=>d.circle(s.saucer.x,s.saucer.y,20,'#b89668','#f0d080',3)});
    d.path(s.trail, '#f0d6a844', 4);
    for (const f of s.flippers) {
      const c = Math.cos(f.a), sn = Math.sin(f.a);
      const pts = [[-8, -15], [FLIP - 10, -7], [FLIP + 2, 0], [FLIP - 10, 7], [-8, 15]]
        .map(([x, y]) => [f.x + x * c - y * sn, f.y + x * sn + y * c]);
      d.poly(pts, set.bat, '#f8e6b8', 2);
      d.circle(f.x, f.y, 13, '#d4b07a', '#f8e6b8', 2);
    }
    const springY = LANE.y + s.charge * LANE.pull;
    d.poly([[696, 1090], [758, 1090], [758, 1148], [696, 1148]], '#3a2a22cc', '#d2b07a', 2);
    d.line({x: LANE.x, y: springY + 16}, {x: LANE.x, y: 1086}, '#c5d0d6', 5);
    const coils = 7;
    for (let i = 0; i < coils; i++) {
      const cy = springY + 22 + i * ((1084 - springY - 22) / coils);
      d.line({x: LANE.x - 9, y: cy}, {x: LANE.x + 9, y: cy}, '#d2b07a', 2);
    }
    d.circle(LANE.x, springY + 28, 15, '#8a3030', '#f0d0a8', 2);
    if(pickUnique(s)){
      d.glow(615,320,39,'#f2d17f');
      d.item(spriteKey(set.prize),615,320,{w:50,fallback:()=>d.star(615,320,19,'#f5d58b')});
      d.text('CHAPTER PRIZE',615,361,12,'#ffe8a6');
    }
    d.ball(s.ball.x,s.ball.y,R+1,'#c5d5e2');
    if(!s.cabinetOn)d.poly([[210,200],[640,200],[720,188],[758,228],[758,1148],[228,1148]],'#06091299');
    c.restore();
    d.poly([[118, 1120], [782, 1120], [798, 1172], [102, 1172]], '#2a1c16ee', '#e6c57a', 2);
    d.circle(210, 1146, 16, leftOn ? '#f0d080' : '#6a3a48', '#ead6a4', 2);
    d.circle(690, 1146, 16, rightOn ? '#f0d080' : '#6a3a48', '#ead6a4', 2);
    d.text('LEFT', 210, 1152, 12, '#fff6d8');
    d.text('RIGHT', 690, 1152, 12, '#fff6d8');
    const n = alleyPlay ? (pocket() ?? 0) : s.ammo;
    d.item(spriteKey('penny-purse'), 86, 64, {w: 72, fallback: () => d.heart(86, 64, 22, '#6a7a52')});
    d.text(String(n), 86, 108, 18, '#fff6d8');
    d.poly([[760, 44], [828, 48], [824, 108], [756, 104]], '#6b3a3a', '#e8d4a0', 2);
    d.item(spriteKey(set.prize), 792, 76, {w: 44, alpha:pickUnique(s)?1:.45, fallback: () => d.star(792, 76, 12, '#f4e2a8')});
    d.text(pickUnique(s)?'LOCKED':'COLLECTED',792,132,12,'#f4e2a8');
    for (const f of s.fly) {
      const u = Math.min(1, f.t / f.dur), e = 1 - (1 - u) * (1 - u);
      const destX = f.prize ? 792 : 86, destY = f.prize ? 76 : 64,startX=f.x*1.35-204;
      d.item(spriteKey(f.id), startX + (destX - startX) * e, f.y + (destY - f.y) * e, {
        w: 28 * (1 - u * 0.35),
        fallback: () => d.ball(startX + (destX - startX) * e, f.y + (destY - f.y) * e, 9, '#d2b07a'),
      });
    }
  },
  readout: s => {
    return prizeStatus(s)+' · '+(s.mode==='live'?Math.max(0,s.credit||0)+' balls ready':s.note);
  },
};

