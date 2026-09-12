import { BODIES, bodyStrip } from './paper-dolls.js?v=doll-torso-1';

export const CREW_IDS = ['bluebell', 'ruby', 'violet', 'oliver', 'sunny', 'rowan'];
export const BLANK_IDS = ['cardboard-boy', 'cardboard-girl'];
const key = 'pf-selected-crew-v1';
const VIEWS = ['front', 'left', 'back', 'right'];
const artBase = new URL('../assets/restyle/crew/', import.meta.url);
const boot = globalThis.__pfDoll || (globalThis.__pfDoll = {
  selected: 'oliver',
  listeners: new Set(),
  viewIndex: 0,
  falling: false,
  hydrated: false,
  torso: 'boy',
  torsoView: 0,
});

function isPlayable(id) {
  return CREW_IDS.includes(id);
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
  return crewArt(id);
}

export const getDoll = () => ({ crew: boot.selected });
export function onDollChange(fn) {
  boot.listeners.add(fn);
  return () => boot.listeners.delete(fn);
}

function name(id) {
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

function poseTorso(el, body, view) {
  if (!el) return;
  el.style.backgroundImage = `url('${bodyStrip(body)}')`;
  el.style.backgroundPosition = `${(view % 4) * 33.333}% 0`;
}

function paintTorso() {
  document.querySelectorAll('[data-doll-blank]').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.dollBlank === boot.torso));
  });
  poseTorso(document.getElementById('dollPreview'), boot.torso, boot.torsoView);
  const label = document.getElementById('dollPreviewLabel');
  if (label) label.textContent = VIEWS[boot.torsoView % 4];
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
  if (status) status.textContent = `${name(selected)} is ready for the midway.`;
  const runwayDoll = document.getElementById('crewRunwayDoll');
  if (runwayDoll && !boot.falling) poseDoll(runwayDoll, selected, boot.viewIndex);
  paintViewLabel();
  paintTorso();
}

function turn(dir) {
  boot.viewIndex = (boot.viewIndex + dir + 4) % 4;
  poseDoll(document.getElementById('crewRunwayDoll'), boot.selected, boot.viewIndex);
  paintViewLabel();
}

function turnTorso(dir) {
  boot.torsoView = (boot.torsoView + dir + 4) % 4;
  paintTorso();
}

function pickTorso(body) {
  boot.torso = body === 'girl' ? 'girl' : 'boy';
  boot.torsoView = 0;
  paintTorso();
}

export function chooseCrew(id) {
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
<details class="crew-collections" open>
<summary>The paper-doll collection</summary>
<p>Male or female cardboard torso. Face and clothes later.</p>
<div class="doll-torso-row">
  <div class="doll-torso-picks">${BODIES.map(b => `<button type="button" class="doll-opt" data-doll-blank="${b.id}" aria-pressed="${b.id === 'boy'}"><span class="crew-portrait doll-thumb" style="background-image:url('${bodyStrip(b.id)}')"></span><span>${b.label}</span></button>`).join('')}</div>
  <div class="doll-torso-preview">
    <div id="dollPreview" class="crew-portrait doll-preview-stage" aria-label="Torso preview"></div>
    <div class="crew-runway-turn">
      <button type="button" id="dollPrevBack" aria-label="Show previous view">◀ Back</button>
      <span id="dollPreviewLabel">front</span>
      <button type="button" id="dollPrevForth" aria-label="Show next view">Forth ▶</button>
    </div>
  </div>
</div>
</details>`;
    document.body.append(book);
    book.addEventListener('click', e => {
      if (e.target.closest('#crewTurnLeft')) { turn(-1); return; }
      if (e.target.closest('#crewTurnRight')) { turn(1); return; }
      if (e.target.closest('#dollPrevBack')) { turnTorso(-1); return; }
      if (e.target.closest('#dollPrevForth')) { turnTorso(1); return; }
      const blank = e.target.closest('[data-doll-blank]');
      if (blank) { pickTorso(blank.dataset.dollBlank); return; }
      if (e.target.closest('#crewDone')) { book.close(); return; }
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
