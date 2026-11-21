import {makeExamplePlayer} from './chapter-example-player.js?v=example-1';
import {paper,text,button,shortCue,paintRewardTurn} from './study-kit.js?v=studies-six-1';
import {spriteKey,itemName} from '../prizes.js?v=nft-art-1';
import {isVerifiedPlay} from '../wallet.js?v=insights-1';

const inBox=(p,x,y,w,h)=>Math.abs(p.x-x)<=w/2&&Math.abs(p.y-y)<=h/2;
function lines(c,value,x,y,width=730){
 c.save();c.font='600 27px Georgia,serif';const rows=[''];
 for(const word of value.split(' ')){const i=rows.length-1,next=rows[i]+(rows[i]?' ':'')+word;if(c.measureText(next).width>width&&rows.length<3)rows.push(word);else rows[i]=next;}
 rows.forEach((row,i)=>text(c,row,x,y+(i-(rows.length-1)/2)*28,27,'#fff1d2'));c.restore();
}
function pointer(c,info){
 const p=info.cursor;c.save();c.translate(p.x,p.y);c.shadowColor='#271a256b';c.shadowBlur=10;c.shadowOffsetY=4;c.beginPath();c.moveTo(0,0);c.lineTo(7,35);c.lineTo(15,25);c.lineTo(32,24);c.closePath();c.fillStyle='#fff1ce';c.strokeStyle='#b2874f';c.lineWidth=2;c.fill();c.stroke();c.shadowColor='transparent';
 if(info.tapAge<.45){c.beginPath();c.arc(0,0,17+info.tapAge*38,0,Math.PI*2);c.strokeStyle='#ffe9b6';c.lineWidth=3;c.globalAlpha=1-info.tapAge/.45;c.stroke();}c.restore();
}
function paintExample(player,spec,samplePrize,d,...args){
 const info=player.info();spec.draw(player.state,d,...args);
 paper(d.c,450,42,310,48,'#243b3df2','#d1b47a',10);text(d.c,'SAMPLE',450,42,25,'#fff0cd');
 const rewardAge=Number.isFinite(player.state.demoRewardAge)?player.state.demoRewardAge:Number.isFinite(player.state.demoFinishLeft)&&['demo-finish','demo-done'].includes(player.state.phase)?4.2-player.state.demoFinishLeft:null;
 if(samplePrize&&rewardAge!==null){
  paper(d.c,450,568,640,520,'#fff0e7','#b28a4d',18);
  text(d.c,'SAMPLE REWARD',450,365,27,'#684b3b');
  paintRewardTurn(d,samplePrize,rewardAge,{y:555,size:340,prefix:'example'});
  text(d.c,itemName(samplePrize),450,745,26,'#684b3b');
  text(d.c,'Example only',450,790,21,'#806955');
 }
 const captionY=spec.captionY??229;
 if(rewardAge===null&&!info.finished){paper(d.c,450,captionY,760,72,'#263c40eb','#d1b47a70',12);lines(d.c,shortCue(info.caption),450,captionY);}
 paper(d.c,450,1138,810,82,'#fff0dff7','#b68d55',14);
 button(d.c,'REPLAY',300,1138,300);button(d.c,info.finished?'PLAY CHAPTER 1':'PLAY NOW',650,1138,300);
 if(!info.finished&&rewardAge===null)pointer(d.c,info);
}

// This view owns only a disposable model. It never receives a player's round.
export function attachChapterExampleView(engine,spec){
 const samplePrize=engine.prizes?.[0];
 if(samplePrize)engine.images={...engine.images,...Object.fromEntries(['front','right','back','left'].map(view=>['example:'+samplePrize+':'+view,new URL('../../assets/restyle/game-sprites/'+spriteKey(samplePrize)+'/'+view+'.webp',import.meta.url).href]))};
 engine.createExampleView=(options={})=>{
  if(typeof options==='number')options={chapter:options};
  if((options.chapter??0)!==0)return null;
  let player=makeExamplePlayer(spec),pressed=null,dismissed=false,dismissReason=null,finishedNotified=false;
  const info=()=>({...player.info(),active:!dismissed,dismissed,dismissReason});
  function replay(){if(dismissed)return false;player=makeExamplePlayer(spec);pressed=null;finishedNotified=false;return true;}
  function dismiss(reason='play'){
   if(dismissed)return false;
   dismissed=true;dismissReason=reason;pressed=null;
   options.onDismiss?.({reason,finished:player.info().finished});
   return true;
  }
  return {
   update(dt){
    if(dismissed)return;
    player.update(dt);
    if(player.info().finished&&!finishedNotified){finishedNotified=true;options.onFinish?.(info());}
   },
   draw(d,...args){if(!dismissed)paintExample(player,spec,samplePrize,d,...args);},
   pointer(type,p){
    if(dismissed)return false;
    if(type==='cancel'){pressed=null;return false;}
    if(type==='down'){pressed={x:p.x,y:p.y};return true;}
    if(type!=='up')return false;
    const down=pressed;pressed=null;
    if(!down||Math.hypot(down.x-p.x,down.y-p.y)>35)return false;
    if(inBox(p,300,1138,300,68))return replay();
    if(inBox(p,650,1138,300,68))return dismiss('play');
    return false;
   },
   key(key,down=true){
    if(dismissed||!down)return false;
    if(String(key).toLowerCase()==='r')return replay();
    if(key==='Enter')return dismiss('play');
    return false;
   },
   info,replay,dismiss,
   get state(){return player.state;},
   get finished(){return player.info().finished;},
   get dismissed(){return dismissed;},
   get dismissReason(){return dismissReason;},
   get playRequested(){return dismissed&&dismissReason==='play';},
  };
 };
 return engine;
}

