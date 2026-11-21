/** Mabel's six Milk Match chapters. Local test; original Milky Splash stays intact. */
import {kits,spriteKey,itemName} from '../prizes.js?v=nft-art-1';
import {alleyPlay,isVerifiedPlay,owned,keep} from '../wallet.js?v=insights-1';
import {bindPrize,takePrize} from '../chapter-kit.js?v=align-1';
import {withChapterExample} from './chapter-example.js?v=example-1';
import {FLAVOURS,LEVELS,rules,gridFor,CAPACITY,CRATES,canChoose,makeState,cellCenter,cellAtPoint,flavourIndex,slotPosition,crateOffset,cancel,choose,swap,clockRuns,timeUp,step,snapshot,restore} from './milk-match-crates-model.js?v=milk-match-six-1';
const PRIZES=kits['milk-bottles'].prizes,ROOT=new URL('../assets/mabel-milk-parade/',import.meta.url);
const art=[];let artStarted=false,selected=0;
const remembered=new Map(),collected=Array(6).fill(false);
const params=typeof location==='undefined'?new URLSearchParams():new URLSearchParams(location.search);
const review=typeof location!=='undefined'&&['127.0.0.1','localhost'].includes(location.hostname)&&params.get('review')==='milk-match';
const player=/^[a-zA-Z0-9_-]{1,48}$/.test(params.get('reviewPlayer')||'')?params.get('reviewPlayer'):'local';
const BOOK='pf.review.mabelMilkMatch.v2:'+player;
if(review){
 const raw=localStorage.getItem(BOOK),legacy=raw?null:localStorage.getItem('pf.review.mabelMilkMatch.v1:'+player);
 if(raw){
  const book=JSON.parse(raw);
  if(book.v!==2||!book.chapters||!Number.isInteger(book.selected)||!LEVELS[book.selected]||!Array.isArray(book.collected)||book.collected.length!==6||book.collected.some(v=>typeof v!=='boolean'))throw Error('Saved Milk Match needs attention.');
  for(const [key,blob] of Object.entries(book.chapters))remembered.set(Number(key),snapshot(restore(blob,Number(key))));
  collected.splice(0,6,...book.collected);selected=book.selected;
 }else if(legacy){
  const book=JSON.parse(legacy);if(book.v!==1||typeof book.rewardCollected!=='boolean')throw Error('Saved Milk Match needs attention.');
  remembered.set(0,snapshot(restore(book.snapshot,0)));collected[0]=book.rewardCollected;
 }
}
const VIEWS=['front','right','back','left'];
const rewardImages=Object.fromEntries(PRIZES.flatMap(id=>VIEWS.map(view=>[`nft:${id}:${view}`,new URL(`../../assets/restyle/game-sprites/${spriteKey(id)}/${view}.webp`,import.meta.url).href])));
function loadArt(){
 if(artStarted||typeof Image==='undefined')return;artStarted=true;
 ['strawberry','chocolate','banana','vanilla','crate'].forEach((name,i)=>{const image=new Image();image.onload=()=>{
  const source=document.createElement('canvas');source.width=image.width;source.height=image.height;const c=source.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
  const p=c.getImageData(0,0,image.width,image.height).data;let l=image.width,r=0,t=image.height,b=0;
  for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)if(p[(y*image.width+x)*4+3]>128){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
  const cut=document.createElement('canvas');cut.width=r-l+1;cut.height=b-t+1;cut.getContext('2d').drawImage(image,l,t,cut.width,cut.height,0,0,cut.width,cut.height);art[i]=cut;
 };image.src=new URL(name+'.png',ROOT).href;});
}
function panel(c,x,y,w,h,fill='#f7eed8f2',stroke='#b4a477'){c.save();c.shadowColor='#4a4a2924';c.shadowBlur=5;c.shadowOffsetY=4;c.beginPath();c.roundRect(x-w/2,y-h/2,w,h,19);c.fillStyle=fill;c.fill();c.shadowColor='transparent';c.strokeStyle='#fff8e499';c.lineWidth=2.5;c.stroke();c.globalAlpha*=.65;c.strokeStyle=stroke;c.lineWidth=1;c.stroke();c.restore();}
function label(c,text,x,y,size=23,colour='#4d5d40'){c.font=`600 ${Math.max(size,12*900/(c.canvas.clientWidth||450))}px Georgia,serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=colour;c.fillText(text,x,y);}
function sprite(d,i,x,y,w,h,opts={}){return art[i]?d.sprite(art[i],x,y,{w,h,shadow:false,...opts}):false;}
function productionPlay(){const verified=isVerifiedPlay();if(alleyPlay&&!verified)throw Error('Verified play is required.');return verified;}
function replayState(s,production){if(production&&owned(PRIZES[s.level])){bindPrize(s,PRIZES[s.level]);s.prizeKept=true;s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;}return s;}
function persist(s){const production=productionPlay();if(!s||production)return;remembered.set(s.level,snapshot(s));selected=s.level;if(review){try{localStorage.setItem(BOOK,JSON.stringify({v:2,selected,chapters:Object.fromEntries(remembered),collected}));s.saveError=false;}catch(error){s.saveError=true;s.note='Preview saving paused. Keep this window open.';throw error;}}}
function checkpoint(s){try{persist(s);return true;}catch{return false;}}
function reward(s,d,reduced){
 const r=s.rewardReveal;if(!r||r.t>3.6)return;const c=d.c,t=r.t,u=Math.min(1,Math.max(0,(t-2.9)/.7)),e=u*u*(3-2*u),x=450+355*e,y=535-455*e,w=300-260*e;
 if(!u){panel(c,450,520,620,470);label(c,'NFT REWARD · COLLECTED',450,340,29,'#78602f');label(c,itemName(r.id),450,725,26);}
 d.glow(x,y,w*.65,'#ffe8a4');const turn=reduced?0:Math.min(1,Math.max(0,(t-.3)/2.4))*4,i=Math.floor(turn)%4,j=(i+1)%4,mix=turn-Math.floor(turn),a=d.art?.[`nft:${r.id}:${VIEWS[i]}`],b=d.art?.[`nft:${r.id}:${VIEWS[j]}`];
 if(a){d.sprite(a,x,y,{w,shadow:false,alpha:1-mix});if(b&&mix)d.sprite(b,x,y,{w,shadow:false,alpha:mix});}else d.item(spriteKey(r.id),x,y,{w,shadow:false});
}
function rewardBadge(s,d){
 const prize=s.chapterPrize;
 if(s.demo||!prize||s.rewardReveal?.id===prize.id&&s.rewardReveal.t<=3.6)return;
 const c=d.c,x=829,image=d.art?.[`nft:${prize.id}:front`],kept=!!s.prizeKept;
 panel(c,x,146,110,136,'#f7eed8cc');
 label(c,'REWARD',x,94,18,'#78602f');
 if(image)d.sprite(image,x,145,{w:72,h:72,shadow:false});else d.item(prize.key,x,145,{w:72,shadow:false});
 label(c,kept?'Collected':'Locked',x,197,20,kept?'#49633b':'#78602f');
}
function bottle(d,cell,x,y,w=54,h=96,alpha=1){
 if(!cell||cell.kind==='hole')return;const c=d.c;
 if(['crate','weighted'].includes(cell.kind)){c.save();c.globalAlpha=alpha;sprite(d,4,x,y,Math.min(112,w*1.8),h*.65);if(cell.kind==='weighted'){for(const dx of [-14,14])d.line({x:x+dx,y:y-h*.31},{x:x+dx,y:y+h*.31},cell.hp===2?'#887554':'#d5c3a0',5);}panel(c,x,y,32,28,'#f5e8ca');label(c,String(cell.hp),x,y,19,'#76613d');c.restore();return;}
 const index=flavourIndex(cell.flavour);sprite(d,index,x,y,w,h,{alpha});
 if(cell.kind==='special'){
  c.save();c.globalAlpha=alpha;
  if(cell.special==='shaken'){const vertical=cell.axis==='col';for(const k of [-1,1])d.line({x:x+(vertical?k*8:-w*.4),y:y+(vertical?-h*.16:k*8)},{x:x+(vertical?k*8:w*.4),y:y+(vertical?h*.2:k*8)},'#fff4d9',3);}
  else{d.circle(x+w*.35,y-h*.32,13,'#f4deb1','#b3935e',2);label(c,cell.special==='cream'?'★':'✦',x+w*.35,y-h*.32,16,'#826331');}c.restore();
 }
}
function drawBoard(s,d){
 const c=d.c,GRID=gridFor(s),height=Math.min(96,GRID.ch-7),width=54*height/96;
 for(let r=0;r<GRID.rows;r++)for(let col=0;col<5;col++){const p=cellCenter(col,r,s);panel(c,p.x,p.y,124,GRID.ch-7,s.board.cells[r][col].kind==='hole'?'#7c886e38':(r+col)%2?'#fff4df45':'#e8e7cc45','#c9c7a6');}
 c.save();c.beginPath();c.rect(GRID.left-3,GRID.top-3,GRID.cw*5+6,GRID.ch*GRID.rows+6);c.clip();
 if(s.anim&&['swap','burst','reject'].includes(s.phase)){
  const a=s.anim.a,b=s.anim.b,u=s.phase==='swap'?Math.min(1,s.phaseTime/.18):s.phase==='reject'?Math.sin(Math.min(1,s.phaseTime/.28)*Math.PI):1;
  for(let r=0;r<GRID.rows;r++)for(let col=0;col<5;col++){
   const p=cellCenter(col,r,s);let x=p.x,y=p.y;if(col===a.c&&r===a.r){x+=(b.c-a.c)*GRID.cw*u;y+=(b.r-a.r)*GRID.ch*u;}else if(col===b.c&&r===b.r){x+=(a.c-b.c)*GRID.cw*u;y+=(a.r-b.r)*GRID.ch*u;}
   const hit=s.phase==='burst'&&s.anim.hits.some(q=>q.c===col&&q.r===r);bottle(d,s.anim.before[r][col],x,y,width,height,hit?Math.max(0,1-s.phaseTime/.15):1);
  }
 }else{
  for(let r=0;r<GRID.rows;r++)for(let col=0;col<5;col++){
   const to=cellCenter(col,r,s);let x=to.x,y=to.y;
   if(s.phase==='fall'){const from=s.anim.paths[r][col],p=cellCenter(from.c,from.r,s),u=Math.min(1,s.phaseTime/.35),e=1-(1-u)**3;x=p.x+(x-p.x)*e;y=p.y+(y-p.y)*e;}
   bottle(d,s.board.cells[r][col],x,y,width,height);
  }
 }
 c.restore();
 if(s.selected){const p=cellCenter(s.selected.c,s.selected.r,s);panel(c,p.x,p.y,122,GRID.ch-9,'#ffefaa44','#b49a4d');bottle(d,s.board.cells[s.selected.r][s.selected.c],p.x,p.y,width,height);}
 if(s.phase==='idle'){const p=cellCenter(s.cursor.c,s.cursor.r,s);d.line({x:p.x-46,y:p.y+GRID.ch/2-7},{x:p.x+46,y:p.y+GRID.ch/2-7},'#a6b17d',2);}
}
function draw(s,d){
 loadArt();const sky=s.demo?{...rules(s),name:'One easy crate · demonstration',goal:1,requests:[0,0,0,0]}:rules(s),c=d.c,reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 panel(c,450,118,640,66,'#f7eed8bd');label(c,'MABEL’S MILK MATCH',450,104,27);label(c,`${s.level+1} · ${sky.name}`,450,136,22,'#596044');
 panel(c,450,188,630,29,'#f7eed8bd');label(c,`${sky.goal} crates · ${sky.seconds}s${sky.requests.some(n=>n)?' · '+sky.requests[0]+' of every flavour':''}`,450,188,20,'#596044');
 drawBoard(s,d);
 for(let i=0;i<4;i++){
  const base=CRATES[i],f=FLAVOURS[i],crate=s.crates[i],x=base.x+crateOffset(crate);
  panel(c,base.x,808,187,54,'#f7eed8f2',f.colour);label(c,f.name,base.x,796,21,f.ink);label(c,`${crate.filled}/${CAPACITY} bottles`,base.x,825,19,'#777255');
  sprite(d,4,x,base.y,183,95);
  for(let slot=0;slot<crate.filled;slot++){const p=slotPosition(i,slot);sprite(d,i,p.x+crateOffset(crate),p.y,32,62);}
 }
 for(const f of s.flights){const to=slotPosition(f.flavour,f.slot),u=Math.min(1,f.age/.6),e=u*u*(3-2*u),x=f.x+(to.x-f.x)*e,y=f.y+(to.y-f.y)*e-Math.sin(Math.PI*u)*22;sprite(d,f.flavour,x,y,54-22*u,96-34*u);}
 for(let i=0;i<4;i++){
  const base=CRATES[i],crate=s.crates[i],x=base.x+crateOffset(crate),image=art[4];
  if(image){const cut=.48;c.drawImage(image,0,image.height*cut,image.width,image.height*(1-cut),x-91.5,base.y-47.5+95*cut,183,95*(1-cut));}
  if(['closing','dispatch'].includes(crate.phase)){const u=crate.phase==='dispatch'?1:Math.min(1,crate.age/.5);panel(c,x,base.y-20,175,Math.max(2,32*u),'#a4ad7c','#e3d3a6');if(u>.8)label(c,'✓',x,base.y-20,22,'#fff5d4');}
  else label(c,FLAVOURS[i].name,x,base.y+22,18,FLAVOURS[i].ink);
  panel(c,base.x,981,162,28);label(c,sky.requests[i]?`${crate.completed}/${sky.requests[i]} sent`:`${crate.completed} sent`,base.x,981,19,sky.requests[i]&&crate.completed>=sky.requests[i]?'#637e48':'#626e4f');
 }
 for(const p of s.sparks){const u=p.age/.7;for(let i=0;i<7;i++){const a=i*Math.PI*2/7;d.star(p.x+Math.cos(a)*u*30,p.y+Math.sin(a)*u*30,3*(1-u),'#ddbb61');}}
 panel(c,450,1060,710,64,'#f7eed8bd');label(c,`${s.sent}/${sky.goal} full crates · ${s.moves} ${s.moves===1?'match':'matches'}`,450,1046,25);
 const status=s.demo&&s.demoRewardAge!==undefined?'One full crate delivered · demonstration complete':s.phase==='drain'?'Bell rung — finishing your matched bottles…':s.phase==='celebrate'?'Lovely! Your crate target is complete.':s.lastBatch>=6?`${s.lastBatch} bottles in that cascade!`:'Swap neighbours · How to play has the guide';
 label(c,status,450,1076,21,'#596044');
 rewardBadge(s,d);
 reward(s,d,reduced);if(s.saveError){panel(c,450,600,710,150,'#f5e8d5fa','#c3826c');label(c,'Preview saving paused. Keep this window open.',450,600,24);}
}
const engine={
 title:'Mabel’s Milk Match',chapterEnds:true,
 intro:'Match the flavours, fill the crates, beat the dairy bell. Bigger matches and cascades make the deliveries fly.',
 instructions:`Swap neighbouring bottles to make a row or column of three matching flavours. Tap two neighbours or swipe one bottle towards another. Matched bottles drop into their flavour crates; six bottles fill a crate. The chapter card shows its crate target and time. Chapter 3 adds wooden packing blocks: match beside them to clear them. Strapped blocks from Chapter 4 need two nearby hits. Chapter 5 requires two crates of every flavour as well as the total target; Chapter 6 requires three of each. Empty corner shelves cannot hold bottles. Four in a row makes a striped bottle that clears a row or column; five makes a cream-star bottle that clears its swapped flavour. T/L matches make a fizzy burst. Cascades and clever bonus combinations help you fill crates faster. The clock starts when you first choose a bottle and pauses during forced board animations or Help. When the bell rings, bottles already matched finish landing and can still complete your target. No new swaps after the bell. Retry starts a fresh board and timer. Arrow keys move the cursor; Space selects/swaps. Each chapter saves separately. This local test uses NFT previews, no real purse or tokens.`,
 levels:LEVELS.map(sky=>sky.name),prizes:PRIZES,sprites:PRIZES,images:rewardImages,get houseSeconds(){return LEVELS[selected].seconds;},navigationKey:BOOK+'.selection',selectedChapter:()=>selected,
 reviewCopy:{keys:'Tap neighbours or swipe · match 3 · 4/5 make bonus bottles · arrows/Space · H help.',cost:'Free local test. Each chapter has its own saved timer and crate orders.',treasure:(s,level)=>`Chapter reward preview: ${itemName(PRIZES[level])} · ${collected[level]||s?.prizeKept?'Collected':'Locked until the crate target is delivered.'}`},
 create(level){const production=productionPlay();if(!LEVELS[level])throw Error('Choose a Milk Match chapter from 1 to 6.');loadArt();selected=level;const s=!production&&remembered.has(level)?restore(remembered.get(level),level):makeState(1703+level*379,level);s.practice=!production;bindPrize(s,PRIZES[level],{x:450,y:915,w:90,field:true});if(production?owned(PRIZES[level]):collected[level]){s.prizeKept=true;s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;}return s;},
 restoreState(blob){const restored=restore(blob,blob.level);return Object.assign(restored,blob,{board:restored.board});},
 persist,retryAttempt(s){const production=productionPlay();const next=makeState(s.seed+1013,s.level);next.practice=!production;checkpoint(next);return replayState(next,production);},clockRuns,
 onTimeout(s){timeUp(s);checkpoint(s);},
 update(s,dt){
  const production=productionPlay();
  if(s.result||s.saveError)return;const before=s.phase,sent=s.sent;step(s,dt);if((s.phase!==before||s.sent!==sent)&&!checkpoint(s))return;
  if(s.phase==='celebrate'){
   if(!s.completionRecorded){s.completionRecorded=true;if(!(production?s.prizeKept:collected[s.level])){if(production)keep(PRIZES[s.level],'milk-bottles');else collected[s.level]=true;takePrize(s,PRIZES[s.level],{x:450,y:915});s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;s.rewardReveal={id:PRIZES[s.level],t:0};s.celebrateLeft=3.9;}if(!checkpoint(s))return;}
   if(s.rewardReveal)s.rewardReveal.t+=dt;
   if(s.celebrateLeft<=0){s.phase='result';s.result={title:rules(s).name,detail:`${s.sent} full crates in ${s.moves} matches. NFT preview: Collected.`,won:true,prize:null,settle:true};checkpoint(s);}
  }
 },
 pointer(s,type,p){
  if(type==='cancel'){cancel(s);return;}if(s.result||s.saveError||s.phase!=='idle'||s.timeExpired)return;const cell=cellAtPoint(p,s);
  if(type==='down'&&cell){choose(s,cell);if(s.phase==='idle'&&canChoose(s,cell)){s.pressed=true;s.pressCell={...cell};}checkpoint(s);}
  else if(type==='move'&&s.pressed&&cell&&s.pressCell&&Math.abs(cell.c-s.pressCell.c)+Math.abs(cell.r-s.pressCell.r)===1){swap(s,s.pressCell,cell);cancel(s);checkpoint(s);}
  else if(type==='up'){cancel(s);checkpoint(s);}
 },
 key(s,k,down){if(!down||s.result||s.saveError||s.phase!=='idle'||s.timeExpired)return;const map={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]},delta=map[k];if(delta){s.started=true;s.cursor={c:Math.max(0,Math.min(4,s.cursor.c+delta[0])),r:Math.max(0,Math.min(s.board.rows-1,s.cursor.r+delta[1]))};}else if(k===' '||k==='Enter')choose(s,s.cursor);checkpoint(s);},
 draw,readout:s=>s.note,
};
engine.artReady=()=>art.length===5&&art.every(Boolean);
engine.instructions='Watch the complete easy example: two matches fill one strawberry crate, its lid closes and it rolls away, then a sample reward appears. Play Chapter 1 begins your own six-crate challenge. '+engine.instructions;
const exampleModel={
 makeState(){const s=makeState(1,0);s.demo=true;return s;},
 step(s,dt){
  if(s.demoRewardAge!==undefined){s.demoRewardAge+=dt;return;}
  step(s,dt);
  if(s.sent===1&&!s.pending.length&&!s.flights.length&&s.crates.every(c=>c.phase==='open')){
   s.phase='demo-finish';s.demoRewardAge=0;s.note='One full strawberry crate delivered. Demonstration only.';
  }
 },
};
function drawExample(s,d){
 draw(s,d);
 if(s.demoRewardAge===undefined)return;
 const c=d.c,id=PRIZES[0],t=s.demoRewardAge,turn=Math.max(0,t-.35)/3*4,i=Math.floor(turn)%4,mix=turn-Math.floor(turn);
 panel(c,450,560,600,470,'#fff3e4f7','#b4a477');
 label(c,'DEMONSTRATION COMPLETE',450,382,29,'#685836');
 label(c,'One full crate delivered',450,426,25);
 d.glow(450,565,140,'#ffe8a4');
 const a=d.art?.[`nft:${id}:${VIEWS[i]}`],b=d.art?.[`nft:${id}:${VIEWS[(i+1)%4]}`];
 if(a)d.sprite(a,450,565,{w:230,shadow:false,alpha:1-mix});
 if(b)d.sprite(b,450,565,{w:230,shadow:false,alpha:mix});
 if(!a&&!b)d.item(spriteKey(id),450,565,{w:230,shadow:false});
 label(c,'Sample chapter reward',450,706,24,'#78602f');
 label(c,'No reward or pennies collected',450,752,22,'#7a7656');
}
const first={c:4,r:0},firstTo={c:3,r:0},second={c:3,r:4},secondTo={c:2,r:4};
export default withChapterExample(engine,{
 model:exampleModel,draw:drawExample,captionY:170,hideHouseClock:true,
 hasSavedFirst:()=>remembered.has(0),
 canStart:s=>!s.timeExpired&&['idle','swap','burst','fall','reject'].includes(s.phase),
 steps:()=>[
  {caption:'Watch a whole easy round: fill ONE strawberry crate. Start with this strawberry bottle on the top shelf.',point:s=>cellCenter(first.c,first.r,s),run:s=>choose(s,first),after:1},
  {caption:'Swipe it left. Three strawberries line up DOWN the shelf, then fly into the strawberry crate.',path:s=>[cellCenter(first.c,first.r,s),cellCenter(firstTo.c,firstTo.r,s)],run:s=>swap(s,first,firstTo),done:s=>s.phase==='idle'&&!s.pending.length&&!s.flights.length&&s.crates[0].filled===3,after:1.2},
  {caption:'Three bottles are packed. Each crate needs SIX of its own flavour, so make one more strawberry match.',point:{x:CRATES[0].x,y:825},run:()=>{},after:1.4},
  {caption:'Choose this strawberry on the bottom shelf. Moving it left will join the other two.',point:s=>cellCenter(second.c,second.r,s),run:s=>choose(s,second),after:.8},
  {caption:'Swipe left again. Three more strawberry bottles drop into the SAME crate: six bottles fill it.',path:s=>[cellCenter(second.c,second.r,s),cellCenter(secondTo.c,secondTo.r,s)],run:s=>swap(s,second,secondTo),done:s=>s.crates[0].filled===CAPACITY,after:.1},
  {caption:'The full crate closes and rolls away. A delivery counts only after the crate has left the counter.',point:{x:CRATES[0].x,y:915},run:()=>{},done:s=>s.demoRewardAge!==undefined,after:.3},
  {caption:'The easy round is complete. This is the sample reward; your own chapter needs SIX full crate deliveries.',point:{x:450,y:565},run:()=>{},done:s=>s.demoRewardAge>=4.2,after:.2},
 ],
 finishCaption:'Your turn: match flavours and send SIX full crates before the Chapter 1 bell. Four, five and cascades help. This sample collected nothing.',
});
