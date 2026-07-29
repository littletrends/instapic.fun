(function () {
  const MANIFEST = "content/gallery.json";

  // Section order. Socials always first (when present). Empty sections are hidden.
  const SECTION_DEFS = [
    {
      id: "social",
      title: "From Instagram & X",
      blurb: "Stories and posts from the build and booth life.",
      types: ["social"],
    },
    {
      id: "featured",
      title: "Featured",
      blurb: "Highlights we love right now.",
      match: (item) => !!item.featured,
      featuredOnly: true,
    },
    {
      id: "strip",
      title: "Photo strips",
      blurb: "Printed strip designs guests take home.",
      types: ["strip"],
    },
    {
      id: "collage",
      title: "Collages",
      blurb: "Tall branded collage videos from the session.",
      types: ["collage"],
    },
    {
      id: "motion",
      title: "GIFs & Boomerangs",
      blurb: "Short motion extras for sharing.",
      types: ["gif", "boomerang"],
    },
    {
      id: "video",
      title: "Videos",
      blurb: "Session video moments.",
      types: ["video"],
    },
    {
      id: "photo",
      title: "Photos & moments",
      blurb: "Stills from the mirror.",
      types: ["photo"],
    },
  ];

  const TYPE_FILTERS = [
    { id: "all", label: "All" },
    { id: "social", label: "Social" },
    { id: "strip", label: "Strips" },
    { id: "collage", label: "Collages" },
    { id: "motion", label: "Motion" },
    { id: "photo", label: "Photos" },
  ];

  function node(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }

  function validSocialUrl(value) {
    try {
      const url = new URL(value || "");
      return ["instagram.com", "www.instagram.com", "x.com", "www.x.com", "twitter.com", "www.twitter.com"]
        .includes(url.hostname.toLowerCase()) ? url.href : "";
    } catch {
      return "";
    }
  }

  function parseStamp(value) {
    const raw = String(value || "").trim();
    if (!raw) return null;
    // Python often emits +0930; JS Date wants +09:30
    const normalized = raw.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
    let parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function stampMs(item) {
    const parsed = parseStamp(item.published_at || item.uploaded_at || "");
    return parsed ? parsed.getTime() : 0;
  }

  function displayPostedDate(value) {
    const parsed = parseStamp(value);
    if (!parsed) return "";
    return new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Australia/Darwin"
    }).format(parsed);
  }

  function mediaExtension(item) {
    const url = String(item.media_url || item.media_file || "");
    return url.split(".").pop().toLowerCase().split("?")[0] || "";
  }

  function isVideoMedia(item) {
    // Collages / boomerangs / motion products are MP4s — never render as <img>.
    const ext = mediaExtension(item);
    if (["mp4", "webm", "mov"].includes(ext)) return true;
    const type = String(item.type || "").toLowerCase();
    return ["collage", "boomerang", "video"].includes(type);
  }

  function mediaShapeClass(type) {
    const t = String(type || "photo").toLowerCase();
    if (t === "collage") return "is-collage is-portrait";
    if (t === "strip") return "is-strip is-portrait";
    if (t === "gif") return "is-gif";
    if (t === "boomerang") return "is-boomerang";
    if (t === "video") return "is-video";
    if (t === "social") return "is-social";
    return "is-photo";
  }

  function sectionIdForType(type) {
    const t = String(type || "photo").toLowerCase();
    if (t === "strip") return "strip";
    if (t === "collage") return "collage";
    if (t === "gif" || t === "boomerang") return "motion";
    if (t === "video") return "video";
    if (t === "social") return "social";
    return "photo";
  }

  function media(item) {
    const type = String(item.type || "photo");
    const frame = node("div", `public-gallery-media ${mediaShapeClass(type)}`);
    const url = String(item.media_url || "");
    if (url && isVideoMedia(item)) {
      const video = node("video");
      video.controls = true;
      video.preload = "metadata";
      video.playsInline = true;
      video.muted = true;
      video.loop = type === "collage" || type === "boomerang" || type === "gif";
      video.poster = item.poster_url || "";
      video.setAttribute("aria-label", item.alt || item.title || "Gallery video");
      // Do NOT set HTML width/height attributes — on iOS that fights CSS and
      // half-crops portrait booth videos (bonus.html avoids this too).
      const source = node("source");
      source.src = url;
      // type helps mobile browsers pick the right decoder early
      if (mediaExtension(item) === "mp4") source.type = "video/mp4";
      video.append(source);
      frame.append(video);
    } else if (url) {
      const image = node("img");
      image.src = url;
      image.alt = item.alt || item.title || "Instapic gallery example";
      image.loading = "lazy";
      image.decoding = "async";
      frame.append(image);
    } else {
      frame.append(node("div", "public-gallery-social-placeholder", "Social highlight"));
    }
    const badge = node("span", "public-gallery-type", type === "gif" ? "GIF" : type);
    frame.append(badge);
    return frame;
  }

  function card(item) {
    const type = String(item.type || "photo");
    const article = node("article", `public-gallery-card is-${type}`);
    article.dataset.category = item.category || "All";
    article.dataset.type = type;
    article.dataset.section = sectionIdForType(type);
    if (item.featured) article.dataset.featured = "1";
    // Date is the first line of the post (above media + title).
    const stampIso = item.published_at || item.uploaded_at || "";
    const postedDate = displayPostedDate(stampIso);
    if (postedDate) {
      const date = node("time", "public-gallery-date public-gallery-date-top", postedDate);
      date.dateTime = stampIso;
      article.append(date);
    }
    article.append(media(item));
    const copy = node("div", "public-gallery-copy");
    copy.append(node("h3", "", item.title || "Instapic moment"));
    let continueButton = null;
    if (item.caption) {
      const caption = node("p", "public-gallery-caption", item.caption);
      const needsExpansion = item.caption.length > 360;
      if (needsExpansion) {
        caption.classList.add("collapsed");
        continueButton = node(
          "button",
          "public-gallery-continue",
          "Continue reading"
        );
        continueButton.type = "button";
        continueButton.setAttribute("aria-expanded", "false");
        continueButton.onclick = () => {
          const expanded = continueButton.getAttribute("aria-expanded") === "true";
          continueButton.setAttribute("aria-expanded", String(!expanded));
          caption.classList.toggle("collapsed", expanded);
          continueButton.textContent = expanded ? "Continue reading" : "Show less";
        };
        copy.append(caption);
      } else {
        copy.append(caption);
      }
    }
    const social = validSocialUrl(item.social_url);
    let socialLink = null;
    if (social) {
      socialLink = node("a", "public-gallery-social-link", "View original post ↗");
      socialLink.href = social;
      socialLink.target = "_blank";
      socialLink.rel = "noopener noreferrer";
    }
    if (continueButton || socialLink) {
      const actions = node("div", "public-gallery-actions");
      if (continueButton) actions.append(continueButton);
      else actions.append(node("span", "public-gallery-action-spacer"));
      if (socialLink) actions.append(socialLink);
      copy.append(actions);
    }
    article.append(copy);
    return article;
  }

  function sortNewestFirst(items) {
    return items.slice().sort((a, b) => {
      const byTime = stampMs(b) - stampMs(a);
      if (byTime) return byTime;
      return Number(a.order || 0) - Number(b.order || 0);
    });
  }

  function itemsForSection(def, items) {
    if (def.match) return sortNewestFirst(items.filter(def.match));
    const types = new Set((def.types || []).map((t) => t.toLowerCase()));
    return sortNewestFirst(
      items.filter((item) => types.has(String(item.type || "photo").toLowerCase()))
    );
  }

  function wireCarousel(track, prevBtn, nextBtn) {
    const scrollBy = () => Math.max(260, Math.round(track.clientWidth * 0.78));
    if (prevBtn) {
      prevBtn.onclick = () => track.scrollBy({ left: -scrollBy(), behavior: "smooth" });
    }
    if (nextBtn) {
      nextBtn.onclick = () => track.scrollBy({ left: scrollBy(), behavior: "smooth" });
    }
  }

  function buildSection(def, sectionItems) {
    const section = node("section", `public-gallery-section is-${def.id}`);
    section.dataset.gallerySection = def.id;
    section.setAttribute("aria-label", def.title);

    const head = node("div", "public-gallery-section-head");
    const titles = node("div", "public-gallery-section-titles");
    titles.append(node("h2", "public-gallery-section-title", def.title));
    if (def.blurb) titles.append(node("p", "public-gallery-section-blurb", def.blurb));
    const count = node(
      "span",
      "public-gallery-section-count",
      `${sectionItems.length} item${sectionItems.length === 1 ? "" : "s"}`
    );

    const nav = node("div", "public-gallery-section-nav");
    const prev = node("button", "public-gallery-scroll", "‹");
    prev.type = "button";
    prev.setAttribute("aria-label", `Previous ${def.title}`);
    const next = node("button", "public-gallery-scroll", "›");
    next.type = "button";
    next.setAttribute("aria-label", `Next ${def.title}`);
    nav.append(prev, next);

    head.append(titles, count, nav);

    const track = node("div", "public-gallery-track");
    track.dataset.galleryTrack = def.id;
    track.setAttribute("role", "list");
    sectionItems.forEach((item) => {
      const cardEl = card(item);
      cardEl.setAttribute("role", "listitem");
      track.append(cardEl);
    });

    wireCarousel(track, prev, next);
    section.append(head, track);
    return section;
  }

  function applyTypeFilter(root, filterId) {
    const sections = root.querySelectorAll("[data-gallery-section]");
    sections.forEach((section) => {
      const id = section.dataset.gallerySection;
      if (filterId === "all") {
        section.hidden = false;
        return;
      }
      // Featured always shows when filtering "all" only; hide under product filters
      // unless it contains matching types (handled by card hide + empty section).
      if (id === "featured") {
        let anyVisible = false;
        section.querySelectorAll(".public-gallery-card").forEach((cardEl) => {
          const type = cardEl.dataset.type || "photo";
          const sectionKey = sectionIdForType(type);
          const match =
            filterId === sectionKey ||
            (filterId === "motion" && (type === "gif" || type === "boomerang"));
          cardEl.hidden = !match;
          if (match) anyVisible = true;
        });
        section.hidden = !anyVisible;
        return;
      }
      section.hidden = id !== filterId;
      if (id === filterId) {
        section.querySelectorAll(".public-gallery-card").forEach((cardEl) => {
          cardEl.hidden = false;
        });
      }
    });
  }

  function filters(root) {
    const holder = document.querySelector("[data-gallery-filters]");
    if (!holder) return;
    holder.replaceChildren();
    // Only offer filters that currently have content (plus All)
    const present = new Set();
    root.querySelectorAll("[data-gallery-section]").forEach((section) => {
      const id = section.dataset.gallerySection;
      if (id && id !== "featured") present.add(id);
    });
    TYPE_FILTERS.forEach((entry, index) => {
      if (entry.id !== "all" && !present.has(entry.id)) return;
      const button = node("button", "public-gallery-filter", entry.label);
      button.type = "button";
      button.dataset.galleryFilter = entry.id;
      button.classList.toggle("active", index === 0 || entry.id === "all");
      button.onclick = () => {
        holder.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
        button.classList.add("active");
        applyTypeFilter(root, entry.id);
      };
      holder.append(button);
    });
    // Ensure All is the only active default
    holder.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("active", b.dataset.galleryFilter === "all");
    });
  }

  function renderFull(items) {
    const root = document.querySelector("[data-gallery-grid]");
    if (!root) return;
    root.classList.add("public-gallery-sections");
    root.classList.remove("public-gallery-grid");
    root.replaceChildren();
    if (!items.length) {
      root.append(node(
        "p",
        "public-gallery-empty",
        "Our gallery is being prepared. Please check back soon."
      ));
      return;
    }

    let built = 0;
    SECTION_DEFS.forEach((def) => {
      const sectionItems = itemsForSection(def, items);
      if (!sectionItems.length) return;
      // Avoid an empty-feeling featured that duplicates the only items later —
      // still show featured when marked; product sections list all of that type.
      root.append(buildSection(def, sectionItems));
      built += 1;
    });

    if (!built) {
      root.append(node(
        "p",
        "public-gallery-empty",
        "Our gallery is being prepared. Please check back soon."
      ));
      return;
    }
    filters(root);
  }

  function renderHome(items) {
    const track = document.querySelector("[data-gallery-carousel]");
    if (!track) return;
    const featured = sortNewestFirst(items.filter((item) => item.featured)).slice(0, 6);
    if (!featured.length) {
      document.querySelector(".home-gallery-preview")?.setAttribute("hidden", "");
      return;
    }
    track.replaceChildren();
    featured.forEach((item) => track.append(card(item)));
    document.querySelectorAll("[data-gallery-scroll]").forEach((button) => {
      button.onclick = () => {
        const direction = button.dataset.galleryScroll === "next" ? 1 : -1;
        track.scrollBy({ left: direction * Math.max(280, track.clientWidth * 0.75), behavior: "smooth" });
      };
    });
  }

  async function load() {
    try {
      const response = await fetch(`${MANIFEST}?v=20260729-gallery-social-first`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];
      renderFull(items);
      renderHome(items);
    } catch {
      renderFull([]);
      const status = document.querySelector("[data-gallery-status]");
      if (status) status.textContent = "The gallery could not be loaded just now.";
    }
  }

  window.addEventListener("DOMContentLoaded", load);
})();
