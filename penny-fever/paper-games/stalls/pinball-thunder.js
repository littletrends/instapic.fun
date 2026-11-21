/** Pip's six illustrated pinball worlds. Local pennies and NFT previews only. */
import {kits,spriteKey,itemName} from '../prizes.js?v=nft-art-1';
import {paintChapterReward} from './study-kit.js?v=studies-six-1';
import {alleyPlay,isVerifiedPlay,owned,keep} from '../wallet.js?v=insights-1';
import {bindPrize,takePrize} from '../chapter-kit.js?v=align-1';
import {attachChapterExampleView} from './chapter-example.js?v=example-1';
import {R,FLIP,LANE,CUP,SHOOTER_GATE,GATE,SLINGS,POSTS,SPINNER,LEVELS,rules,railsFor,scoopFor,flowersFor,gateOpen,rampPoint,makeState,continueGo,canPull,cancel,pull,launch,nudge,tip,step,snapshot,restore} from './pinball-thunder-model.js?v=worlds-play-on-1';
const PRIZES=kits.pinball.prizes,VIEWS=['front','right','back','left'];
const CABINET={x:85,y:90,scale:.81};
const params=typeof location==='undefined'?new URLSearchParams():new URLSearchParams(location.search);
const review=typeof location!=='undefined'&&['localhost','127.0.0.1'].includes(location.hostname)&&params.get('review')==='thunderworks';
const player=/^[a-zA-Z0-9_-]{1,48}$/.test(params.get('reviewPlayer')||'')?params.get('reviewPlayer'):'local';
const BOOK='pf.review.pipThunderworks.v2:'+player,OLD='pf.review.pipThunderworks.v1:'+player;
const remembered=new Map(),collected=Array(6).fill(false),banked=Array(6).fill(0),paidRuns=Array(6).fill(0);let selected=0;
if(review){
 const raw=localStorage.getItem(BOOK),old=raw?null:localStorage.getItem(OLD);
 if(raw){const b=JSON.parse(raw);if(b.v!==2||!b.chapters||!Number.isInteger(b.selected)||!LEVELS[b.selected]||!Array.isArray(b.collected)||b.collected.length!==6||b.collected.some(x=>typeof x!=='boolean')||![b.banked,b.paidRuns].every(a=>Array.isArray(a)&&a.length===6&&a.every(x=>Number.isSafeInteger(x)&&x>=0)))throw Error('Saved pinball needs attention.');
  for(const [level,s] of Object.entries(b.chapters))remembered.set(Number(level),snapshot(restore(s,Number(level))));selected=b.selected;collected.splice(0,6,...b.collected);banked.splice(0,6,...b.banked);paidRuns.splice(0,6,...b.paidRuns);
 }else if(old){const b=JSON.parse(old);if(b.v!==1||typeof b.rewardCollected!=='boolean')throw Error('Saved pinball needs attention.');remembered.set(0,snapshot(restore(b.snapshot,0)));collected[0]=b.rewardCollected;}
}
const images=Object.fromEntries(PRIZES.flatMap(id=>VIEWS.map(v=>[`nft:${id}:${v}`,new URL(`../../assets/restyle/game-sprites/${spriteKey(id)}/${v}.webp`,import.meta.url).href])));
for(const id of PRIZES)images['study:'+id+':front']=images['nft:'+id+':front'];
const palettes=[
 {card:'#fff1dceF',ink:'#634733',edge:'#cb8269',rail:'#fff0c9',accent:'#8cae8b',dark:'#b86f58',font:'Georgia,serif'},
 {card:'#3f2a4dee',ink:'#ffe4bb',edge:'#d79b83',rail:'#e8bf91',accent:'#7b829a',dark:'#74536d',font:'Georgia,serif'},
 {card:'#fff1dbeF',ink:'#4a263f',edge:'#bc4e42',rail:'#fff0c5',accent:'#2b989b',dark:'#c85448',font:'Arial,sans-serif'},
 {card:'#fff0dceF',ink:'#71513d',edge:'#d49d87',rail:'#ffdfb7',accent:'#a3bb8d',dark:'#ce9381',font:'Arial,sans-serif'},
 {card:'#f6d5a2f5',ink:'#70432b',edge:'#a76540',rail:'#e8bb73',accent:'#8d9b77',dark:'#ba6c49',font:'Georgia,serif'},
 {card:'#fff1d8f5',ink:'#58335a',edge:'#ad6d8c',rail:'#f6dc96',accent:'#69bdba',dark:'#90598e',font:'Georgia,serif'},
];
const art=Array.from({length:6},()=>({started:false,board:null,pieces:[],error:false}));
function cutCell(image,index){
 const w=Math.floor(image.width/2),h=Math.floor(image.height/2),cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(image,(index%2)*w,Math.floor(index/2)*h,w,h,0,0,w,h);
 const pixels=c.getImageData(0,0,w,h).data,seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let largest=0,bounds=[0,0,w-1,h-1];
 for(let start=0;start<w*h;start++){if(seen[start]||pixels[start*4+3]<128)continue;let n=1,at=0,l=w,r=0,t=h,b=0;queue[0]=start;seen[start]=1;
  while(at<n){const p=queue[at++],x=p%w,y=Math.floor(p/w);l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);for(const q of [x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1])if(q>=0&&!seen[q]&&pixels[q*4+3]>=128){seen[q]=1;queue[n++]=q;}}
  if(n>largest){largest=n;bounds=[l,t,r,b];}
 }
 const [l,t,r,b]=bounds,out=document.createElement('canvas');out.width=r-l+1;out.height=b-t+1;out.getContext('2d').drawImage(cv,l,t,out.width,out.height,0,0,out.width,out.height);return out;
}
function loadArt(level){const a=art[level];if(a.started||typeof Image==='undefined')return;a.started=true;const root=new URL('../assets/pip-six-worlds/',import.meta.url);
 const board=new Image();board.onload=()=>{a.board=board;};board.onerror=()=>{a.error=true;};board.src=new URL(LEVELS[level].id+'-board.png',root).href;
 const pieces=new Image();pieces.onload=()=>{a.pieces=[0,1,2,3].map(i=>cutCell(pieces,i));};pieces.onerror=()=>{a.error=true;};pieces.src=new URL(LEVELS[level].id+'-pieces.png',root).href;
}
function productionPlay(){const verified=isVerifiedPlay();if(alleyPlay&&!verified)throw Error('Verified play is required.');return verified;}
function replayState(s,production){if(production&&owned(PRIZES[s.level])){bindPrize(s,PRIZES[s.level]);s.prizeKept=true;s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;}return s;}
function persist(s){const production=productionPlay();if(!s||production)return;remembered.set(s.level,snapshot(s));selected=s.level;if(review){try{localStorage.setItem(BOOK,JSON.stringify({v:2,selected,chapters:Object.fromEntries(remembered),collected,banked,paidRuns}));s.saveError=false;}catch(e){cancel(s);s.saveError=true;s.note='Preview saving paused. Keep this window open.';throw e;}}}
function checkpoint(s){try{persist(s);return true;}catch{return false;}}
function bankPennies(s,production=false){if(!s.roundWon||(!production&&s.run<paidRuns[s.level])||!s.pendingPennies)return false;const amount=s.pendingPennies;s.paidPennies+=amount;s.pendingPennies=0;if(!production){banked[s.level]+=amount;paidRuns[s.level]=s.run;}return true;}
function panel(c,p,x,y,w,h,fill=p.card){c.save();c.shadowColor='#49301f25';c.shadowBlur=5;c.shadowOffsetY=3;c.beginPath();c.roundRect(x-w/2,y-h/2,w,h,14);c.fillStyle=fill;c.fill();c.shadowColor='transparent';c.strokeStyle=p.edge;c.lineWidth=2;c.stroke();c.restore();}
function text(c,p,str,x,y,size=22,colour=p.ink){c.font=`600 ${Math.max(size,12*900/((c.canvas.clientWidth||450)*CABINET.scale))}px ${p.font}`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=colour;c.fillText(str,x,y,Math.max(90,Math.min(850,2*Math.min(x,900-x)-24)));}
function rail(d,p,a,b,width=12){d.line({x:a.x+2,y:a.y+5},{x:b.x+2,y:b.y+5},'#46321f3a',width+5);d.line(a,b,p.dark,width+2);d.line(a,b,p.rail,width);d.line({x:a.x-1,y:a.y-2},{x:b.x-1,y:b.y-2},'#fff5dcbb',2);}
function coin(d,x,y,scale=1,alpha=1){const c=d.c;c.save();c.globalAlpha=alpha;d.circle(x,y,12*scale,'#bd7845','#ffe1a4',2);d.circle(x,y,8*scale,null,'#edbd76',1);c.font=`700 ${14*scale}px Georgia`;c.textAlign='center';c.textBaseline='middle';c.fillStyle='#ffe1a4';c.fillText('1',x,y+1);c.restore();}
function ball(s,d){if(['drain','result'].includes(s.mode))return;for(let i=0;i<s.trail.length;i++){const p=s.trail[i];d.circle(p.x,p.y,2+i/4,`rgba(255,246,219,${i/35})`);}d.ellipse(s.ball.x+3,s.ball.y+7,R+1,7,'#342b3c66');d.ball(s.ball.x,s.ball.y,R,'#dce6e8');}
function toys(s,d,p){
 if(s.layoutVersion<3)return;const c=d.c,cup=scoopFor(s),holding=s.mode==='hold';
 d.ellipse(cup.x+3,cup.y+7,35,23,'#44302e44');d.circle(cup.x,cup.y,31,p.dark,p.rail,3);d.circle(cup.x,cup.y,24,'#3c2b3b',p.edge,3);
 if(holding){d.glow(cup.x,cup.y,62,'#ffe2a3');d.arc(cup.x,cup.y,36,-Math.PI/2,-Math.PI/2+Math.PI*2*s.hold.left/.85,p.rail,4);}else d.star(cup.x,cup.y,12,p.accent);
 panel(c,p,cup.x,cup.y+45,108,29);text(c,p,holding?'HOLD…':s.scoopArmed?'CATCH':'WAIT',cup.x,cup.y+45,17);
 const spin=SPINNER,h=Math.max(2,18*Math.abs(Math.cos(s.spinnerAngle)));
 if(Math.abs(s.spinnerSpeed)>4)d.glow(spin.x,spin.y,51,'#ffe4a8');
 d.line({x:spin.x-46,y:spin.y},{x:spin.x+46,y:spin.y},p.dark,5);for(const dx of [-46,46])d.circle(spin.x+dx,spin.y,6,p.rail,p.edge,2);
 d.poly([[spin.x-33,spin.y-h],[spin.x+33,spin.y-h],[spin.x+33,spin.y+h],[spin.x-33,spin.y+h]],Math.cos(s.spinnerAngle)>=0?p.accent:p.dark,p.rail,3);d.star(spin.x,spin.y,Math.min(11,h*.7),p.rail);
 panel(c,p,spin.x,spin.y+35,108,29);text(c,p,'SPIN',spin.x,spin.y+35,17);
 for(const [x,side] of [[180,-1],[697,1]]){const lit=s.kickbackReady||(s.kickFlash>0&&s.kickSide===side);if(lit)d.glow(x,1021,32,'#ffe2a3');d.poly([[x-16,1038],[x-16,1025],[x-25,1025],[x,1000],[x+25,1025],[x+16,1025],[x+16,1038]],lit?p.accent:p.dark,p.rail,2);}
}
function ramp(s,d,p){if(s.layoutVersion===1)return;const points=Array.from({length:65},(_,i)=>rampPoint(s,i/64));
 d.path(points.map(a=>({x:a.x+6,y:a.y+13})),'#30262636',65);d.path(points,p.dark,58);d.path(points,p.rail,53);d.path(points,p.accent,42);d.path(points,'#fff0c533',34);
 for(let i=2;i<13;i++){const u=i/14,a=rampPoint(s,u),b=rampPoint(s,u+.005),angle=Math.atan2(b.y-a.y,b.x-a.x);const c=d.c;c.save();c.translate(a.x,a.y);c.rotate(angle);d.poly([[-6,-8],[4,0],[-6,8],[0,0]],'#fff2ccbb',null);c.restore();}
 const mouth=rampPoint(s,0);d.ellipse(mouth.x,mouth.y,31,15,null,p.rail,5);panel(d.c,p,mouth.x,mouth.y+58,135,29);text(d.c,p,'RAMP ↑',mouth.x,mouth.y+58,18);
 if(s.rampFlash>0){d.glow(mouth.x,mouth.y,65,'#ffd998');}
}
function reward(s,d,p){const r=s.rewardReveal;if(!r||r.t>3.6)return;const c=d.c,t=r.t,u=Math.min(1,Math.max(0,(t-2.9)/.7)),e=u*u*(3-2*u),x=450+355*e,y=570-485*e,w=290-250*e;
 if(!u){panel(c,p,450,555,610,470);text(c,p,'NFT REWARD · COLLECTED',450,367,28);text(c,p,itemName(r.id),450,753,26);}
 d.glow(x,y,w*.7,'#ffe9b5');const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches,turn=reduced?0:Math.min(1,Math.max(0,(t-.3)/2.4))*4,i=Math.floor(turn)%4,j=(i+1)%4,mix=turn-Math.floor(turn),a=d.art?.[`nft:${r.id}:${VIEWS[i]}`],b=d.art?.[`nft:${r.id}:${VIEWS[j]}`];
 if(a){d.sprite(a,x,y,{w,shadow:false,alpha:1-mix});if(b&&mix)d.sprite(b,x,y,{w,shadow:false,alpha:mix});}else d.item(spriteKey(r.id),x,y,{w,shadow:false});
}
function drawTable(s,d,_t,input){
 loadArt(s.level);const a=art[s.level],sky=rules(s),p=palettes[s.level],c=d.c;
 if(a.board)c.drawImage(a.board,0,0,900,1200);else{c.fillStyle=p.rail;c.fillRect(0,0,900,1200);text(c,p,a.error?'Artwork could not load.':'Loading your pinball world…',450,500,26);}
 const head={...p,ink:s.level===1?'#674457':p.ink};text(c,head,LEVELS[s.level].name,450,110,30);text(c,head,`${String(s.score).padStart(6,'0')}  ·  BALL ${Math.min(3,Math.max(1,s.ballNumber))}/3`,450,145,22);
 panel(c,p,450,214,626,42);text(c,p,s.roundWon?(isVerifiedPlay()?'COLLECTED · KEEP PLAYING':`COLLECTED · KEEP PLAYING · ${s.paidPennies+s.pendingPennies} PENNIES`):s.finishFlash>0?(s.cupOpen?'WAIT FOR THE FINISH GATE':'FINISH CLOSED · TARGETS FIRST'):`${sky.hits} HIT${sky.hits>1?'S':''} EACH · ${sky.ramps?s.rampCount+'/'+sky.ramps+' RAMPS':'RAMP BONUS'}${isVerifiedPlay()?'':` · ${s.pendingPennies} PENNIES`}`,450,214,21);
 for(const r of railsFor(s))rail(d,p,r.a,r.b);
 if(s.layoutVersion>=3){c.save();c.globalAlpha=s.shooterReleased?1:.3;rail(d,p,SHOOTER_GATE.a,SHOOTER_GATE.b,5);c.restore();}else rail(d,p,GATE.a,GATE.b,5);
 for(let i=0;i<3;i++){const x=255+i*185;d.ellipse(x,306,18,8,s.rolls[i]?'#f4cf7f99':'#75554022',p.dark,2);}
 const open=s.roundWon||s.cupOpen&&gateOpen(s);if(open)d.glow(CUP.x,CUP.y,65,'#ffe9aa');d.circle(CUP.x,CUP.y,sky.cup+8,p.rail,p.dark,3);d.circle(CUP.x,CUP.y,sky.cup,s.roundWon?p.accent:'#39283a',p.edge,2);
 if(!open){for(const dx of [-15,0,15])d.line({x:CUP.x+dx,y:CUP.y-21},{x:CUP.x+dx,y:CUP.y+21},p.rail,5);}else d.star(CUP.x,CUP.y,17,'#ffe5aa');
 panel(c,p,CUP.x,287,180,30);text(c,p,s.roundWon?'COLLECTED':s.cupOpen?(open?'FINISH OPEN':'WAIT FOR OPEN'):'TARGETS FIRST',CUP.x,287,16);
 for(const post of POSTS){d.circle(post.x+3,post.y+4,post.r+3,'#46341e33');d.circle(post.x,post.y,post.r,p.rail,p.dark,2);}
 const flowers=flowersFor(s);
 for(let i=0;i<3;i++){const b=flowers[i],state=s.flowers[i],pulse=state.flash/.25;if(state.lit||pulse)d.glow(b.x,b.y,65+pulse*8,'#ffe1a0');d.ellipse(b.x,b.y+31,b.r+7,14,'#3b2b3738');
  const im=a.pieces[state.lit?1:0],size=(b.r*2+12)*(1+pulse*.09);if(im)d.sprite(im,b.x,b.y,{w:size,h:size,shadow:false,angle:s.level===2?state.hits*.12:0});else d.circle(b.x,b.y,b.r,p.accent,p.dark,4);
  panel(c,p,b.x,b.y+b.r+27,97,30);text(c,p,`${state.hits}/${sky.hits}`,b.x,b.y+b.r+27,19);
 }
 for(let i=0;i<2;i++){const sl=SLINGS[i];d.poly([sl.a,sl.b,sl.c],s.slingCool[i]>0?p.rail:p.accent,p.dark,4);d.line({x:sl.a.x+(i?-5:5),y:sl.a.y+24},{x:sl.b.x+(i?6:-6),y:sl.b.y-12},p.rail,3);}
 toys(s,d,p);
 for(const f of s.flippers){const end=tip(f);d.line({x:f.x+3,y:f.y+6},{x:end.x+3,y:end.y+6},'#412b3a55',41);const im=a.pieces[2];
  if(im)d.sprite(im,(f.x+end.x)/2,(f.y+end.y)/2,{w:FLIP+36,h:48,angle:f.a,shadow:false});else{d.line(f,end,p.rail,35);d.line(f,end,p.dark,24);}d.circle(f.x,f.y,7,p.edge,p.rail,2);
 }
 const sy=LANE.y+s.charge*LANE.pull;d.line({x:LANE.x,y:sy+15},{x:LANE.x,y:1090},'#88868c',4);for(let i=0;i<8;i++){const y=sy+23+i*(1079-sy-23)/8;d.line({x:LANE.x-12,y},{x:LANE.x+12,y:y+3},p.rail,3);}
 if(a.pieces[3])d.sprite(a.pieces[3],LANE.x,sy+32,{w:40,h:40,shadow:false});else d.circle(LANE.x,sy+32,20,p.dark,p.rail,3);
 if(s.mode!=='ramp')ball(s,d);ramp(s,d,p);if(s.mode==='ramp'){ball(s,d);d.glow(s.ball.x,s.ball.y,22,'#fff4c4');}
 if(!isVerifiedPlay())for(const f of s.pennyFlights){const u=Math.max(0,Math.min(1,(f.age-f.delay)/.9)),e=u*u*(3-2*u);coin(d,f.x+(680-f.x)*e,f.y+(214-f.y)*e-Math.sin(u*Math.PI)*70,1,.9);}
 for(const spark of s.sparks){const u=spark.age/.65;for(let i=0;i<8;i++){const t=i*Math.PI/4;d.star(spark.x+Math.cos(t)*u*50,spark.y+Math.sin(t)*u*50,4*(1-u),'#ffe2aa');}}
 if(s.mode==='lane'){panel(c,p,447,845,345,80);text(c,p,s.charging?'RELEASE TO LAUNCH':'PULL THE SPRING',447,829,25);text(c,p,s.activeBall?'Same ball · vary your pull':`${s.ballsLeft} balls ready · go ${s.go}`,447,862,19);
  if(s.charging){panel(c,p,447,905,235,12);c.fillStyle=p.dark;c.fillRect(331,901,232*s.charge,8);}
 }else if(s.mode==='drain'){panel(c,p,447,830,330,80);text(c,p,'BALL DRAINED',447,814,26);text(c,p,s.ballsLeft?`${s.ballsLeft} left · targets stay`:'Three fresh balls on Play again',447,848,19);}
 panel(c,p,450,1154,694,65);text(c,p,'LEFT · Z',230,1154,21);text(c,p,'NUDGE · N',450,1154,20);text(c,p,'RIGHT · X',672,1154,21);
 paintChapterReward(s,d);reward(s,d,p);if(s.saveError){panel(c,p,450,600,700,150);text(c,p,'Preview saving paused. Keep this window open.',450,600,24);}
}
function draw(s,d,...args){
 const c=d.c,{x,y,scale}=CABINET,w=900*scale,h=1200*scale;
 c.save();c.shadowColor='#19132666';c.shadowBlur=16;c.shadowOffsetY=9;c.fillStyle='#b99056';c.beginPath();c.roundRect(x-3,y-3,w+6,h+6,18);c.fill();c.shadowColor='transparent';c.beginPath();c.roundRect(x,y,w,h,16);c.clip();c.translate(x,y);c.scale(scale,scale);drawTable(s,d,...args);c.restore();
}
const engine={
 title:'Pip’s Pinball Worlds',chapterEnds:true,houseSeconds:0,levels:LEVELS.map(x=>x.name),prizes:PRIZES,sprites:PRIZES,images,
 intro:'Six handmade pinball worlds. Pull the spring, wake the bumpers, ride the raised ramp and make the finish pocket.',
 instructions:'Drag the right spring down, then release; or hold/release Space. Enter gives a medium launch. Z/left arrow and X/right arrow work independent flippers; touch the two sides with two fingers too. Time a fresh stroke as the ball arrives. N or the centre apron gives a gentle nudge, with a two-second cooldown. A one-way gate keeps a launched ball out of the starting chute. CATCH cups hold the ball briefly, then kick it across the table. Shoot through the SPIN flag to set it whirling for bonus points. The lit outlane arrows provide one automatic kickback save per ball. Triangular slingshots punch the ball back across the table. Each chapter shows the hits needed on EACH bumper and its ramp target. Shoot UP into the raised ramp mouth; the ball rides above the playfield and exits at the top. Chapter1 needs one hit on each bumper, Chapter2 adds a ramp ride, Chapters3–4 require two hits on each and more ramps. The last two chapters have a moving pocket gate: finish while it is open. Chapter6 needs three hits per bumper and three ramps. Complete the targets, then physically land in the top pocket. Collecting the reward does not end the game: after its animation the same ball kicks back out and you can play all three balls, or leave whenever you like with the reward saved. The round ends only when all three balls drain. Three balls per go; Play again after a loss retains your chapter targets and pending pennies. A completed chapter replays as a fresh table. A ball returning to the shooter can relaunch without spending another ball. No countdown. Pennies are temporary local test drips, banked when the finish pocket is made; any remaining test pennies can be earned and banked while you play on, within the same run allowance. They are not real purse funds. Each chapter has one NFT preview, once only. Help pauses and every chapter saves separately.',
 navigationKey:BOOK+'.selection',selectedChapter:()=>selected,clockRuns:()=>false,artReady:level=>!!art[level].board&&art[level].pieces.length===4,
 reviewCopy:{keys:'Drag/release spring · Space pulls · Enter launch · Z/← and X/→ flippers · N nudge · H help.',cost:'Free preview · three balls.',treasure:(s,level)=>`Chapter NFT preview: ${itemName(PRIZES[level])} · ${collected[level]||s?.prizeKept?'Collected':'Locked'} · ${banked[level]} test pennies banked.`},
 create(level){const production=productionPlay();if(!LEVELS[level])throw Error('Choose a chapter from 1 to 6.');selected=level;loadArt(level);const s=!production&&remembered.has(level)?restore(remembered.get(level),level):makeState(level);s.practice=!production;bindPrize(s,PRIZES[level],{...CUP,w:70,field:true});if(production?owned(PRIZES[level]):collected[level]){s.prizeKept=true;s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;}return s;},
 restoreState(blob){const restored=restore(blob,blob.level);return Object.assign(restored,blob);},
 persist,releaseInput:cancel,
 cancelAction(s,id){if(id==='plunge'){s.charging=false;s.charge=0;s.dragPlunge=false;for(const [key,role] of Object.entries(s.touches))if(role==='plunge')delete s.touches[key];if(s.mode==='lane')s.ball.y=LANE.y;}else if(id==='left'||id==='right')s[id]=false;},
 retryAttempt(s){const production=productionPlay();const next=s.roundWon?makeState(s.level,s.run+1):continueGo(s);next.practice=!production;checkpoint(next);return replayState(next,production);},
 key(s,k,down){if(s.saveError||s.result)return;if(k===' '){if(down)pull(s);else launch(s);}else if(k==='Enter'&&down&&canPull(s)){pull(s);s.charge=.62;launch(s);}else if((k==='n'||k==='N')&&down)nudge(s);else if(['z','Z','ArrowLeft'].includes(k))s.left=down;else if(['x','X','ArrowRight'].includes(k))s.right=down;checkpoint(s);},
 pointer(s,type,p){
  if(type==='down'&&(p.x<CABINET.x||p.x>CABINET.x+900*CABINET.scale||p.y<CABINET.y||p.y>CABINET.y+1200*CABINET.scale))return;
  p={...p,x:(p.x-CABINET.x)/CABINET.scale,y:(p.y-CABINET.y)/CABINET.scale};
  if(type==='cancel'){if(p.pointerId==null){cancel(s);return;}const role=s.touches[String(p.pointerId)];delete s.touches[String(p.pointerId)];if(role==='plunge')this.cancelAction(s,'plunge');s.left=Object.values(s.touches).includes('left');s.right=Object.values(s.touches).includes('right');return;}
  if(s.saveError||s.result)return;const id=String(p.pointerId??'primary');
  if(type==='down'){const role=s.mode==='live'&&p.y>1115&&p.x>360&&p.x<540?'nudge':canPull(s)&&p.x>741&&p.y>900?'plunge':p.x<450?'left':'right';s.touches[id]=role;if(role==='plunge'){pull(s);s.plungeY=p.y;s.dragPlunge=false;}if(role==='nudge')nudge(s);}
  const role=s.touches[id];if(type==='move'&&role==='plunge'&&canPull(s)&&Math.abs(p.y-s.plungeY)>5){s.dragPlunge=true;s.charge=Math.max(.03,Math.min(1,(p.y-s.plungeY)/120));s.ball.y=LANE.y+s.charge*LANE.pull;}
  if(type==='up'){delete s.touches[id];if(role==='plunge')launch(s);}s.left=Object.values(s.touches).includes('left');s.right=Object.values(s.touches).includes('right');checkpoint(s);
 },
 update(s,dt,input){const production=productionPlay();if(s.result||s.saveError)return;const mode=s.mode,hits=s.hits,score=s.score;step(s,dt,input);if((s.mode!==mode||s.hits!==hits||s.score!==score)&&!checkpoint(s))return;
  let changed=false;
  if(s.roundWon&&!s.completionRecorded){s.completionRecorded=true;changed=true;
   if(!(production?s.prizeKept:collected[s.level])){if(production)keep(PRIZES[s.level],'pinball');else collected[s.level]=true;takePrize(s,PRIZES[s.level],CUP);s.chapterPrize.phase='gone';s.chapterPrize.alpha=0;s.rewardReveal={id:PRIZES[s.level],t:0};}
   else if(s.mode==='celebrate')s.celebrateLeft=Math.min(s.celebrateLeft,.5);
  }
  if(bankPennies(s,production))changed=true;
  if(s.rewardReveal&&s.mode==='celebrate')s.rewardReveal.t+=dt;
  if(s.result&&s.roundWon){s.result.title=LEVELS[s.level].name+' · three balls played';s.result.detail=`${s.score} points · ${s.paidPennies} test pennies banked. NFT preview: Collected.`;changed=true;}
  if(changed)checkpoint(s);
 },draw,readout:s=>s.note,
};

