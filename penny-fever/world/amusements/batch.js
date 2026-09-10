import * as THREE from '../lib/three.module.min.js';
// Assemble static paper pieces sharing a material into one draw call. Moving groups
// retain their own pivot. No shared texture ownership is transferred or disposed.
export function assemble(root,protectedRoots=[]){
 root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),batches=new Map();
 root.traverse(o=>{
  if(!o.isMesh||Array.isArray(o.material))return;
  for(let p=o;p&&p!==root;p=p.parent)if(protectedRoots.includes(p))return;
  const m=o.material,key=[m.type,m.map?.uuid,m.color?.getHex(),m.side,m.transparent,m.alphaTest].join(':');
  if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o);
 });
 for(const pieces of batches.values()){
  if(pieces.length<2)continue;const chunks=[],names=[],material=pieces[0].material;
  for(const o of pieces){
   const copy=o.geometry.clone();copy.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));
   const flat=copy.index?copy.toNonIndexed():copy;if(flat!==copy)copy.dispose();chunks.push(flat);names.push(o.name);
  }
  const joined=new THREE.BufferGeometry();
  for(const key of ['position','normal','uv']){
   const attrs=chunks.map(g=>g.getAttribute(key));if(attrs.some(a=>!a))continue;
   const data=new Float32Array(attrs.reduce((n,a)=>n+a.array.length,0));let offset=0;
   for(const a of attrs){data.set(a.array,offset);offset+=a.array.length;}
   joined.setAttribute(key,new THREE.BufferAttribute(data,attrs[0].itemSize));
  }
  chunks.forEach(g=>g.dispose());const merged=new THREE.Mesh(joined,material);merged.name='Assembled paper detail';merged.userData.parts=names;root.add(merged);
  for(const o of pieces){o.removeFromParent();o.geometry.dispose();if(o.material!==material)o.material.dispose();}
 }
}
