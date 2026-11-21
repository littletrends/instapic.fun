import {base,copy,remember,undo as rewind,validate,clamp} from './study-state.js?v=studies-six-1';
export const STEP=1/240,ORIGIN={x:450,y:916},LEFT=224,RIGHT=676,TOP=308,RADIUS=14,GRAVITY=360;
const cup=(id,x,y,value,r=42)=>({id,x,y,value,r});
const trio=()=>[cup('rose',340,505,20),cup('moon',450,400,40),cup('star',560,505,30)];
export const LEVELS=[
 {name:'Three lights on the lane',balls:5,cups:trio(),need:[1,1,1],banks:0,bumpers:[],detail:'Light ROSE, MOON and STAR once each. Five balls; three good rolls earn the curtain.'},
 {name:'A kiss from the rail',balls:6,cups:[cup('rose',310,505,20),cup('moon',450,385,40),cup('star',590,505,30)],need:[1,1,1],banks:1,bumpers:[],detail:'Fill all three pockets, including one scoring roll that touches a side rail first.'},
 {name:'Around the little sun',balls:7,cups:[cup('rose',325,525,20),cup('moon',450,465,40),cup('star',575,525,30),cup('crown',340,360,50,38)],need:[1,1,1,1],banks:0,bumpers:[{x:505,y:650,r:27}],detail:'Four different pockets. The little SUN bumper guards the right approach: aim around it or bank.'},
 {name:'The moonrise ribbon',balls:7,cups:trio(),need:[0,0,0],order:[0,1,2,1],banks:0,bumpers:[],detail:'Follow the ribbon: ROSE, MOON, STAR, MOON. A wrong pocket scores but does not advance the ribbon.'},
 {name:'Two silver banks',balls:7,cups:[cup('rose',325,515,20),cup('moon',450,390,40),cup('star',575,515,30)],need:[1,2,1],banks:2,bumpers:[{x:495,y:650,r:24}],detail:'ROSE once, STAR once, MOON twice; two scoring rolls must bank from a side rail.'},
 {name:'Skip’s grand constellation',balls:8,cups:[cup('rose',320,525,20),cup('moon',450,465,40),cup('star',580,525,30),cup('crown',340,360,50,38)],need:[0,0,0,0],order:[0,2,1,3,0],banks:2,bumpers:[{x:365,y:660,r:23},{x:535,y:660,r:23}],detail:'ROSE, STAR, MOON, CROWN, ROSE in order. Include two scoring rail banks. Eight balls, five precise captures.'},
];
export const rules=s=>LEVELS[typeof s==='number'?s:s.level];
export function makeState(level=0){const r=rules(level);if(!r)throw Error('Choose a Moonbow chapter from 1 to 6.');return {...base('moonbow-play',r.detail,level),schema:1,aim:0,power:55,throws:0,remaining:r.balls,score:0,counts:r.cups.map(()=>0),orderAt:0,bankedShots:0,shots:[],ball:null,motion:null,accum:0,physicalTime:0,flash:r.cups.map(()=>0)};}
export function snapshot(s){const out=copy(s);delete out.rollDrag;delete out.pointerDown;delete out.saveError;delete out.aimDrag;delete out.charge;delete out.powerDrag;return out;}
export function undo(s){delete s.rollDrag;delete s.charge;delete s.aimDrag;delete s.powerDrag;return rewind(s);}
export function setAim(s,a){if(s.phase!=='play'||!Number.isFinite(a))return false;s.aim=clamp(Math.round(a*2)/2,-60,60);return true;}
export function setPower(s,p){if(s.phase!=='play'||!Number.isFinite(p))return false;s.power=clamp(Math.round(p),20,100);return true;}
export const aimAt=p=>clamp(Math.atan2(p.x-ORIGIN.x,ORIGIN.y-p.y)*180/Math.PI,-60,60);
export const aimValue=s=>s.aimDrag?Math.round(s.aimDrag.value*2)/2:s.aim;
export const powerValue=s=>s.charge?Math.round(s.charge.value):s.powerDrag?Math.round(s.powerDrag.value):s.power;
export const powerAt=p=>clamp(20+(p.x-280)/410*80,20,100);
export function beginPower(s,p){if(s.phase!=='play'||s.result||s.charge)return false;s.powerDrag={value:powerAt(p)};return true;}
export function movePower(s,p){if(s.powerDrag)s.powerDrag.value=powerAt(p);}
export function endPower(s,commit){if(!s.powerDrag)return false;if(commit)setPower(s,s.powerDrag.value);delete s.powerDrag;return true;}
export function beginAim(s,p){if(s.phase!=='play'||s.result||s.charge)return false;s.aimDrag={value:aimAt(p)};return true;}
export function moveAim(s,p){if(s.aimDrag)s.aimDrag.value=aimAt(p);}
export function endAim(s,commit){if(!s.aimDrag)return false;if(commit)setAim(s,s.aimDrag.value);delete s.aimDrag;return true;}
export function beginCharge(s){if(s.phase!=='play'||s.result||s.charge)return false;endAim(s,true);s.charge={start:s.power,value:s.power,elapsed:0};return true;}
export function endCharge(s,commit){if(!s.charge)return false;const p=s.charge.value;delete s.charge;if(commit){setPower(s,p);return shoot(s);}return true;}
export function shoot(s){if(s.phase!=='play'||s.result||!s.remaining)return false;endAim(s,true);endPower(s,true);delete s.charge;remember(s);const a=s.aim*Math.PI/180,v=350+s.power*6;s.throws++;s.remaining--;s.moves++;s.ball={id:s.throws,x:ORIGIN.x,y:ORIGIN.y,vx:Math.sin(a)*v,vy:-Math.cos(a)*v,r:RADIUS,spin:0,mode:'rolling',banks:0,bounces:0,cup:null,t:0,from:null};s.accum=0;s.phase='moving';s.motion={kind:'roll'};s.note='Ball rolling. A gentle approach lets the pocket catch it.';return true;}
export const goal=s=>{const r=rules(s);return (r.order?s.orderAt===r.order.length:r.need.every((n,i)=>s.counts[i]>=n))&&s.bankedShots>=r.banks;};
function finish(s){s.ball=null;s.motion=null;s.accum=0;if(goal(s)){s.phase='celebrate';s.pendingPennies=3+s.level;s.note='The constellation is complete. Skip rings the Moonbow bell!';}else if(!s.remaining){s.phase='result';s.result={won:false,title:'The last ball returned',detail:'The constellation is unfinished. Retry refills the tray; aim and strength both matter.',prize:null,settle:true};}else{s.phase='play';s.note=rules(s).order?(s.orderAt===rules(s).order.length?'Ribbon complete. Earn '+Math.max(0,rules(s).banks-s.bankedShots)+' more scoring rail banks. '+s.remaining+' balls remain.':'Next pocket: '+rules(s).cups[rules(s).order[s.orderAt]].id.toUpperCase()+'. '+s.remaining+' balls remain.'):s.remaining+' balls remain. Fill the missing pocket seals; a softer roll catches more gently.';}}
function reflect(b,nx,ny,restitution=.7){const dot=b.vx*nx+b.vy*ny;if(dot<0){b.vx-=(1+restitution)*dot*nx;b.vy-=(1+restitution)*dot*ny;return true;}return false;}
function physics(s){s.physicalTime+=STEP;s.flash=s.flash.map(v=>Math.max(0,v-STEP));const b=s.ball,r=rules(s);if(!b)return;
 if(b.mode==='rolling'){
  b.vy+=GRAVITY*STEP;b.vx*=.99965;b.x+=b.vx*STEP;b.y+=b.vy*STEP;b.spin+=Math.hypot(b.vx,b.vy)*STEP/RADIUS;
  if(b.x<LEFT+RADIUS){b.x=LEFT+RADIUS;if(b.vx<0){b.vx=-b.vx*.86;b.banks++;}}
  if(b.x>RIGHT-RADIUS){b.x=RIGHT-RADIUS;if(b.vx>0){b.vx=-b.vx*.86;b.banks++;}}
  if(b.y<TOP+RADIUS){b.y=TOP+RADIUS;b.vy=Math.abs(b.vy)*.65;}
  for(const p of r.bumpers){const dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy),rr=p.r+RADIUS;if(d<rr){const nx=d?dx/d:0,ny=d?dy/d:1;b.x=p.x+nx*(rr+.02);b.y=p.y+ny*(rr+.02);if(reflect(b,nx,ny,.72))b.bounces++;}}
  for(let i=0;i<r.cups.length;i++){const p=r.cups[i],dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy),speed=Math.hypot(b.vx,b.vy);
   if(d<p.r-7&&speed<=420){b.mode='sinking';b.cup=i;b.t=0;b.from={x:b.x,y:b.y};b.vx=0;b.vy=0;s.note=p.id.toUpperCase()+' pocket catches the roll. Let the ball settle.';break;}
   if(d<p.r+RADIUS*.35&&speed>420){const nx=d?dx/d:0,ny=d?dy/d:1;if(reflect(b,nx,ny,.45)){b.x=p.x+nx*(p.r+RADIUS*.35+.03);b.y=p.y+ny*(p.r+RADIUS*.35+.03);b.bounces++;}}
  }
  if(b.mode==='rolling'&&b.y>958){b.mode='returning';b.t=0;b.from={x:b.x,y:b.y};b.vx=0;b.vy=0;s.note='The lane returns this ball to the tray.';}
 }else{
  b.t=Math.min(.55,b.t+STEP);const u=b.t/.55,e=u*u*(3-2*u);if(b.mode==='sinking'){const p=r.cups[b.cup];b.x=b.from.x+(p.x-b.from.x)*e;b.y=b.from.y+(p.y-b.from.y)*e;}else{b.x=b.from.x+(450-b.from.x)*e;b.y=b.from.y+(988-b.from.y)*e;}
  if(b.t===.55){const pocket=b.cup;if(b.mode==='sinking'){s.counts[pocket]++;s.score+=r.cups[pocket].value;if(b.banks)s.bankedShots++;if(r.order&&r.order[s.orderAt]===pocket)s.orderAt++;s.flash[pocket]=.75;}s.shots.push({aim:s.aim,power:s.power,cup:pocket,banks:b.banks,bounces:b.bounces});finish(s);}
 }
}
export function step(s,dt){if(s.result||s.phase==='celebrate'||!Number.isFinite(dt)||dt<=0)return;s.t+=dt;if(s.charge){s.charge.elapsed+=dt;const v=(s.charge.start-20+s.charge.elapsed*40)%160;s.charge.value=20+(v<=80?v:160-v);}if(s.phase==='moving'){s.accum+=dt;while(s.accum+1e-10>=STEP&&s.phase==='moving'){s.accum=Math.max(0,s.accum-STEP);physics(s);}}else s.flash=s.flash.map(v=>Math.max(0,v-dt));}
export function preview(s){const a=aimValue(s)*Math.PI/180,v=350+powerValue(s)*6,points=[];for(let i=1;i<=8;i++){const t=i*.035;points.push({x:ORIGIN.x+Math.sin(a)*v*t,y:ORIGIN.y-Math.cos(a)*v*t+GRAVITY*t*t/2});}return points;}
export function restore(blob,level=blob?.level){const bad=validate(blob,'moonbow-play');if(blob.demo===true||blob.v!==2||blob.schema!==1||blob.level!==level||!rules(level))bad();const s=snapshot(blob),r=rules(s),int=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b,finite=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
 if(!finite(s.aim,-60,60)||!int(s.power,20,100)||!int(s.throws,0,r.balls)||!int(s.remaining,0,r.balls)||s.throws+s.remaining!==r.balls||!int(s.score,0,r.balls*50)||!Array.isArray(s.counts)||s.counts.length!==r.cups.length||s.counts.some(v=>!int(v,0,r.balls))||!int(s.orderAt,0,r.order?.length||0)||!int(s.bankedShots,0,r.balls)||!Array.isArray(s.shots)||s.shots.length>s.throws||!finite(s.accum,0,.051)||!finite(s.physicalTime,0,200)||!Array.isArray(s.flash)||s.flash.length!==r.cups.length||s.flash.some(v=>!finite(v,0,.75)))bad();
 if(s.ball){const b=s.ball;if(!int(b.id,1,r.balls)||b.id!==s.throws||b.r!==RADIUS||!['rolling','sinking','returning'].includes(b.mode)||![b.x,b.y,b.vx,b.vy,b.spin].every(Number.isFinite)||!finite(b.x,LEFT,RIGHT)||!finite(b.y,TOP,1000)||!finite(b.t,0,.55)||!int(b.banks,0,50)||!int(b.bounces,0,100)||(b.cup!==null&&!int(b.cup,0,r.cups.length-1))||b.mode==='sinking'&&b.cup===null||b.mode!=='rolling'&&(!b.from||![b.from.x,b.from.y].every(Number.isFinite)))bad();}
 if((s.phase==='moving')!==!!s.motion||!!s.motion!==!!s.ball||s.motion&&s.motion.kind!=='roll'||s.phase==='celebrate'&&!goal(s))bad();
 s.history=s.history.map(h=>{const p=restore({...h,history:[]},level);delete p.history;return p;});return copy(s);}
