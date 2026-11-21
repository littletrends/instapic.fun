// Rosalie's six airflow courses. No DOM, wallet or network access.
export const FIELD={left:205,right:695,top:175,bottom:960};
export const FAN_FIELD={left:185,right:715,top:215,bottom:985};
export const START={x:450,y:900},RADIUS=24,GRAVITY=26,DRAG=1.65,FAN_RANGE=300,FAN_FORCE=400;
export const ROSETTES=[{x:300,y:805},{x:590,y:545},{x:300,y:325}];
export const GATES=[{x:450,y:680,gap:160,period:4.8,openFor:3.1,offset:.4},{x:450,y:460,gap:160,period:5.4,openFor:3.2,offset:1.9}];
export const BASKET={x:500,y:250,rx:43,mouthY:224,seatY:248,landingSeconds:.95};
export const HEART_WIDTH=70,HEART_HEIGHT=HEART_WIDTH*482/391;
const stairs=[{x:600,y:850},{x:300,y:645},{x:600,y:460},{x:300,y:290}];
const stairGates=[{x:450,y:735,gap:170,period:5.3,openFor:3.15,offset:.4},{x:450,y:555,gap:170,period:5.7,openFor:3.1,offset:1.8},{x:450,y:380,gap:170,period:5.5,openFor:3.1,offset:2.6}];
export const LEVELS=[
 {name:'A first little breeze',detail:'Three ribbons. Two gates. Fan a little heart home.',rosettes:ROSETTES,gates:GATES,basket:BASKET},
 {name:'Across the rose garden',detail:'Cross the garden. Find the offset openings.',rosettes:[{x:600,y:805},{x:310,y:545},{x:600,y:325}],gates:GATES.map((g,i)=>({...g,x:i?505:395,openFor:3})),basket:{...BASKET,x:440}},
 {name:'Waltzing gates',detail:'Follow the gently sliding openings.',rosettes:ROSETTES,gates:GATES.map((g,i)=>({...g,ax:42,rate:.52+i*.08,movePhase:i*2,openFor:3})),basket:BASKET},
 {name:'The ribbon staircase',detail:'Four ribbons. Three gates. Plan each flight.',rosettes:stairs,gates:stairGates.map((g,i)=>({...g,ax:28,rate:.5+i*.06,movePhase:i*2})),basket:BASKET},
 {name:'Petals in the crosswind',detail:'A changing breeze pushes across the garden.',rosettes:stairs,gates:stairGates.map((g,i)=>({...g,ax:36,rate:.55+i*.06,movePhase:i*2})),basket:BASKET,wind:16},
 {name:'Rosalie’s rose waltz',detail:'Sliding gates, crosswinds and a dancing basket.',rosettes:stairs,gates:stairGates.map((g,i)=>({...g,ax:42,rate:.58+i*.06,movePhase:i*2,openFor:2.9})),basket:{...BASKET,ax:30,rate:.45,rx:39},wind:24},
];
export const rules=s=>LEVELS[s.level];
export const rosettesFor=s=>rules(s).rosettes;
export const gatesFor=(s,t=s.t)=>rules(s).gates.map(g=>({...g,x:g.x+Math.sin(t*(g.rate||0)+(g.movePhase||0))*(g.ax||0)}));
export const basketFor=(s,t=s.t)=>{const b=rules(s).basket;return {...b,x:b.x+Math.sin(t*(b.rate||0))*(b.ax||0)};};
export const crosswind=(s,t=s.t)=>(rules(s).wind||0)*Math.sin(t*.8+.4)*(s.heart.y>330&&s.heart.y<890?1:0);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const gateOpen=(gate,t)=>((t+gate.offset)%gate.period)<gate.openFor;
export const blowing=s=>s.fan.held||s.fan.keyBlow;
// The fence's row of hearts is the crossing plane, independent of tall gate art.
export const gateSafeY=g=>g.y;
export function heartExtent(h){
 const c=Math.abs(Math.cos(h.angle||0)),s=Math.abs(Math.sin(h.angle||0));
 return {x:(HEART_WIDTH*c+HEART_HEIGHT*s)/2,y:(HEART_HEIGHT*c+HEART_WIDTH*s)/2};
}
export const gateCleared=(g,h)=>h.y+heartExtent(h).y<=gateSafeY(g);
export function gateCatches(g,h){
 const extent=heartExtent(h);
 return Math.abs(h.x-g.x)<75+extent.x&&h.y+extent.y>gateSafeY(g)&&h.y-extent.y<g.y;
}
export function makeState(level=0){
 if(!Number.isInteger(level)||!LEVELS[level])throw Error('Choose a Heart on the Breeze chapter from 1 to 6.');
 return {v:3,level,t:0,houseLeft:100,phase:'play',started:false,
 heart:{...START,vx:0,vy:0,angle:0},fan:{x:450,y:975,angle:-Math.PI/2,held:false,keyBlow:false},controls:{left:false,right:false,up:false,down:false},
 rosettes:LEVELS[level].rosettes.map(()=>false),passed:LEVELS[level].gates.map(()=>false),checkpoint:-1,resting:true,perchLeft:0,settle:0,returns:0,bumps:0,failures:0,failure:null,landing:null,basketArmed:false,touchingGate:null,returning:null,trail:[],sparks:[],gateFlash:null,
 note:LEVELS[level].detail,chapterPrize:null,prizeKept:false,result:null,rewardReveal:null};}
