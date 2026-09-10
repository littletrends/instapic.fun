import {clamp,dist,done,segmentDistance} from '../draw.js';
const origin={x:450,y:1000},symbols=['♥','★','☾'];
function launch(s){if(s.flying)return;const pull={x:origin.x-s.aim.x,y:origin.y-s.aim.y};s.plane={...origin,vx:clamp(pull.x*3,-280,280),vy:clamp(pull.y*3,-720,-400)};s.flying=true;s.drag=false;s.trail=[];s.shots++;}
function reset(s,note){s.flying=false;s.plane={...origin,vx:0,vy:0};s.aim={x:450,y:1170};s.note=note;}
export default{
 title:'Lost Letter Express',intro:'Willa’s mail takes the scenic route. Fold it, catch a breeze, and send a little secret across the rooftops.',
 instructions:'Pull the letter back from its launch perch and release. Match its seal to a letterbox. While flying, hold Left or Right to trim the wings. Keyboard arrows steer; Space launches. The coloured wind ribbons show the breeze. Missed letters come back to you.',
 levels:['The morning post','Crosswinds','The late-night express'],actions:[{id:'left',label:'Trim left',hold:true},{id:'launch',label:'Launch letter'},{id:'right',label:'Trim right',hold:true}],
 create(level){return{level,t:0,plane:{...origin,vx:0,vy:0},aim:{x:450,y:1170},drag:false,flying:false,delivered:0,shots:0,trail:[],wind:0,boxes:[250,450,650].map((x,i)=>({x,y:450,symbol:symbols[i]})),note:'First seal: a heart.'};},
 update(s,dt,input){s.t+=dt;s.wind=Math.sin(s.t*.65)*(18+s.level*17);s.boxes.forEach((b,i)=>{b.y=450+Math.sin(s.t*.7+i)*s.level*15;});if(!s.flying){if(input.keys.has('ArrowLeft'))s.aim.x=clamp(s.aim.x+120*dt,355,545);if(input.keys.has('ArrowRight'))s.aim.x=clamp(s.aim.x-120*dt,355,545);return;}
  const p=s.plane,old={x:p.x,y:p.y},trim=(input.actions.has('right')||input.keys.has('ArrowRight')?1:0)-(input.actions.has('left')||input.keys.has('ArrowLeft')?1:0);p.vx+=(s.wind+trim*120)*dt;p.vy+=75*dt;p.vx*=Math.exp(-.1*dt);p.x+=p.vx*dt;p.y+=p.vy*dt;s.trail.push({x:p.x,y:p.y});if(s.trail.length>65)s.trail.shift();
  const hit=s.boxes.findIndex(b=>segmentDistance(b,old,p)<43);if(hit>=0){if(hit===s.delivered){s.delivered++;if(s.delivered===3){done(s,'Every little secret found a home','Three signed-and-sealed deliveries in '+s.shots+' flights. Willa is keeping the contents to herself.');return;}reset(s,'Delivered. Now follow the '+symbols[s.delivered]+' seal.');}else reset(s,'Wrong letterbox — that secret belongs elsewhere.');}else if(p.x<165||p.x>735||p.y<340||p.y>1090)reset(s,'The breeze brought it back. Adjust your angle or trim the wings.');},
 pointer(s,type,p){if(s.flying)return;if(type==='down'&&dist(p,origin)<85)s.drag=true;if(type==='move'&&s.drag)s.aim={x:clamp(p.x,350,550),y:clamp(p.y,1100,1200)};if(type==='up'&&s.drag)launch(s);if(type==='cancel')s.drag=false;},
 action(s,id){if(id==='launch')launch(s);},key(s,k,down){if(k===' '&&down)launch(s);},
 draw(s,d){for(const [i,b] of s.boxes.entries()){d.poly([[b.x-47,b.y+55],[b.x-47,b.y-35],[b.x,b.y-70],[b.x+47,b.y-35],[b.x+47,b.y+55]],i<s.delivered?'#9bab94':'#b79bb8','#ecd5a6',3);d.ellipse(b.x,b.y,31,10,'#655477','#e2c7aa',2);d.text(b.symbol,b.x,b.y-25,27,'#fff1d2');if(i===s.delivered)d.glow(b.x,b.y,55,'#ffe2a8');}
  for(let i=0;i<5;i++){const x=300+i*65,y=690+Math.sin(s.t+i)*20;d.path([{x:x-s.wind,y},{x,y:y-8},{x:x+s.wind,y}],'#9d829e88',3);}
  d.path(s.trail,'#fff3d488',2);d.ellipse(origin.x,origin.y+35,65,17,'#9f899e','#ecd5b0',3);
  if(!s.flying){d.line(origin,s.aim,'#805c83',4);const vx=clamp((450-s.aim.x)*3,-280,280),vy=clamp((1000-s.aim.y)*3,-720,-400);for(let i=1;i<12;i++){const t=i*.06;d.circle(450+vx*t,1000+vy*t+37.5*t*t,2.5,'#fff1cf');}}
  const p=s.plane,c=d.c;c.save();c.translate(p.x,p.y);c.rotate(s.flying?Math.atan2(p.vy,p.vx)+Math.PI/2:0);d.poly([[0,-33],[-28,25],[0,12],[28,25]],'#f4e7c8','#ba9f8d',2);d.poly([[0,-33],[0,12],[10,18]],'#d3c5b4');d.text(symbols[s.delivered]||'♥',0,5,14,'#bd768f');c.restore();},
 readout:s=>s.delivered+' / 3 delivered · Breeze '+(s.wind<0?'←':'→')+' · '+s.note
};
