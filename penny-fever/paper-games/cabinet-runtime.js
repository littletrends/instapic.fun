import { games, byId } from "./catalogue.js?v=live-cabinets-1";
import { Draw, clamp } from "./cabinet-draw.js";

const $ = s => document.querySelector(s);
const abort = new AbortController();
const sig = { signal: abort.signal };
const canvas = $("#world");
const hostPortrait = document.createElement('img');
hostPortrait.id = 'veil-host'; hostPortrait.className = 'veil-iris'; hostPortrait.alt = '';
$('#veil > div').prepend(hostPortrait);
const back = document.createElement('a'); back.className = 'back'; back.href = '../index.html?style=paper&rail=paper#alley'; back.textContent = 'Back to the alley';
document.querySelector('.game-menu-bar').prepend(back);
const input = { keys: new Set(), actions: new Set(), pointer: null, down: false };

let menuResume = false;
let engine, state, draw, level = 0, playing = false, ended = false, disposed = false;
let raf = 0, last = 0, paintAt = 0, time = 0, observer;

const id = new URLSearchParams(location.search).get("stall");
const embedded = window.parent !== window;
function tellRoom(type) { if (embedded) window.parent.postMessage({channel:"pf-paper-world", type, id, title:engine?.title || "Penny Fever"}, location.origin); }
function leave(e) { e?.preventDefault(); persist(); if (embedded) tellRoom("leave"); else location.href="../index.html?style=paper&rail=paper#alley"; }
const entry = byId[id];
const HOUSE_FALLBACK = { seconds: 100, title: "The globe went still", detail: "Iris covers the glass. Another gaze when you are ready." };

function listen(el, event, fn, opts = {}) {
  el.addEventListener(event, fn, { ...opts, signal: abort.signal });
}
function houseSpec() {
  if (engine?.houseSeconds === 0) return null;
  if (engine?.houseSeconds) {
    return {
      seconds: engine.houseSeconds,
      title: engine.houseTitle || HOUSE_FALLBACK.title,
      detail: engine.houseDetail || HOUSE_FALLBACK.detail,
    };
  }
  return HOUSE_FALLBACK;
}
function error(e) {
  playing = false;
  cancelAnimationFrame(raf);
  $("#error").textContent = "This room could not open: " + e.message;
  $("#veil-title").textContent = "The room needs attention";
  $("#veil-detail").textContent = "Reload, or go back to the catalogue.";
  $("#begin").disabled = true;
  $("#pause").disabled = true;
  $("#veil").hidden = false;
  console.error(e);
}
function showHost(on) {
  const img = $("#veil-host");
  if (on && draw?.art?.host) img.src = draw.art.host.src;
}

