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

const V = window.UniPredVisuals;
const diagram = document.querySelector("#learning-diagram");
const flowCanvas = document.querySelector("#concept-flow");
const flowContext = flowCanvas.getContext("2d");
const learningButton = document.querySelector("#learning-toggle");
const motionButton = document.querySelector("#motion-toggle");
const storySteps = [...document.querySelectorAll(".flow-steps button")];
const flowDurations = [2600, 3400, 7500, 3600, 4700, 5800];
const descriptions = [
  "An LLM agent proposes concepts and their action effects.",
  "Demonstrated action transitions provide supervision.",
  "Learning and validation feedback guide the agent’s next proposal.",
  "Learned predicates turn observations into facts that describe a state.",
  "The planner searches action transitions between symbolic states.",
  "The robot executes the plan, observes again, and replans when needed.",
];
const flowAssets = {};
let phase = reducedMotion.matches ? 4 : 0,
  phaseElapsed = 0,
  lastFrame = null;
let diagramVisible = false,
  diagramPaused = false,
  diagramTimer = null;
let motionPaused = reducedMotion.matches;
const actionVideo = document.querySelector("#method-action");
const videos = [...document.querySelectorAll("video[data-autoplay]")];
const visibleVideos = new Set(),
  userPaused = new WeakSet(),
  autoPausing = new WeakSet();
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
function drawPanel(c, panel, active, x, y, scale, t) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.globalAlpha = active ? 1 : 0.7;
  const p = V.clamp(phaseElapsed / flowDurations[phase]),
    progress = phase === 2 ? p : 1;
  if (panel === 0) {
    if (phase === 1) {
      V.fit(c, flowAssets.state1, 14, 44, 122, 134);
      V.fit(c, flowAssets.state2, 195, 44, 122, 134);
      V.label(c, "pick →", 168, 113, 16, V.ink);
      V.label(c, "Before", 76, 207, 15, V.muted);
      V.label(c, "After", 255, 207, 15, V.muted);
    } else {
      V.agent(c, flowAssets.agent, 13, 80, 77, t);
      V.label(c, "LLM agent", 52, 186, 15, V.ink);
      V.path(
        c,
        [
          [107, 115],
          [162, 115],
        ],
        V.colors[0],
        1.5,
        (t * 0.32) % 1,
      );
      if (phase === 0) {
        V.dot(c, 246, 114, 9, V.colors[0]);
        V.label(c, "HandEmpty?", 246, 162, 18, V.ink);
        V.label(c, "candidate concept", 246, 187, 13, V.muted);
      } else {
        V.scatter(c, 177, 60, 144, 110, progress, t);
        V.label(c, "Learn", 248, 194, 15, V.ink);
      }
      V.path(
        c,
        [
          [248, 211],
          [248, 233],
          [51, 233],
          [51, 205],
        ],
        V.colors[2],
        1.5,
        (t * 0.24) % 1,
      );
      V.label(c, "feedback", 150, 255, 12, V.muted);
    }
  } else if (panel === 1) {
    V.network(c, 104, 49, 139, phase === 3 ? V.clamp(p * 2) : 1);
    const labels = [
      ["HandEmpty", 33, 57, 0],
      ["Holding", 288, 106, 1],
      ["Clear", 68, 206, 2],
    ];
    labels.forEach(([s, x, y, i]) => {
      V.dot(c, x, y - 20, 4, V.colors[i]);
      V.label(c, s, x, y + 2, 14, V.ink);
    });
    V.label(c, "Predicates → facts → state", 173, 253, 14, V.muted);
    V.path(
      c,
      [
        [170, 193],
        [170, 214],
      ],
      V.line,
      1,
    );
    V.state(c, 170, 224, 14, [1, 0, 1], true);
  } else if (phase === 5 && actionVideo.readyState >= 2) {
    V.fit(c, actionVideo, 6, 32, 326, 184);
    V.label(c, "Actual robot · table cleaning", 168, 251, 14, V.muted);
  } else {
    V.graph(c, 9, 26, 322, 166, phase === 4 ? p : 1);
    V.label(c, "Action transitions connect states", 170, 268, 14, V.muted);
  }
  c.restore();
}
function paintFlow() {
  if (!flowAssets.agent || !flowAssets.state1 || !flowAssets.state2) return;
  const mobile = innerWidth <= 760,
    width = mobile ? 420 : 1100,
    height = mobile ? 310 : 340;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  if (
    flowCanvas.width !== Math.round(width * ratio) ||
    flowCanvas.height !== Math.round(height * ratio)
  ) {
    flowCanvas.width = Math.round(width * ratio);
    flowCanvas.height = Math.round(height * ratio);
  }
  const c = flowContext;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  c.clearRect(0, 0, width, height);
  const t = phaseElapsed / 1000;
  const activePanel = phase < 3 ? 0 : phase === 3 ? 1 : 2;
  if (mobile) {
    drawPanel(c, activePanel, true, 12, 0, 1.17, t);
  } else {
    ["01 / LEARN", "02 / REPRESENT", "03 / PLAN & ACT"].forEach((s, i) => {
      V.label(
        c,
        s,
        30 + i * 370,
        30,
        11,
        activePanel === i ? V.ink : V.muted,
        "left",
        500,
      );
      drawPanel(c, i, activePanel === i, 5 + i * 370, 40, 1, t);
    });
    V.path(
      c,
      [
        [353, 129],
        [372, 129],
      ],
      V.line,
      1.5,
    );
    V.path(
      c,
      [
        [723, 129],
        [742, 129],
      ],
      V.line,
      1.5,
    );
  }
  document.querySelector(".flow-progress i").style.transform =
    `scaleX(${V.clamp(phaseElapsed / flowDurations[phase])})`;
}
function setPhase(next) {
  phase = next;
  phaseElapsed = 0;
  diagram.dataset.phase = String(phase);
  storySteps.forEach((b, i) =>
    b.setAttribute("aria-pressed", String(i === phase)),
  );
  document.querySelector("#flow-number").textContent = `0${phase + 1} / 06`;
  document.querySelector("#flow-description").textContent = descriptions[phase];
  paintFlow();
  syncAction();
}
function syncAction() {
  if (
    phase === 5 &&
    diagramVisible &&
    !diagramPaused &&
    !motionPaused &&
    !document.hidden
  ) {
    actionVideo.preload = "auto";
    actionVideo.play().catch(() => {});
  } else actionVideo.pause();
}
function advanceStory(now) {
  if (lastFrame !== null) phaseElapsed += Math.min(now - lastFrame, 100);
  lastFrame = now;
  if (phaseElapsed >= flowDurations[phase]) setPhase((phase + 1) % 6);
  paintFlow();
  diagramTimer = requestAnimationFrame(advanceStory);
}
function updateDiagram() {
  cancelAnimationFrame(diagramTimer);
  diagramTimer = null;
  lastFrame = null;
  const paused = diagramPaused || motionPaused;
  learningButton.textContent = paused ? "▶" : "Ⅱ";
  learningButton.setAttribute(
    "aria-label",
    paused ? "Play concept animation" : "Pause concept animation",
  );
  learningButton.setAttribute("aria-pressed", String(paused));
  document.querySelector("#learning-status").textContent = paused
    ? "Motion off"
    : "Auto-playing";
  diagram.dataset.playing = String(
    !paused && diagramVisible && !document.hidden,
  );
  if (!paused && diagramVisible && !document.hidden)
    diagramTimer = requestAnimationFrame(advanceStory);
  syncAction();
  paintFlow();
}
function updateMotion() {
  motionButton.textContent = motionPaused ? "Motion off" : "Motion on";
  motionButton.setAttribute(
    "aria-label",
    motionPaused ? "Enable automatic motion" : "Pause automatic motion",
  );
  motionButton.setAttribute("aria-pressed", String(motionPaused));
  if (motionPaused) videos.forEach(pauseVideo);
  else visibleVideos.forEach(playVideo);
  updateDiagram();
}
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
storySteps.forEach((button) =>
  button.addEventListener("click", () => {
    setPhase(Number(button.dataset.step));
    diagramPaused = false;
    motionPaused = false;
    updateMotion();
  }),
);
motionButton.addEventListener("click", () => {
  motionPaused = !motionPaused;
  if (!motionPaused) {
    diagramPaused = false;
    videos.forEach((v) => userPaused.delete(v));
  }
  updateMotion();
});
videos.forEach((video) => {
  video.addEventListener("pause", () => {
    if (autoPausing.has(video)) autoPausing.delete(video);
    else if (!video.ended && video.readyState >= 2) userPaused.add(video);
  });
  video.addEventListener("play", () => userPaused.delete(video));
});
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach(({ target, isIntersecting, intersectionRatio }) => {
        if (isIntersecting && intersectionRatio >= 0.2) {
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
    { threshold: [0, 0.2] },
  );
  videos.forEach((video) => observer.observe(video));
  new IntersectionObserver(
    (entries) => {
      diagramVisible =
        entries[0].isIntersecting && entries[0].intersectionRatio >= 0.2;
      updateDiagram();
    },
    { threshold: [0, 0.2] },
  ).observe(flowCanvas);
} else {
  diagramVisible = true;
  videos.forEach((v) => visibleVideos.add(v));
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
new ResizeObserver(paintFlow).observe(flowCanvas);
Promise.all(
  [
    ["agent", "static/images/agent.svg"],
    ["state1", "static/images/method/state-1.png"],
    ["state2", "static/images/method/state-2.png"],
  ].map(
    ([key, src]) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          flowAssets[key] = img;
          resolve();
        };
        img.onerror = reject;
        img.src = src;
      }),
  ),
)
  .then(() => document.fonts.ready)
  .then(() => {
    setPhase(phase);
    updateMotion();
  })
  .catch(() => {
    document.querySelector("#flow-description").textContent =
      "Learn visual predicates from demonstrations and feedback, then plan and execute with them.";
  });
const overviewFilm = document.querySelector("#overview-film");
const narrationButton = document.querySelector("#narration-toggle");
let narrationStarted = false;
function updateNarration() {
  const enabled = !overviewFilm.muted && overviewFilm.volume > 0;
  narrationButton.textContent = enabled
    ? "Sound on · mute"
    : "▷ Watch with narration";
  narrationButton.setAttribute("aria-pressed", String(enabled));
  narrationButton.setAttribute(
    "aria-label",
    enabled ? "Mute narration" : "Play film with English narration",
  );
}
narrationButton.addEventListener("click", () => {
  if (overviewFilm.muted || overviewFilm.volume === 0) {
    overviewFilm.muted = false;
    overviewFilm.volume = 1;
    if (!narrationStarted) {
      overviewFilm.currentTime = 0;
      narrationStarted = true;
    }
    userPaused.delete(overviewFilm);
    overviewFilm.play().catch(() => {});
  } else overviewFilm.muted = true;
  updateNarration();
});
overviewFilm.addEventListener("volumechange", updateNarration);
updateNarration();
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
