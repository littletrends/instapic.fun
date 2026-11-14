import {chooseCrew} from "./crew-selector.js?v=doll-saved-sets-12";
import {captureProgress, mergeProgress, newPlayerId} from "./vip-progress.js?v=vip-progress-1";
import {openTradeshow, tradeshowBlocked} from "./aura-tradeshow.js?v=sitting-price-1";
import {createVerifiedBanking, VERIFIED_BANKING_RELEASE} from '../charging/verified-banking.mjs';
import {bankLoan} from './ticket-till.js?v=bank-refresh-1';
const API_BASE = "https://motherpc.taild1a44c.ts.net";
const PENDING_KEY = "pf-vip-pending";
const HELD_PLAYER_KEY = "pf-device-player-on-hold.v1";
let syncReady = false;
let progressRevision = 0;
let progressConflict = false;
let collectionChoice = null;
let saveQueue = Promise.resolve();
let sessionLapsed = false; // VIP sign-in ran out (server said so or the 1 h client clock passed)
let lapseBannerHidden = false;
const FELIX_ACCOUNT_KEY = "pf-felix-portrait-owner.v1";

function verifiedBanking() {
  if (!VERIFIED_BANKING_RELEASE) return null;
  if (window.PennyFeverVerified) return window.PennyFeverVerified;
  if (!window.PennyFever?.applyVerifiedPurse) throw Error('The penny purse is still loading.');
  const service = createVerifiedBanking({api: window.PennyFever, identity: guestApi(), loan: bankLoan, onError: () => {
    const hint = document.getElementById('pfVipDoorHint');
    if (hint) hint.textContent = 'Your verified purse is waiting to reconnect. Your saved balance is preserved; reload or sign in again to continue.';
  }});
  const state = () => window.PennyFever.getState();
  window.PennyFeverVerifiedPurse = {
    pennies: () => Number(state().demoCoins) || 0, tickets: () => Number(state().playTickets) || 0,
    packs: () => Number(state().pennyPacks) || 0,
    spendPennies: () => false, spendTicket: () => false, packFive: () => false, unpackFive: () => false,
    tradeTicket: () => false, cashTicket: () => 0, rollbackPendingSpend: () => 0,
    collectCoin: () => false, bankLoan: () => false,
  };
  window.PennyFeverVerified = service;
  window.dispatchEvent(new Event('pennyfever:bankingavailable'));
  return service;
}

async function connectVerifiedBanking(choice) {
  const service = verifiedBanking();
  if (!service) return;
  if (signedIn()) {
    await service.useVip(choice || 'vip');
    await service.bank();
    if (syncReady) await pushSave(snapshot());
  } else {
    const current = guestApi()?.read?.();
    if (current?.verified && current.email) {service.fail(Error('verification_required'));return;}
    const priorOwner = portraitAccountOwner();
    if (priorOwner) {
      localStorage.setItem('pf-vip-before-signout:' + priorOwner, JSON.stringify({snapshot:snapshot(),at:Date.now()}));
      localStorage.removeItem(FELIX_ACCOUNT_KEY);
      newPlayerId();
    }
    await service.useGuest();
    try {sessionStorage.setItem(PENDING_KEY, JSON.stringify(snapshot()));} catch {}
  }
}

function guestApi() {
  return window.InstapicGuestIdentity;
}

function signedIn() {
  return !sessionLapsed && !!guestApi()?.isVerifiedSessionActive?.();
}

/** Bug 8: saves were silently refused after the sign-in window. Keep the device copy, say so, and offer Sign in again. */
function markLapsed(email) {
  const key = String(email || guestEmail()).toLowerCase();
  sessionLapsed = true; syncReady = false; lapseBannerHidden = false;
  if (key) { try { localStorage.setItem('pf-vip-lapsed:' + key, JSON.stringify({snapshot: snapshot(), at: Date.now()})); } catch {} }
  paintChip();
}

