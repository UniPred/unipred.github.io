"use strict";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
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

// Arrow keys follow the WAI-ARIA tabs pattern, including Home and End.
function wireTabs(buttons, select) {
  buttons.forEach((button, index) => {
    button.addEventListener("click", () => select(index));
    button.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % buttons.length;
      if (event.key === "ArrowLeft")
        next = (index + buttons.length - 1) % buttons.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = buttons.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      select(next);
      buttons[next].focus();
    });
  });
}
function activateTab(buttons, selected) {
  buttons.forEach((button, index) => {
    button.setAttribute("aria-selected", String(index === selected));
    button.tabIndex = index === selected ? 0 : -1;
  });
}

const stages = [
  {
    phase: "TRAINING · FOUNDATION-MODEL PRIORS",
    title: "Start with an informed guess.",
    description:
      "An LLM proposes predicates and hypotheses about how actions change them. Demonstration transitions turn these effect hypotheses into supervision for visual predicate learning.",
    label: "EXAMPLE HYPOTHESIS",
    example: "Pick(toy) → Holding(robot, toy)",
    hypothesis: "Proposed action effects",
    classifier: "Grounded in demonstrations",
    feedback: "Training & validation feedback refines the hypothesis",
  },
  {
    phase: "TRAINING · LEARNING FROM DEMONSTRATIONS",
    title: "Make the concept visible.",
    description:
      "In image-based domains, DINOv3 features describe object-centric observations. Neural classifiers learn from the pseudo-labels induced by each candidate effect hypothesis, connecting a symbolic concept to visual evidence.",
    label: "FROM OBSERVATIONS TO A PREDICATE",
    example: "RGB crop → DINOv3 → neural classifier",
    hypothesis: "Effect hypotheses → pseudo-labels",
    classifier: "Learn to distinguish visual states",
    feedback: "Losses reveal how well a hypothesis fits the observations",
  },
  {
    phase: "TRAINING · THE BILEVEL FEEDBACK LOOP",
    title: "Let evidence revise the guess.",
    description:
      "Training and validation feedback returns to the LLM, which refines its effect hypotheses. This outer loop improves the supervision used by the inner neural learning loop. Planning-driven selection then chooses useful predicates, with explicit support for derived predicates.",
    label: "TWO LEVELS, ONE LEARNING LOOP",
    example: "LLM hypotheses ↔ learned visual predicates",
    hypothesis: "Revise the effect hypothesis",
    classifier: "Retrain with improved supervision",
    feedback: "Learn → evaluate → refine → learn again",
  },
  {
    phase: "INFERENCE · PLANNING WITH LEARNED PREDICATES",
    title: "Turn what is seen into what to do.",
    description:
      "Learned predicates convert new observations into a symbolic state. A planner uses the learned operators and samplers to compose provided low-level controllers. After each controller, the robot observes again and replans when needed.",
    label: "AFTER TRAINING",
    example: "Observe → ground predicates → plan → execute",
  },
];
const stageButtons = [...document.querySelectorAll("[data-stage]")];
const methodPanel = document.querySelector("#method-panel");
const methodPlay = document.querySelector("#method-play");
let currentStage = 0;
let methodTimer = null;

