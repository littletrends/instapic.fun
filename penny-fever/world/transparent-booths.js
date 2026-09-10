import * as THREE from './lib/three.module.min.js';

const BASE='assets/restyle/scene-turnarounds-2026-09-09/stalls/';
const views=['front','left','back','right'];
const waiting=[];let active=0;
const nearby=[];let nextCheck=0;
// Register without downloading. The alley loop asks for art near the guest only.
export function registerTransparentBooth(shell,id,z,side=1){nearby.push({shell,id,z,side,retryAt:0});}
export function updateTransparentBooths(playerZ,now){
 if(now<nextCheck)return;nextCheck=now+.5;
 let slots=2-active-waiting.length;
 const candidates=nearby.filter(b=>Math.abs(b.z-playerZ)<=22&&!b.shell.userData.transparentBoothPromise&&now>=b.retryAt)
  .sort((a,b)=>Math.abs(a.z-playerZ)-Math.abs(b.z-playerZ));
 for(const b of candidates){
  if(slots--<=0)break;
  // A failed nearby image can retry, without a request storm on every frame.
  b.retryAt=now+30;installTransparentBooth(b.shell,b.id,b.side);
 }
}
function schedule(job){return new Promise(resolve=>{waiting.push({job,resolve});pump();});}
function pump(){while(active<2&&waiting.length){const {job,resolve}=waiting.shift();active++;Promise.resolve().then(job).then(resolve).finally(()=>{active--;pump();});}}

// Crop transparent padding only. Cream paper and white highlights keep their alpha.
export function alphaCrop(data,w,h){
 let left=w,top=h,right=-1,bottom=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>0){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 if(right<left)throw new Error('Empty transparent booth view');
 return {x:left,y:top,width:right-left+1,height:bottom-top+1};
}
function loadView(path){return new Promise((resolve,reject)=>{
 const im=new Image();let finished=false;
 const timer=setTimeout(()=>finish(new Error('Booth image timed out: '+path)),20000);
 function finish(error){if(finished)return;finished=true;clearTimeout(timer);im.onload=im.onerror=null;if(error){im.src='';reject(error);}}
 im.onerror=()=>finish(new Error('Could not load '+path));
 im.onload=()=>{
  try{
   const source=document.createElement('canvas');source.width=im.naturalWidth;source.height=im.naturalHeight;
   const ctx=source.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);
   const crop=alphaCrop(ctx.getImageData(0,0,source.width,source.height).data,source.width,source.height);
   const canvas=document.createElement('canvas');canvas.width=crop.width;canvas.height=crop.height;
   canvas.getContext('2d').drawImage(source,crop.x,crop.y,crop.width,crop.height,0,0,crop.width,crop.height);
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
   finish();resolve(texture);
  }catch(error){finish(error);}
 };
 im.src=path;
});}

export function buildTransparentBooth(id,maps,side=1){
 const root=new THREE.Group();root.name=id+' transparent papercut booth';
 // Keep the original artwork's front aspect ratio within the existing booth bay.
 const ratio=maps[0].image.width/maps[0].image.height;
 const height=Math.min(id==='high-striker'?4.25:3.7,2.6/ratio),width=height*ratio;
 const depth=1.45,front=.56,back=front-depth;
 const add=(name,map,w,x,z,yaw)=>{
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,height),new THREE.MeshBasicMaterial({map,transparent:true,alphaTest:.08,side:THREE.DoubleSide}));
  mesh.name=name;mesh.position.set(x,height/2+.04,z);mesh.rotation.y=yaw;root.add(mesh);
 };
 // Turnaround left/right are swapped relative to the stall's local -X/+X so the
 // foyer-facing edge matches the wall correspondence (left aisle → left profile).
 add('illustrated front',maps[0],width,0,front,0);
 add('illustrated left side',maps[3],depth,-width/2,(front+back)/2,-Math.PI/2);
 add('illustrated back',maps[2],width,0,back,Math.PI);
 add('illustrated right side',maps[1],depth,width/2,(front+back)/2,Math.PI/2);
 root.userData.dimensions={width,height,depth};root.userData.side=side;return root;
}

export function installTransparentBooth(shell,id,side=1){
 if(shell.userData.transparentBoothPromise)return shell.userData.transparentBoothPromise;
 // Each booth replaces its fallback only after all four PNGs have loaded.
 const promise=schedule(async()=>{
  const maps=[];
  try{
   for(const view of views)maps.push(await loadView(BASE+id+'/'+view+'.png'));
   const model=buildTransparentBooth(id,maps,side);
   // The old geometric shell was widened; preserve the illustration proportions.
   model.scale.x=1/shell.scale.x;
   for(const child of shell.children)if(!child.name.endsWith(' walking sign'))child.visible=false;
   shell.add(model);shell.userData.transparentBoothReady=id;
   return model;
  }catch(error){
   maps.forEach(map=>map.dispose());delete shell.userData.transparentBoothPromise;
   shell.userData.transparentBoothError=error.message;
   console.warn(id+': retaining the existing booth.',error);return null;
  }
 });
 shell.userData.transparentBoothPromise=promise;return promise;
}
