import {prizeAttempts, recordPrizeAttempt} from '../first-prize.js?v=first-prize-1';
import {drawMilkySplash, splashSwap, isSliding} from '../milky-splash-art.js?v=milk-props-1';
import {done} from '../draw.js';
import {itemName} from '../prizes.js';
import {alleyPlay, pocket, keep, credit, owned} from '../wallet.js?v=entry-1';
import {takeAttempt, retryNote} from '../stall-entry.js?v=first-prize-1';
import {bindPrize, takePrize} from '../chapter-kit.js?v=align-1';
import {
  MABEL_CHAPTERS, makeBoard, makeDeliveryBoard, applySwap, cloneBoard, isDelivered, resultNumber,
  ordinaryFor, cellFromPoint, cellCenter, refillMoves, locateUnique, repairBoard, spawnUnique,
} from '../milky-splash.js?v=milk-cow-1';

const BOOK = 'pennyFever.milkySplash';
const HOUSE_SECONDS=160;

const PROP_URLS = [1, 2, 3, 4, 5, 6].map((i) =>
  new URL(`../assets/prop-kits/milk-bottles/piece-0${i}.png?v=milk-props-1`, import.meta.url).href
);
const propImgs = [];
function preloadMilkProps() {
  PROP_URLS.forEach((src, i) => {
    if (propImgs[i]) return;
    const im = new Image();
    im.onload = () => { propImgs[i] = im; };
    im.src = src;
  });
}
function paintMilkProps(d) {
  preloadMilkProps();
  const spots = [
    { x: 108, y: 360 }, { x: 96, y: 560 }, { x: 118, y: 760 },
    { x: 792, y: 360 }, { x: 804, y: 560 }, { x: 782, y: 760 },
  ];
  spots.forEach((p, i) => {
    const img = propImgs[i];
    if (img) d.sprite(img, p.x, p.y, { w: 92, shadow: false });
  });
}

function emptyBook() {
  return {v: 1, paid: {}, sittings: {}};
}
function readBook() {
  if (typeof localStorage === 'undefined') return emptyBook();
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || 'null');
    if (blob && blob.v === 1) return {paid: {}, sittings: {}, ...blob};
  } catch {}
  return emptyBook();
}
function writeBook(book) {
  if (!alleyPlay || typeof localStorage === 'undefined') return;
  try { localStorage.setItem(BOOK, JSON.stringify(book)); } catch {}
}
function chapterPaid(level) {
  return !!readBook().paid?.[String(level)] || owned(MABEL_CHAPTERS[level].prize);
}
function markPaid(level) {
  if (!alleyPlay) return;
  const book = readBook();
  book.paid[String(level)] = true;
  writeBook(book);
}

function boardBlob(board) {
  if (!board) return null;
  return {
    level: board.level, seed: board.seed, cols: board.cols, rows: board.rows,
    cells: board.cells, moves: board.moves, movesLeft: board.movesLeft,
    unique: board.unique, delivered: !!board.delivered, sourOn: !!board.sourOn,
    pool: board.pool, collected: board.collected, rngSeed: board.rngSeed || board.seed,
    sourTurns:board.sourTurns||0, reshuffled:!!board.reshuffled,
    rng: board.rng ? {s: board.rng.s} : undefined,
  };
}

function persist(s) {
  if (!alleyPlay || !s) return;
  const book = readBook();
  book.currentChapter=s.level;
  book.sittings[String(s.level)] = {
    houseLeft:s.houseLeft, result:s.result||null, hold:s.hold||0, rewardCommitted:!!s.rewardCommitted,
    phase: s.phase, seed: s.seed, charged: !!s.charged,
    board: boardBlob(s.board), resultN: s.resultN || 0,
    won: !!s.won, note: s.note, reduced: !!s.reduced,
    selected: s.selected,
  };
  writeBook(book);
}

function reducedMotion() {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch { return false; }
}

function revive(blob, level, seed) {
  if (blob && blob.cells) return cloneBoard(blob);
  return makeBoard(level, seed);
}

