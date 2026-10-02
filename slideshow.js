"use strict";

const stage = document.getElementById("slide-stage");
const surface = document.getElementById("slide-surface");
const slideImage = document.getElementById("slide-image");
const previous = document.getElementById("previous");
const next = document.getElementById("next");
const pageInput = document.getElementById("page-number");
const notice = document.getElementById("stage-notice");
const message = document.getElementById("stage-message");
const retry = document.getElementById("retry");
const overview = document.getElementById("overview");
const overviewButton = document.getElementById("overview-button");
const fullscreenButton = document.getElementById("fullscreen-button");
const announcement = document.getElementById("slide-announcement");
let deck;
let current = 0;
let request = 0;
let idleTimer;
let toastTimer;

function showNotice(text, canRetry = false) {
  message.textContent = text;
  retry.hidden = !canRetry;
  notice.hidden = false;
}

function pageFromHash() {
  const match = /^#slide-(\d+)$/.exec(window.location.hash);
  return match ? Number(match[1]) - 1 : 0;
}

function preload(index) {
  if (!deck.slides[index]) return;
  const image = new Image();
  image.decoding = "async";
  image.src = deck.slides[index].image;
}

async function goTo(index) {
  if (!deck) return;
  current = Math.max(0, Math.min(deck.slides.length - 1, Number.isFinite(index) ? Math.trunc(index) : 0));
  const selected = current;
  const generation = ++request;
  pageInput.value = String(current + 1);
  previous.disabled = current === 0;
  next.disabled = current === deck.slides.length - 1;
  stage.setAttribute("aria-busy", "true");
  showNotice(`${current + 1}번 슬라이드를 불러오는 중입니다.`);
  history.replaceState(null, "", `#slide-${current + 1}`);
  document.querySelectorAll(".thumbnail").forEach((button, i) => {
    button.setAttribute("aria-current", String(i === current));
  });
  try {
    const image = new Image();
    image.src = deck.slides[selected].image;
    await image.decode();
    if (generation !== request) return;
    slideImage.src = image.src;
    slideImage.alt = `${deck.title}, ${selected + 1} / ${deck.slides.length}`;
    notice.hidden = true;
    stage.setAttribute("aria-busy", "false");
    announcement.textContent = `${deck.slides.length}장 중 ${selected + 1}번째 슬라이드`;
    preload(selected + 1);
    preload(selected - 1);
  } catch {
    if (generation !== request) return;
    stage.setAttribute("aria-busy", "false");
    showNotice("슬라이드를 불러오지 못했습니다. 다시 시도하거나 PDF를 내려받아 주세요.", true);
  }
}

function buildOverview() {
  const grid = document.getElementById("thumbnail-grid");
  const buttons = deck.slides.map((slide, index) => {
    const button = document.createElement("button");
    button.className = "thumbnail";
    button.setAttribute("aria-label", `${index + 1}번 슬라이드로 이동`);
    const image = document.createElement("img");
    image.src = slide.thumbnail;
    image.alt = "";
    image.loading = "lazy";
    image.width = 384;
    image.height = 217;
    const number = document.createElement("span");
    number.textContent = String(index + 1).padStart(2, "0");
    button.append(image, number);
    button.addEventListener("click", () => {
      overview.close();
      goTo(index);
    });
    return button;
  });
  grid.replaceChildren(...buttons);
}

async function loadDeck() {
  showNotice("발표자료를 불러오는 중입니다.");
  try {
    const response = await fetch("/assets/bigkachu-kim-taehyun/slides.json");
    if (!response.ok) throw new Error("Manifest unavailable");
    const data = await response.json();
    if (!Array.isArray(data.slides) || !data.slides.length) throw new Error("Empty deck");
    // Assets must remain on this site, including when the manifest is updated.
    for (const slide of data.slides) {
      for (const path of [slide.image, slide.thumbnail]) {
        if (typeof path !== "string" || !path.startsWith("/assets/") || new URL(path, location.origin).origin !== location.origin) throw new Error("Invalid slide asset");
      }
    }
    deck = data;
    pageInput.max = String(deck.slides.length);
    document.getElementById("page-total").textContent = String(deck.slides.length);
    document.querySelector("#overview-title span").textContent = String(deck.slides.length);
    surface.disabled = false;
    pageInput.disabled = false;
    overviewButton.disabled = false;
    buildOverview();
    await goTo(pageFromHash());
  } catch {
    stage.setAttribute("aria-busy", "false");
    showNotice("발표자료를 불러오지 못했습니다. 다시 시도하거나 PDF를 내려받아 주세요.", true);
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
    showToast("이 브라우저에서는 전체화면을 켤 수 없습니다. 슬라이드 이동은 계속 사용할 수 있습니다.");
  }
}

