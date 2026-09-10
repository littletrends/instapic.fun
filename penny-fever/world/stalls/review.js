import {STALL_ART} from './catalogue.js';
import {loadStallArt,loadPaperArt} from './art.js';
import {AMUSEMENT_ART} from '../amusements/catalogue.js';
const amusements=document.body.dataset.collection==='amusements',catalogue=amusements?AMUSEMENT_ART:STALL_ART;
const picker=document.querySelector('#stall-choice'),grid=document.querySelector('#art-grid'),status=document.querySelector('#status'),ids=Object.keys(catalogue);let sequence=0;
for(const id of ids){const o=document.createElement('option');o.value=id;o.textContent=catalogue[id].name+' · '+catalogue[id].host;picker.append(o);}
async function select(id){
 const seq=++sequence;picker.value=id;grid.replaceChildren();status.textContent='Preparing the same eight views used in the game…';
 document.querySelector('#model-link').href=(amusements?'amusement-studio':'stall-studio')+'.html?stall='+encodeURIComponent(id);
 const url=new URL(location.href);url.searchParams.set('stall',id);history.replaceState(null,'',url);
 try{const art=await (amusements?loadPaperArt(catalogue[id]):loadStallArt(id));if(seq!==sequence)return;
  for(const [type,maps] of [['Host',art.host],['Stall',art.stall]])for(const [i,map] of maps.entries()){
   const f=document.createElement('figure'),c=document.createElement('canvas'),caption=document.createElement('figcaption');
   c.width=map.image.width;c.height=map.image.height;c.getContext('2d').drawImage(map.image,0,0);caption.textContent=type+' · '+['Front','Left','Back','Right'][i];
   f.append(c,caption);grid.append(f);
  }status.textContent='Four host views and four stall views loaded.';
 }catch(error){if(seq===sequence)status.textContent='Artwork could not load. Choose the stall again to retry.';console.warn(error);}
}
picker.addEventListener('change',()=>select(picker.value));for(const [name,step] of [['previous',-1],['next',1]])document.querySelector('#'+name).addEventListener('click',()=>select(ids[(ids.indexOf(picker.value)+step+ids.length)%ids.length]));
const requested=new URLSearchParams(location.search).get('stall');select(catalogue[requested]?requested:amusements?'aura-ticket-booth':'fortune');
