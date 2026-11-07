import {alleyPlay, keep, owned} from '../wallet.js?v=entry-1';
import { pennies as pursePennies, debit as purseDebit, credit as purseCredit, refillIfEmpty, packs as pursePacks, packFive as pursePackFive, unpackFive as purseUnpackFive, packAll as pursePackAll } from "../cabinet-wallet.js?v=copper-warn-1";

const BOOK = alleyPlay ? "pennyFever.copperFalls.v6" : "pennyFever.copperFalls.practice.v6";
const TAU = Math.PI * 2;
/** Cabinet sits in the mill-pond oval. Hopper is the painted coin bed. */
const CAB = { x: 130, y: 188, w: 640, h: 640 };
const LEFT = CAB.x + CAB.w * 0.24;
const RIGHT = CAB.x + CAB.w * 0.76;
const BACK = CAB.y + CAB.h * 0.36;
const FRONT = CAB.y + CAB.h * 0.66;
const COIN_R = 13;
const TREASURE_R = 24;
/** Every chapter releases its unique by the first paid penny. */
const RELEASE_PENNIES = 1;
const CHAPTERS = [
  { id: "shallow", title: "The Shallow Tray", prize: "coin-sleeve", divider: false, pegs: 0, upper: false, dead: false, speed: 0.55, push: 36, rows: 3, cols: 8, lipGap: 18 },
  { id: "split", title: "Split Falls", prize: "copper-cascade", divider: true, pegs: 0, upper: false, dead: false, speed: 0.62, push: 32, rows: 3, cols: 7, lipGap: 22 },
  { id: "pegs", title: "Peg Rain", prize: "penny-tree", divider: false, pegs: 5, upper: false, dead: false, speed: 0.72, push: 28, rows: 3, cols: 7, lipGap: 26 },
  { id: "double", title: "The Double Shelf", prize: "coin-album", divider: false, pegs: 3, upper: true, dead: false, speed: 0.68, push: 24, rows: 2, cols: 6, lipGap: 28 },
  { id: "crooked", title: "Crooked Crown", prize: "treasure-tin", divider: false, pegs: 4, upper: false, dead: true, speed: 0.78, push: 22, rows: 2, cols: 6, lipGap: 32 },
  { id: "great", title: "The Great Copper Fall", prize: "mint-press", divider: true, pegs: 6, upper: true, dead: true, speed: 0.88, push: 18, rows: 2, cols: 5, lipGap: 36 },
];
const PRIZE_NAMES = {
  "coin-sleeve": "Coin sleeve",
  "copper-cascade": "Copper cascade",
  "penny-tree": "Penny tree",
  "coin-album": "Coin album",
  "treasure-tin": "Treasure tin",
  "mint-press": "Mint press",
};

function emptyBook() {
  return { v: 6, practiceUsed: false, trays: {} };
}
function readBook() {
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || "null");
    if (blob && blob.v === 6) return { ...emptyBook(), ...blob, trays: blob.trays || {} };
  } catch {}
  return emptyBook();
}
function writeBook(book) {
  try { localStorage.setItem(BOOK, JSON.stringify(book)); } catch {}
}

let audioCtx = null;
function clink(freq, dur, gain) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + dur);
    g.gain.setValueAtTime(gain || 0.07, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(t); o.stop(t + dur);
  } catch {}
}

function pegsFor(ch) {
  const pegs = [];
  const n = ch.pegs | 0;
  for (let i = 0; i < n; i++) {
    const col = i % 3, row = (i / 3) | 0;
    pegs.push({
      x: LEFT + 55 + col * (RIGHT-LEFT-110)/2,
      y: BACK + 65 + row * 65,
      r: 10,
    });
  }
  return pegs;
}

