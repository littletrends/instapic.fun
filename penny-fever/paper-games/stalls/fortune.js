import {prizeAttempts, recordPrizeAttempt} from '../first-prize.js?v=keep-finish-1';
import {takeAttempt, keepOrdinaryAllowed} from '../stall-entry.js?v=keep-finish-1';
import {alleyPlay, pocket, spend, keep, credit, owned} from '../wallet.js?v=insights-1';
import {
  IRIS_CHAPTERS, PRIZE_NAMES, makeGlobe, stepGlobe, brakeRing, nextLiveRing, allStopped, allMatch,
  fortuneFor, resultNumber, isIrisWin, symbolName, slotAt, ordinaryFor,
  IRIS_WINS, clockNumber as irisClock,
} from "../fortune-globe.js?v=prize-drop-1";

const BOOK = alleyPlay ? "pennyFever.irisTent1.v2" : "pf.test.iris.v2";
const TAU = Math.PI * 2;
const ART = { cx: 405, cy: 341, r: 325, w: 802, h: 1000 };
const CX = 450;
const CY = 428;
const LOWER_CY = 1084;
const R = 248;
const START_PENNIES = 12;

function emptyBook() {
  return { v: 2, practiceUsed: false, pennies: START_PENNIES, paid: {}, sittings: {} };
}
function readBook() {
  try {
    const blob = JSON.parse(localStorage.getItem(BOOK) || "null");
    if (blob && blob.v === 2) return { ...emptyBook(), ...blob };
  } catch {}
  return emptyBook();
}
function writeBook(book) {
  try { localStorage.setItem(BOOK, JSON.stringify(book)); } catch {}
}
function chapterOwned(level) {
  return (alleyPlay && owned(IRIS_CHAPTERS[level].prize)) || !!(readBook().paid && readBook().paid[String(level)]);
}
function markOwned(level) {
  const book = readBook();
  book.paid[String(level)] = true;
  writeBook(book);
}

let audioCtx = null;
function beep(freq, dur, type, gain) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || "triangle";
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain || 0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t);
    o.stop(t + dur);
  } catch {}
}
function reducedMotion() {
  try { return !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches; } catch { return false; }
}
function persist(s) {
  if (!s) return;
  const book = readBook();
  book.selected = s.level;
  book.sittings[String(s.level)] = {
    phase: s.phase, seed: s.seed, charged: !!s.charged, practice: !!s.practice,
    flashLeft: s.flashLeft, globe: s.globe, fortune: s.fortune, resultN: s.resultN || 0,
    clock: s.clock || 0,
    won: !!s.won, caught: !!s.caught, note: s.note, reduced: !!s.reduced, ordinary: s.ordinary || null,
  };
  writeBook(book);
}

function beginGaze(s) {
  if (s.phase === "flash" || s.phase === "spin") return;
  if (s.chargeLock) return;
  s.chargeLock = true;
  try {
    const book = readBook();
    if (!s.charged) {
      if (alleyPlay) {
        if(!takeAttempt('fortune',s.level)){s.note="No pennies left in the purse — a gaze costs 1 penny. Cash a booth ticket at Aura’s for five.";return;}
        s.practice=false;
      } else if (!book.practiceUsed) {
        s.practice = true;
        book.practiceUsed = true;
        writeBook(book);
      } else {
        if (alleyPlay ? !spend(1) : book.pennies < 1) {
          s.note = "No pennies left in the purse.";
          return;
        }
        if (!alleyPlay) book.pennies -= 1;
        writeBook(book);
        s.practice = false;
      }
      s.charged = true;
      s.seed = (s.seed || (Date.now() & 0xfffffff)) + 1 + s.level * 17;
    }
    s.globe = makeGlobe(s.level, s.seed);
    s.phase = "flash";
    s.flashLeft = s.globe.flashSecs;
    s.clock = 0;
    s.fortune = "";
    s.resultN = 0;
    s.ordinary = null;
    s.hold = 0;
    s.click = 0;
    s.reduced = reducedMotion();
    const names = s.globe.flash.map(symbolName).join("  ·  ");
    s.note = s.globe.hide ? "Remember " + names : "Catch " + names;
    beep(520, 0.12, "sine", 0.05);
    persist(s);
  } finally {
    s.chargeLock = false;
  }
}

