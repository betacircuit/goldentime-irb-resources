"use strict";

const stage = document.getElementById("slide-stage");
let slideImage = document.getElementById("slide-image");
const viewer = document.querySelector(".viewer");
const manifestPath = viewer.dataset.manifest;
const hashPrefix = viewer.dataset.hashPrefix || "slide";
const imageCache = new Map();
const linkLayer = document.getElementById("slide-links");
const notice = document.getElementById("stage-notice");
const message = document.getElementById("stage-message");
const recovery = document.getElementById("recovery");
const announcement = document.getElementById("slide-announcement");
const svgNamespace = "http://www.w3.org/2000/svg";
let deck;
let current = 0;
let request = 0;
let toastTimer;
let pageDigits = "";
let digitTimer;

function showNotice(text, canRetry = false) {
  message.textContent = text;
  recovery.hidden = !canRetry;
  notice.hidden = false;
}

function pageFromHash() {
  const match = new RegExp(`^#${hashPrefix}-(\\d+)$`).exec(window.location.hash);
  return match ? Number(match[1]) - 1 : 0;
}

function getImage(index, priority = "low") {
  const cached = imageCache.get(index);
  if (cached) {
    if (priority === "high") cached.image.fetchPriority = "high";
    return cached;
  }
  const source = new URL(deck.slides[index].image, location.origin).href;
  const image = slideImage.src === source ? slideImage : new Image();
  image.decoding = "async";
  image.fetchPriority = priority;
  image.draggable = false;
  image.src = source;
  const entry = { image, ready: false, promise: null };
  imageCache.set(index, entry);
  entry.promise = image.decode().then(() => {
    entry.ready = true;
    return image;
  }).catch(error => {
    if (imageCache.get(index) === entry) imageCache.delete(index);
    throw error;
  });
  return entry;
}

function preloadAround(index) {
  // Keep decoded images in a small moving window instead of retaining the
  // entire presentation in memory. Failed background loads can be retried.
  for (const cachedIndex of imageCache.keys()) {
    if (cachedIndex < index - 1 || cachedIndex > index + 3) imageCache.delete(cachedIndex);
  }
  for (const nextIndex of [index + 1, index + 2, index + 3, index - 1]) {
    if (deck.slides[nextIndex]) getImage(nextIndex).promise.catch(() => {});
  }
}

function showLinks(slide) {
  // The SVG and image share a contained aspect ratio, keeping PDF links
  // aligned through resizing, letterboxing and fullscreen.
  linkLayer.setAttribute("viewBox", `0 0 ${deck.width} ${deck.height}`);
  const links = (slide.links || []).map(link => {
    const anchor = document.createElementNS(svgNamespace, "a");
    anchor.classList.add("slide-link");
    anchor.setAttribute("href", link.url);
    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noopener noreferrer");
    anchor.setAttribute("tabindex", "0");
    anchor.setAttribute("aria-label", link.label);
    const title = document.createElementNS(svgNamespace, "title");
    title.textContent = link.label;
    const rect = document.createElementNS(svgNamespace, "rect");
    rect.setAttribute("x", String(link.x * deck.width));
    rect.setAttribute("y", String(link.y * deck.height));
    rect.setAttribute("width", String(link.width * deck.width));
    rect.setAttribute("height", String(link.height * deck.height));
    anchor.append(title, rect);
    return anchor;
  });
  linkLayer.replaceChildren(...links);
}

async function goTo(index) {
  if (!deck) return;
  current = Math.max(0, Math.min(deck.slides.length - 1, Number.isFinite(index) ? Math.trunc(index) : 0));
  const selected = current;
  const generation = ++request;
  stage.setAttribute("aria-busy", "true");
  notice.hidden = true;
  recovery.hidden = true;
  try {
    const entry = getImage(selected, "high");
    if (!entry.ready) await entry.promise;
    if (generation !== request) return;
    const image = entry.image;
    image.id = "slide-image";
    image.width = deck.width;
    image.height = deck.height;
    image.alt = `${deck.title}${deck.slides[selected].title ? ` · ${deck.slides[selected].title}` : ""}, ${selected + 1} / ${deck.slides.length}`;
    if (image !== slideImage) slideImage.replaceWith(image);
    slideImage = image;
    showLinks(deck.slides[selected]);
    stage.setAttribute("aria-busy", "false");
    history.replaceState(null, "", `#${hashPrefix}-${selected + 1}`);
    announcement.textContent = `${deck.slides.length}개 중 ${selected + 1}번째 화면`;
    preloadAround(selected);
  } catch {
    if (generation !== request) return;
    stage.setAttribute("aria-busy", "false");
    linkLayer.replaceChildren();
    showNotice("화면을 불러오지 못했습니다. 다시 시도해 주세요.", true);
  }
}

