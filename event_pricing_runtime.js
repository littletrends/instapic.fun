(function () {
  const cards = [...document.querySelectorAll(".events-price-card[data-hours]")];
  const attendance = document.getElementById("quick-attendance");
  const distance = document.getElementById("quick-distance");
  const total = document.getElementById("quick-estimate-total");
  const breakdown = document.getElementById("quick-estimate-breakdown");
  const bond = document.getElementById("quick-estimate-bond");
  const warning = document.getElementById("quick-estimate-warning");
  const next = document.getElementById("quick-check-date");
  if (!cards.length || !attendance || !distance || !total) return;

  const basePrices = { 3: 500, 4: 650, 5: 800, 6: 950 };
  let hours = 3;
  const dollars = (value) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(value);

  function update() {
    const km = Math.max(0, Number(distance.value) || 0);
    const outsideIncludedRadius = km > 30;
    const attendedRequired = km > 80;
    if (attendedRequired && attendance.value !== "attended") attendance.value = "attended";
    const attendant = attendance.value === "attended" ? hours * 75 : 0;
    const excessOneWayKm = Math.max(0, km - 30);
    const chargeableReturnKm = excessOneWayKm * 2;
    const travel = chargeableReturnKm;
    const price = basePrices[hours] + attendant + travel;
    total.textContent = dollars(price);
    const parts = [`${hours}-hour hire ${dollars(basePrices[hours])}`];
    if (attendant) parts.push(`${attendedRequired ? "required attended service" : "attended service"} (${hours} × $75) ${dollars(attendant)}`);
    parts.push(outsideIncludedRadius ? `excess return travel (${chargeableReturnKm.toFixed(0)} km × $1) ${dollars(travel)}` : "travel included");
    breakdown.textContent = parts.join(" · ");
    bond.hidden = attendance.value !== "unattended";
    warning.hidden = false;
    if (attendedRequired) {
      warning.textContent = "This venue is over 80 km from Humpty Doo. Attended service has been included as the starting estimate, with the final travel and service arrangement confirmed personally.";
    } else if (outsideIncludedRadius && attendance.value === "unattended") {
      warning.textContent = "Regional unattended hire is available up to 80 km, subject to event timing, safe setup and guaranteed collection access.";
    } else if (attendance.value === "unattended") {
      warning.textContent = "Unattended hire is available within 80 km, subject to event timing and collection access.";
    } else {
      warning.textContent = "Attended service is included in the estimate above at $75 for each booked hour.";
    }
    next.href = `event-enquiry.html?hours=${hours}&attendance=${encodeURIComponent(attendance.value)}&approx_km=${encodeURIComponent(km)}`;
  }

  cards.forEach((card) => card.addEventListener("click", () => {
    hours = Number(card.dataset.hours);
    cards.forEach((item) => item.classList.toggle("is-selected", item === card));
    update();
  }));
  attendance.addEventListener("change", update);
  distance.addEventListener("input", update);
  update();
})();
