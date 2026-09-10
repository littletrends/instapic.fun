import { installMysticFront, installLoveFront } from './mystic-front.js?v=love-concept-13';
import { decorativePaper, decorateBoxSurfaces } from './paper-panels.js?v=reliability-1';
import * as THREE from './lib/three.module.min.js';
import { VENDOR_DESIGNS } from './vendor-designs.js?v=roomier-6';
import { paperRail } from './paper-guest-entrance.js';

const unit = new THREE.BoxGeometry(1,1,1);
const materials = new Map(), images = new Map();
function material(color) {
  if (!materials.has(color)) materials.set(color,new THREE.MeshStandardMaterial({color,roughness:1,metalness:0}));
  return materials.get(color);
}
function block(parent,color,w,h,d,x,y,z) {
  const mesh=new THREE.Mesh(unit,material(color));mesh.scale.set(w,h,d);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function cyl(parent,color,rt,rb,h,x,y,z,seg=12){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),material(color));
  mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function ball(parent,color,r,x,y,z){
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),material(color));
  mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function disk(parent,color,r,x,y,z,inner=0) {
  const geometry=inner?new THREE.RingGeometry(inner,r,28):new THREE.CircleGeometry(r,28);
  const mesh=new THREE.Mesh(geometry,material(color));mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function polygon(parent,color,points,z,depth=.065) {
  const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
  const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false}),material(color));mesh.position.z=z;parent.add(mesh);return mesh;
}
function panel(parent,map,w,h,x,y,z) {
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,transparent:true,alphaTest:.08}));mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function batchBoxes(root) {
  root.updateMatrixWorld(true);
  const inverse=root.matrixWorld.clone().invert(),batches=new Map();
  root.traverse(mesh=>{
    if(!mesh.isMesh||mesh.geometry!==unit||mesh.children.length)return;
    if(!batches.has(mesh.material))batches.set(mesh.material,[]);
    batches.get(mesh.material).push({mesh,matrix:new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld)});
  });
  for(const [mat,parts] of batches){
    const batch=new THREE.InstancedMesh(unit,mat,parts.length);
    parts.forEach(({mesh,matrix},i)=>{batch.setMatrixAt(i,matrix);mesh.parent.remove(mesh);});
    batch.instanceMatrix.needsUpdate=true;root.add(batch);
  }
}
function canvasTexture(w,h,paint) {
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;paint(canvas.getContext('2d'),w,h);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function sign(text,d,w=768,h=128) {
  return canvasTexture(w,h,(c)=>{
    c.fillStyle=d.trim;c.fillRect(0,0,w,h);c.strokeStyle=d.body;c.lineWidth=5;c.strokeRect(9,9,w-18,h-18);
    c.fillStyle='#30251c';let font=48;c.font=`bold ${font}px Georgia`;while(c.measureText(text).width>w-52)c.font=`bold ${--font}px Georgia`;
    c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2);
  });
}

