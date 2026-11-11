import assert from 'node:assert/strict';
const mem=new Map();globalThis.localStorage={getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k)};
globalThis.document={hidden:false};globalThis.location={origin:'http://localhost'};
let cash=24,debits=[],credits=[],awards=[],reject=false,packed=0;const inventory={items:{}};
globalThis.CustomEvent=class {constructor(type,init){this.type=type;this.detail=init?.detail}};
globalThis.window={location:{search:'?stall=coin-pusher&room=alley'},parent:{PennyFever:{getState:()=>({demoCoins:cash,pennyPacks:packed,paperInventory:inventory}),spendPennies:n=>{if(reject||cash<n)return false;cash-=n;debits.push(n);return true},addDemoCoins:n=>{cash+=n;credits.push(n);return cash},pennyPacks:()=>packed,packFivePennies(){if(reject||cash<5)return false;cash-=5;packed+=1;debits.push(5);return true},unpackFivePennies(){if(packed<1)return false;packed-=1;cash+=5;credits.push(5);return true},saveState(){}},PennyFeverInventoryModel:{recordPaperPrize:(s,p)=>{if(inventory.items[p.item])return [];inventory.items[p.item]={qty:1};awards.push(p.item);return [p.item]}},dispatchEvent(){}}};
const base=new URL('./',import.meta.url).href;
const copper=(await import(base+'stalls/coin-pusher.js')).default;
const iris=(await import(base+'stalls/fortune.js')).default;
const key='pennyFever.copperFalls.v6';
let s=copper.create(0);assert(s.practice);copper.drop(s,1);assert.equal(debits.length,0);
for(let i=0;i<2000&&s.practice;i++)copper.update(s,1/60);
assert(!s.practice,'practice completes');assert.equal(credits.length,0);assert.equal(awards.length,0);
cash=24;copper.pointer(s,'down',{x:650,y:970});assert.equal(debits.at(-1),6);assert.equal(s.tray.paidCount,6);assert(s.tray.treasureOn);
copper.update(s,.02);copper.persist(s);const snap=JSON.stringify(s.tray.coins);let resumed=copper.create(0);assert.deepEqual(resumed.tray.coins,JSON.parse(snap));assert.equal(resumed.phase,s.phase);assert.equal(resumed.cycle,s.cycle);assert.equal(resumed.busy,true);assert(resumed.tray.coins.every(c=>Number.isFinite(c.vx)&&Number.isFinite(c.vy)));
const count=debits.length;copper.drop(resumed,1);assert.equal(debits.length,count,'resume cannot recharge active drop');
resumed.phase='push';resumed.cycle=.3;resumed.tray.coins=[{id:'paid',kind:'penny',x:450,y:800,vx:0,vy:90,r:13,falling:true},{id:'treasure',kind:'treasure',x:450,y:800,vx:0,vy:90,r:24,falling:true}];
copper.update(resumed,.01);assert.equal(credits.at(-1),1);assert(awards.includes('coin-sleeve'));copper.persist(resumed);let again=copper.create(0);const a=awards.length,c=credits.length;copper.update(again,.02);assert.equal(awards.length,a);assert.equal(credits.length,c);
for(let level=1;level<6;level++){s=copper.create(level);cash=40;const d=debits.length;copper.pointer(s,'down',{x:250,y:1070});assert.equal(debits[d],20);copper.persist(s);assert.equal(copper.selectedChapter(),level);assert.equal(copper.create(level).tray.paidCount,20);}
cash=0;s=copper.create(5);assert.equal(cash,0,'live empty purse not refilled');s.phase='idle';s.busy=false;const n=s.tray.coins.length;copper.drop(s,1);assert.equal(s.tray.coins.length,n);
cash=10;reject=true;copper.drop(s,1);assert.equal(s.tray.coins.length,n,'failed debit does not mint coins');reject=false;
let f=iris.create(0);const d=debits.length;iris.action(f,'gaze');assert(!f.practice);assert.equal(debits.length,d);iris.persist(f);let rf=iris.create(0);assert.equal(rf.phase,f.phase);assert.equal(rf.charged,true);assert.equal(JSON.stringify(rf.globe),JSON.stringify(f.globe));
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
lower.caught=false;charged=debits.length;iris.pointer(lower,'down',{x:450,y:954});assert.equal(lower.phase,'result');assert.equal(debits.length,charged,'removed result button cannot buy a gaze');
iris.pointer(lower,'down',{x:450,y:1084});assert.equal(lower.phase,'result','result canvas has no retry control');
iris.action(lower,'gaze');assert.equal(lower.phase,'flash');assert.equal(debits.length,charged+1,'shared retry buys one normal gaze');
lower.phase='result';lower.fortune='A test reading.';lower.caught=true;charged=debits.length;
for(const level of [0,5]){lower.level=level;iris.pointer(lower,'down',{x:450,y:954});iris.action(lower,'next-chapter');assert(!lower.requestNext);assert.equal(debits.length,charged);}
console.log('PASS: both gaze controls, single charge, shared retry, inert legacy result controls and saved readings.');

