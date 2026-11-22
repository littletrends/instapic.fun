import * as model from './skee-ball-moonbow-model.js?v=moonbow-six-1';
import {study,paper,text,button,compactHeader as header,compactFooter as footer,paintChapterReward} from './study-kit.js?v=studies-six-1';
import {withChapterExample} from './chapter-example.js?v=example-1';
import {spriteKey} from '../prizes.js?v=nft-art-1';
const cabinet=new Image();cabinet.src=new URL('../assets/skip-moonbow/cabinet-paper-v2.png',import.meta.url).href;
if(typeof document!=='undefined'&&typeof document.getElementById==='function'&&typeof document.createElement==='function'&&!document.getElementById('moonbow-cabinet-skin')){
 const style=document.createElement('link');style.id='moonbow-cabinet-skin';style.rel='stylesheet';
 style.href=new URL('../assets/skip-moonbow/cabinet-v2.css',import.meta.url).href;document.head.append(style);
}

const colours=['#b56f82','#8db5c4','#d6b267','#b79bc9'];
function star(c,x,y,r,fill){c.save();c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.44:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();c.fillStyle=fill;c.fill();c.restore();}
function emblem(c,id,x,y,r,colour){if(id==='crown'){c.save();c.fillStyle=colour;c.beginPath();for(const [u,v]of [[-1,-.45],[-.55,.1],[0,-1],[.55,.1],[1,-.45],[.8,.7],[-.8,.7]])c.lineTo(x+u*r,y+v*r);c.closePath();c.fill();c.fillRect(x-r*.8,y+r*.88,r*1.6,2);c.restore();}else if(id==='star'){star(c,x,y,r,colour);}else if(id==='moon'){c.save();c.fillStyle=colour;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.globalCompositeOperation='destination-out';c.restore();c.save();c.fillStyle='#243e51';c.beginPath();c.arc(x+r*.42,y-r*.2,r*.85,0,Math.PI*2);c.fill();c.restore();}else{for(let i=0;i<6;i++){const a=i*Math.PI/3;c.fillStyle=colour;c.beginPath();c.arc(x+Math.cos(a)*r*.45,y+Math.sin(a)*r*.45,r*.48,0,Math.PI*2);c.fill();}c.fillStyle='#edcf94';c.beginPath();c.arc(x,y,r*.3,0,Math.PI*2);c.fill();}}
function ball(d,x,y,r,spin=0,alpha=1){const c=d.c;c.save();c.globalAlpha=alpha;d.ellipse(x+3,y+r*.75,r*.95,r*.32,'#162b3f55');const g=c.createRadialGradient(x-r*.35,y-r*.4,1,x,y,r);g.addColorStop(0,'#f5e7bf');g.addColorStop(.5,'#c9a66c');g.addColorStop(1,'#7b563f');d.circle(x,y,r,g,'#f3d798',1.5);c.translate(x,y);c.rotate(spin);c.strokeStyle='#8d684746';c.lineWidth=2;c.beginPath();c.ellipse(0,0,r*.45,r*.86,.3,0,Math.PI*2);c.stroke();d.circle(-r*.32,-r*.35,r*.18,'#fff3d18f');c.restore();}
function draw(s,d){const c=d.c,r=model.rules(s);
 if(cabinet.complete&&cabinet.naturalWidth)c.drawImage(cabinet,28,78,844,1010);
 header(c,'SKIP’S MOONBOW SKEE-BALL',(s.level+1)+' · '+r.name,true);
 ;text(c,s.remaining+' / '+r.balls+' balls · '+s.score+' points · '+(r.banks?'rail scores '+s.bankedShots+' / '+r.banks:'aim '+model.aimValue(s)+'°'),450,222,24,'#fff0c9');
 const goals=r.order?r.order.map((id,i)=>({id,n:i<s.orderAt?1:0,target:1,next:i===s.orderAt})):r.cups.map((p,id)=>({id,n:s.counts[id],target:r.need[id]}));
 const w=Math.min(152,660/goals.length);goals.forEach((g,i)=>{const p=r.cups[g.id],x=450+(i-(goals.length-1)/2)*w;paper(c,x,278,w-8,42,g.next?'#f5dfb4':g.n>=g.target?'#5c806b':'#eee4cc','#b79c67',8);text(c,p.id.toUpperCase()+' '+(r.order?(g.n?'✓':''):Math.min(g.n,g.target)+'/'+g.target),x,278,19,g.n>=g.target?'#fff0cf':'#55413b');});
 // Every brass rail and circular pocket follows the actual collision geometry.
 paper(c,450,638,482,662,'#5d3c28','#dbb778',16);
 const wood=c.createLinearGradient(224,0,676,0);wood.addColorStop(0,'#b69564');wood.addColorStop(.12,'#f3dfb2');wood.addColorStop(.5,'#e4c88d');wood.addColorStop(.87,'#f6e5be');wood.addColorStop(1,'#b79561');c.fillStyle=wood;c.fillRect(model.LEFT,model.TOP,model.RIGHT-model.LEFT,650);
 c.save();c.beginPath();c.rect(model.LEFT,model.TOP,model.RIGHT-model.LEFT,650);c.clip();for(let x=230;x<676;x+=19){c.strokeStyle=x%3?'#b28c4c29':'#fff3d142';c.lineWidth=1.2;c.beginPath();c.moveTo(x,312);c.bezierCurveTo(x-5,500,x+7,780,x-2,958);c.stroke();}c.restore();
 const felt=c.createLinearGradient(0,308,0,616);felt.addColorStop(0,'#132239');felt.addColorStop(1,'#25364b');c.fillStyle=felt;c.fillRect(224,308,452,308);c.strokeStyle='#b8985c';c.lineWidth=2;c.strokeRect(232,316,436,292);for(let y=320;y<608;y+=7){c.strokeStyle='#e6c99c06';c.beginPath();c.moveTo(235,y);c.lineTo(665,y);c.stroke();}
 for(let x=247;x<670;x+=35){star(c,x,337+(x%3)*9,3.5,'#cfb47166');star(c,x+7,580,3,'#cfb47155');}
 for(const x of [model.LEFT,model.RIGHT]){d.line({x,y:312},{x,y:954},'#674e35',14);d.line({x:x-2,y:312},{x:x-2,y:954},'#e8c987',7);for(let y=340;y<950;y+=47)d.circle(x,y,2.5,'#816139');}
 d.line({x:224,y:308},{x:676,y:308},'#d7b77c',9);
 c.save();const ramp=c.createLinearGradient(0,610,0,700);ramp.addColorStop(0,'#725c39');ramp.addColorStop(.15,'#b59356');ramp.addColorStop(.48,'#f8e7bd');ramp.addColorStop(.8,'#e5cb91');ramp.addColorStop(1,'#c8a76b00');c.fillStyle=ramp;c.fillRect(232,610,436,90);for(const y of [620,628,636]){c.strokeStyle=y===628?'#9c7748':'#fff0c770';c.lineWidth=y===628?3:2;c.beginPath();c.moveTo(232,y+15);c.bezierCurveTo(350,y-7,550,y-7,668,y+15);c.stroke();}for(const y of [750,816,879]){c.strokeStyle='#9d7f4433';c.lineWidth=1;c.beginPath();c.moveTo(233,y);c.lineTo(667,y);c.stroke();}c.restore();
 text(c,'THE MOONBOW RAMP',450,692,18,'#8a704b');d.line({x:450,y:738},{x:450,y:889},'#9e824b55',2);
 for(let i=0;i<r.cups.length;i++){
  const p=r.cups[i],lit=s.counts[i]>0;
  d.ellipse(p.x+3,p.y+7,p.r+12,p.r+10,'#02091499');
  const brass=c.createLinearGradient(p.x-p.r,p.y-p.r,p.x+p.r,p.y+p.r);brass.addColorStop(0,'#fff0bc');brass.addColorStop(.25,'#be9357');brass.addColorStop(.5,'#f0cf8b');brass.addColorStop(.8,'#8e643b');brass.addColorStop(1,'#dbb473');
  d.circle(p.x,p.y,p.r+9,'#61452f','#d6b57b',2);d.circle(p.x,p.y,p.r+5,brass,'#f3d497',1.5);
  const bowl=c.createRadialGradient(p.x,p.y-4,2,p.x,p.y,p.r);bowl.addColorStop(0,'#040e1b');bowl.addColorStop(.78,'#142238');bowl.addColorStop(1,'#394858');
  d.circle(p.x,p.y,p.r-2,bowl,'#5c442e',4);c.save();c.beginPath();c.arc(p.x,p.y,p.r-4,Math.PI*1.05,Math.PI*1.95);c.strokeStyle='#020912';c.lineWidth=7;c.stroke();c.restore();
  for(const a of [.25,.75,1.25,1.75]){const x=p.x+Math.cos(a*Math.PI)*(p.r+6),y=p.y+Math.sin(a*Math.PI)*(p.r+6);d.circle(x,y,2.3,'#805a36','#f5d798',.7);}
  emblem(c,p.id,p.x,p.y-9,12,lit?'#ffe6a6':colours[i]);text(c,p.value,p.x,p.y+18,18,lit?'#fff0b6':'#e5d1ae');
  if(lit){d.glow(p.x,p.y,p.r+13,'#ebc16b');d.circle(p.x+p.r-1,p.y-p.r+1,9,'#e9c57d','#fff1bd',1);text(c,'✓',p.x+p.r-1,p.y-p.r+1,12,'#473828');}
  if(s.flash[i])d.glow(p.x,p.y,p.r+15,'#f5dca4');
 }
 for(const b of r.bumpers){d.circle(b.x+3,b.y+4,b.r+3,'#72573470');d.circle(b.x,b.y,b.r,'#c19751','#ffdf9a',3);d.circle(b.x,b.y,b.r-7,'#f4dca0','#a57c40',2);star(c,b.x,b.y,b.r*.55,'#b48c46');}
 if(s.phase==='play')for(const [i,p]of model.preview(s).entries())d.circle(p.x,p.y,3.2-i*.17,'#8a7148a0');
 if(s.ball){const b=s.ball,u=b.t/.55,scale=b.mode==='sinking'?1-u*.85:1;ball(d,b.x,b.y,b.r*scale,b.spin,b.mode==='sinking'?1-u*.5:1);}else if(s.phase==='play'){ball(d,450,916,20);d.circle(450,916,36,null,'#fff0b899',1.5);}
 paper(c,450,956,474,32,'#243d4e','#bf9b60',6);text(c,'AIM '+model.aimValue(s)+'°',450,956,17,'#e9d4a6');
 paper(c,450,994,690,53,'#163748f5','#c6a36d',10);text(c,'STRENGTH',180,994,21,'#f2dfb7');d.line({x:280,y:994},{x:690,y:994},'#0c2635',13);d.line({x:280,y:994},{x:280+(model.powerValue(s)-20)/80*410,y:994},'#d8b56d',9);for(let v=20;v<=100;v+=20)d.line({x:280+(v-20)/80*410,y:983},{x:280+(v-20)/80*410,y:1005},'#fff0c64f',1);d.circle(280+(model.powerValue(s)-20)/80*410,994,8,'#fff1cb','#b69259',2);text(c,model.powerValue(s),746,994,23,'#f3dfa9');
 button(c,'↶ UNDO',155,1044,128);text(c,s.phase==='play'?'FLICK UP TO ROLL':'WATCH THE BALL SETTLE',460,1044,19,'#fff0c9');paper(c,746,1044,110,50,'#f3e1b8aa','#ad875170',10);text(c,s.charge?'RELEASE':'ROLL',746,1044,20,'#554438');
 const note=s.throws===0&&s.phase==='play'?(r.order?'Follow the highlighted pocket order.':'Light every listed pocket seal.'):s.note;footer(c,{note},true);paintChapterReward(s,d,{dark:true});
}
const instructions='Flick the wooden ball straight from its return spot up the lane: press on the ball, slide upward toward your target, then release. A longer flick adds strength and the direction sets aim. A cancelled or tiny gesture never spends a ball. You can also use the strength slider and the small Roll control. Roll real wooden balls up the Moonbow ramp. Tap or drag INSIDE the lane to aim, then set the STRENGTH slider and press Roll. A quick tap uses your chosen strength; holding Roll slowly boosts it, then release to send. A softer roll travels less far; too much speed strikes a pocket rim. The eight dots show only the start, not a complete solution. Each ball rolls, rebounds and physically sinks or returns before score is credited. Side rails count as banks; sun bumpers do not. Chapter1 needs three different successful pockets. Chapter2 also needs a scoring bank shot. Chapter3 adds a fourth pocket and a sun bumper. Chapter4 follows a highlighted four-pocket ribbon in order. Chapter5 needs two scoring banks and two Moon captures. Chapter6 follows five ordered pockets with two scoring banks. Wrong-order pockets score points but leave the ribbon waiting. Balls are limited; misses can lose the round. Retry is free in this local preview. Arrows left/right adjust aim, up/down adjust strength; hold/release Space to roll, Enter rolls at selected strength, U undoes. Help pauses; held aim or charge cancels safely.';
const engine=study({id:'skee-ball',mode:'moonbow-play',title:'Skip’s Moonbow Skee-Ball',model,draw,intro:'Flick a wooden ball up the moonlit cabinet. Steer the roll with your swipe and use the rails to light the constellation.',instructions,keys:'Flick ball up lane · Longer flick = stronger · U Undo',tap(){}});
const persist=s=>{try{engine.persist(s);}catch{}};
const originalPointer=engine.pointer;engine.pointer=(s,type,p)=>{if(type==='cancel'){delete s.rollDrag;model.endAim(s,false);model.endPower(s,false);model.endCharge(s,false);originalPointer(s,type,p);return;}if(s.saveError||s.result||s.phase==='celebrate')return;
 if(s.rollDrag){
  const start=s.rollDrag,dx=p.x-start.x,dy=p.y-start.y,length=Math.hypot(dx,dy);
  if(type==='move'||type==='up'){
   s.aimDrag={value:Math.max(-60,Math.min(60,Math.atan2(dx,-dy)*180/Math.PI))};
   s.powerDrag={value:Math.max(20,Math.min(100,20+length*.25))};
  }
  if(type==='up'){
   delete s.rollDrag;
   if(length>=24&&dy< -12){model.endAim(s,true);model.endPower(s,true);model.shoot(s);}
   else{model.endAim(s,false);model.endPower(s,false);s.note='Start on the wooden ball and flick upward. A longer flick rolls harder.';}
   persist(s);
  }
  return;
 }
 if(type==='down'&&s.phase==='play'&&Math.hypot(p.x-450,p.y-916)<72){s.rollDrag={x:p.x,y:p.y};return;}
 if(s.charge){if(type==='up'){model.endCharge(s,true);persist(s);}return;}
 if(s.aimDrag){if(type==='move')model.moveAim(s,p);if(type==='up'){model.moveAim(s,p);model.endAim(s,true);persist(s);}return;}
 if(s.powerDrag){if(type==='move')model.movePower(s,p);if(type==='up'){model.movePower(s,p);model.endPower(s,true);persist(s);}return;}
 if(type==='down'&&s.phase==='play'){if(p.y>1016&&p.y<1073&&p.x>690&&p.x<803){model.beginCharge(s);return;}if(p.y>972&&p.y<1015&&p.x>260&&p.x<710){model.beginPower(s,p);return;}if(p.x>model.LEFT&&p.x<model.RIGHT&&p.y>model.TOP&&p.y<941){model.beginAim(s,p);return;}}originalPointer(s,type,p);};
