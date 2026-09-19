import {games} from '../paper-games/catalogue.js?v=milk-props-1';
import {spriteKey} from '../paper-games/prizes.js?v=ritual-3';
import {frontUrl} from '../paper-games/sprites.js';
import {doorKind, enterLabel, hasSat, markSat, isClosed} from '../paper-games/stall-entry.js?v=entry-3';

const gameBase=new URL('../paper-games/',import.meta.url);
export const paperGameRooms=games.filter(game=>game.ready&&!game.workshop).map(game=>({
 ...game,src:new URL(game.direct||('play.html?stall='+encodeURIComponent(game.id)+'&room=alley&v=chapter-menu-1'),gameBase).href,
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
  cabinet.classList.add('paper-game-cabinet','standard-game-room');
  cabinet.setAttribute('aria-label',game.host+' — '+game.title);
  cabinet.removeAttribute('aria-labelledby');
  stage=doc.createElement('div');stage.className='paper-game-room';
  const bar=doc.createElement('header');bar.className='paper-game-bar';
  const back=doc.createElement('button');back.type='button';back.textContent='← Alley';
  back.addEventListener('click',()=>leavePaperGame(game.id,nav));
  const title=doc.createElement('h1');title.textContent=game.host+' · '+game.title;title.tabIndex=-1;
  const wallet=doc.createElement('span');wallet.className='paper-game-wallet';wallet.setAttribute('aria-live','polite');
  const paintWallet=()=>{
    const PF=window.PennyFever;
    const n=Number(PF?.pennies?.()??PF?.getState?.()?.demoCoins)||0;
    const t=Number(PF?.tickets?.()??PF?.getState?.()?.playTickets)||0;
    const packed=Number(PF?.pennyPacks?.()??PF?.getState?.()?.pennyPacks)||0;
    wallet.textContent=t+' '+(t===1?'ticket':'tickets')+' · '+n+' '+(n===1?'penny':'pennies')+(packed?(' · '+packed+' '+(packed===1?'pack':'packs')):'');
  };
  paintWallet();
  window.addEventListener('pennyfever:statechange',paintWallet);
  const tradeStatus=doc.createElement('p');tradeStatus.className='paper-trade-status';tradeStatus.setAttribute('role','status');
  const cash=doc.createElement('button');cash.type='button';cash.textContent='Cash a ticket · 5 pennies';
  cash.addEventListener('click',()=>{
    const PF=window.PennyFever;
    const got=PF?.cashTicketForPennies?.();
    if(!got){
      tradeStatus.hidden=false;
      tradeStatus.textContent='Need a booth ticket. Buy a strip from Aura’s roll.';
      return;
    }
    tradeStatus.hidden=false;
    tradeStatus.textContent='Five pennies in the purse.';
    paintWallet();
    if(frame&&frame.getAttribute('src')==='about:blank') load();
  });
  const buy=doc.createElement('button');buy.type='button';buy.textContent='Buy a ticket · 5 pennies';
  buy.addEventListener('click',()=>{
    const PF=window.PennyFever;
    if(!PF?.tradePenniesForTicket?.()){
      tradeStatus.hidden=false;
      tradeStatus.textContent='Need five pennies for a ticket. Buy a pack from Aura.';
      return;
    }
    tradeStatus.hidden=false;
    tradeStatus.textContent='A ticket for a sitting.';
    paintWallet();
    if(frame&&frame.getAttribute('src')==='about:blank') load();
  });
  const pack=doc.createElement('button');pack.type='button';pack.textContent='Pack 5 pennies';
  pack.addEventListener('click',()=>{
    const PF=window.PennyFever;
    if(!PF?.packFivePennies?.()){
      tradeStatus.hidden=false;
      tradeStatus.textContent='Need five loose pennies to pack. Packed coins stay out of Copper’s machine.';
      return;
    }
    tradeStatus.hidden=false;
    tradeStatus.textContent='Five pennies packed. Open the pack when you want them back.';
    paintWallet();
  });
  const unpack=doc.createElement('button');unpack.type='button';unpack.textContent='Open a 5-pack';
  unpack.addEventListener('click',()=>{
    const PF=window.PennyFever;
    if(!PF?.unpackFivePennies?.()){
      tradeStatus.hidden=false;
      tradeStatus.textContent='No 5-packs to open.';
      return;
    }
    tradeStatus.hidden=false;
    tradeStatus.textContent='Five pennies back in the purse.';
    paintWallet();
  });
  const chest=doc.createElement('button');chest.type='button';chest.className='paper-game-treasure';
  chest.innerHTML='<span>🗝</span> Treasures';
  const message=(type,fields={})=>frame?.contentWindow?.postMessage({channel:'pf-paper-world',type,...fields},location.origin);
  chest.addEventListener('click',()=>{
    message('pause');
    const opened=window.PennyFeverInventory?.openGame(game.id);
    const book=doc.querySelector('dialog.treasure-book');
    if(opened&&book)book.addEventListener('close',()=>message('resume'),{once:true});
    else message('resume');
  });
  const chapters=doc.createElement('nav');chapters.className='paper-chapter-nav';chapters.setAttribute('aria-label','Choose chapter');
  const previous=doc.createElement('button');previous.type='button';previous.textContent='‹';previous.setAttribute('aria-label','Previous chapter');previous.disabled=true;
  const select=doc.createElement('select');select.setAttribute('aria-label','Choose chapter');select.disabled=true;
  const placeholder=doc.createElement('option');placeholder.textContent='Chapter';select.append(placeholder);
  const next=doc.createElement('button');next.type='button';next.textContent='›';next.setAttribute('aria-label','Next chapter');next.disabled=true;
  let chapter=0,count=0;
  previous.addEventListener('click',()=>message('chapter',{level:chapter-1}));
  next.addEventListener('click',()=>message('chapter',{level:chapter+1}));
  select.addEventListener('change',()=>message('chapter',{level:Number(select.value)}));
  window.addEventListener('message',event=>{
    const data=event.data;
    if(event.origin!==location.origin||event.source!==frame?.contentWindow||data?.channel!=='pf-paper-world'||data.type!=='chapters')return;
    chapter=data.level;count=data.levels.length;select.replaceChildren();
    data.levels.forEach((name,i)=>{const option=doc.createElement('option');option.value=i;option.textContent='Chapter '+(i+1);option.title=name;select.append(option);});
    select.value=chapter;select.disabled=false;previous.disabled=chapter<=0;next.disabled=chapter>=count-1;
  });
  chapters.append(previous,select,next);
  const trade=doc.createElement('button');trade.type='button';trade.textContent='Penny Trade';trade.setAttribute('aria-haspopup','dialog');
  const till=doc.createElement('dialog');till.className='paper-game-trade';till.setAttribute('aria-label','Penny Trade');
  const tillTitle=doc.createElement('h2');tillTitle.textContent='Penny Trade';
  const closeTill=doc.createElement('button');closeTill.type='button';closeTill.textContent='×';closeTill.className='paper-game-menu-close';closeTill.setAttribute('aria-label','Close Penny Trade');
  const description=doc.createElement('p');description.textContent='Trade tickets and pennies, or pack five pennies to keep them out of Copper’s loose purse.';
  const trades=doc.createElement('div');trades.className='paper-trade-actions';trades.append(buy,cash,pack,unpack);
  trade.addEventListener('click',()=>{message('pause');paintWallet();tradeStatus.textContent='';till.showModal();});
  closeTill.addEventListener('click',()=>till.close());
  till.addEventListener('close',()=>{message('resume');trade.focus();});
  till.append(closeTill,tillTitle,wallet,description,trades,tradeStatus);
  const help=doc.createElement('button');help.type='button';help.textContent='Help';help.setAttribute('aria-haspopup','dialog');help.addEventListener('click',()=>message('menu'));
  bar.append(back,chapters,chest,trade,help,title);
  stage.append(till);
  status=doc.createElement('p');status.className='paper-game-status';status.setAttribute('role','status');
  frame=doc.createElement('iframe');frame.className='paper-game-frame';frame.title=game.host+' — '+game.title;
  frame.src='about:blank';
  frame.setAttribute('scrolling','no');
  frame.setAttribute('draggable','false');
  frame.style.touchAction='none';
  frame.style.overscrollBehavior='none';
  stage.append(bar,status,frame);cabinet.append(stage);
 }
 function unload(){
  clearTimeout(timer);timer=null;
  if(!frame)return;
  frame.onload=frame.onerror=null;
  stage?.querySelector('dialog[open]')?.close();
  if(frame.getAttribute('src')!=='about:blank')frame.src='about:blank';
 }
 function load(restart=false){
  prepare();
  if(!restart&&frame.getAttribute('src')!=='about:blank')return;
  const PF=window.PennyFever;
  const door=doorKind(game.id);
  if(door==='closed'||isClosed(game.id)){
    unload();
    status.hidden=false;
    status.textContent='Felix’s Instapic photo booth is closed for maintenance. Come back later.';
    return;
  }
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
  if(data.type==='treasures'){
   const frame=document.querySelector('#cabinet-'+data.id+' iframe.paper-game-frame');
   if(frame?.contentWindow===event.source && window.PennyFeverInventory?.openGame(data.id)){
    document.querySelector('dialog.treasure-book')?.addEventListener('close',()=>{
     frame.contentWindow?.postMessage({channel:'pf-paper-world',type:'resume'},location.origin);
    },{once:true});
   }
   return;
  }
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
