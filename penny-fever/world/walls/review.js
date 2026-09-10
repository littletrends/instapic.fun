import {WALL_ART} from './catalogue.js';
const list=document.querySelector('#wall-list'),filter=document.querySelector('#filter');
function show(){
 list.replaceChildren();
 for(const d of Object.values(WALL_ART)){
  if(filter.value!=='all'&&d.group!==filter.value)continue;
  const card=document.createElement('article'),img=new Image();img.src=d.source;img.alt=d.name+' — front, back, left and right wall artwork';img.loading='lazy';img.decoding='async';
  const copy=document.createElement('div');copy.className='copy';
  const title=document.createElement('h2');title.textContent=d.name;
  const detail=document.createElement('p');detail.textContent=d.secret+'.';
  const links=document.createElement('div');links.className='links';
  for(const [label,path] of [['Turn around','wall-studio.html?wall='+encodeURIComponent(d.id)],['Original PNG',d.sheet]]){
   const a=document.createElement('a');a.textContent=label;a.href=path;links.append(a);
  }
  copy.append(title,detail,links);card.append(img,copy);list.append(card);
 }
}
filter.addEventListener('change',show);show();
