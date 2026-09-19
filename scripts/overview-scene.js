/* Scientific overview: 26 s explanation, followed by the complete robot video.
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
function base(section, title, subtitle) {
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
  text(section, 48, 104, 13, C.blue, 500);
  text(title, 48, 151, 38, C.ink, 500);
  if (subtitle) text(subtitle, 48, 185, 19, C.muted);
}
function footer(s) {
  line(48, 757, 1392, 757);
  text(s, 48, 785, 14, C.muted);
}
function sceneObserve(t) {
  base(
    "AGENTIC CONCEPT LEARNING → LONG-HORIZON MANIPULATION",
    "Table cleaning as a long-horizon task",
    "Goal: put every toy in the box and wipe away the tabletop debris.",
  );
  box(48, 219, 556, 469, "#fafbfc");
  imageFit(assets.overhead, 64, 232, 524, 393);
  text(
    "Actual top-down camera observation",
    326,
    665,
    18,
    C.muted,
    400,
    "center",
  );
  arrow(620, 443, 677, 443);
  text("Learned predicates describe the state", 714, 251, 26, C.ink, 500);
  [
    ["HandEmpty(robot)", "Is the gripper empty?"],
    ["OnTable(toy, table)", "Which toys still need to be cleared?"],
    ["Clean(table)", "Has wiping achieved the goal?"],
  ].forEach(([code, desc], i) => {
    const y = 289 + i * 114;
    ctx.globalAlpha = ease((t - i * 0.45) / 0.8);
    box(713, y, 677, 88, "#f5f8fa");
    text(code, 735, y + 33, 25, C.blue, 500);
    text(desc, 735, y + 65, 19, C.muted);
    ctx.globalAlpha = 1;
  });
  footer(
    "Learn concepts from human demonstrations, then use them to plan. Predicate names are illustrative.",
  );
}
function scatter(t, x, y, w, h) {
  const p = ease((t - 2.5) / 7);
  for (let gx = x + 20; gx < x + w; gx += 28)
    for (let gy = y + 16; gy < y + h; gy += 28) dot(gx, gy, 0.8, "#dbe2e7");
  for (let i = 0; i < 44; i++) {
    const holding = i % 4 === 2,
      a = i * 2.39996,
      r = 15 + ((i * 17) % 77);
    const ix = x + w / 2 + Math.cos(a) * r * 1.9,
      iy = y + h / 2 + Math.sin(a) * r * (h / 180);
    const fx = x + (holding ? w * 0.77 : w * 0.28) + Math.cos(a) * r * 0.65,
      fy = y + h / 2 + Math.sin(a) * r * (h / 180);
    dot(
      mix(ix, fx, p),
      mix(iy, fy, p),
      i % 9 === 0 ? 6 : 4.5,
      holding ? C.orange : C.green,
    );
  }
  ctx.globalAlpha = p;
  ctx.setLineDash([5, 7]);
  line(x + w * 0.54, y + 10, x + w * 0.54, y + h - 10, "#8fa3af", 1);
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}
function sceneLearn(t) {
  base(
    "TRAINING: AGENT IN THE LOOP · UNIFIED BILEVEL LEARNING",
    "An agent in the loop: propose, learn, revise.",
    "The LLM proposes predicate effects. Demonstrations train the classifiers. Learning feedback guides the next proposal.",
  );
  const names = ["Empty", "Empty", "Holding towel", "Empty"];
  for (let i = 0; i < 4; i++) {
    const x = 176 + i * 283;
    box(x, 214, 232, 177, "#fafbfc");
    imageFit(assets["state" + i], x + 8, 222, 216, 132);
    text(
      "State " + i + " · " + names[i],
      x + 116,
      377,
      16,
      i === 2 ? C.orange : C.muted,
      400,
      "center",
    );
  }
  const stage = t < 4.5 ? 0 : t < 9 ? 1 : 2;
  box(48, 421, 370, 275, stage === 1 ? "#f7f9fb" : "#edf5f9", C.blue);
  dot(78, 450, 14, "#d9eaf3");
  text("↻", 78, 458, 25, C.blue, 400, "center");
  text("1  LLM agent", 103, 458, 23, C.blue, 500);
  text("Partial PDDL + exploration history", 70, 485, 16, C.muted);
  text("Example: HandEmpty(robot)", 70, 521, 18, C.blue);
  [
    ["Pick", "−1  delete"],
    ["Place", "+1  add"],
    ["Unaffected action", "0  unchanged"],
  ].forEach(([a, b], i) => {
    const y = 558 + i * 35;
    line(70, y - 23, 395, y - 23);
    text(a, 70, y, 17, C.muted);
    text(b, 394, y, 17, C.ink, 400, "right");
  });
  dot(74, 670, 3, C.blue);
  text(
    [
      "Propose a candidate effect vector",
      "Candidate evaluated through learning",
      "Read feedback; revise the proposal",
    ][stage],
    87,
    676,
    15,
    C.blue,
    500,
  );
  arrow(432, 546, 469, 546);
  box(483, 421, 388, 275, "#f7f9fb");
  text("2  Neural learning", 505, 458, 22, C.ink, 500);
  text("Effect-based transition supervision", 505, 485, 16, C.muted);
  text("Before     — Pick →     After", 505, 528, 20, C.blue);
  text("empty                    not empty", 505, 562, 19, C.muted);
  lines(
    "Changed atoms follow add/delete effects.\nUnaffected atoms stay consistent.",
    505,
    604,
    17,
    C.muted,
    26,
  );
  text("Object crops → DINOv3 → MLP", 505, 665, 18, C.blue);
  arrow(885, 546, 917, 546);
  box(932, 421, 460, 275, "#fcfdfd");
  text("3  Evaluate the candidate", 954, 458, 22, C.ink, 500);
  text("Training and validation feedback", 954, 485, 16, C.muted);
  scatter(t, 945, 505, 432, 140);
  dot(963, 673, 4, C.green);
  text("Empty", 974, 678, 14, C.muted);
  dot(1053, 673, 4, C.orange);
  text("Holding", 1064, 678, 14, C.muted);
  text("Schematic", 1370, 678, 12, C.muted, 400, "right");
  line(1170, 705, 1170, 741, C.blue, 2);
  line(1170, 741, 231, 741, C.blue, 2);
  arrow(231, 741, 231, 705);
  // The return path makes the LLM's use of feedback explicit. It is an
  // explanatory animation, not a recorded optimization trace.
  if (stage === 2) {
    const progress = clamp((t - 9) / 4.3);
    const distance = progress * 1011;
    const x =
      distance < 36 ? 1170 : distance < 975 ? 1170 - (distance - 36) : 231;
    const y =
      distance < 36
        ? 705 + distance
        : distance < 975
          ? 741
          : 741 - (distance - 975);
    dot(x, y, 5, C.blue);
  }
  text(
    "Learning feedback → agent history → revised proposal",
    701,
    729,
    17,
    C.blue,
    400,
    "center",
  );
  footer(
    "Human demonstrations provide transition supervision. No ground-truth atom labels are required. Feature positions are schematic.",
  );
}
function scenePlanning(t) {
  base(
    "INFERENCE: CONSTRUCT A VALID PLAN",
    "Why clear the toys before wiping?",
    "The planner combines the goal, the current ground atoms, and learned operator preconditions.",
  );
  imageFit(assets.overhead, 48, 220, 330, 248);
  text("Top-down RGB observation", 213, 494, 16, C.muted, 400, "center");
  arrow(390, 339, 435, 339);
  box(452, 236, 403, 227);
  text("Grounded symbolic state", 474, 275, 23, C.ink, 500);
  text("HandEmpty(robot)", 474, 321, 20, C.blue);
  text("OnTable(toy₁, table)", 474, 360, 20, C.blue);
  text("OnTable(toy₂, table)", 474, 399, 20, C.blue);
  text("…", 474, 437, 20, C.muted);
  arrow(869, 339, 909, 339);
  box(928, 236, 464, 227);
  text("Goal + preconditions", 951, 275, 23, C.ink, 500);
  lines(
    "Goal: toys stored and table clean.\nWipe requires all toys to be cleared.\nThe towel must be grasped first.",
    951,
    322,
    20,
    C.muted,
    45,
  );
  const names = ["Clear toys", "Grasp towel", "Wipe table"];
  for (let i = 0; i < 3; i++) {
    let x = 229 + i * 353;
    box(
      x,
      550,
      299,
      88,
      i === Math.min(2, Math.floor(t / 2)) ? "#eaf2f7" : "#f7f9fb",
    );
    text(names[i], x + 149, 602, 27, C.ink, 500, "center");
    if (i < 2) arrow(x + 310, 594, x + 339, 594);
  }
  text(
    "A simplified skill sequence; the full real-robot run follows.",
    720,
    697,
    20,
    C.muted,
    400,
    "center",
  );
  footer(
    "After each controller: re-observe → update atoms → replan when needed.",
  );
}
function executionLayout() {
  base(
    "REAL ROBOT: COMPLETE DEMONSTRATION",
    "Table cleaning with three toys",
    "The full recorded run is shown below, including the robot’s pauses between actions.",
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
  if (t < 6) sceneObserve(t);
  else if (t < 20) sceneLearn(t - 6);
  else if (t < 26) scenePlanning(t - 20);
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
  await render(3);
  return true;
})();
window.renderFilm = render;
window.renderExecution = executionLayout;
