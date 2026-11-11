import * as THREE from '../lib/three.module.min.js';
import {contours,signedArea} from './pixels.js?v=treasures-1';

export function shapesFromMask(mask,size=96) {
  const loops=contours(mask,size,size).filter(p=>Math.abs(signedArea(p))>2);
  // Disconnected parts are retained, so a bail, flame or loose ribbon isn't silently lost.
  const outer=loops.filter(p=>signedArea(p)>0),holes=loops.filter(p=>signedArea(p)<0);
  const vector=p=>new THREE.Vector2((p[0]/size-.5)*3,(.5-p[1]/size)*3);
  const inside=(point,polygon)=>{
    let hit=false;
    for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const a=polygon[i],b=polygon[j];
      if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;
    }return hit;
  };
  return outer.map(loop=>{
    const shape=new THREE.Shape(loop.map(vector));
    for(const hole of holes)if(inside(hole[0],loop))shape.holes.push(new THREE.Path(hole.map(vector)));
    return shape;
  });
}
function paperShapes(face) {
  const c=document.createElement('canvas');c.width=c.height=96;
  const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(face,0,0,96,96);
  const p=ctx.getImageData(0,0,96,96).data,mask=new Uint8Array(96*96);
  for(let i=0;i<mask.length;i++)mask[i]=p[i*4+3]>96?1:0;
  return shapesFromMask(mask);
}
function material(face) {
  const map=new THREE.CanvasTexture(face);map.colorSpace=THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({map,transparent:true,alphaTest:.18,roughness:.88,metalness:.12,side:THREE.FrontSide});
}
function surface(face,z,reverse=false,flipX=false) {
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(3,3),material(face));mesh.position.z=z;
  if(flipX){mesh.material.map.repeat.x=-1;mesh.material.map.offset.x=1;}
  if(reverse)mesh.rotation.y=Math.PI;
  return mesh;
}
function edge(face,depth,colour) {
  const shapes=paperShapes(face);
  const geometry=new THREE.ExtrudeGeometry(shapes,{depth,bevelEnabled:false,steps:1,curveSegments:1});
  geometry.translate(0,0,-depth/2);
  const blank=new THREE.MeshBasicMaterial({visible:false});
  const card=new THREE.MeshStandardMaterial({color:colour,roughness:.95,metalness:.1});
  return new THREE.Mesh(geometry,[blank,card]);
}
export function makeObject(item,art) {
  const root=new THREE.Group(),depth=item.depth||.08;
  const colour=item.id.includes('moonlight')?0x65503e:item.id.includes('silver')||item.id==='whisper-charm'?0x9e9583:0xa77d43;
  const offset=item.punched?2:0;
  if(!item.hinged){
    root.add(edge(art.faces[offset],depth,colour));
    root.add(surface(art.faces[offset],depth/2+.002));
    root.add(surface(art.faces[offset+1],-depth/2-.002,true,item.id==='mirror-shard'));
    return {root,setOpen:()=>{}};
  }
  // A real hinge connects the front cover/lid to the back and interior.
  const base=new THREE.Group();root.add(base);
  base.add(edge(art.faces[0],depth,colour));
  base.add(surface(art.faces[1],-depth/2-.002,true));
  base.add(surface(art.faces[3],depth/2+.002));
  const hinge=new THREE.Group(),cover=new THREE.Group();root.add(hinge);hinge.add(cover);
  const suitcase=item.id==='night-suitcase';
  if(suitcase){hinge.position.set(0,art.height*.32,depth/2+.025);cover.position.y=-hinge.position.y;}
  else {hinge.position.set(-art.width/2,0,depth/2+.025);cover.position.x=art.width/2;}
  cover.add(edge(art.faces[0],.035,colour));
  cover.add(surface(art.faces[0],.020));
  cover.add(surface(art.faces[2],-.020,true));
  return {root,setOpen(open){
    if(suitcase){hinge.rotation.x=open?-2.25:0;root.position.y=open?-.4:0;}
    else {hinge.rotation.y=open?-2.7:0;root.position.x=open?art.width*.35:0;}
  }};
}
export function disposeObject(root) {
  const geometries=new Set(),materials=new Set(),maps=new Set();
  root.traverse(obj=>{
    if(obj.geometry)geometries.add(obj.geometry);
    for(const m of obj.material?Array.isArray(obj.material)?obj.material:[obj.material]:[]){materials.add(m);if(m.map)maps.add(m.map);}
  });
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());maps.forEach(m=>m.dispose());
}
