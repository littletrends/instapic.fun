import {phoneLane} from './phone-lane.js?v=keep-light-1';

// Keep desktop originals; phones do not need full-size turnaround sheets.
const phoneFiles = new Set([
  'paper-entrance-cutout.webp', 'foyer-wall-turnaround.webp',
  'bluebell-turnaround.webp', 'ruby-turnaround.webp', 'violet-turnaround.webp',
  'oliver-turnaround.webp', 'sunny-turnaround.webp', 'rowan-turnaround.webp',
]);
export function phoneArt(url) {
  const name = String(url).split('/').pop();
  return phoneLane && phoneFiles.has(name)
    ? new URL('../assets/restyle/phone/' + name, import.meta.url).href : url;
}
