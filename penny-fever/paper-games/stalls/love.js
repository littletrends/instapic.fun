import {clamp,done} from '../draw.js';
function rewind(s){s.attached=true;s.angle=-1.02;s.omega=0;s.trail=[];s.wait=0;s.x=450+Math.sin(s.angle)*255;s.y=400+Math.cos(s.angle)*255;}
function release(s){if(!s.attached||s.wait)return;s.attached=false;s.vx=Math.cos(s.angle)*255*s.omega;s.vy=-Math.sin(s.angle)*255*s.omega;s.shots++;}
export default{
 title:'Heartstrings',intro:'Rosalie’s tiny theatre runs on impossible leaps of affection. Set a little paper heart swinging, then let it go into the waiting ribbon nest.',
 instructions:'The heart swings on a real pendulum. Tap the stage or Release to let go; Space works too. Aim for the open golden nest below. Arrow buttons gently pump the swing. Watch the short dotted flight forecast. Misses simply rewind the ribbon — no lives or payment lost.',
 levels:['First flutter','A change of heart','Hearts on the breeze'],
 actions:[{id:'left',label:'Lean left',hold:true},{id:'release',label:'Release heart'},{id:'right',label:'Lean right',hold:true}],
 create(level){const s={level,t:0,caught:0,shots:0,wait:0,x:0,y:0,vx:0,vy:0,basket:{x:640,y:875},note:'Let the ribbon swing.'};rewind(s);return s;},
 update(s,dt,input){s.t+=dt;const dir=s.caught%2? -1:1;s.basket.x=450+dir*(160+s.level*10)+Math.sin(s.t*.75)*s.level*24;s.basket.y=875-Math.sin(s.t*.5)*s.level*15;
  if(s.wait){s.wait-=dt;if(s.wait<=0)rewind(s);return;}
  if(s.attached){const pump=(input.actions.has('right')||input.keys.has('ArrowRight')?1:0)-(input.actions.has('left')||input.keys.has('ArrowLeft')?1:0);s.omega+=(-2.2*Math.sin(s.angle)+pump*.7)*dt;s.omega*=Math.exp(-.006*dt);s.omega=clamp(s.omega,-2.3,2.3);s.angle+=s.omega*dt;s.x=450+Math.sin(s.angle)*255;s.y=400+Math.cos(s.angle)*255;
  }else{const oldY=s.y;s.vx+=Math.sin(s.t*.7)*s.level*15*dt;s.vy+=460*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.trail.push({x:s.x,y:s.y});if(s.trail.length>25)s.trail.shift();
   if(oldY<s.basket.y&&s.y>=s.basket.y&&s.vy>0&&Math.abs(s.x-s.basket.x)<55-s.level*5){s.caught++;s.note='Caught! The next nest is on the other side.';if(s.caught===3){done(s,'Three little leaps of faith','Three hearts delivered in '+s.shots+' releases. Rosalie would call that a connection.');return;}s.wait=.8;}
   else if(s.y>1090||s.x<140||s.x>760){s.note='The ribbon caught you. Try releasing a little earlier or later.';s.wait=.6;}
  }},
 pointer(s,type){if(type==='down')release(s);},action(s,id){if(id==='release')release(s);},key(s,key,down){if(down&&key===' ')release(s);},
 draw(s,d){d.line({x:245,y:398},{x:655,y:398},'#9e665e',12);d.line({x:245,y:391},{x:655,y:391},'#e7b482',3);d.ring(450,400,14);
  if(s.attached){d.line({x:450,y:400},{x:s.x,y:s.y},'#6d4356',8);d.line({x:448,y:400},{x:s.x-2,y:s.y},'#efb6b6',4);let x=s.x,y=s.y,vx=Math.cos(s.angle)*255*s.omega,vy=-Math.sin(s.angle)*255*s.omega;for(let i=0;i<15;i++){vy+=460*.035;x+=vx*.035;y+=vy*.035;d.circle(x,y,2.3,'#f7e3b894');}}
  d.path(s.trail,'#f7ccbf88',4);d.glow(s.basket.x,s.basket.y,70,'#ffdca5');d.poly([[s.basket.x-57,s.basket.y],[s.basket.x-38,s.basket.y+44],[s.basket.x+38,s.basket.y+44],[s.basket.x+57,s.basket.y]],'#b77774','#edc993',3);d.ellipse(s.basket.x,s.basket.y,57,15,'#653c4c','#efd3a3',4);d.heart(s.basket.x,s.basket.y+27,12,'#ecc8a0');d.heart(s.x,s.y,22,'#c95c79');d.heart(s.x-5,s.y-4,8,'#e991a4');for(let i=0;i<3;i++)d.heart(410+i*40,1030,13,i<s.caught?'#e9c181':'#9b6a79');},
 readout:s=>s.caught+' / 3 hearts delivered · '+s.note
};
