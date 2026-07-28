(function () {
  const status = document.getElementById("quote-status");
  const content = document.getElementById("quote-content");
  const token = new URLSearchParams(location.search).get("token") || "";
  const api = window.InstapicCore?.API_BASE || "";
  const money = (cents) => new Intl.NumberFormat("en-AU", {style:"currency",currency:"AUD"}).format(Number(cents || 0) / 100);
  const row = (label, value, strong) => `<div class="quote-row${strong ? " quote-total" : ""}"><span>${label}</span><span>${value}</span></div>`;

  async function request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  }

  async function respond(action) {
    const message = document.getElementById("quote-change-message")?.value || "";
    if (action === "REQUEST_CHANGES" && !message.trim()) {
      status.textContent = "Please tell us what you would like changed.";
      return;
    }
    if (action === "ACCEPT" && !confirm("Accept this quote and continue to the contract stage?")) return;
    document.querySelectorAll("button").forEach((button) => button.disabled = true);
    try {
      const result = await request(`${api}/api/booking/quotes/${encodeURIComponent(token)}/respond`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({action, message}),
      });
      status.textContent = result.status === "ACCEPTED"
        ? "Thank you — your quote has been accepted. Instapic will prepare your contract and deposit request."
        : "Your requested changes have been sent to Instapic.";
      content.hidden = true;
    } catch (error) {
      status.textContent = `Your response could not be saved: ${error.message}`;
      document.querySelectorAll("button").forEach((button) => button.disabled = false);
    }
  }

  async function load() {
    if (!token) throw new Error("This quote link is incomplete.");
    const data = await request(`${api}/api/booking/quotes/${encodeURIComponent(token)}`);
    const event = data.event || {}, venue = data.venue || {}, equipment = data.equipment || {}, quote = data.quote || {};
    content.innerHTML = `
      <section class="quote-box">
        <h2>${event.name || "Your event"}</h2>
        ${row("Occasion", event.occasion || "—")}
        ${row("Date", event.date || "—")}
        ${row("Time", `${event.start_time || "—"}–${event.finish_time || "—"}`)}
        ${row("Venue", [venue.venue_name,venue.address].filter(Boolean).join(" · ") || "—")}
        ${row("Mirror", equipment.preferred_mirror || "—")}
        ${row("Service", equipment.attendance || "—")}
      </section>
      <section class="quote-box">
        <h2>Pricing</h2>
        ${row("Mirror hire", money(quote.hire_cents))}
        ${quote.attendant_cents ? row("Attendant", money(quote.attendant_cents)) : ""}
        ${quote.travel_cents ? row("Travel", money(quote.travel_cents)) : ""}
        ${quote.extras_cents ? row("Extras", money(quote.extras_cents)) : ""}
        ${quote.discount_cents ? row("Discount", `−${money(quote.discount_cents)}`) : ""}
        ${row("Quote total", money(quote.total_cents), true)}
        ${row("Booking deposit", money(quote.deposit_cents))}
        ${row("Balance after deposit", money(quote.balance_cents))}
        ${quote.notes ? `<p>${quote.notes}</p>` : ""}
      </section>
      <section class="quote-box">
        <h2>Respond to your quote</h2>
        <p>Accepting moves this enquiry to the contract stage. Nothing is booked until the contract is completed and the deposit is paid.</p>
        <textarea id="quote-change-message" class="quote-message" placeholder="If you need changes, tell us what you would like adjusted."></textarea>
        <div class="quote-actions"><button class="btn" id="accept-quote">Accept quote</button><button class="secondary-link" id="request-changes">Request changes</button></div>
      </section>`;
    content.hidden = false;
    status.textContent = data.status === "ACCEPTED" ? "This quote has already been accepted." : "";
    if (data.status === "ACCEPTED") content.querySelector(".quote-actions").hidden = true;
    document.getElementById("accept-quote")?.addEventListener("click", () => respond("ACCEPT"));
    document.getElementById("request-changes")?.addEventListener("click", () => respond("REQUEST_CHANGES"));
  }
  load().catch((error) => { status.textContent = error.message || "Quote could not be loaded."; });
})();
