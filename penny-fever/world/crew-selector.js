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
});
if (!boot.hydrated) {
  try {
    const saved = localStorage.getItem(key);
    if (CREW_IDS.includes(saved)) boot.selected = saved;
  } catch {}
  boot.hydrated = true;
}

export const crewArt = id => new URL(`${CREW_IDS.includes(id) ? id : 'oliver'}-turnaround.png`, artBase).href;
export const getDoll = () => ({ crew: boot.selected });
export function onDollChange(fn) {
  boot.listeners.add(fn);
  return () => boot.listeners.delete(fn);
}
const name = id => id[0].toUpperCase() + id.slice(1);

function poseDoll(el, id, view) {
  if (!el) return;
  el.style.backgroundImage = `url('${crewArt(id)}')`;
  el.style.backgroundPosition = `${(view % 4) * 33.333}% 0`;
  el.dataset.crew = id;
  el.dataset.view = String(view % 4);
}

function paintViewLabel() {
  const label = document.getElementById('crewViewLabel');
  if (label) label.textContent = VIEWS[boot.viewIndex % 4];
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
}

function turn(dir) {
  boot.viewIndex = (boot.viewIndex + dir + 4) % 4;
  poseDoll(document.getElementById('crewRunwayDoll'), boot.selected, boot.viewIndex);
  paintViewLabel();
}

export function chooseCrew(id) {
  if (!CREW_IDS.includes(id) || id === boot.selected) {
    boot.selected = id;
    refresh();
    return true;
  }
  const next = id;
  const runwayDoll = document.getElementById('crewRunwayDoll');
  if (!runwayDoll || boot.falling) {
    boot.selected = next;
    boot.viewIndex = 0;
    try { localStorage.setItem(key, boot.selected); } catch {}
    refresh();
    boot.listeners.forEach(fn => fn(getDoll()));
    return true;
  }
  boot.falling = true;
  runwayDoll.classList.remove('is-arriving');
  runwayDoll.classList.add('is-falling');
  const finish = () => {
    runwayDoll.removeEventListener('animationend', finish);
    boot.selected = next;
    boot.viewIndex = 0;
    try { localStorage.setItem(key, boot.selected); } catch {}
    poseDoll(runwayDoll, boot.selected, 0);
    runwayDoll.classList.remove('is-falling');
    runwayDoll.classList.add('is-arriving');
    boot.falling = false;
    refresh();
    boot.listeners.forEach(fn => fn(getDoll()));
  };
  runwayDoll.addEventListener('animationend', finish, { once: true });
  setTimeout(() => { if (boot.falling) finish(); }, 520);
  return true;
}

function fillArt(root) {
  root.querySelectorAll('[data-crew-art]').forEach(el => {
    if (!el.style.backgroundImage) el.style.backgroundImage = `url('${el.dataset.crewArt}')`;
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
 <span id="crewViewLabel">front</span>
 <button type="button" id="crewTurnRight" aria-label="Show next view">Forth ▶</button>
</div>
<div class="crew-grid">${CREW_IDS.map(id => `<button type="button" data-crew="${id}" aria-pressed="false"><span class="crew-portrait" data-crew-art="${crewArt(id)}" aria-hidden="true"></span><strong>${name(id)}</strong><small>Included</small></button>`).join('')}</div>
<p id="crewStatus" role="status"></p><details class="crew-collections"><summary>The paper-doll collection</summary><p>Coming later: little cardboard costume books, with fold-over tabs, themed outfits and accessories for your crew. Your original six characters will stay free.</p></details>
<form method="dialog"><button class="ticket-button">That’s me</button></form>`;
    document.body.append(book);
    book.addEventListener('click', e => {
      if (e.target.closest('#crewTurnLeft')) { turn(-1); return; }
      if (e.target.closest('#crewTurnRight')) { turn(1); return; }
      const b = e.target.closest('[data-crew]');
      if (b) chooseCrew(b.dataset.crew);
    });
    book.addEventListener('close', () => document.getElementById('editCrew')?.focus());
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
