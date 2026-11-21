// The browser and verifier execute this same authoritative game lifecycle.
import {createVerifiedDriver as createOriginalDriver} from './verified-driver-v1.js';
import {PAPER_EDITION} from './engine-release.js';
import {bindPrize,takePrize,stepPrize} from './chapter-kit.js?v=align-1';
import {chapterOutcome} from './chapter-flow.js?v=pf-polish-1';
import {seeded} from './draw.js?v=sep17-4';
import {keep,owned,pocket} from './wallet.js?v=insights-1';
import {takeAttempt} from './stall-entry.js?v=ride-ticket-1';

export function createVerifiedDriver(options){
 const selected=options.engine.forSnapshot?.(options.snapshot)||options.engine;
 if(!selected.releaseEdition){
  const original=createOriginalDriver({...options,engine:selected});
  if(options.game!=='fortune'||options.legacyReplay)return original;
  const guarded=Object.create(original);
  guarded.execute=event=>{
   if(event?.type==='retry'){
    if(original.state.phase==='result'&&options.chapter>0&&pocket()<1){original.state.entryPaymentRequired=true;return;}
    delete original.state.entryPaymentRequired;
   }
   return original.execute(event);
  };
  return guarded;
 }
 if(selected.releaseEdition!==PAPER_EDITION||options.snapshot&&options.snapshot.edition!==PAPER_EDITION)throw Error('saved_engine_edition_unavailable');
 return createPaperDriver({...options,engine:selected});
}
function createPaperDriver({engine,game,chapter,seed,startedAt=0,snapshot=null}){
 let rng=snapshot?.rng??(parseInt(seed.slice(0,8),16)>>>0),elapsed=snapshot?.elapsed||0;
 let completion=snapshot?.completion||null,started=snapshot?.started===true,state;
 const held=snapshot?.input||{};
 const input={keys:new Set(held.keys||[]),actions:new Set(held.actions||[]),down:!!held.down,pointer:held.pointer||null};
 const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
 function invoke(fn){const priorRandom=Math.random,priorNow=Date.now;Math.random=random;Date.now=()=>startedAt+elapsed*1000;try{return fn();}finally{Math.random=priorRandom;Date.now=priorNow;}}
 function plant(){const existing=!!state.chapterPrize;bindPrize(state,engine.prizes?.[chapter],{field:true});state.gameEdition=PAPER_EDITION;state.practice=false;if(!existing&&owned(engine.prizes?.[chapter])){state.prizeKept=true;state.chapterPrize.phase='gone';state.chapterPrize.alpha=0;}}
 invoke(()=>{state=snapshot?(engine.restoreState?.(snapshot.state)||structuredClone(snapshot.state)):engine.create(chapter,seeded(1703+chapter*297));plant();});
 const seconds=engine.houseSeconds,house=seconds===0?null:{seconds:seconds||45,title:engine.houseTitle||'The house closes',detail:engine.houseDetail||'This attempt has ended.'};
 if(!snapshot&&house&&state.houseLeft==null)state.houseLeft=house.seconds;
 function charge(){const funded=engine.managesEntry?engine.canStartAttempt?.(chapter,state)!==false:takeAttempt(game,chapter);if(!funded){state.entryPaymentRequired=true;state.note='This attempt needs funds in your purse.';return false;}delete state.entryPaymentRequired;return true;}
 function keySet(values){if(!Array.isArray(values)||values.length>24||values.some(k=>typeof k!=='string'||k.length>20))throw Error('invalid_keys');return new Set(values);}
 function release(){input.keys.clear();input.actions.clear();input.down=false;engine.pointer?.(state,'cancel',input.pointer||{x:450,y:1050},input);engine.releaseInput?.(state);input.pointer=null;}
 function execute(event){return invoke(()=>{
  if(!event||typeof event!=='object')throw Error('invalid_event');
  if(event.type==='release'){release();return;}
  if(event.type==='start'){if(!started&&!completion&&charge())started=true;return;}
  if(event.type==='retry'){
   if(!charge())return;const next=engine.retryAttempt?.(state);state=next||engine.create(chapter,seeded(1703+chapter*297));completion=null;started=true;input.keys.clear();input.actions.clear();input.pointer=null;input.down=false;plant();if(house&&state.houseLeft==null)state.houseLeft=house.seconds;return;
  }
  if(completion&&event.type!=='tick')throw Error('attempt_finished');
  if(event.type==='tick'){
   if(!Number.isFinite(event.dt)||event.dt<=0||event.dt>.05)throw Error('invalid_tick');
   input.keys=keySet(event.keys||[]);input.actions=keySet(event.actions||[]);
   if([...input.actions].some(id=>!(engine.actions||[]).some(a=>a.id===id)))throw Error('invalid_action');
   if(!started)return;
   elapsed+=event.dt;
   if(!completion)engine.update?.(state,event.dt,input);
   if(!completion&&house&&!state.result&&(engine.clockRuns?.(state)??true)){
    state.houseLeft=Math.max(0,state.houseLeft-event.dt);
    if(!state.houseLeft){if(engine.onTimeout)engine.onTimeout(state);else state.result={title:house.title,detail:house.detail,won:false};}
   }
   const outcome=completion||chapterOutcome(game,state,false);
   if(outcome&&!completion){
    completion={...outcome};
    if(outcome.won!==false){const prize=engine.prizes?.[chapter];if(prize&&!owned(prize)){keep(prize,game);takePrize(state,prize);}}
   }
   stepPrize(state,event.dt);
   // The chapter engine owns its reward animation. Only verified canonical
   // chapter completion or its verified in-game goal may create ownership.
   if(state.prizeDeliver)state.prizeDeliver=false;
  }else if(event.type==='pointer'){
   const p=event.point;
   if(!['down','move','up','cancel'].includes(event.phase)||!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>900||p.y<0||p.y>1200)throw Error('invalid_pointer');
   if(p.pointerId!=null&&(!Number.isSafeInteger(p.pointerId)||p.pointerId<0))throw Error('invalid_pointer');
   if(p.pointerType!=null&&!['mouse','touch','pen'].includes(p.pointerType))throw Error('invalid_pointer');
   if(p.button!=null&&(!Number.isInteger(p.button)||p.button< -1||p.button>5))throw Error('invalid_pointer');
   if(!started)return;
   input.pointer={x:p.x,y:p.y,...(p.pointerId!=null?{pointerId:p.pointerId}:{}),...(p.pointerType?{pointerType:p.pointerType}:{}),...(p.button!=null?{button:p.button}:{})};
   if(event.phase==='down')input.down=true;if(['up','cancel'].includes(event.phase))input.down=false;
   engine.pointer?.(state,event.phase,input.pointer,input);
  }else if(event.type==='key'){
   if(typeof event.key!=='string'||event.key.length>20)throw Error('invalid_key');if(!started)return;
   if(event.down!==false)input.keys.add(event.key);else{input.keys.delete(event.key);if(event.key.length===1){input.keys.delete(event.key.toLowerCase());input.keys.delete(event.key.toUpperCase());}}
   engine.key?.(state,event.key,event.down!==false,input);
  }else if(event.type==='action'){
   if(!(engine.actions||[]).some(a=>a.id===event.id))throw Error('invalid_action');if(started)engine.action?.(state,event.id,event.down!==false,input);
  }else throw Error('invalid_event');
 });}
 return {execute,persist:()=>invoke(()=>engine.persist?.(state)),get state(){return state;},get input(){return input;},get completion(){return completion;},get needsStart(){return !started&&!completion;},get finished(){return !!completion&&!['pop','spin','fly'].includes(state.chapterPrize?.phase);},snapshot:()=>({edition:PAPER_EDITION,state,rng,elapsed,started,completion,input:{keys:[...input.keys],actions:[...input.actions],down:input.down,pointer:input.pointer}})};
}
