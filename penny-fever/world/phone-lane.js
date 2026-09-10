const phone = (typeof matchMedia === 'function' && (
  matchMedia('(pointer: coarse) and (max-width: 920px)').matches
  || matchMedia('(max-width: 520px)').matches
)) || ((typeof navigator !== 'undefined') && (navigator.maxTouchPoints || 0) > 1 && Math.min(innerWidth, innerHeight) < 700);

export const phoneLane = !!phone;
export const PAPERCUT_NEAR = 52;
export const PAPERCUT_SIDES = phoneLane ? 8 : 28;
export const PAPERCUT_INFLIGHT = phoneLane ? 3 : 4;
export const TEX_LIMIT = phoneLane ? 4 : 6;
export const WALL_NEAR = phoneLane ? 36 : 52;
export const WALL_RESIDENT = phoneLane ? 10 : 16;
