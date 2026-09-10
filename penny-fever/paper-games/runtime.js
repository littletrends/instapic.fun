import {games,byId} from './catalogue.js';
import {Draw,seeded,clamp} from './draw.js';
import {loadSprites,frontUrl} from './sprites.js';
import {kits,spriteKey,itemName} from './prizes.js';
const $=s=>document.querySelector(s), abort=new AbortController(),sig={signal:abort.signal};
const canvas=$('#world'),stage=$('#stage'),input={keys:new Set(),actions:new Set(),pointer:null,down:false};
let engine,state,draw,level=0,playing=false,ended=false,disposed=false,raf=0,last=0,paintAt=0,time=0,observer,reportAt=0;
const id=new URLSearchParams(location.search).get('stall'),entry=byId[id];
const embedded=window.parent!==window&&new URLSearchParams(location.search).get('room')==='alley';
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
function stop(){playing=false;cancelAnimationFrame(raf);raf=0;last=0;clearInput();}
function pause(){if(!playing)return;stop();veil('Take your time','The room is resting.','Nothing moves until you return.','Continue');$('#pause').textContent='Continue';}
function paint(){if(!draw||!state)return;draw.clear();engine.draw(state,draw,time,input);}
function reset(){stop();ended=false;time=0;state=engine.create(level,seeded(1703+level*297));paint();$('#readout').textContent=engine.readout?.(state)||'';veil(entry.host+' presents',engine.levels[level],engine.instructions,'Begin chapter');$('#begin').disabled=false;$('#pause').textContent='Pause';}
function start(){if(disposed||!engine||!state||playing)return;if(ended)reset();$('#veil').hidden=true;playing=true;last=0;$('#pause').textContent='Pause';canvas.focus({preventScroll:true});raf=requestAnimationFrame(tick);}
function tick(now){if(!playing||disposed)return;try{if(!last)last=now;const dt=Math.min(.05,(now-last)/1000);last=now;time+=dt;engine.update?.(state,dt,input);if(now-paintAt>1000/30){paintAt=now;paint();}if(now-reportAt>350){reportAt=now;const text=engine.readout?.(state)||'';if($('#readout').textContent!==text)$('#readout').textContent=text;}if(state.result){ended=true;stop();paint();const r=state.result,list=engine.prizes||kits[entry.id]?.prizes||[],prize=list[level]||list[list.length-1];veil('Chapter complete',r.title,r.detail,level<engine.levels.length-1?'Next chapter':'Play chapter again',prize);if(prize)tellRoom('prize',{item:prize,stall:entry.id,chapter:level});$('#readout').textContent=engine.readout?.(state)||'';return;}raf=requestAnimationFrame(tick);}catch(e){error(e);}}
function point(e){const b=canvas.getBoundingClientRect();return{x:clamp((e.clientX-b.left)/b.width*900,0,900),y:clamp((e.clientY-b.top)/b.height*1200,0,1200)};}
function move(e,type){if(!playing)return;const p=point(e);input.pointer=p;if(type==='down'){input.down=true;canvas.setPointerCapture(e.pointerId);}if(type==='up'||type==='cancel')input.down=false;engine.pointer?.(state,type,p,input);paint();}
function dispose(){if(disposed)return;disposed=true;stop();observer?.disconnect();abort.abort();engine?.dispose?.(state);draw?.dispose();$('#backdrop').removeAttribute('src');}
try{
 if(!entry?.ready||entry.direct)throw Error('Choose an available new game from the workshop list.');
 engine=(await import(entry.module)).default;
 document.title=engine.title+' · Penny Fever';$('#title').textContent=engine.title;$('#host').textContent=entry.host+'’s paper world';$('#intro').textContent=engine.intro;$('#instructions').textContent=engine.instructions;canvas.setAttribute('aria-label',engine.title+'. '+engine.instructions);
 const next=games.slice(games.indexOf(entry)+1).find(g=>g.ready);if(next){$('#next').textContent='Next: '+next.host+' — '+next.title+' →';$('#next').href=next.direct||'play.html?stall='+next.id;if(embedded)listen($('#next'),'click',e=>{e.preventDefault();tellRoom('open',{id:next.id});});}else if(embedded){$('#next').textContent='Back to the alley →';listen($('#next'),'click',e=>{e.preventDefault();tellRoom('leave');});}
 engine.levels.forEach((name,i)=>{const o=document.createElement('option');o.value=i;o.textContent=(i+1)+'. '+name;$('#chapter').append(o);});
 draw=new Draw(canvas);draw.art={};
 const kit=kits[entry.id]||{sprites:[],prizes:[]};
 engine.prizes=(kit.prizes&&kit.prizes.length)?kit.prizes:(engine.prizes||[]);
 const spriteIds=[...new Set([...(engine.sprites||kit.sprites||[]),...engine.prizes])];
 draw.art=await loadSprites(spriteIds.map(spriteKey));
 observer=new ResizeObserver(()=>{const b=stage.getBoundingClientRect();draw.resize(b.width,b.height,devicePixelRatio||1);paint();});observer.observe(stage);
 listen($('#chapter'),'change',()=>{level=Number($('#chapter').value);reset();});listen($('#restart'),'click',reset);listen($('#pause'),'click',()=>playing?pause():start());
 listen($('#begin'),'click',()=>{if(ended&&level<engine.levels.length-1){level++;$('#chapter').value=level;reset();}start();});
 for(const type of ['down','move','up','cancel'])listen(canvas,'pointer'+type,e=>move(e,type));
 listen(canvas,'keydown',e=>{if(!playing||e.repeat)return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Enter','Escape','z','x','r'].includes(e.key)){e.preventDefault();input.keys.add(e.key);if(e.key==='Escape')pause();else engine.key?.(state,e.key,true,input);paint();}});
 listen(window,'keyup',e=>{input.keys.delete(e.key);if(playing)engine.key?.(state,e.key,false,input);});
 for(const a of engine.actions||[]){const b=document.createElement('button');b.textContent=a.label;$('#actions').append(b);if(a.hold){listen(b,'pointerdown',e=>{if(!playing)return;b.setPointerCapture(e.pointerId);input.actions.add(a.id);engine.action?.(state,a.id,true,input);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])listen(b,ev,()=>{input.actions.delete(a.id);if(playing)engine.action?.(state,a.id,false,input);});listen(b,'keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();input.actions.add(a.id);if(playing)engine.action?.(state,a.id,true,input);}});listen(b,'keyup',e=>{if(e.key===' '||e.key==='Enter'){input.actions.delete(a.id);if(playing)engine.action?.(state,a.id,false,input);}});}else listen(b,'click',()=>{if(playing){engine.action?.(state,a.id,true,input);paint();}});}
 listen(document,'visibilitychange',()=>{if(document.hidden)pause();});listen(window,'blur',pause);listen(window,'pagehide',dispose);listen(window,'pageshow',e=>{if(e.persisted)location.reload();});
 const img=$('#backdrop');img.src=entry.asset;try{await img.decode();}catch{throw Error('The background artwork is missing or could not load.');}if(!disposed){reset();for(const id of ['chapter','pause','restart'])$('#'+id).disabled=false;tellRoom('ready',{title:engine.title});}
}catch(e){error(e);}
