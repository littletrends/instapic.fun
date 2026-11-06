const API_BASE = "https://motherpc.taild1a44c.ts.net";
const PENDING_KEY = "pf-vip-pending";

function guestApi() {
  return window.InstapicGuestIdentity;
}

function signedIn() {
  return !!guestApi()?.isVerifiedSessionActive?.();
}

function guestEmail() {
  return String(guestApi()?.read?.()?.email || "").trim();
}

function feverReturnPath() {
  const hash = location.hash || "#alley";
  return "/penny-fever/index.html?style=paper&rail=paper&v=vip-spot-1" + hash;
}

function vipJoinUrl() {
  return "/save.html?return=" + encodeURIComponent(feverReturnPath());
}

function readPhotoCodes() {
  try {
    const list = JSON.parse(localStorage.getItem("pf-photo-codes") || "[]");
    return Array.isArray(list) ? list.map((r) => String(r && r.code ? r.code : r)).filter((c) => /^\d{6}$/.test(c)) : [];
  } catch {
    return [];
  }
}

function writePhotoCodes(codes) {
  const list = (codes || []).filter((c) => /^\d{6}$/.test(String(c))).map((code) => ({ code: String(code) }));
  try { localStorage.setItem("pf-photo-codes", JSON.stringify(list)); } catch {}
}

function snapshot() {
  const PF = window.PennyFever;
  const world = window.PennyFeverWorld;
  const pose = world?.pose?.();
  const state = PF?.getState?.() || {};
  return {
    v: 1,
    pennies: Math.max(0, Math.floor(Number(PF?.pennies?.() ?? state.demoCoins) || 0)),
    tickets: Math.max(0, Math.floor(Number(PF?.tickets?.() ?? state.playTickets) || 0)),
    hash: String(location.hash || "").replace(/^#/, "") || "alley",
    x: pose && typeof pose.x === "number" ? pose.x : 0,
    z: pose && typeof pose.z === "number" ? pose.z : 0,
    yaw: pose && typeof pose.yaw === "number" ? pose.yaw : 0,
    admitPassed: !!state.admitPassed,
    admitTicket: !!state.admitTicket,
    photo_codes: readPhotoCodes(),
    updated_at: Math.floor(Date.now() / 1000),
  };
}

function applySnapshot(blob) {
  if (!blob) return;
  const PF = window.PennyFever;
  PF?.restorePocket?.({
    pennies: blob.pennies,
    tickets: blob.tickets,
    admitPassed: blob.admitPassed,
    admitTicket: blob.admitTicket,
  });
  writePhotoCodes(blob.photo_codes || []);
  const hash = String(blob.hash || "alley").replace(/^#/, "");
  if (hash && location.hash.replace(/^#/, "") !== hash) {
    location.hash = hash;
  }
  const world = window.PennyFeverWorld;
  if (world?.started && typeof blob.x === "number" && typeof blob.z === "number") {
    world.warp(blob.x, blob.z, blob.yaw);
  } else if (typeof blob.x === "number") {
    try { sessionStorage.setItem("pf-vip-warp", JSON.stringify({ x: blob.x, z: blob.z, yaw: blob.yaw })); } catch {}
  }
  window.dispatchEvent(new Event("pennyfever:statechange"));
}

async function fetchProfile() {
  const email = guestEmail();
  if (!email) return null;
  const res = await fetch(API_BASE + "/api/guest/profile/" + encodeURIComponent(email));
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) return null;
  return data.guest_profile || null;
}

async function pushSave(blob) {
  const email = guestEmail();
  if (!email || !signedIn()) return null;
  const res = await fetch(API_BASE + "/api/guest/penny-fever/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, penny_fever: blob || snapshot() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.message || data.error || "save_failed");
  return data.penny_fever;
}

function paintChip() {
  const door = document.getElementById("pfVipDoor");
  const hud = document.getElementById("pfVipHud");
  const inVip = signedIn();
  const email = guestEmail();
  const label = inVip ? "VIP · " + (email.split("@")[0] || "signed in") : "Join VIP";
  if (door) {
    door.textContent = inVip
      ? "VIP signed in · your pennies and spot save with your guest area"
      : "Join VIP Guest Area · keep pennies and this spot on any phone";
    door.setAttribute("href", inVip ? "/my-instapic.html" : vipJoinUrl());
  }
  if (hud) {
    hud.textContent = label;
    hud.setAttribute("href", inVip ? "/my-instapic.html" : vipJoinUrl());
    hud.title = inVip ? "Open your VIP Guest Area. This tent saves your purse and alley spot while you are signed in." : "Join Instapic VIP so this tent follows you to another phone or browser.";
  }
}

async function syncOnArrival() {
  if (!signedIn()) {
    try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(snapshot())); } catch {}
    paintChip();
    return;
  }
  let pending = null;
  try { pending = JSON.parse(sessionStorage.getItem(PENDING_KEY) || "null"); } catch {}
  try { sessionStorage.removeItem(PENDING_KEY); } catch {}
  let profile = null;
  try { profile = await fetchProfile(); } catch {}
  const cloud = profile && profile.penny_fever;
  if (cloud && (cloud.pennies != null || cloud.hash)) {
    applySnapshot(cloud);
  } else {
    try { await pushSave(pending || snapshot()); } catch (err) {
      console.warn("[pf-vip] first save", err);
    }
  }
  paintChip();
}

function applyPendingWarp() {
  let raw = null;
  try { raw = sessionStorage.getItem("pf-vip-warp"); } catch {}
  if (!raw) return;
  try {
    const pose = JSON.parse(raw);
    const world = window.PennyFeverWorld;
    if (world?.started) {
      world.warp(pose.x, pose.z, pose.yaw);
      sessionStorage.removeItem("pf-vip-warp");
    }
  } catch {}
}

let mounted = false;
export function mountVipSpot() {
  paintChip();
  if (mounted) return;
  mounted = true;
  syncOnArrival();
  const door = document.getElementById("pfVipDoor");
  door?.addEventListener("click", () => {
    try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(snapshot())); } catch {}
    if (!signedIn()) door.setAttribute("href", vipJoinUrl());
  });
  const hud = document.getElementById("pfVipHud");
  hud?.addEventListener("click", () => {
    try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(snapshot())); } catch {}
    if (signedIn()) {
      pushSave().catch((err) => console.warn("[pf-vip] save", err));
    }
  });
  setInterval(() => {
    if (!signedIn()) return;
    pushSave().catch(() => {});
    applyPendingWarp();
  }, 20000);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && signedIn()) pushSave().catch(() => {});
  });
  window.addEventListener("pagehide", () => {
    if (signedIn()) pushSave().catch(() => {});
  });
  window.addEventListener("hashchange", paintChip);
  window.addEventListener("pennyfever:statechange", () => {
    const pocket = document.getElementById("pfPocketCoinCount");
    if (pocket && window.PennyFever?.pennies) pocket.textContent = String(window.PennyFever.pennies());
    const tix = document.getElementById("pfPocketScripCount");
    if (tix && window.PennyFever?.tickets) tix.textContent = String(window.PennyFever.tickets());
  });
}
