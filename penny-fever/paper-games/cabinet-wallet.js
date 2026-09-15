import {alleyPlay, pocket, spend, credit as liveCredit, packs as livePacks, packFive as livePackFive, unpackFive as liveUnpackFive} from './wallet.js?v=iris-pack-1';
const KEY = 'pennyFever.cabinetPracticePurse.v1';
const PACK_KEY = 'pennyFever.cabinetPracticePacks.v1';
function read() { try { const n = JSON.parse(localStorage.getItem(KEY) || 'null')?.pennies; if (Number.isFinite(n)) return Math.max(0, Math.floor(n)); } catch {} return 24; }
function write(n) { localStorage.setItem(KEY, JSON.stringify({pennies:n})); return n; }
function readPacks() { try { const n = JSON.parse(localStorage.getItem(PACK_KEY) || 'null')?.packs; if (Number.isFinite(n)) return Math.max(0, Math.floor(n)); } catch {} return 0; }
function writePacks(n) { localStorage.setItem(PACK_KEY, JSON.stringify({packs:n})); return n; }
export const pennies = () => alleyPlay ? pocket() : read();
export const packs = () => alleyPlay ? livePacks() : readPacks();
export function debit(n) { if (alleyPlay) return spend(n); const have=read(); if(have<n) return false; write(have-n); return true; }
export function credit(n) { return alleyPlay ? liveCredit(n) : write(read()+n); }
export function refillIfEmpty(min=24) { if(alleyPlay) return pocket(); return read()<1 ? write(min) : read(); }
export function packFive() {
  if (pennies() < 5) return false;
  if (alleyPlay) return livePackFive();
  if (!debit(5)) return false;
  writePacks(readPacks() + 1);
  return true;
}
export function unpackFive() {
  if (packs() < 1) return false;
  if (alleyPlay) return liveUnpackFive();
  writePacks(readPacks() - 1);
  credit(5);
  return true;
}
