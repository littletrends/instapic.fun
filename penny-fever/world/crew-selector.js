export const CREW_IDS=['bluebell','ruby','violet','oliver','sunny','rowan'];
const key='pf-selected-crew-v1',listeners=new Set();
let selected='oliver',book,opener;
try{const saved=localStorage.getItem(key);if(CREW_IDS.includes(saved))selected=saved;}catch{}
export const crewArt=id=>`assets/restyle/crew/${CREW_IDS.includes(id)?id:'oliver'}-turnaround.png`;
export const getDoll=()=>({crew:selected});
export function onDollChange(fn){listeners.add(fn);return()=>listeners.delete(fn);}
const name=id=>id[0].toUpperCase()+id.slice(1);
function refresh(){
 document.querySelectorAll('[data-crew]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.crew===selected)));
 const label=document.getElementById('chosenCrew');if(label)label.textContent=`Playing as ${name(selected)}`;
 const portrait=document.getElementById('chosenCrewPortrait');if(portrait){portrait.style.backgroundImage=`url('${crewArt(selected)}')`;portrait.setAttribute('aria-label',name(selected));}
 const status=document.getElementById('crewStatus');if(status)status.textContent=`${name(selected)} is ready for the midway.`;
}
export function chooseCrew(id){
 if(!CREW_IDS.includes(id))return false;selected=id;try{localStorage.setItem(key,id);}catch{}
 refresh();listeners.forEach(fn=>fn(getDoll()));return true;
}
function mount(){
 const door=document.getElementById('discoveryDoor');if(!door||document.getElementById('editCrew'))return;
 const panel=document.createElement('div');panel.className='crew-entry';
 panel.innerHTML='<span id="chosenCrewPortrait" class="crew-portrait" role="img"></span><div><p id="chosenCrew"></p><button type="button" id="editCrew" class="ticket-button">Edit character</button></div>';
 door.insertBefore(panel,door.querySelector('.admit-desk'));opener=panel.querySelector('button');
 book=document.createElement('dialog');book.className='crew-book';book.setAttribute('aria-labelledby','crewTitle');
 book.innerHTML=`<form method="dialog"><button class="crew-close" aria-label="Close character book">×</button></form>
 <p class="crew-kicker">Penny Fever · The original crew</p><h2 id="crewTitle">Choose your paper doll</h2>
 <p>Six familiar faces. All yours to play.</p><div class="crew-grid">${CREW_IDS.map(id=>`<button type="button" data-crew="${id}" aria-pressed="false"><span class="crew-portrait" data-crew-art="${crewArt(id)}" aria-hidden="true"></span><strong>${name(id)}</strong><small>Included</small></button>`).join('')}</div>
 <p id="crewStatus" role="status"></p><details class="crew-collections"><summary>The paper-doll collection</summary><p>Coming later: little cardboard costume books, with fold-over tabs, themed outfits and accessories for your crew. Your original six characters will stay free.</p></details>
 <form method="dialog"><button class="ticket-button">That’s me</button></form>`;
 document.body.append(book);
 const fillArt=()=>book.querySelectorAll('[data-crew-art]').forEach(el=>{if(!el.style.backgroundImage)el.style.backgroundImage=`url('${el.dataset.crewArt}')`;});
 opener.addEventListener('click',()=>{fillArt();refresh();book.showModal();});
 book.addEventListener('click',e=>{const b=e.target.closest('[data-crew]');if(b)chooseCrew(b.dataset.crew);});
 book.addEventListener('close',()=>opener.focus());refresh();
 globalThis.PennyFeverDoll={open:()=>{fillArt();refresh();if(!book.open)book.showModal();},close:()=>book.close(),get:getDoll};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
