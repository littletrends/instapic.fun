(() => {
  const storageKey = "pennyFeverGameFiles";
  const list = document.getElementById("session-list");
  const empty = document.getElementById("empty-state");
  const count = document.getElementById("file-count");
  const template = document.getElementById("session-template");
  const gameSessionTemplate = document.getElementById("game-session-template");

  function readFiles() {
    try {
      const files = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(files) ? files.filter((file) => file && /^PF-[A-HJ-NP-Z]{6}$/.test(file.code)) : [];
    } catch (_) {
      return [];
    }
  }

  function downloadLink(link, data, filename) {
    link.href = data;
    link.download = filename;
  }

  function render() {
    const files = readFiles();
    list.replaceChildren();
    empty.hidden = files.length > 0;
    count.textContent = files.length ? `${files.length} game ${files.length === 1 ? "code" : "codes"} saved` : "";
    count.hidden = !files.length;
    files.forEach((file) => {
      const node = template.content.cloneNode(true);
      node.querySelector(".session-code").textContent = file.code;
      const sessions = Array.isArray(file.sessions) ? file.sessions : (file.strip ? [{ strip: file.strip, savedAt: file.savedAt }] : []);
      const validSessions = sessions.filter((session) => typeof session?.strip === "string" && session.strip.startsWith("data:image/"));
      node.querySelector(".session-count").textContent = `${validSessions.length} saved ${validSessions.length === 1 ? "session" : "sessions"} · use this code whenever you come back`;
      const gameBonus = node.querySelector(".game-bonus-link");
      gameBonus.href = `bonus.html?code=${encodeURIComponent(file.code)}`;
      const sessionList = node.querySelector(".sessions-list");
      validSessions.forEach((session, index) => {
        const sessionNumber = validSessions.length - index;
        const sessionNode = gameSessionTemplate.content.cloneNode(true);
        sessionNode.querySelector(".game-session-label").textContent = `SESSION ${sessionNumber}`;
        sessionNode.querySelector(".strip-image").src = session.strip;
        downloadLink(sessionNode.querySelector(".strip-download"), session.strip, `penny-fever-${file.code}-session-${sessionNumber}-strip.jpg`);
        sessionList.append(sessionNode);
      });
      const addSession = node.querySelector(".add-session-link");
      const nextSessionUrl = new URL("felix-booth.html?v=carnival-43", window.location.href);
      nextSessionUrl.searchParams.set("gameCode", file.code);
      addSession.href = nextSessionUrl.href;
      const date = file.savedAt ? new Date(file.savedAt) : null;
      node.querySelector(".saved-date").textContent = date && !Number.isNaN(date.valueOf()) ? `Saved ${date.toLocaleString()}` : "Penny Fever game session";
      if (!validSessions.length) sessionList.previousElementSibling.hidden = true;
      node.querySelector(".remove-file").addEventListener("click", () => {
        if (!window.confirm(`Remove ${file.code} and its saved strips from this browser? This cannot be undone.`)) return;
        const next = readFiles().filter((item) => item.code !== file.code);
        localStorage.setItem(storageKey, JSON.stringify(next));
        render();
      });
      list.append(node);
    });
  }

  render();
})();
