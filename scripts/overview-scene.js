/* Narrated film. All learning/graph motion is schematic. Execution footage is
   composited directly from the original video by ffmpeg, never seeked frames. */
"use strict";
const canvas = document.querySelector("#film"),
  ctx = canvas.getContext("2d");
const V = window.UniPredVisuals,
  assets = {};
const C = {
  bg: "#fafbf7",
  ink: "#26343c",
  muted: "#7b8589",
  line: "#d8dedc",
  dark: "#17272e",
};
let cues = [];
const label = (
  s,
  x,
  y,
  size = 24,
  color = C.ink,
  align = "left",
  weight = 400,
) => V.label(ctx, s, x, y, size, color, align, weight);
const line = (x1, y1, x2, y2, color = C.line, width = 1) =>
  V.path(
    ctx,
    [
      [x1, y1],
      [x2, y2],
    ],
    color,
    width,
  );
const fit = (img, x, y, w, h) => V.fit(ctx, img, x, y, w, h);
const dot = (x, y, r, color) => V.dot(ctx, x, y, r, color);
function pill(s, x, y, w, color = "#e7eee7") {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 43, 22);
  ctx.fill();
  label(s, x + w / 2, y + 28, 17, C.ink, "center");
}
function base(kicker, title, chapter) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, 1440, 810);
  fit(assets.mark, 65, 27, 31, 31);
  label("UniPred", 107, 49, 20, C.ink, "left", 500);
  label("IEEE TRANSACTIONS ON ROBOTICS · 2026", 1376, 47, 12, C.muted, "right");
  label(kicker, 66, 114, 13, "#719184", "left", 500);
  label(title, 63, 173, 48, C.ink, "left", 500);
  line(66, 734, 1374, 734);
  const names = [
    "Agent",
    "Demonstration",
    "Feedback",
    "Concept",
    "Plan",
    "Action",
  ];
  names.forEach((s, i) => {
    let x = 66 + i * 222;
    label(`0${i + 1}`, x, 776, 12, i === chapter ? "#638b78" : "#a3aca7");
    label(s, x + 31, 778, 18, i === chapter ? C.ink : "#929c96");
    if (i === chapter) line(x, 734, x + 160, 734, "#789a86", 3);
  });
}
function opening(t, d) {
  ctx.fillStyle = C.dark;
  ctx.fillRect(0, 0, 1440, 810);
  label("UNIPRED / ROBOT LEARNING", 74, 75, 14, "#b8c5c7", "left", 500);
  label("IEEE T-RO · 2026", 1364, 75, 14, "#b8c5c7", "right");
  const p = V.ease(t / 2.5);
  for (let x = 756; x < 1350; x += 30)
    for (let y = 173; y < 635; y += 30) dot(x, y, 0.65, "#35464c");
  ctx.save();
  ctx.globalAlpha = V.ease(t / 0.6);
  label("UniPred", 70, 348, 112, "#f2f5ef", "left", 500);
  label("A language for", 76, 427, 43, "#c7d2cf");
  label("robot action.", 76, 480, 43, "#c7d2cf");
  ctx.restore();
  ctx.save();
  ctx.translate(1035, 385);
  ctx.rotate((1 - p) * -0.12);
  V.network(ctx, -210, -210, 420, p, true);
  ctx.restore();
  label(
    "Human demonstrations → long-horizon manipulation",
    78,
    584,
    21,
    "#98acae",
  );
  line(76, 690, 1364, 690, "#43575d");
  ["Demonstrations", "Concepts", "Planning", "Action"].forEach((s, i) => {
    const alpha = V.ease((t - 0.35 - i * 0.38) / 0.65);
    ctx.save();
    ctx.globalAlpha = alpha;
    dot(82 + i * 329, 735, 4, V.colors[i]);
    label(s, 99 + i * 329, 742, 18, "#d8e2de");
    ctx.restore();
  });
  V.path(
    ctx,
    [
      [76, 690],
      [1364, 690],
    ],
    "#a6b9b4",
    1,
    (t / d) % 1,
  );
}
function agentScene(t, d) {
  base("01 / CANDIDATE CONCEPT", "Propose a useful concept.", 0);
  V.agent(ctx, assets.agent, 215, 300, 200, t);
  label("LLM agent", 315, 567, 29, C.ink, "center", 500);
  label("Prior knowledge + learning history", 315, 609, 18, C.muted, "center");
  V.path(
    ctx,
    [
      [470, 411],
      [669, 411],
    ],
    "#a9c3bf",
    2,
    (t * 0.32) % 1,
  );
  ctx.save();
  ctx.globalAlpha = V.ease(t / 0.65);
  label("Is the gripper empty?", 756, 325, 26, C.muted);
  label("HandEmpty(robot)", 754, 393, 43, C.ink, "left", 500);
  dot(716, 380, 8, V.colors[0]);
  line(756, 438, 1304, 438);
  label("Pick", 756, 493, 23);
  label("→ false", 938, 493, 23, V.colors[1]);
  label("Place", 756, 547, 23);
  label("→ true", 938, 547, 23, V.colors[2]);
  label("Proposed action effects", 756, 605, 17, C.muted);
  ctx.restore();
}
function demonstrationScene(t, d) {
  base("02 / DEMONSTRATED TRANSITIONS", "Connect a proposal to experience.", 1);
  fit(assets.overhead, 67, 254, 502, 374);
  label("Actual top-down observation", 318, 668, 18, C.muted, "center");
  ctx.save();
  ctx.globalAlpha = V.ease(t / 0.5);
  fit(assets.state1, 685, 300, 228, 236);
  label("Before", 799, 585, 17, C.muted, "center");
  label("Empty", 799, 624, 26, V.colors[2], "center");
  ctx.restore();
  V.path(
    ctx,
    [
      [948, 414],
      [1037, 414],
    ],
    V.colors[0],
    2,
    (t * 0.35) % 1,
  );
  label("pick", 993, 385, 18, C.muted, "center");
  ctx.save();
  ctx.globalAlpha = V.ease((t - 0.5) / 0.6);
  fit(assets.state2, 1080, 300, 228, 236);
  label("After", 1194, 585, 17, C.muted, "center");
  label("Holding", 1194, 624, 26, V.colors[1], "center");
  ctx.restore();
}
function feedbackScene(t, d) {
  base("03 / THE LEARNING LOOP", "Propose. Learn. Evaluate. Revise.", 2);
  V.agent(ctx, assets.agent, 190, 322, 170, t);
  label("LLM agent", 275, 542, 28, C.ink, "center", 500);
  const progress = V.clamp(t / (d - 0.8));
  const loop = (t / 3.3) % 1;
  V.path(
    ctx,
    [
      [408, 415],
      [648, 415],
    ],
    V.colors[0],
    2,
    loop,
  );
  label("proposal + effects", 528, 385, 17, C.muted, "center");
  label("Neural concept learning", 1000, 280, 25, C.ink, "center");
  V.scatter(ctx, 719, 308, 570, 252, progress, t);
  dot(875, 599, 5, V.colors[2]);
  label("Empty", 891, 606, 18, C.muted);
  dot(1082, 599, 5, V.colors[1]);
  label("Holding", 1098, 606, 18, C.muted);
  V.path(
    ctx,
    [
      [1000, 632],
      [1000, 679],
      [274, 679],
      [274, 587],
    ],
    "#769883",
    2,
    (t / 4.5) % 1,
  );
  ctx.fillStyle = C.bg;
  ctx.fillRect(470, 657, 402, 40);
  label("Learning & validation feedback", 671, 683, 21, "#638b78", "center");
  label(
    t < 3.5
      ? "Propose a candidate"
      : t < 8.5
        ? "Learn from demonstrations"
        : "Use feedback to revise",
    275,
    580,
    18,
    C.muted,
    "center",
  );
  label("Illustrative feature space", 1287, 636, 12, C.muted, "right");
}
function conceptScene(t, d) {
  base("04 / LEARNED PREDICATES", "Concepts grounded in observation.", 3);
  // UniPred’s node language now represents the learned vocabulary, never the agent.
  V.network(ctx, 120, 269, 300, V.clamp(t / 2));
  label("A learned vocabulary", 270, 653, 21, C.muted, "center");
  const names = ["HandEmpty", "Holding", "Clear"];
  names.forEach((name, i) => {
    const y = 294 + i * 111;
    ctx.save();
    ctx.globalAlpha = V.ease((t - 0.15 - i * 0.2) / 0.6);
    dot(585, y + 6, 10, V.colors[i]);
    label(name, 614, y + 15, 31, C.ink, "left", 500);
    label(
      ["Is the gripper empty?", "Is an object held?", "Is the surface clear?"][
        i
      ],
      915,
      y + 12,
      22,
      C.muted,
    );
    ctx.restore();
  });
  line(584, 619, 1295, 619);
  label(
    "Visual predicates turn camera observations into facts.",
    584,
    659,
    22,
    C.muted,
  );
}
function stateScene(t, d) {
  base("04 / FROM FACTS TO A STATE", "A state is a set of facts.", 3);
  fit(assets.overhead, 67, 274, 436, 326);
  label("Camera observation", 285, 654, 21, C.muted, "center");
  V.path(
    ctx,
    [
      [540, 432],
      [631, 432],
    ],
    "#a9c3bf",
    2,
    (t * 0.3) % 1,
  );
  const labels = ["Gripper empty", "Toys remain", "Table not yet clean"];
  labels.forEach((s, i) => {
    const y = 354 + i * 80;
    dot(698, y - 7, 7, V.colors[i]);
    label(s, 721, y, 23);
    const p = V.ease((t - 0.6 - i * 0.3) / 1.8);
    dot(V.mix(942, 1170, p), V.mix(y - 7, 425, p), 5, V.colors[i]);
  });
  V.state(ctx, 1190, 425, 78, [1, 1, 1], true);
  label("Current state", 1190, 558, 27, C.ink, "center", 500);
  label("Grounded predicate values", 1190, 596, 17, C.muted, "center");
}
function planScene(t, d) {
  base("05 / SYMBOLIC PLANNING", "Find a path to the goal.", 4);
  pill("Goal: toys stored · table clean", 65, 225, 348);
  V.graph(ctx, 85, 260, 1240, 330, V.ease(t / (d - 1.2)));
  label("pick & place", 388, 651, 20, C.muted, "center");
  label("grasp towel", 751, 651, 20, C.muted, "center");
  label("wipe", 1110, 651, 20, C.muted, "center");
  label(
    "Each node is a state. Edges are possible actions. Highlighted path: an illustrative plan.",
    720,
    704,
    16,
    C.muted,
    "center",
  );
}
function executionLayout() {
  base("06 / REAL ROBOT", "From a plan to physical action.", 5);
  label("TABLE CLEANING", 66, 266, 13, "#719184", "left", 500);
  label("Toys stored.", 65, 315, 29, C.ink, "left", 500);
  label("Table clean.", 65, 354, 29, C.ink, "left", 500);
  [
    ["01", "Clear the toys", "Pick and place into the box."],
    ["02", "Grasp the towel", "Prepare to wipe."],
    ["03", "Wipe the table", "Remove the debris."],
  ].forEach(([n, a, b], i) => {
    const y = 430 + i * 83;
    label(n, 66, y, 13, "#7d9b88");
    label(a, 104, y, 22);
    label(b, 104, y + 27, 16, C.muted);
  });
  label("Observe again after each action.", 66, 707, 16, C.muted);
  // The exporter overlays the complete source at these exact coordinates.
  ctx.fillStyle = "#e9ece7";
  ctx.fillRect(432, 208, 960, 540);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 749, 1440, 61);
  label("COMPLETE RECORDED RUN", 66, 784, 12, C.muted, "left", 500);
  label(
    "Original footage at 3× speed · plan structure shown schematically",
    1375,
    784,
    16,
    C.muted,
    "right",
  );
}
const scenes = {
  opening,
  agent: agentScene,
  demonstration: demonstrationScene,
  feedback: feedbackScene,
  concept: conceptScene,
  state: stateScene,
  plan: planScene,
  action: executionLayout,
};
function render(t) {
  ctx.globalAlpha = 1;
  let i = cues.findIndex(
    (c, j) => t >= c.start && (j === cues.length - 1 || t < cues[j + 1].start),
  );
  if (i < 0) i = 0;
  const cue = cues[i],
    local = t - cue.start;
  scenes[cue.id](local, cue.duration);
  // Subtle editorial dissolve, with no tiled or shrunken end frames.
  if (i > 0 && cue.id !== "action" && local < 0.23) {
    ctx.save();
    ctx.globalAlpha = 1 - V.ease(local / 0.23);
    scenes[cues[i - 1].id](cues[i - 1].duration, cues[i - 1].duration);
    ctx.restore();
  }
}
window.filmReady = (async () => {
  cues = await fetch("../static/audio/overview-timing.json").then((r) =>
    r.json(),
  );
  await Promise.all([
    document.fonts.load('400 24px "DM Sans"'),
    document.fonts.load('500 24px "DM Sans"'),
  ]);
  await Promise.all(
    [
      ["mark", "../static/images/unipred-mark.svg"],
      ["agent", "../static/images/agent.svg"],
      ["overhead", "../static/images/method/observation-top-down.png"],
      ...[0, 1, 2, 3].map((i) => [
        "state" + i,
        `../static/images/method/state-${i}.png`,
      ]),
    ].map(
      ([key, src]) =>
        new Promise((resolve, reject) => {
          let img = new Image();
          img.onload = () => {
            assets[key] = img;
            resolve();
          };
          img.onerror = reject;
          img.src = src;
        }),
    ),
  );
  window.filmIntroDuration = cues.find((c) => c.id === "action").start;
  render(2.5);
  return true;
})();
window.renderFilm = render;
window.renderExecution = executionLayout;
