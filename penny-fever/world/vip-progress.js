// Local Penny Fever progress included in a VIP save. Kept separate from
// six-digit photo-booth sessions and from the anonymous insights identifier.
const DOLL='pf-paper-dolls-v11', SETS='pf-doll-sets-v1', PLAYER='pf-player-id-v1';
export function newPlayerId() { const id='player-'+(globalThis.crypto?.randomUUID?.() || Date.now().toString(36)+Math.random().toString(36).slice(2));localStorage.setItem(PLAYER,id);return id; }
export function playerId() { return localStorage.getItem(PLAYER) || newPlayerId(); }
export function setPlayerId(id) { if(typeof id==='string' && /^player-[a-zA-Z0-9-]+$/.test(id)) localStorage.setItem(PLAYER,id); }
function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } }
function obj(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
export function captureProgress(state) {
  const doll=read(DOLL,{}), sets=read(SETS,[]);
  return {player_id:playerId(), selected_doll:localStorage.getItem('pf-selected-crew-v1') || 'oliver', penny_packs:Math.max(0,Math.floor(Number(state?.pennyPacks)||0)), treasures:obj(state?.paperInventory?.items), curios:obj(state?.curios),
    ...(doll?.mine && typeof doll.mine==='object' ? {doll_mine:doll.mine} : {}), doll_sets:Array.isArray(sets)?sets:[]};
}
export function mergeProgress(state, cloud) {
  if (!state || !cloud) return false;
  let changed=false;
  if(cloud.player_id) setPlayerId(cloud.player_id);
  if (Number.isFinite(Number(cloud.penny_packs)) && cloud.penny_packs != null) { state.pennyPacks=Math.max(0,Math.floor(Number(cloud.penny_packs)));changed=true; }
  state.paperInventory=obj(state.paperInventory); state.paperInventory.items=obj(state.paperInventory.items); state.paperInventory.version=1;
  for(const [id,row] of Object.entries(obj(cloud.treasures))) { const current=state.paperInventory.items[id]; if (!current) {state.paperInventory.items[id]=row;changed=true;} else if (Number(row?.qty)>Number(current.qty||0)) { current.qty=row.qty;changed=true; } }
  state.curios=obj(state.curios);
  for(const [id,row] of Object.entries(obj(cloud.curios))) if (!state.curios[id]) {state.curios[id]=row;changed=true;}
  const mine=read(DOLL,{});
  if(cloud.doll_mine && typeof cloud.doll_mine==='object' && (!mine.mine || (Number(cloud.doll_mine.at)||0)>(Number(mine.mine.at)||0))) {
    localStorage.setItem(DOLL,JSON.stringify({...obj(mine),mine:cloud.doll_mine}));changed=true;
  }
  const local=read(SETS,[]), sets=Array.isArray(local)?local:[], byId=new Map(sets.filter(s=>s?.id).map(s=>[s.id,s]));
  for(const set of Array.isArray(cloud.doll_sets)?cloud.doll_sets:[]) if(set?.id && (!byId.has(set.id)||(Number(set.at)||0)>(Number(byId.get(set.id).at)||0))) {byId.set(set.id,set);changed=true;}
  if(changed && byId.size) localStorage.setItem(SETS,JSON.stringify([...byId.values()]));
  return changed;
}
