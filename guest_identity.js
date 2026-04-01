(function () {
  const KEY = "instapic_guest_identity";

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
    read,
    write,
    clear
  };
})();