function seedPile(level) {
  const ch = CHAPTERS[level] || CHAPTERS[0];
  const coins = [];
  const rows = ch.rows, cols = ch.cols, gap = COIN_R * 2.05;
  const width = (cols - 1) * gap;
  const x0 = (LEFT + RIGHT) / 2 - width / 2;
  const yFront = FRONT - COIN_R - ch.lipGap;
  const yBack = BACK + COIN_R + 8;
  const span = Math.max(gap, yFront - yBack);
  for (let r = 0; r < rows; r++) {
    const t = rows === 1 ? 0 : r / (rows - 1);
    const y = yFront - t * span;
    for (let c = 0; c < cols; c++) {
      if (r === 0 && (c === 0 || c === cols - 1) && level > 2) continue;
      coins.push({
        id: "s" + r + "-" + c + "-" + level,
        kind: "penny",
        x: x0 + c * gap + (r % 2) * (gap * 0.45),
        y,
        vx: 0, vy: 0, r: COIN_R,
        falling: false,
      });
    }
  }
  return coins;
}

const pennyCount = coins => coins.reduce((n,c)=>n+(c.kind === "treasure" ? 0 : (c.count || 1)),0);
function ledger(tray) {
  // Older saves start accounting from their current layout; never reseed them.
  return tray.ledger ||= {starting:pennyCount(tray.coins), dropped:0, returned:0};
}

function freshTray(level) {
  const ch = CHAPTERS[level];
  return {
    coins: seedPile(level),
    paidCount: 0,
    mark: RELEASE_PENNIES,
    treasureOn: false,
    treasureOwned: false,
    pusher: 0,
  };
}

function loadTray(level) {
  const book = readBook();
  const saved = book.trays[String(level)];
  if (saved && Array.isArray(saved.coins)) return JSON.parse(JSON.stringify(saved));
  const tray = freshTray(level);
  book.trays[String(level)] = tray;
  writeBook(book);
  return JSON.parse(JSON.stringify(tray));
}
function persistState(s) {
  if (!s) return;
  const book = readBook();
  book.selected = s.level;
  const session = {};
  for (const key of ['t','phase','slider','sliderDir','dropX','pusherT','cycle','flash','lastWin','won','busy','note','settle','handful']) session[key] = s[key];
  const tray = {...s.tray, coins:s.tray.coins.map(c=>({...c})), session};
  if (s.practice) book.practice = {level:s.level, tray};
  else book.trays[String(s.level)] = tray;
  writeBook(book);
}

function clampVel(c) {
  if (c.vx > 200) c.vx = 200; else if (c.vx < -200) c.vx = -200;
  if (c.vy > 260) c.vy = 260; else if (c.vy < -60) c.vy = -60;
}

