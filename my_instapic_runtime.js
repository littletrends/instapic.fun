(function () {
  function qs(sel) {
    return document.querySelector(sel);
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
    const verified = !!guest.verified;
    const summary = qs("#guest-summary");
    const grid = qs(".dashboard-grid");

    if (!email || !verified || !window.InstapicGuestIdentity?.isVerifiedSessionActive?.()) {
      window.location.href = "save.html";
      return;
    }

    if (summary) {
      summary.textContent = `Signed in as ${email}. Keep your saved booth codes together here so they are easy to find when you arrive at the kiosk.`;
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
      window.location.href = "save.html";
    }
  }

  document.addEventListener("DOMContentLoaded", initMyInstapic);
})();
