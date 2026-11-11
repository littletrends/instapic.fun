import {chapterOutcome} from './chapter-flow.js?v=chapter-tabs-1';
import {owned} from './wallet.js?v=insights-1';
import {byId} from './catalogue.js?v=load-fix-1';
import {Draw,seeded,clamp} from './draw.js?v=sep17-4';
import {loadSprite,frontUrl} from './sprites.js?v=load-fix-1';
import {kits,spriteKey,itemName} from './prizes.js?v=prize-hud-1';
import {bindPrize,takePrize,stepPrize,paintPrize,PRIZE_FLY_TO} from './chapter-kit.js?v=align-1';
import {isParkShut, loadParkDoors, parkDoorsLive, parkSign} from './park-doors.js?v=map-doors-3';
import {noteVisit} from './insights.js?v=insights-1';
const $=s=>document.querySelector(s), abort=new AbortController(),sig={signal:abort.signal};
const canvas=$('#world'),stage=$('#stage'),input={keys:new Set(),actions:new Set(),pointer:null,down:false};
let engine,state,draw,level=0,playing=false,ended=false,disposed=false,raf=0,last=0,paintAt=0,time=0,observer,reportAt=0;
let completion=null, adapterDismissed=false, navigationKey;
const holds=new Set();let resumeAfterHold=false;
const id=new URLSearchParams(location.search).get('stall'),entry=byId[id];
if (id) noteVisit(id);
const embedded=window.parent!==window&&new URLSearchParams(location.search).get('room')==='alley';
const HOUSE={
 fortune:{seconds:100,title:'The globe went still',detail:'Iris covers the glass. Another gaze when you are ready.'},
 love:{seconds:100,title:'The tester slept',detail:'Rosalie blots the page. Another sitting when you are ready.'},
 curios:{seconds:100,title:'The cabinet closed',detail:'Digby latches the glass. Another claw when you have a penny.'},
 lookup:{seconds:100,title:'The sky went quiet',detail:'Celeste covers the lantern. Another sitting when you are ready.'},
 snap:{seconds:45,title:'The shutter slept',detail:'Felix winds a fresh plate. Try this woodland again.'},
 whisper:{seconds:100,title:'The house closed',detail:'Willa covers the court. Stay on this chapter or visit the next.'},
 'ball-toss':{seconds:100,title:'The house closed',detail:'Bess covers the court. Stay on this chapter or visit the next.'},
 'coin-pusher':{seconds:90,title:'Copper banks the trays',detail:'The falls sleep until the next penny. This shift is over.'},
 pinball:{seconds:75,title:'The table went dark',detail:'Pip kills the lights. Plunge another penny when you want the garden back.'},
 'water-gun':{seconds:100,title:'The house closed',detail:'Marina covers the court. Stay on this chapter or visit the next.'},
 'milk-bottles':{seconds:100,title:'The dairy closes',detail:'Mabel restacks the bottles. Another penny, another throw.'},
 'cover-the-spot':{seconds:100,title:'The house closed',detail:'Dot covers the court. Stay on this chapter or visit the next.'},
 mutoscope:{seconds:100,title:'The house closed',detail:'Milo covers the court. Stay on this chapter or visit the next.'},
 'high-striker':{seconds:100,title:'The house closed',detail:'Magnus covers the court. Stay on this chapter or visit the next.'},
 catoptromancy:{seconds:100,title:'The house closed',detail:'Opal covers the court. Stay on this chapter or visit the next.'},
 'bent-rings':{seconds:100,title:'The house closed',detail:'Ringo covers the court. Stay on this chapter or visit the next.'},
 plinko:{seconds:100,title:'The house closed',detail:'Peggy covers the court. Stay on this chapter or visit the next.'},
 'fairy-floss':{seconds:100,title:'The house closed',detail:'Flossie covers the court. Stay on this chapter or visit the next.'},
 popcorn:{seconds:100,title:'The house closed',detail:'Poppy covers the court. Stay on this chapter or visit the next.'},
 'duck-pond':{seconds:100,title:'The house closed',detail:'Dottie covers the court. Stay on this chapter or visit the next.'},
 'skee-ball':{seconds:100,title:'The house closed',detail:'Skip covers the court. Stay on this chapter or visit the next.'},
 'penny-pitch':{seconds:100,title:'The house closed',detail:'Penelope covers the court. Stay on this chapter or visit the next.'},
 'dunk-tank':{seconds:100,title:'The house closed',detail:'Duncan covers the court. Stay on this chapter or visit the next.'},
 marquee:{seconds:100,title:'The house closed',detail:'Lumi covers the court. Stay on this chapter or visit the next.'},
 pack:{seconds:100,title:'The house closed',detail:'Kit covers the court. Stay on this chapter or visit the next.'},
 pass:{seconds:100,title:'The house closed',detail:'Bea covers the court. Stay on this chapter or visit the next.'},
 carousel:{seconds:100,title:'The waltz ended',detail:'The lanterns dimmed before the last lap. Race this chapter again.'},
 balloons:{seconds:100,title:'The house closed',detail:'Nell covers the court. Stay on this chapter or visit the next.'},
 ferris:{seconds:100,title:'The house closed',detail:'Jasper covers the court. Stay on this chapter or visit the next.'},
 helter:{seconds:100,title:'The mat is empty',detail:'The slide ran out before every gold ring was caught.'},
 swings:{seconds:100,title:'The house closed',detail:'Hugo covers the court. Stay on this chapter or visit the next.'},
 funhouse:{seconds:100,title:'The mirrors went dark',detail:'The real laugh hid in the shuffle.'},
 organ:{seconds:100,title:'The house closed',detail:'Otto covers the court. Stay on this chapter or visit the next.'},
 mural:{seconds:100,title:'The house closed',detail:'Arlo covers the court. Stay on this chapter or visit the next.'},
};
const HOUSE_FALLBACK={seconds:45,title:'The house closes',detail:'This go is over. Try the chapter again.'};
function houseSpec(){
 if(engine?.houseSeconds===0)return null;
 if(engine?.houseSeconds)return{seconds:engine.houseSeconds,title:engine.houseTitle||HOUSE_FALLBACK.title,detail:engine.houseDetail||HOUSE_FALLBACK.detail};
 return HOUSE[entry?.id]||HOUSE_FALLBACK;
}
function tellRoom(type,fields={}){if(embedded)window.parent.postMessage({channel:'pf-paper-world',type,...fields},location.origin);}
if(embedded)document.body.classList.add('is-alley-room');
function listen(el,event,fn,opts={}){el.addEventListener(event,fn,{passive:false,...opts,signal:abort.signal});}
function error(e){playing=false;cancelAnimationFrame(raf);$('#error').textContent='This workshop room could not open: '+e.message;$('#veil-title').textContent='The room needs attention';$('#veil-detail').textContent='Please try another paper world. Your Instapic sessions are not involved.';$('#begin').disabled=true;$('#pause').disabled=true;$('#veil').hidden=false;tellRoom('error');}
function showPrize(id){
 const img=$('#veil-prize'),cap=$('#veil-prize-name');
 if(!img)return;
 if(!id){img.hidden=true;if(cap)cap.hidden=true;img.removeAttribute('src');return;}
 const key=spriteKey(id),art=draw?.art?.[key];
 img.hidden=false;
 img.src=art?art.toDataURL():frontUrl(key);
 if(cap){cap.hidden=false;cap.textContent='Collected: '+itemName(id);}
}
function veil(tag,title,detail,button,prize){$('#result-retry').hidden=true;$('#result-next').hidden=true;const tagEl=$('#veil-tag'),titleEl=$('#veil-title'),detailEl=$('#veil-detail');const tagText=String(tag||'').trim(),titleText=String(title||'').trim(),detailText=String(detail||'').trim();tagEl.textContent=tagText;tagEl.hidden=!tagText;titleEl.textContent=titleText;titleEl.hidden=!titleText;detailEl.textContent=detailText;detailEl.hidden=!detailText;$('#begin').textContent=button;showPrize(prize||null);$('#veil').hidden=false;}
function clearInput(){input.keys.clear();input.actions.clear();input.down=false;if(state)engine?.pointer?.(state,'cancel',input.pointer||{x:450,y:1050},input);input.pointer=null;}
function persist(){try{engine?.persist?.(state);if(navigationKey)localStorage.setItem(navigationKey,String(level));}catch{}}
function hold(reason){if(holds.has(reason))return;if(!holds.size)resumeAfterHold=playing;holds.add(reason);persist();stop();}
function release(reason){if(!holds.has(reason))return;holds.delete(reason);if(!holds.size&&resumeAfterHold){resumeAfterHold=false;if(!ended)start();}}
function openHelp(){hold('help');$('#pause').textContent=resumeAfterHold?'Continue playing':'Close help';if(!$('#game-help').open)$('#game-help').showModal();}
function closeHelp(){$('#game-help').close();release('help');}
function publishChapter(){
 const count=engine?.levels?.length||0;
 const names=engine?.levels||[];
 document.querySelectorAll('.chapter-tab').forEach((btn)=>{
  const i=Number(btn.dataset.chapter);
  btn.hidden=i>=count;
  btn.disabled=!state||i>=count;
  btn.setAttribute('aria-pressed',String(i===level));
  btn.title=names[i]||('Chapter '+(i+1));
 });
 const name=$('#chapter-name');
 if(name)name.textContent='Chapter '+(level+1)+(names[level]?(' · '+names[level]):'');
 tellRoom('chapters',{id:entry.id,level,levels:engine.levels});
 paintChapterPrize();
}
function goChapter(target){
 if(!Number.isInteger(target)||target<0||target>=engine.levels.length||target===level)return;
 if($('#game-help').open){resumeAfterHold=false;closeHelp();}
 persist();
 level=target;
 reset();
 // Choosing a chapter is an explicit request to enter that chapter. Keep the
 // board visible and ready instead of leaving the new chapter behind Begin.
 start();
 persist();
}
function retryChapter(){
 completion=null;ended=false;adapterDismissed=['coin-pusher','pinball'].includes(entry.id);
 if(entry.id==='fortune'){engine.action(state,'gaze');start();}
 else if(engine.retryAttempt){
  // Clear persisted sitting, then remount so Play again never reopens the old result veil.
  engine.retryAttempt(state);
  reset();
  start();
 }
 else if(entry.id==='coin-pusher'||entry.id==='pinball'){start();}
 else {reset();start();}
 persist();
}
function finishChapter(result){
 completion=result;ended=true;persist();stop();paint();
 const won=result.won!==false,canAdvance=level<engine.levels.length-1;
 const retry=String(engine.retryButton||'');
 const charge=retry.match(/(?:·|—)\s*(.+)$/);
 const stayLabel=won
  ?(charge?'Stay on this chapter · '+charge[1]:'Stay on this chapter')
  :(engine.retryButton||'Try this chapter again');
 veil(won?'Chapter complete':'Round finished',result.title,result.detail,stayLabel,result.prize||null);
 $('#result-retry').hidden=true;
 $('#result-next').hidden=!canAdvance;
 $('#result-next').textContent='Next chapter';
 tellRoom('ended',{id:entry.id,level});
}

