import {loadArt,paintIcon} from './art.js?v=pocket-book-1';
const model = globalThis.PennyFeverInventoryModel;
const studio = document.body.dataset.objectStudio === 'true';
const iconCache = new Map();
let dialog, viewer, current = null, bookId = null, filter = 'all';
let selectionToken = 0, listToken = 0, opener, resumeWorld = false, openedHash = '', observer;
const $ = id => document.getElementById(id);
const state = () => globalThis.PennyFever?.getState() || {};
const entries = () => studio
  ? model.definitions.map(d => ({...d, owned: true, quantity: 1, status: 'Object study', punched: false}))
  : model.entries(state());
const text = (id, value) => { $(id).textContent = value; };
const interior = (all, id) => {
  const book = model.books.find(b => b.id === id);
  if (book?.master) return all.filter(i => i.id !== id);
  return all.filter(i => i.book === id && i.id !== id);
};

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
          <h1 id="treasureTitle">The treasure book</h1>
          <p id="treasureCount"></p>
        </div>
        <button type="button" class="pocket-close" id="closeTreasures" aria-label="Close the treasure book">Close ×</button>
      </header>
      <p id="treasureSave" class="pocket-save" role="status" hidden></p>
      <div class="pocket-menu">
        <button type="button" class="shelf-back" id="shelfBack" hidden>← The shelf</button>
        <input type="search" id="treasureSearch" placeholder="Find a book or keepsake" aria-label="Search the collection">
        <div class="pocket-filters" role="group" aria-label="Filter pages">
          <button type="button" data-filter="all" aria-pressed="true">All</button>
          <button type="button" data-filter="found" aria-pressed="false">Found</button>
          <button type="button" data-filter="missing" aria-pressed="false">Waiting</button>
        </div>
      </div>
      <div class="shelf-view" id="treasureShelf">
        <p class="shelf-intro" id="shelfIntro">Open a book or album. Pages wait in silhouette until you find each keepsake.</p>
        <div class="shelf-grid" id="shelfGrid"></div>
      </div>
      <div class="pocket-body" id="treasureSpread" hidden>
        <section class="pocket-page is-left" aria-labelledby="pocketAlbumTitle">
          <button type="button" class="book-cover-btn" id="bookCoverBtn" aria-label="Inspect this book">
            <img id="bookCover" alt="">
          </button>
          <p class="pocket-kicker" id="pocketAlbumKicker">Collection</p>
          <h2 id="pocketAlbumTitle"></h2>
          <p class="pocket-blurb" id="pocketAlbumBlurb"></p>
          <div class="pocket-progress" aria-hidden="true"><i id="pocketAlbumBar"></i></div>
          <p class="pocket-count" id="pocketAlbumCount"></p>
        </section>
        <section class="pocket-page is-right">
          <p id="treasureEmpty" hidden>Nothing in this book matches that search.</p>
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
  $('shelfBack').addEventListener('click', closeBook);
  $('bookCoverBtn').addEventListener('click', () => { if (bookId) select(bookId); });
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
  $('shelfGrid').addEventListener('click', e => {
    const b = e.target.closest('[data-book]'); if (!b) return;
    openBook(b.dataset.book);
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
    notice.textContent = 'Kept in the treasure book: ' + names.join(' · ');
    notice.hidden = false;
    clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { notice.hidden = true; }, 6500);
  });
  dialog.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key !== 'Escape') return;
    if (!$('pocketInspect').hidden) { e.preventDefault(); hideInspect(); }
    else if (bookId) { e.preventDefault(); closeBook(); }
  });
  globalThis.PennyFeverInventory = {open, close: () => dialog.close()};
  updateLaunch();
  const preview = new URLSearchParams(location.search).get('treasures');
  if (studio) open();
  else if (preview != null) open(preview === '' || preview === 'shelf' ? undefined : preview);
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

function bookItems(all, id) {
  const q = query();
  return interior(all, id).filter(i => {
    if (filter === 'found' && !i.owned) return false;
    if (filter === 'missing' && i.owned) return false;
    return matchesQuery(i, q);
  });
}

function bookStats(all, id) {
  const group = interior(all, id);
  const have = group.filter(i => i.owned).length;
  const cover = all.find(i => i.id === id);
  return {group, have, cover, ownedCover: !cover || !!cover.owned};
}

function openBook(id) {
  bookId = id;
  hideInspect();
  render();
  const page = $('treasureItems')?.closest('.pocket-page');
  if (page) page.scrollTop = 0;
  if (window.matchMedia('(pointer: fine)').matches) $('shelfBack')?.focus();
}

