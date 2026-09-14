import {alleyPlay, pocket, spend, credit as liveCredit} from './wallet.js?v=entry-1';
const KEY = 'pennyFever.cabinetPracticePurse.v1';
function read() { try { const n = JSON.parse(localStorage.getItem(KEY) || 'null')?.pennies; if (Number.isFinite(n)) return Math.max(0, Math.floor(n)); } catch {} return 24; }
function write(n) { localStorage.setItem(KEY, JSON.stringify({pennies:n})); return n; }
export const pennies = () => alleyPlay ? pocket() : read();
export function debit(n) { if (alleyPlay) return spend(n); const have=read(); if(have<n) return false; write(have-n); return true; }
export function credit(n) { return alleyPlay ? liveCredit(n) : write(read()+n); }
export function refillIfEmpty(min=24) { if(alleyPlay) return pocket(); return read()<1 ? write(min) : read(); }
