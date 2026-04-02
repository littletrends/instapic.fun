(function () {
  function qs(sel) {
    return document.querySelector(sel);
  }

  function showFlash(message) {
    const flash = qs("#flash");
    if (!flash) return;
    flash.hidden = false;
    flash.textContent = message;
  }

  function makeTicketCard(session) {
    const wrap = document.createElement("div");
    wrap.className = "dashboard-card";

    const code = String(session.ticket_code || "").trim();
    const status = String(session.status || "").trim() || "ISSUED";
    const pkg = String(session.package_id || "").trim() || "Instapic Package";

    wrap.innerHTML = `
      <h2>${code || "Pending code"}</h2>
      <p><strong>Status:</strong> ${status}</p>
      <p><strong>Package:</strong> ${pkg}</p>
      <p style="margin-top:1rem;">
        <a href="ticket.html?code=${encodeURIComponent(code)}" class="portal-button">
          <span class="portal-label">Open Ticket</span>
        </a>
      </p>
      <p style="margin-top:0.75rem;">
        <a href="session.html" class="secondary-link">Use this code at booth / reopen later</a>
      </p>
    `;
    return wrap;
  }

  async function initMyInstapic() {
    const page = document.body?.dataset?.page || "";
    if (page !== "my-instapic") return;

    const guest = window.InstapicGuestIdentity?.read?.() || {};
    const email = String(guest.email || "").trim();
    const summary = qs("#guest-summary");
    const grid = qs(".dashboard-grid");

    if (!email) {
      showFlash("No guest email found. Sign in first.");
      return;
    }

    if (summary) {
      summary.textContent = `Signed in as ${email}. Open your saved tickets, jump back into bonus content, or enter a code manually.`;
    }

    try {
      const apiBase = window.InstapicGuestIdentity.API_BASE;
      const res = await fetch(`${apiBase}/api/guest/profile/${encodeURIComponent(email)}`);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      window.InstapicGuestIdentity.write({
        ...guest,
        email,
        verified: true,
        guest_profile: data.guest_profile || {}
      });

      const sessions = Array.isArray(data.guest_profile?.sessions) ? data.guest_profile.sessions : [];

      if (grid && sessions.length) {
        const existingCards = Array.from(grid.querySelectorAll(".dashboard-card"));
        existingCards.forEach((card, idx) => {
          if (idx === 0) card.remove();
        });

        const firstCard = grid.querySelector(".dashboard-card");
        sessions.forEach((session) => {
          const card = makeTicketCard(session);
          if (firstCard) {
            grid.insertBefore(card, firstCard);
          } else {
            grid.appendChild(card);
          }
        });
      }
    } catch (err) {
      showFlash(`Could not load saved tickets: ${err.message}`);
    }
  }

  document.addEventListener("DOMContentLoaded", initMyInstapic);
})();
