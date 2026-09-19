/* Deterministic, editable 28 s scientific explainer. See WEBSITE.md for export. */
"use strict";
const canvas = document.querySelector("#film");
const ctx = canvas.getContext("2d");
const robot = document.querySelector("#robot");
const W = 1440,
  H = 810;
const C = {
  bg: "#102b29",
  card: "#1a3731",
  grid: "#314c40",
  text: "#edf1df",
  muted: "#a3bca8",
  green: "#c8dda3",
  orange: "#ed9a71",
  line: "#43604e",
  pale: "#f2f1e6",
};
const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => {
  v = clamp(v);
  return v * v * (3 - 2 * v);
};
const lerp = (a, b, t) => a + (b - a) * t;
const assets = {};
function round(x, y, w, h, r = 14, fill = C.card, stroke = null) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
function txt(
  text,
  x,
  y,
  size = 24,
  color = C.text,
  weight = 400,
  font = "Manrope",
  align = "left",
) {
  ctx.font = `${weight} ${size}px "${font}"`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.textAlign = "left";
}
function lines(
  text,
  x,
  y,
  size = 24,
  color = C.muted,
  lineHeight = 35,
  weight = 400,
) {
  text
    .split("\n")
    .forEach((s, i) =>
      txt(s, x, y + i * lineHeight, size, color, weight, "DM Sans"),
    );
}
function label(text, x, y, color = C.muted) {
  ctx.save();
  ctx.letterSpacing = "2px";
  txt(text, x, y, 12, color, 500, "DM Sans");
  ctx.restore();
}
function arrow(x1, y1, x2, y2, color = C.green, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  let a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2 - 9 * Math.cos(a - 0.5), y2 - 9 * Math.sin(a - 0.5));
  ctx.lineTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(a + 0.5), y2 - 9 * Math.sin(a + 0.5));
  ctx.stroke();
}
function circle(x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
function photo(img, x, y, w, h, r = 10) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();
  const iw = img.videoWidth || img.naturalWidth,
    ih = img.videoHeight || img.naturalHeight;
  let s = Math.max(w / iw, h / ih);
  ctx.drawImage(
    img,
    x + (w - iw * s) / 2,
    y + (h - ih * s) / 2,
    iw * s,
    ih * s,
  );
  ctx.restore();
}
function chip(text, x, y, w, color = C.green) {
  round(x, y, w, 36, 18, color);
  txt(text, x + w / 2, y + 24, 13, C.bg, 600, "Manrope", "center");
}
function base(t) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  for (let x = 25; x < W; x += 32)
    for (let y = 26; y < H; y += 32) circle(x, y, 0.6, "#264239");
  label("UNIPRED / A VISUAL INTRODUCTION", 72, 57, C.green);
  txt(
    "Learning a world model for long-horizon action",
    1368,
    57,
    13,
    C.muted,
    400,
    "DM Sans",
    "right",
  );
  ctx.strokeStyle = "#355045";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(72, 84);
  ctx.lineTo(1368, 84);
  ctx.stroke();
  const names = [
    "THE MISSING LAYER",
    "PROPOSE & LEARN",
    "REFINE WITH FEEDBACK",
    "PLAN & ACT",
  ];
  names.forEach((name, i) => {
    let x = 72 + i * 331;
    round(x, 735, 307, 2, 1, "#385345");
    round(x, 735, 307 * clamp((t - i * 7) / 7), 2, 1, C.green);
    label(
      `0${i + 1}  ${name}`,
      x,
      768,
      i === Math.floor(t / 7) ? C.green : "#789780",
    );
  });
}
function heading(title, subtitle) {
  txt(title, 72, 161, 49, C.text, 600);
  txt(subtitle, 74, 205, 20, C.muted, 400, "DM Sans");
}
function sceneIntro(t) {
  heading(
    "From pixels to predicates to plans.",
    "A robot needs concepts that explain the world — and what its actions will change.",
  );
  const a = ease(t / 1.2);
  ctx.globalAlpha = a;
  label("01 / OBSERVE", 91, 267);
  round(72, 287, 401, 340);
  photo(assets.table, 91, 321, 363, 204);
  txt("Objects, appearances, geometry.", 93, 583, 17, C.muted, 400, "DM Sans");
  ctx.globalAlpha = 1;
  ctx.globalAlpha = ease((t - 0.6) / 1.2);
  label("02 / UNDERSTAND", 559, 267);
  round(540, 287, 351, 340);
  label("LEARNED PREDICATES", 563, 327, C.green);
  [
    ["HandEmpty(robot)", true],
    ["OnTable(toy)", true],
    ["InBox(toy, box)", false],
  ].forEach(([s, v], i) => {
    round(561, 355 + i * 70, 309, 52, 8, "#254336");
    circle(583, 381 + i * 70, 4.5, v ? C.green : "#6e8876");
    txt(s, 600, 387 + i * 70, 17, v ? C.text : C.muted, 400, "DM Sans");
  });
  txt("A symbolic view of the scene.", 562, 600, 16, C.muted, 400, "DM Sans");
  ctx.globalAlpha = 1;
  ctx.globalAlpha = ease((t - 1.2) / 1.2);
  label("03 / ACT", 978, 267);
  round(958, 287, 410, 340);
  ["Pick the toy", "Place it in the box", "Wipe the table"].forEach((s, i) => {
    circle(
      991,
      343 + i * 90,
      14,
      i === Math.floor(t * 0.65) % 3 ? C.orange : "#3e5944",
    );
    txt(
      `0${i + 1}`,
      991,
      348 + i * 90,
      10,
      i === Math.floor(t * 0.65) % 3 ? C.bg : C.text,
      600,
      "Manrope",
      "center",
    );
    txt(s, 1021, 350 + i * 90, 19, C.text, 400);
    if (i < 2) arrow(991, 363 + i * 90, 991, 406 + i * 90, "#57734f", 1.5);
  });
  ctx.globalAlpha = 1;
  arrow(487, 451, 525, 451);
  arrow(905, 451, 943, 451);
  chip("THE BRIDGE: A LEARNED NEURAL–SYMBOLIC WORLD MODEL", 398, 661, 644);
}
function scenePropose(t) {
  heading(
    "Start with a hypothesis.",
    "Language supplies a prior. Robot experience supplies the evidence.",
  );
  round(72, 265, 361, 398);
  label("FOUNDATION-MODEL PRIOR", 98, 305, C.green);
  txt("✧", 103, 369, 58, C.orange);
  txt("LLM", 175, 365, 37, C.text, 600);
  lines(
    "What should change\nafter a successful pick?",
    99,
    420,
    24,
    C.text,
    35,
  );
  round(97, 487, 312, 115, 9, "#294737");
  label("EFFECT HYPOTHESIS", 117, 516);
  txt("Holding(robot, object)", 117, 552, 20, C.green, 400, "DM Sans");
  txt("becomes true after Pick.", 117, 582, 17, C.muted, 400, "DM Sans");
  arrow(448, 461, 510, 461);
  round(528, 265, 840, 398);
  label("DEMONSTRATION TRANSITIONS", 556, 305, C.green);
  txt("Ground a hypothesis in observed states.", 556, 351, 27, C.text, 600);
  const names = ["Empty", "Empty", "Holding towel", "Empty"];
  for (let i = 0; i < 4; i++) {
    const x = 556 + i * 198;
    ctx.globalAlpha = ease((t - i * 0.23) / 0.8);
    photo(assets["state" + i], x, 382, 173, 148);
    label("STATE " + i, x, 556);
    txt(names[i], x, 585, 15, i === 2 ? C.orange : C.muted, 400);
    ctx.globalAlpha = 1;
  }
  txt(
    "Effect hypotheses → pseudo-labels → neural predicate classifiers",
    556,
    638,
    16,
    C.muted,
    400,
    "DM Sans",
  );
}
function scatter(t) {
  round(673, 265, 695, 398);
  label("VISUAL FEATURE SPACE", 700, 302, C.green);
  txt("Holding or empty?", 700, 341, 24, C.text, 600);
  let p = ease((t - 0.7) / 4.6);
  for (let x = 700; x < 1346; x += 24)
    for (let y = 363; y < 617; y += 24) circle(x, y, 0.7, "#405d4c");
  for (let i = 0; i < 52; i++) {
    let holding = i % 4 === 2,
      a = i * 2.39996,
      r = 20 + ((i * 17) % 91);
    let ix = 1020 + Math.cos(a) * r * 2.4,
      iy = 479 + Math.sin(a) * r;
    let fx = (holding ? 1202 : 857) + Math.cos(a) * r * 0.95,
      fy = 479 + Math.sin(a) * r;
    circle(
      lerp(ix, fx, p),
      lerp(iy, fy, p),
      i % 9 === 0 ? 7 : 5,
      holding ? C.orange : C.green,
    );
  }
  ctx.globalAlpha = p;
  ctx.strokeStyle = "#8fa989";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 9]);
  ctx.beginPath();
  ctx.moveTo(1032, 370);
  ctx.bezierCurveTo(1000, 452, 1055, 520, 1034, 594);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  circle(716, 636, 4, C.green);
  txt("Empty gripper", 729, 641, 13, C.muted, 400, "DM Sans");
  circle(863, 636, 4, C.orange);
  txt("Holding towel", 876, 641, 13, C.muted, 400, "DM Sans");
  txt(
    "Schematic illustration",
    1342,
    641,
    12,
    C.muted,
    400,
    "DM Sans",
    "right",
  );
}
function sceneRefine(t) {
  heading(
    "Let experience refine the concept.",
    "The inner loop learns visual predicates. The outer loop improves the hypotheses.",
  );
  round(72, 265, 565, 398);
  round(100, 302, 215, 80, 10, "#2b4533");
  txt("LLM hypotheses", 207, 349, 20, C.text, 600, "Manrope", "center");
  round(374, 302, 235, 80, 10, "#2b4533");
  txt("Neural classifiers", 492, 349, 20, C.text, 600, "Manrope", "center");
  arrow(325, 342, 363, 342, C.green);
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(492, 390);
  ctx.lineTo(492, 431);
  ctx.lineTo(207, 431);
  ctx.lineTo(207, 393);
  ctx.stroke();
  arrow(207, 412, 207, 393, C.orange);
  const f = (t * 0.2) % 1;
  circle(lerp(492, 207, f), 431, 5, C.orange);
  txt(
    "Training + validation feedback",
    350,
    466,
    15,
    C.orange,
    400,
    "DM Sans",
    "center",
  );
  for (let i = 0; i < 4; i++) {
    const x = 100 + i * 131;
    photo(assets["state" + i], x, 490, 112, 104, 8);
    txt(
      i === 2 ? "Holding" : "Empty",
      x + 56,
      621,
      13,
      i === 2 ? C.orange : C.muted,
      400,
      "DM Sans",
      "center",
    );
  }
  scatter(t);
}
function scenePlan(t) {
  heading(
    "Now the robot can plan.",
    "At test time: ground the scene, compose existing skills, and observe the result.",
  );
  round(72, 265, 565, 398);
  label("ILLUSTRATIVE SYMBOLIC STATE", 98, 305, C.green);
  ["OnTable(toy)", "HandEmpty(robot)"].forEach((s, i) => {
    round(98, 330 + i * 54, 510, 43, 7, "#254336");
    txt("✓", 118, 359 + i * 54, 19, C.green);
    txt(s, 155, 359 + i * 54, 20, C.text, 400, "DM Sans");
  });
  label("ILLUSTRATIVE SKILL SEQUENCE", 98, 477, C.green);
  ["Pick", "Place", "Wipe"].forEach((s, i) => {
    let x = 98 + i * 178;
    round(x, 495, 151, 61, 8, i === Math.floor(t / 2.33) ? C.green : "#294638");
    txt(
      s,
      x + 75,
      534,
      21,
      i === Math.floor(t / 2.33) ? C.bg : C.text,
      600,
      "Manrope",
      "center",
    );
    if (i < 2) arrow(x + 157, 526, x + 173, 526, "#6e905e", 1.5);
  });
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(118, 574);
  ctx.lineTo(118, 601);
  ctx.lineTo(588, 601);
  ctx.lineTo(588, 574);
  ctx.stroke();
  txt(
    "Re-observe after every controller. Replan if needed.",
    354,
    637,
    16,
    C.muted,
    400,
    "DM Sans",
    "center",
  );
  photo(robot, 673, 265, 695, 391, 12);
  round(687, 281, 208, 31, 4, "#102b29dd");
  txt("REAL ROBOT · TABLE CLEAN", 701, 302, 11, C.text, 500, "DM Sans");
}
async function render(t) {
  t = Math.max(0, Math.min(27.999, t));
  if (t >= 21) {
    let target = 12 + t - 21;
    if (Math.abs(robot.currentTime - target) > 0.015) {
      await new Promise((resolve) => {
        robot.addEventListener("seeked", resolve, { once: true });
        robot.currentTime = target;
      });
    }
  }
  ctx.globalAlpha = 1;
  base(t);
  const scene = Math.floor(t / 7),
    local = t % 7;
  [sceneIntro, scenePropose, sceneRefine, scenePlan][scene](local);
  const boundary = Math.min(local, 7 - local);
  if (boundary < 0.24) {
    ctx.fillStyle = C.bg;
    ctx.globalAlpha = 1 - ease(boundary / 0.24);
    ctx.fillRect(0, 96, W, 620);
    ctx.globalAlpha = 1;
  }
}
window.filmReady = (async () => {
  await Promise.all([
    document.fonts.load("600 49px Manrope"),
    document.fonts.load('400 24px "DM Sans"'),
    document.fonts.load('500 12px "DM Sans"'),
  ]);
  await Promise.all(
    [
      ["table", "../static/images/posters/main_demo_1.jpg"],
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
  if (robot.readyState < 2)
    await new Promise((resolve) =>
      robot.addEventListener("loadeddata", resolve, { once: true }),
    );
  await render(3);
  return true;
})();
window.renderFilm = render;
