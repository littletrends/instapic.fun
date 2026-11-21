import {base,copy,remember,undo as rewind,validate} from './study-state.js?v=studies-six-1';
export function undo(s){delete s.aimDrag;return rewind(s);}
export const STEP=1/240,ORIGIN={x:450,y:322},LIMIT=55;
export const MILLS=[{x:305,y:612,r:36,name:'Rose mill',colour:'#bd7c88'},{x:450,y:750,r:36,name:'Golden mill',colour:'#d3af67'},{x:595,y:612,r:36,name:'Sage mill',colour:'#83a28c'}];
export const FORK={x:450,y:470,r:20};
export const PEGS=[[350,420],[550,420],[260,500],[400,650],[500,650],[640,500],[232,680],[365,700],[535,700],[668,680],[285,810],[615,810],[370,865],[530,865]].map(([x,y],id)=>({x,y,id,r:11}));
export const CUPS=[285,450,615];
const pegs=points=>points.map(([x,y],id)=>({x,y,id,r:11}));
const mills=points=>points.map(([x,y,r=36],i)=>({x,y,r,name:['Rose mill','Golden mill','Sage mill','Moon mill'][i],colour:['#bd7c88','#d3af67','#83a28c','#8b9fba'][i]}));
const upper=pegs([[330,405],[570,405],[240,510],[660,510],[390,650],[510,650],[260,720],[640,720],[350,805],[550,805],[450,850]]);
const four=pegs([[330,410],[570,410],[450,525],[240,660],[450,655],[660,660],[300,830],[600,830],[450,850]]);
const wings=[{x1:230,y1:530,x2:290,y2:500,r:6},{x1:610,y1:500,x2:670,y2:530,r:6}];
const wingPegs=pegs(PEGS.filter(p=>p.id!==2&&p.id!==5).map(p=>[p.x,p.y]));
const narrowPegs=pegs(PEGS.filter(p=>![2,3,4,5].includes(p.id)).map(p=>[p.x,p.y]));
export const LEVELS=[
 {name:'Three mills before moonrise',mills:MILLS,forks:[FORK],pegs:PEGS,baffles:[],goals:[2,2,2],stock:[4,1]},
 {name:'Copper crossings',detail:'A new fork and a higher pair of mills. Read the three touch goals before choosing your five shots.',mills:mills([[300,585],[450,710],[600,585]]),forks:[{x:450,y:450,r:20}],pegs:upper,baffles:[],goals:[3,2,3],stock:[4,1]},
 {name:'Under the paper wings',detail:'Paper wings change the outer routes. The side mills need three marbles each; the middle needs two.',mills:MILLS,forks:[FORK],pegs:wingPegs,baffles:wings,goals:[3,2,3],stock:[4,1]},
 {name:'The twin garden',detail:'Choose between two forks for four mills. Your five-shot tray holds two twins.',mills:mills([[285,585],[385,755],[515,755],[615,585]]),forks:[{x:360,y:465,r:20},{x:540,y:465,r:20}],pegs:four,baffles:[],goals:[2,2,2,2],stock:[3,2]},
 {name:'The narrow silver run',detail:'Smaller outer mills and only four shots. A careful twin route must do more of the work.',mills:mills([[305,612,32],[450,680,38],[595,612,32]]),forks:[FORK],pegs:narrowPegs,baffles:wings,goals:[3,3,3],stock:[3,1]},
 {name:'Peggy’s night parade',detail:'Four three-touch mills, two forks and paper wings. Plan all six shots before the last cups fill.',mills:mills([[285,585],[385,755],[515,755],[615,585]]),forks:[{x:360,y:465,r:20},{x:540,y:465,r:20}],pegs:four,baffles:wings,goals:[3,3,3,3],stock:[4,2]},
];
export const rules=s=>LEVELS[typeof s==='number'?s:s.level];
export const totalShots=s=>rules(s).stock[0]+rules(s).stock[1];
export const complete=s=>s.mills.every((n,i)=>n===rules(s).goals[i]);
export function snapshot(s){const out=copy(s);delete out.pointerDown;delete out.saveError;delete out.aimDrag;return out;}
export function makeState(level=0){const r=rules(level);if(!r)throw Error('Choose a Marble Mill chapter from 1 to 6.');const s={...base('marble-mill',level===0?'Five shots. Wake each mill twice, then let every marble settle. The twin marble splits at the brass fork.':r.detail,level),aim:0,type:0,stock:r.stock.slice(),shots:0,nextBall:0,balls:[],mills:r.goals.map(()=>0),millSpin:r.goals.map(()=>0),pegFlash:Array(r.pegs.length).fill(0),forkFlash:0,hits:0,split:false,accum:0,physicalTime:0,motion:null,caught:[],trail:[]};if(r.forks.length>1)s.forkLast=0;return s;}
export function setAim(s,angle){if(s.phase!=='play'||!Number.isFinite(angle))return false;s.aim=Math.max(-LIMIT,Math.min(LIMIT,Math.round(angle*2)/2));return true;}
export function select(s,type){if(s.phase!=='play'||![0,1].includes(type)||!s.stock[type])return false;s.type=type;s.note=type?'Twin selected. Hit the brass fork to release two little marbles.':'Plain selected. Each marble can wake each mill once.';return true;}
export const angleAt=p=>Math.max(-LIMIT,Math.min(LIMIT,Math.atan2(p.x-ORIGIN.x,p.y-ORIGIN.y)*180/Math.PI));
export function beginAim(s,p){if(s.phase!=='play'||s.result)return false;s.aimDrag={value:angleAt(p)};return true;}
export function moveAim(s,p){if(s.aimDrag)s.aimDrag.value=angleAt(p);}
export function endAim(s,commit){if(!s.aimDrag)return false;if(commit)setAim(s,s.aimDrag.value);delete s.aimDrag;return true;}
export const aimValue=s=>s.aimDrag?Math.round(s.aimDrag.value*2)/2:s.aim;
export function preview(s){const a=aimValue(s)*Math.PI/180,vx=Math.sin(a)*270,vy=Math.cos(a)*270;return Array.from({length:12},(_,i)=>{const t=(i+1)*.035;return {x:ORIGIN.x+vx*t,y:ORIGIN.y+vy*t+420*t*t};}).filter(p=>p.y<433);}
function ball(s,x,y,vx,vy,type=0){return {id:s.nextBall++,x,y,vx,vy,r:type===1?12:10,type,phase:'flight',hit:[],contacts:[],age:0,spin:0,t:0,cup:-1,from:null};}
export function shoot(s){
 if(s.phase!=='play'||s.result||!s.stock[s.type])return false;delete s.aimDrag;remember(s);const a=s.aim*Math.PI/180;
 s.stock[s.type]--;s.shots++;s.moves++;s.balls=[ball(s,ORIGIN.x,ORIGIN.y,Math.sin(a)*270,Math.cos(a)*270,s.type)];s.accum=0;s.phase='moving';s.motion={kind:'flight'};s.note=s.type?'Twin away. The brass fork is its splitting point.':'Marble away. Watch its route before choosing your next shot.';return true;
}
function collide(b,p,bounce=.77){
 const dx=b.x-p.x,dy=b.y-p.y,reach=b.r+p.r,ds=dx*dx+dy*dy;if(ds>=reach*reach)return false;const dist=Math.sqrt(ds)||.001,nx=dist>.001?dx/dist:0,ny=dist>.001?dy/dist:-1;
 b.x=p.x+nx*(reach+.05);b.y=p.y+ny*(reach+.05);const dot=b.vx*nx+b.vy*ny;
 if(dot<0){b.vx-=(1+bounce)*dot*nx;b.vy-=(1+bounce)*dot*ny;if(Math.abs(b.vx)<5&&ny<-.8)b.vx+=(b.id%2?1:-1)*18;return true;}return false;
}
function finish(s){
 if(!s.balls.every(b=>b.phase==='done'))return;
 s.motion=null;s.balls=[];s.accum=0;s.trail=[];
 if(complete(s)){s.phase='celebrate';s.pendingPennies=3+s.level;s.note=(rules(s).mills.length===3?'Three':'Four')+' mills turning. Every marble safely gathered.';}
 else if(s.stock[0]+s.stock[1]===0){s.phase='result';s.result={title:'The last marble settled',detail:'The mills still need '+s.mills.reduce((n,v,i)=>n+rules(s).goals[i]-v,0)+' touches. Play again to refill the '+(totalShots(s)===5?'five':totalShots(s)===4?'four':'six')+'-shot tray.',won:false,prize:null,settle:true};}
 else{s.phase='play';if(!s.stock[s.type])s.type=s.stock[0]?0:1;s.note='Marbles gathered. '+(s.stock[0]+s.stock[1])+' shots remain. Choose a route for the mills still resting.';}
}
function physics(s){
 const r=rules(s);s.physicalTime+=STEP;s.forkFlash=Math.max(0,s.forkFlash-STEP);s.pegFlash=s.pegFlash.map(v=>Math.max(0,v-STEP));s.millSpin=s.millSpin.map((v,i)=>v+(s.mills[i]===r.goals[i]?2.8:s.mills[i]?1:.15)*STEP);
 const newborn=[];
 for(const b of s.balls){
  if(b.phase==='done')continue;
  if(b.phase==='catch'){b.t=Math.min(.55,b.t+STEP);const u=b.t/.55,e=u*u*(3-2*u);b.x=b.from.x+(CUPS[b.cup]-b.from.x)*e;b.y=b.from.y+(943-b.from.y)*e-Math.sin(u*Math.PI)*15;b.spin+=STEP*2;if(b.t===.55){b.phase='done';s.caught.push({id:b.id,cup:b.cup,type:b.type});}continue;}
  b.age+=STEP;b.vy=Math.min(950,b.vy+840*STEP);b.x+=b.vx*STEP;b.y+=b.vy*STEP;b.spin+=b.vx*STEP*.025;
  if(b.x<181+b.r){b.x=181+b.r;b.vx=Math.abs(b.vx)*.82;}if(b.x>719-b.r){b.x=719-b.r;b.vx=-Math.abs(b.vx)*.82;}
  if(b.y<302+b.r){b.y=302+b.r;b.vy=Math.abs(b.vy)*.75;}
  const contacts=[];
  let split=false;for(let i=0;i<r.forks.length;i++){const fork=r.forks[i];if(Math.hypot(b.x-fork.x,b.y-fork.y)<b.r+fork.r&&b.type===1){s.split=true;s.forkFlash=.7;if(r.forks.length>1)s.forkLast=i;b.phase='done';newborn.push(ball(s,fork.x-22,fork.y+23,-220,90),ball(s,fork.x+22,fork.y+23,220,90));s.note='The twin unfolds into two real marbles. Both must settle.';split=true;break;}
   if(collide(b,fork,.8)){s.forkFlash=.35;if(r.forks.length>1)s.forkLast=i;contacts.push(i?'fork'+i:'fork');}}
  if(split)continue;
  for(let i=0;i<r.mills.length;i++)if(collide(b,r.mills[i],.82)){contacts.push('mill'+i);if(!b.hit.includes(i)){b.hit.push(i);s.hits++;s.mills[i]=Math.min(r.goals[i],s.mills[i]+1);s.millSpin[i]+=.9;s.note=r.mills[i].name+' · '+s.mills[i]+'/'+r.goals[i]+' touches.';}}
  for(const p of r.pegs)if(collide(b,p,.75)){contacts.push('peg'+p.id);s.pegFlash[p.id]=.3;}
  for(let i=0;i<r.baffles.length;i++){const rail=r.baffles[i],dx=rail.x2-rail.x1,dy=rail.y2-rail.y1,u=Math.max(0,Math.min(1,((b.x-rail.x1)*dx+(b.y-rail.y1)*dy)/(dx*dx+dy*dy)));if(collide(b,{x:rail.x1+u*dx,y:rail.y1+u*dy,r:rail.r},.72))contacts.push('rail'+i);}
  b.contacts=contacts;
  if(b.y>915){b.phase='catch';b.cup=b.x<367?0:b.x<533?1:2;b.from={x:b.x,y:Math.min(b.y,925)};b.t=0;b.vx=0;b.vy=0;}
 }
 s.balls.push(...newborn);s.trail=s.trail.filter(p=>s.physicalTime-p.t<.26);for(const b of s.balls)if(b.phase==='flight')s.trail.push({x:b.x,y:b.y,t:s.physicalTime,id:b.id});if(s.trail.length>150)s.trail=s.trail.slice(-150);
 finish(s);
}
export function step(s,dt){
 if(s.result||s.phase==='celebrate'||!Number.isFinite(dt)||dt<=0)return;s.t+=dt;
 if(s.phase==='moving'){s.accum+=dt;while(s.accum+1e-10>=STEP&&s.phase==='moving'){s.accum=Math.max(0,s.accum-STEP);physics(s);}}
 else{s.forkFlash=Math.max(0,s.forkFlash-dt);s.pegFlash=s.pegFlash.map(v=>Math.max(0,v-dt));s.millSpin=s.millSpin.map((v,i)=>v+(s.mills[i]===rules(s).goals[i]?2.8:s.mills[i]?1:.15)*dt);}
}
export function restore(blob,level=blob?.level){
 const bad=validate(blob,'marble-mill');if(blob.demo===true||blob.level!==level||!rules(level)||blob.v!==2)bad();const s=snapshot(blob),r=rules(s),maxShots=totalShots(s),maxBall=maxShots+2*r.stock[1],int=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b,finite=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
 if(!finite(s.aim,-LIMIT,LIMIT)||![0,1].includes(s.type)||!Array.isArray(s.stock)||s.stock.length!==2||!int(s.stock[0],0,r.stock[0])||!int(s.stock[1],0,r.stock[1])||!int(s.shots,0,maxShots)||s.stock[0]+s.stock[1]+s.shots!==maxShots||!int(s.nextBall,0,maxBall)||!Array.isArray(s.balls)||s.balls.length>3||!Array.isArray(s.mills)||s.mills.length!==r.mills.length||s.mills.some((v,i)=>!int(v,0,r.goals[i]))||!Array.isArray(s.millSpin)||s.millSpin.length!==r.mills.length||s.millSpin.some(v=>!finite(v,0,1e7))||!Array.isArray(s.pegFlash)||s.pegFlash.length!==r.pegs.length||s.pegFlash.some(v=>!finite(v,0,.3))||!finite(s.forkFlash,0,.7)||!finite(s.accum,0,.051)||!finite(s.physicalTime,0,200)||!int(s.hits,0,maxBall*r.mills.length)||typeof s.split!=='boolean'||!Array.isArray(s.caught)||s.caught.length>maxShots+r.stock[1]||!Array.isArray(s.trail)||s.trail.length>150||r.forks.length>1&&!int(s.forkLast,0,r.forks.length-1))bad();
 for(const b of s.balls){if(!int(b.id,0,maxBall-1)||![0,1].includes(b.type)||!['flight','catch','done'].includes(b.phase)||!finite(b.x,150,750)||!finite(b.y,250,960)||!finite(b.vx,-1800,1800)||!finite(b.vy,-1800,1800)||!finite(b.r,10,12)||!finite(b.age,0,200)||!finite(b.spin,-1e6,1e6)||!finite(b.t,0,.55)||!int(b.cup,-1,2)||!Array.isArray(b.contacts)||b.contacts.length>40||!Array.isArray(b.hit)||new Set(b.hit).size!==b.hit.length||b.hit.some(v=>!int(v,0,r.mills.length-1)))bad();if(b.phase==='catch'&&(!b.from||!finite(b.from.x,150,750)||!finite(b.from.y,250,960)||b.cup<0))bad();}
 if(new Set(s.balls.map(b=>b.id)).size!==s.balls.length||s.caught.some(b=>!int(b.id,0,maxBall-1)||!int(b.cup,0,2)||![0,1].includes(b.type))||s.trail.some(p=>!finite(p.x,150,750)||!finite(p.y,250,960)||!finite(p.t,0,s.physicalTime)||!int(p.id,0,maxBall-1)))bad();
 if((s.phase==='moving')!==!!s.motion||s.motion&&s.motion.kind!=='flight'||s.phase==='moving'&&!s.balls.some(b=>b.phase!=='done'))bad();if(s.phase==='celebrate'&&(!complete(s)||s.balls.length))bad();
 s.history=s.history.map(h=>{const a=restore({...h,history:[]},level);delete a.history;return a;});return copy(s);
}
