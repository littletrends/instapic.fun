import {phoneArt} from '../phone-art.js';
import * as THREE from '../lib/three.module.min.js';
import {WALL_ART} from './catalogue.js?v=wall-step-1';
import {phoneLane} from '../phone-lane.js?v=keep-light-1';

// Pre-cut transparent wall faces: elevation() below, baked offline (agent-notes/tools/cut-wall-views.py).
// One folder: <id>-front|left|right.webp (384px max, desktop) and <id>-<view>-phone.webp (256px max).
// Missing files fall back to cutting the old four-view sheet in the browser.
const CUTOUT_ROOT='assets/restyle/walls/cutouts/';
const VIEW_FILE={'front':'front','left-three-quarter':'left','right-three-quarter':'right'};
export function wallCutoutUrl(id,view){return CUTOUT_ROOT+id+'-'+VIEW_FILE[view]+(phoneLane?'-phone':'')+'.webp';}
// Faces stay in memory after their wall model is retired, so walking back is instant.
const KEEP_IDLE=phoneLane?6:12;
const PREFETCH_MAX=phoneLane?1:2;
const cache=new Map();let prefetching=0;

function clearParchment(data,w,h){
 const n=w*h,seen=new Uint8Array(n),queue=new Int32Array(n);let head=0,tail=0;
 const bg=i=>{const p=i*4,r=data[p],g=data[p+1],b=data[p+2];
  return data[p+3]<8||(r>=209&&g>=193&&b>=159&&r-g>=-5&&r-g<38&&g-b>=-5&&g-b<43);
 };
 const visit=i=>{if(i<0||i>=n||seen[i]||!bg(i))return;seen[i]=1;queue[tail++]=i;};
 for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x);}for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1);}
 while(head<tail){const i=queue[head++],x=i%w;data[i*4+3]=0;if(x)visit(i-1);if(x<w-1)visit(i+1);visit(i-w);visit(i+w);}
 return data;
}
function imageAt(url,signal){
 return new Promise((resolve,reject)=>{
  const image=new Image();
  const done=(error)=>{
   clearTimeout(timer);signal?.removeEventListener('abort',abort);
   image.onload=image.onerror=null;
   if(error){image.src='';reject(error);}else resolve(image);
  };
  const abort=()=>done(new Error('Wall load cancelled'));
  const timer=setTimeout(()=>done(new Error('Wall artwork timed out')),30000);
  image.onload=()=>done();image.onerror=()=>done(new Error('Wall artwork unavailable: '+url));
  signal?.addEventListener('abort',abort,{once:true});
  if(signal?.aborted){abort();return;}
  image.src=url;
 });
}
export function topProfile(data,w,h,steps=80){
 const points=[];
 for(let n=0;n<=steps;n++){
  const x=Math.min(w-1,Math.round(n*(w-1)/steps));let top=h-1;
  for(let y=0;y<h;y++)if(data[(y*w+x)*4+3]>=160){top=y;break;}
  points.push([n/steps,1-top/h]);
 }
 return points;
}
// Generated sheets sometimes put the tip of the lower-row wall above the exact
// halfway line. Find the continuous main wall, not that unrelated little sliver.
export function wallBounds(data,w,h){
 const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let best=null,count=0;
 for(let start=0;start<w*h;start++){
  if(seen[start]||data[start*4+3]<96)continue;
  let head=0,tail=1,l=w,r=0,t=h,b=0;queue[0]=start;seen[start]=1;
  while(head<tail){
   const i=queue[head++],x=i%w,y=Math.floor(i/w);l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);
   const add=j=>{if(j>=0&&j<w*h&&!seen[j]&&data[j*4+3]>=96){seen[j]=1;queue[tail++]=j;}};
   if(x)add(i-1);if(x<w-1)add(i+1);add(i-w);add(i+w);
  }
  if(tail>count){count=tail;best={x:l,y:t,width:r-l+1,height:b-t+1};}
 }
 return best;
}
function elevation(image,column,row=0){
 const sw=Math.floor(image.naturalWidth/2),sh=Math.floor(image.naturalHeight/2);
 const maxEdge=phoneLane?256:384;
 const scale=Math.min(1,maxEdge/Math.max(sw,sh));
 const dw=Math.max(1,Math.round(sw*scale)),dh=Math.max(1,Math.round(sh*scale));
 const canvas=document.createElement('canvas');canvas.width=dw;canvas.height=dh;
 const c=canvas.getContext('2d',{willReadFrequently:true});
 c.drawImage(image,column*sw,row*sh,sw,sh,0,0,dw,dh);
 const pixels=c.getImageData(0,0,dw,dh);clearParchment(pixels.data,dw,dh);c.putImageData(pixels,0,0);
 const box=wallBounds(pixels.data,dw,dh);if(!box)throw Error('Empty wall elevation');
 const out=document.createElement('canvas');out.width=box.width;out.height=box.height;
 const ctx=out.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(canvas,box.x,box.y,box.width,box.height,0,0,box.width,box.height);
 const profile=topProfile(ctx.getImageData(0,0,out.width,out.height).data,out.width,out.height,phoneLane?48:64);
 const texture=new THREE.CanvasTexture(out);texture.colorSpace=THREE.SRGBColorSpace;
 texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;
 return {texture,aspect:out.width/out.height,profile};
}
function cutoutFace(image){
 const w=image.naturalWidth,h=image.naturalHeight;
 // Cut-outs are elevation() output baked offline (hard 0/255 alpha, RGB 0 under clear pixels),
 // so read the top outline at full size exactly as elevation() does.
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
 const profile=topProfile(c.getImageData(0,0,w,h).data,w,h,phoneLane?48:64);
 // Same texture setup as elevation()'s CanvasTexture (canvas is drawn 1:1, so the GPU sees the same pixels).
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;
 return {texture,aspect:w/h,profile,cutout:true};
}
function aisleViewFor(side=0,angled=false){
 // Lorie 12/11: every alley wall shows its flat front drawing, facing the path.
 // (The three-quarter views read as angled; side/angled are kept for callers.)
 return 'front';
}
async function makeFace(id,view){
 const d=WALL_ART[id];
 try{return cutoutFace(await imageAt(wallCutoutUrl(id,view)));}
 catch(error){console.info('[Penny Fever walls] no cut-out for',id,view,'- using sheet');}
 const image=await imageAt(phoneArt(d.source));
 await new Promise(resolve=>setTimeout(resolve,0));
 // Skip the reverse face — it is not visible from the aisle and doubled the flood-fill hitch.
 const col=view==='right-three-quarter'?1:0,row=view==='front'?0:1;
 return elevation(image,col,row);
}
function disposeFace(face){
 face?.texture?.dispose();
 const img=face?.texture?.image;
 if(img instanceof HTMLCanvasElement){img.width=1;img.height=1;}
}
function trimCache(keep=KEEP_IDLE){
 const idle=[...cache.values()].filter(e=>e.users<=0&&e.face).sort((a,b)=>a.lastUsed-b.lastUsed);
 while(idle.length>keep){const e=idle.shift();cache.delete(e.key);disposeFace(e.face);}
}
function park(entry){if(entry.users<=0){entry.users=0;entry.lastUsed=performance.now();trimCache();}}
function entryFor(id,view){
 const key=id+':'+view;let entry=cache.get(key);
 if(!entry){
  entry={key,users:0,face:null,lastUsed:performance.now()};
  entry.promise=makeFace(id,view).then(face=>{entry.face=face;return face;},error=>{cache.delete(key);throw error;});
  cache.set(key,entry);
 }
 return entry;
}
function untilAbort(promise,signal){
 if(!signal)return promise;
 if(signal.aborted)return Promise.reject(Error('Wall load cancelled'));
 return new Promise((resolve,reject)=>{
  const abort=()=>reject(Error('Wall load cancelled'));
  signal.addEventListener('abort',abort,{once:true});
  promise.then(v=>{signal.removeEventListener('abort',abort);resolve(v);},e=>{signal.removeEventListener('abort',abort);reject(e);});
 });
}
export async function loadWallArt(id,{signal,side=0,angled=false}={}){
 if(!WALL_ART[id])throw Error('Unknown wall '+id);
 const aisleView=aisleViewFor(side,angled);
 const entry=entryFor(id,aisleView);entry.users++;
 let face;
 // A cancelled wall keeps downloading into the cache, so it is ready if the player turns back.
 try{face=await untilAbort(entry.promise,signal);}
 catch(error){entry.users--;entry.promise.then(()=>park(entry),()=>{});throw error;}
 let released=false;
 return {front:face,aisleView,release(){if(released)return;released=true;entry.users--;park(entry);}};
}
// Low-priority warm-up for walls just beyond load range (download + decode only).
export function prefetchWallArt(id,{side=0,angled=false}={}){
 if(!WALL_ART[id]||prefetching>=PREFETCH_MAX)return false;
 const key=id+':'+aisleViewFor(side,angled);if(cache.has(key))return false;
 const entry=entryFor(id,aisleViewFor(side,angled));prefetching++;
 entry.promise.then(()=>park(entry),()=>{}).finally(()=>{prefetching--;});
 return true;
}
export function clearIdleWallArt(){trimCache(0);}
export function disposeWallArt(art){
 if(art?.release){art.release();return;}
 for(const face of Object.values(art||{}))if(face?.texture)disposeFace(face);
}
