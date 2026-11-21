// Disposable opening interactions. This player never receives a guest's state.
const point=p=>({x:p.x,y:p.y});
const ease=t=>t*t*(3-2*t);
export function makeExamplePlayer(spec){
 const steps=typeof spec.steps==='function'?spec.steps():spec.steps;
 if(!Array.isArray(steps)||!steps.length||steps.length>8)throw Error('An example needs a short opening sequence.');
 const state=spec.model.makeState(0);state.practice=true;
 let index=0,age=0,readyAge=0,started=false,fired=false,finished=false,tapAge=10,path=[],from=null;
 let cursor={x:690,y:330};
 function enter(){
  const item=steps[index],route=typeof item.path==='function'?item.path(state):item.path,target=typeof item.point==='function'?item.point(state):item.point;
  path=(route||[target]).map(point);if(!path.length||path.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw Error('Example points must be on the game board.');
  from=point(cursor);age=0;readyAge=0;started=false;fired=false;
 }
 function update(dt){
  if(finished||!Number.isFinite(dt)||dt<=0)return;
  dt=Math.min(.05,dt);const item=steps[index],approach=item.approach??.55,gesture=item.gesture??(path.length>1?1:.25);age+=dt;tapAge+=dt;
  if(!fired&&typeof item.point==='function'&&!item.path)path[0]=point(item.point(state));
  if(age<approach){const u=ease(age/approach);cursor={x:from.x+(path[0].x-from.x)*u,y:from.y+(path[0].y-from.y)*u};}
  else{
   if(!started){item.start?.(state);started=true;}
   const u=Math.min(1,(age-approach)/gesture),where=u*(path.length-1),i=Math.min(path.length-1,Math.floor(where)),j=Math.min(path.length-1,i+1),mix=where-i;
   cursor={x:path[i].x+(path[j].x-path[i].x)*mix,y:path[i].y+(path[j].y-path[i].y)*mix};
   if(!fired)item.move?.(state,point(cursor),u);
   if(u===1&&!fired){item.run?.(state);fired=true;tapAge=0;}
  }
  // Only the pure model advances: never engine.update(), persist() or awards.
  spec.model.step(state,dt);
  const settled=fired&&(item.done?item.done(state):!state.motion&&!state.active&&state.phase!=='moving');
  readyAge=settled?readyAge+dt:0;
  if(state.phase==='celebrate'||state.result){finished=true;return;}
  if(settled&&readyAge>=(item.after??1)){
   if(index===steps.length-1)finished=true;
   else{index++;enter();}
  }
 }
 function info(){const item=steps[index];return {index,count:steps.length,finished,cursor:point(cursor),tapAge,caption:finished?(spec.finishCaption||'Your turn. Try the first chapter.'):(typeof item.caption==='function'?item.caption(state):item.caption||'Watch this opening move.')};}
 enter();return {state,update,info};
}
