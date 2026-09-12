import * as THREE from '../lib/three.module.min.js';
import {WALL_ART} from './catalogue.js?v=florence-1';
import {phoneLane} from '../phone-lane.js?v=keep-light-1';

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
  const timer=setTimeout(()=>done(new Error('Wall artwork timed out')),15000);
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
export async function loadWallArt(id,{signal,side=0,angled=false}={}){
 const d=WALL_ART[id];if(!d)throw Error('Unknown wall '+id);
 const image=await imageAt(d.source,signal);
 await new Promise(resolve=>setTimeout(resolve,0));
 if(signal?.aborted)throw Error('Wall load cancelled');
 // Alley uses the bottom-row three-quarter drawings: left wall → left view,
 // right wall → right view, so the near edge matches the side you are walking.
 // Skip the reverse face — it is not visible from the aisle and doubled the flood-fill hitch.
 const useAngle=angled&&side;
 const aisleCol=useAngle?(side<0?0:1):0;
 const aisleRow=useAngle?1:0;
 const front=elevation(image,aisleCol,aisleRow);
 return {front,aisleView:useAngle?(side<0?'left-three-quarter':'right-three-quarter'):'front'};
}
export function disposeWallArt(art){
 for(const face of Object.values(art||{}))if(face.texture){
  face.texture.dispose();
  // Canvas-backed image data is no longer needed after the model retires.
  if(face.texture.image){face.texture.image.width=1;face.texture.image.height=1;}
 }
}
