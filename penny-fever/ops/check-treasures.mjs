import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {stalls} from '../world/items/midway.js';
import {kits} from '../paper-games/prizes.js';
import {games} from '../paper-games/catalogue.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'world/items/model.js'), 'utf8');
const ctx = {};
ctx.globalThis = ctx;
vm.runInNewContext(src, ctx);
const model = ctx.PennyFeverInventoryModel;
assert(model?.books?.length, 'books export');
const bookIds = new Set(model.books.map(b => b.id));
const defIds = new Set(model.definitions.map(d => d.id));
const missingBooks = [];
const empty = [];
const covers = [];
for (const d of model.definitions) {
  if (!bookIds.has(d.book)) missingBooks.push(d.id + ' → ' + d.book);
}
for (const book of model.books) {
  const items = book.master
    ? model.definitions.filter(d => d.id !== book.id)
    : model.definitions.filter(d => d.book === book.id && d.id !== book.id);
  if (!items.length) empty.push(book.id);
  const cover = path.join(root, book.cover);
  if (!fs.existsSync(cover)) covers.push(book.cover);
}
assert.equal(missingBooks.length, 0, 'every item belongs to a shelf book: ' + missingBooks.join(', '));
assert.equal(covers.length, 0, 'book covers exist: ' + covers.join(', '));
assert.equal(empty.length, 0, 'every book has interior items: ' + empty.join(', '));

const inventory = fs.readFileSync(path.join(root, 'world/items/inventory.js'), 'utf8');
assert(inventory.includes('treasureTree'), 'tree view is mounted');
assert(inventory.includes('is-missing'), 'shaded missing slots');
assert(inventory.includes('openStall'), 'stalls open onto chapter pages');
assert(inventory.includes('treasureTree'), 'stalls are listed as a tree');
assert(inventory.includes('On the alley'), 'missing prizes stay on the alley');
assert(inventory.includes('tree-prize') || inventory.includes('Chapter '), 'chapter labels on prizes');

const master = model.books.find(b => b.master);
assert(master?.id === 'penny-collector-book', 'penny collector is the master book');

const alleyGames = games.filter(g => !g.workshop);
assert.ok(alleyGames.length >= 20, 'alley stalls in the catalogue');
const missingKits = alleyGames.filter(g => !kits[g.id]?.prizes?.length).map(g => g.id);
assert.equal(missingKits.length, 0, 'every alley game has six prizes: ' + missingKits.join(', '));

const missingDefs = [];
const short = [];
for (const stall of stalls.filter(s => !s.workshop && !s.extra)) {
  if (stall.prizes.length !== 6) short.push(stall.id + ':' + stall.prizes.length);
  for (const id of stall.prizes) if (!defIds.has(id)) missingDefs.push(stall.id + '/' + id);
}
assert.equal(short.length, 0, 'each game lists six chapters: ' + short.join(', '));
assert.equal(missingDefs.length, 0, 'stall prizes exist in the treasure model: ' + missingDefs.join(', '));

const pip = stalls.find(s => s.id === 'pinball');
assert.deepEqual(pip?.prizes, [
  'lightning-pin', 'star-token', 'pegboard-star', 'summer-sun-pin', 'bullseye-clock', 'looking-glass-locket',
]);

const missingCovers = stalls.filter(s => s.cover && !fs.existsSync(path.join(root, s.cover))).map(s => s.id + ':' + s.cover);
assert.equal(missingCovers.length, 0, 'stall covers exist: ' + missingCovers.join(', '));

console.log('PASS: ' + stalls.length + ' stalls, ' + model.books.length + ' books, ' + model.definitions.length + ' items.');
