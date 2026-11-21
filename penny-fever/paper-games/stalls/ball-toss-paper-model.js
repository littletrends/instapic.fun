import {base,copy,remember,undo as rewind,validate} from './study-state.js?v=studies-six-1';
export const STEP=1/240,ORIGIN={x:450,y:936},SPEED=980,GRAVITY=900,LIMIT=50;
function scene(stacks,extras=[]){const out=[];for(const [x,y,n,hp=1] of stacks)for(let k=0;k<n;k++){const id=out.length;out.push({id,x,y:y-k*110,r:34,art:k%2,hp:k?1:hp,parents:k?[id-1]:[]});}for(const [x,y,parents] of extras){const id=out.length;out.push({id,x,y,r:34,art:id%2,hp:1,parents});}return out;}
const FIRST_ORIGINAL={name:'A pair of little falls',balls:3,plates:scene([[305,720,2],[595,720,2]]),detail:'Three balls, four plates. Lower STAR plates hold the pairs above them.'};
export const RACK_PERIOD=4.2,RACK_SWING=38;
export const PARTITIONS=[367.5,532.5],PARTITION_BOTTOM=800;
const FIRST_MOVING={name:'Three stands on the move',balls:3,plates:scene([[285,720,2],[450,720,2],[615,720,2]]).map((p,i)=>({...p,r:26,rack:Math.floor(i/2)})),moving:true,detail:'Three balls, six plates on moving stands. Lead the lower STAR supports; one wasted shot can cost the curtain.'};
const FIRST_BANK={name:'The bank-shot curtain',balls:3,plates:scene([[320,650,3,2],[580,650,3,2],[450,820,2]],[[450,350,[2,5]],[450,460,[1,4]]]).map(p=>p.id===6?{...p,r:50}:p),rails:[{x1:220,y1:675,x2:300,y2:820,r:8}],detail:'Ten plates, three balls. The large front STAR screens the rear supports. Bank off the angled left cushion, expose the rear, then use the falling plates. Double-rimmed STAR supports each have two pins.'};
const SOURCE_LEVELS=[
 FIRST_BANK,
 {name:'Three paper stands',balls:3,plates:scene([[270,750,2],[450,750,2],[630,750,2]]),detail:'Three balls for three stands. Choose the lower supports before the upper plates.'},
 {name:'Towers in the afternoon',balls:3,plates:scene([[300,770,3],[600,770,3]]),detail:'Taller towers: one lower support can release three plates. Let every falling plate settle.'},
 {name:'The ribbon bridge',balls:3,plates:scene([[270,770,2],[450,770,2],[630,770,2]],[[360,540,[1,3]],[540,540,[3,5]]]),detail:'Upper bridge plates have two ribbon supports. Both must fall before the bridge drops.'},
 {name:'Double-pinned gold',balls:4,plates:scene([[300,770,3,2],[600,770,3]],[[450,480,[2,5]]]),detail:'The left lower STAR plate has two pins: it needs two impacts. Falling plates can also knock their neighbours.'},
 {name:'Bess’s grand plate curtain',balls:5,plates:scene([[270,770,3,2],[630,770,3,2],[450,790,2]],[[450,460,[2,5]],[450,570,[1,4]]]),detail:'Two double-pinned supports, a middle pair and shared upper plates. Plan all five throws.'},
];
export const ORDER_TAG='curtain-last-v1';
export const OLD_TO_NEW=[5,0,1,2,3,4],NEW_TO_OLD=[1,2,3,4,5,0];
export const LEVELS=NEW_TO_OLD.map(source=>SOURCE_LEVELS[source]);
export const sourceLevel=s=>typeof s==='number'?NEW_TO_OLD[s]:s.layoutOrder===undefined?s.level:s.layoutOrder===ORDER_TAG?s.layoutSource:undefined;
export function rules(s){if(typeof s==='number')return LEVELS[s];const source=sourceLevel(s);return source===0?(s.edition===undefined?FIRST_ORIGINAL:s.edition===2?FIRST_MOVING:SOURCE_LEVELS[0]):SOURCE_LEVELS[source];}
const bankLayout=s=>sourceLevel(s)===0&&s.edition===3;
export function rackPose(s,p){const a=(s.stageTime||0)*Math.PI*2/RACK_PERIOD+(p.rack||0)*2.1;return {x:p.x+RACK_SWING*Math.sin(a),vx:RACK_SWING*Math.PI*2/RACK_PERIOD*Math.cos(a)};}
function moveStands(s){if(!rules(s).moving)return;for(const p of s.plates)if(p.mode==='standing'){const pose=rackPose(s,rules(s).plates[p.id]);p.x=pose.x;p.vx=pose.vx;}}
export const collected=s=>s.plates.filter(p=>p.mode==='gone').length;
export const complete=s=>collected(s)===s.plates.length;
export function snapshot(s){const out=copy(s);delete out.pointerDown;delete out.saveError;delete out.aimDrag;return out;}
export function undo(s){delete s.aimDrag;return rewind(s);}
function fresh(r,level,edition,source){const s={...base('plate-play',r.detail,level),...(source===undefined?{}:{layoutOrder:ORDER_TAG,layoutSource:source}),...(edition===3?{edition:3,bankHits:0,bankFlash:0}:{}),aim:0,throws:0,remaining:r.balls,ball:null,plates:r.plates.map(p=>({...copy(p),mode:'standing',vx:0,vy:0,angle:0,omega:0,t:0,from:null,alpha:1})),flash:r.plates.map(()=>0),struck:[],hits:0,accum:0,physicalTime:0,motion:null};moveStands(s);return s;}
export function makeState(level=0){const r=rules(level);if(!r)throw Error('Choose a Paper Plate Parade chapter from1 to6.');const source=NEW_TO_OLD[level];return fresh(r,level,source===0?3:undefined,source);}
// Disposable example uses the original, static four-plate rules and schema.
export function makeSampleState(){return fresh(FIRST_ORIGINAL,0);}
export function setAim(s,angle){if(s.phase!=='play'||!Number.isFinite(angle))return false;s.aim=Math.max(-LIMIT,Math.min(LIMIT,Math.round(angle*2)/2));return true;}
export const angleAt=p=>Math.max(-LIMIT,Math.min(LIMIT,Math.atan2(p.x-ORIGIN.x,ORIGIN.y-p.y)*180/Math.PI));
export const aimValue=s=>s.aimDrag?Math.round(s.aimDrag.value*2)/2:s.aim;
export function beginAim(s,p){if(s.phase!=='play'||s.result)return false;s.aimDrag={value:angleAt(p)};return true;}
export function moveAim(s,p){if(s.aimDrag)s.aimDrag.value=angleAt(p);}
export function endAim(s,commit){if(!s.aimDrag)return false;if(commit)setAim(s,s.aimDrag.value);delete s.aimDrag;return true;}
export function preview(s){const a=aimValue(s)*Math.PI/180,points=[];for(let i=1;i<=(bankLayout(s)?6:22);i++){const t=i*.025,p={x:ORIGIN.x+Math.sin(a)*SPEED*t,y:ORIGIN.y-Math.cos(a)*SPEED*t+GRAVITY*t*t/2};if(p.x<155||p.x>745||p.y<330)break;points.push(p);if(s.plates.some(q=>q.mode==='standing'&&Math.hypot(q.x-p.x,q.y-p.y)<q.r+18))break;}return points;}
export function shoot(s){if(s.phase!=='play'||s.result||!s.remaining)return false;if(s.aimDrag)setAim(s,s.aimDrag.value);delete s.aimDrag;remember(s);const a=s.aim*Math.PI/180;s.throws++;s.moves++;s.remaining--;s.ball={id:s.throws,x:ORIGIN.x,y:ORIGIN.y,r:18,vx:Math.sin(a)*SPEED,vy:-Math.cos(a)*SPEED,spin:0,mode:'flight',hit:[]};s.accum=0;s.phase='moving';s.motion={kind:'throw'};s.note='Ball away. Watch which plates lose their supports.';return true;}
function release(s,p,vx=0,vy=0,offset=0){if(p.mode!=='standing')return;p.mode='falling';p.hp=0;p.vx=Math.max(-650,Math.min(650,vx));p.vy=Math.max(-500,Math.min(500,vy));p.omega=Math.max(-6,Math.min(6,vx*.009+offset*.02));s.flash[p.id]=.5;}
function damage(s,p,vx,vy,offset){if(p.mode!=='standing')return;p.hp--;s.hits++;s.flash[p.id]=.5;if(p.hp<=0)release(s,p,vx*.16,vy*.15-15,offset);else s.note='One pin remains on that gold-rimmed support. Another impact will release it.';}
function supports(s){for(let n=0;n<s.plates.length;n++){let changed=false;for(const p of s.plates)if(p.mode==='standing'&&p.parents.length&&p.parents.every(id=>s.plates[id].mode!=='standing')){const parents=p.parents.map(id=>s.plates[id]);release(s,p,parents.reduce((v,p)=>v+p.vx,0)/parents.length*.18+(p.id%2?8:-8),0);changed=true;}if(!changed)break;}}
function collideBall(s,p){const b=s.ball,dx=b.x-p.x,dy=b.y-p.y,r=b.r+p.r,ds=dx*dx+dy*dy;if(ds>=r*r)return;const dist=Math.sqrt(ds)||.001,nx=dist>.001?dx/dist:0,ny=dist>.001?dy/dist:1,dot=(b.vx-p.vx)*nx+(b.vy-p.vy)*ny;if(dot>=0)return;
 b.x=p.x+nx*(r+.05);b.y=p.y+ny*(r+.05);if(p.mode==='standing'&&!b.hit.includes(p.id)){b.hit.push(p.id);damage(s,p,b.vx,b.vy,dx);}else if(p.mode==='falling'){p.vx+=b.vx*.12;p.vy+=b.vy*.12;p.omega+=b.vx*.002;}
 b.vx-=(1.55)*dot*nx;b.vy-=(1.55)*dot*ny;b.vx*=.8;b.vy*=.8;if(Math.abs(b.vx)<8&&Math.abs(nx)<.1)b.vx+=(b.id%2?1:-1)*16;
}
function collidePlates(s,a,b){if(a.mode!=='falling'&&b.mode!=='falling')return;if(!['standing','falling'].includes(a.mode)||!['standing','falling'].includes(b.mode))return;const dx=b.x-a.x,dy=b.y-a.y,r=a.r+b.r,ds=dx*dx+dy*dy;if(ds>=r*r)return;const dist=Math.sqrt(ds)||.001,nx=dist>.001?dx/dist:1,ny=dist>.001?dy/dist:0,va=a.mode==='falling',vb=b.mode==='falling',dot=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
 const overlap=r-dist+.05;if(va){a.x-=nx*overlap/(vb?2:1);a.y-=ny*overlap/(vb?2:1);}if(vb){b.x+=nx*overlap/(va?2:1);b.y+=ny*overlap/(va?2:1);}if(dot>=0)return;
 const tag=Math.min(a.id,b.id)+':'+Math.max(a.id,b.id);
 if(!s.struck.includes(tag)&&Math.abs(dot)>65){if(!va&&vb){s.struck.push(tag);damage(s,a,b.vx,b.vy,dx);}else if(va&&!vb){s.struck.push(tag);damage(s,b,a.vx,a.vy,-dx);}}
 const impulse=-(1.25)*dot/(va&&vb?2:1);if(va){a.vx-=impulse*nx;a.vy-=impulse*ny;a.omega-=nx*.2;if(!vb&&Math.abs(a.vx)<30&&Math.abs(ny)>.8)a.vx+=(a.id%2?1:-1)*35;}if(vb){b.vx+=impulse*nx;b.vy+=impulse*ny;b.omega+=nx*.2;if(!va&&Math.abs(b.vx)<30&&Math.abs(ny)>.8)b.vx+=(b.id%2?1:-1)*35;}
}
function bank(s,b,q,restitution,record=false){
 const dx=q.x2-q.x1,dy=q.y2-q.y1,u=Math.max(0,Math.min(1,((b.x-q.x1)*dx+(b.y-q.y1)*dy)/(dx*dx+dy*dy))),x=q.x1+dx*u,y=q.y1+dy*u,ex=b.x-x,ey=b.y-y,r=b.r+q.r,d=Math.hypot(ex,ey);if(d>=r)return;
 const nx=d>1e-8?ex/d:dy/Math.hypot(dx,dy),ny=d>1e-8?ey/d:-dx/Math.hypot(dx,dy),v=b.vx*nx+b.vy*ny;
 b.x=x+nx*(r+.05);b.y=y+ny*(r+.05);if(v<0){b.vx-=(1+restitution)*v*nx;b.vy-=(1+restitution)*v*ny;if(record){s.bankHits++;s.bankFlash=.5;}}
}
function finish(s){if(s.ball?.mode==='flight'||s.plates.some(p=>p.mode==='falling'||p.mode==='catch'))return;s.ball=null;s.accum=0;s.motion=null;
 if(complete(s)){s.phase='celebrate';s.pendingPennies=3+s.level;s.note='Every plate tumbled home. Bess raises the curtain!';}
 else if(!s.remaining){s.phase='result';s.result={won:false,title:'The last cloth ball settled',detail:(s.plates.length-collected(s))+' plates are still standing. Play again to refill the tray, or rethink your support choices.',prize:null,settle:true};}
 else{s.phase='play';s.note=bankLayout(s)?s.remaining+' balls left. Read the front screen, the bank and the pins before the next throw.':s.remaining+' balls left. Aim at a lower STAR support; let the whole stack fall.';}}