function paintLapseBanner() {
  const id = guestApi()?.read?.() || {};
  const show = !lapseBannerHidden && !!(id.verified && id.email) && !signedIn();
  let bar = document.getElementById("pfVipLapse");
  if (!show) { bar?.remove(); return; }
  if (bar) return;
  bar = document.createElement("div"); bar.id = "pfVipLapse"; bar.setAttribute("role", "status");
  bar.style.cssText = "position:fixed;left:50%;top:max(8px,env(safe-area-inset-top));transform:translateX(-50%);z-index:9999;width:max-content;max-width:min(94vw,520px);padding:10px 12px;border:2px solid #d9aa66;border-radius:12px;background:#291d35;color:#fff3df;font:14px/1.4 system-ui;box-shadow:0 6px 18px rgba(0,0,0,.35);display:flex;gap:10px;align-items:center;";
  const msg = document.createElement("span");
  msg.textContent = "Your VIP sign-in timed out, so VIP saving is paused. Your pennies and treasures are kept on this phone.";
  const go = document.createElement("a"); go.href = vipJoinUrl(); go.textContent = "Sign in again";
  go.style.cssText = "flex:none;padding:7px 10px;border-radius:8px;background:#ffb4d2;color:#291d35;font-weight:700;text-decoration:none;";
  go.addEventListener("click", () => { try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(snapshot())); } catch {} });
  const hide = document.createElement("button"); hide.type = "button"; hide.textContent = "×"; hide.setAttribute("aria-label", "Hide");
  hide.style.cssText = "flex:none;background:none;border:0;color:#f0dcc2;font-size:20px;line-height:1;cursor:pointer;";
  hide.addEventListener("click", () => { lapseBannerHidden = true; bar.remove(); });
  bar.append(msg, go, hide);
  document.body.append(bar);
}

function guestEmail() {
  return String(guestApi()?.read?.()?.email || "").trim();
}

function portraitAccountOwner() {
  try { return String(localStorage.getItem(FELIX_ACCOUNT_KEY) || "").trim().toLowerCase(); }
  catch { return ""; }
}

function rememberPortraitAccount() {
  const email = signedIn() ? guestEmail().toLowerCase() : "";
  if (!email) return;
  try { localStorage.setItem(FELIX_ACCOUNT_KEY, email); } catch {}
}

function clearFelixPortraitsFromLocalState() {
  const PF = window.PennyFever;
  const state = PF?.getState?.();
  const items = state?.paperInventory?.items;
  if (!items) return;
  let changed = false;
  for (const id of Object.keys(items)) {
    if (id === "felix-vendor-portrait-book" || id.startsWith("vendor-portrait-")) {
      delete items[id];
      changed = true;
    }
  }
  if (changed) PF.saveState?.();
}

function accountHasPortraitBook(blob) {
  // New saves carry an explicit treasure inventory. Older VIP records used a
  // flag that was automatically set when any portrait was saved.
  if (blob?.treasures && typeof blob.treasures === "object" && !Array.isArray(blob.treasures)) {
    return !!blob.treasures["felix-vendor-portrait-book"];
  }
  return blob?.felix_vendor_portrait_book === true;
}

function mergeFelixPortraitsFromAccount(blob) {
  const PF = window.PennyFever;
  const model = window.PennyFeverInventoryModel;
  const state = PF?.getState?.();
  if (!state || !model) return false;
  const requested = Array.isArray(blob?.felix_vendor_portraits) ? blob.felix_vendor_portraits : [];
  let changed = false;
  if (accountHasPortraitBook(blob) && !state.paperInventory?.items?.["felix-vendor-portrait-book"]) {
    changed = model.recordPaperPrize(state, { item: "felix-vendor-portrait-book", stall: "felix-photo-booth" }).length > 0 || changed;
  }
  for (const id of requested) {
    const item = model.definitions.find(entry => entry.id === id && entry.photoSetId);
    if (!item) continue;
    changed = model.recordFelixPhotoSession(state, item.photoSetId).length > 0 || changed;
  }
  if (changed) PF.saveState?.();
  return changed;
}

