// Instapic main.js – shared across all pages

// Idle timeout (20 seconds → back to index.html)
(function () {
  const redirect = 'index.html';
  const timeout = 20000;
  let timer;

  function reset() {
    clearTimeout(timer);
    timer = setTimeout(() => location.href = redirect, timeout);
  }

  ['click','mousemove','keydown','touchstart','touchmove'].forEach(e => 
    document.addEventListener(e, reset, {passive:true})
  );

  reset();
})();

// Keypad handler for session.html
(function () {
  document.querySelectorAll('.keypad').forEach(kp => {
    const input = document.getElementById(kp.dataset.inputId);
    if (!input) return;

    kp.addEventListener('click', e => {
      const btn = e.target.closest('.keypad-key');
      if (!btn) return;

      const key = btn.dataset.key;
      const act = btn.dataset.action;
      let val = input.value || '';

      if (key && val.length < 6) input.value += key;
      else if (act === 'back') input.value = val.slice(0,-1);
      else if (act === 'clear') input.value = '';

      input.focus();
    });
  });
})();
