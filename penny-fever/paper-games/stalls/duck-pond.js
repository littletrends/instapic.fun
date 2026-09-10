import {clamp,dist,lerp,done,TAU} from '../draw.js';
const home={x:450,y:1040};
function behind(path,distance){for(let i=path.length-1;i>0;i--){const a=path[i],b=path[i-1],dd=dist(a,b);if(distance<=dd){const t=distance/(dd||1);return{x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t)};}distance-=dd;}return path[0];}
function move(s,p,q,speed,dt){const dd=dist(p,q);if(dd<1)return;const step=Math.min(dd,speed*dt),nx=p.x+(q.x-p.x)/dd*step,ny=p.y+(q.y-p.y)/dd*step;if(!s.lilies.some(l=>Math.hypot(nx-l.x,p.y-l.y)<l.r+17))p.x=clamp(nx,200,700);if(!s.lilies.some(l=>Math.hypot(p.x-l.x,ny-l.y)<l.r+17))p.y=clamp(ny,390,1060);}
export default{
 title:'Duckling Parade',intro:'Dottie’s ducklings went exploring. Find them, make a little rippling parade and bring everyone back to the lantern landing.',
 instructions:'Tap the water to lead the mother duck, or use arrows/the four buttons. Swim close to each duckling to collect it. They follow your travelled path around the lilies. After gathering everyone, return to the glowing landing at the bottom and wait for the last little tail.',
 levels:['Four little wanderers','Around the lily islands','The grand duck parade'],actions:[{id:'left',label:'←',hold:true},{id:'up',label:'↑',hold:true},{id:'down',label:'↓',hold:true},{id:'right',label:'→',hold:true},{id:'stop',label:'Wait here'}],
 create(level){const spots=[[260,900],[640,790],[270,540],[640,440],[460,430],[650,960]],lilies=[{x:460,y:760,r:61},{x:410,y:525,r:45}];if(level>0)lilies.push({x:600,y:640,r:40});if(level>1)lilies.push({x:275,y:725,r:32});return{level,t:0,p:{...home},target:{...home},path:[{...home}],ducks:spots.slice(0,4+level).map(([x,y])=>({x,y,joined:false,order:0,face:1})),lilies,joined:0,docking:false,face:1};},
 update(s,dt,input){s.t+=dt;const dx=(input.keys.has('ArrowRight')||input.actions.has('right')?1:0)-(input.keys.has('ArrowLeft')||input.actions.has('left')?1:0),dy=(input.keys.has('ArrowDown')||input.actions.has('down')?1:0)-(input.keys.has('ArrowUp')||input.actions.has('up')?1:0);if(dx||dy)s.target={x:s.p.x+dx*70,y:s.p.y+dy*70};const oldX=s.p.x;move(s,s.p,s.target,145,dt);if(Math.abs(s.p.x-oldX)>.1)s.face=s.p.x>oldX?1:-1;if(dist(s.path[s.path.length-1],s.p)>4){s.path.push({...s.p});if(s.path.length>1400)s.path.shift();}
  for(const a of s.ducks)if(!a.joined&&dist(a,s.p)<54){a.joined=true;a.order=++s.joined;}
  s.docking=s.joined===s.ducks.length&&dist(s.p,home)<85;
  for(const a of s.ducks)if(a.joined){const target=s.docking?{x:home.x+Math.cos(a.order*TAU/s.ducks.length)*45,y:home.y+Math.sin(a.order*TAU/s.ducks.length)*28}:behind(s.path,a.order*34);const ox=a.x;move(s,a,target,190,dt);if(Math.abs(a.x-ox)>.1)a.face=a.x>ox?1:-1;}
  if(s.docking&&s.ducks.every(a=>dist(a,home)<85))done(s,'Every duckling home','One mother duck, '+s.ducks.length+' little explorers, and a very happy Dottie.');},
 pointer(s,type,p){if(type==='down'||type==='move'&&s.drag){s.target={x:clamp(p.x,200,700),y:clamp(p.y,390,1060)};}if(type==='down')s.drag=true;if(type==='up'||type==='cancel')s.drag=false;},
 action(s,id){if(id==='stop')s.target={...s.p};},
 draw(s,d){for(const l of s.lilies){d.ellipse(l.x+5,l.y+8,l.r,l.r*.75,'#204e4c44');d.ellipse(l.x,l.y,l.r,l.r*.76,'#6f9c74','#b7c58d',2);for(let i=0;i<7;i++)d.line({x:l.x,y:l.y},{x:l.x+Math.cos(i*TAU/7)*l.r*.9,y:l.y+Math.sin(i*TAU/7)*l.r*.67},'#a3ba8b',1);d.poly([[l.x,l.y],[l.x+l.r,l.y-10],[l.x+l.r,l.y+18]],'#70bcb5',null);d.star(l.x-10,l.y-9,17,'#ead1b1');}
  if(s.joined===s.ducks.length){d.glow(home.x,home.y,90,'#ffe6a4');d.ellipse(home.x,home.y,85,50,null,'#fff0b3',3);}d.ellipse(s.target.x,s.target.y,12+Math.sin(s.t*3)*3,8,null,'#f2e9bc99',2);d.path(s.path.slice(-55),'#e4f4dc55',3);
  for(const a of [...s.ducks,{...s.p,face:s.face,mother:true}]){d.ellipse(a.x-5,a.y+12,28,10,null,'#e3f4e0aa',2);const c=d.c;c.save();c.translate(a.x,a.y+Math.sin(s.t*3+a.x)*2);c.scale(a.face,1);d.animal(0,0,'duck',a.mother?1.15:.75,s.t);c.restore();if(!a.mother&&!a.joined)d.text('…',a.x,a.y-35,23,'#fff1ba');}},
 readout:s=>s.joined+' / '+s.ducks.length+' ducklings following · '+(s.joined===s.ducks.length?'Back to the bottom landing':'Find every little wanderer')
};
