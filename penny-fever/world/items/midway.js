import {games} from '../../paper-games/catalogue.js?v=tmpl-webp-1';
import {kits} from '../../paper-games/prizes.js?v=ride-games-1';

const STALL_ART = id => `assets/restyle/scene-turnarounds-2026-09-09/stalls/${id}/front.png`;
const VENDOR_ART = host => `assets/restyle/scene-turnarounds-2026-09-09/vendors/${host.toLowerCase()}/front.png`;
const FALLBACK_ART = id => `paper-games/assets/${id}.png`;

export const extras = [
  {
    id: 'ticket-booth',
    host: 'Aura',
    title: 'Ticket booth',
    blurb: 'Pennies, booth tickets, the admission heart, and the night suitcase after you walk in.',
    workshop: false,
    extra: true,
    prizes: ['everyday-penny', 'ticket-roll', 'admission-ticket', 'night-suitcase'],
    cover: 'assets/restyle/scene-turnarounds-2026-09-09/aura/ticket-booth/front.png',
    vendor: 'assets/restyle/scene-turnarounds-2026-09-09/aura/welcoming/front.png',
  },
  {
    id: 'collection-gift',
    host: 'The midway',
    title: 'Collection reward',
    blurb: 'Moonlight wardrobe — after the six Alley Ephemera are home.',
    workshop: false,
    extra: true,
    prizes: ['moonlight-wardrobe'],
    cover: 'assets/restyle/game-sprites/paper-doll-books/moonlight-wardrobe/front.png',
  },
];

export const stalls = [
  ...extras,
  ...games.map(g => ({
    id: g.id,
    host: g.host,
    title: g.title,
    blurb: g.blurb,
    workshop: !!g.workshop,
    extra: false,
    prizes: [...(kits[g.id]?.prizes || [])],
    cover: g.id === 'carousel' || g.id === 'balloons' ? FALLBACK_ART(g.id) : STALL_ART(g.id),
    vendor: VENDOR_ART(g.host),
  })),
];

export function stallById(id) {
  return stalls.find(s => s.id === id) || null;
}

export function stallForItem(itemId) {
  return stalls.find(s => s.prizes.includes(itemId)) || null;
}

export function stallItems(all, stall) {
  return (stall?.prizes || []).map(id => all.find(i => i.id === id)).filter(Boolean);
}

export function stallStats(all, stall) {
  const items = stallItems(all, stall);
  return {items, have: items.filter(i => i.owned).length, total: items.length};
}