for(let level=0;level<6;level++){
 const tray=copper.create(level);
 assert(tray.pegs.every(p=>p.x-p.r>283.6&&p.x+p.r<616.4&&p.y>418.4&&p.y<610.4),'pegs stay within the playable tray');
 copper.persist(tray);const restore=copper.create(level);assert.deepEqual(restore.tray.coins,tray.tray.coins);assert.equal(restore.phase,tray.phase);
}
console.log('PASS: all six Copper trays keep their saved state and their pegs inside the bed.');

const sumPennies=coins=>coins.reduce((n,c)=>n+(c.kind==='treasure'?0:c.count||1),0);
for(let level=0;level<6;level++)for(const [button,spent] of [['drop1',1],['drop14',75],['drop12',150],['dropall',300]]){
 mem.set(key,JSON.stringify({v:6,practiceUsed:true,trays:{}}));cash=300;
 const game=copper.create(level), starting=sumPennies(game.tray.coins);
 assert.equal(starting,[24,21,21,10,10,8][level]);
 copper.action(game,button);
 if(game.warn)copper.action(game,'warn-dump');
 assert.equal(cash,300-spent);assert.equal(sumPennies(game.tray.coins),starting+spent);
 assert.equal(game.tray.ledger.dropped,spent);
 const incoming=game.tray.coins.filter(c=>c.id.startsWith('d'));
 assert(Math.max(...incoming.map(c=>c.y))-Math.min(...incoming.map(c=>c.y))<=9,'handful lands together');
 for(let frame=0;frame<600;frame++){
  copper.update(game,1/60);
  assert.equal(sumPennies(game.tray.coins)+game.tray.ledger.returned,starting+spent);
  assert.equal(cash,300-spent+game.tray.ledger.returned);
  if(frame===8){copper.persist(game);const restored=copper.create(level);assert.deepEqual(restored.tray.coins,JSON.parse(JSON.stringify(game.tray.coins)));assert.deepEqual(restored.tray.ledger,game.tray.ledger);assert.equal(restored.phase,game.phase);}
  if(!game.busy)break;
 }
 assert(!game.busy,'handful completes');
 assert(game.tray.coins.every(c=>Number.isFinite(c.x)&&Number.isFinite(c.y)));
 if(button==='dropall')console.log(`Chapter ${level+1}: starting ${starting}, dropped ${spent}, returned ${game.tray.ledger.returned}, retained ${sumPennies(game.tray.coins)}`);
}
console.log('PASS: all six chapters × four drop sizes, 300-penny full purse, simultaneous landing, exact accounting and mid-drop restoration.');
for(const amount of [1,300,3000]){
 mem.set(key,JSON.stringify({v:6,practiceUsed:true,trays:{}}));delete inventory.items['coin-sleeve'];cash=amount;
 const game=copper.create(0);game.tray.treasureOn=true;
 game.tray.coins.push({id:'treasure',kind:'treasure',x:450,y:570,vx:0,vy:0,r:24,falling:false});
 copper.drop(game,amount);
 for(let i=0;i<600;i++)copper.update(game,1/60);
 assert.equal(sumPennies(game.tray.coins)+game.tray.ledger.returned,24+amount);
 if(amount===1)assert(!game.tray.treasureOwned,'small drop does not guarantee the hanging prize');
 else assert(game.tray.treasureOwned,'aimed haul can push the hanging prize over');
}
console.log('PASS: aimed full haul moves a hanging prize where one penny does not; 3,000-penny accounting.');

