// Pocket Heist: six tabletop vaults. Geometry and moving cover use saved time.
export const FIELD={left:185,right:715,top:255,bottom:955};
export const SPEED=165,BEETLE_RADIUS=21;
const firstCovers=[{x:280,y:900,r:57},{x:605,y:735,r:57},{x:290,y:555,r:57},{x:595,y:395,r:57}];
const firstKeys=[{x:450,y:880},{x:435,y:610},{x:445,y:470}];
const firstLamps=[
 {x:766,y:710,base:Math.PI,arc:.65,rate:.78,offset:.5,half:.20,range:660},
 {x:134,y:440,base:0,arc:.65,rate:.67,offset:2.2,half:.20,range:660},
];
const crossLamp={x:766,y:370,base:2.6,arc:.5,rate:.83,offset:1.4,half:.17,range:660,period:5.2,litFor:3.2,cycleOffset:1};
const lowLamp={x:134,y:800,base:-.58,arc:.5,rate:.71,offset:2.6,half:.17,range:650,period:5.5,litFor:3.3,cycleOffset:2.4};
const movingCovers=firstCovers.map((p,i)=>i===1?{...p,x:585,ax:35,rate:.6}:p);
export const LEVELS=[
 {name:'The first little heist',detail:'Three winding keys. One tiny vault.',covers:firstCovers,keys:firstKeys,lamps:firstLamps,pads:[],vault:{x:450,y:265,r:48}},
 {name:'Crossed watchlights',detail:'Three beams. Watch for the dark pause.',covers:firstCovers,keys:firstKeys,lamps:[...firstLamps,crossLamp],pads:[],vault:{x:450,y:265,r:48}},
 {name:'Wind the vault',detail:'Find four keys. Stop on the winding plate.',covers:firstCovers,keys:[...firstKeys,{x:235,y:355}],lamps:[...firstLamps,crossLamp],pads:[{x:440,y:745}],vault:{x:450,y:265,r:48}},
 {name:'Moving hideaways',detail:'Your middle dome moves. Shelter and ride.',covers:movingCovers,keys:[...firstKeys,{x:235,y:355}],lamps:[...firstLamps,crossLamp],pads:[{x:440,y:745}],vault:{x:450,y:265,r:48}},
 {name:'The double lock',detail:'Two winding plates. A timed vault door.',covers:movingCovers,keys:[...firstKeys,{x:235,y:355}],lamps:[...firstLamps,crossLamp,lowLamp],pads:[{x:440,y:745},{x:650,y:500}],vault:{x:450,y:265,r:48,period:5.2,openFor:2.8}},
 {name:'Digby’s midnight heist',detail:'Five keys. Moving cover. Time your escape.',covers:movingCovers.map((p,i)=>i===3?{...p,x:580,ax:32,ay:12,rate:.7}:p),keys:[...firstKeys,{x:235,y:355},{x:455,y:390}],lamps:[...firstLamps,{...crossLamp,litFor:3.5},lowLamp],pads:[{x:440,y:745},{x:650,y:500}],vault:{x:450,y:265,r:48,period:5.4,openFor:2.2}},
];
export const COVERS=LEVELS[0].covers,KEYS=LEVELS[0].keys,VAULT=LEVELS[0].vault,LAMPS=LEVELS[0].lamps;
export const rules=s=>LEVELS[s.level];
export const keysFor=s=>rules(s).keys;
export const lampsFor=s=>rules(s).lamps;
export const padsFor=s=>rules(s).pads;
export const vaultFor=s=>rules(s).vault;
export function coverPosition(s,i,t=s.t){const p=rules(s).covers[i];return {...p,x:p.x+Math.sin(t*(p.rate||.6))*(p.ax||0),y:p.y+Math.sin(t*.43)*(p.ay||0)};}
export const coversFor=(s,t=s.t)=>rules(s).covers.map((_,i)=>coverPosition(s,i,t));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const lampAngle=(lamp,t)=>lamp.base+Math.sin(t*lamp.rate+lamp.offset)*lamp.arc;
export const lampActive=(lamp,t)=>!lamp.period||((t+(lamp.cycleOffset||0))%lamp.period)<lamp.litFor;
export const angleDifference=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function coverAt(p,s=null,t=s?.t||0){return (s?coversFor(s,t):COVERS).findIndex(c=>Math.hypot(p.x-c.x,p.y-c.y)<=c.r-7);}
export function blocksRay(source,target,cover){
 const dx=target.x-source.x,dy=target.y-source.y,l2=dx*dx+dy*dy;
 if(!l2)return false;const u=((cover.x-source.x)*dx+(cover.y-source.y)*dy)/l2;
 return u>0&&u<1&&Math.hypot(source.x+u*dx-cover.x,source.y+u*dy-cover.y)<cover.r;
}
export function lampSees(lamp,p,t,covers=COVERS){
 const dx=p.x-lamp.x,dy=p.y-lamp.y,d=Math.hypot(dx,dy);
 if(!lampActive(lamp,t)||d>lamp.range||Math.abs(angleDifference(Math.atan2(dy,dx),lampAngle(lamp,t)))>lamp.half)return false;
 if(covers.some(c=>Math.hypot(p.x-c.x,p.y-c.y)<=c.r))return false;
 return !covers.some(c=>blocksRay(lamp,p,c));
}
export const visible=s=>lampsFor(s).some(lamp=>lampSees(lamp,s.beetle,s.t,coversFor(s)));
export const requirementsMet=s=>s.keys.every(Boolean)&&s.pads.every(Boolean);
export function vaultOpen(s,t=s.t){const v=vaultFor(s);return !v.period||(t%v.period)<v.openFor;}
export function makeState(level=0){
 if(!Number.isInteger(level)||!LEVELS[level])throw Error('Unknown Pocket Heist chapter.');
 const home=LEVELS[level].covers[0];
 return {v:2,level,t:0,houseLeft:100,phase:'play',started:false,
 beetle:{x:home.x,y:home.y,angle:0,walk:0},target:null,targetCover:null,held:false,controls:{up:false,down:false,left:false,right:false},
 safe:0,keys:LEVELS[level].keys.map(()=>false),pads:LEVELS[level].pads.map(()=>false),padWind:LEVELS[level].pads.map(()=>0),padFlash:null,
 exposure:0,spotted:0,recovery:null,grace:0,pickups:[],trail:[],note:LEVELS[level].detail,
 chapterPrize:null,prizeKept:false,result:null,rewardReveal:null};
}
export function walkTo(s,p){
 if(s.phase!=='play'||s.result)return false;
 s.target={x:clamp(p.x,FIELD.left,FIELD.right),y:clamp(p.y,FIELD.top,FIELD.bottom)};s.targetCover=null;s.started=true;return true;
}
export function walkToCover(s,i){
 if(!rules(s).covers[i]||!walkTo(s,coverPosition(s,i)))return false;s.targetCover=i;return true;
}
export function stop(s){s.target=null;s.targetCover=null;s.held=false;for(const k of Object.keys(s.controls))s.controls[k]=false;}
export function cancel(s){s.held=false;for(const k of Object.keys(s.controls))s.controls[k]=false;}
export function control(s,key,down){
 const dir={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'}[key];
 if(!dir||s.phase!=='play'||s.result)return false;
 s.controls[dir]=down;if(down){s.target=null;s.targetCover=null;s.started=true;}return true;
}
function caught(s){
 s.spotted++;s.phase='recover';s.recovery={x:s.beetle.x,y:s.beetle.y,t:0};s.exposure=0;stop(s);s.trail=[];
 s.note='Spotted! Back to your safe dome. Found keys and wound plates stay collected.';
}
function tick(s,dt){
 const previous=s.t,previousCover=coverAt(s.beetle,s,previous);s.t+=dt;s.grace=Math.max(0,s.grace-dt);
 for(const p of s.pickups)p.t+=dt;s.pickups=s.pickups.filter(p=>p.t<.85);
 if(s.padFlash){s.padFlash.t+=dt;if(s.padFlash.t>1)s.padFlash=null;}
 if(s.phase==='recover'){
  const home=coverPosition(s,s.safe);s.recovery.t+=dt;const u=Math.min(1,s.recovery.t/1.05),e=u*u*(3-2*u);
  s.beetle.x=s.recovery.x+(home.x-s.recovery.x)*e;s.beetle.y=s.recovery.y+(home.y-s.recovery.y)*e;
  if(u===1){s.phase='play';s.recovery=null;s.grace=1.1;s.note='Safe again. Watch the sweep before you move.';}return;
 }
 if(s.phase==='celebrate'){s.celebrateLeft-=dt;return;}
 if(s.phase!=='play')return;
 const b=s.beetle,c=s.controls,keyboard=Object.values(c).some(Boolean);
 // A stopped beetle rides its shelter; a queued dome tap follows the moving base.
 if(previousCover>=0&&!s.target&&!keyboard){
  const a=coverPosition(s,previousCover,previous),now=coverPosition(s,previousCover);b.x+=now.x-a.x;b.y+=now.y-a.y;
 }
 if(s.targetCover!==null){const p=coverPosition(s,s.targetCover);s.target={x:p.x,y:p.y};}
 let dx=Number(c.right)-Number(c.left),dy=Number(c.down)-Number(c.up);
 if(!dx&&!dy&&s.target){dx=s.target.x-b.x;dy=s.target.y-b.y;}
 const distance=Math.hypot(dx,dy);
 if(distance>.01){
  const step=keyboard?SPEED*dt:Math.min(SPEED*dt,distance);
  b.x=clamp(b.x+dx/distance*step,FIELD.left,FIELD.right);b.y=clamp(b.y+dy/distance*step,FIELD.top,FIELD.bottom);
  b.angle=Math.atan2(dy,dx)+Math.PI/2;b.walk+=step;
  if(!keyboard&&distance<=SPEED*dt){s.target=null;s.targetCover=null;}
  s.trail.push({x:b.x,y:b.y});if(s.trail.length>20)s.trail.shift();
 }
 if(distance<=.01&&s.target&&!keyboard){s.target=null;s.targetCover=null;}
 const covered=coverAt(b,s);
 if(covered>=0){
  if(s.safe!==covered){s.safe=covered;s.note='A safe dome. Your next return point is here.';}
  s.exposure=Math.max(0,s.exposure-dt*2.4);
 }else if(s.grace<=0&&visible(s)){
  s.exposure=Math.min(1,s.exposure+dt*1.8);if(s.exposure>=1){caught(s);return;}
 }else s.exposure=Math.max(0,s.exposure-dt*2.4);
 const keys=keysFor(s),pads=padsFor(s);
 for(let i=0;i<keys.length;i++)if(!s.keys[i]&&Math.hypot(b.x-keys[i].x,b.y-keys[i].y)<33){
  s.keys[i]=true;s.pickups.push({id:i,x:keys[i].x,y:keys[i].y,t:0});
  s.note=s.keys.every(Boolean)?(s.pads.every(Boolean)?'All keys found! Head for the vault.':'All keys found. Finish the winding plates.'):`${s.keys.filter(Boolean).length} winding keys found. Reach a safe dome.`;
 }
 for(let i=0;i<pads.length;i++)if(!s.pads[i]&&Math.hypot(b.x-pads[i].x,b.y-pads[i].y)<28&&!s.target&&!keyboard){
  s.padWind[i]=Math.min(1,s.padWind[i]+dt);
  s.note='Hold still on the plate to wind the lock.';
  if(s.padWind[i]>=1){s.pads[i]=true;s.padFlash={id:i,t:0};s.note='Winding plate ready. That lock stays wound.';}
 }
 const vault=vaultFor(s);
 if(requirementsMet(s)&&Math.hypot(b.x-vault.x,b.y-vault.y)<vault.r){
  if(vaultOpen(s)){s.phase='celebrate';s.celebrateLeft=2.5;stop(s);s.exposure=0;s.note='The vault opens. One tiny, triumphant heist.';}
  else s.note='The vault shutter is closed. Wait for its open window.';
 }
}
export function step(s,dt){
 if(s.result||!Number.isFinite(dt)||dt<=0)return;
 let left=Math.min(.05,dt);while(left>1e-8){const h=Math.min(1/120,left);tick(s,h);left-=h;}
}
export function snapshot(s){const b=JSON.parse(JSON.stringify(s));b.held=false;for(const k of Object.keys(b.controls))b.controls[k]=false;delete b.saveError;return b;}
export function restore(blob,level=blob?.level){
 if(!blob||![1,2].includes(blob.v)||blob.level!==level||!Number.isInteger(level)||!LEVELS[level]||(blob.v===1&&level!==0))throw Error('Unknown Pocket Heist save; preserved for review.');
 const s=snapshot(blob),finite=n=>typeof n==='number'&&Number.isFinite(n);
 if(s.v===1){s.v=2;s.targetCover=null;s.pads=[];s.padWind=[];s.padFlash=null;}
 if(!['play','recover','celebrate','result'].includes(s.phase)||!finite(s.t)||s.t<0||!finite(s.houseLeft)||s.houseLeft<0||s.houseLeft>100
  ||![s.beetle?.x,s.beetle?.y,s.beetle?.angle,s.beetle?.walk].every(finite)||s.beetle.x<FIELD.left||s.beetle.x>FIELD.right||s.beetle.y<FIELD.top||s.beetle.y>FIELD.bottom
  ||(s.target&&![s.target.x,s.target.y].every(finite))||!Number.isInteger(s.safe)||!rules(s).covers[s.safe]
  ||(s.targetCover!==null&&(!Number.isInteger(s.targetCover)||!rules(s).covers[s.targetCover]||!s.target))
  ||!Array.isArray(s.keys)||s.keys.length!==keysFor(s).length||s.keys.some(v=>typeof v!=='boolean')
  ||!Array.isArray(s.pads)||s.pads.length!==padsFor(s).length||s.pads.some(v=>typeof v!=='boolean')
  ||!Array.isArray(s.padWind)||s.padWind.length!==s.pads.length||s.padWind.some((v,i)=>!finite(v)||v<0||v>1||s.pads[i]!== (v===1))
  ||!finite(s.exposure)||s.exposure<0||s.exposure>1||!Number.isInteger(s.spotted)||s.spotted<0||!finite(s.grace)||s.grace<0
  ||!Array.isArray(s.trail)||s.trail.length>20||s.trail.some(p=>![p.x,p.y].every(finite))
  ||!Array.isArray(s.pickups)||s.pickups.some(p=>![p.x,p.y,p.t].every(finite)||!Number.isInteger(p.id)||!keysFor(s)[p.id])
  ||(s.padFlash&&(!Number.isInteger(s.padFlash.id)||!padsFor(s)[s.padFlash.id]||!finite(s.padFlash.t)))
  ||(s.phase==='recover'&&![s.recovery?.x,s.recovery?.y,s.recovery?.t].every(finite))
  ||(s.phase==='celebrate'&&(!finite(s.celebrateLeft)||!requirementsMet(s))))throw Error('Invalid Pocket Heist save; preserved for review.');
 return s;
}