// Small hand-drawn emblems are also printed on the adjoining wall and host badge.
function motif(c,type,color='#d9bc80') {
  c.save();c.fillStyle=color;c.strokeStyle=color;c.lineWidth=7;c.lineCap='round';c.lineJoin='round';
  const circle=(x,y,r,fill=true)=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);fill?c.fill():c.stroke();};
  const line=(points)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
  const rect=(x,y,w,h)=>c.fillRect(x,y,w,h);
  switch(type){
    case 'moon': circle(-5,0,36);c.globalCompositeOperation='destination-out';circle(12,-12,31);break;
    case 'heart': c.beginPath();c.moveTo(0,37);c.bezierCurveTo(-72,-3,-25,-61,0,-24);c.bezierCurveTo(25,-61,72,-3,0,37);c.fill();break;
    case 'key': circle(-20,-16,20,false);line([[-6,0],[31,36],[39,28],[28,18]]);break;
    case 'star': c.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?17:43;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();break;
    case 'camera': rect(-44,-25,88,57);rect(-29,-36,27,12);c.fillStyle='#392a20';circle(3,4,24);c.fillStyle=color;circle(3,4,16,false);break;
    case 'envelope': c.strokeRect(-43,-28,86,56);line([[-43,-28],[0,9],[43,-28]]);break;
    case 'balls': circle(0,-24,18);circle(-25,20,18);circle(25,20,18);break;
    case 'coin': circle(0,0,38,false);circle(0,0,28,false);rect(-3,-17,7,35);rect(-10,14,23,6);break;
    case 'bolt': c.beginPath();[[-4,-44],[-31,8],[-3,8],[-13,46],[36,-13],[9,-13],[22,-44]].forEach(([x,y])=>c.lineTo(x,y));c.closePath();c.fill();break;
    case 'water': c.beginPath();c.moveTo(0,-44);c.bezierCurveTo(-65,17,-30,48,0,40);c.bezierCurveTo(45,35,39,0,0,-44);c.fill();break;
    case 'bottle': line([[-10,-40],[10,-40],[10,-20],[23,-4],[23,39],[-23,39],[-23,-4],[-10,-20],[-10,-40]]);rect(-20,5,40,15);break;
    case 'disc': circle(-16,4,29,false);circle(19,-7,29,false);break;
    case 'reel': circle(0,0,40,false);for(let i=0;i<4;i++){const a=i*Math.PI/2;circle(Math.cos(a)*22,Math.sin(a)*22,9);}circle(0,0,5);break;
    case 'hammer': rect(-7,-12,14,57);rect(-35,-39,70,32);break;
    case 'mirror': c.beginPath();c.ellipse(0,-10,27,33,0,0,Math.PI*2);c.stroke();line([[0,25],[0,46]]);line([[-11,-26],[10,-7]]);break;
    case 'rings': circle(-19,3,25,false);circle(19,3,25,false);circle(0,-22,25,false);break;
    case 'pegs': for(let r=0;r<4;r++)for(let x=0;x<=r;x++)circle((x-r/2)*23,-33+r*22,6);break;
    case 'floss': rect(-3,3,6,44);circle(-15,-15,22);circle(10,-21,25);circle(20,-1,20);circle(-8,5,24);break;
    case 'popcorn': line([[-28,-9],[-21,39],[21,39],[28,-9],[-28,-9]]);for(let x=-20;x<=20;x+=20){circle(x,-20,13);line([[x*.7,-4],[x*.55,32]]);}break;
    case 'duck': c.beginPath();c.ellipse(0,16,36,23,0,0,Math.PI*2);c.fill();circle(19,-13,19);line([[34,-14],[48,-9],[35,-5]]);c.fillStyle='#392a20';circle(24,-18,3);break;
    case 'target': circle(0,0,40,false);circle(0,0,25,false);circle(0,0,10);break;
    case 'dish': c.beginPath();c.ellipse(0,19,42,15,0,0,Math.PI*2);c.stroke();circle(0,-19,15,false);break;
    case 'lifering': circle(0,0,39,false);circle(0,0,20,false);for(let i=0;i<4;i++){const a=i*Math.PI/2;line([[Math.cos(a)*21,Math.sin(a)*21],[Math.cos(a)*37,Math.sin(a)*37]]);}break;
    case 'bulb': circle(0,-12,28,false);line([[-15,13],[-13,35],[13,35],[15,13]]);line([[-12,44],[12,44]]);break;
    case 'case': c.strokeRect(-41,-22,82,58);line([[-17,-22],[-17,-37],[17,-37],[17,-22]]);line([[-22,-20],[-22,33]]);line([[22,-20],[22,33]]);break;
    case 'ticket': c.strokeRect(-45,-23,90,46);c.setLineDash([4,7]);line([[18,-20],[18,20]]);break;
  }
  c.restore();
}
function emblem(d) {return canvasTexture(192,192,c=>{c.translate(96,96);c.scale(1.65,1.65);motif(c,d.motif,d.trim);});}
function wallpaper(d) {
  return canvasTexture(512,512,c=>{
    c.fillStyle=d.body;c.fillRect(0,0,512,512);
    let seed=d.index+39;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
    for(let i=0;i<1700;i++){c.fillStyle=random()>.5?'#ffffff09':'#00000014';c.fillRect(random()*512,random()*512,1+random()*8,1);}
    for(let y=64;y<512;y+=128)for(let x=64;x<512;x+=128){c.save();c.translate(x+(y%256?0:24),y);c.scale(.4,.4);c.globalAlpha=.25;motif(c,d.motif,d.trim);c.restore();}
    c.strokeStyle=d.trim;c.lineWidth=4;c.strokeRect(14,14,484,484);c.lineWidth=1;c.strokeRect(23,23,466,466);
  });
}
function arch(parent,d) {
  // Layered side jambs and a horseshoe, leaving a deep display recess.
  for(let layer=0;layer<3;layer++){
    const color=layer%2?d.body:d.trim,z=.38+layer*.085,r=1.11-layer*.085;
    for(const x of [-r,r])block(parent,color,.095,1.77,.07,x,1.39,z);
    const ring=new THREE.Mesh(new THREE.RingGeometry(r-.095,r,32,1,0,Math.PI),material(color));ring.position.set(0,2.27,z);parent.add(ring);
  }
}
function top(parent,d) {
  const dark='#30271f',type=d.shape;
  if(['gable','dairy','scoreboard','lightning','luggage'].includes(type)){
    polygon(parent,d.trim,[[-1.24,2.78],[0,type==='lightning'?3.92:3.77],[1.24,2.78]],.25);
    polygon(parent,d.body,[[-1.07,2.84],[0,3.58],[1.07,2.84]],.33);
  } else if(['circus','pagoda','cloud','scallop','cart'].includes(type)) {
    polygon(parent,d.body,[[-1.3,2.9],[-.8,3.12],[0,type==='pagoda'?3.88:3.63],[.8,3.12],[1.3,2.9]],.12,.55);
    for(let i=0;i<11;i++){
      block(parent,i%2?d.body:d.trim,.235,.10,.78,-1.18+i*.235,2.84,.43).rotation.x=-.12;
      if(['cloud','scallop'].includes(type))disk(parent,i%2?d.body:d.trim,.135,-1.18+i*.235,2.79,.86);
    }
  } else if(['dome','observatory','heart','mirror','wave','pond'].includes(type)) {
    const cap=new THREE.Mesh(new THREE.CircleGeometry(1.22,32,0,Math.PI),material(d.body));cap.position.set(0,2.69,.25);parent.add(cap);
    const edge=new THREE.Mesh(new THREE.RingGeometry(1.13,1.22,32,1,0,Math.PI),material(d.trim));edge.position.set(0,2.69,.33);parent.add(edge);
  } else {
    block(parent,d.trim,2.47,.86,.2,0,3.11,.28);
    block(parent,d.body,2.29,.68,.22,0,3.11,.3);
    for(const x of [-1.13,1.13])block(parent,d.trim,.12,.25,.18,x,3.63,.28);
  }
  if(type==='tower') {
    block(parent,d.trim,.3,1.65,.22,0,3.5,.2);block(parent,d.body,.14,1.5,.24,0,3.48,.22);
    disk(parent,d.trim,.27,0,4.34,.37);disk(parent,dark,.19,0,4.34,.38);
  }
  if(type==='camera') {
    block(parent,d.body,.64,.27,.38,0,3.67,.26);disk(parent,d.trim,.29,0,3.12,.62);disk(parent,dark,.20,0,3.12,.63);
  }
  if(['cinema','marquee','lightning'].includes(type))for(let i=0;i<9;i++)disk(parent,d.trim,.042,-1.06+i*.265,3.4,.46);
  if(type==='curtain')for(const side of [-1,1])for(let i=0;i<4;i++)block(parent,i%2?d.body:'#532d36',.10,1.8,.12,side*(.72+i*.09),1.64,.6);
}
// Projecting paper signs face along the alley, rather than only across it.
function aisleSign(shell,spec,d,icon,side){
  const signRoot=new THREE.Group();signRoot.name=`${spec.name} walking sign`;
  signRoot.position.set(-side*1.08,2.0,.66);
  signRoot.rotation.y=side*Math.PI/2;shell.add(signRoot);
  block(signRoot,d.trim,.65,.045,.045,0,.36,0);
  for(const x of [-.24,.24])block(signRoot,d.trim,.025,.16,.025,x,.27,0);
  for(const facing of [-1,1]){
    const face=new THREE.Group();face.rotation.y=facing<0?Math.PI:0;signRoot.add(face);
    panel(face,decorativePaper(d.body,d.trim,d.index),.67,.65,0,-.03,.03);
    panel(face,icon,.32,.32,0,.04,.04);
    panel(face,sign(spec.name.toUpperCase(),d),.63,.13,0,-.23,.045);
  }
}

