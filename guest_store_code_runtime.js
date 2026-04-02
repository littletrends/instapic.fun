(function () {
  function qs(sel) {
    return document.querySelector(sel);
  }

  function setStoreStatus(message, isError) {
    const el = qs("#store-code-status");
    if (!el) return;
    el.textContent = message || "";
    el.style.color = isError ? "#ffb3b3" : "";
  }

  function normalizeTicketCode(value) {
    return String(value || "").replace(/\D+/g, "").slice(0, 6);
  }

  async function storeCodeToGuest(email, ticketCode) {
    const apiBase = window.InstapicGuestIdentity?.API_BASE;
    if (!apiBase) {
      throw new Error("Guest API base not available");
    }

    const res = await fetch(`${apiBase}/api/guest/attach-ticket`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        ticket_code: ticketCode
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    return data;
  }

  async function initGuestStoreCode() {
    const page = document.body?.dataset?.page || "";
    if (page !== "my-instapic") return;

    const form = qs("#store-code-form");
    const input = qs("#store_ticket_code");
    if (!form || !input) return;

    input.addEventListener("input", function () {
      const cleaned = normalizeTicketCode(input.value);
      if (input.value !== cleaned) input.value = cleaned;
    });

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const guest = window.InstapicGuestIdentity?.read?.() || {};
      const email = String(guest.email || "").trim();
      const verified = !!guest.verified;
      const ticketCode = normalizeTicketCode(input.value);

      if (!email || !verified) {
        setStoreStatus("Please sign in to your guest area first.", true);
        return;
      }

      if (ticketCode.length !== 6) {
        setStoreStatus("Enter a valid 6-digit booth code.", true);
        return;
      }

      setStoreStatus("Storing your code...", false);

      try {
        await storeCodeToGuest(email, ticketCode);
        setStoreStatus("Code saved to your guest area.", false);
        input.value = "";
        window.location.reload();
      } catch (err) {
        setStoreStatus(`Could not store code: ${err.message}`, true);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initGuestStoreCode);
})();
