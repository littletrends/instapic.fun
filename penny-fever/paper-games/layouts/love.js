// Layout — Rosalie: Love Tester
import { HOLE, CONTROL, clipHole, unclip, paintHoleCourt, chapterHard } from '../play-field.js?v=layout-clear-1';
import { LOVE_CHAPTERS, LOVE_WINS } from '../love-arithmetic.js?v=love-layout-1';

export const meta = {
  id: 'love',
  host: 'Rosalie',
  title: 'Love Tester',
  kind: 'tent',
  keep: false,
  verb: 'Write names, count letters, reduce to a percentage',
  hole: 'Title stack + inward name plates in the cream oval; calc band; keyboard low in hole',
  loop: 'Enter names → count → reduce → read % → bonus on chapter target band',
  zones: ['title-stack', 'name-a', 'name-b', 'calc-band', 'keyboard'],
  controls: [{'id': 'count', 'label': 'Count'}],
  chapters: LOVE_CHAPTERS.map((c, i) => `Ch${i + 1} ${c.title}`),
};

export function chapterTitle(level) {
  const ch = LOVE_CHAPTERS[Math.max(0, Math.min(5, level | 0))];
  return ch ? `Ch${(level | 0) + 1} ${ch.title}` : meta.chapters[0];
}
export function harden(level) { return Math.max(0, Math.min(1, (level | 0) / 5)); }

/** Mirrors engine LOVE_CHAPTERS / LOVE_WINS so curves + planning see real chapter strategy. */
export function chapterSpec(level) {
  const L = Math.max(0, Math.min(5, level | 0));
  const ch = LOVE_CHAPTERS[L] || LOVE_CHAPTERS[0];
  const wins = LOVE_WINS[L] || LOVE_WINS[0];
  return {
    hard: harden(L),
    chapter: L + 1,
    id: ch.id,
    title: ch.title,
    word: ch.word,
    twoNames: !!ch.bLabel,
    aLabel: ch.aLabel,
    bLabel: ch.bLabel,
    prize: ch.prize,
    winCount: wins.length,
    winMin: Math.min(...wins),
    winMax: Math.max(...wins),
  };
}

/**
 * Soft court only. Stall draw owns title / plates / keyboard inside the blank hole.
 * Ghost décor removed so it no longer fights the live UI stack.
 */
export function paintLayout(d, level = 0, opts = {}) {
  paintHoleCourt(d, opts.court || {});
  clipHole(d);
  // Faint top lip cue — keeps the oval readable without overlapping chrome.
  d.ellipse(HOLE.cx, HOLE.top + 28, 120, 10, '#f8e4e844', null, 0);
  unclip(d);
}

export default meta;
