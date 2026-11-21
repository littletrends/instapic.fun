import * as legacy from './penny-pitch-skip-legacy.js';
import {base,copy,remember,undo as rewind,validate,clamp,ease} from './study-state.js?v=studies-six-1';
export {ORIGIN,LEFT,RIGHT,GRAVITY,dishPose,windAt,beginAim,moveAim,endAim,beginPower,movePower,endPower,beginCharge,endCharge,aimValue,powerValue,aimAt,powerAt} from './penny-pitch-skip-legacy.js';
export const ARENA={left:220,right:680,top:342,bottom:900},LAUNCH={x:450,y:863},STEP=1/240,COIN_R=11;
const pocket=(id,x,y,r=29)=>({id,x,y,r}),rail=(x1,y1,x2,y2,r=9)=>({x1,y1,x2,y2,r});
const trio=()=>[pocket('rose',290,407),pocket('moon',450,373),pocket('star',610,407)];
const four=()=>[...trio(),pocket('crown',590,554,27)];
const PARLOUR_LEVELS=[
 {name:'The brass bank shots',coins:5,pockets:trio(),need:[1,1,1],banks:1,rails:[rail(375,618,525,618)],bumpers:[],detail:'Fill all three pockets. At least one captured penny must rebound first.'},
 {name:'Round the velvet cushions',coins:6,pockets:four(),need:[1,1,1,1],banks:2,rails:[rail(347,623,510,623)],bumpers:[{x:573,y:696,r:25}],detail:'Four pockets, two bank shots. Use the brass bumper to change your route.'},
 {name:'The collector’s order',coins:7,pockets:trio(),order:[0,2,1,0],need:[0,0,0],banks:2,rails:[rail(362,625,537,625),rail(265,490,345,490)],bumpers:[],detail:'ROSE, STAR, MOON, ROSE in that order. Bank two of the captures.'},
 {name:'The moving brass arm',coins:7,pockets:trio(),need:[1,2,1],banks:3,rails:[{...rail(345,606,555,606),swing:.55,rate:.8}],bumpers:[{x:300,y:697,r:22}],detail:'Four captures, three banks. The arm moves while you aim: choose your moment.'},
 {name:'Four pockets after dark',coins:8,pockets:four(),order:[1,0,3,2,1],need:[0,0,0,0],banks:3,rails:[{...rail(351,621,549,621),swing:.48,rate:.7},rail(245,504,332,504)],bumpers:[{x:578,y:718,r:24}],detail:'MOON, ROSE, CROWN, STAR, MOON. Bank three and keep a coin for the last moon.'},
 {name:'Penelope’s penny parlour',coins:9,pockets:four(),order:[0,1,3,2,0,1],need:[0,0,0,0],banks:4,rails:[{...rail(349,628,551,628),swing:.5,rate:.77},{...rail(349,499,501,499),swing:.35,rate:1.07,phase:1.6}],bumpers:[{x:583,y:730,r:24}],detail:'Six ordered captures, four bank shots. Two moving arms share the centre.'},
];
// Schema 3: direct-touch ripples on Penelope's existing water scene.
export const LEVELS=Array.from({length:6},(_,level)=>({
 name:['A wish on the water','The ribbon crossing','Around the stepping stones','The current changes','A winding wish trail','Penelope’s wishing waters'][level],
 taps:14+level*3,flow:level*4,ordered:level>=3,
 wishes:[{x:450,y:800},{x:340,y:690},{x:525,y:580},...(level>0?[{x:360,y:470}]:[]),...(level>2?[{x:535,y:370}]:[])],
 rocks:level>=2?[{x:455,y:645,r:27},...(level>=4?[{x:455,y:425,r:27}]:[])]:[],
 goal:{x:450,y:270},detail:'Tap behind the wishing penny to push it away with a ripple. Gather every ribbon, then float into the arch. No separate launch button.'
}));
const WATER_SAMPLE={...LEVELS[0],taps:8,wishes:[{x:450,y:795}],goal:{x:450,y:270},flow:0};
function waterRules(s){return s.demo===true?WATER_SAMPLE:LEVELS[s.level];}
function waterState(level=0){const r=LEVELS[level];if(!r)throw Error('Choose a Wishing Waters chapter from 1 to 6.');return {...base('wishing-waters',r.detail,level),schema:3,clock:0,accum:0,remaining:r.taps,coin:{x:450,y:920,vx:0,vy:0,spin:0},wishes:r.wishes.map(()=>false),ripples:[],motion:null,trail:[]};}
export function ripple(s,p){
 if(s.schema!==3||s.result||s.saveError||s.phase!=='play'||s.remaining<1||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<170||p.x>730||p.y<220||p.y>1005)return false;
 const dx=s.coin.x-p.x,dy=s.coin.y-p.y,len=Math.hypot(dx,dy);if(len<8){s.note='Tap beside the penny, on the side opposite the way you want it to float.';return false;}
 remember(s);const speed=Math.min(600,len*8);s.coin.vx=dx/len*speed;s.coin.vy=dy/len*speed;s.remaining--;s.moves++;s.ripples.push({x:p.x,y:p.y,t:0});s.phase='moving';s.motion={kind:'ripple'};s.note='The ripple pushes the penny away. Watch its path through the water.';return true;
}
function waterTick(s){
 const r=waterRules(s),b=s.coin;s.clock+=STEP;for(const q of s.ripples)q.t+=STEP;s.ripples=s.ripples.filter(q=>q.t<1.2);
 if(s.motion?.kind==='well'){
  s.motion.t=Math.min(.7,s.motion.t+STEP);const u=ease(s.motion.t/.7);b.x=s.motion.from.x+(r.goal.x-s.motion.from.x)*u;b.y=s.motion.from.y+(r.goal.y-s.motion.from.y)*u;
  if(s.motion.t===.7){s.motion=null;s.phase='celebrate';s.pendingPennies=3+s.level;s.note='Every ribbon gathered. The wishing penny reached the arch!';}return;
 }
 if(s.phase!=='moving')return;
 b.vx=(b.vx+Math.sin(s.clock*1.7+b.y*.01)*r.flow*STEP)*Math.exp(-3*STEP);b.vy*=Math.exp(-3*STEP);b.x+=b.vx*STEP;b.y+=b.vy*STEP;b.spin+=b.vx*STEP*.02;
 if(b.x<210||b.x>690){b.x=clamp(b.x,210,690);b.vx*=-.65;}
 if(b.y<240||b.y>950){b.y=clamp(b.y,240,950);b.vy*=-.65;}
 for(const q of r.rocks){const dx=b.x-q.x,dy=b.y-q.y,d=Math.hypot(dx,dy),rr=q.r+15;if(d<rr){const nx=d?dx/d:1,ny=d?dy/d:0;b.x=q.x+nx*rr;b.y=q.y+ny*rr;const dot=b.vx*nx+b.vy*ny;if(dot<0){b.vx-=1.6*dot*nx;b.vy-=1.6*dot*ny;}}}
 for(let i=0;i<r.wishes.length;i++)if(!s.wishes[i]&&(!r.ordered||s.wishes.slice(0,i).every(Boolean))&&Math.hypot(b.x-r.wishes[i].x,b.y-r.wishes[i].y)<33){s.wishes[i]=true;s.note='Ribbon '+(i+1)+' gathered. '+(s.wishes.every(Boolean)?'Now float to the arch at the top.':'Choose the next ripple.');}
 if(s.wishes.every(Boolean)&&Math.hypot(b.x-r.goal.x,b.y-r.goal.y)<30){b.vx=0;b.vy=0;s.motion={kind:'well',t:0,from:{x:b.x,y:b.y}};return;}
 if(Math.hypot(b.vx,b.vy)<8){b.vx=0;b.vy=0;s.motion=null;s.phase='play';if(!s.remaining){s.phase='result';s.result={won:false,title:'The water settles',detail:'The wish trail is unfinished. Undo earlier or retry with fresh ripples.',prize:null,settle:true};}else s.note='Tap behind the penny to push toward '+(s.wishes.every(Boolean)?'the top arch.':'the next ribbon.');}
}
function stepWater(s,dt){if(s.result||s.phase==='celebrate'||!Number.isFinite(dt)||dt<=0)return;s.t+=dt;s.accum+=Math.min(dt,.05);while(s.accum+1e-10>=STEP&&s.phase!=='celebrate'){s.accum=Math.max(0,s.accum-STEP);waterTick(s);}if(s.phase==='celebrate')s.accum=0;}
function restoreWater(blob,level){const bad=validate(blob,'wishing-waters');if(blob.demo===true||blob.v!==2||blob.schema!==3||blob.level!==level||!LEVELS[level])bad();const s=snapshot(blob),r=waterRules(s),fin=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
 if(!Number.isInteger(s.remaining)||s.remaining<0||s.remaining>r.taps||!fin(s.clock,0,1e7)||!fin(s.accum,0,.051)||!s.coin||!fin(s.coin.x,200,700)||!fin(s.coin.y,230,960)||!['vx','vy','spin'].every(k=>Number.isFinite(s.coin[k]))||!Array.isArray(s.wishes)||s.wishes.length!==r.wishes.length||s.wishes.some(v=>typeof v!=='boolean')||!Array.isArray(s.ripples)||s.ripples.length>r.taps||s.ripples.some(p=>![p.x,p.y,p.t].every(Number.isFinite))||!Array.isArray(s.trail)||s.moves!==r.taps-s.remaining)bad();
 if((s.phase==='moving')!==!!s.motion||s.motion&&!['ripple','well'].includes(s.motion.kind)||s.motion?.kind==='well'&&(!fin(s.motion.t,0,.7)||![s.motion.from?.x,s.motion.from?.y].every(Number.isFinite))||(s.phase==='celebrate'||s.result?.won)&&(!s.wishes.every(Boolean)||Math.hypot(s.coin.x-r.goal.x,s.coin.y-r.goal.y)>1))bad();
 s.history=s.history.map(h=>{const t=restoreWater({...h,history:[]},level);delete t.history;return t;});return s;
}
const SAMPLE={name:'One little bank shot',coins:2,pockets:[pocket('moon',450,425,36)],need:[1],banks:0,rails:[],bumpers:[],detail:'Aim at one moon pocket and let the penny settle.'};
export const isLegacy=s=>s?.schema===1;
export const rules=s=>typeof s==='number'?LEVELS[s]:isLegacy(s)?legacy.rules(s):s?.schema===3?waterRules(s):s?.demo===true?SAMPLE:PARLOUR_LEVELS[s.level];
function makeParlourState(level=0){const r=PARLOUR_LEVELS[level];if(!r)throw Error('Choose a Penny Parlour chapter from 1 to 6.');return {...base('penny-parlour',r.detail,level),schema:2,aim:0,power:48,throws:0,remaining:r.coins,counts:r.pockets.map(()=>0),orderAt:0,banked:0,shots:[],coin:null,motion:null,stageTime:0,accum:0,flash:r.pockets.map(()=>0)};}
export const makeState=(level=0)=>waterState(level);
export function makeSampleState(){const s=waterState(0);s.demo=true;s.remaining=WATER_SAMPLE.taps;s.wishes=[false];return s;}
export function snapshot(s){if(isLegacy(s))return legacy.snapshot(s);const out=copy(s);for(const k of['pointerDown','saveError','aimDrag','powerDrag','charge'])delete out[k];return out;}
export function undo(s){return isLegacy(s)?legacy.undo(s):rewind(s);}
export function setAim(s,a){if(isLegacy(s))return legacy.setAim(s,a);if(s.phase!=='play'||!Number.isFinite(a))return false;s.aim=clamp(Math.round(a*2)/2,-78,78);return true;}
export function setPower(s,p){if(isLegacy(s))return legacy.setPower(s,p);if(s.phase!=='play'||!Number.isFinite(p))return false;s.power=clamp(Math.round(p),20,100);return true;}
export function railPose(s,p){if(!p.swing)return p;const cx=(p.x1+p.x2)/2,cy=(p.y1+p.y2)/2,len=Math.hypot(p.x2-p.x1,p.y2-p.y1)/2,a=Math.sin(s.stageTime*(p.rate||.8)+(p.phase||0))*p.swing;return {...p,x1:cx-Math.cos(a)*len,y1:cy-Math.sin(a)*len,x2:cx+Math.cos(a)*len,y2:cy+Math.sin(a)*len};}
export function shoot(s){
 if(isLegacy(s))return legacy.shoot(s);if(s.phase!=='play'||s.result||s.remaining<1)return false;remember(s);const a=s.aim*Math.PI/180,v=250+s.power*5.5;s.throws++;s.remaining--;s.moves++;s.coin={id:s.throws,x:LAUNCH.x,y:LAUNCH.y,vx:Math.sin(a)*v,vy:-Math.cos(a)*v,spin:0,banks:0,age:0,lastHit:'',hitCooldown:0,alpha:1};s.motion={kind:'roll'};s.phase='moving';s.accum=0;s.note='Penny away. Read its rebounds, then wait for the pocket.';return true;
}
export const goal=s=>s.schema===3?s.wishes.every(Boolean)&&Math.hypot(s.coin.x-waterRules(s).goal.x,s.coin.y-waterRules(s).goal.y)<1:isLegacy(s)?legacy.goal(s):(()=>{const r=rules(s);return (r.order?s.orderAt===r.order.length:r.need.every((n,i)=>s.counts[i]>=n))&&s.banked>=r.banks;})();
function endShot(s,pocketIndex=-1){
 const r=rules(s),b=s.coin,correct=pocketIndex>=0&&(!r.order||r.order[s.orderAt]===pocketIndex);
 if(correct){s.counts[pocketIndex]++;if(r.order)s.orderAt++;if(b.banks>0)s.banked++;s.flash[pocketIndex]=1;}
 s.shots.push({aim:s.aim,power:s.power,pocket:pocketIndex,correct,banks:b.banks,x:b.x,y:b.y,age:b.age});s.coin=null;s.motion=null;s.accum=0;
 if(goal(s)){s.phase='celebrate';s.pendingPennies=3+s.level;s.note='Every pocket is filled. Penelope opens the penny parlour!';}
 else if(!s.remaining){s.phase='result';s.result={title:'The last penny came to rest',detail:'The pocket order or bank shots are unfinished. Retry refills your coins; Undo a shot before the last one settles.',won:false,prize:null,settle:true};}
 else{s.phase='play';s.note=pocketIndex<0?'The penny stopped short. Adjust strength or try another rail.':!correct?'That pocket is out of order. Your earlier captures stay.':r.order?'Next pocket: '+r.pockets[r.order[s.orderAt]??0].id.toUpperCase()+'. '+Math.max(0,r.banks-s.banked)+' bank shots still needed.':s.remaining+' pennies left. Fill the missing pockets; bank shots count only when captured.';}
}
function impact(s,nx,ny,penetration,id){const b=s.coin; b.x+=nx*Math.max(0,penetration);b.y+=ny*Math.max(0,penetration);const dot=b.vx*nx+b.vy*ny;if(dot<0){b.vx-=1.84*dot*nx;b.vy-=1.84*dot*ny;if(b.lastHit!==id||b.hitCooldown<=0){b.banks++;b.lastHit=id;b.hitCooldown=.1;}}}
function tick(s){
 const b=s.coin,r=rules(s);s.stageTime+=STEP;s.flash=s.flash.map(v=>Math.max(0,v-STEP));if(!b)return;b.age+=STEP;b.hitCooldown=Math.max(0,b.hitCooldown-STEP);
 if(s.motion.kind==='sink'){s.motion.t+=STEP;const u=Math.min(1,s.motion.t/.46),p=r.pockets[s.motion.pocket];b.x=s.motion.from.x+(p.x-s.motion.from.x)*ease(u);b.y=s.motion.from.y+(p.y-s.motion.from.y)*ease(u);b.alpha=1-u;b.spin+=STEP*11;if(u===1)endShot(s,s.motion.pocket);return;}
 const speed=Math.hypot(b.vx,b.vy),next=Math.max(0,speed-150*STEP),f=speed?next/speed:0;b.vx*=f;b.vy*=f;b.x+=b.vx*STEP;b.y+=b.vy*STEP;b.spin+=STEP*(next*.025+3);
 if(b.x<ARENA.left+COIN_R)impact(s,1,0,ARENA.left+COIN_R-b.x,'left');if(b.x>ARENA.right-COIN_R)impact(s,-1,0,b.x-ARENA.right+COIN_R,'right');if(b.y<ARENA.top+COIN_R)impact(s,0,1,ARENA.top+COIN_R-b.y,'top');if(b.y>ARENA.bottom-COIN_R)impact(s,0,-1,b.y-ARENA.bottom+COIN_R,'bottom');
 for(const [i,p]of r.rails.entries()){const q=railPose(s,p),dx=q.x2-q.x1,dy=q.y2-q.y1,l=dx*dx+dy*dy,u=clamp(((b.x-q.x1)*dx+(b.y-q.y1)*dy)/(l||1),0,1),x=q.x1+u*dx,y=q.y1+u*dy,d=Math.hypot(b.x-x,b.y-y),rr=q.r+COIN_R;if(d<rr){const nx=d?(b.x-x)/d:0,ny=d?(b.y-y)/d:1;impact(s,nx,ny,rr-d,'rail'+i);}}
 for(const [i,p]of r.bumpers.entries()){const dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy),rr=p.r+COIN_R;if(d<rr)impact(s,d?dx/d:1,d?dy/d:0,rr-d,'bumper'+i);}
 for(const [i,p]of r.pockets.entries())if(Math.hypot(b.x-p.x,b.y-p.y)<p.r-COIN_R*.45){s.motion={kind:'sink',pocket:i,t:0,from:{x:b.x,y:b.y}};b.vx=0;b.vy=0;s.note='The '+p.id.toUpperCase()+' pocket has the penny. Let it drop in.';return;}
 if(next<4||b.age>7)endShot(s);
}
export function step(s,dt){
 if(s.schema===3)return stepWater(s,dt);if(isLegacy(s))return legacy.step(s,dt);if(s.result||s.phase==='celebrate'||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.05,dt);s.t+=dt;
 if(s.phase==='moving'){s.accum+=dt;while(s.accum+1e-10>=STEP&&s.phase==='moving'){s.accum=Math.max(0,s.accum-STEP);tick(s);}}
 else{s.stageTime+=dt;s.flash=s.flash.map(v=>Math.max(0,v-dt));}
}
export function preview(s){if(isLegacy(s))return legacy.preview(s);const a=s.aim*Math.PI/180;return Array.from({length:6},(_,i)=>({x:LAUNCH.x+Math.sin(a)*(i+1)*16,y:LAUNCH.y-Math.cos(a)*(i+1)*16,z:0}));}
export function restore(blob,level=blob?.level){
 if(blob?.schema===3)return restoreWater(blob,level);if(blob?.schema===1)return legacy.restore(blob,level);const bad=validate(blob,'penny-parlour');if(blob.schema!==2||blob.demo===true||blob.level!==level||!LEVELS[level])bad();const s=snapshot(blob),r=rules(s),int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b,fin=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b;
 if(!fin(s.aim,-78,78)||!int(s.power,20,100)||!int(s.throws,0,r.coins)||!int(s.remaining,0,r.coins)||s.throws+s.remaining!==r.coins||!Array.isArray(s.counts)||s.counts.length!==r.pockets.length||s.counts.some(n=>!int(n,0,r.coins))||!int(s.orderAt,0,r.order?.length||0)||!int(s.banked,0,r.coins)||!Array.isArray(s.shots)||s.shots.length>s.throws||!fin(s.stageTime,0,100000)||!fin(s.accum,0,.051)||!Array.isArray(s.flash)||s.flash.length!==r.pockets.length||s.flash.some(v=>!fin(v,0,1)))bad();
 for(const p of s.shots)if(!int(p.pocket,-1,r.pockets.length-1)||typeof p.correct!=='boolean'||!int(p.banks,0,100)||![p.aim,p.power,p.x,p.y,p.age].every(Number.isFinite))bad();
 const counted=r.pockets.map((_,i)=>s.shots.filter(p=>p.correct&&p.pocket===i).length);if(counted.some((n,i)=>n!==s.counts[i])||s.banked!==s.shots.filter(p=>p.correct&&p.banks>0).length||(r.order&&s.orderAt!==s.shots.filter(p=>p.correct).length))bad();
 if((s.phase==='moving')!==!!s.coin||!!s.coin!==!!s.motion||s.shots.length!==s.throws-(s.coin?1:0))bad();
 if(s.coin){const b=s.coin;if(!int(b.id,1,r.coins)||b.id!==s.throws||!['x','y','vx','vy','spin','age','hitCooldown','alpha'].every(k=>Number.isFinite(b[k]))||!fin(b.x,ARENA.left-2,ARENA.right+2)||!fin(b.y,ARENA.top-2,ARENA.bottom+2)||!fin(b.age,0,7.6)||!int(b.banks,0,100)||!fin(b.alpha,0,1)||!['roll','sink'].includes(s.motion.kind))bad();if(s.motion.kind==='sink'&&(!int(s.motion.pocket,0,r.pockets.length-1)||!fin(s.motion.t,0,.47)||![s.motion.from?.x,s.motion.from?.y].every(Number.isFinite)))bad();}
 if((s.phase==='celebrate'||s.result?.won)&&!goal(s))bad();s.history=s.history.map(h=>{const state=restore({...h,history:[]},level);delete state.history;return state;});return copy(s);
}
