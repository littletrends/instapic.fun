import {games} from './catalogue.js';
document.querySelector('#progress').textContent=games.filter(g=>g.ready).length+' of '+games.length+' interiors available to try';
const root=document.querySelector('#catalogue');
for(const [i,g] of games.entries()){
 const a=document.createElement(g.ready?'a':'article');a.className='game-card'+(g.ready?'':' queued');
 if(g.ready)a.href=g.direct||'play.html?stall='+encodeURIComponent(g.id);
 const img=document.createElement('img');img.loading='lazy';img.decoding='async';img.alt='';
 img.src=g.asset;
 if(g.ready)a.append(img);
 const body=document.createElement('div'),small=document.createElement('small'),h=document.createElement('h2'),p=document.createElement('p'),status=document.createElement('span');
 small.textContent=String(i+1).padStart(2,'0')+' · '+g.host;h.textContent=g.title;p.textContent=g.blurb;status.textContent=g.ready?(g.restyle?'Treasures in the room →':'Step inside →'):'On the workbench';
 body.append(small,h,p,status);a.append(body);root.append(a);
}
