import assert from 'node:assert/strict';
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v))};globalThis.document={hidden:false};globalThis.location={origin:'http://localhost'};
let cash=40,debits=0,credits=0,reject=false,awards=[];const inventory={items:{}};
globalThis.CustomEvent=class{constructor(type,init){this.type=type;this.detail=init?.detail;}};
globalThis.window={location:{search:'?stall=milk-bottles&room=alley'},matchMedia:()=>({matches:false}),parent:{PennyFever:{getState:()=>({demoCoins:cash,paperInventory:inventory}),spendPennies:n=>{if(reject||cash<n)return false;cash-=n;debits++;return true;},addDemoCoins:n=>{credits+=n;cash+=n;return cash;},saveState(){}},PennyFeverInventoryModel:{recordPaperPrize:(s,p)=>{if(inventory.items[p.item])return [];inventory.items[p.item]={qty:1};awards.push(p.item);return [p.item];}},dispatchEvent(){},postMessage(){}}};
const gates={"cabinet-puzzles": "curios", "milky-splash": "milk-bottles", "love-arithmetic": "love", "fortune-globe": "fortune"};
const policy=await import('./first-prize.js?v=keep-finish-1');
const entry=await import('./stall-entry.js?v=keep-finish-1');
for(const [file,id] of Object.entries(gates)){
 const core=await import('./'+file+'.js?v=keep-finish-1');
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
const rides=await import('./ride-seek.js?v=keep-finish-1');
for(const id of ['helter','funhouse']){
 memory.clear();cash=10;
 const ch1=rides.boardRide(id,0);assert(ch1.ok);assert.equal(ch1.practice,false);assert.equal(cash,10);
 const ch2=rides.boardRide(id,1);assert(ch2.paid);assert.equal(ch2.practice,false);assert.equal(cash,9);
 const sealed=rides.sealAttempt({rng:()=>0.01,chapter:1,practice:false,rideId:id,spawnIds:['target']});assert(sealed.eligible);assert.equal(sealed.spawnId,'target');
 const miss=rides.sealAttempt({rng:()=>0.999,chapter:1,practice:false,rideId:id,spawnIds:['target']});assert.equal(miss.eligible,false);
}
console.log('PASS: rides chapter 1 free and live; chapter 2 paid; treasure follows eligibility, not a first-try gift.');
const mabel=(await import('./stalls/milk-bottles.js?v=keep-finish-1')).default;
const splash=await import('./milky-splash.js?v=keep-finish-1');
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
const lookup=await import('./stalls/lookup.js?v=keep-finish-1');
for(let level=0;level<6;level++){
 memory.clear();cash=20;
 const hits=Array.from({length:100},(_,i)=>lookup.isWinningNumber(level,i+1));
 assert(hits.some(v=>v));assert(hits.some(v=>!v));
}
console.log('PASS: telescope prize seconds stay mixed hits and misses on every chapter.');
const iris=(await import('./stalls/fortune.js?v=keep-finish-1')).default;
const {IRIS_CHAPTERS,IRIS_WINS}=await import('./fortune-globe.js?v=keep-finish-1');
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
const pinball=(await import('./stalls/pinball.js?v=keep-finish-1')).default;
for(let level=0;level<6;level++){
 memory.clear();inventory.items={};cash=20;awards=[];
 const s=pinball.create(level);pinball.action(s,'plunge',true);s.charge=.8;pinball.action(s,'plunge',false);assert.equal(cash,level===0?20:19);
 const b=s.bumpers[0];s.ball.x=b.x+1;s.ball.y=b.y;s.ball.vx=0;s.ball.vy=0;pinball.update(s,.001);
 assert(s.hits>=1);assert(!awards.includes(pinball.prizes[level]),'first basic hit is not an automatic bonus');
 s.houseLeft=101-pinball.winningSeconds(level)[0]-.2;b.cool=0;s.ball={x:b.x+1,y:b.y,vx:0,vy:0};pinball.update(s,.001);
 assert(s.prizeCarried,'first ball can carry bonus on a winning-second impact');
 assert(!awards.includes(pinball.prizes[level]),'bumper carry is not Collected until the ball drains');
 s.ball={x:440,y:1150,vx:0,vy:100};pinball.update(s,.02);
 assert(awards.includes(pinball.prizes[level]),'drain keeps the carried bonus');
}
console.log('PASS: pinball first paid ball has each chapter bonus available on a winning-second impact.');
const {WIN_COUNTS, winningSeconds, isWinSecond, elapsedSecond, clockNumber}=await import('./prize-seconds.js?v=keep-finish-1');
assert.deepEqual(WIN_COUNTS,[50,40,30,25,20,15]);
assert.equal(winningSeconds(0).length,50);
assert.equal(isWinSecond(0,1),true);
assert.equal(isWinSecond(0,51),false);
assert.equal(isWinSecond(3,75),false);
assert.equal(isWinSecond(3,76),true);
assert.equal(clockNumber(0),1);
assert.equal(elapsedSecond(100),1);
assert.equal(elapsedSecond(88.5),12);
assert.deepEqual([0,1,2,3,4,5].map(rides.eligibilityPercent),[50,40,30,25,20,15]);
console.log('PASS: shared prize-second tables and ride odds 50/40/30/25/20/15.');
memory.clear();cash=10;
assert(entry.takeAttempt('snap',0));assert.equal(cash,10);
assert(entry.takeAttempt('snap',1));assert.equal(cash,9);
console.log('PASS: Snap chapter 1 free, chapter 2 spends a penny.');
const curios=(await import('./stalls/curios.js?v=keep-finish-1')).default;
const {isCabinetWin}=await import('./cabinet-puzzles.js?v=keep-finish-1');
for(let level=0;level<6;level++){
 memory.clear();inventory.items={};cash=20;awards=[];
 const s=curios.create(level);
 curios.action(s,'play');
 assert.equal(cash,level===0?20:19);
 const bonus=(s.capsules||[]).find(c=>c.bonus);
 assert(bonus,'Digby piles a glow capsule');
 s.swept=true;s.clawX=bonus.x;
 const hit=winningSeconds(level)[0];
 s.houseLeft=hit===1?100:100-hit+0.5;
 curios.action(s,'drop');
 assert.equal(s.dropBeat,hit);
 assert.equal(s.timed,true);
 assert.equal(s.lined,true);
 assert.equal(isCabinetWin(level,s.dropBeat),true);
 const miss=winningSeconds(level).includes(51)?52:51;
 s.phase='aim';s.swept=true;s.clawX=bonus.x;s.houseLeft=100-miss+0.5;
 curios.action(s,'drop');
 assert.equal(s.timed,false);
}
memory.clear();inventory.items={};cash=20;awards=[];
const claw=curios.create(0);
curios.action(claw,'play');
const glow=(claw.capsules||[]).find(c=>c.bonus);
claw.swept=true;claw.clawX=glow.x;claw.houseLeft=99.5;
curios.action(claw,'drop');
for(let i=0;i<180&&claw.phase==='drop';i++)curios.update(claw,1/60);
assert.equal(claw.keepsakeTaken,true,'prize-second line-up carries the glow');
assert.equal(awards.length,0,'a catch is not Collected until the cabinet latches');
assert.equal(claw.phase,'aim');
curios.persist(claw);
const clawBack=curios.create(0);
assert.equal(clawBack.keepsakeTaken,true);
assert.equal(awards.length,0,'leave and resume still leave the book Locked');
curios.onTimeout(clawBack);
assert(awards.includes('clockwork-key'),'latching the glass keeps the carried bonus');
assert.equal(clawBack.prizeKept,true);
memory.clear();inventory.items={};cash=20;awards=[];credits=0;
const extra=curios.create(0);
curios.action(extra,'play');
const glow2=(extra.capsules||[]).find(c=>c.bonus);
const other=(extra.capsules||[]).find(c=>c&&!c.bonus);
extra.swept=true;extra.clawX=glow2.x;extra.houseLeft=99.5;
curios.action(extra,'drop');
for(let i=0;i<180&&extra.phase==='drop';i++)curios.update(extra,1/60);
assert.equal(extra.keepsakeTaken,true);
assert.equal(awards.length,0);
assert(other,'Digby piles ordinary capsules');
extra.swept=true;extra.clawX=other.x;extra.houseLeft=98.5;
curios.action(extra,'drop');
for(let i=0;i<180&&extra.phase==='drop';i++)curios.update(extra,1/60);
assert.equal(extra.phase,'aim');
assert.equal(awards.length,0,'later lit seconds never write the chapter bonus');
assert.equal(credits,1,'a later lit second pays a penny on chapter 1');
console.log('PASS: Digby awards on the 1–100 house prize second plus glow line-up.');
const {kits}=await import('./prizes.js?v=nft-art-1');
assert.equal(kits.helter.prizes.includes('star-token'),false);
assert.equal(kits.helter.prizes.length,6);
console.log('PASS: Helter chapter bonuses are real objects, not a drip.');
if(typeof globalThis.Image==='undefined')globalThis.Image=class{constructor(){this.naturalWidth=1;this.naturalHeight=1;}};
const helter=(await import('./stalls/helter.js?v=keep-finish-1')).default;
memory.clear();inventory.items={};cash=10;awards=[];
const tilly=helter.create(1);
helter.update(tilly,1/60,{keys:new Set(),actions:new Set()});
assert.equal(tilly.boarded,true);assert.equal(cash,9);
tilly.youCell=6;tilly.youX=400;tilly.youY=700;tilly.tokensTaken=2;
if(tilly.tokens?.[0])tilly.tokens[0].taken=true;
tilly.launched=true;tilly.previewing=false;
helter.persist(tilly);
const tillyBack=helter.create(1);
assert.equal(tillyBack.boarded,true);
assert.equal(tillyBack.youCell,6);
assert.equal(tillyBack.tokensTaken,2);
assert.equal(!!tillyBack.tokens?.[0]?.taken,true);
helter.update(tillyBack,1/60,{keys:new Set(),actions:new Set()});
assert.equal(cash,9,'Tilly restore does not debit a second penny');
assert.equal(tillyBack.youCell,6,'Tilly restore keeps the spiral cell');
console.log('PASS: Tilly spiral sitting restores cell, tokens and boarding without a second charge.');
const juno=(await import('./stalls/funhouse.js?v=keep-finish-1')).default;
memory.clear();inventory.items={};cash=10;awards=[];
const maze=juno.create(1);
juno.update(maze,1/60);
assert.equal(maze.boarded,true);assert(maze.maze);assert.equal(cash,9);
maze.player.c=4;maze.player.r=7;maze.pelletsTaken=5;maze.starKeyTaken=true;
juno.persist(maze);
const mazeBack=juno.create(1);
assert.equal(mazeBack.boarded,true);
assert.equal(mazeBack.player.c,4);assert.equal(mazeBack.player.r,7);
assert.equal(mazeBack.pelletsTaken,5);assert.equal(mazeBack.starKeyTaken,true);
juno.update(mazeBack,1/60);
assert.equal(cash,9,'Juno restore does not debit a second penny');
assert.equal(mazeBack.player.c,4,'Juno restore keeps maze position');
assert.equal(mazeBack.pelletsTaken,5);
console.log('PASS: Juno maze sitting restores player, chips and key without a second charge.');
