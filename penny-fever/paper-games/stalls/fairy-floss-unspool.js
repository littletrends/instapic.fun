import {withChapterExample} from './chapter-example.js?v=example-1';
import * as model from './fairy-floss-unspool-model.js?v=studies-six-1';
import {study,prop,sugarLayer,paper,text,tag,button,compactHeader as header,compactFooter as footer,paintChapterReward,FLAVOUR_PALETTE as colours} from './study-kit.js?v=studies-six-1';
import {ease} from './study-state.js?v=studies-six-1';
let warmerArt=null;const warmerImage=typeof Image==='undefined'?null:new Image();if(warmerImage){warmerImage.onload=()=>{const c=document.createElement('canvas');c.width=warmerImage.width;c.height=warmerImage.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(warmerImage,0,0);const bytes=g.getImageData(0,0,c.width,c.height).data;let x0=c.width,y0=c.height,x1=0,y1=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(bytes[(y*c.width+x)*4+3]>32){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}if(x1<=x0||y1<=y0)return;warmerArt=document.createElement('canvas');warmerArt.width=x1-x0+1;warmerArt.height=y1-y0+1;warmerArt.getContext('2d').drawImage(warmerImage,x0,y0,warmerArt.width,warmerArt.height,0,0,warmerArt.width,warmerArt.height);};warmerImage.src=new URL('../assets/fairy-floss/warmer-rack-v1.png',import.meta.url).href;}
const X=[270,450,630];
function draw(s,d){const c=d.c,rules=model.rules(s),targets=model.targets(s);header(c,'FLOSSIE’S SUGAR UNSPOOL',(s.level+1)+' · '+rules.name);
 ;text(c,`${s.pulled.length} / ${targets.reduce((a,b)=>a+b,0)} strands · ${s.finished.filter(Boolean).length} / 4 clouds spun`,450,235,24,'#77564f');
 for(let i=0;i<3;i++){
  const pile=s.piles[i],x=X[i];prop(d,3,x,526,170,{alpha:pile.length ? .7 : .12});
  for(let r=0;r<pile.length;r++){const y=model.layerY(s,pile.length,r);sugarLayer(d,pile[r].colour,x,y,178,{alpha:r===pile.length-1?1:.9});if(pile[r].pair>=0){d.ellipse(x+64,y-4,9,5,null,'#bd9655',3);d.ellipse(x+78,y-4,9,5,null,'#bd9655',3);}}
  if(pile.length){const top=pile.at(-1);tag(c,colours[top.colour],x,700,20);text(c,model.FLAVOURS[top.colour],x,745,22,'#725248');text(c,'PULL '+(i+1),x,785,23,'#725248');}
  else{text(c,'spun!',x,650,26,'#725248');}
 }
 // Every tied companion follows its own visible filament to the same stick.
 if(s.motion){const m=s.motion,u=ease(m.t/m.duration);for(const part of [{pile:m.pile,strand:m.strand},...(m.companions||[])]){
  const from={x:X[part.pile],y:model.layerY(s,s.piles[part.pile].length+1,s.piles[part.pile].length)},to={x:330+m.slot*120,y:892};
  c.save();c.strokeStyle=colours[part.strand.colour];c.lineWidth=8;c.shadowColor='#a16e6540';c.shadowBlur=6;c.beginPath();c.moveTo(from.x,from.y);c.bezierCurveTo(from.x+Math.sin(u*Math.PI)*70,from.y+110,to.x-50,to.y-70,to.x,to.y);c.stroke();c.restore();d.circle(from.x+(to.x-from.x)*u,from.y+(to.y-from.y)*u,10,colours[part.strand.colour],'#fff2d9',2);
 }}
 if(warmerArt)d.sprite(warmerArt,450,921,{w:392,h:140,shadow:false});
 text(c,'WARMING STICKS',450,835,23,'#77564f');
 for(let i=0;i<3;i++){const x=330+i*120,h=s.holders[i];paper(c,x,921,108,126,s.selected===i?'#fff4d945':'#f4dfcb18',s.selected===i?'#b37c4f90':'#c49f8030');if(h){prop(d,4,x,918,66,{angle:s.motion?.slot===i?s.motion.t*6:0});tag(c,colours[h.colour],x,956,13);text(c,h.count+'/'+targets[h.colour],x,872,22);if(h.count)prop(d,3,x,889,30+h.count*14);}else{text(c,'+',x,920,32,'#b78e70');}}
 if(rules.order.length)rules.order.forEach((colour,i)=>{const x=225+i*150,done=i<s.served.length,next=i===s.served.length;paper(c,x,293,145,40,done?'#e0ddc7':'#fff2e4',next?'#966d36':'#c8ab90',9);text(c,model.FLAVOURS[colour],x,293,20,done?'#777b60':'#77564f');if(next)text(c,'↓',x,265,19,'#986832');});
 else text(c,'CHOOSE A FLAVOUR',450,295,23,'#77564f');
 for(let colour=0;colour<4;colour++){const x=240+colour*140;paper(c,x,354,126,66,s.stock[colour]?'#fff2df':'#dfcab8','#bf9476');tag(c,colours[colour],x-34,350,15);text(c,String(colour+4),x+11,350,23);if(s.finished[colour])prop(d,3,x,342,39);text(c,model.FLAVOURS[colour],x,402,20,'#77564f');}
 button(c,'↶ UNDO',150,1031,110);if(model.blocked(s)){paper(c,560,1031,350,48,'#fff0dcaa','#b997625c',9);text(c,'Tangled? Try Undo.',560,1031,21);}
 footer(c,s);paintChapterReward(s,d);
}
const engine=study({id:'fairy-floss',mode:'sugar-unspool',title:'Flossie’s Sugar Unspool',chapter:'Four flavours, three sticks',model,draw,
 intro:'Flossie has wrapped four flavours into three sugar clouds. Unwind their layers and spin four perfect little sticks.',
 instructions:'Choose a flavour card at the top to put its stick in one of three warming slots. Select a stick, then tap a matching front strand on a sugar cloud. The strand visibly unwinds onto your stick; deeper strands become reachable. Chapter1 needs three strands per flavour; later sticks show their own targets. In Chapter4, bow-tied strands must both be exposed before they can unwind together. Chapters5–6 serve full clouds in the displayed order; an early full cloud waits in its warming slot. There are four flavours but only three slots: choosing every colour you first see can leave no room for the colour buried underneath. Study the layers before filling the rack. Undo lets you rethink the order. Spin all four flavours to finish. No timer.',
 keys:'1–3 pull clouds · 4–7 choose flavour · A/S/D select stick',
 tap(s,p){if(p.y>315&&p.y<410){const i=Math.round((p.x-240)/140);if(i>=0&&i<4)model.pick(s,i);}else if(p.y>850&&p.y<990){const i=Math.round((p.x-330)/120);if(i>=0&&i<3)model.select(s,i);}else if(p.y>425&&p.y<815){const i=Math.round((p.x-270)/180);if(i>=0&&i<3)model.pull(s,i);}},
 key(s,k){if(/^[1-3]$/.test(k))model.pull(s,Number(k)-1);if(/^[4-7]$/.test(k))model.pick(s,Number(k)-4);const i=['a','s','d'].indexOf(k.toLowerCase());if(i>=0)model.select(s,i);},
});
const propsReady=engine.artReady;engine.artReady=()=>propsReady()&&!!warmerArt;
engine.instructions='Watch the whole easy sample: choose one strawberry stick, unwind three pink strands and serve one complete candy before its sample reward. Your own chapter keeps the full four-flavour puzzle. '+engine.instructions;
function sampleCloud(){
 const s=model.makeState(0),pile=s.piles[0];s.demo=true;
 s.piles[0]=[pile.find(strand=>strand.colour===2),...pile.filter(strand=>strand.colour===0)];
 s.note='Easy sample: one strawberry candy from three matching pink strands.';return s;
}
const sampleModel={
 makeState:sampleCloud,
 step(s,dt){
  if(s.demoRewardAge!==undefined){s.demoRewardAge+=dt;return;}
  model.step(s,dt);
  if(!s.motion&&s.finished[0]&&s.served.length===1&&s.served[0]===0){s.phase='demo-finish';s.pendingPennies=0;s.demoRewardAge=0;s.note='One strawberry candy served. This sample collected nothing.';}
 },
};
function sampleDraw(s,d){
 draw(s,d);const c=d.c;
 paper(c,450,235,570,53,'#fff2e4ed','#c2957b');text(c,`${s.pulled.length} / 3 pink strands · ${s.finished[0]?1:0} / 1 candy served`,450,235,24,'#77564f');
 if(s.demoRewardAge===undefined||s.demoRewardAge<.7)return;
 const id=engine.prizes[0],t=s.demoRewardAge-.7,views=['front','right','back','left'],turn=Math.max(0,t-.35)/3*4,i=Math.floor(turn)%4,mix=turn-Math.floor(turn);
 paper(c,450,565,590,450,'#fff0e7f7','#b28a4d');text(c,'DEMONSTRATION COMPLETE',450,390,28);text(c,'One strawberry candy served',450,433,25);
 d.glow(450,570,140,'#f6cc8e');const a=d.art['study:'+id+':'+views[i]],b=d.art['study:'+id+':'+views[(i+1)%4]];
 if(a)d.sprite(a,450,565,{w:230,shadow:false,alpha:1-mix});if(b)d.sprite(b,450,565,{w:230,shadow:false,alpha:mix});
 text(c,'Sample chapter reward',450,709,25);text(c,'No reward or pennies collected',450,752,22);
}
function sampleSavedFirst(){
 try{const key=engine.navigationKey.replace(/\.selection$/,'');return !!JSON.parse(localStorage.getItem(key)||'null')?.chapters?.[0]||!!JSON.parse(localStorage.getItem(key.replace('.v2:','.v1:'))||'null')?.snapshot;}catch{return true;}
}
const flossieExample={
 model:sampleModel,draw:sampleDraw,captionY:170,hasSavedFirst:sampleSavedFirst,
 steps:()=>[
  {caption:'Make ONE easy strawberry candy. First choose the pink STRAWBERRY card: its stick goes into a warming slot.',point:{x:240,y:350},run:s=>model.pick(s,0),after:.65},
  {caption:'Pull the front pink strand from the FIRST cloud. Watch its sugar ribbon unwind onto your turning stick.',point:s=>({x:X[0],y:model.layerY(s,s.piles[0].length,s.piles[0].length-1)}),run:s=>model.pull(s,0),done:s=>!s.motion&&s.holders[0]?.count===1,after:.45},
  {caption:'Another pink strand is ready. Pull it onto the SAME stick: two of its three matching strands are packed.',point:s=>({x:X[0],y:model.layerY(s,s.piles[0].length,s.piles[0].length-1)}),run:s=>model.pull(s,0),done:s=>!s.motion&&s.holders[0]?.count===2,after:.45},
  {caption:'Pull the last pink strand. The full strawberry candy is served, and its warming slot becomes free.',point:s=>({x:X[0],y:model.layerY(s,s.piles[0].length,s.piles[0].length-1)}),run:s=>model.pull(s,0),done:s=>s.demoRewardAge!==undefined,after:.8},
  {caption:'One whole candy served! This is the sample reward. Your real chapter needs all FOUR flavours, with only THREE warming slots.',point:{x:450,y:565},run:()=>{},done:s=>s.demoRewardAge>=4.9,after:.2},
 ],
 finishCaption:'Your turn: choose a flavour, pull its matching front strands, then free the warming slot by finishing its candy. This sample collected nothing.',
};
export default withChapterExample(engine,flossieExample);
