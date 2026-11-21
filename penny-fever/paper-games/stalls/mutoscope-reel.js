import * as model from './mutoscope-reel-model.js?v=reel-six-1';
import {study,paper,text,button,compactHeader as header,compactFooter as footer,paintChapterReward} from './study-kit.js?v=studies-six-1';
import {ease} from './study-state.js?v=studies-six-1';
import {withChapterExample} from './chapter-example.js?v=example-1';
const ROOT=new URL('../assets/milo-reel/',import.meta.url),art={};let started=false;
function loadArt(){if(started||typeof Image==='undefined')return;started=true;for(const name of ['fox','burrow','fern','viewer']){const img=new Image();img.onload=()=>{const cv=document.createElement('canvas');cv.width=img.width;cv.height=img.height;const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0);const d=c.getImageData(0,0,cv.width,cv.height),p=d.data,w=cv.width,h=cv.height,seen=new Uint8Array(w*h),queue=[];const add=n=>{if(n<0||n>=w*h||seen[n])return;seen[n]=1;const j=n*4;if(p[j]<120&&p[j+1]>150&&p[j+2]>150&&p[j+1]-p[j]>65&&p[j+2]-p[j]>65)queue.push(n);};for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}if(name==='viewer')add((h>>1)*w+(w>>1));for(let i=0;i<queue.length;i++){const n=queue[i];p[n*4+3]=0;if(n%w)add(n-1);if(n%w<w-1)add(n+1);add(n-w);add(n+w);}c.putImageData(d,0,0);art[name]=cv;};img.src=new URL(name+'.png',ROOT).href;}}
function sprite(d,name,x,y,w,opts={}){if(art[name])d.sprite(art[name],x,y,{w,shadow:false,...opts});}
function clipIcon(c,cmd,x,y,size=22){c.save();c.strokeStyle='#72533c';c.fillStyle='#72533c';c.lineWidth=3;
 if(cmd==='step'){for(const [a,b] of [[-9,4],[9,-4]]){c.beginPath();c.ellipse(x+a,y+b,5,11,-.25,0,Math.PI*2);c.fill();}text(c,'1',x+29,y,17,'#72533c');}
 if(cmd==='hop'){c.beginPath();c.moveTo(x-23,y+9);c.quadraticCurveTo(x,y-32,x+23,y+9);c.stroke();c.beginPath();c.moveTo(x+13,y+8);c.lineTo(x+23,y+9);c.lineTo(x+22,y-2);c.stroke();text(c,'2',x,y+11,17,'#72533c');}
 if(cmd==='wait'){c.beginPath();c.arc(x,y,18,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(x,y-11);c.lineTo(x,y);c.lineTo(x+9,y+4);c.stroke();}
 if(cmd==='turn'){c.beginPath();c.arc(x,y,17,.3,Math.PI*1.9);c.stroke();c.beginPath();c.moveTo(x+9,y-19);c.lineTo(x+17,y-5);c.lineTo(x+3,y-9);c.stroke();}c.restore();}
function card(d,s,id,x,y,opts={}){const c=d.c,cmd=model.rules(s).cards[id],info=model.COMMANDS[cmd];c.save();c.globalAlpha=opts.alpha??1;paper(c,x,y,88,84,info.colour,opts.selected?'#95672e':'#fff0d1',12);clipIcon(c,cmd,x,y-12);text(c,info.name,x,y+25,21,'#604731');if(opts.tray){paper(c,x-31,y-31,24,23,'#654c3a','#f2d7aa',5);text(c,id+1,x-31,y-31,16,'#fff0d2');}c.restore();}
function platforms(s,d){const c=d.c,r=model.rules(s),spacing=520/r.max,w=Math.min(94,spacing*.77);for(let cell=0;cell<=r.max;cell++){const x=model.cellX(s,cell),bridge=!!r.bridges?.[cell],solid=r.ground.includes(cell);if(!solid&&!bridge){c.save();c.setLineDash([4,5]);d.line({x:x-w*.45,y:model.GROUND},{x:x+w*.45,y:model.GROUND},'#7d8f7a88',2);c.restore();text(c,cell,x,641,18,'#7c8977');continue;}const open=bridge?model.bridgePose(s,cell):1,y=model.GROUND+(1-open)*54;if(bridge){d.line({x:x-w*.38,y:model.GROUND},{x:x-w*.38,y:y+20},'#af965f',2);d.line({x:x+w*.38,y:model.GROUND},{x:x+w*.38,y:y+20},'#af965f',2);if(open<.5)text(c,cell,x,641,18,'#797f6c');}
  c.save();c.globalAlpha=bridge ? .58+open*.42 : 1;paper(c,x,y+18,w,36,bridge?'#ba9a61':'#897254','#e8d3a5',5);d.line({x:x-w/2+3,y:y+2},{x:x+w/2-3,y:y+2},bridge?'#f7d891':'#e7d9b5',4);text(c,cell,x,y+19,18,'#fff0c9');c.restore();}}
function scene(s,d){const c=d.c,r=model.rules(s);c.save();c.beginPath();c.roundRect(146,309,608,346,8);c.clip();sprite(d,'fern',244,558,112,{alpha:.78});sprite(d,'fern',615,560,130,{alpha:.7,flip:true});
 const goalX=model.cellX(s,r.goal),homeClosed=!model.allMarks(s);sprite(d,'burrow',goalX,565,r.max>4?82:96);if(homeClosed)paper(c,goalX,589,43,35,'#7b654b','#bc9a60',5);else{d.glow(goalX+21,553,22,'#f2d18c');paper(c,goalX+21,553,9,15,'#f7dca1','#a67a44',2);}paper(c,goalX,514,88,29,'#fff0d7','#a58150',7);text(c,homeClosed?'HOME':'EXIT',goalX,514,17,'#624934');
 if(r.flag!==undefined){const x=model.cellX(s,r.flag),taken=s.visits[Math.min(s.playback?.loop||0,r.loops-1)];d.line({x,y:505},{x,y:583},'#8e704b',4);d.poly([[x,505],[x+40,514],[x,537]],taken?'#d5b875':'#c17b83','#f5d8ad',2);text(c,s.visits.filter(Boolean).length+'/'+r.loops,x+20,488,19,'#5c6149');}
 platforms(s,d);for(const f of s.footprints.slice(-7))d.ellipse(model.cellX(s,f.cell),model.GROUND-1,4,2,'#f9edd78c');
 const actor=s.actor,turn=s.motion?.kind==='clip'&&s.motion.cmd==='turn',u=turn?s.motion.t/s.motion.duration:0,w=(r.max>4?70:82)*(turn ? .18+.82*Math.abs(Math.cos(u*Math.PI)) : 1);d.ellipse(actor.x,model.GROUND+1,22,5,'#283b313c');sprite(d,'fox',actor.x,actor.y-(r.max>4?70:82)/2,w,{h:r.max>4?70:82,flip:actor.dir<0,angle:actor.angle,alpha:actor.alpha});c.restore();
 for(const x of [132,768])for(let y=313;y<650;y+=39){c.fillStyle='#e2cda7';c.beginPath();c.roundRect(x-5,y,11,20,3);c.fill();}
 const beat=model.stageBeat(s),take=Math.min(r.loops,(s.playback?.loop||0)+1);paper(c,450,291,580,38,'#fff1dceF','#b9945c',9);text(c,'BEAT '+Math.floor(beat+.00001)+' · TAKE '+take+' / '+r.loops,450,291,21,'#685039');}
function draw(s,d){loadArt();const c=d.c,r=model.rules(s);header(c,'MILO’S FLICKER REEL',(s.level+1)+' · '+r.name);paper(c,450,218,600,40,'#fff0d9a6','#b997625c',9);text(c,s.program.filter(id=>id!==null).length+' / '+r.cards.length+' frames spliced · '+(r.loops===1?'one take':'film runs twice'),450,218,23,'#6a4e38');scene(s,d);
 sprite(d,'viewer',171,729,83);paper(c,465,726,490,42,'#fff0d9a6','#b997625c',9);text(c,'Splice clips · How to play for the guide',465,726,21,'#6b523c');
 c.save();c.translate(736,730);c.rotate(s.playback?model.stageBeat(s)*.8:s.t*.28);d.circle(0,0,31,'#a88650','#f5db9e',3);for(let i=0;i<6;i++){const a=i*Math.PI/3;d.circle(Math.cos(a)*18,Math.sin(a)*18,7,'#5c4936','#d6bb83',1);}d.circle(0,0,4,'#e9d3a0');c.restore();
 const n=r.cards.length,stripW=n*100+22;paper(c,450,815,stripW,109,'#4b3d34','#c9aa73',15);for(let i=0;i<n;i++){const p=model.framePoint(s,i);for(const y of [769,854]){c.fillStyle='#d4bf96';c.beginPath();c.roundRect(p.x-22,y,44,9,3);c.fill();}const id=s.program[i],moving=s.motion?.kind==='edit'&&s.motion.cards.some(a=>a.id===id),active=s.playback&&s.playback.index===i&&s.motion?.kind!=='rewind';if(active)d.glow(p.x,p.y,48,'#efd196');if(id===null){paper(c,p.x,p.y,88,84,'#dfd3b75c',s.cursor===i?'#fff0bf':'#ad9270',10);text(c,i+1,p.x,p.y,25,'#e8d5b0');}else if(!moving)card(d,s,id,p.x,p.y,{selected:s.selected===i});if(s.failed?.frame===i&&!s.failed.partial){c.save();c.strokeStyle='#b46168';c.lineWidth=5;c.beginPath();c.roundRect(p.x-44,p.y-42,88,84,11);c.stroke();c.restore();}if(s.cursor===i)d.line({x:p.x-14,y:873},{x:p.x+14,y:873},'#f7d99d',3);}
 text(c,'FILM ×'+r.loops,450,887,19,'#6b5038');
 for(let id=0;id<n;id++){const p=model.trayPoint(s,id),used=s.program.includes(id);if(used){paper(c,p.x,p.y,88,84,'#d9c9a94a','#b29a75',12);text(c,'IN FILM',p.x,p.y,17,'#786345');}else card(d,s,id,p.x,p.y,{tray:true});}
 if(s.motion?.kind==='edit'){const m=s.motion,u=ease(m.t/m.duration);for(const a of m.cards)card(d,s,a.id,a.from.x+(a.to.x-a.from.x)*u,a.from.y+(a.to.y-a.from.y)*u-Math.sin(u*Math.PI)*20);}
 button(c,'↶ UNDO',150,1031,110);if(model.canPlay(s))button(c,model.filled(s)?'RUN REEL':'TEST CUT',562,1031,350);else{paper(c,562,1031,350,58,'#5c6250','#aab297',12);text(c,s.phase==='moving'?(s.motion?.kind==='edit'?'SPLICING':s.motion?.kind==='rewind'||s.motion?.kind==='miss'?'REWINDING':'REEL RUNNING'):'ADD A CLIP',562,1031,23,'#e5e0c8');}footer(c,s);paintChapterReward(s,d);
}
const engine=study({id:'mutoscope',mode:'reel-play',title:'Milo’s Flicker Reel',model,draw,
 intro:'Splice a little film, wind the reel and watch a paper fox perform it. The last scene belongs at the lantern house.',
 instructions:'Tap a tray clip to add it to the first empty film frame. STEP moves one stage mark; HOP leaps two, crossing one dark gap; WAIT spends a beat; TURN faces the other way and also spends a beat. Tap one filled frame, then another, to swap their clips. Tap a selected frame again to lift its clip back to the tray. Test cut plays any filled opening; Run reel plays the whole film. Every take starts at beat0. A clip advances one scene beat. Moving bridges must be UP on the landing beat printed in the rule card; dark gaps have no landing. Later chapters repeat the SAME short film twice, continue from the fox’s position/facing, and may require the stage flag on each take. The final lantern needs every frame and every required take, flag and facing. Wrong takes visibly rewind without changing your edit. Undo rewinds an edit or a playback attempt. Only entering the lantern after the full correct film completes the chapter. Pennies and rewards are local previews.',
 keys:'1–6 add clip · Left/Right choose frame · Enter select/swap · Backspace lift · Space play · U undo',
 tap(s,p){if(p.y>995&&p.y<1065&&p.x>365){if(model.canPlay(s))model.play(s);return;}const n=model.rules(s).cards.length;if(p.y>765&&p.y<869){for(let i=0;i<n;i++)if(Math.abs(p.x-model.framePoint(s,i).x)<47){model.pickFrame(s,i);return;}}if(p.y>895&&p.y<989){for(let id=0;id<n;id++)if(Math.abs(p.x-model.trayPoint(s,id).x)<47){model.add(s,id);return;}}},
 key(s,k){if(/^[1-6]$/.test(k))model.add(s,Number(k)-1);else if(k===' ')model.play(s);else if(k==='Enter')model.pickFrame(s,s.cursor);else if(k==='ArrowLeft')model.moveCursor(s,-1);else if(k==='ArrowRight')model.moveCursor(s,1);else if(k==='Backspace')model.remove(s,s.cursor);},
});
const ready=engine.artReady;engine.artReady=()=>ready()&&Object.keys(art).length===4;
const create=engine.create;engine.create=level=>{loadArt();return create(level);};
const update=engine.update;engine.update=(s,dt,...args)=>{const before=[s.motion?.kind,s.playback?.index,s.playback?.loop].join(':');update(s,dt,...args);if(s.phase==='moving'&&!s.saveError&&before!==[s.motion?.kind,s.playback?.index,s.playback?.loop].join(':'))try{engine.persist(s);}catch{}};
engine.instructions='Watch a complete tiny two-frame reel: STEP, then HOP across the gap into the lantern house and see the sample reward. Play Chapter 1 starts your own longer reel. '+engine.instructions;
const exampleModel={
 makeState:()=>model.makeSampleState(),
 step(s,dt){
  if(s.demoRewardAge!==undefined){s.demoRewardAge+=dt;return;}
  model.step(s,dt);
  if(s.phase==='celebrate'){s.phase='demo-finish';s.demoRewardAge=0;s.pendingPennies=0;s.note='The tiny reel is complete. Demonstration only.';}
 },
};
function drawExample(s,d){
 draw(s,d);if(s.demoRewardAge===undefined)return;
 const c=d.c,id=engine.prizes[0],t=s.demoRewardAge,views=['front','right','back','left'],turn=Math.max(0,t-.35)/3*4,i=Math.floor(turn)%4,mix=turn-Math.floor(turn);
 paper(c,450,540,580,440,'#fff1dff7','#b48c57',22);text(c,'DEMONSTRATION COMPLETE',450,363,29,'#644b38');text(c,'Two frames. One complete little film.',450,408,23,'#74573e');
 d.glow(450,545,140,'#eed39e');const a=d.art?.['study:'+id+':'+views[i]],b=d.art?.['study:'+id+':'+views[(i+1)%4]];
 if(a)d.sprite(a,450,545,{w:230,shadow:false,alpha:1-mix});if(b)d.sprite(b,450,545,{w:230,shadow:false,alpha:mix});
 text(c,'Sample chapter reward',450,680,24,'#74573e');text(c,'No reward or pennies collected',450,725,22,'#86694e');
}
export default withChapterExample(engine,{model:exampleModel,draw:drawExample,steps:()=>[
 {caption:'Make a tiny TWO-frame film. Tap STEP to move the fox from stage mark 0 to 1.',point:s=>model.trayPoint(s,0),run:s=>model.add(s,0),done:s=>!s.motion,after:.7},
 {caption:'Add HOP next. It leaps over the dark gap at 2 and lands at the lantern house on 3.',point:s=>model.trayPoint(s,1),run:s=>model.add(s,1),done:s=>!s.motion,after:.7},
 {caption:'Run the whole reel. The fox follows both clips, then enters the lantern house to finish.',point:{x:562,y:1031},run:s=>model.play(s),done:s=>s.demoRewardAge!==undefined,after:.2},
 {caption:'The entire short film is finished. This is the sample reward; your own reel has more frames.',point:{x:450,y:545},run:()=>{},done:s=>s.demoRewardAge>=4.2,after:.2},
],finishCaption:'Your turn: add clips, set their order, then Run reel. Reach the lantern house with the whole film. This sample collected nothing.'});
