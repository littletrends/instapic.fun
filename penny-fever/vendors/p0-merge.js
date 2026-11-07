/* P0 first-merge — declare engines onto runKit (Aura 2026-09-05) */
(() => {
  "use strict";
  const PF = window.PennyFever;
  if (!PF || !PF.runKit) return;
  const map = [
    ["love", "HoldBand"],
    ["balltoss", "SlingAim"],
    ["coinpusher", "GreedFloor"],
    ["pinball", "Custom"],
  ];
  map.forEach(([id, eng]) => {
    try {
      const prev = PF.runKit.declared && PF.runKit.declared[id];
      if (prev && typeof prev === "object" && prev.authoredCount) return;
      PF.runKit.declare(id, eng);
    } catch (_) {}
  });
  PF.runKit.p0Merged = true;
  PF.runKit.p0Engines = Object.fromEntries(map);
})();
