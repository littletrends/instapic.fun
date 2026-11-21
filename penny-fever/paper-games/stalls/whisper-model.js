// Whisper Weave: loop capture, changing seals and timed paper-fold deliveries.
export const FIELD={left:175,right:725,top:340,bottom:910};
export const MAILBOXES=[{x:270,y:280},{x:630,y:280}];
export const FOLD_SECONDS=.55,FLIGHT_SECONDS=1.15;
export const LEVELS=[
 {name:'Circle a secret',detail:'Circle one kind of seal. Let it fly.',perKind:3,bundle:1,rate:0,seals:0,mailMotion:0,windows:false},
 {name:'Crossing whispers',detail:'Send matching pairs through crossing paths.',perKind:4,bundle:2,rate:.28,seals:0,mailMotion:0,windows:false},
 {name:'A change of seal',detail:'Seals swap. Choose your moment to draw.',perKind:4,bundle:2,rate:.30,seals:7,mailMotion:0,windows:false},
 {name:'The travelling post',detail:'Moving letterboxes. Time your delivery.',perKind:4,bundle:2,rate:.32,seals:0,mailMotion:48,windows:true,period:3.2,openFor:2.05,offset:1.05},
 {name:'Three in a fold',detail:'Gather three matching seals in each fold.',perKind:6,bundle:3,rate:.34,seals:6,mailMotion:52,windows:true,period:3.8,openFor:2.4,offset:1.2},
 {name:'The midnight post',detail:'Two delivery windows. Plan one parcel at a time.',perKind:6,bundle:3,rate:.36,seals:4.8,mailMotion:62,windows:true,period:3.6,openFor:1.7,offset:1.8},
];
export const rules=s=>LEVELS[s.level];
export const goal=s=>rules(s).perKind*2;
export function mailboxPosition(s,kind,t=s.t){
 const b=MAILBOXES[kind],a=rules(s).mailMotion;
 return {x:b.x+Math.sin(t*.62+kind*Math.PI)*a,y:b.y+Math.sin(t*.46+kind)*a*.24};
}
export function mailboxOpen(s,kind,t=s.t){
 const r=rules(s);return !r.windows||((t+kind*r.offset)%r.period)<r.openFor;
}
export function deliveryReady(s,kind){
 const arrival=s.t+FOLD_SECONDS+FLIGHT_SECONDS;
 return [-.08,0,.08].every(offset=>mailboxOpen(s,kind,arrival+offset));
}
function pathPosition(s,p){
 const rows=rules(s).perKind,space=rows===4?120:74,top=480;
 return {x:450+p.lane*160*Math.cos(s.driftTime*rules(s).rate+p.row*.65),y:top+p.row*space+Math.sin(s.driftTime*.3+p.row)*10};
}
export function makeState(level=0){
 if(!Number.isInteger(level)||!LEVELS[level])throw Error('Unknown Whisper chapter.');
 const s={v:2,level,t:0,driftTime:0,sealLeft:LEVELS[level].seals,sealCycle:0,sealPulse:0,houseLeft:100,started:level>0,phase:level>0?'play':'ready',cursor:{x:450,y:610},loop:null,
  letters:[],flights:[],bursts:[],nextFlight:1,delivered:[0,0],bundles:0,tangles:0,bestBundle:0,returns:0,
  feedback:0,feedbackKind:'',note:LEVELS[level].detail,chapterPrize:null,prizeKept:false,result:null,rewardReveal:null};
 if(level===0){
  s.letters=[{x:280,y:455,kind:0},{x:400,y:555,kind:0},{x:285,y:690,kind:0},
   {x:600,y:455,kind:1},{x:515,y:645,kind:1},{x:635,y:760,kind:1}].map((p,i)=>({...p,id:i,vx:0,vy:0,phase:'float',spin:0}));
 }else for(let row=0;row<LEVELS[level].perKind;row++)for(const lane of [-1,1]){
  const p={id:s.letters.length,row,lane,kind:(row+(lane===1?1:0))%2,vx:0,vy:0,ox:0,oy:0,spin:0,phase:'float'};
  s.letters.push({...p,...pathPosition(s,p)});
 }
 return s;
}
export function inField(p){return p.x>=FIELD.left&&p.x<=FIELD.right&&p.y>=FIELD.top&&p.y<=FIELD.bottom;}
export function area(points){return Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.x*q.y-q.x*p.y;},0)/2);}
export function contains(points,p){
 let inside=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const a=points[i],b=points[j];
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}
export function selected(s){
 if(!s.loop||s.loop.length<3||area(s.loop)<1600)return [];
 return s.letters.filter(p=>p.phase==='float'&&contains(s.loop,p));
}
export function selectionRule(s,caught=selected(s)){
 const kind=caught[0]?.kind,mixed=caught.some(p=>p.kind!==kind),sizeOK=caught.length>0&&caught.length%rules(s).bundle===0;
 return {kind,mixed,sizeOK,ready:!!caught.length&&!mixed&&sizeOK,letters:caught};
}
export function beginLoop(s,p){
 if(!inField(p)||s.result||s.phase==='celebrate')return false;
 s.started=true;s.phase='play';s.loop=[{x:p.x,y:p.y}];s.cursor={x:p.x,y:p.y};return true;
}
export function extendLoop(s,p){
 if(!s.loop||!inField(p))return;
 const last=s.loop.at(-1);s.cursor={x:p.x,y:p.y};
 if(Math.hypot(last.x-p.x,last.y-p.y)>7){if(s.loop.length>=180)s.loop=s.loop.filter((_,i)=>i%2===0);s.loop.push({x:p.x,y:p.y});}
}
export function releaseLoop(s){
 if(!s.loop)return false;
 const caught=selected(s),check=selectionRule(s,caught);s.loop=null;
 if(!caught.length){s.note='Make a loop around the letters. Small loops count too.';return false;}
 if(check.mixed){
  s.tangles++;s.feedback=1.2;s.feedbackKind='tangle';
  caught.forEach((p,i)=>{const a=i*Math.PI*2/caught.length;p.vx+=Math.cos(a)*88;p.vy+=Math.sin(a)*75;p.spin+=(i%2?1:-1)*.35;});
  s.note='That loop caught both seals. The letters slipped free — try one kind.';return false;
 }
 if(!check.sizeOK){
  s.feedback=1.4;s.feedbackKind='size';s.note=rules(s).bundle===2?'This post travels in pairs. Circle 2 or 4 matching seals.':'This post travels in threes. Circle 3 or 6 matching seals.';return false;
 }
 const kind=check.kind,x=caught.reduce((n,p)=>n+p.x,0)/caught.length,y=caught.reduce((n,p)=>n+p.y,0)/caught.length;
 caught.forEach(p=>{p.phase='folding';});
 s.flights.push({id:s.nextFlight++,kind,ids:caught.map(p=>p.id),count:caught.length,x,y,fromX:x,fromY:y,t:0,phase:'fold',delivered:false});
 s.bundles++;s.bestBundle=Math.max(s.bestBundle,caught.length);s.feedback=1.3;s.feedbackKind='bundle';
 s.note=caught.length>1?`${caught.length} whispers, one paper plane!`:'A little secret takes flight.';return true;
}
function changeSeals(s){
 for(let i=0;i<s.letters.length;i+=2){
  const a=s.letters[i],b=s.letters[i+1];
  if(a.phase==='float'&&b.phase==='float'&&a.kind!==b.kind){[a.kind,b.kind]=[b.kind,a.kind];}
 }
 s.sealCycle++;s.sealPulse=1;s.note='The wax seals changed. Check each letter before looping.';
}
function returnLetters(s,f){
 for(const id of f.ids){
  const p=s.letters.find(p=>p.id===id);p.phase='float';p.vx=0;p.vy=0;
  if(s.level>0){const to=pathPosition(s,p);p.ox=p.x-to.x;p.oy=p.y-to.y;}
 }
 f.phase='gone';
}
function tick(s,dt){
 s.t+=dt;s.feedback=Math.max(0,s.feedback-dt);s.sealPulse=Math.max(0,s.sealPulse-dt);
 const r=rules(s);
 // The letters settle under the pen; mailbox time still runs for planned releases.
 if(s.started&&!s.loop){
  s.driftTime+=dt;
  if(r.seals){s.sealLeft-=dt;if(s.sealLeft<=0){changeSeals(s);s.sealLeft+=r.seals;}}
 }
 for(const p of s.letters){if(p.phase!=='float'||s.loop)continue;
  p.vx*=Math.exp(-2.2*dt);p.vy*=Math.exp(-2.2*dt);p.spin*=Math.exp(-2*dt);
  if(s.level===0){
   p.x+=p.vx*dt+(s.started?Math.sin(s.t*.8+p.id)*2*dt:0);p.y+=p.vy*dt+(s.started?Math.cos(s.t*.65+p.id)*2*dt:0);
  }else if(s.started){
   p.ox=(p.ox+p.vx*dt)*Math.exp(-1.2*dt);p.oy=(p.oy+p.vy*dt)*Math.exp(-1.2*dt);
   const to=pathPosition(s,p);p.x=to.x+p.ox;p.y=to.y+p.oy;
  }
  p.x=Math.max(FIELD.left+44,Math.min(FIELD.right-44,p.x));p.y=Math.max(FIELD.top+38,Math.min(FIELD.bottom-38,p.y));
 }
 for(const f of s.flights){
  if(f.phase==='gone')continue;f.t+=dt;
  if(f.phase==='fold'&&f.t>=FOLD_SECONDS){f.phase='fly';f.t-=FOLD_SECONDS;}
  if(f.phase==='fly'){
   const u=Math.min(1,f.t/FLIGHT_SECONDS),e=u*u*(3-2*u),to=mailboxPosition(s,f.kind);
   f.x=f.fromX+(to.x-f.fromX)*e+Math.sin(u*Math.PI)*(f.kind?85:-85);
   f.y=f.fromY+(to.y-f.fromY)*e-Math.sin(u*Math.PI)*90;
   if(u===1&&!f.delivered){
    if(mailboxOpen(s,f.kind)){
     f.delivered=true;f.phase='gone';s.delivered[f.kind]+=f.count;
     f.ids.forEach(id=>{s.letters.find(p=>p.id===id).phase='delivered';});
     s.bursts.push({x:to.x,y:to.y,t:0,kind:f.kind});
    }else{
     f.phase='return';f.t=0;f.returnX=f.x;f.returnY=f.y;s.returns++;
     s.feedback=1.5;s.feedbackKind='return';s.note='The letterbox was closed. Your letters are coming back; nothing is lost.';
    }
   }
  }else if(f.phase==='return'){
   const u=Math.min(1,f.t/.9),e=u*u*(3-2*u);
   f.x=f.returnX+(f.fromX-f.returnX)*e;f.y=f.returnY+(f.fromY-f.returnY)*e-Math.sin(u*Math.PI)*65;
   if(u===1)returnLetters(s,f);
  }
 }
 s.bursts.forEach(b=>{b.t+=dt;});s.bursts=s.bursts.filter(b=>b.t<1);
 if(s.delivered[0]+s.delivered[1]===goal(s)&&s.phase!=='celebrate'){
  s.phase='celebrate';s.celebrateLeft=2.4;s.note='Every secret sent. Willa opens the reward.';
 }
 if(s.phase==='celebrate')s.celebrateLeft-=dt;
}
export function step(s,dt){
 if(s.result||!Number.isFinite(dt)||dt<=0)return;
 let left=Math.min(.05,dt);while(left>1e-8){const h=Math.min(1/120,left);tick(s,h);left-=h;}
}
export function snapshot(s){const blob=JSON.parse(JSON.stringify(s));blob.loop=null;delete blob.saveError;return blob;}
export function restore(blob,level=blob?.level){
 if(!blob||![1,2].includes(blob.v)||blob.level!==level||!Number.isInteger(level)||!LEVELS[level]||(blob.v===1&&level!==0))throw Error('Unknown Whisper snapshot; preserved for review.');
 const s=snapshot(blob),finite=n=>typeof n==='number'&&Number.isFinite(n);
 if(blob.v===1){s.v=2;s.driftTime=s.t;s.sealLeft=0;s.sealCycle=0;s.sealPulse=0;s.returns=0;}
 const count=goal(s),ids=new Set(s.letters?.map(p=>p.id));
 if(!['ready','play','celebrate','result'].includes(s.phase)||!finite(s.t)||s.t<0||!finite(s.houseLeft)||s.houseLeft<0||s.houseLeft>100
  ||![s.driftTime,s.sealLeft,s.sealPulse].every(finite)||!Number.isInteger(s.sealCycle)||s.sealCycle<0
  ||!Array.isArray(s.letters)||s.letters.length!==count||ids.size!==count||s.letters.some(p=>!Number.isInteger(p.id)||p.id<0||p.id>=count||![p.x,p.y,p.vx,p.vy,p.spin].every(finite)||![0,1].includes(p.kind)||!['float','folding','delivered'].includes(p.phase)||(level>0&&(![p.ox,p.oy].every(finite)||![-1,1].includes(p.lane)||!Number.isInteger(p.row)||p.row<0||p.row>=rules(s).perKind)))
  ||!Array.isArray(s.flights)||s.flights.some(f=>![f.x,f.y,f.fromX,f.fromY,f.t].every(finite)||!Number.isInteger(f.id)||![0,1].includes(f.kind)||!Array.isArray(f.ids)||!f.ids.length||f.ids.some(id=>!ids.has(id))||new Set(f.ids).size!==f.ids.length||f.count!==f.ids.length||!['fold','fly','return','gone'].includes(f.phase)||(f.phase==='return'&&![f.returnX,f.returnY].every(finite)))
  ||!Array.isArray(s.delivered)||s.delivered.length!==2||s.delivered.some(n=>!Number.isInteger(n)||n<0||n>rules(s).perKind)
  ||![s.bundles,s.tangles,s.bestBundle,s.returns,s.nextFlight].every(n=>Number.isInteger(n)&&n>=0))throw Error('Invalid Whisper snapshot; preserved for review.');
 for(const kind of [0,1])if(s.letters.filter(p=>p.kind===kind).length!==rules(s).perKind||s.delivered[kind]!==s.letters.filter(p=>p.kind===kind&&p.phase==='delivered').length)throw Error('Whisper delivery counts need attention; save preserved.');
 const active=s.flights.filter(f=>f.phase!=='gone'),inFlight=active.flatMap(f=>f.ids);
 if(new Set(inFlight).size!==inFlight.length||s.letters.some(p=>(p.phase==='folding')!==inFlight.includes(p.id)))throw Error('Whisper flight needs attention; save preserved.');
 return s;
}
