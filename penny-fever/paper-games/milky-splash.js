import {DELIVERY_LAYOUTS} from './milky-deliveries.js?v=milk-delivery-1';
import {firstPrizeEligible} from './first-prize.js?v=first-prize-1';
/** Isolated Milky Splash: match-three dairy bottles, unique crate delivery, 1–100. */

export const FLAVOURS = [
  {id: 'strawberry', name: 'Strawberry', mark: '♥', cap: 'round', fill: '#d45a78', ink: '#fff0e8'},
  {id: 'chocolate', name: 'Chocolate', mark: '◆', cap: 'square', fill: '#6a3a24', ink: '#f3e0c8'},
  {id: 'vanilla', name: 'Vanilla', mark: '✦', cap: 'scallop', fill: '#f0e2b8', ink: '#6a4a28'},
  {id: 'banana', name: 'Banana', mark: '☽', cap: 'ridge', fill: '#e4c04a', ink: '#4a3818'},
  {id: 'blueberry', name: 'Blueberry', mark: '●', cap: 'dot', fill: '#3a4a98', ink: '#e8e8ff'},
  {id: 'mint', name: 'Mint', mark: '♣', cap: 'leaf', fill: '#3a9a72', ink: '#e8fff4'},
];

export const MABEL_CHAPTERS = [
  {id: 'shift', title: 'Strawberry Shift', cols: 5, rows: 6, moves: 24, flavours: 4, crates: 0, weighted: 0, sour: 0, mixed: false, prize: 'dairy-calf'},
  {id: 'crates', title: 'Chocolate Crates', cols: 6, rows: 7, moves: 22, flavours: 5, crates: 4, weighted: 0, sour: 0, mixed: false, prize: 'lucky-dish'},
  {id: 'delivery', title: 'Vanilla Delivery', cols: 6, rows: 7, moves: 20, flavours: 5, crates: 2, weighted: 0, sour: 0, mixed: false, prize: 'alley-collector-cup'},
  {id: 'carton', title: 'Mixed Carton', cols: 7, rows: 8, moves: 18, flavours: 6, crates: 2, weighted: 4, sour: 0, mixed: true, prize: 'cocoa-cup'},
  {id: 'sour', title: 'Sour Milk', cols: 7, rows: 8, moves: 16, flavours: 6, crates: 2, weighted: 2, sour: 5, mixed: false, prize: 'crown-hatbox'},
  {id: 'midnight', title: 'Midnight Dairy', cols: 8, rows: 9, moves: 14, flavours: 6, crates: 4, weighted: 4, sour: 6, mixed: true, prize: 'cream-churn'},
];

function span(a, b, step = 1) {
  const out = [];
  for (let n = a; n <= b; n += step) out.push(n);
  return out;
}

/** Provisional 50/40/30/25/20/15. Editable. */
export const MABEL_WINS = [
  span(1, 50),
  span(2, 80, 2),
  span(3, 90, 3),
  span(76, 100),
  span(5, 100, 5),
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
];

export function isMabelWin(level, n) {
  if(firstPrizeEligible('milk-bottles',level))return true;
  return (MABEL_WINS[level] || MABEL_WINS[0]).includes(n);
}

export function resultNumber(seed) {
  const raw = Math.abs((Number(seed) || 0) * 17 + 11);
  const n = raw % 100;
  return n === 0 ? 100 : n;
}

export function ordinaryFor(n) {
  if (n % 10 === 0) return 'moon-penny';
  if (n % 2 === 0) return 'star-token';
  return 'everyday-penny';
}

export function flavourOf(id) {
  return FLAVOURS.find(f => f.id === id) || FLAVOURS[0];
}