function brake(s) {
  if (s.phase !== "spin" || !s.globe) return;
  const i = nextLiveRing(s.globe);
  if (i < 0) return;
  const ring = s.globe.rings[i];
  const dir = ring && ring.speed < 0 ? -1 : 1;
  brakeRing(s.globe, i);
  // Early/late feedback: how many signs short of (early) or past (late) the target the ring stopped.
  if (ring && ring.slipped) {
    const slot = slotAt(ring.angle, ring.n);
    const ahead = (((ring.targetSlot - slot) * dir) % ring.n + ring.n) % ring.n;
    ring.miss = ahead <= ring.n / 2 ? 'early' : 'late';
    ring.missBy = ahead <= ring.n / 2 ? ahead : ring.n - ahead;
  }
  s.click = 1;
  beep(180 + i * 40, 0.09, "triangle", 0.1);
  if (allStopped(s.globe)) finishGaze(s);
  else {
    const r = s.globe.rings[i];
    s.note = r && r.miss
      ? "Ring " + (i + 1) + " stopped " + r.missBy + (r.missBy === 1 ? " sign " : " signs ") + (r.miss === "early" ? "too early" : "too late") + ". Stop the next."
      : "Ring " + (i + 1) + " holds on the sign. Stop the next.";
  }
  persist(s);
}

function finishGaze(s) {
  const n = resultNumber(s.clock || 0);
  s.resultN = n;
  s.fortune = fortuneFor(n);
  s.phase = "result";
  s.charged = false;
  s.hold = 0;
  const hit = allMatch(s.globe);
  s.caught = hit;
  let treasureOk = false;
  if (hit && !s.practice && !chapterOwned(s.level)) {
    recordPrizeAttempt("fortuneCatch", s.level);
    treasureOk = isIrisWin(s.level, n);
  }
  s.ordinary = null;
  if (!s.practice && alleyPlay) {
    if (treasureOk) {
      keep(IRIS_CHAPTERS[s.level].prize, "fortune");
      markOwned(s.level);
      s.won = true;
    } else if (hit) {
      const drop = ordinaryFor(n);
      if (keepOrdinaryAllowed(drop, s.level)) {
        s.ordinary = drop;
        if (drop === 'everyday-penny') credit(1);
        else keep(drop, 'fortune');
      }
    }
  } else if (treasureOk) {
    markOwned(s.level);
    s.won = true;
  }
  if (treasureOk) beep(660, 0.22, "sine", 0.08);
  else beep(hit ? 420 : 160, 0.16, hit ? "sine" : "square", 0.06);
  if (!hit) {
    const slipped = s.globe.rings.map((ring, i) => ring.slipped ? "ring " + (i + 1) + (ring.miss ? " " + ring.miss : "") : null).filter(Boolean).join(" and ");
    s.note = "Near miss — " + slipped + ". Every ring must hold its sign for a prize; nothing drops this gaze.";
  } else if (s.practice) {
    s.note = "All signs caught — but this was practice, so nothing is kept.";
  } else if (treasureOk) {
    s.note = "Bonus collected.";
  } else if (chapterOwned(s.level)) {
    s.note = s.ordinary
      ? (s.ordinary === 'everyday-penny' ? 'A penny back to the purse. ' : 'Token collected. ') + "Bonus already collected."
      : "Bonus already collected.";
  } else if (s.ordinary === 'everyday-penny') {
    s.note = "All signs caught. A penny returns to the purse. The glass read " + n + ", not this chapter’s prize second, so the bonus stays locked.";
  } else if (s.ordinary) {
    s.note = "All signs caught — token collected. The glass read " + n + ", not this chapter’s prize second, so the bonus stays locked.";
  } else {
    s.note = "All signs caught. The glass read " + n + ", not this chapter’s prize second, so the bonus stays Locked. Try again.";
  }
  persist(s);
}

function tokenSize(ringCount, ringIndex) {
  if (ringCount === 1) return 96;
  if (ringCount === 2) return ringIndex === 0 ? 78 : 68;
  return [60, 48, 40][ringIndex] || 52;
}
function ringRadius(ringCount, ringIndex) {
  if (ringCount === 1) return R * 0.62;
  if (ringCount === 2) return [R * 0.72, R * 0.46][ringIndex];
  return [R * 0.84, R * 0.63, R * 0.43][ringIndex];
}

