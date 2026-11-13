import assert from 'node:assert/strict';
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v))};globalThis.document={hidden:false};globalThis.location={origin:'http://localhost'};
let cash=40,debits=0,credits=0,reject=false,awards=[];const inventory={items:{}};
globalThis.CustomEvent=class{constructor(type,init){this.type=type;this.detail=init?.detail;}};
globalThis.window={location:{search:'?stall=milk-bottles&room=alley'},matchMedia:()=>({matches:false}),parent:{PennyFever:{getState:()=>({demoCoins:cash,paperInventory:inventory}),spendPennies:n=>{if(reject||cash<n)return false;cash-=n;debits++;return true;},addDemoCoins:n=>{credits+=n;cash+=n;return cash;},saveState(){}},PennyFeverInventoryModel:{recordPaperPrize:(s,p)=>{if(inventory.items[p.item])return [];inventory.items[p.item]={qty:1};awards.push(p.item);return [p.item];}},dispatchEvent(){},postMessage(){}}};
const gates={"cabinet-puzzles": "curios", "love-arithmetic": "love", "fortune-globe": "fortune"};
const policy=await import('./first-prize.js?v=keep-finish-1');
const entry=await import('./stall-entry.js?v=ride-coil-1');
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
console.log('PASS: 3 timed game prize gates × six chapters; chapter 1 free, chapter 2–6 spend a penny.');
const rides=await import('./ride-seek.js?v=ride-coil-1');
for(const id of ['helter','funhouse']){
 memory.clear();cash=10;
 assert.equal(entry.entryFor(id).door,'ticket',id+' is a ticket ride');
 const ch1=rides.boardRide(id,0);assert(ch1.ok);assert.equal(ch1.practice,false);assert.equal(cash,10);
 const ch2=rides.boardRide(id,1);assert(ch2.paid);assert.equal(ch2.practice,false);assert.equal(cash,9);
 const sealed=rides.sealAttempt({rng:()=>0.01,chapter:1,practice:false,rideId:id,spawnIds:['target']});assert(sealed.eligible);assert.equal(sealed.spawnId,'target');
 const miss=rides.sealAttempt({rng:()=>0.999,chapter:1,practice:false,rideId:id,spawnIds:['target']});assert.equal(miss.eligible,false);
}
assert.equal(entry.enterLabel('helter'),'Board · ticket · Chapter 1 free');
console.log('PASS: rides ticket door, chapter 1 free ride, chapter 2 a penny; treasure follows eligibility.');
const mabel=(await import('./stalls/milk-bottles.js?v=keep-finish-1')).default;
const splash=await import('./milky-splash.js?v=keep-finish-1');
for(let level=0;level<6;level++){
 memory.clear();cash=20;const s=mabel.create(level);mabel.action(s,'play');assert.equal(cash,level===0?20:19);
 assert(s.board.unique,'Mabel starts every uncollected chapter with its prize bottle');
 assert(s.board.unique.r>=Math.max(0,s.board.rows-3),'live prize sits near the crate, not the top row');
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
const lookup=await import('./stalls/lookup.js?v=celeste-clock-1');
const starlight=await import('../experiments/celestes-starlight/model.js?v=celeste-clock-1');
for(let level=0;level<6;level++){
 memory.clear();cash=20;
 const hits=Array.from({length:100},(_,i)=>lookup.isWinningNumber(level,i+1));
 assert(hits.some(v=>v));assert(hits.some(v=>!v));
}
console.log('PASS: telescope prize seconds stay mixed hits and misses on every chapter.');
function flyComet(engine,s){
 engine.action(s,'feed');
 assert.equal(s.phase,'flying');
 const need=((s.frozenRay?.length||0)+25)/410+0.3;
 for(let t=0;t<need && s.phase==='flying';t+=0.1) engine.update(s,0.1);
 assert.notEqual(s.phase,'flying','comet lands');
}
{
 const engine=lookup.default;
 for(let level=0;level<6;level++){
  const g=starlight.createGame(level);
  assert.equal(g.ray.solved,false,'chapter '+(level+1)+' starts unsolved');
  assert.equal((g.ray.mirrorsHit||[]).every(Boolean),false,'chapter '+(level+1)+' starts with a skipped glass');
  g.angles=starlight.CHAPTERS[level].solution.slice();
  starlight.refresh(g);
  assert(g.ray.solved,'chapter '+(level+1)+' solution is a full path');
  assert((g.ray.mirrorsHit||[]).every(Boolean),'chapter '+(level+1)+' solution hits every glass');
 }
 memory.clear();cash=20;awards=[];inventory.items={};
 const miss=engine.create(0);
 engine.update(miss,0.01);
 miss.houseLeft=99;
 assert.equal(engine.prizeClock(miss).n,1);
 assert.notEqual(engine.prizeClock(miss).n,lookup.skyNumber(1,lookup.SKY[0].speed),'house clock is not the sky-speed cycle');
 flyComet(engine,miss);
 assert.equal(miss.paid,false,'incomplete path never claims');
 assert.equal(miss.won,false);
 assert.match(miss.note||engine.readout(miss)||'',/glass/i,'skipped-glass note');
 memory.clear();cash=20;awards=[];inventory.items={};
 const hit=engine.create(0);
 engine.update(hit,0.01);
 hit.angles=starlight.CHAPTERS[0].solution.slice();
 starlight.refresh(hit);
 hit.houseLeft=99;
 assert(hit.ray.solved);
 flyComet(engine,hit);
 assert.equal(hit.paid,true,'full path on a lit second claims');
 assert(awards.includes(hit.prize));
 memory.clear();cash=20;awards=[];inventory.items={};
 const late=engine.create(0);
 engine.update(late,0.01);
 late.angles=starlight.CHAPTERS[0].solution.slice();
 starlight.refresh(late);
 late.houseLeft=40;
 assert.equal(engine.prizeClock(late).n,60);
 assert.equal(lookup.isWinningNumber(0,60),false);
 flyComet(engine,late);
 assert.equal(late.paid,false,'full path on a dark second does not claim');
 assert.equal(engine.clockRuns(Object.assign(engine.create(0),{phase:'flying'})),true);
}
console.log('PASS: Celeste one house clock; every glass on the scoring comet; skipped glass spends the penny.');
const iris=(await import('./stalls/fortune.js?v=keep-finish-1')).default;
const {IRIS_CHAPTERS,IRIS_WINS}=await import('./fortune-globe.js?v=keep-finish-1');
assert.equal(IRIS_CHAPTERS[5].prize,'paper-crown');
assert(IRIS_CHAPTERS[0].flash>=5,'chapter 1 holds the secret on the glass');
for(let level=0;level<6;level++){
 memory.clear();inventory.items={};cash=20;awards=[];
 const s=iris.create(level);iris.action(s,'gaze');assert(!s.practice);assert.equal(cash,level===0?20:19);
 while(s.phase==='flash')iris.update(s,.5);
 iris.update(s,.05);
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
 assert(s.prizePosted,'first ball releases bonus on a winning-second impact');
 assert(!s.prizeCarried,'released bonus still needs the prize target');
 s.ball={x:s.prizeTarget.x+s.prizeTarget.r+10,y:s.prizeTarget.y,vx:-100,vy:0};pinball.update(s,.001);
 assert(s.prizeCarried,'first ball catches the released bonus');
 assert(!awards.includes(pinball.prizes[level]),'caught bonus is not Collected until the ball drains');
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
assert.equal(credits,0,'ordinary capsules on the pile stay put');
extra.swept=true;extra.clawX=glow2.homeX||glow2.x;extra.houseLeft=97.5;
curios.action(extra,'drop');
for(let i=0;i<180&&extra.phase==='drop';i++)curios.update(extra,1/60);
assert.equal(extra.phase,'aim');
assert.equal(credits,1,'a later lit second over the glow pays a penny on chapter 1');
console.log('PASS: Digby awards on the 1–100 house prize second plus glow line-up.');
const {kits}=await import('./prizes.js?v=nft-art-1');
assert.equal(kits.helter.prizes.includes('star-token'),false);
assert.equal(kits.helter.prizes.length,6);
console.log('PASS: Helter chapter bonuses are real objects, not a drip.');
if(typeof globalThis.Image==='undefined')globalThis.Image=class{constructor(){this.naturalWidth=1;this.naturalHeight=1;}};
const helter=(await import('./stalls/helter.js?v=ride-coil-1')).default;
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
const tillySeats=[];
for(let lv=0;lv<6;lv++){
 memory.clear();cash=10;
 const s=helter.create(lv);
 helter.update(s,1/60,{keys:new Set(),actions:new Set()});
 tillySeats.push(s.planTreasureCell);
 assert.equal(cash,lv===0?10:9,'Tilly chapter '+(lv+1)+' charge');
}
assert.deepEqual(tillySeats,[17,8,21,16,24,15]);
assert.equal(new Set(tillySeats).size,6,'each Tilly chapter seats the prize on a different coil cell');
const ball=helter.create(0);
helter.update(ball,1/60,{keys:new Set(),actions:new Set()});
ball.previewing=false;ball.launched=true;ball.ballU=1;ball.ballActive=true;ball.ballRolling=true;ball.ballWait=0;
helter.update(ball,1,{keys:new Set(),actions:new Set()});
assert(ball.ballU<0.94 && ball.ballU>0.8,'gold ball rolls faster than the old 14s crest drop');
console.log('PASS: Tilly prize seats move by chapter and the gold ball is quicker.');
const juno=(await import('./stalls/funhouse.js?v=ride-coil-1')).default;
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
const love=(await import('./stalls/love.js?v=rosalie-clear-1')).default;
memory.clear();inventory.items={};cash=20;awards=[];
const ros=love.create(1);
ros.you='Ann';ros.them='Bob';
love.action(ros,'read');
assert.equal(ros.phase,'count');
assert.equal(cash,19);
love.action(ros,'clear');
assert.equal(ros.phase,'edit');
assert.equal(ros.you,'Ann');
assert.equal(cash,19);
love.action(ros,'read');
assert.equal(ros.phase,'count');
assert.equal(cash,19,'Clear paper keeps the sitting so chapter 2 is not charged twice');
assert.equal(love.prizeClock(ros),null);
assert.match(love.secondsNote(1),/reading/i);
console.log('PASS: Rosalie Clear paper unsticks a sitting without a second penny.');
const copper=(await import('./stalls/coin-pusher.js?v=keep-finish-1')).default;
const celeste=(await import('./stalls/lookup.js?v=celeste-clock-1')).default;
const openIds=['fortune','love','curios','lookup','coin-pusher','pinball','milk-bottles','helter','funhouse','snap'];
for(const id of openIds){
 assert.equal(policy.firstPrizeEligible(id,0),false,id+' never auto-wins on first try');
 memory.clear();cash=20;
 assert(entry.takeAttempt(id,0));assert.equal(cash,20,id+' chapter 1 door is free');
 assert(entry.takeAttempt(id,1));assert.equal(cash,19,id+' chapter 2 spends a penny');
 if(id!=='snap')assert.equal((kits[id]?.prizes||[]).length,6,id+' has six chapter bonuses');
}
for(const g of [iris,love,curios,celeste,copper,pinball,mabel,helter,juno]){
 const text=[g.intro,g.instructions].join(' ');
 assert(!/\bUnlocked\b/.test(text),g.title+' copy uses Collected, not Unlocked');
 assert(!/\bKept\b/.test(text),g.title+' copy uses Collected, not Kept');
}
assert.equal(iris.houseSeconds,0);assert.equal(copper.houseSeconds,0);
assert.equal(pinball.houseSeconds,100);assert.equal(curios.houseSeconds,100);
assert.equal(mabel.houseSeconds,100);assert.equal(helter.houseSeconds,100);
assert.equal(juno.houseSeconds,100);assert.equal(love.houseSeconds,100);
assert.equal(celeste.houseSeconds,100);
assert.equal(entry.entryFor('fortune').door,'free');
assert.equal(entry.entryFor('love').door,'free');
assert.equal(entry.entryFor('curios').door,'free');
assert.equal(entry.entryFor('lookup').door,'free');
assert.equal(entry.entryFor('coin-pusher').door,'free');
assert.equal(entry.entryFor('pinball').door,'free');
assert.equal(entry.entryFor('milk-bottles').door,'free');
console.log('PASS: open games share ch1-free / ch2-6 penny, six bonuses, Collected copy, and declared house clocks.');