function rngBox(seed) {
  return {s: (Number(seed) || 1) >>> 0};
}
function rollOf(box) {
  box.s = (Math.imul(box.s, 1664525) + 1013904223) >>> 0;
  return box.s / 4294967296;
}
function shuffle(roll, list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(roll() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function poolIds(ch) {
  return FLAVOURS.slice(0, ch.flavours || 4).map(f => f.id);
}

function milk(flavour, extra) {
  return {kind: 'milk', flavour, ...extra};
}

export function cellAt(board, c, r) {
  if (!board || c < 0 || r < 0 || c >= board.cols || r >= board.rows) return null;
  return board.cells[r][c];
}

function setCell(board, c, r, cell) {
  board.cells[r][c] = cell;
}

function flavourId(cell, countUnique=false) {
  if (!cell) return null;
  if (cell.kind === 'milk' || cell.kind === 'special') return cell.flavour;
  if (countUnique && cell.kind === 'unique') return cell.flavour || 'banana';
  return null;
}

function isHoleCell(ch, c, r) {
  if (!ch.mixed) return false;
  const cols = ch.cols, rows = ch.rows;
  if ((r === 1 || r === 2) && (c === 0 || c === cols - 1)) return true;
  if (r === Math.floor(rows / 2) && (c === 1 || c === cols - 2)) return true;
  if (ch.id === 'midnight' && r === 3 && c % 3 === 2) return true;
  return false;
}

export function layoutOf(board) {
  const cols = board?.cols || 5, rows = board?.rows || 6;
  const size = Math.min(120, Math.floor(700 / cols), Math.floor(760 / rows));
  const originX = (900 - cols * size) / 2;
  const originY = 210;
  return {size, originX, originY, crateY: originY + rows * size + 8};
}

export function cellCenter(board, c, r) {
  const {size, originX, originY} = layoutOf(board);
  return {x: originX + (c + 0.5) * size, y: originY + (r + 0.5) * size};
}

export function cellFromPoint(board, p) {
  const {size, originX, originY} = layoutOf(board);
  const c = Math.floor((p.x - originX) / size);
  const r = Math.floor((p.y - originY) / size);
  if (c < 0 || r < 0 || c >= board.cols || r >= board.rows) return null;
  return {c, r};
}

export function findMatches(board, countUnique=false) {
  const hits = [];
  const seen = new Set();
  const mark = (c, r) => {
    const key = r + ',' + c;
    if (seen.has(key)) return;
    seen.add(key);
    hits.push({c, r});
  };
  const flav = (c, r) => flavourId(cellAt(board, c, r), countUnique);
  for (let r = 0; r < board.rows; r++) {
    let run = 1;
    for (let c = 1; c <= board.cols; c++) {
      const same = c < board.cols && flav(c, r) && flav(c, r) === flav(c - 1, r);
      if (same) run++;
      else {
        if (run >= 3) for (let k = 0; k < run; k++) mark(c - 1 - k, r);
        run = 1;
      }
    }
  }
  for (let c = 0; c < board.cols; c++) {
    let run = 1;
    for (let r = 1; r <= board.rows; r++) {
      const same = r < board.rows && flav(c, r) && flav(c, r) === flav(c, r - 1);
      if (same) run++;
      else {
        if (run >= 3) for (let k = 0; k < run; k++) mark(c, r - 1 - k);
        run = 1;
      }
    }
  }
  return hits;
}

function adjacent(c1, r1, c2, r2) {
  return Math.abs(c1 - c2) + Math.abs(r1 - r2) === 1;
}

function swappable(cell) {
  return !!(cell && (cell.kind === 'milk' || cell.kind === 'special' || cell.kind === 'unique'));
}

function specialSwap(a,b){
 return !!(a&&b&&((a.kind==='special'&&a.special==='cream'&&flavourId(b))||(b.kind==='special'&&b.special==='cream'&&flavourId(a))||(a.kind==='special'&&b.kind==='special')));
}
function swapMatches(board,c1,r1,c2,r2){
 if(findMatches(board).some(h=>(h.c===c1&&h.r===r1)||(h.c===c2&&h.r===r2))) return true;
 const a=cellAt(board,c1,r1), b=cellAt(board,c2,r2);
 const unique=a?.kind==='unique'?a:b?.kind==='unique'?b:null;
 const other=unique===a?b:a;
 if(!unique||!other) return false;
 const flav=unique.flavour||'banana';
 if(flavourId(other)!==flav) return false;
 return findMatches(board,true).some(h=>(h.c===c1&&h.r===r1)||(h.c===c2&&h.r===r2));
}
export function legalMoves(board) {
 const moves=[];
 for(let r=0;r<board.rows;r++)for(let c=0;c<board.cols;c++)for(const [dc,dr] of [[1,0],[0,1]]){
  const c2=c+dc,r2=r+dr,a=cellAt(board,c,r),b=cellAt(board,c2,r2);
  if(!swappable(a)||!swappable(b))continue;
  setCell(board,c,r,b);setCell(board,c2,r2,a);
  const ok=specialSwap(a,b)||swapMatches(board,c,r,c2,r2);
  setCell(board,c,r,a);setCell(board,c2,r2,b);
  if(ok)moves.push({c1:c,r1:r,c2,r2});
 }
 return moves;
}

export function locateUnique(board) {
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (board.cells[r][c]?.kind === 'unique') {
        if (!board.cells[r][c].flavour) board.cells[r][c].flavour = 'banana';
        board.unique = {c, r};
        return board.unique;
      }
    }
  }
  board.unique = null;
  return null;
}

