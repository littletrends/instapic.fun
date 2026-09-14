import {games} from '../paper-games/catalogue.js?v=briefs-2';
import {spriteKey} from '../paper-games/prizes.js?v=ritual-3';
import {frontUrl} from '../paper-games/sprites.js';
import {doorKind, enterLabel, hasSat, markSat, isClosed} from '../paper-games/stall-entry.js?v=entry-2';
import {pilotSession,resolvePilotSession} from '../charging/flags.mjs';

const gameBase=new URL('../paper-games/',import.meta.url);
export const paperGameRooms=games.filter(game=>game.ready&&!game.workshop).map(game=>({
 ...game,src:new URL(game.direct||('play.html?stall='+encodeURIComponent(game.id)+'&room=alley&v=briefs-5'),gameBase).href,
}));

// Door vs inside charges live in stall-entry.js (ticket sit-down, penny rail, Felix free).
// Workshop play.html without room=alley stays free and writes nothing.

function leavePaperGame(id, nav=globalThis.location){
  try{window.PennyFeverWorld?.stepOut?.(id);}catch{/* world not ready */}
  const hash=String(nav.hash||'').replace(/^#/,'');
  if(hash==='alley'||hash==='foyer'||hash==='arcade'||hash==='booth'){
    const world=window.PennyFeverWorld;
    if(world?.started)world.resume();
    else world?.start?.();
    return;
  }
  nav.hash='alley';
}

// Existing room routing owns the alley pause and return position. The game itself
// owns its canvas, controls and lifecycle; leaving destroys just that iframe.
export function createPaperGameVendor(game,doc=globalThis.document,nav=globalThis.location){
 let stage,frame,status,timer,doorLock=false;
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
  back.addEventListener('click',()=>leavePaperGame(game.id,nav));
  const title=doc.createElement('h1');title.textContent=game.host+' · '+game.title;title.tabIndex=-1;
  const list=doc.createElement('a');list.href=new URL('../game-links.html',import.meta.url).href;list.textContent='All games';
  const door=doorKind(game.id);
  const retry=doc.createElement('button');retry.type='button';
  retry.textContent=door==='closed'?'Come back later':door==='ticket'?'The tent waits':door==='free'?'The table waits':'Play again · 1 penny';
  if(door==='penny'){
    retry.addEventListener('click',()=>load(true));
  }else{
    retry.disabled=true;
    retry.title=door==='closed'
      ?'Felix’s Instapic photo booth is closed for maintenance.'
      :door==='ticket'
      ?'Your sitting is saved. First try of each chapter is included; extra goes cost a penny inside.'
      :'Pennies are spent on each play. Leave and come back — this table remembers.';
  }
  const wallet=doc.createElement('span');wallet.className='paper-game-wallet';wallet.setAttribute('aria-live','polite');
  let pilotWallet;
  const paintWallet=()=>{
    if(pilotSession(game.id)&&!pilotWallet){wallet.textContent='Private test wallet · awaiting server';return;}
    const PF=window.PennyFever;
    const n=Number(pilotWallet?.pennies??PF?.pennies?.()??PF?.getState?.()?.demoCoins)||0;
    const t=Number(pilotWallet?.tickets??PF?.tickets?.()??PF?.getState?.()?.playTickets)||0;
    wallet.textContent=t+' '+(t===1?'ticket':'tickets')+' · '+n+' '+(n===1?'penny':'pennies');
  };
  paintWallet();
  window.addEventListener('pennyfever:pilotwallet',event=>{
    if(event.detail?.game!==game.id||!pilotSession(game.id))return;
    pilotWallet=event.detail.wallet;paintWallet();
  });
  window.addEventListener('pennyfever:statechange',paintWallet);
  const cash=doc.createElement('button');cash.type='button';cash.textContent='Cash a ticket · 5 pennies';
  cash.addEventListener('click',()=>{
    if(pilotSession(game.id)){status.hidden=false;status.textContent='Test balances only. Legacy conversion is paused.';return;}
    const PF=window.PennyFever;
    const got=PF?.cashTicketForPennies?.();
    if(!got){
      status.hidden=false;
      status.textContent='Need a booth ticket. Buy a strip from Aura’s roll.';
      return;
    }
    status.hidden=false;
    status.textContent='Five pennies in the purse.';
    paintWallet();
    if(frame&&frame.getAttribute('src')==='about:blank') load();
  });
  const buy=doc.createElement('button');buy.type='button';buy.textContent='Buy a ticket · 5 pennies';
  buy.addEventListener('click',()=>{
    const PF=window.PennyFever;
    if(!PF?.tradePenniesForTicket?.()){
      status.hidden=false;
      status.textContent='Need five pennies for a ticket. Buy a pack from Aura.';
      return;
    }
    status.hidden=false;
    status.textContent='A ticket for a sitting.';
    paintWallet();
    if(frame&&frame.getAttribute('src')==='about:blank') load();
  });
  const chest=doc.createElement('button');chest.type='button';chest.className='paper-game-treasure';
  chest.innerHTML='<span>🗝</span> Treasures';
  chest.addEventListener('click',()=>window.PennyFeverInventory?.open());
  bar.append(back,title,list,wallet,buy,cash,retry,chest);
  status=doc.createElement('p');status.className='paper-game-status';status.setAttribute('role','status');
  frame=doc.createElement('iframe');frame.className='paper-game-frame';frame.title=game.host+' — '+game.title;
  frame.src='about:blank';
  stage.append(bar,status,frame);cabinet.append(stage);
 }
 let loadRevision=0;
 function unload(){
  loadRevision++;
  clearTimeout(timer);timer=null;
  if(!frame)return;
  frame.onload=frame.onerror=null;
  if(frame.getAttribute('src')!=='about:blank')frame.src='about:blank';
 }
 async function load(restart=false){
  prepare();
  if(!restart&&frame.getAttribute('src')!=='about:blank')return;
  const door=doorKind(game.id);
  if(door==='closed'||isClosed(game.id)){
    unload();
    status.hidden=false;
    status.textContent='Felix’s Instapic photo booth is closed for maintenance. Come back later.';
    return;
  }
  const revision=++loadRevision;
  let session;
  try { session=await resolvePilotSession(game.id); }
  catch(reason){
   if(revision===loadRevision){status.hidden=false;status.textContent='Private play paused: '+reason.message;}
   return;
  }
  if(revision!==loadRevision)return;
  const PF=window.PennyFever;
  if(!session){
  if(door==='ticket'){
    if(!hasSat(game.id)){
      if(doorLock)return;
      doorLock=true;
      if(!PF?.spendTicket||!PF.spendTicket(game.id)){
        doorLock=false;
        status.hidden=false;
        status.textContent='Need a ticket to sit down. Buy a strip from Aura, or cash five pennies for a ticket at her booth.';
        unload();
        return;
      }
      markSat(game.id);
      doorLock=false;
    }
  }else if(door==='penny'){
    if(PF?.spendPennies&&!PF.spendPennies(1)){
      status.hidden=false;
      status.textContent='Need a penny to sit down. Cash a ticket here for five, or buy a roll from Aura. Workshop practice stays free.';
      unload();
      return;
    }
  }
  }
  unload();status.hidden=false;status.textContent='Opening '+game.title+'…';
  frame.onload=()=>{clearTimeout(timer);status.hidden=true;};
  frame.onerror=()=>{clearTimeout(timer);status.hidden=false;status.textContent='This game could not open. Try Restart or return to the alley.';};
  timer=setTimeout(()=>{status.hidden=false;status.textContent='Still opening the paper world… You can wait, restart, or return to the alley.';},20000);
  frame.src=game.src;
 }
 return {id:game.id,chalk:game.host+' — '+game.title,onShow:()=>load(),onLeave:unload,
  onReset(){if(room()&&!room().hidden)load(true);else unload();}};
}

