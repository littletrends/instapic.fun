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
    const code = String(session.ticket_code || "").trim() || "Pending code";
    const pkg = String(session.package_id || "").trim();
    const card = document.createElement("details");
    card.className = "vip-code-card";
    card.dataset.code = code;
    const summary = document.createElement("summary");
    const label = document.createElement("span");
    label.className = "vip-code-label";
    label.textContent = code;
    summary.append(label);
    const details = document.createElement("div");
    details.className = "vip-code-details";
    if (pkg) {
      const packageInfo = document.createElement("p");
      packageInfo.className = "muted";
      packageInfo.textContent = "Package: " + pkg;
      details.append(packageInfo);
    }
    const actions = document.createElement("div");
    actions.className = "ticket-actions ticket-actions-main";
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "btn copy-code-btn";
    copy.textContent = "Copy 6-digit code";
    copy.addEventListener("click", () => copyCode(code, copy));
    const open = document.createElement("a");
    open.href = "session.html?code=" + encodeURIComponent(code);
    open.className = "btn";
    open.textContent = "Open photos & bonuses";
    actions.append(copy, open);
    details.append(actions);
    card.append(summary, details);
    return card;
  }

  function filterBoothCodes() {
    const query = String(qs("#booth-code-search")?.value || "").trim().toLowerCase();
    const list = qs("#saved-sessions-list");
    if (!list) return;
    const cards = [...list.querySelectorAll(".vip-code-card")];
    let visible = 0;
    cards.forEach(card => {
      const match = !query || card.dataset.code.toLowerCase().includes(query);
      card.hidden = !match;
      if (match) visible++;
    });
    let message = list.querySelector(".vip-no-match");
    if (query && cards.length && !visible) {
      if (!message) {
        message = document.createElement("p");
        message.className = "vip-no-match";
        message.textContent = "No saved booth code matches that search.";
        list.append(message);
      }
    } else if (message) message.remove();
  }

  const PF_CODE = /^PF-[A-HJ-NP-Z]{6}$/;
  const PF_MANUAL_KEY = "pennyFeverVipDeviceCodes";
  let pfAccountCodes = [];
  function pfCodesOnDevice() {
    let files = [], manual = [];
    try { files = JSON.parse(localStorage.getItem("pennyFeverGameFiles") || "[]"); } catch (_) {}
    try { manual = JSON.parse(localStorage.getItem(PF_MANUAL_KEY) || "[]"); } catch (_) {}
    const codes = [...(Array.isArray(files) ? files.map(file => file?.code) : []), ...(Array.isArray(manual) ? manual : [])];
    return [...new Set(codes.map(code => String(code || "").trim().toUpperCase()).filter(code => PF_CODE.test(code)))];
  }
  function renderPfCodes() {
    const list = qs("#saved-pf-list");
    if (!list) return;
    list.replaceChildren();
    const codes = [...new Set([...pfAccountCodes, ...pfCodesOnDevice()])];
    if (!codes.length) {
      const note = document.createElement("p"); note.className = "vip-empty-note";
      note.textContent = "No Penny Fever photo codes found on this device yet."; list.append(note); return;
    }
    codes.forEach(code => {
      const card = document.createElement("details");
      card.className = "vip-code-card vip-pf-code";
      const summary = document.createElement("summary");
      const label = document.createElement("span");
      label.className = "vip-code-label";
      label.textContent = code;
      summary.append(label);
      const details = document.createElement("div");
      details.className = "vip-code-details";
      const state = document.createElement("p");
      state.className = "muted";
      state.textContent = pfAccountCodes.includes(code) ? "Saved to your VIP account" : "On this device";
      const actions = document.createElement("div");
      actions.className = "ticket-actions";
      const link = document.createElement("a");
      link.className = "btn";
      link.textContent = "Open Penny Fever bonus";
      link.href = "penny-fever/paper-games/workshop/bonus.html?code=" + encodeURIComponent(code);
      actions.append(link);
      if (!pfAccountCodes.includes(code)) {
        const save = document.createElement("button");
        save.type = "button";
        save.className = "btn";
        save.textContent = "Save to VIP";
        save.addEventListener("click", () => attachPfCode(code));
        actions.append(save);
      }
      details.append(state, actions);
      card.append(summary, details);
      list.append(card);
    });
  }

  async function attachPfCode(code) {
    const status = qs("#save-pf-status");
    status.textContent = "Saving PF code to VIP…";
    try {
      const identity = window.InstapicGuestIdentity;
      const response = await fetch(identity.API_BASE + "/api/guest/attach-felix-code", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:identity.read().email,code})});
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "save failed");
      pfAccountCodes = (data.guest_profile?.felix_codes || []).filter(item => PF_CODE.test(item));
      status.textContent = code + " saved to your VIP account."; renderPfCodes();
    } catch (_) { status.textContent = "Could not save " + code + " to VIP yet. Check the code or sign in again."; }
  }
  function setupPfCodes() {
    renderPfCodes();
    const form = qs("#save-pf-form"), input = qs("#save-pf-code"), status = qs("#save-pf-status");
    form?.addEventListener("submit", async event => {
      event.preventDefault();
      const code = String(input?.value || "").trim().toUpperCase();
      if (!PF_CODE.test(code)) { status.textContent = "Enter PF- followed by six letters (without I or O)."; return; }
      input.value = "";
      await attachPfCode(code);
    });
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
      summary.textContent = `Signed in as ${email}.`;
    }
    setupPfCodes();
    qs("#booth-code-search")?.addEventListener("input", filterBoothCodes);

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

      const fever = data.guest_profile?.penny_fever;
      const feverSummary = qs("#pf-spot-summary");
      const feverLink = qs("#pf-spot-continue");
      const feverLabel = qs("#pf-spot-label");
      const hasSpot = !!(fever && (fever.pennies != null || fever.hash));
      if (hasSpot) {
        const pennies = Number(fever.pennies) || 0;
        const tickets = Number(fever.tickets) || 0;
        if (feverSummary) {
          feverSummary.textContent =
            "Your locked-in player is waiting: " +
            pennies + (pennies === 1 ? " penny" : " pennies") +
            " · " + tickets + (tickets === 1 ? " ticket" : " tickets") +
            " · last saved at the " + (fever.hash || "alley") + ".";
        }
        if (feverLabel) feverLabel.textContent = "Continue · ticket desk";
        if (feverLink) {
          feverLink.href = "penny-fever/index.html?style=paper&rail=paper&v=vip-spot-2#door";
        }
      } else if (feverSummary) {
        feverSummary.textContent =
          "Enter Penny Fever through Aura’s door to link your game to this guest profile. Your saved pennies and alley place can then follow you when you return.";
      }

      pfAccountCodes = (Array.isArray(data.guest_profile?.felix_codes) ? data.guest_profile.felix_codes : []).filter(code => PF_CODE.test(code));
      renderPfCodes();
      const sessions = Array.isArray(data.guest_profile?.sessions) ? data.guest_profile.sessions : [];

      if (list) {
        list.innerHTML = "";
        if (!sessions.length) {
          list.innerHTML = '<p class="vip-empty-note">No booth codes saved here yet. Use “Save a booth code” above to add one.</p>';
        } else {
          sessions.forEach((session) => {
            list.appendChild(makeTicketCard(session));
          });
          filterBoothCodes();
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
