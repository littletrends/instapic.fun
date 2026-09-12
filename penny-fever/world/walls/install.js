import * as THREE from '../lib/three.module.min.js';
import {wallPlacements,WALL_RADIAL} from './catalogue.js?v=wall-fit-1';
import {loadWallArt,disposeWallArt} from './art.js?v=keep-light-1';
import {buildWall,disposeWall} from './models.js?v=paper-alley-live-4';
import {WALL_NEAR,WALL_RESIDENT,PAPERCUT_INFLIGHT} from '../phone-lane.js?v=keep-light-1';

// Scenery only: never changes player collision, booth entry, wallet or game state.
export function installWallBackdrops(scene,len,{load=loadWallArt,stallStart=14,stallStep=6.6,lots=null}={}){
 const root=new THREE.Group();root.name='Matching paper alley walls';scene.add(root);
 const sites=wallPlacements(len,{stallStart,stallStep,lots}).map(p=>({...p,model:null,loading:false,retryAt:0}));
 const wood=new THREE.MeshStandardMaterial({color:'#3c3326',roughness:1});
 const edge=new THREE.MeshStandardMaterial({color:'#a28350',roughness:1});
 const unit=new THREE.BoxGeometry(1,1,1);
 function rail(w,h,d,x,y,z,mat){
  const m=new THREE.Mesh(unit,mat);m.scale.set(w,h,d);m.position.set(x,y,z);root.add(m);
 }
 // Continuous low paper backing fills the spaces without hiding ornate silhouettes.
 for(const side of [-1,1]){
  rail(.16,2.2,len+12,side*(WALL_RADIAL+.30),1.1,(len-8)/2,wood);
  rail(.2,.1,len+12,side*(WALL_RADIAL+.21),2.23,(len-8)/2,edge);
 }
 let active=true,dead=false,busy=null,tick=0,currentZ=-8,wanted=new Set();
 const status={loaded:0,loading:0,failures:0,maxResident:WALL_RESIDENT};
 const inflight=[];
 const release=site=>{disposeWall(site.model);site.model=null;};
 async function start(site){
  const controller=new AbortController();const job={site,controller};inflight.push(job);busy=job;site.loading=true;status.loading=inflight.length;
  try{
   const art=await load(site.id,{signal:controller.signal,side:site.side||0,angled:!!site.side});
   if(dead||!active||controller.signal.aborted||!wanted.has(site)){disposeWallArt(art);return;}
   let model;
   try{model=buildWall(site.id,art,site);}catch(error){disposeWallArt(art);throw error;}
   model.position.set(site.x,.04,site.z);model.rotation.y=site.yaw;
   site.model=model;root.add(model);
  }catch(error){
   if(!controller.signal.aborted){site.retryAt=Date.now()+60000;status.failures++;console.warn('[Penny Fever walls]',site.id,error.message);}
  }finally{
   site.loading=false;const i=inflight.indexOf(job);if(i>=0)inflight.splice(i,1);
   busy=inflight[0]||null;status.loading=inflight.length;status.loaded=sites.filter(p=>p.model).length;
  }
 }
 function update(z,dt=0){
  if(dead||!active)return;
  currentZ=z;tick+=dt;if(tick<.4)return;tick=0;
  const near=sites.filter(p=>Math.abs(p.z-z)<WALL_NEAR).sort((a,b)=>Math.abs(a.z-z)-Math.abs(b.z-z)).slice(0,WALL_RESIDENT);
  wanted=new Set(near);
  for(const site of sites)if(site.model&&!wanted.has(site))release(site);
  for(const job of inflight)if(!wanted.has(job.site))job.controller.abort();
  while(inflight.length<PAPERCUT_INFLIGHT){
   const next=near.find(p=>!p.model&&!p.loading&&Date.now()>=p.retryAt);
   if(!next)break;
   start(next);
  }
  status.loaded=sites.filter(p=>p.model).length;
 }
 function pause(){active=false;wanted.clear();inflight.slice().forEach(job=>job.controller.abort());sites.forEach(release);status.loaded=0;}
 function resume(){if(dead)return;active=true;tick=1;update(currentZ);}
 function dispose(){
  if(dead)return;pause();dead=true;root.removeFromParent();unit.dispose();wood.dispose();edge.dispose();
 }
 root.userData.wallStatus=status;
 return {update,pause,resume,dispose,status,sites};
}
