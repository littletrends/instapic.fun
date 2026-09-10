import {PAPERCUT_VIEWS} from './amusements/catalogue.js';
import {STALL_FRAMES} from './papercut-frames.js';
import {loadFramedPng,buildPapercut,setPapercutFace,papercutViewIndex,showPapercutView} from './amusements/cutouts.js';

const ROOT='assets/restyle/scene-turnarounds-2026-09-09/stalls/';
const NEAR=52;

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
  const shell=stall.children.find(c=>c.name&&c.name.includes("'s "));
  if(!shell)return;
  for(const child of shell.children)if(!child.name.endsWith(' walking sign'))child.visible=false;
 }
 async function run(job){
  const {figure,controller}=job,id=figure.userData.stall.id,opts=optsFor(id);
  try{
   const front=await load(ROOT+id+'/front.png',STALL_FRAMES[id].front,{signal:controller.signal});
   if(dead||!active||controller.signal.aborted||!figure.parent){front.texture?.dispose();return;}
   const cut=buildPapercut({front},opts);
   cut.position.z=.2;
   figure.add(cut);figure.userData.papercutViews=cut.userData.papercutViews;figure.userData.papercutStand=cut;
   hideFallback(figure);
   for(const view of PAPERCUT_VIEWS){
    if(view==='front')continue;
    if(dead||controller.signal.aborted||!figure.parent)return;
    const face=await load(ROOT+id+'/'+view+'.png',STALL_FRAMES[id][view],{signal:controller.signal});
    if(dead||!figure.parent||controller.signal.aborted){face.texture?.dispose();return;}
    setPapercutFace(cut,view,face,opts);
    figure.userData.papercutViews=cut.userData.papercutViews;
   }
  }catch(error){
   if(!controller.signal.aborted)console.warn('[Penny Fever stalls]',id,error.message);
  }finally{
   figure.userData.loading=false;
   const i=inflight.indexOf(job);if(i>=0)inflight.splice(i,1);
  }
 }
 function start(figure){
  const controller=new AbortController();
  figure.userData.loading=true;const job={figure,controller};inflight.push(job);run(job);
 }
 function update(camera,z){
  if(camera)currentCam=camera;
  if(typeof z==='number')currentZ=z;else if(camera)currentZ=camera.position.z;
  if(currentCam){
   for(const figure of figures){
    if(!figure.userData.papercutViews)continue;
    showPapercutView(figure,papercutViewIndex(figure,currentCam));
   }
  }
  if(dead||!active)return;
  const queued=figures.filter(f=>!f.userData.papercutStand&&!f.userData.loading)
   .sort((a,b)=>Math.abs(a.position.z-currentZ)-Math.abs(b.position.z-currentZ));
  while(inflight.length<2){
   const next=queued[0];
   if(!next||Math.abs(next.position.z-currentZ)>=NEAR)break;
   queued.shift();start(next);
  }
 }
 function pause(){active=false;inflight.slice().forEach(job=>job.controller.abort());}
 function resume(){if(dead)return;active=true;update(currentCam,currentZ);}
 function dispose(){if(dead)return;pause();dead=true;figures.length=0;}
 update(null,14);
 return {update,pause,resume,dispose,figures};
}
