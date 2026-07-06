const state = {
  language: localStorage.getItem("portfolio-language") || "pt",
  content: null,
  route: "home",
};

const contentCache = {};
const app = document.querySelector("#app");
const nav = document.querySelector("[data-nav]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const pageOrder = ["home", "work"];

const get = (path, source = state.content) =>
  path.split(".").reduce((value, key) => (value ? value[key] : undefined), source);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function rich(value) {
  return escapeHtml(value)

    // **texto** -> vermelho
    .replace(/\*\*(.+?)\*\*/g, '<span class="text-accent">$1</span>')

    // ==texto== -> tarja vermelha
    .replace(/==(.+?)==/g, '<span class="red-strip">$1</span>');
}

function youtubeEmbedUrl(url) {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    let id = "";

    if (host === "youtu.be") {
      id = parsed.pathname.slice(1);
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      id = parsed.searchParams.get("v") || "";
      if (!id && parsed.pathname.startsWith("/shorts/")) {
        id = parsed.pathname.split("/")[2] || "";
      }
      if (!id && parsed.pathname.startsWith("/embed/")) {
        id = parsed.pathname.split("/")[2] || "";
      }
    }

    return id ? `https://www.youtube.com/embed/${id}` : "";
  } catch {
    return "";
  }
}

function vimeoEmbedUrl(url) {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host !== "vimeo.com" && host !== "player.vimeo.com") {
      return "";
    }

    if (host === "player.vimeo.com" && parsed.pathname.startsWith("/video/")) {
      return url;
    }

    const id = parsed.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
    return id ? `https://player.vimeo.com/video/${id}` : "";
  } catch {
    return "";
  }
}

function mediaEmbedUrl(url) {
  return youtubeEmbedUrl(url) || vimeoEmbedUrl(url);
}

function cleanPath(url) {
  try {
    return new URL(url, window.location.href).pathname.toLowerCase();
  } catch {
    return String(url).split("?")[0].split("#")[0].toLowerCase();
  }
}

function isVideoFile(url) {
  return /\.(mp4|webm|mov|m4v|ogg)$/.test(cleanPath(url));
}

function isImageFile(url) {
  return /\.(gif|png|jpe?g|webp|avif)$/.test(cleanPath(url));
}

