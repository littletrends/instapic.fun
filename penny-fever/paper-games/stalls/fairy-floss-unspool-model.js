import {base,copy,remember,undo,snapshot,validate} from './study-state.js?v=studies-six-1';
export {undo,snapshot};
export const FLAVOURS=['Strawberry','Blueberry','Vanilla','Mint'];
export const PILES=[[0,0,2,0],[1,2,3,1],[3,2,1,3]];
export const LEVELS=[
 {name:'Four flavours, three sticks',detail:'Four flavours share three warming slots.',piles:PILES,pairs:[],order:[]},
 {name:'Clouds within clouds',detail:'Longer layers take four strands to fill a stick.',piles:[[0,0,2,0,2],[1,2,3,1,1],[3,2,1,3,3,0]],pairs:[],order:[]},
 {name:'Big and little orders',detail:'Each flavour has its own strand target.',piles:[[0,0,2,0,2],[1,2,3,1],[3,2,1,3,3,0]],pairs:[],order:[]},
 {name:'Tied with a bow',detail:'Bow-tied strands unwind together. Free both ends first.',piles:PILES,pairs:[[6,11]],order:[]},
 {name:'The serving tray',detail:'Full clouds leave in the requested flavour order.',piles:[[2,2,0,2],[1,0,3,1],[3,0,1,3]],pairs:[],order:[2,0,1,3]},
 {name:'Flossie’s final flourish',detail:'Deep clouds, a tied pair and a four-flavour serving order.',piles:[[2,2,0,2,2],[1,0,3,1,1],[3,0,1,3,3,0]],pairs:[[7,14]],order:[2,0,1,3]},
];
export const rules=s=>LEVELS[typeof s==='number'?s:s.level];
export const targets=s=>rules(s).piles.flat().reduce((a,c)=>(a[c]++,a),[0,0,0,0]);
export const layerY=(s,pileLength,index)=>s.level===0?615-index*53:650-index*36;
export function makeState(level=0){const r=rules(level);if(!r)throw Error('Unknown Sugar Unspool chapter.');let id=0;
 return {...base('sugar',level===0?'Choose a flavour stick, then pull a matching front strand. Three warming slots, four flavours.':r.detail,level),piles:r.piles.map(a=>a.map(colour=>{const n=id++;return {id:n,colour,pair:r.pairs.findIndex(p=>p.includes(n))};})),holders:[null,null,null],stock:[true,true,true,true],finished:[false,false,false,false],served:[],selected:-1,motion:null,pulled:[],jams:0};
}
export function pick(s,colour){
 if(s.phase!=='play'||s.result||!Number.isInteger(colour)||!s.stock[colour])return false;
 const slot=s.holders.indexOf(null);if(slot<0){s.note='Three sticks are warming already. Finish one, or Undo your last choice.';s.jams++;return false;}
 remember(s);s.holders[slot]={colour,count:0};s.stock[colour]=false;s.selected=slot;s.moves++;s.note=FLAVOURS[colour]+' stick ready. Pull only its matching front strands.';return true;
}
export function select(s,index){if(s.phase!=='play'||!s.holders[index])return false;s.selected=index;s.note=FLAVOURS[s.holders[index].colour]+' selected.';return true;}
function plan(s,pile,slot){
 const strand=s.piles[pile]?.at(-1),holder=s.holders[slot];if(!strand||!holder||strand.colour!==holder.colour)return null;
 const companions=[];
 if(strand.pair>=0){for(const id of rules(s).pairs[strand.pair])if(id!==strand.id){const i=s.piles.findIndex(p=>p.at(-1)?.id===id);if(i<0)return null;companions.push({pile:i,strand:s.piles[i].at(-1)});}}
 if(holder.count+1+companions.length>targets(s)[holder.colour])return null;
 return {strand,companions};
}
export function canPull(s,pile,slot=s.selected){return !!plan(s,pile,slot);}
export function pull(s,pile){
 if(s.phase!=='play'||s.result||!s.piles[pile]?.length)return false;const strand=s.piles[pile].at(-1),holder=s.holders[s.selected];
 if(!holder){s.note='Choose a flavour stick below before you pull.';return false;}
 if(strand.colour!==holder.colour){s.note='The front strand is '+FLAVOURS[strand.colour].toLowerCase()+'. Choose its stick, or free another strand.';return false;}
 const next=plan(s,pile,s.selected);if(!next){s.note=strand.pair>=0?'Free both ends of that little bow before unwinding the pair.':'This full cloud is waiting for its place in the serving order.';return false;}
 remember(s);s.piles[pile].pop();for(const other of next.companions)s.piles[other.pile].pop();
 s.phase='moving';s.moves++;s.motion={pile,slot:s.selected,strand,companions:next.companions,t:0,duration:1.05};s.note='One sugar ribbon unwinds onto the turning stick.';return true;
}
function serve(s){
 const cap=targets(s),order=rules(s).order;
 for(let n=0;n<4;n++){
  const slot=s.holders.findIndex(h=>h&&h.count===cap[h.colour]&&(!order.length||h.colour===order[s.served.length]));if(slot<0)break;
  const h=s.holders[slot];s.finished[h.colour]=true;s.served.push(h.colour);s.holders[slot]=null;s.selected=s.holders.findIndex(Boolean);s.note='A full '+FLAVOURS[h.colour].toLowerCase()+' cloud! A warming slot is free.';
 }
}
export function blocked(s){return s.holders.every(Boolean)&&!s.piles.some((p,pile)=>p.length&&s.holders.some((h,slot)=>h&&canPull(s,pile,slot)));}
export function step(s,dt){
 if(s.result||s.phase==='celebrate'||!Number.isFinite(dt)||dt<=0)return;s.t+=dt;
 const m=s.motion;if(!m)return;m.t=Math.min(m.duration,m.t+dt);
 if(m.t===m.duration){const h=s.holders[m.slot];h.count+=1+m.companions.length;s.pulled.push(m.strand.id,...m.companions.map(p=>p.strand.id));s.motion=null;s.phase='play';
  const left=targets(s)[h.colour]-h.count;
  if(left>0)s.note=left+' more '+FLAVOURS[h.colour].toLowerCase()+(left===1?' strand':' strands')+' to fill this stick.';
  else s.note='This cloud is full. Check the serving order.';
  serve(s);
  if(s.finished.every(Boolean)){s.phase='celebrate';s.pendingPennies=3+s.level;s.note='Four flavours spun. Flossie wraps your sugar clouds!';}
  else if(blocked(s))s.note='A sugar tangle: none of these sticks can take the front strands. Undo a flavour choice.';
 }
}
export function restore(blob,level=blob?.level){
 const bad=validate(blob,'sugar');if(blob.level!==level||!LEVELS[level])bad();const s=snapshot(blob),original=makeState(level).piles.flat(),cap=targets(s);s.v=2;
 const int=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b;
 if(!Array.isArray(s.piles)||s.piles.length!==3||!Array.isArray(s.holders)||s.holders.length!==3||![s.stock,s.finished].every(a=>Array.isArray(a)&&a.length===4&&a.every(v=>typeof v==='boolean'))||!int(s.selected,-1,2)||!Array.isArray(s.pulled)||s.pulled.length>original.length)bad();
 if(!s.served&&level===0)s.served=s.finished.flatMap((yes,i)=>yes?[i]:[]);
 if(s.motion&&!s.motion.companions&&level===0)s.motion.companions=[];
 const strands=[...s.piles.flat(),...(s.motion?[s.motion.strand,...s.motion.companions.map(p=>p.strand)]:[])];
 for(const strand of strands)if(strand.pair===undefined&&level===0)strand.pair=-1;
 if(s.holders.some(h=>h&&(!int(h.colour,0,3)||!int(h.count,0,cap[h.colour])))||new Set(s.holders.filter(Boolean).map(h=>h.colour)).size!==s.holders.filter(Boolean).length)bad();
 if(strands.some(p=>!int(p.id,0,original.length-1)||p.colour!==original[p.id].colour||p.pair!==original[p.id].pair)||s.pulled.some(id=>!int(id,0,original.length-1))||new Set([...strands.map(p=>p.id),...s.pulled]).size!==original.length||strands.length+s.pulled.length!==original.length)bad();
 for(let colour=0;colour<4;colour++)if(Number(s.stock[colour])+Number(s.finished[colour])+s.holders.filter(h=>h?.colour===colour).length!==1)bad();
 if(!Array.isArray(s.served)||new Set(s.served).size!==s.served.length||s.served.some((c,i)=>!int(c,0,3)||!s.finished[c]||(rules(s).order.length&&c!==rules(s).order[i])))bad();
 if(s.motion&&(!int(s.motion.pile,0,2)||!int(s.motion.slot,0,2)||!s.holders[s.motion.slot]||s.holders[s.motion.slot].colour!==s.motion.strand.colour||!Number.isFinite(s.motion.t)||s.motion.t<0||s.motion.t>1.05||s.motion.companions.length>1))bad();
 if((s.phase==='moving')!==!!s.motion)bad();if(s.phase==='celebrate'&&!s.finished.every(Boolean))bad();
 s.history=s.history.map(h=>{const b=restore({...h,history:[]},level);delete b.history;return b;});return copy(s);
}