function wakeControls() {
  document.documentElement.classList.remove("is-idle");
  clearTimeout(idleTimer);
  if (document.fullscreenElement && !overview.open) {
    idleTimer = setTimeout(() => document.documentElement.classList.add("is-idle"), 2800);
  }
}

function openOverview() {
  if (!deck) return;
  overview.showModal();
  wakeControls();
  const selected = overview.querySelector('[aria-current="true"]');
  selected?.focus();
  selected?.scrollIntoView({ block: "nearest" });
}

previous.addEventListener("click", () => goTo(current - 1));
next.addEventListener("click", () => goTo(current + 1));
retry.addEventListener("click", () => deck ? goTo(current) : loadDeck());
document.getElementById("page-form").addEventListener("submit", event => {
  event.preventDefault();
  if (pageInput.value && pageInput.checkValidity()) {
    goTo(Number(pageInput.value) - 1);
    pageInput.blur();
  }
});
pageInput.addEventListener("change", () => {
  if (pageInput.value && pageInput.checkValidity()) goTo(Number(pageInput.value) - 1);
});
pageInput.addEventListener("blur", () => { pageInput.value = String(current + 1); });
overviewButton.addEventListener("click", openOverview);
document.getElementById("close-overview").addEventListener("click", () => overview.close());
overview.addEventListener("close", wakeControls);
overview.addEventListener("click", event => {
  if (event.target !== overview) return;
  const bounds = overview.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) overview.close();
});
fullscreenButton.hidden = !document.fullscreenEnabled;
fullscreenButton.addEventListener("click", async event => {
  await toggleFullscreen();
  // Pointer users can let the controls fade; keyboard users retain focus.
  if (event.detail > 0) fullscreenButton.blur();
});
document.addEventListener("fullscreenchange", () => {
  const active = Boolean(document.fullscreenElement);
  fullscreenButton.setAttribute("aria-pressed", String(active));
  document.getElementById("fullscreen-label").textContent = active ? "전체화면 종료" : "전체화면";
  fullscreenButton.title = active ? "전체화면 종료 (Esc 또는 F)" : "전체화면 (F)";
  wakeControls();
});

let pointerStart;
let suppressClickUntil = 0;
surface.addEventListener("pointerdown", event => {
  pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
});
surface.addEventListener("pointercancel", () => { pointerStart = null; });
surface.addEventListener("pointerup", event => {
  if (!pointerStart || pointerStart.id !== event.pointerId) return;
  const dx = event.clientX - pointerStart.x;
  const dy = event.clientY - pointerStart.y;
  pointerStart = null;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
    suppressClickUntil = Date.now() + 500;
    goTo(current + (dx < 0 ? 1 : -1));
  }
});
surface.addEventListener("click", event => {
  if (Date.now() < suppressClickUntil) return;
  const bounds = surface.getBoundingClientRect();
  goTo(current + (event.detail !== 0 && event.clientX - bounds.left < bounds.width * .3 ? -1 : 1));
});

document.addEventListener("keydown", event => {
  wakeControls();
  if (event.altKey || event.ctrlKey || event.metaKey || overview.open || event.target.closest("input, textarea, select, [contenteditable]")) return;
  const key = event.key.toLowerCase();
  if (key === "f" && document.fullscreenEnabled) {
    event.preventDefault();
    toggleFullscreen();
  } else if (key === "g") {
    event.preventDefault();
    openOverview();
  } else if (deck) {
    // Let focused buttons/links keep their native Space/Enter activation.
    if ((key === " " || key === "enter") && event.target.closest("button, a")) return;
    if (["arrowright", "arrowdown", "pagedown", " ", "enter"].includes(key)) {
      event.preventDefault();
      goTo(current + (event.shiftKey && key === " " ? -1 : 1));
    } else if (["arrowleft", "arrowup", "pageup", "backspace"].includes(key)) {
      event.preventDefault();
      goTo(current - 1);
    } else if (key === "home" || key === "end") {
      event.preventDefault();
      goTo(key === "home" ? 0 : deck.slides.length - 1);
    }
  }
});
document.addEventListener("pointermove", wakeControls, { passive: true });
document.addEventListener("pointerdown", wakeControls, { passive: true });
window.addEventListener("hashchange", () => goTo(pageFromHash()));
loadDeck();
