import {clamp,segmentDistance,done} from '../draw.js';
const start={x:450,y:1010},flight=.92,g=540;
function throwBall(s){if(s.ball||s.cooldown>0)return;s.ball={...start,vx:(s.aim.x-start.x)/flight,vy:(s.aim.y-start.y-.5*g*flight*flight)/flight};s.throws++;s.trail=[];}
export default{
 title:'Lantern Toss',intro:'Bess has hung a tiny circus skyline from ribbons. Knock its lanterns loose and watch them tumble onto the velvet catching mat.',
 instructions:'Aim by touching or moving across the stage; release to throw. The dotted arc shows the ball’s actual flight, but the lanterns keep swinging. Arrow keys adjust aim; Space or Throw sends a ball. Clear every lantern. Unlimited practice balls, with your throw count kept.',
 levels:['Four little lanterns','The swaying skyline','The wind picks up'],actions:[{id:'throw',label:'Throw ball'}],
 create(level){return{level,t:0,aim:{x:450,y:600},ball:null,trails:[],trail:[],throws:0,cooldown:0,lanterns:Array.from({length:4+level},(_,i)=>({ax:260+(i%3)*190,ay:350+Math.floor(i/3)*220,x:0,y:0,a:0,fallen:false,vx:0,vy:0,spin:0})),note:'Lead the lantern a little.'};},
 update(s,dt,input){s.t+=dt;s.cooldown=Math.max(0,s.cooldown-dt);const dx=(input.keys.has('ArrowRight')?1:0)-(input.keys.has('ArrowLeft')?1:0),dy=(input.keys.has('ArrowDown')?1:0)-(input.keys.has('ArrowUp')?1:0);s.aim.x=clamp(s.aim.x+dx*230*dt,200,700);s.aim.y=clamp(s.aim.y+dy*230*dt,420,820);
  for(const [i,l] of s.lanterns.entries()){if(!l.fallen){l.a=Math.sin(s.t*(.65+s.level*.18)+i*1.7)*(.27+s.level*.06);l.x=l.ax+Math.sin(l.a)*130;l.y=l.ay+Math.cos(l.a)*130;}else{l.vy+=450*dt;l.x+=l.vx*dt;l.y+=l.vy*dt;l.spin+=l.vx*.006*dt;if(l.y>1065){l.y=1065;l.vy=-Math.abs(l.vy)*.28;l.vx*=.7;}l.x=clamp(l.x,200,700);}}
  if(s.ball){const p=s.ball,old={x:p.x,y:p.y};p.vy+=g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;s.trail.push({...p});if(s.trail.length>30)s.trail.shift();const hit=s.lanterns.find(l=>!l.fallen&&segmentDistance(l,old,p)<42);if(hit){hit.fallen=true;hit.vx=p.vx*.35;hit.vy=-80;p.vx*=-.45;p.vy*=.15;s.note='Down it comes!';if(s.lanterns.every(l=>l.fallen))s.cooldown=1.4;}if(p.y>1090||p.y<300||p.x<150||p.x>750)s.ball=null;}
  if(s.lanterns.every(l=>l.fallen)&&s.cooldown===0)done(s,'The lanterns have landed',s.lanterns.length+' lanterns in '+s.throws+' throws. Bess is already tying the next ribbons.');},
 pointer(s,type,p){if(type==='move'||type==='down')s.aim={x:clamp(p.x,200,700),y:clamp(p.y,420,820)};if(type==='up')throwBall(s);},
 action(s,id){if(id==='throw')throwBall(s);},key(s,k,down){if(k===' '&&down)throwBall(s);},
 draw(s,d){d.ellipse(450,1080,255,25,'#a8757277','#ceaa78',2);for(const l of s.lanterns){if(!l.fallen){d.line({x:l.ax,y:l.ay},{x:l.x,y:l.y},'#836a48',3);d.ring(l.ax,l.ay,7);}const c=d.c;c.save();c.translate(l.x,l.y);c.rotate(l.fallen?l.spin:l.a);d.glow(0,0,48,'#eebf6c');d.poly([[-27,-31],[27,-31],[32,24],[18,37],[-18,37],[-32,24]],'#bd7957','#f2cd80',3);for(const x of [-14,0,14])d.line({x,y:-29},{x,y:27},'#f4d699',2);d.star(0,0,15,'#efd698');d.ring(0,-41,10);c.restore();}
  d.path(s.trail,'#f8e6bd88',4);if(s.ball)d.ball(s.ball.x,s.ball.y,15,'#b57b59');else{const vx=(s.aim.x-450)/flight,vy=(s.aim.y-1010-.5*g*flight*flight)/flight;for(let i=1;i<15;i++){const t=i*flight/14;d.circle(450+vx*t,1010+vy*t+.5*g*t*t,2.5,'#805946aa');}d.ball(450,1010,19,'#bc6f55');d.ring(s.aim.x,s.aim.y,19,'#a97950',2);}},
 readout:s=>s.lanterns.filter(l=>l.fallen).length+' / '+s.lanterns.length+' lanterns · '+s.throws+' throws · '+s.note
};
