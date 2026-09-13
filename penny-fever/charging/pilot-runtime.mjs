import {createPilotClient} from './pilot-client.mjs';
import {Draw, clamp} from '../paper-games/draw.js?v=ink-1';
import {kits, spriteKey} from '../paper-games/prizes.js?v=mint-1';
import {loadSprites} from '../paper-games/sprites.js';
import {paintPrize, stepPrize} from '../paper-games/chapter-kit.js?v=align-1';

export async function runPilot(entry, session) {
  const element = selector => document.querySelector(selector);
  const canvas = element('#world');
  const engineUrl = new URL(entry.module, new URL('../paper-games/runtime.js', import.meta.url));
  const engine = (await import(engineUrl.href + '?v=type-up-1')).default;
  engine.prizes = kits[entry.id]?.prizes || engine.prizes || [];
  const client = createPilotClient({...session, transport: window.parent.fetch.bind(window.parent)});
  const draw = new Draw(canvas);
  const input = {keys: new Set(), actions: new Set()};
  let record = null, state = null, chapter = 0, playing = false, busy = false, disposed = false;
  let events = [], previousFrame = 0, animation = 0;
  const abort = new AbortController();
  const listen = (target, type, handler) => target.addEventListener(type, handler, {signal: abort.signal});
  const tell = (type, fields = {}) => window.parent.postMessage({channel: 'pf-paper-world', type, ...fields}, location.origin);

  function error(reason) {
    playing = false;
    element('#error').textContent = reason.message;
    element('#veil').hidden = false;
    element('#veil-title').textContent = 'Your place is held';
    element('#veil-detail').textContent = 'Reconnect and continue. No replacement play has been charged.';
    element('#begin').textContent = 'Recover and continue';
  }

  function awards(rows) {
    if (!rows?.length) return;
    if (!navigator.locks) throw new Error('Award recovery requires cross-tab locking. Receipts are retained.');
    void navigator.locks.request('pennyFever.ledger.awards.v1', () => deliverAwards(rows)).catch(error);
  }

  function deliverAwards(rows) {
    if (session.privateTest) {
      const key = `pennyFever.privateTest.awards.v1:${session.playerId}`;
      const receipts = JSON.parse(localStorage.getItem(key) || '{}');
      for (const award of rows) receipts[award.receipt] = award;
      localStorage.setItem(key, JSON.stringify(receipts));
      return;
    }
    const api = window.parent.PennyFever;
    const model = window.parent.PennyFeverInventoryModel;
    const legacy = api?.getState?.();
    if (!legacy || !model?.recordPaperPrize) throw new Error('Inventory unavailable; award receipts are retained on the server.');
    const latest = JSON.parse(localStorage.getItem('pennyFever.restyle.v1') || 'null');
    if (latest) {
      for (const key of Object.keys(legacy)) delete legacy[key];
      Object.assign(legacy, latest);
    }
    if (rows.every(award => legacy.ledgerAwardReceipts?.[award.receipt])) return;
    const backup = JSON.parse(JSON.stringify(legacy));
    try {
      legacy.ledgerAwardReceipts ||= {};
      for (const award of rows) {
        if (legacy.ledgerAwardReceipts[award.receipt]) continue;
        model.recordPaperPrize(legacy, {item: award.item, stall: entry.id});
        legacy.ledgerAwardReceipts[award.receipt] = true;
      }
      api.saveState();
      if (window.parent.PennyFeverSavePersisted === false) throw new Error('Inventory save failed; receipts can be recovered.');
    } catch (reason) {
      for (const key of Object.keys(legacy)) delete legacy[key];
      Object.assign(legacy, backup);
      throw reason;
    }
  }

  function apply(next) {
    record = next;
    if (!next) return;
    window.PennyFeverPilotWallet = next.wallet;
    window.parent.dispatchEvent(new CustomEvent('pennyfever:pilotwallet', {detail: {game: entry.id, wallet: next.wallet}}));
    state = JSON.parse(next.play.snapshot).state;
    chapter = next.play.chapter;
    element('#chapter').value = chapter;
    awards(next.awards);
    if (next.play.status !== 'open') {
      playing = false;
      element('#veil').hidden = false;
      element('#veil-title').textContent = state.result?.title || 'The reading is finished';
      element('#veil-detail').textContent = state.result?.detail || state.note;
      element('#begin').textContent = entry.id === 'fortune' ? 'Choose another reading' : 'Begin a new attempt · 1 ticket';
    }
    paint();
  }

  function paint() {
    if (!state || disposed) return;
    draw.clear();
    engine.draw(state, draw, state.t || 0, input);
    paintPrize(state, draw);
    element('#readout').textContent = engine.readout?.(state) || '';
    element('#hud-cash').textContent = record ? `${record.wallet.tickets} tickets · ${record.wallet.pennies} pennies` : 'Viewing is free';
    element('#hud-house').textContent = entry.id === 'coin-pusher' ? 'Paid motion is saved' : `${Math.ceil(state.houseLeft ?? 0)}s`;
  }

  async function recover() {
    await client.recoverRequest();
    apply(await client.current());
    element('#error').textContent = '';
  }

  async function begin(topic) {
    if (busy) return;
    busy = true;
    try {
      if (record?.play.status !== 'open' || record.play.chapter !== chapter) {
        apply(await client.command({operation: 'pilot_begin', game: entry.id, chapter, ...(topic ? {topic} : {})}));
      }
      playing = true;
      element('#veil').hidden = true;
      previousFrame = 0;
    } catch (reason) { error(reason); }
    finally { busy = false; }
  }

  function enqueue(event) {
    if (entry.id === 'fortune' && record?.play.status !== 'open') {
      if (event.type === 'pointer' && event.phase === 'down') {
        const point = event.point;
        if (state.topic && Math.hypot(point.x - 450, point.y - 660) <= 210) { void begin(state.topic); return; }
        engine.pointer(state, 'down', point);
      } else if (event.type === 'key' && ['1', '2', '3', '4', '5'].includes(event.key)) {
        engine.key(state, event.key, true);
      } else if (state.topic && (event.type === 'action' || event.key === ' ')) void begin(state.topic);
      paint();
      return;
    }
    if (playing && events.length < 100) events.push(event);
  }

  async function frame(now) {
    if (disposed) return;
    if (playing && !busy && record?.play.status === 'open') {
      const dt = previousFrame ? Math.min(.05, Math.max(.001, (now - previousFrame) / 1000)) : 1 / 60;
      previousFrame = now;
      const batch = events;
      events = [];
      batch.push({type: 'tick', dt, keys: [...input.keys], actions: [...input.actions]});
      busy = true;
      try {
        apply(await client.command({operation: 'pilot_events', play_id: record.play.id,
          revision: record.play.revision, events: batch}));
      } catch (reason) { error(reason); }
      finally { busy = false; }
    } else if (state?.result) { stepPrize(state, 1 / 60); paint(); }
    animation = requestAnimationFrame(frame);
  }

  element('#title').textContent = engine.title;
  element('#host').textContent = entry.host;
  element('#intro').textContent = engine.intro;
  element('#instructions').textContent = engine.instructions;
  element('.note').textContent = entry.id === 'fortune'
    ? 'One free reading per Darwin day across all chapters; later readings cost one ticket. An unfinished reading waits for you.'
    : entry.id === 'balloons' ? 'One ticket starts an attempt. All taps are included. Leaving pauses, not abandons, your attempt.'
      : 'Each accepted drop costs one penny. Queued drops and moving prizes wait when you leave; the timer cannot discard paid motion.';
  element('#backdrop').src = entry.asset.replace(/\.png$/, '.webp');
  engine.levels.forEach((name, index) => {
    const option = document.createElement('option');
    option.value = index; option.textContent = `${index + 1}. ${name}`;
    element('#chapter').append(option);
  });
  function preview() {
    state = entry.id === 'coin-pusher' ? null : engine.create(chapter);
    record = null;
    element('#veil-title').textContent = engine.title;
    element('#veil-detail').textContent = entry.id === 'fortune' ? 'Choose a topic, then Gaze. Viewing does not use your daily reading.' : 'Your chapter resumes if it is already open.';
    element('#begin').textContent = entry.id === 'balloons' ? 'Begin · 1 ticket' : 'Step inside';
    paint();
  }
  const observer = new ResizeObserver(() => {
    const bounds = element('#stage').getBoundingClientRect();
    draw.resize(bounds.width, bounds.height, devicePixelRatio || 1); paint();
  });
  observer.observe(element('#stage'));
  preview();
  try { await recover(); } catch (reason) { error(reason); }
  for (const name of ['begin', 'chapter', 'restart', 'pause']) element('#' + name).disabled = false;
  element('#restart').textContent = 'End / Abandon play';
  element('#restart').hidden = entry.id === 'coin-pusher';
  element('#next-chapter').hidden = true;
  listen(element('#begin'), 'click', async () => {
    if (busy) return;
    if (element('#error').textContent) {
      busy = true;
      try { await recover(); } catch (reason) { error(reason); return; }
      finally { busy = false; }
    }
    if (entry.id === 'fortune' && record?.play.status !== 'open') {
      const topic = state?.topic;
      preview(); state.topic = topic; element('#veil').hidden = true; paint();
    } else await begin();
  });
  listen(element('#pause'), 'click', () => {
    playing = !playing && record?.play.status === 'open';
    input.keys.clear(); input.actions.clear();
    previousFrame = 0;
    element('#pause').textContent = playing ? 'Pause' : 'Continue';
  });
  listen(element('#restart'), 'click', async () => {
    if (busy || record?.play.status !== 'open' || !confirm('End this play? It cannot be resumed afterwards.')) return;
    playing = false; busy = true;
    try {
      await client.command({operation: 'pilot_abandon', play_id: record.play.id});
      apply(await client.current());
    } catch (reason) { error(reason); }
    finally { busy = false; }
  });
  listen(element('#chapter'), 'change', async () => {
    if (busy || (record?.play.status === 'open' && entry.id !== 'coin-pusher')) {
      element('#chapter').value = chapter; return;
    }
    playing = false; chapter = Number(element('#chapter').value); events = [];
    preview(); element('#veil').hidden = false;
  });
  for (const action of engine.actions || []) {
    const button = document.createElement('button');
    button.textContent = entry.id === 'fortune' ? 'Gaze' : action.label;
    element('#actions').append(button);
    if (action.hold) {
      listen(button, 'pointerdown', () => input.actions.add(action.id));
      listen(button, 'pointerup', () => input.actions.delete(action.id));
      listen(button, 'pointercancel', () => input.actions.delete(action.id));
    } else listen(button, 'click', () => enqueue({type: 'action', id: action.id}));
  }
  for (const phase of ['down', 'move', 'up', 'cancel']) listen(canvas, 'pointer' + phase, event => {
    const bounds = canvas.getBoundingClientRect();
    enqueue({type: 'pointer', phase, point: {x: clamp((event.clientX - bounds.left) / bounds.width * 900, 0, 900),
      y: clamp((event.clientY - bounds.top) / bounds.height * 1200, 0, 1200)}});
  });
  listen(canvas, 'keydown', event => {
    if (event.repeat) return;
    if (!['ArrowLeft', 'ArrowRight', ' ', 'Enter', 'd', 'D', '1', '2', '3', '4', '5'].includes(event.key)) return;
    event.preventDefault(); input.keys.add(event.key);
    enqueue({type: 'key', key: event.key, down: true});
  });
  listen(window, 'keyup', event => { input.keys.delete(event.key); });
  function pause() { playing = false; input.keys.clear(); input.actions.clear(); previousFrame = 0; }
  listen(document, 'visibilitychange', () => { if (document.hidden) pause(); });
  listen(window, 'message', event => {
    if (event.origin === location.origin && event.data?.channel === 'pf-paper-world' && event.data.type === 'pause') pause();
  });
  const back = document.querySelector('.play-header a[target="_parent"]');
  if (back) listen(back, 'click', event => { event.preventDefault(); pause(); tell('leave', {id: entry.id}); });
  listen(window, 'pagehide', () => { disposed = true; pause(); cancelAnimationFrame(animation); observer.disconnect(); abort.abort(); });
  loadSprites([...new Set([...(engine.sprites || []), ...engine.prizes])].map(spriteKey)).then(art => { draw.art = art; paint(); });
  tell('ready', {title: engine.title});
  animation = requestAnimationFrame(frame);
}
