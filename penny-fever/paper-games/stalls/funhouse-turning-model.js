// Juno's six Turning Funhouse chapters. Local review counters only.
// Masks advance with guest actions. Rendering time never advances their decisions.
export const SIZE=9,DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
export const STAGE={x:105,y:310,room:230,cell:230/3};
export const CENTRES=Array.from({length:9},(_,r)=>({x:(r%3)*3+1,y:Math.floor(r/3)*3+1}));
export const PORTALS=[3,5],BELLS=[0,4,8],KEY_ROOM=1,EXIT_ROOM=2,START_ROOM=6;
export const LEVELS=[
 {name:'The Turning House',detail:'Learn to turn paths and ring three bells.',angles:[1,2,3,0,2,1,0,3,1],shapes:'LTLTTTLTL',bells:[0,4,8],key:1,exit:2,start:6,portals:[3,5],masks:[8],every:2,stun:4,grace:4,gates:[],colours:['#40605a','#243d3b','#5c4544','#38262e']},
 {name:'Curtain Call',detail:'A straight hall and a new curtain shortcut.',angles:[3,0,2,1,1,3,2,0,1],shapes:'LTLTITLTL',bells:[1,5,7],key:4,exit:2,start:6,portals:[0,8],masks:[0],every:2,stun:4,grace:4,gates:[],colours:['#6c6178','#44394e','#536978','#304b59']},
 {name:'The Mirror Twins',detail:'Two masks approach from different wings.',angles:[0,3,1,2,0,1,3,2,0],shapes:'LTLTTTLTL',bells:[0,4,8],key:7,exit:2,start:6,portals:[1,5],masks:[2,8],every:3,stun:5,grace:4,gates:[],colours:['#3f7777','#214b53','#6c5267','#432e49']},
 {name:'The Narrow House',detail:'Four bells and three revolving straight halls.',angles:[2,1,0,3,0,2,1,1,3],shapes:'LILTITLIL',bells:[0,5,6,8],key:2,exit:1,start:4,portals:[3,7],masks:[6,8],every:3,stun:5,grace:3,gates:[],colours:['#8b6153','#593a39','#66704c','#3f4d38']},
 {name:'Clockwork Curtains',detail:'Curtain gates change with each action. Wait for an opening.',angles:[1,3,2,0,1,2,0,3,1],shapes:'LTLTITLTL',bells:[0,2,6,8],key:1,exit:5,start:4,portals:[3,7],masks:[3,7],every:3,stun:4,grace:3,gates:[{a:1,b:4,period:6,on:4,offset:0},{a:4,b:5,period:6,on:4,offset:3}],colours:['#715749','#49352e','#5b6d58','#354637']},
 {name:'The Last Laugh',detail:'Five bells, two masks and three changing gates.',angles:[3,1,0,2,3,0,1,2,2],shapes:'LILTTTLIL',bells:[0,1,4,6,8],key:7,exit:5,start:3,portals:[4,5],masks:[3,5],arms:[0,null],every:3,stun:5,grace:2,gates:[{a:0,b:1,period:6,on:4,offset:0},{a:4,b:7,period:6,on:4,offset:2},{a:5,b:8,period:6,on:4,offset:4}],colours:['#655478','#362a4c','#745167','#472b42']},
];
export const rules=s=>LEVELS[typeof s==='number'?s:s.level];
export const gateOpen=(s,g)=>(s.moves+g.offset)%g.period<g.on;
export function canCross(s,a,b){const r=roomAt(a),n=roomAt(b);return !rules(s).gates.some(g=>(g.a===r&&g.b===n||g.b===r&&g.a===n)&&!gateOpen(s,g));}
export const baseExits=shape=>shape==='L'?[0,1]:shape==='I'?[0,2]:[0,1,3];
const clone=s=>JSON.parse(JSON.stringify(s));
export const roomAt=p=>Math.floor(p.y/3)*3+Math.floor(p.x/3);
export const position=p=>({x:STAGE.x+(p.x+.5)*STAGE.cell,y:STAGE.y+(p.y+.5)*STAGE.cell});
export function exits(s,r){return baseExits(s.rooms[r].shape).map(n=>(n+s.rooms[r].q)%4);}
function maskHome(s,kind){const r=rules(s),home=r.masks[kind],point={...CENTRES[home]},arm=r.arms?.[kind];if(arm!=null){const d=(arm+s.rooms[home].q)%4;point.x+=DIRS[d][0];point.y+=DIRS[d][1];}return point;}
export function open(s,p){if(!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<0||p.x>=9||p.y<0||p.y>=9)return false;const x=p.x%3,y=p.y%3;if(x===1&&y===1)return true;const d=x===1&&y===0?0:x===2&&y===1?1:x===1&&y===2?2:x===0&&y===1?3:-1;return d>=0&&exits(s,roomAt(p)).includes(d);}
const equal=(a,b)=>a.x===b.x&&a.y===b.y;
export function neighbours(s,p){const out=DIRS.map(([x,y])=>({x:p.x+x,y:p.y+y})).filter(q=>open(s,q)&&canCross(s,p,q)),ports=rules(s).portals;for(let i=0;i<2;i++)if(equal(p,CENTRES[ports[i]]))out.push({...CENTRES[ports[1-i]]});return out;}
export function path(s,from,to){if(!open(s,from)||!open(s,to))return null;const todo=[{...from}],seen=new Map([[from.y*9+from.x,null]]);for(let i=0;i<todo.length;i++){const p=todo[i];if(equal(p,to)){const out=[];let v=p;while(v){out.push(v);v=seen.get(v.y*9+v.x);}return out.reverse();}for(const q of neighbours(s,p)){const k=q.y*9+q.x;if(!seen.has(k)){seen.set(k,p);todo.push(q);}}}return null;}
export function makeState(level=0,run=1){if(!Number.isInteger(level)||!LEVELS[level])throw Error('Choose a Turning Funhouse chapter from 1 to 6.');const r=rules(level),s={v:2,level,run,t:0,phase:'idle',phaseT:0,rooms:r.angles.map((q,i)=>({shape:r.shapes[i],q})),player:{...CENTRES[r.start]},masks:[],bells:r.bells.map(room=>({room,taken:false})),hasKey:false,keyEarned:false,moves:0,turns:0,catches:0,maskBeat:0,maskEvery:r.every,maskStun:0,grace:r.grace,selected:r.start,route:[],animation:null,history:[],pendingPennies:0,paidPennies:0,prizeKept:false,chapterPrize:null,rewardReveal:null,completionRecorded:false,result:null,note:level===0?'Ring three bells, find the key, then reach the glowing door. Turn rooms to open your way.':r.detail};s.masks=r.masks.map((home,kind)=>({...maskHome(s,kind),home,kind}));return s;}
function history(s){const b=snapshot(s);delete b.history;s.history.push(b);if(s.history.length>40)s.history.shift();}
export function undo(s){if(s.saveError||s.completionRecorded||s.phase==='celebrate'||s.result||!s.history.length)return false;const entries=s.history,old=entries.pop();Object.assign(s,clone(old),{history:entries,route:[],animation:null,phase:'idle',phaseT:0,note:'One move rewound. Try another route.'});return true;}
export function select(s,r){if(!Number.isInteger(r)||r<0||r>=9)return false;s.selected=r;return true;}
export function walk(s,target){if(s.phase!=='idle'||s.saveError||s.result)return false;const route=path(s,s.player,target);if(!route||route.length<2){s.note='That path is closed. Turn a room to join its doorways.';return false;}s.route=route.slice(1);return beginMove(s);}
function beginMove(s){if(!s.route.length||s.phase!=='idle')return false;const to=s.route.shift();if(!neighbours(s,s.player).some(p=>equal(p,to))){s.route=[];s.note='The curtain closed. Wait for an opening or turn another path.';return false;}history(s);const from={...s.player},warp=Math.abs(from.x-to.x)+Math.abs(from.y-to.y)>1;s.player={...to};s.phase='walk';s.phaseT=0;s.animation={kind:warp?'warp':'walk',from,to:{...to},duration:warp?.65:.22};s.moves++;return true;}
function rotatePoint(p,r,dir){if(roomAt(p)!==r)return;const a=p.x%3-1,b=p.y%3-1;p.x=(r%3)*3+1+(dir===1?-b:b);p.y=Math.floor(r/3)*3+1+(dir===1?a:-a);}
export function turn(s,r=s.selected,dir=1){if(s.phase!=='idle'||s.saveError||s.result||![1,-1].includes(dir)||!Number.isInteger(r)||r<0||r>=9)return false;history(s);s.route=[];s.selected=r;const q=s.rooms[r].q;s.rooms[r].q=(q+dir+4)%4;rotatePoint(s.player,r,dir);for(const mask of s.masks)rotatePoint(mask,r,dir);s.phase='turn';s.phaseT=0;s.animation={kind:'turn',room:r,from:q,to:s.rooms[r].q,dir,duration:.42};s.moves++;s.turns++;s.note='The room turns. Its paths and everyone inside turn with it.';return true;}
export function wait(s){if(s.phase!=='idle'||s.saveError||s.result)return false;history(s);s.route=[];s.moves++;s.phase='wait';s.phaseT=0;s.animation={kind:'wait',duration:.18};s.note='Let the mask make its move…';return true;}
function collect(s){const r=rules(s);for(const bell of s.bells)if(!bell.taken&&equal(s.player,CENTRES[bell.room])){bell.taken=true;s.pendingPennies++;s.maskStun=r.stun;s.note=s.level===0?'DING! The bell distracts the mask for four turns.':'DING! The bells distract every mask. Plan your next move.';}
 if(!s.hasKey&&equal(s.player,CENTRES[r.key])){s.hasKey=true;if(!s.keyEarned){s.pendingPennies+=2;s.keyEarned=true;}s.note=s.level===0?'Key found. Ring all three bells, then reach the glowing door.':'Key found. Ring every bell, then reach the glowing door.';}
 if(equal(s.player,CENTRES[r.exit])){if(s.hasKey&&s.bells.every(b=>b.taken)){s.route=[];s.phase='celebrate';s.phaseT=0;s.animation=null;s.note='CURTAIN CALL! You outwitted the house.';return true;}s.note=s.hasKey?'The door needs every bell.':'The door needs the star key and every bell.';}return false;
}
function caught(s){s.catches++;s.route=[];s.hasKey=false;s.player={...CENTRES[rules(s).start]};for(const mask of s.masks)Object.assign(mask,maskHome(s,mask.kind));s.grace=3;s.phase='caught';s.phaseT=0;s.animation={kind:'caught',duration:.8};s.note='BOO! Back to the entrance. Bells stay rung; find the key again. Undo can rewind this.';}
export function predicted(s){return s.masks.map(mask=>{if(s.grace||s.maskStun||s.maskBeat+1<s.maskEvery)return null;const p=path(s,mask,s.player);return p?.[1]||null;});}
function masksAct(s){if(s.grace>0){s.grace--;return;}if(s.maskStun>0){s.maskStun--;return;}s.maskBeat=(s.maskBeat+1)%s.maskEvery;if(s.maskBeat)return;const motion=[];for(const mask of s.masks){const route=path(s,mask,s.player);const from={x:mask.x,y:mask.y};if(route?.length>1){mask.x=route[1].x;mask.y=route[1].y;}motion.push({from,to:{x:mask.x,y:mask.y}});}s.phase='masks';s.phaseT=0;s.animation={kind:'masks',motion,duration:.3};}
function afterAction(s){if(s.masks.some(m=>equal(m,s.player))&&s.grace<=0&&s.maskStun<=0){caught(s);return;}if(collect(s))return;masksAct(s);if(s.phase!=='masks'){s.phase='idle';s.phaseT=0;s.animation=null;}}
export function step(s,dt){if(s.saveError||s.result||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.05);s.t+=dt;
 if(s.phase==='celebrate'){s.phaseT+=dt;if(s.rewardReveal)s.rewardReveal.t+=dt;if(s.phaseT>=3.9)s.result={title:'You outwitted the house!',detail:`${s.bells.length} bells, one key and a curtain call. ${s.moves} moves · ${s.paidPennies} test pennies banked.`,won:true,prize:null,settle:true};return;}
 if(s.phase==='idle'){if(s.route.length)beginMove(s);return;}
 s.phaseT+=dt;if(s.phaseT+1e-9<(s.animation?.duration||.2))return;
 if(s.phase==='masks'){if(s.masks.some(m=>equal(m,s.player))){caught(s);return;}s.phase='idle';s.animation=null;s.phaseT=0;}
 else if(s.phase==='caught'){s.phase='idle';s.animation=null;s.phaseT=0;}
 else afterAction(s);
}
export function snapshot(s){const out=clone(s);delete out.saveError;delete out.pointerDown;return out;}
export function restore(blob,level=blob?.level??0){const s=clone(blob),bad=()=>{throw Error('Saved Turning Funhouse needs attention; it has not been reset.');};const int=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b,finite=(v,a=0,b=1e9)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;
 if(s?.v===1&&s.level===0)s.v=2;
 const r=rules(level);
 if(!s||s.v!==2||!r||s.level!==level||!int(s.run,1,1e8)||!finite(s.t)||!['idle','walk','turn','wait','masks','caught','celebrate'].includes(s.phase)||!finite(s.phaseT)||!Array.isArray(s.rooms)||s.rooms.length!==9||!s.rooms.every((tile,i)=>tile.shape===r.shapes[i]&&int(tile.q,0,3)))bad();
 const point=p=>p&&int(p.x,0,8)&&int(p.y,0,8)&&open(s,p);
 if(!point(s.player)||!Array.isArray(s.masks)||s.masks.length!==r.masks.length||!s.masks.every((m,i)=>point(m)&&m.home===r.masks[i]&&m.kind===i)||!Array.isArray(s.bells)||s.bells.length!==r.bells.length||!s.bells.every((b,i)=>b.room===r.bells[i]&&typeof b.taken==='boolean')||![s.hasKey,s.keyEarned,s.prizeKept,s.completionRecorded].every(v=>typeof v==='boolean'))bad();
 if(!['moves','turns','catches','maskBeat','maskEvery','maskStun','grace','pendingPennies','paidPennies'].every(k=>int(s[k],0,1e8))||s.maskEvery!==r.every||s.maskBeat>=s.maskEvery||s.maskStun>r.stun||s.grace>4||s.pendingPennies+s.paidPennies>r.bells.length+2||!int(s.selected,0,8)||!Array.isArray(s.route)||s.route.length>81||!s.route.every(p=>p&&int(p.x,0,8)&&int(p.y,0,8))||!Array.isArray(s.history)||s.history.length>40)bad();
 for(let i=0;i<s.history.length;i++){const h=s.history[i];if(h.history!==undefined)bad();const restored=restore({...h,history:[]},level);delete restored.history;s.history[i]=restored;}
 if(s.phase==='idle'||s.phase==='celebrate'){if(s.animation!==null)bad();}else{
  const a=s.animation;if(!a||!finite(a.duration,.1,1)||a.kind!==s.phase&&!(s.phase==='walk'&&a.kind==='warp'))bad();
  if(s.phase==='walk'&&(!a.from||!a.to||!['x','y'].every(k=>int(a.from[k],0,8)&&int(a.to[k],0,8))||!equal(a.to,s.player)))bad();
  if(s.phase==='turn'&&(!int(a.room,0,8)||!int(a.from,0,3)||!int(a.to,0,3)||![1,-1].includes(a.dir)||s.rooms[a.room].q!==a.to))bad();
  if(s.phase==='masks'&&(!Array.isArray(a.motion)||a.motion.length!==s.masks.length||!a.motion.every((m,i)=>point(m.from)&&point(m.to)&&equal(m.to,s.masks[i]))))bad();
 }
 if(s.phase==='celebrate'&&(!s.hasKey||!s.bells.every(b=>b.taken)||!equal(s.player,CENTRES[r.exit])))bad();
 if(s.rewardReveal&&(!s.prizeKept||typeof s.rewardReveal.id!=='string'||!finite(s.rewardReveal.t)))bad();
 if(s.result&&(!s.result.won||s.phase!=='celebrate'||s.phaseT<3.9))bad();
 return s;
}
