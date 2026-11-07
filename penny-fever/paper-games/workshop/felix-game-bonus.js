(() => {
  const STORAGE_KEY = "pennyFeverGameFiles";
  const DB_NAME = "pennyFeverGameMedia";
  const API_BASE = "https://motherpc.taild1a44c.ts.net";
  const form = document.getElementById("redeem-form");
  const input = document.getElementById("game-code");
  const status = document.getElementById("bonus-status");
  const sessionBlock = document.getElementById("session-block");
  const sessionCodeEl = document.getElementById("session-code");
  const codePattern = /^PF-[A-HJ-NP-Z]{6}$/;
  let renderCleanups = [];

  function setStatus(text) {
    if (status) status.textContent = text;
  }

  function absUrl(path) {
    if (!path) return "";
    if (/^(https?:|data:|blob:)/i.test(path)) return path;
    return API_BASE + path;
  }

  function readFiles() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(data) ? data.filter((file) => file && codePattern.test(String(file.code || ""))) : [];
    } catch (_) {
      return [];
    }
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error("IndexedDB unavailable"));
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("sessions")) db.createObjectStore("sessions", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Could not open game media"));
    });
  }

  async function getMedia(id) {
    if (!id) return null;
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("sessions", "readonly");
      const request = tx.objectStore("sessions").get(id);
      request.onsuccess = () => { db.close(); resolve(request.result || null); };
      request.onerror = () => { db.close(); reject(request.error || new Error("Could not load game media")); };
    });
  }

  async function fetchUsb(code) {
    try {
      const res = await fetch(API_BASE + "/api/penny-fever/felix-session/" + encodeURIComponent(code), {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data && data.ok ? data : null;
    } catch (_) {
      return null;
    }
  }

  function usbToMedia(data) {
    return {
      photos: (data.photos || []).map(absUrl),
      collage: absUrl(data.collage),
      gifFrames: (data.gif_frames || []).map(absUrl),
      boomFrames: (data.boom_frames || []).map(absUrl),
      videoUrl: absUrl(data.video),
      strip: absUrl(data.strip),
    };
  }

  function dl(href, name, label, extraClass) {
    const a = document.createElement("a");
    a.className = extraClass ? "btn " + extraClass : "btn";
    a.href = href;
    a.download = name;
    a.textContent = label;
    return a;
  }

  function put(id, node) {
    const el = document.getElementById(id);
    el.replaceChildren(node);
  }

  function playFlip(img, frames, pingpong, ms) {
    const live = (frames || []).filter(Boolean);
    if (!live.length) return () => {};
    if (live.length === 1) {
      img.src = live[0];
      return () => {};
    }
    const seq = pingpong ? live.concat(live.slice(1, -1).reverse()) : live;
    let i = 0;
    img.src = seq[0];
    const timer = setInterval(() => {
      i = (i + 1) % seq.length;
      img.src = seq[i];
    }, ms);
    return () => clearInterval(timer);
  }

  async function ensureBaked(media) {
    if (media?.collage && media?.gifFrames?.length) return media;
    const photos = media?.photos || [];
    if (!photos.length || !window.PfBonus) return media || {};
    try {
      const baked = await PfBonus.bake(photos);
      return Object.assign({}, media, baked);
    } catch (err) {
      console.warn("bonus bake", err);
      return media || {};
    }
  }

  async function renderSession(session, code, number, mediaIn) {
    const media = await ensureBaked(mediaIn || await getMedia(session.mediaId).catch(() => null));
    const stem = "penny-fever-" + code + "-session-" + number + "-";
    const stripSrc = media?.strip || session.strip || "";
    const stripFrame = document.getElementById("strip-frame");
    const stripActions = document.getElementById("strip-actions");
    stripActions.replaceChildren();
    if (stripSrc) {
      const img = document.createElement("img");
      img.src = stripSrc;
      img.alt = "Penny Fever photo strip";
      stripFrame.replaceChildren(img);
      stripActions.append(dl(stripSrc, stem + "strip.jpg", "Download strip"));
    } else {
      stripFrame.innerHTML = '<div class="empty">No strip saved.</div>';
    }

    const stills = document.getElementById("stills-grid");
    stills.replaceChildren();
    (media?.photos || []).forEach((src, i) => {
      if (!src) return;
      const img = document.createElement("img");
      img.src = src;
      img.alt = "SNAP " + (i + 1);
      stills.append(img);
    });

    const collageSrc = media?.collage || "";
    const collageFrame = document.getElementById("collage-frame");
    const collageActions = document.getElementById("collage-actions");
    collageActions.replaceChildren();
    if (collageSrc) {
      const img = document.createElement("img");
      img.src = collageSrc;
      img.alt = "SNAP collage";
      collageFrame.replaceChildren(img);
      collageActions.append(dl(collageSrc, stem + "collage.jpg", "Download collage"));
    } else {
      collageFrame.innerHTML = '<div class="empty">Collage could not be built.</div>';
    }

    const gifImg = document.createElement("img");
    gifImg.alt = "SNAP GIF";
    put("gif-frame", gifImg);
    const gifActions = document.getElementById("gif-actions");
    gifActions.replaceChildren();
    const gifFrames = (media?.gifFrames || []).filter(Boolean);
    if (gifFrames.length) {
      renderCleanups.push(playFlip(gifImg, gifFrames, false, 380));
      gifActions.append(dl(gifFrames[0], stem + "gif-still.jpg", "Download GIF still"));
    } else {
      gifImg.replaceWith(Object.assign(document.createElement("div"), { className: "empty", textContent: "GIF could not be built." }));
    }

    const boomImg = document.createElement("img");
    boomImg.alt = "SNAP boomerang";
    put("boomerang-frame", boomImg);
    const boomActions = document.getElementById("boomerang-actions");
    boomActions.replaceChildren();
    const boomFrames = (media?.boomFrames || []).filter(Boolean);
    if (boomFrames.length) {
      renderCleanups.push(playFlip(boomImg, boomFrames, true, 280));
      boomActions.append(dl(boomFrames[0], stem + "boomerang-still.jpg", "Download boomerang still"));
    } else {
      boomImg.replaceWith(Object.assign(document.createElement("div"), { className: "empty", textContent: "Boomerang could not be built." }));
    }

    const videoHref = media?.videoUrl || "";
    if (videoHref) {
      collageActions.append(dl(videoHref, stem + "session.webm", "Download session video", "alt"));
    } else if (media?.video) {
      const url = URL.createObjectURL(media.video);
      renderCleanups.push(() => URL.revokeObjectURL(url));
      collageActions.append(dl(url, stem + "session." + (media.videoExt || "webm"), "Download session video", "alt"));
    }
  }

  async function showCode(raw) {
    const value = String(raw || "").trim().toUpperCase();
    const code = codePattern.test(value) ? value : "";
    renderCleanups.forEach((fn) => fn());
    renderCleanups = [];
    sessionBlock.hidden = true;
    sessionCodeEl.hidden = true;
    if (!code) {
      setStatus("Enter PF- followed by six letters. I and O are not used.");
      return;
    }
    const usb = await fetchUsb(code);
    if (usb && (usb.collage || usb.strip || (usb.photos || []).length)) {
      sessionCodeEl.hidden = false;
      sessionCodeEl.textContent = code;
      sessionBlock.hidden = false;
      setStatus("Loaded from Felix photo booth.");
      try {
        await renderSession({ strip: absUrl(usb.strip), mediaId: "" }, code, 1, usbToMedia(usb));
      } catch (err) {
        console.warn("game bonus", err);
        setStatus("The SNAP keepsake could not be opened.");
      }
      return;
    }
    const file = readFiles().find((item) => item.code === code);
    if (!file) {
      setStatus("That PF code is not on Felix photo booth yet. Run the SNAP session, then open bonuses with the same code.");
      return;
    }
    const sessions = (Array.isArray(file.sessions) ? file.sessions : []).filter((session) => session && (session.usb || session.mediaId || (typeof session.strip === "string" && session.strip.startsWith("data:image/"))));
    if (!sessions.length) {
      setStatus("This game code has no saved photo sessions yet.");
      return;
    }
    const session = sessions[sessions.length - 1];
    sessionCodeEl.hidden = false;
    sessionCodeEl.textContent = code;
    sessionBlock.hidden = false;
    setStatus(sessions.length + " SNAP " + (sessions.length === 1 ? "session" : "sessions") + " found on this browser. Showing the latest.");
    try {
      await renderSession(session, code, sessions.length);
    } catch (err) {
      console.warn("game bonus", err);
      setStatus("The SNAP keepsake could not be opened on this browser.");
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    showCode(input.value);
  });
  const queryCode = new URLSearchParams(location.search).get("code") || "";
  if (queryCode) {
    input.value = queryCode;
    showCode(queryCode);
  }
})();
