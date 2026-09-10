// Runs before the main game modules so the old map never flashes during startup.
(() => {
  const root = document.documentElement;
  let timer;
  let startupError = '';
  const inAlley = () => /^#(foyer|arcade|alley)$/.test(location.hash);
  function showFailure(message) {
    clearTimeout(timer);
    document.getElementById('worldLoading')?.classList.add('loading-failed');
    const label = document.getElementById('worldLoadingMessage');
    if (label) label.textContent = message;
  }
  window.addEventListener('error', event => {
    const scriptFailed = event.target?.tagName === 'SCRIPT';
    if (!scriptFailed && !event.message) return;
    startupError = 'The midway could not finish loading. Please reload and try again.';
    if (inAlley() && root.classList.contains('world-loading')) showFailure(startupError);
  }, true);
  function sync() {
    clearTimeout(timer);
    root.classList.toggle('world-loading', inAlley());
    document.getElementById('worldLoading')?.classList.remove('loading-failed');
    const message = document.getElementById('worldLoadingMessage');
    if (message) message.textContent = 'Lighting the paper midway…';
    if (inAlley() && startupError) { showFailure(startupError); return; }
    if (inAlley()) timer = setTimeout(() => {
      if (window.PennyFeverWorld?.started && !window.PennyFeverWorld.paused) {
        root.classList.remove('world-loading');
      } else {
        showFailure('The midway has not finished loading. Please reload and try again.');
      }
    }, 20000);
  }
  window.addEventListener('hashchange', sync);
  window.addEventListener('pf-world-ready', () => {
    clearTimeout(timer);
    root.classList.remove('world-loading');
  });
  window.addEventListener('pf-world-error', () => {
    clearTimeout(timer);
    const message = document.getElementById('worldLoadingMessage');
    document.getElementById('worldLoading')?.classList.add('loading-failed');
    if (message) message.textContent = 'The 3D midway could not open. Please return to the entrance and try again.';
  });
  document.addEventListener('DOMContentLoaded', () => {
    const loading = document.createElement('section');
    loading.id = 'worldLoading';
    loading.innerHTML = `<div>
      <p>AURA’S PENNY FEVER</p>
      <img class="loading-aura" src="assets/restyle/paper-aura-seated.png" alt="Aura keeps you company while the midway opens" width="1024" height="1536" fetchpriority="high">
      <h1 id="worldLoadingMessage" role="status">Lighting the paper midway…</h1>
      <div class="loading-lights" aria-hidden="true"><span></span><span></span><span></span></div>
      <p class="loading-reassurance">“I’m right here, darling. We’re getting everything ready.”</p>
      <a href="#door">Back to the entrance</a>
      <button type="button" class="ticket-button" id="reloadMidway">Reload the midway</button>
    </div>`;
    document.body.append(loading);
    document.getElementById('reloadMidway').addEventListener('click', () => location.reload());
    sync();
    if (window.PennyFeverWorld?.started && !window.PennyFeverWorld.paused) {
      root.classList.remove('world-loading');
      clearTimeout(timer);
    }
  });
  sync();
})();
