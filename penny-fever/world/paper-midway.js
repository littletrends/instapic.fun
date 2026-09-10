import * as THREE from './lib/three.module.min.js';
import {paperRail} from './paper-guest-entrance.js';
import {PAPERCUT_VIEWS} from './amusements/catalogue.js?v=paper-alley-live-2';
import {AURA_BOOTH_FRAMES} from './papercut-frames.js';
import {loadFramedPng,buildPapercut,setPapercutFace,papercutViewIndex,showPapercutView} from './amusements/cutouts.js?v=paper-alley-live-4';
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
 g.position.set(COUNTER.x-.35,0,COUNTER.z-.15);g.rotation.y=Math.PI/2;scene.add(g);ticketBooth=g;
 const opts={height:2.85,maxWidth:2.4,sideWidth:1.35,layout:'stand'};
 const ROOT='assets/restyle/scene-turnarounds-2026-09-09/aura/ticket-booth/';
 loadFramedPng(ROOT+'front.png',AURA_BOOTH_FRAMES.front,{urgent:true}).then(async front=>{
  const cut=buildPapercut({front},opts);g.add(cut);
  g.userData.papercutViews=cut.userData.papercutViews;g.userData.papercutStand=cut;
  for(const view of PAPERCUT_VIEWS){
   if(view==='front')continue;
   const face=await loadFramedPng(ROOT+view+'.png',AURA_BOOTH_FRAMES[view],{urgent:true});
   if(!cut.parent){face.texture?.dispose();return;}
   setPapercutFace(cut,view,face,opts);
   g.userData.papercutViews=cut.userData.papercutViews;
  }
 }).catch(error=>console.warn('[Penny Fever] Aura ticket booth',error.message));
 const warm=new THREE.PointLight(0xffddaa,1.7,5,2);warm.position.set(COUNTER.x,1.6,COUNTER.z-1);scene.add(warm);
 return g;
}
export function updateTicketBooth(eye){
 if(!ticketBooth?.userData.papercutViews||!eye)return;
 showPapercutView(ticketBooth,papercutViewIndex(ticketBooth,eye));
}
// Shallow scenery behind the stalls leaves the playable aisle clear.
// Reuse box geometry and materials to keep the long street inexpensive to draw.
export function makePaperWalls(scene,len){
 const street=new THREE.Group();street.name='Layered paper sideshow street';scene.add(street);
 const unit=new THREE.BoxGeometry(1,1,1),batches=new Map();
 function card(mat,w,h,d,x,y,z){if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push({w,h,d,x,y,z});}
 // Rear backing only — behind the illustrated walls at x=±4.86. Front bay
 // cards used to hide those walls; that gap stays free for later 3D booths.
 for(const side of [-1,1]){
  card(mats.dark,.2,4.7,len+2,side*5.28,2.35,len/2);
  card(mats.kraft,.16,.12,len+2,side*5.14,.12,len/2);
 }
 // A paper boardwalk and narrow red borders tie the shopfronts together.
 card(mats.kraft,3.45,.018,len,0,.025,len/2);
 for(const side of [-1,1])card(mats.red,.09,.025,len,side*1.69,.041,len/2);
 for(let z=.6;z<len;z+=1.34)card(mats.dark,3.3,.008,.018,0,.038,z);
 card(mats.green,9.8,3.6,.18,0,1.8,len+1.6);
 for(let x=-4;x<=4;x+=.8)card(mats.kraft,.07,3.6,.08,x,1.8,len+1.47);
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
 for(let z=5.8;z<len-3;z+=10.72){
  const light=new THREE.PointLight(0xffd39b,1.3,10,2);light.position.set(0,3.1,z+1);scene.add(light);
 }
 for(let z=1;z<len;z+=5.2)for(const side of [-1,1]){box(scene,.11,3.9,.12,side*5.36,1.95,z,mats.kraft);box(scene,.16,.12,2.5,side*5.38,3.55,z+1.25,mats.red)}
 const sign=label('A PENNY · ANOTHER LAP',4.4,.65);sign.position.set(0,2.7,len+.32);sign.rotation.y=Math.PI;scene.add(sign);
}
let panel,playerRef,auraRef,apiRef,dismissed=false;
function near(){return playerRef&&auraRef&&Math.hypot(playerRef.position.x-auraRef.position.x,playerRef.position.z-auraRef.position.z)<2.65}
export function installTicketService(player,aura,api){if(!paperRail)return;playerRef=player;auraRef=aura;apiRef=api;panel=document.createElement('aside');panel.className='aura-counter-service';panel.hidden=true;panel.innerHTML='<button type="button" class="aura-counter-close" id="auraCounterClose" aria-label="Close ticket booth">×</button><strong>Aura’s ticket booth</strong><span id="auraCounterWallet"></span><div><button type="button" id="auraCounterAdmission">Take an admission ticket</button><button type="button" id="auraCounterCoins" hidden>Fill empty pocket</button></div><small id="auraCounterMessage" aria-live="polite">A ticket for the first walk. A penny after that.</small>';document.body.append(panel);
 panel.querySelector('#auraCounterClose').onclick=()=>{dismissed=true;panel.hidden=true;};
 panel.querySelector('#auraCounterCoins').onclick=()=>{
  if(!near())return;
  const coins=Number(apiRef.getState().demoCoins)||0;
  if(coins>0)return;
  const n=apiRef.addDemoCoins(3);
  panel.querySelector('#auraCounterMessage').textContent=`${n} souvenir pennies. Only when the pocket is empty — not each lap.`;
 };
 panel.querySelector('#auraCounterAdmission').onclick=()=>{
  if(!near())return;
  const state=apiRef.getState();
  const note=panel.querySelector('#auraCounterMessage');
  const laps=Number(state.alleyLaps)||0;
  if(state.admitPassed){note.textContent='This lap is punched. Walk the boards.';return;}
  if(laps===0){
    const had=!!state.admitTicket;
    apiRef.admitAlleyLap('ticket');
    note.textContent=had?'Ticket shown. Enjoy the walk.':'In you go.';
    return;
  }
  if(apiRef.admitAlleyLap('penny')){note.textContent='A penny for this lap. Enjoy the walk.';return;}
  note.textContent='Need a penny. Fill an empty pocket, then pay for the walk.';
 };
}
export function updateTicketService(){
 if(!panel)return;
 const here=!!near()&&document.body.classList.contains('is-in-world');
 if(!here){dismissed=false;panel.hidden=true;return;}
 if(dismissed){panel.hidden=true;return;}
 panel.hidden=false;
 const state=apiRef.getState();
 const laps=Number(state.alleyLaps)||0;
 const empty=!(Number(state.demoCoins)>0);
 panel.querySelector('#auraCounterWallet').textContent=`Your pocket: ${state.demoCoins} ${Number(state.demoCoins)===1?'penny':'pennies'}`;
 const admit=panel.querySelector('#auraCounterAdmission');
 admit.disabled=!!state.admitPassed;
 admit.textContent=state.admitPassed?'This lap is punched ✓':laps===0?(state.admitTicket?'Show ticket · one lap':'Come through'):'Pay a penny · one lap';
 panel.querySelector('#auraCounterCoins').hidden=!empty;
}
