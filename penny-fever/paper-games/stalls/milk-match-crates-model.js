// Timed match-three crate filling. Reuses the existing dairy match rules only.
import {makeBoard,cloneBoard,applySwap,findMatches,legalMoves,repairBoard} from '../milky-splash.js?v=prize-drop-1';
export const FLAVOURS=[{id:'strawberry',name:'Strawberry',colour:'#d9828f',ink:'#843c50'},{id:'chocolate',name:'Chocolate',colour:'#a57655',ink:'#684733'},{id:'banana',name:'Banana',colour:'#e9c25c',ink:'#796326'},{id:'vanilla',name:'Vanilla',colour:'#b9c9a4',ink:'#66784c'}];
export const GRID={left:120,top:230,cw:132,ch:103,cols:5,rows:5},SECONDS=75,GOAL=6,CAPACITY=6;
export const LEVELS=[
 {name:'The first delivery',seconds:75,goal:6,rows:5,blocks:[],requests:[0,0,0,0],detail:'Six full crates before the bell.'},
 {name:'A busier dairy',seconds:75,goal:8,rows:5,blocks:[],requests:[0,0,0,0],detail:'Eight crates. Look for four, five and cascades.'},
 {name:'Packing day',seconds:85,goal:9,rows:5,blocks:[[1,2,1],[3,2,1],[2,3,1]],requests:[0,0,0,0],detail:'Match beside wooden packing blocks to clear them.'},
 {name:'Wrapped for travel',seconds:85,goal:10,rows:6,blocks:[[1,1,2],[3,1,2],[2,3,2],[2,4,1]],requests:[0,0,0,0],detail:'Strapped packing blocks need two nearby matches.'},
 {name:'Every flavour, please',seconds:85,goal:10,rows:6,blocks:[[1,2,2],[3,2,2],[2,4,1]],requests:[2,2,2,2],detail:'Ten crates, including at least two of every flavour.'},
 {name:'Mabel’s midnight delivery',seconds:90,goal:12,rows:6,blocks:[[1,1,2],[3,1,2],[1,4,2],[3,4,2]],holes:[[0,0],[4,0],[0,5],[4,5]],requests:[3,3,3,3],detail:'Three crates of every flavour. Clear the wrapped shelves.'},
];
export const rules=s=>LEVELS[typeof s==='number'?s:s.level];
export const gridFor=s=>({...GRID,rows:rules(s).rows,ch:515/rules(s).rows});
export const goalMet=s=>s.sent>=rules(s).goal&&rules(s).requests.every((n,i)=>s.crates[i].completed>=n);
export const CRATES=FLAVOURS.map((_,i)=>({x:135+i*210,y:915}));
const clone=value=>JSON.parse(JSON.stringify(value));
export const cellCenter=(c,r,s=0)=>{const g=gridFor(s);return {x:g.left+(c+.5)*g.cw,y:g.top+(r+.5)*g.ch};};
export function cellAtPoint(p,s=0){const g=gridFor(s),c=Math.floor((p.x-g.left)/g.cw),r=Math.floor((p.y-g.top)/g.ch);return c>=0&&c<5&&r>=0&&r<g.rows?{c,r}:null;}
export const flavourIndex=id=>FLAVOURS.findIndex(f=>f.id===id);
export function slotPosition(i,slot){return {x:CRATES[i].x+(slot%3-1)*43,y:CRATES[i].y-20-(slot<3?12:0)};}
export const crateOffset=c=>c.phase==='dispatch'?(c.age/.9)**2*1000:c.phase==='arrive'?-((1-Math.min(1,c.age/.55))**2)*1000:0;
export function makeState(seed=1703,level=0){
 if(!Number.isInteger(level)||!LEVELS[level])throw Error('Choose a Milk Match chapter from 1 to 6.');const sky=LEVELS[level];
 const board=makeBoard(0,seed,{allowUnique:false});board.rows=sky.rows;board.cells=board.cells.slice(0,sky.rows);
 for(const [c,r,hp] of sky.blocks)board.cells[r][c]={kind:hp===2?'weighted':'crate',hp};
 for(const [c,r] of sky.holes||[])board.cells[r][c]={kind:'hole'};
 repairBoard(board);board.moves=10000;board.movesLeft=10000;board.collected={};let nextCellId=0;
 for(const row of board.cells)for(const cell of row)cell.id=nextCellId++;
 return {v:2,level,seed,t:0,phase:'idle',phaseTime:0,board,nextCellId,selected:null,cursor:{c:2,r:2},pressed:false,pressCell:null,started:false,houseLeft:sky.seconds,timeExpired:false,
 anim:null,pending:[],flights:[],crates:FLAVOURS.map(()=>({filled:0,reserved:0,completed:0,phase:'open',age:0})),sent:0,moves:0,rejected:0,lastBatch:0,sparks:[],
 note:sky.detail,chapterPrize:null,prizeKept:false,rewardReveal:null,result:null};
}
export function cancel(s){s.pressed=false;s.pressCell=null;}
export const clockRuns=s=>s.started&&!s.timeExpired&&!s.result&&!s.saveError&&s.phase==='idle';
export const movesFor=s=>legalMoves(s.board);
export const canChoose=(s,p)=>p&&Number.isInteger(p.c)&&Number.isInteger(p.r)&&p.c>=0&&p.c<5&&p.r>=0&&p.r<s.board.rows&&['milk','special'].includes(s.board.cells[p.r][p.c]?.kind);
export function swap(s,a,b){
 if(s.result||s.phase!=='idle'||s.timeExpired||!canChoose(s,a)||!canChoose(s,b)||Math.abs(a.c-b.c)+Math.abs(a.r-b.r)!==1)return false;
 s.started=true;cancel(s);s.selected=null;s.cursor={...b};
 const before=clone(s.board.cells),next=cloneBoard(s.board),oldCounts={...s.board.collected};
 const swapped=cloneBoard(s.board);[swapped.cells[a.r][a.c],swapped.cells[b.r][b.c]]=[swapped.cells[b.r][b.c],swapped.cells[a.r][a.c]];
 const hits=findMatches(swapped),outcome=applySwap(next,a.c,a.r,b.c,b.r);
 if(!outcome.ok){s.phase='reject';s.phaseTime=0;s.anim={before,a:{...a},b:{...b},hits:[],paths:[]};s.rejected++;s.note='That swap makes no match. Try another pair.';return false;}
 s.moves++;s.lastBatch=0;
 const remaining=new Set(next.cells.flat().filter(Boolean).map(cell=>cell.id));
 const origins=FLAVOURS.map(()=>[]);
 for(let r=0;r<s.board.rows;r++)for(let c=0;c<5;c++){const cell=swapped.cells[r][c];if(!remaining.has(cell.id))origins[flavourIndex(cell.flavour)]?.push(cellCenter(c,r,s));}
 for(const [i,f] of FLAVOURS.entries()){
  const n=(next.collected[f.id]||0)-(oldCounts[f.id]||0);s.lastBatch+=n;
  for(let k=0;k<n;k++)s.pending.push({flavour:i,...(origins[i][k]||cellCenter((k+i)%5,s.board.rows-1,s)),delay:.2+(k%6)*.055});
 }
 const oldPlaces=new Map();for(let r=0;r<s.board.rows;r++)for(let c=0;c<5;c++)oldPlaces.set(swapped.cells[r][c].id,{c,r});
 const paths=next.cells.map((row,r)=>row.map((cell,c)=>{
  if(cell.id==null)cell.id=s.nextCellId++;const p=oldPlaces.get(cell.id);return p||{c,r:-1-(r%3)};
 }));
 s.board=next;s.phase='swap';s.phaseTime=0;s.anim={before,a:{...a},b:{...b},hits,paths};s.note=`${s.lastBatch} bottles matched! Four and five make bonus bottles.`;return true;
}
export function choose(s,p){
 if(s.phase!=='idle'||s.result||s.timeExpired)return false;if(!canChoose(s,p)){s.note='Match beside the packing block to break it. Straps need two hits.';return false;}s.started=true;s.cursor={...p};
 if(!s.selected){s.selected={...p};return true;}
 if(s.selected.c===p.c&&s.selected.r===p.r){s.selected=null;return true;}
 if(Math.abs(s.selected.c-p.c)+Math.abs(s.selected.r-p.r)===1)return swap(s,s.selected,p);
 s.selected={...p};return true;
}
export function timeUp(s){if(s.result||s.phase==='celebrate')return;s.houseLeft=0;s.timeExpired=true;cancel(s);s.selected=null;s.phase='drain';s.anim=null;s.note='Time’s up. Finishing the bottles already matched…';}
function deliveries(s,dt){
 for(const c of s.crates){
  if(c.phase==='open'&&c.filled===CAPACITY){c.phase='closing';c.age=0;}
  else if(c.phase==='closing'){c.age+=dt;if(c.age>=.5){c.phase='dispatch';c.age=0;}}
  else if(c.phase==='dispatch'){c.age+=dt;if(c.age>=.9){c.completed++;s.sent++;c.phase='arrive';c.age=0;c.filled=0;c.reserved=0;}}
  else if(c.phase==='arrive'){c.age+=dt;if(c.age>=.55){c.phase='open';c.age=0;}}
 }
 for(const packet of s.pending)packet.delay=Math.max(0,packet.delay-dt);
 for(let k=0;k<s.pending.length;){const packet=s.pending[k],c=s.crates[packet.flavour];if(packet.delay<=0&&c.phase==='open'&&c.reserved<CAPACITY){s.flights.push({...packet,slot:c.reserved++,age:0});s.pending.splice(k,1);}else k++;}
 for(const f of s.flights)f.age+=dt;
 const landed=s.flights.filter(f=>f.age>=.6);s.flights=s.flights.filter(f=>f.age<.6);
 for(const f of landed){s.crates[f.flavour].filled++;s.sparks.push({...slotPosition(f.flavour,f.slot),age:0});}
}
export function step(s,dt){
 if(s.result||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.05,dt);s.t+=dt;for(const p of s.sparks)p.age+=dt;s.sparks=s.sparks.filter(p=>p.age<.7);
 if(s.phase==='celebrate'){s.celebrateLeft-=dt;return;}
 deliveries(s,dt);
 if(['swap','burst','fall','reject'].includes(s.phase)){
  s.phaseTime+=dt;
  if(s.phase==='swap'&&s.phaseTime>=.18){s.phase='burst';s.phaseTime=0;}
  else if(s.phase==='burst'&&s.phaseTime>=.15){s.phase='fall';s.phaseTime=0;}
  else if(s.phase==='fall'&&s.phaseTime>=.35){s.phase='idle';s.phaseTime=0;s.anim=null;}
  else if(s.phase==='reject'&&s.phaseTime>=.28){s.phase='idle';s.phaseTime=0;s.anim=null;}
 }
 if(goalMet(s)&&['idle','drain'].includes(s.phase)){s.phase='celebrate';s.celebrateLeft=2.5;cancel(s);s.note='Your crate orders are complete!';return;}
 if(s.phase==='drain'&&!s.pending.length&&!s.flights.length&&s.crates.every(c=>c.phase==='open')){s.phase='result';s.result={title:'The dairy bell rings',detail:`${s.sent}/${rules(s).goal} crates. ${rules(s).requests.some(n=>n)?'Every requested flavour must be delivered. ':''}Try a new board and look for bigger matches.`,won:false,prize:null,settle:true};}
}
export function snapshot(s){const out=clone(s);out.pressed=false;out.pressCell=null;delete out.saveError;return out;}
export function restore(blob,level=blob?.level??0){
 if(!blob||![1,2].includes(blob.v)||!Number.isInteger(level)||!LEVELS[level]||blob.level!==level||(blob.v===1&&level!==0))throw Error('Unknown Milk Match save; preserved for review.');
 const s=snapshot(blob);s.v=2;const sky=rules(s),finite=n=>typeof n==='number'&&Number.isFinite(n),int=n=>Number.isInteger(n)&&n>=0,spot=p=>p&&Number.isInteger(p.c)&&p.c>=0&&p.c<5&&Number.isInteger(p.r)&&p.r>=0&&p.r<sky.rows;
 if(!['idle','swap','burst','fall','reject','drain','celebrate','result'].includes(s.phase)||!finite(s.t)||s.t<0||!finite(s.houseLeft)||s.houseLeft<0||s.houseLeft>sky.seconds||!finite(s.phaseTime)||s.phaseTime<0||typeof s.started!=='boolean'||typeof s.timeExpired!=='boolean'
  ||![s.nextCellId,s.sent,s.moves,s.rejected,s.lastBatch].every(int)||s.board?.cols!==5||s.board?.rows!==sky.rows||!Array.isArray(s.board.cells)||s.board.cells.length!==sky.rows||s.board.cells.some(row=>!Array.isArray(row)||row.length!==5)
  ||!int(s.board.rng?.s)||s.board.rng.s>4294967295||!spot(s.cursor)||(s.selected!==null&&!spot(s.selected))||!Array.isArray(s.pending)||!Array.isArray(s.flights)||!Array.isArray(s.crates)||s.crates.length!==4)throw Error('Incomplete Milk Match save; preserved for review.');
 const ids=new Set();for(const cell of s.board.cells.flat()){if(!cell||!['milk','special','crate','weighted','hole'].includes(cell.kind)||(['milk','special'].includes(cell.kind)&&flavourIndex(cell.flavour)<0)||(['crate','weighted'].includes(cell.kind)&&(!Number.isInteger(cell.hp)||cell.hp<1||cell.hp>2))||!int(cell.id)||ids.has(cell.id)||cell.id>=s.nextCellId)throw Error('Milk board needs attention.');ids.add(cell.id);}
 for(const p of [...s.pending,...s.flights])if(!int(p.flavour)||p.flavour>=4||![p.x,p.y,p.delay].every(finite)||p.delay<0)throw Error('Milk delivery needs attention.');
 for(const f of s.flights)if(!finite(f.age)||f.age<0||f.age>=.6||!int(f.slot)||f.slot>=CAPACITY)throw Error('Bottle flight needs attention.');
 for(const [i,c] of s.crates.entries()){
  if(!['open','closing','dispatch','arrive'].includes(c.phase)||![c.filled,c.reserved,c.completed].every(int)||c.filled>c.reserved||c.reserved>CAPACITY||!finite(c.age)||c.age<0||c.reserved-c.filled!==s.flights.filter(f=>f.flavour===i).length)throw Error('Crate fill needs attention.');
  const total=CAPACITY*c.completed+c.filled+s.flights.filter(f=>f.flavour===i).length+s.pending.filter(f=>f.flavour===i).length;
  if(total!==(s.board.collected[FLAVOURS[i].id]||0))throw Error('Milk counts need attention.');
 }
 if(s.sent!==s.crates.reduce((n,c)=>n+c.completed,0)||(['swap','burst','fall','reject'].includes(s.phase)&&(!s.anim||!spot(s.anim.a)||!spot(s.anim.b)||!Array.isArray(s.anim.before)))||(s.phase==='celebrate'&&(!finite(s.celebrateLeft)||!goalMet(s)))||(s.result?.won&&!goalMet(s)))throw Error('Round progress needs attention.');
 s.board=cloneBoard(s.board);return s;
}
