/** Rosalie — Heart on the Breeze. Local test; original love.js stays intact. */
import {kits,spriteKey,itemName} from '../prizes.js?v=nft-art-1';
import {paintChapterReward} from './study-kit.js?v=studies-six-1';
import {alleyPlay,isVerifiedPlay,owned,keep} from '../wallet.js?v=insights-1';
import {bindPrize,takePrize} from '../chapter-kit.js?v=align-1';
import {FIELD,FAN_FIELD,START,LEVELS,rules,rosettesFor,gatesFor,basketFor,crosswind,gateOpen,gateSafeY,gateCleared,HEART_WIDTH,blowing,airflow,makeState,moveFan,setFan,cancel,key,step,snapshot,restore} from './love-breeze-model.js?v=breeze-six-1';
const PRIZES=kits.love.prizes,ROOT=new URL('../assets/rosalie-breeze/',import.meta.url);
const names=['01-heart-pendant.png','02-rose-heart-basket.png','03-heart-ribbon-rosette.png','04-pink-folding-fan.png','05-open-heart-gates.png','06-closed-heart-gates.png'];
const art=[];let artStarted=false,selected=0;
const remembered=new Map(),collected=Array(6).fill(false);
const params=typeof location==='undefined'?new URLSearchParams():new URLSearchParams(location.search);
const review=typeof location!=='undefined'&&['127.0.0.1','localhost'].includes(location.hostname)&&params.get('review')==='heart-breeze';
const player=/^[a-zA-Z0-9_-]{1,48}$/.test(params.get('reviewPlayer')||'')?params.get('reviewPlayer'):'local';
const BOOK='pf.review.rosalieBreeze.v2:'+player;
if(review){
 const raw=localStorage.getItem(BOOK),legacy=raw?null:localStorage.getItem('pf.review.rosalieBreeze.v1:'+player);
 if(raw){
  const book=JSON.parse(raw);
  if(book.v!==2||!book.chapters||!Array.isArray(book.collected)||book.collected.length!==6||book.collected.some(v=>typeof v!=='boolean')||!Number.isInteger(book.selected)||!LEVELS[book.selected])throw Error('Saved breeze needs attention.');
  for(const [key,blob] of Object.entries(book.chapters))remembered.set(Number(key),snapshot(restore(blob,Number(key))));
  collected.splice(0,6,...book.collected);selected=book.selected;
 }else if(legacy){
  const book=JSON.parse(legacy);if(book.v!==1||typeof book.rewardCollected!=='boolean')throw Error('Saved breeze needs attention.');
  remembered.set(0,snapshot(restore(book.snapshot,0)));collected[0]=book.rewardCollected;
 }
}
const VIEWS=['front','right','back','left'];
const rewardImages=Object.fromEntries(PRIZES.flatMap(id=>VIEWS.map(view=>[`nft:${id}:${view}`,new URL(`../../assets/restyle/game-sprites/${spriteKey(id)}/${view}.webp`,import.meta.url).href])));
for(const id of PRIZES)rewardImages['study:'+id+':front']=rewardImages['nft:'+id+':front'];
function loadArt(){
 if(artStarted||typeof Image==='undefined')return;artStarted=true;
 names.forEach((name,i)=>{
  const image=new Image();image.onload=()=>{
   const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
   const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
   const data=ctx.getImageData(0,0,c.width,c.height),p=data.data;
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
  c.font=`600 ${readable}px Georgia,serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(text,x,y,Math.max(90,Math.min(850,2*Math.min(x,900-x)-24)));
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
function productionPlay(){const verified=isVerifiedPlay();if(alleyPlay&&!verified)throw Error('Verified play is required.');return verified;}
function replayState(s,production){if(production&&owned(PRIZES[s.level])){bindPrize(s,PRIZES[s.level]);s.prizeKept=true;s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;}return s;}
function persist(s){
 const production=productionPlay();if(!s||production)return;remembered.set(s.level,snapshot(s));selected=s.level;
 if(review){try{localStorage.setItem(BOOK,JSON.stringify({v:2,selected,chapters:Object.fromEntries(remembered),collected}));s.saveError=false;}
 catch(error){s.saveError=true;s.note='Preview save unavailable. Keep this window open.';throw error;}}
}
function checkpoint(s){try{persist(s);return true;}catch{return false;}}
function gateArt(d,g,open){
 const image=art[open?4:5],c=d.c;if(!image)return;
 const w=150,h=w*image.height/image.width,y=g.y-58;
 if(!open){d.sprite(image,g.x,y,{w,shadow:false});return;}
 // Fold both halves outwards so the visible opening matches the usable air lane.
 c.drawImage(image,0,0,image.width/2,image.height,g.x-w/2-g.gap/2,y-h/2,w/2,h);
 c.drawImage(image,image.width/2,0,image.width/2,image.height,g.x+g.gap/2,y-h/2,w/2,h);
}
function basketFront(d,BASKET){
 const image=art[1];if(!image)return;
 const w=155,h=w*image.height/image.width,cut=image.height*.54;
 d.c.drawImage(image,0,cut,image.width,image.height-cut,BASKET.x-w/2,BASKET.y-h/2+h*.54,w,h*.46);
}
function gateSafety(d,s,g,i){
 const c=d.c,y=gateSafeY(g),clear=s.passed[i]&&gateCleared(g,s.heart);
 const color=clear?'#b6f5d1':'#ffe5b2';
 c.save();c.setLineDash([10,7]);d.line({x:g.x-100,y},{x:g.x+100,y},color,3);c.restore();
 // Arrows point to the safe side. This marker is exactly the snap boundary.
 for(const x of [g.x-100,g.x+100]){d.line({x,y:y+7},{x,y:y-13},color,3);d.line({x:x-6,y:y-7},{x,y:y-13},color,3);d.line({x:x+6,y:y-7},{x,y:y-13},color,3);}
 panel(c,630,y,156,36,clear?'#234f43f5':'#713e50ee',color);
 label(c,`${i+1} · ${clear?'CLEAR ✓':'SAFE ↑'}`,630,y,21,color);
}
function draw(s,d){
 loadArt();const sky=rules(s),ROSETTES=rosettesFor(s),GATES=gatesFor(s),BASKET=basketFor(s),wind=crosswind(s);
 const c=d.c,reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches,h=s.heart,f=s.fan,air=airflow(s),on=blowing(s),count=s.rosettes.filter(Boolean).length;
 panel(c,450,118,640,66,'#713e509e','#dab97860');label(c,'ROSALIE’S HEART ON THE BREEZE',450,104,26);label(c,`${s.level+1} · ${sky.name}`,450,136,21,'#f2dfb6');
 const mist=c.createLinearGradient(0,220,0,1000);mist.addColorStop(0,'#fff7e81c');mist.addColorStop(1,'#fff7e805');
 if(!reduced)for(let i=0;i<14;i++){const x=220+(i*83%460),y=260+((i*127+s.t*7)%700);d.star(x,y,2.5,'#fff0cf88');}
 d.ellipse(START.x,START.y+18,53,15,'#955a6855','#efc5a0',2);
 for(let i=0;i<GATES.length;i++){
  const g=GATES[i],open=gateOpen(g,s.t),left=g.x-g.gap/2,right=g.x+g.gap/2;
  for(const [a,b] of [[FIELD.left-5,left],[right,FIELD.right+5]]){
   d.line({x:a,y:g.y},{x:b,y:g.y},'#c58b6a',9);d.line({x:a,y:g.y},{x:b,y:g.y},'#f3caac',3);
   for(let x=a+15;x<b-10;x+=42)d.heart(x,g.y,7,'#b65c72');
  }
  if(sky.gates[i].ax){const base=sky.gates[i];d.line({x:base.x-base.ax,y:g.y-115},{x:base.x+base.ax,y:g.y-115},'#f4d4a199',2);d.circle(g.x,g.y-115,4,'#ffe9bd');}
  if(open)d.glow(g.x,g.y,65,'#ffe6c0');
  if(s.gateFlash?.id===i)d.glow(g.x,g.y,95,'#f0d0aa');
 }
 if(sky.wind&&!reduced){for(let i=0;i<6;i++){const y=365+i*82,x=260+((i*77+s.t*wind*.65)%350+350)%350;d.line({x,y},{x:x+wind*1.4,y},'#fff1dd77',2);}}
 sprite(d,1,BASKET.x,BASKET.y,155);
 panel(c,300,236,190,35,'#713e50ee');label(c,'ROSE BASKET',300,236,21,'#ffeac7');d.line({x:400,y:236},{x:420,y:236},'#f3ddb0',2);
 const next=s.rosettes.indexOf(false);
 for(let i=0;i<ROSETTES.length;i++){
  const p=ROSETTES[i],active=i===next;
  if(active||s.rosettes[i])d.glow(p.x,p.y,50,active?'#ffdfa9':'#f4d4a1');
  sprite(d,2,p.x,p.y,64,{alpha:s.rosettes[i]? .55:active?1:.7});
  if(s.rosettes[i])d.circle(p.x,p.y,37,null,'#f3d6a7',2);
  panel(c,p.x+44,p.y,32,32,'#713e50ee');label(c,s.rosettes[i]?'✓':String(i+1),p.x+44,p.y,18);
 }
 if(on&&air.strength>0){
  c.save();c.setLineDash([6,10]);c.lineDashOffset=reduced?0:-s.t*45;
  const distance=Math.min(air.distance,250);
  for(const offset of [-13,0,13]){
   const nx=-Math.sin(air.angle),ny=Math.cos(air.angle),from={x:f.x+nx*offset,y:f.y+ny*offset},to={x:f.x+Math.cos(air.angle)*distance+nx*offset,y:f.y+Math.sin(air.angle)*distance+ny*offset};
   d.line(from,to,'#fff3d899',2);
  }c.restore();d.glow(f.x,f.y,55,'#ffdfba');
 }
 for(let i=0;i<s.trail.length;i++){const p=s.trail[i],u=(i+1)/s.trail.length;d.circle(p.x,p.y,1+u*3,`rgba(255,229,203,${u*.55})`);}
 const landing=s.phase==='landing'?Math.min(1,s.landing.t/BASKET.landingSeconds):s.phase==='celebrate'||s.result?.won?1:0;
 const failed=s.phase==='failed'?Math.min(1,s.failure.t/1.05):0;
 c.save();c.beginPath();c.rect(180,174,540,834);c.clip();
 d.ellipse(h.x,h.y+29,27*(1-landing*.4),9,'#8f425b35');
 d.glow(h.x,h.y,46,s.resting?'#ffe1b5':'#f9d9bf');
 sprite(d,0,h.x,h.y,HEART_WIDTH*(1-landing*.36)*(1-failed*.65),{angle:h.angle,alpha:failed?1-failed:s.phase==='return'? .75:1});
 c.restore();
 // Gate leaves and the basket lip sit in front of the floating pendant.
 for(let i=0;i<GATES.length;i++){
  const g=GATES[i],open=gateOpen(g,s.t);gateArt(d,g,open);
  panel(c,275,g.y+49,142,36,'#713e50ee',open?'#f3ddb0':'#d9b0a2');label(c,`${i+1} · ${open?'OPEN':'CLOSED'}`,275,g.y+49,21);
 }
 basketFront(d,BASKET);
 for(let i=0;i<GATES.length;i++)gateSafety(d,s,GATES[i],i);
 sprite(d,3,f.x,f.y,105,{angle:f.angle,alpha:on?1:.8});
 for(const p of s.sparks)for(let i=0;i<8;i++){const a=i*Math.PI/4,u=p.t/1.2;d.star(p.x+Math.cos(a)*u*65,p.y+Math.sin(a)*u*65,5*(1-u),'#ffe2a7');}
 if(s.phase==='failed'){
  const p=s.failure,u=Math.min(1,p.t/1.05);for(let i=0;i<12;i++){const a=i*Math.PI/6,r=18+u*85;c.save();c.globalAlpha=1-u;d.heart(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,5*(1-u),'#f4bdd0');c.restore();}
  panel(c,450,600,650,130,'#713e50f5');label(c,'CAUGHT BY THE GATE',450,576,28);label(c,'Restarting from the bottom…',450,625,23,'#f7e4c8');
 }
 const clearing=GATES.findIndex((g,i)=>!gateCleared(g,h)&&Math.abs(h.x-g.x)<g.gap/2&&h.y<g.y+90&&h.y>g.y-70);
 const status=s.phase==='failed'?'Gate closed — attempt resetting':s.phase==='landing'?'Dropping into the rose basket…':s.phase==='return'?'A soft return to your ribbon':s.phase==='celebrate'?'A little heart, safely home':clearing>=0?`Gate ${clearing+1} · lift above its SAFE line.`:s.resting?(s.checkpoint<0?'Place the fan behind the heart.':'Resting on a ribbon. Plan your next gust.'):on?'A gentle gust carries the heart.':'Fan resting · heart drifting.';
 panel(c,450,1059,660,68,'#713e509e');label(c,`${count}/${ROSETTES.length} ribbons · ${s.passed.filter(Boolean).length}/${GATES.length} gates · ${s.failures} gate resets`,450,1042,22);label(c,status,450,1074,21,'#f7e4c8');
 panel(c,360,1154,485,48,'#713e509e');label(c,count===ROSETTES.length?'Release above the basket.':sky.wind?`Crosswind ${wind>1?'→':wind< -1?'←':'turning'}`:'Hold behind the heart to blow.',360,1154,22,'#f7e4c8');
 panel(c,700,1154,155,48,'#885165ad');label(c,'FAN OFF',700,1154,23);
 paintChapterReward(s,d,{dark:true});nftReveal(s,d,reduced);
 if(s.saveError){panel(c,450,600,690,150,'#713e50f5');label(c,'Preview saving paused. Keep this window open.',450,600,24);}
}
export default {
 title:'Rosalie’s Heart on the Breeze',chapterEnds:true,
 intro:'Six rose gardens for one floating heart. Follow the ribbons through Rosalie’s gates and fan the pendant home.',
 instructions:'Hold and move the fan BEHIND the heart to push: underneath lifts, a side pushes sideways. Release to let it slow and drift. Touch every numbered ribbon rosette in order; later gardens have four. Chapter 2 has offset openings; from Chapter 3 gates slide sideways. Follow the opening and wait for a fresh OPEN window. Crosswinds start in Chapter 5, and the final basket moves gently. The heart floats behind the gate leaves. The dashed SAFE line runs along the little hearts in each fence. Once the WHOLE pendant, including its bottom tip, crosses above that fence line through the open gate, it is safe from that gate’s snap: the line turns green and reads CLEAR. Drifting back across the line puts the heart at risk again. If a gate closes on the heart at the fence, it bursts into pink petals and the whole attempt restarts from the bottom with no ribbons or passed gates. A normal fall still returns to the latest ribbon. After every ribbon and gate, lift the heart ABOVE the rose basket, then release so it drops into the opening. The chapter finishes after the visible landing. Arrows/WASD move the fan; hold Space to blow. There is no time limit in this test chapter. Test only: the NFT is a preview, with no real purse or tokens.',
 levels:LEVELS.map(sky=>sky.name),prizes:PRIZES,sprites:PRIZES,images:rewardImages,houseSeconds:0,
 navigationKey:BOOK+'.selection',selectedChapter:()=>selected,
 reviewCopy:{keys:'Hold and move fan behind heart · whole heart above SAFE line = clear of gate · release ABOVE basket to land · arrows + Space · H help · Esc pause.',cost:'Free preview · no timer.',treasure:(s,level)=>`Chapter reward preview: ${itemName(PRIZES[level])} · ${collected[level]||s?.prizeKept?'Collected':'Locked'}`},
 houseTitle:'The breeze rests',houseDetail:'Your heart, ribbons and gate progress are waiting here.',
 create(level){
  const production=productionPlay();if(!LEVELS[level])throw Error('Choose a chapter from 1 to 6.');loadArt();selected=level;
  const s=!production&&remembered.has(level)?restore(remembered.get(level),level):makeState(level);const BASKET=basketFor(s);
  // Resume an old timed-out practice at its exact position, with no new deadline.
  if(s.result?.won===false&&s.result.title==='The breeze rests'){s.result=null;s.phase=s.resumePhase||'play';delete s.resumePhase;s.note='Practice continues. Collect every ribbon, then land in the basket.';}
  s.practice=!production;bindPrize(s,PRIZES[level],{x:BASKET.x,y:BASKET.y,w:90,field:true});
  if(production?owned(PRIZES[level]):collected[level]){s.prizeKept=true;s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;}return s;
 },
 restoreState(blob){const restored=restore(blob,blob.level);return Object.assign(restored,blob);},
 persist,retryAttempt(s){const production=productionPlay();
  const next=s.result?.won?makeState(s.level):snapshot(s);next.result=null;next.houseLeft=100;next.practice=!production;if(next.phase==='result')next.phase=next.resumePhase||'play';delete next.resumePhase;cancel(next);checkpoint(next);return replayState(next,production);
 },
 clockRuns:()=>false,
 onTimeout(s){s.note='No time limit. Collect every ribbon, then land in the basket.';checkpoint(s);},
 update(s,dt){
  const production=productionPlay();
  if(s.result||s.saveError)return;const before=s.phase;step(s,dt);
  if((s.phase==='failed'&&before!=='failed')||(before==='failed'&&s.phase==='play')||(s.phase==='landing'&&before!=='landing')){if(!checkpoint(s))return;}
  if(s.phase==='celebrate'){
   if(!s.completionRecorded){s.completionRecorded=true;
    if(!(production?s.prizeKept:collected[s.level])){if(production)keep(PRIZES[s.level],'love');else collected[s.level]=true;takePrize(s,PRIZES[s.level],basketFor(s));s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;s.rewardReveal={id:PRIZES[s.level],t:0};s.celebrateLeft=3.9;}
    if(!checkpoint(s))return;
   }
   if(s.rewardReveal)s.rewardReveal.t+=dt;
   if(s.celebrateLeft<=0){s.phase='result';s.result={title:rules(s).name,detail:`${s.rosettes.length} ribbons and ${s.passed.length} gates. ${s.returns} soft returns. NFT preview: Collected.`,won:true,prize:null,settle:true};checkpoint(s);}
  }
 },
 pointer(s,type,p){
  if(type==='cancel'){cancel(s);return;}if(s.result||s.saveError||s.phase!=='play')return;
  if(type==='down'&&p.y>1110&&p.x>620){cancel(s);checkpoint(s);return;}
  if(type==='down'&&p.y>210&&p.y<1005){moveFan(s,p);setFan(s,true);}
  if(type==='move'&&p.y>210&&p.y<1005)moveFan(s,p);
  if(type==='up'){setFan(s,false);checkpoint(s);}
 },
 key(s,k,down){if(s.result||s.saveError||s.phase!=='play')return;key(s,k,down);},
 draw,readout:s=>s.note,
};
