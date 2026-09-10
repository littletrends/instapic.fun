import {loadArt,paintIcon} from './art.js?v=pocket-book-1';
const model = globalThis.PennyFeverInventoryModel;
const studio = document.body.dataset.objectStudio === 'true';
const iconCache = new Map();
let dialog, viewer, current = null, albumId = 'essentials', filter = 'all';
let selectionToken = 0, listToken = 0, opener, resumeWorld = false, openedHash = '', observer;
const $ = id => document.getElementById(id);
const state = () => globalThis.PennyFever?.getState() || {};
const entries = () => studio
  ? model.definitions.map(d => ({...d, owned: true, quantity: 1, status: 'Object study', punched: false}))
  : model.entries(state());
const text = (id, value) => { $(id).textContent = value; };

function mount() {
  if (!model) return;
  const launch = document.createElement('button');
  launch.type = 'button'; launch.id = 'openTreasures';
  launch.className = studio ? 'treasure-launch' : 'ticket-button door-pocket';
  launch.textContent = studio ? 'Open the object cabinet' : 'Your pocket';
  const door = document.getElementById('discoveryDoor');
  if (!studio && door) {
    const crew = door.querySelector('.door-crew');
    door.insertBefore(launch, crew || null);
  } else document.body.append(launch);
  launch.addEventListener('click', () => open());

  dialog = document.createElement('dialog');
  dialog.className = 'treasure-book';
  dialog.setAttribute('aria-labelledby', 'treasureTitle');
  dialog.innerHTML = `
    <div class="pocket-shell">
      <header class="pocket-header">
        <div>
          <p class="pocket-eyebrow">Penny Fever · a book of little things</p>
          <h1 id="treasureTitle">Your pocket</h1>
          <p id="treasureCount"></p>
        </div>
        <button type="button" class="pocket-close" id="closeTreasures" aria-label="Close your pocket">Close ×</button>
      </header>
      <p id="treasureSave" class="pocket-save" role="status" hidden></p>
      <div class="pocket-menu">
        <input type="search" id="treasureSearch" placeholder="Find a keepsake" aria-label="Search the collection">
        <div class="pocket-filters" role="group" aria-label="Filter pages">
          <button type="button" data-filter="all" aria-pressed="true">All</button>
          <button type="button" data-filter="found" aria-pressed="false">Found</button>
          <button type="button" data-filter="missing" aria-pressed="false">Missing</button>
        </div>
      </div>
      <div class="pocket-body">
        <nav class="pocket-index" id="pocketIndex" aria-label="Collections"></nav>
        <div class="pocket-spread">
          <section class="pocket-page is-left" aria-labelledby="pocketAlbumTitle">
            <p class="pocket-kicker" id="pocketAlbumKicker">Collection</p>
            <h2 id="pocketAlbumTitle"></h2>
            <p class="pocket-blurb" id="pocketAlbumBlurb"></p>
            <div class="pocket-progress" aria-hidden="true"><i id="pocketAlbumBar"></i></div>
            <p class="pocket-count" id="pocketAlbumCount"></p>
            <p id="treasureEmpty" hidden>Nothing in this collection matches that search.</p>
          </section>
          <section class="pocket-page is-right">
            <div class="pocket-stamps" id="treasureItems"></div>
          </section>
        </div>
      </div>
      <div class="pocket-inspect" id="pocketInspect" hidden>
        <div class="pocket-stage" id="treasureStage" tabindex="0" role="group"></div>
        <aside class="pocket-card">
          <p class="pocket-eyebrow" id="treasureSource"></p>
          <h2 id="treasureName"></h2>
          <p id="treasureStatus"></p>
          <p class="pocket-how" id="treasureHow">Press and turn. Arrow keys spin; Home shows the front.</p>
          <p id="treasureLoading" role="status"></p>
          <p class="pocket-hint" id="treasureHint"></p>
          <p id="treasureDetail"></p>
          <div class="pocket-inspect-bar">
            <button type="button" id="pocketBack">← Back to the page</button>
            <button type="button" id="treasureOpen" aria-expanded="false" hidden>Open</button>
            <button type="button" id="treasurePunch" hidden>Show punched ticket</button>
            <button type="button" id="treasureRetry" hidden>Try loading again</button>
          </div>
        </aside>
      </div>
    </div>`;
  document.body.append(dialog);

  $('closeTreasures').addEventListener('click', () => dialog.close());
  $('pocketBack').addEventListener('click', hideInspect);
  dialog.addEventListener('close', close);
  $('treasureSearch').addEventListener('input', render);
  dialog.querySelector('.pocket-filters').addEventListener('click', e => {
    const b = e.target.closest('[data-filter]'); if (!b) return;
    filter = b.dataset.filter;
    dialog.querySelectorAll('[data-filter]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    render();
  });
  $('treasureItems').addEventListener('click', e => {
    const b = e.target.closest('[data-item]'); if (b) select(b.dataset.item);
  });
  $('pocketIndex').addEventListener('click', e => {
    const b = e.target.closest('[data-album]'); if (!b) return;
    albumId = b.dataset.album; hideInspect(); render();
  });
  $('treasureOpen').addEventListener('click', () => {
    const on = viewer?.toggleOpen?.();
    $('treasureOpen').textContent = on ? 'Close' : 'Open';
    $('treasureOpen').setAttribute('aria-expanded', String(!!on));
  });
  $('treasurePunch').addEventListener('click', () => {
    if (studio && current?.id === 'admission-ticket') select(current.id, !current.punched);
  });
  $('treasureRetry').addEventListener('click', () => { if (current) select(current.id); });

  window.addEventListener('pennyfever:statechange', e => {
    if (!dialog.open) return;
    $('treasureSave').hidden = e.detail?.persisted !== false;
    text('treasureSave', 'Your browser could not save this change. Keep this tab open to retain this visit.');
    render();
    const fresh = entries().find(i => i.id === current?.id);
    if (fresh) {
      if (fresh.owned !== current.owned || fresh.punched !== current.punched) select(fresh.id);
      else { current = fresh; describe(fresh); }
    }
  });
  window.addEventListener('hashchange', () => { if (dialog.open) dialog.close(); updateLaunch(); });

  const notice = document.createElement('p');
  notice.className = 'treasure-notice'; notice.setAttribute('role', 'status'); notice.hidden = true;
  document.body.append(notice);
  let noticeTimer;
  window.addEventListener('pennyfever:inventoryaward', e => {
    const names = (e.detail?.ids || []).map(id => model.definitions.find(d => d.id === id)?.name).filter(Boolean);
    if (!names.length) return;
    notice.textContent = 'Kept in your pocket: ' + names.join(' · ');
    notice.hidden = false;
    clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { notice.hidden = true; }, 6500);
  });
  dialog.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Escape' && !$('pocketInspect').hidden) { e.preventDefault(); hideInspect(); }
  });
  globalThis.PennyFeverInventory = {open, close: () => dialog.close()};
  updateLaunch();
  if (studio) open('everyday-penny');
}

