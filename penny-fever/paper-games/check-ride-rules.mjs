// Ride rules (Lorie 13/11/2026): keepsake only on the sealed roll, owned never re-drops,
// everyday pennies go to the purse, Juno ch2–6 have distinct valid mazes, Tilly ch2–6 boards are sane.
import assert from 'node:assert/strict';
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v))};
globalThis.document={hidden:false};globalThis.location={origin:'http://localhost'};globalThis.Image=class{};
let cash=5;const inventory={items:{}};
globalThis.CustomEvent=class{constructor(t,i){this.type=t;this.detail=i?.detail;}};
globalThis.window={location:{search:'?stall=helter&room=alley'},matchMedia:()=>({matches:false}),parent:{PennyFever:{getState:()=>({demoCoins:cash,paperInventory:inventory}),spendPennies:n=>cash>=n&&(cash-=n,true),addDemoCoins:n=>(cash+=n,n),saveState(){}},PennyFeverInventoryModel:{recordPaperPrize:(s,p)=>inventory.items[p.item]?[]:(inventory.items[p.item]={qty:1},[p.item])},dispatchEvent(){},postMessage(){}}};
const rides=await import('./ride-seek.js?v=insights-1');
// everyday penny → purse, not Treasures
const before=cash;rides.payOrdinary('everyday-penny','helter');assert.equal(cash,before+1);assert(!inventory.items['everyday-penny']);
// owned keepsake never re-drops
inventory.items['ride-ticket']={qty:1};
assert(!rides.sealAttempt({rng:()=>0,chapter:3,practice:false,treasureId:'ride-ticket',rideId:'helter',spawnIds:['x']}).eligible);
assert(rides.sealAttempt({rng:()=>0,chapter:3,practice:false,treasureId:'spiral-tower',rideId:'helter',spawnIds:['x']}).eligible);
for(const [ch,pct] of [[0,50],[2,40],[5,30]])assert.equal(rides.eligibilityPercent(ch),pct);
// Juno mazes
const rooms=await import('./stalls/funhouse-rooms.js');
const layouts=new Set();
for(let l=0;l<6;l++){
 const g=rooms.chapterGraph(l),L=g.maze.layout;layouts.add(L.join('|'));
 assert.equal(L.length,13);assert(L.every(r=>r.length===11));
 const open=(c,r)=>r>=0&&r<13&&c>=0&&c<11&&L[r][c]!=='#';let cells=0,pel=0,s;
 for(let r=0;r<13;r++)for(let c=0;c<11;c++)if(open(c,r)){cells++;if('.o'.includes(L[r][c]))pel++;if(L[r][c]==='S')s=[c,r];}
 const seen=new Set([s+'']),q=[s];while(q.length){const [c,r]=q.pop();for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=[c+a,r+b];if(open(...n)&&!seen.has(n+'')){seen.add(n+'');q.push(n);}}}
 assert.equal(seen.size,cells,'maze '+l+' fully connected');assert(pel>=g.maze.clearGoal,'enough chips');
 for(const ch of 'SFKDAB')assert.equal(L.join('').split(ch).length-1,1,ch+' once in maze '+l);
}
assert.equal(layouts.size,6,'six distinct Juno mazes');
console.log('PASS: ride rules — purse pennies, owned keepsakes never re-drop, 50/40/30 roll, six distinct connected Juno mazes.');
