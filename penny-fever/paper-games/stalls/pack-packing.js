import * as model from './pack-packing-model.js?v=packing-six-1';
import {study,paper,text,compactHeader as header,compactFooter as footer,paintChapterReward} from './study-kit.js?v=studies-six-1';
import {ease} from './study-state.js?v=studies-six-1';
import {withChapterExample} from './chapter-example.js?v=example-1';
import {itemName} from '../prizes.js?v=nft-art-1';
const art={},ROOT=new URL('../assets/kit-packing/',import.meta.url);let started=false;
// Alpha-bound each isolated atlas cell. No colour key removes the fine paper edges.
function loadArt(){
 if(started||typeof Image==='undefined')return;started=true;
 const image=new Image();image.onload=()=>{
  const names=['star','rose','corner','telescope','book','umbrella','base','lid','clasp'];
  names.forEach((name,i)=>{
   const sw=image.width/3,sh=image.height/3,w=Math.ceil(sw),h=Math.ceil(sh),source=document.createElement('canvas');source.width=w;source.height=h;
   const ctx=source.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,(i%3)*sw,Math.floor(i/3)*sh,sw,sh,0,0,w,h);
   const pixels=ctx.getImageData(0,0,w,h).data,seen=new Uint8Array(w*h);let largest=[];
   for(let n=0;n<w*h;n++)if(!seen[n]&&pixels[n*4+3]>48){
    const component=[n];seen[n]=1;
    for(let j=0;j<component.length;j++){const q=component[j],x=q%w,y=Math.floor(q/w);for(const k of [x? q-1:-1,x<w-1?q+1:-1,y?q-w:-1,y<h-1?q+w:-1])if(k>=0&&!seen[k]&&pixels[k*4+3]>48){seen[k]=1;component.push(k);}}
    if(component.length>largest.length)largest=component;
   }
   if(!largest.length)return;
   let x0=w,y0=h,x1=0,y1=0;for(const n of largest){const x=n%w,y=Math.floor(n/w);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
   x0=Math.max(0,x0-2);y0=Math.max(0,y0-2);x1=Math.min(w-1,x1+2);y1=Math.min(h-1,y1+2);
   const out=document.createElement('canvas');out.width=x1-x0+1;out.height=y1-y0+1;out.getContext('2d').drawImage(source,x0,y0,out.width,out.height,0,0,out.width,out.height);art[name]=out;
  });
 };
 image.src=new URL('craft-atlas-v2.png',ROOT).href;
}
function sprite(c,name,x,y,w,h,shadow=false){const image=art[name];if(!image)return;c.save();if(shadow){c.shadowColor='#231c1b80';c.shadowBlur=10;c.shadowOffsetY=7;}c.drawImage(image,x,y,w,h);c.restore();}
function contour(c,id,size){const cells=model.ITEMS[id].shape,set=new Set(cells.map(p=>p.join(','))),edges=[];for(const [x,y] of cells){if(!set.has(x+','+(y-1)))edges.push([[x,y],[x+1,y]]);if(!set.has((x+1)+','+y))edges.push([[x+1,y],[x+1,y+1]]);if(!set.has(x+','+(y+1)))edges.push([[x+1,y+1],[x,y+1]]);if(!set.has((x-1)+','+y))edges.push([[x,y+1],[x,y]]);}const loop=[edges.shift()];while(edges.length){const p=loop.at(-1)[1],i=edges.findIndex(e=>e[0][0]===p[0]&&e[0][1]===p[1]);if(i<0)break;loop.push(edges.splice(i,1)[0]);}c.beginPath();c.moveTo(loop[0][0][0]*size,loop[0][0][1]*size);for(const edge of loop)c.lineTo(edge[1][0]*size,edge[1][1]*size);c.closePath();}
function luggage(d,id,rotation,x,y,size,opts={}){
 const c=d.c,item=model.ITEMS[id],box=model.bounds(id,0),angle=opts.angle??rotation*Math.PI/2;
 c.save();c.globalAlpha=opts.alpha??1;c.translate(x,y);c.rotate(angle);c.translate(-box.w*size/2,-box.h*size/2);
 contour(c,id,size);c.shadowColor='#101c2390';c.shadowBlur=opts.flat?4:12;c.shadowOffsetY=opts.flat?2:8;c.fillStyle='#462c24';c.fill();c.shadowColor='transparent';
 c.save();c.clip();
 // A stitched luggage footprint remains honest even where a handle is narrower.
 const g=c.createLinearGradient(0,0,box.w*size,box.h*size);g.addColorStop(0,item.colour);g.addColorStop(1,'#433b2c');c.fillStyle=g;c.fillRect(0,0,box.w*size,box.h*size);
 const names=['star','rose','corner','telescope','book','umbrella'];sprite(c,names[id],1.5,1.5,box.w*size-3,box.h*size-3);
 c.restore();contour(c,id,size);c.strokeStyle=opts.outline||'#dec48e';c.lineWidth=opts.outline?4:1.6;c.stroke();
 c.save();c.setLineDash([2,4]);c.strokeStyle='#ffe9b179';c.lineWidth=1;contour(c,id,size);c.stroke();c.restore();
 // Tiny stitched crosses mark exact square centres, not extra collision areas.
 for(const [a,b] of item.shape){c.fillStyle='#fff0ca90';c.beginPath();c.arc((a+.5)*size,(b+.5)*size,1.25,0,Math.PI*2);c.fill();}
 c.restore();
}
function stitch(c,x,y,w,h,colour='#d7b97870',radius=12){c.save();c.strokeStyle=colour;c.lineWidth=1.2;c.setLineDash([3,4]);c.beginPath();c.roundRect(x,y,w,h,radius);c.stroke();c.restore();}
function lining(c,x,y,w,h){
 const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#173c36');g.addColorStop(.5,'#526347');g.addColorStop(1,'#1d372f');c.fillStyle=g;c.fillRect(x,y,w,h);
 if(art.base){c.save();c.globalAlpha=.7;const a=art.base;c.drawImage(a,a.width*.10,a.height*.17,a.width*.80,a.height*.48,x,y,w,h);c.restore();}
 c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.strokeStyle='#c9b47225';c.lineWidth=1;
 for(let k=-h;k<w+h;k+=33){c.beginPath();c.moveTo(x+k,y);c.lineTo(x+k+h,y+h);c.stroke();c.beginPath();c.moveTo(x+k,y);c.lineTo(x+k-h,y+h);c.stroke();}c.restore();
}
function geometry(s){const B=model.board(s),width=B.cols*B.cell,top=B.y-41,bottom=B.y+B.rows*B.cell+45;return {B,width,top,bottom,height:bottom-top,cy:(top+bottom)/2};}
function caseFrame(s,d){
 const c=d.c,q=model.rules(s),{B,width,top,bottom,height,cy}=geometry(s),left=B.x-29,right=B.x+width+29;
 // Only the functional suitcase covers the stall: the original carnival border stays visible.
 c.save();c.shadowColor='#271e2260';c.shadowBlur=20;c.shadowOffsetY=12;sprite(c,'base',left-9,top-6,width+76,height+46);c.restore();
 c.save();c.beginPath();c.roundRect(B.x-6,B.y-8,width+12,B.rows*B.cell+16,9);c.clip();lining(c,B.x-6,B.y-8,width+12,B.rows*B.cell+16);c.restore();
 sprite(c,'lid',left,248,width+58,109,true);stitch(c,left+15,258,width+28,78,'#dfc58b55');
 if(s.level&&!s.demo){
  paper(c,450,300,width-8,77,'#153c33da','#c5a77480',9);
  const words=q.detail.split(' '),lines=[''];for(const word of words){const i=lines.length-1;if((lines[i]+' '+word).length>39)lines.push(word);else lines[i]+=(lines[i]?' ':'')+word;}
  lines.forEach((line,i)=>text(c,line,450,300+(i-(lines.length-1)/2)*26,21,'#fff1cb'));
 }
 for(let y=0;y<B.rows;y++)for(let x=0;x<B.cols;x++){
  c.fillStyle=(x+y)%2?'#d8ce9920':'#081e191a';c.fillRect(B.x+x*B.cell,B.y+y*B.cell,B.cell,B.cell);c.strokeStyle='#d8c28c78';c.lineWidth=1;c.strokeRect(B.x+x*B.cell,B.y+y*B.cell,B.cell,B.cell);
  c.fillStyle='#ddcaa174';c.beginPath();c.arc(B.x+(x+.5)*B.cell,B.y+(y+.5)*B.cell,1,0,Math.PI*2);c.fill();
 }
 stitch(c,B.x-8,B.y-10,width+16,B.rows*B.cell+20,'#eed49d9c',8);
 for(const [a,b] of q.blocks){
  const x=B.x+(a+.5)*B.cell,y=B.y+(b+.5)*B.cell;paper(c,x,y,B.cell-4,B.cell-4,'#6e4d31','#deb577',8);
  stitch(c,x-B.cell/2+7,y-B.cell/2+7,B.cell-14,B.cell-14,'#f7d39b80',4);d.line({x:x-23,y:y-23},{x:x+23,y:y+23},'#b99158',3);d.line({x:x+23,y:y-23},{x:x-23,y:y+23},'#b99158',3);d.circle(x,y,9,'#c5a16a','#fae6b5',1);d.line({x:x-3,y},{x:x+3,y},'#655138',2);
 }
 if(q.hinge!==undefined){d.line({x:B.x,y:B.y-3},{x:B.x+width,y:B.y-3},'#f2d387',4);text(c,'MOON BOOK · TOP EDGE',450,B.y-17,19,'#ffe8af');}
 if(q.rim!==undefined||q.edge!==undefined){c.save();c.strokeStyle='#ebce92';c.lineWidth=3;c.strokeRect(B.x-2,B.y-2,width+4,B.cell*B.rows+4);c.restore();}
 if(s.level===3&&!s.demo){const x=B.x+2.5*B.cell,y=B.y+3.5*B.cell;paper(c,x,y,B.cell-7,32,'#bdd19b38','#d2ddb4',6);text(c,'OPEN',x,y,18,'#eff3d2');}
 // Small brass hinge caps sit outside the playable lining.
 for(const x of [left+48,right-48]){paper(c,x,top+8,24,16,'#bd9154','#e9cc93',4);d.line({x:x-7,y:top+7},{x:x+7,y:top+7},'#6d492f',2);}
}
function craftButton(c,title,x,y,w,primary=false){
 paper(c,x,y,w,56,primary?'#294b3feF':'#f3e5cbe8',primary?'#bf9a5a':'#aa8755',9);stitch(c,x-w/2+7,y-21,w-14,42,primary?'#e9ce9660':'#88613d60',5);text(c,title,x,y,primary?24:22,primary?'#fff0cb':'#624936');
}
function closeLid(s,d){
 const c=d.c,{width,height,cy}=geometry(s),u=s.motion?.kind==='close'?ease(s.motion.t/s.motion.duration):1,h=104+(height-112)*u,y=300+(cy-300)*u,left=450-(width+60)/2;
 c.save();c.globalAlpha=Math.min(1,u*4);paper(c,450,y,width+60,h,'#653c31','#d2ab6c',19);
 c.save();c.beginPath();c.roundRect(left+10,y-h/2+8,width+40,h-16,13);c.clip();lining(c,left+10,y-h/2+8,width+40,h-16);c.restore();
 sprite(c,'lid',left,y-h/2,width+60,h);stitch(c,left+15,y-h/2+12,width+30,h-24,'#f0d4a47c');
 for(const x of [450-width*.33,450+width*.33]){c.fillStyle='#633c30';c.fillRect(x-12,y-h/2+6,24,h-12);stitch(c,x-8,y-h/2+8,16,h-16,'#d0ac7959',3);}
 sprite(c,'clasp',402,y-42,96,84,true);c.restore();
}
function draw(s,d){
 loadArt();const c=d.c,B=model.board(s),q=model.rules(s),count=model.requiredCount(s),active=model.requiredItems(s);
 header(c,'KIT’S IMPOSSIBLE SUITCASE',s.demo?'Three parcels. One little travelling case.':(s.level+1)+' · '+q.name);
 ;text(c,model.packed(s)+' / '+count+' packed · '+(B.cols*B.rows-q.blocks.length-model.occupied(s).size)+' squares left',450,211,23,'#634936');caseFrame(s,d);
 const moving=s.motion&&['pack','lift'].includes(s.motion.kind)?s.motion.id:-1;
 for(const p of s.pieces)if(p.place&&p.id!==moving){const b=model.bounds(p.id,p.rotation);luggage(d,p.id,p.rotation,B.x+(p.place.x+b.w/2)*B.cell,B.y+(p.place.y+b.h/2)*B.cell,B.cell,{flat:true});}
 if(s.selected>=0&&s.phase==='play'){
  const p=s.pieces[s.selected];if(!p.place){const b=model.bounds(p.id,p.rotation),valid=model.canFit(s,p.id,p.rotation,s.cursor.x,s.cursor.y);c.save();c.beginPath();c.rect(B.x,B.y,B.cell*B.cols,B.cell*B.rows);c.clip();luggage(d,p.id,p.rotation,B.x+(s.cursor.x+b.w/2)*B.cell,B.y+(s.cursor.y+b.h/2)*B.cell,B.cell,{alpha:.38,outline:valid?'#e7f0bc':'#ffaaa4',flat:true});c.restore();}
 }
 for(const id of active){
  const p=s.pieces[id],t=model.TRAY[id],picked=s.selected===id&&!p.place;
  paper(c,t.x,t.y,157,113,picked?'#f6e2b6ef':'#f4e7cb9e',picked?'#c0944a':'#b7996555',10);
  if(picked)stitch(c,t.x-73,t.y-51,146,102,'#876c3f80',7);
  if(!p.place&&id!==moving){const b=model.bounds(id,p.rotation),rule=model.label(s,id),size=Math.min(39,118/b.w,(rule?58:75)/b.h),angle=s.motion?.kind==='turn'&&s.motion.id===id?p.rotation*Math.PI/2-(1-ease(s.motion.t/s.motion.duration))*(s.motion.turnBy||1)*Math.PI/2:undefined;luggage(d,id,p.rotation,t.x,t.y+(rule?4:-7),size,{angle});}
  if(p.place){sprite(c,'clasp',t.x-21,t.y-27,42,37);text(c,'PACKED',t.x,t.y+12,19,'#4e6746');}
  paper(c,t.x-65,t.y-43,23,25,'#6b4d35','#ddc395',5);text(c,id+1,t.x-65,t.y-43,17,'#fff4d7');text(c,model.ITEMS[id].name.replace('Bent ',''),t.x,t.y+41,18,'#624a35');
  const label=model.label(s,id);if(label){paper(c,t.x+10,t.y-42,119,24,'#41513e','#c7b585',5);text(c,label.replace('FIXED','UP ONLY').replace('SIDEWAYS','FLAT').replace('RIM ONLY','RIM').replace(' · ','/'),t.x+10,t.y-42,16,'#fff0cb');}
 }
 if(s.motion&&['pack','lift'].includes(s.motion.kind)){
  const m=s.motion,u=ease(m.t/m.duration),x=m.from.x+(m.to.x-m.from.x)*u,y=m.from.y+(m.to.y-m.from.y)*u-Math.sin(u*Math.PI)*54,b=model.bounds(m.id,m.rotation),small=Math.min(39,118/b.w,75/b.h),size=m.kind==='pack'?small+(B.cell-small)*u:B.cell+(small-B.cell)*u;luggage(d,m.id,m.rotation,x,y,size);
 }
 craftButton(c,'↶ UNDO',150,1031,110);craftButton(c,s.selected>=0&&q.allowed[s.selected]?.length===1?'FIXED':s.level>=4?'TURN':'TURN ¼',338,1031,160);craftButton(c,s.motion?.kind==='close'?'CLOSING…':['celebrate','result','demo-finish','demo-done'].includes(s.phase)?'CASE CLOSED':model.canLatch(s)?'CLOSE THE CASE':'FIT ALL '+(s.demo?'THREE':'SIX'),595,1031,276,model.canLatch(s));
 if(s.motion?.kind==='close'||['celebrate','result','demo-finish','demo-done'].includes(s.phase))closeLid(s,d);
 footer(c,s);paintChapterReward(s,d);
}
const engine=study({id:'pack',mode:'suitcase-packing',title:'Kit’s Impossible Suitcase',model,draw,
 intro:'Kit has one small case and six wonderfully awkward things. Fit every shape inside, then close the brass latches.',
 instructions:'Pick one of the six objects below the case. Its full shape appears faintly in the lining. Turn it with Turn ¼ or R, then tap the square where the TOP-LEFT of its rectangular outline should sit. The object must stay inside and cannot overlap anything packed. The squares reveal the exact shape, even where an illustrated prop is narrower. Tap a packed object, or its numbered tray card, to lift it back out. You can rearrange everything; Undo rewinds a placement, lift or turn. Once all six fit, Close the case completes the physical lid-and-latch action and finishes the chapter. Chapter2 keeps the moon book against the marked top edge. Chapter3 adds fixed brass corner plates. Chapter4 has a divider with an open passage. Chapter5 labels a fixed upright parcel and a sideways umbrella. Chapter6 combines corner plates, restricted turns and rim/edge requirements. All special rules are written on the case lid and tray labels before you choose. No timer.',
 keys:'1–6 choose object · R turn · arrows position · Enter pack · C close',
 tap(s,p){if(p.y>990&&p.y<1065){if(p.x>250&&p.x<425)model.turn(s);else if(p.x>450)model.latch(s);return;}const B=model.board(s);if(p.x>=B.x&&p.x<B.x+B.cell*B.cols&&p.y>=B.y&&p.y<B.y+B.cell*B.rows){const x=Math.floor((p.x-B.x)/B.cell),y=Math.floor((p.y-B.y)/B.cell),id=model.itemAt(s,x,y);if(s.selected<0&&id>=0)model.choose(s,id);else model.place(s,x,y);return;}for(let i=0;i<6;i++){const q=model.TRAY[i];if(Math.abs(p.x-q.x)<79&&Math.abs(p.y-q.y)<57){model.choose(s,i);return;}}},
 key(s,k){if(/^[1-6]$/.test(k))model.choose(s,Number(k)-1);else if(k.toLowerCase()==='r')model.turn(s);else if(k.toLowerCase()==='c')model.latch(s);else if(k==='Enter'||k===' ')model.place(s);else if(k.startsWith('Arrow'))model.cursor(s,s.cursor.x+(k==='ArrowRight'?1:k==='ArrowLeft'?-1:0),s.cursor.y+(k==='ArrowDown'?1:k==='ArrowUp'?-1:0));},
});
engine.reviewCopy.cost='Free local six-chapter test. Pennies and rewards are previews.';engine.reviewCopy.keys=engine.reviewCopy.keys.replace(' · 1–6 chapter buttons.','');
const sharedReady=engine.artReady;engine.artReady=()=>sharedReady()&&Object.keys(art).length===9;
export const kitExampleModel={makeState:()=>model.makeSampleState(),step(s,dt){
 if(s.phase==='demo-finish'){s.t+=dt;s.demoFinishLeft=Math.max(0,s.demoFinishLeft-dt);if(!s.demoFinishLeft)s.phase='demo-done';return;}
 if(s.phase==='demo-done')return;
 model.step(s,dt);
 if(s.phase==='celebrate'){s.pendingPennies=0;s.phase='demo-finish';s.demoFinishLeft=4.2;s.note='All three sample parcels fit. The lid and brass latches are closed.';}
}};
function drawSample(s,d){
 draw(s,d);if(s.phase!=='demo-finish'&&s.phase!=='demo-done')return;
 const c=d.c,prize=engine.prizes[0];paper(c,450,570,590,470,'#fff0e7f7','#b28a4d');text(c,'COLLECTED · EXAMPLE ONLY',450,385,27,'#684b3b');
 const image=d.art['study:'+prize+':front'];if(image)d.sprite(image,450,555,{w:230,h:230,shadow:false});text(c,itemName(prize),450,755,26,'#684b3b');
}
export function kitExampleSteps(){return [
 {caption:'An easy three-parcel example. Tap the Star parcel to see its exact shape in the lining.',point:{x:280,y:823},run:s=>model.choose(s,0),after:.12},
 {caption:'Tap the square for the TOP-LEFT of its outline. The whole T-shaped parcel settles into those four squares.',point:{x:413,y:422},run:s=>model.place(s,1,0),done:s=>!s.motion,after:.18},
 {caption:'Choose the Rose parcel. Its shape needs to turn before it fits beside the Star.',point:{x:450,y:823},run:s=>model.choose(s,1),after:.12},
 {caption:'TURN makes a real quarter-turn. The faint shape shows the room it needs.',point:{x:338,y:1031},run:s=>model.turn(s),done:s=>!s.motion,after:.18},
 {caption:'Place the Rose at the left edge. Its empty corners leave room for the final parcel.',point:{x:339,y:422},run:s=>model.place(s,0,0),done:s=>!s.motion,after:.18},
 {caption:'Choose the Corner parcel. It is already facing the right way for the remaining space.',point:{x:620,y:823},run:s=>model.choose(s,2),after:.12},
 {caption:'Tap its top-left square. Every parcel now fits without crossing the rim or overlapping another.',point:{x:413,y:496},run:s=>model.place(s,1,1),done:s=>!s.motion,after:.18},
 {caption:s=>['demo-finish','demo-done'].includes(s.phase)?'The case really closed. This sample reward changes no pennies, collection or saved chapter.':'All three fit. CLOSE THE CASE folds down the lid and catches the brass latches before the reward arrives.',point:{x:595,y:1031},run:s=>model.latch(s),done:s=>s.phase==='demo-done',after:0},
];}
function hasSavedFirst(){const key=engine.navigationKey.replace(/\.selection$/,'');try{return !!JSON.parse(localStorage.getItem(key)||'null')?.chapters?.[0]||!!JSON.parse(localStorage.getItem(key.replace('.v2:','.v1:'))||'null')?.snapshot;}catch{return true;}}
export default withChapterExample(engine,{model:kitExampleModel,draw:drawSample,steps:kitExampleSteps,hasSavedFirst,captionY:952,finishCaption:'Your turn: six odd things, one case. Pick, turn and pack; close the case when everything fits.'});
