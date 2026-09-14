// Keep the doorway and cabinet games independent of the 3D alley download.
let loading = null;
const needsAlley = () => /^#(foyer|arcade|alley|booth)$/.test(location.hash)
  && new URLSearchParams(location.search).get('paperMap') !== '1';
function loadAlley() {
  if (!needsAlley() || loading || window.PennyFeverWorld) return;
  loading = import('./alley.js?v=phone-startup-1').catch(error => {
    loading = null;
    console.warn('Penny Fever alley could not load', error);
    if (needsAlley()) window.dispatchEvent(new Event('pf-world-error'));
  });
}
window.addEventListener('hashchange', loadAlley);
window.addEventListener('pageshow', loadAlley);
loadAlley();
