// Six illustrated pinball worlds. Pennies here are local preview counters only.
export const R=12,FLIP=142,REST=.42,UP=-.58;
export const LANE={x:780,y:980,pull:65},CUP={x:448,y:337,r:30};
const seg=(a,b)=>({a:{x:a[0],y:a[1]},b:{x:b[0],y:b[1]}});
export const RAILS=[
 seg([150,310],[150,765]),seg([150,765],[195,1110]),
 seg([150,310],[182,269]),seg([182,269],[690,269]),
 seg([690,240],[825,375]),seg([825,375],[825,1105]),
 seg([741,1105],[825,1105]),seg([741,426],[741,1105]),seg([741,426],[710,470]),
 seg([710,470],[710,765]),seg([710,765],[710,1110]),
 seg([230,855],[249,960]),seg([230,855],[230,1105]),
 seg([665,855],[645,960]),seg([665,855],[665,1105]),
];
export const GATE=seg([709,426],[749,426]);
export const SHOOTER_GATE=seg([741,265],[741,426]);
export const WIDE_RAILS=[
 seg([80,310],[80,765]),seg([80,765],[145,1110]),
 seg([80,310],[112,269]),seg([112,269],[690,269]),
 seg([690,240],[825,375]),seg([825,375],[825,1105]),
 seg([741,1105],[825,1105]),seg([741,426],[741,1105]),
 seg([230,855],[249,960]),seg([230,855],[230,1105]),
 seg([665,855],[645,960]),seg([665,855],[665,1105]),
];
export const railsFor=s=>s.layoutVersion>=3?WIDE_RAILS:RAILS;
export const scoopFor=s=>rules(s).side?{x:150,y:590,r:25}:{x:665,y:650,r:25};
export const SPINNER={x:435,y:585,half:37};
export const SLINGS=[
 {a:{x:249,y:745},b:{x:291,y:870},c:{x:249,y:870},kick:{x:145,y:-260}},
 {a:{x:646,y:745},b:{x:604,y:870},c:{x:646,y:870},kick:{x:-145,y:-260}},
];
export const FLOWERS=[{x:326,y:480,r:39},{x:565,y:516,r:39},{x:443,y:666,r:41}];
export const POSTS=[{x:270,y:709,r:9},{x:624,y:709,r:9}];
const copy=v=>JSON.parse(JSON.stringify(v));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const LEVELS=[
 {id:'paper',name:'Pop-up Fairground',hits:1,ramps:0,cup:34,side:0,flowers:[[335,495,38],[555,540,38],[445,695,40]],gate:0},
 {id:'storybook',name:'Storybook Night',hits:1,ramps:1,cup:32,side:1,flowers:[[340,530,38],[560,480,38],[450,675,40]],gate:0},
 {id:'print',name:'Printed Arcade',hits:2,ramps:1,cup:30,side:0,flowers:[[300,490,36],[565,555,36],[410,710,38]],gate:0},
 {id:'clay',name:'Candy Clay Carnival',hits:2,ramps:2,cup:29,side:1,flowers:[[350,515,40],[550,565,40],[430,700,38]],gate:0},
 {id:'wood',name:'Clockwork Toybox',hits:2,ramps:2,cup:28,side:0,flowers:[[310,540,36],[560,485,36],[480,695,36]],gate:3.5},
 {id:'glass',name:'Stained-Light Finale',hits:3,ramps:3,cup:27,side:1,flowers:[[325,520,35],[560,570,35],[430,715,36]],gate:2.8},
];
export const rules=s=>s.layoutVersion===1?{...LEVELS[0],cup:CUP.r}:LEVELS[typeof s==='number'?s:s.level];
export const flowersFor=s=>s.layoutVersion===1?FLOWERS:rules(s).flowers.map(([x,y,r])=>({x,y,r}));
export const goalMet=s=>s.flowers.every(b=>b.hits>=rules(s).hits)&&s.rampCount>=rules(s).ramps;
export const gateOpen=s=>!rules(s).gate||(s.t%5)<rules(s).gate;
export function rampPoint(s,u){const side=rules(s).side,points=[[270,850],[150,650],[180,325],[565,405]],v=1-u;let x=v*v*v*points[0][0]+3*v*v*u*points[1][0]+3*v*u*u*points[2][0]+u*u*u*points[3][0];const y=v*v*v*points[0][1]+3*v*v*u*points[1][1]+3*v*u*u*points[2][1]+u*u*u*points[3][1];return{x:side?900-x:x,y};}
export function makeState(level=0,run=1){if(!Number.isInteger(level)||!LEVELS[level])throw Error('Choose a pinball chapter from 1 to 6.');return {v:4,layoutVersion:3,level,run,go:1,roundWon:false,t:0,mode:'lane',ball:{x:LANE.x,y:LANE.y,vx:0,vy:0},charge:0,charging:false,dragPlunge:false,touches:{},left:false,right:false,
 flippers:[{x:285,y:978,a:REST,w:0},{x:612,y:978,a:Math.PI-REST,w:0}],flowers:FLOWERS.map(()=>({lit:false,hits:0,cool:0,flash:0})),
 slingCool:[0,0],rolls:[false,false,false],ballsLeft:3,ballNumber:0,activeBall:false,score:0,hits:0,drains:0,phaseTime:0,trail:[],sparks:[],cupOpen:false,
 ramp:null,rampCount:0,rampFlash:0,rampGrace:0,nudgeAt:0,nudges:0,pendingPennies:0,paidPennies:0,pennyAt:0,pennyFlights:[],
 shooterReleased:false,hold:null,scoopCool:0,scoopArmed:true,scoopVisits:0,spinnerAngle:0,spinnerSpeed:0,spinnerTravel:0,spinnerTurns:0,spinnerCool:0,kickbackReady:true,kickFlash:0,kickSide:0,kickbacks:0,slingHits:0,finishFlash:0,toysReadyAt:0,
 capture:null,result:null,chapterPrize:null,prizeKept:false,rewardReveal:null,note:'Pull the spring. Light the bumpers, ride the ramp, then find the top pocket.'};}
