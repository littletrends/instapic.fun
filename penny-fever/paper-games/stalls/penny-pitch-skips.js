import * as model from './penny-pitch-skips-model.js?v=dish-six-1';
import {study,paper,text,button,header,footer,compactHeader,compactFooter,paintChapterReward} from './study-kit.js?v=studies-six-1';
import {drawLegacy,penny} from './penny-pitch-legacy-draw.js';
import {withChapterExample} from './chapter-example.js?v=example-1';
let tableImage=null,tableLoading=false;
function loadTable(){if(tableLoading||typeof Image==='undefined')return;tableLoading=true;const image=new Image();image.onload=()=>{tableImage=image;};image.src=new URL('../assets/penelope-parlour/table-v2.png',import.meta.url).href;}
function tableSkin(d){if(!tableImage)return false;const image=tableImage,sx=[0,165,979,image.width],sy=[0,181,1169,image.height],x=[185,220,680,715],y=[307,342,900,935];for(let row=0;row<3;row++)for(let col=0;col<3;col++)d.c.drawImage(image,sx[col],sy[row],sx[col+1]-sx[col],sy[row+1]-sy[row],x[col],y[row],x[col+1]-x[col],y[row+1]-y[row]);return true;}
const inks=['#b66d82','#90b2c4','#d2b66f','#bf9d51'];
function symbol(d,id,x,y,size=16){const c=d.c;c.save();if(id==='star')d.star(x,y,size,'#e6cb8e');else if(id==='moon'){d.circle(x,y,size,'#e6cb8e');d.circle(x+size*.45,y-size*.2,size*.84,'#173b3b');}else if(id==='rose'){for(let i=0;i<6;i++)d.circle(x+Math.cos(i*Math.PI/3)*size*.43,y+Math.sin(i*Math.PI/3)*size*.43,size*.5,'#c58491');d.circle(x,y,size*.26,'#f5d99a');}else{d.poly([[x-size,y-size*.3],[x-size*.5,y+size*.2],[x,y-size],[x+size*.5,y+size*.2],[x+size,y-size*.3],[x+size*.8,y+size*.7],[x-size*.8,y+size*.7]],'#dfbb70','#f6dfad',1.2);}c.restore();}
function wood(c,x,y,w,h){const g=c.createLinearGradient(x-w/2,0,x+w/2,0);g.addColorStop(0,'#5d342b');g.addColorStop(.2,'#9a6340');g.addColorStop(.5,'#bd8a52');g.addColorStop(.8,'#925936');g.addColorStop(1,'#543027');paper(c,x,y,w,h,g,'#d6b675',11);c.save();c.beginPath();c.rect(x-w/2+3,y-h/2+3,w-6,h-6);c.clip();for(let i=0;i<8;i++){c.strokeStyle='#e8c98b30';c.lineWidth=1;c.beginPath();c.moveTo(x-w/2,y-h/2+5+i*h/8);c.bezierCurveTo(x-w*.2,y-h/2+i*h/8-4,x+w*.3,y-h/2+i*h/8+14,x+w/2,y-h/2+i*h/8+5);c.stroke();}c.restore();}
function drawWater(s,d){
 const c=d.c,r=model.rules(s),coin=s.coin,art=id=>d.art['study:'+id+':front'];
 compactHeader(c,'PENELOPE’S WISHING WATERS',(s.level+1)+' · '+r.name);
 paper(c,450,190,630,38,'#fff2d6a8','#b99d6460',10);text(c,s.wishes.filter(Boolean).length+' / '+r.wishes.length+' ribbons · '+s.remaining+' ripples'+(r.ordered?' · follow the numbers':''),450,190,23,'#4b6261');
 for(const q of s.ripples){for(let i=0;i<3;i++){const t=q.t-i*.13;if(t>0&&t<.95)d.ellipse(q.x,q.y,12+t*95,5+t*35,null,'#fff9d7'+Math.round((1-t/.95)*170).toString(16).padStart(2,'0'),2);}}
 for(const q of r.rocks){d.ellipse(q.x+3,q.y+15,q.r+12,12,'#215b6655');const image=art('skipping-stone');if(image)d.sprite(image,q.x,q.y,{w:q.r*2.7,h:q.r*2.1,shadow:false});else d.ellipse(q.x,q.y,q.r,q.r*.65,'#b5b8a0','#ede2b9',2);}
 for(let i=0;i<r.wishes.length;i++){
  const q=r.wishes[i],done=s.wishes[i],next=!done&&(!r.ordered||s.wishes.slice(0,i).every(Boolean));
  d.ellipse(q.x,q.y+13,35,12,null,done?'#eef6c8aa':next?'#ffe6a3':'#d5e5bf88',2);
  if(!done){const image=art('wish-ribbon');if(image)d.sprite(image,q.x,q.y-5+Math.sin(s.clock*2+i)*4,{w:88,h:88,shadow:false});text(c,i+1,q.x,q.y+40,18,'#365b60');}
  else text(c,'✓',q.x,q.y,25,'#ffffd0');
 }
 const lit=s.wishes.every(Boolean);d.ellipse(r.goal.x,r.goal.y,42,16,null,lit?'#fff2b7':'#f3e3b877',3);text(c,lit?'FLOAT INTO THE ARCH':'GATHER THE RIBBONS',r.goal.x,r.goal.y-27,19,'#405759');
 const alpha=s.motion?.kind==='well'?1-s.motion.t/.7:1,image=art('well-wish-penny');d.ellipse(coin.x+4,coin.y+14,24,10,'#225d6550');
 if(image)d.sprite(image,coin.x,coin.y,{w:80,h:80,shadow:false,alpha});else d.circle(coin.x,coin.y,20,'#e5c370','#fff2c2',2);
 if(s.cursor){d.circle(s.cursor.x,s.cursor.y,15,null,'#fff3b8',2);}
 button(c,'↶ UNDO',155,1041,125);if(s.phase!=='play')text(c,'PENNY AFLOAT…',510,1041,22,'#405759');
 compactFooter(c,{note:s.moves===0?'Tap the water just below the penny to float it toward a ribbon. A farther tap makes a stronger ripple.':s.note});paintChapterReward(s,d);
}
function draw(s,d){
 if(s.schema===3){drawWater(s,d);return;}
 if(model.isLegacy(s)){drawLegacy(s,d);return;}
 loadTable();const c=d.c,r=model.rules(s),a=model.ARENA;
 header(c,'PENELOPE’S PENNY PARLOUR',(s.level+1)+' · '+r.name);
 ;text(c,s.remaining+' coins · '+s.banked+' / '+r.banks+' banked captures',450,222,24,'#684934');
 const targets=r.order?r.order.map((id,i)=>({id,done:i<s.orderAt,next:i===s.orderAt})):r.pockets.map((_,i)=>({id:i,done:s.counts[i]>=r.need[i],next:false})),w=Math.min(154,660/targets.length);
 targets.forEach((p,i)=>{const x=450+(i-(targets.length-1)/2)*w;paper(c,x,282,w-8,43,p.done?'#708b68':p.next?'#f2d49f':'#fff0d8','#c09e66',8);text(c,r.pockets[p.id].id.toUpperCase()+(p.done?' ✓':!r.order?' '+s.counts[p.id]+'/'+r.need[p.id]:''),x,282,17,p.done?'#fff1d0':'#674735');});
 // A physical playing table floats inside the existing carnival scene.
 if(!tableSkin(d)){
 wood(c,450,623,520,606);
 const felt=c.createLinearGradient(0,335,0,908);felt.addColorStop(0,'#2e6158');felt.addColorStop(.5,'#254e49');felt.addColorStop(1,'#163c39');paper(c,450,623,472,566,felt,'#ddbc77',22);
 c.save();c.beginPath();c.roundRect(216,342,468,561,18);c.clip();for(let y=355;y<905;y+=13){d.line({x:221,y},{x:679,y:y+9},'#f6e5b307',1);}c.restore();
 }
 for(const x of [a.left,a.right]){d.line({x,y:a.top+16},{x,y:a.bottom-16},'#713744',13);d.line({x:x+(x<450?-6:6),y:a.top+16},{x:x+(x<450?-6:6),y:a.bottom-16},'#dfbd77',2);}
 for(const y of [a.top,a.bottom]){d.line({x:a.left+16,y},{x:a.right-16,y},'#713744',13);d.line({x:a.left+16,y:y+(y<600?-6:6)},{x:a.right-16,y:y+(y<600?-6:6)},'#dfbd77',2);}
 for(const x of [205,695])for(const y of [340,906]){d.circle(x,y,7,'#b3864b','#f4d89c',1.5);d.circle(x-1,y-2,2,'#ffe8b6');}
 for(const [i,p]of r.pockets.entries()){
  d.glow(p.x,p.y,p.r+8,inks[i%4]+'45');d.circle(p.x,p.y+4,p.r+5,'#172b2c','#b38b51',4);d.circle(p.x,p.y,p.r,'#bd9257','#f7dda2',3);d.circle(p.x,p.y,p.r-5,'#173b3b','#714a32',2);symbol(d,p.id,p.x,p.y,p.r*.43);text(c,p.id.toUpperCase(),p.x,p.y+p.r+16,15,'#f1ddae');
  if(s.flash[i])d.circle(p.x,p.y,p.r+10,null,'#ffe9ad',3);for(let n=0;n<Math.min(3,s.counts[i]);n++)penny(d,p.x-9+n*9,p.y+p.r*.35,5);
 }
 for(const [i,p]of r.rails.entries()){const q=model.railPose(s,p);d.line({x:q.x1+3,y:q.y1+5},{x:q.x2+3,y:q.y2+5},'#102d2a66',q.r*2+5);d.line({x:q.x1,y:q.y1},{x:q.x2,y:q.y2},'#a87d48',q.r*2+4);d.line({x:q.x1,y:q.y1},{x:q.x2,y:q.y2},'#e0bf7e',q.r*2);d.line({x:q.x1,y:q.y1-2},{x:q.x2,y:q.y2-2},'#fff0ba',2);if(q.swing){d.circle((q.x1+q.x2)/2,(q.y1+q.y2)/2,8,'#96673c','#f5d594',2);}}
 for(const p of r.bumpers){d.circle(p.x+2,p.y+5,p.r+4,'#142c2b66');d.circle(p.x,p.y,p.r,'#ab7c47','#f3d398',3);d.circle(p.x,p.y,p.r-7,'#723b48','#c89b68',2);d.star(p.x,p.y,8,'#e7ca8d');}
 d.ellipse(model.LAUNCH.x,model.LAUNCH.y,41,17,null,'#d9bc7e',2);d.line({x:model.LAUNCH.x-30,y:model.LAUNCH.y+7},{x:model.LAUNCH.x+30,y:model.LAUNCH.y+7},'#b78e58',1);
 if(s.phase==='play'){for(const p of model.preview(s))d.circle(p.x,p.y,2.4,'#f4dd9caa');penny(d,model.LAUNCH.x,model.LAUNCH.y,13);}
 if(s.coin){const b=s.coin;d.ellipse(b.x+2,b.y+3,12,5,'#102a2966');penny(d,b.x,b.y,model.COIN_R*(s.motion.kind==='sink'?.35+.65*b.alpha:1),b.spin,b.alpha);if(b.banks)d.circle(b.x,b.y,17,null,'#ffe9ab66',1);}
 paper(c,450,974,670,50,'#fff0dcf3','#b28b58',11);text(c,'AIM '+s.aim+'°',207,974,21,'#71503c');d.line({x:320,y:974},{x:670,y:974},'#c4a675',11);d.line({x:320,y:974},{x:320+(s.power-20)/80*350,y:974},'#995043',7);d.circle(320+(s.power-20)/80*350,974,9,'#f5d99c','#9b7243',2);text(c,s.power,715,974,22,'#71503c');
 button(c,'↶ UNDO',155,1041,125);button(c,s.phase==='play'?'FLICK THE PENNY':'LET IT SETTLE',545,1041,400);footer(c,s);
}
const instructions='Flick a penny across the velvet table into the engraved brass pockets. Tap the table to aim, or adjust with Left/Right. Set STRENGTH on the slider; Up/Down adjusts it. Press Flick or Space. The coin rolls and rebounds physically from rails, cushions and bumpers, then must drop fully into a pocket. A banked capture means at least one real rebound before the pocket; a bounce without a capture earns nothing. Later cards show a pocket order—read the NEXT highlighted seal. Moving brass arms continue while you aim, so time the route. Coins are limited; unfinished pockets or bank shots lose the round. Undo rewinds one committed flick before the last result. Help pauses. Retry refills local coins. Your old Dish Garden saves remain available exactly where you left them; only a fresh chapter/retry uses the new parlour. Rewards and pennies here are test previews.';
const engine=study({id:'penny-pitch',mode:'dish-skip',title:'Penelope’s Wishing Waters',model,draw,intro:'Make ripples in the real carnival water. Guide a wishing penny through the ribbons and home to the arch.',instructions:'Tap the water on the opposite side of the penny from where you want it to float. A tap farther away creates a stronger ripple. Let the penny settle before the next ripple. Gather every floating ribbon, then guide the penny into the top arch. Later chapters add real stepping-stone collisions, gentle currents and numbered ribbon routes. Ripples are limited; no launch or strength button is required. Undo rewinds one ripple. Arrow keys move a ripple cursor; Enter or Space makes that ripple. Help pauses the water and returning restores the exact penny motion. Earlier saved games retain their earlier layout. Rewards and pennies remain local previews.',keys:'Tap water to ripple · U Undo · Arrows move cursor · Enter ripple',tap(){},key(){}});
const save=s=>{try{engine.persist(s);}catch{}};
engine.pointer=(s,type,p)=>{
 if(s.schema===3){
  if(type==='cancel'){delete s.pointerDown;return;}if(s.saveError||s.result||s.phase==='celebrate')return;
  if(type==='down')s.pointerDown={x:p.x,y:p.y};
  if(type==='move'&&s.pointerDown&&Math.hypot(s.pointerDown.x-p.x,s.pointerDown.y-p.y)>=25)s.pointerDown.slid=true;
  if(type==='up'){const down=s.pointerDown;delete s.pointerDown;if(down&&!down.slid&&Math.hypot(down.x-p.x,down.y-p.y)<25){if(p.y>1010&&p.y<1076&&p.x<230)model.undo(s);else model.ripple(s,p);save(s);}}
  return;
 }
 if(p.y>1010&&p.y<1076&&p.x<230&&!s.saveError&&!s.result&&s.phase!=='celebrate'){
  if(type==='down')s.pointerDown={x:p.x,y:p.y};
  if(type==='up'&&s.pointerDown){delete s.pointerDown;model.undo(s);save(s);}if(type==='cancel')delete s.pointerDown;return;
 }
 if(model.isLegacy(s)){if(type==='cancel'){model.endAim(s,false);model.endPower(s,false);return;}if(s.saveError||s.result||s.phase!=='play')return;if(type==='down'){if(p.y>968&&p.y<1018)model.beginPower(s,p);else if(p.y>310&&p.y<955)model.beginAim(s,p);}if(type==='move'){model.moveAim(s,p);model.movePower(s,p);}if(type==='up'){if(s.aimDrag)model.endAim(s,true);else if(s.powerDrag)model.endPower(s,true);else if(p.y>1016&&p.y<1074){if(p.x<230)model.undo(s);else model.shoot(s);}save(s);}return;}
 if(type==='cancel'){delete s.pointerDown;return;}if(s.saveError||s.result||s.phase!=='play')return;
 const act=()=>{if(p.y>946&&p.y<1006){model.setPower(s,20+(p.x-320)/350*80);}else if(p.y>1010&&p.y<1076){if(p.x<230)model.undo(s);else model.shoot(s);}else if(p.y>325&&p.y<922){model.setAim(s,Math.atan2(p.x-model.LAUNCH.x,model.LAUNCH.y-p.y)*180/Math.PI);}};
 if(type==='down'){s.pointerDown={x:p.x,y:p.y};if(p.y<1010)act();}
 if(type==='move'&&s.pointerDown&&p.y<1010)act();
 if(type==='up'&&s.pointerDown){delete s.pointerDown;act();save(s);}
};
engine.key=(s,k,down)=>{if(s.schema===3){if(!down||s.saveError||s.result||s.phase==='celebrate')return;if(k.toLowerCase()==='u')model.undo(s);else if(k===' '||k==='Enter')model.ripple(s,s.cursor||{x:s.coin.x,y:Math.min(1000,s.coin.y+50)});else if(k.startsWith('Arrow')){s.cursor??={x:s.coin.x,y:Math.min(1000,s.coin.y+50)};s.cursor.x=Math.max(170,Math.min(730,s.cursor.x+(k==='ArrowLeft'?-12:k==='ArrowRight'?12:0)));s.cursor.y=Math.max(220,Math.min(1005,s.cursor.y+(k==='ArrowUp'?-12:k==='ArrowDown'?12:0)));}save(s);return;}if(!down||s.saveError||s.result||s.phase==='celebrate')return;if(k.toLowerCase()==='u'){model.undo(s);save(s);return;}if(s.phase!=='play')return;if(k==='ArrowLeft')model.setAim(s,s.aim-1);else if(k==='ArrowRight')model.setAim(s,s.aim+1);else if(k==='ArrowUp')model.setPower(s,s.power+1);else if(k==='ArrowDown')model.setPower(s,s.power-1);else if(k===' '||k==='Enter')model.shoot(s);save(s);};
const createBase=engine.create;engine.create=level=>{const s=createBase(level);if(s.schema!==3)loadTable();return s;};const sharedArtReady=engine.artReady;engine.artReady=()=>sharedArtReady();
const sampleModel={makeState:()=>model.makeSampleState(),step(s,dt){if(s.demoRewardAge!==undefined){s.demoRewardAge+=dt;return;}model.step(s,dt);if(s.phase==='celebrate'){s.phase='demo-finish';s.pendingPennies=0;s.demoRewardAge=0;}}};
function sampleDraw(s,d){draw(s,d);if(s.demoRewardAge===undefined)return;const c=d.c,id=engine.prizes[0],t=s.demoRewardAge,v=['front','right','back','left'],turn=Math.max(0,t-.35)/3*4,i=Math.floor(turn)%4,mix=turn-Math.floor(turn);paper(c,450,560,590,450,'#fff0e7f7','#b28a4d');text(c,'DEMONSTRATION COMPLETE',450,388,28);text(c,'One penny safely pocketed',450,430,25);const a=d.art['study:'+id+':'+v[i]],b=d.art['study:'+id+':'+v[(i+1)%4]];if(a)d.sprite(a,450,563,{w:230,shadow:false,alpha:1-mix});if(b)d.sprite(b,450,563,{w:230,shadow:false,alpha:mix});text(c,'Sample reward · nothing collected',450,730,23);}
function hasSavedFirst(){try{const k=engine.navigationKey.replace(/\.selection$/,'');return !!JSON.parse(localStorage.getItem(k)||'null')?.chapters?.[0]||!!localStorage.getItem(k.replace('.v2:','.v1:'));}catch{return true;}}
function sampleRipple(s,target){const b=s.coin,dx=target.x-b.x,dy=target.y-b.y,d=Math.hypot(dx,dy),distance=Math.min(70,(d*3+8)/8);model.ripple(s,{x:b.x-dx/d*distance,y:b.y-dy/d*distance});}
export default withChapterExample(engine,{model:sampleModel,draw:sampleDraw,captionY:170,hasSavedFirst,steps:()=>[
 ...[795,620,445,270].map((y,i)=>({caption:i===0?'Tap BELOW the penny. The ripple pushes it away and through the ribbon.':i===3?'One last ripple carries the penny into the actual arch at the TOP. No launch button is needed.':'The penny settled. Tap behind it again to continue UP the water toward the arch.',point:{x:450,y:[968,861,687,511][i]},run:s=>sampleRipple(s,{x:450,y}),done:s=>i===3?s.demoRewardAge!==undefined:s.phase==='play',after:.2})),
 {caption:'The penny really reached home. This sample reward changes no chapter or purse.',point:{x:450,y:563},run:()=>{},done:s=>s.demoRewardAge>=4.2,after:.2}
],finishCaption:'Your turn: tap behind the penny, gather every ribbon and float into the top arch.'});
