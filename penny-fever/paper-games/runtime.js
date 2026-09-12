import {games,byId} from './catalogue.js?v=florence-1';
import {Draw,seeded,clamp} from './draw.js?v=ink-1';
import {loadSprites,frontUrl} from './sprites.js';
import {kits,spriteKey,itemName} from './prizes.js?v=mint-1';
import {bindPrize,takePrize,stepPrize,paintPrize,PRIZE_FLY_TO} from './chapter-kit.js?v=align-1';
const $=s=>document.querySelector(s), abort=new AbortController(),sig={signal:abort.signal};
const canvas=$('#world'),stage=$('#stage'),input={keys:new Set(),actions:new Set(),pointer:null,down:false};
let engine,state,draw,level=0,playing=false,ended=false,disposed=false,raf=0,last=0,paintAt=0,time=0,observer,reportAt=0;
const id=new URLSearchParams(location.search).get('stall'),entry=byId[id];
const embedded=window.parent!==window&&new URLSearchParams(location.search).get('room')==='alley';
const HOUSE={
 fortune:{seconds:50,title:'The cards rest',detail:'Iris closes the deck. Another penny, another reading.'},
 love:{seconds:40,title:'The glass cooled',detail:'Rosalie wipes the tester. Write the names again when you are ready.'},
 curios:{seconds:75,title:'The beetle wound down',detail:'Digby tucks the menagerie in. Another penny, another wander.'},
 lookup:{seconds:70,title:'The sky went quiet',detail:'The glasses fogged before every star woke.'},
 snap:{seconds:45,title:'The shutter slept',detail:'Felix winds a fresh plate. Try this woodland again.'},
 whisper:{seconds:60,title:'Last post',detail:'Willa closes the pigeonholes. The next cabinet waits.'},
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
 swings:{seconds:35,title:'The chairs emptied',detail:'The front mat waited, and the waltz ended.'},
 funhouse:{seconds:35,title:'The mirrors went dark',detail:'The real laugh hid in the shuffle.'},
 organ:{seconds:40,title:'The roll finished',detail:'A few notes wandered off the gold bar.'},
 mural:{seconds:50,title:'The paint dried',detail:'A few patches still forget the alley wall.'},
};
const HOUSE_FALLBACK={seconds:45,title:'The house closes',detail:'This go is over. Try the chapter again.'};
function houseSpec(){
 if(engine?.houseSeconds)return{seconds:engine.houseSeconds,title:engine.houseTitle||HOUSE_FALLBACK.title,detail:engine.houseDetail||HOUSE_FALLBACK.detail};
 return HOUSE[entry?.id]||HOUSE_FALLBACK;
}
function tellRoom(type,fields={}){if(embedded)window.parent.postMessage({channel:'pf-paper-world',type,...fields},location.origin);}
if(embedded)document.body.classList.add('is-alley-room');
function listen(el,event,fn,opts={}){el.addEventListener(event,fn,{...opts,signal:abort.signal});}
function error(e){playing=false;cancelAnimationFrame(raf);$('#error').textContent='This workshop room could not open: '+e.message;$('#veil-title').textContent='The room needs attention';$('#veil-detail').textContent='Please try another paper world. Your Instapic sessions are not involved.';$('#begin').disabled=true;$('#pause').disabled=true;$('#veil').hidden=false;tellRoom('error');}
function showPrize(id){
 const img=$('#veil-prize'),cap=$('#veil-prize-name');
 if(!img)return;
 if(!id){img.hidden=true;if(cap)cap.hidden=true;img.removeAttribute('src');return;}
 const key=spriteKey(id),art=draw?.art?.[key];
 img.hidden=false;
 img.src=art?art.toDataURL():frontUrl(key);
 if(cap){cap.hidden=false;cap.textContent='Kept for later: '+itemName(id);}
}
function veil(tag,title,detail,button,prize){$('#veil-tag').textContent=tag;$('#veil-title').textContent=title;$('#veil-detail').textContent=detail;$('#begin').textContent=button;showPrize(prize||null);$('#veil').hidden=false;}
function clearInput(){input.keys.clear();input.actions.clear();input.down=false;if(state)engine?.pointer?.(state,'cancel',input.pointer||{x:450,y:1050},input);input.pointer=null;}
function persist(){try{engine?.persist?.(state);}catch{}}
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
 if(cash){
  const n=penniesNow();
  if(embedded) cash.textContent=wonPurse()?(n+' '+(n===1?'penny':'pennies')+' in the purse'):(n+' '+(n===1?'penny':'pennies'));
  else cash.textContent='Practice';
 }
 if(keep){
  const prize=chapterKeep();
  keep.textContent=prize?('Keep · '+itemName(prize)):'';
 }
 const clock=$('#hud-house');
 if(clock){
  const house=houseSpec();
  if(house&&state&&state.houseLeft!=null&&playing){
   clock.hidden=false;
   clock.textContent=Math.max(0,Math.ceil(state.houseLeft))+'s';
  }else{clock.hidden=true;clock.textContent='';}
 }
 if(next){
  const last=!engine?.levels||level>=engine.levels.length-1;
  next.disabled=last;
  next.textContent=last?'Last chapter':'Next chapter';
 }
}
function paint(){if(!draw||!state)return;draw.clear();engine.draw(state,draw,time,input);paintPrize(state,draw);paintHud();}
function goNextChapter(){
 if(!engine?.levels||level>=engine.levels.length-1)return;
 persist();
 level+=1;
 if($('#chapter'))$('#chapter').value=level;
 reset();
 start();
}
function markChapters(){if(!engine?.levels)return;[...$('#chapter').options].forEach((o,i)=>{const prize=engine.prizes?.[i];let tick='';try{if(prize&&window.parent?.PennyFever?.getState?.()?.paperInventory?.items?.[prize])tick=' ✓';}catch{}o.textContent=(i+1)+'. '+engine.levels[i]+tick;});}
function reset(){stop();ended=false;time=0;state=plantChapter(engine.create(level,seeded(1703+level*297)));const house=houseSpec();if(state&&house)state.houseLeft=house.seconds;paint();$('#readout').textContent=engine.readout?.(state)||'';markChapters();const name=engine.levels[level];if(engine.tables)veil(entry.host+' presents',name,engine.tableDetail||'A new set on this table. Walk away whenever you like — this chapter keeps. Dump the purse and the bank is patient.','Step inside');else if(embedded&&engine.live)veil(entry.host+' presents',engine.liveTitle||engine.title,engine.liveDetail||engine.instructions,engine.liveButton||'Step inside');else veil(entry.host+' presents',name,engine.instructions,'Begin chapter');$('#begin').disabled=false;$('#pause').textContent='Pause';}
function start(){if(disposed||!engine||!state||playing)return;if(ended&&!engine.live)reset();ended=false;$('#veil').hidden=true;playing=true;last=0;$('#pause').textContent='Pause';canvas.focus({preventScroll:true});raf=requestAnimationFrame(tick);}
function swallowWin(r){
 const list=engine.prizes||kits[entry.id]?.prizes||[];
 const prize=r.prize||list[level]||list[list.length-1];
 if(r.won===false||!prize)return false;
 takePrize(state,prize);
 delete state.result;
 return true;
}
function tick(now){if(!playing||disposed)return;try{if(!last)last=now;const dt=Math.min(.05,(now-last)/1000);last=now;time+=dt;engine.update?.(state,dt,input);const house=houseSpec();if(house&&state&&!state.result){if(state.houseLeft==null)state.houseLeft=house.seconds;state.houseLeft-=dt;if(state.houseLeft<=0){state.houseLeft=0;state.result={title:house.title,detail:house.detail,won:false};}}stepPrize(state,dt);if(state.prizeDeliver){state.prizeDeliver=false;handPrize();}if(now-paintAt>1000/30){paintAt=now;paint();}if(now-reportAt>350){reportAt=now;const text=engine.readout?.(state)||'';if($('#readout').textContent!==text)$('#readout').textContent=text;}if(state.result){persist();if(swallowWin(state.result)){raf=requestAnimationFrame(tick);return;}if(engine.live&&engine.chapterEnds===false&&state.result.won!==false){delete state.result;raf=requestAnimationFrame(tick);return;}ended=true;stop();paint();const r=state.result,list=engine.prizes||kits[entry.id]?.prizes||[],prize=r.prize||list[level]||list[list.length-1];const won=r.won!==false;veil(won?'Chapter complete':(engine.loseTitle||'Not this time'),r.title,r.detail,won?(level<engine.levels.length-1?'Next chapter':'Play chapter again'):(engine.retryButton||'Try this chapter again'),won?prize:null);$('#readout').textContent=engine.readout?.(state)||'';return;}raf=requestAnimationFrame(tick);}catch(e){error(e);}}
function point(e){const b=canvas.getBoundingClientRect();return{x:clamp((e.clientX-b.left)/b.width*900,0,900),y:clamp((e.clientY-b.top)/b.height*1200,0,1200)};}
function move(e,type){if(!playing)return;const p=point(e);input.pointer=p;if(type==='down'){input.down=true;canvas.setPointerCapture(e.pointerId);}if(type==='up'||type==='cancel')input.down=false;engine.pointer?.(state,type,p,input);paint();}
function dispose(){if(disposed)return;persist();disposed=true;stop();observer?.disconnect();abort.abort();engine?.dispose?.(state);draw?.dispose();$('#backdrop').removeAttribute('src');}
try{
 if(!entry?.ready||entry.direct)throw Error('Choose an available new game from the workshop list.');
 engine=(await import(entry.module+'?v=florence-1')).default;
 document.title=engine.title+' · Penny Fever';$('#title').textContent=engine.title;$('#host').textContent=entry.host+'’s paper world';$('#intro').textContent=engine.intro;$('#instructions').textContent=engine.instructions;canvas.setAttribute('aria-label',engine.title+'. '+engine.instructions);
 if(embedded){const note=document.querySelector('.note');if(note)note.textContent=entry.id==='coin-pusher'?'Three trays. Drop a penny or dump the pocket. The machine sleeps until you drop, and the trays are saved when you leave. Cash a booth ticket for a five-penny stack.':entry.id==='pinball'?'Six cabinets. A penny pulls the plunger. Tap the flippers. Pennies and stars drip back; uniques almost never leave the glass, and even the small wins dry up. Cash a booth ticket for a five-penny stack.':entry.id==='milk-bottles'?'A penny a bead. Two or three throws. Knock every bottle for this dairy’s prize. Cash a booth ticket for a five-penny stack.':entry.id==='skee-ball'?'A penny a roll. Land the hanging moon for this chapter’s prize. Stars drip from the silver cups. Cash a booth ticket for a five-penny stack.':'A penny sits you down. Extra plays inside some rooms cost another penny. Cash a ticket on the bar for a five-penny stack. Workshop practice from All games stays free and writes nothing.';}
 const next=games.slice(games.indexOf(entry)+1).find(g=>g.ready);if(next){$('#next').textContent='Next: '+next.host+' — '+next.title+' →';$('#next').href=next.direct||'play.html?stall='+next.id;if(embedded)listen($('#next'),'click',e=>{e.preventDefault();tellRoom('open',{id:next.id});});}else if(embedded){$('#next').textContent='Back to the alley →';listen($('#next'),'click',e=>{e.preventDefault();tellRoom('leave',{id:entry.id});});}
 if(embedded){const ret=document.querySelector('.play-header a[target="_parent"]');if(ret)listen(ret,'click',e=>{e.preventDefault();tellRoom('leave',{id:entry.id});});}
 engine.levels.forEach((name,i)=>{const o=document.createElement('option');o.value=i;o.textContent=(i+1)+'. '+name;$('#chapter').append(o);});
 draw=new Draw(canvas);draw.art={};
 const kit=kits[entry.id]||{sprites:[],prizes:[]};
 engine.prizes=(kit.prizes&&kit.prizes.length)?kit.prizes:(engine.prizes||[]);
 const spriteIds=[...new Set([...(engine.sprites||kit.sprites||[]),...engine.prizes])];
 observer=new ResizeObserver(()=>{const b=stage.getBoundingClientRect();draw.resize(b.width,b.height,devicePixelRatio||1);paint();});observer.observe(stage);
 listen($('#chapter'),'change',()=>{persist();level=Number($('#chapter').value);reset();});listen($('#restart'),'click',()=>{if(engine.tables){persist();start();return;}reset();});listen($('#pause'),'click',()=>playing?pause():start());
 listen($('#next-chapter'),'click',goNextChapter);
 listen($('#begin'),'click',()=>{if(!ended){start();return;}const won=state?.result?.won!==false;persist();if(won&&level<engine.levels.length-1){level++;$('#chapter').value=level;reset();return;}reset();if(!won)start();});
 for(const type of ['down','move','up','cancel'])listen(canvas,'pointer'+type,e=>move(e,type));
 listen(canvas,'keydown',e=>{if(!playing||e.repeat)return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Enter','Escape','z','x','r','c','Shift','Control'].includes(e.key)){e.preventDefault();input.keys.add(e.key);if(e.key==='Escape')pause();else engine.key?.(state,e.key,true,input);paint();}});
 listen(window,'keyup',e=>{input.keys.delete(e.key);if(playing)engine.key?.(state,e.key,false,input);});
 for(const a of engine.actions||[]){const b=document.createElement('button');b.textContent=a.label;$('#actions').append(b);if(a.hold){listen(b,'pointerdown',e=>{if(!playing)return;b.setPointerCapture(e.pointerId);input.actions.add(a.id);engine.action?.(state,a.id,true,input);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])listen(b,ev,()=>{input.actions.delete(a.id);if(playing)engine.action?.(state,a.id,false,input);});listen(b,'keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();input.actions.add(a.id);if(playing)engine.action?.(state,a.id,true,input);}});listen(b,'keyup',e=>{if(e.key===' '||e.key==='Enter'){input.actions.delete(a.id);if(playing)engine.action?.(state,a.id,false,input);}});}else listen(b,'click',()=>{if(playing){engine.action?.(state,a.id,true,input);paint();}});}
 listen(document,'visibilitychange',()=>{if(document.hidden)pause();});
 if(!embedded)listen(window,'blur',pause);
 listen(window,'message',e=>{
  if(e.origin!==location.origin)return;
  const d=e.data;
  if(!d||d.channel!=='pf-paper-world')return;
  if(d.type==='pause')pause();
  if(d.type==='resume'&&!playing&&!ended)start();
 });
 listen(window,'pagehide',dispose);listen(window,'pageshow',e=>{if(e.persisted)location.reload();});
 const img=$('#backdrop');img.src=entry.asset;img.decode().catch(()=>{img.removeAttribute('src');img.hidden=true;});
 if(!disposed){reset();for(const id of ['chapter','pause','restart'])$('#'+id).disabled=false;if(engine.tables){$('#restart').hidden=true;const lab=document.querySelector('label[for="chapter"]');if(lab)lab.textContent='Table · each chapter is a new set';}else if(engine.live){$('#chapter').disabled=true;$('#chapter').hidden=true;$('#restart').hidden=true;const lab=document.querySelector('label[for="chapter"]');if(lab)lab.hidden=true;}tellRoom('ready',{title:engine.title});}
 loadSprites(spriteIds.map(spriteKey)).then(art=>{if(disposed||!draw)return;draw.art=art;paint();});
}catch(e){error(e);}