function stop(){playing=false;cancelAnimationFrame(raf);raf=0;last=0;clearInput();}
function pause(){if(!playing)return;persist();stop();veil('Take your time','The room is resting.','Nothing moves until you return.','Continue');$('#pause').textContent='Continue';}
function chapterKeep(){return engine?.prizes?.[level]||engine?.prizes?.[engine.prizes.length-1]||null;}
function plantChapter(s){
 if(!s)return s;
 const prize=chapterKeep();
 bindPrize(s,prize,{field:true});
 return s;
}
function prizeUnlocked(id){
 if(!id)return false;
 if(state?.prizeKept||state?.won||state?.paid)return true;
 try{if(owned(id))return true;}catch{}
 return false;
}
let lastBonusPaint='';
function paintChapterPrize(){
 const box=$('#chapter-prize'),img=$('#chapter-prize-art'),stamp=$('#chapter-prize-stamp');
 if(!box)return;
 if(entry?.id==='snap'){
  if(lastBonusPaint!=='snap'){lastBonusPaint='snap';box.hidden=true;tellRoom('bonus',{id:'snap',item:null,unlocked:false});}
  return;
 }
 const id=chapterKeep();
 const unlocked=prizeUnlocked(id);
 const token=(id||'')+'|'+(unlocked?'1':'0');
 if(token===lastBonusPaint)return;
 lastBonusPaint=token;
 if(!id){box.hidden=true;tellRoom('bonus',{id:entry?.id,item:null,unlocked:false});return;}
 const name=itemName(id);
 box.hidden=false;
 box.classList.toggle('is-unlocked',unlocked);
 box.classList.toggle('is-locked',!unlocked);
 box.title=name+' · '+(unlocked?'Unlocked':'Locked');
 if(img){img.alt=name;img.src=frontUrl(spriteKey(id));}
 if(stamp)stamp.textContent=unlocked?'Unlocked':'Locked';
 tellRoom('bonus',{id:entry.id,item:id,name,unlocked,key:spriteKey(id)});
}
function handPrize(id,from){
 const item=id||state?.chapterPrize?.id||state?.prizeId||chapterKeep();
 if(!item||state?.prizePosted)return;
 state.prizePosted=true;
 const p=state.chapterPrize;
 tellRoom('prize',{
  item,stall:entry.id,chapter:level,celebrate:false,fly:true,
  x:from?.x??p?.x??PRIZE_FLY_TO.x,y:from?.y??p?.y??PRIZE_FLY_TO.y,
 });
}
function penniesNow(){
 try{if(embedded&&window.parent?.PennyFever?.pennies)return Number(window.parent.PennyFever.pennies())||0;}catch{}
 return state?.ammo??0;
}
function wonPurse(){
 try{return Number(window.parent?.PennyFever?.getState?.()?.paperInventory?.items?.['penny-purse']||0)>0;}catch{return false;}
}
function paintHud(){
 const cash=$('#hud-cash'),keep=$('#hud-keep');
 const practice=!!state?.practice;
 if(cash){
  const n=penniesNow();
  if(embedded) cash.textContent=wonPurse()?(n+' '+(n===1?'penny':'pennies')+' in the purse'):(n+' '+(n===1?'penny':'pennies'));
  // Lorie 5f: workshop funhouse is non-practice — never leave a Practice cash pill after Begin.
  else if(entry?.id==='funhouse' && state && !practice) cash.textContent=(n? (n+' '+(n===1?'penny':'pennies')) : 'Eligible');
  else cash.textContent='Practice';
 }
 if(keep){
  const prize=chapterKeep();
  keep.textContent=prize?('Chapter treasure · '+itemName(prize)):'';
 }
 const mode=$('#hud-mode');
 if(mode){
  mode.hidden=!practice;
  mode.textContent=practice?'Practice — no items awarded':'';
 }
 const clock=$('#hud-house');
 if(clock){
  const house=houseSpec();
  if(house&&state&&state.houseLeft!=null&&playing){
   clock.hidden=false;
   clock.textContent=Math.max(0,Math.ceil(state.houseLeft))+'s';
  }else{clock.hidden=true;clock.textContent='';}
 }

}
function paint(){if(!draw||!state)return;draw.clear();engine.draw(state,draw,time,input);paintPrize(state,draw);paintHud();paintChapterPrize();}
function goNextChapter(){goChapter(level+1);}
function markChapters(){}
function reset(){stop();ended=false;completion=null;adapterDismissed=false;time=0;state=plantChapter(engine.create(level,seeded(1703+level*297)));const house=houseSpec();if(state&&house&&state.houseLeft==null)state.houseLeft=house.seconds;paint();$('#readout').textContent=engine.readout?.(state)||'';markChapters();veil('','','','Play chapter '+(level+1));$('#begin').disabled=false;$('#pause').textContent='Continue';publishChapter();}
function start(){if(disposed||!engine||!state||playing||ended||holds.size)return;ended=false;$('#veil').hidden=true;playing=true;last=0;$('#pause').textContent='Pause';canvas.focus({preventScroll:true});raf=requestAnimationFrame(tick);}
function resultPrize(r, won){
 const list=engine.prizes||kits[entry.id]?.prizes||[];
 if(r && Object.prototype.hasOwnProperty.call(r,'prize')) return r.prize || null;
 return won ? (list[level]||list[list.length-1]||null) : null;
}
function tick(now){
 if(!playing||disposed)return;
 try{
  if(!last)last=now;const dt=Math.min(.05,(now-last)/1000);last=now;time+=dt;
  // Allow an earned prize to reach Treasures before opening the result panel.
  if(!completion)engine.update?.(state,dt,input);
  const house=houseSpec();
  if(!completion&&house&&!state.result&&(engine.clockRuns?.(state)??true)){
   if(state.houseLeft==null)state.houseLeft=house.seconds;
   state.houseLeft-=dt;
   if(state.houseLeft<=0){state.houseLeft=0;if(engine.onTimeout)engine.onTimeout(state);else state.result={title:house.title,detail:house.detail,won:false};}
  }
  const outcome=completion||chapterOutcome(entry.id,state,adapterDismissed);
  if(outcome&&!completion){
   completion={...outcome};
   // Engines with their own receipts already awarded their prizes.
   if(!outcome.handled&&!outcome.settle&&outcome.won!==false&&!state.practice){
    completion.prize=resultPrize(outcome,true);
    if(completion.prize)takePrize(state,completion.prize);
   }
  }
  stepPrize(state,dt);
  if(state.prizeDeliver){state.prizeDeliver=false;if(!['fortune','coin-pusher','pinball','milk-bottles'].includes(entry.id)&&!completion?.handled&&!state.practice)handPrize();}
  if(now-paintAt>1000/30){paintAt=now;paint();}
  if(now-reportAt>350){reportAt=now;$('#readout').textContent=engine.readout?.(state)||'';}
  const animating=state.chapterPrize&&['pop','spin','fly'].includes(state.chapterPrize.phase);
  if(completion&&!animating){finishChapter(completion);return;}
  raf=requestAnimationFrame(tick);
 }catch(e){error(e);}
}
function point(e){const b=canvas.getBoundingClientRect();return{x:clamp((e.clientX-b.left)/b.width*900,0,900),y:clamp((e.clientY-b.top)/b.height*1200,0,1200)};}
function move(e,type){if(e.cancelable)e.preventDefault();if(!playing)return;const p=point(e);input.pointer=p;if(type==='down'){input.down=true;try{canvas.setPointerCapture(e.pointerId);}catch(_){}}if(type==='up'||type==='cancel')input.down=false;engine.pointer?.(state,type,p,input);paint();}
function dispose(){if(disposed)return;persist();disposed=true;stop();observer?.disconnect();abort.abort();engine?.dispose?.(state);draw?.dispose();$('#backdrop').removeAttribute('src');}
try{
 if(!entry?.ready||entry.direct)throw Error('Choose an available new game from the workshop list.');
 await loadParkDoors();
 if(embedded && parkDoorsLive() && isParkShut(entry.id)){
  document.title=entry.title+' · Penny Fever';
  $('#title').textContent=entry.title;
  $('#host').textContent=entry.host+"’s paper world";
  const sign=parkSign(entry.id, entry.host);
  $('#intro').textContent=entry.blurb;
  $('#instructions').textContent=sign;
  veil(entry.host,entry.title,sign,'Back to the alley');
  $('#begin').disabled=false;
  listen($('#begin'),'click',()=>{
   tellRoom('leave',{id:entry.id});
  });
  tellRoom('ready',{title:entry.title,closed:true});
 }else{
 engine=(await import(entry.module+'?allocation=treasure-design-1&v=juno-prize-1')).default;
 navigationKey=(embedded?'pennyFever':'pf.practice')+'.chapterSelection.v1:'+entry.id;
 try{level=Number(localStorage.getItem(navigationKey)??engine.selectedChapter?.()??0);}catch{level=engine.selectedChapter?.()||0;}
 if(!Number.isInteger(level)||level<0||level>=engine.levels.length)level=0;
 document.title=engine.title+' · Penny Fever';$('#title').textContent=engine.title;$('#host').textContent=entry.host+'’s paper world';$('#intro').textContent=engine.intro;$('#instructions').textContent=engine.instructions;canvas.setAttribute('aria-label',engine.title+'. '+engine.instructions);
 // Lorie 5f: funhouse mode-note for workshop (#mode-note) AND embedded — not only alley.
 {
  const note=$('#mode-note')||document.querySelector('.note');
  if(note){
   if(entry.id==='funhouse'){
    note.textContent=embedded
     ?'Alley ride. Straight into eligible maze — no practice chapter. Later goes cost one penny from the purse.'
     :'Straight into eligible maze — no practice chapter. Mouse, touch and keyboard are listed above. Leaving or hiding this page pauses the room.';
   }else if(embedded){
    note.textContent=entry.id==='coin-pusher'?'Three trays. Drop a penny or dump the pocket. The machine sleeps until you drop, and the trays are saved when you leave. Cash a booth ticket for a five-penny stack.':entry.id==='pinball'?'Six cabinets. A penny pulls the plunger. Tap the flippers. Pennies and stars drip back; uniques almost never leave the glass, and even the small wins dry up. Cash a booth ticket for a five-penny stack.':entry.id==='milk-bottles'?'A penny a bead. Two or three throws. Knock every bottle for this dairy’s prize. Cash a booth ticket for a five-penny stack.':entry.id==='skee-ball'?'A penny a roll. Land the hanging moon for this chapter’s prize. Stars drip from the silver cups. Cash a booth ticket for a five-penny stack.':['carousel','organ','helter','ferris','swings','balloons','mural'].includes(entry.id)?'Alley ride. First go of this chapter is free practice and keeps nothing. Later goes cost one penny from the purse.':'A penny sits you down. Extra plays inside some rooms cost another penny. Cash a ticket on the bar for a five-penny stack. Workshop practice from All games stays free and writes nothing.';
   }
  }
 }
 draw=new Draw(canvas);draw.art={};
 const kit=kits[entry.id]||{sprites:[],prizes:[]};
 engine.prizes=(kit.prizes&&kit.prizes.length)?kit.prizes:(engine.prizes||[]);
 const spriteIds=[...new Set([...(engine.sprites||kit.sprites||[]),...engine.prizes])];
 observer=new ResizeObserver(()=>{const b=stage.getBoundingClientRect();draw.resize(b.width,b.height,devicePixelRatio||1);paint();});observer.observe(stage);
 document.querySelectorAll('.chapter-tab').forEach((btn)=>{
  listen(btn,'click',()=>goChapter(Number(btn.dataset.chapter)));
 });
 listen($('#restart'),'click',()=>{closeHelp();retryChapter();});
 listen($('#pause'),'click',closeHelp);
 listen($('#menu-toggle'),'click',openHelp);
 listen($('#menu-close'),'click',closeHelp);
 listen($('#game-help'),'close',()=>release('help'));
 listen($('#begin'),'click',()=>{if(!ended){start();return;}retryChapter();});
 listen($('#result-retry'),'click',retryChapter);
 listen($('#result-next'),'click',goNextChapter);
 const saveTimer=setInterval(()=>{if(playing)persist();},1000);
 listen(window,'pagehide',()=>clearInterval(saveTimer));
 for(const type of ['down','move','up','cancel'])listen(canvas,'pointer'+type,e=>move(e,type),{passive:false});
 listen(canvas,'contextmenu',e=>e.preventDefault());
 listen(stage,'touchmove',e=>{if(e.cancelable)e.preventDefault();},{passive:false});
 // Sticky-seize fix: lost capture / window blur always release maze stick (knob snaps home).
 listen(canvas,'lostpointercapture',e=>{if(!playing)return;input.down=false;engine?.pointer?.(state,'cancel',input.pointer||point(e)||{x:450,y:1136},input);input.pointer=null;paint();});
 listen(window,'blur',()=>{if(!playing)return;clearInput();paint();});
 listen(window,'keydown',e=>{
  if(!playing||e.repeat)return;
  const tag=e.target?.tagName;
  if(tag==='SELECT'||tag==='INPUT'||tag==='TEXTAREA'||tag==='BUTTON'||tag==='A')return;
  const k=e.key;
  const gameKey=k.length===1||['Backspace','Tab','Enter','Escape','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(k);
  if(!gameKey)return;
  e.preventDefault();
  input.keys.add(k);
  if(k==='Escape')openHelp();
  else engine.key?.(state,k,true,input);
  paint();
 });
 listen(window,'keyup',e=>{input.keys.delete(e.key);if(playing)engine.key?.(state,e.key,false,input);});
 const actBox=$('#actions');if(actBox){actBox.hidden=true;actBox.replaceChildren();}
 const hud=$('#hud');if(hud)hud.hidden=true;
 listen(document,'visibilitychange',()=>document.hidden?hold('visibility'):release('visibility'));
 listen(window,'message',e=>{
  if(e.origin!==location.origin||e.source!==window.parent)return;
  const d=e.data;if(!d||d.channel!=='pf-paper-world')return;
  if(d.type==='pause')hold('parent');
  if(d.type==='resume')release('parent');
  if(d.type==='menu')openHelp();
  if(d.type==='chapter')goChapter(d.level);
 });
 listen(window,'pagehide',dispose);listen(window,'pageshow',e=>{if(e.persisted)location.reload();});
 const img=$('#backdrop');
 img.hidden=false;
 img.src=entry.asset;
 img.decode().catch(()=>{img.removeAttribute('src');img.hidden=true;});
 if(!disposed){reset();for(const id of ['pause','restart'])$('#'+id).disabled=false;publishChapter();tellRoom('ready',{title:engine.title});}
 function loadImg(src){
  return new Promise(resolve=>{
   const i=new Image();
   i.decoding='async';
   i.onload=()=>resolve(i);
   i.onerror=()=>resolve(null);
   i.src=new URL(src,import.meta.url).href;
  });
 }
 function putArt(key,img){
  if(disposed||!draw||!key||!img)return;
  draw.art[key]=img;
  paint();
 }
 const prizeFirst=spriteKey(engine.prizes?.[level]||engine.prizes?.[0]||'');
 const prizeKeys=[prizeFirst,...spriteIds.map(spriteKey).filter(k=>k&&k!==prizeFirst)];
 for(const key of prizeKeys) loadSprite(key).then(img=>putArt(key,img));
 // A few engines draw prizes by item ID rather than by collection path.
 for(const prize of (engine.prizes||[])) loadSprite(spriteKey(prize)).then(img=>putArt(prize,img));
 for(const [k,src] of Object.entries(engine.images||{})) loadImg(src).then(img=>putArt(k,img));
 }
}catch(e){error(e);}
