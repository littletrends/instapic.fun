// Shared paper-diorama frame so ride rooms feel like Florence and Nell’s painted ovals.
export const ROOMS = {
  ferris: {sky: '#1a2240', floor: '#3a2a48', oval: '#efe6d0dd', ink: '#c4a46a', lamp: '#f0d080'},
  helter: {sky: '#16383c', floor: '#1e4038', oval: '#e8f2e6dd', ink: '#7aa08a', lamp: '#d8ecc8'},
  swings: {sky: '#2a1834', floor: '#3a2040', oval: '#f3e2d4dd', ink: '#c890a0', lamp: '#f0c8b0'},
  funhouse: {sky: '#3a182c', floor: '#4a2038', oval: '#f6e6dadd', ink: '#d4a0b8', lamp: '#f0c8d8'},
  organ: {sky: '#241820', floor: '#3a2420', oval: '#efe2c6dd', ink: '#c4a070', lamp: '#e8c878'},
  mural: {sky: '#2a2618', floor: '#3a3420', oval: '#f4ead0dd', ink: '#b89a68', lamp: '#ead6a8'},
};

export function paperRoom(d, pal) {
  d.poly([[0, 0], [900, 0], [900, 1200], [0, 1200]], pal.floor);
  d.poly([[0, 0], [900, 0], [900, 430], [0, 460]], pal.sky);
  d.ellipse(450, 708, 292, 348, pal.oval, pal.ink, 6);
  for (const x of [96, 804]) {
    d.line({x, y: 70}, {x, y: 250}, pal.ink, 5);
    d.circle(x, 68, 16, pal.lamp, pal.ink, 2);
  }
}
