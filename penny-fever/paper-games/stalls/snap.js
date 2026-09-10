import {clamp,dist,done} from '../draw.js';
const kinds=['rabbit','fox','bird'];
function shutter(s){if(!s.holding)return;s.holding=false;s.shots++;s.flash=.2;const target=s.animals[s.album.length],inside=target&&Math.abs(target.x-s.camera.x)<83&&Math.abs(target.y-s.camera.y)<57;
 if(inside&&s.focus>.68){const quality=Math.round(65+s.focus*20+(1-dist(target,s.camera)/110)*15);s.album.push({kind:target.kind,quality});s.note='A lovely '+target.kind+' portrait — '+quality+'/100.';if(s.album.length===3)done(s,'Three tiny lives, beautifully caught','Your little field album scores '+Math.round(s.album.reduce((a,p)=>a+p.quality,0)/3)+'/100. '+s.shots+' shutter releases.');}
 else s.note=inside?'Nearly! Hold a little steadier until the focus ring turns green.':'The subject slipped out of the frame. There is always another moment.';s.focus=0;
}
export default{
 title:'Paper Safari',intro:'Felix has built a woodland that fits inside his camera. Its inhabitants never quite stand still. Your job is to notice the lovely little moments.',
 instructions:'Move the frame with the pointer or arrow keys. Hold on the stage (or hold Focus) to steady the lens; release to take the photo. Keep the requested animal fully inside the frame until the focus ring is green. Space focuses while held and releases the shutter when lifted.',
 levels:['A quiet morning','The busy afternoon','Twilight visitors'],actions:[{id:'focus',label:'Hold focus · release shutter',hold:true}],
 create(level){return{level,t:0,camera:{x:450,y:700},animals:kinds.map((kind,i)=>({kind,x:450,y:500+i*170})),focus:0,holding:false,shots:0,album:[],flash:0,note:'First portrait: the rabbit.'};},
 update(s,dt,input){s.t+=dt;s.flash=Math.max(0,s.flash-dt);const rate=.28+s.level*.1;s.animals.forEach((a,i)=>{a.x=450+Math.sin(s.t*rate+i*2.2)*210;a.y=490+i*180+Math.sin(s.t*.6+i)*30;});const dx=(input.keys.has('ArrowRight')?1:0)-(input.keys.has('ArrowLeft')?1:0),dy=(input.keys.has('ArrowDown')?1:0)-(input.keys.has('ArrowUp')?1:0);s.camera.x=clamp(s.camera.x+dx*220*dt,250,650);s.camera.y=clamp(s.camera.y+dy*220*dt,420,950);const target=s.animals[s.album.length];const inside=target&&Math.abs(target.x-s.camera.x)<80&&Math.abs(target.y-s.camera.y)<55;s.focus=clamp(s.focus+(s.holding&&inside?.85:-1.5)*dt,0,1);},
 pointer(s,type,p){if(type==='cancel'){s.holding=false;s.focus=0;return;}if(type==='down'||type==='move'){const delta=dist(s.camera,p);s.camera.x=clamp(p.x,250,650);s.camera.y=clamp(p.y,420,950);if(delta>30)s.focus*=.7;}if(type==='down')s.holding=true;if(type==='up')shutter(s);},
 action(s,id,down){if(id==='focus'){if(down)s.holding=true;else shutter(s);}},key(s,key,down){if(key===' '){if(down)s.holding=true;else shutter(s);}},
 draw(s,d){for(const [i,a] of s.animals.entries()){d.animal(a.x,a.y,a.kind,1.6,s.t*6);if(i===s.album.length){d.star(a.x,a.y-85,10,'#e8c776');d.text('NEXT',a.x,a.y-103,14,'#3c6253');}}
  const p=s.camera,c=d.c;c.save();c.strokeStyle=s.focus>.68?'#bff4c4':'#fff0c9';c.lineWidth=3;c.strokeRect(p.x-106,p.y-80,212,160);for(const x of [-35,35])d.line({x:p.x+x,y:p.y-75},{x:p.x+x,y:p.y+75},'#f8e3b577',1);d.line({x:p.x-100,y:p.y},{x:p.x+100,y:p.y},'#f8e3b577',1);d.arc(p.x,p.y,31,-Math.PI/2,-Math.PI/2+s.focus*Math.PI*2,s.focus>.68?'#bff4c4':'#f1dba3',4);c.restore();
  for(let i=0;i<3;i++){const x=330+i*120;d.poly([[x-48,1010],[x+48,1010],[x+48,1120],[x-48,1120]],'#e4d5b3','#bca573',2);if(s.album[i]){d.animal(x,1060,s.album[i].kind,.7,s.t);d.text(s.album[i].quality,x,1106,16,'#485345');}else d.text('?',x,1070,28,'#85836b');}
  if(s.flash>0){c.fillStyle='#fffbe022';c.fillRect(0,0,900,1200);}},
 readout:s=>'Find: '+(kinds[s.album.length]||'album complete')+' · Focus '+Math.round(s.focus*100)+'% · '+s.note
};
