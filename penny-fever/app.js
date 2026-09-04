(() => {
  "use strict";

  const STORAGE_KEY = "pennyFever.v1";
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
      text: "The arcade keeps a seat warm for the curious.",
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
    "Mirror Crew",
    "Darwin dusk",
    "Whisper",
    "Marquee",
    "Pressed ♥",
    "Coin slot",
  ];

  const CHALK = [
    "Try One Fortune. Leave with a stub.",
    "Hold Sweet Heat. Don’t boil over.",
    "Look up, darling — the sky is a button.",
    "SNAP on the word, not the nerves.",
    "Whisper one kind word into the booth.",
    "Incomplete shelves itch. Feed them.",
    "Streaks pay better. Don’t break the night.",
    "Expert Love Thermometer moves the pink band.",
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
      return { ...defaultState(), ...s, curios: { ...defaultState().curios, ...(s.curios || {}) } };
    } catch {
      return defaultState();
    }
  }

  function defaultState() {
    return {
      fortuneDay: null,
      lastFortune: null,
      curios: {},
      demoCoins: 99,
      showmanPass: false,
      passDay: null,
      plays: { love: 0, lookup: 0, snap: 0, whisper: 0 },
      packDay: null,
      lastPack: null,
      feverScore: 0,
      streak: 0,
      bestStreak: 0,
      loveStreak: 0,
      snapStreak: 0,
      scoreDay: null,
      _alleyBonus: false,
      _gutsBonus: false,
    };
  }

  function saveState(s) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }

  let state = loadState();

  const $ = (id) => document.getElementById(id);

  const GAME_ASSET = "assets/game/";
  const VISUALS = {
    aura: {
      welcome: "Aura_Reactions/Welcoming.webp",
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
      cold: "Love_Thermometer_States/Cold.webp",
      sweet: "Love_Thermometer_States/Sweet_Heat.webp",
      boil: "Love_Thermometer_States/Boil_Over.webp",
    },
    lookup: {
      idle: "Look_Up_Darling/Asleep.webp",
      rising: "Look_Up_Darling/Needle_Rising.webp",
      success: "Look_Up_Darling/Sky_Reveal.webp",
      fail: "Look_Up_Darling/Failure_Shoes.webp",
    },
    snap: {
      idle: "SNAP_Freeze/Ready.webp",
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
    if (el && relative) el.src = artPath(relative);
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
    if (s >= 400) return "★★★";
    if (s >= 200) return "★★☆";
    if (s >= 80) return "★☆☆";
    return "☆☆☆";
  }

  function refreshNightBoard() {
    ensureScoreDay();
    const fs = $("feverScore");
    if (!fs) return;
    fs.textContent = String(state.feverScore || 0);
    $("feverStreak").textContent = String(state.streak || 0);
    $("feverStars").textContent = starString();
    $("feverCoins").textContent = String(state.demoCoins);
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
        const scrollMap = {
          ticket_stub: "fortuneCard",
          lucky_match: "fortuneCard",
          mirror_shard: "fortuneCard",
          marquee_bulb: "fortuneCard",
          whisper_charm: "whisperCard",
          pressed_heart: "packCard",
          showman_ribbon: "passCard",
          coin_slot: "passCard",
          mercury_bead: "loveCard",
          sweet_heat: "loveCard",
          gyro_ghost: "lookupCard",
          shutter_click: "snapCard",
        };
        const target = $(scrollMap[id] || "");
        if (target && !filled) {
          target.classList.add("cabinet-nudge");
          target.scrollIntoView({ behavior: "smooth", block: "nearest" });
          setTimeout(() => target.classList.remove("cabinet-nudge"), 1600);
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
      if (alleyDone) bits.push("Alley complete — Mirror Crew peeks harder");
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
    if (state.showmanPass) {
      st.textContent = "Showman’s Pass active until midnight Darwin (demo)";
      $("demoPass").disabled = true;
      setArt("passArt", VISUALS.pass.stamped);
    } else {
      st.textContent = "No Square connected · demo unlock for testing";
      $("demoPass").disabled = false;
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

  function setChalk() {
    const i = Math.floor(Date.now() / 86400000) % CHALK.length;
    $("chalkText").textContent = CHALK[i];
  }

  function showFoyer(fromHash) {
    $("discoveryDoor").hidden = true;
    $("foyer").hidden = false;
    if (!fromHash) history.replaceState(null, "", "#foyer");
    $("foyerTitle").focus();
    setChalk();
    renderCabinet();
    refreshFortuneUi();
    refreshPassUi();
    refreshPackUi();
    resetCabinetArt();
    refreshNightBoard();
    const ban = $("resultBanner");
    if (ban) ban.hidden = true;
  }

  function showDoor() {
    $("foyer").hidden = true;
    $("discoveryDoor").hidden = false;
    history.replaceState(null, "", location.pathname + location.search);
  }

  function refreshFortuneUi() {
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
      $("fortuneStatus").textContent = "One free reading each Darwin day";
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

  /* Love Thermometer */
  let heat = 0;
  let heating = false;
  let heatRaf = null;

  function setMercury(v) {
    heat = Math.max(0, Math.min(100, v));
    $("mercury").style.height = `${8 + heat * 0.84}%`;
    $("thermoReadout").textContent = `${Math.round(40 + heat * 0.6)}°`;
    setArt("loveCabinetArt", heat > 80 ? VISUALS.love.boil : heat >= 50 ? VISUALS.love.sweet : VISUALS.love.cold);
  }

  function stopHeat(release) {
    heating = false;
    if (heatRaf) cancelAnimationFrame(heatRaf);
    heatRaf = null;
    focusCard("loveCard", false);
    const band = document.querySelector(".sweet-band");
    if (band) band.classList.remove("moving");
    if (!release) return;
    const subject = ($("loveSubject").value || "someone mysterious").trim();
    // tighter window when on a love streak
    const tight = (state.loveStreak || 0) >= 2;
    const lo = tight ? 60 : 56;
    const hi = tight ? 70 : 74;
    const inSweet = heat >= lo && heat <= hi;
    const near = heat >= lo - 8 && heat <= hi + 8;
    $("loveVerdict").hidden = false;
    const combo = $("loveCombo");
    if (inSweet) {
      state.loveStreak = (state.loveStreak || 0) + 1;
      const pts = 55 + Math.min(30, (state.loveStreak - 1) * 10);
      $("loveVerdict").textContent = `Sweet Heat — ${subject} registers as delightfully dangerous.`;
      grantCurio("sweet_heat", "guts");
      grantCurio("mercury_bead", "guts");
      $("loveStatus").textContent = tight ? "Expert band · curios filed" : "Perfect release · curios filed";
      setTier("loveTier", state.loveStreak >= 3 ? "ON FIRE" : "PERFECT", "perfect");
      if (combo) { combo.hidden = false; combo.textContent = `Love streak ×${state.loveStreak}`; }
      setAura("celebrate");
      award(pts, true, "Sweet Heat");
      showBanner(true, "SWEET HEAT", `${subject} · streak ×${state.loveStreak}`);
    } else if (near) {
      state.loveStreak = 0;
      $("loveVerdict").textContent = `Warm… almost. ${subject} needs another coin of courage.`;
      $("loveStatus").textContent = "Close — try the pink band";
      setTier("loveTier", "SO CLOSE", "great");
      if (combo) combo.hidden = true;
      award(15, true, "Almost");
      showBanner(true, "SO CLOSE", "One more coin of courage");
      setAura("think");
    } else if (heat > 80) {
      state.loveStreak = 0;
      $("loveVerdict").textContent = `Boiled over. ${subject} needs a cool towel and a retake.`;
      $("loveStatus").textContent = "Too hot · release sooner";
      setTier("loveTier", "BOILED", "miss");
      if (combo) combo.hidden = true;
      award(0, false, "Boiled over");
      showBanner(false, "BOILED OVER", subject);
      setAura("laugh");
    } else {
      state.loveStreak = 0;
      $("loveVerdict").textContent = `Barely lukewarm. ${subject} is still in the foyer.`;
      $("loveStatus").textContent = "Hold longer into Sweet Heat";
      setTier("loveTier", "COLD", "miss");
      if (combo) combo.hidden = true;
      award(0, false, "Too cold");
      showBanner(false, "TOO COLD", subject);
      setAura("badLuck");
    }
    saveState(state);
    renderCabinet();
    refreshNightBoard();
    setTimeout(() => setMercury(0), 900);
  }

  function tickHeat() {
    if (!heating) return;
    setMercury(heat + 0.55);
    if (heat >= 100) {
      stopHeat(true);
      return;
    }
    heatRaf = requestAnimationFrame(tickHeat);
  }

  /* Look Up */
  let lookupActive = false;
  let lookupPractice = false;
  let lookupHold = 0;
  let lookupRaf = null;
  let orientationHandler = null;

  function setLookup(pct) {
    const p = Math.max(0, Math.min(100, pct));
    $("lookupFill").style.width = `${p}%`;
    $("lookupReadout").textContent =
      p < 30 ? "flat" : p < 55 ? "lifting…" : p < 78 ? "darling ↑" : "too far";
    if (p >= 62 && p <= 78) setArt("lookupCabinetArt", VISUALS.lookup.rising);
    const bar = $("lookupHoldBar");
    if (bar) bar.style.width = `${Math.min(100, (lookupHold / 45) * 100)}%`;
    return p;
  }

  function endLookup(success, msg) {
    lookupActive = false;
    if (lookupRaf) cancelAnimationFrame(lookupRaf);
    if (orientationHandler) {
      window.removeEventListener("deviceorientation", orientationHandler);
      orientationHandler = null;
    }
    $("lookupVerdict").hidden = false;
    $("lookupVerdict").textContent = msg;
    $("lookupStart").disabled = false;
    focusCard("lookupCard", false);
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
    if (lookupPractice) {
      const t = (Date.now() / 1000) % 4;
      const wave = t < 2 ? t * 40 : (4 - t) * 40;
      const p = setLookup(20 + wave);
      if (p >= 62 && p <= 78) lookupHold += 1;
      else lookupHold = Math.max(0, lookupHold - 2);
      if (lookupHold > 45) {
        endLookup(true, "Practice sky locked. Gyro ghost filed.");
        $("lookupStatus").textContent = "Practice clear";
        return;
      }
    }
    lookupRaf = requestAnimationFrame(lookupTick);
  }

  /* SNAP */
  let snapArmed = false;
  let snapTarget = 0;
  let snapTimer = null;

  function armSnap() {
    const words = ["3", "2", "1", "…", "SNAP"];
    let i = 0;
    $("snapCountdown").hidden = false;
    $("snapPolaroid").hidden = true;
    $("snapFreeze").disabled = false;
    $("snapVerdict").hidden = true;
    snapArmed = true;
    focusCard("snapCard", true);
    setTier("snapTier", "", "");
    setArt("snapCabinetArt", VISUALS.snap.countdown);
    const tempo = 520 + Math.floor(Math.random() * 280); // keep them guessing
    const windowMs = 380 + Math.floor(Math.random() * 80);
    const beat = () => {
      if (!snapArmed) return;
      $("snapCountdown").textContent = words[i];
      if (words[i] === "SNAP") {
        setArt("snapCabinetArt", VISUALS.snap.flash);
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

    const perfect = word === "SNAP" && delta !== null && delta >= 0 && delta <= 160;
    const great = word === "SNAP" && delta !== null && delta > 160 && delta <= 280;
    const early = word !== "SNAP" || (delta !== null && delta < 0);
    focusCard("snapCard", false);
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
      award(60 + Math.min(25, (state.snapStreak - 1) * 8), true, "SNAP");
      showBanner(true, "PERFECT SNAP", `${Math.round(delta)}ms`);
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
      award(35, true, "SNAP great");
      showBanner(true, "GREAT SNAP", `${Math.round(delta)}ms`);
    } else if (early) {
      state.snapStreak = 0;
      $("snapPolaroidText").textContent = "early…";
      $("snapVerdict").textContent = "A hair early — still charming. Try again.";
      $("snapStatus").textContent = "Slightly early";
      setTier("snapTier", "EARLY", "miss");
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
      setArt("snapCabinetArt", VISUALS.snap.late);
      setAura("badLuck");
      award(0, false, "Late SNAP");
      showBanner(false, "TOO LATE", "The moment walked off");
    }
    saveState(state);
    refreshNightBoard();
  }

  /* Whisper */
  function makeCharm() {
    const raw = ($("whisperWord").value || "").trim();
    if (!raw) {
      $("whisperStatus").textContent = "One word, darling.";
      return;
    }
    if (!spendDemoCoin("whisper")) {
      $("whisperStatus").textContent = "Out of demo coins · grant a pass";
      refreshNightBoard();
      return;
    }
    const word = raw.split(/\s+/)[0].slice(0, 24);
    const line = CHARM_LINES[Math.floor(Math.random() * CHARM_LINES.length)](word);
    focusCard("whisperCard", true);
    setArt("whisperCabinetArt", VISUALS.whisper.glow);
    setAura("think");
    $("whisperStatus").textContent = "Sealing in brass…";
    $("charmCard").hidden = true;
    setTimeout(() => {
      $("charmWord").textContent = word;
      $("charmLine").textContent = line;
      $("charmCard").hidden = false;
      $("whisperStatus").textContent = "Charm sealed · filed in Alley";
      grantCurio("whisper_charm", "alley");
      renderCabinet();
      setArt("whisperCabinetArt", VISUALS.whisper.result);
      setAura("give");
      $("auraLine").textContent = `I kept “${word}” for the Cabinet. Don’t lose it.`;
      award(45, true, "Whisper Charm");
      showBanner(true, "CHARM SEALED", word);
      focusCard("whisperCard", false);
      refreshNightBoard();
    }, 900);
  }

  function copyChallenge() {
    const subject = ($("loveSubject").value || "someone").trim();
    const text = `Aura challenged you in Penny Fever — test ${subject} on the Love Thermometer. (Private preview on Lorie’s machine for now.)`;
    const done = () => {
      $("loveStatus").textContent = "Challenge text copied";
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
    const used = state.packDay === darwinDay();
    if (used && state.lastPack && state.lastPack.length) {
      $("pennyPack").hidden = false;
      state.lastPack.forEach((label, i) => {
        const el = $("penny" + i);
        if (el) el.textContent = label;
      });
      $("mintPack").disabled = true;
      $("packStatus").textContent = "Pack minted for this Darwin evening (demo)";
    } else {
      $("pennyPack").hidden = true;
      $("mintPack").disabled = false;
      $("packStatus").textContent = "Three pennies · one pack per Darwin evening (demo)";
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
      "src": "assets/prepared/love-thermometer-cabinet.webp",
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
      "src": "assets/prepared/door-beckon.webp",
      "kind": "still",
      "priority": "P1",
      "location": "discoveryDoor"
    },
    "ticket_booth": {
      "src": "assets/prepared/ticket-booth.webp",
      "kind": "still",
      "priority": "P2",
      "location": "foyer"
    },
    "snap_stage": {
      "src": "assets/prepared/snap-stage.webp",
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
      "src": "assets/prepared/lookup-sky.webp",
      "kind": "still",
      "priority": "P2",
      "location": "lookupCard"
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

  function bind() {
    $("enterArcade").addEventListener("click", () => {
      const btn = $("enterArcade");
      if (btn.dataset.busy === "1") return;
      btn.dataset.busy = "1";
      btn.disabled = true;
      const door = $("discoveryDoor");
      const art = $("doorStageArt");
      const vid = $("doorStageVideo");
      const idle = $("doorIdlePeek");
      if (idle) { idle.pause(); idle.hidden = true; }
      if (art) art.hidden = false;
      const stages = [
        { img: "Hidden_Doorway_Sequence/01_Closed_Crack.webp", line: "Knock knock…" },
        { img: "Hidden_Doorway_Sequence/02_Crown_Peeking.webp", vid: "Hidden_Doorway_Sequence/02_Crown_Peeking_Loop.mp4", line: "A crown in the crack." },
        { img: "Hidden_Doorway_Sequence/03_Half_Open.webp", line: "Halfway curious." },
        { img: "Hidden_Doorway_Sequence/04_Fully_Open.webp", vid: "Hidden_Doorway_Sequence/04_Fully_Open_Loop.mp4", line: "In you go." },
      ];
      let i = 0;
      door.classList.add("knocking");
      const step = () => {
        const s = stages[i];
        if (art) art.src = artPath(s.img);
        if (vid) {
          if (s.vid) {
            if (art) art.hidden = true;
            vid.hidden = false;
            vid.src = artPath(s.vid);
            vid.play().catch(() => {});
          } else {
            vid.pause();
            vid.hidden = true;
            vid.removeAttribute("src");
            if (art) art.hidden = false;
          }
        }
        const w = $("doorWhisper");
        if (w) w.textContent = `“${s.line}”`;
        i += 1;
        if (i < stages.length) {
          setTimeout(step, 700);
        } else {
          setTimeout(() => {
            if (vid) { vid.pause(); vid.hidden = true; }
            door.classList.remove("knocking");
            btn.dataset.busy = "0";
            btn.disabled = false;
            showFoyer(false);
            // reset door for next visit
            if (art) { art.hidden = false; art.src = artPath("Hidden_Doorway_Sequence/01_Closed_Crack.webp"); }
            if (idle) { idle.hidden = false; idle.play().catch(() => {}); }
            const w = $("doorWhisper");
            if (w) w.textContent = "“Psst. This isn’t the booth. This is mine — cabinets, fortunes, and a pretend penny. Come in if you’re curious.”";
          }, 650);
        }
      };
      step();
    });
    $("leaveArcade").addEventListener("click", showDoor);
    $("startFortune").addEventListener("click", () => {
      if (state.fortuneDay === darwinDay()) return;
      setArt("fortuneCabinetArt", VISUALS.fortune.think);
      setAura("think");
      $("fortuneIdle").hidden = true;
      $("fortuneForm").hidden = false;
      $("fortuneResult").hidden = true;
    });
    $("cancelFortune").addEventListener("click", () => {
      setArt("fortuneCabinetArt", VISUALS.fortune.idle);
      setAura("welcome");
      $("fortuneForm").hidden = true;
      $("fortuneIdle").hidden = false;
    });
    $("fortuneForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData($("fortuneForm"));
      dealFortune(fd.get("mood"), fd.get("colour"), fd.get("company"));
    });
    $("fortuneAgainHint").addEventListener("click", () => {
      $("fortuneResult").hidden = true;
      refreshFortuneUi();
    });

    const holdBtn = $("loveHold");
    const beginHold = (e) => {
      e.preventDefault();
      if (!spendDemoCoin("love")) {
        $("loveStatus").textContent = "Out of demo coins · grant a pass";
        return;
      }
      $("loveVerdict").hidden = true;
      setTier("loveTier", "", "");
      const combo = $("loveCombo");
      if (combo) combo.hidden = true;
      setMercury(0);
      heating = true;
      focusCard("loveCard", true);
      const band = document.querySelector(".sweet-band");
      if (band) band.classList.toggle("moving", (state.loveStreak || 0) >= 2);
      $("loveStatus").textContent = (state.loveStreak || 0) >= 2
        ? "Expert mode — moving Sweet Heat · release inside"
        : "Heating… release in Sweet Heat";
      tickHeat();
    };
    const endHold = (e) => {
      e.preventDefault();
      if (heating) stopHeat(true);
    };
    holdBtn.addEventListener("mousedown", beginHold);
    holdBtn.addEventListener("mouseup", endHold);
    holdBtn.addEventListener("mouseleave", () => {
      if (heating) stopHeat(true);
    });
    holdBtn.addEventListener("touchstart", beginHold, { passive: false });
    holdBtn.addEventListener("touchend", endHold);
    $("loveChallenge").addEventListener("click", copyChallenge);

    $("lookupStart").addEventListener("click", async () => {
      if (!spendDemoCoin("lookup")) {
        $("lookupStatus").textContent = "Out of demo coins · grant a pass";
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
            const p = setLookup(pct);
            if (p >= 62 && p <= 78) lookupHold += 1;
            else lookupHold = Math.max(0, lookupHold - 1);
            if (lookupHold > 40) {
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

    $("snapStart").addEventListener("click", () => {
      if (!spendDemoCoin("snap")) {
        $("snapStatus").textContent = "Out of demo coins · grant a pass";
        return;
      }
      $("snapStart").disabled = true;
      $("snapStatus").textContent = "Armed…";
      setArt("snapCabinetArt", VISUALS.snap.idle);
      armSnap();
    });
    $("snapFreeze").addEventListener("click", freezeSnap);

    $("whisperGo").addEventListener("click", makeCharm);

    $("mintPack").addEventListener("click", mintPack);

    $("demoPass").addEventListener("click", () => {
      state.showmanPass = true;
      state.passDay = darwinDay();
      grantCurio("showman_ribbon", "alley");
      grantCurio("coin_slot", "guts");
      saveState(state);
      refreshPassUi();
      renderCabinet();
      setArt("passArt", VISUALS.pass.stamped);
      $("auraLine").textContent = "Showman’s Pass (demo). Soft plays until midnight Darwin.";
      setAura("celebrate");
    });

    $("devReset").addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      state = loadState();
      setMercury(0);
      $("charmCard").hidden = true;
      $("loveVerdict").hidden = true;
      $("lookupVerdict").hidden = true;
      $("snapVerdict").hidden = true;
      $("fortuneForm").reset();
      setAura("welcome");
      $("auraLine").textContent =
        "Welcome to Penny Fever. Fortunes are free once a day. Cabinets take a pretend penny until Square arrives.";
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
    });

    applyAssetMap();
    setAura("welcome");
    setArt("fortuneCabinetArt", VISUALS.fortune.idle);
    setArt("loveCabinetArt", VISUALS.love.cold);
    setArt("lookupCabinetArt", VISUALS.lookup.idle);
    setArt("snapCabinetArt", VISUALS.snap.idle);
    setArt("whisperCabinetArt", VISUALS.whisper.idle);
    setArt("passArt", VISUALS.pass.idle);
    if (location.hash === "#foyer") showFoyer(true);
    else showDoor();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
