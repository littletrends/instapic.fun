import {base,copy,remember,undo,snapshot,validate} from './study-state.js?v=studies-six-1';
export {undo,snapshot};
export const BOARD={x:228,y:385,cell:74,cols:6,rows:4};
const corners=[[0,0],[6,0],[0,3],[6,3]],wide={...BOARD,x:191,cols:7};
export const LEVELS=[
 {name:'A place for every odd thing',detail:'Six odd shapes. One case. Not a corner wasted.',board:BOARD,blocks:[],allowed:{}},
 {name:'Beside the hinge',detail:'The moon book must touch the TOP edge.',board:BOARD,blocks:[],allowed:{},hinge:4},
 {name:'The brass corners',detail:'Four corner plates cannot hold luggage.',board:wide,blocks:corners,allowed:{}},
 {name:'Through the little passage',detail:'Work around the divider; the bottom passage stays open.',board:wide,blocks:[[2,0],[2,1],[2,2],[0,3]],allowed:{}},
 {name:'This way up',detail:'Star parcel stays upright. Umbrella lies sideways.',board:wide,blocks:corners,allowed:{0:[0],5:[1,3]}},
 {name:'The midnight departure',detail:'Fixed Star, sideways Rose; umbrella along the rim, book at an edge.',board:wide,blocks:corners,allowed:{0:[0],1:[1,3],5:[1,3]},rim:5,edge:4},
];
const SAMPLE_LEVEL={name:'A small three-parcel case',detail:'Three parcels. Pick, turn, pack, close.',board:{...BOARD,x:302,cols:4,rows:3},blocks:[],allowed:{},items:[0,1,2]};
export const rules=s=>s?.demo===true?SAMPLE_LEVEL:LEVELS[typeof s==='number'?s:s.level];
export const board=s=>rules(s).board;
export const requiredItems=s=>rules(s).items||ITEMS.map((_,id)=>id);
export const requiredCount=s=>requiredItems(s).length;
export const rotationAllowed=(s,id,r)=>!rules(s).allowed[id]||rules(s).allowed[id].includes(r);
export function fitsRules(s,id,r,x,y){const b=board(s),q=rules(s),p=cells(id,r).map(([a,b])=>[a+x,b+y]);return rotationAllowed(s,id,r)&&!p.some(([a,b])=>q.blocks.some(([c,d])=>a===c&&b===d))&&(id!==q.hinge||p.some(p=>p[1]===0))&&(id!==q.rim||p.every(([a,c])=>a===0||a===b.cols-1||c===0||c===b.rows-1))&&(id!==q.edge||p.some(([a,c])=>a===0||a===b.cols-1||c===0||c===b.rows-1));}
export function label(s,id){const q=rules(s),parts=[];if(q.allowed[id]?.length===1)parts.push('FIXED');else if(q.allowed[id])parts.push('SIDEWAYS');if(q.hinge===id)parts.push('TOP EDGE');if(q.rim===id)parts.push('RIM ONLY');if(q.edge===id)parts.push('AT EDGE');return parts.join(' · ');}
export const TRAY=[{x:280,y:823},{x:450,y:823},{x:620,y:823},{x:280,y:947},{x:450,y:947},{x:620,y:947}];
export const ITEMS=[
 {name:'Star parcel',art:'parcel-t',colour:'#b67851',shape:[[0,0],[1,0],[2,0],[1,1]],rotation:1},
 {name:'Rose parcel',art:'parcel-t',colour:'#b66d7c',shape:[[0,0],[1,0],[2,0],[1,1]],rotation:0},
 {name:'Corner parcel',art:'parcel-l',colour:'#ba9860',shape:[[0,0],[0,1],[0,2],[1,2]],rotation:1},
 {name:'Bent telescope',art:'telescope',colour:'#5f8e88',shape:[[0,0],[1,0],[1,1],[2,1]],rotation:3},
 {name:'Moon book',art:'book',colour:'#697793',shape:[[0,0],[1,0],[0,1],[1,1]],rotation:0},
 {name:'Umbrella',art:'umbrella',colour:'#798d65',shape:[[0,0],[0,1],[0,2],[0,3]],rotation:2},
];
export function cells(id,rotation){let out=ITEMS[id].shape.map(p=>p.slice());for(let i=0;i<rotation%4;i++)out=out.map(([x,y])=>[-y,x]);const x=Math.min(...out.map(p=>p[0])),y=Math.min(...out.map(p=>p[1]));return out.map(([a,b])=>[a-x,b-y]);}
export function bounds(id,rotation){const p=cells(id,rotation);return {w:1+Math.max(...p.map(p=>p[0])),h:1+Math.max(...p.map(p=>p[1]))};}
export function makeState(level=0){if(!LEVELS[level])throw Error('Choose a Kit chapter from one to six.');return {...base('packing',level===0?'Every strange shape has a place. Pick an object, turn it, then tap its top-left square in the case.':rules(level).detail,level),pieces:ITEMS.map((p,id)=>({id,rotation:rules(level).allowed[id]?.includes(p.rotation)!==false?p.rotation:rules(level).allowed[id][0],place:null})),selected:-1,cursor:{x:0,y:0},motion:null,bumps:0};}
export function makeSampleState(){const s=makeState(0);s.demo=true;s.note=rules(s).detail;s.pieces[0].rotation=0;s.pieces[1].rotation=2;s.pieces[2].rotation=3;return s;}
export function occupied(s,ignore=-1){const set=new Set();for(const p of s.pieces)if(p.place&&p.id!==ignore)for(const [x,y] of cells(p.id,p.rotation))set.add((x+p.place.x)+','+(y+p.place.y));return set;}
export function canFit(s,id,rotation,x,y){if(!Number.isInteger(id)||!ITEMS[id]||(s.demo===true&&!requiredItems(s).includes(id))||![x,y,rotation].every(Number.isInteger)||!fitsRules(s,id,rotation,x,y))return false;const used=occupied(s,id),b=board(s);return cells(id,rotation).every(([a,c])=>a+x>=0&&a+x<b.cols&&c+y>=0&&c+y<b.rows&&!used.has((a+x)+','+(c+y)));}
export const packed=s=>s.pieces.filter(p=>p.place).length;
export const canLatch=s=>s.phase==='play'&&!s.result&&packed(s)===requiredCount(s);
export function itemAt(s,x,y){return s.pieces.find(p=>p.place&&cells(p.id,p.rotation).some(([a,b])=>a+p.place.x===x&&b+p.place.y===y))?.id??-1;}
export function choose(s,id){if(s.phase!=='play'||s.result||!ITEMS[id]||(s.demo===true&&!requiredItems(s).includes(id)))return false;const p=s.pieces[id],B=board(s);if(p.place){remember(s);const b=bounds(id,p.rotation);s.motion={kind:'lift',id,t:0,duration:.48,from:{x:B.x+(p.place.x+b.w/2)*B.cell,y:B.y+(p.place.y+b.h/2)*B.cell},to:{...TRAY[id]},rotation:p.rotation};p.place=null;s.phase='moving';s.moves++;}s.selected=id;s.note=ITEMS[id].name+' selected. '+(label(s,id)?label(s,id)+'. ':'Turn it if needed; ')+'tap the case where its top-left square should sit.';return true;}
export function turn(s){if(s.phase!=='play'||s.result||s.selected<0)return false;const p=s.pieces[s.selected];if(p.place)return false;if(rules(s).allowed[p.id]?.length===1){s.note=ITEMS[p.id].name+' has a FIXED orientation. Its tray shows how it must travel.';return false;}remember(s);const from=p.rotation;let by=1;while(!rotationAllowed(s,p.id,(from+by)%4))by++;p.rotation=(from+by)%4;s.moves++;s.motion={kind:'turn',id:p.id,t:0,duration:.25,fromRotation:from,rotation:p.rotation,...(by===1?{}:{turnBy:by})};s.phase='moving';s.note=by===1?'A quarter-turn. The faint outline shows the space this object needs.':'A half-turn; this object must stay sideways.';return true;}
export function cursor(s,x,y){if(s.phase!=='play'||s.result||!Number.isInteger(x)||!Number.isInteger(y))return false;const B=board(s);s.cursor={x:Math.max(0,Math.min(B.cols-1,x)),y:Math.max(0,Math.min(B.rows-1,y))};return true;}
export function place(s,x=s.cursor.x,y=s.cursor.y){if(s.phase!=='play'||s.result||s.selected<0)return false;const p=s.pieces[s.selected],B=board(s);cursor(s,x,y);if(!canFit(s,p.id,p.rotation,x,y)){s.note=label(s,p.id)?ITEMS[p.id].name+': '+label(s,p.id)+'. Stay inside the case and avoid plates and packed objects.':'That shape overlaps or crosses the rim. Try another square or turn it.';s.bumps++;return false;}remember(s);const b=bounds(p.id,p.rotation);p.place={x,y};s.moves++;s.motion={kind:'pack',id:p.id,t:0,duration:.65,from:{...TRAY[p.id]},to:{x:B.x+(x+b.w/2)*B.cell,y:B.y+(y+b.h/2)*B.cell},rotation:p.rotation};s.phase='moving';s.note='One odd little object settles into the lining.';return true;}
export function latch(s){if(!canLatch(s)){if(s.phase==='play')s.note='All six objects must fit inside before the case will close.';return false;}remember(s);s.selected=-1;s.moves++;s.phase='moving';s.motion={kind:'close',t:0,duration:2.1};s.note='Everything fits. The lid folds down and the brass latches catch…';return true;}
export function step(s,dt){if(s.result||s.phase==='celebrate'||!Number.isFinite(dt)||dt<=0)return;s.t+=dt;const m=s.motion;if(!m)return;m.t=Math.min(m.duration,m.t+dt);if(m.t!==m.duration)return;s.motion=null;s.phase='play';if(m.kind==='close'){s.phase='celebrate';s.pendingPennies=3+s.level;s.note='Not a corner wasted. Kit’s impossible suitcase is ready to travel!';return;}if(m.kind==='pack'){s.selected=-1;s.note=packed(s)===requiredCount(s)?'Everything fits! Close the case to finish your chapter.':'A perfect fit. Pick another object, or tap a packed one to lift it out.';}}
export function restore(blob,level=blob?.level){if(blob?.demo===true)throw Error('Disposable suitcase sample is not a real chapter save.');const bad=validate(blob,'packing');if(!LEVELS[level]||blob.level!==level||blob.v!==2)bad();const s=snapshot(blob),B=board(s),integer=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;if(!Array.isArray(s.pieces)||s.pieces.length!==6||!integer(s.selected,-1,5)||!s.cursor||!integer(s.cursor.x,0,B.cols-1)||!integer(s.cursor.y,0,B.rows-1)||!integer(s.bumps,0,1000000))bad();
 for(let i=0;i<6;i++){const p=s.pieces[i];if(!p||p.id!==i||!integer(p.rotation,0,3)||!rotationAllowed(s,i,p.rotation)||(p.place&&(!integer(p.place.x,0,B.cols-1)||!integer(p.place.y,0,B.rows-1)||!canFit(s,i,p.rotation,p.place.x,p.place.y))))bad();}
 if((s.phase==='moving')!==!!s.motion)bad();if(s.motion){const m=s.motion;if(!['pack','lift','turn','close'].includes(m.kind)||!Number.isFinite(m.t)||m.t<0||!Number.isFinite(m.duration)||m.duration<=0||m.t>m.duration)bad();if(m.kind!=='close'&&!integer(m.id,0,5))bad();if(['pack','lift'].includes(m.kind)&&![m.from?.x,m.from?.y,m.to?.x,m.to?.y].every(Number.isFinite))bad();if(m.kind==='close'&&packed(s)!==6)bad();}if(['celebrate','result'].includes(s.phase)&&(!s.result||s.result.won!==false)&&packed(s)!==6)bad();
 s.history=s.history.map(h=>{const p=restore({...h,history:[]},level);delete p.history;return p;});return copy(s);}
