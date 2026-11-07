import assert from 'node:assert/strict';
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v))};globalThis.document={hidden:false};globalThis.location={origin:'http://localhost'};
let cash=40,debits=0,credits=0,reject=false,awards=[];const inventory={items:{}};
globalThis.CustomEvent=class{constructor(type,init){this.type=type;this.detail=init?.detail;}};
globalThis.window={location:{search:'?stall=milk-bottles&room=alley'},matchMedia:()=>({matches:false}),parent:{PennyFever:{getState:()=>({demoCoins:cash,paperInventory:inventory}),spendPennies:n=>{if(reject||cash<n)return false;cash-=n;debits++;return true;},addDemoCoins:n=>{credits+=n;cash+=n;return cash;},saveState(){}},PennyFeverInventoryModel:{recordPaperPrize:(s,p)=>{if(inventory.items[p.item])return [];inventory.items[p.item]={qty:1};awards.push(p.item);return [p.item];}},dispatchEvent(){},postMessage(){}}};
const e=(await import('./stalls/milk-bottles.js')).default,g=await import('./milky-splash.js');
let s=e.create(0);assert(!e.clockRuns(s));e.action(s,'play');assert.equal(debits,0,'first chapter allowance included');assert(e.clockRuns(s));assert.equal(s.houseLeft,160);
if(!g.locateUnique(s.board))g.spawnUnique(s.board);
s.houseLeft=54;s.board.movesLeft=7;e.persist(s);let back=e.create(0);assert.deepEqual(JSON.parse(JSON.stringify(back.board)),JSON.parse(JSON.stringify(s.board)));assert.equal(back.houseLeft,54);assert(back.charged);
e.onTimeout(back);assert.equal(back.phase,'rest');e.pointer(back,'down',{x:450,y:400});assert.equal(debits,0,'tapping a finished board must not buy moves');assert(!back.charged);const board=JSON.stringify(back.board.cells),rng=back.board.rng.s,n=back.resultN;
e.action(back,'play');assert.equal(debits,1);assert.equal(JSON.stringify(back.board.cells),board);assert.equal(back.board.rng.s,rng);assert.equal(back.resultN,n);assert.equal(back.board.movesLeft,24);assert.equal(back.houseLeft,160);
e.action(back,'play');assert.equal(debits,1,'repeated Play cannot charge active round');
back.board.movesLeft=0;e.update(back,1);assert.equal(back.phase,'rest');reject=true;e.action(back,'play');assert.equal(back.phase,'rest');assert.equal(debits,1);assert.equal(JSON.stringify(back.board.cells),board);reject=false;
e.action(back,'play');assert.equal(debits,2);
// An existing visible prize is honoured even if its old result number is not eligible.
const u=g.locateUnique(back.board);back.board.cells[u.r][u.c]={kind:'milk',flavour:'vanilla'};back.board.cells[back.board.rows-1][u.c]={kind:'unique'};back.board.unique={c:u.c,r:back.board.rows-1};back.board.delivered=true;back.resultN=100;
e.update(back,1);assert(back.won);assert(awards.includes('dairy-calf'));e.persist(back);const paid=awards.length,returned=credits;
back=e.create(0);e.update(back,3);assert(back.result?.won);assert(back.result.settle);e.persist(back);back=e.create(0);e.update(back,3);assert.equal(awards.length,paid);assert.equal(credits,returned);
e.action(back,'again');assert.equal(debits,3,'single replay click starts one new paid allowance');assert.equal(g.locateUnique(back.board),null,'owned cow does not spawn again');assert(!back.result);assert(!back.won);
back.pointerCell={c:0,r:0};back.selected={c:0,r:0};e.pointer(back,'cancel',{});assert.equal(back.pointerCell,null);assert.equal(back.selected,null);
// Completed ordinary result survives reload without paying out twice or getting stuck.
back.board.movesLeft=0;e.update(back,1);assert.equal(back.phase,'result');assert.equal(back.result.won,false);e.persist(back);const ordinary=credits,keeps=awards.length;
back=e.create(0);e.update(back,1);assert.equal(credits,ordinary);assert.equal(awards.length,keeps);e.action(back,'play');assert.equal(debits,4);assert.equal(back.phase,'play');assert(!back.result);
console.log('PASS: included first allowance, paid continuation, expired timer, exact board/RNG/moves restore, failed debit, visible-cow delivery without reroll, one-time rewards, replay and owned-prize suppression.');
// Repair an older delivered-but-denied prize without charging or repaying ordinary credit.
let legacy=JSON.parse(memory.get('pennyFever.milkySplash'));delete legacy.paid['0'];delete inventory.items['dairy-calf'];
legacy.sittings['0'].board.delivered=true;legacy.sittings['0'].board.cells[5][0]={kind:'unique'};legacy.sittings['0'].board.unique={c:0,r:5};legacy.sittings['0'].phase='result';legacy.sittings['0'].won=false;legacy.sittings['0'].rewardCommitted=true;legacy.sittings['0'].result={won:false};memory.set('pennyFever.milkySplash',JSON.stringify(legacy));
const oldDebit=debits,oldCredit=credits,oldAwards=awards.length;back=e.create(0);e.update(back,.1);assert(back.won);assert.equal(debits,oldDebit);assert.equal(credits,oldCredit);assert.equal(awards.length,oldAwards+1);
console.log('PASS: old delivered-but-denied cow is repaired without another debit or ordinary payout.');