function resolveCoins(coins, ch, pegs, pusherY, dt) {
  const wallsL = LEFT + 18, wallsR = RIGHT - 18;
  for (const c of coins) {
    if (c.falling) {
      c.vy += 720 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (c.y > BACK + 24 && c.y < FRONT - 8) {
        c.falling = false;
        c.vy *= 0.2;
      }
      clampVel(c);
      continue;
    }
    c.vx *= 0.84;
    c.vy *= 0.84;
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    if (c.y - c.r < pusherY) {
      c.y = pusherY + c.r + 0.5;
      c.vy = Math.max(c.vy, 40);
    }
    if (!c.falling && c.y + c.r > FRONT - 3) {
      c.falling = true;
      c.vy = Math.max(c.vy, 80);
    }
    if (c.x - c.r < wallsL) { c.x = wallsL + c.r; c.vx = Math.abs(c.vx) * 0.25; }
    if (c.x + c.r > wallsR) { c.x = wallsR - c.r; c.vx = -Math.abs(c.vx) * 0.25; }
    if (ch.divider && c.y < FRONT - 42) {
      if (c.x + c.r > 444 && c.x < 450) { c.x = 444 - c.r; c.vx = -Math.abs(c.vx) * 0.4; }
      if (c.x - c.r < 456 && c.x > 450) { c.x = 456 + c.r; c.vx = Math.abs(c.vx) * 0.4; }
    }
    if (ch.dead && c.x > RIGHT-65 && c.y > BACK+80) { c.vx *= Math.exp(-4*dt); c.vy *= Math.exp(-4*dt); }
    if(ch.upper && c.y>BACK+45 && c.y<BACK+80 && c.x>LEFT+95 && c.x<RIGHT-95){
      c.x += (c.x<450?-1:1)*18*dt;
      c.vy *= Math.exp(-6*dt);
    }
    for (const p of pegs) {
      const dx = c.x - p.x, dy = c.y - p.y, d = Math.hypot(dx, dy) || 1, min = c.r + p.r;
      if (d < min) {
        const nx = dx / d, ny = dy / d, overlap = min - d + 0.4;
        c.x += nx * overlap; c.y += ny * overlap;
        const vn = c.vx * nx + c.vy * ny;
        if (vn < 0) { c.vx -= 1.2 * vn * nx; c.vy -= 1.2 * vn * ny; }
      }
    }
    clampVel(c);
  }
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < coins.length; i++) {
      for (let j = i + 1; j < coins.length; j++) {
        const a = coins[i], b = coins[j];
        if (a.falling || b.falling) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, min = a.r + b.r + 0.6;
        if (d < min) {
          const nx = dx / d, ny = dy / d, overlap = min - d;
          const ma = a.kind==='treasure'?2:Math.sqrt(a.count||1), mb = b.kind==='treasure'?2:Math.sqrt(b.count||1);
          a.x -= nx * overlap * mb/(ma+mb); a.y -= ny * overlap * mb/(ma+mb);
          b.x += nx * overlap * ma/(ma+mb); b.y += ny * overlap * ma/(ma+mb);
          const va = a.vx * nx + a.vy * ny, vb = b.vx * nx + b.vy * ny;
          const diff = (vb - va) * 0.4;
          a.vx += diff * nx; a.vy += diff * ny;
          b.vx -= diff * nx; b.vy -= diff * ny;
        }
      }
    }
  }
}

function shouldWarn(s, id, n) {
  if (s.practice || s.phase !== 'idle' || s.busy) return false;
  if (id === 'dropall') return n >= 10;
  if (id === 'drop12' || id === 'drop14') return n >= 25;
  return false;
}

function uiButtons(s) {
  const n = s.practice ? 1 : pursePennies();
  const packed = s.practice ? 0 : pursePacks();
  const q = n ? Math.max(1, Math.floor(n / 4)) : 0;
  const h = n ? Math.max(1, Math.floor(n / 2)) : 0;
  const can = s.phase === 'idle' && !s.busy && !s.warn;
  if (s.warn) {
    const dump = s.warn.n;
    return [
      {id:'warn-pack',label:'Pack them first',x:30,y:888,w:840,h:64,on:true},
      {id:'warn-dump',label:'Dump anyway · '+dump,x:30,y:960,w:410,h:72,on:true},
      {id:'warn-keep',label:'Keep them',x:460,y:960,w:410,h:72,on:true},
    ];
  }
  if (s.practice) {
    return [
      {id:'drop1',label:'Practice drop',x:30,y:942,w:410,h:84,count:1,on:can&&n>=1},
      {id:'drop14',label:'¼ purse · 1',x:460,y:942,w:410,h:84,count:1,on:false},
      {id:'drop12',label:'½ purse · 1',x:30,y:1036,w:410,h:84,count:1,on:false},
      {id:'dropall',label:'Drop purse · 1',x:460,y:1036,w:410,h:84,count:1,on:false},
    ];
  }
  return [
    {id:'pack5',label:n>=5?'Pack 5 pennies':'Need 5 to pack',x:30,y:888,w:410,h:64,on:can&&n>=5},
    {id:'unpack5',label:packed?('Open 5-pack · '+packed):'No 5-packs yet',x:460,y:888,w:410,h:64,on:can&&packed>=1},
    {id:'drop1',label:'Drop 1 penny',x:30,y:960,w:410,h:72,count:1,on:can&&n>=1},
    {id:'drop14',label:'¼ purse · '+q,x:460,y:960,w:410,h:72,count:q,on:can&&n>=1},
    {id:'drop12',label:'½ purse · '+h,x:30,y:1040,w:410,h:72,count:h,on:can&&n>=1},
    {id:'dropall',label:'Drop purse · '+n,x:460,y:1040,w:410,h:72,count:n,on:can&&n>=1},
  ];
}
function hitButton(s, p) {
  return uiButtons(s).find(b => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) || null;
}

