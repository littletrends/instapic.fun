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
// Every chapter has different physical geometry and winning seconds. A first
// launch makes the treasure available, but a normal early hit must not award it.
const layouts=new Set(),windows=new Set();
for(let level=0;level<6;level++){
 s=fresh(level);launch(s);
 layouts.add(JSON.stringify([s.bumpers,s.targets,s.saucer]));windows.add(JSON.stringify(e.winningSeconds(level)));
 const hit=(second)=>{s.houseLeft=101-second-.2;s.mode='live';s.cabinetOn=true;const b=s.bumpers[0];b.cool=0;s.ball={x:b.x+b.r+10,y:b.y,vx:-100,vy:0};tick(s);};
 hit(1);assert(!awards.includes(e.prizes[level]),'ordinary first hit cannot release bonus');
 hit(e.winningSeconds(level)[0]);assert(awards.includes(e.prizes[level]),'winning second releases chapter '+(level+1));
 e.persist(s);const count=awards.length;r=e.create(level);tick(r);assert.equal(awards.length,count);
 // Every pocket must eject, and cannot recapture until the lower field is reached.
 s=fresh(level);launch(s);s.ball={x:s.saucer.x,y:s.saucer.y,vx:0,vy:0};tick(s);assert(s.saucer.hold>0);
 tick(s,35);assert.equal(s.saucer.hold,0);assert(Math.hypot(s.ball.x-s.saucer.x,s.ball.y-s.saucer.y)>30);
 s.saucer.armed=false;s.saucer.cool=0;s.ball={x:s.saucer.x,y:s.saucer.y,vx:0,vy:0};tick(s);assert.equal(s.saucer.hold,0,'pocket cannot farm recaptures');
 // Force frequent impacts: collectible duplicates stack; live currency stays bounded.
 for(let frame=0;frame<6100&&s.mode==='live';frame++){
  const b=s.bumpers[0];b.cool=0;s.ball={x:b.x+b.r+10,y:b.y,vx:-100,vy:0};tick(s);
 }
 assert(!s.cabinetOn);assert.equal(s.houseLeft,0);assert.equal(s.credit,2);
 assert(s.ballPennies<=2&&s.ballTokens>6);assert(s.wonPennies<=2);assert(Object.entries(s.tokens).some(([id,n])=>['moon-penny','rose-penny','star-token','crown-token'].includes(id)&&n>6),'collectibles exceed old lifetime caps');
 const earned=s.score;tick(s,60);assert.equal(s.score,earned,'dark cabinet cannot score');
 launch(s);assert.equal(s.houseLeft,100);assert(s.cabinetOn);assert.equal(s.credit,1);
 console.log('Chapter '+(level+1)+': timed bonus, pocket release, 100s cutoff and stacking collectibles and bounded currency pass.');
}
assert.equal(layouts.size,6);assert.equal(windows.size,6);assert.equal(e.houseSeconds,100);
// Saved timers, payout limits and locks survive a return; same-ball relaunch
// does not renew time, and menus (no update calls) cannot advance the clock.
s=fresh();launch(s);s.houseLeft=12.5;s.ballPennies=2;s.ballTokens=1;s.rewardAt=s.t+7;s.saucer.armed=false;e.persist(s);r=e.create(0);
assert.equal(r.houseLeft,12.5);assert.equal(r.ballPennies,2);assert.equal(r.ballTokens,1);assert.equal(r.saucer.armed,false);
r.ball={x:726,y:1020,vx:0,vy:10};tick(r);const remaining=r.houseLeft;assert.equal(r.mode,'lane');tick(r,60);assert.equal(r.houseLeft,remaining);launch(r);assert.equal(r.houseLeft,remaining);
// Old active saves retain their trajectory until the next ball, then migrate.
s=fresh(1);launch(s);e.persist(s);let old=JSON.parse(memory.get(key));delete old.tables['1'].snapshot.layoutVersion;delete old.tables['1'].snapshot.houseLeft;old.tables['1'].snapshot.bumpers=[{x:440,y:300,r:22,cool:0,flash:0}];memory.set(key,JSON.stringify(old));r=e.create(1);assert.equal(r.bumpers.length,1);assert.equal(r.houseLeft,100);r.saucer={x:440,y:268,cool:0,hold:.01,armed:false};r.ball={x:440,y:268,vx:0,vy:0};tick(r,3);assert(r.ball.y>340,'legacy obstructed pocket ejects past bumper');r.houseLeft=.001;tick(r);tick(r,60);assert.equal(r.layoutVersion,3);assert.equal(r.bumpers.length,4);assert.equal(r.credit,2);
console.log('PASS: six layouts/windows; exact timer/payout restore; free same-ball relaunch; legacy active ball migration and obstructed pocket recovery.');

