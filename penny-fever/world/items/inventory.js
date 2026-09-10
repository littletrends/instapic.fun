import {loadArt,paintIcon} from './art.js?v=treasures-1';
const model=globalThis.PennyFeverInventoryModel;
const studio=document.body.dataset.objectStudio==='true';
const iconCache=new Map();let dialog,viewer,current=null,selectionToken=0,listToken=0,opener,resumeWorld=false,openedHash='',observer;
const $=id=>document.getElementById(id);
const state=()=>globalThis.PennyFever?.getState()||{};
const entries=()=>studio?model.definitions.map(d=>({...d,owned:true,quantity:1,status:'Object study',punched:false})):model.entries(state());
const text=(id,value)=>{$(id).textContent=value;};
function mount(){
  if(!model)return;
  const launch=document.createElement('button');launch.type='button';launch.id='openTreasures';
  launch.className=studio?'treasure-launch':'ticket-button door-pocket';
  launch.textContent=studio?'Open the object cabinet':'Your pocket';
  const door=document.getElementById('discoveryDoor');
  if(!studio&&door){
    const crew=door.querySelector('.door-crew');
    door.insertBefore(launch,crew||null);
  }else document.body.append(launch);
  launch.addEventListener('click',()=>open());
  dialog=document.createElement('dialog');dialog.className='treasure-book';dialog.setAttribute('aria-labelledby','treasureTitle');
  dialog.innerHTML=`<header class="treasure-header"><div><p class="treasure-eyebrow">Penny Fever · Little things to keep</p><h1 id="treasureTitle">Your pocket</h1><p id="treasureCount"></p></div><button type="button" id="closeTreasures" aria-label="Close your pocket">Close ×</button></header>
  <p id="treasureSave" class="treasure-save" role="status" hidden></p>
  <div class="treasure-layout"><aside class="treasure-shelves"><label for="treasureSearch">Find a keepsake</label><input type="search" id="treasureSearch" placeholder="Name or stall"><label class="treasure-owned"><input type="checkbox" id="treasureOwned"> Collected only</label><div id="treasureItems"></div><p id="treasureEmpty" hidden>No keepsakes match that search.</p></aside>
  <section class="treasure-inspection" aria-labelledby="treasureName"><p id="treasureSource" class="treasure-eyebrow"></p><h2 id="treasureName"></h2><p id="treasureStatus"></p><div class="treasure-stage" id="treasureStage" tabindex="0" role="group"></div><p id="treasureLoading" role="status"></p><button type="button" id="treasureRetry" hidden>Try loading again</button>
  <div class="treasure-controls" id="treasureControls"><button type="button" data-side="front">Front</button><button type="button" data-side="left">Left</button><button type="button" data-side="back">Back</button><button type="button" data-side="right">Right</button><button type="button" id="treasureSmaller" aria-label="Zoom out">−</button><button type="button" id="treasureLarger" aria-label="Zoom in">+</button><button type="button" id="treasureOpen" aria-expanded="false" hidden>Open</button><button type="button" id="treasurePunch" hidden>Show punched ticket</button></div>
  <p id="treasureHow">Drag to turn. Arrow keys turn and tilt; Home shows the front.</p><p id="treasureHint"></p><p id="treasureDetail"></p></section></div>`;
  document.body.append(dialog);
  $('closeTreasures').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',close);
  $('treasureSearch').addEventListener('input',renderList);
  $('treasureOwned').addEventListener('change',renderList);
  $('treasureItems').addEventListener('click',e=>{const b=e.target.closest('[data-item]');if(b)select(b.dataset.item);});
  dialog.querySelectorAll('[data-side]').forEach(b=>b.addEventListener('click',()=>viewer?.view(b.dataset.side)));
  $('treasureLarger').addEventListener('click',()=>viewer?.magnify(.1));
  $('treasureSmaller').addEventListener('click',()=>viewer?.magnify(-.1));
  $('treasureOpen').addEventListener('click',()=>{const on=viewer?.toggleOpen();$('treasureOpen').textContent=on?'Close':'Open';$('treasureOpen').setAttribute('aria-expanded',String(!!on));});
  $('treasurePunch').addEventListener('click',()=>{if(studio&&current?.id==='admission-ticket')select(current.id,!current.punched);});
  $('treasureRetry').addEventListener('click',()=>{if(current)select(current.id);});
  window.addEventListener('pennyfever:statechange',e=>{
    if(!dialog.open)return;
    $('treasureSave').hidden=e.detail?.persisted!==false;
    text('treasureSave','Your browser could not save this change. Keep this tab open to retain this visit.');
    renderList();
    const fresh=entries().find(i=>i.id===current?.id);
    if(fresh){if(fresh.owned!==current.owned||fresh.punched!==current.punched)select(fresh.id);else{current=fresh;describe(fresh);}}
  });
  window.addEventListener('hashchange',()=>{if(dialog.open)dialog.close();updateLaunch();});
  const notice=document.createElement('p');notice.className='treasure-notice';notice.setAttribute('role','status');notice.hidden=true;document.body.append(notice);let noticeTimer;
  window.addEventListener('pennyfever:inventoryaward',e=>{
    const names=(e.detail?.ids||[]).map(id=>model.definitions.find(d=>d.id===id)?.name).filter(Boolean);
    if(!names.length)return;notice.textContent=`Kept in your pocket: ${names.join(' · ')}`;notice.hidden=false;
    clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{notice.hidden=true;},6500);
  });
  // Avoid minigame shortcuts firing through the modal; its own controls still work.
  dialog.addEventListener('keydown',e=>e.stopPropagation());
  globalThis.PennyFeverInventory={open,close:()=>dialog.close()};
  updateLaunch();if(studio)open('everyday-penny');
}
function updateLaunch(){const launch=$('openTreasures');if(launch)launch.hidden=!studio&&location.hash.startsWith('#cabinet/');}
function renderList(){
  if(!dialog.open)return;
  observer?.disconnect();const token=++listToken,all=entries(),q=$('treasureSearch').value.toLowerCase().trim();
  const shown=all.filter(i=>(!$('treasureOwned').checked||i.owned)&&`${i.name} ${i.source} ${i.category}`.toLowerCase().includes(q));
  const root=$('treasureItems');root.replaceChildren();
  text('treasureCount',studio?`${all.length} individual paper objects`:`${all.filter(i=>i.owned&&i.kind!=='currency').length} keepsakes · ${all[0].quantity} demo pennies`);
  $('treasureEmpty').hidden=shown.length!==0;
  const queue=[];let running=0;
  function pump(){while(running<2&&queue.length){const {canvas,item}=queue.shift();running++;
    loadArt(item).then(art=>{
      const icon=document.createElement('canvas');paintIcon(icon,art,item.punched?2:0);iconCache.set(item.id+':'+!!item.punched,icon);
      if(token===listToken&&canvas.isConnected)canvas.getContext('2d').drawImage(icon,0,0);
    }).catch(()=>{}).finally(()=>{running--;if(token===listToken)pump();});
  }}
  observer=new IntersectionObserver(changes=>{
    for(const change of changes)if(change.isIntersecting){observer.unobserve(change.target);const item=shown.find(i=>i.id===change.target.dataset.icon);if(item)queue.push({canvas:change.target,item});}pump();
  },{root:$('treasureItems'),rootMargin:'30px'});
  for(const item of shown){
    const button=document.createElement('button');button.type='button';button.className='treasure-slot';button.dataset.item=item.id;button.setAttribute('aria-pressed',String(item.id===current?.id));
    if(item.owned){
      const c=document.createElement('canvas');c.width=c.height=128;c.dataset.icon=item.id;c.setAttribute('aria-hidden','true');button.append(c);
      const cached=iconCache.get(item.id+':'+!!item.punched);if(cached)c.getContext('2d').drawImage(cached,0,0);else observer.observe(c);
    }else{const mark=document.createElement('span');mark.className='treasure-uncollected';mark.textContent='◇';mark.setAttribute('aria-hidden','true');button.append(mark);}
    const label=document.createElement('span'),name=document.createElement('strong'),status=document.createElement('small');name.textContent=item.name;status.textContent=item.status;label.append(name,status);button.append(label);root.append(button);
  }
}
function describe(item){
  text('treasureName',item.name);text('treasureSource',item.source);text('treasureStatus',item.status);text('treasureHint',item.hint);
  text('treasureDetail',item.id==='moonlight-wardrobe'?'A collectible costume book. The six original crew remain free; wearing these outfits will follow.':item.id==='night-suitcase'?'A little home for the things you bring back from the midway.':'');
}
async function select(id,punchedOverride){
  const item=entries().find(i=>i.id===model.resolve(id));if(!item)return;
  if(studio&&punchedOverride!==undefined)item.punched=punchedOverride;
  current=item;const token=++selectionToken;describe(item);viewer?.destroy();viewer=null;$('treasureStage').replaceChildren();
  $('treasureControls').hidden=true;$('treasureHow').hidden=true;$('treasureRetry').hidden=true;
  dialog.querySelectorAll('[data-side="left"],[data-side="right"]').forEach(b=>{b.hidden=false;});
  $('treasureOpen').hidden=!item.hinged;$('treasureOpen').textContent='Open';$('treasureOpen').setAttribute('aria-expanded','false');
  $('treasurePunch').hidden=!(studio&&item.id==='admission-ticket');$('treasurePunch').textContent=item.punched?'Show intact ticket':'Show punched ticket';
  dialog.querySelectorAll('[data-item]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.item===item.id)));
  text('treasureLoading',item.owned?'Unwrapping your keepsake…':'There is a place waiting for this one.');
  if(!item.owned)return;
  try{
    const [art,{ObjectViewer}]=await Promise.all([loadArt(item),import('./viewer.js?v=treasures-1')]);
    if(token!==selectionToken||!dialog.open)return;
    let flat=false;
    viewer=new ObjectViewer($('treasureStage'),()=>{flat=true;text('treasureHow','Use Front and Back to look at both sides.');dialog.querySelectorAll('[data-side="left"],[data-side="right"]').forEach(b=>{b.hidden=true;});});
    viewer.show(item,art);$('treasureControls').hidden=false;$('treasureHow').hidden=false;
    text('treasureHow',flat?'Use Front and Back to look at both sides.':'Drag to turn. Arrow keys turn and tilt; Home shows the front.');
    text('treasureLoading','');
  }catch(error){
    if(token!==selectionToken||!dialog.open)return;
    text('treasureLoading','This keepsake could not be opened. Your collection is still saved.');$('treasureRetry').hidden=false;
  }
}
function open(id){
  if(!dialog||(!studio&&/\/play$/.test(location.hash)))return false;
  if(!dialog.open){
    opener=document.activeElement;openedHash=location.hash;
    const world=globalThis.PennyFeverWorld;resumeWorld=!!(world?.started&&!world.paused&&document.body.classList.contains('is-in-world'));
    if(resumeWorld)world.pause();
    document.body.classList.add('has-treasure-open');dialog.showModal();
    $('treasureSave').hidden=globalThis.PennyFeverSavePersisted!==false;
    text('treasureSave','Your browser could not save this change. Keep this tab open to retain this visit.');
    if(!studio&&model.reconcile(state()))globalThis.PennyFever?.saveState();
  }
  renderList();select(id||current?.id||'everyday-penny');return true;
}
function close(){
  selectionToken++;listToken++;observer?.disconnect();viewer?.destroy();viewer=null;
  document.body.classList.remove('has-treasure-open');
  if(resumeWorld&&location.hash===openedHash&&document.body.classList.contains('is-in-world'))globalThis.PennyFeverWorld?.resume();
  resumeWorld=false;if(opener?.isConnected)opener.focus();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
