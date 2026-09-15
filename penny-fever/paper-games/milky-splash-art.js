import {FLAVOURS, flavourOf, layoutOf} from './milky-splash.js?v=milk-art-1';
import {spriteKey} from './prizes.js';

const effects=new WeakMap();
export function splashSwap(state,a,b){effects.set(state,{at:state.t,a,b});}
function box(c,x,y,w,h,r,fill,stroke){
 c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}
}
function text(c,label,x,y,size=24,colour='#563453',weight=700){c.font=`${weight} ${size}px "Trebuchet MS",sans-serif`;c.textAlign='center';c.fillStyle=colour;c.fillText(label,x,y);}
function gradient(c,x,y,h,a,b){const g=c.createLinearGradient(x,y,x,y+h);g.addColorStop(0,a);g.addColorStop(1,b);return g;}
const bottles=new Map();
function bottleArt(flavour,special='',kind='milk'){
 const key=flavour.id+':'+special+':'+kind;if(bottles.has(key))return bottles.get(key);
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=144;const c=canvas.getContext('2d');
 const colour=kind==='sour'?'#94aa45':kind==='weighted'?'#8693a5':kind==='unique'?'#f4c65a':flavour.fill;
 c.fillStyle='#573d4920';c.beginPath();c.ellipse(64,132,39,8,0,0,Math.PI*2);c.fill();
 c.save();c.shadowColor='#52304b44';c.shadowBlur=7;c.shadowOffsetY=4;
 c.beginPath();c.moveTo(44,28);c.lineTo(84,28);c.lineTo(84,43);c.bezierCurveTo(84,52,104,53,104,72);c.lineTo(104,117);c.quadraticCurveTo(104,132,88,132);c.lineTo(40,132);c.quadraticCurveTo(24,132,24,117);c.lineTo(24,72);c.bezierCurveTo(24,53,44,52,44,43);c.closePath();
 c.fillStyle=gradient(c,24,28,105,'#ffffff','#d8f3ee');c.fill();c.strokeStyle='#ffffff';c.lineWidth=3;c.stroke();c.restore();
 box(c,30,64,68,59,13,gradient(c,30,64,59,colour,'#fff0db'));
 box(c,38,12,52,23,flavour.cap==='square'?3:9,gradient(c,38,12,23,'#fff3d1',colour),'#ffffff');
 c.strokeStyle=colour;c.lineWidth=3;for(let x=45;x<87;x+=8){c.beginPath();c.moveTo(x,17);c.lineTo(x,28);c.stroke();}
 c.fillStyle='#ffffff88';c.beginPath();c.ellipse(39,81,5,23,0,0,Math.PI*2);c.fill();
 box(c,39,76,50,35,10,'#fffaf0ee');
 text(c,kind==='sour'?'×':kind==='weighted'?'◆':kind==='unique'?'★':flavour.mark,64,101,27,colour);
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
 box(c,50,22,800,165,32,gradient(c,50,22,165,'#fff9e9','#f9dce9'),'#fff9e9');
 for(let x=75;x<840;x+=34){c.fillStyle='#d479a02b';c.beginPath();c.arc(x,22,14,0,Math.PI);c.fill();}
 text(c,'MABEL’S LITTLE DAIRY',450,59,19,'#937482');
 text(c,'Milky Splash!',450,109,47,'#b84179',900);
 text(c,chapter.title,450,150,23,'#754563');
 box(c,72,122,130,46,18,'#fffaf0');text(c,real?real.movesLeft+' moves':'Match 3',137,153,22,'#a84073');
 box(c,710,122,116,46,18,'#fffaf0');text(c,'Ch '+(s.level+1),768,153,22,'#a84073');
 // Opaque cream tray separates readable pieces from the illustrated stall.
 box(c,originX-21,originY-21,width+42,height+42,27,'#705a7960');
 box(c,originX-17,originY-23,width+34,height+34,25,gradient(c,originX,originY,height,'#fff7e8','#e5f4ee'),'#fffaf0');
 for(let r=0;r<board.rows;r++)for(let col=0;col<board.cols;col++){
  const cell=board.cells[r][col],x=originX+col*size,y=originY+r*size;
  if(cell?.kind==='hole'){box(c,x+3,y+3,size-6,size-6,12,'#a7b9b659');continue;}
  box(c,x+2,y+2,size-4,size-4,12,(r+col)%2?'#eddbeb':'#e2ece4','#fffaf080');
  if(!cell)continue;
  const selected=s.selected?.c===col&&s.selected?.r===r;
  if(selected){box(c,x+2,y+2,size-4,size-4,12,'#fff0af','#c96aa3');}
  if(cell.kind==='crate'){crate(c,x+size*.13,y+size*.15,size*.74,size*.7,cell.hp===1);continue;}
  const image=bottleArt(flavourOf(cell.flavour),cell.special==='shaken'?cell.axis:cell.special,cell.kind);
  const bob=selected&&!s.reduced?Math.sin(s.t*7)*2:0;
  c.drawImage(image,x+size*.09,y-size*.03+bob,size*.82,size*.94);
  if(cell.kind==='unique'){
   d.item(spriteKey(chapter.prize),x+size/2,y+size*.58,{w:size*.35,fallback:()=>text(c,'★',x+size/2,y+size*.65,size*.28,'#9c692d')});
   box(c,x+3,y+3,size-6,size-6,12,null,'#d7a437');
  }
  if(cell.kind==='weighted'&&cell.hp===1){text(c,'╱',x+size/2,y+size*.7,size*.35,'#fff');}
 }
 crate(c,originX-10,crateY+8,width+20,56);
 box(c,450-136,crateY+18,272,35,9,'#fff3d6');
 text(c,board.delivered?'DELIVERY RECEIVED ✓':'MABEL’S DELIVERY CRATE',450,crateY+42,18,'#83573f');
 const fx=effects.get(s),age=fx?s.t-fx.at:2;
 if(real&&fx&&age>=0&&age<.6&&!s.reduced){
  c.save();c.globalAlpha=1-age/.6;
  for(const cell of [fx.a,fx.b])for(let i=0;i<8;i++){
   const a=i*Math.PI/4,dist=age*size*1.4;
   c.fillStyle=i%2?'#fff9e8':'#f19abc';c.beginPath();c.ellipse(originX+(cell.c+.5)*size+Math.cos(a)*dist,originY+(cell.r+.5)*size+Math.sin(a)*dist+age*age*50,4,7,a,0,Math.PI*2);c.fill();
  }c.restore();
 }
 if(!real){
  box(c,originX+18,originY+height*.35,width-36,138,23,'#fff8eaf5','#df9ab8');
  text(c,'A little swap. A lovely splash.',450,originY+height*.35+43,23,'#965076');
  text(c,'Tap to play',450,originY+height*.35+91,32,'#b84179');
 }
 box(c,70,1060,760,109,24,'#fff6eaf2','#f2cadc');
 const words=String(s.note||'Swap neighbours. Match three bottles.').split(' ');let line='',lines=[];
 for(const word of words){if((line+' '+word).length>57){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);
 lines.slice(0,2).forEach((line,i)=>text(c,line,450,1095+i*27,22,'#754563',600));
 if(lines.length<2)text(c,'SWAP  •  MATCH  •  SPLASH',450,1137,17,'#b37392');
 c.restore();
}