function flyToTreasure(item, canvasX, canvasY){
 if(!item)return;
 const room=document.querySelector('.cabinet-interior.paper-game-cabinet:not([hidden])');
 const chest=room?.querySelector('.paper-game-treasure')||document.getElementById('pfPocketChest');
 if(!chest)return;
 const frame=room?.querySelector('iframe.paper-game-frame');
 const fr=frame?.getBoundingClientRect();
 const startX=fr?fr.left+((Number(canvasX)||868)/900)*fr.width:window.innerWidth*0.72;
 const startY=fr?fr.top+((Number(canvasY)||42)/1200)*fr.height:72;
 const img=document.createElement('img');
 img.className='pf-prize-fly';
 img.alt='';
 img.src=frontUrl(spriteKey(item));
 img.style.left=Math.round(startX-36)+'px';
 img.style.top=Math.round(startY-36)+'px';
 document.body.append(img);
 const dest=chest.getBoundingClientRect();
 const dx=dest.left+dest.width/2-startX;
 const dy=dest.top+dest.height/2-startY;
 const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 requestAnimationFrame(()=>{
  img.style.transform=reduce
   ?`translate(${dx}px,${dy}px) scale(.2)`
   :`translate(${dx}px,${dy}px) scale(.18) rotate(420deg)`;
  img.style.opacity='0.12';
 });
 chest.classList.add('is-prize-catch');
 document.getElementById('pfPocketChest')?.classList.add('is-prize-catch');
 setTimeout(()=>{img.remove();chest.classList.remove('is-prize-catch');document.getElementById('pfPocketChest')?.classList.remove('is-prize-catch');},760);
}

