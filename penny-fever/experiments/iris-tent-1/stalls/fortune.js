import {alleyPlay, pocket, spend, keep, credit, owned} from '../../../paper-games/wallet.js?v=entry-1';
import {
  IRIS_CHAPTERS, PRIZE_NAMES, makeGlobe, stepGlobe, brakeRing, nextLiveRing, allStopped, allMatch,
  caughtOf, fortuneFor, resultNumber, isIrisWin, ordinaryFor, symbolName, slotAt,
} from "../fortune-globe.js";

const BOOK = alleyPlay ? "pennyFever.irisTent1.v2" : "pf.test.iris.v2";
const TAU = Math.PI * 2;
const ART = { cx: 405, cy: 341, r: 325, w: 802, h: 1000 };
const CX = 450;
const CY = 428;
const R = 248;
const START_PENNIES = 12;
const ORDINARY_NAME = {
  "moon-penny": "Moon Penny",
  "star-token": "Star token",
  "everyday-penny": "Everyday penny",
};

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
      if (!book.practiceUsed) {
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
  brakeRing(s.globe, i);
  s.click = 1;
  beep(180 + i * 40, 0.09, "triangle", 0.1);
  if (allStopped(s.globe)) finishGaze(s);
  else s.note = "Ring " + (i + 1) + " holds. Stop the next.";
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
  const treasureOk = hit && isIrisWin(s.level, n) && !chapterOwned(s.level) && !s.practice;
  s.caught = hit;
  s.ordinary = s.practice ? null : ordinaryFor(n);
  if (alleyPlay && s.ordinary) {
    if (s.ordinary === "everyday-penny") credit(1);
    else keep(s.ordinary, "fortune");
  }
  if (treasureOk) {
    if (alleyPlay) keep(IRIS_CHAPTERS[s.level].prize, "fortune");
    markOwned(s.level);
    s.won = true;
    beep(660, 0.22, "sine", 0.08);
  } else {
    beep(hit ? 420 : 160, 0.16, hit ? "sine" : "square", 0.06);
  }
  if (!hit) {
    const slipped = s.globe.rings.map((ring, i) => ring.slipped ? "ring " + (i + 1) : null).filter(Boolean).join(" and ");
    s.note = "Near miss — " + slipped + " slipped.";
  } else if (s.practice) {
    s.note = "Practice catch. Treasure drawer locked.";
  } else if (s.won) {
    s.note = "Treasure caught.";
  } else {
    s.note = "A small keepsake.";
  }
  persist(s);
}

function tokenSize(ringCount, ringIndex) {
  if (ringCount === 1) return 96;
  if (ringCount === 2) return ringIndex === 0 ? 78 : 68;
  return [72, 60, 50][ringIndex] || 52;
}
function ringRadius(ringCount, ringIndex) {
  if (ringCount === 1) return R * 0.62;
  if (ringCount === 2) return [R * 0.72, R * 0.46][ringIndex];
  return [R * 0.76, R * 0.54, R * 0.33][ringIndex];
}

function uiButtons(s) {
  const last = s.level >= IRIS_CHAPTERS.length - 1;
  return [
    { id: "gaze", label: s.phase === "result" ? "Gaze again" : "Gaze", x: 40, y: 978, w: 400, h: 90, on: s.phase === "idle" || s.phase === "result" },
    { id: "brake", label: "Stop the ring", x: 460, y: 978, w: 400, h: 90, on: s.phase === "spin" },
    { id: "next-chapter", label: last ? "Last chapter" : "Next chapter", x: 170, y: 1084, w: 560, h: 86, on: !last },
  ];
}
function hitButton(s, p) {
  return uiButtons(s).find(b => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) || null;
}
function roundPath(c, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  if (c.roundRect) c.roundRect(x, y, w, h, rr);
  else c.rect(x, y, w, h);
}

