import * as model from './marquee-parade-model.js?v=studies-six-1';
import {study,prop,paper,text,tag,button,compactHeader as header,compactFooter as footer,paintChapterReward,PALETTE} from './study-kit.js?v=studies-six-1';
import {withChapterExample} from './chapter-example.js?v=example-1';
import {spriteKey} from '../prizes.js?v=nft-art-1';
function lantern(d,p,x,y,w=52){prop(d,0,x,y,w);tag(d.c,PALETTE[p.colour],x,y+19,13);}
function draw(s,d){const c=d.c,rules=model.rules(s);header(c,'LUMI’S LIGHT PARADE',s.demo?'Easy sample · Pink first, then Gold':(s.level+1)+' · '+rules.name,true);
 // The bulbs form a little stage, with the front edge exposed to the parade.

 // Folded theatre valance, separate from the working light slots.
 c.save();c.fillStyle='#763d50';c.strokeStyle='#dfbd7d';c.lineWidth=2;c.beginPath();c.moveTo(212,408);c.lineTo(688,408);c.lineTo(688,425);for(let x=688;x>212;x-=68)c.quadraticCurveTo(x-34,459,x-68,425);c.closePath();c.fill();c.stroke();for(let x=246;x<688;x+=68){d.line({x,y:411},{x,y:427},'#a65b6d',3);}c.restore();
 c.save();c.strokeStyle='#d4af6c';c.lineWidth=12;c.shadowBlur=14;c.shadowColor='#0008';c.beginPath();c.ellipse(450,585,285,225,0,0,Math.PI*2);c.stroke();c.strokeStyle='#5d493d';c.lineWidth=5;c.stroke();c.restore();
 for(let i=0;i<48;i++){const p=model.track(i/48);d.circle(p.x,p.y,3.5,i<Math.round(s.lit.length/(s.demo?model.totalLights(s):24)*48)?'#fff1af':'#957943');}
 for(let col=0;col<6;col++){
  const pile=s.columns[col];for(let r=rules.columns[col].length-1;r>=0;r--){const bulb=pile[r],x=model.columnX(col),y=model.frontY(s)+r*model.rowGap(s);
   if(!bulb){d.glow(x,y,26,'#ffdd8d');d.circle(x,y,18,'#fff1ac','#d9b871',3);d.star(x,y,7,'#fff8d6');continue;}
   const colour=PALETTE[bulb.colour];c.save();c.globalAlpha=r===0?1:.43;if(r===0){d.glow(x,y,35,colour);d.circle(x,y,27,null,'#fff1b8',2);text(c,'↓',x,y-39,24,'#fff1c1');}d.poly([[x-10,y+13],[x+10,y+13],[x+8,y+26],[x-8,y+26]],'#ab8958','#e5c991',1);d.circle(x,y,22,'#44393e','#b59b6c',2);d.circle(x,y,17,colour,r===0?'#fff3cb':'#dec49b',r===0?4:1);d.ellipse(x-4,y-5,6,4,'#fffbeb8c');if(bulb.hp>1){d.circle(x-5,y+2,3,'#fff7dd');d.circle(x+5,y+2,3,'#fff7dd');}if(r===0&&rules.shutters?.includes(col)&&!model.shutterOpen(s,col)){d.line({x:x-25,y:y-24},{x:x+25,y:y+24},'#b6c4b4',7);d.line({x:x-25,y:y+24},{x:x+25,y:y-24},'#b6c4b4',7);}c.restore();
  }
 }
 if(!s.columns.some(a=>a.length)){c.save();c.globalAlpha=.8;paper(c,450,581,420,240,'#733e4e','#d6b879',80);text(c,'THE SHOW IS YOURS',450,580,30,'#fff4d8');c.restore();}
 for(const shot of s.shots){const u=Math.min(1,shot.t/.22),x=shot.from.x+(model.columnX(shot.c)-shot.from.x)*u,y=shot.from.y+(model.frontY(s)-shot.from.y)*u;d.glow(x,y,22,PALETTE[shot.colour]);d.circle(x,y,7,'#fff8c4');}
 if(s.active){const p=model.track(s.active.dir===-1?1-s.active.u:s.active.u);prop(d,5,p.x,p.y+24,100);lantern(d,s.active,p.x+13,p.y-31,43);paper(c,p.x+59,p.y-39,48,30,'#173b39','#cfad6b');text(c,s.active.charge,p.x+59,p.y-39,22,'#fff0cb');}else prop(d,5,450,834,105);
 paper(c,450,226,500,40,'#173b399e','#b997625c',9);text(c,`${s.lit.length} / ${model.totalLights(s)} lights · ${s.moves} launches${rules.reverse?' · ⇄':''}`,450,226,25,'#f5e8bf');
 text(c,'RETURNING LANTERNS',450,904,23,'#ffedc5');
 for(let i=0;i<3;i++){const x=330+i*120;paper(c,x,947,108,72,'#153b3be8','#a58959');if(s.bay[i]){lantern(d,s.bay[i],x,934,25);text(c,s.bay[i].charge+' sparks',x,972,19,'#fff0cb');}else text(c,'·',x,947,30,'#a68c62');}
 s.queues.forEach((row,i)=>{const x=300+i*170;paper(c,x,1027,150,82,s.active?'#244946':'#fff0d6','#b99560',12);const p=row[0];if(p){lantern(d,p,x-40,1026,31);text(c,model.COLOURS[p.colour],x+25,1010,23,s.active?'#f3dfb2':'#57413a');text(c,p.charge+' sparks',x+25,1040,20,s.active?'#f3dfb2':'#57413a');row.slice(1).forEach((next,j)=>tag(c,PALETTE[next.colour],x+12+j*27,1060,6));}else text(c,'empty',x,1027,21,'#84694f');});
 button(c,'↶ UNDO',150,1031,110);
 footer(c,s,true);paintChapterReward(s,d,{dark:true});
}
const engine=study({id:'marquee',mode:'light-parade',title:'Lumi’s Light Parade',chapter:'First curtain',model,draw,
 intro:'Choose which lantern joins Lumi’s tiny trolley parade. The right order turns a dark marquee into a glowing paper stage.',
 instructions:'Tap a coloured lantern card at the bottom. You choose its colour; the trolley makes a lap and drops its sparks automatically. Four sparks means it can light four bulbs in total, not that it goes fourth. Only the bright outlined FRONT bulb in each column is reachable. The dim colours underneath are waiting their turn; lighting a front bulb exposes the next colour. Choose your next lantern from those exposed colours. Small coloured dots beneath each card show its later lanterns, from left to right. A lantern with sparks left returns to one of three waiting places; tap it to send again when its colour is exposed. A fourth returning lantern jams the rail. Chapter2 adds blue lanterns; Chapter3 adds moving shutters; Chapter4 has two-pip bulbs needing separate sparks; Chapter5 alternates parade direction; Chapter6 combines them. Light every bulb to finish. No timer.',
 keys:'1–3 launch queues · 4–6 waiting lanterns',
 tap(s,p){if(p.y>985&&p.y<1080){const q=Math.round((p.x-300)/170);if(q>=0&&q<3)model.send(s,'queue',q);}else if(p.y>912&&p.y<984){const i=Math.round((p.x-330)/120);if(i>=0&&i<3)model.send(s,'bay',i);}},
 key(s,k){if(/^[1-3]$/.test(k))model.send(s,'queue',Number(k)-1);if(/^[4-6]$/.test(k))model.send(s,'bay',Number(k)-4);},
});
engine.instructions='Watch the complete easy example: Pink lights the first row, Gold lights the row behind, then the sample reward appears. Play Chapter 1 starts your own curtain of 24 lights. '+engine.instructions;
const exampleModel={
 makeState:()=>model.makeSampleState(),
 step(s,dt){
  if(s.demoRewardAge!==undefined){s.demoRewardAge+=dt;return;}
  model.step(s,dt);
  if(s.phase==='celebrate'){
   s.phase='demo-finish';s.pendingPennies=0;s.demoRewardAge=0;
   s.note='All 12 lights are glowing. Easy demonstration complete; nothing collected.';
  }
 },
};
function drawExample(s,d){
 draw(s,d);
 if(s.demoRewardAge===undefined)return;
 const c=d.c,id=engine.prizes[0],t=s.demoRewardAge,turn=Math.max(0,t-.35)/3*4,i=Math.floor(turn)%4,mix=turn-Math.floor(turn),views=['front','right','back','left'];
 paper(c,450,565,610,465,'#173b39f5','#cfac6c');
 text(c,'DEMONSTRATION COMPLETE',450,385,29,'#ffe3a0');text(c,'Pink, then Gold · all 12 lights',450,430,25,'#f6e7c4');
 d.glow(450,565,140,'#ffe8a4');
 const a=d.art?.['study:'+id+':'+views[i]],b=d.art?.['study:'+id+':'+views[(i+1)%4]];
 if(a)d.sprite(a,450,565,{w:230,shadow:false,alpha:1-mix});
 if(b)d.sprite(b,450,565,{w:230,shadow:false,alpha:mix});
 if(!a&&!b)d.item(spriteKey(id),450,565,{w:230,shadow:false});
 text(c,'Sample chapter reward',450,710,24,'#ffe3a0');text(c,'No reward or pennies collected',450,752,22,'#dfdfc2');
}
const exampleBook=engine.navigationKey.replace(/\.selection$/,'');
function hasSavedFirst(){
 try{const current=localStorage.getItem(exampleBook);if(current)return !!JSON.parse(current)?.chapters?.[0];return !!localStorage.getItem(exampleBook.replace('.v2:','.v1:'));}catch{return true;}
}
export default withChapterExample(engine,{
 model:exampleModel,draw:drawExample,hideHouseClock:true,hasSavedFirst,
 steps:()=>[
  {caption:'The easy curtain has 12 lights. Only the bright FRONT row can be reached; it is all PINK.',point:{x:408,y:520},run:()=>{},after:1},
  {caption:'Tap PINK. Its six sparks travel round the rail and drop automatically onto the Pink front bulbs.',point:{x:300,y:1027},run:s=>model.send(s,'queue',0),done:s=>!s.active&&!s.shots.length,after:.7},
  {caption:'Pink is lit. GOLD is now the bright front row, so choose the Gold lantern next.',point:{x:492,y:520},run:()=>{},after:1},
  {caption:'Tap GOLD. Watch the sparks arrive: the easy round finishes only when every bulb is glowing.',point:{x:470,y:1027},run:s=>model.send(s,'queue',1),done:s=>s.demoRewardAge!==undefined,after:.3},
  {caption:'All 12 lights are on. Here is the sample reward; your own first chapter has 24 lights and returning lanterns.',point:{x:450,y:565},run:()=>{},done:s=>s.demoRewardAge>=4.2,after:.2},
 ],
 finishCaption:'Your turn: choose lantern colours that match the bright front bulbs. Light all 24 in Chapter 1. This sample collected nothing.',
});
