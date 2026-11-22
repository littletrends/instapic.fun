/** Celeste — Orbit Hop. Test variant only; original lookup.js remains the live game. */
import {kits,spriteKey,itemName} from '../prizes.js?v=nft-art-1';
import {alleyPlay,isVerifiedPlay,owned,keep} from '../wallet.js?v=insights-1';
import {bindPrize,takePrize} from '../chapter-kit.js?v=align-1';
import {withChapterExample} from './chapter-example.js?v=example-1';
import {LEVELS,rules,totalHops,nodePosition,gateOpen,orbitDirection,windAt,makeState,makeSampleState,orbitStar,aim,hold,release,cancel,step,snapshot,restore} from './lookup-orbit-model.js?v=orbit-six-2';
const PRIZES=kits.lookup.prizes,ROOT=new URL('../assets/celeste-orbit/',import.meta.url);
const names=['01-star-mirror.png','02-crystal-star-lantern.png','03-unlit-star-cup.png','04-lit-star-cup.png','05-cloud-wheel.png','06-crescent-viewer.png'];
const art=[];let artStarted=false,selected=0;
const remembered=new Map(),collected=Array(6).fill(false);
const params=typeof location==='undefined'?new URLSearchParams():new URLSearchParams(location.search);
const review=typeof location!=='undefined'&&['127.0.0.1','localhost'].includes(location.hostname)&&params.get('review')==='orbit-hop';
const player=/^[a-zA-Z0-9_-]{1,48}$/.test(params.get('reviewPlayer')||'')?params.get('reviewPlayer'):'local';
const BOOK='pf.review.celesteOrbit.v2:'+player;
if(review){
 const raw=localStorage.getItem(BOOK),legacy=raw?null:localStorage.getItem('pf.review.celesteOrbit.v1:'+player);
 if(raw){
  const book=JSON.parse(raw);
  if(book.v!==2||!book.chapters||!Array.isArray(book.collected)||book.collected.length!==6||book.collected.some(v=>typeof v!=='boolean')||!Number.isInteger(book.selected)||!LEVELS[book.selected])throw Error('Orbit Hop review save needs attention.');
  for(const [key,blob] of Object.entries(book.chapters))remembered.set(Number(key),snapshot(restore(blob,Number(key))));
  collected.splice(0,6,...book.collected);selected=book.selected;
 }else if(legacy){
  const book=JSON.parse(legacy);if(book.v!==1)throw Error('Orbit Hop review save needs attention.');
  remembered.set(0,snapshot(restore(book.snapshot,0)));collected[0]=!!book.rewardCollected;
 }
}
const VIEWS=['front','right','back','left'];
const rewardImages=Object.fromEntries(PRIZES.flatMap(id=>VIEWS.map(view=>[`nft:${id}:${view}`,new URL(`../../assets/restyle/game-sprites/${spriteKey(id)}/${view}.webp`,import.meta.url).href])));
function loadArt(){
  if(artStarted||typeof Image==='undefined')return;artStarted=true;
  names.forEach((name,i)=>{
    const image=new Image();image.onload=()=>{
      // Key cyan connected to the outside, preserving enclosed interior colours.
      const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
      const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
      const data=ctx.getImageData(0,0,c.width,c.height),p=data.data,w=c.width,h=c.height;
      const seen=new Uint8Array(w*h),queue=[];
      const add=n=>{if(n<0||n>=w*h||seen[n])return;seen[n]=1;const j=n*4;
        if(p[j]<105&&p[j+1]>155&&p[j+2]>155&&p[j+1]-p[j]>75&&p[j+2]-p[j]>75)queue.push(n);};
      for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
      for(let k=0;k<queue.length;k++){const n=queue[k];p[n*4+3]=0;if(n%w)add(n-1);if(n%w<w-1)add(n+1);add(n-w);add(n+w);}
      ctx.putImageData(data,0,0);art[i]=c;
    };image.src=new URL(name,ROOT).href;
  });
}
function panel(c,x,y,w,h,fill='#123e38eb',stroke='#dab978'){
  c.save();c.beginPath();c.roundRect(x-w/2,y-h/2,w,h,22);c.fillStyle=fill;c.fill();c.globalAlpha*=.65;c.strokeStyle=stroke;c.lineWidth=1.2;c.stroke();c.restore();
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
function rewardBadge(s,d){
 if(typeof document!=='undefined'&&document.querySelector('#chapter-prize:not([hidden])'))return;
 const prize=s.chapterPrize;
 if(s.demo||!prize||s.rewardReveal?.id===prize.id&&s.rewardReveal.t<=3.6)return;
 const c=d.c,x=829,image=d.art?.[`nft:${prize.id}:front`],kept=!!s.prizeKept;
 panel(c,x,146,110,136,'#182544aa');label(c,'REWARD',x,94,18,'#ffe3a0');
 if(image)d.sprite(image,x,145,{w:72,h:72,shadow:false});else d.item(prize.key,x,145,{w:72,shadow:false});
 label(c,kept?'Collected':'Locked',x,197,20,kept?'#e4ffb5':'#fff2d4');
}


function sprite(d,index,x,y,w,opts={}){if(art[index])return d.sprite(art[index],x,y,{w,shadow:false,...opts});return false;}
function productionPlay(){const verified=isVerifiedPlay();if(alleyPlay&&!verified)throw Error('Verified play is required.');return verified;}
function replayState(s,production){if(production&&owned(PRIZES[s.level])){bindPrize(s,PRIZES[s.level]);s.prizeKept=true;s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;}return s;}
function persist(s){
 const production=productionPlay();if(!s||production)return;remembered.set(s.level,snapshot(s));selected=s.level;
 if(review){try{localStorage.setItem(BOOK,JSON.stringify({v:2,selected,chapters:Object.fromEntries(remembered),collected}));s.saveError=false;}
 catch(error){s.saveError=true;s.note='Preview save unavailable. Keep this window open.';throw error;}}
}
function checkpoint(s){try{persist(s);return true;}catch{return false;}}
function comet(d,x,y,size=17,alpha=1){
 const c=d.c;c.save();c.globalAlpha=alpha;d.glow(x,y,size*2.8,'#fff0a0');d.star(x,y,size,'#ffedb4');d.circle(x,y,size*.25,'#fffbea');c.restore();
}
function draw(s,d){
 loadArt();const c=d.c,reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches,t=reduced?0:s.t;
 const sky=rules(s),last=totalHops(s),pos=i=>nodePosition(i,s.t,s),hint=s.phase==='orbit'?aim(s):null;
 ;;;
 const source=pos(s.node);
 if(!reduced)for(let i=0;i<12;i++){const x=205+(i*139%500),y=260+(i*173%660);d.star(x,y,2+(Math.sin(t*1.6+i)+1),'#efe2b778');}
 // Lit catches remain linked as a little constellation.
 for(let i=1;i<=s.node;i++){const a=pos(i-1),b=pos(i);d.line(a,b,'#ffe09a9c',3);}
 for(const cup of sky.nodes)if(cup.ax||cup.ay){
  c.save();c.setLineDash([5,9]);d.ellipse(cup.x,cup.y,cup.ax||5,cup.ay||5,null,'#d9e7ff73',2);c.restore();
 }
 if(sky.wind){
  const w=windAt(s),sign=w>=0?1:-1;
  for(let i=0;i<3;i++){
   const y=485+i*45;d.line({x:420-sign*24,y},{x:420+sign*24,y},'#c8e9f08c',2);
   d.line({x:420+sign*24,y},{x:420+sign*14,y:y-6},'#c8e9f08c',2);
  }
  label(c,w>=0?'Breeze →':'← Breeze',450,640,20,'#d1e5f1');
 }
 for(let i=0;i<sky.nodes.length;i++){
  const p=pos(i),active=i===s.node+1,caught=s.caught[i],cup=sky.nodes[i],open=gateOpen(i,s.t,s),size=s.level===0?125:i===last?104:94;
  if(active){d.glow(p.x,p.y,95,hint?.ready?'#e5ffb4':'#f5dca2');d.circle(p.x,p.y,54,null,hint?.ready?'#e4ffb5':'#f6dfa7a8',3);}
  if(caught)d.glow(p.x,p.y,70,'#ffe5a2');
  const asset=i===0?4:i===last?1:caught?3:2;
  sprite(d,asset,p.x,p.y,i===0?135:size,{angle:!reduced&&caught?Math.sin(t*1.8+i)*.015:0,alpha:(cup.gate&&!open&&!caught)? .55:1});
  if(cup.gate&&!caught){
   d.circle(p.x,p.y,57,null,open?'#c8edca':'#b7bfdf',3);
   if(!open){d.line({x:p.x-34,y:p.y-30},{x:p.x+34,y:p.y+30},'#d4def1',4);d.line({x:p.x-34,y:p.y+30},{x:p.x+34,y:p.y-30},'#d4def1',4);}
  }
  if(i>0){
   const caption=caught?`${i} · Lit`:cup.gate?`${i} · ${open?'Open':'Closed'}`:i===last?`${i} · Lantern`:cup.ax||cup.ay?`${i} · Moving`:`${i} · Cup`;
   const y=p.y+(s.level===0?85:i===last?69:60);panel(c,p.x,y,150,36,'#182544e6');label(c,caption,p.x,y,19);
  }
 }
 if(s.phase==='orbit'){
  c.save();c.setLineDash(s.held?[]:[4,9]);d.circle(source.x,source.y,sky.radius,null,s.held?'#fff0b7c9':'#d7e9ff7a',s.held?3:2);c.restore();
  if(hint){
   const a=hint.from,b={x:a.x+hint.dir.x*94,y:a.y+hint.dir.y*94};
   d.line(a,b,hint.ready?'#e4ffb5':'#fff0b7a0',3);
   d.line(b,{x:b.x-hint.dir.x*14-hint.dir.y*9,y:b.y-hint.dir.y*14+hint.dir.x*9},'#fff0b7c9',3);
   d.line(b,{x:b.x-hint.dir.x*14+hint.dir.y*9,y:b.y-hint.dir.y*14-hint.dir.x*9},'#fff0b7c9',3);
  }
 }
 for(let i=0;i<s.trail.length;i++){const p=s.trail[i],u=(i+1)/s.trail.length;d.circle(p.x,p.y,1+u*5,`rgba(255,232,161,${u*.6})`);}
 const star=s.phase==='orbit'?orbitStar(s):s.star;comet(d,star.x,star.y,s.held?20:17);
 if(s.catchFlash>0&&!reduced)for(let i=0;i<10;i++){
  const p=pos(s.node),u=1-s.catchFlash/1.3,a=i*Math.PI*2/10;
  comet(d,p.x+Math.cos(a)*u*85,p.y+Math.sin(a)*u*85,5*(1-u),1-u);
 }
 ;
 label(c,`${s.node} / ${last} lights connected · ${s.shots} ${s.shots===1?'flight':'flights'}`,450,975,24);
 const ready=s.phase==='orbit'&&s.held&&hint?.ready;
 if(ready)d.glow(450,1052,86,'#dfffad');
 const button=s.phase==='flight'?'FOLLOW THE STAR':s.phase==='return'?'BACK TO YOUR LAST LIGHT':s.phase==='celebrate'?'CONSTELLATION COMPLETE':ready?'RELEASE NOW':s.held?'RELEASE TO HOP':'HOLD TO ORBIT';
 label(c,button,450,1052,29,ready?'#f2ffd5':'#fff2d4');
 ;
 rewardBadge(s,d);
 nftReveal(s,d,reduced);
 if(s.saveError){panel(c,450,600,680,160,'#673d47f2');label(c,'Preview saving paused. Keep this window open.',450,600,24);}
}
const engine={
 title:'Celeste’s Orbit Hop',chapterEnds:true,
 intro:'Six skies, six little constellations. Help Celeste carry her star from the cloud wheel to the lantern.',
 instructions:'Hold anywhere in the sky to orbit your current light. Release to fly along the arrow. Green glow and Release now predict a catch. Follow the numbered cups to the lantern. Later skies add wandering cups, moon gates (arrive while open), wind that bends flights, and an orbit that reverses at every catch. Miss and return to your last light; caught lights stay lit. Hold/release Space also works. Each chapter saves separately. This local test uses no real purse or NFTs.',
 levels:LEVELS.map(sky=>sky.name),prizes:PRIZES,sprites:PRIZES,images:rewardImages,houseSeconds:100,
 navigationKey:BOOK+'.selection',selectedChapter:()=>selected,
 reviewCopy:{
  keys:'Hold the sky or Space to orbit · release to fly · green glow predicts a catch · H for help · Esc to pause · 1–6 buttons choose a chapter.',
  cost:'Test play is free. Your progress saves in this browser.',
  treasure:(s,level)=>`Chapter reward: ${itemName(PRIZES[level])} · ${collected[level]||s?.prizeKept?'Collected':'Locked until you finish this chapter.'}`,
 },
 houseTitle:'The sky rests',houseDetail:'Your caught lights stay lit. Try the next hop when you are ready.',
 create(level){
  const production=productionPlay();if(!LEVELS[level])throw Error('Choose a chapter from 1 to 6.');loadArt();selected=level;
  const s=!production&&remembered.has(level)?restore(remembered.get(level),level):makeState(level);s.practice=!production;s.held=false;
  bindPrize(s,PRIZES[level],{x:450,y:440,w:90,field:true});
  if(production?owned(PRIZES[level]):collected[level]){s.prizeKept=true;s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;}return s;
 },
 restoreState(blob){const restored=restore(blob,blob.level);return Object.assign(restored,blob);},
 persist,retryAttempt(s){const production=productionPlay();
  if(s.node===totalHops(s)){const fresh=makeState(s.level);fresh.practice=!production;checkpoint(fresh);return replayState(fresh,production);}
  else{const next=snapshot(s);next.result=null;next.phase='orbit';next.held=false;next.houseLeft=100;next.returning=null;next.trail=[];checkpoint(next);return replayState(next,production);}
 },
 clockRuns:s=>s.started&&!s.result&&!s.saveError&&['orbit','flight','return'].includes(s.phase),
 onTimeout(s){s.held=false;s.phase='result';s.result={title:'The sky rests',detail:`${s.node} lights caught. Your progress is waiting for your next hop.`,won:false,prize:null,settle:true};checkpoint(s);},
 update(s,dt){
  const production=productionPlay();
  if(s.result||s.saveError)return;step(s,dt);
  if(s.phase==='celebrate'){
   if(!s.completionRecorded){s.completionRecorded=true;
    if(!(production?s.prizeKept:collected[s.level])){if(production)keep(PRIZES[s.level],'lookup');else collected[s.level]=true;takePrize(s,PRIZES[s.level],{x:450,y:440});s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;s.rewardReveal={id:PRIZES[s.level],t:0};s.celebrateLeft=3.9;}
    if(!checkpoint(s))return;
   }
   if(s.rewardReveal)s.rewardReveal.t+=dt;
   if(s.celebrateLeft<=0){s.phase='result';s.result={title:rules(s).name,detail:`${totalHops(s)} lights connected in ${s.shots} flights. ${s.misses} returns. NFT preview: Collected.${s.level===5?' All six skies are ready to revisit.':''}`,won:true,prize:null,settle:true};checkpoint(s);}
  }
 },
 pointer(s,type,p){
  if(type==='cancel'){cancel(s);return;}if(s.result||s.saveError)return;
  if(type==='down'&&p.y>200)hold(s);
  if(type==='up'&&release(s))checkpoint(s);
 },
 key(s,key,down){
  if(s.result||s.saveError)return;
  if(key===' '){if(down)hold(s);else if(release(s))checkpoint(s);}
 },
 draw,readout:s=>s.note,
};
engine.artReady=()=>art.length===names.length&&art.every(Boolean);
engine.instructions='Watch the complete easy example: hold and release to reach one lamp, then the lantern and sample reward. The green release cue pauses briefly so you can see it. Play Chapter 1 starts your own full sky. '+engine.instructions;
const exampleModel={
 makeState:()=>makeSampleState(),
 step(s,dt){
  if(s.demoRewardAge!==undefined){s.demoRewardAge+=dt;return;}
  // A teaching pause holds the real green cue until the example releases.
  if(s.demoAimPaused)return;
  step(s,dt);
  if(s.phase==='celebrate'){
   s.phase='demo-finish';s.demoRewardAge=0;s.demoWaitForAim=false;
   s.note='One lamp, then the lantern. Demonstration complete.';
  }else if(s.demoWaitForAim&&s.held&&aim(s).ready)s.demoAimPaused=true;
 },
};
function drawExample(s,d){
 draw(s,d);
 if(s.demoRewardAge===undefined)return;
 const c=d.c,id=PRIZES[0],t=s.demoRewardAge,turn=Math.max(0,t-.35)/3*4,i=Math.floor(turn)%4,mix=turn-Math.floor(turn);
 panel(c,450,565,610,465,'#103b35f5');
 label(c,'DEMONSTRATION COMPLETE',450,385,29,'#ffe3a0');
 label(c,'One lamp, then the lantern',450,430,25);
 d.glow(450,565,140,'#ffe8a4');
 const a=d.art?.[`nft:${id}:${VIEWS[i]}`],b=d.art?.[`nft:${id}:${VIEWS[(i+1)%4]}`];
 if(a)d.sprite(a,450,565,{w:230,shadow:false,alpha:1-mix});
 if(b)d.sprite(b,450,565,{w:230,shadow:false,alpha:mix});
 if(!a&&!b)d.item(spriteKey(id),450,565,{w:230,shadow:false});
 label(c,'Sample chapter reward',450,710,24,'#ffe3a0');
 label(c,'No reward or pennies collected',450,752,22,'#dfdfc2');
}
function sampleHold(s){s.demoWaitForAim=true;hold(s);}
function sampleRelease(s){s.demoWaitForAim=false;s.demoAimPaused=false;release(s);}
export default withChapterExample(engine,{
 model:exampleModel,draw:drawExample,hideHouseClock:true,
 hasSavedFirst:()=>remembered.has(0),
 canStart:s=>['orbit','flight','return'].includes(s.phase),
 steps:()=>[
  {caption:'Hold anywhere in the sky. The star circles the cloud wheel and its arrow turns towards ONE lamp.',point:{x:450,y:1040},run:sampleHold,done:s=>s.demoAimPaused,after:.7},
  {caption:'Green glow means RELEASE NOW. Lift your finger and watch the star fly into the lamp.',point:{x:450,y:1040},run:sampleRelease,done:s=>s.node===1&&s.phase==='orbit',after:1},
  {caption:'The lamp is lit. Hold again: the next glowing target is the LANTERN.',point:s=>nodePosition(1,s.t,s),run:sampleHold,done:s=>s.demoAimPaused,after:.7},
  {caption:'Release on green again. The star must reach the lantern to finish the easy sky.',point:s=>nodePosition(1,s.t,s),run:sampleRelease,done:s=>s.demoRewardAge!==undefined,after:.3},
  {caption:'One lamp and the lantern are connected. Here is the sample reward; your own chapter has a longer sky.',point:{x:450,y:565},run:()=>{},done:s=>s.demoRewardAge>=4.2,after:.2},
 ],
 finishCaption:'Your turn: hold, follow the arrow, then release on green. Connect all three lights in Chapter 1. This sample collected nothing.',
});
