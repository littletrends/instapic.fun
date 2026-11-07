import * as THREE from './lib/three.module.min.js';
const cache=new Map();
// Printed cut-paper ornament: nested frames, scallops, folded diamonds and leaf sprays.
export function decorativePaper(body='#435637',trim='#d2b073',variant=0){
 const key=[body,trim,variant].join(':');if(cache.has(key))return cache.get(key);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=768;
 const c=canvas.getContext('2d');c.fillStyle=body;c.fillRect(0,0,512,768);
 const diamond=(x,y,r)=>{c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r*.65,y);c.lineTo(x,y+r);c.lineTo(x-r*.65,y);c.closePath();c.fill();};
 for(let layer=0;layer<4;layer++){
  const inset=12+layer*13;c.strokeStyle=layer%2?trim:'#30251c';c.lineWidth=layer%2?4:8;c.strokeRect(inset,inset,512-inset*2,768-inset*2);
 }
 c.fillStyle=trim;
 for(let x=65;x<460;x+=32){c.beginPath();c.arc(x,70,18,0,Math.PI);c.fill();diamond(x,706,8);}
 for(const x of [77,435])for(let y=126;y<680;y+=48){
  c.fillStyle=trim;diamond(x,y,12);
  for(const side of [-1,1]){c.beginPath();c.ellipse(x+side*12,y-15,6,16,side*.6,0,Math.PI*2);c.fill();}
 }
 c.strokeStyle=trim;c.lineWidth=3;
 for(let layer=0;layer<3;layer++){
  c.beginPath();c.ellipse(256,365,125-layer*12,208-layer*15,0,0,Math.PI*2);c.stroke();
 }
 c.fillStyle=trim;diamond(256,151,27);diamond(256,578,27);
 for(let y=235;y<525;y+=58)for(let x=190;x<340;x+=64){c.globalAlpha=.35;diamond(x+(variant%2?12:0),y,10);}
 c.globalAlpha=1;
 for(const y of [115,654])for(const side of [-1,1]){
  c.save();c.translate(256,y);c.scale(side,1);c.beginPath();c.moveTo(0,0);c.bezierCurveTo(30,-38,104,-32,111,0);c.bezierCurveTo(80,26,44,12,53,-5);c.stroke();c.restore();
 }
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;cache.set(key,texture);
 return texture;
}
export function decorateBoxSurfaces(root,body,trim){
 const map=decorativePaper(body,trim),panels=[];
 root.updateMatrixWorld(true);
 root.traverse(o=>{
  if(!o.isMesh||o.geometry.type!=='BoxGeometry')return;
  o.geometry.computeBoundingBox();const size=o.geometry.boundingBox.getSize(new THREE.Vector3()).multiply(o.scale);
  if(size.x<.28||size.y<.22)return;
  // Attach to the original mesh so rotation and ride animation remain intact.
  const face=new THREE.Mesh(new THREE.PlaneGeometry(.88,.84),new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide}));
  const dimensions=o.geometry.parameters;
  face.scale.set(dimensions.width,dimensions.height,1);face.position.z=dimensions.depth/2+.006/Math.max(o.scale.z,.01);panels.push([o,face]);
 });
 for(const [parent,face] of panels){parent.add(face);const back=face.clone();back.position.z=-face.position.z;back.rotation.y=Math.PI;parent.add(back);}
}
