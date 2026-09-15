import {phoneArt} from './phone-art.js';
// Keep the doorway and cabinet games independent of the 3D alley download.
let loading = null;
const needsAlley = () => /^#(foyer|arcade|alley|booth)$/.test(location.hash)
  && new URLSearchParams(location.search).get('paperMap') !== '1';
function loadAlley() {
  if (!needsAlley() || loading || window.PennyFeverWorld) return;
  if (!document.querySelector('[data-alley-arch-preload]')) {
    const link = document.createElement('link');
    link.rel = 'preload'; link.as = 'image'; link.fetchPriority = 'high';
    link.crossOrigin = 'anonymous';
    link.href = phoneArt('assets/restyle/paper-entrance-cutout.webp');
    link.dataset.alleyArchPreload = ''; document.head.append(link);
  }
  loading = import('./alley.js?v=nav-labels-1').catch(error => {
    loading = null;
    console.warn('Penny Fever alley could not load', error);
    if (needsAlley()) window.dispatchEvent(new Event('pf-world-error'));
  });
}
window.addEventListener('hashchange', loadAlley);
window.addEventListener('pageshow', loadAlley);
loadAlley();
