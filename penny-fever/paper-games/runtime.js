import {chapterOutcome} from './chapter-flow.js?v=chapter-menu-1';
import {byId} from './catalogue.js?v=milk-props-1';
import {Draw,seeded,clamp} from './draw.js?v=sep17-4';
import {loadSprites,frontUrl} from './sprites.js';
import {kits,spriteKey,itemName} from './prizes.js?v=dress-3j';
import {bindPrize,takePrize,stepPrize,paintPrize,PRIZE_FLY_TO} from './chapter-kit.js?v=align-1';
import {isClosed} from './stall-entry.js?v=entry-2';
const $=s=>document.querySelector(s), abort=new AbortController(),sig={signal:abort.signal};
const canvas=$('#world'),stage=$('#stage'),input={keys:new Set(),actions:new Set(),pointer:null,down:false};
let engine,state,draw,level=0,playing=false,ended=false,disposed=false,raf=0,last=0,paintAt=0,time=0,observer,reportAt=0;
let completion=null, adapterDismissed=false, navigationKey;
const holds=new Set();let resumeAfterHold=false;
const id=new URLSearchParams(location.search).get('stall'),entry=byId[id];
const embedded=window.parent!==window&&new URLSearchParams(location.search).get('room')==='alley';
const HOUSE={
 fortune:{seconds:100,title:'The globe went still',detail:'Iris covers the glass. Another gaze when you are ready.'},
 love:{seconds:240,title:'The tester slept',detail:'Rosalie blots the page. Another sitting when you are ready.'},
 curios:{seconds:180,title:'The cabinet closed',detail:'The drawers latch. Another mystery when you have a penny.'},
 lookup:{seconds:150,title:'The sky went quiet',detail:'Celeste covers the lantern. Another sitting when you are ready.'},
 snap:{seconds:45,title:'The shutter slept',detail:'Felix winds a fresh plate. Try this woodland again.'},
 whisper:{seconds:180,title:'The whisper slept',detail:'Willa folds the last envelope. Another run when you are ready.'},
 'ball-toss':{seconds:35,title:'The lanterns stay lit',detail:'Bess collects the rings. One more penny for another toss.'},
 'coin-pusher':{seconds:90,title:'Copper banks the trays',detail:'The falls sleep until the next penny. This shift is over.'},
 pinball:{seconds:75,title:'The table went dark',detail:'Pip kills the lights. Plunge another penny when you want the garden back.'},
 'water-gun':{seconds:45,title:'The harbour stills',detail:'Marina ties the boats. Try the channel again.'},
 'milk-bottles':{seconds:40,title:'The dairy closes',detail:'Mabel restacks the bottles. Another penny, another throw.'},
 'cover-the-spot':{seconds:40,title:'The moons drifted',detail:'Dot gathers the discs. Cover them again next go.'},
 mutoscope:{seconds:50,title:'The reel ran out',detail:'The picture never quite found its last frame.'},
 'high-striker':{seconds:30,title:'The bronze stays quiet',detail:'Magnus resets the hammer. Ring it on the next penny.'},
 catoptromancy:{seconds:50,title:'The gardens fogged',detail:'Opal polishes the glass. Step through again when it clears.'},
 'bent-rings':{seconds:40,title:'The orchard emptied',detail:'Ringo collects the rings. Another toss when you are ready.'},
 plinko:{seconds:50,title:'The mill stopped',detail:'Peggy locks the gates. Drop another marble next chapter.'},
 'fairy-floss':{seconds:50,title:'The spinner went quiet',detail:'Flossie winds a fresh cloud. Try the atelier again.'},
 popcorn:{seconds:50,title:'The kettle slept',detail:'Poppy banks the kernels. The symphony waits for another penny.'},
 'duck-pond':{seconds:55,title:'The parade went home',detail:'Dottie gathers the ducklings. Lead them again next go.'},
 'skee-ball':{seconds:40,title:'The moonbow faded',detail:'Skip racks the balls. One more penny for another roll.'},
 'penny-pitch':{seconds:40,title:'The wells went still',detail:'Penelope scoops the pennies. Skip them again next chapter.'},
 'dunk-tank':{seconds:35,title:'The seat stays dry',detail:'Duncan wrings the splash. Aim again when you are ready.'},
 marquee:{seconds:45,title:'The boardwalk dimmed',detail:'Lumi kills the wave. Conduct the lights on the next penny.'},
 pack:{seconds:80,title:'The suitcase snapped shut',detail:'Kit latches the lid. Pack again when you have another penny.'},
 pass:{seconds:60,title:'The curtain fell',detail:'Bea closes the fly loft. Slip through again next call.'},
 carousel:{seconds:40,title:'The waltz ended',detail:'The lantern dimmed before you caught enough treasures.'},
 balloons:{seconds:40,title:'The bunch drifted off',detail:'Nell is tying the next handful. Try this garden again.'},
 ferris:{seconds:40,title:'The wheel slowed',detail:'The crescent waited, and the cabins went home.'},
 helter:{seconds:30,title:'The mat is empty',detail:'The slide ran out before every gold ring was caught.'},
 swings:{seconds:35,title:'The chairs emptied',detail:'The front mat waited, and the flight ended.'},
 funhouse:{seconds:35,title:'The mirrors went dark',detail:'The real laugh hid in the shuffle.'},
 organ:{seconds:40,title:'The roll finished',detail:'A few notes wandered off the gold bar.'},
 mural:{seconds:50,title:'The paint dried',detail:'A few patches still forget the alley wall.'},
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
 $('#previous-chapter').disabled=!state||level<=0;
 $('#next-chapter').disabled=!state||level>=count-1;
 $('#chapter-name').textContent='Chapter '+(level+1);
 tellRoom('chapters',{id:entry.id,level,levels:engine.levels});
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
 const won=result.won!==false,canAdvance=result.advance!==false&&level<engine.levels.length-1;
 veil(won?'Chapter complete':'Round finished',result.title,result.detail,
   won&&canAdvance?'Next chapter':(engine.retryButton||'Play chapter again'),result.prize||null);
 $('#result-retry').hidden=!(won&&canAdvance);
 $('#result-retry').textContent=engine.retryButton||'Play chapter again';
 $('#result-next').hidden=won||!canAdvance;
 tellRoom('ended',{id:entry.id,level});
}