export function isDelivered(board) {
  if (!board) return false;
  if (board.delivered) return true;
  const u = locateUnique(board);
  return !!(u && u.r >= board.rows - 1);
}

export function openColumns(board) {
  const cols = [];
  for (let c = 0; c < board.cols; c++) {
    let blocked = false;
    for (let r = 0; r < board.rows; r++) {
      if (board.cells[r][c]?.kind === 'hole') { blocked = true; break; }
    }
    if (!blocked) cols.push(c);
  }
  return cols.length ? cols : [Math.floor(board.cols / 2)];
}

export function spawnUnique(board, col) {
  if (!board || locateUnique(board)) return board;
  const cols = openColumns(board);
  const c = cols.includes(col) ? col : cols[0];
  for (let r = 0; r < board.rows - 1; r++) {
    const cell = cellAt(board, c, r);
    if (cell && (cell.kind === 'milk' || cell.kind === 'special')) {
      setCell(board, c, r, {kind: 'unique', flavour: cell.flavour || 'banana'});
      board.unique = {c, r};
      return board;
    }
  }
  setCell(board, c, 0, {kind: 'unique', flavour: 'banana'});
  board.unique = {c, r: 0};
  return board;
}

function anchored(cell){return !!cell&&['hole','crate','weighted','sour'].includes(cell.kind);}
function fallSegments(board,c){
 const segments=[];let start=0;
 for(let r=0;r<=board.rows;r++)if(r===board.rows||anchored(cellAt(board,c,r))){
  if(r>start)segments.push([start,r-1]);start=r+1;
 }
 return segments;
}
function gravity(board) {
 for(let c=0;c<board.cols;c++)for(const [a,b] of fallSegments(board,c)){
  const kept=[];
  for(let r=a;r<=b;r++){if(board.cells[r][c])kept.push(board.cells[r][c]);board.cells[r][c]=null;}
  let r=b;for(let i=kept.length-1;i>=0;i--,r--)board.cells[r][c]=kept[i];
 }
}
export function settleBoard(board){gravity(board);locateUnique(board);if(isDelivered(board))board.delivered=true;return board;}
function refill(board){
 for(let c=0;c<board.cols;c++)for(const [a,b] of fallSegments(board,c))for(let r=a;r<=b;r++)
  if(!board.cells[r][c])board.cells[r][c]=milk(board.pool[Math.floor(board.roll()*board.pool.length)]);
}

function damageAround(board, hits) {
  const near = new Set();
  for (const h of hits) {
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = h.c + dc, r = h.r + dr;
      const cell = cellAt(board, c, r);
      if (!cell) continue;
      if (cell.kind === 'crate' || cell.kind === 'weighted' || cell.kind === 'sour') near.add(r + ',' + c);
    }
  }
  for (const key of near) {
    const [r, c] = key.split(',').map(Number);
    const cell = cellAt(board, c, r);
    if (!cell) continue;
    cell.hp = (cell.hp || 1) - 1;
    if (cell.hp <= 0) setCell(board, c, r, null);
  }
}