engine.key=(s,k,down)=>{if(s.saveError||s.result||s.phase==='celebrate')return;if(k===' '){if(down)model.beginCharge(s);else{model.endCharge(s,true);persist(s);}return;}if(!down)return;if(k.toLowerCase()==='u')model.undo(s);if(k==='ArrowLeft')model.setAim(s,s.aim-1);if(k==='ArrowRight')model.setAim(s,s.aim+1);if(k==='ArrowUp')model.setPower(s,s.power+2);if(k==='ArrowDown')model.setPower(s,s.power-2);if(k==='Enter')model.shoot(s);persist(s);};
const release=engine.releaseInput;engine.releaseInput=s=>{delete s.rollDrag;model.endAim(s,false);model.endPower(s,false);model.endCharge(s,false);release(s);};engine.instructions=instructions;engine.artReady=()=>cabinet.complete&&cabinet.naturalWidth>0;
const exampleModel={
 makeState:()=>({...model.makeState(0),demo:true}),
 step(s,dt){if(s.demoRewardAge!==undefined){s.demoRewardAge+=dt;return;}model.step(s,dt);if(s.phase==='celebrate'){s.phase='demo-finish';s.pendingPennies=0;s.demoRewardAge=0;s.note='Three real pockets caught. Complete demonstration; nothing collected.';}},
};
function drawExample(s,d){draw(s,d);if(s.demoRewardAge===undefined)return;const c=d.c,id=engine.prizes[0],turn=Math.max(0,s.demoRewardAge-.3)/3*4,i=Math.floor(turn)%4,mix=turn-Math.floor(turn),views=['front','right','back','left'];
 paper(c,450,587,568,472,'#172940f5','#dfba7c');text(c,'CONSTELLATION COMPLETE',450,398,28,'#ffe1a2');text(c,'Rose · Moon · Star',450,441,25,'#f3dfb5');d.glow(450,582,145,'#f2cc82');const a=d.art?.['study:'+id+':'+views[i]],b=d.art?.['study:'+id+':'+views[(i+1)%4]];if(a)d.sprite(a,450,582,{w:220,shadow:false,alpha:1-mix});if(b)d.sprite(b,450,582,{w:220,shadow:false,alpha:mix});if(!a&&!b)d.item(spriteKey(id),450,582,{w:220,shadow:false});text(c,'Sample chapter reward',450,731,23,'#ffe1a2');text(c,'No reward or pennies collected',450,773,21,'#eadac0');
}
const exampleBook=engine.navigationKey.replace(/\.selection$/,'');
function hasSavedFirst(){try{const raw=localStorage.getItem(exampleBook);return raw?!!JSON.parse(raw)?.chapters?.[0]:!!localStorage.getItem(exampleBook.replace('.v2:','.v1:'));}catch{return true;}}
export default withChapterExample(engine,{model:exampleModel,draw:drawExample,hideHouseClock:true,hasSavedFirst,steps:()=>[
 {caption:'First aim LEFT toward ROSE. Choose a soft 34 strength; too much speed bounces off a pocket rim.',point:{x:434,y:800},run:s=>{model.setAim(s,-8);model.setPower(s,34);},after:.6},
 {caption:'Flick the ball gently up-left to ROSE. The direction aims and the swipe length sets strength.',path:[{x:450,y:916},{x:442.2,y:860.5}],run:s=>model.shoot(s),done:s=>!s.motion,after:.55},
 {caption:'Now aim straight at MOON and use 44 strength: this pocket is farther up the cabinet.',point:{x:450,y:800},run:s=>{model.setAim(s,0);model.setPower(s,44);},after:.6},
 {caption:'Flick straight UP, a little farther for MOON. Wait for the real pocket catch.',path:[{x:450,y:916},{x:450,y:820}],run:s=>model.shoot(s),done:s=>!s.motion,after:.55},
 {caption:'Aim RIGHT for STAR and return to soft 34 strength. Three different pocket seals complete this round.',point:{x:466,y:800},run:s=>{model.setAim(s,8);model.setPower(s,34);},after:.6},
 {caption:'Flick gently up-right to STAR. The last real pocket catch completes the constellation.',path:[{x:450,y:916},{x:457.8,y:860.5}],run:s=>model.shoot(s),done:s=>s.demoRewardAge!==undefined,after:.3},
 {caption:'All three pocket seals are lit. Here is the sample reward; your own game starts with five fresh balls.',point:{x:450,y:582},run:()=>{},done:s=>s.demoRewardAge>=4.2,after:.2},
],finishCaption:'Your turn: aim and strength work together. Light ROSE, MOON and STAR in five balls. This sample collected nothing.'});
