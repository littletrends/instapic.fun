import * as THREE from '../lib/three.module.min.js';
import {AMUSEMENT_ART,PAPERCUT_VIEWS,PAPERCUT_SHEET,PAPERCUT_FRAMES,papercutRideSrc,papercutHostSrc} from './catalogue.js?v=paper-alley-live-2';
import {TEX_LIMIT} from '../phone-lane.js?v=paper-alley-live-23';

const loader=new THREE.TextureLoader();
let busy=0;const waiting=[];
const LIMIT=TEX_LIMIT;
function lane(urgent=false){
 if(busy<LIMIT){busy++;return Promise.resolve();}
 return new Promise(resolve=>{
  const job={resolve};
  if(urgent)waiting.unshift(job);else waiting.push(job);
 });
}
function unlane(){
 const next=waiting.shift();
 if(next)next.resolve();else busy--;
}
function applyRect(texture,rect){
 const [l,t,w,h]=rect,s=PAPERCUT_SHEET;
 texture.colorSpace=THREE.SRGBColorSpace;
 texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;
 texture.repeat.set(w/s,h/s);texture.offset.set(l/s,(s-(t+h))/s);
 texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
 return {texture,aspect:w/h};
}
export function loadFramedPng(url,rect,{signal,urgent=false}={}){
 if(!rect)throw Error('Missing papercut frame for '+url);
 return lane(urgent).then(()=>new Promise((resolve,reject)=>{
  let settled=false,timer=0;
  const fail=error=>{
   if(settled)return;settled=true;clearTimeout(timer);
   unlane();reject(error instanceof Error?error:new Error('Papercut artwork unavailable: '+url));
  };
  if(signal?.aborted){fail(new Error('Papercut load cancelled'));return;}
  const abort=()=>fail(new Error('Papercut load cancelled'));
  signal?.addEventListener('abort',abort,{once:true});
  timer=setTimeout(()=>fail(new Error('Papercut artwork timed out')),15000);
  loader.load(url,texture=>{
   if(settled){texture.dispose();return;}
   if(signal?.aborted){texture.dispose();fail(new Error('Papercut load cancelled'));return;}
   settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);
   unlane();resolve(applyRect(texture,rect));
  },undefined,()=>fail(new Error('Papercut artwork unavailable: '+url)));
 }));
}
export function loadPapercutFace(id,{kind='ride',view='front',signal}={}){
 const d=AMUSEMENT_ART[id];if(!d)throw Error('Unknown amusement '+id);
 const frame=PAPERCUT_FRAMES[id]?.[kind]?.[view];
 const src=kind==='host'?papercutHostSrc(d.host,view):papercutRideSrc(id,view);
 return loadFramedPng(src,frame,{signal});
}
const STAND_YAW={front:0,left:-Math.PI/2,back:Math.PI,right:Math.PI/2};
function makeFace(name,face,{height=3.5,maxWidth=4.6,sideWidth=1.85,layout='flat'}={}){
 const cap=(layout==='stand'&&(name==='left'||name==='right'))?sideWidth:maxWidth;
 const h=height,w=Math.min(h*face.aspect,cap);
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),
  new THREE.MeshBasicMaterial({map:face.texture,transparent:true,alphaTest:.12,side:THREE.DoubleSide}));
 mesh.position.y=h/2+.02;mesh.name=name;
 if(layout==='stand')mesh.rotation.y=STAND_YAW[name];
 return mesh;
}
export function setPapercutFace(root,name,face,opts){
 const i=PAPERCUT_VIEWS.indexOf(name);if(i<0)return;
 const views=root.userData.papercutViews||(root.userData.papercutViews=[null,null,null,null]);
 const prev=views[i];
 if(prev){
  prev.removeFromParent();
  prev.geometry.dispose();
  prev.material.map=null;prev.material.dispose();
 }
 const mesh=makeFace(name,face,opts||root.userData.papercutOpts);
 mesh.visible=i===0||!views[0];
 views[i]=mesh;root.add(mesh);
}
export function buildPapercut(faces,opts={}){
 const root=new THREE.Group();root.userData.papercutOpts=opts;root.userData.papercutViews=[null,null,null,null];
 for(const name of PAPERCUT_VIEWS)if(faces[name])setPapercutFace(root,name,faces[name],opts);
 globalThis.PennyFeverRestyle?.notePaperCutout(root);
 return root;
}
export function papercutViewIndex(object,eye){
 const p=eye&&(eye.position||eye);
 const px=p?.x??0,pz=p?.z??0;
 const bearing=Math.atan2(px-object.position.x,pz-object.position.z);
 const yaw=object.rotation.y;
 const angle=Math.atan2(Math.sin(bearing-yaw),Math.cos(bearing-yaw));
 return Math.abs(angle)<Math.PI/4?0:Math.abs(angle)>Math.PI*3/4?2:angle>0?3:1;
}
export function showPapercutView(object,index){
 const views=object.userData.papercutViews;if(!views)return;
 const chosen=views[index]||views[0];
 views.forEach(mesh=>{if(mesh)mesh.visible=mesh===chosen;});
}
export function billboardPapercut(object,camera){
 const stand=object.userData.papercutStand||object;
 const bearing=Math.atan2(camera.position.x-object.position.x,camera.position.z-object.position.z);
 stand.rotation.y=bearing-object.rotation.y;
}
