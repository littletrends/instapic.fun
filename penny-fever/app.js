(() => {
  "use strict";

  const STORAGE_KEY = "pennyFever.restyle.v1";
  const TZ = "Australia/Darwin";

  const ALLEY = [
    { id: "ticket_stub", name: "Ticket stub", glyph: "🎟", tip: "Draw One Fortune" },
    { id: "pressed_heart", name: "Pressed heart", glyph: "♥", tip: "Mint a Pressed Penny Pack" },
    { id: "lucky_match", name: "Lucky match", glyph: "✧", tip: "Fortune with a friend vibe" },
    { id: "whisper_charm", name: "Whisper charm", glyph: "🗨", tip: "Whisper Charm booth" },
    { id: "mirror_shard", name: "Mirror shard", glyph: "◈", tip: "Fortune (curious catch-all)" },
    { id: "showman_ribbon", name: "Showman ribbon", glyph: "🎀", tip: "Demo Showman’s Pass" },
  ];
  const GUTS = [
    { id: "mercury_bead", name: "Mercury bead", glyph: "●", tip: "Love Thermometer · Sweet Heat" },
    { id: "gyro_ghost", name: "Gyro ghost", glyph: "↑", tip: "Look Up, Darling" },
    { id: "shutter_click", name: "Shutter click", glyph: "◎", tip: "SNAP! Freeze" },
    { id: "sweet_heat", name: "Sweet heat", glyph: "♨", tip: "Love Thermometer" },
    { id: "coin_slot", name: "Coin slot", glyph: "⚬", tip: "Showman’s Pass (demo)" },
    { id: "marquee_bulb", name: "Marquee bulb", glyph: "✦", tip: "Fortune · teal / alone" },
  ];

  const FORTUNES = [
    {
      when: (m, c, co) => m === "sparkly" || c === "pink",
      text: "Tonight the booth finds you before you find it.",
      stub: "Alley: ticket stub with glitter at the edges.",
      curio: "ticket_stub",
      shelf: "alley",
    },
    {
      when: (m, c, co) => m === "chaotic" || co === "crowd",
      text: "A silly pose will outlive your careful one.",
      stub: "Machine guts: a shutter click saved mid-laugh.",
      curio: "shutter_click",
      shelf: "guts",
    },
    {
      when: (m, c, co) => m === "soft" || c === "violet",
      text: "Someone soft is watching your reflection kindly.",
      stub: "Alley: a pressed heart still warm.",
      curio: "pressed_heart",
      shelf: "alley",
    },
    {
      when: (m, c, co) => m === "brave" || c === "gold",
      text: "Courage looks good under marquee lights.",
      stub: "Alley: a lucky match that refuses to go out.",
      curio: "lucky_match",
      shelf: "alley",
    },
    {
      when: (m, c, co) => c === "teal" || co === "alone",
      text: "Alone & fabulous is a full party of one.",
      stub: "Machine guts: a marquee bulb humming your name.",
      curio: "marquee_bulb",
      shelf: "guts",
    },
    {
      when: (m, c, co) => co === "friend" || c === "pink",
      text: "A double pose is brewing. Save room on the strip.",
      stub: "Alley: a lucky match shared end to end.",
      curio: "lucky_match",
      shelf: "alley",
    },
    {
      when: (m, c, co) => co === "secret" || m === "soft",
      text: "The secret stays between you and the glass.",
      stub: "Machine guts: sweet heat sealed in a vial.",
      curio: "sweet_heat",
      shelf: "guts",
    },
    {
      when: (m) => m === "sparkly",
      text: "Glitter is a legitimate life strategy tonight.",
      stub: "Alley: ticket stub with glitter at the edges.",
      curio: "ticket_stub",
      shelf: "alley",
    },
    {
      when: () => true,
      text: "The midway keeps a lantern warm for the curious.",
      stub: "Alley: a mirror shard catching Darwin dusk.",
      curio: "mirror_shard",
      shelf: "alley",
    },
  ];

  const CHARM_LINES = [
    (w) => `I pinned “${w}” to a velvet ribbon. Wear it invisibly.`,
    (w) => `Charm sealed: ${w}. It only works if you mean it.`,
    (w) => `The Cabinet whispers ${w} back at you later.`,
    (w) => `"${w}" — stamped in brass, filed under delightful.`,
  ];


  const PENNY_FACES = [
    "Aura crown",
    "Sweet Heat",
    "Look ↑",
    "SNAP!",
    "Aura’s crown",
    "Darwin dusk",
    "Whisper",
    "Marquee",
    "Pressed ♥",
    "Coin slot",
  ];

  const CHALK = [
    "Try One Fortune. Leave with a stub.",
    "Love Heat Run: miss the pink band and you die.",
    "Look up, darling — the sky is a button.",
    "SNAP on the word, not the nerves.",
    "Whisper one kind word into the booth.",
    "Incomplete shelves itch. Feed them.",
    "Streaks pay better. Don’t break the night.",
    "You cannot finish Love — only die deeper than last time.",
    "Knock the door properly — she peeks.",
  ];

  function darwinDay() {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const s = JSON.parse(raw);
      const d = defaultState();
      return {
        ...d,
        ...s,
        curios: { ...d.curios, ...(s.curios || {}) },
        plays: { ...d.plays, ...(s.plays || {}) },
        bestDepth: { ...d.bestDepth, ...(s.bestDepth || {}) },
        lastRun: mergeLastRun(d.lastRun, s.lastRun),
      };
    } catch {
      return defaultState();
    }
  }

  function defaultState() {
    return {
      fortuneDay: null,
      lastFortune: null,
      curios: {},
      demoCoins: 3,
      playTickets: 3,
      admitTicket: false,
      admitPassed: false,
      alleyLaps: 0,
      showmanPass: false,
      passDay: null,
      plays: { love: 0, lookup: 0, snap: 0, whisper: 0, marquee: 0 },
      packDay: null,
      lastPack: null,
      feverScore: 0,
      streak: 0,
      bestStreak: 0,
      loveStreak: 0,
      loveBest: 0,
      bestDepth: { love: 0 },
      lastRun: {},
      feverStars: 0,
      snapStreak: 0,
      scoreDay: null,
      _alleyBonus: false,
      _gutsBonus: false,
      _doubleExposure: false,
      charms: [],
      guestDoll: null,
    };
  }

  function mergeLastRun(base, incoming) {
    const out = Object.assign({}, base && typeof base === "object" ? base : {});
    if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) return out;
    Object.keys(incoming).forEach((k) => {
      const v = incoming[k];
      if (v && typeof v === "object" && !Array.isArray(v) && (v.depth != null || v.gameId || v.deathReason)) {
        out[k] = v;
      }
    });
    const gid = incoming.gameId || incoming.game;
    if (gid && incoming.depth != null && !out[gid]) out[gid] = incoming;
    return out;
  }

  function stashLastRun(gameId, result) {
    state.lastRun = mergeLastRun({}, state.lastRun);
    state.lastRun[gameId] = result;
    state.lastRun.game = gameId;
    state.lastRun.gameId = gameId;
    state.lastRun.depth = result.depth;
    state.lastRun.score = result.score;
    state.lastRun.deathReason = result.deathReason;
    state.lastRun.cashedOut = !!result.cashedOut;
    state.lastRun.at = result.at;
  }

  function saveState(s) {
    window.PennyFeverInventoryModel?.reconcile(s);
    let persisted = true;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
    catch { persisted = false; }
    window.PennyFeverSavePersisted = persisted;
    window.dispatchEvent(new CustomEvent("pennyfever:statechange", { detail: { persisted } }));
    return persisted;
  }

  let state = loadState();
  if (window.PennyFeverInventoryModel?.reconcile(state)) saveState(state);
  if (!state._coinEconomyV1) {
    state.demoCoins = 3;
    state._coinEconomyV1 = true;
    state._cashedPlays = 0;
    saveState(state);
  }
  if (!state._ticketEconomyV1) {
    if (state.playTickets == null) state.playTickets = 3;
    state._ticketEconomyV1 = true;
    saveState(state);
  }

  const $ = (id) => document.getElementById(id);

  /* Thin vendor register — stall loops live in vendors/*.js */
  const vendorMods = [];
  let coreBound = false;
  let activeVendorId = "";
  const roomCleanups = new Map();

  function eachVendor(fn) {
    vendorMods.forEach((mod) => {
      try { fn(mod); } catch (err) { console.warn("vendor", mod && mod.id, err); }
    });
  }

  function applyVendorDefaults(mod) {
    if (!mod) return;
    if (mod.playKey) {
      state.plays = state.plays || {};
      if (state.plays[mod.playKey] == null) state.plays[mod.playKey] = 0;
    }
    if (mod.defaults) {
      Object.keys(mod.defaults).forEach((k) => {
        if (state[k] === undefined) state[k] = mod.defaults[k];
      });
    }
  }

  function registerVendor(mod) {
    if (!mod || !mod.id) return;
    const existing = vendorMods.findIndex((v) => v.id === mod.id);
    if (existing >= 0) vendorMods.splice(existing, 1);
    vendorMods.push(mod);
    applyVendorDefaults(mod);
    if (mod.chalk && CHALK.indexOf(mod.chalk) === -1) CHALK.push(mod.chalk);
    if (coreBound && typeof mod.bind === "function") mod.bind();
    if (coreBound && typeof mod.onShow === "function") {
      const hash = (location.hash || "").replace(/^#/, "");
      if (hash === "cabinet/" + mod.id || hash.startsWith("cabinet/" + mod.id + "/")) {
        activeVendorId = mod.id;
        mod.onShow();
      }
    }
  }

  function addRoomCleanup(slug, cleanup) {
    if (!slug || typeof cleanup !== "function") return () => {};
    const set = roomCleanups.get(slug) || new Set();
    set.add(cleanup);
    roomCleanups.set(slug, set);
    return () => set.delete(cleanup);
  }

  function closeActiveRoom(nextSlug = "") {
    if (!activeVendorId || activeVendorId === nextSlug) return;
    const closing = activeVendorId;
    const room = $("cabinet-" + closing);
    if (room) room.dispatchEvent(new CustomEvent("pennyfever:roomleave", { detail: { next: nextSlug } }));
    const mod = vendorMods.find((item) => item.id === closing);
    if (mod && typeof mod.onLeave === "function") {
      try { mod.onLeave(); } catch (err) { console.warn("vendor close", closing, err); }
    }
    const cleanups = roomCleanups.get(closing);
    if (cleanups) {
      [...cleanups].forEach((cleanup) => {
        try { cleanup(); } catch (err) { console.warn("room cleanup", closing, err); }
      });
      cleanups.clear();
    }
    if (room) {
      room.querySelectorAll("audio, video").forEach((media) => {
        try { media.pause(); } catch (_) { /* already stopped */ }
      });
      room.querySelectorAll("[data-room-overlay]").forEach((overlay) => overlay.remove());
    }
    activeVendorId = "";
    document.body.removeAttribute("data-active-room");
  }

  const GAME_ASSET = "assets/game/";
  const VISUALS = {
    aura: {
      welcome: "assets/restyle/paper-aura-seated.png",
      think: "Aura_Reactions/Thinking.webp",
      celebrate: "Aura_Reactions/Celebrating.webp",
      laugh: "Aura_Reactions/Laughing.webp",
      badLuck: "Aura_Reactions/Bad_Luck.webp",
      point: "Aura_Reactions/Pointing.webp",
      give: "Aura_Reactions/Handing_Collectible.webp",
    },
    fortune: {
      idle: "Free_Fortune_States/Closed.webp",
      think: "Free_Fortune_States/Aura_Considering.webp",
      result: "Free_Fortune_Sequence/Aura_Presenting.webp",
    },
    love: {
      cold: "assets/prepared/love-thermometer-tease.webp",
      sweet: "assets/prepared/love-thermometer-mid-heat.webp",
      boil: "Love_Thermometer_States/Boil_Over.webp",
    },
    lookup: {
      idle: "assets/restyle/scene-turnarounds-2026-09-09/stalls/lookup/front.png",
      rising: "Look_Up_Darling/Needle_Rising.webp",
      success: "Look_Up_Darling/Sky_Reveal.webp",
      fail: "Look_Up_Darling/Failure_Shoes.webp",
    },
    snap: {
      idle: "assets/prepared/snap-freeze-flash.webp",
      countdown: "SNAP_Freeze/Countdown.webp",
      flash: "SNAP_Freeze/Huge_Flash.webp",
      success: "SNAP_Freeze/Celebration.webp",
      early: "SNAP_Freeze/Too_Early.webp",
      late: "SNAP_Freeze/Too_Late.webp",
    },
    whisper: {
      idle: "Whisper_Charm/Idle.webp",
      glow: "Whisper_Charm/Machinery_Glowing.webp",
      result: "Whisper_Charm/Aura_Sealing.webp",
    },
    pass: {
      idle: "Showmans_Pass/Blank_Ticket.webp",
      stamped: "Showmans_Pass/Stamped.webp",
    },
  };

  const CURIO_ART = {
    ticket_stub: "Ticket_Stub.webp",
    pressed_heart: "Pressed_Brass_Heart.webp",
    lucky_match: "Lucky_Match.webp",
    whisper_charm: "Whisper_Charm.webp",
    mirror_shard: "Mirror_Shard.webp",
    showman_ribbon: "Showmans_Ribbon.webp",
    mercury_bead: "Mercury_Bead.webp",
    gyro_ghost: "Gyro_Ghost.webp",
    shutter_click: "Shutter_Mechanism.webp",
    sweet_heat: "Sweet_Heat_Vial.webp",
    coin_slot: "Antique_Coin_Slot.webp",
    marquee_bulb: "Marquee_Bulb.webp",
  };

  function artPath(relative) {
    return GAME_ASSET + relative;
  }

  function setArt(id, relative) {
    const el = $(id);
    if (el && relative) el.src = relative.startsWith("assets/") ? relative : artPath(relative);
  }

  function setAura(reaction) {
    setArt("auraPortrait", VISUALS.aura[reaction] || VISUALS.aura.welcome);
  }

  function ensureScoreDay() {
    const day = darwinDay();
    if (state.scoreDay !== day) {
      state.scoreDay = day;
      state.feverScore = 0;
      state.streak = 0;
      state.loveStreak = 0;
      state.snapStreak = 0;
      saveState(state);
    }
  }

  function starString() {
    const s = state.feverScore || 0;
    const extra = state.feverStars || 0;
    const fromScore = s >= 400 ? 3 : s >= 200 ? 2 : s >= 80 ? 1 : 0;
    const n = Math.min(3, fromScore + extra);
    return "★".repeat(n) + "☆".repeat(3 - n);
  }

  function refreshNightBoard() {
    ensureScoreDay();
    const fs = $("feverScore");
    if (!fs) return;
    fs.textContent = String(state.feverScore || 0);
    $("feverStreak").textContent = String(state.streak || 0);
    $("feverStars").textContent = starString();
    $("feverCoins").textContent = String(state.demoCoins);
    refreshDepthReadouts();
  }

  function refreshDepthReadouts() {
    const bestHeat = (state.bestDepth && state.bestDepth.love) || 0;
    const loveBest = $("loveBestDepth");
    if (loveBest) loveBest.textContent = bestHeat ? `Heat Stage ${bestHeat}` : "—";
    const loveNow = $("loveStageDepth");
    if (loveNow && !(loveRun && loveRun.active)) loveNow.textContent = "—";
    const loveDoor = $("loveDoorBest");
    if (loveDoor) {
      loveDoor.textContent = bestHeat ? `Heat Stage ${bestHeat}` : "Heat Stage —";
    }
    const fortuneBest = $("depthFortuneBest");
    if (fortuneBest) fortuneBest.textContent = state.fortuneDay ? "YES" : "NO";
    const curiosFloor = $("depthCurioFloor");
    if (curiosFloor) curiosFloor.textContent = String(Object.keys(state.curios || {}).length);
    const lookupBest = $("depthLookupBest");
    if (lookupBest) lookupBest.textContent = state.plays.lookup ? `Pattern ${state.plays.lookup}` : "—";
    const snapStreak = $("depthSnapStreak");
    if (snapStreak) snapStreak.textContent = String(state.snapStreak || 0);
    const whisperCount = $("depthWhisperCount");
    if (whisperCount) whisperCount.textContent = String((state.charms || []).length);
    eachVendor((mod) => { if (mod.refreshDepth) mod.refreshDepth(state); });
  }

  function toast(msg) {
    const el = $("nightToast");
    if (!el) return;
    el.hidden = false;
    el.textContent = msg;
    el.classList.remove("pop");
    void el.offsetWidth;
    el.classList.add("pop");
  }

  function showBanner(ok, tier, detail) {
    const ban = $("resultBanner");
    if (!ban) return;
    ban.hidden = false;
    ban.classList.toggle("is-fail", !ok);
    $("resultFrame").src = artPath(
      ok ? "Result_Frames/Success_Reward_Frame.webp" : "Result_Frames/Failure_BadLuck_Frame.webp"
    );
    $("resultTier").textContent = tier;
    $("resultDetail").textContent = detail || "";
    clearTimeout(showBanner._t);
    showBanner._t = setTimeout(() => { ban.hidden = true; }, 3200);
  }

  function award(points, ok, label) {
    ensureScoreDay();
    if (ok) {
      state.streak = (state.streak || 0) + 1;
      state.bestStreak = Math.max(state.bestStreak || 0, state.streak);
      const bonus = Math.min(25, (state.streak - 1) * 5);
      state.feverScore = (state.feverScore || 0) + points + bonus;
      toast(`${label} +${points}${bonus ? ` · streak +${bonus}` : ""}`);
    } else {
      state.streak = 0;
      toast(label || "Miss — streak broken");
    }
    saveState(state);
    refreshNightBoard();
  }

  function setTier(id, text, kind) {
    const el = $(id);
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || "";
    el.classList.remove("tier-perfect", "tier-great", "tier-miss");
    if (kind) el.classList.add("tier-" + kind);
  }

  function focusCard(id, on) {
    document.querySelectorAll(".attraction-card").forEach((c) => c.classList.remove("has-focus"));
    const el = $(id);
    if (el && on) el.classList.add("has-focus");
  }

  function hideLegacyDom() {
    document.querySelectorAll(".fortune-legacy, .lookup-legacy, .whisper-legacy-stubs, .pack-legacy-mint").forEach((el) => {
      el.hidden = true;
      el.setAttribute("aria-hidden", "true");
    });
  }

  function resetCabinetArt() {
    setArt("fortuneCabinetArt", VISUALS.fortune.idle);
    setArt("loveCabinetArt", VISUALS.love.cold);
    setArt("lookupCabinetArt", VISUALS.lookup.idle);
    setArt("snapCabinetArt", VISUALS.snap.idle);
    setArt("whisperCabinetArt", VISUALS.whisper.idle);
    setArt("passArt", state.showmanPass ? VISUALS.pass.stamped : VISUALS.pass.idle);
    setAura("welcome");
  }



  function serial() {
    const n = Math.floor(Math.random() * 9000) + 1000;
    return `PF-${darwinDay().replace(/-/g, "")}-${n}`;
  }

  function hasCurio(id) {
    return !!state.curios[id];
  }

  function grantCurio(id, shelf) {
    if (hasCurio(id)) return false;
    state.curios[id] = { shelf, at: Date.now() };
    saveState(state);
    return true;
  }

  function shelfComplete(list) {
    return list.every((c) => hasCurio(c.id));
  }

  function renderCabinet() {
    const root = $("cabinetShelves");
    if (!root) return;
    const makeShelf = (title, list, key) => {
      const filled = list.filter((c) => hasCurio(c.id)).length;
      const slots = list
        .map((c) => {
          const on = hasCurio(c.id);
          const itch = on ? "" : " itch";
          const curioArt = CURIO_ART[c.id];
          const body = on
            ? `${curioArt ? `<img class="slot-art" src="${GAME_ASSET}Cabinet_of_Curios/Objects/${curioArt}" alt="">` : `<span class="slot-glyph" aria-hidden="true">${c.glyph || "★"}</span>`}<span class="slot-name">${c.name}</span>`
            : `<span class="slot-glyph empty" aria-hidden="true">·</span><span class="slot-name muted">empty</span>`;
          return `<button type="button" class="slot${on ? " filled" : ""}${itch}" data-curio="${c.id}" data-tip="${c.tip || ""}" title="${c.name}${c.tip ? " — " + c.tip : ""}">${body}</button>`;
        })
        .join("");
      const bar = `<div class="shelf-itch" aria-hidden="true"><span style="width:${Math.round((filled / list.length) * 100)}%"></span></div>`;
      return `<div class="shelf" data-shelf="${key}"><h3>${title} · ${filled}/${list.length}</h3>${bar}<div class="slot-grid">${slots}</div></div>`;
    };
    root.innerHTML =
      makeShelf("Alley Ephemera", ALLEY, "alley") + makeShelf("Machine Guts", GUTS, "guts");

    root.querySelectorAll(".slot").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tip = btn.getAttribute("data-tip") || "";
        const filled = btn.classList.contains("filled");
        if (filled && window.PennyFeverInventory?.open(btn.getAttribute("data-curio"))) return;
        const itchEl = $("cabinetItch");
        if (!itchEl) return;
        if (filled) {
          itchEl.textContent = "Already filed. Completing a shelf unlocks stranger curtains later.";
        } else {
          itchEl.textContent = tip
            ? `That empty slot itches for: ${tip}.`
            : "That empty slot itches for another play.";
        }
        $("auraLine").textContent = filled
          ? "You’ve already got that one. Hunt the empties."
          : tip
            ? `Empty shelf. Try — ${tip}.`
            : "Empty shelf. Go play something.";
        // Soft scroll toward the matching cabinet
        const id = btn.getAttribute("data-curio");
        const enterMap = {
          ticket_stub: "fortune",
          lucky_match: "fortune",
          mirror_shard: "fortune",
          marquee_bulb: "marquee",
          whisper_charm: "whisper",
          pressed_heart: "pack",
          showman_ribbon: "pass",
          coin_slot: "pass",
          mercury_bead: "love",
          sweet_heat: "love",
          gyro_ghost: "lookup",
          shutter_click: "snap",
        };
        const slug = enterMap[id];
        if (slug && !filled) {
          // hint then offer the door
          const itchEl2 = $("cabinetItch");
          if (itchEl2) itchEl2.textContent += " · Opening that cabinet…";
          setTimeout(() => enterCabinet(slug), 650);
        }
      });
    });

    const alleyDone = shelfComplete(ALLEY);
    const gutsDone = shelfComplete(GUTS);
    const bonus = $("setBonus");
    const status = $("cabinetStatus");
    const total = Object.keys(state.curios).length;
    const missing = ALLEY.length + GUTS.length - total;
    status.textContent =
      total === 0
        ? "Shelves waiting for stubs · tap an empty slot for a hint"
        : `${total} curios filed · ${missing} still itching · tap a slot for a hint`;
    if (alleyDone || gutsDone) {
      bonus.hidden = false;
      const bits = [];
      if (alleyDone) bits.push("Alley complete — Aura opens the velvet curtain");
      if (gutsDone) bits.push("Machine Guts complete — marquee hums warmer");
      bonus.textContent = bits.join(" · ");
      if (!state._alleyBonus && alleyDone) {
        state._alleyBonus = true;
        award(80, true, "Alley set");
        showBanner(true, "ALLEY COMPLETE", "Stranger curtains stir");
      }
      if (!state._gutsBonus && gutsDone) {
        state._gutsBonus = true;
        award(80, true, "Guts set");
        showBanner(true, "GUTS COMPLETE", "Marquee hums warmer");
      }
      saveState(state);
    } else {
      bonus.hidden = true;
    }
  }

  function refreshPassUi() {
    const day = darwinDay();
    if (state.showmanPass && state.passDay !== day) {
      state.showmanPass = false;
      state.passDay = null;
      saveState(state);
    }
    const st = $("passStatus");
    const passBtn = $("demoPass");
    if (state.showmanPass) {
      if (st) st.textContent = "Showman’s Pass active until midnight Darwin (demo)";
      if (passBtn) passBtn.disabled = true;
      setArt("passArt", VISUALS.pass.stamped);
    } else {
      if (st) st.textContent = "No Square connected · demo unlock for testing";
      if (passBtn) passBtn.disabled = false;
      setArt("passArt", VISUALS.pass.idle);
    }
  }

  function spendDemoCoin(kind) {
    if (state.showmanPass && state.passDay === darwinDay()) {
      return true;
    }
    if (state.demoCoins <= 0) {
      return false;
    }
    state.demoCoins -= 1;
    state.plays[kind] = (state.plays[kind] || 0) + 1;
    saveState(state);
    refreshNightBoard();
    return true;
  }

  function spendPennies(amount) {
    const need = Math.max(0, Math.floor(Number(amount) || 0));
    if (!need) return true;
    if (state.showmanPass && state.passDay === darwinDay()) return true;
    if ((state.demoCoins || 0) < need) return false;
    state.demoCoins -= need;
    saveState(state);
    refreshNightBoard();
    return true;
  }

  function addDemoCoins(amount) {
    const added = Math.max(0, Math.floor(Number(amount) || 0));
    if (!added) return 0;
    state.demoCoins = Math.max(0, Number(state.demoCoins) || 0) + added;
    saveState(state);
    refreshNightBoard();
    return added;
  }

  const PENNY_ROLL = 10;
  const TICKET_STRIP = 5;
  const PENNY_STACK = 5;

  function pennies() {
    return Math.max(0, Math.floor(Number(state.demoCoins) || 0));
  }

  function tickets() {
    return Math.max(0, Math.floor(Number(state.playTickets) || 0));
  }

  function stampKeepsake(id, source) {
    const model = window.PennyFeverInventoryModel;
    if (!model?.stampKeepsake) return false;
    if (!model.stampKeepsake(state, id, source)) return false;
    saveState(state);
    window.dispatchEvent(new CustomEvent("pennyfever:inventoryaward", { detail: { ids: [id] } }));
    return true;
  }

  function addTickets(amount) {
    const added = Math.max(0, Math.floor(Number(amount) || 0));
    if (!added) return 0;
    state.playTickets = tickets() + added;
    saveState(state);
    refreshNightBoard();
    return added;
  }

  function spendTicket(kind) {
    if (state.showmanPass && state.passDay === darwinDay()) return true;
    if (tickets() < 1) return false;
    state.playTickets = tickets() - 1;
    if (kind) state.plays[kind] = (state.plays[kind] || 0) + 1;
    saveState(state);
    refreshNightBoard();
    return true;
  }

  function buyTicketStrip() {
    return addTickets(TICKET_STRIP);
  }

  function buyPennyRoll() {
    return addDemoCoins(PENNY_ROLL);
  }

  function cashTicketForPennies() {
    if (tickets() < 1) return 0;
    state.playTickets = tickets() - 1;
    const added = addDemoCoins(PENNY_STACK);
    if (state.paperInventory?.items?.['penny-purse']) stampKeepsake("five-penny-stack", "cash-drop");
    return added;
  }

  function tradePenniesForTicket() {
    if (pennies() < PENNY_STACK) return false;
    if (!spendPennies(PENNY_STACK)) return false;
    addTickets(1);
    stampKeepsake("ticket-roll", "aura-till");
    return true;
  }

  function cashInCompletedPlays() {
    return 0;
  }

  function setChalk() {
    const el = $("chalkText");
    if (!el) return;
    const i = Math.floor(Date.now() / 86400000) % CHALK.length;
    el.textContent = CHALK[i];
  }


  /* —— Phase A router: hidden door → alley → tent and stall interiors —— */
  const VIEWS = {
    door: () => $("discoveryDoor"),
    foyer: () => $("foyer"),
  };

  function hideAllViews(nextSlug = "") {
    closeActiveRoom(nextSlug);
    const door = $("discoveryDoor");
    const foyer = $("foyer");
    if (door) { door.hidden = true; door.inert = true; }
    if (foyer) { foyer.hidden = true; foyer.inert = true; }
    document.querySelectorAll(".cabinet-interior").forEach((el) => {
      el.hidden = true;
      el.inert = true;
      el.setAttribute("aria-hidden", "true");
    });
    if (window.PennyFeverWorld && typeof window.PennyFeverWorld.pause === "function") {
      window.PennyFeverWorld.pause();
    }
    document.body.classList.remove("is-in-world", "is-world-map");
  }

  function routeFromHash() {
    const hash = (location.hash || "").replace(/^#/, "");
    const routeMatch = hash.match(/^cabinet\/([\w-]+)(?:\/(play|result))?$/);
    const nextSlug = routeMatch ? routeMatch[1] : "";
    const onLove = hash === "cabinet/love" || hash === "cabinet/love/play" || hash === "cabinet/love/result";
    if (!onLove) abortLoveRun();
    hideAllViews(nextSlug);
    if (!hash || hash === "door") {
      const door = $("discoveryDoor");
      if (door) { door.hidden = false; door.inert = false; }
      return "door";
    }
    if (hash === "foyer" || hash === "arcade" || hash === "alley" || hash === "booth") {
      const foyer = $("foyer");
      if (foyer) { foyer.hidden = false; foyer.inert = false; }
      const paperRail = new URLSearchParams(location.search).get("rail") === "paper";
      const alleyMotion = $("alleyMotion");
      if (!paperRail && alleyMotion && !matchMedia("(prefers-reduced-motion: reduce)").matches) alleyMotion.play().catch(() => {});
      // ensure foyer init bits
      try {
        setChalk();
        renderCabinet();
        refreshFortuneUi();
        refreshPassUi();
        refreshPackUi();
        resetCabinetArt();
        refreshNightBoard();
        renderCharmWall();
      } catch (err) {
        console.warn("Penny Fever foyer refresh skipped a missing cabinet node", err);
      }
      if (alleyReturnY > 0) {
        const returnY = alleyReturnY;
        requestAnimationFrame(() => window.scrollTo({ top: returnY, behavior: "auto" }));
        const returnedDoor = alleyReturnTent
          ? document.querySelector(`.cabinet-door[data-enter="${alleyReturnTent}"]`)
          : null;
        if (returnedDoor) {
          returnedDoor.classList.add("alley-returned");
          setTimeout(() => returnedDoor.classList.remove("alley-returned"), 1200);
        }
      }
      const world = window.PennyFeverWorld;
      if (world) {
        if (world.started && typeof world.resume === "function") world.resume();
        else if (typeof world.start === "function") world.start();
      }
      return "foyer";
    }
    const m = routeMatch;
    if (m) {
      const slug = m[1];
      const leaf = m[2] || "";
      const el = $("cabinet-" + slug);
      if (el) {
        el.hidden = false;
        el.inert = false;
        el.removeAttribute("aria-hidden");
        const title = el.querySelector("h1");
        if (title) title.focus();
        // keep shared systems warm
        refreshNightBoard();
        renderCabinet();
        renderCharmWall();
        if (slug === "love") {
          if (leaf === "result") paintLoveResultFromState();
          else if (leaf === "play" && loveRun && (loveRun.active || loveRun.dying)) {
            loveSetMode("play");
          } else if (!(loveRun && (loveRun.active || loveRun.dying))) {
            loveSetMode("vestibule");
            paintLoveMode();
          }
        }
        if (activeVendorId !== slug) {
          activeVendorId = slug;
          document.body.setAttribute("data-active-room", slug);
          const mod = vendorMods.find((item) => item.id === slug);
          if (mod && typeof mod.onShow === "function") mod.onShow();
          el.dispatchEvent(new CustomEvent("pennyfever:roomenter", { detail: { slug } }));
        }
        return "cabinet:" + slug + (leaf ? "/" + leaf : "");
      }
    }
    // fallback
    const foyer = $("foyer");
    if (foyer) { foyer.hidden = false; foyer.inert = false; }
    const world = window.PennyFeverWorld;
    if (world) {
      if (world.started && typeof world.resume === "function") world.resume();
      else if (typeof world.start === "function") world.start();
    }
    return "foyer";
  }

  function goArcade() {
    const slug = (location.hash || "").match(/^#cabinet\/([^/]+)/)?.[1];
    try { window.PennyFeverWorld?.stepOut?.(slug); } catch (_) { /* alley not ready */ }
    location.hash = "alley";
  }

  function enterCabinet(slug) {
    location.hash = "cabinet/" + slug;
  }

  function enterTent(slug) {
    const button = document.querySelector(`.cabinet-door[data-enter="${slug}"]`);
    if (button) approachTent(button);
    else enterCabinet(slug);
  }

  let tentTransitionBusy = false;
  let alleyReturnY = 0;
  let alleyReturnTent = "";
  let carnivalAudio = null;
  let carnivalSoundOn = false;
  let carnivalChimeTimer = null;

  function soundTone(freq, duration, gain, delay) {
    if (!carnivalSoundOn || !carnivalAudio) return;
    const at = carnivalAudio.currentTime + (delay || 0);
    const oscillator = carnivalAudio.createOscillator();
    const volume = carnivalAudio.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(freq, at);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.82), at + duration);
    volume.gain.setValueAtTime(0.0001, at);
    volume.gain.exponentialRampToValueAtTime(gain || 0.025, at + 0.018);
    volume.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(volume).connect(carnivalAudio.destination);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.03);
  }

  function playTentCue() {
    soundTone(196, 0.32, 0.035, 0);
    soundTone(294, 0.28, 0.028, 0.12);
    soundTone(440, 0.38, 0.025, 0.23);
  }

  function scheduleCarnivalChime() {
    clearTimeout(carnivalChimeTimer);
    if (!carnivalSoundOn) return;
    carnivalChimeTimer = setTimeout(() => {
      const notes = [220, 247, 294, 330, 392];
      const base = notes[Math.floor(Math.random() * notes.length)];
      soundTone(base, 0.65, 0.009, 0);
      soundTone(base * 1.5, 0.52, 0.006, 0.18);
      scheduleCarnivalChime();
    }, 6500 + Math.random() * 6000);
  }

  function toggleCarnivalSound() {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    const button = $("carnivalSound");
    if (!AudioCtor || !button) return;
    if (!carnivalAudio) carnivalAudio = new AudioCtor();
    if (carnivalAudio.state === "suspended") carnivalAudio.resume().catch(() => {});
    carnivalSoundOn = !carnivalSoundOn;
    button.setAttribute("aria-pressed", String(carnivalSoundOn));
    button.textContent = carnivalSoundOn ? "Carnival awake ♪" : "Sound asleep ♪";
    if (carnivalSoundOn) {
      soundTone(262, 0.2, 0.022, 0);
      soundTone(392, 0.3, 0.018, 0.12);
      scheduleCarnivalChime();
    } else {
      clearTimeout(carnivalChimeTimer);
    }
  }

  function approachTent(button) {
    if (!button || tentTransitionBusy) return;
    const slug = button.getAttribute("data-enter");
    if (!slug) return;
    alleyReturnY = window.scrollY;
    alleyReturnTent = slug;
    const overlay = $("tentTransition");
    const title = button.querySelector(".door-plaque strong");
    const line = button.querySelector(".door-plaque em");
    if (!overlay || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      enterCabinet(slug);
      return;
    }
    tentTransitionBusy = true;
    $("tentTransitionTitle").textContent = title ? title.textContent : "THE NEXT BAY";
    $("tentTransitionLine").textContent = line ? line.textContent : "Mind the boards.";
    overlay.hidden = false;
    document.body.classList.add("tent-is-opening");
    playTentCue();
    setTimeout(() => {
      enterCabinet(slug);
      overlay.hidden = true;
      document.body.classList.remove("tent-is-opening");
      tentTransitionBusy = false;
    }, 830);
  }

  // Vendor stalls register in vendors/*.js. Keep their game implementations
  // out of this shared router; the hash route only needs their matching DOM id.
  window.PennyFeverVendorRouter = Object.freeze({
    enter: enterCabinet,
    backToAlley: goArcade,
    addCleanup: addRoomCleanup,
    activeRoom: () => activeVendorId,
  });


  function showFoyer(fromHash) {
    if (!fromHash) {
      location.hash = "alley";
      return;
    }
    hideAllViews();
    $("foyer").hidden = false;
    $("foyer").inert = false;
    $("foyerTitle").focus();
    setChalk();
    renderCabinet();
    refreshFortuneUi();
    refreshPassUi();
    refreshPackUi();
    resetCabinetArt();
    refreshNightBoard();
    renderCharmWall();
    const ban = $("resultBanner");
    if (ban) ban.hidden = true;
  }

  function showDoor() {
    location.hash = "door";
  }


  function refreshFortuneUi() {
    if (!$("fortuneIdle")) return;
    const used = state.fortuneDay === darwinDay();
    $("fortuneIdle").hidden = used && !state.lastFortune;
    $("fortuneForm").hidden = true;
    $("fortuneResult").hidden = !(used && state.lastFortune);
    if (used && state.lastFortune) {
      setArt("fortuneCabinetArt", VISUALS.fortune.result);
      $("fortuneIdle").hidden = true;
      $("fortuneText").textContent = state.lastFortune.text;
      $("stubLine").textContent = state.lastFortune.stub;
      $("ticketSerial").textContent = state.lastFortune.serial;
      $("fortuneStatus").textContent = "Already drawn today (Darwin day)";
      $("startFortune").disabled = true;
    } else {
      setArt("fortuneCabinetArt", VISUALS.fortune.idle);
      $("fortuneResult").hidden = true;
      $("fortuneIdle").hidden = false;
      $("fortuneStatus").textContent = "First room free each Darwin day · how deep will the oracle let you go?";
      $("startFortune").disabled = false;
    }
  }

  function dealFortune(mood, colour, company) {
    const pick = FORTUNES.find((f) => f.when(mood, colour, company)) || FORTUNES[FORTUNES.length - 1];
    const card = {
      text: pick.text,
      stub: pick.stub,
      serial: serial(),
      mood,
      colour,
      company,
    };
    $("fortuneForm").hidden = true;
    $("fortuneStatus").textContent = "Consulting the machinery…";
    setArt("fortuneCabinetArt", VISUALS.fortune.think);
    setAura("think");
    focusCard("fortuneCard", true);
    setTimeout(() => {
      state.fortuneDay = darwinDay();
      state.lastFortune = card;
      grantCurio(pick.curio, pick.shelf);
      saveState(state);
      $("fortuneText").textContent = card.text;
      $("stubLine").textContent = card.stub;
      $("ticketSerial").textContent = card.serial;
      $("fortuneResult").hidden = false;
      $("auraLine").textContent = "Stub filed. The Cabinet just got denser.";
      setArt("fortuneCabinetArt", VISUALS.fortune.result);
      setAura("give");
      const flourish = $("fortuneFlourish");
      if (flourish) flourish.hidden = false;
      award(40, true, "Fortune");
      showBanner(true, "FORTUNE", card.text);
      focusCard("fortuneCard", false);
      renderCabinet();
      refreshFortuneUi();
      refreshNightBoard();
    }, 1100);
  }

  /* Love Tester — Heat Run. GOBLIN REVIEW REDO 2026-09-05.
   * OWN app.js. HoldBand.mount(root, { stageParams: holdBandStageParams }, runCtx)
   * holdBandStageParams(n) = AUTHORED unique rooms (GOBLIN_AUTHORED_LEVELS_P0.md) + codaEnabled.
   * Unique: solid · sine · splitMidClear · twinAlternate · ghostEither · liarFlash · ghostPoison · livingShrink
   * NOT a thinner climb. Love owns moving-band death; HoldBand lo/hi stay 0–1.
   * Drop-in: GOBLIN_P0_MOUNT_CONFIGS.md · LOVE_HEAT_RUN · GOBLIN_P0_AURA_LINES.md · GOBLIN_RUNKIT_API.md
   * PF only. Never booth/port 6000. Never Imagine. Leave vendors alone. */
  let heat = 0;
  let heating = false;
  let loveRun = null;

  const LOVE_TICK_MS = 16.67;
  /* Hybrid default: 8 authored rooms, then ENDLESS coda. Flip false = souvenir after Fever Break. */
  const LOVE_CODA_ENABLED = true;
  const LOVE_AUTHORED_COUNT = 8;
  /* Unique rooms — verbs, not thinner pink. GOBLIN_P0_AUTHORED_ACCEPT_FEEL.md L1–L6. */
  const LOVE_UNIQUE_KINDS = ["solid", "sine", "splitMidClear", "twinAlternate", "ghostEither", "liarFlash", "ghostPoison", "livingShrink"];
  const LOVE_UNIQUE_VERBS = ["HOLD", "RIDE THE SINE", "THE BAND SPLITS", "ALTERNATE", "EITHER COUNTS", "FLASH IS A LIE", "GHOST KILLS", "LIVING SHRINK"];
  /* Drop-in LOVE_LEVELS from GOBLIN_P0_MOUNT_CONFIGS.md + play extras (center/barker). Unique kinds — illegal if “same board, smaller numbers.” */
  const LOVE_LEVELS = [
    { id: 1, name: "Warm Glass", title: "Warm Glass", kind: "solid", verb: "HOLD", bandH: 22, speed: 0.35, travel: 5, center: 52, startHeat: 50, parkUntilHold: true, clearMs: 1800, outLimitMs: 900, entryDeadlineMs: 4000, graceStrikes: 1, barker: "Hold to rise, release to fall. Stay in the pink. One free miss." },
    { id: 2, name: "Mercury Tide", title: "Mercury Tide", kind: "sine", verb: "RIDE THE SINE", bandH: 22, speed: 0.95, travel: 22, center: 50, clearMs: 1800, outLimitMs: 1100, entryDeadlineMs: 4200, graceStrikes: 0, barker: "Ride the sine. The path moves — the band does not shrink." },
    { id: 3, name: "Hot Split", title: "Hot Split", kind: "splitMidClear", verb: "THE BAND SPLITS", bandH: 20, splitBandH: 9, splitGap: 11, splitAtPct: 0.45, speed: 0.5, travel: 8, center: 50, clearMs: 2000, outLimitMs: 800, entryDeadlineMs: 4300, graceStrikes: 0, barker: "It splits mid-hold. Either band is safe. The gap is death." },
    { id: 4, name: "Twin Mercury", title: "Twin Mercury", kind: "twinAlternate", verb: "ALTERNATE", bandH: 11, speed: 0.42, travel: 5, upperCenter: 72, lowerCenter: 28, clearEachMs: 900, clearMs: 1800, outLimitMs: 750, entryDeadlineMs: 8000, stallMs: 4500, minSwitches: 1, graceStrikes: 0, barker: "Two mercuries. Switch bands. Ignoring one stalls the clear." },
    { id: 5, name: "Ghost Band", title: "Ghost Band", kind: "ghostEither", verb: "EITHER COUNTS", bandH: 16, ghostBandH: 16, speed: 0.55, ghostSpeed: -0.55, travel: 12, center: 50, poisonMs: 0, clearMs: 2000, outLimitMs: 700, entryDeadlineMs: 4300, graceStrikes: 0, barker: "Solid or ghost. Either counts. Remember that — it won't last." },
    { id: 6, name: "Liar's Flash", title: "Liar's Flash", kind: "liarFlash", verb: "FLASH IS A LIE", bandH: 16, speed: 0.55, travel: 8, center: 52, lieEveryMs: 2500, decoyMs: 400, decoyOffset: 12, decoyH: 7, decoyKillMs: 220, clearMs: 2000, outLimitMs: 650, entryDeadlineMs: 4400, graceStrikes: 0, barker: "The flash is a lie. Hold the solid band only." },
    { id: 7, name: "Poison Twin", title: "Poison Twin", kind: "ghostPoison", verb: "GHOST KILLS", bandH: 15, ghostBandH: 15, speed: 0.65, ghostSpeed: -0.5, travel: 11, center: 50, poisonMs: 400, clearMs: 2100, outLimitMs: 600, entryDeadlineMs: 4500, graceStrikes: 0, barker: "Same twin. Opposite law. Ghost is poison. Solid only." },
    { id: 8, name: "Fever Break Room", title: "Fever Break Room", kind: "livingShrink", verb: "LIVING SHRINK", bandH: 18, speed: 0.6, travel: 7, center: 56, shrinkWhileHold: 0.007, minBandH: 7, teleportEveryMs: 1500, firstTeleportMs: 700, clearMs: 2400, outLimitMs: 420, entryDeadlineMs: 4000, graceStrikes: 0, barker: "It shrinks while you hold. It teleports. A different machine." },
  ];
  const LOVE_P0_MOUNT = {
    engine: "HoldBand",
    displayName: "Love Thermometer",
    depthUnit: "Heat Stage",
    sheet: "GOBLIN_LOVE_HEAT_RUN.md",
    authoredSheet: "GOBLIN_AUTHORED_LEVELS_P0.md",
    codaEnabled: LOVE_CODA_ENABLED,
    authoredCount: LOVE_AUTHORED_COUNT,
    unique: true,
    uniqueRooms: true,
    kinds: LOVE_UNIQUE_KINDS.slice(),
    verbs: LOVE_UNIQUE_VERBS.slice(),
  };
  /* Solo Aura — GOBLIN_P0_AURA_LINES.md love table. Death keys: drifted · never_found · ghost · ignored_twin · decoy. */
  const LOVE_AURA = {
    drifted: "Out of the pink. My crown cooled.",
    never_found: "You never even found the band, sugar.",
    ghost: "That ghost band lied. I warned you.",
    ignored_twin: "You loved one mercury. The other went cold.",
    decoy: "The lie flashed and you believed it.",
    souvenir: "Fever Break survived. Souvenir stamped — the authored ride ends.",
    deep: "INFERNO EDGE. Don't you dare cash soft next time.",
    coda: "Authored rooms done. ENDLESS now. Don't you dare cash soft.",
    clear: "Heat climbs. Hold longer.",
    shatter: "The mercury shattered.",
    practice: "Practice stamped. The real coin still kills.",
    rooms: {
      1: "Glass warmed. Tide next.",
      2: "You rode the sine. Split coming.",
      3: "You held the split. Twin mercury wants both.",
      4: "You switched bands. Ghost is next.",
      5: "Either band worked. Remember that — it won't last.",
      6: "You ignored the lie. Poison twin next.",
      7: "Solid only. Fever Break is a different machine.",
      8: "Fever Break survived. Authored ride complete.",
    },
  };

  function pfRunKit() {
    return (window.PennyFever && window.PennyFever.runKit) || null;
  }

  function loveCodaParams(n) {
    const k = Math.max(0, (n | 0) - LOVE_LEVELS.length);
    return {
      id: n,
      name: "Inferno Edge " + n,
      title: "Inferno Edge " + n,
      kind: "coda",
      coda: true,
      authored: false,
      unique: false,
      bandH: Math.max(6, 16 - k * 1.1),
      speed: Math.min(2.4, 0.7 + k * 0.12),
      shrink: Math.min(0.02, 0.003 + k * 0.0012),
      travel: Math.min(22, 8 + k * 1.2),
      clearMs: Math.round(2000 + Math.min(2000, k * 120)),
      outLimitMs: Math.max(280, 700 - k * 45),
      entryDeadlineMs: 4000 + Math.min(2000, k * 100),
      lieChance: Math.min(0.35, k * 0.05),
      splitAt: k >= 2,
      bothMust: k >= 7,
      clearEachMs: 900,
      stallMs: 4500,
      graceStrikes: 0,
      barker: "Authored rooms done. ENDLESS now. Don't you dare cash soft.",
      verb: "ENDLESS",
    };
  }

  function loveCodaOn() {
    return !!(LOVE_P0_MOUNT && LOVE_P0_MOUNT.codaEnabled);
  }

  function loveAuthoredKinds() {
    return LOVE_LEVELS.map((room) => room.kind);
  }

  function loveAuthoredVerbs() {
    return LOVE_LEVELS.map((room) => room.verb || loveVerbOf(room));
  }

  function loveRoomsAreUnique() {
    const kinds = loveAuthoredKinds();
    const verbs = loveAuthoredVerbs();
    if (kinds.length !== LOVE_AUTHORED_COUNT) return false;
    if (new Set(kinds).size !== kinds.length) return false;
    if (kinds.length !== LOVE_UNIQUE_KINDS.length) return false;
    if (new Set(verbs).size !== verbs.length) return false;
    for (let i = 0; i < kinds.length; i += 1) {
      if (kinds[i] !== LOVE_UNIQUE_KINDS[i]) return false;
      if (LOVE_UNIQUE_VERBS[i] && verbs[i] !== LOVE_UNIQUE_VERBS[i]) return false;
    }
    return true;
  }

  function loveStageParams(n) {
    const stage = n | 0;
    if (stage >= 1 && stage <= LOVE_LEVELS.length) {
      const room = LOVE_LEVELS[stage - 1];
      return Object.assign({ title: room.name }, room, {
        id: room.id,
        name: room.name,
        title: room.title || room.name,
        kind: room.kind,
        coda: false,
        authored: true,
        unique: true,
        entryDeadlineMs: room.entryDeadlineMs || 4000,
        graceStrikes: room.graceStrikes | 0,
        outLimitMs: room.outLimitMs,
        clearMs: room.clearMs,
      });
    }
    if (LOVE_P0_MOUNT.codaEnabled) return loveCodaParams(stage);
    return null; /* souvenirClear — authored ride ends */
  }

  function loveDeathKey(reason) {
    if (reason === "never found the band" || reason === "never_found") return "never_found";
    if (reason === "ghost band lied" || reason === "ghost") return "ghost";
    if (reason === "ignored the twin" || reason === "ignored_twin") return "ignored_twin";
    if (reason === "the lie flashed" || reason === "decoy") return "decoy";
    if (reason === "drifted out" || reason === "drifted" || reason === "missed_band") return "drifted";
    if (reason === "practice") return "practice";
    if (reason === "souvenir") return "souvenir";
    return reason || "drifted";
  }

  function loveAuraLine(reason, depth) {
    if (reason === "practice") return LOVE_AURA.practice;
    if (reason === "souvenir") return LOVE_AURA.souvenir;
    const key = loveDeathKey(reason);
    if (key === "never_found") return LOVE_AURA.never_found;
    if (key === "ghost") return LOVE_AURA.ghost;
    if (key === "ignored_twin") return LOVE_AURA.ignored_twin;
    if (key === "decoy") return LOVE_AURA.decoy;
    if ((depth | 0) > LOVE_AUTHORED_COUNT) return LOVE_AURA.coda;
    if ((depth | 0) >= LOVE_AUTHORED_COUNT) return LOVE_AURA.deep;
    if (key === "drifted") return LOVE_AURA.drifted;
    return LOVE_AURA.shatter;
  }

  function loveIsCoda(spec) {
    return !!(spec && (spec.coda || spec.kind === "coda"));
  }

  function loveVerbOf(spec) {
    if (!spec) return "HOLD";
    if (spec.verb) return spec.verb;
    if (loveIsCoda(spec)) {
      if (spec.bothMust) return "ENDLESS · BOTH";
      if (spec.splitAt) return "ENDLESS · SPLIT";
      return "ENDLESS";
    }
    switch (spec.kind) {
      case "sine": return "RIDE THE SINE";
      case "splitMidClear": return "THE BAND SPLITS";
      case "twinAlternate": return "ALTERNATE";
      case "ghostEither": return "EITHER COUNTS";
      case "liarFlash": return "FLASH IS A LIE";
      case "ghostPoison": return "GHOST KILLS";
      case "livingShrink": return "LIVING SHRINK";
      case "solid": return "HOLD";
      default: return "HOLD THE PINK";
    }
  }

  function loveHazardCopy(spec) {
    if (!spec) return "HOLD THE PINK";
    const room = String(spec.name || spec.title || "HOLD THE PINK").toUpperCase();
    const verb = loveVerbOf(spec);
    if (loveIsCoda(spec)) return verb.indexOf("ENDLESS") === 0 ? verb + " · " + room : "ENDLESS · " + room;
    return room + " · " + verb;
  }

  function loveWarmParked() {
    const spec = loveRun && loveRun.spec;
    return !!(spec && spec.kind === "solid" && spec.id === 1 && spec.parkUntilHold !== false && loveRun && !loveRun.heldOnce);
  }

  function loveTeachOnce(key, msg) {
    if (!loveRun || !key || !msg) return;
    loveRun.taught = loveRun.taught || {};
    if (loveRun.taught[key]) return;
    loveRun.taught[key] = true;
    toast(msg);
  }

  function loveBandMid01(range, fallbackPct) {
    if (range && range.length === 2) return Math.max(0, Math.min(1, ((range[0] + range[1]) / 2) / 100));
    const pct = fallbackPct == null ? 50 : fallbackPct;
    return Math.max(0, Math.min(1, pct > 1 ? pct / 100 : pct));
  }

  function loveSeatMercury(kind) {
    if (!loveRun || !loveRun.real) return;
    const mustHold = kind === "solid" || kind === "livingShrink" || loveWarmParked();
    if (!mustHold) return;
    if (!inRange(heat, loveRun.real)) {
      const boot = loveBandMid01(loveRun.real, loveRun.spec && loveRun.spec.startHeat);
      if (loveRun.holdBand && typeof loveRun.holdBand.setValue === "function") {
        loveRun.holdBand.setValue(boot);
      }
      setMercury(boot * 100);
    }
    if (inRange(heat, loveRun.real)) loveRun.entered = true;
  }

  function loveMercuryRates(spec) {
    /* LOVE_HEAT_RUN: hold +0.55 / release −0.32 per ~16.67ms tick on 0–100 mercury.
       holdBandStageParams documents those rates; HoldBand value is 0–1. */
    const rise = spec && spec.riseRate != null ? spec.riseRate : 0.55;
    const fall = spec && spec.fallRate != null ? spec.fallRate : 0.32;
    if (rise > 0.05) return { rise: rise / LOVE_TICK_MS / 100, fall: fall / LOVE_TICK_MS / 100 };
    return { rise, fall };
  }

  function holdBandStageParams(n) {
    const p = loveStageParams(n);
    if (!p) return null;
    /* GOBLIN_P0_MOUNT_CONFIGS drop-in: HoldBand.mount stageParams IS the authored unique room.
       riseRate 0.55 / fallRate 0.32 document LOVE_HEAT_RUN mercury (0–100 per ~16.67ms tick).
       lo/hi stay 0–1 so kit HoldBand cannot steal unique-room death. */
    return Object.assign({}, p, {
      title: p.title || p.name,
      name: p.name || p.title,
      kind: p.kind,
      verb: p.verb || loveVerbOf(p),
      riseRate: 0.55,
      fallRate: 0.32,
      lo: 0,
      hi: 1,
      unique: !p.coda,
      uniqueRooms: !p.coda,
      authoredCount: LOVE_AUTHORED_COUNT,
      codaEnabled: LOVE_P0_MOUNT.codaEnabled,
      parkUntilHold: p.kind === "solid" && p.id === 1 ? p.parkUntilHold !== false : !!p.parkUntilHold,
    });
  }

  function loveReportDepth() {
    const rk = pfRunKit();
    const ctx = loveRun && loveRun.kitRun;
    if (!rk || !ctx || typeof rk.reportDepth !== "function") return;
    const spec = loveRun.spec;
    const cleared = loveRun.depth | 0;
    const hudN = spec && spec.id ? spec.id : Math.max(1, cleared);
    try {
      rk.reportDepth(ctx, hudN, {
        name: spec && (spec.title || spec.name),
        coda: !!(spec && loveIsCoda(spec)),
      });
    } catch (_) { /* hud optional */ }
    ctx.depth = cleared;
    ctx.score = loveRun.score | 0;
  }

  function declareLoveP0() {
    const rk = pfRunKit();
    if (!rk) return null;
    const kinds = loveAuthoredKinds();
    if (!loveRoomsAreUnique()) {
      console.warn("Love Heat Run: authored kinds must be unique rooms, not a thinner climb", kinds);
    }
    const spec = Object.assign({}, LOVE_P0_MOUNT, {
      engine: "HoldBand",
      displayName: "Love Thermometer",
      depthUnit: "Heat Stage",
      sheet: "GOBLIN_LOVE_HEAT_RUN.md",
      authoredSheet: "GOBLIN_AUTHORED_LEVELS_P0.md",
      stageParams: holdBandStageParams,
      holdBandStageParams: holdBandStageParams,
      loveStageParams: loveStageParams,
      authored: LOVE_LEVELS,
      authoredCount: LOVE_AUTHORED_COUNT,
      codaEnabled: LOVE_P0_MOUNT.codaEnabled,
      codaParams: loveCodaParams,
      level: holdBandStageParams,
      kinds,
      unique: true,
      uniqueRooms: kinds,
    });
    const probe = LOVE_UNIQUE_KINDS.map((_, i) => holdBandStageParams(i + 1));
    const probeKinds = probe.map((p) => p && p.kind);
    if (!loveRoomsAreUnique() || probeKinds.join() !== LOVE_UNIQUE_KINDS.join()) {
      console.warn("Love Heat Run: HoldBand stageParams must be unique authored rooms", probeKinds);
    }
    if (probe.some((p) => !p || p.lo !== 0 || p.hi !== 1 || p.riseRate !== 0.55 || p.fallRate !== 0.32)) {
      console.warn("Love Heat Run: HoldBand lo/hi stay 0–1; riseRate 0.55 / fallRate 0.32");
    }
    const coda = holdBandStageParams(LOVE_AUTHORED_COUNT + 1);
    if (LOVE_P0_MOUNT.codaEnabled) {
      if (!coda || !coda.coda || coda.kind !== "coda" || String(coda.title || "").indexOf("Inferno Edge") !== 0) {
        console.warn("Love Heat Run: codaEnabled but HoldBand stage 9 is not ENDLESS Inferno Edge");
      }
    } else if (coda) {
      console.warn("Love Heat Run: codaEnabled false must souvenir after Fever Break");
    }
    const warm = probe[0];
    const warmLo = warm ? (warm.center || 52) - (warm.travel || 0) / 2 - (warm.bandH || 0) / 2 : 0;
    const warmHi = warm ? (warm.center || 52) + (warm.travel || 0) / 2 + (warm.bandH || 0) / 2 : 0;
    const warmStart = warm && (warm.startHeat != null ? warm.startHeat : 50);
    const verbs = loveAuthoredVerbs();
    const feel = {
      L1: probe[3] && probe[3].kind === "twinAlternate" && (probe[3].minSwitches | 0) >= 1 && (probe[3].stallMs || 0) >= 4000 && (probe[3].clearEachMs || 0) >= 800 && probe[3].verb === "ALTERNATE",
      L2: probe[4] && probe[4].kind === "ghostEither" && !(probe[4].poisonMs > 0) && probe[4].verb === "EITHER COUNTS",
      L3: probe[6] && probe[6].kind === "ghostPoison" && (probe[6].poisonMs || 0) >= 400 && probe[6].kind !== (probe[4] && probe[4].kind) && probe[6].verb === "GHOST KILLS",
      L4: probe[5] && probe[5].kind === "liarFlash" && (probe[5].decoyH || 0) < probe[5].bandH && (probe[5].decoyMs || 0) > 0 && (probe[5].decoyKillMs || probe[5].outLimitMs) > 0 && probe[5].verb === "FLASH IS A LIE",
      L5: probe[7] && probe[7].kind === "livingShrink" && probe[7].shrinkWhileHold > 0 && (probe[7].firstTeleportMs || 0) > 0 && (probe[7].teleportEveryMs || 0) > 0 && (probe[7].clearMs || 0) > (probe[7].firstTeleportMs || 0) + (probe[7].teleportEveryMs || 0) && probe[7].verb === "LIVING SHRINK",
      L6: loveRoomsAreUnique() && new Set(probeKinds).size === LOVE_AUTHORED_COUNT && new Set(verbs).size === LOVE_AUTHORED_COUNT,
      warmGlassHoldable: !!(warm && warm.kind === "solid" && warm.bandH >= 20 && warm.parkUntilHold && warmStart >= warmLo && warmStart <= warmHi),
      codaEnabled: !!(LOVE_P0_MOUNT.codaEnabled && coda && coda.coda && coda.kind === "coda"),
    };
    if (Object.keys(feel).some((k) => !feel[k])) {
      console.warn("Love Heat Run: REVIEW HIT #2 feel flags", feel);
    }
    spec.feel = feel;
    spec.verbs = verbs;
    if (window.PennyFever && window.PennyFever.loveHeat) {
      window.PennyFever.loveHeat.feel = feel;
      window.PennyFever.loveHeat.codaEnabled = LOVE_CODA_ENABLED;
      window.PennyFever.loveHeat.verbs = verbs;
    }
    if (typeof rk.declare === "function") {
      try { rk.declare("love", spec); } catch (_) { /* already declared */ }
    }
    rk.p0 = rk.p0 || {};
    rk.p0.love = Object.assign({}, rk.p0.love || {}, spec);
    rk.declared = rk.declared || {};
    rk.declared.love = Object.assign({}, rk.declared.love || {}, spec);
    rk.mounted = rk.mounted || {};
    rk.mounted.love = true;
    return rk;
  }

  function loveKit() {
    return (window.PennyFever && window.PennyFever.kit) || null;
  }

  function loveSetMode(mode) {
    const card = $("loveCard");
    const kit = loveKit();
    if (kit && typeof kit.setMode === "function") kit.setMode(card, mode);
    else if (card) card.dataset.mode = mode || "vestibule";
  }

  function loveHoldRoot() {
    return $("holdBtn") || $("loveHoldZone") || $("loveHold") || $("loveCard") || $("loveTube");
  }

  function patchLoveRunKit() {
    const rk = pfRunKit();
    if (!rk) return null;
    if (!rk._pfLoveNavGuard && typeof rk.finishRun === "function") {
      const orig = rk.finishRun.bind(rk);
      rk.finishRun = function loveFinishNavGuard(runCtx, partial, opts) {
        const gid = (partial && partial.gameId) || (runCtx && runCtx.gameId);
        if (gid === "love") {
          return orig(runCtx, partial, Object.assign({}, opts || {}, { navigate: false }));
        }
        return orig(runCtx, partial, opts);
      };
      rk._pfLoveNavGuard = true;
    }
    if (!rk._pfLoveAura && typeof rk.auraDeathLine === "function") {
      const origAura = rk.auraDeathLine.bind(rk);
      rk.auraDeathLine = function loveAuraDeathLine(gameId, depth, reason) {
        if (gameId === "love") return loveAuraLine(reason, depth);
        return origAura(gameId, depth, reason);
      };
      rk.auraFor = function loveAuraFor(r) {
        if (!r) return "";
        if (r.gameId === "love") return loveAuraLine(r.deathReason, r.depth);
        return origAura(r.gameId, r.depth, r.deathReason);
      };
      rk._pfLoveAura = true;
    }
    if (!rk._pfLoveChallenge && typeof rk.challengeText === "function") {
      const origCh = rk.challengeText.bind(rk);
      rk.challengeText = function loveChallengeText(name, depth, gameId) {
        if (gameId === "love" || name === "Love Heat Stage") {
          return `Beat my Love Heat Stage ${depth | 0} on Penny Fever`;
        }
        return origCh(name, depth, gameId);
      };
      rk.challengeLine = rk.challengeText;
      rk._pfLoveChallenge = true;
    }
    return rk;
  }

  function wrapLoveHoldBand(engine) {
    if (engine && engine.wired && typeof engine.applyAuthored === "function") return engine;
    let value = 0;
    let rising = false;
    const api = {
      id: "HoldBand",
      wired: true,
      authored: true,
      uniqueRooms: true,
      codaEnabled: loveCodaOn(),
      stageParams: holdBandStageParams,
      holdBandStageParams: holdBandStageParams,
      loveStageParams: loveStageParams,
      spec: null,
      kind: "solid",
      coda: false,
      hold(on) {
        rising = !!on;
        if (on && loveRun) loveRun.heldOnce = true;
        if (engine && typeof engine.hold === "function") engine.hold(on);
      },
      applyAuthored(n) {
        /* Same function HoldBand.mount received — unique authored room, not a thinner climb. */
        const spec = holdBandStageParams(n);
        api.spec = spec;
        api.kind = (spec && spec.kind) || "solid";
        api.coda = !!(spec && loveIsCoda(spec));
        if (loveRun) {
          loveRun.spec = spec;
          loveRun.coda = api.coda;
        }
        if (engine && typeof engine.hold === "function") engine.hold(rising);
        return spec;
      },
      tick(dt) {
        const d = dt == null ? LOVE_TICK_MS : Math.max(0, dt);
        const spec = api.spec || (loveRun && loveRun.spec) || holdBandStageParams(api.stage);
        const rates = loveMercuryRates(spec);
        const snap = {
          dead: false,
          cleared: false,
          value,
          inBand: false,
          stage: api.stage,
          kind: api.kind,
          spec: spec,
        };
        if (!loveRun || loveRun.dying) return snap;
        if (loveRun.fanfare > 0 || !loveRun.active) {
          rising = false;
          if (engine && typeof engine.hold === "function") engine.hold(false);
          return snap;
        }
        if (engine && typeof engine.hold === "function") engine.hold(rising);
        /* Do not tick kit HoldBand — riseRate 0.55 is LOVE_HEAT_RUN mercury, not kit per-ms 0–1.
           Love owns unique-room death (split / twin / ghost / liar / poison / living shrink).
           Warm Glass parks in-band until first hold so ice-zero never-found cannot fire. */
        if (d > 0 && !loveWarmParked()) {
          value = rising ? Math.min(1, value + rates.rise * d) : Math.max(0, value - rates.fall * d);
        }
        snap.value = value;
        if (!spec) return snap;
        if (loveRun) loveRun.spec = spec;
        computeLoveBands(d);
        const judged = evaluateLoveHoldBand(d, value * 100, rising);
        return Object.assign(snap, judged, { value, stage: api.stage, kind: api.kind, spec });
      },
      clearStage() {
        /* Love owns depth/score. Kit clearStage would +100 and applyStage a dummy 0–1 band. */
      },
      setValue(v) {
        let n = Number(v);
        if (!Number.isFinite(n)) n = 0;
        if (n > 1) n = n / 100;
        value = Math.max(0, Math.min(1, n));
        if (engine && typeof engine.setValue === "function") engine.setValue(value);
      },
      get value() { return value; },
      get stage() { return (loveRun && loveRun.stage) || 1; },
    };
    return api;
  }

  function seedLoveHoldBand(runCtx) {
    let value = 0;
    let rising = false;
    let stage = 1;
    let spec = holdBandStageParams(1);
    return {
      id: "HoldBand",
      hold(on) {
        rising = !!on;
        if (on && loveRun) loveRun.heldOnce = true;
      },
      applyAuthored(n) {
        stage = n | 0;
        spec = holdBandStageParams(stage);
        return spec;
      },
      tick(dt) {
        const d = dt == null ? LOVE_TICK_MS : Math.max(0, dt);
        const rates = loveMercuryRates(spec);
        if (d > 0 && !loveWarmParked()) {
          value = rising ? Math.min(1, value + rates.rise * d) : Math.max(0, value - rates.fall * d);
        }
        return { dead: false, value, inBand: true, stage, spec, kind: spec && spec.kind };
      },
      clearStage() {
        stage += 1;
        spec = holdBandStageParams(stage);
        if (runCtx) runCtx.depth = Math.max(runCtx.depth | 0, stage - 1);
      },
      setValue(v) {
        let n = Number(v);
        if (!Number.isFinite(n)) n = 0;
        if (n > 1) n = n / 100;
        value = Math.max(0, Math.min(1, n));
      },
      get value() { return value; },
      get stage() { return stage; },
    };
  }

  function loveKitHudSink() {
    let sink = $("loveKitHud");
    if (sink) return sink;
    sink = document.createElement("span");
    sink.id = "loveKitHud";
    sink.hidden = true;
    sink.setAttribute("data-runkit-hud", "love");
    const card = $("loveCard");
    if (card) card.appendChild(sink);
    return sink;
  }

  function mountLoveHoldBand(runCtx) {
    const rk = declareLoveP0();
    patchLoveRunKit();
    if (!runCtx) return null;
    loveKitHudSink();
    const strikes = $("loveHazardRail");
    if (strikes) {
      strikes.setAttribute("data-runkit-strikes", "love");
      if (!strikes.querySelector("i")) {
        for (let n = 0; n < 2; n += 1) {
          const pip = document.createElement("i");
          pip.className = "strike-pip";
          strikes.appendChild(pip);
        }
      }
    }
    const kinds = loveAuthoredKinds();
    const card = $("loveCard");
    if (card) {
      card.dataset.engine = "HoldBand";
      card.dataset.gameId = "love";
      card.dataset.codaEnabled = loveCodaOn() ? "1" : "0";
      card.dataset.authoredCount = String(LOVE_AUTHORED_COUNT);
      card.dataset.uniqueRooms = kinds.join(",");
    }
    if (!loveRoomsAreUnique()) {
      console.warn("Love Heat Run: authored kinds must be unique rooms, not a thinner climb", kinds);
    }
    const mount = rk && rk.engines && rk.engines.HoldBand && rk.engines.HoldBand.mount;
    let raw = null;
    if (typeof mount === "function") {
      try {
        /* HoldBand.mount(root, { stageParams: holdBandStageParams }, runCtx)
           stageParams = AUTHORED unique rooms + codaEnabled. Shadow ctx so kit finishRun cannot steal. */
        const shadow = {
          gameId: "love",
          startedAt: (runCtx && runCtx.startedAt) || Date.now(),
          feverNode: !!(runCtx && runCtx.feverNode),
          feverGate: runCtx && runCtx.feverGate,
          depth: 0,
          score: 0,
          strikes: 0,
          alive: true,
        };
        raw = mount(loveHoldRoot(), {
          stageParams: holdBandStageParams,
          holdBandStageParams: holdBandStageParams,
          onClear(stage) {
            if (!loveRun) return;
            if (loveRun.kitRun) {
              loveRun.kitRun.score = loveRun.score | 0;
              loveRun.kitRun.depth = loveRun.depth | 0;
            }
            loveReportDepth();
            return stage;
          },
          graceStrikes: 1,
          authored: LOVE_LEVELS,
          authoredCount: LOVE_AUTHORED_COUNT,
          codaEnabled: LOVE_P0_MOUNT.codaEnabled,
          codaParams: loveCodaParams,
          unique: true,
          uniqueRooms: kinds,
        }, shadow);
      } catch (err) {
        console.warn("HoldBand.mount love", err);
        raw = null;
      }
    } else {
      console.warn("Love Heat Run: HoldBand.mount missing — local HoldBand shim");
    }
    if (runCtx) runCtx.depth = 0;
    const band = wrapLoveHoldBand(raw || seedLoveHoldBand(runCtx));
    if (typeof band.applyAuthored === "function") band.applyAuthored(1);
    return band;
  }

  function driveLoveHoldBand(dt) {
    if (!loveRun || !loveRun.holdBand) return null;
    if (typeof loveRun.holdBand.hold === "function") loveRun.holdBand.hold(!!heating);
    if (typeof loveRun.holdBand.tick !== "function") return null;
    const snap = loveRun.holdBand.tick(dt);
    if (snap && typeof snap.value === "number") setMercury(snap.value * 100);
    if (snap && snap.kind && loveRun) loveRun.engineKind = snap.kind;
    return snap;
  }

  function closeLoveKitRun(partial) {
    if (loveRun && loveRun.kitClosed) return loveRun.kitResult || null;
    const rk = pfRunKit();
    const ctx = loveRun && loveRun.kitRun;
    if (ctx) ctx.alive = false;
    let result = null;
    if (ctx && rk && typeof rk.finishRun === "function") {
      try {
        result = rk.finishRun(ctx, Object.assign({ gameId: "love" }, partial), { navigate: false });
      } catch (err) {
        console.warn("finishRun love", err);
      }
    }
    if (!result && rk && typeof rk.recordResult === "function") {
      try {
        result = rk.recordResult(Object.assign({ gameId: "love" }, partial));
      } catch (_) { /* ignore */ }
    }
    if (loveRun) {
      loveRun.kitClosed = true;
      loveRun.kitResult = result;
    }
    return result;
  }

  function lovePracticeOn() {
    const el = $("lovePractice");
    return !!(el && el.checked);
  }

  function loveRank(depth) {
    if (depth >= 8) return "Inferno";
    if (depth >= 5) return "Sweet";
    if (depth >= 3) return "Warm";
    if (depth >= 1) return "Lukewarm";
    return "Cold";
  }

  function loveGhostMode(spec) {
    if (!spec) return "off";
    if (spec.kind === "ghostPoison") return "poison";
    if (spec.kind === "ghostEither") return "either";
    return "off";
  }

  function loveDualBand(spec) {
    return !!(spec && (spec.kind === "twinAlternate" || (spec.kind === "coda" && spec.bothMust)));
  }

  function clampBand(center, height) {
    const h = Math.max(6, height);
    let lo = center - h / 2;
    let hi = center + h / 2;
    if (lo < 8) { hi += 8 - lo; lo = 8; }
    if (hi > 94) { lo -= hi - 94; hi = 94; }
    lo = Math.max(4, lo);
    hi = Math.min(96, hi);
    if (hi - lo < 6) hi = Math.min(96, lo + 6);
    return [lo, hi];
  }

  function inRange(v, range) {
    return !!(range && v >= range[0] && v <= range[1]);
  }

  function placeSweetBand(el, range) {
    if (!el) return;
    if (!range) {
      el.hidden = true;
      return;
    }
    const [lo, hi] = range;
    el.hidden = false;
    el.style.bottom = `${8 + lo * 0.84}%`;
    el.style.height = `${Math.max(4, (hi - lo) * 0.84)}%`;
    el.classList.remove("moving");
  }

  function hideLoveResult() {
    const kit = loveKit();
    if (kit && typeof kit.hideResult === "function") kit.hideResult("loveResult");
    else {
      const card = $("loveResult");
      if (card) card.hidden = true;
    }
    const copied = $("loveCopied");
    if (copied) copied.hidden = true;
  }

  function paintLoveMode() {
    const practice = lovePracticeOn();
    const rounds = $("loveRounds");
    const hazard = $("loveHazardRail");
    const start = $("loveStartRun");
    const hint = $("loveModeHint");
    const status = $("loveStatus");
    if (rounds) rounds.hidden = !practice;
    if (hazard) hazard.hidden = !!practice;
    if (start && !(loveRun && loveRun.active)) {
      start.textContent = practice
        ? "Practice · 3 stages (no Heat stamp)"
        : "START · 1 demo coin";
    }
    if (hint) {
      hint.textContent = practice
        ? "Practice 3 rooms · depth is not stamped"
        : "HOLD THE PINK — HOW FAR CAN YOU GO?";
    }
    if (status && !(loveRun && (loveRun.active || loveRun.dying))) {
      status.textContent = practice
        ? "Practice · Warm Glass → Tide → Split · then stamp"
        : "HOLD THE PINK — Warm Glass · Tide · Split · Twin · Ghost · Liar · Poison · Fever Break · then ENDLESS";
    }
    const twinBox = $("loveTwinMeters");
    if (twinBox && !(loveRun && loveRun.active)) twinBox.hidden = true;
    const practiceBox = $("lovePractice");
    if (practiceBox) practiceBox.disabled = !!(loveRun && (loveRun.active || loveRun.dying));
    const card = $("loveCard");
    if (card) {
      card.classList.toggle("is-practice", practice);
      if (!(loveRun && (loveRun.active || loveRun.dying))) card.classList.remove("is-coda");
    }
  }

  function setMercury(v) {
    heat = Math.max(0, Math.min(100, v));
    const mercury = $("mercury");
    if (mercury) mercury.style.height = `${8 + heat * 0.84}%`;
    const readout = $("thermoReadout");
    if (readout) readout.textContent = `${Math.round(40 + heat * 0.6)}°`;
    const key = heat > 80 ? "boil" : heat >= 50 ? "sweet" : "cold";
    if (!loveRun || loveRun.artKey !== key) {
      if (loveRun) loveRun.artKey = key;
      setArt("loveCabinetArt", VISUALS.love[key]);
    }
  }

  function loveHud() {
    if (!loveRun || !loveRun.spec) return;
    const spec = loveRun.spec;
    const coda = loveIsCoda(spec);
    const label = $("loveRoundLabel");
    if (label) {
      label.textContent = coda
        ? `ENDLESS · ${spec.title}`
        : `HEAT STAGE ${spec.id} · ${spec.title}`;
    }
    const now = $("loveStageDepth");
    if (now) now.textContent = coda ? `ENDLESS · ${spec.title}` : `Heat Stage ${spec.id}`;
    const best = $("loveBestDepth");
    if (best) best.textContent = state.bestDepth.love ? `Heat Stage ${state.bestDepth.love}` : "—";
    const haz = $("loveHazard");
    if (haz) haz.textContent = loveHazardCopy(spec);
    const card = $("loveCard");
    if (card) card.classList.toggle("is-coda", coda);
    const isTwin = loveDualBand(spec);
    const twinBox = $("loveTwinMeters");
    if (twinBox) twinBox.hidden = !isTwin;
    const combo = $("loveCombo");
    const practice = lovePracticeOn();
    const rounds = $("loveRounds");
    if (rounds && practice && loveRun.active) {
      rounds.querySelectorAll("[data-round]").forEach((pip) => {
        const n = Number(pip.getAttribute("data-round"));
        pip.classList.toggle("active", n === (spec.id | 0) - 1);
        pip.classList.toggle("won", n < (spec.id | 0) - 1);
      });
    }
    if (isTwin) {
      const need = spec.clearEachMs || 900;
      const u = Math.min(100, Math.round((loveRun.twinUpperMs / need) * 100));
      const l = Math.min(100, Math.round((loveRun.twinLowerMs / need) * 100));
      const uf = $("loveTwinUpperFill");
      const lf = $("loveTwinLowerFill");
      if (uf) uf.style.width = `${u}%`;
      if (lf) lf.style.width = `${l}%`;
      if (combo) {
        combo.hidden = false;
        const switched = (loveRun.twinSwitches | 0) >= 1;
        combo.textContent = switched
          ? `Score ${loveRun.score} · UPPER ${u}% · LOWER ${l}% · SWITCHED`
          : `Score ${loveRun.score} · UPPER ${u}% · LOWER ${l}% · SWITCH BANDS`;
      }
    } else if (combo) {
      combo.hidden = false;
      const need = spec.clearMs || 1800;
      const pct = Math.min(100, Math.round((loveRun.inZoneMs / need) * 100));
      if (spec.kind === "ghostEither") combo.textContent = `Score ${loveRun.score} · EITHER COUNTS ${pct}%`;
      else if (spec.kind === "ghostPoison") combo.textContent = `Score ${loveRun.score} · GHOST KILLS · SOLID ${pct}%`;
      else if (spec.kind === "liarFlash") combo.textContent = `Score ${loveRun.score} · FLASH IS A LIE · solid ${pct}%`;
      else if (spec.kind === "livingShrink") {
        combo.textContent = `Score ${loveRun.score} · LIVING SHRINK ${pct}% · jumps ${loveRun.teleports || 0}`;
      } else if (spec.kind === "sine") {
        combo.textContent = `Score ${loveRun.score} · RIDE THE SINE ${pct}%`;
      } else if (spec.kind === "splitMidClear") {
        combo.textContent = loveRun.splitFired
          ? `Score ${loveRun.score} · THE BAND SPLITS ${pct}%`
          : `Score ${loveRun.score} · hold — it will split ${pct}%`;
      } else if (spec.kind === "solid") {
        combo.textContent = loveWarmParked()
          ? `Score ${loveRun.score} · WARM GLASS · HOLD`
          : `Score ${loveRun.score} · HOLD ${pct}%`;
      } else if (loveIsCoda(spec)) {
        combo.textContent = `Score ${loveRun.score} · ENDLESS ${pct}%`;
      } else {
        combo.textContent = `Score ${loveRun.score} · ${loveVerbOf(spec)} ${pct}%`;
      }
    }
  }

  function abortLoveRun() {
    if (!loveRun) return;
    if (loveRun.dieTimer) {
      clearTimeout(loveRun.dieTimer);
      loveRun.dieTimer = 0;
    }
    if (loveRun.raf) cancelAnimationFrame(loveRun.raf);
    loveRun.raf = 0;
    const wasLive = loveRun.active || loveRun.dying;
    const keepCrack = !!(loveRun.dying || loveRun.finished);
    loveRun.active = false;
    loveRun.dying = false;
    heating = false;
    if (loveRun.holdBand && typeof loveRun.holdBand.hold === "function") {
      try { loveRun.holdBand.hold(false); } catch (_) { /* ignore */ }
    }
    if (loveRun.kitRun) loveRun.kitRun.alive = false;
    const start = $("loveStartRun");
    if (start) start.disabled = false;
    const hold = $("loveHold");
    if (hold) hold.disabled = true;
    const twinAbort = $("loveTwinMeters");
    if (twinAbort && !keepCrack) twinAbort.hidden = true;
    const tube = $("loveTube");
    if (tube && !keepCrack) tube.classList.remove("is-dead", "is-living");
    if (wasLive && !keepCrack) {
      focusCard("loveCard", false);
      loveSetMode("vestibule");
      paintLoveMode();
    }
  }

  function startLoveRun() {
    if ($("loveStage")) return; /* 3D tent (vendors/love.js) owns play */
    if (loveRun && (loveRun.active || loveRun.dying)) return;
    const subject = ($("loveSubject") && $("loveSubject").value || "someone mysterious").trim();
    if (!spendDemoCoin("love")) {
      $("loveStatus").textContent = "Need a penny · buy more at Aura’s ticket booth";
      return;
    }
    const practice = lovePracticeOn();
    declareLoveP0();
    patchLoveRunKit();
    const rk = pfRunKit();
    let kitRun = null;
    if (rk && typeof rk.startRun === "function") {
      try {
        kitRun = rk.startRun({ gameId: "love", coinCost: 1, feverNode: true });
      } catch (err) {
        console.warn("startRun love", err);
      }
    }
    if (!kitRun) {
      kitRun = {
        gameId: "love",
        startedAt: Date.now(),
        feverNode: true,
        feverGate: null,
        depth: 0,
        score: 0,
        strikes: 0,
        alive: true,
      };
    }
    loveRun = {
      subject,
      practice,
      stage: 1,
      depth: 0,
      score: 0,
      active: true,
      dying: false,
      deathReason: "",
      spec: null,
      baseCenter: 52,
      phase: 0,
      inZoneMs: 0,
      outMs: 0,
      elapsedMs: 0,
      entered: false,
      graceUsed: false,
      ghostHoldMs: 0,
      decoyUntil: 0,
      decoyCenter: 0,
      lieAcc: 0,
      lieWait: 2500,
      fanfare: 0,
      lastTs: 0,
      raf: 0,
      dieTimer: 0,
      artKey: "",
      strikeUntil: 0,
      heatPeak: 0,
      real: null,
      ghost: null,
      twin: null,
      decoy: null,
      splitFired: false,
      twinUpperMs: 0,
      twinLowerMs: 0,
      twinStallAt: 0,
      twinLast: "",
      twinSwitches: 0,
      holdShrink: 0,
      teleportAcc: 0,
      teleports: 0,
      decoyHoldMs: 0,
      ghostPhase: 0,
      taught: {},
      heldOnce: false,
      coda: false,
      souvenirDone: false,
      practiceDone: false,
      kitRun,
      holdBand: null,
      engine: "HoldBand",
      kitClosed: false,
      kitResult: null,
      finished: false,
    };
    const holdBand = mountLoveHoldBand(kitRun);
    loveRun.holdBand = holdBand;
    loveRun.engine = (holdBand && holdBand.id) || "HoldBand";
    if (holdBand && typeof holdBand.hold === "function") holdBand.hold(false);
    $("loveVerdict").hidden = true;
    hideLoveResult();
    const scores = $("loveRoundScores") || $("loveRounds");
    if (scores) {
      scores.hidden = true;
      scores.innerHTML = "";
    }
    setTier("loveTier", "", "");
    $("loveStartRun").disabled = true;
    const holdStart = $("loveHold");
    if (holdStart) holdStart.disabled = false;
    const twinStart = $("loveTwinMeters");
    if (twinStart) twinStart.hidden = true;
    paintLoveMode();
    loveSetMode("play");
    focusCard("loveCard", true);
    setAura("think");
    const tube = $("loveTube");
    if (tube) tube.classList.remove("is-dead");
    prepLoveStage();
    if (practice && $("loveStatus")) {
      $("loveStatus").textContent = "Practice · Warm Glass → Tide → Split · then stamp";
    }
    try {
      if ((location.hash || "") !== "#cabinet/love/play") location.hash = "cabinet/love/play";
    } catch (_) { /* ignore */ }
    loveRun.lastTs = 0;
    loveRun.raf = requestAnimationFrame(loveLoop);
  }

  function prepLoveStage() {
    if (!loveRun) return;
    const spec = holdBandStageParams(loveRun.stage);
    if (!spec) {
      loveRun.souvenirDone = true;
      endLoveRun("souvenir");
      return;
    }
    loveRun.spec = spec;
    loveRun.coda = loveIsCoda(spec);
    if (loveRun.holdBand && typeof loveRun.holdBand.applyAuthored === "function") {
      loveRun.holdBand.applyAuthored(loveRun.stage);
    }
    const kind = (loveRun.spec && loveRun.spec.kind) || spec.kind || "solid";
    if (spec.authored && LOVE_UNIQUE_KINDS[spec.id - 1] && LOVE_UNIQUE_KINDS[spec.id - 1] !== kind) {
      console.warn("Love Heat Run: HoldBand room kind mismatch", spec.id, kind);
    }
    loveRun.baseCenter = spec.center != null
      ? spec.center
      : kind === "sine" || kind === "twinAlternate" || kind === "ghostEither" || kind === "ghostPoison"
        ? 50
        : spec.id === 1 ? 52 : (spec.id % 2 === 0 ? 68 : 34);
    loveRun.phase = kind === "sine" ? 0 : Math.random() * 0.4;
    loveRun.ghostPhase = Math.PI;
    loveRun.inZoneMs = 0;
    loveRun.outMs = 0;
    loveRun.elapsedMs = 0;
    loveRun.entered = false;
    loveRun.ghostHoldMs = 0;
    loveRun.decoyUntil = 0;
    loveRun.decoyCenter = 0;
    loveRun.lieAcc = 0;
    loveRun.lieWait = spec.lieEveryMs || 2500;
    loveRun.strikeUntil = 0;
    loveRun.fanfare = 0;
    loveRun.splitFired = false;
    loveRun.twinUpperMs = 0;
    loveRun.twinLowerMs = 0;
    loveRun.twinStallAt = 0;
    loveRun.twinLast = "";
    loveRun.twinSwitches = 0;
    loveRun.holdShrink = 0;
    loveRun.decoyHoldMs = 0;
    loveRun.teleports = 0;
    loveRun.taught = {};
    loveRun._bandStamp = -1;
    /* Fever Break: first jump lands inside clearMs so shrink+teleport is the room, not Warm Glass hard. */
    const firstJump = spec.firstTeleportMs != null ? spec.firstTeleportMs : 0;
    loveRun.teleportAcc = kind === "livingShrink" && firstJump > 0
      ? Math.max(0, (spec.teleportEveryMs || 3000) - firstJump)
      : 0;
    loveRun.real = null;
    loveRun.ghost = null;
    loveRun.twin = null;
    loveRun.decoy = null;
    if (spec.id === 1 || kind === "solid") loveRun.heldOnce = false;
    layoutLoveBands(0);
    if (spec.id === 1 || kind === "solid") {
      /* Warm Glass must be holdable — mercury starts IN the tall band, not ice-zero never-found. */
      const boot = loveBandMid01(loveRun.real, spec.startHeat != null ? spec.startHeat : 50);
      if (loveRun.holdBand && typeof loveRun.holdBand.setValue === "function") loveRun.holdBand.setValue(boot);
      setMercury(boot * 100);
      loveRun.entered = true;
    } else if (loveRun.holdBand && typeof loveRun.holdBand.value === "number") {
      setMercury(loveRun.holdBand.value * 100);
    }
    loveSeatMercury(kind);
    loveHud();
    loveReportDepth();
    const holdReady = $("loveHold");
    if (holdReady) holdReady.disabled = false;
    const room = spec.title || spec.name;
    const card = $("loveCard");
    if (card) {
      card.dataset.loveKind = kind;
      card.dataset.loveVerb = loveVerbOf(spec);
      card.dataset.loveRoom = spec.title || spec.name || "";
      card.dataset.coda = loveRun.coda ? "1" : "0";
      card.dataset.engine = "HoldBand";
      card.dataset.authored = spec.coda ? "0" : "1";
      card.dataset.uniqueRooms = loveAuthoredKinds().join(",");
      card.dataset.codaEnabled = loveCodaOn() ? "1" : "0";
    }
    const tube = $("loveTube");
    if (tube) {
      tube.classList.toggle("is-living", kind === "livingShrink");
      tube.dataset.loveKind = kind;
    }
    $("loveStatus").textContent = spec.barker
      ? (loveRun.coda ? `ENDLESS · ${room} — ${spec.barker}` : `${room} — ${spec.barker}`)
      : loveRun.coda
        ? `ENDLESS · ${room} — authored rooms done. Hold the pink.`
        : `${room} · hold the pink.`;
    refreshDepthReadouts();
  }

  function lovePingPong(center, travel, elapsedMs, speed) {
    const span = Math.max(1, travel) * 2;
    const t = elapsedMs * (speed || 0.35) * 0.0008;
    const mod = t % span;
    const ping = mod < travel ? mod : span - mod;
    return center - travel / 2 + ping;
  }

  function layoutLoveBands(dt) {
    computeLoveBands(dt);
    paintLoveBands();
  }

  function computeLoveBands(dt) {
    const spec = loveRun && loveRun.spec;
    if (!spec) return;
    const kind = spec.kind || "solid";
    const d = dt == null ? 0 : dt;
    /* One clock per frame — wrap tick + paint must not double-count into never-found. */
    const stamp = loveRun.lastTs || 0;
    if (d > 0 && stamp && loveRun._bandStamp === stamp) return;
    if (d > 0) loveRun.elapsedMs += d;
    loveRun._bandStamp = stamp;
    const minH = spec.minBandH || 6;
    const liveH = Math.max(minH, spec.bandH - (loveRun.holdShrink || 0));
    const travel = spec.travel != null ? spec.travel : 6;
    const step = (spec.speed || 0.4) * d * 0.0025;
    loveRun.phase += step;

    loveRun.ghost = null;
    loveRun.twin = null;
    loveRun.decoy = null;

    if (kind === "solid") {
      const center = loveWarmParked()
        ? loveRun.baseCenter
        : lovePingPong(loveRun.baseCenter, travel, loveRun.elapsedMs, spec.speed);
      loveRun.real = clampBand(center, liveH);
    } else if (kind === "sine") {
      const center = loveRun.baseCenter + Math.sin(loveRun.phase) * travel;
      loveRun.real = clampBand(center, liveH);
    } else if (kind === "splitMidClear") {
      const center = loveRun.baseCenter + Math.sin(loveRun.phase * 0.45) * (travel * 0.35);
      if (!loveRun.splitFired && loveRun.inZoneMs >= spec.clearMs * (spec.splitAtPct || 0.45)) {
        loveRun.splitFired = true;
        toast("THE BAND SPLITS");
        $("loveStatus").textContent = "Hot Split — either band. The gap is death.";
      }
      if (loveRun.splitFired) {
        const h = spec.splitBandH || liveH * 0.45;
        const gap = spec.splitGap || 10;
        loveRun.real = clampBand(center + (gap / 2 + h / 2), h);
        loveRun.twin = clampBand(center - (gap / 2 + h / 2), h);
      } else {
        loveRun.real = clampBand(center, liveH);
      }
    } else if (kind === "twinAlternate") {
      const upperC = (spec.upperCenter || 72) + Math.sin(loveRun.phase) * travel;
      const lowerC = (spec.lowerCenter || 28) + Math.sin(loveRun.phase * 1.37 + 0.9) * travel;
      loveRun.real = clampBand(upperC, liveH);
      loveRun.twin = clampBand(lowerC, liveH);
    } else if (kind === "ghostEither" || kind === "ghostPoison") {
      loveRun.ghostPhase += (spec.ghostSpeed != null ? spec.ghostSpeed : -spec.speed) * d * 0.0025;
      const center = loveRun.baseCenter + Math.sin(loveRun.phase) * travel;
      const gCenter = loveRun.baseCenter + Math.sin(loveRun.ghostPhase) * travel;
      loveRun.real = clampBand(center, liveH);
      loveRun.ghost = clampBand(gCenter, spec.ghostBandH || liveH);
    } else if (kind === "liarFlash") {
      const center = lovePingPong(loveRun.baseCenter, travel, loveRun.elapsedMs, spec.speed);
      if (loveRun.fanfare <= 0) {
        loveRun.lieAcc += d;
        if (loveRun.lieAcc >= (spec.lieEveryMs || 2500)) {
          loveRun.lieAcc = 0;
          loveRun.decoyUntil = loveRun.elapsedMs + (spec.decoyMs || 400);
          const off = spec.decoyOffset != null ? spec.decoyOffset : 18;
          loveRun.decoyCenter = center + (center >= 50 ? -off : off);
          toast("THE LIE FLASHES");
        }
      }
      loveRun.real = clampBand(center, liveH);
      loveRun.decoy = loveRun.decoyUntil > loveRun.elapsedMs
        ? clampBand(loveRun.decoyCenter, spec.decoyH || Math.max(6, liveH * 0.42))
        : null;
    } else if (kind === "livingShrink") {
      loveRun.teleportAcc = (loveRun.teleportAcc || 0) + d;
      if (loveRun.teleportAcc >= (spec.teleportEveryMs || 3000) && loveRun.fanfare <= 0) {
        loveRun.teleportAcc = 0;
        loveRun.baseCenter = 22 + Math.random() * 56;
        loveRun.teleports = (loveRun.teleports || 0) + 1;
        toast("IT JUMPS");
      }
      const jitter = Math.sin(loveRun.elapsedMs * 0.011) * 2.2;
      loveRun.real = clampBand(loveRun.baseCenter + jitter, liveH);
    } else if (kind === "coda") {
      const shrinkH = Math.max(minH, spec.bandH - (spec.shrink || 0) * loveRun.elapsedMs);
      let center = loveRun.baseCenter + Math.sin(loveRun.phase) * travel;
      if ((spec.lieChance || 0) > 0 && loveRun.fanfare <= 0) {
        loveRun.lieAcc += dt;
        if (loveRun.lieAcc >= loveRun.lieWait) {
          loveRun.lieAcc = 0;
          loveRun.lieWait = 2000 + Math.random() * 1000;
          if (Math.random() < spec.lieChance) {
            if (Math.random() < 0.5) {
              loveRun.baseCenter = 22 + Math.random() * 56;
              center = loveRun.baseCenter;
            } else {
              loveRun.decoyUntil = loveRun.elapsedMs + 400;
              loveRun.decoyCenter = center + (Math.random() < 0.5 ? -12 : 12);
            }
          }
        }
      }
      if (spec.bothMust) {
        const h = Math.max(6, shrinkH * 0.62);
        loveRun.real = clampBand(center + 16, h);
        loveRun.twin = clampBand(center - 16, h);
      } else if (spec.splitAt) {
        const h = Math.max(6, shrinkH * 0.48);
        const gap = 10;
        loveRun.real = clampBand(center + (gap / 2 + h / 2), h);
        loveRun.twin = clampBand(center - (gap / 2 + h / 2), h);
      } else {
        loveRun.real = clampBand(center, shrinkH);
      }
      loveRun.decoy = loveRun.decoyUntil > loveRun.elapsedMs
        ? clampBand(loveRun.decoyCenter, shrinkH)
        : null;
    } else {
      const center = lovePingPong(loveRun.baseCenter, travel, loveRun.elapsedMs, spec.speed);
      loveRun.real = clampBand(center, liveH);
    }
  }

  function paintLoveBands() {
    if (!loveRun || !loveRun.spec) return;
    const spec = loveRun.spec;
    const kind = spec.kind || "solid";
    placeSweetBand($("sweetBand"), loveRun.real);
    const second = $("sweetBandSecond");
    const secondRange = loveRun.twin || loveRun.ghost;
    const codaSplit = kind === "coda" && spec.splitAt && !spec.bothMust;
    placeSweetBand(second, secondRange);
    if (second) {
      second.classList.toggle("sweet-band--ghost", kind === "ghostEither" && !!loveRun.ghost);
      second.classList.toggle("sweet-band--twin", !!loveRun.twin && kind !== "splitMidClear" && !codaSplit);
      second.classList.toggle("sweet-band--split", (kind === "splitMidClear" || codaSplit) && !!loveRun.twin);
      second.classList.toggle("sweet-band--poison", kind === "ghostPoison" && !!loveRun.ghost);
    }
    const decoy = $("sweetBandDecoy");
    placeSweetBand(decoy, loveRun.decoy);
    const striking = loveRun.strikeUntil > loveRun.elapsedMs;
    const main = $("sweetBand");
    if (main) {
      main.classList.toggle("is-strike", striking);
      main.classList.toggle("sweet-band--lie", kind === "liarFlash" || (kind === "coda" && !!loveRun.decoy));
      main.classList.toggle("sweet-band--living", kind === "livingShrink");
      main.classList.toggle("sweet-band--tide", kind === "sine");
      main.classList.toggle("sweet-band--twin-upper", kind === "twinAlternate");
      main.classList.toggle("sweet-band--solid-safe", kind === "ghostEither" || kind === "ghostPoison");
    }
    const decoyEl = $("sweetBandDecoy");
    if (decoyEl) {
      decoyEl.classList.toggle("sweet-band--flash", kind === "liarFlash" && !!loveRun.decoy);
      decoyEl.classList.toggle("is-solid", false);
    }
  }

  function loveApproachingBand(heatVal, holding) {
    if (!loveRun || loveRun.entered || !loveRun.real) return false;
    const [lo, hi] = loveRun.real;
    if (heatVal >= lo && heatVal <= hi) return false;
    if (holding && heatVal < lo) return true; /* rising into Warm Glass / solid */
    if (!holding && heatVal > hi) return true;
    if (loveRun.twin) {
      const [tlo, thi] = loveRun.twin;
      if (holding && heatVal < tlo) return true;
      if (!holding && heatVal > thi) return true;
    }
    if (loveRun.ghost && loveRun.spec && loveRun.spec.kind === "ghostEither") {
      const [glo, ghi] = loveRun.ghost;
      if (holding && heatVal < glo) return true;
      if (!holding && heatVal > ghi) return true;
    }
    return false;
  }

  function evaluateLoveHoldBand(dt, heatVal, holding) {
    const spec = loveRun && loveRun.spec;
    if (!spec) return { dead: false, cleared: false, inBand: false };
    const kind = spec.kind || "solid";
    const inReal = inRange(heatVal, loveRun.real);
    const inGhost = inRange(heatVal, loveRun.ghost);
    const inTwin = inRange(heatVal, loveRun.twin);
    const inDecoy = inRange(heatVal, loveRun.decoy);
    const dual = loveDualBand(spec);
    const splitEither = kind === "splitMidClear" || (kind === "coda" && spec.splitAt && !spec.bothMust);

    /* L1–L6 verbs: each kind changes the law, not the thickness. */
    let inZone = inReal;
    if (splitEither || dual) inZone = inReal || inTwin;
    else if (kind === "ghostEither") inZone = inReal || inGhost; /* L2 either-safe */
    else if (kind === "ghostPoison") inZone = inReal; /* L3 solid holds even if ghost overlaps */
    if (inDecoy && !inReal) inZone = false; /* L4 flash is not solid */

    if (inZone) loveRun.entered = true;
    /* Liar's Flash: holding the decoy is OUT even if you never found the solid. */
    if ((kind === "liarFlash" || (kind === "coda" && inDecoy)) && holding && inDecoy && !inReal) {
      loveRun.entered = true;
    }

    if (kind === "ghostEither" && holding && inGhost) {
      loveTeachOnce("ghostEither", "GHOST COUNTS — this time");
    }

    if (dual) {
      /* L1 Twin Mercury: meters fill only on one band at a time — must alternate. */
      if (holding && inReal && !inTwin) {
        loveRun.twinUpperMs += dt;
        if (loveRun.twinLast === "lower") loveRun.twinSwitches += 1;
        loveRun.twinLast = "upper";
      }
      if (holding && inTwin && !inReal) {
        loveRun.twinLowerMs += dt;
        if (loveRun.twinLast === "upper") loveRun.twinSwitches += 1;
        loveRun.twinLast = "lower";
      }
      const need = spec.clearEachMs || 900;
      if (loveRun.twinUpperMs >= need && loveRun.twinLowerMs < need) {
        loveTeachOnce("twinFill", "SWITCH — the other mercury is going cold");
      } else if (loveRun.twinLowerMs >= need && loveRun.twinUpperMs < need) {
        loveTeachOnce("twinFill", "SWITCH — the other mercury is going cold");
      }
      /* Twin Mercury: fill one and ignore the other until stallMs → "ignored the twin". */
      const ignoring =
        (loveRun.twinUpperMs >= need && loveRun.twinLowerMs < need) ||
        (loveRun.twinLowerMs >= need && loveRun.twinUpperMs < need);
      if (ignoring) {
        if (!loveRun.twinStallAt) {
          loveRun.twinStallAt = loveRun.elapsedMs;
          loveTeachOnce("twinStall", "SWITCH BANDS — ignoring one stalls the clear");
        }
        if (loveRun.elapsedMs - loveRun.twinStallAt >= (spec.stallMs || spec.entryDeadlineMs || 4500)) {
          return { dead: true, reason: "ignored the twin", inBand: inZone, kind };
        }
      } else {
        loveRun.twinStallAt = 0;
      }
    }

    if (kind === "livingShrink" && holding && inZone) {
      /* L5 Fever Break: shrinks while you hold — a living machine. */
      loveRun.holdShrink += (spec.shrinkWhileHold || 0.007) * dt;
    }

    const onLie = kind === "liarFlash" && holding && inDecoy && !inReal;
    if (onLie) {
      loveRun.decoyHoldMs = (loveRun.decoyHoldMs || 0) + dt;
      if (loveRun.decoyHoldMs > 60 && $("loveStatus")) {
        $("loveStatus").textContent = "THE FLASH IS A LIE — solid only.";
      }
      if (loveRun.decoyHoldMs >= (spec.decoyKillMs || 280)) {
        return { dead: true, reason: "the lie flashed", inBand: false, kind };
      }
    } else if (kind === "liarFlash") {
      loveRun.decoyHoldMs = 0;
    }

    const onPoisonGhost = kind === "ghostPoison" && holding && inGhost && !inReal;
    const poisonMs = spec.poisonMs || 400;
    /* Invert Ghost Band: solid is safe even if ghost sweeps across it. Ghost-only kills. */
    if (onPoisonGhost) {
      loveRun.ghostHoldMs += dt;
      if (loveRun.ghostHoldMs > 80 && $("loveStatus")) {
        $("loveStatus").textContent = "GHOST IS POISON — solid only.";
      }
      if (loveRun.ghostHoldMs >= poisonMs) {
        return { dead: true, reason: "ghost band lied", inBand: false, kind };
      }
    } else {
      loveRun.ghostHoldMs = 0;
    }

    if (holding && inZone) {
      loveRun.inZoneMs += dt;
      loveRun.outMs = 0;
    } else if (holding && !inZone && loveRun.entered) {
      /* Hot Split accumulates in either band — gap is OUT (outLimit death), not a progress wipe.
         Twin meters are independent. Fever Break survives shrink+teleports — jumps don't wipe clearMs.
         Other rooms require a continuous hold in a valid band. */
      if (!dual && !splitEither && kind !== "livingShrink") loveRun.inZoneMs = 0;
      /* Named deaths win over generic drift: poison ghost / liar flash. */
      if (!onPoisonGhost && !onLie) {
        loveRun.outMs += dt;
        if (loveRun.outMs >= spec.outLimitMs) {
          const graceOk = (spec.graceStrikes | 0) > 0 && !loveRun.graceUsed;
          if (graceOk) {
            loveRun.graceUsed = true;
            loveRun.outMs = 0;
            flashStrike();
          } else {
            return {
              dead: true,
              reason: inDecoy ? "the lie flashed" : "drifted out",
              inBand: false,
              kind,
            };
          }
        }
      }
    } else {
      loveRun.outMs = 0;
    }

    if (!loveRun.entered && loveRun.elapsedMs >= spec.entryDeadlineMs) {
      /* Warm Glass is holdable: parked in-band / rising into the tall band is still finding it. */
      if (loveWarmParked() || inRange(heatVal, loveRun.real) || loveApproachingBand(heatVal, holding)) {
        loveRun.entered = true;
      } else {
        return { dead: true, reason: "never found the band", inBand: false, kind };
      }
    }

    let cleared = false;
    if (dual) {
      const need = spec.clearEachMs || 900;
      const needSwitches = kind === "twinAlternate" ? Math.max(1, spec.minSwitches | 0 || 1) : 0;
      const switched = (loveRun.twinSwitches | 0) >= needSwitches;
      if (switched && loveRun.twinUpperMs >= need && loveRun.twinLowerMs >= need) cleared = true;
    } else if (holding && inZone && loveRun.inZoneMs >= spec.clearMs) {
      cleared = true;
    }

    return {
      dead: false,
      cleared,
      inBand: inZone,
      inReal,
      inGhost,
      inTwin,
      inDecoy,
      kind,
    };
  }

  function flashStrike() {
    loveRun.strikeUntil = loveRun.elapsedMs + 420;
    const main = $("sweetBand");
    if (main) main.classList.add("is-strike");
    toast("Careful…");
    $("loveStatus").textContent = "Careful… the pink is leaving you.";
    const rk = pfRunKit();
    if (rk && loveRun.kitRun && typeof rk.reportStrike === "function") {
      try { rk.reportStrike(loveRun.kitRun, "band"); } catch (_) { /* ignore */ }
    }
  }

  function clearLoveStage() {
    const spec = loveRun.spec;
    const style = Math.floor(loveRun.inZoneMs / 100);
    loveRun.score += 100 * spec.id + style;
    loveRun.depth += 1;
    if (loveRun.kitRun) {
      loveRun.kitRun.score = loveRun.score;
      loveRun.kitRun.depth = loveRun.depth;
    }
    if (!loveRun.practice) {
      state.bestDepth = state.bestDepth || { love: 0 };
      state.bestDepth.love = Math.max(state.bestDepth.love || 0, loveRun.depth);
      state.loveBest = Math.max(state.loveBest || 0, Math.round(loveRun.heatPeak || heat));
      saveState(state);
    }
    refreshNightBoard();
    setAura("celebrate");
    const roomLine = (LOVE_AURA.rooms && LOVE_AURA.rooms[spec.id]) || LOVE_AURA.clear;
    const codaClear = loveIsCoda(spec);
    toast(codaClear
      ? `ENDLESS CLEAR · ${spec.title}`
      : `HEAT STAGE ${spec.id} CLEAR · ${roomLine}`);
    $("loveStatus").textContent = codaClear
      ? `ENDLESS · ${spec.title} CLEAR`
      : `HEAT STAGE ${spec.id} CLEAR · ${spec.title}`;
    const authoredMax = LOVE_AUTHORED_COUNT;
    if (loveRun.practice && loveRun.depth >= 3) {
      loveRun.practiceDone = true;
    } else if (!loveRun.practice && loveRun.depth >= authoredMax && !loveCodaOn()) {
      loveRun.souvenirDone = true;
    } else {
      if (!loveRun.practice && loveRun.depth === authoredMax && loveCodaOn()) {
        toast(LOVE_AURA.coda);
      }
      loveRun.stage += 1;
      if (loveRun.holdBand && typeof loveRun.holdBand.clearStage === "function") {
        loveRun.holdBand.clearStage();
      }
      if (loveRun.kitRun) {
        loveRun.kitRun.score = loveRun.score;
        loveRun.kitRun.depth = loveRun.depth;
      }
    }
    loveReportDepth();
    const mid = (40 + Math.random() * 15) / 100;
    if (loveRun.holdBand && typeof loveRun.holdBand.setValue === "function") loveRun.holdBand.setValue(mid);
    setMercury(mid * 100);
    loveRun.fanfare = 450;
    loveHud();
  }

  function loveLoop(now) {
    if (!loveRun || !(loveRun.active || loveRun.dying)) return;
    if (!loveRun.lastTs) loveRun.lastTs = now;
    const dt = Math.min(32, now - loveRun.lastTs);
    loveRun.lastTs = now;
    if (loveRun.active && !loveRun.dying) stepLove(dt);
    loveRun.raf = requestAnimationFrame(loveLoop);
  }

  function stepLove(dt) {
    const spec = loveRun.spec;
    if (!spec) return;
    const snap = driveLoveHoldBand(dt);
    paintLoveBands();
    if (loveRun.fanfare > 0) {
      loveRun.fanfare -= dt;
      loveHud();
      if (loveRun.fanfare <= 0) {
        if (loveRun.practiceDone) {
          endLoveRun("practice");
          return;
        }
        if (loveRun.souvenirDone) {
          endLoveRun("souvenir");
          return;
        }
        prepLoveStage();
      }
      return;
    }

    if (!loveRun.holdBand) {
      const rates = loveMercuryRates(spec);
      if (!loveWarmParked()) {
        if (heating) setMercury(heat + rates.rise * 100 * dt);
        else setMercury(heat - rates.fall * 100 * dt);
      }
      computeLoveBands(dt);
      paintLoveBands();
      const judged = evaluateLoveHoldBand(dt, heat, heating);
      if (judged.dead) {
        endLoveRun(judged.reason);
        return;
      }
      if (judged.cleared) {
        clearLoveStage();
        return;
      }
      loveHud();
      return;
    }
    loveRun.heatPeak = Math.max(loveRun.heatPeak || 0, heat);
    if (snap && snap.dead) {
      const why = snap.reason || "drifted out";
      if (why !== "missed_band") {
        endLoveRun(why);
        return;
      }
    }
    if (snap && snap.cleared) {
      clearLoveStage();
      return;
    }
    loveHud();
  }

  function endLoveRun(reason) {
    if (!loveRun || loveRun.dying) return;
    loveRun.dying = true;
    loveRun.active = false;
    loveRun.deathReason = reason;
    heating = false;
    const holdDie = $("loveHold");
    if (holdDie) holdDie.disabled = true;
    const tube = $("loveTube");
    const softExit = reason === "practice" || reason === "souvenir";
    if (tube) {
      tube.classList.remove("is-living");
      if (!softExit) tube.classList.add("is-dead");
    }
    $("loveStatus").textContent = reason === "practice"
      ? "Practice stamped."
      : reason === "souvenir"
        ? "Souvenir stamped. The authored ride ends."
        : "Glass cracks.";
    if (softExit) setAura("celebrate");
    else setAura("badLuck");
    if (loveRun.holdBand && typeof loveRun.holdBand.hold === "function") {
      try { loveRun.holdBand.hold(false); } catch (_) { /* ignore */ }
    }
    if (loveRun.kitRun) loveRun.kitRun.alive = false;
    loveRun.dieTimer = setTimeout(() => finishLoveRun(reason), 700);
  }

  function loveLastTicket() {
    const last = state.lastRun || {};
    if (last.love && typeof last.love === "object") return last.love;
    if (last.game === "love" || last.gameId === "love") return last;
    return null;
  }

  function loveChallengeLine(depth) {
    const rk = pfRunKit();
    if (rk && typeof rk.challengeText === "function") {
      return rk.challengeText("Love Heat Stage", depth | 0, "love");
    }
    return `Beat my Love Heat Stage ${depth | 0} on Penny Fever`;
  }

  function paintLoveTicket(depth, score, reason, practice) {
    const rank = loveRank(depth);
    const souvenir = reason === "souvenir";
    const codaRide = !practice && !souvenir && (depth > LOVE_AUTHORED_COUNT || !!(loveRun && loveRun.coda));
    const aura = `Aura: ${loveAuraLine(reason, depth)}`;
    const depthLabel = souvenir
      ? `HEAT STAGE ${depth} · SOUVENIR`
      : codaRide
        ? `ENDLESS · HEAT STAGE ${depth}`
        : `HEAT STAGE ${depth}`;
    const line = `${depthLabel} · SCORE ${score} · ${reason}`;
    const verdict = $("loveVerdict");
    if (verdict) {
      verdict.hidden = false;
      verdict.textContent = line;
    }
    setTier("loveTier", rank.toUpperCase(), depth >= 3 || souvenir ? "perfect" : "miss");
    const rk = pfRunKit();
    if (rk && typeof rk.fillResultCard === "function") {
      try {
        rk.fillResultCard({
          root: "loveResult",
          depth: "loveResultDepth",
          score: "loveResultScore",
          aura: "loveResultAura",
          copied: "loveCopied",
          copy: "loveChallenge",
        }, {
          gameId: "love",
          depth,
          score,
          deathReason: reason,
        }, "Love Heat Stage");
      } catch (_) { /* fall through to kit fill */ }
    }
    const kit = loveKit();
    if (kit && typeof kit.fillResult === "function") {
      kit.fillResult({
        root: "loveResult",
        depth: "loveResultDepth",
        score: "loveResultScore",
        aura: "loveResultAura",
        copied: "loveCopied",
      }, {
        depthLine: depthLabel,
        scoreLine: `SCORE ${score} · ${reason}`,
        auraLine: aura,
      });
    } else {
      const result = $("loveResult");
      if (result) result.hidden = false;
      const rd = $("loveResultDepth");
      if (rd) rd.textContent = depthLabel;
      const rs = $("loveResultScore");
      if (rs) rs.textContent = `SCORE ${score} · ${reason}`;
      const ra = $("loveResultAura");
      if (ra) ra.textContent = aura;
      const copied = $("loveCopied");
      if (copied) copied.hidden = true;
    }
    const rdLock = $("loveResultDepth");
    if (rdLock) rdLock.textContent = depthLabel;
    const rc = $("loveChallengeText");
    if (rc) rc.textContent = loveChallengeLine(depth);
    const best = $("loveBestDepth");
    if (best) best.textContent = state.bestDepth.love ? `Heat Stage ${state.bestDepth.love}` : "—";
    const label = $("loveRoundLabel");
    if (label) {
      label.textContent = practice
        ? `PRACTICE · HEAT STAGE ${depth}`
        : souvenir
          ? `SOUVENIR · HEAT STAGE ${depth}`
          : codaRide
            ? `DEAD · ENDLESS · HEAT STAGE ${depth}`
            : `DEAD · HEAT STAGE ${depth}`;
    }
    const status = $("loveStatus");
    if (status) {
      status.textContent = practice
        ? `Practice complete · Heat Stage ${depth}`
        : souvenir
          ? `Souvenir · Heat Stage ${depth} · authored ride ends`
          : codaRide
            ? `Run dead · ENDLESS · Heat Stage ${depth} · ${reason}`
            : `Run dead · Heat Stage ${depth} · ${reason}`;
    }
    const combo = $("loveCombo");
    if (combo) {
      combo.hidden = false;
      combo.textContent = practice
        ? `Practice Heat Stage ${depth} · depth not stamped`
        : souvenir
          ? `Souvenir Heat Stage ${depth} · authored complete`
          : `Heat Stage ${depth} · best ${state.bestDepth.love || 0}`;
    }
    loveSetMode("result");
    return { rank, aura, line };
  }

  function paintLoveResultFromState() {
    const ticket = loveLastTicket();
    if (!ticket) return false;
    const depth = ticket.depth | 0;
    const score = ticket.score | 0;
    const reason = ticket.deathReason || ticket.meta && ticket.meta.reason || "drifted out";
    const practice = reason === "practice";
    paintLoveTicket(depth, score, reason, practice);
    return true;
  }

  function finishLoveRun(reason) {
    if (!loveRun || loveRun.finished) return;
    loveRun.finished = true;
    if (loveRun.raf) cancelAnimationFrame(loveRun.raf);
    loveRun.raf = 0;
    loveRun.active = false;
    loveRun.dying = false;
    heating = false;
    focusCard("loveCard", false);
    $("loveStartRun").disabled = false;
    const holdDone = $("loveHold");
    if (holdDone) holdDone.disabled = true;
    paintLoveMode();
    const depth = loveRun.depth;
    const score = loveRun.score;
    const practice = reason === "practice";
    const souvenir = reason === "souvenir";
    if (!practice) {
      state.bestDepth = state.bestDepth || { love: 0 };
      state.bestDepth.love = Math.max(state.bestDepth.love || 0, depth);
      state.loveBest = Math.max(state.loveBest || 0, Math.round(loveRun.heatPeak || 0));
      state.loveStreak = depth;
      state.feverScore = (state.feverScore || 0) + depth;
      state.feverStars = (state.feverStars || 0) + Math.floor(depth / 3);
      if (depth > 0) {
        state.streak = (state.streak || 0) + 1;
        state.bestStreak = Math.max(state.bestStreak || 0, state.streak);
      } else {
        state.streak = 0;
      }
    }
    stashLastRun("love", {
      game: "love",
      gameId: "love",
      depth,
      score,
      deathReason: reason,
      cashedOut: practice || souvenir,
      at: Date.now(),
      meta: {
        reason,
        key: loveDeathKey(reason),
        subject: loveRun.subject,
        engine: loveRun.engine || "HoldBand",
        kind: (loveRun.spec && loveRun.spec.kind) || loveRun.engineKind || "",
        coda: !!loveRun.coda,
        authoredCount: LOVE_AUTHORED_COUNT,
        codaEnabled: loveCodaOn(),
      },
    });
    saveState(state);
    if (!practice) {
      closeLoveKitRun({
        depth,
        score,
        deathReason: reason,
        cashedOut: souvenir,
        meta: {
          reason,
          key: loveDeathKey(reason),
          subject: loveRun.subject,
          engine: loveRun.engine || "HoldBand",
          kind: (loveRun.spec && loveRun.spec.kind) || loveRun.engineKind || "",
          coda: !!loveRun.coda,
          authoredCount: LOVE_AUTHORED_COUNT,
          codaEnabled: loveCodaOn(),
        },
      });
    }

    const painted = paintLoveTicket(depth, score, reason, practice);
    if (!practice && depth >= 6) {
      grantCurio("sweet_heat", "guts");
      grantCurio("mercury_bead", "guts");
      renderCabinet();
    } else if (!practice && depth >= 3) {
      grantCurio("mercury_bead", "guts");
      renderCabinet();
    }
    showBanner(depth >= 1 || practice, painted.rank.toUpperCase(), `${painted.line} · ${painted.aura}`);
    refreshNightBoard();
    setAura(depth >= 3 || practice ? "celebrate" : "badLuck");
    if (!practice) {
      const want = "#cabinet/love/result";
      if (location.hash !== want) location.hash = want;
    }
  }

  /* Look Up, Darling — drifting sweet zone + staged sky */
  let lookupActive = false;
  let lookupPractice = false;
  let lookupHold = 0;
  let lookupRaf = null;
  let orientationHandler = null;
  let lookupZone = { lo: 62, hi: 78 };
  let lookupStartedAt = 0;

  function setLookup(pct) {
    const p = Math.max(0, Math.min(100, pct));
    const fill = $("lookupFill");
    if (!fill) return p;
    fill.style.width = `${p}%`;
    const sweet = document.querySelector(".lookup-sweet");
    if (sweet) {
      sweet.style.left = lookupZone.lo + "%";
      sweet.style.width = Math.max(6, lookupZone.hi - lookupZone.lo) + "%";
    }
    const inZone = p >= lookupZone.lo && p <= lookupZone.hi;
    $("lookupReadout").textContent =
      p < lookupZone.lo - 15 ? "flat" : p < lookupZone.lo ? "lifting…" : inZone ? "darling ↑" : "too far";
    if (inZone) setArt("lookupCabinetArt", VISUALS.lookup.rising);
    const bar = $("lookupHoldBar");
    if (bar) bar.style.width = `${Math.min(100, (lookupHold / 50) * 100)}%`;
    return p;
  }

  function driftLookupZone() {
    if (!lookupActive) return;
    const t = (Date.now() - lookupStartedAt) / 1000;
    // zone slowly narrows and drifts
    const width = Math.max(10, 16 - t * 0.35);
    const center = 70 + Math.sin(t / 1.8) * 8;
    lookupZone.lo = Math.max(40, center - width / 2);
    lookupZone.hi = Math.min(92, center + width / 2);
  }

  function endLookup(success, msg) {
    lookupActive = false;
    if (lookupRaf) cancelAnimationFrame(lookupRaf);
    if (orientationHandler) {
      window.removeEventListener("deviceorientation", orientationHandler);
      orientationHandler = null;
    }
    focusCard("lookupCard", false);
    $("lookupVerdict").hidden = false;
    $("lookupVerdict").textContent = msg;
    $("lookupStart").disabled = false;
    if (success) {
      setArt("lookupCabinetArt", VISUALS.lookup.success);
      grantCurio("gyro_ghost", "guts");
      renderCabinet();
      setAura("point");
      setTier("lookupTier", "SKY LOCKED", "perfect");
      award(50, true, "Look Up");
      showBanner(true, "SKY LOCKED", "Gyro ghost filed");
    } else {
      setArt("lookupCabinetArt", VISUALS.lookup.fail);
      setAura("badLuck");
      setTier("lookupTier", "SHY SKY", "miss");
      award(0, false, "Look Up miss");
      showBanner(false, "SHY SKY", msg);
    }
    refreshNightBoard();
  }

  function lookupTick() {
    if (!lookupActive) return;
    driftLookupZone();
    if (lookupPractice) {
      const t = (Date.now() / 900) % 5;
      const wave = t < 2.5 ? (t / 2.5) * 70 : ((5 - t) / 2.5) * 70;
      const p = setLookup(18 + wave);
      if (p >= lookupZone.lo && p <= lookupZone.hi) lookupHold += 1;
      else lookupHold = Math.max(0, lookupHold - 2);
      if (lookupHold > 50) {
        endLookup(true, "Practice sky locked. Gyro ghost filed.");
        $("lookupStatus").textContent = "Practice clear";
        return;
      }
    }
    lookupRaf = requestAnimationFrame(lookupTick);
  }

  /* SNAP Freeze — fake-outs, ms tiers, double exposure */
  let snapArmed = false;
  let snapTarget = 0;
  let snapTimer = null;
  let snapExpectReal = false;

  function armSnap() {
    // Pattern: countdown digits, optional fake "SNAP?", then real SNAP
    const useFake = Math.random() < 0.55;
    const words = useFake
      ? ["3", "2", "1", "SNAP?", "…", "SNAP"]
      : (Math.random() < 0.4 ? ["3", "2", "…", "1", "SNAP"] : ["3", "2", "1", "SNAP"]);
    let i = 0;
    $("snapCountdown").hidden = false;
    $("snapCountdown").classList.remove("is-fake", "is-real");
    $("snapPolaroid").hidden = true;
    $("snapFreeze").disabled = false;
    $("snapVerdict").hidden = true;
    const msEl = $("snapMs");
    if (msEl) msEl.hidden = true;
    const combo = $("snapCombo");
    if (combo) combo.hidden = true;
    setTier("snapTier", "", "");
    snapArmed = true;
    snapExpectReal = false;
    snapTarget = 0;
    focusCard("snapCard", true);
    setArt("snapCabinetArt", VISUALS.snap.countdown);
    const tempo = 480 + Math.floor(Math.random() * 320);
    const windowMs = 360 + Math.floor(Math.random() * 100);

    const beat = () => {
      if (!snapArmed) return;
      const word = words[i];
      $("snapCountdown").textContent = word;
      const isFake = word === "SNAP?";
      const isReal = word === "SNAP";
      $("snapCountdown").classList.toggle("is-fake", isFake);
      $("snapCountdown").classList.toggle("is-real", isReal);

      if (isFake) {
        setArt("snapCabinetArt", VISUALS.snap.flash);
        snapExpectReal = false;
        snapTarget = 0;
        i += 1;
        snapTimer = setTimeout(beat, tempo + 120);
        return;
      }

      if (isReal) {
        setArt("snapCabinetArt", VISUALS.snap.flash);
        snapExpectReal = true;
        snapTarget = performance.now();
        snapTimer = setTimeout(() => {
          if (!snapArmed) return;
          snapArmed = false;
          focusCard("snapCard", false);
          $("snapFreeze").disabled = true;
          $("snapVerdict").hidden = false;
          $("snapVerdict").textContent = "Missed the freeze — the moment walked off.";
          $("snapStatus").textContent = "Too late";
          setTier("snapTier", "LATE", "miss");
          setArt("snapCabinetArt", VISUALS.snap.late);
          setAura("badLuck");
          state.snapStreak = 0;
          award(0, false, "Missed SNAP");
          showBanner(false, "MISSED", "The moment walked off");
          $("snapStart").disabled = false;
          saveState(state);
          refreshNightBoard();
        }, windowMs);
        return;
      }

      i += 1;
      snapTimer = setTimeout(beat, tempo);
    };
    beat();
  }

  function freezeSnap() {
    if (!snapArmed) return;
    const now = performance.now();
    const word = $("snapCountdown").textContent;
    const delta = snapTarget ? now - snapTarget : null;
    snapArmed = false;
    clearTimeout(snapTimer);
    $("snapFreeze").disabled = true;
    $("snapStart").disabled = false;
    $("snapVerdict").hidden = false;
    $("snapCountdown").hidden = true;
    $("snapPolaroid").hidden = false;
    focusCard("snapCard", false);

    const msEl = $("snapMs");
    const combo = $("snapCombo");

    // Fake-out trap
    if (word === "SNAP?" || (word !== "SNAP" && !snapExpectReal)) {
      state.snapStreak = 0;
      $("snapPolaroidText").textContent = "fake-out";
      $("snapVerdict").textContent = "Gotcha — that wasn’t the real SNAP.";
      $("snapStatus").textContent = "Fake-out";
      setTier("snapTier", "FAKE-OUT", "miss");
      if (msEl) msEl.hidden = true;
      if (combo) combo.hidden = true;
      setArt("snapCabinetArt", VISUALS.snap.early);
      setAura("laugh");
      award(0, false, "Fake-out");
      showBanner(false, "FAKE-OUT", "Wait for the real SNAP");
      saveState(state);
      refreshNightBoard();
      return;
    }

    const perfect = word === "SNAP" && delta !== null && delta >= 0 && delta <= 150;
    const great = word === "SNAP" && delta !== null && delta > 150 && delta <= 280;
    const early = word !== "SNAP" || (delta !== null && delta < 0);

    if (msEl && delta !== null) {
      msEl.hidden = false;
      msEl.textContent = `${delta >= 0 ? "+" : ""}${Math.round(delta)} ms`;
    }

    if (perfect) {
      state.snapStreak = (state.snapStreak || 0) + 1;
      $("snapPolaroidText").textContent = "PERFECT SNAP";
      $("snapVerdict").textContent = "Frozen in glitter. Shutter click filed.";
      $("snapStatus").textContent = `On the money · streak ×${state.snapStreak}`;
      setTier("snapTier", "PERFECT", "perfect");
      grantCurio("shutter_click", "guts");
      renderCabinet();
      setArt("snapCabinetArt", VISUALS.snap.success);
      setAura("celebrate");
      let pts = 60 + Math.min(30, (state.snapStreak - 1) * 8);
      if (state.snapStreak >= 3 && !state._doubleExposure) {
        state._doubleExposure = true;
        pts += 50;
        if (combo) {
          combo.hidden = false;
          combo.textContent = "Double Exposure unlocked — bonus +50";
        }
        showBanner(true, "DOUBLE EXPOSURE", `${Math.round(delta)}ms · streak ×${state.snapStreak}`);
      } else {
        if (combo) {
          combo.hidden = false;
          combo.textContent = `SNAP streak ×${state.snapStreak}`;
        }
        showBanner(true, "PERFECT SNAP", `${Math.round(delta)}ms`);
      }
      award(pts, true, "SNAP");
    } else if (great) {
      state.snapStreak = (state.snapStreak || 0) + 1;
      $("snapPolaroidText").textContent = "SNAP!";
      $("snapVerdict").textContent = "Caught it — a blink late, still glamorous.";
      $("snapStatus").textContent = "Great timing";
      setTier("snapTier", "GREAT", "great");
      grantCurio("shutter_click", "guts");
      renderCabinet();
      setArt("snapCabinetArt", VISUALS.snap.success);
      setAura("celebrate");
      if (combo) {
        combo.hidden = false;
        combo.textContent = `SNAP streak ×${state.snapStreak}`;
      }
      award(35, true, "SNAP great");
      showBanner(true, "GREAT SNAP", `${Math.round(delta)}ms`);
    } else if (early) {
      state.snapStreak = 0;
      $("snapPolaroidText").textContent = "early…";
      $("snapVerdict").textContent = "A hair early — still charming. Try again.";
      $("snapStatus").textContent = "Slightly early";
      setTier("snapTier", "EARLY", "miss");
      if (combo) combo.hidden = true;
      setArt("snapCabinetArt", VISUALS.snap.early);
      setAura("badLuck");
      award(0, false, "Early SNAP");
      showBanner(false, "TOO EARLY", "Wait for the word");
    } else {
      state.snapStreak = 0;
      $("snapPolaroidText").textContent = "late";
      $("snapVerdict").textContent = "The SNAP already left the building.";
      $("snapStatus").textContent = "Late";
      setTier("snapTier", "LATE", "miss");
      if (combo) combo.hidden = true;
      setArt("snapCabinetArt", VISUALS.snap.late);
      setAura("badLuck");
      award(0, false, "Late SNAP");
      showBanner(false, "TOO LATE", "The moment walked off");
    }
    saveState(state);
    refreshNightBoard();
  }

  /* Whisper */
  function charmRarity(word) {
    const w = word.toLowerCase();
    const legendary = ["aura", "darwin", "forever", "mirror", "instapic"];
    const rare = ["sparkle", "brave", "kiss", "midnight", "fever", "heart", "crown"];
    if (legendary.includes(w)) return "legendary";
    if (rare.includes(w) || w.length >= 9) return "rare";
    if (Math.random() < 0.12) return "rare";
    return "common";
  }

  function renderCharmWall() {
    const wall = $("charmWall");
    if (!wall) return;
    const charms = state.charms || [];
    if (!charms.length) {
      wall.hidden = true;
      wall.innerHTML = "";
      return;
    }
    wall.hidden = false;
    wall.innerHTML = charms.slice(-12).map((c) =>
      `<span class="charm-ribbon rarity-${c.rarity}" title="${c.rarity}">${c.word}</span>`
    ).join("");
  }

  function makeCharm() {
    const raw = ($("whisperWord").value || "").trim();
    if (!raw) {
      $("whisperStatus").textContent = "One word, darling.";
      return;
    }
    if (!spendDemoCoin("whisper")) {
      $("whisperStatus").textContent = "Need a penny · buy more at Aura’s ticket booth";
      refreshNightBoard();
      return;
    }
    const word = raw.split(/\s+/)[0].slice(0, 24);
    const rarity = charmRarity(word);
    const line = CHARM_LINES[Math.floor(Math.random() * CHARM_LINES.length)](word);
    focusCard("whisperCard", true);
    setArt("whisperCabinetArt", VISUALS.whisper.glow);
    setAura("think");
    $("whisperStatus").textContent = "Ticket entering…";
    $("charmCard").hidden = true;
    setTimeout(() => {
      $("whisperStatus").textContent = "Machinery glowing…";
      setTimeout(() => {
        $("charmWord").textContent = word;
        $("charmLine").textContent = line;
        $("charmCard").hidden = false;
        $("charmCard").className = "charm-card rarity-" + rarity;
        const rareEl = $("charmRarity");
        if (rareEl) {
          rareEl.hidden = false;
          rareEl.textContent = rarity.toUpperCase();
          rareEl.className = "tier-pill tier-" + (rarity === "legendary" ? "perfect" : rarity === "rare" ? "great" : "miss");
        }
        $("whisperStatus").textContent = "Charm sealed · " + rarity;
        grantCurio("whisper_charm", "alley");
        state.charms = (state.charms || []).concat([{ word, rarity, at: Date.now() }]);
        saveState(state);
        renderCabinet();
        renderCharmWall();
        setArt("whisperCabinetArt", VISUALS.whisper.result);
        setAura("give");
        $("auraLine").textContent = `I kept “${word}” (${rarity}) for the Cabinet.`;
        const pts = rarity === "legendary" ? 80 : rarity === "rare" ? 55 : 35;
        award(pts, true, "Whisper " + rarity);
        showBanner(true, rarity.toUpperCase() + " CHARM", word);
        focusCard("whisperCard", false);
        refreshNightBoard();
      }, 700);
    }, 550);
  }

  function copyChallenge() {
    const ticket = loveLastTicket();
    const depth = ticket
      ? ticket.depth | 0
      : ((state.bestDepth && state.bestDepth.love) || 0);
    const text = loveChallengeLine(depth);
    const done = () => {
      $("loveStatus").textContent = "Copied — send it";
      const copied = $("loveCopied");
      if (copied) copied.hidden = false;
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => {
        $("loveStatus").textContent = text;
      });
    } else {
      $("loveStatus").textContent = text;
    }
  }


  function refreshPackUi() {
    const pack = $("pennyPack");
    const mint = $("mintPack");
    const status = $("packStatus");
    if (!pack && !mint && !status) return;
    const used = state.packDay === darwinDay();
    if (used && state.lastPack && state.lastPack.length) {
      if (pack) pack.hidden = false;
      state.lastPack.forEach((label, i) => {
        const el = $("penny" + i);
        if (el) el.textContent = label;
      });
      if (mint) mint.disabled = true;
      if (status) status.textContent = "Pack minted for this Darwin evening (demo)";
    } else {
      if (pack) pack.hidden = true;
      if (mint) mint.disabled = false;
      if (status) status.textContent = "Three pennies · one pack per Darwin evening (demo)";
    }
  }

  function mintPack() {
    if (state.packDay === darwinDay()) {
      refreshPackUi();
      return;
    }
    const pool = PENNY_FACES.slice();
    const picks = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(idx, 1)[0]);
    }
    state.packDay = darwinDay();
    state.lastPack = picks;
    grantCurio("pressed_heart", "alley");
    saveState(state);
    picks.forEach((label, i) => {
      const el = $("penny" + i);
      if (el) el.textContent = label;
    });
    $("pennyPack").hidden = false;
    $("mintPack").disabled = true;
    $("packStatus").textContent = "Soft metal cooled · pressed heart filed";
    $("auraLine").textContent = "Three pennies. Pocket them before the lights dim.";
    setAura("point");
    renderCabinet();
    refreshPackUi();
  }

  /* Wire UI */


  /* Marquee Match — Simon-style bulbs */
  let marqueeBusy = false;

  function marqueeSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function marqueePlaySeq(seq) {
    const bulbs = [...document.querySelectorAll("#marqueeBoard .bulb")];
    if (!bulbs.length) return;
    bulbs.forEach((b) => { b.disabled = true; b.classList.remove("on"); });
    for (const idx of seq) {
      const b = bulbs[idx];
      if (!b) continue;
      b.classList.add("on", "flash");
      await marqueeSleep(400);
      b.classList.remove("on", "flash");
      await marqueeSleep(160);
    }
  }

  async function startMarquee() {
    if (marqueeBusy) return;
    const startBtn = $("marqueeStart");
    const status = $("marqueeStatus");
    const bulbs = [...document.querySelectorAll("#marqueeBoard .bulb")];
    // Live Boardwalk Lights uses #marqueeGo + canvas. Do not hijack that
    // ride button with this leftover Simon-bulb flow.
    if (!startBtn || bulbs.length < 1) return;
    if (!spendDemoCoin("marquee")) {
      if (status) status.textContent = "Need a penny · buy more at Aura’s ticket booth";
      refreshNightBoard();
      return;
    }
    marqueeBusy = true;
    focusCard("marqueeCard", true);
    setTier("marqueeTier", "", "");
    startBtn.disabled = true;
    const len = 3 + Math.floor(Math.random() * 3); // 3–5
    const seq = Array.from({ length: len }, () => Math.floor(Math.random() * 6));
    if (status) status.textContent = "Watch the marquee…";
    await marqueePlaySeq(seq);
    let progress = 0;
    bulbs.forEach((b) => { b.disabled = false; });
    if (status) status.textContent = "Your turn — tap the pattern";

    const onTap = (ev) => {
      const btn = ev.currentTarget;
      const idx = Number(btn.getAttribute("data-bulb"));
      btn.classList.add("on", "flash");
      setTimeout(() => btn.classList.remove("on", "flash"), 280);
      if (idx !== seq[progress]) {
        cleanup(false);
        return;
      }
      progress += 1;
      if (progress >= seq.length) cleanup(true);
    };

    const cleanup = (ok) => {
      bulbs.forEach((b) => {
        b.disabled = true;
        b.removeEventListener("click", onTap);
      });
      marqueeBusy = false;
      startBtn.disabled = false;
      focusCard("marqueeCard", false);
      if (ok) {
        setTier("marqueeTier", "LIT", "perfect");
        if (status) status.textContent = "Marquee sings — bulb filed";
        grantCurio("marquee_bulb", "guts");
        renderCabinet();
        award(20 + len * 8, true, "Marquee");
        showBanner(true, "MARQUEE LIT", `${len} bulbs`);
        setAura("celebrate");
      } else {
        setTier("marqueeTier", "FIZZLED", "miss");
        if (status) status.textContent = "Pattern broken — try again";
        award(0, false, "Marquee miss");
        showBanner(false, "FIZZLED", "Watch closer");
        setAura("badLuck");
      }
      refreshNightBoard();
    };

    bulbs.forEach((b) => b.addEventListener("click", onTap));
  }

  /* Asset map — Codex updates assets/asset-map.json AND this embed, or replaces files at src paths */
  const ASSET_MAP = {
  "version": 1,
  "note": "Codex may point src to prepared files; keep keys stable.",
  "assets": {
    "whisper_cabinet": {
      "src": "assets/prepared/whisper-cabinet.webp",
      "kind": "still",
      "priority": "P1",
      "location": "whisperCard"
    },
    "love_thermometer_cabinet": {
      "src": "assets/prepared/love-thermometer-tease.webp",
      "kind": "still",
      "priority": "P1",
      "location": "loveCard"
    },
    "fortune_mailbox": {
      "src": "assets/prepared/fortune-mailbox.webp",
      "kind": "still",
      "priority": "P2",
      "location": "fortuneCard"
    },
    "door_beckon": {
      "src": "assets/restyle/paper-aura-seated.png",
      "kind": "still",
      "priority": "P1",
      "location": "discoveryDoor"
    },
    "ticket_booth": {
      "src": "assets/prepared/ticket-booth-lean.webp",
      "kind": "still",
      "priority": "P2",
      "location": "foyer"
    },
    "snap_stage": {
      "src": "assets/prepared/snap-freeze-flash.webp",
      "kind": "still",
      "priority": "P2",
      "location": "snapCard"
    },
    "showman_pass": {
      "src": "assets/prepared/showmans-pass.webp",
      "kind": "still",
      "priority": "P3",
      "location": "passCard"
    },
    "lookup_sky": {
      "src": "assets/restyle/scene-turnarounds-2026-09-09/stalls/lookup/front.png",
      "kind": "still",
      "priority": "P2",
      "location": "lookupCard"
    },
    "foyer_hall": {
      "src": "assets/restyle/maps/sideshow-alley-map.webp",
      "kind": "still",
      "priority": "P1",
      "location": "arcadeHall"
    },
    "welcome_proprietor": {
      "src": "assets/restyle/paper-aura-seated.png",
      "kind": "still",
      "priority": "P1",
      "location": "auraPortrait"
    },
    "ball_toss_board": {
      "src": "assets/prepared/ball-toss-board.webp",
      "kind": "still",
      "priority": "P2",
      "location": "ballTossCard"
    },
    "coin_pusher_shelf": {
      "src": "assets/prepared/coin-pusher-greed.webp",
      "kind": "still",
      "priority": "P2",
      "location": "pusherCard"
    },
    "pinball_backglass": {
      "src": "assets/prepared/pinball-neon-playfield.webp",
      "kind": "still",
      "priority": "P2",
      "location": "pinballCard"
    },
    "water_gun_duel": {
      "src": "assets/prepared/water-gun-duel.webp",
      "kind": "still",
      "priority": "P2",
      "location": "waterGunCard"
    },
    "mutoscope_hood": {
      "src": "assets/prepared/mutoscope-peephole-glow.webp",
      "kind": "still",
      "priority": "P2",
      "location": "mutoscopeCard"
    }
  }
};

  function applyAssetMap() {
    const assets = (ASSET_MAP && ASSET_MAP.assets) || {};
    document.querySelectorAll("[data-asset]").forEach((el) => {
      if (el.getAttribute("data-live-art") === "1") return; // game state art owns these
      const id = el.getAttribute("data-asset");
      const entry = assets[id];
      if (entry && entry.src) {
        if (el.tagName === "IMG" && el.getAttribute("src") !== entry.src) {
          el.setAttribute("src", entry.src);
        }
      }
      const wrap = el.closest(".card-hero, .timber-panel");
      if (wrap && entry && String(entry.src).includes("placeholders/")) {
        if (!wrap.querySelector(".placeholder-badge")) {
          const b = document.createElement("span");
          b.className = "placeholder-badge";
          b.textContent = "placeholder · " + id;
          wrap.appendChild(b);
        }
      }
    });
  }

  function setupAlleyWalk() {
    const path = document.querySelector(".hall-perspective");
    const doors = path ? [...path.querySelectorAll(":scope > .cabinet-door")] : [];
    const depth = $("alleyWalkDepth");
    const fill = $("alleyWalkFill");
    const nearest = $("alleyNearestTent");
    const deeper = $("alleyWalkDeeper");
    const districtButtons = [...document.querySelectorAll("[data-alley-jump]")];
    if (!doors.length || !depth || !fill || !nearest || !deeper) return;

    let current = -1;
    const paint = (index) => {
      current = Math.max(0, Math.min(doors.length - 1, index));
      doors.forEach((door, i) => {
        door.classList.toggle("alley-current", i === current);
        door.classList.toggle("alley-passed", i < current);
      });
      const title = doors[current].querySelector(".door-plaque strong");
      const progress = doors.length > 1 ? current / (doors.length - 1) : 0;
      depth.textContent = `ALLEY · ${(current + 1) * 12} PACES`;
      fill.style.width = `${Math.round(progress * 100)}%`;
      nearest.textContent = title ? title.textContent : "Unknown canvas flap";
      deeper.textContent = current >= doors.length - 1 ? "Back to gate ↑" : "Walk deeper ↓";
      districtButtons.forEach((button, i) => {
        const start = Number(button.getAttribute("data-alley-jump"));
        const next = districtButtons[i + 1];
        const end = next ? Number(next.getAttribute("data-alley-jump")) : doors.length;
        if (current >= start && current < end) button.setAttribute("aria-current", "location");
        else button.removeAttribute("aria-current");
      });
      const motion = $("alleyMotion");
      if (motion) {
        motion.style.objectPosition = `center ${Math.round(30 + progress * 48)}%`;
        motion.style.filter = `saturate(${(1.08 + progress * 0.28).toFixed(2)}) contrast(1.08) brightness(${(0.92 + progress * 0.16).toFixed(2)})`;
      }
    };

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => Math.abs(a.boundingClientRect.top - innerHeight * 0.46) - Math.abs(b.boundingClientRect.top - innerHeight * 0.46));
        if (visible[0]) paint(doors.indexOf(visible[0].target));
      }, { rootMargin: "-28% 0px -42% 0px", threshold: [0.05, 0.35, 0.7] });
      doors.forEach((door) => observer.observe(door));
    }

    deeper.addEventListener("click", () => {
      const next = current < 0 || current >= doors.length - 1 ? 0 : current + 1;
      doors[next].scrollIntoView({ behavior: "smooth", block: "center" });
      paint(next);
    });
  }

  function bind() {
    hideLegacyDom();
    document.querySelectorAll("[data-enter]").forEach((button) => {
      button.addEventListener("click", () => approachTent(button));
    });
    document.querySelectorAll("[data-back-arcade]").forEach((button) => {
      button.addEventListener("click", goArcade);
    });
    setupAlleyWalk();
    document.querySelectorAll("[data-alley-jump]").forEach((button) => {
      button.addEventListener("click", () => {
        const doors = Array.from(document.querySelectorAll(".hall-perspective > .cabinet-door"));
        const index = Number(button.getAttribute("data-alley-jump"));
        const target = doors[index];
        if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
    const soundButton = $("carnivalSound");
    if (soundButton) soundButton.addEventListener("click", toggleCarnivalSound);
    document.addEventListener("pointerdown", (event) => {
      const button = event.target.closest("button");
      if (!button || button === soundButton || button.closest(".cabinet-door")) return;
      soundTone(button.classList.contains("ticket-button") ? 330 : 220, 0.085, 0.012, 0);
    });

    const takeTicket = $("takeTicket");
    const giveTicket = $("giveTicket");
    function paintAdmitDesk() {
      const idle = $("admitIdle");
      const hold = $("admitHold");
      const done = $("admitDone");
      if (!idle || !hold) return;
      const stub = $("admitStub");
      const laps = Number(state.alleyLaps) || 0;
      if (state.admitPassed || laps > 0) {
        idle.hidden = true;
        hold.hidden = false;
        if (stub) stub.hidden = true;
        if (done) {
          done.hidden = false;
          done.textContent = "“That’s the one. In you go.”";
        }
        if (giveTicket) giveTicket.textContent = "Enter Sideshow Alley";
        return;
      }
      if (stub) stub.hidden = false;
      idle.hidden = !!state.admitTicket;
      hold.hidden = !state.admitTicket;
      if (done) done.hidden = true;
      if (giveTicket) giveTicket.textContent = "Walk to Aura at the door";
    }
    paintAdmitDesk();
    if (takeTicket) {
      takeTicket.addEventListener("click", () => {
        if ((Number(state.alleyLaps) || 0) > 0) return;
        state.admitTicket = true;
        saveState(state);
        paintAdmitDesk();
        const w = $("doorWhisper");
        if (w) w.textContent = "“That’s the stub. Find me at the palace door — I don’t let anyone past without it.”";
        const art = $("doorStageArt");
        if (art) art.src = "assets/restyle/paper-aura-seated.png";
      });
    }
    if (giveTicket) {
      giveTicket.addEventListener("click", () => {
        if (!state.admitTicket && !state.admitPassed && !(Number(state.alleyLaps) || 0)) return;
        showFoyer(false);
      });
    }
    if ($("leaveArcade")) $("leaveArcade").addEventListener("click", () => { location.hash = "door"; });
    if ($("startFortune")) $("startFortune").addEventListener("click", () => {
      if (state.fortuneDay === darwinDay()) return;
      setArt("fortuneCabinetArt", VISUALS.fortune.think);
      setAura("think");
      $("fortuneIdle").hidden = true;
      $("fortuneForm").hidden = false;
      $("fortuneResult").hidden = true;
    });
    if ($("cancelFortune")) $("cancelFortune").addEventListener("click", () => {
      setArt("fortuneCabinetArt", VISUALS.fortune.idle);
      setAura("welcome");
      $("fortuneForm").hidden = true;
      $("fortuneIdle").hidden = false;
    });
    if ($("fortuneForm")) $("fortuneForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData($("fortuneForm"));
      dealFortune(fd.get("mood"), fd.get("colour"), fd.get("company"));
    });
    if ($("fortuneAgainHint")) $("fortuneAgainHint").addEventListener("click", () => {
      $("fortuneResult").hidden = true;
      refreshFortuneUi();
    });

    const holdBtn = $("loveHold") || $("holdBtn");
    const holdZone = $("loveHoldZone") || $("holdBtn") || holdBtn;
    declareLoveP0();
    patchLoveRunKit();
    setTimeout(() => { declareLoveP0(); patchLoveRunKit(); }, 0);
    const beginHold = (e) => {
      if (!loveRun || !loveRun.active || loveRun.dying) return;
      if (holdBtn && holdBtn.disabled) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      heating = true;
      loveRun.heldOnce = true;
      if (loveRun.holdBand && typeof loveRun.holdBand.hold === "function") loveRun.holdBand.hold(true);
    };
    const endHold = (e) => {
      if (e) e.preventDefault();
      heating = false;
      if (loveRun && loveRun.holdBand && typeof loveRun.holdBand.hold === "function") loveRun.holdBand.hold(false);
    };
    if ($("loveStartRun")) $("loveStartRun").addEventListener("click", startLoveRun);
    const practiceBox = $("lovePractice");
    if (practiceBox) practiceBox.addEventListener("change", paintLoveMode);
    paintLoveMode();
    if (holdZone) {
      holdZone.addEventListener("pointerdown", beginHold);
      holdZone.addEventListener("pointerup", endHold);
      holdZone.addEventListener("pointercancel", endHold);
      holdZone.addEventListener("lostpointercapture", endHold);
    }
    if ($("loveChallenge")) $("loveChallenge").addEventListener("click", copyChallenge);
    if ($("marqueeStart")) $("marqueeStart").addEventListener("click", () => { startMarquee(); });

    const lookupOwned = vendorMods.some((v) => v.id === "lookup");
    if ($("lookupStart") && !lookupOwned) $("lookupStart").addEventListener("click", async () => {
      if (!spendDemoCoin("lookup")) {
        $("lookupStatus").textContent = "Need a penny · buy more at Aura’s ticket booth";
        return;
      }
      $("lookupVerdict").hidden = true;
      $("lookupStart").disabled = true;
      lookupHold = 0;
      lookupActive = true;
      lookupPractice = true;
      setArt("lookupCabinetArt", VISUALS.lookup.rising);
      $("lookupStatus").textContent = "Practice mode · hold the pink zone";

      if (window.DeviceOrientationEvent) {
        try {
          if (typeof DeviceOrientationEvent.requestPermission === "function") {
            const perm = await DeviceOrientationEvent.requestPermission();
            if (perm === "granted") lookupPractice = false;
          } else {
            lookupPractice = false;
          }
        } catch {
          lookupPractice = true;
        }
        if (!lookupPractice) {
          $("lookupStatus").textContent = "Tip up into the sweet zone";
          orientationHandler = (ev) => {
            if (!lookupActive) return;
            const beta = ev.beta; // front-back tilt
            // ~0 flat, ~90 upright toward sky-ish depending on hold
            const pct = Math.max(0, Math.min(100, ((beta || 0) / 90) * 100));
            driftLookupZone();
            const p = setLookup(pct);
            if (p >= lookupZone.lo && p <= lookupZone.hi) lookupHold += 1;
            else lookupHold = Math.max(0, lookupHold - 1);
            if (lookupHold > 50) {
              endLookup(true, "Sky locked. Gyro ghost filed.");
              $("lookupStatus").textContent = "Sweet zone held";
            }
          };
          window.addEventListener("deviceorientation", orientationHandler);
        }
      }
      lookupTick();
      // safety timeout
      setTimeout(() => {
        if (lookupActive) {
          endLookup(false, "Time’s up — the sky got shy. Try again.");
          $("lookupStatus").textContent = "Timed out";
        }
      }, 12000);
    });

    const snapOwnedByVendor = vendorMods.some((v) => v.id === "snap");
    if (!snapOwnedByVendor) {
      if ($("snapStart")) $("snapStart").addEventListener("click", () => {
        if (!spendDemoCoin("snap")) {
          $("snapStatus").textContent = "Need a penny · buy more at Aura’s ticket booth";
          return;
        }
        $("snapStart").disabled = true;
        $("snapStatus").textContent = "Armed…";
        setArt("snapCabinetArt", VISUALS.snap.idle);
        armSnap();
      });
      if ($("snapFreeze")) $("snapFreeze").addEventListener("click", freezeSnap);
    }

    if ($("whisperGo")) $("whisperGo").addEventListener("click", makeCharm);

    if ($("mintPack")) $("mintPack").addEventListener("click", mintPack);

    if ($("demoPass")) $("demoPass").addEventListener("click", () => {
      state.showmanPass = true;
      state.passDay = darwinDay();
      grantCurio("showman_ribbon", "alley");
      grantCurio("coin_slot", "guts");
      saveState(state);
      refreshPassUi();
      renderCabinet();
      setArt("passArt", VISUALS.pass.stamped);
      const line = $("auraLine");
      if (line) line.textContent = "Showman’s Pass (demo). Soft plays until midnight Darwin.";
      setAura("celebrate");
    });

    $("devReset").addEventListener("click", () => {
      abortLoveRun();
      localStorage.removeItem(STORAGE_KEY);
      state = loadState();
      setMercury(0);
      $("charmCard").hidden = true;
      $("loveVerdict").hidden = true;
      hideLoveResult();
      if ($("lookupVerdict")) $("lookupVerdict").hidden = true;
      $("snapVerdict").hidden = true;
      eachVendor(applyVendorDefaults);
      eachVendor((mod) => { if (mod.onReset) mod.onReset(); });
      $("fortuneForm").reset();
      setAura("welcome");
      $("auraLine").textContent =
        "Welcome to my crooked little boardwalk. Your first fortune is free each day; every other tent takes one pretend penny while the till is sleeping.";
      renderCabinet();
      refreshFortuneUi();
      refreshPassUi();
      refreshPackUi();
      $("fortuneStatus").textContent = "Local stubs cleared";
      setArt("fortuneCabinetArt", VISUALS.fortune.idle);
      setArt("loveCabinetArt", VISUALS.love.cold);
      setArt("lookupCabinetArt", VISUALS.lookup.idle);
      setArt("snapCabinetArt", VISUALS.snap.idle);
      setArt("whisperCabinetArt", VISUALS.whisper.idle);
      setArt("passArt", VISUALS.pass.idle);
      paintLoveMode();
      refreshNightBoard();
    });

    eachVendor((mod) => { if (mod.bind) mod.bind(); });
    coreBound = true;
    applyAssetMap();
    window.addEventListener("hashchange", routeFromHash);
    window.addEventListener("pagehide", () => closeActiveRoom(""));
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) routeFromHash();
    });
    setAura("welcome");
    setArt("fortuneCabinetArt", VISUALS.fortune.idle);
    setArt("loveCabinetArt", VISUALS.love.cold);
    setArt("lookupCabinetArt", VISUALS.lookup.idle);
    setArt("snapCabinetArt", VISUALS.snap.idle);
    setArt("whisperCabinetArt", VISUALS.whisper.idle);
    setArt("passArt", VISUALS.pass.idle);
    routeFromHash();
  }

  window.PennyFever = {
    registerVendor,
    addRoomCleanup,
    enter: enterCabinet,
    enterTent,
    backToAlley: goArcade,
    getState: () => state,
    saveState: () => saveState(state),
    takeAdmitTicket() {
      if ((Number(state.alleyLaps) || 0) > 0) return false;
      state.admitTicket = true;
      saveState(state);
      return true;
    },
    passAdmitTicket() {
      state.admitTicket = false;
      state.admitPassed = true;
      state.alleyLaps = (Number(state.alleyLaps) || 0) + 1;
      saveState(state);
    },
    admitAlleyLap(kind) {
      if (state.admitPassed) return true;
      const laps = Number(state.alleyLaps) || 0;
      if (laps === 0) {
        this.passAdmitTicket();
        return true;
      }
      if (!spendPennies(1)) return false;
      state.admitPassed = true;
      state.alleyLaps = laps + 1;
      saveState(state);
      refreshNightBoard();
      return true;
    },
    endAlleyLap() {
      state.admitPassed = false;
      saveState(state);
    },
    hasAdmitTicket: () => !!state.admitTicket,
    ticketPassed: () => !!state.admitPassed,
    pennies,
    tickets,
    spendDemoCoin,
    spendPennies,
    spendTicket,
    addDemoCoins,
    addTickets,
    stampKeepsake,
    buyPennyRoll,
    buyTicketStrip,
    cashTicketForPennies,
    tradePenniesForTicket,
    pennyRoll: PENNY_ROLL,
    ticketStrip: TICKET_STRIP,
    pennyStack: PENNY_STACK,
    cashInCompletedPlays,
    award,
    showBanner,
    setTier,
    focusCard,
    setAura,
    refreshNightBoard,
    refreshDepth: refreshDepthReadouts,
    $,
    loveHeat: {
      engine: "HoldBand",
      displayName: "Love Thermometer",
      depthUnit: "Heat Stage",
      codaEnabled: LOVE_CODA_ENABLED,
      authoredCount: LOVE_AUTHORED_COUNT,
      levels: LOVE_LEVELS,
      stageParams: holdBandStageParams,
      holdBandStageParams,
      loveStageParams,
      codaParams: loveCodaParams,
      aura: LOVE_AURA,
      kinds: LOVE_UNIQUE_KINDS.slice(),
      uniqueRooms: true,
      feel: "GOBLIN_P0_AUTHORED_ACCEPT_FEEL.md L1–L6",
      verbs: {
        solid: "HOLD",
        sine: "RIDE THE SINE",
        splitMidClear: "THE BAND SPLITS",
        twinAlternate: "ALTERNATE",
        ghostEither: "EITHER COUNTS",
        liarFlash: "FLASH IS A LIE",
        ghostPoison: "GHOST KILLS",
        livingShrink: "LIVING SHRINK",
      },
      uniqueVerbs: LOVE_UNIQUE_VERBS.slice(),
      parkUntilHold: true,
      sheet: "GOBLIN_LOVE_HEAT_RUN.md",
      authoredSheet: "GOBLIN_AUTHORED_LEVELS_P0.md",
      mount: "HoldBand.mount(root, { stageParams: holdBandStageParams }, runCtx)",
    },
  };

  function livePaperFrame() {
    return document.querySelector(".cabinet-interior.paper-game-cabinet:not([hidden]) iframe.paper-game-frame");
  }
  function installConstructionLoan() {
    const btn = document.getElementById("pfBankLoan");
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = "1";
      btn.addEventListener("click", () => {
        const n = addDemoCoins(100);
        btn.textContent = "Bank loan · +" + n + " · now " + pennies();
      });
    }
    const rest = document.getElementById("pfRestGame");
    if (!rest || rest.dataset.bound) return;
    rest.dataset.bound = "1";
    rest.addEventListener("click", () => {
      const frame = livePaperFrame();
      if (frame && frame.contentWindow) {
        const waking = rest.classList.contains("is-resting");
        frame.contentWindow.postMessage({
          channel: "pf-paper-world",
          type: waking ? "resume" : "pause",
        }, location.origin);
        rest.classList.toggle("is-resting", !waking);
        rest.textContent = waking ? "Rest game" : "Wake game";
        return;
      }
      const world = window.PennyFeverWorld;
      if (world && world.started) {
        if (world.paused) {
          world.resume();
          rest.classList.remove("is-resting");
          rest.textContent = "Rest game";
        } else {
          world.pause();
          rest.classList.add("is-resting");
          rest.textContent = "Wake game";
        }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { bind(); installConstructionLoan(); });
  } else {
    setTimeout(() => { bind(); installConstructionLoan(); }, 0);
  }
})();
