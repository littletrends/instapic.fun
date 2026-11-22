/** Digby — Pocket Heist. Local test variant; original curios.js stays intact. */
import {kits,spriteKey,itemName} from '../prizes.js?v=nft-art-1';
import {alleyPlay} from '../wallet.js?v=insights-1';
import {bindPrize,takePrize} from '../chapter-kit.js?v=align-1';
import {FIELD,LEVELS,rules,coversFor,coverPosition,keysFor,padsFor,lampsFor,vaultFor,lampAngle,lampActive,vaultOpen,requirementsMet,coverAt,visible,makeState,walkTo,walkToCover,stop,cancel,control,step,snapshot,restore} from './curios-heist-model.js?v=heist-six-2';
const PRIZES=kits.curios.prizes,ROOT=new URL('../assets/digby-heist/',import.meta.url);
const names=['01-straight-track-disc.png','02-curved-track-disc.png','03-clockwork-beetle.png','04-leaf-winding-key.png','05-glass-display-dome.png','06-rotating-track-disc.png'];
const art=[];let artStarted=false,lightCanvas=null,selected=0;
const remembered=new Map(),collected=Array(6).fill(false);
const params=typeof location==='undefined'?new URLSearchParams():new URLSearchParams(location.search);
const review=typeof location!=='undefined'&&['127.0.0.1','localhost'].includes(location.hostname)&&params.get('review')==='pocket-heist';
const player=/^[a-zA-Z0-9_-]{1,48}$/.test(params.get('reviewPlayer')||'')?params.get('reviewPlayer'):'local';
const BOOK='pf.review.digbyHeist.v2:'+player;
if(review){
 const raw=localStorage.getItem(BOOK),legacy=raw?null:localStorage.getItem('pf.review.digbyHeist.v1:'+player);
 if(raw){
  const book=JSON.parse(raw);
  if(book.v!==2||!book.chapters||!Array.isArray(book.collected)||book.collected.length!==6||book.collected.some(v=>typeof v!=='boolean')||!Number.isInteger(book.selected)||!LEVELS[book.selected])throw Error('Saved heist needs attention.');
  for(const [key,blob] of Object.entries(book.chapters))remembered.set(Number(key),snapshot(restore(blob,Number(key))));
  collected.splice(0,6,...book.collected);selected=book.selected;
 }else if(legacy){
  const book=JSON.parse(legacy);if(book.v!==1||typeof book.rewardCollected!=='boolean')throw Error('Saved heist needs attention.');
  remembered.set(0,snapshot(restore(book.snapshot,0)));collected[0]=book.rewardCollected;
 }
}
const VIEWS=['front','right','back','left'];
const rewardImages=Object.fromEntries(PRIZES.flatMap(id=>VIEWS.map(view=>[`nft:${id}:${view}`,new URL(`../../assets/restyle/game-sprites/${spriteKey(id)}/${view}.webp`,import.meta.url).href])));
function loadArt(){
 if(artStarted||typeof Image==='undefined')return;artStarted=true;
 names.forEach((name,i)=>{
  const image=new Image();image.onload=()=>{
   const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
   const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
   const data=ctx.getImageData(0,0,c.width,c.height),p=data.data;
   // The supplied cyan matte also fills the enclosed glass; clear it for true cover.
   for(let j=0;j<p.length;j+=4)if(p[j+1]>160&&p[j+2]>160&&p[j+1]-p[j]>50&&p[j+2]-p[j]>50)p[j+3]*=Math.max(0,Math.min(1,(p[j]-40)/120));
   ctx.putImageData(data,0,0);art[i]=c;
  };image.src=new URL(name,ROOT).href;
 });
}
function panel(c,x,y,w,h,fill='#123e38eb',stroke='#dab978'){
  c.beginPath();c.roundRect(x-w/2,y-h/2,w,h,22);c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=2;c.stroke();
}
function label(c,text,x,y,size=22,color='#fff2d4'){
  const readable=Math.max(size,12*900/(c.canvas.clientWidth||450));
  c.font=`600 ${readable}px Georgia,serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(text,x,y);
}
function nftReveal(s,d,reduced){
 const reveal=s.rewardReveal;if(!reveal||reveal.t>3.6)return;
 const c=d.c,t=reveal.t,u=Math.min(1,Math.max(0,(t-2.9)/.7)),e=u*u*(3-2*u);
 const x=450+(805-450)*e,y=535+(80-535)*e,w=300*(1-e)+40*e;
 if(u===0){panel(c,450,520,620,470,'#103b35f5');label(c,'NFT REWARD · COLLECTED',450,340,29,'#ffe3a0');label(c,itemName(reveal.id),450,725,26);}
 d.glow(x,y,w*.65,'#ffe8a4');
 const turn=reduced?0:Math.min(1,Math.max(0,(t-.3)/2.4))*4;
 const i=Math.floor(turn)%4,j=(i+1)%4,mix=turn-Math.floor(turn);
 const a=d.art?.[`nft:${reveal.id}:${VIEWS[i]}`],b=d.art?.[`nft:${reveal.id}:${VIEWS[j]}`];
 if(a){d.sprite(a,x,y,{w,shadow:false,alpha:1-mix});if(b&&mix)d.sprite(b,x,y,{w,shadow:false,alpha:mix});}
 else d.item(spriteKey(reveal.id),x,y,{w,shadow:false});
}



function sprite(d,index,x,y,w,opts={}){return art[index]?d.sprite(art[index],x,y,{w,shadow:false,...opts}):false;}
function persist(s){
 if(!s||alleyPlay)return;remembered.set(s.level,snapshot(s));selected=s.level;
 if(review){try{localStorage.setItem(BOOK,JSON.stringify({v:2,selected,chapters:Object.fromEntries(remembered),collected}));s.saveError=false;}
 catch(error){s.saveError=true;s.note='Preview save unavailable. Keep this window open.';throw error;}}
}
function checkpoint(s){try{persist(s);return true;}catch{return false;}}
function sendTo(s,p){
 const key=keysFor(s).find((k,i)=>!s.keys[i]&&Math.hypot(p.x-k.x,p.y-k.y)<43);
 if(key)return walkTo(s,key);
 const pad=padsFor(s).find(k=>Math.hypot(p.x-k.x,p.y-k.y)<45);
 if(pad)return walkTo(s,pad);
 const dome=coversFor(s).findIndex(c=>Math.abs(p.x-c.x)<64&&p.y>c.y-144&&p.y<c.y+32);
 return dome>=0?walkToCover(s,dome):walkTo(s,p);
}
function drawLights(s,d){
 if(!lightCanvas){lightCanvas=document.createElement('canvas');lightCanvas.width=900;lightCanvas.height=1200;}
 const c=lightCanvas.getContext('2d');
 for(const lamp of lampsFor(s)){
  if(!lampActive(lamp,s.t))continue;
  c.clearRect(0,0,900,1200);c.save();c.beginPath();c.rect(FIELD.left-15,FIELD.top-25,FIELD.right-FIELD.left+30,FIELD.bottom-FIELD.top+50);c.clip();
  const angle=lampAngle(lamp,s.t),g=c.createRadialGradient(lamp.x,lamp.y,10,lamp.x,lamp.y,lamp.range);
  g.addColorStop(0,'#fff2b97d');g.addColorStop(.65,'#ffe8a54d');g.addColorStop(1,'#ffdc8500');
  c.beginPath();c.moveTo(lamp.x,lamp.y);c.arc(lamp.x,lamp.y,lamp.range,angle-lamp.half,angle+lamp.half);c.closePath();c.fillStyle=g;c.fill();
  c.globalCompositeOperation='destination-out';c.fillStyle='#000';
  for(const cover of coversFor(s)){
   c.beginPath();c.arc(cover.x,cover.y,cover.r,0,Math.PI*2);c.fill();
   const dx=cover.x-lamp.x,dy=cover.y-lamp.y,dist=Math.hypot(dx,dy),a=Math.atan2(dy,dx),spread=Math.asin(cover.r/dist),near=Math.sqrt(dist*dist-cover.r*cover.r),far=lamp.range+200;
   c.beginPath();for(const [i,r] of [[a-spread,near],[a-spread,far],[a+spread,far],[a+spread,near]]){const x=lamp.x+Math.cos(i)*r,y=lamp.y+Math.sin(i)*r;c.lineTo(x,y);}c.closePath();c.fill();
  }
  c.restore();d.c.drawImage(lightCanvas,0,0);
 }
}
function draw(s,d){
 loadArt();const c=d.c,reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches,b=s.beetle,covered=coverAt(b,s),lit=visible(s),keyCount=s.keys.filter(Boolean).length;
 const sky=rules(s),covers=coversFor(s),keys=keysFor(s),pads=padsFor(s),VAULT=vaultFor(s),ready=requirementsMet(s),open=vaultOpen(s);
 ;;;
 panel(c,450,610,615,785,'#152f27d9','#9f8855');
 // Small brass inlays give the floor a tabletop scale without hiding the beams.
 for(let x=215;x<710;x+=70)for(let y=300;y<960;y+=70)d.circle(x,y,1.5,'#9fa58135');
 for(let i=0;i<covers.length;i++){
  const p=covers[i],base=sky.covers[i];
  if(base.ax||base.ay){c.save();c.setLineDash([4,8]);d.ellipse(base.x,base.y,base.ax||3,base.ay||3,null,'#c6d7ac99',2);c.restore();}
  sprite(d,[0,1,5,0][i],p.x,p.y,143,{alpha:.72});
  d.circle(p.x,p.y,p.r,null,i===s.safe?'#eed99b':'#87ad98',i===s.safe?3:1.5);
 }
 drawLights(s,d);
 // The exit uses the door already painted into Digby's room.
 d.glow(VAULT.x,VAULT.y,70,ready&&open?'#b9edbb':'#edd09a');
 panel(c,VAULT.x,VAULT.y,140,102,'#1c372fee',ready&&open?'#b9edbb':'#c5a96c');
 d.circle(VAULT.x,VAULT.y-10,13,ready&&open?'#d6f6c0':'#e6c27c');
 d.poly([[VAULT.x-6,VAULT.y-6],[VAULT.x+6,VAULT.y-6],[VAULT.x+12,VAULT.y+26],[VAULT.x-12,VAULT.y+26]],ready&&open?'#d6f6c0':'#e6c27c',null);
 if(VAULT.period)d.arc(VAULT.x,VAULT.y,76,-Math.PI/2,-Math.PI/2+Math.PI*2*(s.t%VAULT.period)/VAULT.period,open?'#b9edbb':'#e1b58b',3);
 label(c,ready?(open?'ENTER':'WAIT'):VAULT.period?(open?'OPEN':'CLOSED'):'VAULT',VAULT.x,VAULT.y+72,20);
 for(let i=0;i<keys.length;i++)if(!s.keys[i]){
  const p=keys[i];d.glow(p.x,p.y,39,'#ead08c');sprite(d,3,p.x,p.y,54,{angle:reduced?0:Math.sin(s.t*1.1+i)*.08});
  ;label(c,String(i+1),p.x+38,p.y+24,19,'#ffe8b3');
 }
 for(let i=0;i<pads.length;i++){
  const p=pads[i];sprite(d,5,p.x,p.y,88,{angle:s.pads[i]?0:Math.PI*2*s.padWind[i],alpha:s.pads[i]?1:.75});
  d.circle(p.x,p.y,45,null,s.pads[i]?'#cde8a4':'#e4c185',2);
  if(s.padWind[i]>0)d.arc(p.x,p.y,48,-Math.PI/2,-Math.PI/2+Math.PI*2*s.padWind[i],'#e8d997',5);
  if(s.padFlash?.id===i)d.glow(p.x,p.y,65,'#d5efaf');
  const captionX=p.x-(i===0?30:0);
  ;label(c,s.pads[i]?'Wound':`Wind ${i+1}`,captionX,p.y+61,19);
 }
 if(s.target&&s.phase==='play'){
  c.save();c.setLineDash([3,9]);d.line(b,s.target,'#d6e7d16b',2);c.restore();d.circle(s.target.x,s.target.y,14,null,'#e9e8bb',2);
 }
 for(let i=0;i<s.trail.length;i++){const p=s.trail[i];d.circle(p.x,p.y,1+(i/s.trail.length)*2,'#e2d9ac32');}
 d.ellipse(b.x,b.y+20,31,12,'#071e1bab');
 if(lit&&s.phase==='play'&&s.grace<=0)d.circle(b.x,b.y,47,null,'#efb17a',3);
 const w=74+(!reduced&&s.target?Math.sin(b.walk*.22)*1.8:0);
 const paintBeetle=()=>sprite(d,2,b.x,b.y-25,w,{angle:b.angle,alpha:(s.phase==='recover')? .65:1});
 if(covered<0)paintBeetle();
 for(let i=0;i<covers.length;i++){
  const p=covers[i];sprite(d,4,p.x,p.y-58,132,{alpha:(covered===i)? .48:.94});
  ;;
 }
 // A cutaway view keeps the tiny player readable while sheltering inside glass.
 if(covered>=0){d.glow(b.x,b.y-25,49,'#bfdea4');paintBeetle();}
 for(const lamp of lampsFor(s)){
  const a=lampAngle(lamp,s.t),active=lampActive(lamp,s.t);d.circle(lamp.x,lamp.y,28,'#294338',active?'#cfb276':'#8bb6a4',4);d.circle(lamp.x,lamp.y,16,active?'#e5cb91':'#4e7e6c');
  d.line({x:lamp.x+Math.cos(a)*12,y:lamp.y+Math.sin(a)*12},{x:lamp.x+Math.cos(a)*36,y:lamp.y+Math.sin(a)*36},active?'#fce5ad':'#69927b',8);
 }
 for(const p of s.pickups){const u=Math.min(1,p.t/.85),e=u*u*(3-2*u);sprite(d,3,p.x+(690-p.x)*e,p.y+(1030-p.y)*e,54*(1-u*.3),{alpha:1-u*.5,angle:u*2});}
 const winding=pads.findIndex((p,i)=>!s.pads[i]&&Math.hypot(b.x-p.x,b.y-p.y)<28&&!s.target);
 const status=s.phase==='recover'?'Spotted — returning safely':s.phase==='celebrate'?'The vault is open!':lit&&s.grace<=0?'IN THE LIGHT — MOVE!':winding>=0?`Winding plate ${winding+1} · ${Math.round(s.padWind[winding]*100)}%`:covered>=0?'Hidden under glass':'Watch the sweep. Stay in shadow.';
 const plateCount=pads.length?` · ${s.pads.filter(Boolean).length}/${pads.length} plates`:'';
 ;label(c,`${keyCount}/${keys.length} keys${plateCount} · ${s.spotted} returns`,450,1019,26);
 ;
 panel(c,450,1086,570,10,'#0e221df0','#8a9a74');
 if(s.exposure>0){c.fillStyle='#e5a47a';c.fillRect(170,1083,560*s.exposure,6);}
 const tip=pads.some((_,i)=>!s.pads[i])?'Stop on each winding plate.':VAULT.period?'Enter while the vault is open.':'Find keys, then enter the vault.';
 ;;
 panel(c,700,1150,150,52,'#3d4936f5');label(c,'STOP',700,1150,25);
 nftReveal(s,d,reduced);
 if(s.saveError){panel(c,450,600,690,150,'#623c38f2');label(c,'Preview saving paused. Keep this window open.',450,600,24);}
}
export {draw as drawHeist, sendTo as aimHeist};
export const heistArtReady = () => art.length === names.length && art.every(Boolean);

export default {
 title:'Digby’s Pocket Heist',chapterEnds:true,
 intro:'Six tabletop vaults for one tiny clockwork beetle. Slip through the shadows and bring Digby’s winding keys home.',
 instructions:'Tap the floor to walk, tap glass to shelter inside, or drag to steer. Arrows/WASD also move. Space or STOP brakes. Domes block spotlights and set your return point. Found keys and wound plates stay collected after a catch. Gather every leaf winding key and reach the top vault. From Chapter 3, stop on each round winding plate until its ring fills; partial winding is saved. Later domes move: tap to follow one, and stay still inside to ride it. Some watchlights go dark briefly. The final vaults open in timed windows: watch the door’s OPEN/CLOSED ring. Each chapter saves separately. This local test uses NFT previews and no real purse or token changes.',
 levels:LEVELS.map(sky=>sky.name),prizes:PRIZES,sprites:PRIZES,images:rewardImages,houseSeconds:100,
 navigationKey:BOOK+'.selection',selectedChapter:()=>selected,
 reviewCopy:{keys:'Tap floor or drag to steer · tap glass to shelter · arrows/WASD move · Space/STOP brakes · stop on plates to wind · H for help · Esc to pause.',cost:'Test play is free. Each chapter saves in this browser.',treasure:(s,level)=>`Chapter reward: ${itemName(PRIZES[level])} · ${collected[level]||s?.prizeKept?'Collected':'Locked until you open the vault.'}`},
 houseTitle:'The vault rests',houseDetail:'Your winding keys and safe dome are saved for your next try.',
 create(level){
  if(alleyPlay)throw Error('Pocket Heist is a local test variant.');if(!LEVELS[level])throw Error('Choose a chapter from 1 to 6.');loadArt();selected=level;
  const s=remembered.has(level)?restore(remembered.get(level),level):makeState(level);s.practice=true;
  bindPrize(s,PRIZES[level],{x:450,y:265,w:90,field:true});
  if(collected[level]){s.prizeKept=true;s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;}return s;
 },
 persist,retryAttempt(s){
  const next=s.phase==='result'&&s.result?.won?makeState(s.level):snapshot(s);next.result=null;next.houseLeft=100;next.practice=true;
  if(next.phase==='result')next.phase=next.resumePhase||'play';delete next.resumePhase;stop(next);checkpoint(next);
 },
 clockRuns:s=>s.started&&!s.result&&!s.saveError&&['play','recover'].includes(s.phase),
 onTimeout(s){s.resumePhase=s.phase;stop(s);s.phase='result';s.result={title:'The vault rests',detail:`${s.keys.filter(Boolean).length} keys found. Your keys, winding plates and safe dome are waiting here.`,won:false,prize:null,settle:true};checkpoint(s);},
 update(s,dt){
  if(s.result||s.saveError)return;step(s,dt);
  if(s.phase==='celebrate'){
   if(!s.completionRecorded){s.completionRecorded=true;
    if(!collected[s.level]){collected[s.level]=true;takePrize(s,PRIZES[s.level],{x:450,y:265});s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;s.rewardReveal={id:PRIZES[s.level],t:0};s.celebrateLeft=3.9;}
    if(!checkpoint(s))return;
   }
   if(s.rewardReveal)s.rewardReveal.t+=dt;
   if(s.celebrateLeft<=0){s.phase='result';s.result={title:rules(s).name,detail:`${s.keys.length} keys, ${s.pads.length} winding plates, one open vault. ${s.spotted} safe returns. NFT preview: Collected.`,won:true,prize:null,settle:true};checkpoint(s);}
  }
 },
 pointer(s,type,p){
  if(type==='cancel'){cancel(s);return;}if(s.result||s.saveError)return;
  if(type==='down'&&p.y>1110&&p.x>620){stop(s);checkpoint(s);return;}
  if(type==='down'&&p.y>=FIELD.top&&p.y<=FIELD.bottom&&p.x>=FIELD.left-20&&p.x<=FIELD.right+20){if(sendTo(s,p))s.held=true;}
  if(type==='move'&&s.held)sendTo(s,p);
  if(type==='up'){s.held=false;checkpoint(s);}
 },
 key(s,key,down){if(s.result||s.saveError)return;if(key===' '&&down){stop(s);checkpoint(s);}else control(s,key,down);},
 draw,readout:s=>s.note,
};
