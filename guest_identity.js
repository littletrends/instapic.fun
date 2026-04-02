(function () {
  const KEY = "instapic_guest_identity";
  const API_BASE = window.location.hostname === "localhost"
    ? "http://localhost:5051"
    : "https://motherpc.taild1a44c.ts.net:5051";

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch {
      return {};
    }
  }

  function write(data) {
    localStorage.setItem(KEY, JSON.stringify(data || {}));
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  window.InstapicGuestIdentity = {
    API_BASE,
    read,
    write,
    clear
  };
})();
