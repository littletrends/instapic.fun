import {base,copy,remember,undo,validate,snapshot as plainSnapshot} from './study-state.js?v=studies-six-1';
export {undo};
export const N=7,STEP=70,ORIGIN={x:240,y:390};
export const NAMES=['Rose','Blue','Gold'],COLOURS=['#d77a9c','#75b5d2','#e1b969'];
export const MOUNTS=[{x:3,y:2},{x:3,y:1},{x:1,y:2},{x:5,y:2},{x:3,y:4},{x:3,y:6},{x:1,y:1},{x:5,y:1}];
export const SOURCES=[{start:{x:-1,y:2},dir:{x:1,y:0}},{start:{x:3,y:-1},dir:{x:0,y:1}},{start:{x:7,y:2},dir:{x:-1,y:0}}];
export const GOALS=[{x:-1,y:1},{x:7,y:1},{x:3,y:7}];
const port=(x,y,dx,dy)=>({start:{x,y},dir:{x:dx,y:dy}});
const points=a=>a.map(([x,y])=>({x,y}));
export const LEVELS=[
 {name:'Three colours, one cue',pieces:2,mounts:MOUNTS,sources:SOURCES,goals:GOALS,blocks:[],filters:[],detail:'Two mirrors. Three colours. One lighting cue.'},
 {name:'A third reflection',pieces:3,mounts:MOUNTS,sources:SOURCES,goals:points([[-1,1],[5,-1],[3,7]]),blocks:[],filters:[],detail:'A third mirror must lift Blue light to its upper bloom.'},
 {name:'Behind the folded screen',pieces:3,mounts:points([[3,2],[3,4],[5,2],[1,2],[1,4],[5,4],[3,1],[3,6]]),sources:[port(-1,2,1,0),port(3,7,0,-1),port(3,-1,0,1)],goals:points([[-1,4],[7,4],[5,-1]]),blocks:points([[5,3]]),filters:[],detail:'Folded screens stop light. Turn before their velvet faces.'},
 {name:'The coloured window',pieces:3,mounts:points([[2,3],[2,1],[5,1],[2,5],[5,3],[1,3],[4,1],[5,5],[1,1]]),sources:[port(-1,3,1,0),port(2,-1,0,1),port(7,3,-1,0)],goals:points([[-1,1],[5,-1],[2,7]]),blocks:points([[5,2]]),filters:[{cell:{x:3,y:1},colour:1}],detail:'Blue glass passes only Blue. Mirrors still turn every colour.'},
 {name:'The mirrored promenade',pieces:4,mounts:points([[3,2],[3,1],[5,1],[5,4],[1,2],[1,1],[3,4],[1,4],[5,2],[5,5]]),sources:[port(-1,2,1,0),port(3,-1,0,1),port(7,4,-1,0)],goals:points([[-1,1],[5,-1],[7,1]]),blocks:points([[4,4],[3,5]]),filters:[{cell:{x:4,y:1},colour:1},{cell:{x:5,y:3},colour:2}],detail:'Four mirrors share the promenade. Blue and Gold each have a window.'},
 {name:'Opal’s glass conservatory',pieces:4,mounts:points([[2,2],[2,5],[5,5],[5,1],[1,2],[5,2],[2,1],[1,4],[4,5],[5,4]]),sources:[port(-1,2,1,0),port(2,7,0,-1),port(7,1,-1,0)],goals:points([[-1,5],[5,7],[7,5]]),blocks:points([[4,2],[4,1]]),filters:[{cell:{x:3,y:5},colour:1},{cell:{x:5,y:3},colour:2},{cell:{x:1,y:5},colour:0}],detail:'Three glass windows, two screens and four shared reflections.'},
];
export const rules=s=>LEVELS[typeof s==='number'?s:s.level];
export const mounts=s=>rules(s).mounts,sources=s=>rules(s).sources,goals=s=>rules(s).goals;
export const blocks=s=>rules(s).blocks,filters=s=>rules(s).filters;
export function trayPoint(s,id){const count=rules(s).pieces,gap=count===2?240:count===3?180:152;return {x:450-(count-1)*gap/2+id*gap,y:958};}
export const world=p=>({x:ORIGIN.x+p.x*STEP,y:ORIGIN.y+p.y*STEP});
export const same=(a,b)=>a.x===b.x&&a.y===b.y;
const inside=p=>p.x>=0&&p.y>=0&&p.x<N&&p.y<N;
export function makeState(level=0){const r=rules(level);if(!r)throw Error('Choose a chapter from one to six.');return {...base('prism',level===0?'Two mirrors, three coloured lanterns. Select a mirror, then tap a brass socket.':r.detail,level),mirrors:Array.from({length:r.pieces},(_,id)=>({id,mount:null,slash:0})),selected:0,cursor:0,beams:[],blooms:[{open:0,lit:false},{open:0,lit:false},{open:0,lit:false}],motion:null,attempts:0};}
export function snapshot(s){const out=plainSnapshot(s);delete out.drag;return out;}
export function mirrorPoint(s,id){return s.mirrors[id].mount===null?trayPoint(s,id):world(mounts(s)[s.mirrors[id].mount]);}
function prepare(s){s.beams=[];for(const bloom of s.blooms)bloom.lit=false;}
export function select(s,id){if(s.phase!=='play'||!s.mirrors[id])return false;s.selected=id;return true;}
export function place(s,id,mount){if(s.phase!=='play'||s.result||!s.mirrors[id]||!Number.isInteger(mount)||!mounts(s)[mount])return false;if(s.mirrors[id].mount===mount)return false;if(s.mirrors.some(m=>m.id!==id&&m.mount===mount)){s.note='That brass socket already holds the other mirror.';return false;}remember(s);prepare(s);const from=mirrorPoint(s,id);s.mirrors[id].mount=mount;s.cursor=mount;s.moves++;s.phase='moving';s.motion={kind:'place',id,from,to:world(mounts(s)[mount]),t:0,duration:.36};s.note='The folded mirror settles into its brass socket.';const other=s.mirrors.find(m=>m.mount===null);s.selected=other?other.id:id;return true;}
export function rotate(s,id=s.selected){if(s.phase!=='play'||s.result||!s.mirrors[id])return false;remember(s);prepare(s);const mirror=s.mirrors[id],from=mirror.slash;mirror.slash=1-from;s.selected=id;s.moves++;s.phase='moving';s.motion={kind:'rotate',id,from,to:mirror.slash,t:0,duration:.28};s.note='The mirror turns. Its silver face reflects to the other side.';return true;}
export function remove(s,id=s.selected){if(s.phase!=='play'||s.result||s.mirrors[id]?.mount===null||!s.mirrors[id])return false;remember(s);prepare(s);const from=mirrorPoint(s,id);s.mirrors[id].mount=null;s.selected=id;s.moves++;s.phase='moving';s.motion={kind:'place',id,from,to:mirrorPoint(s,id),t:0,duration:.36};s.note='The mirror returns to its little tray.';return true;}
export function trace(s,id){const source=sources(s)[id],points=[copy(source.start)],seen=new Set();let p=copy(source.start),dir=copy(source.dir);
 for(let i=0;i<80;i++){p={x:p.x+dir.x,y:p.y+dir.y};points.push(copy(p));if(!inside(p))return {id,points,hit:same(p,goals(s)[id]),reason:same(p,goals(s)[id])?'bloom':'edge',travel:0};if(blocks(s).some(b=>same(b,p)))return {id,points,hit:false,reason:'screen',travel:0};const filter=filters(s).find(f=>same(f.cell,p));if(filter&&filter.colour!==id)return {id,points,hit:false,reason:'filter',travel:0};const mirror=s.mirrors.find(m=>m.mount!==null&&same(mounts(s)[m.mount],p));if(mirror)dir=mirror.slash?{x:dir.y,y:dir.x}:{x:-dir.y,y:-dir.x};const key=p.x+','+p.y+','+dir.x+','+dir.y;if(seen.has(key))return {id,points,hit:false,reason:'loop',travel:0};seen.add(key);}
 return {id,points,hit:false,reason:'loop',travel:0};
}
export function cue(s){if(s.phase!=='play'||s.result)return false;remember(s);s.attempts++;s.moves++;s.blooms=s.blooms.map(()=>({open:0,lit:false}));s.beams=sources(s).map((_,id)=>trace(s,id));s.phase='moving';s.motion={kind:'light',t:0,duration:Math.max(...s.beams.map(b=>b.points.length-1))/5+.65};s.note='Opal raises the lanterns. Watch where all three colours travel.';return true;}
export function step(s,dt){if(s.result||s.phase==='celebrate'||!Number.isFinite(dt)||dt<=0)return;s.t+=dt;const motion=s.motion;
 if(motion){motion.t=Math.min(motion.duration,motion.t+dt);if(motion.kind==='light')for(const beam of s.beams){beam.travel=Math.min(beam.points.length-1,motion.t*5);if(beam.hit&&beam.travel===beam.points.length-1)s.blooms[beam.id].lit=true;}}
 for(const bloom of s.blooms)bloom.open=Math.max(0,Math.min(1,bloom.open+(bloom.lit?dt/.5:-dt/.3)));
 if(motion&&motion.t===motion.duration){s.motion=null;s.phase='play';if(motion.kind==='light'){const lit=s.blooms.filter(b=>b.lit).length;if(lit===3&&s.blooms.every(b=>b.open===1)){s.phase='celebrate';s.pendingPennies=3+s.level;s.note='Three glass-paper blooms open together. Opal’s theatre is awake!';}else s.note=lit+' of 3 blooms caught its own colour. Adjust the mirrors; all three must open in one cue.';}else s.note='Tap a seated mirror to turn it. Light the stage when your reflections line up.';}
}
export function restore(blob,level=blob?.level){const bad=validate(blob,'prism');if(!LEVELS[level]||blob.level!==level||blob.v!==2)bad();const s=snapshot(blob),count=rules(s).pieces;if(!Array.isArray(s.mirrors)||s.mirrors.length!==count||!Number.isInteger(s.selected)||s.selected<0||s.selected>=count||!Number.isInteger(s.cursor)||s.cursor<0||s.cursor>=mounts(s).length||!Number.isSafeInteger(s.attempts)||s.attempts<0||!Array.isArray(s.beams)||s.beams.length>3||!Array.isArray(s.blooms)||s.blooms.length!==3)bad();
 const used=new Set();for(let id=0;id<count;id++){const mirror=s.mirrors[id];if(mirror.id!==id||![0,1].includes(mirror.slash)||(mirror.mount!==null&&(!Number.isInteger(mirror.mount)||!mounts(s)[mirror.mount]||used.has(mirror.mount))))bad();if(mirror.mount!==null)used.add(mirror.mount);}
 if(s.blooms.some(b=>typeof b.lit!=='boolean'||!Number.isFinite(b.open)||b.open<0||b.open>1))bad();for(const b of s.beams)if(!Number.isInteger(b.id)||b.id<0||b.id>2||typeof b.hit!=='boolean'||!Array.isArray(b.points)||b.points.length<2||b.points.length>81||!Number.isFinite(b.travel)||b.travel<0||b.travel>b.points.length-1||b.points.some(p=>!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x< -1||p.y< -1||p.x>N||p.y>N))bad();
 if((s.phase==='moving')!==!!s.motion)bad();if(s.phase==='celebrate'&&(!s.blooms.every(b=>b.lit&&b.open===1)||s.beams.length!==3))bad();if(s.motion){const m=s.motion;if(!['place','rotate','light'].includes(m.kind)||!Number.isFinite(m.t)||m.t<0||!Number.isFinite(m.duration)||m.duration<=0||m.t>m.duration)bad();if(m.kind!=='light'&&((!Number.isInteger(m.id)||m.id<0||m.id>=count)||(m.kind==='place'&&![m.from,m.to].every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)))))bad();}
 s.history=s.history.map(h=>{const state=restore({...h,history:[]},level);delete state.history;return state;});return copy(s);
}
