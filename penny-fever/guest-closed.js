/* Public GitHub Pages is closed while the alley is a private workshop. */
(function () {
  var host = location.hostname;
  if (host !== "instapic.fun" && host !== "www.instapic.fun") return;
  if (/\/closed\.html$/i.test(location.pathname)) return;
  location.replace("/penny-fever/closed.html");
})();
