/* attract-spin-3: hold-and-spin 4-view turnarounds on the Attract screen (SNAP stall + Felix).
   Same views and view rule as the game's papercut vendors/stalls
   (world/amusements/catalogue.js PAPERCUT_VIEWS = front,left,back,right;
   world/amusements/cutouts.js papercutViewIndex: |a|<45° front, >135° back, a>0 right, else left).
   Drag turns with momentum; eases back to front after ~2 s idle.
   A tap without drag acts like the TAP TO WAKE button. */
(() => {
  const T = "../../assets/restyle/scene-turnarounds-2026-09-09/";
  const VIEWS = ["front", "left", "back", "right"];
  const SETS = {
    stall: T + "stalls/snap/",
    felix: T + "vendors/felix/",
  };

  function viewIndex(deg) {
    const a = Math.atan2(Math.sin(deg * Math.PI / 180), Math.cos(deg * Math.PI / 180));
    return Math.abs(a) < Math.PI / 4 ? 0 : Math.abs(a) > Math.PI * 3 / 4 ? 2 : a > 0 ? 3 : 1;
  }

  function makeSpinner(card, img, root) {
    const srcs = VIEWS.map((v) => root + v + ".webp");
    const pre = srcs.map((s) => { const p = new Image(); p.src = s; return p; });
    let angle = 0, vel = 0, dragging = false, moved = 0, lastX = 0, lastT = 0, idleAt = 0, raf = 0, pid = null, shown = 0;
    function render() {
      const i = viewIndex(angle);
      if (i !== shown) { shown = i; img.src = (pre[i] && pre[i].complete && pre[i].naturalWidth) ? pre[i].src : srcs[i]; }
      // small tilt inside each quarter so the swap feels like a turn
      const local = ((angle % 90) + 135) % 90 - 45;
      img.style.setProperty("transform", `perspective(1400px) rotateY(${local * 0.6}deg)`, "important");
    }
    function tick(now) {
      raf = 0;
      if (dragging) return;
      if (Math.abs(vel) > 0.05) { angle += vel; vel *= 0.93; idleAt = now; }
      else {
        vel = 0;
        if (now - idleAt > 2000) {
          const target = Math.round(angle / 360) * 360, d = target - angle;
          if (Math.abs(d) < 0.3) { angle = 0; render(); return; }
          angle += d * 0.08;
        }
      }
      render();
      raf = requestAnimationFrame(tick);
    }
    const run = () => { if (!raf) raf = requestAnimationFrame(tick); };
    card.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      dragging = true; moved = 0; vel = 0; lastX = e.clientX; lastT = performance.now(); pid = e.pointerId;
      try { card.setPointerCapture(pid); } catch (_) {}
      card.classList.add("is-spinning");
    });
    card.addEventListener("pointermove", (e) => {
      if (!dragging || e.pointerId !== pid) return;
      const dx = e.clientX - lastX, now = performance.now();
      moved += Math.abs(dx);
      const deg = -dx * 1.4; // attract-spin-3: a short phone swipe goes all the way round
      angle += deg;
      vel = Math.max(-25, Math.min(25, deg / Math.max(1, (now - lastT) / 16.7)));
      lastX = e.clientX; lastT = now;
      render();
    });
    const end = (e) => {
      if (!dragging || e.pointerId !== pid) return;
      dragging = false; idleAt = performance.now();
      card.classList.remove("is-spinning");
      if (moved < 8 && e.type === "pointerup") {
        vel = 0;
        const wake = document.getElementById("attractWakeButton");
        if (wake) wake.click();
      }
      run();
    };
    card.addEventListener("pointerup", end);
    card.addEventListener("pointercancel", end);
  }

  function wrap(img, root, id, cls) {
    const card = document.createElement("div");
    card.className = "spin-card " + cls;
    card.id = id;
    img.parentNode.insertBefore(card, img);
    card.appendChild(img);
    img.classList.add("spin-face");
    img.draggable = false;
    makeSpinner(card, img, root);
    return card;
  }

  function init() {
    const logo = document.getElementById("attractLogo");
    if (!logo || document.getElementById("attractSpin")) return;
    const stall = wrap(logo, SETS.stall, "attractSpin", "spin-stall");
    const felix = new Image();
    felix.id = "attractFelix"; felix.alt = "Felix"; felix.decoding = "async";
    felix.src = SETS.felix + "front.webp";
    stall.parentNode.appendChild(felix);
    wrap(felix, SETS.felix, "attractFelixSpin", "spin-felix");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
