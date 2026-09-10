import * as THREE from '../lib/three.module.min.js';
import {AMUSEMENT_ART} from './catalogue.js';
import {buildPaperTheatre} from '../stalls/models.js';
import {buildDigbyHost,updateDigbyHost} from '../digby-stall.js?v=digby-depth-1';
import {assemble} from './batch.js';

const gold='#c99b52',green='#304532',red='#743e33',cream='#e5d1a3';
function mesh(root,name,geo,color,map,region=[0,0,1,1]){
 if(map){const [l,t,r,b]=region,uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,l+uv.getX(i)*(r-l),1-b+uv.getY(i)*(b-t));}
 const m=new THREE.Mesh(geo,map?new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide,transparent:true,alphaTest:.15}):new THREE.MeshStandardMaterial({color,roughness:.88}));
 m.name=name;root.add(m);return m;
}
function box(root,name,color,w,h,d,x,y,z,map,region){const m=mesh(root,name,new THREE.BoxGeometry(w,h,d),color,map,region);m.position.set(x,y,z);return m;}
function cyl(root,name,color,rt,rb,h,y=0,map,region){const m=mesh(root,name,new THREE.CylinderGeometry(rt,rb,h,24),color,map,region);m.position.y=y;return m;}
function card(root,name,map,rect,w,h,x,y,z,yaw=0){const m=mesh(root,name,new THREE.PlaneGeometry(w,h),null,map,rect);m.position.set(x,y,z);m.rotation.y=yaw;return m;}
function rod(root,name,a,b,r=.02,color=gold){
 const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);
 const m=mesh(root,name,new THREE.CylinderGeometry(r,r,delta.length(),7),color);m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;
}
function ring(root,name,r,y,color=gold,tube=.025){const m=mesh(root,name,new THREE.TorusGeometry(r,tube,6,48),color);m.position.y=y;m.rotation.x=Math.PI/2;return m;}
// Curved quarter-panels, not four flat pictures wrapped round a square box.
function drum(root,maps,rect,r,y,h,name,topRadius=r){
 for(let i=0;i<4;i++){
  const geo=new THREE.CylinderGeometry(topRadius,r,h,12,1,true,Math.PI/4+i*Math.PI/2,Math.PI/2);
  const m=mesh(root,name+' '+['front','left','back','right'][i],geo,null,maps[[3,2,1,0][i]],rect);m.position.y=y;
 }
}
function base(root,maps,r=1.3,rect=[0,.84,1,1]){
 cyl(root,'raised timber platform',red,r,r,.18,.11);drum(root,maps,rect,r+.006,.14,.25,'illustrated platform');
 ring(root,'brass platform rim',r,.26);ring(root,'lower platform rim',r,.04);
}
function canopy(root,maps,r,y,rect=[0,.03,1,.31]){
 cyl(root,'burgundy peaked roof',red,.035,r,.57,y+.35);
 drum(root,maps,rect,r,y,.55,'raised scalloped canopy');
 ring(root,'canopy cornice',r,y+.25);ring(root,'canopy lower binding',r,y-.23);
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6;rod(root,'gold roof rib',[0,y+.65,0],[Math.sin(a)*r,y+.25,Math.cos(a)*r],.013);
 }
 const finial=mesh(root,'crown finial',new THREE.SphereGeometry(.095,10,8),gold);finial.position.y=y+.72;
}
function heart(root,x,y,z,size=.1){
 const s=new THREE.Shape();s.moveTo(0,-1);s.bezierCurveTo(-1.6,.1,-.7,1.6,0,.65);s.bezierCurveTo(.7,1.6,1.6,.1,0,-1);
 const m=mesh(root,'raised brass heart',new THREE.ExtrudeGeometry(s,{depth:.09,bevelEnabled:false,curveSegments:5}),gold);m.scale.setScalar(size);m.position.set(x,y,z);return m;
}
function paperHorse(root,phase,map){
 const g=new THREE.Group();g.name='layered carousel horse';g.userData.phase=phase;root.add(g);
 const s=new THREE.Shape();s.moveTo(-.36,.43);s.bezierCurveTo(-.5,.62,-.53,.76,-.39,.8);
 s.lineTo(-.32,.58);s.bezierCurveTo(-.04,.51,.05,.52,.18,.75);s.lineTo(.2,.98);s.lineTo(.27,.86);
 s.lineTo(.34,.94);s.lineTo(.38,.83);s.lineTo(.57,.78);s.lineTo(.53,.66);s.lineTo(.34,.68);
 s.lineTo(.27,.41);s.lineTo(.44,.2);s.lineTo(.56,.19);s.lineTo(.56,.13);s.lineTo(.36,.13);
 s.lineTo(.17,.34);s.lineTo(.08,.3);s.lineTo(.05,.06);s.lineTo(.2,.04);s.lineTo(.2,-.01);s.lineTo(-.05,-.01);
 s.lineTo(-.1,.31);s.lineTo(-.25,.31);s.lineTo(-.42,.08);s.lineTo(-.27,.04);s.lineTo(-.27,-.01);
 s.lineTo(-.51,-.01);s.lineTo(-.51,.11);s.lineTo(-.36,.43);
 mesh(g,'cream cut-paper horse',new THREE.ExtrudeGeometry(s,{depth:.095,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:1,curveSegments:6}),cream);
 box(g,'burgundy saddle',red,.32,.15,.14,-.12,.49,.047);
 for(const z of [-.011,.11]){
  card(g,'illustrated saddle cloth',map,[.38,.65,.58,.80],.22,.16,-.1,.43,z);
  heart(g,-.1,.45,z,.032);const eye=mesh(g,'horse eye',new THREE.SphereGeometry(.015,6,5),'#30261b');eye.position.set(.35,.79,z);
  rod(g,'gold bridle',[.30,.82,z],[.35,.67,z],.013);
 }
 return g;
}
function carousel(root,maps){
 base(root,maps,1.3);canopy(root,maps,1.31,2.56);
 drum(root,maps,[.40,.35,.62,.72],.36,1.36,2.05,'ornate central drum');
 const rotor=new THREE.Group();rotor.name='six-horse turntable';root.add(rotor);const horses=[];
 for(let i=0;i<6;i++){
  const a=i*Math.PI/3,x=Math.sin(a)*.84,z=Math.cos(a)*.84;
  rod(rotor,'carousel pole',[x,.23,z],[x,2.35,z],.018);
  const h=paperHorse(rotor,a,maps[0]);h.position.set(x,.36,z);h.rotation.y=a+Math.PI/2;h.scale.setScalar(.64);horses.push(h);
 }
 root.userData.motion={kind:'carousel',rotor,horses,time:0};
}
function ferris(root,maps){
 base(root,maps,1.25,[0,.79,1,1]);
 const cy=2.72,R=1.88;
 for(const z of [-.34,.34])for(const x of [-.88,.88])rod(root,'brass-edged A frame',[x,.23,z],[0,cy,z],.063,red);
 for(const z of [-.365,.365])for(const x of [-.83,.83])rod(root,'support gold inlay',[x,.24,z],[0,cy,z],.013);
 const rotor=new THREE.Group();rotor.name='rotating eight-gondola wheel';rotor.position.y=cy;root.add(rotor);
 for(const z of [-.22,.22]){
  for(const r of [R,R-.10]){const m=mesh(rotor,'gold wheel rim',new THREE.TorusGeometry(r,.028,6,64),gold);m.position.z=z;}
  for(let i=0;i<8;i++){const a=i*Math.PI/4;rod(rotor,'wheel spoke',[0,0,z],[Math.cos(a)*R,Math.sin(a)*R,z],.022);}
  card(rotor,'heart hub',maps[z>0?0:2],[.40,.28,.62,.46],.54,.54,0,0,z+.014,z>0?0:Math.PI);
 }
 rod(root,'axle', [0,cy,-.49],[0,cy,.49],.09);const cabins=[];
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4,g=new THREE.Group();g.name='upright gondola '+(i+1);g.position.set(Math.cos(a)*R,Math.sin(a)*R,0);rotor.add(g);
  cyl(g,'gondola roof',gold,.02,.23,.20,.07);
  cyl(g,'gondola seat',green,.19,.15,.18,-.33);
  drum(g,maps,[.41,.04,.62,.23],.20,-.22,.42,'ornate gondola panels');
  for(let n=0;n<4;n++){const t=n*Math.PI/2;rod(g,'gondola brass post',[Math.sin(t)*.17,-.39,Math.cos(t)*.17],[Math.sin(t)*.17,.03,Math.cos(t)*.17],.012);}
  cabins.push(g);
 }
 root.userData.motion={kind:'ferris',rotor,cabins,time:0};
}
function spiral(root,maps){
 base(root,maps,1.13,[0,.83,1,1]);
 cyl(root,'tapered tower',red,.39,.60,3.5,1.95);
 drum(root,maps,[.37,.27,.64,.78],.60,1.95,3.5,'illustrated tower',.39);
 cyl(root,'lookout roof',red,.015,.60,.50,4.12);ring(root,'lookout lip',.60,3.91);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;rod(root,'lookout gilt rib',[0,4.38,0],[Math.sin(a)*.60,3.91,Math.cos(a)*.60],.014);}
 const points=[],vertices=[],uv=[],indices=[],N=160;
 // One continuous descending helical ribbon and an outward exit, not separate stairs.
 for(let i=0;i<=N;i++){
  const f=i/N,a=f*Math.PI*4.2,y=3.66-f*3.34,inner=.51+f*.13,outer=inner+.36;
  vertices.push(Math.sin(a)*inner,y,Math.cos(a)*inner,Math.sin(a)*outer,y,Math.cos(a)*outer);uv.push(0,f*4,1,f*4);
  points.push(new THREE.Vector3(Math.sin(a)*outer,y+.17,Math.cos(a)*outer));
  if(i<N){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 const slide=mesh(root,'continuous spiral slide',geo,cream);slide.material.side=THREE.DoubleSide;
 const rail=mesh(root,'continuous spiral handrail',new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),160,.026,6,false),gold);
 for(let i=0;i<points.length;i+=7){const p=points[i];rod(root,'slide baluster',[p.x,p.y-.17,p.z],[p.x,p.y,p.z],.017);}
 const last=points.at(-1);box(root,'one exit landing',red,.53,.08,.54,last.x,.26,last.z);
 card(root,'entrance arch',maps[0],[.26,.61,.59,.97],.60,1.45,0,.90,.64);
 root.userData.continuousSlide=rail;
}
function swings(root,maps){
 base(root,maps,1.28,[0,.81,1,1]);canopy(root,maps,1.23,3.02,[0,.035,1,.33]);
 drum(root,maps,[.39,.37,.62,.82],.24,1.54,2.58,'ornate swing column',.14);
 const rotor=new THREE.Group();rotor.name='eight-chair swing crown';rotor.position.y=2.80;root.add(rotor);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4,g=new THREE.Group();g.name='swing chair '+(i+1);g.rotation.y=a;rotor.add(g);
  for(const x of [-.12,.12])rod(g,'hanging brass chain',[x,0,.94],[x,-1.31,1.09],.012);
  box(g,'chair seat',red,.29,.055,.29,0,-1.34,1.09);
  box(g,'chair back',green,.29,.28,.045,0,-1.19,1.20,maps[0],[.10,.57,.23,.68]);
  for(const x of [-.13,.13])rod(g,'chair arm',[x,-1.23,.97],[x,-1.23,1.21],.012);
 }
 // There is one shared entry, not a second staircase printed on each side.
 for(let n=0;n<3;n++)box(root,'single front entry step',red,.62,.06,.17,0,.06+n*.06,1.52-n*.13);
 root.userData.motion={kind:'swings',rotor,time:0};
}
function balloons(root,maps){
 base(root,maps,.60,[.14,.73,.83,1]);drum(root,maps,[.16,.72,.85,.99],.49,.48,.68,'painted balloon urn',.44);
 const bouquet=new THREE.Group();bouquet.name='sixteen-balloon bouquet';root.add(bouquet);
 for(let i=0;i<16;i++){
  const a=i*2.39996,r=.32+.33*((i%3)/2),x=Math.sin(a)*r,z=Math.cos(a)*r,y=1.94+(i%4)*.20;
  rod(bouquet,'curled balloon stem',[0,.75,0],[x,y-.24,z],.009);
  const balloon=mesh(bouquet,'decorated paper balloon '+(i+1),new THREE.SphereGeometry(.23,12,10),[red,green,'#be8a42','#5a3b58'][i%4]);balloon.scale.set(1,1.27,.87);balloon.position.set(x,y,z);
  const h=heart(bouquet,x,y,z+.21,.065);h.rotation.z=.10*Math.sin(i);
 }
 root.userData.motion={kind:'balloons',rotor:bouquet,time:0};
}
export function buildAmusement(id,maps){
 const d=AMUSEMENT_ART[id];if(!d)throw new Error('Unknown amusement '+id);
 let root;
 if(['aura-ticket-booth','funhouse','fairground-organ','alley-wall-bay'].includes(id)){
  root=buildPaperTheatre(d,maps);
  if(id==='fairground-organ')for(let i=0;i<11;i++){
   const h=.48+.50*Math.sin((i+1)*Math.PI/12),x=(i-5)*.10;
   rod(root,'projecting brass organ pipe',[x,1.44,.07],[x,1.44+h,.07],.032);
  }
 }else{
  root=new THREE.Group();({ 'horse-carousel':carousel,'ferris-wheel':ferris,'helter-skelter':spiral,'chair-swings':swings,'balloon-tree':balloons })[id](root,maps);
 }
 root.name=d.name+' · '+d.host;root.userData.amusement=id;
 const motion=root.userData.motion;
 if(motion){
  const moving=motion.horses||motion.cabins||[];
  moving.forEach(part=>assemble(part));assemble(motion.rotor,moving);assemble(root,[motion.rotor]);
 }else assemble(root);
 root.userData.dimensions={height:d.height};return root;
}
export function buildAttendant(id,maps){const g=buildDigbyHost(maps);g.name=AMUSEMENT_ART[id].host+' — four-view attendant';return g;}
export {updateDigbyHost as updateAttendant};
export function updateAmusement(root,dt){
 const m=root?.userData.motion;if(!m)return;dt=Math.min(.05,Math.max(0,dt));m.time+=dt;
 if(m.kind==='carousel'){m.rotor.rotation.y=(m.rotor.rotation.y+dt*.25)%(Math.PI*2);for(const h of m.horses)h.position.y=.36+Math.sin(m.time*1.4+h.userData.phase)*.07;}
 if(m.kind==='ferris'){m.rotor.rotation.z=(m.rotor.rotation.z+dt*.12)%(Math.PI*2);for(const c of m.cabins)c.rotation.z=-m.rotor.rotation.z;}
 if(m.kind==='swings')m.rotor.rotation.y=(m.rotor.rotation.y-dt*.42)%(Math.PI*2);
 if(m.kind==='balloons')m.rotor.rotation.z=Math.sin(m.time*.65)*.015;
}
