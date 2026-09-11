const phone = (typeof matchMedia === 'function' && (
  matchMedia('(pointer: coarse) and (max-width: 920px)').matches
  || matchMedia('(max-width: 520px)').matches
)) || ((typeof navigator !== 'undefined') && (navigator.maxTouchPoints || 0) > 1 && Math.min(innerWidth, innerHeight) < 700);

export const phoneLane = !!phone;
// Keep only what the camera can actually see. Old NEAR=52 streamed half the alley
// and never released it, so a walk filled GPU memory and hitching got worse.
export const PAPERCUT_NEAR = phoneLane ? 16 : 20;
export const PAPERCUT_FAR = phoneLane ? 24 : 32;
export const PAPERCUT_SIDES = phoneLane ? 6 : 10;
export const PAPERCUT_INFLIGHT = phoneLane ? 2 : 3;
export const TEX_LIMIT = phoneLane ? 2 : 3;
export const WALL_NEAR = phoneLane ? 16 : 22;
export const WALL_RESIDENT = phoneLane ? 6 : 8;
