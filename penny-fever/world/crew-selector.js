import {
  BODIES, SKINS, HAIR_STYLES, HAIR_COLORS, EYE_COLORS, OUTFITS,
  blankDraft, composeDoll, preloadDollArt, bodyStrip,
  listCustomDolls, getCustomDoll, keepDoll, forgetDoll,
} from './paper-dolls.js?v=doll-flow-2';

export const CREW_IDS = ['bluebell', 'ruby', 'violet', 'oliver', 'sunny', 'rowan'];
export const BLANK_IDS = ['cardboard-boy', 'cardboard-girl'];
const BLANK_BODY = { 'cardboard-boy': 'boy', 'cardboard-girl': 'girl' };
const key = 'pf-selected-crew-v1';
const VIEWS = ['front', 'left', 'back', 'right'];
const artBase = new URL('../assets/restyle/crew/', import.meta.url);
const boot = globalThis.__pfDoll || (globalThis.__pfDoll = {
  selected: 'oliver',
  listeners: new Set(),
  viewIndex: 0,
  falling: false,
  hydrated: false,
  draft: blankDraft(),
});

function isPlayable(id) {
  return CREW_IDS.includes(id) || BLANK_IDS.includes(id) || !!getCustomDoll(id);
}
if (!boot.hydrated) {
  try {
    const saved = localStorage.getItem(key);
    if (isPlayable(saved)) boot.selected = saved;
  } catch {}
  boot.hydrated = true;
}

export const crewArt = id => new URL(`${CREW_IDS.includes(id) ? id : 'oliver'}-turnaround.png`, artBase).href;

export async function artUrl(id) {
  if (id === '__draft') return composeDoll(boot.draft);
  const custom = getCustomDoll(id);
  if (custom) return composeDoll(custom);
  if (BLANK_IDS.includes(id)) return bodyStrip(BLANK_BODY[id]);
  return crewArt(id);
}

export const getDoll = () => ({ crew: boot.selected });
export function onDollChange(fn) {
  boot.listeners.add(fn);
  return () => boot.listeners.delete(fn);
}

function name(id) {
  if (id === '__draft') return (boot.draft.name || 'New paper doll');
  if (id === 'cardboard-boy') return 'Boy silhouette';
  if (id === 'cardboard-girl') return 'Girl silhouette';
  const custom = getCustomDoll(id);
  if (custom) return custom.name;
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
}

function swatches(list, key, kind) {
  return list.map(item => {
    const pressed = boot.draft[key] === item.id;
    const chip = item.rgb
      ? `<i class="doll-chip" style="background:rgb(${item.rgb.join(',')})"></i>`
      : '';
    const lim = item.limited ? ' limited' : '';
    return `<button type="button" class="doll-opt${lim}" data-doll-key="${key}" data-doll-val="${item.id}" aria-pressed="${pressed}">${chip}<span>${item.label}</span></button>`;
  }).join('');
}

function paintBuilder() {
  const root = document.getElementById('dollBuilder');
  if (!root) return;
  root.querySelectorAll('[data-doll-key]').forEach(b => {
    b.setAttribute('aria-pressed', String(boot.draft[b.dataset.dollKey] === b.dataset.dollVal));
  });
  const nameEl = document.getElementById('dollName');
  if (nameEl && nameEl !== document.activeElement) nameEl.value = boot.draft.name || '';
}

function paintShelf() {
  const shelf = document.getElementById('dollShelf');
  if (!shelf) return;
  const dolls = listCustomDolls();
  if (!dolls.length) {
    shelf.innerHTML = '<p class="doll-empty">No kept dolls yet. Build one below.</p>';
    return;
  }
  shelf.innerHTML = dolls.map(d => `
    <button type="button" data-crew="${d.id}" aria-pressed="${d.id === boot.selected}">
      <span class="crew-portrait" data-doll-preview="${d.id}" aria-hidden="true"></span>
      <strong>${d.name}</strong>
      <small>Yours</small>
    </button>`).join('');
  shelf.querySelectorAll('[data-doll-preview]').forEach(el => poseDoll(el, el.dataset.dollPreview, 0));
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
    portrait.removeAttribute('data-crew');
    portrait.setAttribute('aria-label', name(selected));
  }
  const status = document.getElementById('crewStatus');
  if (status) {
    if (selected === '__draft' || BLANK_IDS.includes(selected)) {
      status.textContent = 'A cardboard blank. Dial the face and clothes, then keep the doll.';
    } else if (getCustomDoll(selected)) {
      status.textContent = `${name(selected)} is in your paper-doll collection.`;
    } else {
      status.textContent = `${name(selected)} is ready for the midway.`;
    }
  }
  const runwayDoll = document.getElementById('crewRunwayDoll');
  if (runwayDoll && !boot.falling) poseDoll(runwayDoll, selected === '__draft' ? '__draft' : selected, boot.viewIndex);
  paintViewLabel();
  paintBuilder();
  paintShelf();
}

