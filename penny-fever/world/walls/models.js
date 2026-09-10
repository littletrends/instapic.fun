import * as THREE from '../lib/three.module.min.js';
import {WALL_ART,plannedSecrets} from './catalogue.js?v=paper-alley-live-2';
import {disposeWallArt} from './art.js';

export function buildWall(id,art,{width=6.4,height=4.2,depth=.22,fit='contain'}={}){
 const d=WALL_ART[id];if(!d)throw Error('Unknown wall '+id);
 const root=new THREE.Group();root.name=d.name+' · paper backdrop';
 // Alley walls fill their bay; the standalone studio keeps its compact preview.
 // Grow height proportionally instead of stretching the doors/ornament sideways.
 const w=fit==='width'?width:Math.min(width,height*art.front.aspect),h=w/art.front.aspect;
 const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);
 for(const [u,v] of [...art.front.profile].reverse())shape.lineTo((u-.5)*w,Math.max(.02,v*h));
 shape.closePath();
 const core=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,steps:1}),
  new THREE.MeshStandardMaterial({color:'#896a41',roughness:1}));
 core.position.z=-depth/2;root.add(core);
 for(const [face,z,yaw] of [[art.front,depth/2+.003,0],[art.back,-depth/2-.003,Math.PI]]){
  const fh=Math.min(h,w/face.aspect),fw=fh*face.aspect;
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(fw,fh),
   new THREE.MeshBasicMaterial({map:face.texture,transparent:true,alphaTest:.25,side:THREE.FrontSide}));
  plane.position.set(0,fh/2,z);plane.rotation.y=yaw;root.add(plane);
 }
 for(const secret of plannedSecrets(id)){
  const anchor=new THREE.Object3D();anchor.name=secret.id;
  anchor.position.set(...secret.local);anchor.userData={...secret,planningOnly:true};root.add(anchor);
 }
 root.userData.wallId=id;root.userData.art=art;root.userData.width=w;root.userData.height=h;
 return root;
}
export function disposeWall(root){
 if(!root)return;
 root.removeFromParent();
 const geometries=new Set(),materials=new Set();
 root.traverse(o=>{
  if(o.geometry)geometries.add(o.geometry);
  for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)materials.add(m);
 });
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
 disposeWallArt(root.userData.art);
}