for(const id of Object.keys(inventory.items))delete inventory.items[id];
for(let level=0;level<6;level++){
 mem.set(key,JSON.stringify({v:6,practiceUsed:true,trays:{}}));cash=40;
 let game=copper.create(level);
 for(let paid=1;paid<=1;paid++){
  copper.drop(game,1);
  assert.equal(game.tray.paidCount,paid);
  assert.equal(game.tray.coins.filter(c=>c.kind==='treasure').length,paid>=1?1:0);
  for(let i=0;i<600&&game.busy;i++)copper.update(game,1/60);
  copper.persist(game);game=copper.create(level);
 }
 assert(game.tray.treasureOn||game.tray.treasureOwned);
 const snapshot=JSON.parse(JSON.stringify(game.tray));
 snapshot.coins=snapshot.coins.filter(c=>c.kind!=='treasure');snapshot.treasureOwned=false;
 snapshot.treasureOn=false;snapshot.mark=48;snapshot.paidCount=9;
 mem.set(key,JSON.stringify({v:6,practiceUsed:true,trays:{[level]:snapshot}}));
 const before=cash;game=copper.create(level);
 assert.equal(cash,before,'overdue release costs nothing');assert.equal(game.tray.mark,1);
 assert.equal(game.tray.coins.filter(c=>c.kind==='treasure').length,1);
 assert.deepEqual(game.tray.coins.filter(c=>c.kind!=='treasure'),snapshot.coins,'migration preserves pennies and their positions');
 assert.equal(copper.create(level).tray.coins.filter(c=>c.kind==='treasure').length,1,'reload does not duplicate overdue treasure');
 game.tray.treasureOn=true;game.tray.coins=game.tray.coins.filter(c=>c.kind!=='treasure');copper.persist(game);
 game=copper.create(level);assert.equal(game.tray.coins.filter(c=>c.kind==='treasure').length,1,'repair stale on-tray flag without another payment');
 game.tray.treasureOwned=true;game.tray.treasureOn=false;game.tray.coins=game.tray.coins.filter(c=>c.kind!=='treasure');copper.persist(game);
 assert.equal(copper.create(level).tray.coins.filter(c=>c.kind==='treasure').length,0,'owned prize does not repeat');
}
console.log('PASS: first paid penny in every chapter, free overdue release from old saves, no duplicated/owned prizes, preserved penny positions.');

const {IRIS_CHAPTERS,isIrisWin}=await import('./fortune-globe.js?v=iris-token-1');
assert.equal(IRIS_CHAPTERS[5].prize,'paper-crown');
assert.equal(IRIS_CHAPTERS.map(c=>c.prize).join(','),'fortune-slip,moon-lantern,moon-brooch,fortune-journal,moon-festival-fan,paper-crown');
assert(!IRIS_CHAPTERS.some(c=>c.prize==='looking-glass-locket'));
inventory.items={};awards=[];mem.clear();cash=20;
let gaze=iris.create(0);iris.action(gaze,'gaze');iris.update(gaze,3);
for(let i=0;i<gaze.globe.rings.length;i++){
  const r=gaze.globe.rings[i];r.angle=r.glyphs.indexOf(gaze.globe.flash[i])*Math.PI*2/r.n;iris.pointer(gaze,'down',{x:450,y:428});
}
assert.equal(gaze.note,'Bonus collected.');assert(gaze.won);assert(awards.includes('fortune-slip'));
gaze.phase='idle';gaze.charged=false;gaze.won=false;iris.action(gaze,'gaze');gaze.clock=80;iris.update(gaze,3);
for(let i=0;i<gaze.globe.rings.length;i++){
  const r=gaze.globe.rings[i];r.angle=r.glyphs.indexOf(gaze.globe.flash[i])*Math.PI*2/r.n;iris.pointer(gaze,'down',{x:450,y:428});
}
assert.equal(gaze.note,'Star token collected. Bonus already collected.');
assert(awards.includes('star-token'));
inventory.items={};awards=[];mem.clear();cash=20;
mem.set('pennyFever.firstPrizeAttempts.v1',JSON.stringify({'fortune:1':9,'fortuneCatch:1':9}));
gaze=iris.create(1);iris.action(gaze,'gaze');
iris.update(gaze,3);
gaze.clock=81;
assert(!isIrisWin(1,81),'later catches use the ordinary 1–100 gate');
for(let i=0;i<gaze.globe.rings.length;i++){
  const r=gaze.globe.rings[i];r.angle=r.glyphs.indexOf(gaze.globe.flash[i])*Math.PI*2/r.n;iris.pointer(gaze,'down',{x:450,y:428});
}
assert.equal(gaze.note,'Star token collected. Bonus still locked.');assert(!gaze.won);assert(awards.includes('star-token'));assert(!awards.includes('moon-lantern'));
inventory.items={};awards=[];mem.clear();cash=20;credits=[];
gaze=iris.create(2);iris.action(gaze,'gaze');iris.update(gaze,3);
for(let i=0;i<gaze.globe.rings.length;i++)iris.pointer(gaze,'down',{x:450,y:428});
assert.equal(gaze.phase,'result');assert(!gaze.caught);assert.equal(awards.length,0,'a slipped gaze holds no reward');assert.equal(cash,20);assert.equal(credits.length,0);
console.log('PASS: Iris chapter 6 is paper-crown; first catch collects the bonus; later greens pay a star token; misses do not.');

