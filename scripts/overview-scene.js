/* Scientific overview: 40 s explanation, followed by the complete robot video.
   The film export composites the robot stream directly with ffmpeg so no
   browser seek or canvas snapshot can freeze the execution footage. */
"use strict";
const canvas = document.querySelector("#film");
const ctx = canvas.getContext("2d");
const C = {
  bg: "#ffffff",
  ink: "#26323c",
  muted: "#657783",
  line: "#d8e0e6",
  blue: "#3c799c",
  green: "#518871",
  orange: "#cf8a59",
  soft: "#f5f8fa",
};
const assets = {};
const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => {
  v = clamp(v);
  return v * v * (3 - 2 * v);
};
const mix = (a, b, t) => a + (b - a) * t;
function box(x, y, w, h, fill = C.soft, stroke = C.line, r = 8) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
function text(s, x, y, size = 24, color = C.ink, weight = 400, align = "left") {
  ctx.font = `${weight} ${size}px "DM Sans"`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(s, x, y);
  ctx.textAlign = "left";
}
function lines(s, x, y, size = 22, color = C.muted, gap = 32) {
  s.split("\n").forEach((line, i) => text(line, x, y + i * gap, size, color));
}
function line(x1, y1, x2, y2, color = C.line, width = 1) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
function arrow(x1, y1, x2, y2, color = C.blue) {
  line(x1, y1, x2, y2, color, 2);
  const a = Math.atan2(y2 - y1, x2 - x1);
  line(
    x2,
    y2,
    x2 - 10 * Math.cos(a - 0.5),
    y2 - 10 * Math.sin(a - 0.5),
    color,
    2,
  );
  line(
    x2,
    y2,
    x2 - 10 * Math.cos(a + 0.5),
    y2 - 10 * Math.sin(a + 0.5),
    color,
    2,
  );
}
function dot(x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
function imageFit(img, x, y, w, h) {
  const iw = img.naturalWidth,
    ih = img.naturalHeight;
  const s = Math.min(w / iw, h / ih);
  ctx.drawImage(
    img,
    x + (w - iw * s) / 2,
    y + (h - ih * s) / 2,
    iw * s,
    ih * s,
  );
}
function base(section, title, subtitle, compact = false) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, 1440, 810);
  imageFit(assets.mark, 48, 19, 36, 36);
  text("UniPred", 94, 46, 21, C.ink, 500);
  text(
    "IEEE Transactions on Robotics · 2026",
    1390,
    46,
    16,
    C.muted,
    400,
    "right",
  );
  line(48, 67, 1392, 67);
  text(section, 48, 108, 15, C.blue, 500);
  text(title, 48, compact ? 151 : 165, compact ? 38 : 44, C.ink, 500);
  if (subtitle)
    text(subtitle, 48, compact ? 185 : 209, compact ? 19 : 24, C.muted);
}
function footer(s) {
  line(48, 757, 1392, 757);
  text(s, 48, 786, 17, C.muted);
}
function agentPortrait(cx, cy, subtitle) {
  imageFit(assets.mark, cx - 90, cy - 130, 180, 180);
  text("LLM agent", cx, cy + 96, 38, C.blue, 500, "center");
  text(subtitle, cx, cy + 137, 20, C.muted, 400, "center");
}
function sceneAgent(t) {
  base(
    "01 / 04 · AGENT",
    "Start with an LLM agent.",
    "It proposes a concept and how actions change it.",
  );
  agentPortrait(352, 395, "Prior knowledge + learning history");
  ctx.globalAlpha = ease((t - 0.7) / 0.8);
  arrow(572, 426, 705, 426);
  ctx.globalAlpha = ease((t - 1.1) / 0.9);
  text("CANDIDATE CONCEPT", 790, 306, 17, C.muted, 500);
  text("Is the gripper empty?", 790, 368, 39, C.ink, 500);
  text("HandEmpty(robot)", 790, 411, 24, C.muted);
  line(790, 452, 1310, 452);
  text("Pick", 790, 506, 29, C.ink, 500);
  text("→ not empty", 952, 506, 29, C.muted);
  text("Place", 790, 566, 29, C.ink, 500);
  text("→ empty", 952, 566, 29, C.muted);
  ctx.globalAlpha = 1;
  footer(
    "The proposal specifies action effects. Its visual meaning is learned from demonstrations.",
  );
}
function sceneDemonstration(t) {
  base(
    "02 / 04 · DEMONSTRATION",
    "Learn from what changes.",
    "Demonstrated transitions supervise the visual classifier.",
  );
  text("BEFORE", 401, 255, 17, C.muted, 500, "center");
  imageFit(assets.state1, 236, 277, 330, 315);
  text("Empty", 401, 650, 33, C.green, 500, "center");
  text("Pick", 720, 408, 27, C.blue, 500, "center");
  arrow(634, 447, 806, 447);
  ctx.globalAlpha = ease((t - 0.7) / 0.9);
  text("AFTER", 1039, 255, 17, C.muted, 500, "center");
  imageFit(assets.state2, 874, 277, 330, 315);
  text("Not empty", 1039, 650, 33, C.orange, 500, "center");
  ctx.globalAlpha = 1;
  footer(
    "No hand-labeled concept annotations are needed. Real observation crops from the paper.",
  );
}
function scatter(progress, x, y, w, h) {
  const p = ease(progress);
  for (let gx = x + 20; gx < x + w; gx += 32)
    for (let gy = y + 16; gy < y + h; gy += 32) dot(gx, gy, 0.9, "#dbe2e7");
  for (let i = 0; i < 44; i++) {
    const holding = i % 4 === 2,
      a = i * 2.39996,
      r = 15 + ((i * 17) % 77);
    const ix = x + w / 2 + (Math.cos(a) * r * w) / 240;
    const iy = y + h / 2 + (Math.sin(a) * r * h) / 215;
    const fx =
      x + (holding ? w * 0.77 : w * 0.28) + (Math.cos(a) * r * w) / 560;
    dot(mix(ix, fx, p), iy, i % 9 === 0 ? 8 : 6, holding ? C.orange : C.green);
  }
  ctx.globalAlpha = p;
  ctx.setLineDash([6, 9]);
  line(x + w * 0.54, y + 10, x + w * 0.54, y + h - 10, "#8fa3af", 1.5);
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}
function sceneFeedback(t) {
  base(
    "03 / 04 · FEEDBACK",
    "Feedback makes it a loop.",
    "The agent uses learning feedback to revise its next proposal.",
  );
  agentPortrait(
    352,
    365,
    t < 3
      ? "Propose a candidate."
      : t < 6
        ? "Read the learning feedback."
        : "Revise the next proposal.",
  );
  arrow(564, 426, 679, 426);
  text("Neural concept learning", 1020, 265, 24, C.ink, 500, "center");
  scatter(clamp(t / 8), 734, 288, 575, 298);
  dot(915, 622, 6, C.green);
  text("Empty", 932, 629, 21, C.muted);
  dot(1065, 622, 6, C.orange);
  text("Holding", 1082, 629, 21, C.muted);
  line(1020, 650, 1020, 710, C.blue, 2);
  line(1020, 710, 352, 710, C.blue, 2);
  arrow(352, 710, 352, 575);
  const distance = clamp((t - 1) / 7) * 863;
  const x =
    distance < 60 ? 1020 : distance < 728 ? 1020 - (distance - 60) : 352;
  const y =
    distance < 60
      ? 650 + distance
      : distance < 728
        ? 710
        : 710 - (distance - 728);
  dot(x, y, 6, C.blue);
  text("Learning & validation feedback", 688, 691, 22, C.blue, 400, "center");
  footer(
    "Propose → learn → evaluate → revise. Repeat. Feature positions are schematic.",
  );
}
function sceneConcept(t) {
  base(
    "04 / 04 · CONCEPT",
    "A concept the robot can recognize.",
    "From a symbolic proposal to a visual predicate.",
  );
  text("HandEmpty(robot)", 720, 277, 34, C.blue, 500, "center");
  for (let i = 0; i < 4; i++) {
    const x = 95 + i * 320;
    imageFit(assets["state" + i], x, 320, 290, 255);
    text("State " + i, x + 145, 618, 17, C.muted, 400, "center");
    ctx.globalAlpha = ease((t - 0.4 - i * 0.28) / 0.7);
    text(
      i === 2 ? "False" : "True",
      x + 145,
      663,
      31,
      i === 2 ? C.orange : C.green,
      500,
      "center",
    );
    ctx.globalAlpha = 1;
  }
  footer(
    "Learned predicates provide facts for a planner. The outputs shown here illustrate the concept.",
  );
}
const scenePainters = [
  sceneAgent,
  sceneDemonstration,
  sceneFeedback,
  sceneConcept,
];
const sceneHolds = [7, 7, 9, 7];
const sceneStarts = [0, 8, 16, 26];
const sceneFrames = [];
const activeFrame = document.createElement("canvas");
activeFrame.width = 1344;
activeFrame.height = 640;
function captureScene(target) {
  target.getContext("2d").drawImage(canvas, 48, 86, 1344, 640, 0, 0, 1344, 640);
}
function compositionBase() {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, 1440, 810);
  imageFit(assets.mark, 48, 19, 36, 36);
  text("UniPred", 94, 46, 21, C.ink, 500);
  text(
    "IEEE Transactions on Robotics · 2026",
    1390,
    46,
    16,
    C.muted,
    400,
    "right",
  );
  line(48, 67, 1392, 67);
  text(
    "Concept learning with an agent in the loop",
    720,
    108,
    30,
    C.ink,
    500,
    "center",
  );
  text(
    "Illustrative concepts, feature positions, and predicate outputs.",
    720,
    799,
    14,
    C.muted,
    400,
    "center",
  );
}
function paintFrame(frame, x, y, width, alpha = 1) {
  const height = (width * 640) / 1344;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(frame, x + 12, y + 6, width - 24, height - 12);
  box(x, y, width, height, "rgba(255,255,255,0)", C.line, 6);
  ctx.restore();
}
function sceneAssembly(t) {
  let phase = 4;
  for (let i = 0; i < 4; i++) {
    if (t < sceneStarts[i] + sceneHolds[i] + 1) {
      phase = i;
      break;
    }
  }
  let local = 0;
  if (phase < 4) {
    local = t - sceneStarts[phase];
    scenePainters[phase](Math.min(local, sceneHolds[phase]));
    captureScene(activeFrame);
  }
  compositionBase();
  const positions = [
    { x: 40, y: 132 },
    { x: 754, y: 132 },
    { x: 40, y: 466 },
    { x: 754, y: 466 },
  ];
  for (let i = 0; i < phase; i++)
    paintFrame(
      sceneFrames[i],
      positions[i].x,
      positions[i].y,
      646,
      phase === 4 ? 1 : 0.25,
    );
  if (phase < 4) {
    const p = ease(clamp(local - sceneHolds[phase]));
    const pos = positions[phase];
    paintFrame(
      activeFrame,
      mix(100, pos.x, p),
      mix(162, pos.y, p),
      mix(1240, 646, p),
    );
  } else {
    arrow(697, 285, 739, 285);
    arrow(738, 447, 701, 460);
    arrow(350, 462, 350, 445);
    text("revise", 369, 459, 13, C.blue);
    arrow(697, 620, 739, 620);
  }
}
function executionLayout() {
  base(
    "REAL ROBOT: COMPLETE DEMONSTRATION",
    "Table cleaning with three toys",
    "The full recorded run is shown below, including the robot’s pauses between actions.",
    true,
  );
  text("Goal", 48, 249, 24, C.ink, 500);
  lines(
    "Store all toys in the box.\nClean the tabletop.",
    48,
    285,
    20,
    C.muted,
    31,
  );
  line(48, 334, 400, 334);
  text("Plan structure", 48, 377, 24, C.ink, 500);
  [
    ["1", "Clear every toy", "Pick and place into the box."],
    ["2", "Grasp the towel", "Prepare the wiping skill."],
    ["3", "Wipe the table", "Remove the remaining debris."],
  ].forEach(([n, title, desc], i) => {
    let y = 429 + i * 89;
    dot(62, y - 5, 13, "#e6eff5");
    text(n, 62, y, 13, C.blue, 500, "center");
    text(title, 88, y, 20, C.ink, 500);
    text(desc, 88, y + 29, 15, C.muted);
  });
  box(432, 208, 960, 540, "#f0f2f4");
  footer(
    "Complete 46-second source clip · original footage at 3× speed · plan structure is explanatory, not an execution log.",
  );
}
async function render(t) {
  ctx.globalAlpha = 1;
  if (t < 40) sceneAssembly(t);
  else executionLayout();
}
window.filmReady = (async () => {
  await Promise.all([
    document.fonts.load('400 24px "DM Sans"'),
    document.fonts.load('500 24px "DM Sans"'),
  ]);
  await Promise.all(
    [
      ["mark", "../static/images/unipred-mark.svg"],
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
  scenePainters.forEach((paint, i) => {
    paint(sceneHolds[i]);
    const frame = document.createElement("canvas");
    frame.width = 1344;
    frame.height = 640;
    captureScene(frame);
    sceneFrames.push(frame);
  });
  await render(3);
  return true;
})();
window.renderFilm = render;
window.renderExecution = executionLayout;
