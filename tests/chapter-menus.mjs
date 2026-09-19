import {spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
// Serve this checkout first: python3 -m http.server 4187 --bind 127.0.0.1
import assert from 'node:assert/strict';
const profile=await mkdtemp('/tmp/chapter-browser-');
const browser=spawn('/usr/lib/chromium/chromium',['--headless=new','--no-sandbox','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let socket;
try{
 let port;for(let i=0;i<100;i++){try{port=(await readFile(profile+'/DevToolsActivePort','utf8')).split('\n')[0];break;}catch{await sleep(100);}}
 assert(port,'Browser started');
 const tabs=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
 socket=new WebSocket(tabs.find(x=>x.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});
 let seq=0;const pending=new Map(),errors=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 socket.onmessage=async e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);else if(m.method==='Fetch.requestPaused'){
  const p=m.params;if(p.request.url.includes('/paper-games/runtime.js?')){
   const response=await fetch(p.request.url);assert(response.ok);const src=await response.text();
   await send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/javascript'}],body:Buffer.from(src+'\nwindow.__test={state:()=>state,engine:()=>engine,pause:stop,start,level:()=>level,playing:()=>playing,holds:()=>[...holds]};').toString('base64')});
  }else await send('Fetch.continueRequest',{requestId:p.requestId});
 }};
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});assert(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 const until=async expression=>{for(let i=0;i<120;i++){if(await ev(expression))return;await sleep(100);}throw Error('Timed out: '+expression+' '+JSON.stringify(await ev('({url:location.href,error:document.querySelector("#error")?.textContent,body:document.body.innerText.slice(-1200)})')))};
 await send('Page.enable');await send('Runtime.enable');
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.canvasLabels=[];const originalFillText=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){window.canvasLabels.push(String(text));return originalFillText.call(this,text,...args);};`});await send('Fetch.enable',{patterns:[{urlPattern:'*paper-games/runtime.js?*'}]});
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 const base=process.env.CHAPTER_TEST_BASE||'http://127.0.0.1:4187';
 const {games}=await import(new URL('penny-fever/paper-games/catalogue.js',root));
 for(const {id} of games.filter(g=>g.ready&&g.id!=='snap')){
  await send('Page.navigate',{url:base+'/penny-fever/paper-games/play.html?stall='+id});await until('!!window.__test && !document.querySelector("#chapter").disabled');
  assert.equal(await ev('document.querySelector("#error").textContent'),'');
  assert.equal(await ev('document.querySelector("#chapter").options.length'),6,id+' six chapters');
  assert(await ev('document.documentElement.scrollWidth<=innerWidth'),id+' fits');
  const before=await ev('document.querySelector("#world").getBoundingClientRect().toJSON()');
  assert(before.bottom<=844&&before.right<=390,id+' board fits viewport');
  await ev('document.querySelector("#menu-toggle").click()');assert(await ev('document.querySelector("#game-help").open'));
  await ev('document.querySelector("#menu-close").click()');await sleep(50);assert.equal(await ev('__test.playing()'),false,'Help does not start unstarted game');
  await ev('document.querySelector("#begin").click()');
  await ev('document.querySelector("#menu-toggle").click()');assert.equal(await ev('__test.playing()'),false);
  await ev('document.querySelector("#menu-close").click()');await until('__test.playing()');
  await ev('document.querySelector("#next-chapter").click()');assert.equal(await ev('__test.level()'),1);
  await ev('document.querySelector("#chapter").value=5;document.querySelector("#chapter").dispatchEvent(new Event("change"))');
  assert.equal(await ev('__test.level()'),5);assert(await ev('document.querySelector("#next-chapter").disabled'));
  await send('Page.reload');await until('!!window.__test');assert.equal(await ev('__test.level()'),5,id+' selected survives reload');
  await ev('document.querySelector("#chapter").value=0;document.querySelector("#chapter").dispatchEvent(new Event("change"));__test.pause()');
  // Exercise the real shared runtime with each engine's terminal-state contract.
  const fixture=id==='fortune'?`(()=>{const s=__test.state(),e=__test.engine();s.phase='idle';s.charged=false;e.action(s,'gaze');e.update(s,3);for(let i=0;i<s.globe.rings.length;i++){const ring=s.globe.rings[i];ring.angle=ring.glyphs.indexOf(s.globe.flash[i])*Math.PI*2/ring.n;e.pointer(s,'down',{x:450,y:428});}})()`:
   id==='coin-pusher'?`Object.assign(__test.state(),{phase:'idle',busy:false});__test.state().tray.treasureOwned=true`:
   id==='pinball'?`__test.state().prizeKept=true;__test.state().chapterPrize.phase='gone'`:
   `__test.state().result={title:'Chapter cleared',detail:'Fixture completion',won:true,prize:null,settle:true}`;
  await ev('window.canvasLabels=[];'+fixture+';__test.start()');await until('!document.querySelector("#veil").hidden && document.querySelector("#begin").textContent==="Next chapter"');
  assert.deepEqual(await ev('canvasLabels.filter(t=>/next chapter|last chapter|try again|not this catch/i.test(t))'),[],id+' has no legacy chapter card on the canvas');
  assert.equal(await ev('document.querySelectorAll("#veil:not([hidden])").length'),1,id+' uses one shared result panel');
  if(id==='fortune'){
   assert(await ev('__test.state().caught'),'real Iris catch completes');
   assert(await ev('document.querySelector("#veil-detail").textContent.includes(__test.state().fortune)'),'shared panel retains Iris reading');
   assert(!await ev('canvasLabels.includes(__test.state().fortune)'),'no duplicate canvas fortune');
   const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/iris-shared-result.png',Buffer.from(shot.data,'base64'));
  }
  await ev('window.postMessage({channel:"pf-paper-world",type:"pause"},location.origin);window.postMessage({channel:"pf-paper-world",type:"resume"},location.origin)');await sleep(100);
  assert.equal(await ev('document.querySelector("#begin").textContent'),'Next chapter','Menu close preserves result');
  await ev('document.querySelector("#begin").click()');assert.equal(await ev('__test.level()'),1,id+' completion advances');
  console.log('PASS '+id+': terminal popup, next/previous/select, reload, help pause, mobile fit');
 }
 console.log('PASS all 33 open games: one shared result panel, no canvas chapter buttons, chapter navigation and reload');
 assert.deepEqual(errors,[],'No browser exceptions');
 // Full alley shell: use a private fixture wallet, real vendor and inventory UI stub.
 await send('Page.navigate',{url:base+'/tests/fixtures/chapter-menu.html'});await until('!!document.querySelector("iframe")?.contentWindow?.__test');
 const f='document.querySelector("iframe").contentWindow';
 await until('!document.querySelector(".paper-chapter-nav select").disabled');
 await ev(f+'.document.querySelector("#begin").click()');
 const rect=await ev('document.querySelector("iframe").getBoundingClientRect().toJSON()');
 await ev('[...document.querySelectorAll(".paper-game-bar>button")].find(x=>x.textContent==="Penny Trade").click()');await sleep(100);
 assert.equal(await ev(f+'.__test.playing()'),false);assert.deepEqual(await ev('document.querySelector("iframe").getBoundingClientRect().toJSON()'),rect,'Trade never resizes board');
 assert(await ev('document.querySelector(".paper-game-trade").open'));
 await ev('document.querySelector(".paper-game-menu-close").click()');await until(f+'.__test.playing()');
 await ev('document.querySelector(".paper-game-treasure").click()');await sleep(100);assert.equal(await ev(f+'.__test.playing()'),false);
 await ev('document.querySelector(".treasure-book").close()');await until(f+'.__test.playing()');
 await ev('document.querySelector(".paper-chapter-nav select").value=3;document.querySelector(".paper-chapter-nav select").dispatchEvent(new Event("change"))');await until(f+'.__test.level()===3');
 await ev('[...document.querySelectorAll(".paper-game-bar>button")].find(x=>x.textContent==="Help").click()');await until(f+'.document.querySelector("#game-help").open');
 await ev(f+'.document.querySelector("#menu-close").click()');
 for(const size of [{width:390,height:844},{width:320,height:568},{width:1440,height:900}]){
  await send('Emulation.setDeviceMetricsOverride',{...size,deviceScaleFactor:1,mobile:size.width<700});await sleep(100);
  assert(await ev('document.documentElement.scrollWidth<=innerWidth'),'Outer bar fits '+size.width);
  const boxes=await ev('[...document.querySelectorAll(".paper-game-bar>button,.paper-chapter-nav")].map(e=>e.getBoundingClientRect().toJSON())');
  assert(boxes.every(b=>b.left>=0&&b.right<=size.width),'All controls inside viewport '+size.width);
  const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/chapter-menu-'+size.width+'.png',Buffer.from(shot.data,'base64'));
 }
 // Save/return checks exercise each real engine through the live iframe route.
 for(const id of ['fortune','coin-pusher','pinball','milk-bottles']){
  await send('Page.navigate',{url:base+'/tests/fixtures/chapter-menu.html?stall='+id});
  await until('!!document.querySelector("iframe")?.contentWindow?.__test?.state()');
  await ev(f+'.document.querySelector("#chapter").value=0;'+f+'.document.querySelector("#chapter").dispatchEvent(new Event("change"))');
  const snapshot = id==='fortune'?`({phase:s.phase,globe:s.globe,clock:s.clock,charged:s.charged})`:
    id==='coin-pusher'?`({phase:s.phase,coins:s.tray.coins,cycle:s.cycle})`:
    id==='pinball'?`({houseLeft:s.houseLeft,ball:s.ball,credit:s.credit,rngState:s.rngState})`:
    `({houseLeft:s.houseLeft,board:s.board,charged:s.charged})`;
  await ev(`(()=>{const t=${f}.__test,s=t.state(),e=t.engine();t.pause();${id==='fortune'?"e.action(s,'gaze');e.update(s,.4)":id==='coin-pusher'?"e.action(s,'drop1');e.update(s,.1)":id==='milk-bottles'?"e.action(s,'play');s.houseLeft=47":"s.houseLeft=47;s.credit=2"};e.persist(s);})()`);
  const saved=await ev(`(()=>{const s=${f}.__test.state();return ${snapshot};})()`);
  const pennies=await ev('window.fixtureCash');
  await ev(`const c=${f}.document.querySelector('#chapter');c.value=1;c.dispatchEvent(new Event('change'));c.value=0;c.dispatchEvent(new Event('change'));${f}.__test.pause()`);
  const returned=await ev(`(()=>{const s=${f}.__test.state();return ${snapshot};})()`);
  assert.deepEqual(returned,saved,id+' exact state on chapter return');
  assert.equal(await ev('window.fixtureCash'),pennies,id+' switching does not charge');
  await send('Page.reload');await until('!!document.querySelector("iframe")?.contentWindow?.__test?.state()');
  assert.deepEqual(await ev(`(()=>{const s=${f}.__test.state();return ${snapshot};})()`),saved,id+' exact state after reload');
  console.log('PASS '+id+': exact engine state through chapter return and reload');
 }
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await send('Page.navigate',{url:base+'/penny-fever/index.html?dev=1#cabinet/pinball'});
 await until('!!document.querySelector("#cabinet-pinball iframe")?.contentWindow?.__test?.state()');
 await ev('[...document.querySelectorAll("#cabinet-pinball .paper-game-bar>button")].find(x=>x.textContent==="Penny Trade").click()');
 assert(await ev('document.querySelector("#cabinet-pinball .paper-game-trade").open'),'Full app trade opens');
 const fullShot=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/chapter-full-app.png',Buffer.from(fullShot.data,'base64'));
 assert.deepEqual(errors,[],'No browser exceptions');
 console.log('PASS full app route and trade panel');
 console.log('PASS parent bar: chapter sync, Help, Trade and Treasures pause/close, board size stable, 320/390/1440 widths');
}finally{socket?.close();browser.kill('SIGTERM');}
