import * as THREE from '../lib/three.module.min.js';
import {wallPlacements,WALL_RADIAL} from './catalogue.js?v=wall-back-1';
import {loadWallArt,disposeWallArt,prefetchWallArt,clearIdleWallArt} from './art.js?v=wall-back-1';
import {buildWall,disposeWall} from './models.js?v=wall-back-1';
import {phoneLane,WALL_NEAR,WALL_RESIDENT,PAPERCUT_INFLIGHT} from '../phone-lane.js?v=keep-light-1';
// Warm the next few walls past load range (in the walking direction) while nothing nearer is loading.
const WALL_AHEAD=phoneLane?8:14,WALL_AHEAD_COUNT=phoneLane?2:3;
// Pre-cut faces are small, so walls can light up further ahead than the shared papercut limits.
// Walls sit two per 6.6m row: desktop keeps 12 (about 4 rows ahead, 2 behind), phones 8 (3 ahead, 1 behind).
const WALL_LOAD=WALL_NEAR+(phoneLane?8:12),WALL_KEEP=WALL_RESIDENT+(phoneLane?2:4);
// Walls behind the player count as further away, so most of the budget goes to the walking direction.
const BEHIND=2;

// Scenery only: never changes player collision, booth entry, wallet or game state.
export function installWallBackdrops(scene,len,{load=loadWallArt,prefetch=prefetchWallArt,stallStart=14,stallStep=6.6,lots=null}={}){
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
 let active=true,dead=false,busy=null,tick=0,currentZ=-8,lastZ=-8,dir=1,wanted=new Set();
 const status={loaded:0,loading:0,failures:0,maxResident:WALL_KEEP};
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
  if(Math.abs(z-lastZ)>.05){dir=Math.sign(z-lastZ);lastZ=z;}
  const reach=p=>{const d=(p.z-z)*dir;return d>=0?d:-d*BEHIND;};
  const near=sites.filter(p=>reach(p)<WALL_LOAD).sort((a,b)=>reach(a)-reach(b)).slice(0,WALL_KEEP);
  wanted=new Set(near);
  for(const site of sites)if(site.model&&!wanted.has(site))release(site);
  for(const job of inflight)if(!wanted.has(job.site))job.controller.abort();
  while(inflight.length<PAPERCUT_INFLIGHT){
   const next=near.find(p=>!p.model&&!p.loading&&Date.now()>=p.retryAt);
   if(!next)break;
   start(next);
  }
  if(!inflight.length&&prefetch){
   const ahead=sites.filter(p=>!p.model&&!wanted.has(p)&&(p.z-z)*dir>0&&(p.z-z)*dir<WALL_LOAD+WALL_AHEAD)
    .sort((a,b)=>reach(a)-reach(b)).slice(0,WALL_AHEAD_COUNT);
   for(const site of ahead)prefetch(site.id,{side:site.side||0,angled:!!site.side});
  }
  status.loaded=sites.filter(p=>p.model).length;
 }
 function pause(){active=false;wanted.clear();inflight.slice().forEach(job=>job.controller.abort());sites.forEach(release);status.loaded=0;}
 function resume(){if(dead)return;active=true;tick=1;update(currentZ);}
 function dispose(){
  if(dead)return;pause();dead=true;clearIdleWallArt();root.removeFromParent();unit.dispose();wood.dispose();edge.dispose();
 }
 root.userData.wallStatus=status;
 return {update,pause,resume,dispose,status,sites};
}
