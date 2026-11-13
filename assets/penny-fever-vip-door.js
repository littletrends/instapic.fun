(() => {
  const little = document.getElementById("pf-little-door");
  if (!little) return;

  little.addEventListener("click", () => {
    location.assign('penny-fever/index.html?style=paper&rail=paper&tradeshow=1#aura-tradeshow');
  });
})();
