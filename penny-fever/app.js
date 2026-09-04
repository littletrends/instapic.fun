(function () {
  "use strict";

  const door = document.getElementById("discoveryDoor");
  const foyer = document.getElementById("foyer");
  const enter = document.getElementById("enterArcade");
  const leave = document.getElementById("leaveArcade");

  function showFoyer(updateLocation) {
    door.hidden = true;
    foyer.hidden = false;
    if (updateLocation !== false) history.replaceState(null, "", "#foyer");
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.getElementById("foyerTitle")?.focus?.();
  }

  function showDoor(updateLocation) {
    foyer.hidden = true;
    door.hidden = false;
    if (updateLocation !== false) history.replaceState(null, "", "#door");
    window.scrollTo({ top: 0, behavior: "smooth" });
    enter.focus();
  }

  enter.addEventListener("click", () => showFoyer(true));
  leave.addEventListener("click", () => showDoor(true));

  if (window.location.hash === "#foyer") showFoyer(false);
})();
