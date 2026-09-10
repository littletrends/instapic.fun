import {clamp,dist,done} from '../draw.js';
function tap(s){if(!s.coin){s.coin={x:450,y:1000,z:10,vz:130,vx:0,touch:0,skips:0};s.hits=0;s.wells.forEach(w=>w.hit=false);s.runs++;s.note='Watch the penny meet its shadow.';}s.lastTap=s.t;}
function sink(s,note){s.ripples.push({x:s.coin.x,y:s.coin.y,t:0});s.coin=null;s.note=note;}
export default{
 title:'Wishing Wells',intro:'Penelope knows a penny can do more than fall. Keep yours dancing over the water, from one little wishing ring to the next.',
 instructions:'Send a penny, then tap Skip as it meets the water. The penny and its shadow come together at that moment. Hold Left/Right to steer between the rings. Space sends/skips too. Touch gives a short forgiving window. Three rings in one run; retries are free.',
 levels:['Three straight wishes','A wandering wish','Ripples after dark'],actions:[{id:'left',label:'Steer left',hold:true},{id:'skip',label:'Send / Skip · Space'},{id:'right',label:'Steer right',hold:true}],
 create(level){const xs=level===0?[450,450,450]:level===1?[350,520,420]:[560,380,520];return{level,t:0,lastTap:-9,coin:null,hits:0,runs:0,ripples:[],wells:xs.map((x,i)=>({base:x,x,y:840-i*155,hit:false})),note:'Three wishes wait on the water.'};},
 update(s,dt,input){s.t+=dt;for(const [i,w] of s.wells.entries())w.x=w.base+(s.level===2?Math.sin(s.t*.5+i)*17:0);for(const r of s.ripples)r.t+=dt;s.ripples=s.ripples.filter(r=>r.t<1.2);if(!s.coin)return;const c=s.coin,axis=(input.actions.has('right')||input.keys.has('ArrowRight')?1:0)-(input.actions.has('left')||input.keys.has('ArrowLeft')?1:0);c.vx+=(axis*200-c.vx)*Math.min(1,dt*5);
  if(c.touch>0){if(s.t-s.lastTap<.25){c.touch=0;c.vz=130;c.z=1;c.skips++;s.lastTap=-9;s.note='A clean little skip.';}else{c.touch-=dt;if(c.touch<=0){sink(s,'It sank gently. Tap a little closer to the water next run.');return;}}}
  else{c.x=clamp(c.x+c.vx*dt,200,700);c.y-=155*dt;c.vz-=260*dt;c.z+=c.vz*dt;if(c.z<=0){c.z=0;c.touch=.23;s.ripples.push({x:c.x,y:c.y,t:0});const w=s.wells[s.hits];if(w&&dist(c,w)<59-s.level*4){w.hit=true;s.hits++;if(s.hits===3){done(s,'Three wishes in a single silver ripple','All three rings reached in one run. '+s.runs+' practice runs, and Penelope kept every wish a secret.');return;}}else s.note='That bounce missed a ring. Keep going, or send a fresh penny after this run.';}}
  if(c.y<360||c.skips>5)sink(s,'The penny reached the far bank. Try a fresh run through all three rings.');},
 pointer(s,type){if(type==='down')tap(s);},action(s,id){if(id==='skip')tap(s);},key(s,k,down){if(k===' '&&down)tap(s);},
 draw(s,d){for(const [i,w] of s.wells.entries()){d.ellipse(w.x,w.y+6,62,41,'#1d555544');d.ellipse(w.x,w.y,62,40,null,w.hit?'#f4d990':'#bd9768',6);d.ellipse(w.x,w.y,49,30,null,'#e7d0a0',1);d.text(w.hit?'✓':i+1,w.x,w.y+7,22,'#f9e4b4');if(i===s.hits)d.glow(w.x,w.y,65,'#ecd19a');}
  for(const r of s.ripples)d.ellipse(r.x,r.y,12+r.t*70,7+r.t*40,null,'#e5f4db88',2);const c=s.coin;if(c){d.ellipse(c.x,c.y+5,19,7,'#164b5555');d.ellipse(c.x,c.y-c.z,17,6+Math.abs(Math.cos(s.t*14))*8,'#d5b077','#f6d995',2);d.star(c.x,c.y-c.z,7,'#f6dfa1');if(c.touch)d.text('SKIP',c.x,c.y+49,18,'#fff0b8');}else d.ring(450,1025,23,'#e6c48b',9);},
 readout:s=>s.hits+' / 3 wishing rings · '+s.runs+' runs · '+s.note
};
