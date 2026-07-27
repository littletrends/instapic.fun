(function () {
  const form = document.getElementById("event-enquiry-form");
  const status = document.getElementById("enquiry-status");
  const submit = document.getElementById("submit-enquiry");
  const locationButton = document.getElementById("use-location");
  const locationResult = document.getElementById("location-result");
  if (!form) return;

  function setStatus(message, isError) {
    status.textContent = message || "";
    status.style.color = isError ? "#ffb2b2" : "#a9ffc7";
  }

  locationButton?.addEventListener("click", () => {
    if (!navigator.geolocation) {
      setStatus("This browser cannot provide a location pin. Enter the venue address instead.", true);
      return;
    }
    locationButton.disabled = true;
    locationResult.textContent = "Finding your location…";
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.elements.latitude.value = position.coords.latitude.toFixed(7);
        form.elements.longitude.value = position.coords.longitude.toFixed(7);
        locationResult.textContent = "Location pin added. Please still enter the venue address.";
        locationButton.disabled = false;
      },
      () => {
        locationResult.textContent = "Location could not be read. Enter the venue address instead.";
        locationButton.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    submit.disabled = true;
    submit.textContent = "Sending…";
    setStatus("Sending your event details…", false);
    try {
      const raw = Object.fromEntries(new FormData(form).entries());
      raw.guest_count = Number(raw.guest_count || 0);
      const response = await fetch(
        `${window.InstapicCore.API_BASE}/api/booking/enquiries`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(raw),
        }
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok === false) {
        throw new Error(result.message || result.error || `HTTP ${response.status}`);
      }
      form.reset();
      setStatus(
        `Thank you — your enquiry ${result.enquiry_id} has been received. We’ll review availability and prepare your quote.`,
        false
      );
      submit.textContent = "Enquiry sent";
    } catch (error) {
      setStatus(`Your enquiry could not be sent: ${String(error?.message || error)}`, true);
      submit.disabled = false;
      submit.textContent = "Send event enquiry";
    }
  });
})();