async function loadDeck() {
  notice.hidden = true;
  stage.setAttribute("aria-busy", "true");
  try {
    const response = await fetch(manifestPath, { cache: "no-cache" });
    if (!response.ok) throw new Error("Manifest unavailable");
    const data = await response.json();
    if (!Array.isArray(data.slides) || !data.slides.length || !Number.isFinite(data.width) || data.width <= 0 || !Number.isFinite(data.height) || data.height <= 0) throw new Error("Invalid deck");
    for (const slide of data.slides) {
      if (typeof slide.image !== "string" || !slide.image.startsWith("/assets/") || new URL(slide.image, location.origin).origin !== location.origin) throw new Error("Invalid slide asset");
      for (const link of slide.links || []) {
        if (new URL(link.url).protocol !== "https:" || typeof link.label !== "string" || ![link.x, link.y, link.width, link.height].every(value => Number.isFinite(value) && value >= 0 && value <= 1) || link.width === 0 || link.height === 0 || link.x + link.width > 1 || link.y + link.height > 1) throw new Error("Invalid slide link");
      }
    }
    deck = data;
    await goTo(pageFromHash());
  } catch {
    stage.setAttribute("aria-busy", "false");
    showNotice("자료를 불러오지 못했습니다. 다시 시도해 주세요.", true);
  }
}

function showToast(text) {
  const toast = document.getElementById("toast");
  toast.textContent = text;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4500);
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    showToast("이 브라우저에서는 전체화면을 켤 수 없습니다. 방향키로 슬라이드를 이동할 수 있습니다.");
  }
}

function clearDigits() {
  pageDigits = "";
  clearTimeout(digitTimer);
}

document.getElementById("retry").addEventListener("click", () => deck ? goTo(current) : loadDeck());
document.addEventListener("keydown", event => {
  const target = event.target instanceof Element ? event.target : null;
  if (event.altKey || event.ctrlKey || event.metaKey || target?.closest("input, textarea, select, [contenteditable]")) return;
  const key = event.key.toLowerCase();
  if (key === "f") {
    event.preventDefault();
    clearDigits();
    if (!event.repeat) toggleFullscreen();
    return;
  }
  if (key === "escape") {
    clearDigits();
    return;
  }
  if (!deck) return;
  if (/^\d$/.test(key)) {
    event.preventDefault();
    pageDigits = (pageDigits + key).slice(-4);
    clearTimeout(digitTimer);
    digitTimer = setTimeout(clearDigits, 2500);
    return;
  }
  if (key === "enter" && pageDigits) {
    event.preventDefault();
    const page = Number(pageDigits);
    clearDigits();
    if (page >= 1 && page <= deck.slides.length) goTo(page - 1);
    return;
  }
  // Enter still opens focused PDF hyperlinks; presentation keys never click them.
  if (key === "enter" && target?.closest("a, button")) return;
  if (key === " " && target?.closest("button")) return;
  if (["arrowright", "arrowdown", "pagedown", " ", "enter"].includes(key)) {
    event.preventDefault();
    clearDigits();
    goTo(current + (event.shiftKey && key === " " ? -1 : 1));
  } else if (["arrowleft", "arrowup", "pageup", "backspace"].includes(key)) {
    event.preventDefault();
    clearDigits();
    goTo(current - 1);
  } else if (key === "home" || key === "end") {
    event.preventDefault();
    clearDigits();
    goTo(key === "home" ? 0 : deck.slides.length - 1);
  }
});
window.addEventListener("blur", clearDigits);
window.addEventListener("hashchange", () => goTo(pageFromHash()));
loadDeck();
