import * as THREE from './lib/three.module.min.js';
import {paperRail} from './paper-guest-entrance.js?v=wall-front-1';
import {PAPERCUT_VIEWS} from './amusements/catalogue.js?v=names-1';
import {AURA_BOOTH_FRAMES} from './papercut-frames.js';
import {loadFramedPng,buildPapercut,setPapercutFace,showPapercutView} from './amusements/cutouts.js?v=names-1';
import {stallViewIndex} from './stall-cutouts.js?v=aura-front-1';
import {mountTill, openTill, closeTill, tillPinned, bankLoan, paintBankLoan} from './ticket-till.js?v=bank-refresh-1';
import {openTradeshow, tradeshowBlocked, tradeshowSign} from './aura-tradeshow.js?v=booth-convert-1';
// Ticket service just inside the alley, clear of the foyer passage.
export const COUNTER={x:-2.2,z:6.0};
export const LOOP_START={x:0,z:3.5};
const C={kraft:0xc2a477,green:0x435637,red:0x703b33,dark:0x39291b,gold:0xd2b073};
const mats=Object.fromEntries(Object.entries(C).map(([k,color])=>[k,new THREE.MeshStandardMaterial({color,roughness:1,metalness:0})]));
function box(parent,w,h,d,x,y,z,material=mats.kraft){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh}
function label(text,w,h){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=192;const c=canvas.getContext('2d');c.fillStyle='#d7bf91';c.fillRect(0,0,1024,192);c.strokeStyle='#765431';c.lineWidth=10;c.strokeRect(10,10,1004,172);c.fillStyle='#382717';let size=75;c.font=`bold ${size}px Georgia`;while(c.measureText(text).width>945&&size>24)c.font=`bold ${--size}px Georgia`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,512,98);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide}))}
let ticketBooth=null;
export function makeVisibleTicketBooth(scene){
 if(!paperRail)return;
 const g=new THREE.Group();g.name='Aura ticket booth · papercut';
 g.position.set(COUNTER.x-.35,0,COUNTER.z-.15);
 // Angled toward walkers coming up the alley, the same way the stalls are (alley.js FACE_PULL 3.2 on the paper rail).
 g.rotation.y=Math.atan2(-(COUNTER.x-.35),-3.2);scene.add(g);ticketBooth=g;
 const stub=new THREE.Group();stub.name='Ticket booth placeholder';
 box(stub,1.6,2.4,.7,0,1.2,0,mats.green);
 box(stub,1.7,.12,.78,0,2.42,0,mats.gold);
 g.add(stub);
 const opts={height:2.85,maxWidth:2.4,sideWidth:1.35,layout:'stand'};
 const ROOT='assets/restyle/scene-turnarounds-2026-09-09/aura/ticket-booth/';
 loadFramedPng(ROOT+'front.webp',AURA_BOOTH_FRAMES.front,{urgent:true}).then(async front=>{
  stub.removeFromParent();
  const cut=buildPapercut({front},opts);g.add(cut);
  g.userData.papercutViews=cut.userData.papercutViews;g.userData.papercutStand=cut;
  for(const view of PAPERCUT_VIEWS){
   if(view==='front')continue;
   const face=await loadFramedPng(ROOT+view+'.webp',AURA_BOOTH_FRAMES[view],{urgent:true});
   if(!cut.parent){face.texture?.dispose();return;}
   setPapercutFace(cut,view,face,opts);
   g.userData.papercutViews=cut.userData.papercutViews;
  }
 }).catch(error=>console.warn('[Penny Fever] Aura ticket booth',error.message));
 const warm=new THREE.PointLight(0xffddaa,1.7,5,2);warm.position.set(COUNTER.x,1.6,COUNTER.z-1);scene.add(warm);
 return g;
}
export function updateTicketBooth(eye,camera){
 // Same as the stalls: face picked from the camera (what the guest sees), with front hysteresis.
 const look=camera||eye;
 if(!ticketBooth?.userData.papercutViews||!look)return;
 showPapercutView(ticketBooth, Number.isInteger(ticketBooth.userData.pinView)?ticketBooth.userData.pinView:stallViewIndex(ticketBooth,look));
}
// Shallow scenery behind the stalls leaves the playable aisle clear.
// Reuse box geometry and materials to keep the long street inexpensive to draw.
export function makePaperWalls(scene,len){
 const street=new THREE.Group();street.name='Layered paper sideshow street';scene.add(street);
 const unit=new THREE.BoxGeometry(1,1,1),batches=new Map();
 function card(mat,w,h,d,x,y,z){if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push({w,h,d,x,y,z});}
 // Rear backing only — behind the illustrated walls at x=±5.4 (walls/catalogue WALL_RADIAL).
 // Keep it past the walls or it hides them (it sat at 5.28 when the walls moved to 5.4).
 for(const side of [-1,1]){
  card(mats.dark,.2,4.7,len+2,side*5.9,2.35,len/2);
  card(mats.kraft,.16,.12,len+2,side*5.76,.12,len/2);
 }
 // A paper boardwalk and narrow red borders tie the shopfronts together.
 card(mats.kraft,3.45,.018,len,0,.025,len/2);
 for(const side of [-1,1])card(mats.red,.09,.025,len,side*1.69,.041,len/2);
 for(let z=.6;z<len;z+=1.34)card(mats.dark,3.3,.008,.018,0,.038,z);
 card(mats.green,12,3.6,.18,0,1.8,len+1.6);
 for(let x=-4.8;x<=4.8;x+=.8)card(mats.kraft,.07,3.6,.08,x,1.8,len+1.47);
 const dummy=new THREE.Object3D();
 for(const [mat,parts] of batches){
  const mesh=new THREE.InstancedMesh(unit,mat,parts.length);
  parts.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.scale.set(p.w,p.h,p.d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
  mesh.instanceMatrix.needsUpdate=true;street.add(mesh);
 }
 // Papercut shopfront bays, same craft as the palace entrance — not the busy hall photos.
 // Illustrated stall walls replace the repeating printed murals.
}
export function extendPaperAlley(scene,len){if(!paperRail)return;
 for(let z=1;z<len;z+=6.6)for(const side of [-1,1]){box(scene,.11,3.9,.12,side*5.96,1.95,z,mats.kraft);box(scene,.16,.12,2.5,side*5.98,3.55,z+1.25,mats.red)}
 const sign=label('A PENNY · ANOTHER LAP',4.4,.65);sign.position.set(0,2.7,len+.32);sign.rotation.y=Math.PI;scene.add(sign);
}
let panel,playerRef,auraRef,apiRef,dismissed=false;
const AURA_DOOR_TAPS_NEEDED=3;
let auraDoorTaps=0;
let auraPanelSince=0;
function near(){
  if(!playerRef||!auraRef)return false;
  const dx=playerRef.position.x-auraRef.position.x;
  const dz=playerRef.position.z-auraRef.position.z;
  return Math.hypot(dx,dz)<2.65 && playerRef.position.x<-0.28;
}
function pocketCount(){return Math.max(0,Math.floor(Number(apiRef?.getState?.()?.demoCoins)||0))}
function ticketCount(){return Math.max(0,Math.floor(Number(apiRef?.tickets?.()??apiRef?.getState?.()?.playTickets)||0))}
function walletLines(){
 const state=apiRef?.getState?.()||{};
 const coins=pocketCount();
 const tix=ticketCount();
 const lines=[
  `${tix} booth ${tix===1?'ticket':'tickets'}`,
  `${coins} ${coins===1?'penny':'pennies'}`,
 ];
 const model=window.PennyFeverInventoryModel;
 if(model?.entries){
  for(const d of model.entries(state)){
   if(!d.owned||!d.quantity)continue;
   if(d.id==='everyday-penny'||d.id==='ticket-roll')continue;
   const money=d.kind==='currency'||d.kind==='scrip'||d.kind==='ticket'||d.kind==='pass'||d.collection==='pennies'||d.collection==='tickets';
   if(!money)continue;
   if(d.kind==='ticket'||d.kind==='pass')lines.push(d.name+' · '+d.status);
   else lines.push(d.quantity>1?`${d.quantity} × ${d.name}`:d.name);
  }
 }
 return lines;
}
export function paintAuraWallet(root){
 const host=root||panel;
 if(!host)return;
 const list=host.querySelector('#auraCounterWalletList')||host.querySelector('#pfAuraWalletList');
 if(!list)return;
 list.replaceChildren();
 for(const line of walletLines()){
  const li=document.createElement('li');
  li.textContent=line;
  list.append(li);
 }
 const trade=host.querySelector('#auraCounterTrade')||host.querySelector('#pfTillTrade');
 if(trade){
  const coins=pocketCount();
  trade.disabled=coins<5;
  trade.textContent=coins<5?'Need 5 pennies · 1 ticket':'Trade 5 pennies · 1 ticket';
 }
}
export function installTicketService(player,aura,api){if(!paperRail)return;playerRef=player;auraRef=aura;apiRef=api;mountTill(api);panel=document.createElement('aside');panel.className='aura-counter-service';panel.hidden=true;panel.setAttribute('aria-label',"Aura's ticket booth");panel.innerHTML='<button type="button" class="aura-counter-close" id="auraCounterClose" aria-label="Close ticket booth">×</button><strong>Aura’s ticket booth</strong><section class="aura-counter-wallet" aria-label="Current wallet"><p class="aura-counter-kicker">Your pocket</p><ul id="auraCounterWalletList"></ul></section><div class="aura-counter-actions"><button type="button" id="auraCounterAdmission">Show ticket</button><button type="button" id="auraCounterTrade">Trade 5 pennies · 1 ticket</button><button type="button" id="auraCounterCoins">Buy tickets &amp; pennies</button><button type="button" id="auraCounterTradeshow">VIP NFT Tradeshow</button><button type="button" id="auraCounterLoan" disabled>Bank loan · Off</button><button type="button" id="auraCounterReset">Reset game</button></div><small id="auraCounterMessage" aria-live="polite">First walk is free. After that, a penny a lap. Square is only for buying packs. Reset lives here. Bank loan follows the admin switch.</small>';document.body.append(panel);
 panel.querySelector('#auraCounterClose').onclick=()=>{dismissed=true;panel.hidden=true;closeTill();};
 panel.querySelector('#auraCounterCoins').onclick=()=>{
  if(!near())return;
  openTill();
  panel.querySelector('#auraCounterMessage').textContent='Choose a pack. Square takes the till.';
 };
 panel.querySelector('#auraCounterTradeshow').onclick=()=>{
  if(!near())return;
  const note=panel.querySelector('#auraCounterMessage');
  if(tradeshowBlocked()){
    note.textContent=tradeshowSign();
    return;
  }
  dismissed=true;panel.hidden=true;closeTill();
  openTradeshow();
 };
 panel.querySelector('#auraCounterTrade').onclick=()=>{
  if(!near())return;
  const note=panel.querySelector('#auraCounterMessage');
  if(apiRef?.tradePenniesForTicket?.()){
   note.textContent='One booth ticket from five pennies.';
   paintAuraWallet();
   return;
  }
  note.textContent='Need five pennies for a ticket.';
  paintAuraWallet();
 };
 paintBankLoan();
 window.addEventListener('pf-till-config', paintBankLoan);
 panel.querySelector('#auraCounterLoan').onclick=()=>{
  if(!near())return;
  const loan=bankLoan();
  const note=panel.querySelector('#auraCounterMessage');
  if(!loan.enabled){
   note.textContent='Bank loan is off.';
   return;
  }
  if(apiRef?.addDemoCoins) apiRef.addDemoCoins(loan.pennies);
  note.textContent=`Bank loan · +${loan.pennies} pennies.`;
  paintAuraWallet();
 };
 panel.querySelector('#auraCounterReset').onclick=()=>{
  if(!near())return;
  apiRef.resetVisit?.();
 };
 panel.querySelector('#auraCounterAdmission').onclick=()=>{
  if(!near())return;
  if(performance.now()-auraPanelSince<400)return;
  const state=apiRef.getState();
  const note=panel.querySelector('#auraCounterMessage');
  const laps=Number(state.alleyLaps)||0;
  if(state.admitPassed){note.textContent='This lap is punched. Walk the boards.';auraDoorTaps=0;return;}
  auraDoorTaps+=1;
  if(auraDoorTaps<AURA_DOOR_TAPS_NEEDED){
    note.textContent=laps===0
      ?`Take the ticket · ${auraDoorTaps}/${AURA_DOOR_TAPS_NEEDED} taps.`
      :`Pay a penny · ${auraDoorTaps}/${AURA_DOOR_TAPS_NEEDED} taps.`;
    paintAuraWallet();
    return;
  }
  if(laps===0){
    const had=!!state.admitTicket;
    apiRef.admitAlleyLap('ticket');
    auraDoorTaps=0;
    note.textContent=had?'Ticket shown. Enjoy the walk.':'In you go.';
    paintAuraWallet();
    return;
  }
  if(apiRef.admitAlleyLap('penny')){
    auraDoorTaps=0;
    note.textContent='A penny for this lap. Enjoy the walk.';
    paintAuraWallet();
    return;
  }
  auraDoorTaps=AURA_DOOR_TAPS_NEEDED-1;
  note.textContent='Need a penny for the next walk. Trade five pennies for a ticket here, or buy a pack.';
 };
 window.addEventListener('pennyfever:statechange',()=>paintAuraWallet());
}
export function updateTicketService(){
 if(!panel)return;
 const here=!!near()&&document.body.classList.contains('is-in-world');
 if(!here){
  dismissed=false;
  auraDoorTaps=0;
  panel.hidden=true;
  if(!tillPinned()) closeTill();
  return;
 }
 if(dismissed){
  panel.hidden=true;
  if(!tillPinned()) closeTill();
  return;
 }
 if(panel.hidden) auraPanelSince=performance.now();
 panel.hidden=false;
 const state=apiRef.getState();
 const laps=Number(state.alleyLaps)||0;
 paintAuraWallet();
 const admit=panel.querySelector('#auraCounterAdmission');
 admit.disabled=!!state.admitPassed;
 if(state.admitPassed) admit.textContent='This lap is punched ✓';
 else if(auraDoorTaps>0) admit.textContent=`${laps===0?'Take ticket':'Pay a penny'} · ${auraDoorTaps}/${AURA_DOOR_TAPS_NEEDED}`;
 else admit.textContent=laps===0?'Take ticket · 3 taps':'Pay a penny · 3 taps';
}
