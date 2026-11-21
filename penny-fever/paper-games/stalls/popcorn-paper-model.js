import {base,copy,undo as rewind,validate,clamp} from './study-state.js?v=studies-six-1';
export const STEP=1/240,GRAVITY=560,TRAY_TOP=805,BAG_TOP=925,FLOOR=960,LEFT=120,RIGHT=780;
const order=(units,side,flavour='warm')=>({units,side,flavour});
export const LEVELS=[
 {name:'Two warm paper bags',capacity:3,width:160,total:20,rate:.95,launch:190,wind:0,burnt:0,gold:0,seconds:42,spouts:1,orders:[order(3,'left'),order(3,'right')],detail:'Catch three warm pops, carry them LEFT and Serve. Then pack three more at RIGHT. Six real catches, two deliveries.'},
 {name:'A golden extra handful',capacity:4,width:154,total:26,rate:.86,launch:205,wind:0,burnt:0,gold:.16,seconds:48,spouts:1,orders:[order(3,'left'),order(4,'right'),order(3,'left')],detail:'Three bags; gold pops count as TWO portions but use one tray slot. Carry and brake at each marked bag.'},
 {name:'Keep the burnt bits out',capacity:3,width:148,total:34,rate:.78,launch:220,wind:0,burnt:.20,gold:.12,seconds:52,spouts:1,orders:[order(3,'left'),order(3,'right'),order(3,'left')],detail:'Dark burnt kernels spoil the whole handful in your tray and raise heat. Pack three bags before the kettle empties.'},
 {name:'Twin kettle supper rush',capacity:4,width:144,total:38,rate:.70,launch:235,wind:0,burnt:.12,gold:.14,seconds:55,spouts:2,orders:[order(4,'left'),order(4,'right'),order(4,'left')],detail:'Twin spouts send competing arcs. Plan which pops to chase, then deliver three four-portion bags.'},
 {name:'Butter on the breeze',capacity:4,width:138,total:42,rate:.65,launch:245,wind:60,burnt:.16,gold:.18,seconds:58,spouts:2,orders:[order(3,'left'),order(4,'right','gold'),order(3,'left','butter')],detail:'Breeze bends the arcs. The second bag needs GOLD and the third BUTTER. Shake one stored pop if the full tray lacks its ingredient.'},
 {name:'Poppy’s closing-time counter',capacity:4,width:132,total:54,rate:.56,launch:255,wind:82,burnt:.20,gold:.19,seconds:65,spouts:2,orders:[order(4,'left','gold'),order(4,'right'),order(4,'left','butter'),order(4,'right','gold')],detail:'Four bags, twin spouts and cross-breeze. Reserve gold and butter for their marked orders, avoid burnt heat, and brake before pouring.'},
];
const SAMPLE_LEVEL={...LEVELS[0],name:'One warm paper bag',total:1,seconds:20,orders:[order(1,'left')],detail:'Catch one warm pop, let it settle, and Serve at the LEFT bag.'};
export const rules=s=>s?.demo===true?SAMPLE_LEVEL:LEVELS[typeof s==='number'?s:s.level];
export const dockX=side=>side==='left'?205:695;
export const portions=s=>s.contents.reduce((n,p)=>n+(p.kind==='gold'?2:1),0);
export const currentOrder=s=>rules(s).orders[s.ordersDone]||null;
export function ready(s){const o=currentOrder(s);return !!o&&portions(s)>=o.units&&(o.flavour==='warm'||s.contents.some(p=>p.kind===o.flavour));}
function random(s){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296;}
export function makeState(level=0){const r=rules(level);if(!r)throw Error('Choose a Popcorn Counter chapter from 1 to 6.');return {...base('popcorn-play',r.detail,level),schema:1,running:false,clock:0,remaining:r.seconds,rng:(9811+level*6151)>>>0,spawned:0,spawnLeft:.15,kernels:[],contents:[],pouring:[],bag:null,ordersDone:0,deliveries:[],outcomes:[],caught:0,missed:0,burntCaught:0,heat:0,tray:{x:450,vx:0,target:450},accum:0,motion:null};}
export function makeSampleState(){const s=makeState(0);s.demo=true;s.remaining=SAMPLE_LEVEL.seconds;s.note=SAMPLE_LEVEL.detail;return s;}
export function snapshot(s){const out=copy(s);if(s.drag||s.held?.left||s.held?.right)out.tray.target=out.tray.x;for(const k of ['pointerDown','saveError','drag','held','pressed'])delete out[k];return out;}
function remember(s){const old=snapshot(s);delete old.history;s.history.push(old);if(s.history.length>36)s.history.shift();}
export function clearInput(s){if(s.drag||s.held?.left||s.held?.right)s.tray.target=s.tray.x;delete s.drag;delete s.held;delete s.pressed;}
export function undo(s){clearInput(s);return rewind(s);}
export function start(s){if(s.running||s.result||s.phase==='celebrate')return false;remember(s);s.running=true;s.motion={kind:'counter'};s.note='Kettle warm! Guide the tray under a real falling pop, then fill the current paper bag.';return true;}
export function setTarget(s,x,record=false){if(s.result||s.phase==='celebrate'||!Number.isFinite(x))return false;if(record)remember(s);s.tray.target=clamp(x,LEFT+rules(s).width/2,RIGHT-rules(s).width/2);return true;}
export function beginDrag(s,p){if(s.result||s.phase==='celebrate')return false;remember(s);s.drag={target:p.x};return true;}
export function moveDrag(s,p){if(s.drag)s.drag.target=p.x;}
export function endDrag(s,commit){if(!s.drag)return false;const x=s.drag.target;delete s.drag;if(commit)setTarget(s,x);else s.tray.target=s.tray.x;return true;}
export function hold(s,key,down){if(!['left','right'].includes(key))return;s.held??={left:false,right:false};s.held[key]=down;if(!down)s.tray.target=s.tray.x;}
export function shake(s){if(!s.running||s.result||!s.contents.length)return false;remember(s);const p=s.contents.pop();s.kernels.push({id:p.id,kind:p.kind,x:s.tray.x+p.x,y:TRAY_TOP+20,vx:s.tray.vx+(s.tray.x<450?-160:160),vy:-95,spin:p.spin,age:0,mode:'flight',rim:1,discarded:true,t:0});s.heat=Math.min(1,s.heat+.035);s.moves++;s.note='Last pop shaken out. One tray slot is free.';return true;}
export function serve(s){if(!s.running)return start(s);if(s.result||s.phase==='celebrate'||s.bag)return false;const o=currentOrder(s);if(!o){s.note='All bags packed. Let the last airborne pops settle.';return false;}if(!ready(s)){s.note='This bag needs '+o.units+' portions'+(o.flavour==='warm'?'':', including '+o.flavour.toUpperCase())+'. Fill or Shake the tray first.';return false;}if(Math.abs(s.tray.x-dockX(o.side))>45||Math.abs(s.tray.vx)>105){s.note='Carry the tray to '+o.side.toUpperCase()+' and let it slow, then Serve.';return false;}if(s.contents.some(p=>p.y<20||Math.abs(p.vy)>8)){s.note='Let the caught pops settle in the tray before pouring.';return false;}
 remember(s);const id=s.ordersDone,target=dockX(o.side),count=s.contents.length;s.bag={id,x:target,received:0,total:count,units:portions(s),flavour:o.flavour};for(const p of s.contents){const x=s.tray.x+p.x,y=TRAY_TOP+p.y,T=.48;s.pouring.push({id:p.id,kind:p.kind,x,y,vx:(target-x)/T,vy:(BAG_TOP-8-y-GRAVITY*T*T/2)/T,spin:p.spin,age:0});}s.contents=[];s.moves++;s.note='Pouring into '+o.side.toUpperCase()+'. Every pop must physically drop inside the bag.';return true;}
