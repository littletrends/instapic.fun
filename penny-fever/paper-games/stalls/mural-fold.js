import * as model from './mural-fold-model.js?v=fold-six-1';
import {study,paper,text,button,header,footer} from './study-kit.js?v=studies-six-1';
import {ease} from './study-state.js?v=studies-six-1';
const sprites=[];let loading=false;
function loadArt(){if(loading||typeof Image==='undefined')return;loading=true;const image=new Image();image.onload=()=>{
 for(let i=0;i<6;i++){const w=image.width/3,h=image.height/2,cell=document.createElement('canvas');cell.width=w;cell.height=h;const c=cell.getContext('2d',{willReadFrequently:true});c.drawImage(image,(i%3)*w,Math.floor(i/3)*h,w,h,0,0,w,h);const b=c.getImageData(0,0,w,h).data;let x0=w,y0=h,x1=0,y1=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(b[(y*w+x)*4+3]>40){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  const out=document.createElement('canvas');out.width=x1-x0+3;out.height=y1-y0+3;out.getContext('2d').drawImage(cell,x0-1,y0-1,out.width,out.height,0,0,out.width,out.height);sprites[i]=out;
 }};image.src=new URL('../assets/arlo-fold/props.png?v=fold-study-1',import.meta.url).href;}
function prop(d,i,x,y,w,alpha=1){if(sprites[i])d.sprite(sprites[i],x,y,{w,alpha,shadow:false});}
function path(c,points,width,colour){c.save();c.lineJoin='round';c.lineCap='round';c.lineWidth=width;c.strokeStyle=colour;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();c.restore();}
function sheet(c,x,y,w,h,fill='#e9dfbf'){
 c.save();c.shadowColor='#5a333343';c.shadowBlur=14;c.shadowOffsetX=4;c.shadowOffsetY=9;c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,7);c.fill();c.shadowColor='transparent';c.strokeStyle='#b99b69';c.lineWidth=2;c.stroke();c.strokeStyle='#fff7dd';c.lineWidth=2;c.strokeRect(x+5,y+5,w-10,h-10);c.restore();
}
function flap(c,edge,progress,rules){
 const v=progress===1?-1:Math.cos(progress*Math.PI);if(Math.abs(v)<.025)return;c.save();
 if(edge===0){c.translate(215,360);c.scale(v,1);}
 if(edge===2){c.translate(685,830);c.rotate(Math.PI);c.scale(v,1);}
 if(edge===1){c.translate(685,360);c.rotate(Math.PI/2);c.scale(v,1);}
 if(edge===3){c.translate(215,830);c.rotate(-Math.PI/2);c.scale(v,1);}
 sheet(c,-94,0,94,470,progress>.5?'#d7dfbf':'#ece2c7');
 // Folded paper has a painted lane on the reverse; its geometry moves with it.
 let pattern=rules.patterns[edge];if(edge===1||edge===2)pattern=pattern.slice().reverse();
 for(let i=0;i<5;i++){const y=47+i*94;if(pattern[i]){path(c,[{x:-94,y},{x:0,y}],22,'#a28a62');path(c,[{x:-94,y},{x:0,y}],15,'#fff0ce');if(pattern[i+1]){path(c,[{x:-47,y},{x:-47,y:y+94}],22,'#a28a62');path(c,[{x:-47,y},{x:-47,y:y+94}],15,'#fff0ce');}}
  else{c.fillStyle='#91a58a66';c.beginPath();c.ellipse(-45,y,26,14,.3,0,Math.PI*2);c.fill();}}
 c.strokeStyle='#9b7b52';c.lineWidth=2;c.setLineDash([7,6]);c.beginPath();c.moveTo(-1,5);c.lineTo(-1,465);c.stroke();c.restore();
}
function draw(s,d){loadArt();const c=d.c,rules=model.rules(s);header(c,'ARLO’S FOLD TRAIL',s.level===0?'A little painting. A whole world tucked inside.':(s.level+1)+' · '+rules.name);
 paper(c,450,s.level===0?229:226,620,s.level===0?55:72,'#fff2dfee','#b49869');text(c,s.seals.length+' / '+rules.seals.length+' painted seals · '+model.countFolds(s.folds)+' / '+rules.limit+' folds held',450,s.level===0?229:212,25);
 if(s.level>0)text(c,rules.ordered?'Seals 1–4 in order · Next: '+(s.seals.length<4?s.seals.length+1:'gate'):rules.limit===1?'One fold only · Open it before another.':s.level>=4?'Overlaps cover the path underneath.':'Any seal order · Plan a way back.',450,244,21);
 // A paper island with a watercolour creek, surrounded by four hinged margins.
 sheet(c,215,360,470,470,'#eee4c9');
 for(let i=0;i<25;i++){const p=model.point(i);if(!rules.base[i]){c.save();c.fillStyle=i%3===0?'#a9bab05c':'#b7c3b051';c.beginPath();c.ellipse(p.x,p.y,39+(i%2)*4,31,.2,0,Math.PI*2);c.fill();c.strokeStyle='#859b8766';c.lineWidth=1;c.beginPath();c.ellipse(p.x,p.y+5,27,13,-.15,0,Math.PI);c.stroke();c.restore();}}
 for(let edge=0;edge<4;edge++){const m=s.motion?.kind==='fold'&&s.motion.edge===edge?s.motion:null,p=m?((m.from&(1<<edge)?1:0)+(m.to&(1<<edge)?1:-1)*ease(m.t/m.duration)):s.folds&(1<<edge)?1:0;flap(c,edge,p,rules);}
 const open=model.openCells(s.folds,s.level),movingEdge=s.motion?.kind==='fold'?s.motion.edge:-1;
 for(let cell=0;cell<25;cell++)if(open[cell]){const p=model.point(cell),a=model.xy(cell);for(const n of [cell+1,cell+5])if(n<25&&open[n]&&(n!==cell+1||Math.floor(n/5)===a.y)){
  if(movingEdge>=0&&(model.onMargin(cell,movingEdge)||model.onMargin(n,movingEdge)))continue;const q=model.point(n);path(c,[p,q],26,'#a18c68');path(c,[p,q],18,'#fff0cf');c.save();c.setLineDash([3,8]);path(c,[p,q],1,'#ae9568');c.restore();}
  if(movingEdge<0||!model.onMargin(cell,movingEdge)){d.circle(p.x,p.y,15,'#fff0cf','#a18c68',2);if(model.route(s,cell))d.circle(p.x,p.y,4,'#b4935c');}
 }
 if(s.level===0){prop(d,5,453,493,112,.9);prop(d,5,642,737,74,.8);}else [7,12,17,6,8,16,18].filter(cell=>!rules.base[cell]&&cell!==rules.goal&&!rules.seals.some(s=>s.cell===cell)).slice(0,2).forEach((cell,i)=>{const p=model.point(cell);prop(d,5,p.x,p.y-8,i?76:102,.85);});
 // Painted seals are game objectives, distinct from chapter rewards and tokens.
 for(let i=0;i<rules.seals.length;i++){const seal=rules.seals[i],p=model.point(seal.cell),got=s.seals.includes(i),next=rules.ordered&&s.seals.length===i;prop(d,[0,1,4,5][i],p.x,p.y-18,98,got?.82:1);if(next)d.glow(p.x,p.y+28,28,'#efcb7d');d.circle(p.x,p.y+28,18,got?'#a7ad85':'#fff2d9',next?'#95733d':'#b08d54',next?4:2);text(c,got?'✓':String(i+1),p.x,p.y+28,22,got?'#fff3da':'#886b48');}
 const gate=model.point(rules.goal);prop(d,2,gate.x,gate.y-17,101,s.seals.length===rules.seals.length?1:.73);if(s.seals.length===rules.seals.length)d.glow(gate.x,gate.y,47,'#edd593');
 if(s.motion?.kind==='walk'){const m=s.motion;for(const n of m.path.slice(m.index+1)){const p=model.point(n);d.circle(p.x,p.y,5,'#cfad68');}}
 let p=model.point(s.pawn),facing=1,bob=0,alpha=1;
 if(s.motion?.kind==='walk'){const m=s.motion,a=model.point(m.path[m.index]),b=model.point(m.path[m.index+1]),u=ease(m.t/m.duration);p={x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u};facing=b.x<a.x?-1:1;bob=Math.sin(m.t/m.duration*Math.PI)*5;}
 if(s.motion?.kind==='exit'){const u=ease(s.motion.t/s.motion.duration);p={x:gate.x,y:gate.y-u*72};alpha=1-Math.max(0,u-.7)/.3;}
 c.save();c.translate(p.x,p.y-22-bob);c.scale(facing,1);prop(d,3,0,0,61,alpha);c.restore();
 const labels=['West','North','East','South'];for(let edge=0;edge<4;edge++){const x=edge%2===0?330:570,y=edge<2?970:1032,held=!!(s.folds&(1<<edge));paper(c,x,y,210,52,held?'#e0dbb7':'#fff0d9',held?'#7f8b5d':'#ad8d5d',11);text(c,(edge+1)+' '+labels[edge]+' · '+(held?'Open':'Fold'),x,y,23);}
 button(c,'↶ UNDO',150,1031,110);footer(c,s);
}
const instructions='Guide the little paper traveller to every numbered painted seal, then through the lantern gate. Tap any connected painted path to walk there. Tap a margin or use its West, North, East or South button to fold a missing path into the picture. Usually TWO margins can stay folded at once; Chapter3 allows only ONE, as shown above the map. Open one to make room for another. Step off a margin before folding or opening it, and think about your return path! Chapter2 changes the entrance and corner gate. Chapter4 splits the map into two banks joined only by folded bridges. Chapter5 needs all four corner seals; overlapping paper covers the path underneath. Chapter6 has an empty centre and requires seals1,2,3,4 in that order; its next seal glows. Other chapters allow any seal order. Finish only after painting every seal and walking through the gate. No timer. Undo rewinds a decision; Help pauses. Six local chapters, each saved separately. Pennies and chapter rewards are previews.';
const engine=study({id:'mural',mode:'fold-trail',title:'Arlo’s Fold Trail',model,draw,intro:'A tiny paper traveller wanders through Arlo’s painting. Fold its margins, make new paths, and carry three painted seals home.',instructions,keys:'1–4 fold/open margins · Arrow keys walk · U undo',
 tap(s,p){for(let edge=0;edge<4;edge++){const x=edge%2===0?330:570,y=edge<2?970:1032;if(Math.abs(p.x-x)<105&&Math.abs(p.y-y)<27){model.toggle(s,edge);return;}}
  const edge=p.x>121&&p.x<215&&p.y>360&&p.y<830?0:p.y>266&&p.y<360&&p.x>215&&p.x<685?1:p.x>685&&p.x<779&&p.y>360&&p.y<830?2:p.y>830&&p.y<924&&p.x>215&&p.x<685?3:-1;
  if(edge>=0&&!(s.folds&(1<<edge))){model.toggle(s,edge);return;}const x=Math.round((p.x-262)/94),y=Math.round((p.y-407)/94);if(x>=0&&x<5&&y>=0&&y<5)model.walk(s,y*5+x);},
 key(s,k){if(/^[1-4]$/.test(k))model.toggle(s,Number(k)-1);const a={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[k];if(a)model.arrow(s,...a);},
});
engine.instructions=instructions;engine.reviewCopy.keys='Tap paths to walk · 1–4 folds · Arrow keys walk · U undo · Help pauses';engine.reviewCopy.cost='Free local six-chapter test. No real purse, tokens or NFT collection.';engine.artReady=()=>sprites.length===6&&sprites.every(Boolean);
const create=engine.create;engine.create=level=>{loadArt();return create(level);};
export default engine;