mem.set(key,JSON.stringify({v:6,practiceUsed:true,trays:{}}));cash=40;packed=0;debits=[];credits=[];
let bank=copper.create(0);bank.practice=false;bank.phase='idle';bank.busy=false;
assert(copper.action(bank,'pack5')===undefined);assert.equal(cash,35);assert.equal(packed,1);
copper.action(bank,'pack5');copper.action(bank,'pack5');assert.equal(cash,25);assert.equal(packed,3);
const loose=cash;copper.action(bank,'dropall');if(bank.warn)copper.action(bank,'warn-dump');assert.equal(debits.at(-1),loose);assert.equal(cash,0);assert.equal(packed,3);
for(let i=0;i<600&&bank.busy;i++)copper.update(bank,1/60);
const afterDrop=cash;assert(afterDrop>=0);assert.equal(packed,3,'packs stay out of the machine during a dump');
copper.action(bank,'unpack5');assert.equal(packed,2);assert.equal(cash,afterDrop+5);
reject=true;const beforePack=packed;copper.action(bank,'pack5');assert.equal(packed,beforePack);reject=false;
cash=4;copper.action(bank,'pack5');assert.equal(packed,2,'cannot pack fewer than five pennies');
console.log('PASS: Copper 5-packs keep pennies out of a full-purse drop and unpack restores them.');

mem.set(key,JSON.stringify({v:6,practiceUsed:true,trays:{}}));cash=1700;packed=0;debits=[];
let warn=copper.create(0);warn.practice=false;warn.phase='idle';warn.busy=false;
copper.action(warn,'dropall');
assert.equal(cash,1700);assert.equal(debits.length,0);assert.equal(warn.warn.n,1700);
copper.action(warn,'warn-keep');assert(!warn.warn);assert.equal(cash,1700);
copper.action(warn,'dropall');copper.action(warn,'warn-pack');
assert.equal(packed,340);assert.equal(cash,0);assert(!warn.warn);
assert.match(warn.note,/Packed 340 packs/);
mem.set(key,JSON.stringify({v:6,practiceUsed:true,trays:{}}));cash=48;packed=0;debits=[];
warn=copper.create(0);warn.practice=false;warn.phase='idle';warn.busy=false;
copper.action(warn,'dropall');assert.equal(warn.warn.n,48);
copper.action(warn,'warn-dump');assert.equal(debits.at(-1),48);assert.equal(cash,0);assert(!warn.warn);
mem.set(key,JSON.stringify({v:6,practiceUsed:true,trays:{}}));cash=24;debits=[];
const quiet=copper.create(0);quiet.practice=false;quiet.phase='idle';quiet.busy=false;
copper.action(quiet,'drop1');assert.equal(debits.at(-1),1);assert(!quiet.warn,'single pennies skip the warning');
console.log('PASS: Copper warns before a big dump; pack-first parks the purse; dump-anyway spends once; singles stay quiet.');