function spawn(s){const r=rules(s),id=++s.spawned,side=(id+s.level)%2?-1:1,x=r.spouts===2?(side<0?375:525):450,roll=random(s),kind=roll<r.burnt?'burnt':roll<r.burnt+r.gold?'gold':roll<r.burnt+r.gold+.24?'butter':'warm';s.kernels.push({id,kind,x:x+(random(s)-.5)*15,y:455,vx:side*(115+random(s)*105),vy:-r.launch-random(s)*55,spin:random(s)*6.28,age:0,mode:'flight',rim:0,discarded:false,t:0});}
function catchPop(s,p,landingX,trayX){
 p.mode='caught';p.t=0;
 if(p.kind==='burnt'){
  s.burntCaught++;
  s.heat=Math.min(1,s.heat+.31);
  s.note=s.contents.length?'Burnt pop spoiled the whole handful. Refill the tray for this bag.':'Burnt pop raised the heat. Let dark kernels pass.';
  s.contents.length=0;
  s.outcomes.push({id:p.id,outcome:'burnt',x:landingX,tray:trayX});
  return;
 }
 s.caught++;
 s.contents.push({id:p.id,kind:p.kind,x:clamp(landingX-trayX,-rules(s).width*.35,rules(s).width*.35),y:-3,vy:-32,spin:p.spin});
 s.heat=Math.max(0,s.heat-.035);
 s.outcomes.push({id:p.id,outcome:'caught',x:landingX,tray:trayX});
 s.note=ready(s)?'Bag portions ready. Carry them '+currentOrder(s).side.toUpperCase()+', slow down and pour.':'Caught! '+portions(s)+' portions in the tray.';
}
function fail(s,title,detail){s.running=false;s.motion=null;s.phase='result';s.result={won:false,title,detail,prize:null,settle:true};s.note=detail;}
function physics(s){const r=rules(s),previousTrayX=s.tray.x;s.clock+=STEP;const target=clamp(s.drag?.target??s.tray.target,LEFT+r.width/2,RIGHT-r.width/2),held=(s.held?.right?1:0)-(s.held?.left?1:0),desired=held?held*660:clamp((target-s.tray.x)*9,-660,660);s.tray.vx+=clamp(desired-s.tray.vx,-2600*STEP,2600*STEP);s.tray.x=clamp(s.tray.x+s.tray.vx*STEP,LEFT+r.width/2,RIGHT-r.width/2);if(s.tray.x===LEFT+r.width/2&&s.tray.vx<0||s.tray.x===RIGHT-r.width/2&&s.tray.vx>0)s.tray.vx=0;
 const goal=s.ordersDone===r.orders.length;s.heat=Math.max(0,s.heat-STEP*.017);if(!goal){s.remaining=Math.max(0,s.remaining-STEP);s.spawnLeft-=STEP;if(s.spawnLeft<=0&&s.spawned<r.total){spawn(s);s.spawnLeft+=r.rate;}}
 for(const p of s.kernels){if(p.mode!=='flight'){p.t+=STEP;continue;}const before=p.y,previousX=p.x;p.age+=STEP;p.vx+=Math.sin(s.clock*1.8+p.id*.9)*r.wind*STEP;p.vy+=GRAVITY*STEP;p.x+=p.vx*STEP;p.y+=p.vy*STEP;p.spin+=p.vx*STEP*.012;if(p.x<LEFT+12){p.x=LEFT+12;p.vx=Math.abs(p.vx)*.7;}if(p.x>RIGHT-12){p.x=RIGHT-12;p.vx=-Math.abs(p.vx)*.7;}
  const mouth=TRAY_TOP-12;
  if(!p.discarded&&p.vy>0&&before<mouth&&p.y>=mouth){
   const crossing=(mouth-before)/(p.y-before);
   const landingX=previousX+(p.x-previousX)*crossing,trayX=previousTrayX+(s.tray.x-previousTrayX)*crossing;
   const offset=landingX-trayX,full=s.contents.length>=r.capacity;
   if(Math.abs(offset)<=r.width/2-12&&(!full||p.kind==='burnt')){catchPop(s,p,landingX,trayX);continue;}
   if(Math.abs(offset)<r.width/2+10&&p.rim<1){p.rim++;p.y=TRAY_TOP-13;p.vy=-Math.abs(p.vy)*.29;p.vx+=Math.sign(offset||1)*100;s.note=full?'Tray full. Pour or shake out a pop to free a slot.':'Rim bounce. Line the tray up under the falling pop.';}
  }
  if(p.y>FLOOR){p.mode='miss';p.t=0;s.missed++;s.outcomes.push({id:p.id,outcome:'miss',x:p.x,tray:s.tray.x});}
 }s.kernels=s.kernels.filter(p=>p.mode==='flight'||p.t<.28);
 for(let i=0;i<s.contents.length;i++){const p=s.contents[i],slot=(i-(s.contents.length-1)/2)*26;p.x+=(slot-p.x)*Math.min(1,STEP*9);p.vy+=GRAVITY*STEP;p.y+=p.vy*STEP;if(p.y>=22){p.y=22;p.vy=-Math.abs(p.vy)*.18;if(Math.abs(p.vy)<8)p.vy=0;}}
 for(const p of s.pouring){const before=p.y;p.age+=STEP;p.vy+=GRAVITY*STEP;p.x+=p.vx*STEP;p.y+=p.vy*STEP;p.spin+=STEP*6;if(p.vy>0&&before+8<BAG_TOP&&p.y+8>=BAG_TOP){if(s.bag&&Math.abs(p.x-s.bag.x)<54){p.done=true;s.bag.received++;}else{p.done=true;s.missed++;}}}s.pouring=s.pouring.filter(p=>!p.done);
 if(s.bag&&!s.pouring.length){if(s.bag.received===s.bag.total){s.deliveries.push({...copy(s.bag),clock:s.clock});s.ordersDone++;s.note='Paper bag packed! '+(currentOrder(s)?'Next: '+currentOrder(s).side.toUpperCase()+', '+currentOrder(s).units+' portions'+(currentOrder(s).flavour==='warm'?'':' with '+currentOrder(s).flavour.toUpperCase())+'.':'Last bag packed. Let the last airborne pops settle.');}s.bag=null;}
 if(s.ordersDone===r.orders.length&&!s.pouring.length&&!s.kernels.length){s.phase='celebrate';s.running=false;s.motion=null;s.pendingPennies=3+s.level;s.note='Every paper bag is physically packed. Poppy rings the warm-kettle bell!';return;}
 if(s.ordersDone<r.orders.length){if(s.heat>=1)fail(s,'Too many burnt kernels','The tray got too hot. Retry is free; let dark kernels pass.');else if(s.remaining<=0)fail(s,'The kettle cooled','The orders are unfinished. Retry refills this local kettle.');else if(s.spawned===r.total&&!s.kernels.length&&!s.pouring.length&&!s.bag&&!ready(s))fail(s,'The finite kettle is empty','Not enough portions remain for the orders. Retry and choose which arcs to catch.');}
}
export function step(s,dt){if(!s.running||s.result||s.phase==='celebrate'||!Number.isFinite(dt)||dt<=0)return;s.t+=dt;s.accum+=dt;while(s.accum+1e-10>=STEP&&!s.result&&s.phase!=='celebrate'){s.accum=Math.max(0,s.accum-STEP);physics(s);}if(s.result||s.phase==='celebrate')s.accum=0;}
export function restore(blob,level=blob?.level){const bad=validate(blob,'popcorn-play');if(blob.demo===true||blob.v!==2||blob.schema!==1||blob.level!==level||!rules(level))bad();const s=snapshot(blob),r=rules(s),int=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b,finite=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
 if(typeof s.running!=='boolean'||!finite(s.clock,0,1e9)||!finite(s.remaining,0,r.seconds)||!int(s.rng,0,4294967295)||!int(s.spawned,0,r.total)||!finite(s.spawnLeft,-r.seconds,r.rate)||!Array.isArray(s.kernels)||!Array.isArray(s.contents)||s.contents.length>r.capacity||!Array.isArray(s.pouring)||!Array.isArray(s.deliveries)||!Array.isArray(s.outcomes)||!int(s.ordersDone,0,r.orders.length)||s.deliveries.length!==s.ordersDone||!int(s.caught,0,r.total)||!int(s.missed,0,r.total*3)||!int(s.burntCaught,0,r.total)||!finite(s.heat,0,1)||!finite(s.accum,0,.051)||!s.tray||!finite(s.tray.x,LEFT+r.width/2,RIGHT-r.width/2)||!finite(s.tray.target,LEFT+r.width/2,RIGHT-r.width/2)||!finite(s.tray.vx,-660,660))bad();
 for(const p of s.kernels){if(!int(p.id,1,r.total)||!['warm','butter','gold','burnt'].includes(p.kind)||!['flight','caught','miss'].includes(p.mode)||![p.x,p.y,p.vx,p.vy,p.spin,p.age,p.t].every(Number.isFinite)||!int(p.rim,0,1)||typeof p.discarded!=='boolean')bad();}
 for(const p of s.contents)if(!int(p.id,1,r.total)||!['warm','butter','gold'].includes(p.kind)||![p.x,p.y,p.vy,p.spin].every(Number.isFinite))bad();for(const p of s.pouring)if(!int(p.id,1,r.total)||![p.x,p.y,p.vx,p.vy,p.spin,p.age].every(Number.isFinite))bad();if(s.bag&&(!int(s.bag.id,0,r.orders.length-1)||!int(s.bag.received,0,r.capacity)||!int(s.bag.total,1,r.capacity)))bad();
 if(s.phase==='celebrate'&&(s.ordersDone!==r.orders.length||s.kernels.length||s.pouring.length)||s.phase==='play'&&!!s.motion!==s.running)bad();s.history=s.history.map(h=>{const p=restore({...h,history:[]},level);delete p.history;return p;});return copy(s);}
