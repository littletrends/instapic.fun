import {loadArt,paintIcon} from './art.js?v=pocket-book-1';
import {stalls, stallById, stallForItem, stallItems, stallStats} from './midway.js?v=treasure-tree-1';

const model = globalThis.PennyFeverInventoryModel;
const studio = document.body.dataset.objectStudio === 'true';
const iconCache = new Map();
let dialog, viewer, current = null, focus = null, filter = 'all', paintingTree = false;
const expanded = new Set();
let selectionToken = 0, listToken = 0, opener, resumeWorld = false, openedHash = '', observer;
const $ = id => document.getElementById(id);
const state = () => globalThis.PennyFever?.getState() || {};
const entries = () => studio
  ? model.definitions.map(d => ({...d, owned: true, quantity: 1, status: 'Object study', punched: false}))
  : model.entries(state());
const text = (id, value) => { $(id).textContent = value; };
const bookOwned = all => studio || !!all.find(i => i.id === 'penny-collector-book')?.owned;

function mount() {
  if (!model) return;
  const launch = document.createElement('button');
  launch.type = 'button'; launch.id = 'openTreasures';
  launch.className = studio ? 'treasure-launch' : 'ticket-button door-pocket';
  launch.textContent = studio ? 'Open the object cabinet' : 'The treasure book';
  const door = document.getElementById('discoveryDoor');
  if (!studio && door) {
    const back = door.querySelector('.site-back');
    door.insertBefore(launch, back || null);
  } else document.body.append(launch);
  launch.addEventListener('click', () => open());

  dialog = document.createElement('dialog');
  dialog.className = 'treasure-book';
  dialog.setAttribute('aria-labelledby', 'treasureTitle');
  dialog.innerHTML = `
    <div class="pocket-shell">
      <header class="pocket-header">
        <div>
          <p class="pocket-eyebrow">Penny Fever · treasures</p>
          <h1 id="treasureTitle">Treasures</h1>
          <p id="treasureCount"></p>
        </div>
        <button type="button" class="pocket-close" id="closeTreasures" aria-label="Close treasures">Close ×</button>
      </header>
      <p id="treasureSave" class="pocket-save" role="status" hidden></p>
      <div class="pocket-menu">
        <button type="button" class="shelf-back" id="shelfBack" hidden>← All stalls</button>
        <input type="search" id="treasureSearch" placeholder="Find a stall or prize" aria-label="Search treasures">
        <div class="pocket-filters" role="group" aria-label="Filter prizes">
          <button type="button" data-filter="all" aria-pressed="true">All</button>
          <button type="button" data-filter="found" aria-pressed="false">Found</button>
          <button type="button" data-filter="missing" aria-pressed="false">Waiting</button>
        </div>
      </div>
      <div class="pocket-body is-tree-spread" id="treasureSpread">
        <nav class="treasure-tree pocket-page is-left" id="treasureTree" aria-label="Stalls"></nav>
        <section class="pocket-page is-right">
          <div class="tree-stall-head">
            <button type="button" class="book-cover-btn" id="bookCoverBtn" aria-label="Inspect this stall">
              <img id="bookCover" alt="">
            </button>
            <p class="pocket-kicker" id="pocketAlbumKicker">The alley</p>
            <h2 id="pocketAlbumTitle">Treasures</h2>
            <p class="pocket-blurb" id="pocketAlbumBlurb">Open a stall to see its chapters. The book remembers. The games stay on the boardwalk.</p>
            <div class="pocket-progress" aria-hidden="true"><i id="pocketAlbumBar"></i></div>
            <p class="pocket-count" id="pocketAlbumCount"></p>
          </div>
          <p id="treasureEmpty" hidden>Nothing here matches that search.</p>
          <div class="album-slots" id="treasureItems"></div>
        </section>
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
  $('shelfBack').addEventListener('click', () => { focus = null; hideInspect(); render(); });
  $('bookCoverBtn').addEventListener('click', inspectFocusCover);
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
  $('treasureTree').addEventListener('click', e => {
    const prize = e.target.closest('[data-item]');
    if (prize) { select(prize.dataset.item); return; }
  });
  $('treasureTree').addEventListener('toggle', e => {
    if (paintingTree) return;
    const node = e.target.closest('details[data-stall]');
    if (!node || e.target !== node) return;
    const id = node.dataset.stall;
    if (node.open) {
      expanded.add(id);
      focus = {kind: 'stall', id};
      dialog.querySelector('.pocket-body')?.classList.add('has-stall');
      $('shelfBack').hidden = false;
      paintStall(entries(), id);
    } else expanded.delete(id);
  }, true);
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
    const ids = e.detail?.ids || [];
    const names = ids.map(id => model.definitions.find(d => d.id === id)?.name).filter(Boolean);
    if (!names.length) return;
    notice.textContent = 'Kept in the treasure book: ' + names.join(' · ');
    notice.hidden = false;
    clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { notice.hidden = true; }, 6500);
    if (e.detail?.celebrate !== false && ids[0]) celebrate(ids[0]);
  });
  dialog.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key !== 'Escape') return;
    if (!$('pocketInspect').hidden) { e.preventDefault(); hideInspect(); }
  });
  globalThis.PennyFeverInventory = {open, celebrate, close: () => dialog.close()};
  updateLaunch();
  const preview = new URLSearchParams(location.search).get('treasures');
  if (studio) open();
  else if (preview != null) {
    if (preview === '' || preview === 'shelf') open();
    else if (preview === 'collection') { open(); expandAll(); }
    else open(preview);
  }
}

function updateLaunch() {
  const launch = $('openTreasures');
  if (launch) launch.hidden = !studio && location.hash.startsWith('#cabinet/');
}

function query() {
  return $('treasureSearch').value.toLowerCase().trim();
}

function matchesQuery(item, q) {
  if (!q) return true;
  return `${item.name} ${item.source} ${item.category} ${item.book}`.toLowerCase().includes(q);
}

function visibleItems(items) {
  const q = query();
  return items.filter(i => {
    if (filter === 'found' && !i.owned) return false;
    if (filter === 'missing' && i.owned) return false;
    return matchesQuery(i, q);
  });
}

function stallHay(stall, items) {
  return `${stall.host} ${stall.title} ${stall.blurb} ` + items.map(i => i.name).join(' ');
}

function expandAll() {
  stalls.filter(s => !s.workshop).forEach(s => expanded.add(s.id));
  render();
}

function openStall(id) {
  const stall = stallById(id);
  if (!stall) return;
  expanded.add(id);
  focus = {kind: 'stall', id};
  hideInspect();
  render();
  const page = $('treasureItems')?.closest('.pocket-page');
  if (page) page.scrollTop = 0;
}

function inspectFocusCover() {
  if (focus?.kind === 'stall') {
    const first = stallById(focus.id)?.prizes?.[0];
    if (first) select(first);
  } else select('penny-collector-book');
}

function render() {
  if (!dialog.open) return;
  const all = entries();
  const filled = all.filter(i => i.owned).length;
  const pennies = all.find(i => i.id === 'everyday-penny')?.quantity || 0;
  const tix = all.find(i => i.id === 'ticket-roll')?.quantity || 0;
  text('treasureCount', studio
    ? all.length + ' individual paper objects'
    : filled + ' of ' + all.length + ' keepsakes · ' + tix + (tix === 1 ? ' ticket' : ' tickets') + ' · ' + pennies + (pennies === 1 ? ' penny' : ' pennies'));

  dialog.querySelector('.pocket-shell')?.classList.add('is-open-book');
  dialog.querySelector('.pocket-body')?.classList.toggle('has-stall', !!focus);
  $('shelfBack').hidden = !focus;
  paintTree(all);
  if (focus?.kind === 'stall') paintStall(all, focus.id);
  else paintIdle();
}

function paintIdle() {
  text('pocketAlbumKicker', 'The alley');
  text('pocketAlbumTitle', 'Treasures');
  text('pocketAlbumBlurb', 'Open a stall to see its chapters. The book remembers what you won. Playing still happens on the boardwalk.');
  $('pocketAlbumBar').style.width = '0';
  text('pocketAlbumCount', 'Pick a game in the list');
  const cover = $('bookCover');
  cover.src = 'assets/restyle/game-sprites/collector-books/penny-collector-book/front.png';
  cover.alt = 'Penny collector book';
  $('bookCoverBtn').classList.toggle('is-missing', !bookOwned(entries()));
  $('bookCoverBtn').setAttribute('aria-label', 'Inspect the penny collector book');
  $('treasureEmpty').hidden = true;
  $('treasureItems').replaceChildren();
}

function paintTree(all) {
  const root = $('treasureTree');
  if (!root) return;
  const q = query();
  const y = root.scrollTop;
  paintingTree = true;
  root.replaceChildren();
  const groups = [
    {label: 'Booth', list: stalls.filter(s => s.extra)},
    {label: 'Games', list: stalls.filter(s => !s.extra && !s.workshop)},
    {label: 'Workshop', list: stalls.filter(s => s.workshop)},
  ];
  for (const group of groups) {
    const shown = [];
    for (const stall of group.list) {
      const {have, total, items} = stallStats(all, stall);
      const hay = stallHay(stall, items).toLowerCase();
      const vis = visibleItems(items);
      if (q && !hay.includes(q) && !vis.length) continue;
      shown.push({stall, have, total, items, vis, hit: !!(q && (hay.includes(q) || vis.length))});
    }
    if (!shown.length) continue;
    const h = document.createElement('p');
    h.className = 'tree-group';
    h.textContent = group.label;
    root.append(h);
    for (const row of shown) {
      const details = document.createElement('details');
      details.dataset.stall = row.stall.id;
      details.open = expanded.has(row.stall.id) || row.hit;
      if (focus?.id === row.stall.id) details.classList.add('is-current');
      if (row.have === row.total && row.total) details.classList.add('is-complete');
      const sum = document.createElement('summary');
      const name = document.createElement('span');
      name.className = 'tree-name';
      name.textContent = row.stall.host + ' · ' + row.stall.title;
      const mark = document.createElement('span');
      mark.className = 'tree-mark';
      mark.textContent = row.have + '/' + row.total;
      sum.append(name, mark);
      details.append(sum);
      const kids = q ? row.vis : row.items;
      for (const item of kids) {
        const ch = row.stall.extra ? '' : String(row.stall.prizes.indexOf(item.id) + 1);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tree-prize' + (item.owned ? ' is-found' : ' is-missing');
        b.dataset.item = item.id;
        b.setAttribute('aria-label', (ch ? 'Chapter ' + ch + ', ' : '') + item.name + (item.owned ? ', found' : ', waiting on the alley'));
        if (ch) {
          const num = document.createElement('span');
          num.className = 'tree-ch';
          num.textContent = ch;
          b.append(num);
        }
        const label = document.createElement('span');
        label.textContent = item.name;
        const state = document.createElement('em');
        state.textContent = item.owned ? (item.quantity > 1 ? '×' + item.quantity : 'Found') : 'On the alley';
        b.append(label, state);
        details.append(b);
      }
      root.append(details);
    }
  }
  root.scrollTop = y;
  queueMicrotask(() => { paintingTree = false; });
}

function paintStall(all, id) {
  const stall = stallById(id);
  if (!stall) { focus = null; render(); return; }
  const {items, have, total} = stallStats(all, stall);
  text('pocketAlbumKicker', stall.workshop ? 'Workshop' : stall.extra ? 'Booth' : stall.host);
  text('pocketAlbumTitle', stall.title);
  text('pocketAlbumBlurb', stall.blurb);
  $('pocketAlbumBar').style.width = (total ? Math.round(have / total * 100) : 0) + '%';
  text('pocketAlbumCount', total
    ? have + ' of ' + total + (stall.extra ? ' found' : ' chapters') + (have === total && total ? ' · complete' : '')
    : 'Prizes still being bound');
  const cover = $('bookCover');
  cover.src = stall.cover;
  cover.alt = stall.host + ' · ' + stall.title;
  $('bookCoverBtn').classList.remove('is-missing');
  $('bookCoverBtn').setAttribute('aria-label', 'Inspect prizes from ' + stall.title);
  const shown = visibleItems(items).map(item => ({
    item,
    chapter: stall.extra ? '' : 'Chapter ' + (stall.prizes.indexOf(item.id) + 1),
  }));
  $('treasureEmpty').hidden = shown.length !== 0;
  paintSlots(shown);
}

function paintSlots(shown) {
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
  const scrollRoot = root.closest('.pocket-page') || root;
  observer = new IntersectionObserver(changes => {
    for (const change of changes) if (change.isIntersecting) {
      observer.unobserve(change.target);
      const item = shown.find(row => row.item?.id === change.target.dataset.icon)?.item;
      if (item) queue.push({canvas: change.target, item});
    }
    pump();
  }, {root: scrollRoot, rootMargin: '80px'});

  for (const row of shown) {
    if (row.heading) {
      const heading = document.createElement('h3');
      heading.className = 'album-chapter';
      if (row.stall) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'album-chapter-link';
        b.textContent = row.heading;
        b.addEventListener('click', () => openStall(row.stall, true));
        heading.append(b);
      } else heading.textContent = row.heading;
      root.append(heading);
      continue;
    }
    const item = row.item;
    if (!item) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'album-slot chapter-slot' + (item.owned ? ' is-found' : ' is-missing');
    button.dataset.item = item.id;
    button.setAttribute('aria-pressed', String(item.id === current?.id));
    button.setAttribute('aria-label', (row.chapter ? row.chapter + ', ' : '') + item.name + (item.owned ? ', found' : ', waiting to be collected'));
    if (row.chapter) {
      const ch = document.createElement('span');
      ch.className = 'chapter-num';
      ch.textContent = row.chapter;
      button.append(ch);
    }
    const well = document.createElement('span');
    well.className = 'slot-well';
    if (item.turnaround && item.asset) {
      const img = document.createElement('img');
      img.className = 'slot-art';
      img.alt = ''; img.width = 96; img.height = 96; img.loading = 'lazy';
      img.src = item.asset;
      well.append(img);
    } else {
      const c = document.createElement('canvas');
      c.className = 'slot-art';
      c.width = c.height = 128; c.dataset.icon = item.id; c.setAttribute('aria-hidden', 'true');
      well.append(c);
      const cached = iconCache.get(item.id + ':' + !!item.punched);
      if (cached) c.getContext('2d').drawImage(cached, 0, 0);
      else observer.observe(c);
    }
    const name = document.createElement('strong');
    name.textContent = item.name;
    const mark = document.createElement('em');
    mark.textContent = item.owned
      ? (item.kind === 'currency' ? item.quantity + (item.quantity === 1 ? ' penny' : ' pennies')
        : item.kind === 'scrip' ? item.quantity + (item.quantity === 1 ? ' ticket' : ' tickets')
        : item.quantity > 1 ? '×' + item.quantity
        : 'Found')
      : 'To collect';
    button.append(well, name, mark);
    root.append(button);
  }
}

function describe(item) {
  const stall = stallForItem(item.id);
  const chapter = stall && !stall.extra ? stall.prizes.indexOf(item.id) + 1 : 0;
  text('treasureName', item.name);
  text('treasureSource', stall
    ? (chapter ? stall.host + ' · ' + stall.title + ' · chapter ' + chapter : stall.host + ' · ' + stall.title)
    : item.source);
  text('treasureStatus', item.owned ? item.status : 'Not found yet. Win it on the alley — the book will keep the place.');
  text('treasureHint', item.hint);
  text('treasureDetail', item.id === 'moonlight-wardrobe'
    ? 'A collectible costume book. The six original crew remain free; wearing these outfits will follow.'
    : item.id === 'night-suitcase'
      ? 'A little home for the things you bring back from the midway.'
      : item.id === 'penny-collector-book'
        ? 'A home for the whole midway. The tree already lists every stall; this book is the keepsake for filling it.'
        : stall && !item.owned
          ? 'Find this at ' + stall.host + '’s stall on the alley.'
          : '');
}

function hideInspect() {
  selectionToken++;
  viewer?.destroy?.(); viewer = null;
  $('pocketInspect').classList.remove('is-prize-arrive');
  $('pocketInspect').hidden = true;
  $('treasureStage').classList.remove('is-prize-chest');
  $('treasureStage').replaceChildren();
}

async function select(id, punchedOverride) {
  const item = entries().find(i => i.id === model.resolve(id));
  if (!item) return;
  if (studio && punchedOverride !== undefined) item.punched = punchedOverride;
  current = item;
  if (!focus && item.id !== 'penny-collector-book') {
    const stall = stallForItem(item.id);
    if (stall) { expanded.add(stall.id); focus = {kind: 'stall', id: stall.id}; render(); }
  }
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
  const touch = window.matchMedia('(pointer: coarse)').matches;
  text('treasureHow', item.turnaround || (item.columns > 1)
    ? (touch ? 'Drag to turn the keepsake.' : 'Press and turn. Arrow keys spin; Home shows the front.')
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
    if (spinPrize) {
      spinPrize = false;
      const inspect = $('pocketInspect');
      const stage = $('treasureStage');
      inspect?.classList.add('is-prize-arrive');
      stage?.classList.add('is-prize-chest');
      if (viewer && 'vel' in viewer) { viewer.vel = 0.16; viewer.coast?.(); }
      setTimeout(() => {
        inspect?.classList.remove('is-prize-arrive');
        stage?.classList.remove('is-prize-chest');
      }, 3200);
    }
  } catch {
    if (token !== selectionToken || !dialog.open) return;
    text('treasureLoading', 'This keepsake could not be opened. Your collection is still saved.');
    $('treasureRetry').hidden = false;
  }
}

let spinPrize = false;
function celebrate(id) {
  spinPrize = true;
  open(id);
}

function open(id) {
  if (!dialog || (!studio && /\/play$/.test(location.hash))) return false;
  if (!dialog.open) {
    opener = document.activeElement; openedHash = location.hash;
    const world = globalThis.PennyFeverWorld;
    resumeWorld = !!(world?.started && !world.paused && document.body.classList.contains('is-in-world'));
    if (resumeWorld) world.pause();
    document.body.classList.add('has-treasure-open');
    try {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else {
        dialog.setAttribute('open', '');
        dialog.classList.add('is-open');
      }
    } catch {
      dialog.setAttribute('open', '');
      dialog.classList.add('is-open');
    }
    $('treasureSave').hidden = globalThis.PennyFeverSavePersisted !== false;
    text('treasureSave', 'Your browser could not save this change. Keep this tab open to retain this visit.');
    if (!studio && model.reconcile(state())) globalThis.PennyFever?.saveState();
  }
  hideInspect();
  if (id) {
    const item = entries().find(i => i.id === model.resolve(id));
    const stall = item && stallForItem(item.id);
    if (item?.id === 'penny-collector-book') {
      focus = null;
      render();
      select(item.id);
    } else if (stall) {
      expanded.add(stall.id);
      focus = {kind: 'stall', id: stall.id};
      render();
      if (item) select(item.id);
    } else {
      focus = null;
      render();
      if (item) select(item.id);
    }
  } else {
    focus = null;
    render();
  }
  return true;
}

function close() {
  selectionToken++; listToken++; observer?.disconnect(); hideInspect();
  focus = null; expanded.clear();
  document.body.classList.remove('has-treasure-open');
  if (resumeWorld && location.hash === openedHash && document.body.classList.contains('is-in-world')) {
    globalThis.PennyFeverWorld?.resume();
  }
  resumeWorld = false;
  if (opener?.isConnected) opener.focus();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
else mount();