function activateSpecials(board,hits){
 const affected=new Map(hits.map(h=>[h.r+','+h.c,h]));const queue=hits.slice(),seen=new Set();
 const add=(c,r)=>{const cell=cellAt(board,c,r);if(!cell||cell.kind==='unique'||cell.kind==='hole')return;const key=r+','+c;if(!affected.has(key)){const h={c,r};affected.set(key,h);queue.push(h);}};
 while(queue.length){
  const h=queue.shift(),cell=cellAt(board,h.c,h.r),key=h.r+','+h.c;
  if(cell?.kind!=='special'||seen.has(key))continue;seen.add(key);
  if(cell.special==='shaken'){
   if(cell.axis==='col')for(let r=0;r<board.rows;r++)add(h.c,r);
   else for(let c=0;c<board.cols;c++)add(c,h.r);
  }else if(cell.special==='fizzy'){
   for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)add(h.c+dc,h.r+dr);
  }else if(cell.special==='cream'){
   for(let r=0;r<board.rows;r++)for(let c=0;c<board.cols;c++)if(flavourId(cellAt(board,c,r))===cell.flavour)add(c,r);
  }
 }
 return [...affected.values()];
}
function promotions(board,hits){
 const remaining=new Map(hits.map(h=>[h.r+','+h.c,h])),out=[];
 while(remaining.size){
  const first=remaining.values().next().value,flavour=flavourId(cellAt(board,first.c,first.r)),group=[],queue=[first];remaining.delete(first.r+','+first.c);
  while(queue.length){const h=queue.shift();group.push(h);for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const key=(h.r+dr)+','+(h.c+dc),other=remaining.get(key);
   if(other&&flavourId(cellAt(board,other.c,other.r))===flavour){remaining.delete(key);queue.push(other);}
  }}
  let row=0,col=0;for(const h of group){let n=1;while(group.some(p=>p.r===h.r&&p.c===h.c+n))n++;row=Math.max(row,n);n=1;while(group.some(p=>p.c===h.c&&p.r===h.r+n))n++;col=Math.max(col,n);}
  let special=null,axis;
  if(row>=5||col>=5)special='cream';else if(row>=3&&col>=3)special='fizzy';else if(row>=4||col>=4){special='shaken';axis=row>=4?'row':'col';}
  if(special){const pick=group.find(h=>cellAt(board,h.c,h.r)?.kind==='milk');if(pick)out.push({...pick,cell:{kind:'special',flavour,special,...(axis?{axis}:{})}});}
 }
 return out;
}

function collectHits(board, hits) {
  for (const h of hits) {
    const cell = cellAt(board, h.c, h.r);
    if (!cell || cell.kind === 'unique' || cell.kind === 'hole') continue;
    if (cell.flavour) {
      board.collected[cell.flavour] = (board.collected[cell.flavour] || 0) + 1;
    }
    setCell(board, h.c, h.r, null);
  }
}

export function resolveBoard(board){
 let guard=0;
 while(guard++<36){
  const hits=findMatches(board);if(!hits.length)break;
  const created=promotions(board,hits),affected=activateSpecials(board,hits);
  damageAround(board,affected);collectHits(board,affected);
  // New specials survive this match; only pre-existing specials activate.
  for(const p of created)setCell(board,p.c,p.r,p.cell);
  gravity(board);refill(board);locateUnique(board);
 }
 if(findMatches(board).length)ensureMoves(board);
 if(isDelivered(board))board.delivered=true;
 return board;
}
function spreadSour(board){
 if(!board.sourOn)return;
 board.sourTurns=(board.sourTurns||0)+1;
 if(board.sourTurns%3)return;
 const cap=(MABEL_CHAPTERS[board.level]?.sour||0)+3;
 if(countKind(board,'sour')>=cap)return;
 const targets=[];
 for(let r=0;r<board.rows;r++)for(let c=0;c<board.cols;c++)if(cellAt(board,c,r)?.kind==='sour')
  for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]])if(cellAt(board,c+dc,r+dr)?.kind==='milk')targets.push({c:c+dc,r:r+dr});
 if(targets.length){const p=targets[Math.floor(board.roll()*targets.length)];setCell(board,p.c,p.r,{kind:'sour',hp:1});}
}

export function reshuffle(board) {
  const milks = [];
  const spots = [];
  for (let r = 0; r < board.rows; r++) for (let c = 0; c < board.cols; c++) {
    const cell = board.cells[r][c];
    if (cell && (cell.kind === 'milk' || cell.kind === 'special')) {
      milks.push(cell);
      spots.push({c, r});
    }
  }
  const mixed = shuffle(board.roll, milks);
  spots.forEach((p, i) => setCell(board, p.c, p.r, mixed[i]));
  locateUnique(board);
  return board;
}

