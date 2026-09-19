// Layout — Rosalie: Love Tester
import { HOLE, CONTROL, clipHole, unclip, paintHoleCourt, chapterHard } from '../play-field.js?v=layout-clear-1';
import { LOVE_CHAPTERS, LOVE_WINS } from '../love-arithmetic.js?v=love-ux-1';

export const meta = {
  id: 'love',
  host: 'Rosalie',
  title: 'Love Tester',
  kind: 'tent',
  keep: false,
  verb: 'Write names, count letters, reduce to a percentage',
  hole: 'Two name cards top, heart meter centre, result dial bottom of oval',
  loop: 'Enter names → count → reduce → read % → bonus on chapter target band',
  zones: ['name-a', 'name-b', 'heart-meter', 'result-dial'],
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

export function paintLayout(d, level = 0, opts = {}) {
  const L = Math.max(0, Math.min(5, level | 0));
  const spec = chapterSpec(L);
  paintHoleCourt(d, opts.court || {});
  clipHole(d);
  const cx = HOLE.cx, cy = HOLE.cy;

  d.ellipse(cx-90, cy-140, 80, 36, '#f0d0d8cc', '#c4a46a', 2);
  d.text(spec.aLabel || 'Name A', cx-90, cy-136, 13, '#5a3030');
  if (spec.twoNames) {
    d.ellipse(cx+90, cy-140, 80, 36, '#d0d8f0cc', '#c4a46a', 2);
    d.text(spec.bLabel || 'Name B', cx+90, cy-136, 13, '#303050');
  }
  d.ellipse(cx, cy+10, 70+L*8, 70+L*8, '#e8587888', '#f0d080', 3);
  d.text(spec.word || '%', cx, cy+18, 26, '#fff0cb');
  d.ellipse(cx, cy+160, 100, 28, '#3a3040cc', '#c4a46a', 2);
  d.text(spec.word || 'result', cx, cy+164, 16, '#f0d080');

  d.text(meta.title, cx, HOLE.top + 36, 18, '#fff0cb');
  d.text(chapterTitle(level), cx, HOLE.bottom - 28, 12, '#d8c098');
  unclip(d);
  (meta.controls || []).forEach((c, i, arr) => {
    const x = CONTROL.cx + (i - (arr.length - 1) / 2) * 140;
    d.ellipse(x, CONTROL.y, 64, 22, '#39434dcc', '#9a845e', 1.5);
    d.text(c.label, x, CONTROL.y + 5, 13, '#fff0ce');
  });
}

export default meta;