function listenForRoom(){
 if(listenForRoom.bound)return;
 listenForRoom.bound=true;
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin)return;
  const data=event.data;
  if(!data||data.channel!=='pf-paper-world')return;
  if(data.type==='open'&&data.id){
   location.hash='cabinet/'+data.id;
   return;
  }
  if(data.type==='leave'){
   const id=data.id||location.hash.match(/^#cabinet\/([^/]+)/)?.[1];
   leavePaperGame(id);
   return;
  }
  if(data.type!=='prize')return;
  const PF=window.PennyFever, model=window.PennyFeverInventoryModel;
  if(data.fly) flyToTreasure(data.item, data.x, data.y);
  if(!PF?.getState||!model?.recordPaperPrize)return;
  const earned=model.recordPaperPrize(PF.getState(),{item:data.item,stall:data.stall,chapter:data.chapter});
  if(!earned.length)return;
  PF.saveState?.();
  window.dispatchEvent(new CustomEvent('pennyfever:inventoryaward',{detail:{ids:earned,celebrate:false}}));
 });
}
export function registerPaperGameBooths(PF,doc=globalThis.document,nav=globalThis.location){
 listenForRoom();
 const vendors=paperGameRooms.map(game=>createPaperGameVendor(game,doc,nav));
 vendors.forEach(vendor=>{
  PF.registerVendor(vendor);
  const hash=(nav.hash||'').replace(/^#/,'');
  if(hash==='cabinet/'+vendor.id||hash.startsWith('cabinet/'+vendor.id+'/')) vendor.onShow();
 });
 return vendors;
}
if(typeof window!=='undefined'){
 let installed=false;
 const install=()=>{
  if(installed||!window.PennyFever?.registerVendor)return false;
  installed=true;const vendors=registerPaperGameBooths(window.PennyFever);
  const showHash=()=>{
    const id=location.hash.match(/^#cabinet\/([^/]+)/)?.[1];
    vendors.forEach(v=>{if(v.id===id)v.onShow();else v.onLeave();});
  };
  window.addEventListener('hashchange',showHash);
  window.addEventListener('pagehide',()=>vendors.forEach(v=>v.onLeave()));
  window.addEventListener('pageshow',event=>{if(event.persisted)showHash();});
  return true;
 };
 if(!install()){
  document.addEventListener('DOMContentLoaded',install,{once:true});
  window.addEventListener('pf-world-ready',install,{once:true});
 }
}
