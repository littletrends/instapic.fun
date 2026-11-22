import * as model from './popcorn-paper-model.js?v=popcorn-catch-2';
import {study,paper,text,compactHeader as header,compactFooter as footer,paintChapterReward} from './study-kit.js?v=studies-six-1';
import {withChapterExample} from './chapter-example.js?v=example-1';
import {itemName} from '../prizes.js?v=nft-art-1';
const art={};let loading=false;
const START={x:450,y:640,width:340};
const atStart=p=>Math.abs(p.x-START.x)<=START.width/2&&Math.abs(p.y-START.y)<=28;
function loadArt(){
 if(loading||typeof Image==='undefined')return;loading=true;
 const image=new Image();image.onload=()=>{
  const w=image.width,h=image.height,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);const source=c.getImageData(0,0,w,h),pixels=source.data,labels=new Uint32Array(w*h),queue=new Int32Array(w*h),chosen=Array(9).fill(null);let tag=0;
  // Locate whole connected props: the authored atlas rows have unequal heights.
  for(let n=0;n<w*h;n++)if(!labels[n]&&pixels[n*4+3]>=128){
   const id=++tag;let head=0,tail=1,x0=w,x1=0,y0=h,y1=0,sx=0,sy=0;queue[0]=n;labels[n]=id;
   while(head<tail){const at=queue[head++],x=at%w,y=Math.floor(at/w);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);sx+=x;sy+=y;
    for(const k of [x?at-1:-1,x<w-1?at+1:-1,y?at-w:-1,y<h-1?at+w:-1])if(k>=0&&!labels[k]&&pixels[k*4+3]>=128){labels[k]=id;queue[tail++]=k;}
   }
   const cell=Math.min(2,Math.floor(sx/tail/(w/3)))+Math.min(2,Math.floor(sy/tail/(h/3)))*3;
   if(tail>400&&tail>(chosen[cell]?.count||0))chosen[cell]={id,count:tail,x0:Math.max(0,x0-2),y0:Math.max(0,y0-2),x1:Math.min(w-1,x1+2),y1:Math.min(h-1,y1+2)};
  }
  const names=['kettle','tray','bag','warm','butter','gold','burnt','dial','rosette'];
  chosen.forEach((box,i)=>{if(!box)return;const crop=document.createElement('canvas');crop.width=box.x1-box.x0+1;crop.height=box.y1-box.y0+1;const ctx=crop.getContext('2d'),out=ctx.createImageData(crop.width,crop.height);
   for(let y=0;y<crop.height;y++)for(let x=0;x<crop.width;x++){const a=(y+box.y0)*w+x+box.x0,k=(y*crop.width+x)*4;let keep=labels[a]===box.id;if(!keep)for(const d of [-w-1,-w,-w+1,-1,1,w-1,w,w+1])if(labels[a+d]===box.id){keep=true;break;}if(keep){out.data[k]=pixels[a*4];out.data[k+1]=pixels[a*4+1];out.data[k+2]=pixels[a*4+2];out.data[k+3]=pixels[a*4+3];}}
   ctx.putImageData(out,0,0);art[names[i]]=crop;
  });
 };
 image.src=new URL('../assets/popcorn/craft-props-v2.png',import.meta.url).href;
}
function sprite(c,name,x,y,w,h,shadow=false){const image=art[name];if(!image)return;c.save();if(shadow){c.shadowColor='#55301c55';c.shadowBlur=8;c.shadowOffsetY=5;}c.drawImage(image,x,y,w,h);c.restore();}
function pop(d,p,scale=1,alpha=1){const c=d.c;c.save();c.globalAlpha=alpha;c.translate(p.x,p.y);c.rotate(p.spin||0);sprite(c,p.kind,-13*scale,-14*scale,26*scale,26*scale);if(p.kind==='gold')d.star(0,-17*scale,4.5*scale,'#ffe7a1','#a97932',.7);c.restore();}
function bag(d,x,active,filled,label){const c=d.c;d.ellipse(x+3,978,65,9,'#633b2438');c.save();c.beginPath();c.rect(x-62,model.BAG_TOP-23,124,78);c.clip();sprite(c,'bag',x-59,model.BAG_TOP-14,118,131,true);c.restore();d.ellipse(x,model.BAG_TOP,55,9,'#74452a','#d6ac75',1.5);d.ellipse(x,model.BAG_TOP,50,5,'#513222');text(c,label,x,893,20,active?'#785035':'#987b55');text(c,filled?filled+' PACKED':'ORDER BAG',x,958,16,'#693f2d');}
function heatDial(d,s){const c=d.c,x=652,y=366;sprite(c,'dial',x-37,y-35,74,70,true);d.circle(x,y,24,'#f1dfbb','#b48b53',1);const a=-2.42+s.heat*1.68;d.line({x,y},{x:x+Math.cos(a)*19,y:y+Math.sin(a)*19},s.heat>.7?'#aa3e3e':'#863c37',3);d.circle(x,y,3,'#b78b45','#f9dc9c',1);text(c,'HEAT',x,y+49,18,'#745039');}
function craftButton(c,title,x,y,w=200,active=false){paper(c,x,y,w,55,active?'#d7ddb0':'#faebd0e8','#ac824a',9);c.save();c.setLineDash([3,4]);c.strokeStyle='#b18d5b73';c.lineWidth=1;c.beginPath();c.roundRect(x-w/2+7,y-21,w-14,42,5);c.stroke();c.restore();text(c,title,x,y,22,'#684b35');}
function draw(s,d){loadArt();const c=d.c,r=model.rules(s),o=model.currentOrder(s);header(c,'POPPY’S PAPER POPCORN',(s.level+1)+' · '+r.name);
 ;text(c,Math.ceil(s.remaining)+'s · kettle '+s.spawned+' / '+r.total+' · heat '+Math.round(s.heat*100)+'%',450,190,23,'#71503b');
 const w=Math.min(220,680/r.orders.length);r.orders.forEach((order,i)=>{const x=450+(i-(r.orders.length-1)/2)*w;paper(c,x,248,w-8,54,i<s.ordersDone?'#739174':i===s.ordersDone?'#f5d69ce8':'#f4e6cdb0','#ad845075',8);text(c,order.side.toUpperCase()+(i<s.ordersDone?' ✓':''),x,237,20,i<s.ordersDone?'#fff0d0':'#755039');text(c,order.units+' '+order.flavour.toUpperCase(),x,259,18,i<s.ordersDone?'#fff0d0':'#755039');});
 pop(d,{x:221,y:339,kind:'gold'},1.1);text(c,'GOLD = 2',232,371,17,'#7b5337');pop(d,{x:221,y:403,kind:'burnt'},1.1);text(c,'AVOID BURNT',232,434,17,'#7b5337');heatDial(d,s);
 // The copper pot is art; the visible one/two outlet mouths are the actual spawn points.
 if(r.spouts===2){d.line({x:450,y:438},{x:375,y:438},'#bb8a4e',10);d.line({x:450,y:438},{x:525,y:438},'#bb8a4e',10);for(const x of [375,525])d.line({x,y:438},{x,y:455},'#d8a05a',9);}
 d.ellipse(450,475,107,12,'#704a3130');sprite(c,'kettle',345,281,210,174,true);
 const mouths=r.spouts===2?[375,525]:[450];for(const x of mouths){d.poly([[x-17,444],[x+17,444],[x+14,458],[x-14,458]],'#c99353','#edcb8f',1.5);d.ellipse(x,455,16,6,'#633c27','#f4d398',1.5);}if(s.running&&s.spawned<r.total)for(let i=0;i<3;i++){const age=(s.clock*.65+i*.3)%1;d.ellipse(422+i*28,323-age*31,8+age*5,5+age*3,'#fff4d53d');}
 for(const x of [model.LEFT,model.RIGHT]){d.line({x,y:505},{x,y:952},'#b3834e',4);d.line({x:x-1,y:505},{x:x-1,y:952},'#f1c87f',1);for(const y of [510,720,950])d.circle(x,y,4,'#d8ab62','#f8df9f',1);}
 // Bags sit behind the service counter; their receiving ellipses stay at BAG_TOP.
 paper(c,450,942,690,90,'#985d3f','#dcac69',9);for(let x=137;x<780;x+=37)d.line({x,y:900},{x,y:984},'#5e36222d',2);bag(d,205,o?.side==='left',s.deliveries.filter(p=>p.x===205).length,'LEFT');bag(d,695,o?.side==='right',s.deliveries.filter(p=>p.x===695).length,'RIGHT');sprite(c,'rosette',427,912,46,58,true);d.line({x:133,y:900},{x:767,y:900},'#e9c18a90',2);
 const x=s.tray.x,half=r.width/2;d.ellipse(x+3,862,half+12,10,'#754b3033');sprite(c,'tray',x-half-11,model.TRAY_TOP-24,r.width+22,78,true);
 d.ellipse(x,model.TRAY_TOP+10,half-12,25,'#5e392ccc','#f4d59a',1.3);d.line({x:x-half+12,y:model.TRAY_TOP},{x:x+half-12,y:model.TRAY_TOP},'#f9e6b875',1);
 // Every stored pop keeps its real settling pose inside the shallow bowl.
 for(const p of s.contents)pop(d,{...p,x:x+p.x,y:model.TRAY_TOP+p.y},.8);c.save();c.strokeStyle='#e5bd7d';c.lineWidth=3;c.beginPath();c.ellipse(x,model.TRAY_TOP+9,half-3,25,0,0,Math.PI);c.stroke();c.restore();
 for(const p of s.kernels)if(p.mode==='flight')pop(d,p,1);else if(p.mode==='miss')pop(d,p,.8,Math.max(0,1-p.t/.28));for(const p of s.pouring)pop(d,p,.7);
 if(o&&s.running){const aligned=Math.abs(s.tray.x-model.dockX(o.side))<45&&Math.abs(s.tray.vx)<105;text(c,aligned?'CLICK / TAP TO POUR '+o.side.toUpperCase():'CARRY TO '+o.side.toUpperCase(),450,875,20,aligned?'#5f7d51':'#8e5a40');}
 if(s.phase==='play'&&!s.running){
  craftButton(c,'START KETTLE',START.x,START.y,START.width,true);
 }else if(s.running){
  paper(c,450,992,690,41,'#fff0dfb8','#b78c5570',9);
  text(c,'TRAY '+model.portions(s)+' portions · '+s.contents.length+' / '+r.capacity+' slots'+(s.bag?' · POURING':''),450,992,22,'#77533c');
  craftButton(c,'↶ UNDO',155,1044,128);
  craftButton(c,'SHAKE OUT 1',333,1044,172);
  craftButton(c,s.bag?'POURING…':o?'SERVE '+o.side.toUpperCase():'KETTLE COOLING',600,1044,330,model.ready(s));
 }
 footer(c,{note:s.note});paintChapterReward(s,d);
}
const instructions='Click or tap Start Kettle to begin. Move your mouse or slide your finger to steer the tray. You can also hold the arrow keys. Lead the falling popcorn so it crosses inside the tray rim. Warm and butter pops count as one portion. A gold pop counts as two portions in one slot. A burnt pop spoils the whole handful in the tray and raises heat. Let dark pops fall past. Carry the portions to the marked bag, let the tray and popcorn settle, then click or tap to pour. Later orders need gold or butter. Shake out 1 drops the last pop you caught and adds a little heat. Use it to make room for an ingredient. Space starts or pours, X shakes out a pop, and Undo rewinds a move. The kettle holds a limited number of pops. The round ends if time runs out or the tray overheats.';
const engine=study({id:'popcorn',mode:'popcorn-play',title:'Poppy’s Paper Popcorn',model,draw,intro:'Catch the warm kernels, save the right handful, and carry it to a real paper bag. Poppy’s kettle is finite: every portion needs an honest catch.',instructions,keys:'Move/slide tray · Click/tap to start or pour · Space start/serve · X Shake out 1 · U Undo',tap(s,p){
 if(!s.running){if(atStart(p))model.start(s);return;}
 if(p.y>1016&&p.y<1073){if(p.x>=435&&p.x<=765)model.serve(s);else if(p.x>=247&&p.x<=419)model.shake(s);}
}});
const persist=s=>{try{engine.persist(s);}catch{}};const original=engine.pointer;engine.pointer=(s,type,p)=>{
 if(type==='cancel'){model.clearInput(s);original(s,type,p);return;}
 if(s.saveError||s.result||s.phase==='celebrate')return;
 if(!s.running){original(s,type,p);return;}
 if(s.drag){
  const start=s.drag.origin;
  if(start&&Math.hypot(p.x-start.x,p.y-start.y)>=35)s.drag.slid=true;
  if(type==='move')model.moveDrag(s,p);
  if(type==='up'){
   const tap=start&&!s.drag.slid&&Math.hypot(p.x-start.x,p.y-start.y)<35;
   model.moveDrag(s,p);model.endDrag(s,true);
   if(tap&&s.running&&p.y>600&&p.y<980)model.serve(s);
   persist(s);
  }
  return;
 }
 if(p.y>=455&&p.y<980){
  if(type==='down'){if(model.beginDrag(s,p))s.drag.origin={x:p.x,y:p.y};return;}
  if(type==='move'){model.setTarget(s,p.x);return;}
 }
 original(s,type,p);
};
engine.key=(s,k,down)=>{if(s.saveError||s.result||s.phase==='celebrate')return;if(k==='ArrowLeft'||k==='ArrowRight'){model.hold(s,k==='ArrowLeft'?'left':'right',down);if(!down)persist(s);return;}if(k===' '){if(down&&!s.pressed){s.pressed=true;model.serve(s);persist(s);}if(!down)delete s.pressed;return;}if(!down)return;if(k==='Enter')model.serve(s);if(k.toLowerCase()==='x')model.shake(s);if(k.toLowerCase()==='u')model.undo(s);persist(s);};const release=engine.releaseInput;engine.releaseInput=s=>{model.clearInput(s);release(s);};engine.instructions=instructions;const sharedReady=engine.artReady;engine.artReady=()=>{loadArt();return sharedReady()&&Object.keys(art).length===9;};
export const poppyExampleModel={makeState:()=>model.makeSampleState(),step(s,dt){
 if(s.phase==='demo-finish'){s.clock+=dt;s.demoFinishLeft=Math.max(0,s.demoFinishLeft-dt);if(!s.demoFinishLeft)s.phase='demo-done';return;}
 if(s.phase==='demo-done')return;
 model.step(s,dt);if(s.phase==='celebrate'){s.pendingPennies=0;s.phase='demo-finish';s.demoFinishLeft=4.2;s.note='The real sample pop settled inside its paper bag.';}
}};
function drawSample(s,d){draw(s,d);if(!['demo-finish','demo-done'].includes(s.phase))return;const c=d.c,prize=engine.prizes[0];paper(c,450,570,590,470,'#fff0e7f7','#b28a4d');text(c,'COLLECTED · EXAMPLE ONLY',450,385,27);const image=d.art['study:'+prize+':front'];if(image)d.sprite(image,450,555,{w:230,h:230,shadow:false});text(c,itemName(prize),450,755,26);}
export function poppyExampleSteps(){return [
 {caption:'Press Start Kettle. One pop falls from the spout for you to catch.',point:START,run:s=>model.start(s),done:s=>s.spawned===1,after:0},
 {caption:'Lead its left arc with the tray. Catch only when the pop crosses the mouth inside the inner brass rim.',point:{x:205,y:770},approach:.35,gesture:.2,run:s=>model.setTarget(s,205),done:s=>s.caught===1,after:.1},
 {caption:'Let the pop settle and the tray brake at LEFT. A catch still needs its physical bag delivery.',point:{x:205,y:770},run:s=>model.setTarget(s,205),done:s=>model.ready(s)&&Math.abs(s.tray.vx)<90&&s.contents.every(p=>p.y>=20&&Math.abs(p.vy)<=8),after:.1},
 {caption:s=>['demo-finish','demo-done'].includes(s.phase)?'The pop really entered the bag. This sample reward changes no chapter, collection or pennies.':'Click or tap over the LEFT bag to pour. The stored pop must actually enter the bag before the example finishes.',point:{x:205,y:875},run:s=>model.serve(s),done:s=>s.phase==='demo-done',after:0},
];}
function hasSavedFirst(){const key=engine.navigationKey.replace(/\.selection$/,'');try{return !!JSON.parse(localStorage.getItem(key)||'null')?.chapters?.[0]||!!JSON.parse(localStorage.getItem(key.replace('.v2:','.v1:'))||'null')?.snapshot;}catch{return true;}}
export default withChapterExample(engine,{model:poppyExampleModel,draw:drawSample,steps:poppyExampleSteps,hasSavedFirst,captionY:123,finishCaption:'Your turn: catch three portions, brake at LEFT and click or tap to pour. Then pack another three at RIGHT.'});
