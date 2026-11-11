/**
 * Marina — Water-Gun Fleet (stall `water-gun`). Closed tent: under construction.
 * Shared basis only: six chapters, 100 s house clock, chapter bonus at PRIZE_HOME,
 * door and economy from stall-entry.js. The game canvas is clean; new concept later.
 */
import {kits} from '../prizes.js?v=nft-art-1';
import {PRIZE_HOME} from '../chapter-kit.js?v=align-1';

const ID = 'water-gun';
const HOST = 'Marina';
const TITLE = 'Water-Gun Fleet';
const LEVELS = ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Chapter 6'];
const PRIZES = kits[ID].prizes;

export default {
  title: TITLE,
  chapterEnds: true,
  intro: HOST + '’s tent is under construction. A new game is on its way.',
  instructions: 'Under construction. Nothing to play yet.',
  levels: LEVELS,
  sprites: PRIZES,
  prizes: PRIZES,
  houseSeconds: 100,
  houseTitle: 'House lights',
  houseDetail: HOST + '’s tent is under construction.',
  actions: [],
  clockRuns: () => false,
  create(level) {
    return {level, t: 0, note: TITLE + ' · under construction'};
  },
  update(s, dt) { s.t = (s.t || 0) + dt; },
  pointer() {},
  action() {},
  key() {},
  draw(s, d) {
    d.text(HOST, 450, 118, 28, '#efe6d0');
    d.text(TITLE, 450, 154, 20, '#d2b98c');
    d.text(LEVELS[s.level] || LEVELS[0], 450, 190, 18, '#d2b98c');
    d.circle(PRIZE_HOME.x, PRIZE_HOME.y, PRIZE_HOME.w * 0.62, null, '#e8c87866', 2);
    d.text('Under construction', 450, 980, 24, '#f0d18f');
  },
  readout: s => s.note,
};
