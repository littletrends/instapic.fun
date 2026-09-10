import * as THREE from '../lib/three.module.min.js';
import {AMUSEMENT_ART,AMUSEMENT_PLACES,PAPERCUT_VIEWS} from './catalogue.js?v=paper-alley-live-2';
import {loadPapercutFace,buildPapercut,setPapercutFace,papercutViewIndex,showPapercutView,billboardPapercut} from './cutouts.js?v=paper-alley-live-4';
import {PAPERCUT_NEAR,PAPERCUT_SIDES,PAPERCUT_INFLIGHT} from '../phone-lane.js?v=paper-alley-live-4';

const NEAR=PAPERCUT_NEAR;
const SIDE_NEAR=PAPERCUT_SIDES;
const HOST_HEIGHT=1.7;
const HOST_INSET=.7;
const HOST_ALONG=-.92;
// Stalls are 3.5 tall. Rides must dwarf them. Side cards fill the centred wall bay
// without crossing the aisle (1.62) or the wall (4.86).
const RIDE_SCALE=2;
const RIDE_HEIGHT_MIN=7;
const RIDE_MAX_WIDTH=8.6;
const RIDE_SIDE_WIDTH=2.35;

export function amusementYaw(x){return x>0?-Math.PI/2:Math.PI/2;}
// Local +Z toward the foyer, so fronts greet a guest walking +Z down the alley.
export const APPROACH_YAW=Math.PI;

export function installPapercutRides(scene,z0,step,{load=loadPapercutFace}={}){
 const root=new THREE.Group();root.name='Papercut midway rides';scene.add(root);
 const figures=[];
 for(const [id,x,bay] of AMUSEMENT_PLACES){
  const d=AMUSEMENT_ART[id];if(!d)continue;
  const z=z0+bay*step,yaw=amusementYaw(x),side=Math.sign(x)||1;
  const ride=new THREE.Group();ride.name=d.name+' · papercut';ride.position.set(x,0,z);ride.rotation.y=yaw;
  ride.userData={amusementId:id,kind:'ride'};root.add(ride);
  const host=new THREE.Group();host.name=d.host+' · attendant';
  host.position.set(x-side*HOST_INSET,0,z+HOST_ALONG);host.rotation.y=APPROACH_YAW;
  host.userData={amusementId:id,kind:'host',host:d.host};root.add(host);
  figures.push(ride,host);
 }
 const inflight=[];
 let active=true,dead=false,currentZ=z0,currentCam=null;
 function optsFor(figure){
  const d=AMUSEMENT_ART[figure.userData.amusementId];
  return figure.userData.kind==='host'
   ?{height:HOST_HEIGHT,maxWidth:1.2,sideWidth:.55,layout:'stand'}
   :{height:Math.max(RIDE_HEIGHT_MIN,(d.height||3.5)*RIDE_SCALE),maxWidth:RIDE_MAX_WIDTH,sideWidth:RIDE_SIDE_WIDTH,layout:'stand'};
 }
 async function run(job){
  const {figure,controller}=job,id=figure.userData.amusementId,kind=figure.userData.kind,opts=optsFor(figure);
  try{
   const front=await load(id,{kind,view:'front',signal:controller.signal});
   if(dead||!active||controller.signal.aborted||!figure.parent){front.texture?.dispose();return;}
   const cut=buildPapercut({front},opts);
   figure.add(cut);figure.userData.papercutViews=cut.userData.papercutViews;figure.userData.papercutStand=cut;
   figure.userData.needSides=true;
  }catch(error){
   if(!controller.signal.aborted)console.warn('[Penny Fever rides]',id,kind,error.message);
  }finally{
   figure.userData.loading=false;
   const i=inflight.indexOf(job);if(i>=0)inflight.splice(i,1);
  }
 }
 async function fillSides(figure){
  if(!figure.userData.needSides||figure.userData.sidesLoading)return;
  const cut=figure.userData.papercutStand,id=figure.userData.amusementId,kind=figure.userData.kind;
  if(!cut)return;
  figure.userData.sidesLoading=true;
  const opts=optsFor(figure),controller=new AbortController();
  try{
   for(const view of PAPERCUT_VIEWS){
    if(view==='front')continue;
    if(dead||!figure.parent)return;
    const face=await load(id,{kind,view,signal:controller.signal});
    if(!figure.parent){face.texture?.dispose();return;}
    setPapercutFace(cut,view,face,opts);
    figure.userData.papercutViews=cut.userData.papercutViews;
   }
   figure.userData.needSides=false;
  }catch(error){
   if(!controller.signal.aborted)console.warn('[Penny Fever rides]',id,kind,error.message);
  }finally{figure.userData.sidesLoading=false;}
 }
 function start(figure){
  const controller=new AbortController();
  const job={figure,controller};
  figure.userData.loading=true;inflight.push(job);run(job);
 }
 function update(camera,z,eye){
  if(camera)currentCam=camera;
  if(typeof z==='number')currentZ=z;else if(camera)currentZ=camera.position.z;
  const look=eye||currentCam;
  if(look){
   for(const figure of figures){
    if(!figure.userData.papercutViews)continue;
    showPapercutView(figure,papercutViewIndex(figure,look));
    if(figure.userData.billboard)billboardPapercut(figure,currentCam||look);
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
 function pause(){
  active=false;inflight.slice().forEach(job=>job.controller.abort());
 }
 function resume(){if(dead)return;active=true;update(currentCam,currentZ);}
 function dispose(){
  if(dead)return;pause();dead=true;
  figures.forEach(figure=>{
   figure.userData.papercutViews=null;figure.userData.papercutStand=null;
  });
  root.traverse(o=>{
   o.geometry?.dispose();
   const mats=Array.isArray(o.material)?o.material:[o.material];
   mats.forEach(m=>{m?.map?.dispose();m?.dispose();});
  });
  root.removeFromParent();figures.length=0;
 }
 update(null,z0);
 return {update,pause,resume,dispose,root,figures};
}
