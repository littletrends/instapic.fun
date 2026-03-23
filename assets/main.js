// instapic.fun main JS

// -------- Global idle timeout (20 seconds) --------
(function () {
  var body = document.body;
  if (!body) return;

  var redirectPath = body.getAttribute("data-timeout-redirect");
  if (!redirectPath) return;

  var IDLE_TIMEOUT = 20000; // 20 seconds
  var idleTimer;

  function resetIdleTimer() {
    if (idleTimer) {
      clearTimeout(idleTimer);
    }
    idleTimer = setTimeout(function () {
      window.location.href = redirectPath;
    }, IDLE_TIMEOUT);
  }

  ["click", "mousemove", "keydown", "touchstart", "touchmove"].forEach(function (evt) {
    document.addEventListener(evt, resetIdleTimer, { passive: true });
  });

  // start immediately
  resetIdleTimer();
})();

// -------- On-screen keypad for code entry --------
(function () {
  var keypads = document.querySelectorAll(".keypad");
  if (!keypads.length) return;

  keypads.forEach(function (kp) {
    var inputId = kp.getAttribute("data-input-id");
    var input = document.getElementById(inputId);
    if (!input) return;

    kp.addEventListener("click", function (e) {
      var btn = e.target.closest(".keypad-key");
      if (!btn) return;

      var key = btn.getAttribute("data-key");
      var action = btn.getAttribute("data-action");
      var value = input.value || "";

      if (key) {
        if (value.length < 6) {
          input.value = value + key;
        }
      } else if (action === "back") {
        input.value = value.slice(0, -1);
      } else if (action === "clear") {
        input.value = "";
      }

      input.focus();
    });
  });
})();