// Game-matching papercut set pieces. Extra volume goes up, sideways and back — not into the aisle.
function attraction(shell,spec,d){
  const b=d.body,t=d.trim,kraft='#c2a477',dark='#30271f',red='#7a3b33',pink='#dba4b8',water='#5a8a92';
  switch(spec.id){
    case 'fortune':
      cyl(shell,b,.02,.9,1.7,0,2.55,-.2,8);
      for(let i=0;i<8;i++){const s=block(shell,i%2?t:b,.18,1.55,.04,0,2.55,-.2);s.rotation.y=i*Math.PI/4;s.rotation.x=.42;}
      cyl(shell,t,.03,.03,2.4,0,3.1,-.2);ball(shell,t,.12,0,4.28,-.2);
      ball(shell,'#9ec4d4',.16,0,1.22,.62);cyl(shell,t,.05,.07,.28,0,1.02,.62);
      break;
    case 'love':
      block(shell,'#b74d5a',.28,2.4,.18,0,2.2,.42);
      for(const y of [1.3,1.9,2.5,3.1])disk(shell,'#e3af9a',.16,0,y,.52);
      block(shell,t,.55,.12,.22,-.55,.72,.55);block(shell,t,.55,.12,.22,.55,.72,.55);
      polygon(shell,'#b74d5a',[[0,.55],[-.42,.18],[.42,.18]],.55,.08).position.set(0,3.55,.5);
      break;
    case 'curios':
      for(let row=0;row<3;row++)for(let col=0;col<3;col++){
        block(shell,t,.38,.38,.12,-.5+col*.5,1.15+row*.5,-.42);
        block(shell,b,.28,.28,.1,-.5+col*.5,1.15+row*.5,-.34);
      }
      cyl(shell,t,.04,.04,1.1,.7,1.55,.35);block(shell,kraft,.22,.08,.22,.7,1.05,.4);
      break;
    case 'lookup':
      cyl(shell,b,.7,.85,.45,0,2.95,-.15,16);
      ball(shell,b,.72,0,3.35,-.15);
      cyl(shell,t,.07,.09,1.15,.45,2.55,.35);cyl(shell,dark,.11,.08,.22,.45,3.15,.55);
      disk(shell,t,.22,.45,3.15,.68);
      break;
    case 'snap':
      for(const side of [-1,1])block(shell,'#532d36',.08,1.7,.35,side*.55,1.55,.58);
      block(shell,'#532d36',1.2,1.55,.04,0,1.5,.42);
      block(shell,b,.55,.4,.4,0,1.15,.7);cyl(shell,t,.16,.16,.22,0,1.15,.92);disk(shell,dark,.12,0,1.15,1.04);
      break;
    case 'whisper':
      for(const x of [-.55,.55]){block(shell,b,.7,.9,.55,x,.95,.35);block(shell,t,.12,.12,.4,x,1.35,.62);}
      cyl(shell,t,.03,.03,.8,0,1.55,.55);cyl(shell,t,.08,.08,.08,-.25,1.55,.55);cyl(shell,t,.08,.08,.08,.25,1.55,.55);
      break;
    case 'ball-toss':
      block(shell,b,1.7,1.55,.12,0,1.7,.15);
      for(const [x,y] of [[-.5,1.9],[.5,1.9],[0,1.45],[-.5,1.15],[.5,1.15]])cyl(shell,dark,.13,.13,.08,x,y,.24);
      for(const x of [-.4,0,.4])ball(shell,t,.09,x,.78,.72);
      break;
    case 'coin-pusher':
      block(shell,t,1.85,.12,1.05,0,1.05,.15);
      for(let i=0;i<5;i++)block(shell,b,1.7,.04,.9,0,.55+i*.12,.12);
      for(let i=0;i<6;i++)cyl(shell,t,.06,.06,.02,-.6+i*.24,1.14,.4);
      break;
    case 'pinball':
      block(shell,b,1.15,.18,2.05,0,.95,.05);block(shell,t,1.05,.08,1.9,0,1.08,.08).rotation.x=-.18;
      block(shell,d.body,1.2,1.35,.16,0,2.15,-.55);
      for(const x of [-.35,0,.35])cyl(shell,t,.05,.05,.12,x,1.15,.55);
      break;
    case 'water-gun':
      block(shell,b,1.8,1.4,.14,0,1.75,.12);
      ball(shell,'#c45a3a',.32,0,2.15,.28);cyl(shell,t,.12,.18,.2,0,1.78,.28);
      for(const x of [-.55,.55]){cyl(shell,t,.05,.05,.55,x,.95,.7);block(shell,water,.08,.08,.35,x,.95,.95);}
      break;
    case 'milk-bottles':
      for(const [x,y] of [[-.28,.95],[0,.95],[.28,.95],[-.14,1.28],[.14,1.28],[0,1.6]]){
        cyl(shell,'#e5d5ab',.09,.11,.32,x,y,.55);cyl(shell,t,.05,.05,.08,x,y+.2,.55);
      }
      for(const x of [-.35,.35])ball(shell,t,.08,x,.72,.78);
      break;
    case 'cover-the-spot':
      cyl(shell,b,.7,.7,.08,0,.78,.45,20);disk(shell,t,.55,0,.83,.45);disk(shell,b,.22,0,.84,.46);
      for(let i=0;i<4;i++){const a=i*Math.PI/2;disk(shell,t,.16,Math.cos(a)*.45,.86,Math.sin(a)*.2+.45);}
      break;
    case 'mutoscope':
      cyl(shell,dark,.42,.42,.7,0,1.15,.35,16);block(shell,b,.7,.55,.55,0,1.65,.2);
      cyl(shell,t,.18,.22,.28,0,1.7,.58);block(shell,dark,.35,.22,.22,0,1.72,.72);
      cyl(shell,t,.04,.04,.35,.42,1.15,.4);block(shell,t,.12,.04,.12,.42,.95,.4);
      break;
    case 'high-striker':
      block(shell,t,.22,4.15,.22,0,2.2,-.05);block(shell,b,.16,3.9,.16,0,2.2,-.05);
      for(let i=0;i<8;i++)block(shell,i%2?t:b,.28,.08,.08,0,.55+i*.42,.08);
      cyl(shell,t,.22,.22,.08,0,4.35,-.05);ball(shell,'#d5ad65',.1,0,4.52,-.05);
      block(shell,dark,.55,.12,.18,0,.55,.45);block(shell,t,.12,.55,.12,0,.85,.55);
      break;
    case 'catoptromancy':
      block(shell,t,.08,2.05,.08,-.55,1.7,.4);block(shell,t,.08,2.05,.08,.55,1.7,.4);
      block(shell,t,1.2,.08,.08,0,2.72,.4);cyl(shell,'#83928b',.48,.48,.04,0,1.7,.42,20);
      disk(shell,t,.52,0,1.7,.44,.44);
      break;
    case 'bent-rings':
      block(shell,b,1.35,1.65,.12,0,1.7,.1);
      for(let i=0;i<6;i++){const peg=cyl(shell,t,.035,.035,.45,-.5+(i%3)*.5,1.35+Math.floor(i/3)*.55,.28);peg.rotation.z=(i-2.5)*.12;}
      // Hollow throwing hoops, tilted slightly so their openings read from the aisle.
      for(const [i,x] of [-.4,0,.4].entries()){
        const hoop=new THREE.Mesh(new THREE.TorusGeometry(.13,.022,8,24),material(t));
        hoop.rotation.x=-Math.PI/2+.16;
        hoop.rotation.z=(i-1)*.12;
        hoop.position.set(x,.85,.67);
        shell.add(hoop);
      }
      break;
    case 'plinko':
      block(shell,b,1.35,2.35,.1,0,2.05,.05);
      for(let row=0;row<7;row++)for(let col=0;col<=(row%2?4:5);col++){
        cyl(shell,t,.03,.03,.08,-.5+col*.22+(row%2?.11:0),1.05+row*.28,.14);
      }
      ball(shell,t,.07,0,3.15,.22);
      break;
    case 'fairy-floss':
      cyl(shell,t,.08,.08,1.15,0,1.35,.35);cyl(shell,pink,.55,.2,.35,0,1.95,.35,10);
      ball(shell,pink,.28,-.2,2.15,.4);ball(shell,'#f0c8d8',.22,.22,2.22,.32);ball(shell,pink,.18,0,2.35,.48);
      block(shell,kraft,.7,.35,.7,0,.55,.2);
      break;
    case 'popcorn':
      cyl(shell,'#c45a3a',.42,.38,.55,0,1.15,.35,12);cyl(shell,t,.12,.12,.35,0,1.6,.35);
      for(let i=0;i<7;i++)ball(shell,'#ecd7a9',.07,Math.cos(i)*.22,1.85+Math.abs(Math.sin(i*.7))*.12,.35+Math.sin(i)*.1);
      block(shell,b,1.15,.45,1.05,0,.45,.05);
      break;
    case 'duck-pond':
      cyl(shell,water,.85,.85,.16,0,.55,.25,20);cyl(shell,b,.9,.9,.08,0,.46,.25,20);
      for(const [x,z] of [[-.35,.15],[.1,.4],[.35,.05],[-.05,.55]]){
        ball(shell,t,.1,x,.68,z);block(shell,t,.12,.06,.08,x+.1,.7,z);
      }
      break;
    case 'skee-ball':
      block(shell,b,1.05,.18,2.2,0,.55,.05);block(shell,t,.95,.12,1.1,0,.72,.55).rotation.x=-.22;
      for(const [r,y] of [[.28,1.55],[.2,1.75],[.14,1.92]])cyl(shell,t,r,r,.05,0,y,-.15);
      ball(shell,t,.08,0,.72,.85);
      break;
    case 'penny-pitch':
      block(shell,'#c45a6a',1.7,.04,1.15,0,.72,.2);
      for(const [x,z,c] of [[-.4,.1,t],[.35,.35,b],[0,-.15,t],[.45,-.05,'#7a3b33'],[-.3,.4,b]])cyl(shell,c,.16,.16,.03,x,.76,z);
      cyl(shell,t,.05,.05,.02,0,.8,.55);
      break;
    case 'dunk-tank':
      block(shell,water,1.35,.7,1.05,0,.55,-.05);block(shell,b,1.45,.08,1.15,0,.22,-.05);
      block(shell,t,.45,.12,.45,0,1.15,-.05);block(shell,b,.2,1.1,.2,.7,1.15,.15);
      disk(shell,red,.16,.7,1.55,.28);
      break;
    case 'marquee':
      block(shell,b,2.15,.55,.18,0,3.15,.35);
      for(let i=0;i<11;i++)ball(shell,t,.055,-.95+i*.19,3.15,.48);
      for(let i=0;i<7;i++)ball(shell,i%2?t:b,.04,-.7+i*.23,2.75,.42);
      break;
    case 'pack':
      block(shell,b,1.35,.18,1.05,0,.55,.15);block(shell,b,1.35,1.05,.16,0,1.1,-.35);
      block(shell,t,1.2,.08,.9,0,.62,.2);block(shell,t,.18,.08,.55,.55,.7,.35);
      break;
    case 'pass':
      for(const side of [-1,1])for(let i=0;i<5;i++)block(shell,i%2?b:'#532d36',.16,2.2,.12,side*(.35+i*.12),1.55,.55);
      block(shell,t,1.5,.12,.16,0,2.7,.5);
      break;
  }
}

