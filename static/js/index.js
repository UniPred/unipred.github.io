"use strict";
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#site-nav");
function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
  navigation.classList.remove("is-open");
}
menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(open));
  navigation.classList.toggle("is-open", open);
});
navigation
  .querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navigation.classList.contains("is-open")) {
    closeMenu();
    menuButton.focus();
  }
});

// This is an explanatory feature-space animation, not a measured embedding trace.
const diagram = document.querySelector("#learning-diagram");
const points = Array.from({ length: 44 }, (_, i) => {
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle",
  );
  const holding = i % 4 === 2;
  circle.classList.add("scatter-point");
  circle.setAttribute("r", i % 9 === 0 ? "5.5" : "4");
  circle.setAttribute("fill", holding ? "#cc885c" : "#50846e");
  document.querySelector("#scatter-points").append(circle);
  return { circle, holding, i };
});
let phase = reducedMotion.matches ? 2 : 0;
function drawLearning(next) {
  phase = next;
  diagram.dataset.phase = String(phase);
  document.querySelector("#learning-stage").textContent = [
    "Agent proposes",
    "Neural model learns",
    "Feedback → agent revises",
  ][phase];
  document.querySelector("#agent-action").textContent = [
    "Propose a candidate effect vector",
    "Candidate evaluated through neural learning",
    "Read feedback, update history, revise proposal",
  ][phase];
  document.querySelector("#feature-stage").textContent = [
    "Initial representation",
    "Learning from transition constraints",
    "Refined hidden representation",
  ][phase];
  points.forEach(({ circle, holding, i }) => {
    const a = i * 2.39996,
      r = 15 + ((i * 17) % 77);
    const ix = 210 + Math.cos(a) * r * 1.8,
      iy = 107 + Math.sin(a) * r;
    const fx = (holding ? 319 : 115) + Math.cos(a) * r * 0.75,
      fy = 107 + Math.sin(a) * r;
    const p = [0, 0.43, 1][phase];
    circle.setAttribute("cx", String(ix + (fx - ix) * p));
    circle.setAttribute("cy", String(iy + (fy - iy) * p));
  });
}
drawLearning(phase);
let diagramVisible = false,
  diagramPaused = false,
  diagramTimer = null;
let motionPaused = reducedMotion.matches;
const motionButton = document.querySelector("#motion-toggle");
const learningButton = document.querySelector("#learning-toggle");
const videos = [...document.querySelectorAll("video[data-autoplay]")];
const visibleVideos = new Set();
const userPaused = new WeakSet();
const autoPausing = new WeakSet();
function pauseVideo(video) {
  if (!video.paused) {
    autoPausing.add(video);
    video.pause();
  }
}
function playVideo(video) {
  if (!motionPaused && !document.hidden && !userPaused.has(video)) {
    video.preload = "metadata";
    video.play().catch(() => {});
  }
}
function updateDiagram() {
  clearInterval(diagramTimer);
  diagramTimer = null;
  const paused = diagramPaused || motionPaused;
  learningButton.textContent = paused ? "Play ▶" : "Pause Ⅱ";
  learningButton.setAttribute(
    "aria-label",
    paused ? "Play learning animation" : "Pause learning animation",
  );
  learningButton.setAttribute("aria-pressed", String(paused));
  if (diagramVisible && !paused && !document.hidden)
    diagramTimer = setInterval(() => drawLearning((phase + 1) % 3), 4500);
}
function updateMotion() {
  motionButton.textContent = motionPaused ? "Play motion" : "Pause motion";
  motionButton.setAttribute("aria-pressed", String(motionPaused));
  if (motionPaused) videos.forEach(pauseVideo);
  else visibleVideos.forEach(playVideo);
  updateDiagram();
}
motionButton.addEventListener("click", () => {
  motionPaused = !motionPaused;
  if (!motionPaused) {
    diagramPaused = false;
    videos.forEach((v) => userPaused.delete(v));
  }
  updateMotion();
});
learningButton.addEventListener("click", () => {
  if (motionPaused) {
    motionPaused = false;
    diagramPaused = false;
    updateMotion();
  } else {
    diagramPaused = !diagramPaused;
    updateDiagram();
  }
});
videos.forEach((video) => {
  video.addEventListener("pause", () => {
    if (autoPausing.has(video)) autoPausing.delete(video);
    else if (!video.ended && video.readyState >= 2) userPaused.add(video);
  });
  video.addEventListener("play", () => userPaused.delete(video));
});
if ("IntersectionObserver" in window) {
  const mediaObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach(({ target, isIntersecting, intersectionRatio }) => {
        if (isIntersecting && intersectionRatio >= 0.25) {
          if (target.preload === "none") {
            target.preload = "metadata";
            if (target.paused) target.load();
          }
          visibleVideos.add(target);
          playVideo(target);
        } else {
          visibleVideos.delete(target);
          pauseVideo(target);
        }
      }),
    { threshold: [0, 0.25] },
  );
  videos.forEach((video) => mediaObserver.observe(video));
  new IntersectionObserver(
    (entries) => {
      diagramVisible = entries[0].isIntersecting;
      updateDiagram();
    },
    { threshold: 0.15 },
  ).observe(diagram);
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) videos.forEach(pauseVideo);
  else visibleVideos.forEach(playVideo);
  updateDiagram();
});
reducedMotion.addEventListener("change", (event) => {
  motionPaused = event.matches;
  updateMotion();
});
updateMotion();

document.querySelector("#copy-citation").addEventListener("click", async () => {
  const button = document.querySelector("#copy-citation");
  try {
    await navigator.clipboard.writeText(
      document.querySelector("#citation-text").textContent,
    );
    button.textContent = "Copied ✓";
    document.querySelector("#copy-status").textContent =
      "BibTeX copied to clipboard.";
    setTimeout(() => {
      button.textContent = "Copy BibTeX ↗";
    }, 2200);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector("#citation-text"));
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    button.textContent = "Select & copy";
    document.querySelector("#copy-status").textContent =
      "Citation selected. Press Control+C or Command+C to copy.";
  }
});
