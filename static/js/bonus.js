document.addEventListener("DOMContentLoaded", () => {
  const code = document.getElementById("sessionCodeDisplay")?.textContent.trim() || "";

  // Poll for updates
  function pollBonus() {
    fetch("/api/bonus-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket_code: code }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        // Update strip
        if (data.strip_ready) {
          const item = document.getElementById("strip-preview");
          const loader = item.querySelector(".loading-placeholder");
          if (loader) {
            loader.outerHTML = `<img src="${data.strip_url}?v=${Date.now()}" alt="Photo Strip" class="preview-img" />`;
            item.insertAdjacentHTML("beforeend", `<a href="${data.strip_url}" download class="btn btn-secondary portal-button">Download</a>`);
          }
        }
        // GIF
        if (data.gif_ready) {
          const item = document.getElementById("gif-preview");
          const loader = item.querySelector(".loading-placeholder");
          if (loader) {
            loader.outerHTML = `<img src="${data.gif_url}?v=${Date.now()}" alt="GIF" class="preview-img" />`;
            item.insertAdjacentHTML("beforeend", `<a href="${data.gif_url}" download class="btn btn-secondary portal-button">Download</a>`);
          }
        }
        // Boomerang
        if (data.boomerang_ready) {
          const item = document.getElementById("boomerang-preview");
          const loader = item.querySelector(".loading-placeholder");
          if (loader) {
            loader.outerHTML = `<video src="${data.boomerang_url}?v=${Date.now()}" autoplay loop muted playsinline class="preview-video"></video>`;
            item.insertAdjacentHTML("beforeend", `<a href="${data.boomerang_url}" download class="btn btn-secondary portal-button">Download</a>`);
          }
        }
      }
    })
    .catch(() => console.error("Poll failed—retrying..."));
  }

  setInterval(pollBonus, 5000);
  pollBonus();

  // Done: Back to home
  document.body.addEventListener("click", ev => {
    if (ev.target.closest("[data-action='bonus-done']")) window.location.href = "/";
  });
});