// Four silhouette studies: the attraction supplies the architecture, not a shared box.
function distinctFront(shell,spec,d,paper,icon){
  if(!['fortune','milk-bottles','duck-pond','high-striker'].includes(spec.id))return false;
  shell.userData.distinctFront=spec.id;
  const cream='#ead9b4',dark='#30271f';
  block(shell,dark,2.7,.12,1.9,0,.06,-.05);
  const plaque=(text,w,y,z)=>panel(shell,sign(text,d),w,.29,0,y,z);
  if(spec.id==='fortune'){
    // Open draped pavilion, with a folded pyramidal canopy and one reading table.
    block(shell,d.body,2.35,2.35,.08,0,1.27,-.78);
    panel(shell,paper,2.2,2.15,0,1.3,-.73);
    const roof=cyl(shell,d.body,0,1.73,1.02,0,2.94,-.1,4);
    roof.rotation.y=Math.PI/4;roof.scale.z=.76;
    for(const side of [-1,1]){
      block(shell,d.trim,.075,2.55,.075,side*1.16,1.34,.62);
      polygon(shell,d.body,[[side*1.2,.2],[side*.98,.2],[side*.71,1.25],[side*.93,2.48],[side*1.2,2.48]],.66);
      block(shell,d.trim,.25,.07,.10,side*.86,1.25,.75);
      polygon(shell,d.trim,[[side*1.21,2.48],[0,3.45],[side*1.15,2.49]],.55);
    }
    cyl(shell,d.trim,.03,.03,.3,0,3.52,-.1);
    panel(shell,icon,.5,.5,0,3.71,.02);
    cyl(shell,d.body,.59,.59,.08,0,.82,.12,16);
    for(const x of [-.4,.4])block(shell,d.trim,.07,.68,.07,x,.46,.12);
    cyl(shell,d.trim,.15,.21,.10,0,.91,.12,12);
    ball(shell,'#a9c8ce',.22,0,1.15,.12);
    for(const x of [-.35,.32])block(shell,cream,.18,.018,.27,x,.88,.20).rotation.y=x;
    plaque('MYSTIC TENT',1.8,2.42,.81);
    plaque('IRIS · A LITTLE LOOK AHEAD',1.7,.40,.69);
  }else if(spec.id==='milk-bottles'){
    // Open throwing counter: the six-bottle pyramid is the main display.
    block(shell,d.body,2.35,1.43,.08,0,1.55,-.71);
    panel(shell,paper,2.2,1.26,0,1.55,-.66);
    for(const x of [-1.18,1.18])block(shell,d.trim,.09,2.65,.09,x,1.38,.51);
    for(let i=0;i<10;i++){
      block(shell,i%2?d.body:cream,.25,.075,1.42,-1.125+i*.25,2.69,-.04).rotation.x=-.10;
      block(shell,i%2?d.body:cream,.25,.19,.06,-1.125+i*.25,2.53,.67);
    }
    block(shell,d.body,2.2,.54,.12,0,.38,.64);
    block(shell,cream,2.43,.09,.72,0,.72,.37);
    block(shell,d.trim,1.40,.08,.42,0,.94,-.22);
    for(const [x,y] of [[-.30,1.13],[0,1.13],[.30,1.13],[-.15,1.48],[.15,1.48],[0,1.83]]){
      cyl(shell,cream,.08,.11,.26,x,y,-.22,12);
      cyl(shell,cream,.045,.075,.09,x,y+.17,-.22,12);
      cyl(shell,d.body,.047,.047,.025,x,y+.226,-.22,12);
    }
    for(const x of [-.4,0,.4])ball(shell,'#985442',.09,x,.855,.52);
    plaque('MILK BOTTLES',2.12,2.93,.48);
    plaque('MABEL · THREE GOOD THROWS',1.85,.38,.73);
  }else if(spec.id==='duck-pond'){
    // Low oval pond under a light garden canopy; no tall counter hides the ducks.
    const basin=cyl(shell,d.body,1.05,1.05,.29,0,.32,.04,32);basin.scale.z=.66;
    const water=cyl(shell,'#72a8a3',1.00,1.00,.025,0,.48,.04,32);water.scale.z=.66;
    const rim=new THREE.Mesh(new THREE.TorusGeometry(1.035,.045,8,40),material(d.trim));
    rim.rotation.x=Math.PI/2;rim.scale.y=.66;rim.position.set(0,.49,.04);shell.add(rim);
    for(const [x,z] of [[-.60,.04],[-.18,.36],[.35,.2],[.60,-.2],[-.2,-.35]]){
      const body=ball(shell,'#e0b965',.12,x,.615,z);body.scale.set(1.25,.75,.85);
      ball(shell,'#e0b965',.075,x+.085,.72,z);
      block(shell,'#b66d3c',.085,.028,.05,x+.16,.72,z);
      ball(shell,dark,.013,x+.10,.744,z+.064);
    }
    for(const x of [-1.15,1.15]){
      block(shell,d.trim,.07,2.55,.07,x,1.35,-.58);
      for(let i=0;i<4;i++)block(shell,d.body,.07,.34,.05,x,1.05+i*.33,-.54).rotation.z=(i%2?1:-1)*.7;
    }
    polygon(shell,d.body,[[-1.27,2.57],[0,2.91],[1.27,2.57]],-.7,1.27);
    for(let i=0;i<9;i++)disk(shell,i%2?d.body:d.trim,.14,-1.12+i*.28,2.56,.6);
    plaque('DUCK POND',1.72,2.99,.14);
    plaque('DOTTIE’S QUACKING GARDEN',1.91,.27,.77);
  }else{
    // Freestanding bell tower with a visible striker pad and a mallet rack.
    block(shell,d.trim,.80,3.97,.16,0,2.16,-.25);
    block(shell,d.body,.66,3.83,.18,0,2.16,-.21);
    block(shell,dark,.16,3.56,.03,0,2.17,-.10);
    for(let i=0;i<9;i++){
      block(shell,cream,.18,.035,.035,(i%2?1:-1)*.20,.70+i*.35,-.085);
    }
    for(const x of [-.4,.4])block(shell,d.trim,.055,4.12,.055,x,2.13,-.25);
    cyl(shell,d.trim,.12,.29,.29,0,4.27,-.18,20);
    ball(shell,dark,.045,0,4.12,-.18);
    block(shell,d.body,.83,.25,.67,0,.25,.28);
    cyl(shell,d.trim,.22,.28,.11,0,.44,.30,16);
    block(shell,d.body,.48,.08,.38,.83,.28,.28);
    block(shell,d.trim,.065,.68,.065,.83,.63,.28).rotation.z=-.15;
    block(shell,dark,.38,.19,.23,.78,.94,.28);
    plaque('HIGH STRIKER',1.61,3.81,.0);
    plaque('MAGNUS · RING THE BELL',1.9,.15,.82);
  }
  return true;
}