function closeBook() {
  bookId = null;
  hideInspect();
  render();
  if (window.matchMedia('(pointer: fine)').matches) {
    $('shelfGrid')?.querySelector('[data-book]')?.focus();
  }
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

  const onShelf = !bookId;
  $('treasureShelf').hidden = !onShelf;
  $('treasureSpread').hidden = onShelf;
  $('shelfBack').hidden = onShelf;
  dialog.querySelector('.pocket-shell')?.classList.toggle('is-open-book', !onShelf);
  $('treasureSearch').placeholder = onShelf ? 'Find a book or keepsake' : 'Find a keepsake';
  text('shelfIntro', 'Open a book. Empty places wait for the keepsakes you bring home.');

  if (onShelf) {
    paintShelf(all);
    return;
  }

  if (!model.books.some(b => b.id === bookId)) bookId = model.books[0].id;
  const book = model.books.find(b => b.id === bookId);
  const {group, have} = bookStats(all, bookId);
  text('pocketAlbumKicker', book.kicker || 'Collection');
  text('pocketAlbumTitle', book.title);
  text('pocketAlbumBlurb', book.blurb);
  $('pocketAlbumBar').style.width = (group.length ? Math.round(have / group.length * 100) : 0) + '%';
  text('pocketAlbumCount', group.length
    ? have + ' of ' + group.length + ' found' + (have === group.length ? ' · complete' : '')
    : 'Pages still being bound');
  const cover = $('bookCover');
  cover.src = book.cover;
  cover.alt = book.title;
  $('bookCoverBtn').classList.remove('is-missing');
  $('bookCoverBtn').setAttribute('aria-label', 'Inspect ' + book.title);

  const shown = bookItems(all, bookId);
  $('treasureEmpty').hidden = shown.length !== 0;
  paintSlots(shown, {groupByBook: !!book?.master});
}

function paintShelf(all) {
  const root = $('shelfGrid');
  const q = query();
  root.replaceChildren();
  let shown = 0;
  for (const book of model.books) {
    const {group, have, ownedCover} = bookStats(all, book.id);
    const started = have > 0;
    const waiting = !group.length || have < group.length;
    if (filter === 'found' && !started) continue;
    if (filter === 'missing' && !waiting) continue;
    const hay = `${book.title} ${book.blurb} ${book.kicker} ` + group.map(i => i.name).join(' ');
    if (q && !hay.toLowerCase().includes(q) && !group.some(i => matchesQuery(i, q))) continue;
    shown++;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'shelf-book' + (have === group.length && group.length ? ' is-complete' : '');
    b.dataset.book = book.id;
    b.setAttribute('aria-label', book.title + ', ' + have + ' of ' + group.length + ' found');
    const well = document.createElement('span');
    well.className = 'shelf-cover';
    const img = document.createElement('img');
    img.src = book.cover; img.alt = ''; img.width = 220; img.height = 220; img.loading = 'lazy';
    well.append(img);
    const name = document.createElement('strong');
    name.textContent = book.title;
    const mark = document.createElement('em');
    mark.textContent = group.length
      ? (have === group.length ? 'Complete' : have + ' / ' + group.length)
      : (ownedCover ? 'Found' : 'Waiting');
    b.append(well, name, mark);
    root.append(b);
  }
  text('shelfIntro', shown
    ? 'Open a book. Empty places wait for the keepsakes you bring home.'
    : 'Nothing on the shelf matches that search.');
}

function paintSlots(shown, opts = {}) {
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
      const item = shown.find(i => i.id === change.target.dataset.icon);
      if (item) queue.push({canvas: change.target, item});
    }
    pump();
  }, {root: scrollRoot, rootMargin: '80px'});

  function appendSlot(item) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'album-slot' + (item.owned ? ' is-found' : ' is-missing');
    button.dataset.item = item.id;
    button.setAttribute('aria-pressed', String(item.id === current?.id));
    button.setAttribute('aria-label', item.name + (item.owned ? ', found' : ', waiting to be collected'));
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

  if (opts.groupByBook) {
    const byBook = new Map();
    for (const item of shown) {
      const bid = item.book || 'penny-collector-book';
      if (!byBook.has(bid)) byBook.set(bid, []);
      byBook.get(bid).push(item);
    }
    const order = model.books.map(b => b.id);
    for (const item of shown) if (!order.includes(item.book)) order.push(item.book);
    for (const bid of order) {
      const items = byBook.get(bid);
      if (!items?.length) continue;
      const book = model.books.find(b => b.id === bid);
      const heading = document.createElement('h3');
      heading.className = 'album-chapter';
      heading.textContent = book ? (book.master ? 'Pennies & tokens' : book.title) : bid;
      root.append(heading);
      const cover = items.find(i => i.id === bid);
      const rest = items.filter(i => i.id !== bid);
      if (cover) appendSlot(cover);
      rest.forEach(appendSlot);
    }
    return;
  }

  shown.forEach(appendSlot);
}

function describe(item) {
  text('treasureName', item.name);
  text('treasureSource', item.source);
  text('treasureStatus', item.owned ? item.status : 'Not found yet — a shaded place is waiting in the book.');
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
  if (bookId !== 'penny-collector-book') bookId = item.book || bookId;
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
    bookId = item?.book || null;
    render();
    if (item && item.id !== item.book) select(item.id);
  } else {
    bookId = null;
    render();
  }
  return true;
}

function close() {
  selectionToken++; listToken++; observer?.disconnect(); hideInspect();
  bookId = null;
  document.body.classList.remove('has-treasure-open');
  if (resumeWorld && location.hash === openedHash && document.body.classList.contains('is-in-world')) {
    globalThis.PennyFeverWorld?.resume();
  }
  resumeWorld = false;
  if (opener?.isConnected) opener.focus();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
else mount();
