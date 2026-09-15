import assert from 'node:assert/strict';
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v))};globalThis.document={hidden:false};globalThis.location={origin:'http://localhost'};
let cash=40,debits=0,credits=0,reject=false,awards=[];const inventory={items:{}};
globalThis.CustomEvent=class{constructor(type,init){this.type=type;this.detail=init?.detail;}};
globalThis.window={location:{search:'?stall=milk-bottles&room=alley'},matchMedia:()=>({matches:false}),parent:{PennyFever:{getState:()=>({demoCoins:cash,paperInventory:inventory}),spendPennies:n=>{if(reject||cash<n)return false;cash-=n;debits++;return true;},addDemoCoins:n=>{credits+=n;cash+=n;return cash;},saveState(){}},PennyFeverInventoryModel:{recordPaperPrize:(s,p)=>{if(inventory.items[p.item])return [];inventory.items[p.item]={qty:1};awards.push(p.item);return [p.item];}},dispatchEvent(){},postMessage(){}}};

const e=(await import('./stalls/pinball.js?v=pip-pass-1')).default;
const key='pennyFever.pinballAlley';
function tick(s,frames=1,actions=[]){for(let i=0;i<frames;i++)e.update(s,1/60,{keys:new Set(),actions:new Set(actions)});}
function launch(s){e.action(s,'plunge',true);tick(s,42,['plunge']);e.action(s,'plunge',false);assert.equal(s.mode,'live');}
function fresh(level=0){memory.clear();inventory.items={};cash=20;awards=[];return e.create(level);}
let s=fresh();cash=1;const spent=debits;launch(s);assert.equal(cash,0);assert.equal(s.credit,2);assert.equal(s.balls,1);assert.equal(debits,spent+1);
// Prepaid balls remain usable with an empty purse.
s.ball={x:440,y:1150,vx:0,vy:100};tick(s);assert.equal(s.mode,'dead');tick(s,50);assert.equal(s.mode,'lane');launch(s);assert.equal(s.credit,1);assert.equal(debits,spent+1);
// A weak launch that returns down the shooter lane is still the same paid ball.
s.ball={x:726,y:1020,vx:0,vy:10};tick(s);assert.equal(s.mode,'lane');assert(s.activeBall);const balls=s.balls,ready=s.credit;launch(s);assert.equal(s.balls,balls);assert.equal(s.credit,ready);assert.equal(debits,spent+1);
// Cancelling a canvas drag or held button never launches or buys a set.
s=fresh();const cancelled=debits;e.pointer(s,'down',{x:776,y:1000,pointerId:11});assert(s.pointerPlunge&&s.charging);tick(s,30);e.pointer(s,'cancel',{x:776,y:1080,pointerId:11});assert.equal(s.mode,'lane');assert(!s.charging);assert.equal(debits,cancelled);
e.action(s,'plunge',true);tick(s,20,['plunge']);e.cancelAction(s,'plunge');tick(s);assert.equal(s.mode,'lane');assert.equal(debits,cancelled);
// Independent fingers: releasing left keeps right held.
e.pointer(s,'down',{x:300,y:1100,pointerId:1});e.pointer(s,'down',{x:580,y:1100,pointerId:2});tick(s,5);assert(s.left&&s.right);e.pointer(s,'up',{x:300,y:1100,pointerId:1});assert(!s.left&&s.right);e.releaseInput(s);assert(!s.left&&!s.right);
// Freeze and restore the exact paid trajectory, table targets and RNG.
s=fresh(3);launch(s);tick(s,75);e.persist(s);let r=e.create(3);const snapshot=JSON.parse(memory.get(key)).tables['3'].snapshot;e.persist(r);assert.deepEqual(JSON.parse(memory.get(key)).tables['3'].snapshot,snapshot);const beforeDebit=debits;
for(let i=0;i<120;i++){tick(s);tick(r);assert.deepEqual(r.ball,s.ball);assert.equal(r.rngState,s.rngState);assert.deepEqual(r.lights,s.lights);assert.deepEqual(r.bumpers,s.bumpers);}
assert.equal(debits,beforeDebit,'this frozen segment should not debit another set');
// Table changes retain each chapter and its selected position.
const tables=[];for(let level=0;level<6;level++){const q=e.create(level);q.score=100+level;q.credit=level%3;e.persist(q);tables.push(q.score);assert.equal(e.selectedChapter(),level);}for(let level=0;level<6;level++)assert.equal(e.create(level).score,tables[level]);
// Original v2 rows retain credits and owned items when upgraded.
memory.set(key,JSON.stringify({v:2,tables:{'2':{credit:2,score:1234,hits:4,mark:10,balls:5,seen:['glass-kicker'],paid:['glass-kicker'],tokens:{},specials:1}}}));cash=0;s=e.create(2);assert.equal(s.credit,2);assert.equal(s.score,1234);assert(s.seen.includes('glass-kicker'));launch(s);assert.equal(s.credit,1);assert.equal(cash,0);
// Seeded outcomes repeat from the same paid state; first-ball prize is reachable.
for(let level=0;level<6;level++){
 s=fresh(level);launch(s);let firstAt=null;
 for(let i=0;i<1800;i++){
  tick(s,1,s.ball.y>850?['left','right']:[]);
  if(s.hits&&firstAt===null)firstAt=s.t;
  if(awards.includes(e.prizes[level])||s.mode==='dead')break;
 }
 assert(awards.includes(e.prizes[level]),'chapter '+(level+1)+' first launch must reach a qualifying prize hit');
 e.persist(s);const count=awards.length;const back=e.create(level);tick(back);assert.equal(awards.length,count,'restored hit cannot duplicate treasure');
 console.log('Chapter '+(level+1)+': first qualifying prize hit at '+firstAt.toFixed(2)+'s; two prepaid balls retained.');
}
assert.equal(e.houseSeconds,false,'paid balls have no house timeout');
console.log('PASS: prepaid balls with empty purse, free same-ball relaunch, cancelled-input protection, independent fingers, exact trajectory/RNG/targets restore, six chapter saves, legacy credits, reachable first prizes and no duplicate prize on restore.');

// A rejected charge cannot consume a ball or record a first prize attempt.
s=fresh();reject=true;e.action(s,'plunge',true);tick(s,42,['plunge']);const denied=debits;e.action(s,'plunge',false);assert.equal(debits,denied);assert.equal(s.credit,0);assert.equal(s.balls,0);assert.equal(s.mode,'lane');assert(!s.activeBall);reject=false;
console.log('PASS: failed debit leaves the shooter ball and allowance untouched.');
