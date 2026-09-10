import * as THREE from '../lib/three.module.min.js';
import {STALL_ART} from './catalogue.js';
import {buildDigbyStall,buildDigbyHost,updateDigbyHost} from '../digby-stall.js?v=digby-depth-1';

function paint(root,name,map,rect,w,h,z,yaw=0,xOffset=0,flip=false){
 const [l,t,r,b]=rect,geometry=new THREE.PlaneGeometry(w*(r-l),h*(b-t)),uv=geometry.attributes.uv;
 for(let i=0;i<uv.count;i++){const u=uv.getX(i);uv.setXY(i,l+(flip?1-u:u)*(r-l),1-b+uv.getY(i)*(b-t));}
 const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map,transparent:true,alphaTest:.18,side:THREE.DoubleSide}));
 mesh.name=name;mesh.position.set((l+r-1)*w/2+xOffset,(1-(t+b)/2)*h,z);mesh.rotation.y=yaw;root.add(mesh);return mesh;
}
function box(root,name,color,w,h,d,x,y,z){
 const geometry=new THREE.BoxGeometry(w,h,d);
 const lining=root.userData.liningMap&&['folded frame thickness','recess backing','counter body'].includes(name);
 if(lining){const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,.32+uv.getX(i)*.36,.22+uv.getY(i)*.42);}
 const mat=lining?new THREE.MeshBasicMaterial({map:root.userData.liningMap}):new THREE.MeshStandardMaterial({color,roughness:1});
 const mesh=new THREE.Mesh(geometry,mat);mesh.name=name;mesh.position.set(x,y,z);root.add(mesh);return mesh;
}
function cylinder(root,name,color,r,h,x,y,z){
 const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24),new THREE.MeshStandardMaterial({color,roughness:1}));mesh.name=name;mesh.position.set(x,y,z);root.add(mesh);return mesh;
}
function roof(root,d,maps,W,H,front,back){
 const p=maps[0].userData.roof,q=maps[2].userData.roof;if(!p||!q)return;
 const v=[],uv=[],index=[],start=7,end=40;
 for(let i=start;i<=end;i++){
  const u=i/47,x=(u-.5)*W;
  v.push(x,Math.max(.1,p[i]*H-.025),front,x,Math.max(.1,q[47-i]*H-.025),back);uv.push(.2+u*.6,.58,.2+u*.6,.78);
  if(i<end){const k=(i-start)*2;index.push(k,k+1,k+2,k+1,k+3,k+2);}
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();
 const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:maps[2],side:THREE.DoubleSide}));mesh.name='shaped roof bridge';root.add(mesh);
}
// The same dimensional paper-theatre principle as approved Digby, with individual
// openings, proportions and furniture. Illustrated surfaces remain the source of detail.
export function buildStall(id,maps){
 const d=STALL_ART[id];if(!d)throw new Error('Unknown stall '+id);
 if(id==='curios')return buildDigbyStall(maps);
 return buildPaperTheatre(d,maps);
}
export function buildPaperTheatre(d,maps){
 const id=d.id;
 const root=new THREE.Group();root.name=`${d.host} — ${d.treatment} paper theatre`;
 root.userData.liningMap=maps[1];
 const H=d.height,W=Math.min(2.65,Math.max(2.05,H*maps[0].image.width/maps[0].image.height));
 const D=d.depth,F=.50,B=F-D+.08,[l,t,r,b]=d.opening;
 const face=(name,rect,z)=>paint(root,name,maps[0],rect,W,H,z);
 // Four distinct illustrations: the rear is never a reversed front.
 paint(root,'rear exterior',maps[2],[0,0,1,1],W,H,B,Math.PI);
 for(const [name,map,x,angle] of [['left exterior',maps[1],-W*.46,-Math.PI/2],['right exterior',maps[3],W*.46,Math.PI/2]]){
  const side=paint(root,name,map,[0,0,1,1],D,H,(B+F)/2,angle,x,d.flip);side.position.x=x;
 }
 // Folded solid shell surfaces live behind the printed panels. No large blank box
 // over the art, and every approach/collision/entry coordinate remains untouched.
 const floorY=d.treatment==='cart'?.10:.045;
 box(root,'raised paper floor',d.body,W*.89,.07,D*.93,0,floorY,(B+F)/2);
 box(root,'recess backing',d.body,W*(r-l),H*(b-t),.035,(l+r-1)*W/2,H*(1-(t+b)/2),B+.025);
 for(const x of [W*(l-.51),W*(r-.49)])box(root,'folded frame thickness',d.body,.06,H*(1-t),D*.78,x,H*(1-t)/2,(B+F)/2);
 roof(root,d,maps,W,H,F-.03,B);
 // Split the actual illustration, not a duplicate whole front over a box.
 face('ornate header',[0,0,1,t],F+.01);
 face('left illustrated surround',[0,t,l,1],F+.025);
 face('right illustrated surround',[r,t,1,1],F+.025);
 const inset=B+.12;
 if(['counter','awning','pagoda','lights','cart'].includes(d.treatment)){
  face('recessed display',[l,t,r,b],inset);
  face('projecting counter face',[l,b,r,1],F+.28);
  const y=H*(1-b);
  box(root,'counter body',d.body,W*(r-l),Math.max(.08,y-.07),D-.16,(l+r-1)*W/2,y/2,(B+F)/2+.08);
  box(root,'brass counter top',d.trim,W*(r-l)+.04,.035,D+.11,(l+r-1)*W/2,y+.015,(B+F)/2+.11);
  if(['awning','cart','pagoda','lights'].includes(d.treatment)){
   const band=.045;face('projecting canopy fringe',[l,t,r,t+band],F+.37);
   box(root,'folded canopy',d.body,W*(r-l),.05,.52,(l+r-1)*W/2,H*(1-t),F+.11);
  }
 }else if(['slope','ramp'].includes(d.treatment)){
  const cut=d.treatment==='ramp'?t+(b-t)*.44:t+(b-t)*.58;
  face('upper playfield',[l,t,r,cut],inset);
  // Actual sloping deck bridges the recess and the projecting control end.
  const zNear=F+.33,zFar=inset+.03,yHigh=H*(1-cut),yLow=H*(1-b);
  const length=Math.hypot(zNear-zFar,yHigh-yLow);
  const deck=paint(root,'sloping illustrated playfield',maps[0],[l,cut,r,b],W,length/(b-cut),0);
  deck.position.set((l+r-1)*W/2,(yHigh+yLow)/2,(zNear+zFar)/2);deck.rotation.x=-Math.atan2(zNear-zFar,yHigh-yLow);
  face('front apron',[l,b,r,1],zNear);
  for(const x of [W*(l-.5),W*(r-.5)]){
   const rail=box(root,'raised ramp rail',d.trim,.025,length,.04,x,(yHigh+yLow)/2,(zNear+zFar)/2);rail.rotation.x=deck.rotation.x;
  }
 }else if(d.treatment==='pond'||d.treatment==='tank'){
  face('deep water backdrop',[l,t,r,b],inset);
  const radius=W*(r-l)*.45,y=H*(1-b);
  cylinder(root,'rounded tank',d.body,radius,Math.max(.2,y-.05),(l+r-1)*W/2,y/2,F-.12);
  const water=cylinder(root,'water surface','#407c79',radius*.94,.012,(l+r-1)*W/2,y+.02,F-.12);water.material.roughness=.3;
  face('decorated pond rim',[l,b,r,1],F+.34);
 }else if(d.treatment==='tower'){
  face('bell and scale',[l,t,r,b],F+.04);face('striking platform',[l,b,r,1],F+.31);
  box(root,'tall scale backing',d.body,W*(r-l),H*(b-t),.24,(l+r-1)*W/2,H*(1-(t+b)/2),F-.08);
  cylinder(root,'raised strike pad',d.trim,.15,.07,0,.18,F+.16);
 }else{
  // Parlours retain their curtains. Their signature object is a separate front layer
  // inside the opening, with exposed side/rear walls when viewed obliquely.
  const pl=l+(r-l)*.25,pr=r-(r-l)*.25,pt=t+(b-t)*.30,pb=b;
  face('recess above prop',[l,t,r,pt],inset);
  face('recess left of prop',[l,pt,pl,pb],inset);
  face('recess right of prop',[pr,pt,r,pb],inset);
  face('signature prop',[pl,pt,pr,pb],F-.08);
  face('doorstep',[l,b,r,1],F+.22);
  cylinder(root,'prop pedestal',d.trim,W*(pr-pl)*.38,.075,(pl+pr-1)*W/2,H*(1-b)+.04,F-.16);
  if(d.treatment==='camera'){
   const lens=cylinder(root,'projecting camera lens',d.trim,.115,.19,0,H*.39,F+.02);lens.rotation.x=Math.PI/2;
  }
 }
 if(d.treatment==='lights')for(const side of [-1,1])for(let i=0;i<6;i++){
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(.024,6,5),new THREE.MeshBasicMaterial({color:'#ffdfa1'}));lamp.position.set(side*W*.36,H*(.24+i*.09),F+.055);root.add(lamp);
 }
 root.userData.turnaroundStall=id;root.userData.dimensions={width:W,height:H,depth:D};return root;
}
export function buildHost(id,maps){const model=buildDigbyHost(maps);model.name=`${STALL_ART[id].host} — four-view paper host`;model.userData.turnaroundHost=id;return model;}
// Inspection uses the complete front illustration, not the depth model's pieces.
export function buildStallFront(id,map){
 const h=STALL_ART[id].height||3.5,w=h*map.image.width/map.image.height;
 const front=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,transparent:true,alphaTest:.15,side:THREE.DoubleSide}));
 front.name=id+' — intact front artwork';front.position.set(0,h/2,.53);front.visible=false;return front;
}
export {updateDigbyHost as updateHost};
// Textures are shared by the alley cache. Dispose only per-model resources here.
export function disposeStallModel(root){if(!root)return;const geometry=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometry.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])materials.add(m);});geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.removeFromParent();}
