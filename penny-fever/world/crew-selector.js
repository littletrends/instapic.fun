import {
  SKINS, EYE_COLORS, HAIR_STYLES, HATS, OUTFITS, DOLL_PAGES,
  MINE_ID, blankDraft, composeDoll, keepMine, getMine, preloadDollArt,
} from './paper-dolls.js?v=doll-layers-1';

export const CREW_IDS = ['bluebell', 'ruby', 'violet', 'oliver', 'sunny', 'rowan'];
const key = 'pf-selected-crew-v1';
const VIEWS = ['front', 'left', 'back', 'right'];
const artBase = new URL('../assets/restyle/crew/', import.meta.url);
const boot = globalThis.__pfDoll || (globalThis.__pfDoll = {
  selected: 'oliver',
  listeners: new Set(),
  viewIndex: 0,
  falling: false,
  hydrated: false,
  mode: 'crew',
  draft: blankDraft(),
  previewUrl: '',
  dollView: 0,
});

function isCrew(id) {
  return CREW_IDS.includes(id);
}
function isPlayable(id) {
  return isCrew(id) || id === MINE_ID;
}
if (!boot.hydrated) {
  try {
    const saved = localStorage.getItem(key);
    if (isPlayable(saved)) boot.selected = saved;
    if (saved === MINE_ID) {
      boot.mode = 'custom';
      boot.draft = { ...blankDraft(), ...(getMine() || {}) };
    }
  } catch {}
  boot.hydrated = true;
}

export const crewArt = id => new URL(`${isCrew(id) ? id : 'oliver'}-turnaround.png`, artBase).href;

export async function artUrl(id) {
  if (id === MINE_ID) {
    const spec = getMine() || boot.draft;
    return composeDoll(spec);
  }
  return crewArt(isCrew(id) ? id : 'oliver');
}

export const getDoll = () => ({ crew: boot.selected });
export function onDollChange(fn) {
  boot.listeners.add(fn);
  return () => boot.listeners.delete(fn);
}

function name(id) {
  if (id === MINE_ID) return (boot.draft.name || getMine()?.name || 'Paper doll');
  return id[0].toUpperCase() + id.slice(1);
}

function poseDoll(el, id, view) {
  if (!el) return;
  el.dataset.crew = id;
  el.dataset.view = String(view % 4);
  artUrl(id).then(url => {
    if (el.dataset.crew !== id) return;
    el.style.backgroundImage = `url('${url}')`;
    el.style.backgroundPosition = `${(view % 4) * 33.333}% 0`;
  }).catch(() => {});
}

function paintViewLabel() {
  const label = document.getElementById('crewViewLabel');
  if (label) label.textContent = VIEWS[boot.viewIndex % 4];
  const doll = document.getElementById('dollViewLabel');
  if (doll) doll.textContent = VIEWS[boot.dollView % 4];
}

function optionRow(title, key, items, swatch) {
  return `<div class="doll-row"><strong>${title}</strong>${items.map(item => {
    const color = swatch && item.rgb ? `style="--swatch:rgb(${item.rgb.join(',')})"` : (swatch && !item.rgb ? 'style="--swatch:#c4a06a"' : '');
    return `<button type="button" class="doll-chip${swatch ? ' is-swatch' : ''}" data-doll-key="${key}" data-doll-val="${item.id}" ${color} aria-pressed="false">${item.label}</button>`;
  }).join('')}</div>`;
}

function paintDraft() {
  const spec = boot.draft;
  document.querySelectorAll('[data-doll-key]').forEach(b => {
    b.setAttribute('aria-pressed', String(spec[b.dataset.dollKey] === b.dataset.dollVal));
  });
  document.querySelectorAll('[data-doll-book]').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.dollBook === spec.outfit));
  });
  const stage = document.getElementById('dollPreviewImg');
  composeDoll(spec).then(url => {
    boot.previewUrl = url;
    if (stage) {
      stage.src = url;
      stage.style.marginLeft = `-${(boot.dollView % 4) * 100}%`;
    }
    if (boot.selected === MINE_ID) {
      const portrait = document.getElementById('chosenCrewPortrait');
      if (portrait) portrait.style.backgroundImage = `url('${url}')`;
      const runway = document.getElementById('crewRunwayDoll');
      if (runway && !boot.falling) {
        runway.style.backgroundImage = `url('${url}')`;
        runway.style.backgroundPosition = `${(boot.viewIndex % 4) * 33.333}% 0`;
      }
    }
  }).catch(() => {});
}

