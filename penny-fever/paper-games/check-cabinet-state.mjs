import assert from 'node:assert/strict';
const mem=new Map();globalThis.localStorage={getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k)};
globalThis.document={hidden:false};globalThis.location={origin:'http://localhost'};
let cash=24,debits=[],credits=[],awards=[],reject=false;const inventory={items:{}};
globalThis.CustomEvent=class {constructor(type,init){this.type=type;this.detail=init?.detail}};
globalThis.window={location:{search:'?stall=coin-pusher&room=alley'},parent:{PennyFever:{getState:()=>({demoCoins:cash,paperInventory:inventory}),spendPennies:n=>{if(reject||cash<n)return false;cash-=n;debits.push(n);return true},addDemoCoins:n=>{cash+=n;credits.push(n);return cash},saveState(){}},PennyFeverInventoryModel:{recordPaperPrize:(s,p)=>{if(inventory.items[p.item])return [];inventory.items[p.item]={qty:1};awards.push(p.item);return [p.item]}},dispatchEvent(){}}};
const base=new URL('./',import.meta.url).href;
const copper=(await import(base+'stalls/coin-pusher.js')).default;
const iris=(await import(base+'stalls/fortune.js')).default;
const key='pennyFever.copperFalls.v6';
let s=copper.create(0);assert(s.practice);copper.drop(s,1);assert.equal(debits.length,0);
for(let i=0;i<2000&&s.practice;i++)copper.update(s,1/60);
assert(!s.practice,'practice completes');assert.equal(credits.length,0);assert.equal(awards.length,0);
cash=24;copper.pointer(s,'down',{x:300,y:970});assert.equal(debits.at(-1),6);assert.equal(s.tray.paidCount,6);assert(s.tray.treasureOn);
copper.update(s,.02);copper.persist(s);const snap=JSON.stringify(s.tray.coins);let resumed=copper.create(0);assert.deepEqual(resumed.tray.coins,JSON.parse(snap));assert.equal(resumed.phase,s.phase);assert.equal(resumed.cycle,s.cycle);assert.equal(resumed.busy,true);assert(resumed.tray.coins.every(c=>Number.isFinite(c.vx)&&Number.isFinite(c.vy)));
const count=debits.length;copper.drop(resumed,1);assert.equal(debits.length,count,'resume cannot recharge active drop');
resumed.phase='push';resumed.cycle=.3;resumed.tray.coins=[{id:'paid',kind:'penny',x:450,y:800,vx:0,vy:90,r:13,falling:true},{id:'treasure',kind:'treasure',x:450,y:800,vx:0,vy:90,r:24,falling:true}];
copper.update(resumed,.01);assert.equal(credits.at(-1),1);assert(awards.includes('coin-sleeve'));copper.persist(resumed);let again=copper.create(0);const a=awards.length,c=credits.length;copper.update(again,.02);assert.equal(awards.length,a);assert.equal(credits.length,c);
for(let level=1;level<6;level++){s=copper.create(level);cash=40;const d=debits.length;copper.pointer(s,'down',{x:500,y:970});assert.equal(debits[d],20);copper.persist(s);assert.equal(copper.selectedChapter(),level);assert.equal(copper.create(level).tray.paidCount,20);}
cash=0;s=copper.create(5);assert.equal(cash,0,'live empty purse not refilled');s.phase='idle';s.busy=false;const n=s.tray.coins.length;copper.drop(s,1);assert.equal(s.tray.coins.length,n);
cash=10;reject=true;copper.drop(s,1);assert.equal(s.tray.coins.length,n,'failed debit does not mint coins');reject=false;
let f=iris.create(0);const d=debits.length;iris.action(f,'gaze');assert(f.practice);assert.equal(debits.length,d);iris.persist(f);let rf=iris.create(0);assert.equal(rf.phase,f.phase);assert.equal(rf.charged,true);assert.equal(JSON.stringify(rf.globe),JSON.stringify(f.globe));
console.log('PASS: Copper free practice, quarter/half purse drops, six trays, exact paid-motion resume, one credit/prize payout, no automatic live refill, failed debit; Iris save retained.');

const {makeGlobe}=await import('./fortune-globe.js?v=fortune-polish-1');
assert(new Set(Array.from({length:12},(_,i)=>makeGlobe(0,4100+i).flash[0])).size>3,'adjacent gazes vary their remembered sign');
const irisSnapshots=[];
for(let level=0;level<6;level++){
  const q=iris.create(level);cash=40;
  if(q.phase==='idle')iris.pointer(q,'down',{x:450,y:428});
  iris.update(q,3);iris.persist(q);
  const restored=iris.create(level);
  assert.deepEqual(restored.globe,q.globe);assert.equal(restored.clock,q.clock);assert.equal(restored.phase,q.phase);
  assert.equal(restored.globe.rings.length,[1,2,2,2,2,3][level]);
  assert(restored.globe.rings.every(r=>r.n===8),'eight slots retained');
  irisSnapshots.push(JSON.stringify(q.globe));
}
for(let level=0;level<6;level++)assert.equal(JSON.stringify(iris.create(level).globe),irisSnapshots[level]);
const finished=iris.create(5);while(finished.phase==='spin')iris.pointer(finished,'down',{x:450,y:428});
iris.persist(finished);const savedResult=iris.create(5);assert.equal(savedResult.fortune,finished.fortune);assert.equal(savedResult.note,finished.note);assert.equal(savedResult.practice,finished.practice);
const idle=iris.create(4);idle.phase='idle';idle.charged=false;const beforeDebit=debits.length;iris.pointer(idle,'down',{x:40,y:1084});assert.equal(idle.phase,'idle');assert.equal(debits.length,beforeDebit,'removed lower controls cannot charge');
console.log('PASS: six Iris chapter snapshots, centre-only input, varied signs, eight-slot rules and reading persistence.');

let lower=iris.create(0);lower.phase='idle';lower.charged=false;cash=20;
let charged=debits.length;iris.pointer(lower,'down',{x:450,y:1084});assert.equal(lower.phase,'flash');assert.equal(debits.length,charged+1);
iris.pointer(lower,'down',{x:450,y:428});assert.equal(debits.length,charged+1,'second control cannot double-charge');
iris.update(lower,3);iris.pointer(lower,'down',{x:450,y:1084});assert.equal(lower.phase,'result');
lower.caught=false;charged=debits.length;iris.pointer(lower,'down',{x:450,y:954});assert.equal(lower.phase,'flash');assert.equal(debits.length,charged+1,'Try again costs one normal gaze');
lower.phase='result';lower.fortune='A test reading.';lower.caught=true;lower.requestNext=false;charged=debits.length;iris.pointer(lower,'down',{x:450,y:954});assert(lower.requestNext);assert.equal(debits.length,charged,'Next chapter does not buy a gaze');
lower.level=5;lower.requestNext=false;iris.pointer(lower,'down',{x:450,y:954});assert(!lower.requestNext,'last chapter cannot advance');
console.log('PASS: both gaze controls, single charge, result retry/advance and final chapter boundary.');
