import * as THREE from './lib/three.module.min.js';
export const paperSlice = new URLSearchParams(location.search).get('slice') === 'paper';
let fibre;
export function paperMaterial(material){
 if(!paperSlice || !material.isMeshStandardMaterial)return material;
 if(!fibre){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#bba98a';g.fillRect(0,0,128,128);for(let i=0;i<1400;i++){const x=(i*67.3)%128,y=(i*31.7)%128;g.strokeStyle=i%2?'#bdac92':'#a9977c';g.beginPath();g.moveTo(x,y);g.lineTo(x+3,y+.5);g.stroke()}fibre=new THREE.CanvasTexture(c);fibre.wrapS=fibre.wrapT=THREE.RepeatWrapping;}
 material.roughness=1;material.metalness=0;material.bumpMap=fibre;material.bumpScale=.018;material.flatShading=true;return material;
}
export function paperProp(group){if(!paperSlice)return;const meshes=[];group.traverse(o=>{if(o.isMesh&&o.material.opacity!==0)meshes.push(o)});meshes.forEach(o=>{paperMaterial(o.material);if(o.material.transparent)return;const lines=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,30),new THREE.LineBasicMaterial({color:0x9c7950,transparent:true,opacity:.65}));o.add(lines)});}
export function finishPaperStudio(world){
 if(!paperSlice)return;
 document.body.classList.add('paper-slice-game');
 const loader=new THREE.TextureLoader();
 loader.load('assets/restyle/paper-studio.png',tex=>{tex.colorSpace=THREE.SRGBColorSpace;world.backdropMat.map?.dispose();world.backdropMat.map=tex;world.backdropMat.color.set(0xffffff);world.backdropMat.roughness=1;world.backdropMat.emissive.set(0x555555);world.backdropMat.emissiveMap=tex;world.backdropMat.needsUpdate=true;});
 world.backdrop.scale.set(1.5,1.3,1);world.backdrop.position.y=2;
 paperProp(world.root);
 // Keep the existing animated group and game references, replace its visible figure.
 const oldMeshes=[];world.aura.traverse(o=>{if(o.isMesh||o.isLineSegments)oldMeshes.push(o)});
 loader.load('assets/restyle/paper-aura.png',tex=>{tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.09,side:THREE.DoubleSide,depthWrite:false});const puppet=new THREE.Mesh(new THREE.PlaneGeometry(1.16,1.75),m);puppet.position.set(0,.88,.18);oldMeshes.forEach(o=>o.visible=false);world.aura.add(puppet);world.paperPuppet=puppet;});
 world.fill.color.set(0xe4c991);world.rim.color.set(0xe2b879);
 const link=document.createElement('a');link.className='paper-return';link.href='index.html?style=paper&rail=paper#foyer';link.textContent='← Back to Penny Alley';document.body.append(link);
}
export function tickPaperStudio(world,t,frozen){if(!paperSlice||!world.paperPuppet)return;const step=Math.floor(t*10)/10;world.paperPuppet.rotation.z=frozen?0:Math.sin(step*2)*.022;}
