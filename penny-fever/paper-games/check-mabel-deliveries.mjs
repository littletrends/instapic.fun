import assert from 'node:assert/strict';
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v))};globalThis.document={hidden:false};globalThis.location={origin:'http://localhost'};
let cash=40,debits=0,credits=0,reject=false,awards=[];const inventory={items:{}};
globalThis.CustomEvent=class{constructor(type,init){this.type=type;this.detail=init?.detail;}};
globalThis.window={location:{search:'?stall=milk-bottles&room=alley'},matchMedia:()=>({matches:false}),parent:{PennyFever:{getState:()=>({demoCoins:cash,paperInventory:inventory}),spendPennies:n=>{if(reject||cash<n)return false;cash-=n;debits++;return true;},addDemoCoins:n=>{credits+=n;cash+=n;return cash;},saveState(){}},PennyFeverInventoryModel:{recordPaperPrize:(s,p)=>{if(inventory.items[p.item])return [];inventory.items[p.item]={qty:1};awards.push(p.item);return [p.item];}},dispatchEvent(){},postMessage(){}}};

const g=await import('./milky-splash.js?v=milk-cow-1');
const {readFile}=await import('node:fs/promises');
const routes=JSON.parse(await readFile(new URL('./mabel-delivery-routes.json',import.meta.url),'utf8'));
for(let level=0;level<6;level++){
 for(let variant=0;variant<routes[level].length;variant++){
  const plan=routes[level][variant];let board=g.makeDeliveryBoard(level,variant);
  assert.equal(board.seed,plan.seed);assert.equal(g.countKind(board,'unique'),1);
  for(let i=0;i<plan.path.length;i++){
   const m=plan.path[i],before=board.movesLeft;
   assert(g.applySwap(board,m.c1,m.r1,m.c2,m.r2).ok,'route must use legal matching swaps');
   assert.equal(board.movesLeft,before-1);assert.equal(g.countKind(board,'unique'),1,'treasure survives every match and blast');
   // Restore the serialized board between every pair of moves.
   board=g.cloneBoard(JSON.parse(JSON.stringify(board)));
  }
  assert(board.delivered);assert.equal(g.locateUnique(board).r,board.rows-1);assert.equal(g.MABEL_CHAPTERS[level].moves-board.movesLeft,plan.moves);
  assert(board.movesLeft>=6,'tested route leaves room for mistakes');
 }
 console.log('Chapter '+(level+1)+': eight delivery routes in '+Math.min(...routes[level].map(r=>r.moves))+'–'+Math.max(...routes[level].map(r=>r.moves))+' moves / '+g.MABEL_CHAPTERS[level].moves+' available.');
}
// A wooden obstacle cannot be swapped or delivered; an adjacent match breaks it.
let b=g.makeDeliveryBoard(1,0),crate;
for(let r=0;r<b.rows;r++)for(let c=0;c<b.cols;c++)if(b.cells[r][c].kind==='crate')crate={r,c};
assert(crate);const before=JSON.stringify(b);assert.equal(g.applySwap(b,crate.c,crate.r,crate.c===0?1:crate.c-1,crate.r).reason,'stuck');assert.equal(JSON.stringify(b),before);
b=g.makeDeliveryBoard(0,0);const obstacle={kind:'crate',hp:1};b.cells[2][2]=obstacle;for(let c=1;c<=3;c++)b.cells[1][c]={kind:'milk',flavour:'strawberry'};g.resolveBoard(b);assert(!b.cells.flat().includes(obstacle));assert.equal(g.countKind(b,'unique'),1);
const e=(await import('./stalls/milk-bottles.js?v=milk-cow-1')).default;
for(let level=0;level<6;level++){
 memory.clear();inventory.items={};cash=20;
 memory.set('pennyFever.firstPrizeAttempts.v1',JSON.stringify({['milk-bottles:'+level]:9}));
 const s=e.create(level);e.action(s,'play');assert(s.board.unique,'uncollected treasure appears even beyond first attempt');
 const plan=routes[level].find(r=>r.seed===s.board.seed);assert(plan);
 for(const m of plan.path)g.applySwap(s.board,m.c1,m.r1,m.c2,m.r2);
 e.update(s,.1);assert(s.won);const awardCount=awards.length;e.persist(s);const back=e.create(level);e.update(back,3);assert.equal(awards.length,awardCount);
 // An old completed empty tray receives the missing treasure and an included allowance.
 memory.clear();inventory.items={};cash=20;
 let old=e.create(level);e.action(old,'play');const u=g.locateUnique(old.board);old.board.cells[u.r][u.c]={kind:'milk',flavour:'vanilla'};old.board.unique=null;old.board.movesLeft=0;old.phase='result';old.charged=false;old.result={won:false};old.rewardCommitted=true;old.houseLeft=0;e.persist(old);
 const paid=debits,returned=credits;old=e.create(level);assert(old.board.unique);assert.equal(old.board.movesLeft,g.MABEL_CHAPTERS[level].moves);assert.equal(old.phase,'play');assert(!old.result);assert.equal(debits,paid);assert.equal(credits,returned);
 old.board.movesLeft=3;old.houseLeft=42;e.persist(old);old=e.create(level);assert.equal(old.board.movesLeft,3);assert.equal(old.houseLeft,42,'return cannot replenish an existing treasure board');
}
console.log('PASS: 48 legal delivery routes, at least six spare moves, exact serialized cascades, crate break rules, later-attempt prizes, delivery awards and legacy empty-board repair without a debit or duplicate reward.');
let cow=g.makeBoard(0,4102,{allowUnique:false});
cow.cells[2][2]={kind:'unique',flavour:'banana'};
cow.cells[2][3]={kind:'milk',flavour:'banana'};
cow.cells[2][4]={kind:'milk',flavour:'banana'};
cow.cells[1][2]={kind:'milk',flavour:'strawberry'};
cow.movesLeft=10;g.locateUnique(cow);
assert.equal(g.applySwap(cow,2,2,2,1).reason,'no-match','cow on banana will not splash into a strawberry');
assert(g.applySwap(cow,2,2,3,2).ok,'cow on banana splashes into a banana line');
assert.equal(g.countKind(cow,'unique'),1);
assert.equal(cow.cells.flat().filter(c=>c?.kind==='unique')[0].flavour,'banana');
console.log('PASS: prize cow keeps the flavour it sits on and matches that colour.');
