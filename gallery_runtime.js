(function () {
  const MANIFEST = "content/gallery.json";

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

  function displayUploadedDate(value) {
    const parsed = new Date(value || "");
    if (Number.isNaN(parsed.getTime())) return "";
    return new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Australia/Darwin"
    }).format(parsed);
  }

  function media(item) {
    const frame = node("div", "public-gallery-media");
    const url = String(item.media_url || "");
    const type = String(item.type || "photo");
    if (url && ["boomerang", "video"].includes(type)) {
      const video = node("video");
      video.controls = true;
      video.preload = "none";
      video.playsInline = true;
      video.poster = item.poster_url || "";
      video.setAttribute("aria-label", item.alt || item.title || "Gallery video");
      const source = node("source");
      source.src = url;
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
    const article = node("article", "public-gallery-card");
    article.dataset.category = item.category || "All";
    article.append(media(item));
    const copy = node("div", "public-gallery-copy");
    copy.append(node("h3", "", item.title || "Instapic moment"));
    const uploadedDate = displayUploadedDate(item.uploaded_at);
    if (uploadedDate) {
      const date = node("time", "public-gallery-date", uploadedDate);
      date.dateTime = item.uploaded_at;
      copy.append(date);
    }
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

  function filters(items, grid) {
    const holder = document.querySelector("[data-gallery-filters]");
    if (!holder) return;
    const categories = ["All", ...new Set(items.map((item) => item.category).filter(Boolean))];
    categories.forEach((category, index) => {
      const button = node("button", "public-gallery-filter", category);
      button.type = "button";
      button.classList.toggle("active", index === 0);
      button.onclick = () => {
        holder.querySelectorAll("button").forEach((entry) => entry.classList.remove("active"));
        button.classList.add("active");
        grid.querySelectorAll(".public-gallery-card").forEach((entry) => {
          entry.hidden = category !== "All" && entry.dataset.category !== category;
        });
      };
      holder.append(button);
    });
  }

  function renderFull(items) {
    const grid = document.querySelector("[data-gallery-grid]");
    if (!grid) return;
    grid.replaceChildren();
    if (!items.length) {
      grid.append(node(
        "p",
        "public-gallery-empty",
        "Our gallery is being prepared. Please check back soon."
      ));
      return;
    }
    items.forEach((item) => grid.append(card(item)));
    filters(items, grid);
  }

  function renderHome(items) {
    const track = document.querySelector("[data-gallery-carousel]");
    if (!track) return;
    const featured = items.filter((item) => item.featured).slice(0, 6);
    if (!featured.length) {
      document.querySelector(".home-gallery-preview")?.setAttribute("hidden", "");
      return;
    }
    track.replaceChildren();
    featured.forEach((item) => track.append(card(item)));
    document.querySelectorAll("[data-gallery-scroll]").forEach((button) => {
      button.onclick = () => {
        const direction = button.dataset.galleryScroll === "next" ? 1 : -1;
        track.scrollBy({left: direction * Math.max(280, track.clientWidth * .75), behavior: "smooth"});
      };
    });
  }

  async function load() {
    try {
      const response = await fetch(`${MANIFEST}?v=20260729-gallery`, {cache: "no-store"});
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