// A rejected charge cannot consume a ball or record a first prize attempt.
s=fresh();reject=true;e.action(s,'plunge',true);tick(s,42,['plunge']);const denied=debits;e.action(s,'plunge',false);assert.equal(debits,denied);assert.equal(s.credit,0);assert.equal(s.balls,0);assert.equal(s.mode,'lane');assert(!s.activeBall);reject=false;
console.log('PASS: failed debit leaves the shooter ball and allowance untouched.');

// All 100 impact windows per chapter, including the full final second.
for(let level=0;level<6;level++)for(let second=1;second<=100;second++){
 const q=fresh(level);launch(q);q.houseLeft=101-second-.5;const b=q.bumpers[0];q.ball={x:b.x+b.r+10,y:b.y,vx:-100,vy:0};tick(q);
 assert.equal(awards.includes(e.prizes[level]),e.winningSeconds(level).includes(second),'chapter '+level+' second '+second);
}
console.log('PASS: all 600 winning/non-winning second windows, including second 100.');

// Pre-pull a returning ball without moving it onto the spring or buying a ball.
s=fresh();launch(s);s.houseLeft=40;s.ball={x:726,y:600,vx:0,vy:150};const returningDebit=debits,returningCredit=s.credit,returningBalls=s.balls;
assert(e.actionEnabled(s).plunge);e.action(s,'plunge',true);tick(s,12,['plunge']);assert(s.charging&&s.charge>.2);assert(s.ball.y<900&&s.mode==='live','charging cannot teleport the falling ball');
e.persist(s);r=e.create(0);assert.deepEqual(r.ball,s.ball);assert(!r.charging);assert.equal(r.houseLeft,s.houseLeft);
for(let i=0;i<150&&s.mode==='live';i++)tick(s,1,['plunge']);assert.equal(s.mode,'lane');assert(s.charging&&s.charge>.5,'landing preserves held spring');const timeAtLanding=s.houseLeft;
e.action(s,'plunge',false);assert.equal(s.mode,'live');assert(s.ball.vy<0);assert.equal(s.houseLeft,timeAtLanding);assert.equal(s.credit,returningCredit);assert.equal(s.balls,returningBalls);assert.equal(debits,returningDebit);
// Early release and cancellation simply let the empty spring go.
s.ball={x:726,y:600,vx:0,vy:150};e.action(s,'plunge',true);tick(s,10,['plunge']);const falling={...s.ball};e.action(s,'plunge',false);assert.deepEqual(s.ball,falling);assert.equal(s.charge,0);assert(!s.charging);assert.equal(debits,returningDebit);
e.pointer(s,'down',{x:776,y:1000,pointerId:23});e.pointer(s,'move',{x:776,y:1070,pointerId:23});assert(s.charge>.5);e.pointer(s,'cancel',{x:776,y:1070,pointerId:23});assert(!s.charging);assert.deepEqual(s.ball,falling);
s.ball={x:440,y:600,vx:0,vy:150};assert(!e.actionEnabled(s).plunge);s.ball={x:726,y:600,vx:0,vy:-150};assert(!e.actionEnabled(s).plunge);
console.log('PASS: returning-ball precharge, held landing, same-ball relaunch, timer/credit preservation, early release, canvas cancel and mid-return reload.');