function stripJsonComments(text) {
  return text
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

async function loadContent(language) {
  if (!contentCache[language]) {
    const response = await fetch(`./content/${language}.jsonc`);
    const text = await response.text();
    contentCache[language] = JSON.parse(stripJsonComments(text));
  }

  state.content = contentCache[language];
  document.documentElement.lang = get("meta.lang");
  document.title = get("meta.title");
  document.querySelector('meta[name="description"]').setAttribute("content", get("meta.description"));
}

function whatsappUrl() {
  const phone = get("contact.whatsappNumber").replace(/\D/g, "");
  const message = encodeURIComponent(get("contact.prefilledMessage"));
  return `https://wa.me/${phone}?text=${message}`;
}

function updateSharedText() {
  document.querySelector("[data-brand]").textContent = get("global.brand");
  document.querySelectorAll("[data-text]").forEach((element) => {
    element.textContent = get(element.dataset.text);
  });
  document.querySelectorAll("[data-aria]").forEach((element) => {
    element.setAttribute("aria-label", get(element.dataset.aria));
  });
  document.querySelectorAll("[data-whatsapp-link]").forEach((element) => {
    element.href = whatsappUrl();
  });
}

function button(labelPath, extraClass = "") {
  return `<a class="button ${extraClass}" href="${whatsappUrl()}" target="_blank" rel="noreferrer">${get(labelPath)}</a>`;
}

function renderMediaAsset(item) {
  if (!item.src) {
    return "";
  }

  const embedUrl = mediaEmbedUrl(item.src);
  if (embedUrl) {
    return `<iframe src="${embedUrl}" title="${item.alt || item.label}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  }

  if (isVideoFile(item.src)) {
    return `<video src="${item.src}" autoplay muted loop playsinline aria-label="${item.alt || item.label}"></video>`;
  }

  if (isImageFile(item.src)) {
    return `<img src="${item.src}" alt="${item.alt || item.label}">`;
  }

  return `<img src="${item.src}" alt="${item.alt || item.label}">`;
}

function nextPageLink() {
  const currentIndex = pageOrder.indexOf(state.route);
  const nextRoute = pageOrder[(currentIndex + 1) % pageOrder.length];

  return `
    <a class="next-link" href="#${nextRoute}">
      <span>${get("nav.nextEyebrow")}</span>
      <strong>${get(`nav.next.${nextRoute}`)}</strong>
    </a>
  `;
}

function renderFullVideo(video) {
  const source = video.embedUrl || video.src;
  const embedUrl = mediaEmbedUrl(source);

  if (embedUrl) {
    return `
      <div class="full-video">
        <iframe src="${embedUrl}" title="${video.title}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
      </div>
    `;
  }

  if (video.src && isVideoFile(video.src)) {
    return `
      <div class="full-video">
        <video src="${video.src}" controls preload="metadata" playsinline aria-label="${video.title}"></video>
      </div>
    `;
  }

  if (source) {
    return `
      <div class="full-video">
        <iframe src="${source}" title="${video.title}" loading="lazy" allowfullscreen></iframe>
      </div>
    `;
  }

  return `
    <div class="full-video full-video-placeholder">
      <span>${rich(video.label)}</span>
      <p>${rich(video.placeholder)}</p>
    </div>
  `;
}

function finalCta(section, includeNext = true) {
  return `
    <section class="cta-block">
      <p class="eyebrow">${get(`${section}.eyebrow`)}</p>
      <h2>${rich(get(`${section}.headline`))}</h2>
      <p>${rich(get(`${section}.text`))}</p>
      <div class="cta-actions">
        ${button("global.ctaLabel")}
        ${includeNext ? nextPageLink() : ""}
      </div>
    </section>
  `;
}

function mediaPanel(item) {
  return `
    <div class="media-panel">
      ${renderMediaAsset(item)}
      <span class="media-label">${item.label}</span>
      <p class="media-note">${rich(item.note)}</p>
    </div>
  `;
}

function beforeAfterVideo(item) {
  return `
    <figure class="before-after-video before-after-video-${item.type}">
      <span class="before-after-tag">${item.label}</span>
      <video src="${item.src}" autoplay muted loop playsinline aria-label="${item.alt}"></video>
    </figure>
  `;
}

function beforeAfterBlock(item) {
  return `
    <article class="before-after-block before-after-block-${item.format}">
      <h3>${rich(item.title)}</h3>
      <div class="before-after-pair">
        ${beforeAfterVideo(item.raw)}
        ${beforeAfterVideo(item.edited)}
      </div>
    </article>
  `;
}

function compactList(items) {
  return `
    <div class="compact-list">
      ${items.map((item) => `<span>${rich(item)}</span>`).join("")}
    </div>
  `;
}

function renderHome() {
  const skills = get("home.skills.items");
  const tools = get("home.tools.items");
  const steps = get("home.process.steps");
  const comparisons = get("home.beforeAfter.comparisons");
  return `
    <div class="page">
      <section class="section hero home-presentation">
        <div class="portrait" data-label="${get("home.presentation.photoNote")}"></div>
        <div class="text-stack">
          <p class="eyebrow">${get("home.presentation.eyebrow")}</p>
          <h1 class="page-title">${rich(get("home.presentation.headline"))}</h1>
          <p>${rich(get("home.presentation.text"))}</p>
        </div>
      </section>

      <section class="section section-tight">
        <div class="section-heading">
          <div>
            <p class="eyebrow">${get("home.skills.eyebrow")}</p>
            <h2>${rich(get("home.skills.headline"))}</h2>
          </div>
          <p>${rich(get("home.skills.text"))}</p>
        </div>
        ${compactList(skills)}
      </section>

      <section class="section section-tight">
        <div class="section-heading">
          <div>
            <p class="eyebrow">${get("home.tools.eyebrow")}</p>
            <h2>${rich(get("home.tools.headline"))}</h2>
          </div>
          <p>${rich(get("home.tools.text"))}</p>
        </div>
        ${compactList(tools)}
      </section>

      <section class="section section-tight">
        <div class="section-heading">
          <div>
            <p class="eyebrow">${get("home.beforeAfter.eyebrow")}</p>
            <h2>${rich(get("home.beforeAfter.headline"))}</h2>
          </div>
          <p>${rich(get("home.beforeAfter.text"))}</p>
        </div>
        <div class="before-after-stack">
          ${comparisons.map(beforeAfterBlock).join("")}
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">${get("home.process.eyebrow")}</p>
            <h2>${rich(get("home.process.headline"))}</h2>
          </div>
          <p>${rich(get("home.process.text"))}</p>
        </div>
        <div class="timeline">
          ${steps.map((step, index) => `
            <article class="timeline-step">
              <strong>${String(index + 1).padStart(2, "0")}</strong>
              <h3>${rich(step.title)}</h3>
              <p>${rich(step.text)}</p>
            </article>
          `).join("")}
        </div>
      </section>

      ${finalCta("home.finalCta")}
      <span class="pixel-signature" aria-hidden="true"></span>
    </div>
  `;
}

function renderWork() {
  const cases = get("work.cases");
  return `
    <div class="page">
      <section class="section work-intro">
        <p class="eyebrow">${get("work.intro.eyebrow")}</p>
        <h1 class="page-title">${rich(get("work.intro.headline"))}</h1>
        <p class="lead">${rich(get("work.intro.text"))}</p>
      </section>

      <section class="section section-tight">
        ${cases.map((caseItem) => `
          <article class="case">
            <div class="case-header">
              <div>
                <p class="eyebrow">${caseItem.category}</p>
                <h2>${rich(caseItem.title)}</h2>
              </div>
              <p>${rich(caseItem.summary)}</p>
            </div>
            <div class="clip-grid">
              ${caseItem.clips.map((clip) => `
                <div class="clip">
                  ${renderMediaAsset(clip)}
                  <span>${rich(clip.label)}</span>
                </div>
              `).join("")}
            </div>
            ${renderFullVideo(caseItem.fullVideo)}
            <div class="case-footer">
              <p>${rich(caseItem.technicalDescription)}</p>
            </div>
          </article>
        `).join("")}
      </section>

      ${finalCta("work.finalCta", false)}
    </div>
  `;
}

function setCurrentNav() {
  document.querySelectorAll("[data-nav] a").forEach((link) => {
    const isCurrent = link.getAttribute("href") === `#${state.route}`;
    if (isCurrent) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function render() {
  const pages = {
    home: renderHome,
    work: renderWork,
  };

  updateSharedText();
  app.classList.remove("is-visible");
  app.innerHTML = pages[state.route]();
  setCurrentNav();
  requestAnimationFrame(() => {
    app.classList.add("is-visible");
    observeReveals();
  });
  window.scrollTo({ top: 0, behavior: "instant" });
}

async function setLanguage(language) {
  app.classList.add("is-switching");
  state.language = language;
  localStorage.setItem("portfolio-language", language);
  await loadContent(language);
  render();
  window.setTimeout(() => app.classList.remove("is-switching"), 220);
}

function updateRoute() {
  const hash = window.location.hash.replace("#", "");
  state.route = pageOrder.includes(hash) ? hash : "home";
  if (state.content) {
    render();
  }
}

const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 })
  : null;

function observeReveals() {
  const revealItems = app.querySelectorAll(".section, .cta-block, .case, .deliver-item, .clip, .full-video");
  revealItems.forEach((item) => {
    item.classList.add("reveal");
    if (revealObserver) {
      revealObserver.observe(item);
    } else {
      item.classList.add("is-visible");
    }
  });
}

document.querySelector("[data-language-toggle]").addEventListener("click", () => {
  setLanguage(state.language === "pt" ? "en" : "pt");
});

menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", () => {
  nav.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
});

window.addEventListener("hashchange", updateRoute);

loadContent(state.language).then(() => {
  updateRoute();
  render();
});
