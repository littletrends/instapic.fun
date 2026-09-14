const rows = [
  ["fortune", "Iris", "Catch the Fortune", "The globe flashes a sign. Brake the rings so the remembered symbols sit in the reading window."],
];

const built = new Set(["fortune"]);

export const games = rows.map(([id, host, title, blurb]) => ({
  id, host, title, blurb,
  ready: built.has(id),
  asset: `./assets/${id}.png`,
  module: `./stalls/${id}.js`,
}));

export const byId = Object.fromEntries(games.map(g => [g.id, g]));