function stop(){playing=false;cancelAnimationFrame(raf);raf=0;last=0;clearInput();}
function pause(){if(!playing)return;persist();stop();veil('Take your time','The room is resting.','Nothing moves until you return.','Continue');$('#pause').textContent='Continue';}
function chapterKeep(){return engine?.prizes?.[level]||engine?.prizes?.[engine.prizes.length-1]||null;}
function plantChapter(s){
 if(!s)return s;
 const prize=chapterKeep();
 bindPrize(s,prize,(engine.live||engine.tables)?{field:true}:null);
 return s;
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
 const cash=$('#hud-cash'),keep=$('#hud-keep'),next=$('#next-chapter');
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
function paint(){if(!draw||!state)return;draw.clear();engine.draw(state,draw,time,input);paintPrize(state,draw);paintHud();}
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
 if(isClosed(entry.id)){
  document.title=entry.title+' · Penny Fever';
  $('#title').textContent=entry.title;
  $('#host').textContent=entry.host+"’s paper world";
  $('#intro').textContent=entry.blurb;
  $('#instructions').textContent='This booth is closed for maintenance. Come back later.';
  veil(entry.host,entry.title,'Closed for maintenance. Come back later.','Back to the map');
  $('#begin').disabled=false;
  listen($('#begin'),'click',()=>{
   if(embedded)tellRoom('leave',{id:entry.id});
   else location.href='../index.html?style=paper&rail=paper&paperMap=1#paper-map';
  });
  tellRoom('ready',{title:entry.title,closed:true});
 }else{
 engine=(await import(entry.module+'?v=florence-fix-1')).default;
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
 listen($('#previous-chapter'),'click',()=>goChapter(level-1));
 listen($('#next-chapter'),'click',goNextChapter);
 listen($('#restart'),'click',()=>{closeHelp();retryChapter();});
 listen($('#pause'),'click',closeHelp);
 listen($('#menu-toggle'),'click',openHelp);
 listen($('#menu-close'),'click',closeHelp);
 listen($('#game-help'),'close',()=>release('help'));
 listen($('#begin'),'click',()=>{if(!ended){start();return;}if(completion?.won!==false&&completion?.advance!==false&&level<engine.levels.length-1)goNextChapter();else retryChapter();});
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
   i.onload=()=>resolve(i);
   i.onerror=()=>resolve(null);
   i.src=new URL(src,import.meta.url).href;
  });
 }
 Promise.all([
  loadSprites(spriteIds.map(spriteKey)),
  Promise.all(Object.entries(engine.images||{}).map(async([k,src])=>[k,await loadImg(src)])),
 ]).then(([prizeArt, imagePairs])=>{
  if(disposed||!draw)return;
  const imageArt=Object.fromEntries(imagePairs.filter(([,img])=>img));
  draw.art={...prizeArt,...imageArt};
  paint();
 });
 }
}catch(e){error(e);}
