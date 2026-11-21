import {base,copy,remember,undo,snapshot,validate,ease} from './study-state.js?v=studies-six-1';
export {undo,snapshot};
export const SEALS=[0,1,2,0,1,2],QUEUES=[[1,0,2,1],[0,2,1,2],[2,0,0,1]],TURN_LIMIT=8;
export const COLOURS=['Rose','Moon','Mint','Blue'];
const p=(colour,size=1,ticket=-1)=>({colour,size,ticket});
export const LEVELS=[
 {name:'A turn before moonrise',detail:'Two matching guests fit each cabin.',seals:SEALS,capacity:[2,2,2,2,2,2],queues:QUEUES.map(q=>q.map(c=>p(c))),bench:3,turns:8},
 {name:'Friends ride together',detail:'Joined guests need two seats together.',seals:SEALS,capacity:[2,3,2,2,3,2],queues:[[p(1,2),p(0,2),p(2,2)],[p(0),p(1,2),p(2)],[p(0),p(1),p(1),p(2)]],bench:3,turns:8},
 {name:'Little and large cabins',detail:'Fit groups into cabins of two or three seats.',seals:SEALS,capacity:[3,2,3,2,3,2],queues:[[p(1,2),p(0,2),p(2,2),p(0)],[p(0),p(2),p(1,2)],[p(2,2),p(1),p(0)]],bench:3,turns:8},
 {name:'The little platform',detail:'Only two groups can wait on the platform.',seals:SEALS,capacity:[3,2,3,2,3,2],queues:[[p(0,2),p(2),p(1,2),p(2,2)],[p(1),p(0),p(1,2)],[p(2,2),p(0,2)]],bench:2,turns:8},
 {name:'Tickets A and B',detail:'Lettered tickets belong to the matching lettered cabin.',seals:SEALS,capacity:[2,2,2,2,2,2],queues:[[p(1,1,1),p(0,2,0),p(2,2,2)],[p(0,1,3),p(1,1,1),p(0,1,3)],[p(2,2,5),p(1,2,4)]],bench:3,turns:8,tickets:true},
 {name:'The last moonlit wheel',detail:'Four colours, joined guests, two waiting seats and cabin tickets.',seals:[0,1,2,3,0,1],capacity:[3,2,3,2,3,2],queues:[[p(1,2,1),p(0,2,0),p(2,2,2)],[p(0,1,0),p(3,2,3),p(0,2,4)],[p(2,1,2),p(0,1,4),p(1,2,5)]],bench:2,turns:8,tickets:true},
];
const SAMPLE_LEVEL={name:'Two guests, one little ride',detail:'Board two matching guests, then take them round.',seals:[0,1],capacity:[1,1],queues:[[p(0)],[p(1)],[]],bench:1,turns:1};
export const rules=s=>s?.demo===true?SAMPLE_LEVEL:LEVELS[typeof s==='number'?s:s.level];
export const size=g=>g.size??1;
export const occupied=c=>c.guests.reduce((n,g)=>n+size(g),0);
export const full=s=>s.cabins.every(c=>occupied(c)===c.capacity);
export const guestSpot=(c,r)=>({x:290+c*160,y:887+r*31});
export const benchX=(s,i)=>450+(i-(rules(s).bench-1)/2)*120;
export function ticketName(cabin,level=0){const seals=rules(level).seals;return seals.indexOf(seals[cabin])===cabin?'A':'B';}
export function makeState(level=0){const r=rules(level);if(!r)throw Error('Unknown Last Boarding chapter.');let id=0;return {...base('boarding',level===0?'Two matching guests fit each cabin. Clear the queues without filling the three waiting seats.':r.detail,level),queues:r.queues.map(q=>q.map(g=>({id:id++,...g}))),bench:[],cabins:r.seals.map((colour,i)=>({colour,capacity:r.capacity[i],guests:[]})),cabin:0,angle:0,turns:0,motion:null,rides:0,delivered:0};}
export function makeSampleState(){const s=makeState(0);s.demo=true;const r=rules(s);let id=0;s.queues=r.queues.map(q=>q.map(g=>({id:id++,...g})));s.cabins=r.seals.map((colour,i)=>({colour,capacity:r.capacity[i],guests:[]}));s.note=r.detail;return s;}
export function fits(s,g){const c=s.cabins[s.cabin];return g.colour===c.colour&&(g.ticket==null||g.ticket<0||g.ticket===s.cabin)&&occupied(c)+size(g)<=c.capacity;}
function seatX(c,index){let before=0;for(let i=0;i<index;i++)before+=size(c.guests[i]);return 450+(before+(size(c.guests[index])-1)/2-(c.capacity-1)/2 )*(c.capacity===2?36:24);}
export function choose(s,source,index){
 if(s.phase!=='play'||s.motion||s.result)return false;const row=source==='queue'?s.queues[index]:null;
 const guest=source==='queue'?row?.[0]:source==='bench'?s.bench[index]:null;if(!guest)return false;
 const cabin=s.cabins[s.cabin],boards=fits(s,guest);
 if(!boards&&(source==='bench'||s.bench.length>=rules(s).bench)){s.note=guest.ticket>=0?'That ticket needs '+COLOURS[guest.colour]+' cabin '+ticketName(guest.ticket,s.level)+'.':'That group needs another cabin or more seats. Keep a waiting place free.';return false;}
 remember(s);if(source==='queue')row.shift();else s.bench.splice(index,1);
 const from=source==='queue'?{x:guestSpot(index,0).x,y:guestSpot(index,0).y-12}:{x:benchX(s,index),y:813};
 if(boards)cabin.guests.push({...guest});else s.bench.push({...guest});
 const to=boards?{x:seatX(cabin,cabin.guests.length-1),y:683}:{x:benchX(s,s.bench.length-1),y:813};
 s.moves++;s.phase='moving';s.motion={kind:'walk',t:0,duration:.65,guest,from,to};s.note=boards?'A '+COLOURS[guest.colour].toLowerCase()+' guest steps aboard.':'A guest waits on the little platform.';return true;
}
export function advance(s){
 if(s.phase!=='play'||s.motion||s.result)return false;const all=full(s);
 if(!all&&s.turns>=rules(s).turns){s.note='The boarding turns are used. Retry the queue.';s.result={title:'Last boarding call',detail:'Some cabins are still empty. Try freeing a different guest first.',won:false,prize:null,settle:true};s.phase='result';return false;}
 remember(s);s.moves++;s.phase='moving';
 if(all){s.motion={kind:'ride',t:0,duration:5.5,from:s.angle,to:s.angle+Math.PI*2};s.note='Everyone aboard! One whole turn under the carnival lights.';}
 else{s.motion={kind:'turn',t:0,duration:1.05,from:s.angle,to:s.angle+(s.demo===true?Math.PI*2/s.cabins.length:Math.PI/3)};s.turns++;s.note='Next cabin coming round. The guests stay upright.';}return true;
}
export function step(s,dt){
 if(s.result||s.phase==='celebrate'||!Number.isFinite(dt)||dt<=0)return;s.t+=dt;const m=s.motion;if(!m)return;m.t=Math.min(m.duration,m.t+dt);const u=ease(m.t/m.duration);
 if(m.kind!=='walk')s.angle=m.from+(m.to-m.from)*u;
 if(m.t===m.duration){s.motion=null;if(m.kind==='turn')s.cabin=(s.cabin+1)%(s.demo===true?s.cabins.length:6);
  if(m.kind==='ride'){s.delivered=rules(s).capacity.reduce((a,b)=>a+b,0);s.rides++;s.phase='celebrate';s.pendingPennies=3+s.level;s.note=s.level===0?'All twelve guests have had their moonlit turn.':'Every guest has had their moonlit turn.';}else s.phase='play';}
}
export function restore(blob,level=blob?.level){
 if(blob?.demo===true)throw Error('Disposable boarding sample is not a real chapter save.');
 const bad=validate(blob,'boarding');if(blob.level!==level||!LEVELS[level])bad();const s=snapshot(blob),r=rules(level),original=makeState(level).queues.flat();s.v=2;
 const int=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b;
 if(!Array.isArray(s.queues)||s.queues.length!==3||!Array.isArray(s.bench)||s.bench.length>r.bench||!Array.isArray(s.cabins)||s.cabins.length!==6||!int(s.cabin,0,5)||!int(s.turns,0,r.turns)||!Number.isFinite(s.angle)||!int(s.delivered,0,r.capacity.reduce((a,b)=>a+b,0)))bad();
 for(let i=0;i<6;i++)if(s.cabins[i].capacity===undefined&&level===0)s.cabins[i].capacity=2;
 const guests=[...s.queues.flat(),...s.bench,...s.cabins.flatMap(c=>c.guests)];
 for(const g of guests){if(g.size===undefined&&level===0)g.size=1;if(g.ticket===undefined&&level===0)g.ticket=-1;}
 if(s.motion?.guest&&level===0){s.motion.guest.size??=1;s.motion.guest.ticket??=-1;}
 if(guests.length!==original.length||new Set(guests.map(g=>g.id)).size!==original.length||guests.some(g=>!int(g.id,0,original.length-1)||g.colour!==original[g.id].colour||size(g)!==size(original[g.id])||g.ticket!==original[g.id].ticket))bad();
 if(s.cabins.some((c,i)=>c.colour!==r.seals[i]||c.capacity!==r.capacity[i]||occupied(c)>c.capacity||c.guests.some(g=>g.colour!==c.colour||(g.ticket>=0&&g.ticket!==i))))bad();
 if(s.motion&&(!['walk','turn','ride'].includes(s.motion.kind)||!Number.isFinite(s.motion.t)||s.motion.t<0||s.motion.t>s.motion.duration||![.65,1.05,5.5].includes(s.motion.duration)))bad();
 if((s.phase==='moving')!==!!s.motion)bad();if(s.phase==='celebrate'&&(!full(s)||s.delivered!==r.capacity.reduce((a,b)=>a+b,0)))bad();
 s.history=s.history.map(h=>{const b=restore({...h,history:[]},level);delete b.history;return b;});return copy(s);
}