// Deterministic illustrative positions, not measured embeddings or reported results.
const points = Array.from({ length: 44 }, (_, i) => {
  const holding = i % 4 === 2;
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle",
  );
  circle.setAttribute("r", i % 9 === 0 ? "6" : "4.5");
  circle.setAttribute("fill", holding ? "#d38356" : "#5d7e68");
  circle.classList.add("scatter-point");
  document.querySelector("#scatter-points").append(circle);
  return { circle, holding, i };
});
function drawScatter(stage) {
  points.forEach(({ circle, holding, i }) => {
    const angle = i * 2.39996;
    const radius = 22 + ((i * 17) % 79);
    const initialX = 270 + Math.cos(angle) * radius * 1.85;
    const initialY = 113 + Math.sin(angle) * radius * 0.88;
    const finalX = (holding ? 393 : 165) + Math.cos(angle) * radius * 0.88;
    const finalY = 113 + Math.sin(angle) * radius * 0.92;
    const progress = [0, 0.42, 1, 1][stage];
    circle.setAttribute(
      "cx",
      String(initialX + (finalX - initialX) * progress),
    );
    circle.setAttribute(
      "cy",
      String(initialY + (finalY - initialY) * progress),
    );
  });
}
function setStage(stage) {
  currentStage = stage;
  const data = stages[stage];
  activateTab(stageButtons, stage);
  methodPanel.setAttribute("aria-labelledby", `tab-${stage}`);
  methodPanel.dataset.current = stage;
  document.querySelector("#method-phase").textContent = data.phase;
  document.querySelector("#method-step-title").textContent = data.title;
  document.querySelector("#method-step-description").textContent =
    data.description;
  document.querySelector("#method-example > span").textContent = data.label;
  document.querySelector("#method-example code").textContent = data.example;
  document.querySelector("#method-counter").textContent = `0${stage + 1} / 04`;
  document.querySelector(".learning-visual").hidden = stage === 3;
  document.querySelector(".planning-visual").hidden = stage !== 3;
  if (stage !== 3) {
    document.querySelector("#hypothesis-label").textContent = data.hypothesis;
    document.querySelector("#classifier-label").textContent = data.classifier;
    document.querySelector("#feedback-label").textContent = data.feedback;
    drawScatter(stage);
  }
}
function pauseMethod() {
  clearInterval(methodTimer);
  methodTimer = null;
  methodPlay.innerHTML = '<span aria-hidden="true">▶</span> Play walkthrough';
  methodPlay.setAttribute("aria-label", "Play the method walkthrough");
}
methodPlay.addEventListener("click", () => {
  if (methodTimer) return pauseMethod();
  methodPlay.innerHTML = '<span aria-hidden="true">Ⅱ</span> Pause walkthrough';
  methodPlay.setAttribute("aria-label", "Pause the method walkthrough");
  methodTimer = setInterval(
    () => setStage((currentStage + 1) % stages.length),
    6500,
  );
});
wireTabs(stageButtons, (stage) => {
  pauseMethod();
  setStage(stage);
});
setStage(0);

