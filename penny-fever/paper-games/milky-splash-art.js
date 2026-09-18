import {FLAVOURS, flavourOf, layoutOf} from './milky-splash.js?v=milk-cow-1';
import {spriteKey} from './prizes.js';

const effects=new WeakMap();
export function isSliding(state){const fx=effects.get(state);return !!fx&&state.t-fx.at<fx.duration;}
export function splashSwap(state,a,b,before,accepted){
 if(state.reduced)return;
 const swapped=before.map(row=>row.slice());[swapped[a.r][a.c],swapped[b.r][b.c]]=[swapped[b.r][b.c],swapped[a.r][a.c]];
 const paths=new Map();
 swapped.forEach((row,r)=>row.forEach((cell,c)=>{if(cell)paths.set(cell,{r,c});}));
 effects.set(state,{at:state.t,a,b,before,paths,accepted,duration:accepted ? .52 : .32});
}
function box(c,x,y,w,h,r,fill,stroke){
 c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}
}
function text(c,label,x,y,size=24,colour='#563453',weight=700){c.font=`${weight} ${size}px "Trebuchet MS",sans-serif`;c.textAlign='center';c.fillStyle=colour;c.strokeStyle='#fff8e8';c.lineWidth=3;c.strokeText(label,x,y);c.fillText(label,x,y);}
function gradient(c,x,y,h,a,b){const g=c.createLinearGradient(x,y,x,y+h);g.addColorStop(0,a);g.addColorStop(1,b);return g;}
const bottles=new Map();
function bottleArt(flavour,special='',kind='milk'){
 const key=flavour.id+':'+special+':'+kind;if(bottles.has(key))return bottles.get(key);
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=144;const c=canvas.getContext('2d');
 const colour=kind==='sour'?'#94aa45':kind==='weighted'?'#8693a5':kind==='unique'?(flavour.id==='banana'?'#f2b91c':flavour.id==='vanilla'?'#eee9e3':flavour.fill):flavour.id==='banana'?'#f2b91c':flavour.id==='vanilla'?'#eee9e3':flavour.fill;
 const ink=kind==='unique'?'#795116':flavour.id==='vanilla'?'#74503e':flavour.id==='banana'?'#87501c':colour;
 const cap=flavour.id==='vanilla'?'#87618d':colour;
 c.fillStyle='#573d4920';c.beginPath();c.ellipse(64,132,39,8,0,0,Math.PI*2);c.fill();
 c.save();c.shadowColor='#52304b44';c.shadowBlur=7;c.shadowOffsetY=4;
 c.beginPath();c.moveTo(44,28);c.lineTo(84,28);c.lineTo(84,43);c.bezierCurveTo(84,52,104,53,104,72);c.lineTo(104,117);c.quadraticCurveTo(104,132,88,132);c.lineTo(40,132);c.quadraticCurveTo(24,132,24,117);c.lineTo(24,72);c.bezierCurveTo(24,53,44,52,44,43);c.closePath();
 c.fillStyle=gradient(c,24,28,105,'#ffffff','#d8f3ee');c.fill();c.strokeStyle='#ffffff';c.lineWidth=3;c.stroke();c.restore();
 box(c,30,64,68,59,13,gradient(c,30,64,59,colour,'#fff0db'));
 box(c,38,12,52,23,flavour.cap==='square'?3:9,gradient(c,38,12,23,'#fff3d1',cap),'#ffffff');
 c.strokeStyle=cap;c.lineWidth=3;for(let x=45;x<87;x+=8){c.beginPath();c.moveTo(x,17);c.lineTo(x,28);c.stroke();}
 c.fillStyle='#ffffff88';c.beginPath();c.ellipse(39,81,5,23,0,0,Math.PI*2);c.fill();
 box(c,39,76,50,35,10,'#fffaf0ee');
 text(c,kind==='sour'?'×':kind==='weighted'?'◆':kind==='unique'?'★':flavour.mark,64,101,27,ink);
 if(special==='cream'){box(c,27,48,74,16,5,'#f5ca52');text(c,'★',64,63,20,'#8b542d');}
 else if(special){text(c,special==='row'?'↔':special==='col'?'↕':'✦',64,66,26,'#6d3d8b');}
 if(kind==='weighted'){box(c,25,111,78,12,3,'#637387');text(c,'• •',64,122,14,'#dfe7ee');}
 if(kind==='sour'){text(c,'~',64,54,26,'#57762c');}
 bottles.set(key,canvas);return canvas;
}
function crate(c,x,y,w,h,damaged=false){
 box(c,x,y,w,h,8,gradient(c,x,y,h,'#e5b57b','#b97249'),'#fff1c8');
 for(let i=1;i<3;i++){c.strokeStyle='#965b3b';c.beginPath();c.moveTo(x+3,y+h*i/3);c.lineTo(x+w-3,y+h*i/3);c.stroke();}
 c.strokeStyle='#f5d5a0';c.lineWidth=5;c.beginPath();c.moveTo(x+8,y+6);c.lineTo(x+w-8,y+h-6);c.moveTo(x+w-8,y+6);c.lineTo(x+8,y+h-6);c.stroke();
 if(damaged){c.strokeStyle='#754735';c.lineWidth=3;c.beginPath();c.moveTo(x+w*.55,y+3);c.lineTo(x+w*.4,y+h*.5);c.lineTo(x+w*.6,y+h*.7);c.stroke();}
}
export function drawMilkySplash(s,d,chapter){
 const c=d.c;const real=s.board;
 const board=real||{cols:5,rows:6,cells:Array.from({length:6},(_,r)=>Array.from({length:5},(_,i)=>({kind:'milk',flavour:FLAVOURS[(i+r*2)%6].id})))};
 const {size,originX,originY,crateY}=layoutOf(board),width=board.cols*size,height=board.rows*size;
 c.save();
 // Keep the dairy court clear at the top — no title/HUD over the shop.
 const fx=effects.get(s),age=fx?s.t-fx.at:2;
 const swapping=real&&fx&&age<.18;
 const returning=real&&fx&&!fx.accepted&&age>=.18&&age<.32;
 const cells=(swapping||returning)?fx.before:board.cells;
 c.save();c.beginPath();c.rect(originX-4,originY-5,width+8,height+10);c.clip();
 for(let r=0;r<board.rows;r++)for(let col=0;col<board.cols;col++){
  const cell=cells[r][col];let x=originX+col*size,y=originY+r*size;
  if(fx&&real&&age<fx.duration){
   if(swapping||returning){
    const amount=swapping?age/.18:1-(age-.18)/.14;
    if(r===fx.a.r&&col===fx.a.c){x+=(fx.b.c-col)*size*amount;y+=(fx.b.r-r)*size*amount;}
    if(r===fx.b.r&&col===fx.b.c){x+=(fx.a.c-col)*size*amount;y+=(fx.a.r-r)*size*amount;}
   }else if(fx.accepted){
    const from=fx.paths.get(cell)||{r:-1-col%3,c:col};
    const progress=1-Math.pow(1-Math.min(1,(age-.18)/.34),3);
    x=originX+(from.c+(col-from.c)*progress)*size;y=originY+(from.r+(r-from.r)*progress)*size;
   }
  }
  if(cell?.kind==='hole')continue;
  box(c,originX+col*size+2,originY+r*size+2,size-4,size-4,12,null,'#fffaf050');
  if(!cell)continue;
  const selected=s.selected?.c===col&&s.selected?.r===r;
  if(selected){box(c,x+2,y+2,size-4,size-4,12,'#fff0af','#c96aa3');}
  if(cell.kind==='crate'){crate(c,x+size*.13,y+size*.15,size*.74,size*.7);continue;}
  const image=bottleArt(flavourOf(cell.flavour || (cell.kind==='unique' ? 'banana' : null)),cell.special==='shaken'?cell.axis:cell.special,cell.kind);
  const bob=selected&&!s.reduced?Math.sin(s.t*7)*2:0;
  c.drawImage(image,x+size*.09,y-size*.03+bob,size*.82,size*.94);
  if(cell.kind==='unique'){
   d.item(spriteKey(chapter.prize),x+size/2,y+size*.58,{w:size*.58,fallback:()=>text(c,'★',x+size/2,y+size*.65,size*.28,'#9c692d')});
   box(c,x+2,y+2,size-4,size-4,12,null,'#d7a437');
   text(c,'PRIZE ↓',x+size/2,y+size*.91,size*.17,'#795116',900);
  }
  if(cell.kind==='weighted'&&cell.hp===1){text(c,'╱',x+size/2,y+size*.7,size*.35,'#fff');}
 }
 c.restore();
 crate(c,originX-10,crateY+8,width+20,56);
 box(c,450-136,crateY+18,272,35,9,'#fff3d6');
 const crateLabel=board.delivered?'DELIVERY RECEIVED ✓':((real?real.movesLeft+' moves · ':'')+'PRIZE TO THE CRATE');
 text(c,crateLabel,450,crateY+42,18,'#83573f');
 if(real&&fx&&fx.accepted&&age>=0&&age<.6&&!s.reduced){
  c.save();c.globalAlpha=1-age/.6;
  for(const cell of [fx.a,fx.b].filter(p=>['milk','special'].includes(fx.before[p.r][p.c]?.kind)))for(let i=0;i<8;i++){
   const a=i*Math.PI/4,dist=age*size*1.4;
   c.fillStyle=i%2?'#fff9e8':'#f19abc';c.beginPath();c.ellipse(originX+(cell.c+.5)*size+Math.cos(a)*dist,originY+(cell.r+.5)*size+Math.sin(a)*dist+age*age*50,4,7,a,0,Math.PI*2);c.fill();
  }c.restore();
 }
 if(!real){
  box(c,originX+18,originY+height*.35,width-36,138,23,'#fff8eaf5','#df9ab8');
  text(c,'A little swap. A lovely splash.',450,originY+height*.35+43,23,'#965076');
  text(c,'Tap the board',450,originY+height*.35+91,32,'#b84179');
 }

 c.restore();
}