function refresh() {
  const selected = boot.selected;
  document.querySelectorAll('.crew-book [data-crew]').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.crew === selected));
  });
  const label = document.getElementById('chosenCrew');
  if (label) label.textContent = `Playing as ${name(selected)}`;
  const portrait = document.getElementById('chosenCrewPortrait');
  if (portrait) {
    poseDoll(portrait, selected, 0);
    portrait.setAttribute('aria-label', name(selected));
  }
  const status = document.getElementById('crewStatus');
  if (status) {
    status.textContent = selected === MINE_ID
      ? 'Playing as your cardboard cut-out.'
      : `${name(selected)} is ready for the midway.`;
  }
  const runwayDoll = document.getElementById('crewRunwayDoll');
  if (runwayDoll && !boot.falling) poseDoll(runwayDoll, boot.selected, boot.viewIndex);
  paintViewLabel();
  paintDraft();
}

function turn(dir) {
  boot.viewIndex = (boot.viewIndex + dir + 4) % 4;
  poseDoll(document.getElementById('crewRunwayDoll'), boot.selected, boot.viewIndex);
  paintViewLabel();
}

function turnDoll(dir) {
  boot.dollView = (boot.dollView + dir + 4) % 4;
  const stage = document.getElementById('dollPreviewImg');
  if (stage) stage.style.marginLeft = `-${(boot.dollView % 4) * 100}%`;
  paintViewLabel();
}

function setPart(key, val) {
  boot.draft = { ...boot.draft, [key]: val };
  paintDraft();
}

export function chooseCrew(id) {
  if (!isPlayable(id)) return false;
  boot.mode = isCrew(id) ? 'crew' : 'custom';
  if (id === boot.selected && boot.mode === 'crew') {
    refresh();
    return true;
  }
  const next = id;
  const runwayDoll = document.getElementById('crewRunwayDoll');
  const commit = () => {
    boot.selected = next;
    boot.viewIndex = 0;
    try { localStorage.setItem(key, boot.selected); } catch {}
    refresh();
    boot.listeners.forEach(fn => fn(getDoll()));
  };
  if (!runwayDoll || boot.falling) {
    commit();
    return true;
  }
  boot.falling = true;
  runwayDoll.classList.remove('is-arriving');
  runwayDoll.classList.add('is-falling');
  const finish = () => {
    runwayDoll.removeEventListener('animationend', finish);
    boot.falling = false;
    commit();
    if (boot.mode === 'crew') poseDoll(runwayDoll, boot.selected, 0);
    runwayDoll.classList.remove('is-falling');
    runwayDoll.classList.add('is-arriving');
  };
  runwayDoll.addEventListener('animationend', finish, { once: true });
  setTimeout(() => { if (boot.falling) finish(); }, 520);
  return true;
}

function keepMe() {
  document.querySelector('dialog.crew-book')?.close();
}

function keepCutout() {
  keepMine(boot.draft);
  chooseCrew(MINE_ID);
}

function fillArt(root) {
  root.querySelectorAll('[data-crew-art]').forEach(el => {
    el.style.backgroundImage = `url('${el.dataset.crewArt}')`;
  });
}

function openCrewBook(event) {
  if (event) event.preventDefault();
  if (!document.querySelector('dialog.crew-book')) mount();
  const book = document.querySelector('dialog.crew-book');
  if (!book) return;
  fillArt(book);
  boot.viewIndex = 0;
  boot.mode = isCrew(boot.selected) ? 'crew' : 'custom';
  boot.draft = { ...blankDraft(), ...(getMine() || boot.draft) };
  refresh();
  preloadDollArt();
  try {
    if (typeof book.showModal === 'function') {
      if (!book.open) book.showModal();
    } else {
      book.setAttribute('open', '');
      book.classList.add('is-open');
    }
  } catch {
    book.setAttribute('open', '');
    book.classList.add('is-open');
  }
}

