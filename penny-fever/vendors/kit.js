/* Shared canvas bits for alley vendor stalls. Not a tent. */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF) return;

  let audioCtx = null;

  function ac() {
    if (audioCtx) return audioCtx;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
    return audioCtx;
  }

  PF.kit = {
    canvasPos(canvas, ev, W, H) {
      const r = canvas.getBoundingClientRect();
      const t = (ev.touches && ev.touches[0]) || (ev.changedTouches && ev.changedTouches[0]) || ev;
      return {
        x: ((t.clientX - r.left) / Math.max(1, r.width)) * W,
        y: ((t.clientY - r.top) / Math.max(1, r.height)) * H,
      };
    },
    prepCtx(canvas, W, H) {
      if (!canvas) return null;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const needW = Math.round(W * dpr);
      const needH = Math.round(H * dpr);
      if (canvas.width !== needW || canvas.height !== needH) {
        canvas.width = needW;
        canvas.height = needH;
      }
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return ctx;
    },
    fillWood(ctx, x, y, w, h) {
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "rgba(212,164,90,0.08)";
      for (let i = 0; i < w; i += 18) ctx.fillRect(x + i, y, 2, h);
    },
    drawHud(ctx, W, lines) {
      ctx.fillStyle = "rgba(12,6,9,0.62)";
      ctx.fillRect(8, 8, W - 16, 22 + lines.length * 16);
      ctx.strokeStyle = "rgba(212,164,90,0.35)";
      ctx.strokeRect(8.5, 8.5, W - 17, 21 + lines.length * 16);
      ctx.fillStyle = "#f0d09a";
      ctx.font = "12px Georgia, serif";
      lines.forEach((line, i) => ctx.fillText(line, 16, 26 + i * 16));
    },
    clamp(n, a, b) {
      return Math.max(a, Math.min(b, n));
    },
    lerp(a, b, t) {
      return a + (b - a) * t;
    },
    setMode(card, mode) {
      if (!card) return;
      const next = mode || "vestibule";
      card.dataset.mode = next;
      card.classList.toggle("is-playing", next === "play");
      card.classList.toggle("is-result", next === "result");
      card.classList.toggle("is-vestibule", next === "vestibule");
      if (next === "play") {
        const stage = card.querySelector(".vendor-stage");
        if (stage && stage.scrollIntoView) {
          stage.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }
    },
    copyText(text, onOk, onFail) {
      const done = () => { if (onOk) onOk(); };
      const fail = () => { if (onFail) onFail(text); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(fail);
      } else {
        fail();
      }
    },
    persistRun(state, game, result) {
      if (!state || !result) return;
      state.bestDepth = state.bestDepth || {};
      const depth = result.depth || 0;
      const score = result.score || 0;
      state.bestDepth[game] = Math.max(state.bestDepth[game] || 0, depth);
      state.lastRun = {
        game,
        depth,
        score,
        deathReason: result.deathReason || "",
        cashedOut: !!result.cashedOut,
        at: Date.now(),
      };
      if (PF.runKit && typeof PF.runKit.recordResult === "function") {
        try {
          PF.runKit.recordResult({
            gameId: game,
            depth,
            score,
            deathReason: result.deathReason || "",
            cashedOut: !!result.cashedOut,
            meta: result.meta || {},
          });
        } catch (_) {}
      }
    },
    applyShake(ctx, shake) {
      if (!shake) return 0;
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      return shake * 0.82;
    },
    stampClosed(ctx, W, H, label) {
      ctx.save();
      ctx.translate(W / 2, H * 0.46);
      ctx.rotate(-0.18);
      ctx.strokeStyle = "rgba(196,30,58,0.92)";
      ctx.fillStyle = "rgba(196,30,58,0.12)";
      ctx.lineWidth = 6;
      const w = 188;
      const h = 64;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = "rgba(196,30,58,0.95)";
      ctx.font = "bold 28px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label || "CLOSED", 0, -2);
      ctx.restore();
    },
    sfx(name) {
      const ctx = ac();
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      const table = {
        throw: [190, 86, 0.07, "square"],
        sink: [540, 240, 0.09, "sine"],
        spit: [160, 64, 0.11, "sawtooth"],
        miss: [120, 52, 0.13, "triangle"],
        stamp: [88, 36, 0.16, "square"],
        rack: [420, 680, 0.14, "sine"],
        drop: [640, 280, 0.05, "sine"],
        tray: [880, 420, 0.08, "sine"],
        pit: [72, 38, 0.11, "sawtooth"],
        cash: [440, 880, 0.18, "sine"],
        bury: [56, 28, 0.22, "triangle"],
        shove: [90, 70, 0.06, "square"],
        flip: [210, 130, 0.035, "square"],
        bumper: [320, 170, 0.055, "square"],
        sling: [240, 110, 0.05, "square"],
        spinner: [720, 980, 0.03, "sine"],
        sinkhole: [180, 90, 0.1, "triangle"],
        drain: [96, 38, 0.26, "sawtooth"],
        chapter: [392, 784, 0.2, "sine"],
      };
      const spec = table[name] || table.throw;
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = spec[3];
      osc.frequency.setValueAtTime(spec[0], t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, spec[1]), t0 + spec[2]);
      gain.gain.setValueAtTime(0.05, t0);
      gain.gain.exponentialRampToValueAtTime(0.0008, t0 + spec[2] + 0.02);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + spec[2] + 0.03);
    },
    fillResult(ids, data) {
      const root = PF.$(ids.root);
      if (root) {
        root.hidden = false;
        if (root.scrollIntoView) root.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
      const depth = PF.$(ids.depth);
      if (depth) depth.textContent = data.depthLine || "";
      const score = PF.$(ids.score);
      if (score) score.textContent = data.scoreLine || "";
      const aura = PF.$(ids.aura);
      if (aura) aura.textContent = data.auraLine || "";
      const copied = PF.$(ids.copied);
      if (copied) copied.hidden = true;
    },
    hideResult(id) {
      const el = PF.$(id);
      if (el) el.hidden = true;
    },
    restyleInterior(scene) {
      const R = window.PennyFeverRestyle;
      if (R && typeof R.restyleVendorScene === "function") R.restyleVendorScene(scene);
    },
  };

  const origReg = PF.registerVendor;
  if (typeof origReg === "function" && !origReg._pfInteriorWrap) {
    PF.registerVendor = function wrapInterior(mod) {
      if (mod && typeof mod.onShow === "function" && !mod._pfInteriorShow) {
        const show = mod.onShow;
        mod.onShow = function pfInteriorShow() {
          const out = show.apply(this, arguments);
          requestAnimationFrame(() => {
            document.querySelectorAll("#cabinet-" + mod.id + " canvas").forEach((cv) => {
              const scene = cv.__pfScene;
              if (scene && PF.kit.restyleInterior) PF.kit.restyleInterior(scene);
            });
          });
          return out;
        };
        mod._pfInteriorShow = true;
      }
      return origReg.call(PF, mod);
    };
    PF.registerVendor._pfInteriorWrap = true;
  }
})();
