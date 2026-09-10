export const W=900,H=1200, TAU=Math.PI*2;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const lerp=(a,b,t)=>a+(b-a)*t;
export function segmentDistance(p,a,b){const x=b.x-a.x,y=b.y-a.y,t=clamp(((p.x-a.x)*x+(p.y-a.y)*y)/(x*x+y*y||1),0,1);return Math.hypot(p.x-a.x-x*t,p.y-a.y-y*t);}
export function seeded(seed=41){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function done(s,title,detail){s.result={title,detail};}
export class Draw {
 constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d');if(!this.c)throw Error('Canvas is unavailable.');this.resize(450,600,1);}
 resize(w,h,r=1){r=clamp(r,1,1.5);this.canvas.width=Math.max(1,Math.round(w*r));this.canvas.height=Math.max(1,Math.round(h*r));}
 clear(){const c=this.c;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,this.canvas.width,this.canvas.height);c.setTransform(this.canvas.width/W,0,0,this.canvas.height/H,0,0);c.lineCap='round';c.lineJoin='round';}
 line(a,b,color='#edcf94',width=2){const c=this.c;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
 path(points,color='#edcf94',width=2,close=false,fill=null){if(!points.length)return;const c=this.c;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));if(close)c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(color){c.strokeStyle=color;c.lineWidth=width;c.stroke();}}
 poly(points,fill,stroke='#e8cb95',width=1.5){this.path(points.map(p=>Array.isArray(p)?{x:p[0],y:p[1]}:p),stroke,width,true,fill);}
 ellipse(x,y,rx,ry,fill,stroke=null,width=1){const c=this.c;c.beginPath();c.ellipse(x,y,Math.max(0,rx),Math.max(0,ry),0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
 circle(x,y,r,fill,stroke=null,width=1){this.ellipse(x,y,r,r,fill,stroke,width);}
 text(text,x,y,size=20,color='#fff0cb',align='center'){const c=this.c;c.font=`500 ${size}px Georgia,serif`;c.textAlign=align;c.fillStyle=color;c.fillText(String(text),x,y);}
 glow(x,y,r,color='#edcd8b'){const g=this.c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color+'55');g.addColorStop(1,color+'00');this.circle(x,y,r,g);}
 ball(x,y,r,color='#ddc082'){this.ellipse(x+5,y+r*.6,r,r*.55,'#071e3440');const g=this.c.createRadialGradient(x-r*.3,y-r*.4,1,x,y,r);g.addColorStop(0,'#fff5d8');g.addColorStop(.35,color);g.addColorStop(1,'#514c55');this.circle(x,y,r,g,'#e6d5b1',1.5);}
 star(x,y,r,fill='#e7c789'){this.poly(Array.from({length:10},(_,i)=>{const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.45:r;return[x+Math.cos(a)*rr,y+Math.sin(a)*rr];}),fill,'#f8e4b3',1.3);}
 heart(x,y,r,fill='#c67483'){const c=this.c;c.beginPath();c.moveTo(x,y+r);c.bezierCurveTo(x-r*1.7,y-r*.1,x-r,y-r*1.5,x,y-r*.55);c.bezierCurveTo(x+r,y-r*1.5,x+r*1.7,y-r*.1,x,y+r);c.fillStyle=fill;c.fill();c.strokeStyle='#f0c49f';c.lineWidth=2;c.stroke();}
 ring(x,y,r,color='#e2b972',w=8){this.ellipse(x+4,y+8,r,r*.8,null,'#12233545',w+3);this.circle(x,y,r,null,'#8d704a',w+4);this.circle(x,y,r,null,color,w);}
 leaf(x,y,a,size=30,color='#788f69'){const c=this.c;c.save();c.translate(x,y);c.rotate(a);this.poly([[0,0],[size*.35,-size*.3],[size,0],[size*.4,size*.27]],color,'#c4b68c',1);this.line({x:0,y:0},{x:size,y:0},'#d7c399',1);c.restore();}
 bottle(x,y,scale=1,color='#e1e8cf',angle=0){const c=this.c;c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);this.ellipse(4,3,19,7,'#18364235');this.poly([[-17,0],[-18,-43],[-8,-54],[-8,-76],[8,-76],[8,-54],[18,-43],[17,0]],color,'#a6b5a6',2);this.line({x:-8,y:-74},{x:8,y:-74},'#a46759',6);this.poly([[-15,-38],[15,-38],[15,-15],[-15,-15]],'#98b5a5','#f4ecd2',1);this.text('✦',0,-22,16,'#f2e1ad');c.restore();}
 envelope(x,y,size=28,color='#f3e1bf',symbol='♥',angle=0){const c=this.c;c.save();c.translate(x,y);c.rotate(angle);this.poly([[-size,-size*.6],[size,-size*.6],[size,size*.6],[-size,size*.6]],color,'#c4a276',2);this.path([{x:-size,y:-size*.6},{x:0,y:6},{x:size,y:-size*.6}],'#aa9375',1.5);this.text(symbol,0,8,16,'#b76665');c.restore();}
 animal(x,y,kind='rabbit',scale=1,t=0){const c=this.c;c.save();c.translate(x,y);c.scale(scale,scale);const colors={rabbit:'#e3d4b1',fox:'#c78b62',duck:'#e5c46c',bird:'#83a8a5'};const co=colors[kind]||'#d8bc84';this.ellipse(3,15,31,10,'#11213730');this.ellipse(0,0,25,18,co,'#f2d8a7',1.5);if(kind==='duck'||kind==='bird'){this.circle(19,-17,12,co,'#eedcac',1);this.poly([[27,-20],[44,-15],[28,-11]],'#c89559');this.poly([[-11,-6],[-29,-15+Math.sin(t)*4],[-22,4]],co);this.circle(22,-20,2,'#263441');}else{this.circle(20,-17,17,co,'#ebd4aa',1.5);if(kind==='rabbit'){this.ellipse(13,-40,5,19,co,'#f5e6c9');this.ellipse(27,-42,5,20,co,'#f5e6c9');}else{this.poly([[8,-25],[7,-50],[22,-31]],co);this.poly([[24,-30],[36,-47],[34,-22]],co);this.poly([[-18,8],[-50,-7],[-40,16],[-18,17]],co);this.poly([[-43,-1],[-51,-6],[-42,16],[-35,12]],'#ebd5b2');}this.circle(27,-20,2.5,'#303340');this.circle(37,-11,3,'#8b6558');this.ellipse(-10,16,10,5,co);this.ellipse(16,16,10,5,co);}c.restore();}
 arc(x,y,r,a,b,color='#f2d49b',width=4){const c=this.c;c.beginPath();c.arc(x,y,r,a,b);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
 dispose(){this.canvas.width=1;this.canvas.height=1;}
}
