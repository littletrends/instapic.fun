// Local-only study shell. Never connects to a real purse, mint or guest account.
import {alleyPlay,isVerifiedPlay,owned,keep} from '../wallet.js?v=insights-1';
import {kits,spriteKey,itemName} from '../prizes.js?v=nft-art-1';
import {bindPrize,takePrize} from '../chapter-kit.js?v=align-1';
export const PALETTE=['#be697f','#d4ad60','#6e9c88','#7e9fba'];
export const FLAVOUR_PALETTE=['#d48298','#7594b8','#e3bc75','#8bac92'];
const root=new URL('../assets/midnight-studies/',import.meta.url),sprites=[],sugars=[];let loading=false;
function loadSheet(name,columns,rows,target){
 const img=new Image();img.onload=()=>{for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const w=img.width/columns,h=img.height/rows,cell=document.createElement('canvas');cell.width=w;cell.height=h;
  const c=cell.getContext('2d',{willReadFrequently:true});c.drawImage(img,col*w,row*h,w,h,0,0,w,h);
  const bytes=c.getImageData(0,0,w,h).data;let x0=w,y0=h,x1=0,y1=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(bytes[(y*w+x)*4+3]>24){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  const crop=document.createElement('canvas');crop.width=x1-x0+3;crop.height=y1-y0+3;crop.getContext('2d').drawImage(cell,x0-1,y0-1,crop.width,crop.height,0,0,crop.width,crop.height);target[row*columns+col]=crop;
 }};img.src=new URL(name,root).href;
}
export function loadProps(){if(loading||typeof Image==='undefined')return;loading=true;loadSheet('props.png',3,2,sprites);loadSheet('sugar-layers.png',2,2,sugars);}
export const ready=()=>sprites.length===6&&sprites.every(Boolean)&&sugars.length===4&&sugars.every(Boolean);
export function prop(d,index,x,y,w,opts={}){if(sprites[index])d.sprite(sprites[index],x,y,{w,shadow:false,...opts});}
export function sugarLayer(d,index,x,y,w,opts={}){if(sugars[index])d.sprite(sugars[index],x,y,{w,shadow:false,...opts});}
export function text(c,value,x,y,size=24,colour='#4f3434',align='center'){
 c.save();size=Math.max(size,12*900/(c.canvas.clientWidth||450));c.font=`600 ${size}px Georgia,serif`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=colour;c.fillText(String(value),x,y,align==='center'?Math.max(90,Math.min(x,900-x)*2-24):900-x-16);c.restore();
}
export function paper(c,x,y,w,h,fill='#fff0d9',stroke='#ba9258',radius=18){
 c.save();c.shadowColor='#28152646';c.shadowBlur=10;c.shadowOffsetY=6;c.beginPath();c.roundRect(x-w/2,y-h/2,w,h,radius);c.fillStyle=fill;c.fill();c.shadowColor='transparent';c.strokeStyle=stroke;c.lineWidth=2;c.stroke();
 c.beginPath();c.roundRect(x-w/2+6,y-h/2+6,w-12,h-12,Math.max(3,radius-5));c.strokeStyle=stroke+'70';c.lineWidth=1;c.stroke();c.restore();
}
export function tag(c,colour,x,y,r=15){
 c.save();c.shadowColor='#40252a40';c.shadowBlur=4;c.fillStyle=colour;c.strokeStyle='#fff2d2';c.lineWidth=2;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.stroke();
 c.strokeStyle='#fff8e7';c.lineWidth=2;c.beginPath();c.moveTo(x-r*.4,y);c.lineTo(x+r*.4,y);c.moveTo(x,y-r*.4);c.lineTo(x,y+r*.4);c.stroke();c.restore();
}
export function button(c,title,x,y,w=200){paper(c,x,y,w,58,'#fff1d9','#af8652',12);text(c,title,x,y,25);}
export function header(c,title,detail,dark=false){compactHeader(c,title,detail,dark);}
export function footer(c,s,dark=false){compactFooter(c,s,dark);}
export function shortCue(value){
 const sentence=String(value||'').trim().split(/(?<=[.!?])\s+/)[0]||'';
 const words=sentence.split(/\s+/);return words.length>13?words.slice(0,13).join(' ').replace(/[,:;]$/,'')+'…':sentence;
}
// Presentation only; ownership and completion stay with the chapter engine.
export function compactHeader(c,title,detail,dark=false){
 paper(c,450,118,640,66,dark?'#182f39a6':'#fff0d9b3','#b997625c',10);
 text(c,title,450,104,26,dark?'#fff1cf':'#593e35');
 text(c,detail,450,136,21,dark?'#f4e2bd':'#624a3e');
}

