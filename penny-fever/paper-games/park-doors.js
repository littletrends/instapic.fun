/** Live park doors from Penny Fever admin. Fallback: stall-entry under-construction list. */

import {isClosed, isUnderConstruction} from './stall-entry.js?v=insights-1';

const FILE = new URL('../game-doors.json?t=' + Date.now(), import.meta.url);
const NOTE_API = 'https://motherpc.taild1a44c.ts.net/api/penny-fever/tent-note';
const NOTE_READ = 'https://motherpc.taild1a44c.ts.net/api/penny-fever/tent-notes';

const SIGNS = {
  closed: (host) => `${host} has closed the tent for tonight.`,
  maintenance: (host) => `${host} is down for maintenance. The works are being mended.`,
  test: (host) => `${host} is in test — this tent isn’t taking guests yet.`,
};

const LABELS = {
  open: 'Open',
  test: 'In test',
  maintenance: 'Down for maintenance',
  closed: 'Closed',
};

let doors = {};
let loaded = false;
let pending = null;

export function parkStatus(id) {
  const key = String(id || '');
  if (loaded && Object.prototype.hasOwnProperty.call(doors, key)) {
    const value = String(doors[key] || 'open');
    if (value === 'test' || value === 'maintenance' || value === 'closed' || value === 'open') return value;
  }
  if (isUnderConstruction(key) || isClosed(key)) return 'maintenance';
  return 'open';
}

export function isParkShut(id) {
  return parkStatus(id) !== 'open';
}

export function parkDoorsLive() {
  return loaded && Object.keys(doors).length > 0;
}

export function parkLabel(id) {
  return LABELS[parkStatus(id)] || 'Open';
}

export function parkSign(id, host) {
  const status = parkStatus(id);
  const who = host || 'This host';
  return (SIGNS[status] || SIGNS.maintenance)(who);
}

export function loadParkDoors() {
  if (pending) return pending;
  pending = fetch(FILE.href, {cache: 'no-store'})
    .then((response) => (response.ok ? response.json() : {}))
    .then((data) => {
      doors = (data && (data.games || data.doors)) || {};
      loaded = true;
      try { window.dispatchEvent(new Event('pennyfever:doors')); } catch {}
    })
    .catch(() => { loaded = true; })
    .finally(() => { pending = null; });
  return pending;
}

export async function loadTentNotes(stall) {
  const id = String(stall || '').trim().toLowerCase();
  if (!id) return [];
  try {
    const response = await fetch(`${NOTE_READ}/${encodeURIComponent(id)}`, {
      cache: 'no-store',
      headers: {Accept: 'application/json'},
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.notes) ? data.notes : [];
  } catch {
    return [];
  }
}

export async function leaveTentNote({stall, host, name, note}) {
  const body = {
    stall: String(stall || '').slice(0, 40),
    host: String(host || '').slice(0, 40),
    status: parkStatus(stall),
    name: String(name || '').trim().slice(0, 40),
    note: String(note || '').trim().slice(0, 200),
  };
  if (!body.stall || !body.note) return {ok: false, error: 'missing_note'};
  const response = await fetch(NOTE_API, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Accept: 'application/json'},
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    return {ok: false, error: data.error || `HTTP ${response.status}`};
  }
  return {ok: true};
}

loadParkDoors();