function showPrize(src, name) {
  const img = $("#veil-prize"), cap = $("#veil-prize-name");
  if (!img) return;
  if (!src) {
    img.hidden = true;
    if (cap) cap.hidden = true;
    img.removeAttribute("src");
    return;
  }
  img.hidden = false;
  img.src = src;
  if (cap) {
    cap.hidden = !name;
    cap.textContent = name || "";
  }
}
function veil(tag, title, detail, button, prize) {
  $("#veil-tag").textContent = tag;
  $("#veil-title").textContent = title;
  $("#veil-detail").textContent = detail;
  $("#begin").textContent = button;
  showPrize(prize?.src || null, prize?.name || null);
  $("#veil").hidden = false;
}
function clearInput() {
  input.keys.clear();
  input.actions.clear();
  input.down = false;
  if (state) engine?.pointer?.(state, "cancel", input.pointer || { x: 450, y: 1050 }, input);
  input.pointer = null;
}
function persist() {
  try { engine?.persist?.(state); } catch {}
}
function stop() {
  playing = false;
  cancelAnimationFrame(raf);
  raf = 0;
  last = 0;
  clearInput();
}
function pause() {
  if (!playing) return;
  persist();
  stop();
  veil("Take your time", "The room is resting.", "Nothing moves until you return.", "Continue");
  $("#pause").textContent = "Continue";
}
function closeMenu() {
  document.body.classList.remove("menu-open");
  $("#menu-toggle").setAttribute("aria-expanded", "false");
  if (menuResume) {
    menuResume = false;
    start();
  }
}
function paintHud() {
  const cash = $("#hud-cash"), keep = $("#hud-keep"), next = $("#next-chapter");
  const live = engine?.hud?.(state) || {};
  if (cash) cash.textContent = live.cash || (state?.practice ? "Practice" : "Paid play");
  if (keep) keep.textContent = live.keep || ("Ch " + (level + 1));
  const clock = $("#hud-house");
  if (clock) {
    const house = houseSpec();
    if (house && state && state.houseLeft != null && playing && engine?.houseSeconds !== 0) {
      clock.hidden = false;
      clock.textContent = Math.max(0, Math.ceil(state.houseLeft)) + "s";
    } else {
      clock.hidden = true;
      clock.textContent = "";
    }
  }
  if (next) {
    const lastCh = !engine?.levels || level >= engine.levels.length - 1;
    next.disabled = !state || lastCh;
    next.textContent = id === 'fortune' ? '›' : (lastCh ? 'Last chapter' : 'Next chapter');
    const prev=$('#previous-chapter');if(prev)prev.disabled=!state || level===0;
    const label=$('#chapter-position');if(label)label.textContent='Ch '+(level+1);
  }
}
function paint() {
  if (!draw || !state) return;
  draw.clear();
  engine.draw(state, draw, time, input);
  paintHud();
}
function reset() {
  stop();
  ended = false;
  time = 0;
  state = engine.create(level);
  const house = houseSpec();
  if (state && house) state.houseLeft = house.seconds;
  paint();
  $("#readout").textContent = engine.readout?.(state) || "";
  const name = engine.levels[level];
  veil(
    entry.host + " presents",
    name,
    engine.instructions.split(/(?<=[.!?])\s+/).slice(0, 2).join(" "),
    "Start"
  );
  showHost(true);
  $("#begin").disabled = false;
  $("#pause").textContent = "Pause";
}
function start() {
  if (disposed || !engine || !state || playing) return;
  if (ended) reset();
  ended = false;
  $("#veil").hidden = true;
  playing = true;
  last = 0;
  $("#pause").textContent = "Pause";
  canvas.focus({ preventScroll: true });
  raf = requestAnimationFrame(tick);
}
function goChapter(delta) {
  menuResume = false;
  closeMenu();
  if (!engine?.levels || level + delta < 0 || level + delta >= engine.levels.length) return;
  persist();
  level += delta;
  if ($("#chapter")) $("#chapter").value = level;
  reset();
  start();
}
function goNextChapter() { goChapter(1); }
function tick(now) {
  if (!playing || disposed) return;
  try {
    if (!last) last = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    if (typeof document !== "undefined" && document.hidden) {
      raf = requestAnimationFrame(tick);
      return;
    }
    engine.update?.(state, dt, input);
    if (state.requestNext) {
      state.requestNext = false;
      goNextChapter();
      return;
    }
    const house = houseSpec();
    if (house && state && !state.result && state.phase !== "idle" && state.phase !== "result") {
      if (state.houseLeft == null) state.houseLeft = house.seconds;
      state.houseLeft -= dt;
      if (state.houseLeft <= 0) {
        state.houseLeft = 0;
        state.result = { title: house.title, detail: house.detail, won: false };
      }
    }
    if (now - paintAt > 1000 / 30) {
      paintAt = now;
      paint();
    }
    const text = engine.readout?.(state) || "";
    if ($("#readout").textContent !== text) $("#readout").textContent = text;
    if (state.result) {
      persist();
      ended = true;
      stop();
      paint();
      const r = state.result;
      const won = r.won !== false;
      veil(
        won ? "Chapter complete" : (engine.loseTitle || "Not this time"),
        r.title,
        r.detail,
        won
          ? (level < engine.levels.length - 1 ? "Next chapter" : "Play chapter again")
          : (engine.retryButton || "Try this chapter again"),
        r.prizeArt || null
      );
      showHost(true);
      return;
    }
    raf = requestAnimationFrame(tick);
  } catch (e) {
    error(e);
  }
}
function point(e) {
  const b = canvas.getBoundingClientRect();
  return {
    x: clamp((e.clientX - b.left) / b.width * 900, 0, 900),
    y: clamp((e.clientY - b.top) / b.height * 1200, 0, 1200),
  };
}
function move(e, type) {
  if (!playing) return;
  const p = point(e);
  input.pointer = p;
  if (type === "down") {
    input.down = true;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  }
  if (type === "up" || type === "cancel") input.down = false;
  engine.pointer?.(state, type, p, input);
  paint();
}
function dispose() {
  if (disposed) return;
  persist();
  disposed = true;
  stop();
  observer?.disconnect();
  abort.abort();
  engine?.dispose?.(state);
  draw?.dispose();
  $("#backdrop").removeAttribute("src");
}
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Missing art: " + src));
    img.src = src;
  });
}