function updateLaunch() {
  const launch = $('openTreasures');
  if (launch) launch.hidden = !studio && location.hash.startsWith('#cabinet/');
}

function albumItems(all, id) {
  const q = $('treasureSearch').value.toLowerCase().trim();
  return all.filter(i => {
    if (i.album !== id) return false;
    if (filter === 'found' && !i.owned) return false;
    if (filter === 'missing' && i.owned) return false;
    if (q && !`${i.name} ${i.source} ${i.category} ${i.album}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

function render() {
  if (!dialog.open) return;
  const all = entries();
  const filled = all.filter(i => i.owned).length;
  text('treasureCount', studio
    ? all.length + ' individual paper objects'
    : filled + ' of ' + all.length + ' places in the book · ' + all[0].quantity + ' demo pennies');

  const index = $('pocketIndex');
  index.replaceChildren();
  const heading = document.createElement('h2'); heading.textContent = 'Collections'; index.append(heading);
  for (const album of model.albums) {
    const group = all.filter(i => i.album === album.id);
    if (!group.length) continue;
    const have = group.filter(i => i.owned).length;
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.album = album.id;
    b.setAttribute('aria-current', String(album.id === albumId));
    if (have === group.length) b.classList.add('is-complete');
    b.innerHTML = '<span>' + album.title + '</span><small>' + have + ' / ' + group.length + '</small>';
    index.append(b);
  }
  if (!model.albums.some(a => a.id === albumId)) albumId = model.albums[0].id;
  const album = model.albums.find(a => a.id === albumId);
  const group = all.filter(i => i.album === albumId);
  const have = group.filter(i => i.owned).length;
  text('pocketAlbumKicker', 'Collection');
  text('pocketAlbumTitle', album.title);
  text('pocketAlbumBlurb', album.blurb);
  $('pocketAlbumBar').style.width = (group.length ? Math.round(have / group.length * 100) : 0) + '%';
  text('pocketAlbumCount', have + ' of ' + group.length + ' found' + (have === group.length && group.length ? ' · complete' : ''));

  const shown = albumItems(all, albumId);
  $('treasureEmpty').hidden = shown.length !== 0;
  paintStamps(shown);
}

function paintStamps(shown) {
  observer?.disconnect();
  const token = ++listToken, root = $('treasureItems');
  root.replaceChildren();
  const queue = []; let running = 0;
  function pump() {
    while (running < 3 && queue.length) {
      const {canvas, item} = queue.shift(); running++;
      loadArt(item).then(art => {
        const icon = document.createElement('canvas');
        paintIcon(icon, art, item.punched ? 2 : 0);
        iconCache.set(item.id + ':' + !!item.punched, icon);
        if (token === listToken && canvas.isConnected) canvas.getContext('2d').drawImage(icon, 0, 0);
      }).catch(() => {}).finally(() => { running--; if (token === listToken) pump(); });
    }
  }
  observer = new IntersectionObserver(changes => {
    for (const change of changes) if (change.isIntersecting) {
      observer.unobserve(change.target);
      const item = shown.find(i => i.id === change.target.dataset.icon);
      if (item) queue.push({canvas: change.target, item});
    }
    pump();
  }, {root, rootMargin: '40px'});

  for (const item of shown) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pocket-stamp' + (item.owned ? '' : ' is-missing');
    button.dataset.item = item.id;
    button.setAttribute('aria-pressed', String(item.id === current?.id));
    if (item.turnaround && item.asset) {
      const img = document.createElement('img');
      img.alt = ''; img.width = 88; img.height = 88; img.loading = 'lazy';
      img.src = item.asset;
      button.append(img);
    } else {
      const c = document.createElement('canvas');
      c.width = c.height = 128; c.dataset.icon = item.id; c.setAttribute('aria-hidden', 'true');
      button.append(c);
      const cached = iconCache.get(item.id + ':' + !!item.punched);
      if (cached) c.getContext('2d').drawImage(cached, 0, 0);
      else observer.observe(c);
    }
    const name = document.createElement('strong');
    name.textContent = item.name;
    const mark = document.createElement('em');
    mark.textContent = item.owned ? (item.kind === 'currency' ? 'Always with you' : 'Found') : 'Waiting';
    button.append(name, mark);
    root.append(button);
  }
}

function describe(item) {
  text('treasureName', item.name);
  text('treasureSource', item.source);
  text('treasureStatus', item.owned ? item.status : 'Not found yet — a place is waiting in the book.');
  text('treasureHint', item.hint);
  text('treasureDetail', item.id === 'moonlight-wardrobe'
    ? 'A collectible costume book. The six original crew remain free; wearing these outfits will follow.'
    : item.id === 'night-suitcase'
      ? 'A little home for the things you bring back from the midway.'
      : '');
}

function hideInspect() {
  selectionToken++;
  viewer?.destroy?.(); viewer = null;
  $('pocketInspect').hidden = true;
  $('treasureStage').replaceChildren();
}

async function select(id, punchedOverride) {
  const item = entries().find(i => i.id === model.resolve(id));
  if (!item) return;
  if (studio && punchedOverride !== undefined) item.punched = punchedOverride;
  current = item;
  albumId = item.album || albumId;
  const token = ++selectionToken;
  describe(item);
  viewer?.destroy?.(); viewer = null;
  $('treasureStage').replaceChildren();
  $('treasureRetry').hidden = true;
  $('treasureOpen').hidden = !item.hinged;
  $('treasureOpen').textContent = 'Open';
  $('treasureOpen').setAttribute('aria-expanded', 'false');
  $('treasurePunch').hidden = !(studio && item.id === 'admission-ticket');
  $('treasurePunch').textContent = item.punched ? 'Show intact ticket' : 'Show punched ticket';
  $('pocketInspect').hidden = false;
  dialog.querySelectorAll('[data-item]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.item === item.id)));
  text('treasureHow', item.turnaround || (item.columns > 1)
    ? 'Press and turn. Arrow keys spin; Home shows the front.'
    : 'A pressed paper portrait — drag to rock it in the light.');
  text('treasureLoading', item.owned ? 'Unwrapping your keepsake…' : 'The outline is here. Win it, and the colour comes in.');
  try {
    const art = await loadArt(item);
    if (token !== selectionToken || !dialog.open) return;
    if (item.hinged && item.owned) {
      const {ObjectViewer} = await import('./viewer.js?v=pocket-book-1');
      if (token !== selectionToken || !dialog.open) return;
      viewer = new ObjectViewer($('treasureStage'));
      viewer.show(item, art);
      $('treasureHow').textContent = 'Drag to turn. Open lifts the cover.';
    } else {
      const {Turntable} = await import('./viewer.js?v=pocket-book-1');
      if (token !== selectionToken || !dialog.open) return;
      viewer = new Turntable($('treasureStage'));
      viewer.show(item, art, !item.owned);
    }
    text('treasureLoading', '');
  } catch {
    if (token !== selectionToken || !dialog.open) return;
    text('treasureLoading', 'This keepsake could not be opened. Your collection is still saved.');
    $('treasureRetry').hidden = false;
  }
}

function open(id) {
  if (!dialog || (!studio && /\/play$/.test(location.hash))) return false;
  if (!dialog.open) {
    opener = document.activeElement; openedHash = location.hash;
    const world = globalThis.PennyFeverWorld;
    resumeWorld = !!(world?.started && !world.paused && document.body.classList.contains('is-in-world'));
    if (resumeWorld) world.pause();
    document.body.classList.add('has-treasure-open');
    dialog.showModal();
    $('treasureSave').hidden = globalThis.PennyFeverSavePersisted !== false;
    text('treasureSave', 'Your browser could not save this change. Keep this tab open to retain this visit.');
    if (!studio && model.reconcile(state())) globalThis.PennyFever?.saveState();
  }
  hideInspect();
  render();
  if (id) select(id);
  return true;
}

function close() {
  selectionToken++; listToken++; observer?.disconnect(); hideInspect();
  document.body.classList.remove('has-treasure-open');
  if (resumeWorld && location.hash === openedHash && document.body.classList.contains('is-in-world')) {
    globalThis.PennyFeverWorld?.resume();
  }
  resumeWorld = false;
  if (opener?.isConnected) opener.focus();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
else mount();
