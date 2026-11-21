// Ripple Rumble: deterministic pond physics. No player wallet or browser objects.
import {TOKEN_IDS,DOLLAR_IDS,createEntitlement,packets,claimToken,validateEntitlement} from './duck-pond-economy.js?v=once-1';
export const FIELD={left:180,right:720,top:300,bottom:915};
export const FLOWERS=[{x:252,y:796},{x:661,y:672},{x:450,y:325},{x:216,y:390}];
export const PADS=[{x:440,y:510,r:35},{x:450,y:815,r:32}];
export const DRIPS=TOKEN_IDS;
export {DOLLAR_IDS};
const baseDucks=[{x:353,y:694},{x:550,y:641},{x:500,y:445},{x:306,y:462}];
export const LEVELS=[
  {name:'Make a splash',hint:'Wake four flowers. Discover a chain.',flowers:FLOWERS,pads:PADS,current:0,moving:0},
  {name:'Lily ricochet',hint:'Five flowers. Use the lily bumpers.',flowers:[...FLOWERS,{x:681,y:865}],pads:[...PADS,{x:570,y:755,r:32}],current:0,moving:0},
  {name:'Across the current',hint:'Five flowers. Allow for the gentle current.',flowers:[{x:220,y:335},{x:680,y:420},{x:225,y:650},{x:620,y:865},{x:450,y:330}],pads:[{x:380,y:540,r:37},{x:525,y:730,r:34}],current:13,moving:0},
  {name:'Double bloom',hint:'Ringed flowers need two separate bumps.',flowers:[{x:230,y:340,need:2},{x:665,y:355},{x:225,y:620},{x:675,y:665,need:2},{x:260,y:865},{x:570,y:865}],pads:[{x:420,y:440,r:34},{x:470,y:705,r:38}],current:13,moving:0},
  {name:'Wandering lilies',hint:'Double blooms among moving lily bumpers.',flowers:[{x:220,y:340,need:2},{x:680,y:345,need:2},{x:220,y:610,need:2},{x:680,y:650,need:2},{x:280,y:865,need:2},{x:610,y:865,need:2}],pads:[{x:420,y:510,r:36},{x:480,y:750,r:35}],current:17,moving:46},
  {name:'The grand ripple',hint:'Seven flowers. Watch the triple-ring blooms.',flowers:[{x:220,y:340,need:2},{x:450,y:325,need:2},{x:680,y:345,need:3},{x:220,y:620,need:2},{x:680,y:650,need:3},{x:280,y:865,need:2},{x:600,y:865,need:2}],pads:[{x:425,y:480,r:33},{x:480,y:730,r:33},{x:330,y:795,r:30}],current:21,moving:48},
];
export function padPositions(s){const cfg=LEVELS[s.level];return cfg.pads.map((p,i)=>({...p,x:p.x+Math.sin(s.t*.6+i*2)*cfg.moving,y:p.y+Math.sin(s.t*.42+i)*cfg.moving*.38}));}
export function flowAt(s,x,y){const a=LEVELS[s.level].current;return {x:Math.cos(s.t*.23+y/260)*a,y:Math.sin(s.t*.19+x/210)*a*.6};}