listen($("#menu-toggle"), "click", () => {
  if (document.body.classList.contains("menu-open")) {
    closeMenu();
    return;
  }
  menuResume = playing;
  pause();
  document.body.classList.add("menu-open");
  $("#menu-toggle").setAttribute("aria-expanded", "true");
  $("#menu-close").focus();
});
listen($("#menu-close"), "click", closeMenu);

try {
  if (!entry?.ready) throw Error("Choose an available game from the catalogue.");
  engine = (await import(entry.module+"?v=fortune-polish-1")).default;
  level = engine.selectedChapter?.() || 0;
  document.title = engine.title + " · Penny Fever";
  $("#title").textContent = engine.title;
  $("#host").textContent = entry.host + "’s paper world";
  $("#compact-title").textContent = engine.title;
  if (id === 'fortune') {
    document.body.classList.add('fortune-game');
    if (embedded) { back.remove(); $('#compact-title').remove(); }
    const treasures=document.createElement('button');treasures.textContent='Treasures';treasures.id='treasures';
    listen(treasures,'click',()=>{persist();pause();tellRoom('treasures');});
    const bar=document.querySelector('.game-menu-bar');
    if (embedded) bar.insertBefore(treasures,$('#menu-toggle'));
    const chapterNav=document.createElement('div');chapterNav.className='chapter-nav';
    chapterNav.setAttribute('role','group');chapterNav.setAttribute('aria-label','Choose chapter');
    const prev=document.createElement('button');prev.id='previous-chapter';prev.textContent='‹';prev.setAttribute('aria-label','Previous chapter');
    listen(prev,'click',()=>goChapter(-1));
    const position=document.createElement('span');position.id='chapter-position';position.setAttribute('aria-live','polite');
    $('#next-chapter').setAttribute('aria-label','Next chapter');
    chapterNav.append(prev,position,$('#next-chapter'));bar.insertBefore(chapterNav,$('#menu-toggle'));
    $('#menu-toggle').textContent='Help';
    $('#menu-close').textContent='× Close help';
  }
  $("#intro").textContent = engine.intro;
  $("#mode-note").textContent = engine.modeNote || "First play is practice and keeps nothing. Paid play uses your alley purse. Standalone practice has a separate purse.";
  $("#instructions").textContent = engine.instructions;
  canvas.setAttribute("aria-label", engine.title + ". " + engine.instructions);

  const next = null;
  if (next) {
    $("#next").textContent = "Next: " + next.host + " — " + next.title + " →";
    $("#next").href = "play.html?stall=" + next.id;
  } else {
    $("#next").textContent = "Back to the alley →";
    $("#next").href = "./";
  }

  engine.levels.forEach((name, i) => {
    const o = document.createElement("option");
    o.value = i;
    o.textContent = (i + 1) + ". " + name;
    $("#chapter").append(o);
    $("#chapter").value = level;
  });

  draw = new Draw(canvas);
  draw.art = {};
  observer = new ResizeObserver(() => {
    const b = canvas.getBoundingClientRect();
    draw.resize(b.width, b.height, devicePixelRatio || 1);
    paint();
  });
  observer.observe(canvas);

  listen($("#chapter"), "change", () => {
    menuResume = false;
    closeMenu();
    persist();
    level = Number($("#chapter").value);
    reset();
  });
  listen($("#restart"), "click", () => {
    menuResume = false;
    closeMenu();
    persist();
    reset();
  });
  listen($("#pause"), "click", () => {
    menuResume = false;
    closeMenu();
    playing ? pause() : start();
  });
  listen($("#next-chapter"), "click", goNextChapter);
  listen($("#begin"), "click", () => {
    if (!ended) {
      start();
      return;
    }
    const won = state?.result?.won !== false;
    persist();
    if (won && level < engine.levels.length - 1) {
      level++;
      $("#chapter").value = level;
      reset();
      start();
      return;
    }
    reset();
    if (!won) start();
  });

  for (const type of ["down", "move", "up", "cancel"]) {
    listen(canvas, "pointer" + type, e => move(e, type));
  }
  listen(window, "keydown", e => {
    if (!playing || e.repeat) return;
    const tag = e.target?.tagName;
    if (tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON" || tag === "A") return;
    const k = e.key;
    const gameKey = k.length === 1 || ["Enter", "Escape", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(k);
    if (!gameKey) return;
    e.preventDefault();
    input.keys.add(k);
    if (k === "Escape") pause();
    else engine.key?.(state, k, true, input);
    paint();
  });
  listen(window, "keyup", e => {
    input.keys.delete(e.key);
    if (playing) engine.key?.(state, e.key, false, input);
  });

  if (!engine.canvasControls) {
    for (const a of engine.actions || []) {
      const b = document.createElement("button");
      b.textContent = a.label.replace(/ · (Space|Enter|Z|X)$/, "");
      b.dataset.action = a.id;
      const menuAction = a.id === "again" || a.id === "hint";
      (menuAction ? $("#menu-actions") : $("#actions")).append(b);
      listen(b, "click", () => {
        if (menuAction) {
          closeMenu();
          if (!playing) start();
        }
        if (playing) {
          engine.action?.(state, a.id, true, input);
          paint();
        }
      });
    }
    const count = $("#actions").children.length;
    $("#actions").style.setProperty("--control-columns", String(Math.min(3, Math.max(1, count))));
  } else {
    document.body.classList.add("canvas-controls");
    const dock = document.querySelector(".control-dock");
    if (dock) dock.hidden = true;
  }

  listen(document, "visibilitychange", () => {
    if (document.hidden) pause();
  });
  listen(window, "blur", pause);
  for (const link of document.querySelectorAll("a")) listen(link, "click", leave);
  listen(window, "message", e => {
    if(e.origin !== location.origin || e.source !== window.parent || e.data?.channel !== "pf-paper-world") return;
    if(e.data.type === "pause") pause();
    if(e.data.type === "resume" && !document.body.classList.contains("menu-open")) start();
    if(e.data.type === "menu") $("#menu-toggle").click();
  });
  const saveTimer = setInterval(persist, 1000);
  listen(window, "pagehide", () => clearInterval(saveTimer));
  listen(window, "pagehide", dispose);
  listen(window, "pageshow", e => { if (e.persisted) location.reload(); });

  const img = $("#backdrop");
  img.src = entry.asset;
  try { await img.decode(); } catch { throw new Error("The illustrated background could not load. Please reload."); }

  const imageMap = engine.images || {};
  const loaded = {};
  await Promise.all(Object.entries(imageMap).map(async ([key, src]) => {
    loaded[key] = await loadImage(src);
  }));
  if (!disposed) {
    draw.art = loaded;
    reset();
    tellRoom("ready");
    for (const hid of ["chapter", "pause", "restart"]) $("#" + hid).disabled = false;
    if (engine.tables) $("#restart").hidden = true;
    if (new URLSearchParams(location.search).get("auto") === "1") {
      start();
      engine.action?.(state, id === "fortune" ? "gaze" : "drop1", true, input);
      paint();
    }
  }
} catch (e) {
  error(e);
}
