(function () {
  function qs(sel) {
    return document.querySelector(sel);
  }

  async function copyCode(code, btn) {
    const text = String(code || "").trim();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      if (btn) {
        const old = btn.textContent;
        btn.textContent = "Copied";
        setTimeout(() => { btn.textContent = old; }, 1200);
      }
    } catch (_) {
      // silent fallback
    }
  }

  function makeTicketCard(session) {
    const wrap = document.createElement("div");
    wrap.className = "dashboard-card";

    const code = String(session.ticket_code || "").trim() || "Pending code";
    const pkg = String(session.package_id || "").trim();

    wrap.innerHTML = `
      <h2>${code}</h2>
      ${pkg ? `<p class="muted" style="margin-top:0.5rem;">${pkg}</p>` : ""}

      <div class="ticket-actions ticket-actions-main" style="margin-top:1rem;">
        <button type="button" class="btn copy-code-btn" data-code="${code}">Copy Code</button>
        <a href="session.html?code=${encodeURIComponent(code)}" class="btn">Open Bonus Portal</a>
      </div>
    `;

    const copyBtn = wrap.querySelector(".copy-code-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        copyCode(code, copyBtn);
      });
    }

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

  
  // === prefill ticket_code from URL ===
  const params = new URLSearchParams(window.location.search);
  const ticketCode = String(params.get("ticket_code") || "").replace(/\D+/g, "").slice(0,6);

  if (ticketCode) {
    const input = document.getElementById("store_ticket_code");
    if (input) {
      input.value = ticketCode;
      input.focus();
    }
  }


document.addEventListener("DOMContentLoaded", initMyInstapic);
})();