export function withChapterExample(engine,spec){
 attachChapterExampleView(engine,spec);
 const samplePrize=engine.prizes?.[0];
 const original={};for(const key of ['create','update','draw','pointer','key','persist','releaseInput','readout','clockRuns','prizeClock'])original[key]=typeof engine[key]==='function'?engine[key].bind(engine):undefined;
 const players=new WeakMap(),pressed=new WeakMap(),watchPressed=new WeakSet();
 const params=typeof location==='undefined'?new URLSearchParams():new URLSearchParams(location.search),off=params.get('example')==='off';
 const book=spec.bookKey??engine.navigationKey?.replace(/\.selection$/,''),seenKey=book+'.chapterExample.v1';
 const seen=()=>{try{return localStorage.getItem(seenKey)==='seen';}catch{return false;}};
 const savedFirst=()=>{try{return spec.hasSavedFirst?spec.hasSavedFirst():!!JSON.parse(localStorage.getItem(book)||'null')?.chapters?.[0];}catch{return true;}};
 const active=s=>players.get(s)?.active;
 let shownState;
 const house=Object.getOwnPropertyDescriptor(engine,'houseSeconds');
 if(spec.hideHouseClock&&house?.configurable)Object.defineProperty(engine,'houseSeconds',{
  configurable:true,enumerable:house.enumerable,
  get(){return active(shownState)?0:house.get?house.get.call(engine):house.value;},
 });
 const available=s=>!isVerifiedPlay()&&s.level===0&&!s.result&&!s.saveError&&(spec.canStart?spec.canStart(s):['play','moving'].includes(s.phase));
 function start(s,manual=false){
  if(!available(s))return false;
  if(manual){original.releaseInput?.(s);original.pointer?.(s,'cancel',{x:0,y:0});try{original.persist?.(s);}catch{return false;}}
  pressed.delete(s);watchPressed.delete(s);players.set(s,{active:true,player:makeExamplePlayer(spec)});return true;
 }
 function finish(s){
  const current=players.get(s);if(!current?.active)return;
  current.active=false;pressed.delete(s);try{localStorage.setItem(seenKey,'seen');}catch{/* The real game still owns its save-error handling. */}
  original.releaseInput?.(s);
 }
 engine.create=(level,...args)=>{
  const alreadySaved=level===0&&savedFirst(),state=original.create(level,...args);
  shownState=state;
  if(level===0&&!off&&!alreadySaved&&!seen())start(state);
  return state;
 };
 engine.update=(s,dt,...args)=>{const current=players.get(s);if(current?.active){if(!engine.artReady||engine.artReady())current.player.update(dt);return;}return original.update?.(s,dt,...args);};
 if(original.clockRuns)engine.clockRuns=(s,...args)=>active(s)?false:original.clockRuns(s,...args);
 if(original.prizeClock)engine.prizeClock=(s,...args)=>active(s)?null:original.prizeClock(s,...args);
 engine.persist=s=>{if(!active(s))return original.persist?.(s);};
 engine.releaseInput=s=>{pressed.delete(s);watchPressed.delete(s);return original.releaseInput?.(s);};
 engine.pointer=(s,type,p,...args)=>{
  if(active(s)){
   if(type==='cancel'){pressed.delete(s);return;}
   if(type==='down')pressed.set(s,{x:p.x,y:p.y});
   if(type==='up'){const down=pressed.get(s);pressed.delete(s);if(!down||Math.hypot(down.x-p.x,down.y-p.y)>35)return;if(inBox(p,300,1138,300,68))start(s);else if(inBox(p,650,1138,300,68))finish(s);}
   return;
  }
  if(type==='cancel'){watchPressed.delete(s);return original.pointer?.(s,type,p,...args);}
  if(available(s)&&(watchPressed.has(s)||inBox(p,742,42,250,58))){
   if(type==='down')watchPressed.add(s);
   if(type==='up'){const held=watchPressed.has(s);watchPressed.delete(s);if(held&&inBox(p,742,42,250,58))start(s,true);}
   return;
  }
  return original.pointer?.(s,type,p,...args);
 };
 engine.key=(s,k,down,...args)=>{
  if(active(s)){if(down&&k.toLowerCase()==='r')start(s);else if(down&&k==='Enter')finish(s);return;}
  if(down&&k.toLowerCase()==='v'&&available(s)){start(s,true);return;}
  return original.key?.(s,k,down,...args);
 };
 engine.draw=(s,d,...args)=>{
  shownState=s;
  const current=players.get(s);
  if(current?.active){
   paintExample(current.player,spec,samplePrize,d,...args);
   return;
  }
  original.draw(s,d,...args);
  if(available(s))button(d.c,'SAMPLE',742,42,250);
 };
 engine.readout=s=>active(s)?players.get(s).player.info().caption:original.readout?.(s);
 engine.exampleInfo=s=>{const current=players.get(s);return current?.active?{active:true,...current.player.info()}:{active:false};};
 if(engine.reviewCopy){
  engine.reviewCopy.keys+=' · V watch example · Enter skip example · R repeat example';
  engine.reviewCopy.cost='Free preview.';
  const treasure=engine.reviewCopy.treasure;
  if(treasure)engine.reviewCopy.treasure=(...args)=>String(treasure(...args)).split(' · ').slice(0,2).join(' · ').replace('Locked until the chapter is completed.','Locked');
 }
 return engine;
}