export function compactFooter(c,s,dark=false){
 const width=628,size=Math.max(22,12*900/(c.canvas.clientWidth||450));
 c.save();c.font=`600 ${size}px Georgia,serif`;
 const lines=[];let line='';
 for(const word of shortCue(s.note).split(/\s+/)){
  const next=line?line+' '+word:word;
  if(line&&c.measureText(next).width>width){lines.push(line);line=word;}else line=next;
 }
 if(line)lines.push(line);
 const shown=lines.slice(0,2);
 if(lines.length>2){let last=shown[1];while(last&&c.measureText(last+'…').width>width)last=last.slice(0,-1);shown[1]=last.trimEnd()+'…';}
 c.restore();
 if(!shown.length)return;
 paper(c,450,1118,680,66,dark?'#173b399e':'#fff0d9ad','#b997625c',10);
 shown.forEach((value,i)=>text(c,value,450,1118+(i-(shown.length-1)/2)*27,22,dark?'#fff0cf':'#5c4339'));
}

export function paintRewardTurn(d,prize,age,{x=450,y=565,size=240,prefix='study'}={}){
 const views=['front','right','back','left'],turn=Math.max(0,Math.min(1,(age-.2)/3.2))*4;
 const index=Math.floor(turn),view=views[index%4],next=views[(index+1)%4],mix=turn-index;
 const a=d.art?.[prefix+':'+prize+':'+view],b=d.art?.[prefix+':'+prize+':'+next];
 if(a)d.sprite(a,x,y,{w:size,shadow:false,alpha:1-mix});
 if(b&&mix)d.sprite(b,x,y,{w:size,shadow:false,alpha:mix});
 if(!a&&!b)d.item(spriteKey(prize),x,y,{w:size,shadow:false});
}

export function paintChapterReward(s,d,{dark=false}={}){
 if(typeof document!=='undefined'&&document.querySelector('#chapter-prize:not([hidden])'))return;
 const prize=s.chapterPrize;
 if(s.demo||!prize||s.rewardReveal?.id===prize.id&&s.rewardReveal.t<=3.65)return;
 const x=829,image=d.art?.['study:'+prize.id+':front'],kept=!!s.prizeKept;
 paper(d.c,x,146,110,136,dark?'#182f39a6':'#fff0d9b3','#b997625c',10);
 text(d.c,'REWARD',x,94,18,dark?'#ffe3a0':'#795535');
 if(image)d.sprite(image,x,145,{w:72,h:72,shadow:false});
 else d.item(prize.key,x,145,{w:72,shadow:false});
 text(d.c,kept?'Collected':'Locked',x,197,20,dark?(kept?'#e4ffb5':'#fff2d4'):(kept?'#49633b':'#795535'));
}