function ensureMoves(board){
 if(!findMatches(board).length&&legalMoves(board).length)return board;
 // Shuffle only ordinary/special bottles: obstacles and earned treasure stay put.
 for(let i=0;i<48;i++){reshuffle(board);if(!findMatches(board).length&&legalMoves(board).length){board.reshuffled=true;return board;}}
 // Dense old sour saves can have no usable patch. Open the smallest 2x3 patch
 // without touching a hole or treasure, then plant a deterministic legal swap.
 const patches=[];
 for(const [w,h] of [[3,2],[2,3]])for(let r=0;r<=board.rows-h;r++)for(let c=0;c<=board.cols-w;c++){
  const slots=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++)slots.push({c:c+x,r:r+y});
  if(slots.some(p=>['hole','unique'].includes(cellAt(board,p.c,p.r)?.kind)))continue;
  patches.push({w,h,c,r,slots,cost:slots.filter(p=>anchored(cellAt(board,p.c,p.r))).length});
 }
 patches.sort((a,b)=>a.cost-b.cost);const patch=patches[0];
 if(!patch)throw Error('This saved board has no playable dairy space.');
 for(const p of patch.slots)if(anchored(cellAt(board,p.c,p.r)))setCell(board,p.c,p.r,milk(board.pool[0]));
 for(let attempt=0;attempt<100;attempt++){
  for(let r=0;r<board.rows;r++)for(let c=0;c<board.cols;c++){
   const cell=cellAt(board,c,r);if(!flavourId(cell))continue;
   const choices=board.pool.filter(f=>!(flavourId(cellAt(board,c-1,r))===f&&flavourId(cellAt(board,c-2,r))===f)&&!(flavourId(cellAt(board,c,r-1))===f&&flavourId(cellAt(board,c,r-2))===f));
   cell.flavour=choices[Math.floor(board.roll()*choices.length)];
  }
  const [a,b,c]=shuffle(board.roll,board.pool),pattern=[[a,b,a],[b,a,c]];
  for(let y=0;y<2;y++)for(let x=0;x<3;x++){
   const col=patch.c+(patch.w===3?x:y),row=patch.r+(patch.w===3?y:x);
   cellAt(board,col,row).flavour=pattern[y][x];
  }
  if(!findMatches(board).length&&legalMoves(board).length){board.reshuffled=true;locateUnique(board);return board;}
 }
 throw Error('The dairy could not arrange a legal swap.');
}
export function repairBoard(board){refill(board);ensureMoves(board);locateUnique(board);return board;}
export function applySwap(board,c1,r1,c2,r2){
 if(!board||!adjacent(c1,r1,c2,r2))return {ok:false,reason:'apart'};
 if(board.movesLeft<=0||board.delivered)return {ok:false,reason:'finished'};
 const a=cellAt(board,c1,r1),b=cellAt(board,c2,r2);
 if(!swappable(a)||!swappable(b))return {ok:false,reason:'stuck'};
 setCell(board,c1,r1,b);setCell(board,c2,r2,a);
 const combo=specialSwap(a,b);
 if(!combo&&!swapMatches(board,c1,r1,c2,r2)){setCell(board,c1,r1,a);setCell(board,c2,r2,b);return {ok:false,reason:'no-match'};}
 board.reshuffled=false;
 board.movesLeft--;
 if(combo){
  // Cream takes the partner's flavour; this is part of the committed swap.
  if(a.special==='cream'&&flavourId(b))a.flavour=b.flavour;
  if(b.special==='cream'&&flavourId(a))b.flavour=a.flavour;
  const bothCream=a.special==='cream'&&b.special==='cream';
  const triggers=bothCream?board.cells.flatMap((row,r)=>row.map((cell,c)=>({cell,c,r})).filter(p=>p.cell&&p.cell.kind!=='unique'&&p.cell.kind!=='hole').map(({c,r})=>({c,r}))):[{c:c1,r:r1},{c:c2,r:r2}];
  const hits=activateSpecials(board,triggers);damageAround(board,hits);collectHits(board,hits);gravity(board);refill(board);
 }
 resolveBoard(board);spreadSour(board);ensureMoves(board);locateUnique(board);
 if(isDelivered(board))board.delivered=true;
 return {ok:true,delivered:!!board.delivered,movesLeft:board.movesLeft};
}

