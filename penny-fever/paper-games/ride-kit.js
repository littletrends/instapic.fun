/** Penny Fever amusement rides — shared helpers.
 * Rides are EXPERIENCES: pay once, board, ride the whole trip with NPCs, disembark.
 * NOT skill chapters. NOT treasure stamps. NOT hop-off-and-win.
 */

export function npc(name, seat, look, line) {
  return { name, seat, look: look || 'idle', line: line || '', wave: 0 };
}

/** Simple ease 0..1 */
export function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Advance trip progress; returns true when finished */
export function advanceTrip(s, dt, durationSec) {
  if (s.phase !== 'riding') return false;
  s.t = (s.t || 0) + dt;
  s.progress = Math.min(1, s.t / durationSec);
  if (s.progress >= 1) {
    s.phase = 'done';
    s.note = s.exitNote || 'All off — mind the step.';
    return true;
  }
  return false;
}

export function beat(progress, marks) {
  // marks: [{at:0.2, id:'crest'}, ...] — return current beat id
  let cur = marks[0]?.id || 'start';
  for (const m of marks) if (progress >= m.at) cur = m.id;
  return cur;
}