function sameFelixClaims(a, b) {
  const ids = value => Array.isArray(value?.felix_vendor_portraits)
    ? [...new Set(value.felix_vendor_portraits)].sort().join("|") : "";
  return ids(a) === ids(b)
    && accountHasPortraitBook(a) === accountHasPortraitBook(b);
}

function feverReturnPath() {
  const hash = location.hash || "#alley";
  return "/penny-fever/index.html?style=paper&rail=paper&v=vip-spot-2" + hash;
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
  const paperItems = state.paperInventory?.items || {};
  const model = window.PennyFeverInventoryModel;
  const felixPortraits = (model?.definitions || [])
    .filter(item => item.photoSetId && paperItems[item.id])
    .map(item => item.id)
    .sort();
  return {
    v: 1,
    progress_revision: progressRevision,
    ...captureProgress(state),
    pennies: Math.max(0, Math.floor(Number(PF?.pennies?.() ?? state.demoCoins) || 0)),
    tickets: Math.max(0, Math.floor(Number(PF?.tickets?.() ?? state.playTickets) || 0)),
    hash: String(location.hash || "").replace(/^#/, "") || "alley",
    x: pose && typeof pose.x === "number" ? pose.x : 0,
    z: pose && typeof pose.z === "number" ? pose.z : 0,
    yaw: pose && typeof pose.yaw === "number" ? pose.yaw : 0,
    admitPassed: !!state.admitPassed,
    admitTicket: !!state.admitTicket,
    photo_codes: readPhotoCodes(),
    felix_vendor_portrait_book: !!paperItems["felix-vendor-portrait-book"],
    felix_vendor_portraits: felixPortraits,
    felix_vendor_owner: portraitAccountOwner(),
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
  if (mergeProgress(PF?.getState?.(), blob)) PF?.saveState?.();
  if (window.PennyFeverVerifiedPurse?.wallet) PF?.applyVerifiedPurse?.(window.PennyFeverVerifiedPurse.wallet());
  if (typeof blob.selected_doll === "string") chooseCrew(blob.selected_doll);
  mergeFelixPortraitsFromAccount(blob);
  if (signedIn()) rememberPortraitAccount();
  writePhotoCodes(blob.photo_codes || []);
  const enteringTradeshow = new URLSearchParams(location.search).get('tradeshow') === '1'
    && location.hash === '#aura-tradeshow';
  const hash = enteringTradeshow ? 'aura-tradeshow' : String(blob.hash || "alley").replace(/^#/, "");
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

function pushSave(blob, replaceCollection = false) {
  const intendedEmail = guestEmail();
  const task = saveQueue.catch(() => {}).then(async () => {
    const email = guestEmail();
    if (!email || email !== intendedEmail || !signedIn() || !syncReady) return null;
    const res = await fetch(API_BASE + "/api/guest/penny-fever/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, penny_fever: {...(blob || snapshot()), progress_revision: progressRevision}, ...(replaceCollection ? {replace_collection:true} : {}) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      if (res.status === 401 || data.error === "verification_required") {
        markLapsed(email);
      } else if (data.error === "penny_progress_conflict") {
        progressConflict = true; syncReady = false;
        try { localStorage.setItem('pf-vip-conflict:'+email, JSON.stringify({snapshot:snapshot(),at:Date.now()})); } catch {}
        paintChip();
      } else if (data.error === "penny_collection_conflict") {
        collectionChoice={email}; progressConflict=false; syncReady=false;
        try { localStorage.setItem('pf-vip-choice-backup:'+email, JSON.stringify({snapshot:snapshot(),at:Date.now()})); } catch {}
        paintChip();
      }
      throw new Error(data.message || data.error || "save_failed");
    }
    if (Number.isSafeInteger(data.penny_fever?.progress_revision)) progressRevision = data.penny_fever.progress_revision;
    // Each good save slides the sign-in (motherpc caps it at 12 h from sign-in).
    if (Number(data.session_until) > 0) guestApi()?.extendSession?.(Number(data.session_until) * 1000);
    return data.penny_fever;
  });
  saveQueue = task;
  return task;
}

function paintCollectionDialog() {
  const existing=document.getElementById('pfCollectionChoiceDialog');
  if(!collectionChoice) { if(existing){if(existing.open)existing.close();existing.remove();} return; }
  if(existing) return;
  const dialog=document.createElement('dialog');dialog.id='pfCollectionChoiceDialog';dialog.setAttribute('aria-labelledby','pfCollectionChoiceTitle');
  dialog.style.cssText='max-width:min(92vw,460px);padding:22px;border:2px solid #d9aa66;border-radius:14px;background:#291d35;color:#fff3df;font:16px/1.45 system-ui;';
  const title=document.createElement('h2');title.id='pfCollectionChoiceTitle';title.textContent='Choose your Penny Fever player';
  const description=document.createElement('p');description.textContent='This device has a different player from the one saved to this VIP account. Each VIP has one player. Choose how you would like to continue:';
  dialog.append(title,description);
  const choices=[
    ['Continue with the VIP player','vip','The player on this device is put on hold, then returns when you sign out and come back to Penny Fever.'],
    ['Create another VIP for this device player','new','Keep this player and their collection in a separate VIP account.'],
  ];
  for(const [label,choice,detail] of choices) {
    const button=document.createElement('button');button.type='button';button.textContent=label;button.style.cssText='display:block;width:100%;margin:10px 0 2px;padding:10px;border-radius:8px;cursor:pointer;font-weight:700;';
    const note=document.createElement('p');note.textContent=detail;note.style.cssText='margin:0 2px 12px;font-size:13px;line-height:1.35;color:#f0dcc2;';
    button.addEventListener('click',()=>resolveCollectionChoice(choice).catch(err=>{description.textContent='Could not finish. Your progress remains on this device; please try again.';console.warn('[pf-vip] collection choice',err);}));dialog.append(button,note);
  }
  dialog.addEventListener('cancel',event=>event.preventDefault());
  document.body.append(dialog);dialog.showModal();
}

function paintChip() {
  paintCollectionDialog();
  paintLapseBanner();
  const door = document.getElementById("pfVipDoor");
  const hud = document.getElementById("pfVipHud");
  const inVip = signedIn();
  const email = guestEmail();
  const label = inVip ? "VIP · " + (email.split("@")[0] || "signed in") : "Join VIP";
  const hint = document.getElementById("pfVipDoorHint");
  if (door) {
    door.textContent = inVip
      ? "VIP locked in · this player saves with your guest profile"
      : "Join VIP to lock in this player · then come back from any phone";
    door.setAttribute("href", inVip ? "/my-instapic.html" : vipJoinUrl());
  }
  if (hint) {
    hint.textContent = inVip
      ? "Signed in. Pennies and this alley spot stay on your VIP profile, so any phone can pick them up."
      : "This phone already remembers your pennies if you come back here. VIP locks that player to your guest profile.";
  }
  if (collectionChoice && hint) {
    hint.replaceChildren(document.createTextNode("This device has a different player. You can put them on hold while using the VIP, or create a separate VIP: "));
    for (const [label,choice] of [["Continue with the VIP player",'vip'],["Create another VIP for this device player",'new']]) {
      const button=document.createElement('button'); button.type='button'; button.textContent=label;
      button.addEventListener('click',()=>resolveCollectionChoice(choice).catch(err=>{console.warn('[pf-vip] collection choice',err);hint.append(' Could not finish; your progress remains on this device.');}));
      hint.append(' ',button);
    }
  }
  if (progressConflict && hint) {
    hint.replaceChildren(document.createTextNode(VERIFIED_BANKING_RELEASE
      ? 'Your VIP save changed on another device. Your verified purse is preserved. Load the latest VIP save to continue: '
      : "VIP save paused because this account changed on another device. Your treasures are kept. Choose which penny balance to keep: "));
    for (const [label,local] of (VERIFIED_BANKING_RELEASE ? [['Use latest VIP save',false]] : [["Keep this device's balance",true],["Use VIP balance",false]])) {
      const button=document.createElement('button'); button.type='button'; button.textContent=label;
      button.addEventListener('click',()=>resolveProgressConflict(local).catch(err=>{hint.textContent='Could not resolve the save yet. Your progress is still on this device.';console.warn('[pf-vip] resolve',err);}));
      hint.append(' ',button);
    }
  }
  if (hud) {
    // Lorie: the chip says who is playing. Long emails are trimmed (shorter on phones); full address in the tooltip.
    const choosing = !!(progressConflict || collectionChoice);
    const who = inVip ? "Signed in as " + shortEmail(email) : "Playing as guest";
    hud.textContent = choosing ? who + " · Choose player" : who;
    hud.classList.toggle("needs-choice", choosing);
    // Inline so no world.css tag bump is needed (index.html is someone else’s dirty file). Emails read better un-capitalised.
    hud.style.textTransform = "none";
    hud.style.boxShadow = choosing ? "0 0 0 2px #ffb4d2" : "";
    hud.setAttribute("href", choosing ? "#choose-player" : "#aura-tradeshow");
    hud.title = choosing
      ? "Tap to choose which player and balance to keep."
      : (inVip ? "Signed in as " + (email || "VIP") + ". " : "Playing as guest on this device. ") + "Tap for Aura’s VIP NFT Tradeshow.";
  }
}

function shortEmail(email) {
  const text = String(email || "").trim();
  if (!text) return "VIP";
  const phone = typeof matchMedia === "function" && matchMedia("(max-width: 600px)").matches;
  const max = phone ? 14 : 26;
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

/** Chip tap while a choice is pending: reopen the matching choice instead of the tradeshow. */
function openPlayerChoice() {
  if (collectionChoice) {
    const dialog = document.getElementById("pfCollectionChoiceDialog");
    if (!dialog) { paintCollectionDialog(); return true; }
    if (!dialog.open) dialog.showModal();
    dialog.querySelector("button")?.focus();
    return true;
  }
  if (progressConflict) { paintConflictDialog(); return true; }
  return false;
}

function paintConflictDialog() {
  let dialog = document.getElementById("pfProgressConflictDialog");
  if (!dialog) {
    dialog = document.createElement("dialog"); dialog.id = "pfProgressConflictDialog"; dialog.setAttribute("aria-labelledby", "pfProgressConflictTitle");
    dialog.style.cssText = "max-width:min(92vw,460px);padding:22px;border:2px solid #d9aa66;border-radius:14px;background:#291d35;color:#fff3df;font:16px/1.45 system-ui;";
    const title = document.createElement("h2"); title.id = "pfProgressConflictTitle"; title.textContent = "Choose which balance to keep";
    const description = document.createElement("p"); description.textContent = VERIFIED_BANKING_RELEASE
      ? 'Your VIP save changed on another device. Your verified purse is preserved. Load the latest VIP save to continue.'
      : "VIP save paused because this account changed on another device. Your treasures are kept. Choose which penny balance to keep:";
    dialog.append(title, description);
    for (const [label, local] of (VERIFIED_BANKING_RELEASE ? [['Use latest VIP save',false]] : [["Keep this device's balance", true], ["Use VIP balance", false]])) {
      const button = document.createElement("button"); button.type = "button"; button.textContent = label;
      button.style.cssText = "display:block;width:100%;margin:10px 0;padding:10px;border-radius:8px;cursor:pointer;font-weight:700;";
      button.addEventListener("click", () => resolveProgressConflict(local)
        .then(() => { if (dialog.open) dialog.close(); dialog.remove(); })
        .catch(err => { description.textContent = "Could not resolve the save yet. Your progress is still on this device."; console.warn("[pf-vip] resolve", err); }));
      dialog.append(button);
    }
    const later = document.createElement("button"); later.type = "button"; later.textContent = "Decide later";
    later.style.cssText = "display:block;margin:6px auto 0;background:none;border:0;color:#f0dcc2;text-decoration:underline;cursor:pointer;";
    later.addEventListener("click", () => dialog.close());
    dialog.append(later);
    document.body.append(dialog);
  }
  if (!dialog.open) dialog.showModal();
}

function meaningfulProgress(progress) {
  const items=Object.keys(progress.treasures || {}).filter(id=>id!=='penny-collector-book');
  return !!(items.length || Object.keys(progress.curios || {}).length || progress.doll_mine || progress.doll_sets?.length || progress.penny_packs || progress.pennies!==3 || progress.tickets!==3);
}
function clearPlayerProgress() {
  const state=window.PennyFever?.getState?.();
  localStorage.removeItem('pf-paper-dolls-v11'); localStorage.removeItem('pf-doll-sets-v1');
  localStorage.removeItem('pf-photo-codes'); localStorage.removeItem('pf-selected-crew-v1');
  if(state){state.paperInventory={version:1,items:{}};state.curios={};state.pennyPacks=0;state.demoCoins=3;state.playTickets=3;state.admitPassed=false;state.admitTicket=false;window.PennyFever?.saveState?.();}
}
async function resolveCollectionChoice(choice) {
  const selected=collectionChoice;
  if(!selected || !signedIn() || guestEmail().toLowerCase()!==selected.email) return;
  if(choice==='new') {
    sessionStorage.setItem(PENDING_KEY,JSON.stringify(snapshot()));
    guestApi()?.clear?.();
    location.href=vipJoinUrl();
    return;
  }
  if(choice !== 'vip') return;
  const profile=await fetchProfile(), cloud=profile?.penny_fever;
  if(!cloud) throw new Error('VIP save unavailable');
  progressRevision=Number.isSafeInteger(cloud.progress_revision)?cloud.progress_revision:0;
  const local=snapshot();
  localStorage.setItem('pf-vip-choice-backup:'+selected.email,JSON.stringify({snapshot:local,at:Date.now()}));
  // Never replace an earlier held player when switching between VIP accounts.
  const heldAlready=!!localStorage.getItem(HELD_PLAYER_KEY);
  if(!heldAlready) localStorage.setItem(HELD_PLAYER_KEY,JSON.stringify({snapshot:local,at:Date.now()}));
  clearPlayerProgress();
  if(!cloud.player_id) cloud.player_id=newPlayerId();
  applySnapshot(cloud);
  syncReady=true;
  try { if (!await pushSave(snapshot())) throw new Error('VIP save was not completed'); }
  catch(err) {
    syncReady=false;
    clearPlayerProgress();applySnapshot(local);
    if(local.felix_vendor_owner) localStorage.setItem(FELIX_ACCOUNT_KEY,local.felix_vendor_owner); else localStorage.removeItem(FELIX_ACCOUNT_KEY);
    if(!heldAlready) localStorage.removeItem(HELD_PLAYER_KEY);
    paintChip();throw err;
  }
  collectionChoice=null; rememberPortraitAccount();
  await connectVerifiedBanking('vip');paintChip();
}

async function resolveProgressConflict(useLocalBalance) {
  const email=guestEmail().toLowerCase();
  if(!signedIn() || !email) throw new Error('Sign in first');
  const local=snapshot();
  const profile=await fetchProfile();
  const cloud=profile?.penny_fever;
  if(!cloud || !Number.isSafeInteger(cloud.progress_revision)) throw new Error('VIP save unavailable');
  progressRevision=cloud.progress_revision;
  applySnapshot(cloud); // union treasures and doll sets from both copies
  if(useLocalBalance) {
    window.PennyFever?.restorePocket?.({pennies:local.pennies,tickets:local.tickets,admitPassed:local.admitPassed,admitTicket:local.admitTicket});
    const state=window.PennyFever?.getState?.();
    if(state){state.pennyPacks=local.penny_packs;window.PennyFever?.saveState?.();}
  }
  syncReady=true;
  try { if (!await pushSave(snapshot())) throw new Error('VIP save was not completed'); }
  catch (err) { applySnapshot(local); syncReady=false; progressConflict=true; paintChip(); throw err; }
  try { localStorage.removeItem('pf-vip-conflict:'+email); } catch {}
  progressConflict=false;
  await connectVerifiedBanking('vip');
  paintChip();
}

async function syncOnArrival() {
  if (!signedIn()) {
    try {
      const heldRaw=localStorage.getItem(HELD_PLAYER_KEY);
      if(heldRaw) {
        const held=JSON.parse(heldRaw);
        if(!held?.snapshot || !window.PennyFever?.getState?.() || !window.PennyFever?.restorePocket) throw new Error('Held player is not ready to restore');
        // Back up the VIP's most recent local copy before returning the device player.
        const owner=portraitAccountOwner();
        if(owner) localStorage.setItem('pf-vip-before-signout:'+owner,JSON.stringify({snapshot:snapshot(),at:Date.now()}));
        clearPlayerProgress();applySnapshot(held.snapshot);
        if(held.snapshot.felix_vendor_owner) localStorage.setItem(FELIX_ACCOUNT_KEY,held.snapshot.felix_vendor_owner); else localStorage.removeItem(FELIX_ACCOUNT_KEY);
        localStorage.removeItem(HELD_PLAYER_KEY);
      }
    } catch(err) { console.warn('[pf-vip] held player remains saved for recovery',err);paintChip();return; }
    try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(snapshot())); } catch {}
    await connectVerifiedBanking();
    paintChip();
    return;
  }
  let pending = null;
  try { pending = JSON.parse(sessionStorage.getItem(PENDING_KEY) || "null"); } catch {}
  try { sessionStorage.removeItem(PENDING_KEY); } catch {}
  let profile = null;
  try { profile = await fetchProfile(); } catch (err) {
    console.warn("[pf-vip] profile unavailable; keeping browser progress", err);
    verifiedBanking()?.fail(err);
    paintChip();
    return;
  }
  if (!profile) { verifiedBanking()?.fail(Error('VIP profile unavailable')); paintChip(); return; }
  const email = guestEmail().toLowerCase();
  try { if (localStorage.getItem('pf-vip-conflict:'+email)) {progressConflict=true;paintChip();return;} } catch {}
  const owner = portraitAccountOwner();
  const currentLocal = snapshot();
  const existingCloud = profile.penny_fever;
  const differentOwner = !!(owner && email && owner !== email);
  const differentPlayer = !!(existingCloud?.player_id && currentLocal.player_id !== existingCloud.player_id && owner !== email);
  if (existingCloud && meaningfulProgress(currentLocal) && (differentOwner || differentPlayer || (!owner && !existingCloud.player_id))) {
    collectionChoice={email};
    paintChip();
    return;
  }
  if (existingCloud && owner !== email && !meaningfulProgress(currentLocal)) {
    // A fresh device adopts exactly the VIP player rather than adding its defaults.
    clearPlayerProgress();
    pending=null;
  }
  if(differentOwner && !existingCloud) {
    // This is an empty VIP account: attach the existing device player only.
    pending=null;
  }
  const lapsedKey = 'pf-vip-lapsed:' + email;
  let lapsed = null;
  try { lapsed = JSON.parse(localStorage.getItem(lapsedKey) || "null"); } catch {}
  if (lapsed && existingCloud && owner === email && Number.isSafeInteger(existingCloud.progress_revision)) {
    // Signed in again after a lapse: keep what this phone earned meanwhile, then save it to the VIP.
    const local = snapshot();
    progressRevision = existingCloud.progress_revision;
    applySnapshot(existingCloud); // union of treasures and doll sets
    window.PennyFever?.restorePocket?.({pennies:local.pennies,tickets:local.tickets,admitPassed:local.admitPassed,admitTicket:local.admitTicket});
    const state = window.PennyFever?.getState?.();
    if (state) { state.pennyPacks = local.penny_packs; window.PennyFever?.saveState?.(); }
    syncReady = true;
    try { if (await pushSave(snapshot())) localStorage.removeItem(lapsedKey); }
    catch (err) { console.warn("[pf-vip] resync after sign-in", err); }
    await connectVerifiedBanking('vip');
    paintChip();
    return;
  }
  syncReady = true;
  const cloud = profile && profile.penny_fever;
  progressRevision = Number.isSafeInteger(cloud?.progress_revision) ? cloud.progress_revision : 0;
  if (cloud && (cloud.pennies != null || cloud.hash)) {
    // First upgrade of an already-linked browser: keep its local wallet,
    // which may be newer than the old VIP save, while adopting its collection.
    const firstUpgrade = owner === email && cloud.treasures == null;
    const localBefore = firstUpgrade ? snapshot() : null;
    if (localBefore) {
      try { localStorage.setItem('pf-vip-upgrade-backup:'+email,JSON.stringify({snapshot:localBefore,at:Date.now()})); }
      catch (err) { syncReady=false; console.warn('[pf-vip] cannot protect existing progress',err); return; }
    }
    applySnapshot(localBefore ? {...cloud,pennies:localBefore.pennies,tickets:localBefore.tickets,admitPassed:localBefore.admitPassed,admitTicket:localBefore.admitTicket} : cloud);
    const merged = snapshot();
    if (!sameFelixClaims(merged, cloud) || cloud.treasures == null || cloud.curios == null || cloud.doll_sets == null || cloud.penny_packs == null || (merged.doll_mine && cloud.doll_mine == null) || JSON.stringify(merged.treasures) !== JSON.stringify(cloud.treasures) || JSON.stringify(merged.curios) !== JSON.stringify(cloud.curios) || JSON.stringify(merged.doll_sets) !== JSON.stringify(cloud.doll_sets)) {
      try { await pushSave(merged); } catch (err) {
        console.warn("[pf-vip] Felix collection merge", err);
      }
    }
  } else {
    const current = snapshot();
    const base = pending || current;
    const initial = {
      ...base,
      felix_vendor_portrait_book: current.felix_vendor_portrait_book,
      felix_vendor_portraits: current.felix_vendor_portraits,
    };
    rememberPortraitAccount();
    try { await pushSave(initial); } catch (err) {
      console.warn("[pf-vip] first save", err);
    }
  }
  await connectVerifiedBanking(!existingCloud && verifiedBanking()?.hasGuest ? 'guest' : 'vip');
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
  verifiedBanking();
  paintChip();
  if (mounted) return;
  mounted = true;
  syncOnArrival().catch(err => {verifiedBanking()?.fail(err);console.warn('[pf-vip] purse connection',err);});
  const door = document.getElementById("pfVipDoor");
  door?.addEventListener("click", () => {
    try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(snapshot())); } catch {}
    if (!signedIn()) door.setAttribute("href", vipJoinUrl());
  });
  // The alley creates its HUD after the first mount. Delegate so that new
  // HUD nodes get the same VIP gate without mounting save listeners twice.
  document.addEventListener("click", (event) => {
    if (!event.target?.closest?.("#pfVipHud")) return;
    event.preventDefault();
    if (openPlayerChoice()) return;
    if (signedIn()) {
      try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(snapshot())); } catch {}
      pushSave().catch((err) => console.warn("[pf-vip] save", err));
    }
    if (tradeshowBlocked()) return;
    openTradeshow();
  });
  window.addEventListener("pennyfever:inventoryaward", event => {
    if (!signedIn()) return;
    const ids = event.detail?.ids || [];
    if (!ids.length) return;
    rememberPortraitAccount();
    pushSave().catch(err => console.warn("[pf-vip] Felix collection save", err));
    if (window.PennyFeverVerified?.required) {
      window.PennyFeverVerified.bank().catch(() => {});
      return;
    }
    const drips = new Set(["star-token", "moon-penny", "rose-penny", "crown-token"]);
    const email = guestEmail();
    ids.filter((id) => drips.has(id)).forEach((item) => {
      fetch(`${API_BASE}/api/penny-fever/drips/credit`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, item, stall: event.detail?.stall || "vip-play"}),
      }).catch(() => {});
    });
  });
  setInterval(() => {
    if (!signedIn()) {
      // The sign-in clock ran out mid-visit: stop quietly pretending to save.
      if (syncReady && guestEmail()) markLapsed(guestEmail());
      return;
    }
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
