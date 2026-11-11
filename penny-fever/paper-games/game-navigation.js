// Shared by the cabinet and paper-game runtimes. Gameplay and saving stay in each runtime.
export function mountGameNavigation({embedded, listen, onPrevious, onTreasures}) {
  const $=s=>document.querySelector(s),bar=$('.game-menu-bar');
  document.body.classList.add('standard-game');
  if(embedded){bar.querySelector('.back')?.remove();$('#compact-title')?.remove();}
  const treasure=document.createElement('button');treasure.id='treasures';treasure.textContent='Treasures';
  listen(treasure,'click',onTreasures);if(embedded)bar.insertBefore(treasure,$('#menu-toggle'));
  const chapters=document.createElement('div');chapters.className='chapter-nav';chapters.setAttribute('role','group');chapters.setAttribute('aria-label','Choose chapter');
  const prev=document.createElement('button');prev.id='previous-chapter';prev.textContent='‹';prev.setAttribute('aria-label','Previous chapter');listen(prev,'click',onPrevious);
  const label=document.createElement('span');label.id='chapter-position';label.setAttribute('aria-live','polite');
  const next=$('#next-chapter');next.setAttribute('aria-label','Next chapter');
  chapters.append(prev,label,next);bar.insertBefore(chapters,$('#menu-toggle'));
  $('#menu-toggle').textContent='Help';$('#menu-close').textContent='× Close help';
  return {update(level,count,locked=false){
    prev.disabled=locked||level<=0;next.disabled=locked||level>=count-1;
    next.textContent='›';label.textContent='Ch '+(level+1);
  }};
}