function physics(s){s.physicalTime+=STEP;if(bankLayout(s))s.bankFlash=Math.max(0,s.bankFlash-STEP);if(rules(s).moving){s.stageTime=(s.stageTime+STEP)%RACK_PERIOD;moveStands(s);}s.flash=s.flash.map(v=>Math.max(0,v-STEP));const b=s.ball;
 if(b?.mode==='flight'){b.vy+=GRAVITY*STEP;b.x+=b.vx*STEP;b.y+=b.vy*STEP;b.spin+=b.vx*.012*STEP;if(bankLayout(s))for(const rail of rules(s).rails)bank(s,b,rail,.8,true);if(rules(s).moving)for(const x of PARTITIONS){const cx=Math.max(x-4,Math.min(x+4,b.x)),cy=Math.max(350,Math.min(PARTITION_BOTTOM,b.y)),dx=b.x-cx,dy=b.y-cy,dist=Math.hypot(dx,dy);if(dist<b.r){const nx=dist>1e-8?dx/dist:(b.vx>0?-1:1),ny=dist>1e-8?dy/dist:0,dot=b.vx*nx+b.vy*ny;b.x=cx+nx*(b.r+.05);b.y=cy+ny*(b.r+.05);if(dot<0){b.vx-=1.5*dot*nx;b.vy-=1.5*dot*ny;}}}for(const p of s.plates)if(p.mode==='standing'||p.mode==='falling')collideBall(s,p);if(b.y>990||b.x<-90||b.x>990)b.mode='gone';}
 supports(s);
 for(const p of s.plates){if(p.mode==='falling'){p.vy=Math.min(1100,p.vy+GRAVITY*STEP);p.vx*=.999;p.x+=p.vx*STEP;p.y+=p.vy*STEP;p.angle+=p.omega*STEP;p.omega*=.999;if(bankLayout(s))for(const rail of rules(s).rails)bank(s,p,rail,.4);const left=rules(s).moving&&p.y-p.r<PARTITION_BOTTOM&&p.rack>0?PARTITIONS[p.rack-1]+4:160,right=rules(s).moving&&p.y-p.r<PARTITION_BOTTOM&&p.rack<2?PARTITIONS[p.rack]-4:740;if(p.x<left+p.r){p.x=left+p.r;p.vx=Math.abs(p.vx)*.4;}if(p.x>right-p.r){p.x=right-p.r;p.vx=-Math.abs(p.vx)*.4;}}
  else if(p.mode==='catch'){p.t=Math.min(.5,p.t+STEP);const u=p.t/.5,e=u*u*(3-2*u);p.x=p.from.x+(p.from.toX-p.from.x)*e;p.y=p.from.y+(952-p.from.y)*e;p.angle=p.from.angle+p.from.omega*p.t;p.alpha=1-u;if(p.t===.5)p.mode='gone';}}
 for(let i=0;i<s.plates.length;i++)for(let j=i+1;j<s.plates.length;j++)collidePlates(s,s.plates[i],s.plates[j]);supports(s);
 for(const p of s.plates)if(p.mode==='falling'&&p.y+p.r>=918){p.mode='catch';p.t=0;p.from={x:p.x,y:918-p.r,angle:p.angle,omega:p.omega,toX:Math.max(194,Math.min(706,p.x+p.vx*.06))};p.y=p.from.y;p.vx=0;p.vy=0;}
 finish(s);
}
export function step(s,dt){if(s.result||s.phase==='celebrate'||!Number.isFinite(dt)||dt<=0)return;s.t+=dt;if(s.phase==='moving'){s.accum+=dt;while(s.accum+1e-10>=STEP&&s.phase==='moving'){s.accum=Math.max(0,s.accum-STEP);physics(s);}}else{if(bankLayout(s))s.bankFlash=Math.max(0,s.bankFlash-dt);if(rules(s).moving){s.stageTime=(s.stageTime+dt)%RACK_PERIOD;moveStands(s);}s.flash=s.flash.map(v=>Math.max(0,v-dt));}}
export function restore(blob,level=blob?.level){const bad=validate(blob,'plate-play');if(blob.v!==2||blob.level!==level||!LEVELS[level])bad();const tagged=blob.layoutOrder!==undefined||blob.layoutSource!==undefined;if(tagged&&(blob.layoutOrder!==ORDER_TAG||!Number.isInteger(blob.layoutSource)||!SOURCE_LEVELS[blob.layoutSource]||OLD_TO_NEW[blob.layoutSource]!==level))bad();const s=snapshot(blob),r=rules(s),int=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b,finite=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
 if(s.edition!==undefined&&(sourceLevel(s)!==0||![2,3].includes(s.edition))||r.moving&&!finite(s.stageTime,0,RACK_PERIOD))bad();
 if(bankLayout(s)&&(!int(s.bankHits,0,1000)||!finite(s.bankFlash,0,.5)))bad();
 if(!finite(s.aim,-LIMIT,LIMIT)||!int(s.throws,0,r.balls)||!int(s.remaining,0,r.balls)||s.throws+s.remaining!==r.balls||!Array.isArray(s.plates)||s.plates.length!==r.plates.length||!Array.isArray(s.flash)||s.flash.length!==r.plates.length||s.flash.some(v=>!finite(v,0,.5))||!Array.isArray(s.struck)||s.struck.length>r.plates.length*r.plates.length||!int(s.hits,0,r.plates.reduce((n,p)=>n+p.hp,0))||!finite(s.accum,0,.051)||!finite(s.physicalTime,0,300))bad();
 for(let i=0;i<s.plates.length;i++){const p=s.plates[i],a=r.plates[i],expectedX=r.moving?rackPose(s,a).x:a.x;if(p.id!==i||p.r!==a.r||p.art!==a.art||p.rack!==a.rack||JSON.stringify(p.parents)!==JSON.stringify(a.parents)||!['standing','falling','catch','gone'].includes(p.mode)||!int(p.hp,0,a.hp)||!finite(p.x,110,790)||!finite(p.y,-500,1000)||![p.vx,p.vy,p.angle,p.omega].every(Number.isFinite)||!finite(p.alpha,0,1)||!finite(p.t,0,.5)||(p.mode==='standing'&&(p.hp<1||Math.abs(p.x-expectedX)>1e-8||p.y!==a.y)))bad();if(p.mode==='catch'&&(!p.from||![p.from.x,p.from.y,p.from.angle,p.from.omega,p.from.toX].every(Number.isFinite)))bad();}
 if(s.ball&&(!int(s.ball.id,1,r.balls)||!['flight','gone'].includes(s.ball.mode)||s.ball.r!==18||![s.ball.x,s.ball.y,s.ball.vx,s.ball.vy,s.ball.spin].every(Number.isFinite)||!Array.isArray(s.ball.hit)||new Set(s.ball.hit).size!==s.ball.hit.length||s.ball.hit.some(v=>!int(v,0,r.plates.length-1))))bad();
 if((s.phase==='moving')!==!!s.motion||s.motion&&s.motion.kind!=='throw'||s.phase==='celebrate'&&(!complete(s)||s.ball))bad();s.history=s.history.map(h=>{const p=restore({...h,history:[]},level);delete p.history;return p;});return copy(s);}

// Reindex a validated old save without changing its physical layout or receipts.
export function reorderState(blob){
 const old=restore(blob,blob?.level);if(old.layoutOrder===ORDER_TAG)return old;
 function reindex(state){const out=copy(state),source=state.level;out.level=OLD_TO_NEW[source];out.layoutOrder=ORDER_TAG;out.layoutSource=source;if(Array.isArray(out.history))out.history=out.history.map(reindex);return out;}
 const next=reindex(old);return restore(next,next.level);
}
