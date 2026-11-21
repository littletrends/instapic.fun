import * as model from './ferris-boarding-model.js?v=studies-six-1';
import {study,prop,paper,text,tag,button,compactHeader as header,compactFooter as footer,paintChapterReward,PALETTE} from './study-kit.js?v=studies-six-1';
import {ease} from './study-state.js?v=studies-six-1';
import {withChapterExample} from './chapter-example.js?v=example-1';
import {itemName} from '../prizes.js?v=nft-art-1';
function guest(d,g,x,y,w=28){const n=model.size(g);for(let i=0;i<n;i++)prop(d,2,x+(i-(n-1)/2)*w*.55,y,n===1?w:w*.7);tag(d.c,PALETTE[g.colour],x,y+17,g.ticket>=0?13:9);if(g.ticket>=0)text(d.c,model.ticketName(g.ticket,g.chapter||0),x,y+17,17,'#fff5dd');}
function draw(s,d){const c=d.c,rules=model.rules(s);header(c,'JASPER’S LAST BOARDING',(s.level+1)+' · '+rules.name);
 paper(c,450,229,600,40,'#fff1dfaa','#b997625c',9);text(c,`${model.COLOURS[s.cabins[s.cabin].colour]} cabin · ${model.occupied(s.cabins[s.cabin])}/${s.cabins[s.cabin].capacity} seats · ${s.turns}/${rules.turns} turns`,450,229,24);
 const center={x:450,y:460},radius=197;
 d.poly([[365,735],[450,465],[535,735]],'#8d6b4d','#d7b970',8);d.poly([[394,735],[450,510],[506,735]],'#f5e0b5','#ba995f',2);
 c.save();c.shadowColor='#4e3a3650';c.shadowBlur=13;d.circle(450,460,radius,null,'#a28450',13);d.circle(450,460,radius-9,null,'#f6d69a',3);c.restore();
 const poses=s.cabins.map((cabin,i)=>{const a=(s.demo===true?Math.PI/2-i*Math.PI*2/s.cabins.length:Math.PI/2-i*Math.PI/3)+s.angle;return {i,cabin,x:center.x+Math.cos(a)*radius,y:center.y+Math.sin(a)*radius};});
 for(const p of poses){d.line(center,p,'#a58350',7);d.line(center,p,'#f6d799',2);d.circle(p.x,p.y,10,'#d2ad69','#fff0bf',2);}
 for(const p of poses){const movingGuest=s.motion?.kind==='walk'?s.motion.guest.id:null;prop(d,1,p.x,p.y+33,112);tag(c,PALETTE[p.cabin.colour],p.x,p.y+68,13);let used=0;for(const g of p.cabin.guests){const n=model.size(g),gap=p.cabin.capacity===2?36:24;if(g.id!==movingGuest)guest(d,{...g,chapter:s.level},p.x+(used+(n-1)/2-(p.cabin.capacity-1)/2)*gap,p.y+26,22);used+=n;}if(s.level>0)text(c,model.occupied(p.cabin)+'/'+p.cabin.capacity,p.x+36,p.y+66,19,'#fff2d8');if(rules.tickets)text(c,model.ticketName(p.i,s.level),p.x-35,p.y+66,20,'#fff2d8');}
 prop(d,0,450,460,59);d.glow(450,460,55,'#ffe3a7');
 paper(c,450,769,460,34,'#fff1dfaa','#b997625c',9);text(c,s.motion?.kind==='ride'?'EVERYONE’S TAKING A TURN':'BOARDING PLATFORM',450,769,23);
 for(let i=0;i<rules.bench;i++){const x=model.benchX(s,i);paper(c,x,824,100,63,'#e8d4ad','#b09465');if(s.bench[i]&&s.bench[i].id!==s.motion?.guest?.id)guest(d,{...s.bench[i],chapter:s.level},x,813,30);else if(!s.bench[i])text(c,'·',x,824,26);}
 if(s.motion?.kind==='walk'){const m=s.motion,u=ease(m.t/m.duration);guest(d,{...m.guest,chapter:s.level},m.from.x+(m.to.x-m.from.x)*u,m.from.y+(m.to.y-m.from.y)*u-Math.sin(u*Math.PI)*17,31);}
 s.queues.forEach((row,i)=>{const x=290+i*160;for(let r=row.length-1;r>=0;r--){const p=model.guestSpot(i,r);guest(d,{...row[r],chapter:s.level},p.x,p.y-12,31);text(c,r===0?'↓':'',p.x+39,p.y-10,22,'#805d4b');}text(c,String(i+1),x-46,885,22);});
 button(c,'↶ UNDO',150,1031,110);button(c,model.full(s)?'TAKE THEM ROUND':'NEXT CABIN →',565,1031,310);
 footer(c,s);paintChapterReward(s,d);
}
const engine=study({id:'ferris',mode:'last-boarding',title:'Jasper’s Last Boarding',chapter:'A turn before moonrise',model,draw,
 intro:'A paper Ferris wheel, twelve little guests and three waiting seats. Help everyone take their last ride before moonrise.',
 instructions:'Only the first guest in each queue can leave. Tap one: matching guests board the cabin at the bottom; other guests use one of three waiting seats. Tap a waiting guest to board when its matching cabin arrives. Chapter1 cabins seat two. Later cabins show two or three seats; joined guests need adjacent seats and board together. Chapter4 has only two waiting places. In Chapters5–6 an A/B ticket belongs to that colour’s matching lettered cabin. Next cabin rotates the wheel one stop; there are eight boarding turns, so avoid sending half-empty cabins away. Look behind the first guests before choosing. Once every guest is seated, Take them round makes one full physical rotation and completes the chapter. No timer.',
 keys:'1–3 front guests · 4–6 waiting guests · Space next cabin',
 tap(s,p){if(p.y>1000&&p.y<1065&&p.x>370){model.advance(s);return;}if(p.y>790&&p.y<855){const i=Math.round((p.x-450)/120+(model.rules(s).bench-1)/2);if(i>=0&&i<model.rules(s).bench)model.choose(s,'bench',i);}else if(p.y>860&&p.y<995){const i=Math.round((p.x-290)/160);if(i>=0&&i<3)model.choose(s,'queue',i);}},
 key(s,k){if(/^[1-3]$/.test(k))model.choose(s,'queue',Number(k)-1);if(/^[4-6]$/.test(k))model.choose(s,'bench',Number(k)-4);if(k===' '||k==='Enter')model.advance(s);},
});

