/* Art-direction pass for the isolated original-game copy. No gameplay rules here. */
import * as THREE from './lib/three.module.min.js';
const names={clay:'Claymation',rubber:'Rubberhose',paper:'Paper craft'};
const paperRail=new URLSearchParams(location.search).get('rail')==='paper';
export let style=paperRail?'paper':(new URLSearchParams(location.search).get('style')||'paper');
if(!names[style])style='paper';
let activeScene,base=[],people=[],materials=[],geometries=[],outlines=[];
const textures={};
function texture(kind){
 if(textures[kind])return textures[kind];
 const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
 g.fillStyle=kind==='clay'?'#a8a8a8':'#d3c6ac';g.fillRect(0,0,256,256);
 let seed=42;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<4000;i++){const x=rand()*256,y=rand()*256;g.strokeStyle=`rgba(45,30,15,${rand()*.16})`;g.lineWidth=.5;g.beginPath();g.moveTo(x,y);g.lineTo(x+rand()*7,y+rand()*2);g.stroke()}
 if(kind==='clay'){for(let n=0;n<18;n++){let x=rand()*256,y=rand()*256;for(let r=3;r<24;r+=3){g.strokeStyle='rgba(30,30,30,.13)';g.beginPath();g.ellipse(x,y,r,r*.65,.4,.2,4.2);g.stroke()}}}
 else {for(let x=0;x<256;x+=32){g.strokeStyle='#95866e';g.beginPath();g.moveTo(x,0);g.lineTo(x+2,256);g.stroke()}}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;textures[kind]=t;return t;
}
function rounded(geo){const g=new THREE.BoxGeometry(1,1,1,6,6,6),p=g.attributes.position;for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i),core=v.clone().clampScalar(-.4,.4);v.sub(core).normalize().multiplyScalar(.1).add(core);p.setXYZ(i,v.x,v.y,v.z)}g.computeVertexNormals();return g}
const roundedBox=rounded();
function material(m){
 if(!m.color)return m;
 const color=m.color.clone();
 if(style==='rubber'){
  const l=color.r*.3+color.g*.59+color.b*.11;color.setRGB(l*.96+.07,l*.73+.045,l*.38+.025);
  const levels=new Uint8Array([50,120,205,255]),gradient=new THREE.DataTexture(levels,4,1,THREE.RedFormat);gradient.needsUpdate=true;gradient.minFilter=gradient.magFilter=THREE.NearestFilter;materials.push(gradient);
  const n=new THREE.MeshToonMaterial({color,map:m.map||null,gradientMap:gradient,transparent:m.transparent,opacity:m.opacity,alphaTest:m.alphaTest,side:m.side});materials.push(n);return n;
 }
 const n=m.isMeshStandardMaterial?m.clone():new THREE.MeshStandardMaterial({color,map:m.map||null,side:m.side,transparent:m.transparent,opacity:m.opacity,alphaTest:m.alphaTest});
 n.roughness=style==='clay'?.94:1;n.metalness=0;n.bumpMap=texture(style);n.bumpScale=style==='clay'?.045:.017;
 if(style==='paper'){n.color.lerp(new THREE.Color('#b99b68'),.22);n.flatShading=true;}n.needsUpdate=true;materials.push(n);return n;
}
function restore(){outlines.forEach(o=>{o.parent?.remove(o);o.geometry.dispose();o.material.dispose()});outlines=[];base.forEach(b=>{b.mesh.material=b.material;b.mesh.geometry=b.geometry;b.mesh.scale.copy(b.scale)});people.forEach(p=>p.person.scale.copy(p.scale));materials.forEach(m=>m.dispose());materials=[];geometries.forEach(g=>g.dispose());geometries=[];}
function hasPaperStand(person){const u=person.userData||{};return !!(u.paperProprietor||u.paperGuest||u.paperCrew);}
function syncWorldSkin(){
 if(!activeScene)return;
 const paper=style==='paper';
 activeScene.traverse(o=>{
  if(o.userData.paperCutout)o.visible=paper;
  if(o.userData.hideWhenPaper)o.visible=!paper;
 });
}
function apply(){
 if(!activeScene)return;restore();const cache=new Map();
 base.forEach(b=>{const o=b.mesh,m=b.material;
 // Preserve sky, firefly sprites, translucent light effects, printed wall skins and signs.
 if(Array.isArray(m)||!m||m.side===THREE.BackSide||o.geometry?.type==='PlaneGeometry'||(m.transparent&&m.opacity<.7))return;
 if(!cache.has(m))cache.set(m,material(m));o.material=cache.get(m);
 if(o.isInstancedMesh){
  if(style==='clay'&&b.geometry.type==='BoxGeometry')o.geometry=roundedBox;
  return;
 }
 if(style==='clay'){
  if(b.geometry.type==='BoxGeometry'&&b.geometry.parameters.width===1&&Math.min(b.scale.x,b.scale.y,b.scale.z)>.08)o.geometry=roundedBox;
  else if(/Sphere|Cylinder/.test(b.geometry.type)){const g=b.geometry.clone(),p=g.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const k=1+.022*Math.sin(x*17+y*9+z*13);p.setXYZ(i,x*k,y*k,z*k)}g.computeVertexNormals();o.geometry=g;geometries.push(g)}
 }
 if(style==='rubber'&&/Cylinder/.test(b.geometry.type)){const g=b.geometry.clone(),p=g.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i);p.setX(i,x+.055*Math.cos(y*3))}g.computeVertexNormals();o.geometry=g;geometries.push(g)}
 if(style==='rubber'||style==='paper'){
  // Edge linework and physical card seams on existing scenery and characters.
  const e=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,style==='paper'?26:38),new THREE.LineBasicMaterial({color:style==='paper'?0x604222:0x100d09,transparent:true,opacity:style==='paper'?.72:.95}));e.userData.restyle=true;o.add(e);outlines.push(e);
 }
 });
 people.forEach(({person,scale})=>{
  person.scale.copy(scale);
  if(style==='paper'&&!hasPaperStand(person))person.scale.z*=.17;
  else if(style==='rubber'){person.scale.x*=1.1;person.scale.y*=1.04;}
 });
 document.body.dataset.restyle=style;
 document.querySelectorAll('[data-restyle-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.restyleChoice===style)));
 const note=document.getElementById('restyleLabel');if(note)note.textContent=names[style]+' · Original game';
 const url=new URL(location.href);url.searchParams.set('style',style);history.replaceState(null,'',url);
 syncWorldSkin();
}
export function mountRestyle(scene,characters){activeScene=scene;base=[];scene.traverse(o=>{if(o.isMesh)base.push({mesh:o,geometry:o.geometry,material:o.material,scale:o.scale.clone()})});people=characters.map(person=>({person,scale:person.scale.clone()}));apply();}
export function notePaperCutout(object){if(!object)return;object.userData.paperCutout=true;object.visible=style==='paper';}
export function noteLiveBody(object){if(!object)return;object.userData.hideWhenPaper=true;object.visible=style!=='paper';}
export function refreshRestyle(){if(activeScene)syncWorldSkin();}

