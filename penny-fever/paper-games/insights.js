/** First-party play and visit reports. The server chooses the penny amount. */

const ENDPOINT = "https://motherpc.taild1a44c.ts.net/api/penny-fever";
const VISITOR_KEY = "pennyFever.visitor.v1";
const VISITOR_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{7,63}$/;

export function visitorId() {
  try {
    const existing = localStorage.getItem(VISITOR_KEY) || "";
    if (VISITOR_RE.test(existing)) return existing;
    const bytes = new Uint8Array(16);
    if (crypto?.getRandomValues) crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    const id = `v${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return "";
  }
}

function post(path, body) {
  const visitor = visitorId();
  if (!visitor) return;
  fetch(`${ENDPOINT}/${path}`, {
    method: "POST",
    headers: {"Content-Type": "application/json", Accept: "application/json"},
    body: JSON.stringify({...body, visitor}),
    keepalive: true,
  }).catch(() => {});
}

export function notePlay(stall, kind, repeats = 1) {
  const stallId = String(stall || "").trim().toLowerCase();
  if (!stallId || !kind) return;
  let left = Math.max(1, Math.floor(Number(repeats) || 1));
  while (left > 0) {
    const chunk = Math.min(20, left);
    post("tent-play", {stall: stallId, kind, repeats: chunk});
    left -= chunk;
  }
}

export function noteVisit(stall = "") {
  const stallId = String(stall || "").trim().toLowerCase();
  post("visit", stallId ? {stall: stallId} : {});
}
