import {clamp,segmentDistance,done,TAU} from '../draw.js';
function throwBall(s){if(s.ball||s.dunk>=0)return;const t=.85;s.ball={x:450,y:1050,vx:(s.aim.x-450)/t,vy:(s.aim.y-1050-250*t*t)/t};s.throws++;}
export default{
 title:'Splashworks',intro:'Duncan’s bravest wind-up duck is on the seat today. Release the three brass latches and give it the most unnecessarily theatrical bath in the carnival.',
 instructions:'Aim and release a ball at the glowing latch. Each hit releases the next one. The third opens the seat. Arrows aim, Space throws. Later chapters add moving latches and a swinging guard. No one gets hurt: the duck is a willing clockwork volunteer.',
 levels:['The volunteer’s first bath','Three restless latches','Mind the swinging guard'],actions:[{id:'throw',label:'Throw at the latch'}],
 create(level){return{level,t:0,aim:{x:265,y:690},ball:null,throws:0,hit:0,dunk:-1,latches:[{bx:265,by:690,x:265,y:690},{bx:640,by:675,x:640,y:675},{bx:580,by:465,x:580,y:465}],guard:{x:450,y:865},note:'The first brass latch is glowing.'};},
 update(s,dt,input){s.t+=dt;s.latches.forEach((a,i)=>{a.x=a.bx+Math.sin(s.t*(.6+s.level*.12)+i)*s.level*21;a.y=a.by+Math.cos(s.t*.5+i)*s.level*11;});s.guard.x=450+Math.sin(s.t*1.1)*155;
  if(s.dunk>=0){s.dunk+=dt;if(s.dunk>2.7)done(s,'A magnificently unnecessary splash','Three latches released in '+s.throws+' throws. The wind-up duck would like another go.');return;}
  const dx=(input.keys.has('ArrowRight')?1:0)-(input.keys.has('ArrowLeft')?1:0),dy=(input.keys.has('ArrowDown')?1:0)-(input.keys.has('ArrowUp')?1:0);s.aim.x=clamp(s.aim.x+dx*210*dt,210,690);s.aim.y=clamp(s.aim.y+dy*210*dt,410,820);
  if(s.ball){const p=s.ball,old={x:p.x,y:p.y};p.vy+=500*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(s.level===2&&segmentDistance(s.guard,old,p)<43){p.vx=(p.x<s.guard.x?-1:1)*190;p.vy=Math.abs(p.vy)*.4;s.note='The guard caught it. Wait for a clear lane.';}const target=s.latches[s.hit];if(target&&segmentDistance(target,old,p)<37-s.level*3){s.hit++;s.ball=null;s.note='Latch released.';if(s.hit===3)s.dunk=0;}else if(p.y>1110||p.y<320||p.x<150||p.x>750)s.ball=null;}},
 pointer(s,type,p){if(type==='move'||type==='down')s.aim={x:clamp(p.x,210,690),y:clamp(p.y,410,820)};if(type==='up')throwBall(s);},action(s,id){if(id==='throw')throwBall(s);},key(s,k,down){if(k===' '&&down)throwBall(s);},
 draw(s,d){const c=d.c;d.poly([[342,810],[342,915],[558,915],[558,810]],'#508b89','#d4b987',4);d.ellipse(450,810,108,38,'#49847f','#e4c48d',6);d.line({x:363,y:795},{x:363,y:535},'#b79b6d',8);d.line({x:537,y:795},{x:537,y:535},'#b79b6d',8);d.line({x:365,y:535},{x:535,y:535},'#dfc28b',5);
  const a=s.dunk<0?0:Math.min(1.5,s.dunk*4);d.line({x:395,y:635},{x:395+Math.cos(a)*108,y:635+Math.sin(a)*108},'#af8057',14);
  const y=s.dunk<0?610:s.dunk<.65?610+420*s.dunk*s.dunk:770+Math.sin(s.dunk*5)*5;c.save();c.beginPath();c.rect(300,400,300,420);c.clip();d.animal(450,y,'duck',1.65,s.t);d.ring(450,y+10,28,'#e7c786',8);c.restore();
  d.ellipse(450,817,104,24,'#70bab988');for(let i=0;i<8;i++)d.line({x:355+i*27,y:837},{x:355+i*27,y:909},'#91bdaf44',2);
  for(const [i,l] of s.latches.entries()){d.path([{x:l.x,y:l.y},{x:l.x,y:745},{x:360,y:745}],i<s.hit?'#eacb85':'#997b55',4);if(i===s.hit)d.glow(l.x,l.y,50,'#e9c787');d.circle(l.x,l.y,33,i<s.hit?'#b9b985':'#ba6c59','#ead0a0',4);d.circle(l.x,l.y,18,null,'#f2d8aa',4);d.circle(l.x,l.y,6,'#eee0b0');}
  if(s.level===2){d.line({x:450,y:735},s.guard,'#c0a16e',3);d.ring(s.guard.x,s.guard.y,32,'#bc7769',13);}
  if(s.dunk>.65){const t=s.dunk-.65;for(let i=0;i<18;i++){const angle=i*TAU/18,x=450+Math.cos(angle)*130*t,y=800-220*t+220*t*t+Math.sin(angle)*50*t;if(y<930)d.poly([[x,y-8],[x+5,y+4],[x-5,y+4]],'#caeeea','#f6f2c4',1);}}
  if(s.ball)d.ball(s.ball.x,s.ball.y,16,'#b49169');else if(s.dunk<0){d.ball(450,1050,19,'#c0a275');d.ring(s.aim.x,s.aim.y,17,'#af8056',2);}},
 readout:s=>s.hit+' / 3 latches · '+s.throws+' throws · '+s.note
};
