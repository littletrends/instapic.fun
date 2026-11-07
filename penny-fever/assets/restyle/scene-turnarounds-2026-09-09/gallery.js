'use strict';
const data=JSON.parse(document.querySelector('#asset-data').textContent);
const order=['front','left','back','right'];
const names={vendors:'Stall vendor',stalls:'Stall',attendants:'Amusement attendant',amusements:'Amusement',aura:'Aura & ticket booth'};
const gallery=document.querySelector('#gallery');
const dialog=document.querySelector('#detail');
function buttonRow(parent,active,onChange){
 parent.replaceChildren();
 for(const view of order){
  const b=document.createElement('button');b.textContent=view[0].toUpperCase()+view.slice(1);b.type='button';b.setAttribute('aria-pressed',String(view===active));
  b.addEventListener('click',()=>{for(const other of parent.children)other.setAttribute('aria-pressed',String(other===b));onChange(view);});parent.append(b);
 }
}
function enlarge(asset,view){
 const img=document.querySelector('#detail-image');
 document.querySelector('#detail-title').textContent=asset.title;
 const update=v=>{img.src=`${asset.path}/${v}.png`;img.alt=`${asset.title}, ${v} view`;document.querySelector('#download').href=img.src;};
 update(view);buttonRow(document.querySelector('#detail-views'),view,update);dialog.showModal();
}
function render(){
 const term=document.querySelector('#search').value.toLowerCase().trim();const group=document.querySelector('#group').value;
 const assets=data.assets.filter(a=>(!group||a.group===group)&&`${a.title} ${a.id} ${a.pairedId||''}`.toLowerCase().includes(term));
 gallery.replaceChildren();document.querySelector('#empty').hidden=assets.length>0;
 document.querySelector('#count').textContent=`${assets.length} of ${data.assets.length} designs · four transparent views each`;
 for(const asset of assets){
  const card=document.createElement('article');card.className='card';const title=document.createElement('h2');title.textContent=asset.title;
  const kind=document.createElement('p');kind.className='kind';kind.textContent=names[asset.group];
  const stage=document.createElement('button');stage.className='stage';stage.type='button';stage.setAttribute('aria-label',`Enlarge ${asset.title}`);
  const img=document.createElement('img');img.src=`${asset.path}/preview.png`;img.alt=`${asset.title}, front view`;img.loading='lazy';img.decoding='async';stage.append(img);
  let view='front';stage.addEventListener('click',()=>enlarge(asset,view));
  const views=document.createElement('div');views.className='views';buttonRow(views,view,v=>{view=v;img.src=`${asset.path}/${v}.png`;img.alt=`${asset.title}, ${v} view`;});
  card.append(title,kind,stage,views);gallery.append(card);
 }
}
document.querySelector('#search').addEventListener('input',render);
document.querySelector('#group').addEventListener('change',render);
document.querySelector('#backdrop').addEventListener('change',e=>document.body.dataset.backdrop=e.target.value);
document.querySelector('#close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
render();
