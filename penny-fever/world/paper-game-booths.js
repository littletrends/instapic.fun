import {games} from '../paper-games/catalogue.js?v=paper-alley-live-2';

const gameBase=new URL('../paper-games/',import.meta.url);
export const paperGameRooms=games.filter(game=>game.ready).map(game=>({
 ...game,src:new URL(game.direct||('play.html?stall='+encodeURIComponent(game.id)+'&room=alley'),gameBase).href,
}));

// Existing room routing owns the alley pause and return position. The game itself
// owns its canvas, controls and lifecycle; leaving destroys just that iframe.
export function createPaperGameVendor(game,doc=globalThis.document,nav=globalThis.location){
 let stage,frame,status,timer;
 const room=()=>doc.getElementById('cabinet-'+game.id);
 function prepare(){
  const cabinet=room();if(!cabinet)throw new Error('Missing cabinet '+game.id);
  if(stage)return;
  cabinet.classList.add('paper-game-cabinet');
  cabinet.setAttribute('aria-label',game.host+' — '+game.title);
  cabinet.removeAttribute('aria-labelledby');
  stage=doc.createElement('div');stage.className='paper-game-room';
  const bar=doc.createElement('header');bar.className='paper-game-bar';
  const back=doc.createElement('button');back.type='button';back.textContent='← Back to the alley';
  back.addEventListener('click',()=>{
    const live=new URL(nav.href);
    live.searchParams.set('style','paper');
    live.searchParams.set('rail','paper');
    live.searchParams.set('v','paper-alley-live-1');
    live.hash='alley';
    nav.href=live.href;
  });
  const title=doc.createElement('h1');title.textContent=game.host+' · '+game.title;title.tabIndex=-1;
  const list=doc.createElement('a');list.href=new URL('../game-links.html',import.meta.url).href;list.textContent='All games';
  const retry=doc.createElement('button');retry.type='button';retry.textContent='Restart';retry.addEventListener('click',()=>load(true));
  bar.append(back,title,list,retry);
  status=doc.createElement('p');status.className='paper-game-status';status.setAttribute('role','status');
  frame=doc.createElement('iframe');frame.className='paper-game-frame';frame.title=game.host+' — '+game.title;
  frame.src='about:blank';
  stage.append(bar,status,frame);cabinet.append(stage);
 }
 function unload(){
  clearTimeout(timer);timer=null;
  if(!frame)return;
  frame.onload=frame.onerror=null;
  if(frame.getAttribute('src')!=='about:blank')frame.src='about:blank';
 }
 function load(restart=false){
  prepare();
  if(!restart&&frame.getAttribute('src')!=='about:blank')return;
  unload();status.hidden=false;status.textContent='Opening '+game.title+'…';
  frame.onload=()=>{clearTimeout(timer);status.hidden=true;};
  frame.onerror=()=>{clearTimeout(timer);status.hidden=false;status.textContent='This game could not open. Try Restart or return to the alley.';};
  timer=setTimeout(()=>{status.hidden=false;status.textContent='Still opening the paper world… You can wait, restart, or return to the alley.';},20000);
  frame.src=game.src;
 }
 return {id:game.id,chalk:game.host+' — '+game.title,onShow:()=>load(),onLeave:unload,
  onReset(){if(room()&&!room().hidden)load(true);else unload();}};
}

export function registerPaperGameBooths(PF,doc=globalThis.document,nav=globalThis.location){
 const vendors=paperGameRooms.map(game=>createPaperGameVendor(game,doc,nav));
 vendors.forEach(vendor=>PF.registerVendor(vendor));return vendors;
}
if(typeof window!=='undefined'){
 let installed=false;
 const install=()=>{
  if(installed||!window.PennyFever?.registerVendor)return;
  installed=true;const vendors=registerPaperGameBooths(window.PennyFever);
  window.addEventListener('pagehide',()=>vendors.forEach(v=>v.onLeave()));
  window.addEventListener('pageshow',event=>{if(event.persisted){const id=location.hash.match(/^#cabinet\/([^/]+)/)?.[1];vendors.find(v=>v.id===id)?.onShow();}});
 };
 install();if(!installed)document.addEventListener('DOMContentLoaded',install,{once:true});
}