export function continueGo(state){const s=snapshot(state);s.go++;s.ballsLeft=3;s.ballNumber=0;s.drains=0;s.result=null;s.capture=null;s.ramp=null;s.hold=null;s.activeBall=false;s.shooterReleased=false;s.kickbackReady=true;s.phaseTime=0;setLane(s);s.note='Three fresh balls. Your chapter targets and pending pennies stay.';return s;}
export function penny(s,x,y,amount=1){const n=Math.min(amount,20-s.pendingPennies-s.paidPennies);if(n<=0)return;s.pendingPennies+=n;for(let i=0;i<n;i++)s.pennyFlights.push({x,y,age:0,delay:i*.09});}
export function nudge(s){if(s.mode!=='live'||s.saveError||s.t<s.nudgeAt)return false;s.ball.vx+=(450-s.ball.x)*.7;s.ball.vy-=170;s.nudgeAt=s.t+2;s.nudges++;return true;}
export const canPull=s=>s.mode==='lane'&&!s.result&&!s.saveError;
export function cancel(s){s.touches={};s.left=false;s.right=false;s.charging=false;s.dragPlunge=false;s.charge=0;if(s.mode==='lane'){s.ball.x=LANE.x;s.ball.y=LANE.y;}}
export function pull(s){if(!canPull(s))return false;s.charging=true;return true;}
export function launch(s){
 if(!canPull(s)||!s.charging)return false;
 if(!s.activeBall){if(s.ballsLeft<=0)return false;s.ballsLeft--;s.ballNumber++;s.activeBall=true;s.kickbackReady=true;}
 s.shooterReleased=false;
 s.ball={x:LANE.x,y:LANE.y+s.charge*LANE.pull,vx:0,vy:-(780+s.charge*520)};s.mode='live';s.charge=0;s.charging=false;s.dragPlunge=false;s.trail=[];
 s.note=s.roundWon?'Reward Collected! Keep playing for points.':s.cupOpen?'Targets complete! Shoot the top pocket.':'Keep it alive. Work the bumpers and the raised ramp.';return true;
}
export function setLane(s){s.mode='lane';s.ball={x:LANE.x,y:LANE.y,vx:0,vy:0};s.charge=0;s.charging=false;s.trail=[];}
function drain(s){
 s.activeBall=false;s.drains++;s.mode='drain';s.phaseTime=0;s.trail=[];s.charging=false;s.charge=0;
 s.note=s.ballsLeft?`Ball drained. ${s.ballsLeft} ${s.ballsLeft===1?'ball':'balls'} left — your lit flowers stay.`:'Three balls down. Give the table another go.';
}
export function tip(f){return {x:f.x+Math.cos(f.a)*FLIP,y:f.y+Math.sin(f.a)*FLIP};}
export function collide(p,a,b,r=R,omega=0,pivot=a,restitution=.78){
 const dx=b.x-a.x,dy=b.y-a.y,u=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1),q={x:a.x+dx*u,y:a.y+dy*u};
 let nx=p.x-q.x,ny=p.y-q.y,d=Math.hypot(nx,ny);const skin=r+3;
 if(d>=skin)return false;if(d<1e-8){const l=Math.hypot(dx,dy)||1;nx=-dy/l;ny=dx/l;d=1;}else{nx/=d;ny/=d;}
 p.x=q.x+nx*(skin+.15);p.y=q.y+ny*(skin+.15);
 const vx=-omega*(q.y-pivot.y),vy=omega*(q.x-pivot.x),vn=(p.vx-vx)*nx+(p.vy-vy)*ny;
 if(vn<0){p.vx-=(1+restitution)*vn*nx;p.vy-=(1+restitution)*vn*ny;}return true;
}
function bounce(p,b,kick){
 let dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy);if(d>=b.r+R)return false;
 if(d<1e-8){dx=0;dy=1;d=1;}const nx=dx/d,ny=dy/d;p.x=b.x+nx*(b.r+R+.15);p.y=b.y+ny*(b.r+R+.15);
 const v=Math.max(kick,Math.hypot(p.vx,p.vy)*.93);p.vx=nx*v;p.vy=ny*v;return true;
}
function moveFlippers(s,h,left,right){for(let i=0;i<2;i++){const f=s.flippers[i],rest=i?Math.PI-REST:REST,up=i?Math.PI-UP:UP,target=(i?right:left)?up:rest,change=clamp(target-f.a,-17*h,17*h);f.w=change/h;f.a+=change;}}
function endRound(s){s.mode='result';s.result={title:s.roundWon?'Three balls played':'Three balls down',detail:s.roundWon?'Reward Collected. All three balls have been played.':'Play again for three fresh balls. Your chapter targets and pending pennies stay.',won:s.roundWon,prize:null,settle:true};}
export function step(s,dt,input={}){
 if(s.result||s.saveError||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.05,dt);s.t+=dt;
 s.rampFlash=Math.max(0,s.rampFlash-dt);s.rampGrace=Math.max(0,s.rampGrace-dt);s.pennyFlights=s.pennyFlights.filter(p=>(p.age+=dt)<.95+p.delay);
 s.scoopCool=Math.max(0,s.scoopCool-dt);s.spinnerCool=Math.max(0,s.spinnerCool-dt);s.kickFlash=Math.max(0,s.kickFlash-dt);s.finishFlash=Math.max(0,s.finishFlash-dt);
 if(s.layoutVersion>=3){
  const turn=s.spinnerSpeed*dt;s.spinnerAngle+=turn;s.spinnerTravel+=Math.abs(turn);s.spinnerSpeed*=Math.exp(-.85*dt);
  const turns=Math.floor(s.spinnerTravel/(Math.PI*2));if(turns>s.spinnerTurns){if(s.mode!=='celebrate'){s.score+=(turns-s.spinnerTurns)*100;if(s.t>=s.pennyAt){penny(s,SPINNER.x,SPINNER.y);s.pennyAt=s.t+2.8;}}s.spinnerTurns=turns;}
 }
 for(const b of s.flowers){b.cool=Math.max(0,b.cool-dt);b.flash=Math.max(0,b.flash-dt);}
 s.slingCool=s.slingCool.map(t=>Math.max(0,t-dt));s.sparks=s.sparks.filter(p=>(p.age+=dt)<.65);
 const keys=input.keys||new Set(),actions=input.actions||new Set();
 const left=s.left||keys.has('z')||keys.has('Z')||keys.has('ArrowLeft')||actions.has('left');
 const right=s.right||keys.has('x')||keys.has('X')||keys.has('ArrowRight')||actions.has('right');
 const holding=Object.values(s.touches).includes('plunge')||keys.has(' ')||actions.has('plunge');
 if(canPull(s)){if(holding&&!s.charging)pull(s);if(s.charging){if(holding&&!s.dragPlunge)s.charge=clamp(s.charge+dt*.95,0,1);s.ball.y=LANE.y+s.charge*LANE.pull;if(!holding)launch(s);}}
 if(s.mode==='drain'){s.phaseTime+=dt;if(s.phaseTime>=1.1){if(s.ballsLeft)setLane(s);else endRound(s);}}
 if(s.mode==='hold'){
  moveFlippers(s,dt,left,right);
  const cup=s.hold;cup.left=Math.max(0,cup.left-dt);s.ball.x=cup.x;s.ball.y=cup.y+Math.sin((1-cup.left/.85)*Math.PI)*3;s.ball.vx=0;s.ball.vy=0;
  if(cup.left<=0){const stroke=s.scoopVisits%5;s.ball.x=cup.x+cup.direction*34;s.ball.y=cup.y+31;s.ball.vx=(cup.direction>0?178:-109)+[0,-22,24,-11,13][stroke];s.ball.vy=(cup.direction>0?185:247)+[0,12,-15,6,-8][stroke];s.mode='live';s.hold=null;s.scoopCool=2;s.score+=250;penny(s,cup.x,cup.y);s.note='KICK-OUT! Back to the flippers.';}return;
 }
 if(s.mode==='ramp'){
  moveFlippers(s,dt,left,right);
  s.ramp.u=Math.min(1,s.ramp.u+dt/s.ramp.duration);const p=rampPoint(s,s.ramp.u);s.ball.x=p.x;s.ball.y=p.y;
  if(s.ramp.u>=1){const from=rampPoint(s,.98);s.ball.vx=(p.x-from.x)/.02/s.ramp.duration*.6;s.ball.vy=Math.max(130,(p.y-from.y)/.02/s.ramp.duration*.6);s.mode='live';s.ramp=null;s.rampCount++;s.rampFlash=1.2;s.rampGrace=1.8;penny(s,p.x,p.y,2);s.cupOpen=goalMet(s);s.note=s.roundWon?'Ramp made! Keep playing for points.':s.cupOpen?'Targets complete — find the top pocket!':'Ramp made! Two preview pennies on their way.';}return;
 }
 if(s.mode==='capture'){s.phaseTime+=dt;const u=clamp(s.phaseTime/.7,0,1),e=1-(1-u)**3;s.ball.x=s.capture.x+(CUP.x-s.capture.x)*e;s.ball.y=s.capture.y+(CUP.y-s.capture.y)*e;
  if(u===1){s.roundWon=true;s.mode='celebrate';s.phaseTime=0;s.celebrateLeft=3.9;s.note='Reward Collected — play out your three balls.';}return;}
 if(s.mode==='celebrate'){
  moveFlippers(s,dt,left,right);s.celebrateLeft=Math.max(0,s.celebrateLeft-dt);
  if(s.celebrateLeft<=0){s.capture=null;s.trail=[];if(s.activeBall){s.mode='live';s.ball={x:CUP.x,y:CUP.y+rules(s).cup+R+6,vx:rules(s).side?150:-150,vy:280};s.note='Reward Collected! Keep playing this ball.';}else if(s.ballsLeft)setLane(s);else endRound(s);}return;
 }
 const steps=Math.ceil(dt/(1/300));
 for(let n=0;n<steps;n++){
  const h=dt/steps;
  moveFlippers(s,h,left,right);
  if(s.mode!=='live')continue;const p=s.ball;
  const before={x:p.x,y:p.y};p.vy+=420*h;p.vx*=Math.exp(-.025*h);p.x+=p.vx*h;p.y+=p.vy*h;
  if(s.layoutVersion>=3&&p.x<SHOOTER_GATE.a.x-R-3)s.shooterReleased=true;
  const mouth=rampPoint(s,0);
  if(s.layoutVersion!==1&&s.rampGrace<=0&&p.vy<-90&&Math.hypot(p.x-mouth.x,p.y-mouth.y)<40){s.mode='ramp';s.ramp={u:0,duration:Math.max(1.15,Math.min(1.7,1.9-Math.hypot(p.vx,p.vy)/1500))};p.x=mouth.x;p.y=mouth.y;s.note='UP THE RAMP!';break;}
  for(const rail of railsFor(s))collide(p,rail.a,rail.b);
  if(s.layoutVersion>=3){if(s.shooterReleased)collide(p,SHOOTER_GATE.a,SHOOTER_GATE.b);}
  else if(!(p.x>710&&p.vy<-20))collide(p,GATE.a,GATE.b);
  for(const f of s.flippers)collide(p,f,tip(f),R+9,f.w,f,.72);
  const flowers=flowersFor(s);
  for(let i=0;i<flowers.length;i++)if(bounce(p,flowers[i],480)){
   const b=s.flowers[i];if(b.cool<=0){b.cool=.14;b.flash=.25;s.score+=b.lit?150:500;s.hits++;const needed=b.hits<rules(s).hits;b.hits=Math.min(rules(s).hits,b.hits+1);b.lit=b.hits>=rules(s).hits;
    if(needed){s.sparks.push({...flowers[i],age:0});s.note=`Bumper ${i+1}: ${b.hits}/${rules(s).hits} hits.`;}
    if(needed||s.t>=s.pennyAt){penny(s,flowers[i].x,flowers[i].y);s.pennyAt=s.t+2.8;}
    if(!s.cupOpen&&goalMet(s)){s.cupOpen=true;s.note='TARGETS COMPLETE! Shoot the top pocket.';}}
  }
  for(const post of POSTS)bounce(p,post,220);
  for(let i=0;i<SLINGS.length;i++){const sl=SLINGS[i];for(const [a,b] of [[sl.a,sl.b],[sl.b,sl.c],[sl.c,sl.a]])if(collide(p,a,b)&&s.slingCool[i]<=0){p.vx+=sl.kick.x*(s.layoutVersion>=3?1.6:1);p.vy+=sl.kick.y;s.slingCool[i]=.18;s.score+=50;s.slingHits++;}}
  const cupRadius=rules(s).cup;
  if(!s.roundWon&&s.cupOpen&&gateOpen(s)&&Math.hypot(p.x-CUP.x,p.y-CUP.y)<cupRadius){s.mode='capture';s.phaseTime=0;s.capture={x:p.x,y:p.y};p.vx=0;p.vy=0;s.score+=2000;s.note='IN THE POCKET!';break;}
  if((s.roundWon||!s.cupOpen||!gateOpen(s))&&Math.hypot(p.x-CUP.x,p.y-CUP.y)<cupRadius+R){bounce(p,{...CUP,r:cupRadius},s.roundWon?320:200);if(s.layoutVersion>=3&&!s.roundWon){s.finishFlash=1.3;s.note=s.cupOpen?'Finish gate closed — wait for the opening.':'Finish closed: complete the bumper and ramp targets first.';}}
  if(s.layoutVersion>=3&&s.t>=s.toysReadyAt){
   const cup=scoopFor(s),away=Math.hypot(p.x-cup.x,p.y-cup.y);
   if(!s.scoopArmed&&away>105&&s.scoopCool<=0)s.scoopArmed=true;
   if(s.scoopArmed&&s.scoopCool<=0&&away<cup.r){s.scoopArmed=false;s.scoopVisits++;s.hold={x:cup.x,y:cup.y,left:.85,direction:cup.x<450?1:-1};s.mode='hold';p.x=cup.x;p.y=cup.y;p.vx=0;p.vy=0;s.trail=[];s.note='Caught! Line up your next flipper shot…';break;}
   if(s.spinnerCool<=0&&(before.y-SPINNER.y)*(p.y-SPINNER.y)<=0&&before.y!==p.y){const u=(SPINNER.y-before.y)/(p.y-before.y),x=before.x+(p.x-before.x)*u;if(Math.abs(x-SPINNER.x)<SPINNER.half+R){s.spinnerSpeed+=Math.sign(p.vy)*Math.min(20,Math.hypot(p.vx,p.vy)/32);s.spinnerCool=.12;p.vy*=.95;s.note='Spinner shot!';}}
   if(s.shooterReleased&&s.kickbackReady&&p.vy>0&&p.y>1015&&p.y<1095&&((p.x>90&&p.x<230)||(p.x>665&&p.x<741))){s.kickSide=p.x<450?-1:1;s.kickbackReady=false;s.kickFlash=.65;s.kickbacks++;p.vx=s.kickSide<0?210:-210;p.vy=-690;s.score+=100;s.note='KICKBACK! Same ball saved.';}
  }
  for(let i=0;i<3;i++)if(!s.rolls[i]&&Math.abs(p.x-(255+i*185))<23&&Math.abs(p.y-306)<17){s.rolls[i]=true;s.score+=200;}
  const speed=Math.hypot(p.vx,p.vy);if(speed>1100){p.vx*=1100/speed;p.vy*=1100/speed;}
  if(p.x>741&&p.y>=LANE.y&&p.vy>=0&&(s.layoutVersion<3||!s.shooterReleased)){setLane(s);s.note='Rolled back. Pull again — this is the same ball.';}
  else if(p.y>1120||(p.y>1060&&(p.x<230||p.x>665))){drain(s);break;}
 }
 if(s.mode==='live'){s.trail.push({x:s.ball.x,y:s.ball.y});if(s.trail.length>12)s.trail.shift();}
}
export function snapshot(s){const out=copy(s);delete out.saveError;cancel(out);return out;}
export function restore(blob,expectedLevel=blob?.level??0){
 const s=copy(blob),bad=()=>{throw Error('Saved Thunderworks needs attention; it has not been reset.');};
 const finite=(v,a=-1e7,b=1e7)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;
 if(s?.v===1){s.v=2;s.layoutVersion=1;s.run=1;s.go=1;s.ramp=null;s.rampCount=0;s.rampFlash=0;s.rampGrace=0;s.nudgeAt=0;s.nudges=0;s.pendingPennies=0;s.paidPennies=0;s.pennyAt=s.t;s.pennyFlights=[];for(const b of s.flowers||[])b.hits=b.lit?1:0;}
 if(s?.v===2){if(![1,2].includes(s.layoutVersion))bad();s.v=3;s.shooterReleased=s.mode!=='lane'&&s.ball?.x<741;s.hold=null;s.scoopCool=0;s.scoopArmed=true;s.scoopVisits=0;s.spinnerAngle=0;s.spinnerSpeed=0;s.spinnerTravel=0;s.spinnerTurns=0;s.spinnerCool=0;s.kickbackReady=true;s.kickFlash=0;s.kickSide=0;s.kickbacks=0;s.slingHits=0;s.finishFlash=0;s.toysReadyAt=s.t+.4;if(s.layoutVersion===2)s.layoutVersion=3;}
 if(s?.v===3){s.v=4;s.roundWon=!!s.completionRecorded||s.mode==='celebrate'||s.result?.won===true;
  if(s.mode==='result'&&s.result.won&&(s.activeBall||s.ballsLeft>0)){s.result=null;if(s.activeBall){s.mode='celebrate';s.celebrateLeft=0;s.capture||={x:CUP.x,y:CUP.y};}else{setLane(s);s.capture=null;}s.note='Reward Collected. Your remaining balls are ready.';}
 }
 if(!s||s.v!==4||typeof s.roundWon!=='boolean'||!Number.isInteger(s.level)||s.level!==expectedLevel||!LEVELS[s.level]||![1,3].includes(s.layoutVersion)||(s.layoutVersion===1&&s.level!==0)||!Number.isInteger(s.run)||s.run<1||!Number.isInteger(s.go)||s.go<1||!['lane','live','ramp','hold','drain','capture','celebrate','result'].includes(s.mode)||!finite(s.t,0)||!finite(s.phaseTime,0)||!finite(s.score,0)||!Number.isInteger(s.ballsLeft)||s.ballsLeft<0||s.ballsLeft>3||!Number.isInteger(s.ballNumber)||s.ballNumber<0||s.ballNumber>3||s.ballsLeft+s.ballNumber!==3||!Number.isInteger(s.drains)||s.drains<0||s.drains>3||typeof s.activeBall!=='boolean'||typeof s.cupOpen!=='boolean')bad();
 if(!s.ball||!['x','y','vx','vy'].every(k=>finite(s.ball[k]))||!Array.isArray(s.flippers)||s.flippers.length!==2||!s.flippers.every((f,i)=>f.x===[285,612][i]&&f.y===978&&finite(f.a)&&finite(f.w))||!Array.isArray(s.flowers)||s.flowers.length!==3||!s.flowers.every(b=>typeof b.lit==='boolean'&&Number.isInteger(b.hits)&&b.hits>=0&&b.hits<=rules(s).hits&&b.lit===(b.hits>=rules(s).hits)&&finite(b.cool,0)&&finite(b.flash,0))||s.cupOpen!==goalMet(s))bad();
 if(!Array.isArray(s.slingCool)||s.slingCool.length!==2||!s.slingCool.every(n=>finite(n,0))||!Array.isArray(s.rolls)||s.rolls.length!==3||!s.rolls.every(n=>typeof n==='boolean')||!Array.isArray(s.trail)||s.trail.length>12||!s.trail.every(p=>finite(p.x)&&finite(p.y))||!Array.isArray(s.sparks)||!s.sparks.every(p=>finite(p.x)&&finite(p.y)&&finite(p.age,0))||typeof s.prizeKept!=='boolean')bad();
 if(['capture','celebrate'].includes(s.mode)&&(!s.cupOpen||!s.capture||!finite(s.capture.x)||!finite(s.capture.y)))bad();
 if(s.mode==='celebrate'&&!finite(s.celebrateLeft,0,4))bad();
 if(s.rewardReveal&&(!s.prizeKept||typeof s.rewardReveal.id!=='string'||!finite(s.rewardReveal.t,0)))bad();
 if(s.result&&((s.mode!=='result')||typeof s.result.won!=='boolean'||s.result.won!==s.roundWon||(s.result.won&&!s.cupOpen)))bad();
 if(s.mode==='result'&&!s.result)bad();
 if(!Number.isInteger(s.rampCount)||s.rampCount<0||!finite(s.rampFlash,0)||!finite(s.rampGrace,0)||!Number.isInteger(s.pendingPennies)||s.pendingPennies<0||s.pendingPennies>20||!Number.isInteger(s.paidPennies)||s.paidPennies<0||s.paidPennies>20||!finite(s.pennyAt,0)||!Array.isArray(s.pennyFlights)||s.pennyFlights.length>20||!s.pennyFlights.every(p=>finite(p.x)&&finite(p.y)&&finite(p.age,0)&&finite(p.delay,0)))bad();
 if(s.pendingPennies+s.paidPennies>20||(s.roundWon&&!s.cupOpen)||(s.mode==='celebrate'&&!s.roundWon))bad();
 if(s.mode==='ramp'&&(!s.ramp||!finite(s.ramp.u,0,1)||!finite(s.ramp.duration,1.1,1.8)))bad();
 if(s.mode!=='ramp'&&s.ramp!==null)bad();
 if(!finite(s.nudgeAt,0)||!Number.isInteger(s.nudges)||s.nudges<0)bad();
 if(typeof s.shooterReleased!=='boolean'||typeof s.scoopArmed!=='boolean'||typeof s.kickbackReady!=='boolean'||![s.scoopCool,s.spinnerTravel,s.spinnerCool,s.kickFlash,s.finishFlash,s.toysReadyAt].every(n=>finite(n,0))||![s.spinnerAngle,s.spinnerSpeed].every(n=>finite(n))||![s.scoopVisits,s.spinnerTurns,s.kickbacks,s.slingHits].every(n=>Number.isInteger(n)&&n>=0)||![-1,0,1].includes(s.kickSide))bad();
 if(s.mode==='hold'){const cup=scoopFor(s);if(!s.hold||s.hold.x!==cup.x||s.hold.y!==cup.y||!finite(s.hold.left,0,.85)||s.hold.direction!==(cup.x<450?1:-1))bad();}else if(s.hold!==null)bad();
 cancel(s);return s;
}