function mount() {
  const door = document.getElementById('discoveryDoor');
  if (!door) return;

  let opener = document.getElementById('editCrew');
  if (!opener) {
    const panel = document.createElement('div');
    panel.className = 'crew-entry';
    panel.innerHTML = `<span id="chosenCrewPortrait" class="crew-portrait" role="img" aria-label="Oliver" style="background-image:url('${crewArt('oliver')}')"></span><div><p id="chosenCrew">Playing as Oliver</p><button type="button" id="editCrew" class="ticket-button">Edit character</button></div>`;
    const box = door.querySelector('.door-crew');
    if (box) box.prepend(panel);
    else door.insertBefore(panel, door.querySelector('.admit-desk'));
    opener = panel.querySelector('#editCrew');
  }

  let book = document.querySelector('dialog.crew-book');
  if (!book) {
    book = document.createElement('dialog');
    book.className = 'crew-book';
    book.setAttribute('aria-labelledby', 'crewTitle');
    book.innerHTML = `<form method="dialog"><button class="crew-close" aria-label="Close character book">×</button></form>
<p class="crew-kicker">Penny Fever · The original crew</p>
<h2 id="crewTitle">Choose your paper doll</h2>
<p>They take a little runway turn. Pick one and the last doll falls away.</p>
<div class="crew-runway" aria-hidden="true">
 <div class="crew-runway-board"></div>
 <div class="crew-runway-stage"><div id="crewRunwayDoll" class="crew-runway-doll crew-portrait"></div></div>
</div>
<div class="crew-runway-turn">
 <button type="button" id="crewTurnLeft" aria-label="Show previous view">◀ Back</button>
 <span id="crewViewLabel" aria-live="polite">front</span>
 <button type="button" id="crewTurnRight" aria-label="Show next view">Forth ▶</button>
</div>
<div class="crew-grid">${CREW_IDS.map(id => `<button type="button" data-crew="${id}" aria-pressed="false"><span class="crew-portrait" data-crew-art="${crewArt(id)}" aria-hidden="true"></span><strong>${name(id)}</strong><small>Included</small></button>`).join('')}</div>
<form method="dialog" class="crew-done"><button type="button" class="ticket-button" id="crewDone">That’s me</button></form>
<p id="crewStatus" role="status"></p>
<details class="crew-collections">
<summary>Make a doll</summary>
<p>The body stays. Everything else is a paper layer — hair, hat, dress — like a book of cut-outs.</p>
<div class="doll-torso-row">
  <div class="doll-torso-preview">
    <div id="dollPreview" class="doll-preview-stage" aria-label="Paper doll preview"><img id="dollPreviewImg" alt="Paper doll"></div>
    <div class="crew-runway-turn">
      <button type="button" id="dollPrevBack" aria-label="Show previous view">◀ Back</button>
      <span id="dollViewLabel">front</span>
      <button type="button" id="dollPrevForth" aria-label="Show next view">Forth ▶</button>
    </div>
  </div>
  <div class="doll-maker-parts">
    ${optionRow('Skin', 'skin', SKINS, true)}
    ${optionRow('Eyes', 'eyes', EYE_COLORS, true)}
    ${optionRow('Hair', 'hair', HAIR_STYLES)}
    ${optionRow('Hat', 'hat', HATS)}
    ${optionRow('Dress', 'outfit', OUTFITS)}
  </div>
</div>
<div class="doll-books">${OUTFITS.filter(o => o.book).map(o => `<button type="button" data-doll-book="${o.id}" aria-label="${o.label} album"><img src="${DOLL_PAGES[o.id]}" alt=""><strong>${o.label}</strong></button>`).join('')}</div>
<button type="button" class="ticket-button" id="dollKeep">Keep this cut-out</button>
</details>`;
    document.body.append(book);
    book.addEventListener('click', e => {
      if (e.target.closest('#crewTurnLeft')) { turn(-1); return; }
      if (e.target.closest('#crewTurnRight')) { turn(1); return; }
      if (e.target.closest('#dollPrevBack')) { turnDoll(-1); return; }
      if (e.target.closest('#dollPrevForth')) { turnDoll(1); return; }
      const page = e.target.closest('[data-doll-book]');
      if (page) { setPart('outfit', page.dataset.dollBook); return; }
      const part = e.target.closest('[data-doll-key]');
      if (part) { setPart(part.dataset.dollKey, part.dataset.dollVal); return; }
      if (e.target.closest('#crewDone')) { keepMe(); return; }
      if (e.target.closest('#dollKeep')) { keepCutout(); return; }
      const b = e.target.closest('[data-crew]');
      if (b) chooseCrew(b.dataset.crew);
    });
    book.addEventListener('close', () => document.getElementById('editCrew')?.focus());
    const doll = book.querySelector('#crewRunwayDoll');
    if (doll) {
      let drag = null;
      doll.style.touchAction = 'pan-y';
      doll.style.cursor = 'ew-resize';
      doll.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        drag = {id: e.pointerId, x: e.clientX, accum: 0};
        try { doll.setPointerCapture(e.pointerId); } catch {}
      });
      doll.addEventListener('pointermove', e => {
        if (drag?.id !== e.pointerId) return;
        const dx = e.clientX - drag.x;
        drag.x = e.clientX;
        drag.accum += dx;
        if (Math.abs(drag.accum) > 42) {
          turn(drag.accum > 0 ? 1 : -1);
          drag.accum = 0;
        }
      });
      const end = e => { if (drag?.id === e.pointerId) drag = null; };
      doll.addEventListener('pointerup', end);
      doll.addEventListener('pointercancel', end);
    }
  }

  if (opener && opener.dataset.crewBound !== '1') {
    opener.dataset.crewBound = '1';
    opener.addEventListener('click', openCrewBook);
  }
  globalThis.PennyFeverDoll = { open: openCrewBook, close: () => book.close(), get: getDoll };
  refresh();
}

if (!globalThis.__pfCrewClick) {
  globalThis.__pfCrewClick = true;
  document.addEventListener('click', e => {
    if (e.target.closest('#editCrew')) {
      if (!globalThis.PennyFeverDoll) mount();
      globalThis.PennyFeverDoll?.open();
    }
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
else mount();
