(function () {
  const form = document.getElementById("guest-contact-form");
  const submit = document.getElementById("send-guest-message");
  const status = document.getElementById("guest-contact-status");
  if (!form) return;

  function show(message, error) {
    status.textContent = message || "";
    status.style.color = error ? "#ffb2b2" : "#a9ffc7";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    submit.disabled = true;
    submit.textContent = "Sending…";
    show("Sending your message privately to Instapic…", false);
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const response = await fetch(
        `${window.InstapicCore.API_BASE}/api/guest-enquiries`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok === false) {
        throw new Error(result.message || result.error || `HTTP ${response.status}`);
      }
      form.reset();
      show(
        `Thanks—your message has been received. Your reference is ${result.enquiry_id}. ` +
        "We’ve emailed you a confirmation; reply to that email if you need to add anything.",
        false
      );
      submit.textContent = "Message sent";
    } catch (error) {
      show(`Your message could not be sent: ${String(error.message || error)}`, true);
      submit.disabled = false;
      submit.textContent = "Send message";
    }
  });
})();
