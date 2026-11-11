(() => {
  const CACHE = "collage-centre-1";
  function sourcesFor(backgroundId) {
    const id = /^pf-[a-z0-9-]+$/i.test(String(backgroundId || "")) ? String(backgroundId) : "pf-felix";
    const base = "backgrounds/carnival/bonus/" + id;
    return {
      collage: base + "_collage.jpg?v=" + CACHE,
      gif: base + "_gif.jpg?v=" + CACHE,
      boomerang: base + "_boomerang.jpg?v=" + CACHE,
    };
  }
  const PfBonus = {
    CACHE,
    LAYOUT_URL: "pf-bonus-layout.json?v=" + CACHE,
    SRC: sourcesFor("pf-felix"),
    sourcesFor,
    layout: null,
  };

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function drawCover(ctx, image, x, y, w, h) {
    const sw = image.videoWidth || image.naturalWidth || image.width;
    const sh = image.videoHeight || image.naturalHeight || image.height;
    if (!sw || !sh) return;
    const scale = Math.max(w / sw, h / sh);
    const cropW = w / scale;
    const cropH = h / scale;
    ctx.drawImage(image, (sw - cropW) / 2, (sh - cropH) / 2, cropW, cropH, x, y, w, h);
  }

  function clipPath(ctx, x, y, w, h, shape, r) {
    ctx.beginPath();
    if (shape === "ellipse") ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    else if (r > 0 && ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  }

  function drawOvalCover(ctx, image, box) {
    const x = Number(box.x), y = Number(box.y), w = Number(box.w), h = Number(box.h);
    ctx.save();
    clipPath(ctx, x, y, w, h, box.shape || "ellipse", Number(box.radius) || 0);
    ctx.clip();
    drawCover(ctx, image, x, y, w, h);
    ctx.restore();
  }

  // Canvas size for a bonus type: per-type size, then legacy global size, then the template's own size.
  function sizeFor(layout, type, background) {
    const part = layout && layout[type];
    return (part && part.size) || (layout && layout.size) || [background.naturalWidth, background.naturalHeight];
  }

  async function loadLayout() {
    if (PfBonus.layout) return PfBonus.layout;
    PfBonus.layout = await fetch(PfBonus.LAYOUT_URL).then((r) => r.json());
    return PfBonus.layout;
  }

  function makeCanvas(w, h) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    return canvas;
  }

  function composeCollage(background, layout, photos, video) {
    const [W, H] = sizeFor(layout, "collage", background);
    const canvas = makeCanvas(W, H);
    const ctx = canvas.getContext("2d");
    drawCollageFrame(ctx, background, layout, photos, video);
    return canvas;
  }

  function drawCollageFrame(ctx, background, layout, photos, video) {
    const [W, H] = sizeFor(layout, "collage", background);
    ctx.drawImage(background, 0, 0, W, H);
    const live = video && video.readyState >= 2 ? video : null;
    const r = Number(layout.collage?.radius) || 0;
    // Four stills in the corners. The session video plays in the centre window.
    (layout.collage?.photos || []).forEach((box, i) => {
      const src = photos[i];
      if (!src) return;
      ctx.save();
      clipPath(ctx, box[0], box[1], box[2], box[3], "roundrect", r);
      ctx.clip();
      drawCover(ctx, src, box[0], box[1], box[2], box[3]);
      ctx.restore();
    });
    const centre = layout.collage?.branding;
    if (live && centre && centre.length >= 4) {
      ctx.save();
      clipPath(ctx, centre[0], centre[1], centre[2], centre[3], "roundrect", r);
      ctx.clip();
      drawCover(ctx, live, centre[0], centre[1], centre[2], centre[3]);
      ctx.restore();
    }
  }

  function composeOval(background, box, image, layout) {
    const [W, H] = (box && box.size) || (layout && layout.size) || [background.naturalWidth, background.naturalHeight];
    const canvas = makeCanvas(W, H);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(background, 0, 0, W, H);
    if (image) drawOvalCover(ctx, image, box);
    return canvas;
  }

  function toJpeg(canvas, quality) {
    return canvas.toDataURL("image/jpeg", quality == null ? 0.86 : quality);
  }

  async function bake(photoSrcs, backgroundId) {
    const layout = await loadLayout();
    const sources = sourcesFor(backgroundId);
    const photos = await Promise.all(
      (photoSrcs || []).slice(0, 4).map((src) => (src ? loadImage(src).catch(() => null) : Promise.resolve(null)))
    );
    const [collageBg, gifBg, boomBg] = await Promise.all([
      loadImage(sources.collage),
      loadImage(sources.gif),
      loadImage(sources.boomerang),
    ]);
    const collage = toJpeg(composeCollage(collageBg, layout, photos));
    const gifFrames = photos.map((photo) => toJpeg(composeOval(gifBg, layout.gif, photo || photos.find(Boolean), layout), 0.82));
    const boomFrames = photos.map((photo) => toJpeg(composeOval(boomBg, layout.boomerang, photo || photos.find(Boolean), layout), 0.82));
    return { collage, gifFrames, boomFrames };
  }

  PfBonus.loadImage = loadImage;
  PfBonus.loadLayout = loadLayout;
  PfBonus.drawCover = drawCover;
  PfBonus.drawOvalCover = drawOvalCover;
  PfBonus.sizeFor = sizeFor;
  PfBonus.drawCollageFrame = drawCollageFrame;
  PfBonus.composeCollage = composeCollage;
  PfBonus.composeOval = composeOval;
  PfBonus.toJpeg = toJpeg;
  PfBonus.bake = bake;
  window.PfBonus = PfBonus;
})();