export function moveFan(s,p){s.fan.x=clamp(p.x,FAN_FIELD.left,FAN_FIELD.right);s.fan.y=clamp(p.y,FAN_FIELD.top,FAN_FIELD.bottom);}
export function setFan(s,on){if(s.phase!=='play'||s.result)return;s.fan.held=!!on;if(on)s.started=true;}
export function cancel(s){s.fan.held=false;s.fan.keyBlow=false;for(const k of Object.keys(s.controls))s.controls[k]=false;}
export function key(s,k,down){
 const dir={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down'}[k];
 if(dir){s.controls[dir]=down;return true;}if(k===' '){s.fan.keyBlow=down;if(down)s.started=true;return true;}return false;
}
export function airflow(s){
 const dx=s.heart.x-s.fan.x,dy=s.heart.y-s.fan.y,d=Math.hypot(dx,dy),angle=d>1?Math.atan2(dy,dx):s.fan.angle;
 const strength=blowing(s)?FAN_FORCE*Math.max(0,1-d/FAN_RANGE)**2:0;
 return {x:Math.cos(angle)*strength,y:Math.sin(angle)*strength,angle,distance:d,strength};
}
function comeHome(s){
 s.phase='return';s.returning={x:s.heart.x,y:s.heart.y,t:0};s.returns++;s.heart.vx=0;s.heart.vy=0;s.settle=0;s.trail=[];cancel(s);
 s.note='A soft return to your last ribbon. Every rosette you reached stays collected.';
}
function caughtInGate(s,id){
 s.phase='failed';s.failures++;s.failure={id,x:s.heart.x,y:s.heart.y,t:0};s.heart.vx=0;s.heart.vy=0;s.settle=0;s.basketArmed=false;s.trail=[];cancel(s);
 s.note='The gate closed on the heart. This attempt restarts from the bottom.';
}
function restartAttempt(s){
 const retained={practice:s.practice,chapterPrize:s.chapterPrize,prizeId:s.prizeId,prizeKept:s.prizeKept,failures:s.failures};
 const fresh=makeState(s.level);for(const k of Object.keys(s))delete s[k];Object.assign(s,fresh,retained);
 s.note='Back at the start. Wait for a clear opening before the next flight.';
}
function tick(s,dt){
 const previousTime=s.t;s.t+=dt;s.perchLeft=Math.max(0,s.perchLeft-dt);
 for(const p of s.sparks)p.t+=dt;s.sparks=s.sparks.filter(p=>p.t<1.2);
 if(s.gateFlash){s.gateFlash.t+=dt;if(s.gateFlash.t>1)s.gateFlash=null;}
 const h=s.heart,ROSETTES=rosettesFor(s),GATES=gatesFor(s),BASKET=basketFor(s);
 if(s.phase==='failed'){s.failure.t+=dt;if(s.failure.t>=1.05)restartAttempt(s);return;}
 if(s.phase==='landing'){
  const a=s.landing;a.t+=dt;const u=Math.min(1,a.t/BASKET.landingSeconds),e=u*u*(3-2*u);
  h.x=a.x+(BASKET.x-a.x)*e;h.y=a.y+(BASKET.seatY-a.y)*e;h.angle=a.angle*(1-e);
  if(u===1){s.phase='celebrate';s.celebrateLeft=2.5;s.note='The heart has landed in its rose basket.';}return;
 }
 if(s.phase==='return'){
  const to=s.checkpoint>=0?ROSETTES[s.checkpoint]:START;s.returning.t+=dt;
  const u=Math.min(1,s.returning.t/.95),e=u*u*(3-2*u);h.x=s.returning.x+(to.x-s.returning.x)*e;h.y=s.returning.y+(to.y-s.returning.y)*e;h.angle*=Math.exp(-5*dt);
  if(u===1){s.returning=null;s.phase='play';s.resting=true;s.perchLeft=.45;s.note='Resting on a ribbon. Place the fan for your next little flight.';}return;
 }
 if(s.phase==='celebrate'){s.celebrateLeft-=dt;h.x+=(BASKET.x-h.x)*Math.min(1,dt*6);h.y+=(BASKET.seatY-h.y)*Math.min(1,dt*6);h.angle*=Math.exp(-6*dt);return;}
 if(s.phase!=='play')return;
 const c=s.controls,fx=Number(c.right)-Number(c.left),fy=Number(c.down)-Number(c.up),fn=Math.hypot(fx,fy);
 if(fn)moveFan(s,{x:s.fan.x+fx/fn*240*dt,y:s.fan.y+fy/fn*240*dt});
 const air=airflow(s);s.fan.angle=air.angle;
 if(s.resting&&air.strength>3&&s.perchLeft<=0)s.resting=false;
 if(s.resting)return;
 const previous={x:h.x,y:h.y,angle:h.angle};
 h.vx+=(air.x+crosswind(s)-DRAG*h.vx)*dt;h.vy+=(GRAVITY+air.y-DRAG*h.vy)*dt;
 const speed=Math.hypot(h.vx,h.vy);if(speed>170){h.vx*=170/speed;h.vy*=170/speed;}
 h.x+=h.vx*dt;h.y+=h.vy*dt;h.angle+=(clamp(h.vx/250,-.35,.35)-h.angle)*Math.min(1,dt*6);
 if(h.x<FIELD.left+RADIUS){h.x=FIELD.left+RADIUS;h.vx=Math.abs(h.vx)*.28;}
 if(h.x>FIELD.right-RADIUS){h.x=FIELD.right-RADIUS;h.vx=-Math.abs(h.vx)*.28;}
 if(h.y<FIELD.top+RADIUS){h.y=FIELD.top+RADIUS;h.vy=Math.abs(h.vy)*.2;}
 for(let i=0;i<GATES.length;i++){
  const g=GATES[i],extent=heartExtent(h),gap=gateOpen(g,s.t)&&Math.abs(h.x-g.x)<g.gap/2-extent.x;
  if(gateOpen(g,previousTime)&&!gateOpen(g,s.t)&&gateCatches(g,h)){caughtInGate(s,i);return;}
  if(!gap&&Math.abs(h.y-g.y)<extent.y){
   const side=previous.y>=g.y?1:-1;h.y=g.y+side*extent.y;h.vy=side*Math.abs(h.vy)*.28;
   if(s.touchingGate!==i){s.bumps++;s.gateFlash={id:i,t:0};s.note=gateOpen(g,s.t)?'Bring the heart to the middle opening.':'The gate is resting. Wait for its open window.';}
   s.touchingGate=i;
  }
  if(gap&&!gateCleared(g,previous)&&gateCleared(g,h)){s.passed[i]=true;s.gateFlash={id:i,t:0};}
 }
 if(s.touchingGate!==null&&Math.abs(h.y-GATES[s.touchingGate].y)>RADIUS+6)s.touchingGate=null;
 const next=s.rosettes.indexOf(false);
 if(next>=0&&Math.hypot(h.x-ROSETTES[next].x,h.y-ROSETTES[next].y)<43){
  s.rosettes[next]=true;s.checkpoint=next;s.resting=true;s.perchLeft=.45;h.x=ROSETTES[next].x;h.y=ROSETTES[next].y;h.vx=0;h.vy=0;s.trail=[];s.sparks.push({...ROSETTES[next],t:0});
  s.note=next===ROSETTES.length-1?'Every ribbon reached. Ease the heart into the rose basket.':`Ribbon ${next+1} reached. Rest here, then find the next opening.`;
 }
 const home=s.checkpoint>=0?ROSETTES[s.checkpoint]:START;
 if(h.y>Math.min(FIELD.bottom-RADIUS,home.y+180)){comeHome(s);return;}
 const ready=s.rosettes.every(Boolean)&&s.passed.every(Boolean);
 if(ready&&Math.abs(h.x-BASKET.x)<BASKET.rx+25&&h.y<BASKET.mouthY-8)s.basketArmed=true;
 if(Math.abs(h.x-BASKET.x)>BASKET.rx+45||h.y>BASKET.mouthY+20)s.basketArmed=false;
 const inMouth=Math.abs(h.x-BASKET.x)<BASKET.rx&&h.y>=BASKET.mouthY-4&&h.y<=BASKET.mouthY+14;
 if(ready&&s.basketArmed&&inMouth&&h.vy>=0&&Math.hypot(h.vx,h.vy)<85&&!blowing(s)){
  s.phase='landing';s.landing={x:h.x,y:h.y,angle:h.angle,t:0};h.vx=0;h.vy=0;cancel(s);s.trail=[];s.note='The heart is dropping into the basket…';
 }
 s.trail.push({x:h.x,y:h.y});if(s.trail.length>36)s.trail.shift();
}
export function step(s,dt){
 if(s.result||!Number.isFinite(dt)||dt<=0)return;let left=Math.min(.05,dt);
 while(left>1e-8){const h=Math.min(1/120,left);tick(s,h);left-=h;}
}
export function snapshot(s){const b=JSON.parse(JSON.stringify(s));b.fan.held=false;b.fan.keyBlow=false;for(const k of Object.keys(b.controls))b.controls[k]=false;delete b.saveError;return b;}
export function restore(blob,level=blob?.level??0){
 if(!blob||![1,2,3].includes(blob.v)||!Number.isInteger(level)||!LEVELS[level]||blob.level!==level||(blob.v<3&&level!==0))throw Error('Unknown Heart on the Breeze save; preserved for review.');
 const s=snapshot(blob),finite=n=>typeof n==='number'&&Number.isFinite(n);
 if(s.v===1){s.v=2;s.failure=null;s.failures=0;s.landing=null;s.basketArmed=false;}
 s.v=3;const ROSETTES=rosettesFor(s),GATES=gatesFor(s);
 if(!['play','return','failed','landing','celebrate','result'].includes(s.phase)||!finite(s.t)||s.t<0||!finite(s.houseLeft)||s.houseLeft<0||s.houseLeft>100
  ||![s.heart?.x,s.heart?.y,s.heart?.vx,s.heart?.vy,s.heart?.angle,s.fan?.x,s.fan?.y,s.fan?.angle].every(finite)
  ||s.fan.x<FAN_FIELD.left||s.fan.x>FAN_FIELD.right||s.fan.y<FAN_FIELD.top||s.fan.y>FAN_FIELD.bottom
  ||!Array.isArray(s.rosettes)||s.rosettes.length!==ROSETTES.length||s.rosettes.some((v,i)=>typeof v!=='boolean'||(v&&i>0&&!s.rosettes[i-1]))
  ||!Array.isArray(s.passed)||s.passed.length!==GATES.length||s.passed.some(v=>typeof v!=='boolean')
  ||!Number.isInteger(s.checkpoint)||s.checkpoint!==s.rosettes.filter(Boolean).length-1||!finite(s.perchLeft)||s.perchLeft<0||!finite(s.settle)||s.settle<0
  ||![s.returns,s.bumps,s.failures].every(n=>Number.isInteger(n)&&n>=0)||typeof s.resting!=='boolean'||typeof s.basketArmed!=='boolean'
  ||!Array.isArray(s.trail)||s.trail.length>36||s.trail.some(p=>![p.x,p.y].every(finite))
  ||!Array.isArray(s.sparks)||s.sparks.some(p=>![p.x,p.y,p.t].every(finite))
  ||(s.touchingGate!==null&&(!Number.isInteger(s.touchingGate)||!GATES[s.touchingGate]))
  ||(s.gateFlash&&(!Number.isInteger(s.gateFlash.id)||!GATES[s.gateFlash.id]||!finite(s.gateFlash.t)))
  ||(s.phase==='return'&&![s.returning?.x,s.returning?.y,s.returning?.t].every(finite))
  ||(s.phase==='failed'&&(!Number.isInteger(s.failure?.id)||!GATES[s.failure.id]||![s.failure.x,s.failure.y,s.failure.t].every(finite)))
  ||(s.phase==='landing'&&(![s.landing?.x,s.landing?.y,s.landing?.angle,s.landing?.t].every(finite)||!s.rosettes.every(Boolean)||!s.passed.every(Boolean)))
  ||(s.phase==='celebrate'&&(!finite(s.celebrateLeft)||!s.rosettes.every(Boolean)||!s.passed.every(Boolean))))throw Error('Invalid Heart on the Breeze save; preserved for review.');
 return s;
}
