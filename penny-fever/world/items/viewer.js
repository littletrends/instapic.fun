import * as THREE from '../lib/three.module.min.js';
import {makeObject,disposeObject} from './geometry.js?v=treasures-1';

export class ObjectViewer {
  constructor(host,onMode=()=>{}) {
    this.host=host;this.onMode=onMode;this.angle=0;this.tilt=0;this.zoom=1;this.opened=false;this.dead=false;
    this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(38,1,.1,30);this.camera.position.z=6.3;
    this.scene.add(new THREE.HemisphereLight(0xfff7e6,0x594638,2.3));
    const lamp=new THREE.DirectionalLight(0xffe3b5,2.5);lamp.position.set(-3,5,6);this.scene.add(lamp);
    const fill=new THREE.DirectionalLight(0xffffff,1);fill.position.set(3,1,-4);this.scene.add(fill);
    try{
      this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
      this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));this.renderer.setClearColor(0x000000,0);
      this.renderer.domElement.setAttribute('aria-hidden','true');host.append(this.renderer.domElement);
      this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this.fallback();});
    }catch{this.fallback();}
    this.events=new AbortController();const signal=this.events.signal;
    host.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;this.drag={id:e.pointerId,x:e.clientX,y:e.clientY};host.setPointerCapture(e.pointerId);host.focus();
    },{signal});
    host.addEventListener('pointermove',e=>{
      if(this.drag?.id!==e.pointerId)return;
      this.angle+=(e.clientX-this.drag.x)*.012;this.tilt=Math.max(-1.2,Math.min(1.2,this.tilt+(e.clientY-this.drag.y)*.008));
      this.drag.x=e.clientX;this.drag.y=e.clientY;this.draw();
    },{signal});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])host.addEventListener(event,()=>{this.drag=null;},{signal});
    host.addEventListener('keydown',e=>{
      const actions={ArrowLeft:()=>this.turn(-.25),ArrowRight:()=>this.turn(.25),ArrowUp:()=>{this.tilt=Math.max(-1.2,this.tilt-.15);this.draw();},ArrowDown:()=>{this.tilt=Math.min(1.2,this.tilt+.15);this.draw();},Home:()=>this.view('front'),'+':()=>this.magnify(.1),'-':()=>this.magnify(-.1)};
      if(actions[e.key]){e.preventDefault();e.stopPropagation();actions[e.key]();}
    },{signal});
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.resize();
  }
  fallback(){
    if(this.dead)return;
    if(this.renderer){const r=this.renderer;this.renderer=null;r.dispose();r.domElement.remove();}
    if(!this.flat){this.flat=document.createElement('canvas');this.flat.width=this.flat.height=512;this.flat.setAttribute('aria-hidden','true');this.host.append(this.flat);}
    this.onMode('flat');this.draw();
  }
  show(item,art){
    if(this.dead)return;
    if(this.object){this.scene.remove(this.object.root);disposeObject(this.object.root);this.object=null;}
    this.item=item;this.art=art;this.opened=false;this.angle=0;this.tilt=0;this.zoom=1;
    if(this.renderer){this.object=makeObject(item,art);this.scene.add(this.object.root);}
    this.host.setAttribute('aria-label',`${item.name}. Drag to turn, or use the arrow keys. Home shows the front.`);
    this.draw();
  }
  turn(amount){this.angle+=amount;this.draw();}
  view(side){this.angle=({front:0,left:-Math.PI/2,back:Math.PI,right:Math.PI/2})[side]??0;this.tilt=0;this.draw();}
  magnify(amount){this.zoom=Math.min(1.7,Math.max(.6,this.zoom+amount));this.draw();}
  toggleOpen(){this.opened=!this.opened;this.object?.setOpen(this.opened);this.draw();return this.opened;}
  resize(){
    if(this.dead)return;
    const w=Math.max(1,this.host.clientWidth),h=Math.max(1,this.host.clientHeight);
    this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer?.setSize(w,h);this.draw();
  }
  draw(){
    if(this.dead||this.frame)return;
    this.frame=requestAnimationFrame(()=>{
      this.frame=0;if(this.dead||!this.art)return;
      if(this.renderer&&this.object){
        this.object.root.rotation.set(this.tilt,this.angle,0);
        this.object.root.scale.setScalar(this.zoom*(this.opened ? .72 : 1));
        this.renderer.render(this.scene,this.camera);
      }else if(this.flat){
        const ctx=this.flat.getContext('2d');ctx.clearRect(0,0,512,512);
        const back=Math.cos(this.angle)<0?1:0,index=this.opened?2+back:(this.item.punched?2:0)+back;
        const size=512*this.zoom;
        ctx.save();if(this.item.id==='mirror-shard'&&back){ctx.translate(512,0);ctx.scale(-1,1);}
        ctx.drawImage(this.art.faces[index]||this.art.faces[0],(512-size)/2,(512-size)/2,size,size);ctx.restore();
      }
    });
  }
  destroy(){
    this.dead=true;cancelAnimationFrame(this.frame);this.events.abort();this.resizeObserver.disconnect();
    if(this.object)disposeObject(this.object.root);
    if(this.renderer){this.renderer.dispose();this.renderer.forceContextLoss();}
    this.host.replaceChildren();this.art=null;
  }
}