export default {
  title: "Catch the Fortune",
  canvasControls: true,
  houseSeconds: 0,
  intro: "Iris’s fortune globe. A sign flashes. Stop each spinning ring so that sign sits in the bright glow at the top. First gaze is a Practice Penny. Later gazes cost one penny. Iris reads a fortune from the hidden 1–100 — you never see the number, and it is not the clock.",
  instructions: "Watch the flash. Tap Stop the ring (or the globe) to halt the live ring. Rings stop from the outside in. Align the remembered signs in the glow. Brake means put the brakes on the wheel — not break the glass.",
  levels: IRIS_CHAPTERS.map(c => c.title),
  images: {
    globe: "./assets/globe.webp",
    iris: "./assets/ui/iris.webp",
    slip: "./assets/ui/fortune-slip.webp",
    penny: "./assets/ui/practice-penny.webp",
    key: "./assets/symbols/key.webp",
    moon: "./assets/symbols/moon.webp",
    eye: "./assets/symbols/eye.webp",
    crown: "./assets/symbols/crown.webp",
    moth: "./assets/symbols/moth.webp",
    hand: "./assets/symbols/hand.webp",
    star: "./assets/symbols/star.webp",
    bottle: "./assets/symbols/bottle.webp",
    crescent: "./assets/symbols/crescent.webp",
    spark: "./assets/symbols/spark.webp",
    lid: "./assets/symbols/lid.webp",
    "fortune-slip": "./assets/prizes/fortune-slip.webp",
    "moon-lantern": "./assets/prizes/moon-lantern.webp",
    "moon-brooch": "./assets/prizes/moon-brooch.webp",
    "fortune-journal": "./assets/prizes/fortune-journal.webp",
    "moon-festival-fan": "./assets/prizes/moon-festival-fan.webp",
    "looking-glass-locket": "./assets/prizes/looking-glass-locket.webp",
  },
  actions: [],
  persist,
  hud(s) {
    const book = readBook();
    if (alleyPlay) book.pennies = pocket();
    const cash = s?.practice && s.phase !== "idle" ? "Practice" : (book.pennies + (book.pennies === 1 ? " penny" : " pennies"));
    const ch = IRIS_CHAPTERS[s?.level || 0];
    const keep = chapterOwned(s?.level || 0) ? "Treasure ✓" : ("Ch " + ((s?.level || 0) + 1));
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
      practice: resume ? !!saved.practice : false,
      fortune: saved.fortune || "",
      resultN: saved.resultN || 0,
      ordinary: saved.ordinary || null,
      caught: !!saved.caught,
      won: !!saved.won || chapterOwned(level),
      hold: 0, click: 0, requestNext: false,
      reduced: !!saved.reduced || reducedMotion(),
      note: resume ? (saved.note || "Stop the rings.") : "Gaze when you are ready.",
    };
    if ((s.phase === "flash" || s.phase === "spin") && !s.globe) s.globe = makeGlobe(level, s.seed);
    return s;
  },
  update(s, dt) {
    s.t += dt;
    s.click = Math.max(0, s.click - dt * 3);
    if (typeof document !== "undefined" && document.hidden) return;
    if (s.phase === "flash" || s.phase === "spin") {
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
    const btn = hitButton(s, p);
    if (btn) {
      this.action(s, btn.id);
      return;
    }
    const inGlobe = Math.hypot(p.x - CX, p.y - CY) <= R + 28;
    if (!inGlobe) return;
    if (s.phase === "idle" || s.phase === "result") beginGaze(s);
    else if (s.phase === "spin") brake(s);
  },
  action(s, id) {
    if (id === "next-chapter") {
      s.requestNext = true;
      return;
    }
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

    if (s.globe && (s.phase === "spin" || s.phase === "result" || (s.phase === "flash" && !s.globe.hide))) {
      const nRings = s.globe.rings.length;
      s.globe.rings.forEach((ring, ri) => {
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
      });
      d.text(s.globe.hide ? "REMEMBER" : "CATCH THIS", CX, CY + 96, 22, "#fff4c4");
    } else if (s.phase === "idle") {
      d.text("Gaze", CX, CY + 10, 36, "#ead6a4");
    }
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
      const plabel = chapterOwned(s.level) || s.won ? "Kept" : (s.practice ? "Locked" : PRIZE_NAMES[prizeId]);
      d.text(plabel, px, py + 78, 16, "#fff0c8");
    }
    if (s.practice && s.phase !== "idle") {
      const penny = d.art.penny;
      if (penny) d.sprite(penny, 158, 568, { w: 86, h: 86 });
      d.text("Practice", 158, 646, 16, "#f0d18f");
    }

    if (s.phase === "result" && s.fortune) {
      const hit = !!s.caught;
      roundPath(c, 70, 720, 760, 236, 18);
      c.fillStyle = "rgba(28, 18, 24, 0.94)";
      c.fill();
      c.strokeStyle = hit ? "#c8e878" : "#e09090";
      c.lineWidth = 3;
      c.stroke();
      d.text(hit ? "CAUGHT" : "NOT THIS CATCH", CX, 762, 30, hit ? "#d8f08a" : "#f0b0b0");
      d.wrap(s.fortune, CX, 808, 26, "#fff6d8", 680, 10);
      const sub = !hit
        ? s.note
        : (s.practice ? "Practice — treasure drawer locked." : (s.won ? "Chapter treasure kept." : (ORDINARY_NAME[s.ordinary] || "A small keepsake.")));
      d.text(sub, CX, 922, 18, "#d2b98c");
    } else if (s.note) {
      d.wrap(s.note, CX, 780, 24, "#fff0c8", 700, 8);
    }

    uiButtons(s).forEach(b => {
      roundPath(c, b.x, b.y, b.w, b.h, 16);
      c.fillStyle = b.on ? "#5a3a28" : "#2a2226";
      c.fill();
      c.strokeStyle = b.on ? "#f0d18f" : "#6a5a50";
      c.lineWidth = b.on ? 3 : 1.5;
      c.stroke();
      d.text(b.label, b.x + b.w / 2, b.y + b.h / 2 + 8, b.id === "next-chapter" ? 26 : 24, b.on ? "#fff6d8" : "#8a7a70");
    });
  },
  readout(s) {
    const book = readBook();
    if (alleyPlay) book.pennies = pocket();
    const purse = s.practice && s.phase !== "idle" ? "practice" : book.pennies + (book.pennies === 1 ? " penny" : " pennies");
    return purse + (s.note ? " · " + s.note : "");
  },
};