export function installIndividualVendors(stalls,scene) {
  if(!paperRail)return;
  for(const stall of stalls){
    const spec=stall.userData.stall,d=VENDOR_DESIGNS[spec.id];if(!d)continue;
    stall.children.forEach(child=>{child.visible=false;globalThis.PennyFeverRestyle?.noteLiveBody(child);});
    const shell=new THREE.Group();shell.name=`${d.host}'s ${spec.name}`;
    globalThis.PennyFeverRestyle?.notePaperCutout(shell);
    shell.scale.x=1.2;
    shell.position.z=-.4;
    stall.add(shell);
    const paper=wallpaper(d),icon=emblem(d);
    if(!distinctFront(shell,spec,d,paper,icon)){
    block(shell,'#30271f',2.7,.12,1.9,0,.06,-.05);
    block(shell,d.body,2.4,2.7,.11,0,1.42,-.85);
    for(const x of [-1.22,1.22]){block(shell,d.body,.18,2.85,1.45,x,1.45,-.18);block(shell,d.trim,.06,2.78,.1,x,1.45,.58);}
    panel(shell,paper,2.05,2.55,0,1.48,-.64);
    // Open awnings for games and carts; curved frames for intimate parlours.
    const openFront=['circus','pagoda','cloud','cart','scoreboard','scallop','wave','luggage'].includes(d.shape);
    if(openFront){
      for(const x of [-1.13,1.13])block(shell,d.trim,.065,2.4,.065,x,1.38,.58);
      for(let i=0;i<11;i++)disk(shell,i%2?d.trim:d.body,.10,-1.05+i*.21,2.49,.66);
    }else arch(shell,d);
    top(shell,d);
    block(shell,d.body,1.95,.63,.15,0,.4,.55);block(shell,d.trim,2.16,.09,.61,0,.78,.47);
    panel(shell,sign(d.invitation,d),1.78,.25,0,.42,.64);
    panel(shell,sign(spec.name.toUpperCase(),d),2.24,.39,0,2.65,.83);
    panel(shell,sign(`${d.host.toUpperCase()} · YOUR HOST`,d),1.45,.18,.2,.17,.66);
    if(d.shape!=='camera' && d.shape!=='tower')panel(shell,icon,.55,.55,0,3.22,.54);
    panel(shell,decorativePaper(d.body,d.trim,d.index),1.65,2.05,.1,1.55,-.49);
    panel(shell,icon,.92,.92,.1,1.65,-.46);
    // Finish the structure before adding equipment, preserving clear game surfaces.
    decorateBoxSurfaces(shell,d.body,d.trim);
    attraction(shell,spec,d);
    }
    // Illustrated alley walls own the bays; do not plant the old repeating paper cards in front of them.
    // Raised folded-paper corner sprays cast real layered silhouettes around the artwork.
    for(const side of [-1,1]){
      for(let leaf=0;leaf<3;leaf++){
        const x=side*(1.07-leaf*.08),y=1.02+leaf*.16;
        polygon(shell,d.trim,[[x,y-.13],[x+side*.075,y],[x,y+.19],[x-side*.06,y]],.69+leaf*.018,.025);
      }
      const lantern=new THREE.Group();lantern.position.set(side*1.16,1.86,.73);shell.add(lantern);
      cyl(lantern,d.trim,.04,.12,.12,0,.19,0,4);
      cyl(lantern,'#ead1a0',.095,.095,.20,0,.035,0,4);
      cyl(lantern,d.trim,.12,.04,.08,0,-.10,0,4);
    }
    aisleSign(shell,spec,d,icon,stall.userData.side);
    batchBoxes(shell);
    if(spec.id==='fortune')installMysticFront(shell);
    if(spec.id==='love')installLoveFront(shell);
    stall.userData.paperStall=true;stall.userData.vendorDesign=d;
  }
}