function reveal(s,d,prize){
 if(!s.rewardReveal)return;const c=d.c,t=s.rewardReveal.t;if(t>3.65)return;
 prize=s.rewardReveal.id||prize;
 paper(c,450,570,590,500,'#fff0e7f7','#b28a4d');text(c,'CHAPTER REWARD · COLLECTED',450,380,27);text(c,itemName(prize),450,755,27);
 const turn=Math.max(0,t-.3)/2.5*4,i=Math.floor(turn)%4,j=(i+1)%4,mix=turn-Math.floor(turn),views=['front','right','back','left'];
 d.glow(450,565,160,'#f6cc8e');const a=d.art['study:'+prize+':'+views[i]],b=d.art['study:'+prize+':'+views[j]];
 if(a){d.sprite(a,450,565,{w:260,shadow:false,alpha:1-mix});if(b)d.sprite(b,450,565,{w:260,shadow:false,alpha:mix});}else d.item(spriteKey(prize),450,565,{w:250});
}
export function study(spec){
 const params=typeof location==='undefined'?new URLSearchParams():new URLSearchParams(location.search);
 const local=typeof location!=='undefined'&&['127.0.0.1','localhost'].includes(location.hostname)&&params.get('review')===spec.mode;
 const player=/^[a-zA-Z0-9_-]{1,48}$/.test(params.get('reviewPlayer')||'')?params.get('reviewPlayer'):'local';
 const BOOK='pf.review.'+spec.mode+'.v2:'+player,OLD='pf.review.'+spec.mode+'.v1:'+player,prizes=kits[spec.id].prizes;
 const saved=new Map(),collected=Array(6).fill(false),banked=Array(6).fill(0);let selected=0;
 if(local){
  let raw=localStorage.getItem(BOOK);const old=raw?null:localStorage.getItem(OLD),originalRaw=raw;
  const upgraded=spec.upgradeBook?.(JSON.parse(raw||old||'null'));
  if(upgraded)raw=JSON.stringify(upgraded);
  if(raw){const b=JSON.parse(raw);
   if(b.v!==2||!b.chapters||!Number.isInteger(b.selected)||b.selected<0||b.selected>5||![b.collected,b.banked].every(a=>Array.isArray(a)&&a.length===6)||b.collected.some(v=>typeof v!=='boolean')||b.banked.some(v=>!Number.isSafeInteger(v)||v<0))throw Error('Saved chapters need attention; they have not been reset.');
   for(const [key,blob] of Object.entries(b.chapters)){const level=Number(key);saved.set(level,spec.model.snapshot(spec.model.restore(blob,level)));}
   selected=b.selected;collected.splice(0,6,...b.collected);banked.splice(0,6,...b.banked);
  }else if(old){const b=JSON.parse(old);if(b.v!==1||typeof b.collected!=='boolean'||!Number.isSafeInteger(b.banked)||b.banked<0)throw Error('Earlier study save needs attention; it has not been reset.');
   saved.set(0,spec.model.snapshot(spec.model.restore(b.snapshot,0)));collected[0]=b.collected;banked[0]=b.banked;
  }
  if(spec.upgradeBook){
   if(upgraded&&raw!==originalRaw)localStorage.setItem(BOOK,raw);
   localStorage.setItem(BOOK+'.selection',String(selected));
  }
 }
 function persist(s){if(!s)return;if(alleyPlay){if(!isVerifiedPlay())throw Error('verified_game_required');return;}const blob=spec.model.snapshot(s);saved.set(s.level,blob);selected=s.level;
  if(local)try{localStorage.setItem(BOOK,JSON.stringify({v:2,selected,chapters:Object.fromEntries(saved),collected,banked,...spec.bookMetadata}));s.saveError=false;}catch(error){delete s.pointerDown;s.saveError=true;s.note='Saving paused. Keep this window open.';throw error;}}
 function checkpoint(s){try{persist(s);return true;}catch{return false;}}
 const images=Object.fromEntries(prizes.flatMap(prize=>['front','right','back','left'].map(view=>['study:'+prize+':'+view,new URL('../../assets/restyle/game-sprites/'+spriteKey(prize)+'/'+view+'.webp',import.meta.url).href])));
 return {
  title:spec.title,chapterEnds:true,levels:spec.model.LEVELS.map(r=>r.name),prizes,sprites:prizes,images,houseSeconds:0,
  intro:spec.intro,instructions:spec.instructions+' Six local chapters, each saved separately. Pennies and rewards are previews. U or Undo rewinds a decision; Help pauses.',
  navigationKey:BOOK+'.selection',selectedChapter:()=>selected,clockRuns:()=>false,artReady:ready,
  reviewCopy:{keys:spec.keys+' · U undo · H help · Esc pause · 1–6 chapter buttons.',cost:'Free local six-chapter test. No real purse, tokens or NFT collection.',treasure:(s,level=selected)=>itemName(prizes[level])+' · '+(collected[level]||s?.prizeKept?'Collected':'Locked until the chapter is completed.')+' · '+banked[level]+' test pennies.'},
  create(level){if(alleyPlay&&!isVerifiedPlay())throw Error('verified_game_required');if(!spec.model.LEVELS[level])throw Error('Choose a chapter from 1 to 6.');loadProps();selected=level;const prize=prizes[level],s=!alleyPlay&&saved.has(level)?spec.model.restore(saved.get(level),level):spec.model.makeState(level);s.practice=!alleyPlay;bindPrize(s,prize,{x:450,y:500,w:70,field:true});if(alleyPlay?owned(prize):collected[level]){s.prizeKept=true;s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;}return s;},
  restoreState(blob){const restored=spec.model.restore(blob,blob.level);return {...restored,...blob};},
  persist,retryAttempt(s){if(alleyPlay&&!isVerifiedPlay())throw Error('verified_game_required');const next=spec.model.makeState(s.level);next.practice=!alleyPlay;if(alleyPlay&&owned(prizes[s.level]))next.prizeKept=true;persist(next);return next;},
  releaseInput(s){delete s.pointerDown;},
  pointer(s,type,p){if(type==='cancel'){delete s.pointerDown;return;}if(s.saveError||s.result||s.phase==='celebrate')return;if(type==='down')s.pointerDown={x:p.x,y:p.y};if(type==='up'){const down=s.pointerDown;delete s.pointerDown;if(down&&Math.hypot(down.x-p.x,down.y-p.y)<35){if(p.y>990&&p.y<1065&&p.x<210)spec.model.undo(s);else spec.tap(s,p);checkpoint(s);}}},
  key(s,k,down){if(!down||s.saveError||s.result||s.phase==='celebrate')return;if(k.toLowerCase()==='u')spec.model.undo(s);else spec.key?.(s,k);checkpoint(s);},
  update(s,dt){if(alleyPlay&&!isVerifiedPlay())throw Error('verified_game_required');if(s.result||s.saveError)return;const phase=s.phase,motion=!!s.motion,active=!!s.active;spec.model.step(s,dt);
   if(s.phase==='celebrate'){
    const level=s.level,prize=prizes[level];
    if(!s.completionRecorded){s.completionRecorded=true;const collectedAlready=alleyPlay?(s.prizeKept||owned(prize)):collected[level];if(!collectedAlready){if(alleyPlay)keep(prize,spec.id);else collected[level]=true;takePrize(s,prize,{x:450,y:500});s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;s.rewardReveal={id:prize,t:0};}if(!alleyPlay){s.paidPennies+=s.pendingPennies;banked[level]+=s.pendingPennies;}s.pendingPennies=0;s.celebrateT=0;if(!checkpoint(s))return;}
    s.celebrateT+=dt;if(s.rewardReveal)s.rewardReveal.t+=dt;
    if(s.celebrateT>3.8){s.phase='result';s.result={title:spec.model.rules(s).name+' complete',detail:alleyPlay?s.moves+' decisions. Reward Collected.':s.moves+' decisions. '+s.paidPennies+' test pennies. Reward preview: Collected.',won:true,prize:null,settle:true};checkpoint(s);}
   }else if(s.phase!==phase||motion!==!!s.motion||active!==!!s.active)checkpoint(s);
  },
  draw(s,d){loadProps();spec.draw(s,d);reveal(s,d,prizes[s.level]);if(s.saveError){paper(d.c,450,600,680,160,'#783e48f5');text(d.c,'Saving paused. Keep this window open.',450,600,27,'#fff3da');}},readout:s=>s.note,
 };
}
