const phone = (typeof matchMedia === 'function' && (
  matchMedia('(pointer: coarse) and (max-width: 920px)').matches
  || matchMedia('(max-width: 520px)').matches
)) || ((typeof navigator !== 'undefined') && (navigator.maxTouchPoints || 0) > 1 && Math.min(innerWidth, innerHeight) < 700);

export const phoneLane = !!phone;
export const PAPERCUT_NEAR = phoneLane ? 18 : 52;
export const PAPERCUT_SIDES = phoneLane ? 18 : 40;
export const PAPERCUT_INFLIGHT = phoneLane ? 1 : 2;
export const TEX_LIMIT = phoneLane ? 2 : 4;
export const WALL_NEAR = phoneLane ? 22 : 52;
export const WALL_RESIDENT = phoneLane ? 6 : 16;