// Watch sample: a disposable chapter-1 table with a scripted spring and flippers.
// It never touches the guest's round, purse, pennies or rewards (see chapter-example.js).
const onCabinet=(x,y)=>({x:CABINET.x+x*CABINET.scale,y:CABINET.y+y*CABINET.scale});
const sampleFlip=s=>{const b=s.ball,low=s.mode==='live'&&b.y>850&&b.y<1010&&b.vy>-60;s.left=low&&b.x<450;s.right=low&&b.x>=450;};
attachChapterExampleView(engine,{model:{makeState:level=>makeState(level),step:(s,dt)=>step(s,dt)},draw,captionY:1062,steps:()=>[
 {caption:'Drag the spring down, then let go. A longer pull launches the ball harder.',path:[onCabinet(780,960),onCabinet(780,1030)],gesture:.9,
  start:s=>{s.touches.sample='plunge';pull(s);},move:(s,p,u)=>{s.dragPlunge=true;s.charge=Math.max(.03,.8*u);s.ball.y=LANE.y+s.charge*LANE.pull;},run:s=>{delete s.touches.sample;launch(s);},done:s=>s.mode!=='lane',after:.2},
 {caption:'Flip as the ball reaches a flipper: left side Z, right side X. Light every flower bumper.',point:s=>s.ball.x<450?onCabinet(330,1000):onCabinet(570,1000),gesture:7,
  move:s=>sampleFlip(s),run:s=>{s.left=false;s.right=false;},done:()=>true,after:.2},
],finishCaption:'Your turn: three balls. Light every flower, then shoot the top pocket for the chapter reward.'});
export default engine;