function maybeReleaseTreasure(s) {
  if (s.practice || s.tray.treasureOn || s.tray.treasureOwned) return;
  if (s.tray.paidCount < RELEASE_PENNIES) return;
  s.tray.treasureOn = true;
  s.tray.coins.push({
    id: "treasure",
    kind: "treasure",
    x: 450, y: BACK + 70,
    vx: 0, vy: 12, r: TREASURE_R, falling: false,
  });
  s.note = "The latch opens. Push it over the edge.";
  s.flash = 1.2;
  clink(880, 0.35, 0.1);
  return true;
}

function prizeStatus(s) {
  if(s.practice)return "Free practice · no charge or prizes";
  if(s.tray.treasureOwned)return "Treasure already in your collection";
  if(s.tray.treasureOn)return "Prize on tray — push it over the edge";
  const left=Math.max(0,RELEASE_PENNIES-s.tray.paidCount);
  return "Prize releases in "+left+" paid "+(left===1?"penny":"pennies");
}

function collectOff(s) {
  const remaining = [];
  let penniesWon = 0, treasureWon = false;
  for (const c of s.tray.coins) {
    if (!c.falling && c.y + c.r > FRONT - 2) {
      c.falling = true;
      c.vy = Math.max(c.vy, 90);
    }
    if (c.falling && c.y > FRONT + 90) {
      if (c.kind === "treasure") treasureWon = true;
      else penniesWon += c.count || 1;
      clink(320 + Math.random() * 80, 0.08, 0.06);
    } else remaining.push(c);
  }
  ledger(s.tray).returned += penniesWon;
  s.tray.coins = remaining;
  if (!penniesWon && !treasureWon) return;
  if (!s.practice) {
    if (penniesWon) {
      purseCredit(penniesWon);
      s.lastWin = (s.lastWin || 0) + penniesWon;
      s.note = s.lastWin === 1 ? "One penny over the lip." : s.lastWin + " pennies over the lip.";
    }
    if (treasureWon && !s.tray.treasureOwned) {
      if (alleyPlay) keep(CHAPTERS[s.level].prize, "coin-pusher");
      s.tray.treasureOwned = true;
      s.tray.treasureOn = false;
      s.won = true;
      s.note = "Treasure over the edge.";
      clink(700, 0.4, 0.12);
    }
  } else if (penniesWon) {
    s.note = "Practice cascade — those pennies stay in the machine.";
  }
  persistState(s);
}