function ordinaryReward(s){
 if(s.rewardCommitted)return;
 s.rewardCommitted=true;
 const drop=ordinaryFor(s.resultN||resultNumber(s.seed));
 persist(s);
 if(alleyPlay){if(drop==='everyday-penny')credit(1);else keep(drop,'milk-bottles');}
}
function finishWin(s){
 if(s.phase==='result'||!isDelivered(s.board))return;
 const prize=MABEL_CHAPTERS[s.level].prize;
 // Seeing the earned bottle is the eligibility decision. Never roll again on delivery.
 const win=!chapterPaid(s.level);
 s.phase='result';s.charged=false;s.won=win;s.resultN ||= resultNumber(s.seed);
 ordinaryReward(s);
 if(win){
  if(alleyPlay){keep(prize,'milk-bottles');markPaid(s.level);}
  const u=s.board.unique||{c:0,r:s.board.rows-1};
  takePrize(s,prize,cellCenter(s.board,u.c,u.r));
 }
 s.hold=win?1.8:0;
 s.note=win?'The sealed bottle opens in Mabel’s crate.':'This treasure is already in your collection.';
 if(!win)done(s,'Delivery complete',s.note,{won:false,prize:null,settle:true});
 persist(s);
}
function restSitting(s,why){
 if(s.phase!=='play')return;
 s.resultN ||= resultNumber(s.seed);s.charged=false;
 const waiting=!!(s.board&&locateUnique(s.board)&&!s.board.delivered);
 s.phase=waiting?'rest':'result';s.hold=0;
 s.note=why||(waiting?'Moves used. Your bottle stays here. Play buys more moves.':'Moves used. This tray is complete.');
 if(!waiting){ordinaryReward(s);done(s,'Tray complete',s.note,{won:false,prize:null,settle:true});}
 persist(s);
}

