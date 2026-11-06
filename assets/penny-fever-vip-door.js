(() => {
  const trigger = document.getElementById("pf-aura-trigger");
  const nextDoor = document.getElementById("pf-next-door");
  if (!trigger || !nextDoor) return;

  let closeTimer = 0;
  trigger.addEventListener("click", () => {
    const opening = trigger.getAttribute("aria-expanded") !== "true";
    trigger.setAttribute("aria-expanded", String(opening));
    window.clearTimeout(closeTimer);

    if (opening) {
      nextDoor.hidden = false;
      requestAnimationFrame(() => nextDoor.classList.add("is-open"));
      return;
    }

    nextDoor.classList.remove("is-open");
    closeTimer = window.setTimeout(() => {
      if (trigger.getAttribute("aria-expanded") !== "true") nextDoor.hidden = true;
    }, 400);
  });
})();
