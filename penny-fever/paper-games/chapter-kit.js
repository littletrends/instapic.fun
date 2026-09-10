// Shared helpers so extra chapters can keep scaling instead of falling off a 3-long table.
export const pick = (arr, i) => arr[Math.max(0, Math.min(i, arr.length - 1))];
export const pace = (level, start, step, floor) => Math.max(floor, start - level * step);
export const swell = (level, start, step, cap) => Math.min(cap, start + level * step);