const clips = {
  main_demo_1: {
    label: "Three toys",
    title: "Clear the toys.\nThen clean the table.",
    caption:
      "The robot picks up three toy vehicles and places them in the box, then uses a towel to wipe the tabletop. The task requires coordinating object transfers and wiping, rather than repeating a single motion.",
    goal: "Toys stored; tabletop cleaned.",
    watch: "The transition from picking and placing toys to using the towel.",
    speed: "Original footage · displayed at 3× speed",
  },
  main_demo_2: {
    label: "Two toys",
    title: "A new arrangement.\nThe same task.",
    caption:
      "Starting with two toy vehicles, the robot clears the tabletop into the box and then wipes with the towel. The symbolic plan connects the observed arrangement to the same high-level cleaning goal.",
    goal: "Toys stored; tabletop cleaned.",
    watch: "The sequence of transfers before the robot begins wiping.",
    speed: "Original footage · displayed at 3× speed",
  },
  "pick-clutter-hard": {
    label: "Hard",
    title: "Make room.\nReach the target.",
    caption:
      "Snack packets sit among bottles and a container in a cluttered workspace. The robot rearranges the scene and retrieves the targets, combining obstacle handling with the final object transfers.",
    goal: "Retrieve the target snack packets.",
    watch:
      "Preparatory rearrangements that make a target accessible before it is picked.",
    speed: "Original demonstration footage",
  },
  "pick-clutter-mid": {
    label: "Moderate",
    title: "Move the obstruction.\nThen retrieve.",
    caption:
      "A bottle obstructs access to a target snack packet. The robot moves the obstruction and retrieves the packet, illustrating why a successful task can require actions on objects other than the target.",
    goal: "Retrieve the target snack packets.",
    watch:
      "An obstacle is moved before the target is transferred into the container.",
    speed: "Original footage · displayed at 4× speed",
  },
  "pick-clutter-easy": {
    label: "Easy",
    title: "Find the target.\nComplete the transfer.",
    caption:
      "With less clutter around the snack packets, the robot can use a more direct retrieval sequence. This run shows the same learned world model operating in a simpler object arrangement.",
    goal: "Retrieve the target snack packets.",
    watch: "How target retrieval changes when fewer rearrangements are needed.",
    speed: "Original footage · displayed at 4× speed",
  },
};
const domains = [
  {
    id: "table",
    label: "TABLE CLEAN REAL",
    clips: ["main_demo_1", "main_demo_2"],
  },
  {
    id: "clutter",
    label: "CLUTTERED RETRIEVAL REAL",
    clips: ["pick-clutter-hard", "pick-clutter-mid", "pick-clutter-easy"],
  },
];
const domainButtons = [...document.querySelectorAll("[data-domain]")];
const demoVideo = document.querySelector("#demo-video");
function setClip(id) {
  const clip = clips[id];
  demoVideo.pause();
  demoVideo.poster = `static/images/posters/${id}.jpg`;
  demoVideo.querySelector("source").src = `static/videos/web/${id}.mp4`;
  demoVideo.setAttribute("aria-label", clip.title.replace("\n", " "));
  demoVideo.load();
  const title = document.querySelector("#demo-title");
  title.replaceChildren();
  clip.title.split("\n").forEach((line, i) => {
    if (i) title.append(document.createElement("br"));
    title.append(document.createTextNode(line));
  });
  for (const key of ["caption", "goal", "watch", "speed"])
    document.querySelector(`#demo-${key}`).textContent = clip[key];
  document.querySelectorAll("[data-clip]").forEach((button) => {
    const selected = button.dataset.clip === id;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}
function setDomain(index) {
  const domain = domains[index];
  activateTab(domainButtons, index);
  document
    .querySelector("#demo-panel")
    .setAttribute("aria-labelledby", `domain-${domain.id}`);
  document.querySelector("#demo-domain-label").textContent = domain.label;
  const options = document.querySelector("#demo-options");
  options.replaceChildren();
  domain.clips.forEach((id) => {
    const button = document.createElement("button");
    button.textContent = clips[id].label;
    button.dataset.clip = id;
    button.addEventListener("click", () => setClip(id));
    options.append(button);
  });
  setClip(domain.clips[0]);
}
wireTabs(domainButtons, setDomain);
document
  .querySelectorAll("[data-clip]")
  .forEach((button) =>
    button.addEventListener("click", () => setClip(button.dataset.clip)),
  );

const videos = [...document.querySelectorAll("video")];
let otherVideoHasPlayed = false;
const film = document.querySelector("#overview-film");
videos.forEach((video) =>
  video.addEventListener("play", () => {
    if (video !== film) otherVideoHasPlayed = true;
    videos.forEach((other) => {
      if (other !== video) other.pause();
    });
  }),
);
let filmAutoPlayed = false;
if ("IntersectionObserver" in window) {
  const mediaObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting, intersectionRatio }) => {
        if (!isIntersecting) target.pause();
        if (
          target === film &&
          intersectionRatio > 0.35 &&
          !reducedMotion.matches &&
          !filmAutoPlayed &&
          !otherVideoHasPlayed
        ) {
          filmAutoPlayed = true;
          film.play().catch(() => {
            /* Native controls remain available if autoplay is blocked. */
          });
        }
      });
    },
    { threshold: [0, 0.35] },
  );
  videos.forEach((video) => mediaObserver.observe(video));
  const preloadObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting && target.preload === "none") {
          target.preload = "metadata";
          // A user may have just pressed play; do not interrupt that request.
          if (target.paused) target.load();
          preloadObserver.unobserve(target);
        }
      });
    },
    { rootMargin: "250px" },
  );
  videos
    .filter((video) => video !== film)
    .forEach((video) => preloadObserver.observe(video));
  new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) pauseMethod();
  }).observe(methodPanel);
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    videos.forEach((video) => video.pause());
    pauseMethod();
  }
});
reducedMotion.addEventListener("change", (event) => {
  if (event.matches) {
    film.pause();
    pauseMethod();
  }
});

document.querySelector("#copy-citation").addEventListener("click", async () => {
  const text = document.querySelector("#citation-text").textContent;
  const button = document.querySelector("#copy-citation");
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied ✓";
    document.querySelector("#copy-status").textContent =
      "BibTeX copied to clipboard.";
    setTimeout(() => {
      button.innerHTML = 'Copy BibTeX <span aria-hidden="true">↗</span>';
    }, 2200);
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(document.querySelector("#citation-text"));
    selection.removeAllRanges();
    selection.addRange(range);
    button.textContent = "Select & copy";
    document.querySelector("#copy-status").textContent =
      "Citation selected. Press Control+C or Command+C to copy.";
  }
});
