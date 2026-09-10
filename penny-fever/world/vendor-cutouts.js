import {VENDOR_DESIGNS} from './vendor-designs.js';
import {PAPERCUT_VIEWS} from './amusements/catalogue.js?v=paper-alley-live-2';
import {VENDOR_FRAMES} from './papercut-frames.js';
import {loadFramedPng,buildPapercut,setPapercutFace,papercutViewIndex,showPapercutView} from './amusements/cutouts.js?v=paper-alley-live-4';
import {PAPERCUT_NEAR,PAPERCUT_SIDES,PAPERCUT_INFLIGHT} from './phone-lane.js?v=paper-alley-live-4';

const ROOT='assets/restyle/scene-turnarounds-2026-09-09/vendors/';
const NEAR=PAPERCUT_NEAR;
const SIDE_NEAR=PAPERCUT_SIDES;

export function installVendorCutouts(barkers){
 const figures=[];
 for(const person of barkers){
  const d=VENDOR_DESIGNS[person.userData.stallId];if(!d)continue;
  const host=d.host.toLowerCase();
  if(!VENDOR_FRAMES[host])continue;
  person.children.forEach(child=>{child.visible=false;globalThis.PennyFeverRestyle?.noteLiveBody(child);});
  person.userData.crewName=d.host;
  person.userData.vendorHost=host;
  figures.push(person);
 }
 const inflight=[];
 let active=true,dead=false,currentZ=14,currentCam=null;
 async function run(job){
  const {figure,controller}=job,host=figure.userData.vendorHost,opts={height:1.7,maxWidth:1.2,sideWidth:.55,layout:'stand'};
  try{
   const front=await loadFramedPng(ROOT+host+'/front.png',VENDOR_FRAMES[host].front,{signal:controller.signal});
   if(dead||!active||controller.signal.aborted||!figure.parent){front.texture?.dispose();return;}
   const cut=buildPapercut({front},opts);
   figure.add(cut);figure.userData.papercutViews=cut.userData.papercutViews;figure.userData.papercutStand=cut;
   figure.userData.needSides=true;
  }catch(error){
   if(!controller.signal.aborted)console.warn('[Penny Fever vendors]',host,error.message);
  }finally{
   figure.userData.loading=false;
   const i=inflight.indexOf(job);if(i>=0)inflight.splice(i,1);
  }
 }
 async function fillSides(figure){
  if(!figure.userData.needSides||figure.userData.sidesLoading)return;
  const host=figure.userData.vendorHost,cut=figure.userData.papercutStand;
  if(!cut||!VENDOR_FRAMES[host])return;
  figure.userData.sidesLoading=true;
  const opts={height:1.7,maxWidth:1.2,sideWidth:.55,layout:'stand'};
  try{
   for(const view of PAPERCUT_VIEWS){
    if(view==='front')continue;
    if(dead||!figure.parent)return;
    const face=await loadFramedPng(ROOT+host+'/'+view+'.png',VENDOR_FRAMES[host][view]);
    if(!figure.parent){face.texture?.dispose();return;}
    setPapercutFace(cut,view,face,opts);
    figure.userData.papercutViews=cut.userData.papercutViews;
   }
   figure.userData.needSides=false;
  }catch(error){
   if(error?.message)console.warn('[Penny Fever vendors]',host,error.message);
  }finally{figure.userData.sidesLoading=false;}
 }
 function start(figure){
  const controller=new AbortController();
  figure.userData.loading=true;const job={figure,controller};inflight.push(job);run(job);
 }
 function update(camera,z,eye){
  if(camera)currentCam=camera;
  if(typeof z==='number')currentZ=z;else if(camera)currentZ=camera.position.z;
  const look=eye||currentCam;
  if(look){
   for(const figure of figures){
    if(!figure.userData.papercutViews)continue;
    figure.scale.z=figure.scale.x;
    showPapercutView(figure,papercutViewIndex(figure,look));
   }
  }
  if(dead||!active)return;
  for(const figure of figures){
   if(figure.userData.needSides&&Math.abs(figure.position.z-currentZ)<SIDE_NEAR)fillSides(figure);
  }
  const queued=figures.filter(f=>!f.userData.papercutStand&&!f.userData.loading)
   .sort((a,b)=>Math.abs(a.position.z-currentZ)-Math.abs(b.position.z-currentZ));
  while(inflight.length<PAPERCUT_INFLIGHT){
   const next=queued[0];
   if(!next||Math.abs(next.position.z-currentZ)>=NEAR)break;
   queued.shift();start(next);
  }
 }
 function pause(){active=false;inflight.slice().forEach(job=>job.controller.abort());}
 function resume(){if(dead)return;active=true;update(currentCam,currentZ);}
 function dispose(){
  if(dead)return;pause();dead=true;figures.length=0;
 }
 update(null,14);
 return {update,pause,resume,dispose,figures};
}
