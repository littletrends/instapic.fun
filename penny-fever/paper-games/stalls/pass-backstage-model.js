import {base,copy,validate,remember,undo as rewind,clamp,ease} from './study-state.js?v=studies-six-1';
const flat=(x,y,w,extra={})=>({x,y,w,...extra});
const LEGACY_LEVELS=[
 {name:'Three invitations before curtain',width:1420,platforms:[flat(0,430,250),flat(180,350,160,{seal:true}),flat(360,430,230,{checkpoint:true}),flat(510,345,150,{seal:true}),flat(710,420,220),flat(865,340,150,{seal:true}),flat(1080,410,340,{exit:true})],curtains:[]},
 {name:'The scenery on little wheels',width:1510,platforms:[flat(0,430,240),flat(180,350,145,{seal:true}),flat(365,410,160,{move:{axis:'x',amp:33,period:4.5}}),flat(590,425,235,{checkpoint:true}),flat(730,340,150,{seal:true}),flat(950,395,145,{move:{axis:'x',amp:28,period:4}}),flat(1170,410,340,{exit:true,seal:true})],curtains:[]},
 {name:'The counterweight climb',width:1530,platforms:[flat(0,430,240),flat(180,350,150,{seal:true}),flat(380,415,155,{move:{axis:'y',amp:55,period:4.8},seal:true}),flat(590,315,225,{checkpoint:true}),flat(755,250,160,{seal:true}),flat(970,330,150,{move:{axis:'y',amp:40,period:4.5}}),flat(1190,350,340,{exit:true})],curtains:[]},
 {name:'Mind the velvet curtains',width:1660,platforms:[flat(0,430,240),flat(180,350,155,{seal:true}),flat(365,425,345,{checkpoint:true}),flat(665,340,155,{seal:true}),flat(870,415,315,{checkpoint:true}),flat(1125,335,150,{seal:true}),flat(1320,410,340,{exit:true})],curtains:[{x:570,y:260,h:165,w:26,period:3.6,open:[.25,.74],phase:.1},{x:1030,y:250,h:165,w:26,period:3.2,open:[.2,.7],phase:.2}]},
 {name:'The letter behind the wings',width:1740,platforms:[flat(0,430,275),flat(70,350,150,{seal:true}),flat(320,410,155,{move:{axis:'x',amp:30,period:4}}),flat(545,415,210,{checkpoint:true}),flat(700,345,145,{seal:true}),flat(900,410,155,{move:{axis:'y',amp:60,period:5}}),flat(1110,310,250,{checkpoint:true,seal:true}),flat(1400,375,340,{exit:true})],curtains:[{x:1260,y:145,h:165,w:26,period:3.2,open:[.22,.67],phase:.35}]},
 {name:'Opening night, all hands',width:2020,platforms:[flat(0,430,240),flat(175,350,150,{seal:true}),flat(370,410,155,{move:{axis:'x',amp:30,period:4.2}}),flat(595,420,260,{checkpoint:true}),flat(800,340,145,{seal:true}),flat(1005,410,155,{move:{axis:'y',amp:60,period:4.8},seal:true}),flat(1210,310,290,{checkpoint:true}),flat(1430,235,150,{seal:true}),flat(1620,320,150,{move:{axis:'x',amp:30,period:4}}),flat(1830,365,190,{exit:true})],curtains:[{x:743,y:255,h:165,w:26,period:3.4,open:[.23,.70],phase:.1},{x:1380,y:145,h:165,w:26,period:3.3,open:[.23,.68],phase:.4}]},
];
// Untagged v2 journeys retain their original scenery and physics.
const HORIZONTAL_LEVELS=[
 {name:"The invitation rounds",width:5350,platforms:[
  flat(0,430,250),
  flat(180,350,160,{"seal":true}),
  flat(390,430,230,{"checkpoint":true}),
  flat(600,340,160,{"seal":true}),
  flat(810,410,160,{"move":{"axis":"x","amp":27,"period":4.35}}),
  flat(1020,430,230,{"checkpoint":true}),
  flat(1230,345,160,{"seal":true}),
  flat(1440,410,160),
  flat(1650,430,230,{"checkpoint":true}),
  flat(1860,340,160,{"seal":true}),
  flat(2070,410,160,{"move":{"axis":"x","amp":27,"period":4.35}}),
  flat(2280,430,230,{"checkpoint":true}),
  flat(2490,350,160,{"seal":true}),
  flat(2700,410,160),
  flat(2910,430,230,{"checkpoint":true}),
  flat(3120,340,160,{"seal":true}),
  flat(3330,410,160,{"move":{"axis":"x","amp":27,"period":4.35}}),
  flat(3540,430,230,{"checkpoint":true}),
  flat(3750,345,160,{"seal":true}),
  flat(3960,410,160,{"move":{"axis":"y","amp":28,"period":5.35}}),
  flat(4170,430,230,{"checkpoint":true}),
  flat(4380,340,160,{"seal":true}),
  flat(4590,410,160),
  flat(4800,430,230,{"checkpoint":true}),
  flat(5010,410,340,{"exit":true})
 ],curtains:[{"x":1590,"y":245,"h":165,"w":24,"period":3.6,"open":[0.19,0.8],"phase":0.07},{"x":2850,"y":245,"h":165,"w":24,"period":3.9,"open":[0.19,0.8],"phase":0.24000000000000002},{"x":4740,"y":245,"h":165,"w":24,"period":3.6,"open":[0.19,0.8],"phase":0.41000000000000003}]},
 {name:"Scenery on the night shift",width:5980,platforms:[
  flat(0,430,250),
  flat(180,350,160,{"seal":true}),
  flat(390,430,230,{"checkpoint":true}),
  flat(600,340,160,{"seal":true}),
  flat(810,410,160,{"move":{"axis":"x","amp":27,"period":4.35}}),
  flat(1020,430,230,{"checkpoint":true}),
  flat(1230,345,160,{"seal":true}),
  flat(1440,410,160,{"move":{"axis":"x","amp":27,"period":4.35}}),
  flat(1650,430,230,{"checkpoint":true}),
  flat(1860,340,160,{"seal":true}),
  flat(2070,410,160,{"move":{"axis":"x","amp":27,"period":4.35}}),
  flat(2280,430,230,{"checkpoint":true}),
  flat(2490,350,160,{"seal":true}),
  flat(2700,410,160,{"move":{"axis":"x","amp":27,"period":4.35}}),
  flat(2910,430,230,{"checkpoint":true}),
  flat(3120,340,160,{"seal":true}),
  flat(3330,410,160,{"move":{"axis":"x","amp":27,"period":4.35}}),
  flat(3540,430,230,{"checkpoint":true}),
  flat(3750,345,160,{"seal":true}),
  flat(3960,410,160,{"move":{"axis":"x","amp":27,"period":4.35}}),
  flat(4170,430,230,{"checkpoint":true}),
  flat(4380,340,160,{"seal":true}),
  flat(4590,410,160,{"move":{"axis":"x","amp":27,"period":4.35}}),
  flat(4800,430,230,{"checkpoint":true}),
  flat(5010,350,160,{"seal":true}),
  flat(5220,410,160,{"move":{"axis":"x","amp":27,"period":4.35}}),
  flat(5430,430,230,{"checkpoint":true}),
  flat(5640,410,340,{"exit":true})
 ],curtains:[{"x":1800,"y":265,"h":165,"w":24,"period":3.6,"open":[0.19,0.8],"phase":0.07},{"x":3690,"y":265,"h":165,"w":24,"period":3.9,"open":[0.19,0.8],"phase":0.24000000000000002},{"x":4950,"y":265,"h":165,"w":24,"period":3.6,"open":[0.19,0.8],"phase":0.41000000000000003}]},
 {name:"The counterweight rounds",width:6610,platforms:[
  flat(0,430,250),
  flat(180,350,160,{"seal":true}),
  flat(390,430,230,{"checkpoint":true}),
  flat(600,340,160,{"seal":true}),
  flat(810,410,160,{"move":{"axis":"y","amp":45,"period":4.3}}),
  flat(1020,430,230,{"checkpoint":true}),
  flat(1230,345,160,{"seal":true}),
  flat(1440,410,160,{"move":{"axis":"y","amp":45,"period":5.35}}),
  flat(1650,430,230,{"checkpoint":true}),
  flat(1860,340,160,{"seal":true}),
  flat(2070,410,160,{"move":{"axis":"x","amp":32,"period":4.35}}),
  flat(2280,430,230,{"checkpoint":true}),
  flat(2490,350,160,{"seal":true}),
  flat(2700,410,160,{"move":{"axis":"y","amp":45,"period":4.6499999999999995}}),
  flat(2910,430,230,{"checkpoint":true}),
  flat(3120,340,160,{"seal":true}),
  flat(3330,410,160,{"move":{"axis":"y","amp":45,"period":4.3}}),
  flat(3540,430,230,{"checkpoint":true}),
  flat(3750,345,160,{"seal":true}),
  flat(3960,410,160,{"move":{"axis":"y","amp":45,"period":5.35}}),
  flat(4170,430,230,{"checkpoint":true}),
  flat(4380,340,160,{"seal":true}),
  flat(4590,410,160,{"move":{"axis":"x","amp":32,"period":4.35}}),
  flat(4800,430,230,{"checkpoint":true}),
  flat(5010,350,160,{"seal":true}),
  flat(5220,410,160,{"move":{"axis":"y","amp":45,"period":4.6499999999999995}}),
  flat(5430,430,230,{"checkpoint":true}),
  flat(5640,340,160,{"seal":true}),
  flat(5850,410,160,{"move":{"axis":"y","amp":45,"period":4.3}}),
  flat(6060,430,230,{"checkpoint":true}),
  flat(6270,410,340,{"exit":true})
 ],curtains:[{"x":2430,"y":265,"h":165,"w":24,"period":3.6,"open":[0.19,0.8],"phase":0.07},{"x":4320,"y":265,"h":165,"w":24,"period":3.9,"open":[0.19,0.8],"phase":0.24000000000000002},{"x":5580,"y":265,"h":165,"w":24,"period":3.6,"open":[0.19,0.8],"phase":0.41000000000000003}]},
 {name:"The velvet crossing cues",width:7240,platforms:[
  flat(0,430,250),
  flat(180,350,160,{"seal":true}),
  flat(390,430,230,{"checkpoint":true}),
  flat(600,340,160,{"seal":true}),
  flat(810,410,160,{"move":{"axis":"x","amp":32,"period":4.35}}),
  flat(1020,430,230,{"checkpoint":true}),
  flat(1230,345,160,{"seal":true}),
  flat(1440,410,160,{"move":{"axis":"y","amp":38,"period":5.35}}),
  flat(1650,430,230,{"checkpoint":true}),
  flat(1860,340,160,{"seal":true}),
  flat(2070,410,160),
  flat(2280,430,230,{"checkpoint":true}),
  flat(2490,350,160,{"seal":true}),
  flat(2700,410,160,{"move":{"axis":"x","amp":32,"period":4.35}}),
  flat(2910,430,230,{"checkpoint":true}),
  flat(3120,340,160,{"seal":true}),
  flat(3330,410,160,{"move":{"axis":"y","amp":38,"period":4.3}}),
  flat(3540,430,230,{"checkpoint":true}),
  flat(3750,345,160,{"seal":true}),
  flat(3960,410,160),
  flat(4170,430,230,{"checkpoint":true}),
  flat(4380,340,160,{"seal":true}),
  flat(4590,410,160,{"move":{"axis":"x","amp":32,"period":4.35}}),
  flat(4800,430,230,{"checkpoint":true}),
  flat(5010,350,160,{"seal":true}),
  flat(5220,410,160,{"move":{"axis":"y","amp":38,"period":4.6499999999999995}}),
  flat(5430,430,230,{"checkpoint":true}),
  flat(5640,340,160,{"seal":true}),
  flat(5850,410,160),
  flat(6060,430,230,{"checkpoint":true}),
  flat(6270,345,160,{"seal":true}),
  flat(6480,410,160,{"move":{"axis":"x","amp":32,"period":4.35}}),
  flat(6690,430,230,{"checkpoint":true}),
  flat(6900,410,340,{"exit":true})
 ],curtains:[{"x":1170,"y":265,"h":165,"w":24,"period":3.4,"open":[0.21,0.75],"phase":0.07},{"x":1800,"y":265,"h":165,"w":24,"period":3.6999999999999997,"open":[0.21,0.75],"phase":0.24000000000000002},{"x":3060,"y":265,"h":165,"w":24,"period":3.4,"open":[0.21,0.75],"phase":0.41000000000000003},{"x":3690,"y":265,"h":165,"w":24,"period":3.6999999999999997,"open":[0.21,0.75],"phase":0.5800000000000001},{"x":4950,"y":265,"h":165,"w":24,"period":3.4,"open":[0.21,0.75],"phase":0.75},{"x":5580,"y":265,"h":165,"w":24,"period":3.6999999999999997,"open":[0.21,0.75],"phase":0.9200000000000002},{"x":6840,"y":265,"h":165,"w":24,"period":3.4,"open":[0.21,0.75],"phase":1.09}]},
 {name:"Letters for both wings",width:7870,platforms:[
  flat(0,430,250),
  flat(180,350,160,{"seal":true}),
  flat(390,430,230,{"checkpoint":true}),
  flat(600,340,160,{"seal":true}),
  flat(810,410,160,{"move":{"axis":"x","amp":32,"period":4.35}}),
  flat(1020,430,230,{"checkpoint":true}),
  flat(1230,345,160,{"seal":true}),
  flat(1440,410,160,{"move":{"axis":"y","amp":38,"period":5.35}}),
  flat(1650,430,230,{"checkpoint":true}),
  flat(1860,340,160,{"seal":true}),
  flat(2070,410,160,{"move":{"axis":"x","amp":32,"period":4.35}}),
  flat(2280,430,230,{"checkpoint":true}),
  flat(2490,350,160,{"seal":true}),
  flat(2700,410,160,{"move":{"axis":"y","amp":38,"period":4.6499999999999995}}),
  flat(2910,430,230,{"checkpoint":true}),
  flat(3120,340,160,{"seal":true}),
  flat(3330,410,160,{"move":{"axis":"x","amp":32,"period":4.35}}),
  flat(3540,430,230,{"checkpoint":true}),
  flat(3750,345,160,{"seal":true}),
  flat(3960,410,160,{"move":{"axis":"y","amp":38,"period":5.35}}),
  flat(4170,430,230,{"checkpoint":true}),
  flat(4380,340,160,{"seal":true}),
  flat(4590,410,160,{"move":{"axis":"x","amp":32,"period":4.35}}),
  flat(4800,430,230,{"checkpoint":true}),
  flat(5010,350,160,{"seal":true}),
  flat(5220,410,160,{"move":{"axis":"y","amp":38,"period":4.6499999999999995}}),
  flat(5430,430,230,{"checkpoint":true}),
  flat(5640,340,160,{"seal":true}),
  flat(5850,410,160,{"move":{"axis":"x","amp":32,"period":4.35}}),
  flat(6060,430,230,{"checkpoint":true}),
  flat(6270,345,160,{"seal":true}),
  flat(6480,410,160,{"move":{"axis":"y","amp":38,"period":5.35}}),
  flat(6690,430,230,{"checkpoint":true}),
  flat(6900,340,160,{"seal":true}),
  flat(7110,410,160,{"move":{"axis":"x","amp":32,"period":4.35}}),
  flat(7320,430,230,{"checkpoint":true}),
  flat(7530,410,340,{"exit":true})
 ],curtains:[{"x":1170,"y":265,"h":165,"w":24,"period":3.4,"open":[0.21,0.75],"phase":0.07},{"x":2430,"y":265,"h":165,"w":24,"period":3.6999999999999997,"open":[0.21,0.75],"phase":0.24000000000000002},{"x":3690,"y":265,"h":165,"w":24,"period":3.4,"open":[0.21,0.75],"phase":0.41000000000000003},{"x":4950,"y":265,"h":165,"w":24,"period":3.6999999999999997,"open":[0.21,0.75],"phase":0.5800000000000001},{"x":6210,"y":265,"h":165,"w":24,"period":3.4,"open":[0.21,0.75],"phase":0.75},{"x":7470,"y":265,"h":165,"w":24,"period":3.6999999999999997,"open":[0.21,0.75],"phase":0.9200000000000002}]},
 {name:"A whole opening night",width:8500,platforms:[
  flat(0,430,250),
  flat(180,350,160,{"seal":true}),
  flat(390,430,230,{"checkpoint":true}),
  flat(600,340,160,{"seal":true}),
  flat(810,410,160,{"move":{"axis":"x","amp":32,"period":4.35}}),
  flat(1020,430,230,{"checkpoint":true}),
  flat(1230,345,160,{"seal":true}),
  flat(1440,410,160,{"move":{"axis":"y","amp":38,"period":5.35}}),
  flat(1650,430,230,{"checkpoint":true}),
  flat(1860,340,160,{"seal":true}),
  flat(2070,410,160,{"move":{"axis":"x","amp":32,"period":4.35}}),
  flat(2280,430,230,{"checkpoint":true}),
  flat(2490,350,160,{"seal":true}),
  flat(2700,410,160,{"move":{"axis":"y","amp":38,"period":4.6499999999999995}}),
  flat(2910,430,230,{"checkpoint":true}),
  flat(3120,340,160,{"seal":true}),
  flat(3330,410,160,{"move":{"axis":"x","amp":32,"period":4.35}}),
  flat(3540,430,230,{"checkpoint":true}),
  flat(3750,345,160,{"seal":true}),
  flat(3960,410,160,{"move":{"axis":"y","amp":38,"period":5.35}}),
  flat(4170,430,230,{"checkpoint":true}),
  flat(4380,340,160,{"seal":true}),
  flat(4590,410,160,{"move":{"axis":"x","amp":32,"period":4.35}}),
  flat(4800,430,230,{"checkpoint":true}),
  flat(5010,350,160,{"seal":true}),
  flat(5220,410,160,{"move":{"axis":"y","amp":38,"period":4.6499999999999995}}),
  flat(5430,430,230,{"checkpoint":true}),
  flat(5640,340,160,{"seal":true}),
  flat(5850,410,160,{"move":{"axis":"x","amp":32,"period":4.35}}),
  flat(6060,430,230,{"checkpoint":true}),
  flat(6270,345,160,{"seal":true}),
  flat(6480,410,160,{"move":{"axis":"y","amp":38,"period":5.35}}),
  flat(6690,430,230,{"checkpoint":true}),
  flat(6900,340,160,{"seal":true}),
  flat(7110,410,160,{"move":{"axis":"x","amp":32,"period":4.35}}),
  flat(7320,430,230,{"checkpoint":true}),
  flat(7530,350,160,{"seal":true}),
  flat(7740,410,160,{"move":{"axis":"y","amp":38,"period":4.6499999999999995}}),
  flat(7950,430,230,{"checkpoint":true}),
  flat(8160,410,340,{"exit":true})
 ],curtains:[{"x":1170,"y":265,"h":165,"w":24,"period":3.4,"open":[0.21,0.75],"phase":0.07},{"x":1800,"y":265,"h":165,"w":24,"period":3.6999999999999997,"open":[0.21,0.75],"phase":0.24000000000000002},{"x":3060,"y":265,"h":165,"w":24,"period":3.4,"open":[0.21,0.75],"phase":0.41000000000000003},{"x":3690,"y":265,"h":165,"w":24,"period":3.6999999999999997,"open":[0.21,0.75],"phase":0.5800000000000001},{"x":4950,"y":265,"h":165,"w":24,"period":3.4,"open":[0.21,0.75],"phase":0.75},{"x":5580,"y":265,"h":165,"w":24,"period":3.6999999999999997,"open":[0.21,0.75],"phase":0.9200000000000002},{"x":6840,"y":265,"h":165,"w":24,"period":3.4,"open":[0.21,0.75],"phase":1.09},{"x":7470,"y":265,"h":165,"w":24,"period":3.6999999999999997,"open":[0.21,0.75],"phase":1.2600000000000002},{"x":8100,"y":265,"h":165,"w":24,"period":3.4,"open":[0.21,0.75],"phase":1.4300000000000002}]}
];
// Edition 3 climbs the actual portrait theatre; earlier scenery remains restorable.
export const LEVELS=Array.from({length:6},(_,level)=>{
 const count=10+level%3,dy=680/(count-1),centres=[360,205,385,535,355,200,375,535,350,210,390,535,355,210,360];
 const platforms=Array.from({length:count},(_,i)=>{
  const final=i===count-1,w=i===0?180:final?160:132-level*4;
  return flat((final?360:centres[i])-w/2,940-i*dy,w,{seal:i>0&&!final,checkpoint:i===0||i%3===0,exit:final,...(level>=2&&i>1&&!final&&i%4===2?{move:{axis:'x',amp:12+level*2,period:4.5+level*.3}}:{})});
 });
 return {name:['Up to the velvet curtain','The high invitation steps','Scenery on the ropes','The lantern staircase','Above the theatre wings','Opening night at the top'][level],width:720,vertical:true,platforms,curtains:[]};
});
const SAMPLE_CLIMB={...LEVELS[0],platforms:LEVELS[0].platforms.slice(0,8).map((p,i)=>({...p,x:i===7?280:p.x,y:940-i*680/7,w:i===7?160:p.w,seal:i>0&&i<7,exit:i===7}))};
export const H=1/120,GRAVITY=1200,JUMP=-520,SPEED=220;
export const rules=value=>value?.demo===true&&value.edition===3?SAMPLE_CLIMB:(typeof value==='number'||value.edition===3?LEVELS:value.edition===2?HORIZONTAL_LEVELS:LEGACY_LEVELS)[typeof value==='number'?value:value.level];
export function platform(value,i,time=value.clock||0){const p=rules(value).platforms[i];if(!p)return null;const v=p.move?Math.sin(time/p.move.period*Math.PI*2)*p.move.amp:0;return {...p,x:p.x+(p.move?.axis==='x'?v:0),y:p.y+(p.move?.axis==='y'?v:0)};}
export function curtain(value,i,time=value.clock||0){const p=rules(value).curtains[i],phase=(time/p.period+p.phase)%1;return {...p,phase,open:phase>=p.open[0]&&phase<=p.open[1]};}
function freshState(level,edition){const r=rules({level,edition});if(!r)throw Error('Unknown chapter.');return {...base('backstage','Deliver every invitation seal, then reach the lit stage door.',level),...(edition?{edition}:{}),clock:0,accumulator:0,camera:0,actor:{x:edition===3?360:75,y:edition===3?940:430,vx:0,vy:0,grounded:true,platform:0,facing:1,alpha:1,walk:0},input:{left:false,right:false},jumpBuffer:0,coyote:.1,motion:null,checkpoint:{platform:0,offset:edition===3?90:75},seals:r.platforms.map(()=>false),deaths:0,death:null,entry:0,started:false};}
export const makeState=(level=0)=>freshState(level,3);
export function makeSampleState(){return {...freshState(0,3),demo:true};}
export function releaseInput(s){s.input={left:false,right:false};}
export function snapshot(s){const v=copy(s);releaseInput(v);v.history.forEach(releaseInput);delete v.pointerDown;delete v.saveError;return v;}
export function restore(blob,level=blob?.level){const fail=validate(blob,'backstage'),r=rules(blob);if(blob.demo===true||blob.edition!==undefined&&![2,3].includes(blob.edition)||blob.v!==2||blob.level!==level||!r)fail();const s=copy(blob),a=s.actor;
 if(!a||![a.x,a.y,a.vx,a.vy,a.alpha,a.walk,s.clock,s.accumulator,s.camera,s.jumpBuffer,s.coyote,s.entry].every(Number.isFinite)||s.clock<0||s.accumulator<0||s.accumulator>H+.00001||typeof a.grounded!=='boolean'||!Number.isInteger(a.platform)||a.platform< -1||a.platform>=r.platforms.length||![1,-1].includes(a.facing)||!Array.isArray(s.seals)||s.seals.length!==r.platforms.length||s.seals.some(v=>typeof v!=='boolean')||!s.checkpoint||!Number.isInteger(s.checkpoint.platform)||!r.platforms[s.checkpoint.platform]||!Number.isFinite(s.checkpoint.offset)||!Number.isInteger(s.deaths)||s.deaths<0||typeof s.started!=='boolean')fail();
 if(s.motion&&(!['journey','death','respawn','entry'].includes(s.motion.kind)||!Number.isFinite(s.motion.t)||s.motion.t<0))fail();
 if((s.phase==='celebrate'||s.phase==='result')&&(s.entry!==1||a.alpha!==0||!allSeals(s)))fail();
 s.history=s.history.map(h=>{const v=restore({...h,history:[]},level);delete v.history;return v;});releaseInput(s);delete s.pointerDown;delete s.saveError;return s;
}
export const allSeals=s=>rules(s).platforms.every((p,i)=>!p.seal||s.seals[i]);
function start(s){if(!s.started){s.started=true;s.phase='moving';s.motion={kind:'journey',t:0};}}
export function hold(s,side,down){if(!['left','right'].includes(side)||s.result||s.saveError||s.phase==='celebrate'||['entry','death','respawn'].includes(s.motion?.kind))return false;if(s.input[side]===!!down)return false;if(down){remember(s);s.moves++;start(s);}s.input[side]=!!down;return true;}
export function jump(s){if(s.result||s.saveError||s.phase==='celebrate'||['entry','death','respawn'].includes(s.motion?.kind))return false;remember(s);s.moves++;start(s);s.jumpBuffer=.14;return true;}
function die(s,reason){releaseInput(s);s.actor.grounded=false;s.actor.platform=-1;s.jumpBuffer=0;s.coyote=0;s.deaths++;s.death={reason,x:s.actor.x,y:s.actor.y};s.motion={kind:'death',t:0};s.phase='moving';s.note=reason+' Returning to your pennant; seals stay delivered. Retry is free.';}
function physics(s){const a=s.actor,r=rules(s),old=s.clock;s.clock+=H;if(s.motion)s.motion.t+=H;
 if(s.motion?.kind==='death'){a.vy+=GRAVITY*H;a.y+=a.vy*H;a.alpha=Math.max(0,1-s.motion.t/.65);if(s.motion.t>=.65){const p=platform(s,s.checkpoint.platform);a.x=p.x+s.checkpoint.offset;a.y=p.y;a.vx=0;a.vy=0;a.grounded=true;a.platform=s.checkpoint.platform;a.alpha=0;s.jumpBuffer=0;s.motion={kind:'respawn',t:0};}return;}
 if(s.motion?.kind==='respawn'){a.alpha=clamp(s.motion.t/.35,0,1);if(a.grounded){const p=platform(s,a.platform),before=platform(s,a.platform,old);a.x+=p.x-before.x;a.y=p.y;}if(s.motion.t>=.35){a.alpha=1;s.motion={kind:'journey',t:0};s.note='Back at the pennant. Your delivered seals are safe.';}return;}
 if(s.motion?.kind==='entry'){s.entry=clamp(s.motion.t/.9,0,1);if(r.vertical)a.y=s.motion.from-ease(s.entry)*42;else a.x=s.motion.from+ease(s.entry)*43;a.alpha=1-s.entry;if(s.entry>=1){s.entry=1;a.alpha=0;s.motion=null;s.phase='celebrate';s.pendingPennies=3+s.level;s.note='Every invitation delivered. The stage is yours!';}return;}
 if(a.grounded){const p=platform(s,a.platform),prev=platform(s,a.platform,old);a.x+=p.x-prev.x;a.y=p.y;if(a.x<p.x-8||a.x>p.x+p.w+8){a.grounded=false;a.platform=-1;s.coyote=.1;}}
 const axis=Number(s.input.right)-Number(s.input.left),wanted=axis*SPEED,accel=axis?1700:a.grounded?1900:1100;a.vx+=clamp(wanted-a.vx,-accel*H,accel*H);if(axis)a.facing=axis;a.x=clamp(a.x+a.vx*H,12,r.width-12);a.walk+=Math.abs(a.vx)*H;
 if(a.grounded)s.coyote=.1;else s.coyote=Math.max(0,s.coyote-H);if(s.jumpBuffer>0){s.jumpBuffer=Math.max(0,s.jumpBuffer-H);if(a.grounded||s.coyote>0){a.vy=JUMP;a.grounded=false;a.platform=-1;s.coyote=0;s.jumpBuffer=0;}}
 const beforeY=a.y;if(!a.grounded){a.vy+=GRAVITY*H;a.y+=a.vy*H;if(a.vy>=0){let best=-1,bestY=Infinity;for(let i=0;i<r.platforms.length;i++){const p=platform(s,i),prev=platform(s,i,old);if(a.x>=p.x-8&&a.x<=p.x+p.w+8&&beforeY<=prev.y+3&&a.y>=p.y&&p.y<bestY){best=i;bestY=p.y;}}if(best>=0){a.y=bestY;a.vy=0;a.grounded=true;a.platform=best;}}}
 if(a.grounded&&r.platforms[a.platform].checkpoint&&s.checkpoint.platform!==a.platform){s.checkpoint={platform:a.platform,offset:Math.min(65,r.platforms[a.platform].w/2)};s.note='Pennant checkpoint. Delivered seals stay with you.';}
 for(let i=0;i<r.platforms.length;i++)if(r.platforms[i].seal&&!s.seals[i]){const p=platform(s,i);if(Math.hypot(a.x-(p.x+p.w/2),a.y-20-(p.y-26))<28){s.seals[i]=true;s.note='Invitation seal delivered. '+s.seals.filter(Boolean).length+' / '+r.platforms.filter(p=>p.seal).length+'.';}}
 for(let i=0;i<r.curtains.length;i++){const q=curtain(s,i);if(!q.open&&a.x+11>q.x&&a.x-11<q.x+q.w&&a.y>q.y&&a.y-36<q.y+q.h){die(s,'The velvet curtain caught you. Cross while its lamp is green.');return;}}
 if(a.y>(r.vertical?1040:550)){die(s,'Mind the gap!');return;}
 if(a.grounded&&r.platforms[a.platform].exit&&(r.vertical?Math.abs(a.x-(r.platforms[a.platform].x+r.platforms[a.platform].w/2))<25:a.x>r.width-92)){if(allSeals(s)){releaseInput(s);a.vx=0;a.vy=0;s.motion={kind:'entry',t:0,from:r.vertical?a.y:a.x};s.phase='moving';s.note='All seals delivered. Entering the stage door…';}else s.note='The stage door needs every invitation seal. Check the high routes.';}
 if(!r.vertical)s.camera+=((clamp(a.x-240,0,r.width-720))-s.camera)*Math.min(1,H*7);
}
export function step(s,dt){if(s.result||s.phase==='celebrate'||s.saveError)return;s.accumulator+=clamp(dt,0,.05);while(s.accumulator+1e-10>=H){s.accumulator=Math.max(0,s.accumulator-H);physics(s);if(s.phase==='celebrate'){s.accumulator=0;break;}}}
export function undo(s){const ok=rewind(s);if(ok)releaseInput(s);return ok;}
