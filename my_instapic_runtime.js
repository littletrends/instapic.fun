(function () {
  function qs(sel) {
    return document.querySelector(sel);
  }

  function makeTicketCard(session) {
    const wrap = document.createElement("div");
    wrap.className = "dashboard-card";

    const code = String(session.ticket_code || "").trim() || "Pending code";
    const pkg = String(session.package_id || "").trim();

    wrap.innerHTML = `
      <h2>${code}</h2>
      ${pkg ? `<p class="muted" style="margin-top:0.5rem;">${pkg}</p>` : ""}
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
    const list = qs("#saved-sessions-list");

    if (!email || !verified || !window.InstapicGuestIdentity?.isVerifiedSessionActive?.()) {
      window.location.href = "save.html";
      return;
    }

    if (summary) {
      summary.textContent = `Signed in as ${email}. Keep your saved booth codes together here so they’re easy to find when you arrive at the kiosk.`;
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

      if (list) {
        list.innerHTML = "";
        if (!sessions.length) {
          list.innerHTML = '<p class="muted">No saved booth codes yet.</p>';
        } else {
          sessions.forEach((session) => {
            list.appendChild(makeTicketCard(session));
          });
        }
      }
    } catch (err) {
      window.location.href = "save.html";
    }
  }

  document.addEventListener("DOMContentLoaded", initMyInstapic);
})();
