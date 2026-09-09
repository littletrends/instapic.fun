import {clamp,done} from '../draw.js';
const radius=23;
function drop(s){if(s.ammo<=0||s.cooldown>0)return;s.ammo--;s.cooldown=.5;s.coins.push({x:s.aim,y:430,vx:0,vy:140,age:0});if(s.ammo===0)s.settle=7;}
export default{
 title:'Copper Falls',intro:'A little mechanical tide of pressed pennies. Choose where a coin enters the tray, wait for the brass shelf, and make a chain reaction.',
 instructions:'Move the chute left or right, then tap/release or press Drop. Arrows choose the chute and Space drops. The shelf pushes real colliding discs. Each chapter starts with a fixed free practice tray; its score never enters your wallet. After the last penny, the tray has seven seconds to settle.',
 levels:['The copper tide','Narrow channels','The crowded mint'],actions:[{id:'drop',label:'Drop practice penny'}],
 create(level,rng){const coins=[];for(let r=0;r<7;r++)for(let c=0;c<9;c++)coins.push({x:244+c*49+(r%2?11:0)+(rng()-.5)*3,y:660+r*49,vx:0,vy:0,age:1});return{level,t:0,coins,aim:450,ammo:18+level*3,total:18+level*3,score:0,pusher:540,cooldown:0,settle:0,falling:[]};},
 update(s,dt,input){s.t+=dt;s.cooldown=Math.max(0,s.cooldown-dt);const axis=(input.keys.has('ArrowRight')?1:0)-(input.keys.has('ArrowLeft')?1:0);s.aim=clamp(s.aim+axis*230*dt,248,652);s.pusher=550+Math.sin(s.t*1.55)*65;
  // Small bounded disc solver: at most 87 pennies; no unbounded spawn or bank writes.
  for(let step=0;step<3;step++){const h=dt/3;for(const c of s.coins){c.age+=h;c.x+=c.vx*h;c.y+=c.vy*h;c.vx*=Math.exp(-3*h);c.vy*=Math.exp(-3*h);if(c.y<s.pusher+radius){c.y=s.pusher+radius;c.vy=Math.max(c.vy,90*Math.max(0,Math.cos(s.t*1.55)));}if(c.x<236){c.x=236;c.vx=Math.abs(c.vx)*.2;}if(c.x>664){c.x=664;c.vx=-Math.abs(c.vx)*.2;}}
   for(let pass=0;pass<3;pass++)for(let i=0;i<s.coins.length;i++)for(let j=i+1;j<s.coins.length;j++){const a=s.coins[i],b=s.coins[j],dx=b.x-a.x,dy=b.y-a.y,dd=Math.hypot(dx,dy);if(dd>=radius*2)continue;const nx=dd?dx/dd:1,ny=dd?dy/dd:0,overlap=radius*2-dd;a.x-=nx*overlap*.5;a.y-=ny*overlap*.5;b.x+=nx*overlap*.5;b.y+=ny*overlap*.5;const relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(relative<0){const impulse=-relative*.55;a.vx-=nx*impulse;a.vy-=ny*impulse;b.vx+=nx*impulse;b.vy+=ny*impulse;}}
  }
  s.coins=s.coins.filter(c=>{if(c.y>1000){s.score++;s.falling.push({...c,vy:80,t:0});return false;}return true;});
  for(const c of s.falling){c.t+=dt;c.vy+=500*dt;c.y+=c.vy*dt;}s.falling=s.falling.filter(c=>c.y<1160);
  if(s.ammo===0){s.settle-=dt;if(s.settle<=0)done(s,'The mint has settled',s.score+' pennies crossed the lip from '+s.total+' practice drops. This is a local workshop score, not wallet winnings.');}},
 pointer(s,type,p){if(type==='move'||type==='down')s.aim=clamp(p.x,248,652);if(type==='up')drop(s);},action(s,id){if(id==='drop')drop(s);},key(s,k,down){if(k===' '&&down)drop(s);},
 draw(s,d){d.poly([[213,420],[687,420],[687,1010],[213,1010]],'#475844a0','#d1ad68',4);for(const x of [216,684]){d.line({x,y:425},{x,y:1010},'#715d3e',17);d.line({x:x-3,y:425},{x:x-3,y:1010},'#ebc98b',3);}d.poly([[234,435],[666,435],[666,s.pusher],[234,s.pusher]],'#a47b4a','#e3c286',3);d.line({x:238,y:s.pusher},{x:662,y:s.pusher},'#f0d18f',9);d.ellipse(450,1100,225,45,'#564b39','#c5a369',5);
  for(const c of [...s.coins,...s.falling]){d.ellipse(c.x+3,c.y+5,radius,radius*.8,'#2c302950');d.circle(c.x,c.y,radius,'#b68445','#f3d799',3);d.circle(c.x,c.y,radius-6,null,'#d4b577',1);d.star(c.x,c.y,11,'#eccb85');}
  d.poly([[s.aim-25,380],[s.aim+25,380],[s.aim+17,435],[s.aim-17,435]],'#897450','#ead097',3);d.text('↓',s.aim,418,26);d.text('PRACTICE TRAY',450,1147,15,'#e5cb8f');},
 readout:s=>s.ammo+' / '+s.total+' practice pennies left · '+s.score+' over the lip'+(s.ammo===0?' · settling '+Math.max(0,Math.ceil(s.settle))+'s':'')
};
