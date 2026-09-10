import * as THREE from '../lib/three.module.min.js';
import {WALL_ART} from './catalogue.js';
import {loadWallArt,disposeWallArt} from './art.js';
import {buildWall,disposeWall} from './models.js';
const stage=document.querySelector('#stage'),status=document.querySelector('#status'),picker=document.querySelector('#wall-choice'),retry=document.querySelector('#retry');
const ids=Object.keys(WALL_ART);for(const id of ids){const o=document.createElement('option');o.value=id;o.textContent=WALL_ART[id].name;picker.append(o);}
const scene=new THREE.Scene();scene.background=new THREE.Color('#242b23');
const camera=new THREE.PerspectiveCamera(42,1,.1,100);
scene.add(new THREE.HemisphereLight(0xffefcf,0x4c5545,2.5));
const light=new THREE.DirectionalLight(0xffddb4,2);light.position.set(5,7,4);scene.add(light);
let renderer,model,controller,observer,frame=0,dead=false,sequence=0,yaw=.45,pitch=.12,distance=10,focusY=2;
function render(){
 frame=0;if(dead||!renderer)return;
 const d=distance*Math.max(1,1/camera.aspect);
 camera.position.set(Math.sin(yaw)*d*Math.cos(pitch),focusY+Math.sin(pitch)*d,Math.cos(yaw)*d*Math.cos(pitch));
 camera.lookAt(0,focusY,0);renderer.render(scene,camera);
}
function request(){if(!dead&&!frame)frame=requestAnimationFrame(render);}
function resize(){if(!renderer)return;const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();request();}
async function choose(id){
 if(dead||!renderer)return;
 controller?.abort();controller=new AbortController();const seq=++sequence;
 disposeWall(model);model=null;picker.value=id;status.hidden=false;retry.hidden=true;
 const d=WALL_ART[id];status.textContent='Unpacking '+d.name+'…';
 document.querySelector('#wall-title').textContent=d.name;document.querySelector('#wall-note').textContent=d.secret+'.';
 document.querySelector('#sheet-link').href=d.sheet;
 const url=new URL(location.href);url.searchParams.set('wall',id);history.replaceState(null,'',url);request();
 try{
  const art=await loadWallArt(id,{signal:controller.signal});
  if(dead||seq!==sequence){disposeWallArt(art);return;}
  try{model=buildWall(id,art);}catch(error){disposeWallArt(art);throw error;}
  focusY=model.userData.height/2;scene.add(model);status.hidden=true;request();
 }catch(error){if(dead||seq!==sequence)return;status.textContent='Artwork could not load. Retry or view the original sheet below.';retry.hidden=false;console.warn(error);}
}
try{
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
 stage.append(renderer.domElement);observer=new ResizeObserver(resize);observer.observe(stage);resize();
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();dead=true;controller?.abort();cancelAnimationFrame(frame);status.hidden=false;status.textContent='Graphics paused. Reload this preview to continue.';});
 const id=new URLSearchParams(location.search).get('wall');choose(WALL_ART[id]?id:'fortune');
}catch(error){status.textContent='3D preview unavailable. Use the turnaround-sheet link below.';console.warn(error);}
picker.addEventListener('change',()=>choose(picker.value));retry.addEventListener('click',()=>choose(picker.value));
for(const [name,step] of [['previous',-1],['next',1]])document.querySelector('#'+name).addEventListener('click',()=>choose(ids[(ids.indexOf(picker.value)+step+ids.length)%ids.length]));
document.querySelectorAll('[data-angle]').forEach(b=>b.addEventListener('click',()=>{yaw=Number(b.dataset.angle);pitch=.07;request();}));
document.querySelector('#zoom').addEventListener('input',e=>{distance=Number(e.target.value);request();});
let drag;
stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};stage.setPointerCapture(e.pointerId);});
stage.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;yaw-=(e.clientX-drag.x)*.008;pitch=Math.max(-.15,Math.min(.7,pitch+(e.clientY-drag.y)*.005));drag.x=e.clientX;drag.y=e.clientY;request();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,()=>drag=null);
stage.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')yaw-=.15;if(e.key==='ArrowRight')yaw+=.15;if(e.key==='ArrowUp')pitch=Math.min(.7,pitch+.08);if(e.key==='ArrowDown')pitch=Math.max(-.15,pitch-.08);request();});
// No idle animation. Switching walls and leaving this page release GPU resources.
addEventListener('pagehide',()=>{dead=true;++sequence;controller?.abort();cancelAnimationFrame(frame);observer?.disconnect();disposeWall(model);renderer?.dispose();renderer?.forceContextLoss();});
addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
