import * as model from './water-gun-fleet-model.js?v=fleet-six-1';
import {study,paper,text,compactHeader as header,compactFooter as footer,paintChapterReward,button} from './study-kit.js?v=studies-six-1';
import {withChapterExample} from './chapter-example.js?v=example-1';
const sprites=[];let loading=false;
function loadArt(){if(loading||typeof Image==='undefined')return;loading=true;const image=new Image();image.onload=()=>{for(let i=0;i<6;i++){const w=Math.floor(image.width/3),h=Math.floor(image.height/2),cell=document.createElement('canvas');cell.width=w;cell.height=h;const c=cell.getContext('2d',{willReadFrequently:true});c.drawImage(image,(i%3)*w,Math.floor(i/3)*h,w,h,0,0,w,h);const bytes=c.getImageData(0,0,w,h).data;let left=w,top=h,right=0,bottom=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(bytes[(y*w+x)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}const out=document.createElement('canvas');out.width=right-left+3;out.height=bottom-top+3;out.getContext('2d').drawImage(cell,left-1,top-1,out.width,out.height,0,0,out.width,out.height);sprites[i]=out;}};image.src=new URL('../assets/marina-fleet/harbour-props.png',import.meta.url).href;}
const prop=(d,i,x,y,w,opts={})=>{if(sprites[i])d.sprite(sprites[i],x,y,{w,shadow:false,...opts});};
function waterPoint(jet,u){return {x:jet.from.x+(jet.to.x-jet.from.x)*u,y:jet.from.y+(jet.to.y-jet.from.y)*u-Math.sin(u*Math.PI)*Math.min(80,Math.hypot(jet.to.x-jet.from.x,jet.to.y-jet.from.y)*.13)};}
function draw(s,d){loadArt();const c=d.c,rules=model.rules(s),boat=s.boat,aim=s.gesture?.aim||s.aim;header(c,'MARINA’S WATER-GUN FLEET',(s.level+1)+' · '+rules.name);
 ;text(c,s.water+' water · '+Math.ceil(s.left)+'s · '+boat.bumps+' / 3 bumps',450,228,24,'#fff1d0');
 // The canal is drawn directly on the harbour water, with paper mooring ropes.
 for(const x of [model.CANAL.left,model.CANAL.right]){d.line({x,y:350},{x,y:895},'#725e46',6);d.line({x:x-1,y:350},{x:x-1,y:895},'#e7cf9a',2);for(let y=365;y<900;y+=88){d.circle(x,y,8,'#b08c50','#f2da9d',2);d.circle(x-2,y-2,2,'#fff0c1');}}
 prop(d,4,rules.dockX,model.DOCK_Y-20,430,{h:130});paper(c,rules.dockX,279,100,31,'#f2dfba','#b99258',8);text(c,'DOCK',rules.dockX,279,21,'#655341');
 for(let k=0;k<8;k++){const y=390+k*64,x=280+((k*73)%320),flow=model.current(s),a=Math.sin(s.t*.7+k)*3;d.line({x:x-9+flow.x*2,y:y+a},{x:x+9+flow.x*2,y:y+a+7},'#c9fff33b',2);}
 for(const buoy of rules.buoys){const bob=Math.sin(s.t*1.7+buoy.x)*2;d.ellipse(buoy.x,buoy.y+4,buoy.r+9,buoy.r*.6,'#1866764d');prop(d,3,buoy.x,buoy.y+bob,buoy.r*2);d.ellipse(buoy.x,buoy.y+buoy.r*.55,buoy.r+8,buoy.r*.35,null,'#d9fff14f',1.5);}
 for(const gate of rules.gates){const open=model.gateOpen(s,gate);c.save();c.setLineDash([6,10]);d.line({x:235,y:gate.y-18},{x:665,y:gate.y-18},'#eefbe3a8',2);c.restore();text(c,'CLEAR',185,gate.y-18,17,'#f7ebc9');prop(d,5,450,gate.y-(open?46:0),430,{h:90,alpha:open?.27:1});paper(c,719,gate.y,86,38,open?'#d8ecd0':'#ecd2c0',open?'#4e8b69':'#a96355',9);text(c,open?'OPEN':'WAIT',719,gate.y,20,open?'#34654e':'#874d47');const phase=(s.t+gate.phase)%gate.period,left=open?gate.open-phase:gate.period-phase;text(c,Math.ceil(left)+'s',719,gate.y+34,18,'#f1e6c6');}
 const drift=Math.hypot(boat.vx,boat.vy),wake=Math.min(1,drift/45);if(s.started){for(let i=0;i<3;i++){const spread=19+i*11,y=boat.y+38+i*15;d.arc(boat.x,y,spread,Math.PI*.12,Math.PI*.88,'#e4fff0'+Math.round((.25-i*.05)*wake*255).toString(16).padStart(2,'0'),2);}}
 d.ellipse(boat.x,boat.y+9,35,42,'#185b6342');prop(d,0,boat.x,boat.y,36,{h:84,angle:boat.heading});
 for(const wheel of model.wheels(s)){d.circle(wheel.x,wheel.y,23,null,'#fff1ac8f',1.5);prop(d,1,wheel.x,wheel.y,35,{angle:boat.wheelSpin*wheel.side});if(!s.started){d.glow(wheel.x,wheel.y,27,'#ffe39b');d.circle(wheel.x,wheel.y,24,null,'#fff1b1',2);}}
 for(const jet of s.jets){const u=Math.min(1,jet.age/jet.flight),p=waterPoint(jet,u),tail=waterPoint(jet,Math.max(0,u-.035));d.line(tail,p,'#f1fff2',4);d.glow(p.x,p.y,8,'#c6fff3');d.circle(p.x,p.y,3.2,'#c3f8f2','#fff9df',1);}
 for(const splash of s.splashes){const u=splash.age/.7,r=4+u*19,alpha=1-u;c.save();c.globalAlpha=alpha;d.circle(splash.x,splash.y,r,null,splash.hit?'#fff2b8':'#d2fbef',2);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;d.circle(splash.x+Math.cos(a)*r,splash.y+Math.sin(a)*r,2,splash.hit?'#ffe5a2':'#d2fbef');}c.restore();}
 const nozzle=model.muzzle(aim);c.save();c.setLineDash([4,10]);d.line(nozzle,aim,'#eefdf06b',1.5);c.restore();d.circle(aim.x,aim.y,13,null,'#fff1c5',2);d.line({x:aim.x-20,y:aim.y},{x:aim.x-8,y:aim.y},'#fff1c5',2);d.line({x:aim.x+8,y:aim.y},{x:aim.x+20,y:aim.y},'#fff1c5',2);d.line({x:aim.x,y:aim.y-20},{x:aim.x,y:aim.y-8},'#fff1c5',2);d.line({x:aim.x,y:aim.y+8},{x:aim.x,y:aim.y+20},'#fff1c5',2);
 paper(c,450,966,170,75,'#d8be8f','#ac854d',22);prop(d,2,model.GUN.x,model.GUN.y,34,{h:104,angle:Math.atan2(aim.x-model.GUN.x,model.GUN.y-aim.y)});
 button(c,'↶ UNDO',150,1031,110);model.PRESSURES.forEach((p,i)=>{const x=330+i*165;paper(c,x,1031,150,62,s.pressure===i?'#ffefc8':'#e7d9b9',s.pressure===i?'#a77e37':'#b99c67',11);text(c,p.name.toUpperCase(),x,1017,22,'#5e5541');text(c,p.cost+' water',x,1044,20,'#74664f');});
 footer(c,s);paintChapterReward(s,d);if(s.result&&!s.result.won){/* Shared chapter veil supplies the actual retry control. */}
}
const engine=study({id:'water-gun',mode:'fleet-play',title:'Marina’s Water-Gun Fleet',model,draw,
 intro:'A toy water gun, moving gold paddle wheels and a paper boat. Use short aimed bursts to steer it through Marina’s harbour and fully into its dock.',
 instructions:'Choose Soft, Steady or Strong pressure at the bottom; each burst spends the shown water. Tap a gold paddle wheel to send a burst, or press and drag your aim before releasing. The LEFT wheel pushes the boat right and forward; the RIGHT wheel pushes it left and forward. Alternate wheels to travel straight, and lead a moving wheel because the water takes time to fly. Splashes on empty water still spend the tank. The boat coasts after a hit. Later chapters add red buoys, cross-currents and timed sluices: approach slowly, watch OPEN, and get the stern beyond the white clear line before the gate shuts. Three hull bumps end the round. Empty tanks and the harbour bell can also end a run; Undo rewinds a committed burst. Only the full physical glide into the wooden dock completes a chapter. No actual purse or NFT is used in this local test.',
 keys:'Tap/drag aim and release burst · 1–3 pressure · arrows aim · Space burst',tap(){},key(s,k){if(/^[1-3]$/.test(k))model.setPressure(s,Number(k)-1);else if(k===' '||k==='Space')model.fire(s,s.aim);else if(k.startsWith('Arrow')){const dx=k==='ArrowLeft'?-15:k==='ArrowRight'?15:0,dy=k==='ArrowUp'?-15:k==='ArrowDown'?15:0;s.aim={x:Math.max(195,Math.min(705,s.aim.x+dx)),y:Math.max(280,Math.min(910,s.aim.y+dy))};}},
});
engine.reviewCopy.keys='Tap/drag aim · release burst · 1–3 pressure · arrows aim · Space fire · U undo';engine.reviewCopy.cost='Free local six-chapter test. Pennies and chapter rewards are previews.';
const baseReady=engine.artReady;engine.artReady=()=>baseReady()&&sprites.filter(Boolean).length===6;
engine.pointer=(s,type,p)=>{if(type==='cancel'){delete s.gesture;return;}if(s.saveError||s.result||s.phase!=='play')return;if(type==='down'){s.gesture={start:{x:p.x,y:p.y},aim:{x:p.x,y:p.y}};}if(type==='move'&&s.gesture)s.gesture.aim={x:p.x,y:p.y};if(type==='up'&&s.gesture){const gesture=s.gesture;delete s.gesture;const moved=Math.hypot(p.x-gesture.start.x,p.y-gesture.start.y);if(p.y>995&&p.y<1065&&moved<35){if(p.x<210)model.undo(s);else{const pressure=Math.round((p.x-330)/165);if(pressure>=0&&pressure<3)model.setPressure(s,pressure);}}else if(p.y>265&&p.y<910)model.fire(s,p);try{engine.persist(s);}catch{}}};
const baseRelease=engine.releaseInput;engine.releaseInput=s=>{delete s.gesture;baseRelease(s);};
engine.instructions='Watch the complete easy sample: the boat starts halfway up the water, four Strong pushes alternate paddle wheels, then it coasts fully into the dock and shows a sample reward. Your real chapter starts at its usual lower berth. '+engine.instructions;
function sampleBoat(){
 const s=model.makeState(0);s.demo=true;s.boat.x=450;s.boat.y=610;
 model.setPressure(s,2);s.aim={...model.wheels(s).find(w=>w.side===-1)};
 s.note='Easy sample: halfway up the harbour, with Strong pressure selected.';return s;
}
function sampleAim(s,side){
 const b=s.boat,wheel=model.wheels(s).find(w=>w.side===side);
 const flight=.18+Math.max(0,Math.hypot(wheel.x-model.GUN.x,wheel.y-model.GUN.y)-52)/1800+.035*3.5;
 return {x:wheel.x+b.vx*(1-Math.exp(-.8*flight))/.8,y:wheel.y+b.vy*(1-Math.exp(-.72*flight))/.72-2};
}
const sampleModel={
 makeState:sampleBoat,
 step(s,dt){
  if(s.demoRewardAge!==undefined){s.demoRewardAge+=dt;return;}
  model.step(s,dt);
  if(s.phase==='celebrate'){s.phase='demo-finish';s.pendingPennies=0;s.demoRewardAge=0;s.note='Fully docked. This easy sample collected nothing.';}
 },
};
function sampleDraw(s,d){
 draw(s,d);if(s.demoRewardAge===undefined)return;
 const c=d.c,id=engine.prizes[0],views=['front','right','back','left'],t=s.demoRewardAge,turn=Math.max(0,t-.35)/3*4,i=Math.floor(turn)%4,mix=turn-Math.floor(turn);
 paper(c,450,565,590,450,'#fff0e7f7','#b28a4d');text(c,'DEMONSTRATION COMPLETE',450,390,28);text(c,'The whole boat is safely docked',450,433,25);
 d.glow(450,570,140,'#f6cc8e');const a=d.art['study:'+id+':'+views[i]],b=d.art['study:'+id+':'+views[(i+1)%4]];
 if(a)d.sprite(a,450,565,{w:230,shadow:false,alpha:1-mix});if(b)d.sprite(b,450,565,{w:230,shadow:false,alpha:mix});
 text(c,'Sample chapter reward',450,709,25);text(c,'No reward or pennies collected',450,752,22);
}
function sampleSavedFirst(){
 try{const key=engine.navigationKey.replace(/\.selection$/,'');return !!JSON.parse(localStorage.getItem(key)||'null')?.chapters?.[0]||!!JSON.parse(localStorage.getItem(key.replace('.v2:','.v1:'))||'null')?.snapshot;}catch{return true;}
}
const marinaExample={
 model:sampleModel,draw:sampleDraw,captionY:170,hasSavedFirst:sampleSavedFirst,
 steps:()=>[
  {caption:'A short easy round: the boat starts in the MIDDLE of the water. STRONG pressure is already selected.',point:{x:660,y:1031},run:()=>{},after:.45},
  {caption:'Push the LEFT gold wheel with a Strong burst. Lead the wheel a little: water takes time to reach it.',point:s=>sampleAim(s,-1),run:s=>model.fire(s,sampleAim(s,-1)),done:s=>!s.burst&&!s.jets.length,after:.1},
  {caption:'Now push the RIGHT wheel. Alternating sides balances the boat while driving it forward.',point:s=>sampleAim(s,1),run:s=>model.fire(s,sampleAim(s,1)),done:s=>!s.burst&&!s.jets.length,after:.1},
  {caption:'One more Strong push on the LEFT. Watch the paddle spin and the boat keep coasting.',point:s=>sampleAim(s,-1),run:s=>model.fire(s,sampleAim(s,-1)),done:s=>!s.burst&&!s.jets.length,after:.1},
  {caption:'Finish with the RIGHT wheel. Four balanced pushes are enough for this short trip.',point:s=>sampleAim(s,1),run:s=>model.fire(s,sampleAim(s,1)),done:s=>!s.burst&&!s.jets.length,after:.1},
  {caption:'Stop spraying. Let the boat coast into the opening, then wait for the WHOLE hull to glide into its dock.',point:{x:450,y:335},run:()=>{},done:s=>s.demoRewardAge!==undefined,after:.3},
  {caption:'Safely docked! Here is the sample reward. Your own chapter starts farther down the harbour.',point:{x:450,y:565},run:()=>{},done:s=>s.demoRewardAge>=4.2,after:.2},
 ],
 finishCaption:'Your turn: alternate paddle wheels, lead the moving target and let the boat coast. Strong costs five water. This sample collected nothing.',
};
export default withChapterExample(engine,marinaExample);