export function refillMoves(board) {
  const ch = MABEL_CHAPTERS[board.level] || MABEL_CHAPTERS[0];
  board.movesLeft = ch.moves;
  return board;
}

function placeObstacles(board, ch, roll) {
  const spots = [];
  for (let r = 1; r < board.rows - 2; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (board.cells[r][c]?.kind === 'milk') spots.push({c, r});
    }
  }
  const mixed = shuffle(roll, spots);
  let i = 0;
  for (let n = 0; n < ch.crates; n++, i++) {
    const p = mixed[i];
    if (p) setCell(board, p.c, p.r, {kind: 'crate', hp: 1});
  }
  for (let n = 0; n < ch.weighted; n++, i++) {
    const p = mixed[i];
    if (p) setCell(board, p.c, p.r, {kind: 'weighted', hp: 2});
  }
  for (let n = 0; n < ch.sour; n++, i++) {
    const p = mixed[i];
    if (p) setCell(board, p.c, p.r, {kind: 'sour', hp: 1});
  }
}

export function makeBoard(level, seed, {allowUnique=true}={}) {
  const ch = MABEL_CHAPTERS[level] || MABEL_CHAPTERS[0];
  const rng = rngBox(seed);
  const roll = () => rollOf(rng);
  const ids = poolIds(ch);
  const cells = [];
  for (let r = 0; r < ch.rows; r++) {
    const row = [];
    for (let c = 0; c < ch.cols; c++) {
      if (isHoleCell(ch, c, r)) { row.push({kind: 'hole'}); continue; }
      let flav = ids[Math.floor(roll() * ids.length)];
      let guard = 0;
      while (guard++ < 12) {
        const left2 = c >= 2 && flavourId(row[c - 1]) === flav && flavourId(row[c - 2]) === flav;
        const up2 = r >= 2 && flavourId(cells[r - 1][c]) === flav && flavourId(cells[r - 2][c]) === flav;
        if (!left2 && !up2) break;
        flav = ids[Math.floor(roll() * ids.length)];
      }
      row.push(milk(flav));
    }
    cells.push(row);
  }
  const board = {
    level, seed, cols: ch.cols, rows: ch.rows, cells,
    moves: ch.moves, movesLeft: ch.moves,
    unique: null, delivered: false, sourOn: ch.sour > 0, sourTurns:0, reshuffled:false,
    pool: ids, collected: {},
    rngSeed: seed, rng,
  };
  board.roll = () => rollOf(board.rng);
  placeObstacles(board, ch, roll);
  if (findMatches(board).length) resolveBoard(board);
  if (allowUnique && isMabelWin(level, resultNumber(seed))) spawnUnique(board);
  ensureMoves(board);
  locateUnique(board);
  return board;
}

export function cloneBoard(board) {
  const cells = board.cells.map(row => row.map(cell => cell ? {...cell} : null));
  const next = {
    ...board,
    cells,
    unique: board.unique ? {...board.unique} : null,
    collected: {...(board.collected || {})},
    pool: (board.pool || []).slice(),
    rng: {s: (board.rng && board.rng.s != null) ? board.rng.s : (Number(board.rngSeed || board.seed) || 1) >>> 0},
  };
  next.roll = () => rollOf(next.rng);
  return next;
}

export function countKind(board, kind) {
  let n = 0;
  for (const row of board.cells) for (const cell of row) if (cell?.kind === kind) n++;
  return n;
}

/** Start with a visible unowned treasure on a layout with a tested delivery route.
 * No solver runs on the player's device. Ordinary replays retain random layouts.
 */
export function makeDeliveryBoard(level, seed, {allowUnique=true}={}) {
 if(!allowUnique)return makeBoard(level,seed,{allowUnique:false});
 const layouts=DELIVERY_LAYOUTS[level]||DELIVERY_LAYOUTS[0];
 const plan=layouts[Math.abs(Math.trunc(Number(seed)||0))%layouts.length];
 const board=makeBoard(level,plan.seed,{allowUnique:false});
 spawnUnique(board,plan.col);
 repairBoard(board);
 return board;
}
