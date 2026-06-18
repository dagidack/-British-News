const navListEl = document.getElementById("nav-list");
const regionListHeaderEl = document.getElementById("region-list-header");
const regionListFooterEl = document.getElementById("region-list-footer");
const regionPanelEl = document.getElementById("region-panel");
const publisherPanelEl = document.getElementById("publisher-panel");
const publisherListEl = document.getElementById("publisher-list-header");
const regionsMenuBtn = { current: null };
const publishersMenuBtn = { current: null };
const articlesEl = document.getElementById("articles");
const statusEl = document.getElementById("status");
const aboutPanelEl = document.getElementById("about-panel");
const clockEl = document.getElementById("clock");
const clockTimeEl = document.getElementById("clock-time");
const clockDateEl = document.getElementById("clock-date");
const pageTitleEl = document.getElementById("page-title");
const logoHomeEl = document.getElementById("logo-home");
const headerEl = document.getElementById("site-header");

let activeTab = null;
let tabLabels = {};
let cache = {};

const HOME_TAB = "national";
const HOME_LABEL = "Home";
const ABOUT_TAB = "about";
const ABOUT_LABEL = "About";
const SITE_NAME = "Daily Feed News UK";

let activePublisher = null;
let tabPublishers = {};

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function formatRelative(iso) {
  if (!iso) return "";
  try {
    const diffSec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });
    if (diffSec < 60) return rtf.format(-diffSec, "second");
    if (diffSec < 3600) return rtf.format(-Math.round(diffSec / 60), "minute");
    if (diffSec < 86400) return rtf.format(-Math.round(diffSec / 3600), "hour");
    return rtf.format(-Math.round(diffSec / 86400), "day");
  } catch {
    return formatDate(iso);
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function updateClock() {
  const now = new Date();
  clockEl.dateTime = now.toISOString();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const datePart = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  clockTimeEl.textContent = `${hours}:${minutes}`;
  clockDateEl.textContent = datePart;
}

function pageHeading(tabId) {
  if (activePublisher) return activePublisher;
  if (tabId === HOME_TAB) return HOME_LABEL;
  if (tabId === ABOUT_TAB) return ABOUT_LABEL;
  return tabLabels[tabId] || tabId;
}

function isRegionTab(tabId) {
  return tabId !== HOME_TAB && tabId !== ABOUT_TAB;
}

function setActiveUI(tabId) {
  const heading = pageHeading(tabId);
  pageTitleEl.textContent = heading;
  document.title = `${heading} | ${SITE_NAME}`;

  document.querySelectorAll(".bbc-nav__link[data-tab]").forEach((el) => {
    el.classList.toggle("bbc-nav__link--active", el.dataset.tab === tabId && !activePublisher);
  });

  document.querySelectorAll(".bbc-region-item, .bbc-footer__region").forEach((el) => {
    el.classList.toggle(
      el.classList.contains("bbc-region-item") ? "bbc-region-item--active" : "bbc-footer__region--active",
      el.dataset.tab === tabId && isRegionTab(tabId) && !activePublisher
    );
  });

  document.querySelectorAll(".bbc-footer__meta-link[data-tab]").forEach((el) => {
    el.classList.toggle("bbc-footer__meta-link--active", el.dataset.tab === tabId);
  });

  document.querySelectorAll(".bbc-publisher-item").forEach((el) => {
    el.classList.toggle("bbc-publisher-item--active", el.dataset.publisher === activePublisher);
  });
}

function showAboutView() {
  statusEl.hidden = true;
  articlesEl.hidden = true;
  aboutPanelEl.hidden = false;
}

function showFeedView() {
  aboutPanelEl.hidden = true;
}

function closeRegionPanel() {
  regionPanelEl.hidden = true;
  if (regionsMenuBtn.current) {
    regionsMenuBtn.current.setAttribute("aria-expanded", "false");
  }
  requestAnimationFrame(syncHeaderOffset);
}

function closePublisherPanel() {
  publisherPanelEl.hidden = true;
  if (publishersMenuBtn.current) {
    publishersMenuBtn.current.setAttribute("aria-expanded", "false");
  }
  requestAnimationFrame(syncHeaderOffset);
}

function closeNavPanels() {
  closeRegionPanel();
  closePublisherPanel();
}

function toggleRegionPanel(btn) {
  const open = btn.getAttribute("aria-expanded") === "true";
  if (!open) closePublisherPanel();
  btn.setAttribute("aria-expanded", open ? "false" : "true");
  regionPanelEl.hidden = open;
  requestAnimationFrame(syncHeaderOffset);
}

function togglePublisherPanel(btn) {
  const open = btn.getAttribute("aria-expanded") === "true";
  if (!open) {
    closeRegionPanel();
    buildPublisherList(activeTab || HOME_TAB);
  }
  btn.setAttribute("aria-expanded", open ? "false" : "true");
  publisherPanelEl.hidden = open;
  requestAnimationFrame(syncHeaderOffset);
}

function regionButtonHtml(t, className) {
  return `<li role="none"><button type="button" class="${className}" data-tab="${t.id}" role="menuitem">${escapeHtml(t.label)}</button></li>`;
}

function sortByDate(a, b) {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

function renderArticles(articles) {
  showFeedView();

  const filtered = activePublisher
    ? articles.filter((a) => a.source === activePublisher)
    : articles;

  if (!filtered.length) {
    statusEl.hidden = false;
    statusEl.className = "status status--error";
    statusEl.textContent = activePublisher
      ? "No stories from this publisher right now."
      : "No stories available right now.";
    articlesEl.hidden = true;
    return;
  }

  statusEl.hidden = true;
  articlesEl.hidden = false;

  const sorted = [...filtered].sort(sortByDate);
  articlesEl.innerHTML = sorted
    .map((a) => {
      const when = a.date ? formatRelative(a.date) : "";
      return `
    <li class="bbc-story">
      <a class="bbc-story__link" href="${escapeHtml(a.link)}" target="_blank" rel="noopener noreferrer">
        <h2 class="bbc-story__headline">${escapeHtml(a.title)}</h2>
        <p class="bbc-story__meta">
          ${when ? `<span>${escapeHtml(when)}</span>` : ""}
          <span>${escapeHtml(a.source)}</span>
        </p>
      </a>
    </li>
  `;
    })
    .join("");
}

function publisherButtonHtml(name) {
  return `<li role="none"><button type="button" class="bbc-publisher-item" data-publisher="${escapeHtml(name)}" role="menuitem">${escapeHtml(name)}</button></li>`;
}

function publishersForTab(tabId) {
  if (tabPublishers[tabId]?.length) return tabPublishers[tabId];

  const articles = cache[tabId]?.articles || [];
  return [...new Set(articles.map((a) => a.source))].sort((a, b) => a.localeCompare(b, "en-GB"));
}

function buildPublisherList(tabId) {
  const publishers = publishersForTab(tabId);
  publisherListEl.innerHTML = publishers.length
    ? publishers.map((name) => publisherButtonHtml(name)).join("")
    : `<li class="bbc-publisher-empty" role="none">No publishers for this section.</li>`;
}

function storeTabPublishers(tabId, publishers) {
  if (!publishers?.length) return;
  tabPublishers[tabId] = publishers;
  buildPublisherList(tabId);
}

function selectPublisher(publisher) {
  activePublisher = publisher;
  closeNavPanels();
  setActiveUI(activeTab);
  if (cache[activeTab]) {
    renderArticles(cache[activeTab].articles);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function loadAbout() {
  activeTab = ABOUT_TAB;
  activePublisher = null;
  setActiveUI(ABOUT_TAB);
  closeNavPanels();
  showAboutView();
}

async function loadTab(tabId) {
  if (tabId === ABOUT_TAB) {
    loadAbout();
    return;
  }

  activeTab = tabId;
  activePublisher = null;
  setActiveUI(tabId);
  closeNavPanels();
  buildPublisherList(tabId);
  showFeedView();

  if (cache[tabId]) {
    renderArticles(cache[tabId].articles);
    return;
  }

  statusEl.hidden = false;
  statusEl.className = "status";
  statusEl.textContent = "Loading news…";
  articlesEl.hidden = true;

  try {
    const res = await fetch(`/api/feed/${tabId}`);
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    cache[tabId] = data;
    storeTabPublishers(tabId, data.publishers);
    if (activeTab === tabId) renderArticles(data.articles || []);
  } catch {
    statusEl.hidden = false;
    statusEl.className = "status status--error";
    statusEl.textContent = "Could not load news. Check your connection and refresh.";
    articlesEl.hidden = true;
  }
}

function selectRegion(tabId) {
  loadTab(tabId);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function buildNav(tabs) {
  const regions = tabs.filter((t) => t.id !== HOME_TAB);
  const headerItems = regions.map((t) => regionButtonHtml(t, "bbc-region-item")).join("");
  const footerItems = regions
    .map(
      (t) =>
        `<li><button type="button" class="bbc-footer__region" data-tab="${t.id}">${escapeHtml(t.label)}</button></li>`
    )
    .join("");

  navListEl.innerHTML = `<li class="bbc-nav__item">
    <button type="button" class="bbc-nav__link bbc-nav__link--active" data-tab="${HOME_TAB}">${HOME_LABEL}</button>
  </li>
  <li class="bbc-nav__item">
    <button type="button" class="bbc-nav__link bbc-nav__link--menu" id="regions-menu" aria-expanded="false" aria-controls="region-panel">
      Regions <span class="bbc-nav__chevron" aria-hidden="true">▼</span>
    </button>
  </li>
  <li class="bbc-nav__item">
    <button type="button" class="bbc-nav__link bbc-nav__link--menu" id="publishers-menu" aria-expanded="false" aria-controls="publisher-panel">
      Publishers <span class="bbc-nav__chevron" aria-hidden="true">▼</span>
    </button>
  </li>
  <li class="bbc-nav__item bbc-nav__item--end">
    <div class="bbc-nav__meta-links">
      <a class="bbc-nav__link" href="/contact.html">Contact</a>
      <a class="bbc-nav__link" href="/privacy.html">Privacy policy</a>
    </div>
  </li>`;

  regionListHeaderEl.innerHTML = headerItems;
  regionListFooterEl.innerHTML = footerItems;
  regionsMenuBtn.current = document.getElementById("regions-menu");
  publishersMenuBtn.current = document.getElementById("publishers-menu");
}

function syncHeaderOffset() {
  if (!headerEl) return;
  document.documentElement.style.setProperty("--header-offset", `${headerEl.offsetHeight}px`);
}

function initScrollUI() {
  const footer = document.getElementById("about");
  const scrollTopBtn = document.getElementById("scroll-top");
  if (!headerEl || !footer || !scrollTopBtn) return;

  const TOP_THRESHOLD = 60;
  const SHOW_TOP_BTN = 200;
  let ticking = false;

  function nearBottom() {
    return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 80;
  }

  function setChromeState({ headerMinimal, footerVisible }) {
    headerEl.classList.toggle("bbc-header--minimal", headerMinimal);
    footer.classList.toggle("bbc-footer--visible", footerVisible);

    document.documentElement.style.setProperty(
      "--footer-offset",
      footerVisible ? "12rem" : "2rem"
    );

    requestAnimationFrame(syncHeaderOffset);
  }

  function updateScrollUI() {
    const y = window.scrollY;
    const headerMinimal = y > TOP_THRESHOLD;
    const footerVisible = nearBottom();

    setChromeState({ headerMinimal, footerVisible });
    if (headerMinimal) {
      closeNavPanels();
    }

    scrollTopBtn.classList.toggle("scroll-top--visible", y > SHOW_TOP_BTN);
    scrollTopBtn.classList.toggle("scroll-top--above-footer", y > TOP_THRESHOLD);

    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateScrollUI);
      }
    },
    { passive: true }
  );

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  syncHeaderOffset();
  updateScrollUI();
}

async function init() {
  updateClock();
  setInterval(updateClock, 10_000);

  logoHomeEl.addEventListener("click", (e) => {
    e.preventDefault();
    selectRegion(HOME_TAB);
  });

  document.addEventListener("click", (e) => {
    const regionsMenu = regionsMenuBtn.current;
    const publishersMenu = publishersMenuBtn.current;
    const insideRegions =
      regionPanelEl.contains(e.target) ||
      e.target === regionsMenu ||
      regionsMenu?.contains(e.target);
    const insidePublishers =
      publisherPanelEl.contains(e.target) ||
      e.target === publishersMenu ||
      publishersMenu?.contains(e.target);

    if (!insideRegions && !insidePublishers) {
      closeNavPanels();
    }
  });

  navListEl.addEventListener("click", (e) => {
    const tabBtn = e.target.closest(".bbc-nav__link[data-tab]");
    if (tabBtn) selectRegion(tabBtn.dataset.tab);
  });

  regionListHeaderEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".bbc-region-item");
    if (btn) selectRegion(btn.dataset.tab);
  });

  publisherListEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".bbc-publisher-item");
    if (btn) selectPublisher(btn.dataset.publisher);
  });

  regionListFooterEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".bbc-footer__region");
    if (btn) selectRegion(btn.dataset.tab);
  });

  document.getElementById("about").addEventListener("click", (e) => {
    const aboutBtn = e.target.closest(".bbc-footer__meta-link[data-tab]");
    if (aboutBtn) selectRegion(aboutBtn.dataset.tab);
  });

  try {
    const res = await fetch("/api/tabs");
    const tabs = await res.json();

    tabs.forEach((t) => {
      tabLabels[t.id] = t.id === HOME_TAB ? HOME_LABEL : t.label;
      if (t.publishers?.length) tabPublishers[t.id] = t.publishers;
    });

    buildNav(tabs);
    buildPublisherList(HOME_TAB);
    syncHeaderOffset();
    window.addEventListener("resize", syncHeaderOffset);

    regionsMenuBtn.current.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleRegionPanel(regionsMenuBtn.current);
    });

    publishersMenuBtn.current.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePublisherPanel(publishersMenuBtn.current);
    });

    loadTab(HOME_TAB);
    initScrollUI();
  } catch {
    statusEl.className = "status status--error";
    statusEl.textContent = "Could not start the application.";
  }
}

init();