export function installVendorCast(barkers) {
  if(!paperRail)return;
  const image=new Image();
  image.onload=()=>{
    // The source sheet has an opaque preview background. Key only the connected
    // neutral background, retaining enclosed eye highlights and pale costume detail.
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
    const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
    const pixels=c.getImageData(0,0,canvas.width,canvas.height),data=pixels.data,w=canvas.width,h=canvas.height;
    const queue=new Int32Array(w*h),seen=new Uint8Array(w*h);let head=0,tail=0;
    const background=i=>{const p=i*4,lo=Math.min(data[p],data[p+1],data[p+2]),hi=Math.max(data[p],data[p+1],data[p+2]);return lo>=210&&hi-lo<18;};
    function visit(i){if(i<0||i>=w*h||seen[i]||!background(i))return;seen[i]=1;queue[tail++]=i;}
    for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x);}for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1);}
    while(head<tail){const i=queue[head++],x=i%w;data[i*4+3]=0;if(x>0)visit(i-1);if(x<w-1)visit(i+1);visit(i-w);visit(i+w);}
    // Group disconnected held props with their nearest host. This also tolerates
    // a hand or mallet extending beyond the approximate source-sheet grid.
    const centres=Array.from({length:26},(_,i)=>({x:([130,335,540,745,945,1145,1340][i%7]/1437)*w,y:([157,447,709,965][Math.floor(i/7)]/1095)*h}));
    const groups=centres.map(()=>({pixels:[],minX:w,minY:h,maxX:0,maxY:0}));
    const foreground=new Uint8Array(w*h);
    for(let start=0;start<w*h;start++){
      if(foreground[start]||data[start*4+3]===0)continue;
      head=0;tail=0;queue[tail++]=start;foreground[start]=1;let sumX=0,sumY=0;
      while(head<tail){const i=queue[head++],x=i%w,y=Math.floor(i/w);sumX+=x;sumY+=y;
        for(const next of [x>0?i-1:-1,x<w-1?i+1:-1,i-w,i+w])if(next>=0&&next<w*h&&!foreground[next]&&data[next*4+3]){foreground[next]=1;queue[tail++]=next;}
      }
      if(tail<10)continue;
      const cx=sumX/tail,cy=sumY/tail;let nearest=0,best=Infinity;
      centres.forEach((p,i)=>{const d=(p.x-cx)**2+(p.y-cy)**2;if(d<best){best=d;nearest=i;}});
      const g=groups[nearest];for(let n=0;n<tail;n++){const i=queue[n],x=i%w,y=Math.floor(i/w);g.pixels.push(i);g.minX=Math.min(g.minX,x);g.minY=Math.min(g.minY,y);g.maxX=Math.max(g.maxX,x);g.maxY=Math.max(g.maxY,y);}
    }
    for(const person of barkers){
      const d=VENDOR_DESIGNS[person.userData.stallId];if(!d)continue;
      const g=groups[d.index];if(!g.pixels.length)continue;
      const sprite=document.createElement('canvas');sprite.width=g.maxX-g.minX+5;sprite.height=g.maxY-g.minY+5;
      const sc=sprite.getContext('2d'),out=sc.createImageData(sprite.width,sprite.height);
      for(const i of g.pixels){const dst=((Math.floor(i/w)-g.minY+2)*sprite.width+i%w-g.minX+2)*4;out.data.set(data.subarray(i*4,i*4+4),dst);}
      sc.putImageData(out,0,0);const texture=new THREE.CanvasTexture(sprite);texture.colorSpace=THREE.SRGBColorSpace;
      const mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.12,side:THREE.DoubleSide});
      const geometry=new THREE.PlaneGeometry(1.65*sprite.width/sprite.height,1.65);
      person.children.forEach(child=>{child.visible=false;globalThis.PennyFeverRestyle?.noteLiveBody(child);});
      const stand=new THREE.Group(),portrait=new THREE.Mesh(geometry,mat);portrait.position.y=.825;stand.add(portrait);person.add(stand);
      globalThis.PennyFeverRestyle?.notePaperCutout(stand);
      person.userData.crewName=d.host;
      person.userData.paperCrew={stand,legs:[],lastX:person.position.x,lastZ:person.position.z,phase:d.index*.7};
      globalThis.PennyFeverRestyle?.refreshRestyle();
    }
  };
  image.onerror=()=>console.warn('Individual vendor artwork unavailable; original hosts retained.');
  image.src='assets/restyle/vendor-cast-26.png';
}

// Block-geometry rides retired: papercut 4-view cutouts live in world/amusements/.
export function installMidwayRides(){}
export function updateMidwayRides(){}
