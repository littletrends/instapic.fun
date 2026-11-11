import * as THREE from './lib/three.module.min.js';
// Only edge-connected neutral background is removed; enclosed highlights survive.
export function clearCutoutBackground(data,w,h){
 const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
 const visit=i=>{if(i<0||i>=w*h||seen[i])return;const p=i*4,lo=Math.min(data[p],data[p+1],data[p+2]),hi=Math.max(data[p],data[p+1],data[p+2]);if(lo<215||hi-lo>16)return;seen[i]=1;queue[tail++]=i;};
 for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x);}for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1);}
 while(head<tail){const i=queue[head++],x=i%w;data[i*4+3]=0;if(x>0)visit(i-1);if(x<w-1)visit(i+1);visit(i-w);visit(i+w);}
 return tail;
}
export function installMysticFront(shell){return installConceptFront(shell,{name:'Mystic',src:'assets/restyle/mystic-concept-front.png'});}
export function installLoveFront(shell){return installConceptFront(shell,{name:'Love Tester',src:'assets/restyle/love-concept-front.png'});}
export function installConceptFront(shell,{name,src}){
 const root=new THREE.Group();root.name=`${name} approved concept layers`;shell.add(root);
 const loader=new THREE.TextureLoader();
 loader.load(src,source=>{
  const canvas=document.createElement('canvas');canvas.width=source.image.width;canvas.height=source.image.height;
  const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(source.image,0,0);
  const pixels=c.getImageData(0,0,canvas.width,canvas.height);clearCutoutBackground(pixels.data,canvas.width,canvas.height);c.putImageData(pixels,0,0);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshBasicMaterial({map,transparent:true,alphaTest:.12,side:THREE.DoubleSide});
  // UV strips share one texture. Physical offsets create a small paper-theatre recess.
  for(const [left,right,z] of [[0,.23,-.12],[.23,.77,.06],[.77,1,-.12]]){
   const geometry=new THREE.PlaneGeometry(2.6*(right-left),3.35);
   const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,left+uv.getX(i)*(right-left));
   const card=new THREE.Mesh(geometry,material);card.position.set((left+right-1)*1.3,1.75,z+.55);root.add(card);
  }
  // Retire the geometric fallback only once the illustrated frontage is ready.
  for(const child of shell.children)if(child!==root)child.visible=false;
  shell.userData.conceptReady=true;source.dispose();
 },undefined,()=>{shell.userData.conceptLoadFailed=true;});
 shell.userData.conceptFront=true;
 return root;
}