const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function inside(p){return p.x>=FIELD.left&&p.x<=FIELD.right&&p.y>=FIELD.top&&p.y<=FIELD.bottom;}
export function makeState(level=0,entitlement=null,carried=[]){
  if(!LEVELS[level])throw Error('Unknown Ripple Rumble chapter');
  return {v:4,level,entitlement:entitlement?JSON.parse(JSON.stringify(entitlement)):createEntitlement(level),phase:'ready',t:0,activeTime:0,houseLeft:100,started:false,shots:0,hits:0,
    chain:0,bestChain:0,chainUntil:0,settled:false,cooldown:0,nextWave:1,
    ducks:baseDucks.map((p,i)=>({...p,id:i,vx:0,vy:0,r:i?24:29,angle:0,spin:0,flash:0})),
    flowers:LEVELS[level].flowers.map((p,i)=>({...p,id:i,need:p.need||1,progress:0,lit:false,hitAt:-10,touching:[]})),
    waves:[],particles:[],finds:[],floats:JSON.parse(JSON.stringify(carried)).filter(f=>f.phase!=='collected'),spawned:carried.filter(f=>f.kind==='token').length,nextFloat:1+Math.max(0,...carried.map(f=>f.uid)),hold:null,cursor:{x:450,y:610},
    chapterPrize:null,prizeKept:!!entitlement?.rewardCollected,result:null,
    note:'Press the water, then release. Ripples push ducks away from your splash.'};
}
export function addWave(s,x,y,power,source='splash',chain=0){
  s.waves.push({id:s.nextWave++,x,y,r:0,power,source,chain,hit:[],life:0});
}
export function splash(s,p,power=.45){
  if(!inside(p)||s.cooldown>0||s.result||s.phase==='celebrate')return false;
  s.started=true;s.phase='play';s.shots++;s.cooldown=.16;
  spawnDrip(s,'splash');
  addWave(s,p.x,p.y,clamp(power,.3,1));
  for(let i=0;i<12;i++){const a=i*TAU/12;const speed=45+(i%3)*22;s.particles.push({x:p.x,y:p.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:.65,max:.65,kind:'water'});}
  s.note='Bump the flowers with a duck. Each flower sends another ripple.';return true;
}
function spark(s,p,kind){
  for(let i=0;i<14;i++){const a=i*TAU/14,speed=45+(i%4)*25;s.particles.push({x:p.x,y:p.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:1.1,max:1.1,kind});}
}
export function spawnDrip(s,source){
  const packet=packets(s.entitlement).find(p=>!s.entitlement.spawned.includes(p.key));
  if(!packet)return;
  const slot=s.entitlement.spawned.length;s.entitlement.spawned.push(packet.key);s.spawned++;
  const destinations=[{x:440,y:655},{x:350,y:430},{x:565,y:760},{x:550,y:500}],to=destinations[slot%4];
  s.floats.push({...packet,kind:'token',uid:s.nextFloat++,source,x:slot%2?700:200,y:290,toX:to.x,toY:to.y,fromX:slot%2?700:200,
    fromY:290,vx:0,vy:9,age:0,phase:'enter',collectedAt:0});
}
function collect(s,f){
  if(f.phase!=='float')return;
  if(f.kind==='token'){if(!claimToken(s.entitlement,f))return;}
  else if(f.kind==='currency'){
    const grant=s.entitlement.currencyGrants.find(g=>g.key===f.key&&g.id===f.id&&g.quantity===f.quantity);
    if(!grant||s.entitlement.currencyCollected.includes(f.key))return;s.entitlement.currencyCollected.push(f.key);
  }else return;
  f.phase='collected';f.collectedAt=s.t;
  s.finds.push({uid:f.uid,key:f.key,id:f.id,quantity:f.quantity,kind:f.kind,x:f.x,y:f.y,at:s.t});spark(s,f,'gold');
}
export function spawnCurrency(s,release){
  const grant=s.entitlement.currencyGrants.find(g=>g.key===release?.key&&g.id===release.id&&g.quantity===release.quantity);
  if(!grant||s.entitlement.currencySpawned.includes(grant.key))return false;
  s.entitlement.currencySpawned.push(grant.key);
  s.floats.push({...grant,uid:s.nextFloat++,source:'house',x:700,y:290,fromX:700,fromY:290,toX:520,toY:650,
    vx:0,vy:9,age:0,phase:'enter',collectedAt:0});return true;
}
function hitFlower(s,f,d){
  f.progress++;f.hitAt=s.t;d.flash=.8;d.spin+=(d.id%2?1:-1)*3.5;
  if(f.progress<f.need){addWave(s,f.x,f.y,.4,'flower',s.chain);spark(s,f,'gold');s.note=`${f.need-f.progress} more ${f.need-f.progress===1?'bump':'bumps'}! Let the duck leave the ring, then strike again.`;return;}
  f.lit=true;s.hits++;
  s.chain=s.t<=s.chainUntil?s.chain+1:1;s.bestChain=Math.max(s.bestChain,s.chain);s.chainUntil=s.t+4;
  addWave(s,f.x,f.y,[.72,.72,.68,.64,.57,.52][s.level],'flower',s.chain);spark(s,f,'gold');
  s.note=s.chain>1?`${s.chain}-flower chain! The pond is playing itself.`:'Flower awake! Its ripple can push the next duck.';
  spawnDrip(s,'flowers');
  if(s.hits===s.flowers.length){s.phase='celebrate';s.celebrateLeft=2.6;s.settled=true;s.note='Every flower awake! What a splash.';}
}
function advance(s,dt){
  s.t+=dt;if(s.started)s.activeTime+=dt;s.cooldown=Math.max(0,s.cooldown-dt);
  if(s.hold)s.hold.age=Math.min(1,s.hold.age+dt);
  for(const w of s.waves){
    const prev=w.r;w.r+=dt*(235+w.power*60);w.life+=dt;
    for(const d of s.ducks){
      if(w.hit.includes(d.id))continue;
      const dx=d.x-w.x,dy=d.y-w.y,len=Math.hypot(dx,dy);
      if(len<=w.r+d.r&&len>=prev-d.r-18){
        w.hit.push(d.id);const a=len<1?(d.id+1)*1.1:Math.atan2(dy,dx);
        const impulse=(190+w.power*310)*Math.max(.55,1-len/1100);
        d.vx+=Math.cos(a)*impulse;d.vy+=Math.sin(a)*impulse;d.spin+=(d.id%2?1:-1)*1.5;
      }
    }
  }
  s.waves=s.waves.filter(w=>w.r<220+w.power*280);
  const pads=padPositions(s);
  for(const d of s.ducks){
    const flow=flowAt(s,d.x,d.y);if(s.started){d.vx+=flow.x*dt;d.vy+=flow.y*dt;}
    const friction=Math.exp(-.9*dt);d.vx*=friction;d.vy*=friction;
    const speed=Math.hypot(d.vx,d.vy);if(speed>620){d.vx*=620/speed;d.vy*=620/speed;}
    d.x+=d.vx*dt;d.y+=d.vy*dt;d.angle+=d.spin*dt;d.spin*=Math.exp(-3*dt);d.angle*=Math.exp(-1.4*dt);d.flash=Math.max(0,d.flash-dt);
    if(d.x<FIELD.left+d.r){d.x=FIELD.left+d.r;d.vx=Math.abs(d.vx)*.85;}
    if(d.x>FIELD.right-d.r){d.x=FIELD.right-d.r;d.vx=-Math.abs(d.vx)*.85;}
    if(d.y<FIELD.top+d.r){d.y=FIELD.top+d.r;d.vy=Math.abs(d.vy)*.85;}
    if(d.y>FIELD.bottom-d.r){d.y=FIELD.bottom-d.r;d.vy=-Math.abs(d.vy)*.85;}
    for(const pad of pads){
      const dx=d.x-pad.x,dy=d.y-pad.y,len=Math.hypot(dx,dy),reach=d.r+pad.r;
      if(len<reach){const nx=len>0?dx/len:1,ny=len>0?dy/len:0;d.x=pad.x+nx*reach;d.y=pad.y+ny*reach;
        const toward=d.vx*nx+d.vy*ny;if(toward<0){d.vx-=1.8*toward*nx;d.vy-=1.8*toward*ny;d.spin+=2;}}
    }
    for(const f of s.flowers){
      const contact=Math.hypot(d.x-f.x,d.y-f.y)<d.r+30;
      if(!contact){f.touching=f.touching.filter(id=>id!==d.id);continue;}
      if(!f.touching.includes(d.id)){
        f.touching.push(d.id);
        if(s.started&&s.phase!=='celebrate'&&!f.lit&&speed>28&&s.t-f.hitAt>.55)hitFlower(s,f,d);
      }
    }
  }
  for(let i=0;i<s.ducks.length;i++)for(let j=i+1;j<s.ducks.length;j++){
    const a=s.ducks[i],b=s.ducks[j],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),reach=a.r+b.r;
    if(len<reach){const nx=len>0?dx/len:1,ny=len>0?dy/len:0,push=(reach-len)/2;a.x-=nx*push;a.y-=ny*push;b.x+=nx*push;b.y+=ny*push;
      const relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(relative<0){const impulse=-relative*.9;a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny;}}
  }
  if(s.started&&s.phase==='play'&&s.activeTime>=18&&s.entitlement.spawned.length<TOKEN_IDS.length)spawnDrip(s,'current');
  for(const f of s.floats){
    f.age+=dt;
    if(f.phase==='enter'){
      const u=Math.min(1,f.age/1.4),e=u*u*(3-2*u);f.x=f.fromX+(f.toX-f.fromX)*e;f.y=f.fromY+(f.toY-f.fromY)*e;
      if(u===1)f.phase='float';
    }else if(f.phase==='float'){
      const flow=flowAt(s,f.x,f.y);f.vx=(f.vx+flow.x*dt*.3)*Math.exp(-1.6*dt);f.vy=(f.vy+flow.y*dt*.3)*Math.exp(-1.6*dt);
      f.x=clamp(f.x+f.vx*dt,FIELD.left+22,FIELD.right-22);f.y=clamp(f.y+f.vy*dt,FIELD.top+22,FIELD.bottom-22);
      for(const d of s.ducks)if(Math.hypot(f.x-d.x,f.y-d.y)<d.r+24){collect(s,f);break;}
    }
  }
  for(const p of s.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.kind==='gold'?75:25;p.life-=dt;}
  s.particles=s.particles.filter(p=>p.life>0);
  if(s.phase==='celebrate')s.celebrateLeft-=dt;
}
export function step(s,dt){
  if(s.result||!Number.isFinite(dt)||dt<=0)return;
  let remaining=Math.min(dt,.1);while(remaining>1e-8){const h=Math.min(remaining,1/120);advance(s,h);remaining-=h;}
}
export function snapshot(s){const data=JSON.parse(JSON.stringify(s));data.hold=null;delete data.saveError;return data;}
export function restore(blob,level=blob?.level){
  if(!blob||![2,3,4].includes(blob.v)||!LEVELS[level]||blob.level!==level)throw Error('This pond snapshot uses a different game concept.');
  const s=snapshot(blob);
  if(s.v===2){
    if(level!==0)throw Error('The original Ripple Rumble study only had Chapter 1.');
    s.v=3;s.activeTime=s.started?s.t:0;s.floats=[];s.spawned=0;s.nextFloat=1;
    s.finds=[]; // v2 finds were only illustrative flower labels, never awarded inventory.
    s.flowers=s.flowers.map(f=>({...f,need:1,progress:f.lit?1:0,touching:[],hitAt:f.hitAt||-10}));
  }
  if(s.v===3){
    const ent=createEntitlement(level);s.legacyFinds=s.finds;s.legacyFloats=s.floats;
    for(const f of s.finds)if(TOKEN_IDS.includes(f.id))ent.claimed[f.id]=(ent.claimed[f.id]||0)+(f.quantity||1);
    ent.rewardCollected=!!s.prizeKept;ent.completed=!!s.result?.won||s.phase==='celebrate';
    s.v=4;s.entitlement=ent;s.floats=[];s.finds=[];s.spawned=0;s.nextFloat=1;
  }
  validateEntitlement(s.entitlement,level);
  const finite=n=>typeof n==='number'&&Number.isFinite(n),integers=values=>values.every(n=>Number.isInteger(n)&&n>=0);
  if(!['ready','play','celebrate','result'].includes(s.phase)||!finite(s.t)||s.t<0||!finite(s.activeTime)||s.activeTime<0||!finite(s.houseLeft)||s.houseLeft<0||s.houseLeft>100
    ||!Array.isArray(s.ducks)||s.ducks.length!==4||s.ducks.some(d=>![d.x,d.y,d.vx,d.vy,d.r,d.angle,d.spin,d.flash].every(finite))
    ||!Array.isArray(s.waves)||s.waves.some(w=>![w.x,w.y,w.r,w.power,w.life].every(finite)||!Array.isArray(w.hit))
    ||!Array.isArray(s.flowers)||s.flowers.length!==LEVELS[level].flowers.length||s.flowers.some(f=>![f.x,f.y,f.hitAt].every(finite)||typeof f.lit!=='boolean'||!integers([f.progress,f.need])||!Array.isArray(f.touching)||f.progress>f.need)
    ||!Array.isArray(s.particles)||s.particles.some(p=>![p.x,p.y,p.vx,p.vy,p.life,p.max].every(finite))
    ||!integers([s.shots,s.hits,s.chain,s.bestChain,s.nextWave,s.spawned,s.nextFloat])||s.spawned>4||!Array.isArray(s.finds)
    ||!Array.isArray(s.floats)||s.floats.some(f=>!(f.kind==='token'?DRIPS:DOLLAR_IDS).includes(f.id)||!['token','currency'].includes(f.kind)||!Number.isSafeInteger(f.quantity)||f.quantity<=0||!f.key||!['enter','float','collected'].includes(f.phase)||![f.x,f.y,f.vx,f.vy,f.age,f.fromX,f.fromY,f.toX,f.toY,f.collectedAt].every(finite))
    ||s.hits!==s.flowers.filter(f=>f.lit).length||new Set(s.finds.map(f=>f.uid)).size!==s.finds.length)throw Error('Invalid pond snapshot; original data must be preserved.');
  return s;
}
