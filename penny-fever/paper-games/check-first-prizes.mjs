import assert from 'node:assert/strict';
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v))};globalThis.document={hidden:false};globalThis.location={origin:'http://localhost'};
let cash=40,debits=0,credits=0,reject=false,awards=[];const inventory={items:{}};
globalThis.CustomEvent=class{constructor(type,init){this.type=type;this.detail=init?.detail;}};
globalThis.window={location:{search:'?stall=milk-bottles&room=alley'},matchMedia:()=>({matches:false}),parent:{PennyFever:{getState:()=>({demoCoins:cash,paperInventory:inventory}),spendPennies:n=>{if(reject||cash<n)return false;cash-=n;debits++;return true;},addDemoCoins:n=>{credits+=n;cash+=n;return cash;},saveState(){}},PennyFeverInventoryModel:{recordPaperPrize:(s,p)=>{if(inventory.items[p.item])return [];inventory.items[p.item]={qty:1};awards.push(p.item);return [p.item];}},dispatchEvent(){},postMessage(){}}};
const gates={"cabinet-puzzles": "curios", "milky-splash": "milk-bottles", "love-arithmetic": "love", "fortune-globe": "fortune"};
const policy=await import('./first-prize.js?v=ch2-lock-1');
const entry=await import('./stall-entry.js?v=ch2-lock-1');
for(const [file,id] of Object.entries(gates)){
 const core=await import('./'+file+'.js?v=ch2-lock-1');
 const gate=Object.entries(core).find(([name])=>/^is.*Win$/.test(name))[1];
 for(let level=0;level<6;level++){
  memory.clear();cash=100;reject=false;
  const baseline=Array.from({length:100},(_,i)=>gate(level,i+1));
  assert(baseline.some(v=>v),id+' chapter '+level+' has prize seconds');
  assert(baseline.some(v=>!v),id+' chapter '+level+' has misses');
  assert.equal(policy.firstPrizeEligible(id,level),false);
  assert(entry.takeAttempt(id,level));
  assert.equal(cash, level===0?100:99);
  assert.deepEqual(Array.from({length:100},(_,i)=>gate(level,i+1)),baseline,'odds stay on the prize second');
 }
}
console.log('PASS: 4 game prize gates × six chapters; prize second only, chapter 1 free, chapter 2–6 spend a penny.');
const rides=await import('./ride-seek.js?v=ch2-lock-1');
for(const id of ['helter','funhouse']){
 memory.clear();cash=10;
 const ch1=rides.boardRide(id,0);assert(ch1.ok);assert.equal(ch1.practice,false);assert.equal(cash,10);
 const ch2=rides.boardRide(id,1);assert(ch2.paid);assert.equal(ch2.practice,false);assert.equal(cash,9);
 const sealed=rides.sealAttempt({rng:()=>0.01,chapter:1,practice:false,rideId:id,spawnIds:['target']});assert(sealed.eligible);assert.equal(sealed.spawnId,'target');
 const miss=rides.sealAttempt({rng:()=>0.999,chapter:1,practice:false,rideId:id,spawnIds:['target']});assert.equal(miss.eligible,false);
}
console.log('PASS: rides chapter 1 free and live; chapter 2 paid; treasure follows eligibility, not a first-try gift.');
const mabel=(await import('./stalls/milk-bottles.js?v=ch2-lock-1')).default;
const splash=await import('./milky-splash.js?v=ch2-lock-1');
for(let level=0;level<6;level++){
 memory.clear();cash=20;const s=mabel.create(level);mabel.action(s,'play');assert.equal(cash,level===0?20:19);
 const expectUnique=splash.isMabelWin(level,splash.resultNumber(s.seed));
 assert.equal(!!s.board.unique,!!expectUnique,'Mabel unique follows the prize second');
 s.houseLeft=80;mabel.persist(s);
 const snapshot=JSON.stringify(s.board.cells),moves=s.board.movesLeft;
 const back=mabel.create(level);assert.equal(JSON.stringify(back.board.cells),snapshot);assert.equal(back.board.movesLeft,moves);assert.equal(back.houseLeft,80);assert.equal(cash,level===0?20:19);
 if(s.board.unique){
  const data=JSON.parse(memory.get('pennyFever.milkySplash'));const row=data.sittings[level];const u=row.board.unique;row.board.cells[u.r][u.c]={kind:'milk',flavour:'vanilla'};row.board.unique=null;
  memory.set('pennyFever.milkySplash',JSON.stringify(data));memory.delete('pennyFever.firstPrizeAttempts.v1');
  const old=mabel.create(level);assert.equal(old.board.movesLeft,moves);assert.equal(old.houseLeft,80);assert.equal(cash,level===0?20:19);
  mabel.persist(old);assert.equal(JSON.stringify(mabel.create(level).board.cells),JSON.stringify(old.board.cells));
 }
}
console.log('PASS: all six Mabel first boards, exact return state, and uncharged legacy missing-prize recovery.');
const lookup=await import('./stalls/lookup.js?v=ch2-lock-1');
for(let level=0;level<6;level++){
 memory.clear();cash=20;
 const hits=Array.from({length:100},(_,i)=>lookup.isWinningNumber(level,i+1));
 assert(hits.some(v=>v));assert(hits.some(v=>!v));
}
console.log('PASS: telescope prize seconds stay mixed hits and misses on every chapter.');
const iris=(await import('./stalls/fortune.js?v=ch2-lock-1')).default;
const {IRIS_CHAPTERS,IRIS_WINS}=await import('./fortune-globe.js?v=ch2-lock-1');
assert.equal(IRIS_CHAPTERS[5].prize,'paper-crown');
for(let level=0;level<6;level++){
 memory.clear();inventory.items={};cash=20;awards=[];
 const s=iris.create(level);iris.action(s,'gaze');assert(!s.practice);assert.equal(cash,level===0?20:19);iris.update(s,3);
 s.clock=IRIS_WINS[level][0];
 for(let i=0;i<s.globe.rings.length;i++){
  const r=s.globe.rings[i];r.angle=r.glyphs.indexOf(s.globe.flash[i])*Math.PI*2/r.n;iris.pointer(s,'down',{x:450,y:428});
 }
 assert(s.won,'matched gaze on a prize second awards treasure');
 assert(awards.includes(IRIS_CHAPTERS[level].prize));
 iris.persist(s);const qty=awards.length;iris.create(level);assert.equal(awards.length,qty);
}
console.log('PASS: Iris awards the chapter bonus on a prize-second catch and keeps one copy.');
const pinball=(await import('./stalls/pinball.js?v=ch2-lock-1')).default;
for(let level=0;level<6;level++){
 memory.clear();inventory.items={};cash=20;awards=[];
 const s=pinball.create(level);pinball.action(s,'plunge',true);s.charge=.8;pinball.action(s,'plunge',false);assert.equal(cash,level===0?20:19);
 const b=s.bumpers[0];s.ball.x=b.x+1;s.ball.y=b.y;s.ball.vx=0;s.ball.vy=0;pinball.update(s,.001);
 assert(s.hits>=1);assert(!awards.includes(pinball.prizes[level]),'first basic hit is not an automatic bonus');
 s.houseLeft=101-pinball.winningSeconds(level)[0]-.2;b.cool=0;s.ball={x:b.x+1,y:b.y,vx:0,vy:0};pinball.update(s,.001);
 assert(awards.includes(pinball.prizes[level]),'first ball can release bonus on a winning-second impact');
}
console.log('PASS: pinball first paid ball has each chapter bonus available on a winning-second impact.');
