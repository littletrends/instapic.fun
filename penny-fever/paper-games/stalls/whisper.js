import {withReleasedEngine} from '../engine-release.js';
/** Willa — Whisper Weave. Six local review chapters; live door stays closed. */
import {kits,spriteKey,itemName} from '../prizes.js?v=nft-art-1';
import {paintChapterReward} from './study-kit.js?v=studies-six-1';
import {alleyPlay,isVerifiedPlay,owned,keep} from '../wallet.js?v=insights-1';
import {bindPrize,takePrize} from '../chapter-kit.js?v=align-1';
import {attachChapterExampleView} from './chapter-example.js?v=example-1';
import {FIELD,LEVELS,FOLD_SECONDS,FLIGHT_SECONDS,rules,goal,mailboxPosition,mailboxOpen,deliveryReady,makeState,selected,selectionRule,beginLoop,extendLoop,releaseLoop,step,snapshot,restore} from './whisper-model.js?v=weave-six-2';
const PRIZES=kits.whisper.prizes,ROOT=new URL('../assets/whisper/',import.meta.url);
const names=['01-star-paper-plane.png','02-moon-paper-plane.png','03-star-letterbox.png','04-moon-letterbox.png','05-letter-weather-vane.png','06-delivery-platform.png'];
const art=[],letterArt=[];let artStarted=false,selectedChapter=0;
const remembered=new Map(),collected=Array(6).fill(false);
const params=typeof location==='undefined'?new URLSearchParams():new URLSearchParams(location.search);
const review=typeof location!=='undefined'&&['localhost','127.0.0.1'].includes(location.hostname)&&params.has('review');
const player=/^[a-zA-Z0-9_-]{1,48}$/.test(params.get('reviewPlayer')||'')?params.get('reviewPlayer'):'local';
const BOOK='pf.review.whisperWeave.v2:'+player;
if(review){
 const raw=localStorage.getItem(BOOK),legacy=raw?null:localStorage.getItem('pf.review.whisperWeave.v1:'+player);
 if(raw){
  const book=JSON.parse(raw);
  if(book.v!==2||!book.chapters||!Array.isArray(book.collected)||book.collected.length!==6||book.collected.some(v=>typeof v!=='boolean')||!Number.isInteger(book.selected)||!LEVELS[book.selected])throw Error('Saved Whisper review needs attention.');
  for(const [key,blob] of Object.entries(book.chapters))remembered.set(Number(key),snapshot(restore(blob,Number(key))));
  collected.splice(0,6,...book.collected);selectedChapter=book.selected;
 }else if(legacy){
  const book=JSON.parse(legacy);if(book.v!==1)throw Error('Saved Whisper review needs attention.');
  remembered.set(0,snapshot(restore(book.snapshot,0)));collected[0]=!!book.rewardCollected;
 }
}
const VIEWS=['front','right','back','left'];
const rewardImages=Object.fromEntries(PRIZES.flatMap(id=>VIEWS.map(view=>[`nft:${id}:${view}`,new URL(`../../assets/restyle/game-sprites/${spriteKey(id)}/${view}.webp`,import.meta.url).href])));
for(const id of PRIZES)rewardImages['study:'+id+':front']=rewardImages['nft:'+id+':front'];
function loadArt(){
  if(artStarted||typeof Image==='undefined')return;artStarted=true;
  const atlas=new Image();atlas.onload=()=>{const full=document.createElement('canvas');full.width=atlas.width;full.height=atlas.height;const ctx=full.getContext('2d',{willReadFrequently:true});ctx.drawImage(atlas,0,0);const pixels=ctx.getImageData(0,0,full.width,full.height).data;
   for(let i=0;i<2;i++){const left=Math.floor(i*full.width/2),right=Math.floor((i+1)*full.width/2);let x0=right,y0=full.height,x1=left,y1=0;for(let y=0;y<full.height;y++)for(let x=left;x<right;x++)if(pixels[(y*full.width+x)*4+3]>32){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}if(x1<=x0||y1<=y0)continue;const crop=document.createElement('canvas');crop.width=x1-x0+1;crop.height=y1-y0+1;crop.getContext('2d').drawImage(atlas,x0,y0,crop.width,crop.height,0,0,crop.width,crop.height);letterArt[i]=crop;}
  };atlas.src=new URL('sealed-letters-v2.png',ROOT).href;
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
function productionPlay(){const verified=isVerifiedPlay();if(alleyPlay&&!verified)throw Error('Verified play is required.');return verified;}
function replayState(s,production){if(production&&owned(PRIZES[s.level])){bindPrize(s,PRIZES[s.level]);s.prizeKept=true;s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;}return s;}
function persist(s){
 const production=productionPlay();if(!s||production)return;remembered.set(s.level,snapshot(s));selectedChapter=s.level;
 if(review){try{localStorage.setItem(BOOK,JSON.stringify({v:2,selected:selectedChapter,chapters:Object.fromEntries(remembered),collected}));s.saveError=false;}
 catch(error){s.saveError=true;s.note='The preview could not save. Keep this window open.';throw error;}}
}
function checkpoint(s){try{persist(s);return true;}catch{return false;}}
function drawLetter(d,p,t,scale=1,alpha=1){
 const c=d.c;c.save();c.globalAlpha=alpha;c.translate(p.x,p.y);c.rotate(Math.sin(t*1.2+p.id)*.07+p.spin);c.scale(scale,scale);
 c.shadowColor='#65517955';c.shadowBlur=12;c.shadowOffsetY=8;
 if(letterArt[p.kind]){c.drawImage(letterArt[p.kind],-43,-29,86,58);c.restore();return;}
 const g=c.createLinearGradient(-40,-30,40,30);g.addColorStop(0,'#fff9e5');g.addColorStop(1,'#e2d2bc');
 d.poly([[-43,-29],[43,-29],[43,29],[-43,29]],g,'#b18b51',2.4);c.shadowBlur=0;c.shadowOffsetY=0;
 d.path([{x:-42,y:29},{x:0,y:-2},{x:42,y:29}],'#c0a58c',1.5);
 d.poly([[-43,-29],[0,4],[43,-29]],'#f8eddb','#be9b67',1.8);
 const g2=c.createRadialGradient(-4,-6,1,0,0,18);g2.addColorStop(0,p.kind?'#a38bd6':'#e5a7b4');g2.addColorStop(1,p.kind?'#403361':'#8e4156');
 d.circle(0,1,18,g2,'#eac77e',2);
 if(p.kind){d.circle(0,0,10,'#efd497');d.circle(5,-4,8,'#64527e');}else d.star(0,0,11,'#f4d68b');
 c.restore();
}
function draw(s,d){
 loadArt();const c=d.c,reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches,t=reduced?0:s.t;
 const sky=rules(s),bundleWord=sky.bundle===1?'Any bundle':sky.bundle===2?'Matching pairs':'Matching threes';
 ;;;
 ;label(c,bundleWord,450,191,23,'#4b315f');
 sprite(d,4,450,300,96,{angle:Math.sin(t*.6)*.045});
 for(const i of [0,1]){
  const b=mailboxPosition(s,i),open=mailboxOpen(s,i),ready=deliveryReady(s,i);
  sprite(d,i+2,b.x,b.y,138,{alpha:open?1:.65});
  if(sky.windows){
   d.circle(b.x,b.y+18,66,null,ready?'#c5f2cd':'#c2afdd',3);
   if(!open)d.line({x:b.x-30,y:b.y+23},{x:b.x+30,y:b.y+23},'#e9d9f2',5);
  }
  panel(c,b.x,b.y+101,210,sky.windows?73:49,'#38294ca8');
  label(c,`${s.delivered[i]} / ${sky.perKind} ${i?'moon':'star'} seals`,b.x,b.y+(sky.windows?86:101),22);
  if(sky.windows)label(c,ready?'Release now':'Wait to send',b.x,b.y+116,21,ready?'#cdffd6':'#decfe9');
 }
 if(sky.seals){
  panel(c,450,368,166,77,s.sealLeft<1.5?'#79536be8':'#38294ca6');
  label(c,s.loop?'Seals steady':'Seals change',450,353,20);label(c,s.loop?'Drawing…':`${Math.ceil(s.sealLeft)}s`,450,384,22,'#f3deac');
 }
 // Gentle drifting dust makes the floating city feel alive.
 if(!reduced)for(let i=0;i<12;i++){const x=210+(i*137%490),y=430+((i*97+s.t*9)%450);d.circle(x,y,1.4,'#fff1c277');}
 const caught=selected(s),check=selectionRule(s,caught),mixed=check.mixed;
 const scaleUp=new Set(caught.map(p=>p.id));
 for(const p of s.letters){
  if(p.phase!=='float')continue;
  if(scaleUp.has(p.id))d.glow(p.x,p.y,55,mixed?'#f3a1b2':check.sizeOK?'#ffe6a8':'#efc38c');
  drawLetter(d,{...p,y:p.y+(s.loop?0:Math.sin(t*1.8+p.id)*3)},t,scaleUp.has(p.id)?1.1:1);
 }
 if(s.loop?.length){
  c.save();const color=mixed?'#ef9cad':'#ffdf9a';
  c.shadowColor=color;c.shadowBlur=reduced?0:12;
  d.path(s.loop,color,5,true,caught.length?(mixed?'#ad6b8d20':'#fff1b51a'):null);c.shadowBlur=0;
  const tip=s.loop.at(-1);d.circle(tip.x,tip.y,9,color,'#fff4d0',2);
  c.restore();
  if(caught.length){
   let message=mixed?'Both seals — tighten your loop.':!check.sizeOK?`Choose ${sky.bundle} or ${sky.bundle*2} matching seals.`:`${caught.length} matching letters · release!`;
   if(check.ready&&sky.windows)message=deliveryReady(s,check.kind)?`${caught.length} matching letters · RELEASE NOW`:'Hold your loop. Wait for the launch light.';
   panel(c,450,946,690,62,mixed?'#79445be8':'#5a4761ef');label(c,message,450,946,24);
  }
 }
 for(const f of s.flights){
  if(f.phase==='gone')continue;
  if(f.phase==='fold'){
   const u=Math.min(1,f.t/FOLD_SECONDS);
   for(const id of f.ids){const p=s.letters.find(p=>p.id===id);drawLetter(d,{...p,x:p.x+(f.fromX-p.x)*u,y:p.y+(f.fromY-p.y)*u},t,1-u*.8,1-u);}
   sprite(d,f.kind,f.fromX,f.fromY,100*u,{alpha:u,angle:-Math.PI*.3*u});
  }else{
   const u=Math.min(1,f.t/FLIGHT_SECONDS),to=mailboxPosition(s,f.kind),sign=f.kind?1:-1;
   const dx=f.phase==='return'?f.fromX-f.returnX:(to.x-f.fromX)*(6*u-6*u*u)+Math.cos(u*Math.PI)*Math.PI*sign*85;
   const dy=f.phase==='return'?f.fromY-f.returnY:(to.y-f.fromY)*(6*u-6*u*u)-Math.cos(u*Math.PI)*Math.PI*90;
   for(let j=1;j<=4;j++)d.circle(f.x-dx*.01*j,f.y-dy*.01*j,Math.max(1,5-j),'#fff0b17a');
   sprite(d,f.kind,f.x,f.y,105*(1-u*.28),{angle:Math.atan2(dy,dx)-2.35});
  }
 }
 for(const b of s.bursts)for(let i=0;i<9;i++){
  const a=i*Math.PI*2/9,r=b.t*75;c.save();c.globalAlpha=1-b.t;d.star(b.x+Math.cos(a)*r,b.y+Math.sin(a)*r,7*(1-b.t),'#ffe0a0');c.restore();
 }
 if(s.feedback>0&&!s.loop){
  const message=s.feedbackKind==='tangle'?'A tangle! Try one seal at a time.':s.feedbackKind==='size'?`This chapter sends ${sky.bundle===2?'pairs':'threes'}. Try another loop.`:s.feedbackKind==='return'?'Letterbox closed. Your letters return.':`${s.bestBundle} whispers, one plane!`;
  panel(c,450,946,690,62,s.feedbackKind==='tangle'?'#79445be8':'#5a4761eb');label(c,message,450,946,24);
 }
 sprite(d,5,450,1045,180);
 ;label(c,`${s.delivered[0]+s.delivered[1]} / ${goal(s)} secrets sent`,450,1045,27,'#4b315f');;
 ;;
 paintChapterReward(s,d,{dark:true});nftReveal(s,d,reduced);
 if(s.saveError){panel(c,450,600,680,150,'#6b394fe8');label(c,'Preview save unavailable. Keep this window open.',450,600,24);}
}
function finishLoop(s){releaseLoop(s);checkpoint(s);}
const releaseEngine = {
 title:'Willa’s Whisper Weave',chapterEnds:true,
 intro:'Loose secrets are drifting through Willa’s floating city. Circle matching seals and watch your bundle fold into a paper plane.',
 instructions:'Draw a loop around matching star OR moon seals. Release to fold a plane. Both seal types in one loop tangle softly; nothing is lost. Chapter 1 accepts any matching bundle. Chapters 2–4 need pairs (2 or 4); chapters 5–6 need threes (3 or 6). Letters cross paths and later change seals, but settle while you draw. In chapters 4–6, keep your loop held until the matching letterbox says Release now: that predicts an open delivery window when your plane arrives. A closed box returns your letters. Send every secret to finish. Mouse/touch draws; arrows move the pen, Space/Enter starts or ends a loop. Each chapter saves separately. No real purse or NFT changes in this test.',
 artReady:()=>art.length===6&&art.every(Boolean)&&letterArt.length===2,
 levels:LEVELS.map(sky=>sky.name),prizes:PRIZES,sprites:PRIZES,images:rewardImages,houseSeconds:100,
 navigationKey:BOOK+'.selection',selectedChapter:()=>selectedChapter,
 reviewCopy:{
  keys:'Draw a loop around one seal type · release to fold · arrows move the pen · Space/Enter starts or ends a loop · H for help · Esc to pause.',
  cost:'Free preview.',
  treasure:(s,level)=>`Chapter reward: ${itemName(PRIZES[level])} · ${collected[level]||s?.prizeKept?'Collected':'Locked'}`,
 },
 houseTitle:'The whispers settle',houseDetail:'Your delivered secrets and letters are waiting here.',
 create(level){
  const production=productionPlay();
  if(!LEVELS[level])throw Error('Choose a chapter from 1 to 6.');loadArt();selectedChapter=level;
  const s=!production&&remembered.has(level)?restore(remembered.get(level),level):makeState(level);s.practice=!production;s.loop=null;
  bindPrize(s,PRIZES[level],{x:450,y:480,w:90,field:true});
  if(production?owned(PRIZES[level]):collected[level]){s.prizeKept=true;s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;}
  return s;
 },
 restoreState(blob){const restored=restore(blob,blob.level);return Object.assign(restored,blob);},
 persist,retryAttempt(s){const production=productionPlay();
  const next=s.delivered[0]+s.delivered[1]===goal(s)?makeState(s.level):snapshot(s);
  next.practice=!production;next.result=null;next.phase='play';next.houseLeft=100;next.loop=null;checkpoint(next);return replayState(next,production);
 },
 clockRuns:s=>s.started&&!s.result&&!s.saveError&&s.phase==='play',
 onTimeout(s){s.loop=null;s.phase='result';s.result={title:'The whispers settle',detail:`${s.delivered[0]+s.delivered[1]} secrets sent. Your progress is waiting for your next delivery.`,won:false,prize:null,settle:true};checkpoint(s);},
 update(s,dt){
  const production=productionPlay();
  if(s.result||s.saveError)return;step(s,dt);
  if(s.phase==='celebrate'){
   if(!s.completionRecorded){s.completionRecorded=true;
    if(!(production?s.prizeKept:collected[s.level])){if(production)keep(PRIZES[s.level],'whisper');else collected[s.level]=true;takePrize(s,PRIZES[s.level],{x:450,y:480});s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;s.rewardReveal={id:PRIZES[s.level],t:0};s.celebrateLeft=3.9;}
    if(!checkpoint(s))return;
   }
   if(s.rewardReveal)s.rewardReveal.t+=dt;
   if(s.celebrateLeft<=0){s.phase='result';s.result={title:rules(s).name,detail:`All ${goal(s)} secrets sent. Best bundle: ${s.bestBundle}. ${s.returns} returns. NFT preview: Collected.`,won:true,prize:null,settle:true};checkpoint(s);}
  }
 },
 pointer(s,type,p){
  if(type==='cancel'){s.loop=null;return;}if(s.result||s.saveError||s.phase==='celebrate')return;
  if(type==='down')beginLoop(s,p);if(type==='move')extendLoop(s,p);if(type==='up'&&s.loop){extendLoop(s,p);finishLoop(s);}
 },
 key(s,key,down){
  if(!down||s.result||s.saveError||s.phase==='celebrate')return;
  const move={ArrowLeft:[-24,0],ArrowRight:[24,0],ArrowUp:[0,-24],ArrowDown:[0,24]}[key];
  if(move){s.cursor.x=Math.max(FIELD.left,Math.min(FIELD.right,s.cursor.x+move[0]));s.cursor.y=Math.max(FIELD.top,Math.min(FIELD.bottom,s.cursor.y+move[1]));if(s.loop)extendLoop(s,s.cursor);}
  if(key===' '||key==='Enter'){if(s.loop)finishLoop(s);else beginLoop(s,s.cursor);}
 },
 draw,readout:s=>s.note,
};

// Watch sample: a disposable chapter-1 sky with a scripted pen. It never touches
// the guest's round, purse or rewards (see chapter-example.js).
const sampleLoop=(cx,cy,rx,ry)=>Array.from({length:25},(_,i)=>{const a=-Math.PI/2+i*Math.PI*2/24;return {x:Math.round(cx+Math.cos(a)*rx),y:Math.round(cy+Math.sin(a)*ry)};});
const sampleCircle=(kind,cx,cy,rx,ry,caption)=>({caption,path:sampleLoop(cx,cy,rx,ry),gesture:1.8,
 start:s=>beginLoop(s,sampleLoop(cx,cy,rx,ry)[0]),move:(s,p)=>extendLoop(s,p),run:s=>releaseLoop(s),done:s=>s.delivered[kind]>=rules(s).perKind,after:.5});
attachChapterExampleView(releaseEngine,{model:{makeState,step},draw,steps:()=>[
 sampleCircle(0,320,570,112,172,'Draw one loop around the matching STAR seals only, then let go. They fold into a plane and fly to the star post.'),
 sampleCircle(1,585,605,117,202,'Now loop the MOON seals. Never mix stars and moons in one loop: the letters just slip free.'),
],finishCaption:'Your turn: loop one kind of seal at a time. Later chapters ask for pairs or threes.'});

export default withReleasedEngine(releaseEngine,{game:"whisper",module:"whisper.js"});
