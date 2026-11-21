// Celeste's six skies. All motion is derived from saved simulation time.
export const SPEED=370,RADIUS=65,ORBIT_SPEED=1.12;
const n=(x,y,extra={})=>({x,y,...extra});
export const LEVELS=[
 {name:'Three little lights',detail:'Three hops. Find your rhythm.',speed:370,orbit:1.12,radius:65,catch:52,wind:0,
  nodes:[n(290,845),n(620,665),n(300,470,{ax:48,ay:12,rate:.78,yrate:.43}),n(555,280)]},
 {name:'Wandering stars',detail:'Four hops. Two cups wander across the sky.',speed:380,orbit:1.22,radius:60,catch:50,wind:0,
  nodes:[n(290,855),n(620,735,{ax:40,ay:10,rate:.8}),n(290,565),n(605,410,{ax:46,ay:14,rate:.96}),n(350,250)]},
 {name:'Moonlit windows',detail:'Moon gates open and close. Time your arrival.',speed:390,orbit:1.32,radius:58,catch:48,wind:0,
  nodes:[n(285,855),n(620,720,{gate:true}),n(290,550,{ax:48,ay:12,rate:.95}),n(610,400,{gate:true,ax:24,rate:.7}),n(350,250)]},
 {name:'The drifting sky',detail:'Five hops. A breeze bends every flight.',speed:400,orbit:1.42,radius:56,catch:46,wind:58,
  nodes:[n(290,855),n(610,755,{ax:38,rate:1.03}),n(280,625),n(620,505,{ax:42,ay:12,rate:1.1}),n(290,375,{gate:true}),n(565,245)]},
 {name:'Turning tides',detail:'Your orbit reverses at each new light.',speed:410,orbit:1.52,radius:54,catch:44,wind:70,reverse:true,
  nodes:[n(285,855),n(615,755,{gate:true}),n(290,625,{ax:40,ay:14,rate:1.12}),n(610,505,{ax:36,rate:1.22}),n(285,375,{gate:true}),n(565,245)]},
 {name:'Celeste’s constellation',detail:'Six hops. Bring every little light home.',speed:420,orbit:1.62,radius:52,catch:42,wind:84,reverse:true,
  nodes:[n(290,865),n(610,775,{ax:34,rate:1.18}),n(285,665,{gate:true}),n(610,555,{ax:43,ay:12,rate:1.28}),n(290,445,{gate:true,ax:28,rate:.92}),n(610,335,{ax:33,ay:10,rate:1.38}),n(350,235,{gate:true})]},
];
export const NODES=LEVELS[0].nodes;
const SAMPLE_SKY={...LEVELS[0],name:'One lamp, then the lantern',detail:'Cloudwheel to one lamp, then the lantern.',nodes:[n(290,820),n(620,610),n(330,350)]};
export const rules=s=>s?.demo===true?SAMPLE_SKY:LEVELS[typeof s==='number'?s:s.level];
export const totalHops=s=>rules(s).nodes.length-1;
export function nodePosition(index,t,level=0){
 const a=rules(level).nodes[index];
 return {x:a.x+Math.sin(t*(a.rate||.78))*(a.ax||0),y:a.y+Math.sin(t*(a.yrate||.43))*(a.ay||0)};
}
export function gateOpen(index,t,level){
 const a=rules(level).nodes[index],chapter=typeof level==='number'?level:level.level;
 const period=chapter===2?3.1:chapter===5?2.6:2.8,openFor=chapter===2?2.05:chapter===5?1.6:1.85;
 return !a.gate||((t+index*.83)%period)<openFor;
}
export const orbitDirection=s=>rules(s).reverse&&s.node%2?-1:1;
export const windAt=(s,t=s.t)=>Math.sin(t*.8+.5)*rules(s).wind;
export function makeState(level=0){
 if(!Number.isInteger(level)||!LEVELS[level])throw Error('Unknown Orbit Hop chapter.');
 const start=LEVELS[level].nodes[0];
 return {v:2,level,t:0,houseLeft:100,phase:'orbit',started:false,held:false,
  node:0,angle:-Math.PI*.5,star:{x:start.x,y:start.y-LEVELS[level].radius,vx:0,vy:0},trail:[],shots:0,misses:0,
  caught:LEVELS[level].nodes.map((_,i)=>i===0),catchFlash:0,returning:null,flightTime:0,
  note:LEVELS[level].detail,chapterPrize:null,prizeKept:false,result:null,rewardReveal:null};
}
export function makeSampleState(){
 const s=makeState(0);s.demo=true;const r=rules(s),start=r.nodes[0];
 s.star={x:start.x,y:start.y-r.radius,vx:0,vy:0};s.caught=r.nodes.map((_,i)=>i===0);s.note=r.detail;
 return s;
}
export function orbitStar(s){const p=nodePosition(s.node,s.t,s);return {x:p.x+Math.cos(s.angle)*rules(s).radius,y:p.y+Math.sin(s.angle)*rules(s).radius};}
export function direction(s){const sign=orbitDirection(s);return {x:-Math.sin(s.angle)*sign,y:Math.cos(s.angle)*sign};}
function moveComet(star,target,dt,s,t){
 const dx=target.x-star.x,dy=target.y-star.y,d=Math.hypot(dx,dy)||1;
 if(d<105){const pull=(105-d)*3;star.vx+=dx/d*pull*dt;star.vy+=dy/d*pull*dt;}
 star.vx+=windAt(s,t)*dt;star.vy+=9*dt;star.x+=star.vx*dt;star.y+=star.vy*dt;
}
const outside=p=>p.x<100||p.x>800||p.y<185||p.y>990;
export function aim(s){
 const from=orbitStar(s),dir=direction(s),star={...from,vx:dir.x*rules(s).speed,vy:dir.y*rules(s).speed};
 const index=Math.min(totalHops(s),s.node+1);let target=nodePosition(index,s.t,s),ready=false,contact=false;
 if(s.node===totalHops(s))return {from,dir,target,ready};
 // Predict the actual first contact, including wind, cup travel and moon gates.
 for(let i=1;i<=288;i++){
  const t=s.t+i/120;target=nodePosition(index,t,s);moveComet(star,target,1/120,s,t);
  const distance=Math.hypot(target.x-star.x,target.y-star.y);
  if(distance<rules(s).catch&&!contact){if(!gateOpen(index,t,s)||!gateOpen(index,t-.08,s)||!gateOpen(index,t+.08,s))break;contact=true;}
  if(contact&&distance<rules(s).catch-6){ready=true;break;}
  if(outside(star))break;
 }
 return {from,dir,target,ready};
}
export function hold(s){if(s.phase!=='orbit'||s.result)return false;s.held=true;s.started=true;return true;}
export function release(s){
 if(!s.held||s.phase!=='orbit'||s.result)return false;
 const p=orbitStar(s),dir=direction(s);s.held=false;s.phase='flight';s.flightTime=0;s.shots++;
 s.star={...p,vx:dir.x*rules(s).speed,vy:dir.y*rules(s).speed};s.trail=[];s.note='A little starlight takes flight.';return true;
}
export function cancel(s){s.held=false;}
function miss(s,closed=false){
 s.phase='return';s.misses++;s.held=false;
 s.returning={x:Math.max(110,Math.min(790,s.star.x)),y:Math.max(210,Math.min(990,s.star.y)),t:0};
 s.note=closed?'The moon gate was closed. Your caught lights stay lit.':'Nearly! Your star returns to the last cup. Your caught lights stay lit.';
}
function tick(s,dt){
 s.t+=dt;s.catchFlash=Math.max(0,s.catchFlash-dt);
 if(s.phase==='orbit'){
  s.angle+=(s.held?rules(s).orbit:.25)*orbitDirection(s)*dt;s.star={...s.star,...orbitStar(s),vx:0,vy:0};
 }else if(s.phase==='flight'){
  s.flightTime+=dt;const target=nodePosition(s.node+1,s.t,s);moveComet(s.star,target,dt,s,s.t);
  s.trail.push({x:s.star.x,y:s.star.y});if(s.trail.length>48)s.trail.shift();
  if(Math.hypot(target.x-s.star.x,target.y-s.star.y)<rules(s).catch){
   if(!gateOpen(s.node+1,s.t,s)){miss(s,true);return;}
   s.node++;s.caught[s.node]=true;s.catchFlash=1.3;s.trail=[];s.star={x:target.x,y:target.y,vx:0,vy:0};
   s.note=s.node===totalHops(s)?'All your lights connected!':rules(s).reverse?'Light caught. Your orbit now turns the other way.':`${s.node} lights caught. Find the next glowing cup.`;
   if(s.node===totalHops(s)){s.phase='celebrate';s.celebrateLeft=2.5;}else{s.phase='orbit';s.angle=-Math.PI;}
  }else if(s.flightTime>2.4||outside(s.star))miss(s);
 }else if(s.phase==='return'){
  s.returning.t+=dt;const u=Math.min(1,s.returning.t/.75),e=u*u*(3-2*u),p=orbitStar(s);
  s.star.x=s.returning.x+(p.x-s.returning.x)*e;s.star.y=s.returning.y+(p.y-s.returning.y)*e;
  if(u===1){s.phase='orbit';s.returning=null;s.trail=[];}
 }else if(s.phase==='celebrate')s.celebrateLeft-=dt;
}
export function step(s,dt){
 if(s.result||!Number.isFinite(dt)||dt<=0)return;
 let left=Math.min(.1,dt);while(left>1e-8){const h=Math.min(1/120,left);tick(s,h);left-=h;}
}
export function snapshot(s){const b=JSON.parse(JSON.stringify(s));b.held=false;delete b.saveError;return b;}
export function restore(blob,level=blob?.level){
 if(blob?.demo===true)throw Error('Disposable Orbit Hop sample is not a real save.');
 if(!blob||![1,2].includes(blob.v)||blob.level!==level||!Number.isInteger(level)||!LEVELS[level]||(blob.v===1&&level!==0))throw Error('Unknown Orbit Hop save; preserved for review.');
 const s=snapshot(blob),finite=n=>typeof n==='number'&&Number.isFinite(n);s.v=2;
 if(!['orbit','flight','return','celebrate','result'].includes(s.phase)||!finite(s.t)||s.t<0||!finite(s.houseLeft)||s.houseLeft<0||s.houseLeft>100
  ||!Number.isInteger(s.node)||s.node<0||s.node>totalHops(s)||!finite(s.angle)||![s.star?.x,s.star?.y,s.star?.vx,s.star?.vy].every(finite)
  ||!Array.isArray(s.caught)||s.caught.length!==rules(s).nodes.length||s.caught.some((v,i)=>v!==(i<=s.node))
  ||!Array.isArray(s.trail)||s.trail.length>48||s.trail.some(p=>![p.x,p.y].every(finite))
  ||!Number.isInteger(s.shots)||s.shots<0||!Number.isInteger(s.misses)||s.misses<0||s.misses>s.shots||!finite(s.catchFlash)||!finite(s.flightTime)
  ||(s.phase==='return'&&![s.returning?.x,s.returning?.y,s.returning?.t].every(finite))
  ||(s.phase==='celebrate'&&(!finite(s.celebrateLeft)||s.node!==totalHops(s)))
  ||(s.phase==='flight'&&s.node===totalHops(s)))throw Error('Invalid Orbit Hop save; preserved for review.');
 return s;
}
