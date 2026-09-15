import assert from 'node:assert/strict';
import * as g from './milky-splash.js';
const uniqueCount=b=>g.countKind(b,'unique');
const stable=b=>{assert.equal(g.findMatches(b).length,0,'no unresolved matches');assert(g.legalMoves(b).length,'legal swap available');assert(b.cells.every(row=>row.every(Boolean)),'all active segments refill');assert(uniqueCount(b)<=1);};
for(let level=0;level<6;level++){
 let wins=0,seed=(level+1)*4099;
 for(let i=0;i<100;i++)if(g.isMabelWin(level,g.resultNumber(++seed)))wins++;
 assert.equal(wins,[50,40,30,25,20,15][level]);
 for(let n=0;n<20;n++){
  let b=g.makeBoard(level,seed+n);stable(b);const hasPrize=uniqueCount(b);
  for(let turn=0;turn<8&&!b.delivered;turn++){
   const move=g.legalMoves(b)[turn%g.legalMoves(b).length],copy=g.cloneBoard(b),left=b.movesLeft;
   const args=[move.c1,move.r1,move.c2,move.r2];
   assert(g.applySwap(b,...args).ok);assert(g.applySwap(copy,...args).ok);
   assert.deepEqual(JSON.parse(JSON.stringify(b)),JSON.parse(JSON.stringify(copy)),'save/restore yields same cascade');
   assert.equal(b.movesLeft,left-1);assert.equal(uniqueCount(b),hasPrize,'treasure cannot vanish');stable(b);
  }
 }
}
const flavours=g.FLAVOURS.map(f=>f.id);
function fixture(cols=5,rows=6){const b=g.makeBoard(0,4141,{allowUnique:false});b.cols=cols;b.rows=rows;b.cells=Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,c)=>({kind:'milk',flavour:flavours[(r*2+c)%4]})));b.movesLeft=24;b.delivered=false;b.unique=null;return b;}
let b=fixture();b.cells[1][2]={kind:'unique'};b.cells[2][0]={kind:'milk',flavour:'strawberry'};b.cells[2][1]={kind:'milk',flavour:'strawberry'};b.cells[2][2]={kind:'milk',flavour:'chocolate'};b.cells[2][3]={kind:'milk',flavour:'strawberry'};
assert(g.applySwap(b,2,2,3,2).ok);assert(g.locateUnique(b).r>1,'cow falls through a cleared match below it');
b=fixture();b.cells[1][2]={kind:'unique'};b.cells[1][0]=b.cells[1][1]={kind:'milk',flavour:'strawberry'};b.cells[2][2]={kind:'milk',flavour:'strawberry'};
assert(g.legalMoves(b).some(m=>m.c1===2&&m.r1===1&&m.c2===2&&m.r2===2),'matching cow swap is offered');
assert(g.applySwap(b,2,1,2,2).ok);assert(g.locateUnique(b).r>=2,'cow can participate in a valid swap');
b=fixture(5,1);for(let c=0;c<4;c++)b.cells[0][c]={kind:'milk',flavour:'strawberry'};b.cells[0][4]={kind:'milk',flavour:'chocolate'};b.pool=['chocolate','vanilla','banana'];let fill=0;b.roll=()=>((fill++)%3)/3;g.resolveBoard(b);assert(b.cells.flat().some(c=>c.kind==='special'&&c.special==='shaken'),'new four-match special survives creation');
b=fixture(6,1);for(let c=0;c<6;c++)b.cells[0][c]={kind:'milk',flavour:c<3?'strawberry':'chocolate'};b.pool=['chocolate','vanilla','banana'];fill=0;b.roll=()=>((fill++)%3)/3;g.resolveBoard(b);assert.equal(g.countKind(b,'special'),0,'separate triples do not become a five-match special');
b=fixture();b.cells[1][2]={kind:'unique'};b.cells[4][2]={kind:'special',flavour:'chocolate',special:'shaken',axis:'col'};b.cells[4][3]={kind:'special',flavour:'vanilla',special:'fizzy'};assert(g.applySwap(b,2,4,3,4).ok);assert.equal(uniqueCount(b),1,'special combo protects cow');
b=fixture();b.cells[1][1]={kind:'special',special:'cream',flavour:'strawberry'};assert(g.applySwap(b,1,1,2,1).ok,'cream activates with a flavour without needing three');
b=fixture();const before=JSON.stringify(b);const bad=g.applySwap(b,0,0,4,5);assert(!bad.ok);assert.equal(JSON.stringify(b),before);
b.movesLeft=0;assert.equal(g.applySwap(b,0,0,1,0).reason,'finished');
b=fixture();b.cells[0][2]={kind:'unique'};for(let r=1;r<b.rows;r++)for(let c=0;c<b.cols;c++)b.cells[r][c]={kind:'sour',hp:1};g.repairBoard(b);stable(b);assert.deepEqual(g.locateUnique(b),{c:2,r:0},'dead-board recovery preserves cow position');
console.log('PASS: 120 six-chapter boards and cascades; nominal prize coverage; deterministic restore; cow gravity/swaps; surviving specials, combos, invalid/exhausted moves, and dead-board recovery.');
// Refill below holes and retain fixed weighted blockers until cleared.
b=fixture();b.cells[2][1]={kind:'hole'};b.cells[3][1]=null;b.cells[4][1]=null;b.cells[1][2]={kind:'unique'};const weight={kind:'weighted',hp:2};b.cells[3][2]=weight;b.cells[4][2]=null;g.settleBoard(b);assert.equal(b.cells[3][2],weight);g.repairBoard(b);assert(b.cells[3][1]&&b.cells[4][1]);assert.equal(b.cells[2][1].kind,'hole');assert.equal(uniqueCount(b),1);
// Sour growth is bounded, even over several allowances.
b=g.makeBoard(5,24603);const limit=9;for(let turn=0;turn<60&&!b.delivered;turn++){if(!b.movesLeft)g.refillMoves(b);const m=g.legalMoves(b)[0];g.applySwap(b,m.c1,m.r1,m.c2,m.r2);assert(g.countKind(b,'sour')<=limit);stable(b);}
console.log('PASS: refilled isolated pockets, anchored weighted bottles and bounded sour growth.');
