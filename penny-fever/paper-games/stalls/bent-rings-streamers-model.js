import {base,copy,remember,undo,validate,snapshot as plainSnapshot} from './study-state.js?v=studies-six-1';
export {undo};
export const N=6,STEP=76,ORIGIN={x:260,y:390};
export const NAMES=['Rose','Leaf','Blue','Gold','Plum'];
export const COLOURS=['#bd627d','#638d75','#658ca6','#d0a451','#a17099'];
export const EXITS=[{x:6,y:4},{x:3,y:-1},{x:-1,y:2},{x:3,y:6}];
const FIRST=[[[2,2],[2,3],[1,3],[1,4],[0,4],[0,3]],[[3,2],[3,1],[2,1],[1,1],[1,2],[0,2]],[[4,3],[4,2],[4,1],[5,1],[5,2],[5,3]],[[3,3],[3,4],[4,4],[4,5],[3,5],[2,5]]];
const LONG=[[[1,2],[1,3],[2,3],[2,4],[1,4],[0,4],[0,3]],[[2,2],[2,1],[1,1],[0,1],[0,2]],[[4,2],[4,1],[5,1],[5,2],[5,3],[4,3]],[[3,3],[3,4],[4,4],[4,5],[3,5],[2,5],[1,5]]];
const FIVE=[FIRST[0],FIRST[1].slice(0,5),FIRST[2],FIRST[3],[[2,0],[1,0],[0,0],[0,1],[0,2]]];
const OUTER=[...FIRST,[[6,3],[6,2],[6,1],[6,0]]];
const FINAL=[...LONG,[[6,3],[6,2],[6,1],[6,0],[5,0]]];
const wideExits=[{x:7,y:4},{x:3,y:-1},{x:-1,y:2},{x:3,y:7},{x:7,y:1}];
const LEGACY_LEVELS=[
 {name:'A little room to untangle',detail:'Blue can move first. Drag its flower along the dotted peg path.',size:6,setup:FIRST,exits:EXITS,focus:2,clasps:[]},
 {name:'The long way round',detail:'Long and short ribbons need different amounts of turning room.',size:6,setup:LONG,exits:[{x:6,y:4},{x:2,y:-1},{x:-1,y:2},{x:3,y:6}],focus:1,clasps:[]},
 {name:'A plum invitation',detail:'Five streamers share the loom. Plum is woven across the upper passage.',size:7,setup:FIVE,exits:wideExits,focus:4,clasps:[]},
 {name:'The golden clasp',detail:'Thread Gold to open its clasp. Rose may need to wait nearby.',size:6,setup:FIRST,exits:EXITS,focus:2,clasps:[{cell:{x:5,y:4},after:[3]}]},
 {name:'Two little favours',detail:'Plum frees the top clasp; Gold frees the side clasp.',size:7,setup:OUTER,exits:wideExits,focus:2,clasps:[{cell:{x:3,y:0},after:[4]},{cell:{x:5,y:4},after:[3]}]},
 {name:'Ringo’s final bow',detail:'Five different lengths. Blue, Plum and Gold each hold a clasp.',size:7,setup:FINAL,exits:[{x:7,y:4},{x:2,y:-1},{x:-1,y:2},{x:3,y:7},{x:7,y:1}],focus:1,clasps:[{cell:{x:3,y:0},after:[2]},{cell:{x:1,y:0},after:[4]},{cell:{x:5,y:4},after:[3]}]},
];
const LEGACY_HINTS=[{id:2,path:[{x:5,y:3},{x:5,y:2}]},{id:1,path:[{x:3,y:2},{x:3,y:1}]},{id:4,path:[{x:3,y:0},{x:4,y:0}]},{id:2,path:[{x:5,y:3},{x:5,y:2}]},{id:2,path:[{x:5,y:3},{x:5,y:2}]},{id:1,path:[{x:3,y:2},{x:3,y:1}]}];
const MASTER={...LEGACY_LEVELS[5],name:'Ringo’s master knot',detail:'48 peg steps. Park ribbons to free the centre. Blue opens the outer clasp; Plum opens Leaf’s ring; Leaf AND Plum open Gold’s lower passage.',maxSteps:48,clasps:[{cell:{x:6,y:4},after:[2]},{cell:{x:2,y:-1},after:[4]},{cell:{x:5,y:4},after:[3]},{cell:{x:3,y:6},after:[1,4]}]};
export const LEVELS=[...LEGACY_LEVELS.slice(1),MASTER];
export const HINTS=[...LEGACY_HINTS.slice(1),{id:1,path:[{x:3,y:2},{x:3,y:1}]}];
export const rules=s=>typeof s==='number'?LEVELS[s]:(s.edition===2?LEVELS:LEGACY_LEVELS)[s.level];
export const hint=s=>(s.edition===2?HINTS:LEGACY_HINTS)[s.level];
export const stepsLeft=s=>rules(s).maxSteps===undefined?null:rules(s).maxSteps-s.pegMoves;
export const exits=s=>rules(s).exits;
export const clasps=s=>rules(s).clasps.filter(clasp=>!clasp.after.every(id=>s.threaded.includes(id)));
export const same=(a,b)=>a.x===b.x&&a.y===b.y;
export const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export function world(p,level=0){const wide=rules(level).size===7;return {x:(wide?246:ORIGIN.x)+p.x*(wide?68:STEP),y:(wide?366:ORIGIN.y)+p.y*(wide?68:STEP)};}
export function cell(p,level=0){const wide=rules(level).size===7;return {x:Math.round((p.x-(wide?246:ORIGIN.x))/(wide?68:STEP)),y:Math.round((p.y-(wide?366:ORIGIN.y))/(wide?68:STEP))};}
function fresh(level,r,edition){if(!r)throw Error('Choose a chapter from one to six.');return {...base('streamers',level===0&&edition===undefined?'Pull a rosette along the peg paths. Make room, then thread it through its matching ring.':r.detail,level),...(edition===2?{edition:2,...(r.maxSteps?{pegMoves:0}:{})}:{}),ribbons:r.setup.map((cells,id)=>({id,cells:cells.map(([x,y])=>({x,y})),done:false})),focus:r.focus,motion:null,threaded:[],flash:0};}
export function makeState(level=0){return fresh(level,LEVELS[level],2);}
export function makeSampleState(){return fresh(0,LEGACY_LEVELS[0]);}
export function snapshot(s){const out=plainSnapshot(s);delete out.draft;return out;}
function inside(p,s){return Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<rules(s).size&&p.y<rules(s).size;}
export function nextBody(s,id,body,to){
 if(distance(body[0],to)!==1)return null;
 if(!inside(to,s)&&!same(to,exits(s)[id]))return null;
 if(clasps(s).some(c=>same(c.cell,to)))return null;
 if(s.ribbons.some(r=>r.id!==id&&!r.done&&r.cells.some(p=>same(p,to))))return null;
 if(body.slice(0,-1).some(p=>same(p,to)))return null;
 return [copy(to),...copy(body.slice(0,-1))];
}
export function preview(s,id,path){let body=copy(s.ribbons[id].cells);if(!body.length)return null;for(const to of path){body=nextBody(s,id,body,to);if(!body)return null;}return body;}
export function begin(s,id){if(s.phase!=='play'||s.result||s.ribbons[id]?.done)return false;s.focus=id;s.draft={id,path:[],bad:null};return true;}
export function extend(s,to){const draft=s.draft;if(!draft)return false;const ribbon=s.ribbons[draft.id],head=draft.path.at(-1)||ribbon.cells[0];if(same(head,to))return true;
 const previous=draft.path.length>1?draft.path.at(-2):ribbon.cells[0];if(draft.path.length&&same(previous,to)){draft.path.pop();draft.bad=null;return true;}
 if(draft.path.some(p=>same(p,exits(s)[draft.id])))return false;
 const body=preview(s,draft.id,draft.path);if(stepsLeft(s)!==null&&draft.path.length>=stepsLeft(s)){draft.bad=copy(to);return false;}if(!nextBody(s,draft.id,body,to)){draft.bad=copy(to);return false;}draft.path.push(copy(to));draft.bad=null;return true;
}
export function cancel(s){delete s.draft;}
export function commit(s,id,path){if(s.phase!=='play'||s.result||s.ribbons[id]?.done||!path.length||!preview(s,id,path))return false;if(stepsLeft(s)!==null&&path.length>stepsLeft(s)){s.note='That route needs more peg steps than remain. Shorten it, or Undo a pull.';return false;}delete s.draft;remember(s);if(stepsLeft(s)!==null)s.pegMoves+=path.length;s.focus=id;s.moves++;s.phase='moving';s.motion={kind:'slide',id,path:copy(path),index:0,t:0,duration:.14,from:copy(s.ribbons[id].cells),to:nextBody(s,id,s.ribbons[id].cells,path[0])};s.note=NAMES[id]+' streamer glides along the pegs.';return true;}
export function release(s){const d=s.draft;delete s.draft;return d?commit(s,d.id,d.path):false;}
export function move(s,id,to){return commit(s,id,[to]);}
export function step(s,dt){if(s.result||s.phase==='celebrate'||!Number.isFinite(dt)||dt<=0)return;s.t+=dt;s.flash=Math.max(0,s.flash-dt);let left=dt;
 while(s.motion&&left>0){const m=s.motion,used=Math.min(left,m.duration-m.t);m.t+=used;left-=used;if(m.t<m.duration-1e-9)break;
  const ribbon=s.ribbons[m.id];
  if(m.kind==='thread'){ribbon.done=true;ribbon.cells=[];s.threaded.push(m.id);s.motion=null;s.phase='play';s.flash=.6;s.note=NAMES[m.id]+' ribbon threaded. Its pegs are free for the others.';if(s.threaded.length===s.ribbons.length){s.phase='celebrate';s.pendingPennies=3+s.level;s.note='Every ribbon is threaded. Ringo ties the final bow!';}continue;}
  ribbon.cells=copy(m.to);m.index++;
  if(m.index<m.path.length){m.t=0;m.from=copy(ribbon.cells);m.to=nextBody(s,m.id,ribbon.cells,m.path[m.index]);if(!m.to)throw Error('Saved ribbon route is obstructed.');}
  else if(same(ribbon.cells[0],exits(s)[m.id]))s.motion={kind:'thread',id:m.id,t:0,duration:.9,from:copy(ribbon.cells)};
  else{s.motion=null;s.phase='play';s.note='That gap is open. Choose which rosette to pull next.';}
 }
 if(!s.motion&&s.phase==='play'&&stepsLeft(s)===0){s.phase='result';s.pendingPennies=0;s.result={won:false,title:'The last peg step',detail:'The ribbons still need room. Play again for a fresh 48-step loom, or shorten an earlier route next time.',prize:null,settle:true};}
}
export function restore(blob,level=blob?.level){const bad=validate(blob,'streamers');if(!LEVELS[level]||blob.level!==level||blob.v!==2)bad();const s=snapshot(blob),r=rules(s),count=r.setup.length;if(s.edition!==undefined&&s.edition!==2||r.maxSteps!==undefined&&(!Number.isInteger(s.pegMoves)||s.pegMoves<0||s.pegMoves>r.maxSteps))bad();if(!Array.isArray(s.ribbons)||s.ribbons.length!==count||!Number.isInteger(s.focus)||s.focus<0||s.focus>=count||!Array.isArray(s.threaded)||new Set(s.threaded).size!==s.threaded.length||s.threaded.some(id=>!Number.isInteger(id)||id<0||id>=count))bad();
 const occupied=new Set();for(let id=0;id<count;id++){const ribbon=s.ribbons[id];if(ribbon.id!==id||typeof ribbon.done!=='boolean'||!Array.isArray(ribbon.cells)||ribbon.cells.length!==(ribbon.done?0:r.setup[id].length)||ribbon.done!==s.threaded.includes(id))bad();for(let i=0;i<ribbon.cells.length;i++){const p=ribbon.cells[i],key=p.x+','+p.y;if((!inside(p,s)&&!(i===0&&same(p,exits(s)[id])&&s.motion?.id===id))||occupied.has(key)||(i&&distance(ribbon.cells[i-1],p)!==1))bad();occupied.add(key);}}
 if((s.phase==='moving')!==!!s.motion)bad();if(s.phase==='celebrate'&&s.threaded.length!==count)bad();
 if(s.motion){const m=s.motion,length=r.setup[m.id]?.length;if(!['slide','thread'].includes(m.kind)||!Number.isInteger(m.id)||m.id<0||m.id>=count||s.ribbons[m.id].done||!Number.isFinite(m.t)||m.t<0||!Number.isFinite(m.duration)||m.duration!==(m.kind==='slide'?.14:.9)||m.t>m.duration||!Array.isArray(m.from)||m.from.length!==length)bad();if(m.kind==='slide'&&(!Array.isArray(m.path)||!Number.isInteger(m.index)||m.index<0||m.index>=m.path.length||!Array.isArray(m.to)||m.to.length!==length))bad();}
 s.history=s.history.map(h=>{const state=restore({...h,history:[]},level);delete state.history;return state;});return copy(s);
}
