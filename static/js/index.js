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
const storyScenes = [...document.querySelectorAll(".story-scene")];
const storySteps = [...document.querySelectorAll(".story-steps button")];
const stageDuration = [6000, 6500, 8000, 6500];
const dockingDuration = 1200;
const storyStage = document.querySelector(".story-stage");
const overviewButton = document.querySelector("#learning-overview");
const easeStory = (t) => t * t * (3 - 2 * t);
const feedbackRoute = document.querySelector("#feedback-route");
const feedbackSignal = document.querySelector("#feedback-signal");
const feedbackLength = feedbackRoute.getTotalLength();
let phase = reducedMotion.matches ? 4 : 0,
  phaseElapsed = 0,
  lastFrame = null;
function renderFeedback(progress) {
  const p = progress * progress * (3 - 2 * progress);
  points.forEach(({ circle, holding, i }) => {
    const a = i * 2.39996,
      r = 15 + ((i * 17) % 77);
    const ix = 210 + Math.cos(a) * r * 1.8,
      iy = 107 + Math.sin(a) * r;
    const fx = (holding ? 319 : 115) + Math.cos(a) * r * 0.75;
    circle.setAttribute("cx", String(ix + (fx - ix) * p));
    circle.setAttribute("cy", String(iy));
  });
  document.querySelector("#decision-boundary").style.opacity = String(p);
  const point = feedbackRoute.getPointAtLength(feedbackLength * progress);
  feedbackSignal.setAttribute("cx", point.x);
  feedbackSignal.setAttribute("cy", point.y);
  document.querySelector("#agent-action").textContent =
    progress < 0.35
      ? "Propose a candidate."
      : progress < 0.7
        ? "Read the learning feedback."
        : "Revise the next proposal.";
}
function paintStory() {
  const width = storyStage.clientWidth;
  const height = storyStage.clientHeight;
  const baseHeight = innerWidth <= 760 ? 640 : 530;
  const gap = innerWidth <= 760 ? 20 : 56;
  const dockScale = (width - gap) / (2 * width);
  const focusScale = innerWidth <= 760 ? 1 : 0.94;
  const focus = {
    x: (width * (1 - focusScale)) / 2,
    y: (height - baseHeight * focusScale) / 2,
  };
  diagram.dataset.assembled = String(phase === 4);
  storyScenes.forEach((scene, i) => {
    const done = i < phase;
    const docking =
      i === phase
        ? Math.max(
            0,
            Math.min(1, (phaseElapsed - stageDuration[i]) / dockingDuration),
          )
        : 0;
    const dock = {
      x: i % 2 ? width - width * dockScale : 0,
      y: i < 2 ? 0 : height - baseHeight * dockScale,
    };
    scene.hidden = i > phase;
    scene.classList.toggle("is-docked", done);
    scene.classList.toggle("is-focused", i === phase && docking === 0);
    scene.classList.toggle("is-docking", i === phase && docking > 0);
    if (scene.hidden) return;
    const p = done ? 1 : easeStory(docking);
    const scale = focusScale + (dockScale - focusScale) * p;
    const x = focus.x + (dock.x - focus.x) * p;
    const y = focus.y + (dock.y - focus.y) * p;
    scene.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    scene.style.zIndex = done ? "1" : "3";
    scene.style.opacity = done ? (phase === 4 ? "1" : ".28") : "1";
  });
}
function drawLearning(next) {
  phase = next;
  phaseElapsed = 0;
  diagram.dataset.phase = String(phase);
  document.querySelector("#learning-stage").textContent =
    phase === 4 ? "Complete" : `0${phase + 1} / 04`;
  storySteps.forEach((button, i) => {
    button.setAttribute("aria-pressed", String(i === phase));
    button.classList.toggle("is-complete", i < phase);
  });
  renderFeedback(phase > 2 || reducedMotion.matches ? 1 : 0);
  paintStory();
}
drawLearning(phase);
new ResizeObserver(paintStory).observe(storyStage);
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
function advanceStory(now) {
  if (lastFrame !== null) phaseElapsed += Math.min(now - lastFrame, 100);
  lastFrame = now;
  if (phaseElapsed >= stageDuration[phase] + dockingDuration) {
    drawLearning(phase + 1);
    if (phase === 4) {
      updateDiagram();
      return;
    }
  }
  if (phase === 2) renderFeedback(Math.min(1, phaseElapsed / 7200));
  paintStory();
  diagramTimer = requestAnimationFrame(advanceStory);
}
function updateDiagram() {
  cancelAnimationFrame(diagramTimer);
  diagramTimer = null;
  lastFrame = null;
  const paused = diagramPaused || motionPaused;
  const complete = phase === 4;
  learningButton.textContent = complete
    ? "Replay ↻"
    : paused
      ? "Play ▶"
      : "Pause Ⅱ";
  learningButton.setAttribute(
    "aria-label",
    complete
      ? "Replay learning animation"
      : paused
        ? "Play learning animation"
        : "Pause learning animation",
  );
  learningButton.setAttribute("aria-pressed", String(!complete && paused));
  if (diagramVisible && !paused && !complete && !document.hidden)
    diagramTimer = requestAnimationFrame(advanceStory);
}
storySteps.forEach((button) =>
  button.addEventListener("click", () => {
    drawLearning(Number(button.dataset.step));
    diagramPaused = true;
    if (phase === 2) renderFeedback(1);
    updateDiagram();
  }),
);
overviewButton.addEventListener("click", () => {
  drawLearning(4);
  updateDiagram();
});
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
  if (phase === 4) {
    drawLearning(0);
    diagramPaused = false;
    motionPaused = false;
    updateMotion();
  } else if (motionPaused) {
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
      diagramVisible =
        entries[0].isIntersecting && entries[0].intersectionRatio >= 0.2;
      updateDiagram();
    },
    { threshold: [0, 0.2] },
  ).observe(storyStage);
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
