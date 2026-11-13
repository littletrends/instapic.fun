// Keep an explicit route back when Aura sends a visitor into a game.
const KEY = 'pennyFever.tradeshowReturn.v1';
let remembered = null;

function readReturn() {
  try { return JSON.parse(sessionStorage.getItem(KEY) || 'null') || remembered; }
  catch { return remembered; }
}

export function rememberTradeshowReturn(game) {
  if (typeof game !== 'string' || !/^[a-z0-9-]+$/.test(game)) return;
  remembered = {game};
  try { sessionStorage.setItem(KEY, JSON.stringify(remembered)); } catch {}
  queueMicrotask(updateReturnButton);
}

function updateReturnButton() {
  const target = readReturn();
  document.querySelectorAll('[data-tradeshow-return]').forEach(button => { button.hidden = true; });
  if (!target || location.hash !== '#cabinet/' + target.game) return;
  const room = document.getElementById('cabinet-' + target.game);
  const bar = room?.querySelector('.paper-game-bar');
  if (!bar) return;
  let button = bar.querySelector('[data-tradeshow-return]');
  if (!button) {
    const back = bar.querySelector('button');
    if (!back) return;
    button = document.createElement('button');
    button.type = 'button';
    button.dataset.tradeshowReturn = 'true';
    button.textContent = '← Aura’s tradeshow';
    button.addEventListener('click', () => {
      const previous = location.hash;
      // Use the room's existing exit so photo-save warnings, pagehide saves
      // and world cleanup still run. A cancelled exit stays in the game.
      back.click();
      setTimeout(() => {
        if (location.hash === previous) return;
        location.hash = 'aura-tradeshow';
        window.AuraTradeshow?.open?.();
      }, 0);
    });
    back.insertAdjacentElement('afterend', button);
  }
  button.hidden = false;
}

if (typeof document !== 'undefined' && typeof MutationObserver === 'function') {
  window.addEventListener('hashchange', updateReturnButton);
  const mount = () => {
    updateReturnButton();
    new MutationObserver(updateReturnButton).observe(document.body, {childList: true, subtree: true});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once: true});
  else mount();
}