function drawPlayControl(s, d, y) {
  if (s.phase === 'flash' || s.phase === 'result') return;
  const c=d.c, accent=['#edce88','#a8d7db','#ddb2ef','#a9c8f0','#e9adbd','#e7df9a'][s.level];
  d.circle(CX,y,76,'#24152eee',accent,3);
  c.save();c.textAlign='center';c.fillStyle=accent;c.font='600 23px Georgia,serif';
  c.fillText(s.phase==='spin'?'STOP':'TAP',CX,y-21);
  c.font='600 32px Georgia,serif';
  const ring=nextLiveRing(s.globe || s.preview)+1;
  c.fillText(s.phase==='spin'?(['1st','2nd','3rd'][ring-1]+' Ring'):'GAZE',CX,y+18);
  c.restore();
}

export default {
  title: "Catch the Fortune",
  canvasControls: true,
  houseSeconds: 0,
  winningSeconds: level => (IRIS_WINS[level] || IRIS_WINS[0]).slice(),
  prizeClock(s) {
    if (!s || s.phase === 'result' || s.phase === 'idle') return null;
    const n = irisClock(s.clock || 0);
    return {n, total: 100, lit: isIrisWin(s.level, n)};
  },
  intro: "Iris’s fortune globe. A sign flashes — remember it. Stop each spinning ring so its sign sits in the bright glow at the top. The clock lights on this chapter’s prize seconds — a clean catch while it is lit collects the bonus.",
  instructions: "Tap the centre of the globe (or Space/Enter) to gaze. Remember the signs, then tap the globe again to stop each ring in the glow, outside ring first. The badge shows Locked until a catch collects this chapter’s bonus, then Collected.",
  levels: IRIS_CHAPTERS.map(c => c.title),
  prizes: IRIS_CHAPTERS.map(c => c.prize),
  images: {
    globe: "./assets/fortune/globe.webp",
    host: "../assets/restyle/scene-turnarounds-2026-09-09/vendors/iris/front.webp",
    slip: "./assets/fortune/ui/fortune-slip.webp",
    penny: "./assets/fortune/ui/practice-penny.webp",
    key: "./assets/fortune/symbols/key.webp",
    moon: "./assets/fortune/symbols/moon.webp",
    eye: "./assets/fortune/symbols/eye.webp",
    crown: "./assets/fortune/symbols/crown.webp",
    moth: "./assets/fortune/symbols/moth.webp",
    hand: "./assets/fortune/symbols/hand.webp",
    star: "./assets/fortune/symbols/star.webp",
    bottle: "./assets/fortune/symbols/bottle.webp",
    crescent: "./assets/fortune/symbols/crescent.webp",
    spark: "./assets/fortune/symbols/spark.webp",
    lid: "./assets/fortune/symbols/lid.webp",
    "fortune-slip": "./assets/fortune/prizes/fortune-slip.webp",
    "moon-lantern": "./assets/fortune/prizes/moon-lantern.webp",
    "moon-brooch": "./assets/fortune/prizes/moon-brooch.webp",
    "fortune-journal": "./assets/fortune/prizes/fortune-journal.webp",
    "moon-festival-fan": "./assets/fortune/prizes/moon-festival-fan.webp",
    "paper-crown": "./assets/fortune/prizes/paper-crown.webp",
  },
  actions: [],
  persist,
  hud(s) {
    const book = readBook();
    if (alleyPlay) book.pennies = pocket();
    const cash = s?.practice && s.phase !== "idle" ? "Practice" : (book.pennies + (book.pennies === 1 ? " penny" : " pennies"));
    const ch = IRIS_CHAPTERS[s?.level || 0];
    const keep = chapterOwned(s?.level || 0) ? "Bonus Collected" : ("Ch " + ((s?.level || 0) + 1));
    return { cash, keep: keep + " · " + ch.title };
  },
  selectedChapter() { return Math.max(0, Math.min(5, Number(readBook().selected) || 0)); },
  create(level) {
    const saved = readBook().sittings[String(level)] || {};
    const resume = saved.phase === "flash" || saved.phase === "spin";
    const s = {
      level, t: 0,
      phase: ["flash", "spin", "result"].includes(saved.phase) ? saved.phase : "idle",
      seed: saved.seed || (level + 1) * 4099,
      globe: saved.globe || null,
      flashLeft: resume ? (saved.flashLeft || 0) : 0,
      clock: resume ? (saved.clock || 0) : 0,
      charged: resume ? !!saved.charged : false,
      practice: alleyPlay ? false : !!saved.practice,
      fortune: saved.fortune || "",
      resultN: saved.resultN || 0,
      ordinary: saved.ordinary || null,
      caught: !!saved.caught,
      won: !!saved.won || chapterOwned(level),
      hold: 0, click: 0,
      reduced: !!saved.reduced || reducedMotion(),
      note: String(saved.note || "").replace(/Unlocked/g, "Collected").replace(/unlocked/g, "collected") || (resume ? "Stop the rings." : "Gaze when you are ready."),
    };
    if ((s.phase === "flash" || s.phase === "spin") && !s.globe) s.globe = makeGlobe(level, s.seed);
    s.preview = makeGlobe(level, s.seed);
    return s;
  },
  update(s, dt) {
    s.t += dt;
    s.click = Math.max(0, s.click - dt * 3);
    if (typeof document !== "undefined" && document.hidden) return;
    if (s.phase === "spin") {
      s.clock = Math.min(100, (s.clock || 0) + dt);
      if (s.clock >= 100) {
        s.clock = 100;
        if (s.globe) {
          while (nextLiveRing(s.globe) >= 0) {
            const i = nextLiveRing(s.globe);
            brakeRing(s.globe, i);
            s.globe.rings[i].slipped = true;
          }
          finishGaze(s);
        }
        return;
      }
    }
    if (s.phase === "flash") {
      s.flashLeft -= dt;
      if (s.flashLeft <= 0) {
        s.phase = "spin";
        s.note = "Stop the ring when the sign is in the glow.";
        persist(s);
      }
    }
    if (s.phase === "spin" && s.globe) stepGlobe(s.globe, dt, s.reduced);
  },
  pointer(s, type, p) {
    if (type !== "down") return;
    // Chapter results and retries belong to the shared player.
    if (s.phase === 'result') return;
    const inGlobe = Math.hypot(p.x - CX, p.y - CY) <= 82 || Math.hypot(p.x - CX, p.y - LOWER_CY) <= 82;
    if (!inGlobe) {
      // Missed taps get a reason instead of silence.
      if (s.phase === "idle" || s.phase === "spin") s.note = s.phase === "spin" ? "Tap the globe to stop the ring." : "Tap the globe to gaze.";
      return;
    }
    if (s.phase === "idle" || s.phase === "result") beginGaze(s);
    else if (s.phase === "spin") brake(s);
  },
  action(s, id) {
    if (id === "gaze") {
      if (s.phase === "result") {
        s.phase = "idle";
        s.fortune = "";
        s.note = "Gaze when you are ready.";
      }
      beginGaze(s);
    }
    if (id === "brake") brake(s);
  },
  key(s, k, down) {
    if (!down) return;
    if (k === " " || k === "Enter") {
      if (s.phase === "spin") brake(s);
      else this.action(s, "gaze");
    }
  },
  draw(s, d) {
    const c = d.c;
    const ch = IRIS_CHAPTERS[s.level];
    const globeImg = d.art.globe;
    if (globeImg) {
      const scale = R / ART.r;
      c.drawImage(globeImg, CX - ART.cx * scale, CY - ART.cy * scale, ART.w * scale, ART.h * scale);
    } else {
      d.circle(CX, CY, R + 8, "#1a1024", "#e8c878", 6);
    }

    const accents=['#edce88','#a8d7db','#ddb2ef','#a9c8f0','#e9adbd','#e7df9a'];
    c.save();c.strokeStyle=accents[s.level];c.lineWidth=2;c.globalAlpha=.75;
    const petals=6+s.level*2;
    for(let i=0;i<petals;i++){
      const a=i*TAU/petals;c.beginPath();
      c.moveTo(CX+Math.cos(a)*(R+5),CY+Math.sin(a)*(R+5));
      c.lineTo(CX+Math.cos(a+.045)*(R+16),CY+Math.sin(a+.045)*(R+16));
      c.lineTo(CX+Math.cos(a+.09)*(R+5),CY+Math.sin(a+.09)*(R+5));c.stroke();
    }
    c.restore();
    // Catch glow at 12 o'clock — a bright notch, not a letterbox.
    const pulse = 0.55 + 0.45 * Math.sin(s.t * 3.4);
    d.glow(CX, CY - R + 8, 90 + pulse * 18, "#ffe7a0");
    c.save();
    c.beginPath();
    c.arc(CX, CY, R - 8, -Math.PI / 2 - 0.38, -Math.PI / 2 + 0.38);
    c.strokeStyle = `rgba(255, 236, 160, ${0.55 + pulse * 0.4})`;
    c.lineWidth = 14;
    c.stroke();
    c.beginPath();
    c.arc(CX, CY, R - 8, -Math.PI / 2 - 0.22, -Math.PI / 2 + 0.22);
    c.strokeStyle = "#fff6c8";
    c.lineWidth = 6;
    c.stroke();
    c.restore();

    c.save();
    c.beginPath();
    c.arc(CX, CY, R - 12, 0, TAU);
    c.clip();

    const visibleGlobe = s.globe || s.preview;
    if (visibleGlobe && s.phase !== 'flash') {
      const nRings = visibleGlobe.rings.length;
      visibleGlobe.rings.forEach((ring, ri) => {
        const rad = ringRadius(nRings, ri);
        c.beginPath();
        c.arc(CX, CY, rad, 0, TAU);
        c.strokeStyle = ring.stopped ? (ring.slipped ? "#e09090" : "#d8f08a") : "rgba(255, 220, 140, 0.7)";
        c.lineWidth = ring.stopped ? 6 : 3;
        c.stroke();
        const size = tokenSize(nRings, ri);
        ring.glyphs.forEach((id, i) => {
          const a = ring.angle + (i / ring.n) * TAU - Math.PI / 2;
          const x = CX + Math.cos(a) * rad;
          const y = CY + Math.sin(a) * rad;
          const inWindow = slotAt(ring.angle, ring.n) === i;
          const img = d.art[id];
          const grow = inWindow ? 1.5 : 1;
          if (inWindow) {
            d.glow(x, y, size * 1.35, ring.slipped && ring.stopped ? "#e09090" : "#fff1b0");
            d.circle(x, y, size * 0.62, null, "#fff6c8", 5);
          }
          if (img) d.sprite(img, x, y, { w: size * grow, h: size * grow, alpha: inWindow ? 1 : 0.5 });
          else d.circle(x, y, size * 0.4, "#cbb890");
        });
      });
    }

    if (s.globe && s.phase === "flash") {
      c.fillStyle = "rgba(10, 6, 16, 0.55)";
      c.fillRect(CX - R, CY - R, R * 2, R * 2);
      const ids = s.globe.flash;
      const gap = 120;
      const start = CX - ((ids.length - 1) * gap) / 2;
      ids.forEach((id, i) => {
        const img = d.art[id];
        const x = start + i * gap;
        d.glow(x, CY, 110, "#ffe7a0");
        if (img) d.sprite(img, x, CY, { w: 128, h: 128 });
        else d.circle(x, CY, 46, "#cbb890", "#fff6c8", 4);
        d.text(symbolName(id), x, CY + 78, 20, "#fff6c8");
      });
      d.text(s.globe.hide ? "REMEMBER" : "CATCH THIS", CX, CY + 112, 22, "#fff4c4");
    }
    drawPlayControl(s, d, CY);
    c.restore();

    if (s.click > 0) {
      c.save();
      c.globalAlpha = s.click;
      c.beginPath();
      c.arc(CX, CY, R - 6, 0, TAU);
      c.strokeStyle = "#fff4c8";
      c.lineWidth = 5;
      c.stroke();
      c.restore();
    }

    const prizeId = ch.prize;
    const prizeImg = d.art[prizeId];
    if (prizeImg) {
      const px = 742, py = 568;
      c.save();
      c.globalAlpha = chapterOwned(s.level) || s.won ? 1 : (s.practice ? 0.45 : 0.95);
      d.glow(px, py, 70, s.won ? "#c8e878" : "#e8c878");
      d.sprite(prizeImg, px, py, { w: 118, h: 118 });
      c.restore();
      const plabel = chapterOwned(s.level) || s.won ? "Collected" : "Locked";
      d.text(plabel, px, py + 78, 16, "#fff0c8");
    }
    if (s.practice && s.phase !== "idle") {
      const penny = d.art.penny;
      if (penny) d.sprite(penny, 158, 568, { w: 86, h: 86 });
      d.text("Practice", 158, 646, 16, "#f0d18f");
    }

    // The shared result panel displays the reading and collection status.
    if (s.note && s.phase !== "idle" && s.phase !== "result") {
      d.wrap(s.note, CX, 780, 24, "#fff0c8", 700, 8);
    }
    drawPlayControl(s, d, LOWER_CY);

  },
  readout(s) {
    const book = readBook();
    if (alleyPlay) book.pennies = pocket();
    const purse = s.practice && s.phase !== "idle" ? "practice" : book.pennies + (book.pennies === 1 ? " penny" : " pennies");
    return purse + (s.note ? " · " + s.note : "");
  },
};
