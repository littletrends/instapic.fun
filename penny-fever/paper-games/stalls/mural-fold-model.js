import {base,copy,remember,undo,snapshot,validate} from './study-state.js?v=studies-six-1';
export {undo,snapshot};
export const SIZE=5,START=22,GOAL=2;
export const BASE=[0,0,1,0,0, 1,0,0,0,1, 0,1,1,1,0, 0,1,1,1,0, 0,0,1,0,0];
export const EDGES=[{name:'West',key:'1',pattern:[1,1,1,0,0]},{name:'North',key:'2',pattern:[1,1,1,0,0]},{name:'East',key:'3',pattern:[0,1,1,0,0]},{name:'South',key:'4',pattern:[1,1,0,0,0]}];
export const SEALS=[{cell:5,name:'Rose garden',colour:'#b76b7e'},{cell:9,name:'Little pavilion',colour:'#789d87'},{cell:20,name:'Paper bridge',colour:'#c6a064'}];
const board=cells=>Array.from({length:25},(_,i)=>Number(cells.includes(i)));
const seals=(cells)=>cells.map((cell,i)=>({cell,name:['Rose garden','Little pavilion','Paper bridge','Star trees'][i],colour:['#b76b7e','#789d87','#c6a064','#7a95a0'][i]}));
export const LEVELS=[
 {name:'A fold before moonrise',base:BASE,patterns:EDGES.map(e=>e.pattern),start:START,goal:GOAL,seals:SEALS,limit:2},
 {name:'The wandering pavilion',detail:'A sideways entrance, three distant seals, and a gate in the far corner.',base:board([6,7,10,11,12,13,14,17,18]),patterns:[[1,1,0,0,0],[0,1,1,0,0],[0,0,1,1,1],[0,0,1,1,0]],start:10,goal:24,seals:seals([5,1,23]),limit:2},
 {name:'One fold at a time',detail:'Only one margin can stay folded. Plan the way back before you leave.',base:board([6,7,8,11,12,13,16,17,18,22]),patterns:[[0,1,1,1,0],[0,1,1,1,0],[0,1,1,1,0],[0,1,1,1,0]],start:12,goal:22,seals:seals([2,10,14]),limit:1},
 {name:'The two painted banks',detail:'Four seals sit across two banks. A folded bridge is your only crossing.',base:board([6,8,11,13,16,18]),patterns:[[0,1,1,1,0],[1,1,1,1,1],[0,1,1,1,0],[1,1,1,1,1]],start:11,goal:13,seals:seals([10,2,14,22]),limit:2},
 {name:'Corners of a little world',detail:'Four corner seals. Overlapping folds can hide the path below.',base:board([7,11,12,13,17]),patterns:[[1,1,1,0,0],[0,1,1,1,1],[0,0,1,1,1],[1,1,1,0,0]],start:17,goal:2,seals:seals([0,4,20,24]),limit:2},
 {name:'The painted procession',detail:'Paint seals 1 to 4 in order. The empty centre makes a longer way round.',base:board([6,7,8,11,13,16,17,18]),patterns:[[1,1,1,0,0],[0,1,1,1,1],[0,0,1,1,1],[1,1,1,0,0]],start:17,goal:2,seals:seals([4,20,0,24]),limit:2,ordered:true},
];
export const rules=s=>LEVELS[typeof s==='number'?s:s.level];
export const xy=cell=>({x:cell%5,y:Math.floor(cell/5)});
export const point=cell=>({x:262+(cell%5)*94,y:407+Math.floor(cell/5)*94});
export function onMargin(cell,edge){const {x,y}=xy(cell);return edge===0?x===0:edge===1?y===0:edge===2?x===4:y===4;}
export function openCells(mask,level=0){const r=rules(level),cells=r.base.slice();for(let edge=0;edge<4;edge++)if(mask&(1<<edge))for(let i=0;i<5;i++)cells[edge===0?i*5:edge===1?i:edge===2?i*5+4:20+i]=r.patterns[edge][i];return cells;}
export const countFolds=mask=>mask.toString(2).split('1').length-1;
export function makeState(level=0){const r=rules(level);if(!r)throw Error('Choose a Fold Trail chapter from 1 to 6.');return {...base('fold-trail',level===0?'Step onto the painted path. Fold the margins to reach all three painted seals.':r.detail,level),pawn:r.start,folds:0,seals:[],motion:null,visits:[r.start],flash:0};}
export function toggle(s,edge){
 if(s.phase!=='play'||s.result||!Number.isInteger(edge)||edge<0||edge>3)return false;
 if(onMargin(s.pawn,edge)){s.note='Step off that margin before folding or opening it.';return false;}
 const bit=1<<edge,next=s.folds^bit;
 if(countFolds(next)>rules(s).limit){s.note=rules(s).limit===1?'Only one fold can stay held here. Open it before making another.':'Two folds are held already. Open one before making another.';return false;}
 remember(s);s.moves++;s.phase='moving';s.motion={kind:'fold',edge,from:s.folds,to:next,t:0,duration:.9};s.note=(next&bit?'Folding the ':'Opening the ')+EDGES[edge].name.toLowerCase()+' margin. The painting carries a new path.';return true;
}
export function route(s,target){
 if(!Number.isInteger(target)||target<0||target>24)return null;const open=openCells(s.folds,s.level);if(!open[target])return null;
 const q=[[s.pawn]],seen=new Set([s.pawn]);for(let i=0;i<q.length;i++){const path=q[i],at=path.at(-1);if(at===target)return path;
  const {x,y}=xy(at);for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){const nx=x+dx,ny=y+dy,n=ny*5+nx;if(nx>=0&&nx<5&&ny>=0&&ny<5&&open[n]&&!seen.has(n)){seen.add(n);q.push([...path,n]);}}
 }return null;
}
export function walk(s,target){
 if(s.phase!=='play'||s.result)return false;const path=route(s,target);
 if(!path||path.length<2){s.note=target===s.pawn?'Your paper traveller is here. Try a connected path or a fold.':'That painted path is not connected yet. Try folding a margin.';return false;}
 remember(s);s.moves++;s.phase='moving';s.motion={kind:'walk',path,index:0,t:0,duration:.32};s.note='The little traveller follows the painted path.';return true;
}
export function arrow(s,dx,dy){const {x,y}=xy(s.pawn),nx=x+dx,ny=y+dy;if(nx<0||nx>4||ny<0||ny>4)return false;return walk(s,ny*5+nx);}
function arrived(s){
 if(!s.visits.includes(s.pawn))s.visits.push(s.pawn);
 const r=rules(s),seal=r.seals.findIndex(a=>a.cell===s.pawn);if(seal>=0&&!s.seals.includes(seal)){
  if(r.ordered&&seal!==s.seals.length)s.note='This seal waits its turn. Paint seal '+(s.seals.length+1)+' next.';
  else{s.seals.push(seal);s.flash=.8;s.note=r.seals[seal].name+' seal painted. '+s.seals.length+' of '+r.seals.length+'.';}
 }
 if(s.pawn===r.goal){
  if(s.seals.length===r.seals.length){s.phase='moving';s.motion={kind:'exit',t:0,duration:1.25};s.note=(r.seals.length===3?'Three':'Four')+' seals painted. The little gate opens for your traveller.';return true;}
  s.note=r.seals.length===3?'The gate needs all three painted seals. There is still a corner of the map to explore.':'The gate needs all four painted seals. There is still a corner of the map to explore.';
 }return false;
}
export function step(s,dt){
 if(s.result||s.phase==='celebrate'||!Number.isFinite(dt)||dt<=0)return;s.t+=dt;s.flash=Math.max(0,s.flash-dt);
 const m=s.motion;if(!m)return;m.t=Math.min(m.duration,m.t+dt);if(m.t<m.duration)return;
 if(m.kind==='fold'){s.folds=m.to;s.motion=null;s.phase='play';s.note='Tap a connected path to walk. '+countFolds(s.folds)+' of '+rules(s).limit+' folds held.';return;}
 if(m.kind==='exit'){s.motion=null;s.phase='celebrate';s.pendingPennies=3+s.level;s.note='A whole little world, folded into one journey.';return;}
 s.pawn=m.path[++m.index];if(arrived(s))return;
 if(m.index===m.path.length-1){s.motion=null;s.phase='play';if(s.note==='The little traveller follows the painted path.')s.note='Where will the next fold take you?';}
 else m.t=0;
}
export function restore(blob,level=blob?.level){
 const bad=validate(blob,'fold-trail');if(blob.level!==level||!rules(level)||blob.v!==2)bad();const s=snapshot(blob),r=rules(s),int=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b;
 if(!int(s.pawn,0,24)||!int(s.folds,0,15)||countFolds(s.folds)>r.limit||!openCells(s.folds,s.level)[s.pawn]||!Array.isArray(s.seals)||new Set(s.seals).size!==s.seals.length||s.seals.some((v,i)=>!int(v,0,r.seals.length-1)||(r.ordered&&v!==i))||!Array.isArray(s.visits)||s.visits.some(v=>!int(v,0,24))||!Number.isFinite(s.flash)||s.flash<0||s.flash>.8)bad();
 const m=s.motion;if((s.phase==='moving')!==!!m)bad();
 if(m){if(!['fold','walk','exit'].includes(m.kind)||!Number.isFinite(m.t)||m.t<0||!Number.isFinite(m.duration)||m.duration<=0||m.t>m.duration)bad();
  if(m.kind==='fold'&&(!int(m.edge,0,3)||m.from!==s.folds||m.to!==(m.from^(1<<m.edge))||countFolds(m.to)>r.limit||onMargin(s.pawn,m.edge)||m.duration!==.9))bad();
  if(m.kind==='walk'){if(m.duration!==.32||!Array.isArray(m.path)||m.path.length<2||m.path.length>25||!int(m.index,0,m.path.length-2)||m.path[m.index]!==s.pawn||m.path.some(v=>!int(v,0,24)||!openCells(s.folds,s.level)[v]))bad();for(let i=1;i<m.path.length;i++){const a=xy(m.path[i-1]),b=xy(m.path[i]);if(Math.abs(a.x-b.x)+Math.abs(a.y-b.y)!==1)bad();}}
  if(m.kind==='exit'&&(s.pawn!==r.goal||s.seals.length!==r.seals.length||m.duration!==1.25))bad();
 }
 if(s.phase==='celebrate'&&(s.seals.length!==r.seals.length||s.pawn!==r.goal))bad();
 s.history=s.history.map(h=>{const a=restore({...h,history:[]},level);delete a.history;return a;});return copy(s);
}
