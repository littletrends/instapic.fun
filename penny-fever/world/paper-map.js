import {games} from '../paper-games/catalogue.js?v=briefs-2';
import {isParkShut, loadParkDoors, parkSign} from '../paper-games/park-doors.js?v=map-doors-3';
import {mountTill, openTill} from './ticket-till.js?v=bank-refresh-1';

const root = document.createElement('main');
root.id = 'pfPaperMap';
root.hidden = true;
root.innerHTML = `<header><p>AURA’S PENNY FEVER</p><h1>The paper midway</h1>
  <p>A little folded map. Choose a host, then step inside.</p></header>
  <div id="paperMapTools">
  <p id="paperPocket" role="status"></p>
  <nav aria-label="Paper midway"><button data-action="aura">Back to ticket booth</button>
  <button data-action="chat">Aura’s Tips</button><button data-action="treasures">Treasures</button>
  <a href="#door">Back to entrance</a><a href="../index.html" data-action="home">Home</a></nav>
  <p id="paperAdvice" role="status"></p></div>
  <section id="paperStalls" aria-label="Sideshow hosts"></section>
  <dialog id="paperBooth"><h2 id="paperBoothTitle"></h2><p id="paperBoothText"></p>
  <div id="paperBoothActions"></div><form method="dialog"><button>Back to the map</button></form></dialog>`;
document.body.append(root);
const find = id => root.querySelector('#' + id);
const booth = find('paperBooth');
booth.setAttribute('aria-labelledby', 'paperBoothTitle');
const api = () => window.PennyFever;
const advice = [
  'Aura punches your walk at the palace door. Play tickets and pennies are a separate pocket.',
  'Check a stall’s price before playing. Aura trades five pennies for one ticket, or sells packs through Square.',
  'Choose a host on the map to read about their stall. Enter only when you are ready.',
  'Find a keepsake, then open Treasures to see where it belongs in your books.',
];
let tip = 0;
function pocket() {
  const state = api()?.getState?.();
  find('paperPocket').textContent = state
    ? `${api().tickets()} tickets · ${api().pennies()} pennies`
    : 'Opening your pocket…';
}
function action(label, handler) {
  const button = document.createElement('button');
  button.textContent = label;
  button.onclick = handler;
  find('paperBoothActions').append(button);
}
function showBooth(title, description) {
  find('paperBoothTitle').textContent = title;
  find('paperBoothText').textContent = description;
  find('paperBoothActions').replaceChildren();
  if (!booth.open) booth.showModal();
}
function enterStall(game) {
  if (!api()?.getState?.()?.admitPassed && !isParkShut(game.id)) { aura(game); return; }
  booth.close();
  location.hash = 'cabinet/' + game.id;
}
const AURA_DOOR_TAPS_NEEDED = 3;
let paperAuraTaps = 0;
function aura(destination = null) {
  paperAuraTaps = 0;
  showBooth('Aura’s ticket desk', 'Show your admission ticket, trade pennies, or choose a pack. Tap Take ticket three times to walk in. Your place on the map will wait.');
  action('Take ticket · 3 taps', () => {
    const state = api()?.getState?.();
    if (!state) return;
    const laps = Number(state.alleyLaps) || 0;
    if (state.admitPassed) {
      find('paperBoothText').textContent = 'This lap is punched. Choose a host and enjoy the midway.';
      paperAuraTaps = 0;
      pocket();
      return;
    }
    paperAuraTaps += 1;
    if (paperAuraTaps < AURA_DOOR_TAPS_NEEDED) {
      find('paperBoothText').textContent = laps === 0
        ? `Take the ticket · ${paperAuraTaps}/${AURA_DOOR_TAPS_NEEDED} taps.`
        : `Pay a penny · ${paperAuraTaps}/${AURA_DOOR_TAPS_NEEDED} taps.`;
      const btn = find('paperBoothActions').querySelector('button');
      if (btn) btn.textContent = `${laps === 0 ? 'Take ticket' : 'Pay a penny'} · ${paperAuraTaps}/${AURA_DOOR_TAPS_NEEDED}`;
      return;
    }
    const admitted = api().admitAlleyLap(laps === 0 ? 'ticket' : 'penny');
    paperAuraTaps = admitted ? 0 : AURA_DOOR_TAPS_NEEDED - 1;
    find('paperBoothText').textContent = admitted ? 'Punched! Choose a host and enjoy the midway.' : 'You need a penny for the next lap.';
    if (admitted && destination) {
      showBooth('Your ticket is punched!', `${destination.host} is waiting at ${destination.title}. Ready to continue?`);
      action(`Continue to ${destination.title}`, () => enterStall(destination));
    }
    pocket();
  });
  action('Trade 5 pennies for 1 ticket', () => {
    find('paperBoothText').textContent = api()?.tradePenniesForTicket?.() ? 'One ticket tucked into your pocket.' : 'You need five pennies to trade.';
    pocket();
  });
  action('Buy tickets and pennies', () => {
    if (!api()) return;
    booth.close();
    mountTill(api());
    openTill({pin: true});
  });
}
for (const game of games.filter(game => game.ready && !game.workshop)) {
  const button = document.createElement('button');
  button.className = 'paper-map-stall';
  button.textContent = `${game.host} · ${game.title}`;
  button.onclick = () => {
    const shut = isParkShut(game.id);
    showBooth(`${game.host} · ${game.title}`, shut ? `${game.blurb}\n\n${parkSign(game.id, game.host)}` : game.blurb);
    action(shut ? 'Greet / step in' : 'Enter stall', () => enterStall(game));
  };
  find('paperStalls').append(button);
}
root.addEventListener('click', event => {
  const name = event.target.closest('[data-action]')?.dataset.action;
  if (name === 'aura') aura();
  if (name === 'chat') find('paperAdvice').textContent = advice[tip++ % advice.length];
  if (name === 'treasures') {
    if (window.PennyFeverInventory) window.PennyFeverInventory.open();
    else find('paperAdvice').textContent = 'The treasure books are still loading. Please try again in a moment.';
  }
  if (name === 'home' && !window.confirm('Leave Penny Fever and return to instapic.fun?')) event.preventDefault();
});
function sync() {
  const active = location.hash === '#paper-map';
  root.hidden = !active;
  if (!active && booth.open) booth.close();
  if (!active) return;
  const url = new URL(location.href);
  url.searchParams.set('paperMap', '1');
  history.replaceState(null, '', url);
  document.documentElement.classList.remove('world-loading');
  pocket();
}
window.addEventListener('hashchange', sync);
window.addEventListener('pennyfever:statechange', pocket);
loadParkDoors().then(sync);
sync();