export default {
  title: "Copper Falls",
  canvasControls: true,
  tables: true,
  selectedChapter() { return Math.max(0, Math.min(5, Number(readBook().selected) || 0)); },
  houseSeconds: 0,
  intro: "Copper’s coin pusher. The tray starts loaded and stays how you left it. Early chapters sit fat near the lip — later ones are stingy. Pack five pennies to keep a bundle out of the machine; Drop purse only dumps what is still loose, and a big dump asks once before it falls. The chapter prize unlatches on the first paid penny, then you still have to push it over the edge.",
  instructions: "Aim the hopper, then drop 1, ¼, ½ or the loose purse. Pack 5 pennies into a 5-pack to keep them out of play; open a pack when you want them back. A large dump warns first — packed coins stay safe. One dump, one shove. The unique only joins the tray by the first paid penny in each chapter — never on the practice drop — and it never falls in by itself.",
  levels: CHAPTERS.map(c => c.title),
  images: {
    cabinet: "./assets/coin-pusher/pusher/cabinet.webp",
    host: "../assets/restyle/scene-turnarounds-2026-09-09/vendors/copper/front.webp",
    penny: "./assets/coin-pusher/pusher/penny.webp",
    star: "./assets/coin-pusher/pusher/star-token.webp",
    "coin-sleeve": "./assets/coin-pusher/prizes/coin-sleeve.webp",
    "copper-cascade": "./assets/coin-pusher/prizes/copper-cascade.webp",
    "penny-tree": "./assets/coin-pusher/prizes/penny-tree.webp",
    "coin-album": "./assets/coin-pusher/prizes/coin-album.webp",
    "treasure-tin": "./assets/coin-pusher/prizes/treasure-tin.webp",
    "mint-press": "./assets/coin-pusher/prizes/mint-press.webp",
  },
  actions: [],
  persist(s) {
    persistState(s);
  },
  hud(s) {
    const n = pursePennies();
    const packed = s?.practice ? 0 : pursePacks();
    const ch = CHAPTERS[s?.level || 0];
    const cash = s?.practice ? "Practice" : (n + (n === 1 ? " penny" : " pennies") + (packed ? " · " + packed + (packed === 1 ? " pack" : " packs") : ""));
    const keep = s?.tray?.treasureOwned ? "Treasure ✓" : ("Ch " + ((s?.level || 0) + 1) + " · " + ch.title);
    return { cash, keep };
  },
  create(level) {
    refillIfEmpty(24);
    const book = readBook();
    const practice = !book.practiceUsed;
    const tray = practice ? (book.practice?.level === level ? book.practice.tray : {...freshTray(level), mark:999}) : loadTray(level);
    const oldMark=tray.mark, oldTreasureOn=tray.treasureOn;
    if(!practice)tray.mark=RELEASE_PENNIES;
    ledger(tray);
    tray.coins = tray.coins.map(c=>({vx:0,vy:0,falling:false,...c}));
    if (alleyPlay && owned(CHAPTERS[level].prize)) {
      tray.treasureOwned = true;
      tray.treasureOn = false;
      tray.coins = tray.coins.filter(c=>c.kind !== 'treasure');
    }
    if(!tray.treasureOwned)tray.treasureOn=tray.coins.some(c=>c.kind==='treasure');
    const state = {
      level, t: 0, practice,
      phase: "idle",
      pegs: pegsFor(CHAPTERS[level]),
      tray,
      slider: 0.5, sliderDir: 1,
      dropX: 450,
      pusherT: 0,
      cycle: 0,
      flash: 0,
      lastWin: 0,
      won: !!tray.treasureOwned,
      busy: false,
      note: practice
        ? "Complimentary first drop. Watch the hopper, then tap Drop."
        : "The tray is as you left it. One handful, one push.",
      ...(tray.session || {}),
    };
    // Honour already-paid pennies immediately, without buying another drop.
    const released=maybeReleaseTreasure(state);
    if(!practice&&(released||oldMark!==tray.mark||oldTreasureOn!==tray.treasureOn))persistState(state);
    return state;
  },
  update(s, dt) {
    s.t += dt;
    s.flash = Math.max(0, s.flash - dt);
    const ch = CHAPTERS[s.level];
    if (typeof document !== "undefined" && document.hidden) return;
    if (s.phase === "idle") {
      s.slider += s.sliderDir * ch.speed * dt;
      if (s.slider > 1) { s.slider = 1; s.sliderDir = -1; }
      if (s.slider < 0) { s.slider = 0; s.sliderDir = 1; }
      s.dropX = LEFT + 18 + s.slider * (RIGHT - LEFT - 36);
    }
    if(s.phase==='push'){
      const advance=Math.max(0,Math.sin(Math.min(1,s.cycle+dt*.85)*Math.PI)-Math.sin(s.cycle*Math.PI));
      const drop=Math.max(1,s.handful||1);
      const depth=FRONT-BACK;
      const totalY=Math.min(depth*0.55, 10+Math.pow(drop,0.55)*6.2);
      const shove=totalY*advance;
      const laneW=70+Math.min(140,Math.sqrt(drop)*10);
      for(const coin of s.tray.coins)if(!coin.falling){
        const lane=Math.exp(-Math.pow((coin.x-s.dropX)/laneW,2));
        coin.y+=shove*lane;
        coin.vy=Math.max(coin.vy,shove*lane/Math.max(dt,.001));
      }
    }
    const dropAmp=Math.max(1,s.handful||1);
    const pushAmp=Math.min(96,(ch.push||36)*(0.7+Math.min(2.1,Math.sqrt(dropAmp)/7)));
    const pusherY = BACK - 8 + (s.phase === "push" ? Math.sin(s.cycle * Math.PI) * pushAmp : 0);
    const steps = 5;
    const h = dt / steps;
    const pegs = s.pegs || pegsFor(ch);
    for (let i = 0; i < steps; i++) resolveCoins(s.tray.coins, ch, pegs, pusherY, h);
    collectOff(s);
    if (s.phase === "drop") {
      const still = s.tray.coins.some(c => c.falling && c.y < FRONT - 20);
      if (!still) {
        for (const c of s.tray.coins) if (c.falling && c.y < FRONT) { c.falling = false; c.vy *= 0.2; }
        s.phase = "push";
        s.cycle = 0;
        clink(180, 0.2, 0.05);
      }
    }
    if (s.phase === "push") {
      s.cycle += dt * 0.85;
      if (s.cycle >= 1) {
        s.cycle = 0;
        s.phase = "settle";
        s.settle = 0.55;
      }
    }
    if (s.phase === "settle") {
      s.settle -= dt;
      if (s.settle <= 0) {
        s.phase = "idle";
        s.busy = false;
        if (!s.practice) persistState(s);
        else {
          const book = readBook();
          book.practiceUsed = true;
          delete book.practice;
          writeBook(book);
          s.practice = false;
          s.tray = loadTray(s.level);
          s.note = "Paid tray is live. Pennies over the lip go in your purse.";
          persistState(s);
        }
      }
    }
  },
  pointer(s, type, p) {
    if (type !== "down") return;
    const btn = hitButton(s, p);
    if (btn) {
      if(btn.on)this.action(s, btn.id, btn.count);
      return;
    }
  },
  drop(s, count) {
    if (s.warn) return;
    if (s.busy || s.phase !== "idle") {
      s.note = "Wait for the shelf to finish.";
      return;
    }
    let n = Math.floor(Number(count));
    if (!Number.isSafeInteger(n) || n < 1) return;
    if (s.practice) n = 1;
    else {
      const have = pursePennies();
      if (have < 1) {
        s.note = "Purse is empty. Knock some over the lip.";
        return;
      }
      n = Math.min(n, have);
      if (!purseDebit(n)) { s.note = "The purse could not pay for that drop."; return; }
      s.tray.paidCount += n;
    }
    ledger(s.tray).dropped += n;
    s.handful = n;
    s.busy = true;
    s.lastWin = 0;
    const stamp = Date.now();
    // A whole handful lands together. Counted stacks retain every penny and
    // leave room for a growing pile rather than flooding a single flat layer.
    const stacks = Math.min(n, 24), cols = Math.min(stacks, 6);
    for (let i = 0; i < stacks; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const count = Math.floor(n / stacks) + (i < n % stacks ? 1 : 0);
      s.tray.coins.push({
        id: "d" + stamp + "-" + i, kind: "penny", count,
        x: Math.max(LEFT+32,Math.min(RIGHT-32,s.dropX+(col-(cols-1)/2)*15)),
        y: BACK-36-row*3,
        vx: 0, vy: 120, r: COIN_R, falling: true,
      });
    }
    s.phase = "drop";
    s.note = s.practice ? "Practice penny away." : (n === 1 ? "One penny down." : n + " pennies down.");
    clink(420, 0.1, 0.07);
    maybeReleaseTreasure(s);
    persistState(s);
  },
  action(s, id, count) {
    if (s.warn && id !== "warn-pack" && id !== "warn-dump" && id !== "warn-keep") return;
    if (id === "pack5") {
      if (s.practice || s.busy || s.phase !== "idle") return;
      if (pursePackFive()) {
        s.note = "Five pennies packed. They stay out of the machine.";
        persistState(s);
      } else s.note = "Need five loose pennies to pack.";
      return;
    }
    if (id === "unpack5") {
      if (s.practice || s.busy || s.phase !== "idle") return;
      if (purseUnpackFive()) {
        s.note = "Five pennies back in the purse.";
        persistState(s);
      } else s.note = "No 5-packs to open.";
      return;
    }
    if (id === "warn-keep") {
      s.warn = null;
      s.note = "Still in the purse. Pack 5 to keep a bundle out of the machine.";
      return;
    }
    if (id === "warn-pack") {
      const n = pursePackAll();
      s.warn = null;
      s.note = n
        ? ("Packed " + n + (n === 1 ? " pack" : " packs") + ". Those stay out of the machine.")
        : "Need five loose pennies to pack.";
      persistState(s);
      return;
    }
    if (id === "warn-dump") {
      const n = s.warn?.n;
      s.warn = null;
      if (n) this.drop(s, n);
      return;
    }
    if (id === "drop1" || id === "drop") this.drop(s, 1);
    if (id === "drop14" || id === "drop12" || id === "dropall") {
      const purse=pursePennies();
      const n=id==='dropall'?purse:Math.max(1,Math.floor(purse/(id==='drop14'?4:2)));
      if (shouldWarn(s, id, n)) {
        s.warn = {id, n};
        s.note = "Pack a few first? The tray keeps more than it pays back.";
        return;
      }
      this.drop(s, n);
    }
  },
  key(s, k, down) {
    if (!down) return;
    if (k === " " || k === "Enter") this.drop(s, 1);
  },
  draw(s, d) {
    const c = d.c;
    const ch = CHAPTERS[s.level];
    // tray bed
    const cab = d.art.cabinet;
    if (cab) c.drawImage(cab, CAB.x, CAB.y, CAB.w, CAB.h);
    const pusherY = BACK - 8 + (s.phase === "push" ? Math.sin(s.cycle * Math.PI) * Math.min(40, ch.push || 40) : 0);
    c.fillStyle = "rgba(212, 176, 106, 0.45)";
    c.fillRect(LEFT + 6, pusherY - 8, RIGHT - LEFT - 12, 12);

    if (ch.divider) {
      c.fillStyle = "#8a6a38";
      c.fillRect(446, BACK, 8, FRONT - BACK - 42);
    }
    for (const p of (s.pegs || pegsFor(ch))) {
      d.circle(p.x, p.y, p.r, "#c4a060", "#7a5828", 2);
    }
    if(ch.upper){c.fillStyle='#9e713f';c.fillRect(LEFT+95,BACK+70,RIGHT-LEFT-190,8);}
    if(ch.dead){c.fillStyle='rgba(65,35,20,.28)';c.fillRect(RIGHT-65,BACK+80,45,FRONT-BACK-100);}
    // drop guide
    c.strokeStyle = "rgba(255, 220, 140, 0.35)";
    c.setLineDash([6, 8]);
    c.beginPath(); c.moveTo(s.dropX, BACK - 28); c.lineTo(s.dropX, FRONT); c.stroke();
    c.setLineDash([]);
    d.circle(s.dropX, BACK - 22, 8, "#e8c878", "#7a5828", 2);

    const pieces=[...s.tray.coins.filter(c=>c.kind!=="treasure"),...s.tray.coins.filter(c=>c.kind==="treasure")];
    for (const coin of pieces) {
      const img = coin.kind === "treasure" ? d.art[ch.prize] : (coin.kind === "star" ? d.art.star : d.art.penny);
      if((coin.count||1)>1){
        for(let layer=1;layer<=Math.min(4,coin.count-1);layer++)
          d.circle(coin.x,coin.y-layer*3,coin.r,"#b87333","#7a4a18",1);
      }
      if(coin.kind==='treasure')d.circle(coin.x,coin.y,coin.r+5,null,"#fff0a8",3);
      if (img) d.sprite(img, coin.x, coin.y, { w: coin.r * 2.15, h: coin.r * 2.15 });
      else d.circle(coin.x, coin.y, coin.r, coin.kind === "treasure" ? "#e8c878" : "#b87333", "#7a4a18", 2);
    }

    d.text(pennyCount(s.tray.coins)+" pennies in machine",450,798,17,"#fff0c8");

    // locked treasure in the crown shelf
    if (!s.tray.treasureOn && !s.tray.treasureOwned) {
      const timg = d.art[ch.prize];
      c.globalAlpha = 0.55;
      if (timg) d.sprite(timg, 450, 268, { w: 70, h: 70 });
      c.globalAlpha = 1;
      d.text("Locked", 450, 312, 14, "#ead6a4");
    } else if (s.tray.treasureOwned) {
      d.text("Collected", 450, 268, 16, "#c8e878");
    }
    if (s.flash > 0) {
      c.fillStyle = `rgba(255, 220, 120, ${s.flash * 0.25})`;
      c.fillRect(LEFT, BACK, RIGHT - LEFT, 80);
    }

    c.fillStyle = "rgba(20, 10, 8, 0.55)";
    c.fillRect(LEFT, FRONT, RIGHT - LEFT, 18);
    d.text("Collection lip", 450, FRONT + 32, 14, "#e8c878");

    if (s.warn) {
      c.fillStyle = "rgba(10, 6, 8, 0.72)";
      c.fillRect(0, 150, 900, 730);
      c.beginPath();
      if (c.roundRect) c.roundRect(70, 210, 760, 430, 22); else c.rect(70, 210, 760, 430);
      c.fillStyle = "rgba(36, 22, 18, 0.96)";
      c.fill();
      c.strokeStyle = "#e8c878";
      c.lineWidth = 3;
      c.stroke();
      d.text("Pack a few first?", 450, 270, 32, "#fff1d1");
      d.wrap("That's " + s.warn.n + " loose pennies. The tray is greedier than it looks — packed 5-packs stay in your pocket.", 450, 330, 22, "#f0d18f", 680, 10);
      d.wrap("Dump anyway if you mean it. Copper will not send a second warning.", 450, 470, 18, "#ead6a4", 640, 8);
    } else {
      d.wrap(s.note, 450, 822, 18, "#fff0c8", 700, 8);
      d.text(prizeStatus(s),450,872,16,"#c8e878");
    }

    uiButtons(s).forEach(b => {
      c.beginPath();
      if (c.roundRect) c.roundRect(b.x, b.y, b.w, b.h, 14); else c.rect(b.x, b.y, b.w, b.h);
      c.fillStyle = b.on ? "#5a3a28" : "#2a2226";
      c.fill();
      c.strokeStyle = b.on ? "#f0d18f" : "#6a5a50";
      c.lineWidth = b.on ? 3 : 1.5;
      c.stroke();
      d.text(b.label, b.x + b.w / 2, b.y + b.h / 2 + 7, 18, b.on ? "#fff6d8" : "#8a7a70");
    });
  },
  readout(s) {
    const n = pursePennies();
    const packed = s.practice ? 0 : pursePacks();
    const purse = s.practice ? "practice" : (n + " pennies" + (packed ? " · " + packed + " packed" : ""));
    return purse + " · " + prizeStatus(s) + (s.note ? " · " + s.note : "");
  },
};
