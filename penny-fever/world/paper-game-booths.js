import {games} from '../paper-games/catalogue.js?v=penny-door-1';
import {spriteKey} from '../paper-games/prizes.js?v=purse-1';
import {frontUrl} from '../paper-games/sprites.js';

const gameBase=new URL('../paper-games/',import.meta.url);
export const paperGameRooms=games.filter(game=>game.ready&&!game.workshop).map(game=>({
 ...game,src:new URL(game.direct||('play.html?stall='+encodeURIComponent(game.id)+'&room=alley&v=purse-1'),gameBase).href,
}));

// These rooms already charge a penny per throw/crank. Opening the table is free;
// the purse is spent inside. Sit-down rooms (rides, Iris, Rosalie) cost one penny
// to load. Workshop play.html without room=alley stays free and writes nothing.
const PENNY_TABLE=new Set([
 'coin-pusher','pinball','milk-bottles','skee-ball','ball-toss','bent-rings',
 'catoptromancy','cover-the-spot','curios','duck-pond','dunk-tank','fairy-floss',
 'high-striker','lookup','marquee','mutoscope','pack','pass','penny-pitch',
 'plinko','popcorn','snap','water-gun','whisper',
]);
function isPennyTable(id){return PENNY_TABLE.has(id);}

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
  const pennyPlay=isPennyTable(game.id);
  const retry=doc.createElement('button');retry.type='button';
  retry.textContent=game.id==='coin-pusher'?'The trays stay':game.id==='pinball'?'The spring waits':game.id==='milk-bottles'?'The dairy waits':game.id==='skee-ball'?'The moon waits':pennyPlay?'The table waits':'Play again · 1 penny';
  if(pennyPlay){
    retry.disabled=true;
    retry.title='Leave and come back — this table remembers. Pennies are spent on each play.';
  }else retry.addEventListener('click',()=>load(true));
  const wallet=doc.createElement('span');wallet.className='paper-game-wallet';wallet.setAttribute('aria-live','polite');
  const paintWallet=()=>{
    const PF=window.PennyFever;
    const n=Number(PF?.pennies?.()??PF?.getState?.()?.demoCoins)||0;
    const t=Number(PF?.tickets?.()??PF?.getState?.()?.playTickets)||0;
    wallet.textContent=t+' '+(t===1?'ticket':'tickets')+' · '+n+' '+(n===1?'penny':'pennies');
  };
  paintWallet();
  window.addEventListener('pennyfever:statechange',paintWallet);
  const cash=doc.createElement('button');cash.type='button';cash.textContent='Cash a ticket · 5 pennies';
  cash.addEventListener('click',()=>{
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
  const chest=doc.createElement('button');chest.type='button';chest.className='paper-game-treasure';
  chest.innerHTML='<span>🗝</span> Treasures';
  chest.addEventListener('click',()=>window.PennyFeverInventory?.open());
  bar.append(back,title,list,wallet,cash,retry,chest);
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
  const PF=window.PennyFever;
  const pennyPlay=isPennyTable(game.id);
  if(!pennyPlay){
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
  if(data.type==='open'&&data.id){
   location.hash='cabinet/'+data.id;
   return;
  }
  if(data.type==='leave'){
   const live=new URL(location.href);
   live.searchParams.set('style','paper');
   live.searchParams.set('rail','paper');
   live.hash='alley';
   location.href=live.href;
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
