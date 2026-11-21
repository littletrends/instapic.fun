import * as model from './ball-toss-paper-model.js?v=plates-six-1';
import {study,paper,text,button,header,footer} from './study-kit.js?v=studies-six-1';
import {withChapterExample} from './chapter-example.js?v=example-1';
const art=[],displayArt=[];let loading=false;
function bodyBounds(bytes,w,h){
 const visited=new Uint8Array(w*h),queue=new Int32Array(w*h);let best=null,bestCount=0;
 for(let seed=0;seed<w*h;seed++){
  if(visited[seed]||bytes[seed*4+3]<=48)continue;
  let head=0,tail=1,x0=w,y0=h,x1=-1,y1=-1;queue[0]=seed;visited[seed]=1;
  while(head<tail){const k=queue[head++],x=k%w,y=Math.floor(k/w);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   for(const n of [x>0?k-1:-1,x<w-1?k+1:-1,y>0?k-w:-1,y<h-1?k+w:-1])if(n>=0&&!visited[n]&&bytes[n*4+3]>48){visited[n]=1;queue[tail++]=n;}
  }
  if(tail>bestCount){bestCount=tail;best=[x0,y0,x1,y1];}
 }
 return best;
}
function loadArt(){
 if(loading||typeof Image==='undefined')return;loading=true;
 const image=new Image();image.onload=()=>{
  for(let i=0;i<9;i++){
   const sw=image.width/3,sh=image.height/3,w=Math.ceil(sw),h=Math.ceil(sh),cell=document.createElement('canvas');cell.width=w;cell.height=h;
   const c=cell.getContext('2d',{willReadFrequently:true});c.drawImage(image,(i%3)*sw,Math.floor(i/3)*sh,sw,sh,0,0,w,h);
   const bytes=c.getImageData(0,0,w,h).data,bounds=bodyBounds(bytes,w,h);if(!bounds)continue;let [x0,y0,x1,y1]=bounds;
   x0=Math.max(0,x0-2);y0=Math.max(0,y0-2);x1=Math.min(w-1,x1+2);y1=Math.min(h-1,y1+2);
   const out=document.createElement('canvas');out.width=x1-x0+1;out.height=y1-y0+1;out.getContext('2d').drawImage(cell,x0,y0,out.width,out.height,0,0,out.width,out.height);displayArt[i]=out;
  }
  if(displayArt.filter(Boolean).length===9){for(const [i,source]of [1,4,2,3,7,5].entries())art[i]=displayArt[source];}
 };image.src=new URL('../assets/bess-plates/craft-props-v2.png?v=bess-craft-2',import.meta.url).href;
}
function prop(d,i,x,y,w,opts={}){if(art[i])d.sprite(art[i],x,y,{w,shadow:false,...opts});}
function displayProp(d,i,x,y,w,opts={}){if(displayArt[i])d.sprite(displayArt[i],x,y,{w,shadow:false,...opts});}
function crest(d){
 const image=displayArt[8];if(!image)return;const h=image.height*.38,w=300;d.c.drawImage(image,0,0,image.width,h,300,22,w,h*w/image.width);
}
function trough(d,x,y,w,h,front=false){
 const image=art[5];if(!image)return;const c=d.c,scale=h/image.height,cap=image.width*.18*scale,middle=image.width*.24*scale,band=Math.max(1,(w-cap*2-middle)/2),cuts=[0,.18,.38,.62,.82,1],widths=[cap,band,middle,band,cap];let dx=x-w/2;
 c.save();if(front){c.beginPath();c.rect(x-w/2-2,918,w+4,45);c.clip();}
 for(let i=0;i<5;i++){c.drawImage(image,cuts[i]*image.width,0,(cuts[i+1]-cuts[i])*image.width,image.height,dx,y-h/2,widths[i],h);dx+=widths[i];}
 c.restore();
}
function wood(c,x,y,w,h,fill='#9c6540'){
 c.save();c.shadowColor='#3b211b40';c.shadowBlur=8;c.shadowOffsetY=5;c.beginPath();c.roundRect(x-w/2,y-h/2,w,h,6);const g=c.createLinearGradient(x-w/2,0,x+w/2,0);g.addColorStop(0,'#603c29');g.addColorStop(.2,fill);g.addColorStop(.52,'#d0a36c');g.addColorStop(.82,fill);g.addColorStop(1,'#5e3b29');c.fillStyle=g;c.fill();c.shadowColor='transparent';c.strokeStyle='#e3be7a';c.lineWidth=1.5;c.stroke();c.clip();c.strokeStyle='#56392755';c.lineWidth=1;for(let i=0;i<5;i++){const xx=x-w*.4+i*w*.18;c.beginPath();c.moveTo(xx,y-h/2);c.bezierCurveTo(xx+4,y-h*.18,xx-3,y+h*.24,xx+2,y+h/2);c.stroke();}c.restore();
}
function ribbon(d,a,b){
 const c=d.c,len=Math.hypot(b.x-a.x,b.y-a.y),nx=len?-(b.y-a.y)/len:1,ny=len?(b.x-a.x)/len:0;
 d.line(a,b,'#682c38',7);d.line({x:a.x+nx*1.5,y:a.y+ny*1.5},{x:b.x+nx*1.5,y:b.y+ny*1.5},'#db9b78',2);
 c.save();c.strokeStyle='#f2d7a0';c.lineWidth=.8;c.setLineDash([3,5]);c.beginPath();c.moveTo(a.x-nx*1.5,a.y-ny*1.5);c.lineTo(b.x-nx*1.5,b.y-ny*1.5);c.stroke();c.restore();
 d.circle(a.x,a.y,3,'#c49957','#f6dfad',1);d.circle(b.x,b.y,3,'#c49957','#f6dfad',1);
}
function frame(s,d){
 const c=d.c,r=model.rules(s);
 d.ellipse(450,875,314,28,'#5d332840');
 wood(c,450,872,624,49,'#a97c4f');
 for(let x=162;x<739;x+=29)d.line({x,y:851},{x:x+9,y:891},'#f0ce8b30',1);
 d.ellipse(450,852,311,22,'#dcba82','#8c623e',3);d.ellipse(450,848,304,15,'#ead4aa','#f7e2b7',1.5);
 for(const x of [143,757]){
  wood(c,x,611,18,542,'#95593b');
  for(const y of [364,815,867]){d.circle(x,y,5,'#b88d47','#f2d599',1.3);d.circle(x-1,y-1,1.5,'#fff0c7');}
 }
 if(r.moving){
  for(const x of model.PARTITIONS){
   c.save();c.shadowColor='#4f2d2640';c.shadowBlur=5;c.shadowOffsetX=2;c.fillStyle='#6b3038';c.fillRect(x-4,350,8,450);c.shadowColor='transparent';c.strokeStyle='#e4bf80';c.lineWidth=1;c.strokeRect(x-3.5,350.5,7,449);
   c.strokeStyle='#efce9c';c.lineWidth=1;for(let y=360;y<791;y+=22){c.beginPath();c.moveTo(x-2,y);c.lineTo(x+2,y+9);c.stroke();}c.restore();
  }
  for(const spec of r.plates.filter(p=>!p.parents.length)){
   const x=spec.x;d.line({x:x-model.RACK_SWING-12,y:866},{x:x+model.RACK_SWING+12,y:866},'#61412d',5);d.line({x:x-model.RACK_SWING-12,y:864},{x:x+model.RACK_SWING+12,y:864},'#e5c483',1.5);
   for(const side of [-1,1])d.circle(x+side*(model.RACK_SWING+12),866,4,'#b88d47','#f8dc9a',1);
  }
 }
 for(const rail of r.rails||[]){
  const a={x:rail.x1,y:rail.y1},b={x:rail.x2,y:rail.y2};c.save();c.shadowColor='#3b212343';c.shadowBlur=6;c.shadowOffsetX=2;c.shadowOffsetY=4;
  d.line(a,b,'#64402f',rail.r*2);c.shadowColor='transparent';d.line(a,b,'#d5b377',rail.r*2-2);d.line(a,b,'#733844',Math.max(2,rail.r*2-5));
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;c.strokeStyle='#f0d4a2';c.lineWidth=.8;c.setLineDash([3,4]);for(const side of [-1,1]){c.beginPath();c.moveTo(a.x+nx*rail.r*.42*side,a.y+ny*rail.r*.42*side);c.lineTo(b.x+nx*rail.r*.42*side,b.y+ny*rail.r*.42*side);c.stroke();}c.setLineDash([]);
  for(const p of [a,b]){d.circle(p.x,p.y,Math.max(2,rail.r*.3),'#bc8b43','#f4d99e',1);d.circle(p.x-.6,p.y-.6,.8,'#fff0ca');}if(s.bankFlash>0)d.line(a,b,'#ffe4a9',Math.max(1,rail.r*.4));c.restore();
 }
 for(const p of s.plates)if(p.mode==='standing'){
  if(!p.parents.length){
   const baseY=p.y+p.r>835?906:850,h=Math.max(20,baseY-p.y-p.r),w=Math.min(60,Math.max(22,h*.48));
   prop(d,4,p.x,p.y+p.r+h/2,w,{h});
   d.ellipse(p.x,baseY+2,w*.58,4,'#78503950');
  }else for(const id of p.parents){const parent=s.plates[id];if(parent.mode==='standing')ribbon(d,{x:parent.x,y:parent.y-parent.r+4},{x:p.x,y:p.y+p.r+4});}
  wood(c,p.x,p.y+p.r+5,p.r*2+14,8,'#a37349');
  for(const side of [-1,1])d.circle(p.x+side*(p.r-5),p.y+p.r+5,1.5,'#f8e0ad');
 }
}
function plate(s,d,p){
 if(p.mode==='gone')return;
 const c=d.c,spec=model.rules(s).plates[p.id],standing=p.mode==='standing',root=!p.parents.length;
 const angle=standing?Math.sin(s.t*25+p.id)*s.flash[p.id]*.1:p.angle,face=root?2:[1,4,6][(p.id+s.level)%3];
 c.save();c.globalAlpha=p.alpha;c.shadowColor='#4c2a2748';c.shadowBlur=6;c.shadowOffsetX=2;c.shadowOffsetY=4;c.beginPath();c.arc(p.x,p.y,p.r,0,Math.PI*2);c.fillStyle='#e7cea0';c.fill();c.restore();
 if(s.flash[p.id])d.glow(p.x,p.y,p.r+15,'#f1ce86');
 displayProp(d,face,p.x,p.y,p.r*2,{h:p.r*2,angle,alpha:p.alpha});
 if(standing&&spec.hp===2){
  d.circle(p.x,p.y,p.r-1.5,null,'#8d5c28',2);d.circle(p.x,p.y,p.r-3.5,null,'#ebc984',1);
  for(let i=0;i<2;i++){const x=p.x-8+i*16,y=p.y+p.r+18;d.circle(x,y,4.5,i<p.hp?'#c79544':'#79664c','#f6dc9f',1);if(i<p.hp)d.circle(x-1,y-1,1.2,'#fff1cc');}
 }
}
function statusPanel(c,note){
 paper(c,450,1118,680,66,'#fff1e1c4','#bc965d',10);
 c.save();c.font='600 '+Math.max(22,12*900/(c.canvas.clientWidth||450))+'px Georgia,serif';
 const lines=[];let line='';for(const word of String(note||'').split(/\s+/)){const next=line?(line+' '+word):word;if(line&&c.measureText(next).width>628){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);
 const shown=lines.slice(0,2);if(lines.length>2){let last=shown[1];while(last&&c.measureText(last+'…').width>628)last=last.slice(0,-1);shown[1]=last.trimEnd()+'…';}c.restore();shown.forEach((value,i)=>text(c,value,450,1118+(i-(shown.length-1)/2)*27,22,'#543b35'));
}
function rewardBadge(s,d){
 const prize=s.chapterPrize;
 if(!prize)return;
 const image=d.art['study:'+prize.id+':front'],collected=!!s.prizeKept;
 const revealing=s.rewardReveal?.id===prize.id&&s.rewardReveal.t<=3.65;
 if(revealing)return;
 const x=829,y=174;
 paper(d.c,x,180,110,182,'#fff1e1cc','#bc965d',10);
 text(d.c,'REWARD',x,105,18,'#795535');
 d.glow(x,y,43,collected?'#d6dd9b':'#ebce94');
 if(image)d.sprite(image,x,y,{w:84,h:84,shadow:false});
 else d.item(prize.key,x,y,{w:84,shadow:false});
 text(d.c,collected?'Collected':'Locked',x,246,21,collected?'#46603c':'#795535');
}
function draw(s,d){
 loadArt();const c=d.c,r=model.rules(s);
 crest(d);
 paper(c,450,128,650,66,'#5b2d3599','#d1ad73',10);text(c,'BESS’S PAPER PLATE PARADE',450,114,25,'#fff0ce');text(c,(s.level+1)+' · '+r.name,450,145,21,'#fff0ce');
 paper(c,450,204,640,44,'#fff1dec4','#b48d59',9);text(c,s.remaining+' / '+r.balls+' balls · '+model.collected(s)+' / '+s.plates.length+' plates gathered',450,204,23,'#543b35');
 frame(s,d);
 trough(d,450,931,620,116);
 for(const p of s.plates)plate(s,d,p);
 if(s.phase==='play')for(const [i,p]of model.preview(s).slice(0,r.moving?6:22).entries()){d.circle(p.x,p.y,3.5-i*.06,'#c2925f','#fbe4b4',.7);}
 if(s.ball?.mode==='flight'){const b=s.ball;d.line({x:b.x-b.vx*.018,y:b.y-b.vy*.018},{x:b.x,y:b.y},'#e6c69899',5);prop(d,3,b.x,b.y,b.r*2,{h:b.r*2,angle:b.spin});}
 trough(d,450,931,620,116,true);
 c.save();c.strokeStyle='#62313b';c.lineWidth=12;c.beginPath();c.ellipse(450,921,300,11,0,0,Math.PI);c.stroke();c.strokeStyle='#e0bd81';c.lineWidth=3;c.stroke();c.strokeStyle='#f8e0ad';c.lineWidth=1;c.setLineDash([4,6]);c.beginPath();c.ellipse(450,923,297,10,0,0,Math.PI);c.stroke();c.restore();
 if(s.phase==='play')prop(d,3,model.ORIGIN.x,model.ORIGIN.y,36,{h:36});
 paper(c,450,983,620,42,'#f7e8ccf2','#bc955e',8);text(c,'CLOTH BALLS',258,983,20,'#6a4734');for(let i=0;i<r.balls;i++)prop(d,3,365+i*Math.min(45,240/Math.max(1,r.balls-1)),983,25,{h:25,alpha:i<s.remaining?1:.18});text(c,(model.aimValue(s)>0?'+':'')+model.aimValue(s)+'°',688,983,22,'#6a4734');
 paper(c,150,1031,110,48,'#f4e5c9','#ac8651',8);text(c,'↶ UNDO',150,1031,22,'#6b4738');
 paper(c,550,1031,340,48,s.phase==='play'?'#73404a':'#927b67','#d4b174',8);text(c,s.phase==='play'?'TOSS CLOTH BALL':'LET THE PLATES FALL',550,1031,22,'#fff0ce');
 statusPanel(c,s.throws===0&&s.phase==='play'?'Aim, then toss. Open How to play for the full guide.':s.note);
 rewardBadge(s,d);
}
function upgradeBessBook(book){
 if(!book)return null;
 if(book.chapterOrder===model.ORDER_TAG)return book;
 if(book.chapterOrder!==undefined)throw Error('This saved chapter order needs attention; it has not been reset.');
 const fail=()=>{throw Error('Saved Bess chapters need attention; they have not been reset.');};
 let source=book;
 if(book.v===1){
  if(typeof book.collected!=='boolean'||!Number.isSafeInteger(book.banked)||book.banked<0||!book.snapshot)fail();
  source={v:2,selected:0,chapters:{0:book.snapshot},collected:[book.collected,false,false,false,false,false],banked:[book.banked,0,0,0,0,0]};
 }
 if(source.v!==2||!source.chapters||!Number.isInteger(source.selected)||source.selected<0||source.selected>5||![source.collected,source.banked].every(a=>Array.isArray(a)&&a.length===6)||source.collected.some(v=>typeof v!=='boolean')||source.banked.some(v=>!Number.isSafeInteger(v)||v<0))fail();
 const next={...source,chapterOrder:model.ORDER_TAG,selected:model.OLD_TO_NEW[source.selected],chapters:{},collected:source.collected.slice(),banked:model.NEW_TO_OLD.map(old=>source.banked[old])};
 function receipts(s){
  // Ownership stays with its NFT; only the physical challenge changes its chapter.
  s.prizeKept=next.collected[s.level];s.chapterPrize=null;delete s.prizeId;
  if(s.history)s.history.forEach(receipts);
 }
 for(const [key,blob]of Object.entries(source.chapters)){
  const old=Number(key);if(!Number.isInteger(old)||old<0||old>5||blob.level!==old)fail();
  const moved=model.reorderState(blob);receipts(moved);next.chapters[moved.level]=moved;
 }
 return next;
}
const instructions='Aim by tapping or dragging inside the stage, then press Toss cloth ball or Space. The opening demonstration plays the original easy four-plate stand from both throws through all landings and the sample reward. Chapter1 now starts with Three paper stands; Chapters2–5 progress through taller towers, shared ribbon supports, double-pinned plates and the grand curtain. Chapter6 is The bank-shot curtain: TEN linked plates, THREE cloth balls, a large front STAR screening the rear and a visible angled left bank cushion. Read the shot order; both cloth balls and falling plates physically rebound from the cushion. The short dotted guide shows only the start of that final flight. Reinforced supports have two visible pins; a cloth ball or a falling plate can remove a pin. Every plate must physically land in the padded trough before a chapter finishes. Remaining plates and pin damage stay between throws. Undo rewinds the whole last throw, including bounces and falling plates; Help pauses. Retry is free in this local preview and preserves collected ownership. Existing progress and saved motion move with their challenges; already-collected rewards stay owned. Rewards follow the current chapter positions, from Prize claim in Chapter1 to Button elephant in Chapter6. Pennies and chapter rewards are previews.';
const engine=study({id:'ball-toss',mode:'plate-play',title:'Bess’s Paper Plate Parade',model,draw,upgradeBook:upgradeBessBook,bookMetadata:{chapterOrder:model.ORDER_TAG},intro:'A cloth ball, a little paper stand, and a whole curtain of tumbling plates. Choose the support that starts the best fall.',instructions,keys:'Tap/drag aim · Arrows adjust · Space toss · U undo',
 tap(s,p){if(p.y>1000&&p.y<1065&&p.x>365){model.shoot(s);return;}if(p.y>330&&p.y<885)model.setAim(s,model.angleAt(p));},
 key(s,k){if(k===' '||k==='Enter')model.shoot(s);if(k==='ArrowLeft')model.setAim(s,s.aim-1);if(k==='ArrowRight')model.setAim(s,s.aim+1);},
});
const pointer=engine.pointer;engine.pointer=(s,type,p)=>{if(type==='cancel'){model.endAim(s,false);pointer(s,type,p);return;}if(s.saveError||s.result||s.phase==='celebrate')return;if(type==='down'&&s.phase==='play'&&p.y>330&&p.y<885&&p.x>155&&p.x<745){model.beginAim(s,p);return;}if(s.aimDrag){if(type==='move')model.moveAim(s,p);if(type==='up'){model.moveAim(s,p);model.endAim(s,true);try{engine.persist(s);}catch{}}return;}pointer(s,type,p);};
const release=engine.releaseInput;engine.releaseInput=s=>{model.endAim(s,false);release(s);};
engine.instructions=instructions;engine.reviewCopy.cost='Free local six-chapter test. No real purse, tokens or NFT collection.';engine.reviewCopy.keys='Tap/drag aim · Arrows adjust · Space toss · U undo · Help pauses';engine.artReady=()=>art.length===6&&art.every(Boolean);
const create=engine.create;engine.create=level=>{loadArt();return create(level);};
const exampleModel={
 ...model,
 makeState:()=>model.makeSampleState(),
 step(s,dt){
  if(s.demoRewardAge!==undefined){s.demoRewardAge+=dt;return;}
  model.step(s,dt);
  if(s.phase==='celebrate'){
   // The actual easy board has cleared. Only this disposable presentation continues.
   s.phase='demo-finish';s.demoRewardAge=0;s.pendingPennies=0;
   s.note='All four plates reached the padded trough. This is a demonstration only.';
  }
 },
};
function drawFullExample(s,d){
 draw(s,d);
 if(s.demoRewardAge===undefined)return;
 const c=d.c,prize=engine.prizes[0],t=s.demoRewardAge,views=['front','right','back','left'],turn=Math.max(0,t-.35)/3*4,i=Math.floor(turn)%4,mix=turn-Math.floor(turn);
 paper(c,450,580,560,440,'#fff1dff7','#b78f4f',22);
 text(c,'DEMONSTRATION COMPLETE',450,402,29,'#64443c');
 text(c,'All four plates gathered',450,446,25,'#755446');
 d.glow(450,590,136,'#ebc47d');
 const a=d.art['study:'+prize+':'+views[i]],b=d.art['study:'+prize+':'+views[(i+1)%4]];
 if(a)d.sprite(a,450,586,{w:230,alpha:1-mix,shadow:false});
 if(b)d.sprite(b,450,586,{w:230,alpha:mix,shadow:false});
 text(c,'Sample chapter reward',450,723,24,'#715044');
 text(c,'No reward or pennies collected',450,763,21,'#866650');
}
export default withChapterExample(engine,{model:exampleModel,draw:drawFullExample,steps:()=>[
 {caption:'This easy stand is a complete demonstration. Aim at the lower STAR supporting the left pair.',point:{x:305,y:720},run:s=>model.setAim(s,-34),after:.75},
 {caption:'Toss the cloth ball. Watch the support fall, then wait for BOTH plates to land in the trough.',point:{x:550,y:1031},run:s=>model.shoot(s),done:s=>!s.motion,after:1},
 {caption:'The left pair is home. Aim at the lower STAR on the right to bring down the remaining pair.',point:{x:595,y:720},run:s=>model.setAim(s,34),after:.75},
 {caption:'Toss again. The chapter finishes only when the last plate has physically landed.',point:{x:550,y:1031},run:s=>model.shoot(s),done:s=>model.complete(s)&&!s.motion,after:.2},
 {caption:'The whole demonstration is finished: both throws, all four landings, then the sample reward.',point:{x:450,y:586},run:()=>{},done:s=>s.demoRewardAge>=4.2,after:.2},
],finishCaption:'That was the complete easy demonstration. Play Chapter 1, then work up to the three-ball bank-shot finale in Chapter 6.'});
