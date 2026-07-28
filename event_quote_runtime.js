(function () {
  const status = document.getElementById("quote-status");
  const content = document.getElementById("quote-content");
  const token = new URLSearchParams(location.search).get("token") || "";
  const api = window.InstapicCore?.API_BASE || "";
  const money = (cents) => new Intl.NumberFormat("en-AU", {style:"currency",currency:"AUD"}).format(Number(cents || 0) / 100);
  const row = (label, value, strong) => `<div class="quote-row${strong ? " quote-total" : ""}"><span>${label}</span><span>${value}</span></div>`;
  const mirrorLabel = (equipment) => {
    if (equipment.preferred_mirror === "mirror1") return "Mirror 1 — black frame with bauble lights";
    if (equipment.preferred_mirror === "mirror2") return `Mirror 2 — ${equipment.frame_preference === "white" ? "white" : "gold"} frame with LED lights`;
    return "Either Magic Mirror — final machine to be confirmed";
  };
  const serviceLabel = (value) => value === "unattended" ? "Unattended self-service hire" : value === "attended" ? "Attended hire" : "Service type to be confirmed";

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
        ${row("Magic Mirror", mirrorLabel(equipment))}
        ${row("Service", serviceLabel(equipment.attendance))}
        ${row("Hire duration", `${quote.priced_hours || "—"} hours`)}
        ${event.guest_count ? row("Estimated guests", event.guest_count) : ""}
      </section>
      <section class="quote-box">
        <h2>Transparent price breakdown</h2>
        ${row(`${quote.priced_hours || ""}-hour Magic Mirror hire`, money(quote.hire_cents))}
        ${quote.attendant_cents ? row(`Event attendant ($75 × ${quote.priced_hours} hours)`, money(quote.attendant_cents)) : row("Event attendant", "Not included — self-service")}
        ${row("Travel", quote.travel_cents ? money(quote.travel_cents) : "Included")}
        ${quote.distance_km_one_way != null ? row("Estimated one-way distance", `${quote.distance_km_one_way} km`) : ""}
        ${quote.extras_cents ? row("Quoted extras", money(quote.extras_cents)) : row("Optional extras", "None charged")}
        ${quote.discount_cents ? row("Discount", `−${money(quote.discount_cents)}`) : ""}
        ${row("Quote total", money(quote.total_cents), true)}
        ${row("Booking deposit due to secure booking", money(quote.deposit_cents))}
        ${row("Remaining hire balance", money(quote.balance_cents))}
        ${quote.notes ? `<p>${quote.notes}</p>` : ""}
      </section>
      ${equipment.attendance === "unattended" ? `<section class="quote-box quote-important">
        <h2>Unattended-hire security bond</h2>
        <p>A separate <strong>$500 refundable security-bond authorisation</strong> is required for unattended hire. It is not an extra hire fee and is not included in the quote total above.</p>
        <p>The bond and remaining hire balance must be approved before the Magic Mirror is activated for use at the event. The bond is normally released after collection and inspection, less any permitted documented charge under the Terms.</p>
      </section>` : ""}
      <section class="quote-box">
        <h2>Before you accept</h2>
        <p>Accepting this quote moves the enquiry to the event-hire agreement stage. <strong>Your date and mirror are not booked or reserved until the agreement is accepted and the booking deposit is successfully paid.</strong></p>
        <p>Availability is checked again immediately before payment. If the quoted mirror becomes unavailable before the deposit is paid, no payment will be taken and this quote may be withdrawn or revised.</p>
        <p>This quote is subject to the <a href="terms.html" target="_blank" rel="noopener">Instapic Event Hire Terms</a>. The agreement will repeat the key conditions before payment.</p>
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
