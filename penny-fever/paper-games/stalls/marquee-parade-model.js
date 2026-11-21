import {base,copy,remember,undo,snapshot,validate} from './study-state.js?v=studies-six-1';
export {undo,snapshot};
export const COLOURS=['Pink','Gold','Green','Blue'];
export const COLUMNS=[[0,1,2,0],[1,2,0,1],[2,0,1,2],[0,2,1,0],[1,0,2,1],[2,1,0,2]];
export const QUEUES=[[0,2],[2,1],[1,0]],LAP=6.4;
const four=[[0,1,2,3],[1,2,3,0],[2,3,0,1],[3,0,1,2],[0,2,1,3],[3,1,2,0]];
const deep=COLUMNS.map((c,i)=>[...c,(i+1)%3]);
export const LEVELS=[
 {name:'First curtain',detail:'Match the bright front bulbs.',columns:COLUMNS,queue:QUEUES,lap:6.4,bay:3},
 {name:'A blue invitation',detail:'Four lantern colours share three waiting places.',columns:four,queue:[[0,3,1],[2,0,3],[1,2]],lap:6.4,bay:3},
 {name:'Behind the curtains',detail:'Two shutters open and close. Spare sparks can try another lap.',columns:deep,queue:[[0,2],[2,1],[1,0]],shutters:[1,4],lap:6.4,bay:3},
 {name:'Double-glass lights',detail:'Two-pip bulbs need two sparks, on separate laps.',columns:COLUMNS,queue:[[0,2],[2,1],[1,0]],double:true,lap:6.2,bay:3},
 {name:'The turning parade',detail:'Each new launch circles the other way.',columns:deep,queue:[[2,0],[0,1],[1,2]],reverse:true,lap:6.1,bay:3},
 {name:'The midnight marquee',detail:'Four colours, double glass, shutters and changing direction.',columns:four,queue:[[0,3,1],[2,0,3],[1,2]],double:true,shutters:[1,4],reverse:true,lap:6.3,bay:3},
];
const SAMPLE_RULES={...LEVELS[0],name:'Pink, then Gold · easy demonstration',columns:Array.from({length:6},()=>[0,1]),queue:[[0],[1],[]],lap:3.8};
export const rules=s=>typeof s==='number'?LEVELS[s]:s.demo===true?SAMPLE_RULES:LEVELS[s.level];
export const columnX=i=>240+i*84;
export const frontY=s=>s.demo===true?520:rules(s).columns[0].length===4?462:443;
export const rowGap=s=>s.demo===true?100:rules(s).columns[0].length===4?68:53;
export const totalLights=s=>rules(s).columns.flat().length;
export function shutterOpen(s,column,t=s.t){return !rules(s).shutters?.includes(column)||((t+column*.71)%3.7)<2.45;}
function health(r,c,row){return r.double&&(r.queue.flat().includes(3)?row===0&&c<4:(c+row)%3===0)?2:1;}
function authored(level,preset){
 const r=preset||rules(level);if(!r)throw Error('Unknown Light Parade chapter.');let id=0;
 const columns=r.columns.map((a,c)=>a.map((colour,row)=>({id:id++,colour,hp:health(r,c,row)})));
 const total=Array(4).fill(0);columns.flat().forEach(p=>total[p.colour]+=p.hp);
 const order=r.queue.flat(),left=order.map((colour,i)=>order.slice(i).filter(x=>x===colour).length);id=0;
 const queues=r.queue.map(q=>q.map(colour=>{const i=id++,n=Math.ceil(total[colour]/left[i]);total[colour]-=n;return {id:i,colour,charge:n};}));
 return {columns,queues};
}
export function makeState(level=0){const a=authored(level);return {...base('parade',level===0?'Tap a coloured lantern below. Its four sparks light matching bulbs in the bright front row.':rules(level).detail,level),...a,bay:[],active:null,shots:[],lit:[],flash:0};}
export function makeSampleState(){return {...makeState(0),...authored(0,SAMPLE_RULES),demo:true,note:'Easy demonstration: light the Pink front row, then the Gold row it reveals.'};}
export function track(u){const a=Math.PI/2+u*Math.PI*2;return {x:450+285*Math.cos(a),y:585+225*Math.sin(a)};}
export function send(s,source,index){
 if(s.phase!=='play'||s.result)return false;
 if(s.active){s.note='The trolley releases its sparks automatically. Pick the next lantern after this lap.';return false;}
 const list=source==='queue'?s.queues[index]:source==='bay'?s.bay:null;
 const lantern=source==='queue'?list?.[0]:list?.[index];if(!lantern)return false;
 remember(s);if(source==='queue')list.shift();else list.splice(index,1);
 s.active={...lantern,u:0,passed:[],hits:0,dir:rules(s).reverse&&s.moves%2?-1:1};s.moves++;
 s.note=COLOURS[lantern.colour]+' lantern on its lap. Its sparks drop automatically onto matching front bulbs.';return true;
}
function endLap(s){const a=s.active;if(!a)return;s.active=null;
 if(a.charge){s.bay.push({id:a.id,colour:a.colour,charge:a.charge});s.note='Some light remains. This lantern waits below; send it again after exposing its colour.';}
 else s.note='Lantern empty. A trolley space is free for your next choice.';
 if(s.bay.length>rules(s).bay){s.phase='result';s.result={title:'The waiting rail filled',detail:'Too many lanterns returned with spare light. Try a different launch order; returning lanterns need exposed colours.',won:false,prize:null,settle:true};}
}
export function step(s,dt){
 if(s.result||s.phase==='celebrate'||!Number.isFinite(dt)||dt<=0)return;
 s.t+=dt;s.flash=Math.max(0,s.flash-dt);
 if(s.active){const a=s.active,old=a.u;a.u=Math.min(1,a.u+dt/rules(s).lap);
  for(let c=0;c<6;c++){let at=(Math.PI*2-Math.acos((columnX(c)-450)/285)-Math.PI/2)/(Math.PI*2);if(a.dir===-1)at=1-at;
   if(old<at&&a.u>=at&&!a.passed.includes(c)){a.passed.push(c);const bulb=s.columns[c][0];
    if(a.charge&&bulb?.colour===a.colour&&shutterOpen(s,c)&&!s.shots.some(p=>p.id===bulb.id)){a.charge--;a.hits++;s.shots.push({id:bulb.id,c,colour:a.colour,t:0,from:track(a.dir===-1?1-at:at)});}
   }
  }
 }
 for(const p of s.shots){p.t+=dt;if(p.t>=.22&&!p.done){const bulb=s.columns[p.c][0];if(!bulb||bulb.id!==p.id)throw Error('Invalid parade bulb order');bulb.hp--;if(!bulb.hp){s.columns[p.c].shift();s.lit.push(p.id);}p.done=true;s.flash=.45;}}
 s.shots=s.shots.filter(p=>!p.done);
 if(!s.columns.some(c=>c.length)&&!s.shots.length){s.phase='celebrate';s.pendingPennies=3+s.level;s.note='Every light is glowing. Lumi can raise the curtain!';return;}
 if(s.active?.u===1)endLap(s);
}
export function restore(blob,level=blob?.level){
 const bad=validate(blob,'parade');if(blob.demo===true||blob.level!==level||!LEVELS[level])bad();const s=snapshot(blob),initial=authored(level);s.v=2;
 const int=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b,all=initial.columns.flat();
 if(!Array.isArray(s.columns)||s.columns.length!==6||!Array.isArray(s.queues)||s.queues.length!==3||!Array.isArray(s.bay)||s.bay.length>4||!Array.isArray(s.lit)||!Array.isArray(s.shots)||s.shots.length>6)bad();
 for(const b of s.columns.flat())if(b.hp===undefined&&level===0)b.hp=1;
 if(s.active&&s.active.dir===undefined&&level===0)s.active.dir=1;
 const bulbs=s.columns.flat();if(bulbs.some(p=>!int(p.id,0,all.length-1)||p.colour!==all[p.id].colour||!int(p.hp,1,all[p.id].hp))||s.lit.some(id=>!int(id,0,all.length-1))||new Set([...bulbs.map(p=>p.id),...s.lit]).size!==all.length||bulbs.length+s.lit.length!==all.length)bad();
 for(let c=0;c<6;c++){const allowed=initial.columns[c].map(p=>p.id),ids=s.columns[c].map(p=>p.id);if(ids.some((id,i)=>!allowed.includes(id)||(i&&id!==ids[i-1]+1)))bad();}
 const originals=initial.queues.flat(),lanterns=[...s.queues.flat(),...s.bay,...(s.active?[s.active]:[])];
 if(lanterns.some(p=>!int(p.id,0,originals.length-1)||p.colour!==originals[p.id].colour||!int(p.charge,0,originals[p.id].charge))||new Set(lanterns.map(p=>p.id)).size!==lanterns.length)bad();
 if(s.active&&(!Number.isFinite(s.active.u)||s.active.u<0||s.active.u>1||!Array.isArray(s.active.passed)||![1,-1].includes(s.active.dir)))bad();
 if(s.shots.some(p=>!int(p.c,0,5)||!bulbs.some(b=>b.id===p.id)||!Number.isFinite(p.t)||p.t<0||p.t>.23))bad();if(s.phase==='celebrate'&&bulbs.length)bad();
 s.history=s.history.map(h=>{const r=restore({...h,history:[]},level);delete r.history;return r;});return copy(s);
}
