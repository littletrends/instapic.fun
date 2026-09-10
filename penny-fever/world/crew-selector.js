export const CREW_IDS=['bluebell','ruby','violet','oliver','sunny','rowan'];
const key='pf-selected-crew-v1',listeners=new Set();
const VIEWS=['front','left','back','right'];
let selected='oliver',book,opener,runwayDoll,viewIndex=0,falling=false;
try{const saved=localStorage.getItem(key);if(CREW_IDS.includes(saved))selected=saved;}catch{}
export const crewArt=id=>`assets/restyle/crew/${CREW_IDS.includes(id)?id:'oliver'}-turnaround.png`;
export const getDoll=()=>({crew:selected});
export function onDollChange(fn){listeners.add(fn);return()=>listeners.delete(fn);}
const name=id=>id[0].toUpperCase()+id.slice(1);
function poseDoll(el,id,view){
 if(!el)return;
 el.style.backgroundImage=`url('${crewArt(id)}')`;
 el.style.backgroundPosition=`${(view%4)*33.333}% 0`;
 el.dataset.crew=id;
 el.dataset.view=String(view%4);
}
function paintViewLabel(){
 const label=document.getElementById('crewViewLabel');
 if(label)label.textContent=VIEWS[viewIndex%4];
}
function refresh(){
 document.querySelectorAll('[data-crew]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.crew===selected)));
 const label=document.getElementById('chosenCrew');if(label)label.textContent=`Playing as ${name(selected)}`;
 const portrait=document.getElementById('chosenCrewPortrait');if(portrait){portrait.style.backgroundImage=`url('${crewArt(selected)}')`;portrait.setAttribute('aria-label',name(selected));}
 const status=document.getElementById('crewStatus');if(status)status.textContent=`${name(selected)} is ready for the midway.`;
 if(runwayDoll&&!falling)poseDoll(runwayDoll,selected,viewIndex);
 paintViewLabel();
}
function turn(dir){
 viewIndex=(viewIndex+dir+4)%4;
 if(runwayDoll)poseDoll(runwayDoll,selected,viewIndex);
 paintViewLabel();
}
export function chooseCrew(id){
 if(!CREW_IDS.includes(id)||id===selected){selected=id;refresh();return true;}
 const next=id;
 if(!runwayDoll||falling){
  selected=next;viewIndex=0;try{localStorage.setItem(key,selected);}catch{}
  refresh();listeners.forEach(fn=>fn(getDoll()));return true;
 }
 falling=true;
 runwayDoll.classList.remove('is-arriving');
 runwayDoll.classList.add('is-falling');
 const finish=()=>{
  runwayDoll.removeEventListener('animationend',finish);
  selected=next;viewIndex=0;try{localStorage.setItem(key,selected);}catch{}
  poseDoll(runwayDoll,selected,0);
  runwayDoll.classList.remove('is-falling');
  runwayDoll.classList.add('is-arriving');
  falling=false;
  refresh();listeners.forEach(fn=>fn(getDoll()));
 };
 runwayDoll.addEventListener('animationend',finish,{once:true});
 setTimeout(()=>{if(falling)finish();},520);
 return true;
}
function mount(){
 const door=document.getElementById('discoveryDoor');if(!door||document.getElementById('editCrew'))return;
 const panel=document.createElement('div');panel.className='crew-entry';
 panel.innerHTML='<span id="chosenCrewPortrait" class="crew-portrait" role="img"></span><div><p id="chosenCrew"></p><button type="button" id="editCrew" class="ticket-button">Edit character</button></div>';
 door.insertBefore(panel,door.querySelector('.admit-desk'));opener=panel.querySelector('button');
 book=document.createElement('dialog');book.className='crew-book';book.setAttribute('aria-labelledby','crewTitle');
 book.innerHTML=`<form method="dialog"><button class="crew-close" aria-label="Close character book">×</button></form>
 <p class="crew-kicker">Penny Fever · The original crew</p><h2 id="crewTitle">Choose your paper doll</h2>
 <p>They take a little runway turn. Pick one and the last doll falls away.</p>
 <div class="crew-runway" aria-hidden="true">
  <div class="crew-runway-board"></div>
  <div class="crew-runway-stage"><div id="crewRunwayDoll" class="crew-runway-doll crew-portrait"></div></div>
 </div>
 <div class="crew-runway-turn">
  <button type="button" id="crewTurnLeft" aria-label="Show previous view">◀ Back</button>
  <span id="crewViewLabel">front</span>
  <button type="button" id="crewTurnRight" aria-label="Show next view">Forth ▶</button>
 </div>
 <div class="crew-grid">${CREW_IDS.map(id=>`<button type="button" data-crew="${id}" aria-pressed="false"><span class="crew-portrait" data-crew-art="${crewArt(id)}" aria-hidden="true"></span><strong>${name(id)}</strong><small>Included</small></button>`).join('')}</div>
 <p id="crewStatus" role="status"></p><details class="crew-collections"><summary>The paper-doll collection</summary><p>Coming later: little cardboard costume books, with fold-over tabs, themed outfits and accessories for your crew. Your original six characters will stay free.</p></details>
 <form method="dialog"><button class="ticket-button">That’s me</button></form>`;
 document.body.append(book);
 runwayDoll=book.querySelector('#crewRunwayDoll');
 const fillArt=()=>book.querySelectorAll('[data-crew-art]').forEach(el=>{if(!el.style.backgroundImage)el.style.backgroundImage=`url('${el.dataset.crewArt}')`;});
 opener.addEventListener('click',()=>{fillArt();viewIndex=0;refresh();book.showModal();});
 book.addEventListener('click',e=>{
  if(e.target.closest('#crewTurnLeft')){turn(-1);return;}
  if(e.target.closest('#crewTurnRight')){turn(1);return;}
  const b=e.target.closest('[data-crew]');if(b)chooseCrew(b.dataset.crew);
 });
 book.addEventListener('close',()=>opener.focus());refresh();
 globalThis.PennyFeverDoll={open:()=>{fillArt();viewIndex=0;refresh();if(!book.open)book.showModal();},close:()=>book.close(),get:getDoll};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
