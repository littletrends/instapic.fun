(function () {
  const form = document.getElementById("event-enquiry-form");
  if (!form) return;
  const $ = (id) => document.getElementById(id);
  const mirror = $("preferred-mirror");
  const frame = $("frame-preference");
  const address = $("venue-address");
  const suggestions = $("venue-suggestions");
  const calculate = $("calculate-estimate");
  const estimateStatus = $("estimate-status");
  const estimateResult = $("estimate-result");
  const contactStage = $("enquiry-contact-stage");
  const continueButton = $("continue-enquiry");
  const submit = $("submit-enquiry");
  let latestEstimate = null;
  let locationTimer = null;

  function api(path) {
    return `${window.InstapicCore.API_BASE}${path}`;
  }
  function money(cents) {
    return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 2 }).format((Number(cents) || 0) / 100);
  }
  function setStatus(target, message, error) {
    target.textContent = message || "";
    target.style.color = error ? "#ffb2b2" : "#a9ffc7";
  }
  function updateFrames() {
    const choices = mirror.value === "mirror1"
      ? [["bauble", "Black frame with bauble lights"]]
      : mirror.value === "mirror2"
        ? [["", "Choose gold or white…"], ["gold", "Gold frame with LED lights"], ["white", "White frame with LED lights"]]
        : mirror.value === "either"
          ? [["unsure", "Either frame — recommend the best fit"]]
          : [["unsure", "Choose a mirror first…"]];
    frame.replaceChildren(...choices.map(([value, label]) => Object.assign(document.createElement("option"), { value, textContent: label })));
  }
  function invalidateEstimate() {
    latestEstimate = null;
    estimateResult.hidden = true;
    contactStage.hidden = true;
    contactStage.querySelectorAll("input,select,textarea,button").forEach((field) => {
      if (field.name !== "company_website") field.disabled = true;
    });
    submit.disabled = true;
    setStatus(estimateStatus, "", false);
  }
  function estimatePayload() {
    const data = Object.fromEntries(new FormData(form).entries());
    data.package_hours = Number(data.package_hours || 0);
    return data;
  }
  function finishTime(start, hours) {
    const parts = String(start || "").split(":").map(Number);
    if (parts.length !== 2 || parts.some(Number.isNaN)) return "";
    const total = parts[0] * 60 + parts[1] + Number(hours) * 60;
    return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  mirror.addEventListener("change", updateFrames);
  updateFrames();
  form.querySelectorAll("input[name=package_hours],#event-date,#start-time,#preferred-mirror,#frame-preference,#attendance,#extras-interest").forEach((field) => {
    field.addEventListener("change", invalidateEstimate);
  });

  address.addEventListener("input", () => {
    form.elements.latitude.value = "";
    form.elements.longitude.value = "";
    form.elements.place_id.value = "";
    invalidateEstimate();
    clearTimeout(locationTimer);
    suggestions.hidden = true;
    if (address.value.trim().length < 3) return;
    locationTimer = setTimeout(async () => {
      try {
        const response = await fetch(api(`/api/booking/locations?q=${encodeURIComponent(address.value.trim())}`));
        const result = await response.json();
        const locations = result.locations || [];
        suggestions.replaceChildren(...locations.map((location) => {
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = location.label;
          button.addEventListener("click", () => {
            address.value = location.label;
            form.elements.latitude.value = location.latitude;
            form.elements.longitude.value = location.longitude;
            form.elements.place_id.value = location.place_id || "";
            $("location-result").textContent = "Exact venue location selected for travel calculation.";
            suggestions.hidden = true;
          });
          return button;
        }));
        suggestions.hidden = locations.length === 0;
      } catch (_) {
        suggestions.hidden = true;
      }
    }, 350);
  });
  document.addEventListener("click", (event) => {
    if (!suggestions.contains(event.target) && event.target !== address) suggestions.hidden = true;
  });

  function renderEstimate(estimate) {
    const lines = [
      [`${estimate.package_hours}-hour Magic Mirror hire`, estimate.hire_cents],
      ["Attended service", estimate.attendant_cents],
      [`Travel (${estimate.return_km.toFixed(1)} km return)`, estimate.travel_cents],
    ];
    $("estimate-lines").replaceChildren(
      ...lines.filter(([, cents], index) => index === 0 || cents > 0).map(([label, cents]) => {
        const row = document.createElement("div");
        row.className = "estimate-row";
        row.innerHTML = `<span></span><strong></strong>`;
        row.firstElementChild.textContent = label;
        row.lastElementChild.textContent = money(cents);
        return row;
      }),
      (() => {
        const row = document.createElement("div");
        row.className = "estimate-row total";
        row.innerHTML = "<span>Estimated hire total</span><strong></strong>";
        row.lastElementChild.textContent = money(estimate.total_cents);
        return row;
      })(),
      (() => {
        const row = document.createElement("div");
        row.className = "estimate-row";
        row.innerHTML = "<span>Deposit to secure booking</span><strong></strong>";
        row.lastElementChild.textContent = money(estimate.deposit_cents);
        return row;
      })(),
      (() => {
        const row = document.createElement("div");
        row.className = "estimate-row";
        row.innerHTML = "<span>Balance after deposit</span><strong></strong>";
        row.lastElementChild.textContent = money(estimate.balance_cents);
        return row;
      })()
    );
    const availability = estimate.availability || {};
    const availableNames = (availability.available_mirrors || []).map((name) => name === "mirror1" ? "Mirror 1" : "Mirror 2").join(" and ");
    const availabilityBox = $("availability-result");
    if (availability.status === "AVAILABLE") {
      availabilityBox.className = "estimate-note estimate-available";
      availabilityBox.textContent = `✓ Timing check passed${availableNames ? ` — ${availableNames} available` : ""}. Final travel and booking confirmation still applies.`;
    } else if (availability.status === "UNAVAILABLE") {
      availabilityBox.className = "estimate-note estimate-conflict";
      availabilityBox.textContent = "This selection conflicts with an existing event. Send it through if you would like Instapic to check alternatives.";
    } else {
      availabilityBox.className = "estimate-note estimate-review";
      availabilityBox.textContent = "This timing needs a quick manual check before it can be confirmed.";
    }
    $("estimate-notes").replaceChildren(...(estimate.notes || []).map((note) => {
      const item = document.createElement("p");
      item.className = "estimate-note";
      item.textContent = note;
      return item;
    }));
    estimateResult.hidden = false;
    estimateResult.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  calculate.addEventListener("click", async () => {
    const firstSections = [...form.querySelectorAll(".enquiry-section")].slice(0, 3);
    const required = firstSections.flatMap((section) => [...section.querySelectorAll("[required]")]);
    if (required.some((field) => !field.reportValidity())) return;
    calculate.disabled = true;
    calculate.textContent = "Calculating…";
    setStatus(estimateStatus, "Checking availability, distance and price…", false);
    try {
      const response = await fetch(api("/api/booking/estimate"), {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(estimatePayload()),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error((result.fields || []).join(", ") || result.message || "Estimate unavailable");
      latestEstimate = result.estimate;
      form.elements.finish_time.value = latestEstimate.finish_time || finishTime(form.elements.start_time.value, form.elements.package_hours.value);
      renderEstimate(latestEstimate);
      window.InstapicAnalytics?.track("estimate_generated", { detail: String(latestEstimate.availability?.status || "") });
      setStatus(estimateStatus, "", false);
    } catch (error) {
      setStatus(estimateStatus, `We could not calculate that yet: ${String(error.message || error)}`, true);
    } finally {
      calculate.disabled = false;
      calculate.textContent = "Check availability & calculate price";
    }
  });

  continueButton.addEventListener("click", () => {
    if (!latestEstimate) return;
    contactStage.hidden = false;
    contactStage.querySelectorAll("input,select,textarea,button").forEach((field) => { field.disabled = false; });
    contactStage.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!latestEstimate || !form.reportValidity()) return;
    submit.disabled = true;
    submit.textContent = "Sending…";
    setStatus($("enquiry-status"), "Sending your itemised estimate for confirmation…", false);
    try {
      const raw = Object.fromEntries(new FormData(form).entries());
      raw.package_hours = Number(raw.package_hours || 0);
      raw.guest_count = Number(raw.guest_count || 0);
      raw.estimate = latestEstimate;
      const response = await fetch(api("/api/booking/enquiries"), {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(raw),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok === false) throw new Error(result.message || result.error || `HTTP ${response.status}`);
      setStatus($("enquiry-status"), `Thank you — estimate ${result.enquiry_id} is with Instapic for final confirmation. Nothing is booked until you accept the final quote and pay the deposit.`, false);
      submit.textContent = "Estimate sent";
      window.InstapicAnalytics?.track("enquiry_submitted");
    } catch (error) {
      setStatus($("enquiry-status"), `Your estimate could not be sent: ${String(error.message || error)}`, true);
      submit.disabled = false;
      submit.textContent = "Send estimate to Instapic";
    }
  });
})();
