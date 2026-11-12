import {PAPERCUT_VIEWS} from './amusements/catalogue.js?v=names-1';
import {STALL_FRAMES} from './papercut-frames.js';
import {loadFramedPng,buildPapercut,setPapercutFace,showPapercutView,disposePapercutStand} from './amusements/cutouts.js?v=names-1';
import {PAPERCUT_NEAR,PAPERCUT_FAR,PAPERCUT_SIDES,PAPERCUT_INFLIGHT} from './phone-lane.js?v=keep-light-1';

const ROOT='assets/restyle/scene-turnarounds-2026-09-09/stalls/';
const NEAR=PAPERCUT_NEAR;
const FAR=PAPERCUT_FAR;
const SIDE_NEAR=PAPERCUT_SIDES;
// Pick the stall face from the camera (what the guest actually sees), not the
// paper doll, which walks several metres ahead of the camera. A little hysteresis
// keeps the front art up while walking up, and only turns to the side once the
// camera is truly alongside.
const FRONT_HOLD=Math.PI*56/180,FRONT_BACK=Math.PI*46/180;
export function stallViewIndex(figure,eye){
 const p=eye&&(eye.position||eye);
 const bearing=Math.atan2((p?.x??0)-figure.position.x,(p?.z??0)-figure.position.z);
 const yaw=figure.rotation.y;
 const angle=Math.atan2(Math.sin(bearing-yaw),Math.cos(bearing-yaw)),a=Math.abs(angle);
 const was=figure.userData.autoView??0;
 const view=a<(was===0?FRONT_HOLD:FRONT_BACK)?0:a>Math.PI*3/4?2:angle>0?3:1;
 figure.userData.autoView=view;
 return view;
}

function optsFor(id){
 const tall=id==='high-striker';
 return {height:tall?4.25:3.5,maxWidth:2.6,sideWidth:1.45,layout:'stand'};
}

export function installStallCutouts(stalls,{load=loadFramedPng}={}){
 const figures=[];
 for(const stall of stalls){
  const id=stall.userData.stall?.id;if(!id||!STALL_FRAMES[id])continue;
  stall.userData.amusementId=id;
  figures.push(stall);
 }
 const inflight=[];
 let active=true,dead=false,currentZ=14,currentCam=null;
 function hideFallback(stall){
  const shell=stall.children.find(c=>c.name&&c.name.includes("'s ")&&c!==stall.userData.paperPlaceholder);
  if(shell)for(const child of shell.children)child.visible=false;
  if(stall.userData.paperPlaceholder)stall.userData.paperPlaceholder.visible=false;
 }
 function showFallback(stall){
  if(stall.userData.paperPlaceholder)stall.userData.paperPlaceholder.visible=true;
 }
 function release(figure){
  const job=inflight.find(j=>j.figure===figure);
  if(job)job.controller.abort();
  disposePapercutStand(figure);
  figure.userData.loading=false;
  showFallback(figure);
 }
 async function run(job){
  const {figure,controller}=job,id=figure.userData.stall.id,opts=optsFor(id);
  try{
   const front=await load(ROOT+id+'/front.webp',STALL_FRAMES[id].front,{signal:controller.signal});
   if(dead||!active||controller.signal.aborted||!figure.parent||figure.userData.papercutStand){front.texture?.dispose();return;}
   const cut=buildPapercut({front},opts);
   cut.position.z=.2;
   figure.add(cut);figure.userData.papercutViews=cut.userData.papercutViews;figure.userData.papercutStand=cut;
   hideFallback(figure);
   figure.userData.needSides=true;
   for(const view of PAPERCUT_VIEWS){
    if(view==='front')continue;
    if(dead||!active||controller.signal.aborted||!figure.parent)return;
    const face=await load(ROOT+id+'/'+view+'.webp',STALL_FRAMES[id][view],{signal:controller.signal});
    if(!figure.parent||figure.userData.papercutStand!==cut||controller.signal.aborted){face.texture?.dispose();return;}
    setPapercutFace(cut,view,face,opts);
    figure.userData.papercutViews=cut.userData.papercutViews;
   }
   if(figure.userData.papercutStand===cut)figure.userData.needSides=false;
  }catch(error){
   if(!controller.signal.aborted)console.warn('[Penny Fever stalls]',id,error.message);
  }finally{
   figure.userData.loading=false;
   const i=inflight.indexOf(job);if(i>=0)inflight.splice(i,1);
  }
 }
 async function fillSides(figure){
  if(!figure.userData.needSides||figure.userData.sidesLoading)return;
  const id=figure.userData.stall.id,cut=figure.userData.papercutStand;
  if(!cut||!STALL_FRAMES[id])return;
  figure.userData.sidesLoading=true;
  const opts=optsFor(id);
  const controller=new AbortController();
  const job={figure,controller,sides:true};
  inflight.push(job);
  try{
   for(const view of PAPERCUT_VIEWS){
    if(view==='front')continue;
    if(dead||!figure.parent||controller.signal.aborted)return;
    const face=await load(ROOT+id+'/'+view+'.webp',STALL_FRAMES[id][view],{signal:controller.signal});
    if(!figure.parent||figure.userData.papercutStand!==cut||controller.signal.aborted){face.texture?.dispose();return;}
    setPapercutFace(cut,view,face,opts);
    figure.userData.papercutViews=cut.userData.papercutViews;
   }
   if(figure.userData.papercutStand===cut)figure.userData.needSides=false;
  }catch(error){
   if(error?.message&&!controller.signal.aborted)console.warn('[Penny Fever stalls]',id,error.message);
  }finally{
   figure.userData.sidesLoading=false;
   const i=inflight.indexOf(job);if(i>=0)inflight.splice(i,1);
  }
 }
 function start(figure){
  const controller=new AbortController();
  figure.userData.loading=true;const job={figure,controller};inflight.push(job);run(job);
 }
 function update(camera,z,eye){
  if(camera)currentCam=camera;
  if(typeof z==='number')currentZ=z;else if(camera)currentZ=camera.position.z;
  const look=currentCam||eye;
  if(look){
   for(const figure of figures){
    if(!figure.userData.papercutViews)continue;
    showPapercutView(figure, Number.isInteger(figure.userData.pinView)?figure.userData.pinView:stallViewIndex(figure,look));
   }
  }
  if(dead||!active)return;
  for(const figure of figures){
   if(figure.userData.papercutStand&&Math.abs(figure.position.z-currentZ)>=FAR)release(figure);
  }
  const queued=figures.filter(f=>!f.userData.papercutStand&&!f.userData.loading)
   .sort((a,b)=>Math.abs(a.position.z-currentZ)-Math.abs(b.position.z-currentZ));
  while(inflight.length<PAPERCUT_INFLIGHT){
   const next=queued[0];
   if(!next||Math.abs(next.position.z-currentZ)>=NEAR)break;
   queued.shift();start(next);
  }
  if(inflight.length<PAPERCUT_INFLIGHT){
   const sideNext=figures.find(f=>f.userData.needSides&&!f.userData.sidesLoading&&Math.abs(f.position.z-currentZ)<SIDE_NEAR);
   if(sideNext)fillSides(sideNext);
  }
 }
 function pause(){active=false;inflight.slice().forEach(job=>job.controller.abort());}
 function resume(){if(dead)return;active=true;update(currentCam,currentZ);}
 function dispose(){if(dead)return;pause();figures.forEach(release);dead=true;figures.length=0;}
 update(null,14);
 return {update,pause,resume,dispose,figures};
}