function beginPlay(s) {
  if (s.phase === 'play') return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    const waiting = !!(s.board && locateUnique(s.board) && !s.board.delivered);
    if (!s.charged) {
      if (!takeAttempt('milk-bottles', s.level)) {
        s.note = retryNote();
        return;
      }
      s.charged = true;
      s.houseLeft=HOUSE_SECONDS;
      delete s.result;
      if (!waiting) {
        s.seed = (s.seed || (s.level + 1) * 4099) + 1;
        s.board = makeDeliveryBoard(s.level, s.seed,{allowUnique:!chapterPaid(s.level)});
        s.resultN = resultNumber(s.seed);
        s.won = false;s.rewardCommitted=false;
        s.prizeKept = false;
      } else {
        refillMoves(s.board);
      }
    }
    s.phase = 'play';
    s.pointerCell=null;
    s.selected = null;
    s.reduced = reducedMotion();
    const u = locateUnique(s.board);
    s.note = u
      ? 'Match beneath the sealed bottle. Walk it down into the crate.'
      : 'Swap neighbours. Three of a flavour splash.';
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function trySwap(s, a, b) {
  if (s.phase !== 'play' || s.lock || s.result || isSliding(s)) return;
  const before=s.board.cells.map(row=>row.slice());
  const res = applySwap(s.board, a.c, a.r, b.c, b.r);
  if(res.ok||res.reason==='no-match')splashSwap(s,a,b,before,res.ok);
  if (!res.ok) {
    s.note = res.reason === 'no-match' ? 'No splash — the bottles bounce home.' : (s.board.cells[a.r]?.[a.c]?.kind==='unique'||s.board.cells[b.r]?.[b.c]?.kind==='unique'?'The cow matches the flavour it sits on. Swap it into that flavour, or match beneath it.':'Those two will not trade.');
    s.selected = null;
    return;
  }
  s.selected = null;
  s.note = s.board.reshuffled ? 'Mabel reshuffled the bottles. No extra move spent.' : s.board.unique
    ? (s.board.movesLeft + ' moves. Walk the sealed bottle down.')
    : (s.board.movesLeft + ' moves left.');
  if (!isSliding(s)&&s.board.delivered) finishWin(s);
  else if (!isSliding(s)&&s.board.movesLeft <= 0) restSitting(s);
  else persist(s);
}

export default {
  title: 'Milky Splash!',
  chapterNavigation:true,
  selectedChapter(){return Math.max(0,Math.min(5,Number(readBook().currentChapter)||0));},
  live: alleyPlay,
  tables: true,
  chapterEnds: true,
  persist,
  houseSeconds: HOUSE_SECONDS,
  clockRuns:s=>s.phase==='play'&&!isSliding(s),
  onTimeout(s){restSitting(s,'Time is up. Your board is saved. Press Play for another allowance.');},
  retryAttempt(s){this.action(s,'again');},
  retryButton:alleyPlay?'Play again · 1 penny':'Play again',
  playLabel:s=>alleyPlay&&['rest','result'].includes(s.phase)?'Play again · 1 penny':'Play',
  houseTitle: 'The dairy closes',
  houseDetail: 'Mabel covers the crate. Another sitting when you are ready.',
  intro: alleyPlay
    ? 'Mabel’s match-three dairy. Swap neighbouring bottles. A ticket enters the dairy; the first try of each chapter is included. Extra rounds are a penny — one charge, a full move tray. Every board holds the chapter’s treasure until you collect it. Match it down into the crate. The board waits if moves run out.'
    : 'Swap neighbouring bottles. Workshop sittings are free and write nothing. Walk a sealed bottle into the crate when one appears.',
  instructions: alleyPlay
    ? 'Tap two neighbours to swap. Only a real match spends a move. Cascades are free. The gold PRIZE bottle must reach the bottom delivery crate. Match beneath it to make it fall. Wooden crates are obstacles: an adjacent match breaks them; they do not need delivering. Weighted bottles need two adjacent hits. Sour milk spreads every third move, so clear it early.'
    : 'Tap two neighbours. Practice writes nothing.',
  levels: MABEL_CHAPTERS.map(c => c.title),
  sprites: ['dairy-calf', 'lucky-dish', 'alley-collector-cup', 'cocoa-cup', 'crown-hatbox', 'cream-churn', 'moon-penny', 'star-token', 'everyday-penny'],
  prizes: MABEL_CHAPTERS.map(c => c.prize),
  actions: [],
  create(level) {
    preloadMilkProps();
    const saved = alleyPlay ? (readBook().sittings[String(level)] || {}) : {};
    const seed = saved.seed || (level + 1) * 4099;
    const s = {
      level, t: 0, houseLeft:saved.houseLeft, phase: saved.phase || 'idle', seed,
      board: saved.board ? revive(saved.board, level, seed) : null,
      charged: !!saved.charged, resultN: saved.resultN || 0,
      won: !!saved.won && !!saved.board?.delivered, hold:saved.hold||0, result:saved.result||null, rewardCommitted:saved.rewardCommitted??(saved.phase==='result'), reduced: !!saved.reduced,
      selected: saved.selected || null, lock: false,
      note: saved.note || (MABEL_CHAPTERS[level] || MABEL_CHAPTERS[0]).title + '. Tap the board when you are ready.',
    };
    if ((s.phase === 'play' || s.phase === 'rest') && !s.board) s.board = makeDeliveryBoard(level, s.seed,{allowUnique:!chapterPaid(level)});
    // Honour an in-progress paid/included legacy board without buying another allowance.
    if(alleyPlay&&s.charged&&s.phase==='play'&&!prizeAttempts('milk-bottles',level))recordPrizeAttempt('milk-bottles',level);
    if(s.board&&!s.board.delivered){
      if(alleyPlay&&!chapterPaid(level)&&!locateUnique(s.board)){
        spawnUnique(s.board);
        // A completed empty legacy tray never offered its prize. Restore one
        // allowance without charging or paying its ordinary reward twice.
        if(s.phase==='result'||s.phase==='rest'||s.board.movesLeft<=0){
          refillMoves(s.board);s.houseLeft=HOUSE_SECONDS;s.phase='play';s.charged=true;s.hold=0;delete s.result;
          s.note='Your missing treasure is ready. This move allowance is included.';
        }
      }
      repairBoard(s.board);
    }
    if(s.board?.delivered&&!chapterPaid(level)&&s.phase==='result'){s.phase='play';s.won=false;delete s.result;}
    if(s.board?.delivered&&chapterPaid(level)&&s.phase==='play'){s.phase='result';s.won=true;s.charged=false;s.hold=0;}
    if(s.phase==='result'&&!s.result&&s.hold<=0){
      done(s,s.won?'Bonus collected':'Tray complete',s.note,{won:s.won,prize:s.won?this.prizes[level]:null,settle:true});
    }
    bindPrize(s, this.prizes[level] || this.prizes[0], (this.live || this.tables) ? {field: true} : null);
    if (s.won && s.chapterPrize) s.chapterPrize.field = false;
    persist(s);
    return s;
  },
  update(s, dt) {
    s.t += dt;
    if (typeof document !== 'undefined' && document.hidden) return;
    s.saveClock=(s.saveClock||0)+dt;
    if(s.saveClock>=1){s.saveClock=0;persist(s);}
    if (s.phase === 'play' && s.board) {
      if(!isSliding(s)){
        if (s.board.delivered && !s.won) finishWin(s);
        else if(s.board.movesLeft<=0)restSitting(s);
      }
    }
    if (s.won && s.hold > 0 && !s.result) {
      s.hold -= dt;
      if (s.hold <= 0) {
        done(s, 'The crate takes the unique',
          itemName(MABEL_CHAPTERS[s.level].prize) + ' — sealed bottle delivered.',
          {prize: MABEL_CHAPTERS[s.level].prize, won: true, settle:true});
        persist(s);
      }
    } else if (s.phase === 'result' && !s.won && s.hold > 0) s.hold -= dt;
  },
  pointer(s, type, p) {
    if(type==='cancel'){s.pointerCell=null;s.selected=null;return;}
    if (s.result || isSliding(s)) return;
    if (s.phase === 'rest' || s.phase === 'result') {
      s.note=alleyPlay?'Press Play for another move allowance · 1 penny.':'Press Play for another move allowance.';return;
    }
    if (s.phase === 'idle') {
      if (type === 'down') beginPlay(s);
      return;
    }
    if (s.phase !== 'play' || !s.board) return;
    if (type === 'down') {
      const cell = cellFromPoint(s.board, p);
      if (!cell) return;
      if (s.selected && (s.selected.c !== cell.c || s.selected.r !== cell.r)) {
        trySwap(s, s.selected, cell);
        return;
      }
      s.selected = cell;
      s.pointerCell = cell;
      return;
    }
    if (type === 'up' && s.pointerCell) {
      const cell = cellFromPoint(s.board, p);
      if (cell && (cell.c !== s.pointerCell.c || cell.r !== s.pointerCell.r)) trySwap(s, s.pointerCell, cell);
      s.pointerCell = null;
    }
    if (type === 'cancel') s.pointerCell = null;
  },
  action(s, id) {
    if (id === 'play' || id === 'again') {
      if (s.phase === 'result') {
        s.phase='idle';delete s.result;s.hold=0;
        if(!(s.board&&locateUnique(s.board)&&!s.board.delivered))s.board=null;
      }
      beginPlay(s);
    }
  },
  key(s, k, down) {
    if (!down) return;
    if (k === ' ' || k === 'Enter') this.action(s, 'play');
  },
  draw(s,d){paintMilkProps(d);drawMilkySplash(s,d,MABEL_CHAPTERS[s.level]);},
  readout: s => {
    const n = alleyPlay ? pocket() : null;
    const purse = n == null ? 'practice' : n + (n === 1 ? ' penny' : ' pennies');
    const moves = s.board ? s.board.movesLeft + ' moves' : 'idle';
    const u = chapterPaid(s.level) ? 'bonus collected' : s.board && locateUnique(s.board) ? (s.board.delivered ? 'delivered' : 'gold treasure on board') : 'treasure ready when you play';
    return purse + ' · ' + moves + ' · ' + u + ' · ' + s.note;
  },
};
