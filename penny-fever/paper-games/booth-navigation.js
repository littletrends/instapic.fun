import {games} from './catalogue.js';
// Inside a booth, keep navigation in the existing parent router so the alley
// retains its papercut mode, position and pause/resume lifecycle.
if(window.parent!==window)document.addEventListener('click',event=>{
 if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
 const link=event.target.closest('a[href]');if(!link)return;
 const url=new URL(link.href),base=new URL('./',import.meta.url);
 const next=games.find(g=>g.ready&&new URL(g.direct||'play.html?stall='+g.id,base).href===url.href);
 const alley=url.origin===location.origin&&url.hash==='#alley';
 if(next||alley){event.preventDefault();window.parent.location.hash=next?'cabinet/'+next.id:'alley';}
});
