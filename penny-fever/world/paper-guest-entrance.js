import * as THREE from './lib/three.module.min.js';
import { getDoll, onDollChange, crewArt } from './crew-selector.js?v=reliability-1';
import {loadWallArt} from './walls/art.js';
import {buildWall} from './walls/models.js';
import {WALL_RADIAL} from './walls/catalogue.js?v=paper-alley-live-2';
export const paperRail=new URLSearchParams(location.search).get('rail')==='paper';
// Outer arch on the pier; inner arch one stall-bay before the first vendor.
export const FOYER_IN=-7.35;
export const FOYER_OUT=.8;
function guestArt(spec){return crewArt(spec?.crew);}
export function installCrewGuest(player){
 if(!paperRail)return;
 const originals=[...player.children];
 const loader=new THREE.TextureLoader();
 const maps={};
 function tex(src){
  if(maps[src])return maps[src];
  const t=loader.load(src);t.colorSpace=THREE.SRGBColorSpace;maps[src]=t;return t;
 }

 const mat=new THREE.MeshBasicMaterial({map:tex(guestArt(getDoll())),transparent:true,alphaTest:.12,side:THREE.DoubleSide});
 const stand=new THREE.Group(),views=[];
 for(let side=0;side<4;side++){
  const view=new THREE.Group();
  function piece(x0,y0,x1,y1){const g=new THREE.PlaneGeometry((x1-x0)*1.2,(y1-y0)*1.6),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(side+x0+uv.getX(i)*(x1-x0))/4,y0+uv.getY(i)*(y1-y0));return new THREE.Mesh(g,mat)}
  const torso=piece(0,.26,1,1);torso.position.y=1.008;view.add(torso);
  const legs=[];for(let i=0;i<2;i++){const pivot=new THREE.Group();pivot.position.set((i?1:-1)*.3,.416,0);const shin=piece(i*.5,0,(i+1)*.5,.26);shin.position.y=-.208;pivot.add(shin);view.add(pivot);legs.push(pivot)}
  view.userData.legs=legs;stand.add(view);views.push(view);
 }
 originals.forEach(o=>{o.visible=false;globalThis.PennyFeverRestyle?.noteLiveBody(o);});
 player.add(stand);globalThis.PennyFeverRestyle?.notePaperCutout(stand);
 player.userData.paperGuest={stand,views,lastX:player.position.x,lastZ:player.position.z,phase:0};
 function wear(){mat.map=tex(guestArt(getDoll()));mat.needsUpdate=true;}
 onDollChange(wear);wear();
 globalThis.PennyFeverRestyle?.refreshRestyle();
}
export function updateCrewGuest(player,camera,dt){
 const g=player.userData.paperGuest;if(!g||!g.stand.visible)return;
 // The artwork is already flat; avoid flattening the billboard rotation a second time.
 player.scale.z=player.scale.x;
 const dx=player.position.x-g.lastX,dz=player.position.z-g.lastZ,travel=Math.hypot(dx,dz);g.lastX=player.position.x;g.lastZ=player.position.z;g.phase+=travel*11;
 const bearing=Math.atan2(camera.position.x-player.position.x,camera.position.z-player.position.z);
 const angle=Math.atan2(Math.sin(bearing-player.rotation.y),Math.cos(bearing-player.rotation.y));
 let view=Math.abs(angle)<Math.PI/4?0:Math.abs(angle)>Math.PI*3/4?2:angle>0?1:3;
 if(getDoll().crew==='rowan'&&(view===1||view===3))view=4-view;
 g.views.forEach((v,i)=>v.visible=i===view);
 g.stand.rotation.y=bearing-player.rotation.y;
 const swing=travel>.0001?Math.sin(Math.floor(g.phase*10)/10)*.13:0;
 for(const v of g.views){v.userData.legs[0].rotation.z=swing;v.userData.legs[1].rotation.z=-swing;}
 g.stand.position.y=travel>.0001?Math.abs(Math.sin(g.phase))*.025:0;
}
export function makePaperEntrance(scene){
 const card=new THREE.MeshStandardMaterial({color:0xa88c61,roughness:1,metalness:0});
 const loader=new THREE.TextureLoader();const arch=loader.load('assets/restyle/paper-entrance-cutout.png');arch.colorSpace=THREE.SRGBColorSpace;
 function box(w,h,d,x,y,z,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat||card);m.position.set(x,y,z);scene.add(m);return m}
 function facade(z){const m=new THREE.Mesh(new THREE.PlaneGeometry(9.4,5.33),new THREE.MeshBasicMaterial({map:arch,transparent:true,alphaTest:.15,side:THREE.DoubleSide}));m.position.set(0,2.65,z);m.rotation.y=Math.PI;scene.add(m);return m}
 facade(FOYER_IN);facade(FOYER_OUT);
 const midZ=(FOYER_IN+FOYER_OUT)/2,span=FOYER_OUT-FOYER_IN;
 box(3.0,.06,span+.4,0,-.005,midZ,card);
 for(let z=FOYER_IN+.45;z<FOYER_OUT-.3;z+=1.6){const light=new THREE.PointLight(0xffd69b,1.2,7,2);light.position.set(0,2.85,z);scene.add(light)}
 // Line the passage on the alley wall line, inset from both arch planes so the
 // PENNY FEVER cutout doorway stays open. Close-in walls filled the hole.
 const ARCH_INSET=1.2,lo=FOYER_IN+ARCH_INSET,hi=FOYER_OUT-ARCH_INSET,wallZ=(lo+hi)/2,wallSpan=hi-lo;
 for(const side of [-1,1]){
  loadWallArt('foyer',{side,angled:true}).then(art=>{
   const wall=buildWall('foyer',art,{width:wallSpan,height:4.2,fit:'width',depth:.22});
   wall.position.set(side*WALL_RADIAL,.04,wallZ);
   wall.rotation.y=-side*Math.PI/2;
   wall.name=(side<0?'Left':'Right')+' foyer passage wall';
   scene.add(wall);
  }).catch(error=>console.warn('[Penny Fever foyer]',error.message));
 }
}