export const jasperExampleModel={makeState:()=>model.makeSampleState(),step(s,dt){
 if(s.phase==='demo-finish'){s.t+=dt;s.demoFinishLeft=Math.max(0,s.demoFinishLeft-dt);if(!s.demoFinishLeft)s.phase='demo-done';return;}
 if(s.phase==='demo-done')return;
 model.step(s,dt);
 if(s.phase==='celebrate'){s.pendingPennies=0;s.phase='demo-finish';s.demoFinishLeft=4.2;s.note='Both example guests completed their real full turn.';}
}};
function drawSample(s,d){
 draw(s,d);
 if(s.phase!=='demo-finish'&&s.phase!=='demo-done')return;
 const c=d.c,prize=engine.prizes[0];paper(c,450,570,590,470,'#fff0e7f7','#b28a4d');text(c,'COLLECTED · EXAMPLE ONLY',450,385,27,'#684b3b');
 const image=d.art['study:'+prize+':front'];if(image)d.sprite(image,450,555,{w:230,h:230,angle:(4.2-s.demoFinishLeft)*Math.PI/2,shadow:false});text(c,itemName(prize),450,755,26,'#684b3b');
}
export function jasperExampleSteps(){return [
 {caption:'A small two-cabin example. The Rose guest matches the Rose cabin at the platform. Tap the guest to board.',point:{x:290,y:875},run:s=>model.choose(s,'queue',0),done:s=>!s.motion,after:.1},
 {caption:'Bring the next cabin to the platform. The boarded guest stays seated while the wheel turns.',point:{x:565,y:1031},run:s=>model.advance(s),done:s=>!s.motion,after:.1},
 {caption:'The Moon cabin has arrived. Tap its matching guest. Now both sample cabins are full.',point:{x:450,y:875},run:s=>model.choose(s,'queue',1),done:s=>!s.motion,after:.1},
 {caption:s=>s.phase==='demo-finish'||s.phase==='demo-done'?'Both guests completed the full ride. This is a sample reward; your chapter and collection have not changed.':'Everyone is seated. TAKE THEM ROUND starts a whole physical ride before the reward arrives.',point:{x:565,y:1031},run:s=>model.advance(s),done:s=>s.phase==='demo-done',after:0},
];}
function hasSavedFirst(){
 const key=engine.navigationKey.replace(/\.selection$/,'');
 try{return !!JSON.parse(localStorage.getItem(key)||'null')?.chapters?.[0]||!!JSON.parse(localStorage.getItem(key.replace('.v2:','.v1:'))||'null')?.snapshot;}catch{return true;}
}
export default withChapterExample(engine,{model:jasperExampleModel,draw:drawSample,steps:jasperExampleSteps,hasSavedFirst,captionY:952,finishCaption:'Your turn: six cabins, twelve guests. Fill matching seats, use the waiting places, then take everyone round.'});
