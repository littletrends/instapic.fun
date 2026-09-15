import assert from 'node:assert/strict';
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v))};globalThis.document={hidden:false};globalThis.location={origin:'http://localhost'};
let cash=40,debits=0,credits=0,reject=false,awards=[];const inventory={items:{}};
globalThis.CustomEvent=class{constructor(type,init){this.type=type;this.detail=init?.detail;}};
globalThis.window={location:{search:'?stall=milk-bottles&room=alley'},matchMedia:()=>({matches:false}),parent:{PennyFever:{getState:()=>({demoCoins:cash,paperInventory:inventory}),spendPennies:n=>{if(reject||cash<n)return false;cash-=n;debits++;return true;},addDemoCoins:n=>{credits+=n;cash+=n;return cash;},saveState(){}},PennyFeverInventoryModel:{recordPaperPrize:(s,p)=>{if(inventory.items[p.item])return [];inventory.items[p.item]={qty:1};awards.push(p.item);return [p.item];}},dispatchEvent(){},postMessage(){}}};
const gates={"impossible-case": "pack", "whisper-run": "whisper", "plates": "ball-toss", "cabinet-puzzles": "curios", "perfect-strike": "high-striker", "sugar-cyclone": "fairy-floss", "vanishing-spot": "cover-the-spot", "opening-night": "pass", "moonbow": "skee-ball", "shattered-fate": "catoptromancy", "duckling-parade": "duck-pond", "milky-splash": "milk-bottles", "fleet": "water-gun", "marble-mill": "plinko", "dish-garden": "penny-pitch", "ring-raiders": "bent-rings", "love-arithmetic": "love", "kernel-run": "popcorn", "flicker-reel": "mutoscope", "pressure-drop": "dunk-tank", "fortune-globe": "fortune", "glowball": "marquee"};
const policy=await import('./first-prize.js?v=first-prize-1');
const entry=await import('./stall-entry.js?v=first-prize-1');
for(const [file,id] of Object.entries(gates)){
 const core=await import('./'+file+'.js?v=first-prize-1');
 const gate=Object.entries(core).find(([name])=>/^is.*Win$/.test(name))[1];
 for(let level=0;level<6;level++){
  memory.clear();cash=100;reject=false;
  const baseline=Array.from({length:100},(_,i)=>gate(level,i+1));
  assert(baseline.some(v=>!v));
  assert(entry.takeAttempt(id,level));
  assert(policy.firstPrizeEligible(id,level));
  for(let n=1;n<=100;n++)assert(gate(level,n),id+' chapter '+level+' first prize');
  const restored=await import('./first-prize.js?reload='+id+level);
  assert(restored.firstPrizeEligible(id,level),'eligibility survives module reload');
  reject=true;assert(!entry.takeAttempt(id,level));assert.equal(policy.prizeAttempts(id,level),1);
  reject=false;assert(entry.takeAttempt(id,level));assert.equal(policy.prizeAttempts(id,level),2);
  assert.deepEqual(Array.from({length:100},(_,i)=>gate(level,i+1)),baseline,'later odds retained');
 }
}
console.log('PASS: 22 game prize gates × six chapters × 100 outcomes; first attempt guaranteed eligible, failed debit preserves it, reload retains it, later odds unchanged.');
const rides=await import('./ride-seek.js?v=first-prize-1');
for(const id of entry.RIDE_SEEKS)for(let level=0;level<6;level++){
 memory.clear();cash=10;
 const practice=rides.boardRide(id,level);assert(practice.practice);assert.equal(cash,10);assert.equal(policy.prizeAttempts(id,level),0);
 const paid=rides.boardRide(id,level);assert(paid.paid);assert.equal(cash,9);
 const sealed=rides.sealAttempt({rng:()=>.999,chapter:level,practice:false,rideId:id,spawnIds:['target']});assert(sealed.eligible);assert.equal(sealed.spawnId,'target');
}
console.log('PASS: all eight rides retain free practice; first paid ride has a treasure even at result 100.');
const mabel=(await import('./stalls/milk-bottles.js?v=first-prize-1')).default;
for(let level=0;level<6;level++){
 memory.clear();cash=20;const s=mabel.create(level);mabel.action(s,'play');assert(s.board.unique);assert.equal(cash,20);s.houseLeft=80;mabel.persist(s);
 const snapshot=JSON.stringify(s.board.cells),moves=s.board.movesLeft;
 const back=mabel.create(level);assert.equal(JSON.stringify(back.board.cells),snapshot);assert.equal(back.board.movesLeft,moves);assert.equal(back.houseLeft,80);assert.equal(cash,20);
 // Old paid board without a prize gains one, retaining timer, moves and balance.
 const data=JSON.parse(memory.get('pennyFever.milkySplash'));const row=data.sittings[level];const u=row.board.unique;row.board.cells[u.r][u.c]={kind:'milk',flavour:'vanilla'};row.board.unique=null;
 memory.set('pennyFever.milkySplash',JSON.stringify(data));memory.delete('pennyFever.firstPrizeAttempts.v1');
 const old=mabel.create(level);assert(old.board.unique);assert.equal(old.board.movesLeft,moves);assert.equal(old.houseLeft,80);assert.equal(cash,20);
 mabel.persist(old);assert.equal(JSON.stringify(mabel.create(level).board.cells),JSON.stringify(old.board.cells));
}
console.log('PASS: all six Mabel first boards, exact return state, and uncharged legacy missing-prize recovery.');
const lookup=await import('./stalls/lookup.js?v=first-prize-1');
for(let level=0;level<6;level++){memory.clear();cash=20;entry.takeAttempt('lookup',level);for(let n=1;n<=100;n++)assert(lookup.isWinningNumber(level,n));}
console.log('PASS: telescope first-attempt eligibility across six chapters.');
const iris=(await import('./stalls/fortune.js?v=first-prize-1')).default;
for(let level=0;level<6;level++){
 memory.clear();inventory.items={};cash=20;awards=[];
 const s=iris.create(level);iris.action(s,'gaze');assert(!s.practice);assert.equal(cash,20);iris.update(s,3);
 for(let i=0;i<s.globe.rings.length;i++){
  const r=s.globe.rings[i];r.angle=r.glyphs.indexOf(s.globe.flash[i])*Math.PI*2/r.n;iris.pointer(s,'down',{x:450,y:428});
 }
 assert(s.won,'first matched gaze awards treasure');assert(awards.length);iris.persist(s);const qty=awards.length;iris.create(level);assert.equal(awards.length,qty);
}
console.log('PASS: all six Iris included gazes award a correctly caught prize and retain it across reload.');
const pinball=(await import('./stalls/pinball.js?v=first-prize-1')).default;
for(let level=0;level<6;level++){
 memory.clear();inventory.items={};cash=20;awards=[];
 const s=pinball.create(level);pinball.action(s,'plunge',true);s.charge=.8;pinball.action(s,'plunge',false);assert.equal(cash,19);
 const b=s.bumpers[0];s.ball.x=b.x+1;s.ball.y=b.y;s.ball.vx=0;s.ball.vy=0;pinball.update(s,.001);
 assert(s.hits>=1);assert(!awards.includes(pinball.prizes[level]),'first basic hit is not an automatic bonus');
 s.houseLeft=101-pinball.winningSeconds(level)[0]-.2;b.cool=0;s.ball={x:b.x+1,y:b.y,vx:0,vy:0};pinball.update(s,.001);
 assert(awards.includes(pinball.prizes[level]),'first ball can release bonus on a winning-second impact');
}
console.log('PASS: pinball first paid ball has each chapter bonus available on a winning-second impact.');
