(function () {
  try {
    var q = new URLSearchParams(location.search);
    if (q.get("dev") === "1") localStorage.setItem("pfDev", "1");
    if (q.get("dev") === "0") localStorage.removeItem("pfDev");
    if (localStorage.getItem("pfDev") === "1") document.documentElement.classList.add("pf-dev");
  } catch (e) {}
})();
