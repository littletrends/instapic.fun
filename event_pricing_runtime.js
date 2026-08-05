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
    const regional = km > 30;
    if (regional && attendance.value !== "attended") attendance.value = "attended";
    const attendant = attendance.value === "attended" ? hours * 75 : 0;
    const travel = regional ? km * 2 : 0;
    const price = basePrices[hours] + attendant + travel;
    total.textContent = dollars(price);
    const parts = [`${hours}-hour hire ${dollars(basePrices[hours])}`];
    if (attendant) parts.push(`${regional ? "required attended service" : "attended service"} (${hours} × $75) ${dollars(attendant)}`);
    parts.push(regional ? `approx. return travel ${dollars(travel)}` : "travel included");
    breakdown.textContent = parts.join(" · ");
    bond.hidden = attendance.value !== "unattended";
    warning.hidden = false;
    if (regional) {
      warning.textContent = "This venue is over 30 km from Humpty Doo, so attended hire is mandatory. The attendant and approximate return-travel charges are included above; exact distance and availability are confirmed next.";
    } else if (attendance.value === "unattended") {
      warning.textContent = "Unattended hire is available only for venues within a 30 km radius of Humpty Doo.";
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
