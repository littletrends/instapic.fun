(() => {
  const CACHE = "carnival-8";
  const PfBonus = {
    CACHE,
    LAYOUT_URL: "pf-bonus-layout.json?v=" + CACHE,
    SRC: {
      collage: "backgrounds/carnival/bonus/pf-felix_collage.jpg?v=" + CACHE,
      gif: "backgrounds/carnival/bonus/pf-felix_gif.jpg?v=" + CACHE,
      boomerang: "backgrounds/carnival/bonus/pf-felix_boomerang.jpg?v=" + CACHE,
    },
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

  function drawOvalCover(ctx, image, box) {
    const x = Number(box.x), y = Number(box.y), w = Number(box.w), h = Number(box.h);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.clip();
    drawCover(ctx, image, x, y, w, h);
    ctx.restore();
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

  function composeCollage(background, layout, photos) {
    const [W, H] = layout.size || [background.naturalWidth, background.naturalHeight];
    const canvas = makeCanvas(W, H);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(background, 0, 0, W, H);
    (layout.collage?.photos || []).forEach((box, i) => {
      const photo = photos[i];
      if (photo) drawCover(ctx, photo, box[0], box[1], box[2], box[3]);
    });
    return canvas;
  }

  function composeOval(background, box, image, layout) {
    const [W, H] = (layout && layout.size) || [background.naturalWidth, background.naturalHeight];
    const canvas = makeCanvas(W, H);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(background, 0, 0, W, H);
    if (image) drawOvalCover(ctx, image, box);
    return canvas;
  }

  function toJpeg(canvas, quality) {
    return canvas.toDataURL("image/jpeg", quality == null ? 0.86 : quality);
  }

  async function bake(photoSrcs) {
    const layout = await loadLayout();
    const photos = await Promise.all(
      (photoSrcs || []).slice(0, 4).map((src) => (src ? loadImage(src).catch(() => null) : Promise.resolve(null)))
    );
    const [collageBg, gifBg, boomBg] = await Promise.all([
      loadImage(PfBonus.SRC.collage),
      loadImage(PfBonus.SRC.gif),
      loadImage(PfBonus.SRC.boomerang),
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
  PfBonus.composeCollage = composeCollage;
  PfBonus.composeOval = composeOval;
  PfBonus.toJpeg = toJpeg;
  PfBonus.bake = bake;
  window.PfBonus = PfBonus;
})();
