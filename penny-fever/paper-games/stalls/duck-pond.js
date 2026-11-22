import {withReleasedEngine} from '../engine-release.js';
/** Dottie — Ripple Rumble interaction study. Local review only; no live awards. */
import {kits,spriteKey,itemName} from '../prizes.js?v=nft-art-1';
import {bindPrize,takePrize} from '../chapter-kit.js?v=align-1';
import {alleyPlay,isVerifiedPlay,owned,keep} from '../wallet.js?v=insights-1';
import {claimNFT,packets,TOKEN_IDS,DOLLAR_IDS} from './duck-pond-economy.js?v=once-1';
import {FIELD,LEVELS,DRIPS,padPositions,flowAt,inside,makeState,splash,step,snapshot,restore} from './duck-pond-model.js?v=once-spin-4';
const PRIZES=kits['duck-pond'].prizes;
const ROOT=new URL('../assets/duck-pond/',import.meta.url);
const names=['01-large-duck.png','02-small-duck.png','03-lily-pad.png','04-water-lily.png','05-garland-fence.png','06-lantern-jetty.png'];
const art=[];let artStarted=false;
const params=typeof location==='undefined'?new URLSearchParams():new URLSearchParams(location.search);
const review=typeof location!=='undefined'&&['127.0.0.1','localhost'].includes(location.hostname)&&params.has('review');
const reviewer=/^[a-zA-Z0-9_-]{1,48}$/.test(params.get('reviewPlayer')||'')?params.get('reviewPlayer'):'local';
const BOOK='pf.review.duckRipple.v1:'+reviewer;
const remembered=new Map();
if(review){
  const raw=localStorage.getItem(BOOK);
  if(raw){const book=JSON.parse(raw);if(book.v!==1||!book.chapters)throw Error('Saved review needs attention; it has not been overwritten.');
    for(const [level,blob] of Object.entries(book.chapters))remembered.set(Number(level),snapshot(restore(blob,Number(level))));}
}
const VIEWS=['front','right','back','left'];
const rewardImages=Object.fromEntries(PRIZES.flatMap(id=>VIEWS.map(view=>[
 `nft:${id}:${view}`,new URL(`../../assets/restyle/game-sprites/${spriteKey(id)}/${view}.webp`,import.meta.url).href
])));

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
function sprite(d,i,x,y,w,opts={}){
  if(art[i])return d.sprite(art[i],x,y,{w,shadow:false,...opts});
  if(i<2){d.animal(x,y,'duck',w/65,0);return true;}
  if(i===2){d.ellipse(x,y,w*.46,w*.25,'#699b62','#d0dfa4',2);return true;}
  if(i===3){d.circle(x,y,w*.22,'#fff3cf','#eac479',2);return true;}
  return false;
}
function panel(c,x,y,w,h,fill='#123e38eb',stroke='#dab978'){
  c.beginPath();c.roundRect(x-w/2,y-h/2,w,h,22);c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=2;c.stroke();
}
function label(c,text,x,y,size=22,color='#fff2d4'){
  const readable=Math.max(size,12*900/(c.canvas.clientWidth||450));
  c.font=`600 ${readable}px Georgia,serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(text,x,y);
}
function wake(d,x,y,t,scale=1){
  const c=d.c;c.save();c.translate(x,y);c.scale(scale,scale);
  for(let i=0;i<3;i++){const u=(t*.6+i/3)%1;d.ellipse(0,5+u*15,24+u*31,7+u*10,null,`rgba(238,255,244,${(1-u)*.5})`,2);}
  c.restore();
}

function productionPlay(){const verified=isVerifiedPlay();if(alleyPlay&&!verified)throw Error('Verified play is required.');return verified;}
function replayState(s,production){if(production&&owned(PRIZES[s.level])){bindPrize(s,PRIZES[s.level]);s.prizeKept=true;s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;}return s;}
function persist(s){
 const production=productionPlay();if(!s||production)return;
 remembered.set(s.level,snapshot(s));
 if(review){
  try{localStorage.setItem(BOOK,JSON.stringify({v:1,chapters:Object.fromEntries(remembered)}));s.saveError=false;}
  catch(error){s.saveError=true;s.note='The review could not save. Play is paused; keep this window open.';throw error;}
 }
}
function checkpoint(s){try{persist(s);return true;}catch{return false;}}
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

function textLines(c,a,b,y){label(c,a,450,y,25);if(b)label(c,b,450,y+38,22,'#d5ebcc');}
function draw(s,d){
  loadArt();const c=d.c,cfg=LEVELS[s.level];
  const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t=reduced?0:s.t;
  ;;;
  ;
  label(c,s.phase==='celebrate'?'What a splash!':`${s.hits} / ${s.flowers.length} flowers awake`,450,227,27);
  c.save();c.beginPath();c.roundRect(166,275,568,668,70);c.clip();
  if(!reduced)for(let i=0;i<9;i++){
    const x=215+(i*131%480),y=300+(i*173%590),a=(Math.sin(t*1.5+i)+1)*.15;
    d.line({x:x-5,y},{x:x+5,y},`rgba(255,255,224,${a})`,2);
  }
  if(cfg.current)for(let row=0;row<4;row++)for(let col=0;col<3;col++){
    const x=280+col*160,y=375+row*145,flow=flowAt(s,x,y),mag=Math.hypot(flow.x,flow.y)||1;
    const u=reduced ? .5 : (s.t*.27+row*.2+col*.31)%1,dx=flow.x/mag,dy=flow.y/mag;
    d.line({x:x+dx*u*38,y:y+dy*u*38},{x:x+dx*(u*38+17),y:y+dy*(u*38+17)},'#e1fff45c',2);
  }
  for(const w of s.waves){
    const max=220+w.power*280,alpha=Math.max(0,1-w.r/max);
    for(let j=0;j<3;j++){
      const r=w.r-j*13;if(r<=0)continue;
      d.circle(w.x,w.y,r,null,w.source==='flower'?`rgba(255,224,139,${alpha*(.9-j*.2)})`:`rgba(222,255,251,${alpha*(.9-j*.2)})`,j===0?5:2);
    }
    if(!reduced)d.glow(w.x,w.y,Math.min(45,w.r),'#d1fff0');
  }
  for(const pad of padPositions(s)){wake(d,pad.x,pad.y,t,.8);sprite(d,2,pad.x,pad.y+Math.sin(t+pad.x)*2,pad.r*2.3,{angle:Math.sin(t)*.035});}
  for(const f of s.flowers){
    const age=s.t-f.hitAt,bob=Math.sin(t*2+f.id)*3;
    if(f.lit){d.glow(f.x,f.y,70,'#ffe39c');d.ellipse(f.x,f.y+12,44,17,null,'#f7e2a1b3',3);}
    sprite(d,3,f.x,f.y+bob,f.lit?101:88,{angle:f.lit&&!reduced?Math.sin(age*7)*Math.exp(-age*1.6)*.23:0});
    if(f.lit)d.star(f.x,f.y-48,12,'#ffe69f');
    else{
      d.circle(f.x,f.y+12,46,null,'#fff0b777',2);
      if(f.need>1){for(let ring=0;ring<f.need-1;ring++)d.circle(f.x,f.y+12,52+ring*6,null,'#ffe09cc9',3);panel(c,f.x,f.y+45,55,34,'#18493eeb');label(c,`${f.progress}/${f.need}`,f.x,f.y+45,20);}
    }
  }
  [...s.ducks].sort((a,b)=>a.y-b.y).forEach(p=>{
    const speed=Math.hypot(p.vx,p.vy);wake(d,p.x,p.y+15,t+p.id,speed>80?1.3:.8);
    c.save();c.translate(p.x,p.y);c.rotate(reduced?0:p.angle*.16);
    // The submerged lower edge and surface wake anchor the original prop in water.
    c.beginPath();c.rect(-90,-100,180,128);c.clip();
    sprite(d,p.id?1:0,0,-13+Math.sin(t*3+p.id)*3,p.id?89:110,{flip:p.vx<-12,angle:reduced?0:Math.sin(t*2+p.id)*.04});c.restore();
    d.ellipse(p.x,p.y+24,p.r,6,null,'#d9fff68c',2);
    if(p.flash>0&&!reduced)d.glow(p.x,p.y,55,'#ffedac');
  });
  for(const f of s.floats){
    const age=s.t-f.collectedAt;if(f.phase==='collected'&&age>1.1)continue;
    const collected=f.phase==='collected',u=collected?Math.min(1,age/1.1):0;
    const x=f.x+(805-f.x)*u*u,y=f.y+(125-f.y)*u*u;
    c.save();c.globalAlpha=collected?1-u*.8:1;
    if(!collected){d.glow(x,y,42,'#fff0b1');d.ellipse(x,y+16,31,10,null,'#ffedb9b3',2);}
    if(!d.sprite(d.art?.[spriteKey(f.id)],x,y,{w:collected?58*(1-u*.5):58,shadow:false,angle:collected?u*3:Math.sin(t*2+f.uid)*.1})){
      d.ball(x,y,22,'#e3bd6f');if(f.id==='star-token')d.star(x,y,13,'#fff1b6');
    }
    if(!collected){panel(c,x,y+39,89,32,'#173f36e8');label(c,f.quantity>=1000?`${Math.round(f.quantity/100)/10}k`:f.quantity,x,y+39,18,'#ffe4a0');}
    c.restore();
  }
  for(const p of s.particles){
    const alpha=Math.max(0,p.life/p.max);c.save();c.globalAlpha=alpha;
    if(p.kind==='gold')d.star(p.x,p.y,4+alpha*3,'#ffe6a2');else d.ellipse(p.x,p.y,3,5,'#ddfff3');c.restore();
  }
  if(s.hold){
    const p=s.hold,power=Math.min(1,.3+p.age*.8);
    d.circle(p.x,p.y,18+power*26,'#102f3740','#fff2bd',3);
    d.arc(p.x,p.y,54,-Math.PI/2,-Math.PI/2+Math.PI*2*power,'#ffe3a0',6);
    for(const duck of s.ducks){const dx=duck.x-p.x,dy=duck.y-p.y,len=Math.hypot(dx,dy);
      if(len>32&&len<290){const nx=dx/len,ny=dy/len,from={x:duck.x+nx*40,y:duck.y+ny*40},to={x:duck.x+nx*87,y:duck.y+ny*87};
        d.line(from,to,'#fff2b7b8',3);d.line(to,{x:to.x-nx*13-ny*8,y:to.y-ny*13+nx*8},'#fff2b7b8',3);d.line(to,{x:to.x-nx*13+ny*8,y:to.y-ny*13-nx*8},'#fff2b7b8',3);}
    }
  }else if(!s.started){
    const r=30+(Math.sin(t*2)+1)*10;d.circle(450,610,r,null,'#fff5c7c9',3);d.circle(450,610,9,'#fff4c3');
    ;;
  }
  c.restore();
  if(s.chain>1&&s.t<s.chainUntil){panel(c,450,945,410,57,'#7b5136e8');label(c,`${s.chain} FLOWER CHAIN`,450,945,27,'#ffecb6');}
  ;
  label(c,`${s.shots} ${s.shots===1?'splash':'splashes'}  ·  best chain ${s.bestChain}`,450,1010,27);
  ;
  ;
  const recent=s.finds.at(-1);
  ;
  nftReveal(s,d,reduced);
  if(s.saveError){panel(c,450,600,680,160,'#6c3431f5');textLines(c,'Preview save unavailable. Play is paused.','Keep this window open while saving retries.',580);}
}
function release(s,p){
  if(!s.hold)return;const h=s.hold;s.hold=null;
  if(splash(s,h,Math.min(1,.3+h.age*.8)))checkpoint(s);
}
const releaseEngine = {
  title:'Dottie’s Ripple Rumble',chapterEnds:true,
  intro:'A pond full of floating ducks, sleeping flowers and chain reactions. Make a splash and see what happens.',
  instructions:'Press the water and release to send out a ripple. Hold longer for more power. Ducks wake flowers by bumping them; each flower sends another wave. Ringed flowers show how many separate bumps they need: let the duck leave, then hit again. Later ponds add currents and moving lily bumpers. Token drips float in: bump them with a duck to collect each chapter allocation once. NFT rewards collect on chapter completion, once. Replaying preserves those collection records. Arrows move your splash point; hold/release Space to splash. This local preview uses a separate collection record and does not change your real purse.',
  levels:LEVELS.map(c=>c.name),prizes:PRIZES,sprites:[...PRIZES,...DRIPS,...DOLLAR_IDS],images:rewardImages,actions:[],houseSeconds:100,
  houseTitle:'The pond settles',houseDetail:'Try a different splash and see what it sets off.',
  create(level){
    const production=productionPlay();
    loadArt();const s=!production&&remembered.has(level)?restore(remembered.get(level),level):makeState(level);s.practice=!production;s.hold=null;
    bindPrize(s,PRIZES[level],{x:450,y:330,w:85,field:true});
    if(production?owned(PRIZES[level]):s.entitlement.rewardCollected){s.prizeKept=true;s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;}
    return s;
  },
  restoreState(blob){const restored=restore(blob,blob.level);return Object.assign(restored,blob);},
 persist,retryAttempt(s){const production=productionPlay();
    const next=makeState(s.level,s.entitlement,s.floats);next.practice=!production;
    next.legacyFinds=s.legacyFinds;next.legacyFloats=s.legacyFloats;
    persist(next);return replayState(next,production);
  },
  clockRuns:s=>s.started&&!s.result&&!s.saveError&&s.phase==='play',
  onTimeout(s){s.hold=null;s.phase='result';s.result={title:'The pond settles',detail:`${s.hits} flowers awake in ${s.shots} splashes. Try another angle.`,won:false,prize:null,settle:true};checkpoint(s);},
  update(s,dt){
    const production=productionPlay();
    if(s.result||s.saveError)return;
    const receipts=s.entitlement.receipts.length+s.entitlement.currencyCollected.length;step(s,dt);
    if(s.entitlement.receipts.length+s.entitlement.currencyCollected.length!==receipts&&!checkpoint(s))return;
    if(s.phase==='celebrate'){
      if(!s.completionRecorded){
        s.completionRecorded=true;
        if(claimNFT(s.entitlement)&&!(production&&s.prizeKept)){
          if(production&&!s.prizeKept)keep(PRIZES[s.level],'duck-pond');
          takePrize(s,PRIZES[s.level],{x:450,y:330});s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;
          s.rewardReveal={id:PRIZES[s.level],t:0};s.celebrateLeft=3.9;
        }
        if(!checkpoint(s))return;
      }
      if(s.rewardReveal)s.rewardReveal.t+=dt;
      if(s.celebrateLeft<=0){s.phase='result';s.result={title:'What a splash!',detail:`All ${s.flowers.length} flowers awake in ${s.shots} splashes. Best chain: ${s.bestChain}. NFT ${s.rewardReveal?'reward collected':'already Collected'}. Token drips do not refill. Local preview only.`,won:true,prize:null,settle:true};persist(s);}
    }
  },
  pointer(s,type,p){
    if(type==='cancel'){s.hold=null;return;}if(s.result||s.saveError||s.phase==='celebrate')return;
    if(type==='down'&&inside(p)){s.cursor={...p};s.hold={x:p.x,y:p.y,age:0};}
    if(type==='move'&&s.hold&&inside(p)){s.hold.x=p.x;s.hold.y=p.y;}
    if(type==='up'){release(s,p);}
  },
  key(s,key,down){
    if(s.result||s.saveError||s.phase==='celebrate')return;
    const move={ArrowLeft:[-24,0],ArrowRight:[24,0],ArrowUp:[0,-24],ArrowDown:[0,24]}[key];
    if(down&&move){s.cursor.x=Math.max(FIELD.left,Math.min(FIELD.right,s.cursor.x+move[0]));s.cursor.y=Math.max(FIELD.top,Math.min(FIELD.bottom,s.cursor.y+move[1]));return;}
    if(key===' '){if(down&&!s.hold)s.hold={...s.cursor,age:0};else if(!down)release(s,s.cursor);}
  },
  draw,readout:s=>s.note,
};

export default withReleasedEngine(releaseEngine,{game:"duck-pond",module:"duck-pond.js"});
