(() => {
  const little = document.getElementById("pf-little-door");
  const construction = document.getElementById("pf-under-construction");
  if (!little || !construction) return;

  little.addEventListener("click", () => {
    const opening = little.getAttribute("aria-expanded") !== "true";
    little.setAttribute("aria-expanded", String(opening));
    construction.hidden = !opening;
  });
})();
