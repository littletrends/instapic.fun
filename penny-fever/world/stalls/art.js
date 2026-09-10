import * as THREE from '../lib/three.module.min.js';
import {STALL_ART} from './catalogue.js';
import {clearParchment,bounds} from './pixels.js';
import {DIGBY_ART,loadDigbyAtlas} from '../digby-stall.js?v=digby-depth-1';

const cache=new Map(),jobs=[];let working=0;
// Two small downloads/preparations at a time, yielding between every face.
function schedule(job){return new Promise((resolve,reject)=>{jobs.push({job,resolve,reject});pump();});}
function pump(){while(working<2&&jobs.length){const j=jobs.shift();working++;j.job().then(j.resolve,j.reject).finally(()=>{working--;pump();});}}
const yieldUI=()=>new Promise(resolve=>setTimeout(resolve,0));
function image(path){return new Promise((resolve,reject)=>{
 const im=new Image();let done=false;
 const timer=setTimeout(()=>finish(new Error('Stall artwork timed out')),20000);
 function finish(error){if(done)return;done=true;clearTimeout(timer);im.onload=im.onerror=null;if(error){im.src='';reject(error);}else resolve(im);}
 im.onload=()=>finish();im.onerror=()=>finish(new Error('Could not load '+path));im.src=path;
});}
function face(im,rect,limit){
 const [l,t,r,b]=rect,scaleX=im.naturalWidth/1536,scaleY=im.naturalHeight/1024;
 const c=document.createElement('canvas');c.width=Math.ceil((r-l)*scaleX);c.height=Math.ceil((b-t)*scaleY);
 const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,l*scaleX,t*scaleY,(r-l)*scaleX,(b-t)*scaleY,0,0,c.width,c.height);
 const p=ctx.getImageData(0,0,c.width,c.height);clearParchment(p.data,c.width,c.height);const box=bounds(p.data,c.width,c.height);
 if(!box||box.height<c.height*.35)throw new Error('Incomplete stall view');
 ctx.putImageData(p,0,0);
 const out=document.createElement('canvas'),factor=Math.min(1,limit/Math.max(box.width,box.height));
 out.width=Math.ceil(box.width*factor);out.height=Math.ceil(box.height*factor);
 out.getContext('2d').drawImage(c,box.x,box.y,box.width,box.height,0,0,out.width,out.height);
 const map=new THREE.CanvasTexture(out);map.colorSpace=THREE.SRGBColorSpace;
 // Downward silhouette samples support a real roof bridge, not an empty paper cube.
 const sample=document.createElement('canvas');sample.width=48;sample.height=64;const sc=sample.getContext('2d',{willReadFrequently:true});
 sc.drawImage(out,0,0,48,64);const alpha=sc.getImageData(0,0,48,64).data;
 map.userData.roof=Array.from({length:48},(_,x)=>{for(let y=0;y<64;y++)if(alpha[(y*48+x)*4+3]>128)return 1-y/64;return 0;});
 map.userData.crop={...box};return map;
}
export function loadStallArt(id){
 const d=STALL_ART[id];if(!d)return Promise.reject(new Error('Unknown stall '+id));
 return loadPaperArt(d);
}
// Shared bounded preparation for the ticket booth and amusement sheets too.
// Definitions use the same 1536 x 1024 reference space, even for wider sources.
export function loadPaperArt(d){
 const id=d.id;
 if(cache.has(id))return cache.get(id);
 const pending=schedule(async()=>{
  if(id==='curios'){const [stall,host]=await Promise.all([loadDigbyAtlas(DIGBY_ART.stall),loadDigbyAtlas(DIGBY_ART.host)]);return {stall,host};}
  const im=await image(d.source),stall=[],host=[];
  try{
   for(const rect of d.stallRects){stall.push(face(im,rect,512));await yieldUI();}
   const hostImage=d.hostSource?await image(d.hostSource):im;
   for(const rect of d.hostRects){host.push(face(hostImage,rect,256));await yieldUI();}
   return {stall,host};
  }catch(error){[...stall,...host].forEach(t=>t.dispose());throw error;}
 });
 cache.set(id,pending);pending.catch(()=>cache.delete(id));return pending;
}