/* Vendor interiors are separate Three scenes. Do not mix them into the alley `base`. */
export function restyleVendorScene(scene){
 if(!scene)return;
 const local=[];
 scene.traverse(o=>{if(o.isMesh&&!o.userData.restyle)local.push({mesh:o,geometry:o.geometry,material:o.material,scale:o.scale.clone()})});
 const cache=new Map();
 local.forEach(b=>{
  const o=b.mesh,m=b.material;
  if(o.isInstancedMesh||Array.isArray(m)||!m||m.side===THREE.BackSide||o.geometry?.type==='PlaneGeometry'||(m.transparent&&m.opacity<.7))return;
  if(!cache.has(m))cache.set(m,material(m));
  o.material=cache.get(m);
  if(style==='clay'){
   if(b.geometry.type==='BoxGeometry'&&b.geometry.parameters.width===1&&Math.min(b.scale.x,b.scale.y,b.scale.z)>.08)o.geometry=roundedBox;
   else if(/Sphere|Cylinder/.test(b.geometry.type)){const g=b.geometry.clone(),p=g.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const k=1+.022*Math.sin(x*17+y*9+z*13);p.setXYZ(i,x*k,y*k,z*k)}g.computeVertexNormals();o.geometry=g;geometries.push(g)}
  }
  if(style==='rubber'&&/Cylinder/.test(b.geometry.type)){const g=b.geometry.clone(),p=g.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i);p.setX(i,x+.055*Math.cos(y*3))}g.computeVertexNormals();o.geometry=g;geometries.push(g)}
  if((style==='rubber'||style==='paper')&&!o.children.some(c=>c.userData&&c.userData.restyle)){
   const e=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,style==='paper'?26:38),new THREE.LineBasicMaterial({color:style==='paper'?0x604222:0x100d09,transparent:true,opacity:style==='paper'?.72:.95}));e.userData.restyle=true;o.add(e);outlines.push(e);
  }
 });
 document.body.dataset.restyle=style;
}

if(typeof globalThis!=='undefined')globalThis.PennyFeverRestyle={restyleVendorScene,notePaperCutout,noteLiveBody,refreshRestyle,get style(){return style}};
export function poseRestyle(person,dt){
 const u=person.userData;
 if(style==='clay'||style==='paper'){
  u.restyleClock=(u.restyleClock||0)+dt;const fps=style==='clay'?12:10;
  if(u.restyleClock<1/fps&&u.restylePose){for(const [key,val] of Object.entries(u.restylePose))u[key].rotation.copy(val);return;}
  u.restyleClock=0;u.restylePose={};for(const key of ['armL','armR','legL','legR'])u.restylePose[key]=u[key].rotation.clone();
 }else if(style==='rubber'){u.hip.scale.set(1+Math.sin(u.t)*.045,1-Math.sin(u.t)*.04,1);}
 if(style!=='rubber')u.hip.scale.set(1,1,1);
}
document.body.dataset.restyle=style;

if(paperRail) document.body.classList.add('paper-original-rail');