function turn(dir) {
  boot.viewIndex = (boot.viewIndex + dir + 4) % 4;
  const id = boot.selected === '__draft' ? '__draft' : boot.selected;
  poseDoll(document.getElementById('crewRunwayDoll'), id, boot.viewIndex);
  paintViewLabel();
}

function startDraft(body) {
  boot.draft = { ...blankDraft(), body };
  boot.selected = '__draft';
  boot.viewIndex = 0;
  const create = document.querySelector('.doll-create');
  if (create) create.open = true;
  const col = document.querySelector('.crew-collections');
  if (col) col.open = true;
  refresh();
}

function setDraft(key, val) {
  boot.draft = { ...boot.draft, [key]: val };
  boot.selected = '__draft';
  refresh();
}

export function chooseCrew(id) {
  if (id === '__draft') {
    boot.selected = '__draft';
    refresh();
    return true;
  }
  if (!isPlayable(id)) return false;
  if (id === boot.selected) {
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
    poseDoll(runwayDoll, boot.selected, 0);
    runwayDoll.classList.remove('is-falling');
    runwayDoll.classList.add('is-arriving');
  };
  runwayDoll.addEventListener('animationend', finish, { once: true });
  setTimeout(() => { if (boot.falling) finish(); }, 520);
  return true;
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
  preloadDollArt().then(() => refresh());
  refresh();
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
<p class="crew-kicker">Penny Fever · The original crew</p><h2 id="crewTitle">Choose your paper doll</h2>
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
<p id="crewStatus" role="status"></p>
<form method="dialog" class="crew-done"><button type="button" class="ticket-button" id="crewDone">That’s me</button></form>
<details class="crew-collections">
<summary>The paper-doll collection</summary>
<p>Dolls you keep live here. The original six stay free.</p>
<div id="dollShelf" class="crew-grid doll-shelf"></div>
<details class="doll-create">
<summary>Create a paper doll</summary>
<div id="dollBuilder" class="doll-builder">
  <p>Start with a plain cardboard cutout, then dial face and clothes. The runway above shows the work.</p>
  <p class="doll-label">Cardboard blank</p>
  <div class="doll-row">${BODIES.map(b => `<button type="button" class="doll-opt doll-blank" data-doll-blank="${b.id}"><span class="crew-portrait doll-thumb" style="background-image:url('${bodyStrip(b.id)}')"></span><span>${b.label}</span></button>`).join('')}</div>
  <p class="doll-label">Skin</p>
  <div class="doll-row">${swatches(SKINS, 'skin')}</div>
  <p class="doll-label">Hair</p>
  <div class="doll-row">${swatches(HAIR_STYLES, 'hair')}</div>
  <div class="doll-row">${swatches(HAIR_COLORS, 'hairColor')}</div>
  <p class="doll-label">Eyes</p>
  <div class="doll-row">${swatches(EYE_COLORS, 'eyes')}</div>
  <p class="doll-label">Outfit</p>
  <div class="doll-row">${swatches(OUTFITS, 'outfit')}</div>
  <p class="doll-label">Name and keep</p>
  <label class="doll-name">Name <input id="dollName" type="text" maxlength="24" placeholder="A paper name"></label>
  <p class="doll-pay">A souvenir character for this book. Till price comes when souvenir books go on sale.</p>
  <button type="button" class="ticket-button" id="dollKeep">Keep this doll</button>
</div>
</details>
</details>`;
    document.body.append(book);
    book.addEventListener('click', e => {
      if (e.target.closest('#crewTurnLeft')) { turn(-1); return; }
      if (e.target.closest('#crewTurnRight')) { turn(1); return; }
      const blank = e.target.closest('[data-doll-blank]');
      if (blank) { startDraft(blank.dataset.dollBlank); return; }
      const opt = e.target.closest('[data-doll-key]');
      if (opt) { setDraft(opt.dataset.dollKey, opt.dataset.dollVal); return; }
      if (e.target.closest('#dollKeep') || e.target.closest('#crewDone')) {
        if (boot.selected === '__draft' || e.target.closest('#dollKeep')) {
          const saved = keepDoll({ ...boot.draft, name: document.getElementById('dollName')?.value });
          chooseCrew(saved.id);
        }
        if (e.target.closest('#crewDone')) book.close();
        return;
      }
      const b = e.target.closest('[data-crew]');
      if (b) chooseCrew(b.dataset.crew);
    });
    book.addEventListener('input', e => {
      if (e.target.id === 'dollName') boot.draft.name = e.target.value;
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
  preloadDollArt();
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
