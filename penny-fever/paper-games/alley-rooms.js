/* Thin alley hook: one disposable paper interior, never a second carnival.
 * Loaded before the core router. Marina/Celeste keep their approved mounts.
 * This is runtime/CSS separation, not an authentication or security boundary. */
(() => {
  'use strict';
  const base = new URL('.', document.currentScript.src);
  const ids = new Set(['fortune','love','curios','snap','whisper','ball-toss','coin-pusher','pinball','milk-bottles','cover-the-spot','mutoscope','high-striker','catoptromancy','bent-rings','plinko','fairy-floss','popcorn','duck-pond','skee-ball','penny-pitch','dunk-tank','marquee','pack','pass']);
  let root, mount, heading, status, current = '', frame = null, timer = 0;
  function build() {
    if (root) return;
    root = document.createElement('section');
    root.id = 'pfPaperRoom'; root.hidden = true;
    root.setAttribute('aria-label', 'Penny Fever paper game');
    const bar = document.createElement('header'), back = document.createElement('button'), list = document.createElement('a');
    back.type = 'button'; back.textContent = '← Back to the alley';
    back.addEventListener('click', () => { location.hash = 'alley'; });
    heading = document.createElement('span'); heading.id = 'pfPaperRoomTitle';
    list.href = base.href; list.textContent = 'All 26 games';
    bar.append(back, heading, list);
    status = document.createElement('p'); status.className = 'pf-paper-room-status'; status.setAttribute('role', 'status');
    mount = document.createElement('div'); mount.className = 'pf-paper-room-mount';
    root.append(bar, status, mount); document.body.append(root);
  }
  function close(slug) {
    if (!current || slug && slug !== current) return false;
    clearTimeout(timer); timer = 0;
    if (frame) { frame.src = 'about:blank'; frame.remove(); frame = null; }
    current = ''; root.hidden = true; root.inert = true;
    document.body.classList.remove('pf-paper-room-open');
    return true;
  }
  function open(slug) {
    if (!ids.has(slug)) return false;
    if (current === slug && frame) return true;
    close(); build(); current = slug;
    root.hidden = false; root.inert = false;
    document.body.classList.add('pf-paper-room-open');
    heading.textContent = 'A new paper world';
    status.textContent = 'Unfolding this room’s artwork…'; status.hidden = false;
    frame = document.createElement('iframe');
    frame.title = 'Penny Fever — ' + slug.replaceAll('-', ' ');
    frame.allow = "camera 'none'; microphone 'none'; geolocation 'none'; payment 'none'";
    frame.referrerPolicy = 'no-referrer';
    const url = new URL('play.html', base); url.searchParams.set('stall', slug); url.searchParams.set('room', 'alley');
    frame.src = url.href; mount.append(frame);
    timer = setTimeout(() => {
      status.textContent = 'This room is taking longer to open. You can return to the alley or use All 26 games above.';
    }, 25000);
    return true;
  }
  window.addEventListener('message', event => {
    if (!frame || event.source !== frame.contentWindow || event.origin !== location.origin) return;
    const data = event.data;
    if (!data || data.channel !== 'pf-paper-world') return;
    if (data.type === 'ready') {
      clearTimeout(timer); status.hidden = true;
      heading.textContent = typeof data.title === 'string' ? data.title.slice(0, 100) : 'Penny Fever';
      frame.title = heading.textContent;
    } else if (data.type === 'error') {
      clearTimeout(timer); status.hidden = false;
      status.textContent = 'This workshop room needs attention. The return-to-alley button is still available.';
    } else if (data.type === 'leave') location.hash = 'alley';
    else if (data.type === 'open' && (ids.has(data.id) || ['lookup', 'water-gun'].includes(data.id))) location.hash = 'cabinet/' + data.id;
  });
  window.addEventListener('pagehide', () => close());
  window.PennyFeverPaperRooms = Object.freeze({ supports: id => ids.has(id), open, close, active: () => current });
})();
