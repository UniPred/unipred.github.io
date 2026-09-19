/* Shared vector language for the film and compact website explanation.
   All networks, feature motion, and plans are schematic, not measured traces. */
"use strict";
window.UniPredVisuals = (() => {
  const colors = [
    "#45a6bb",
    "#c97a65",
    "#79966b",
    "#9584ac",
    "#d2ab59",
    "#648da6",
    "#677580",
  ];
  const ink = "#26343c",
    muted = "#7b8589",
    line = "#d8dedc";
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const ease = (v) => {
    v = clamp(v);
    return v * v * (3 - 2 * v);
  };
  const mix = (a, b, t) => a + (b - a) * t;
  function label(
    c,
    s,
    x,
    y,
    size = 18,
    color = ink,
    align = "center",
    weight = 400,
  ) {
    c.font = `${weight} ${size}px "DM Sans", sans-serif`;
    c.fillStyle = color;
    c.textAlign = align;
    c.fillText(s, x, y);
  }
  function dot(c, x, y, r, color) {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
  }
  function path(c, points, color = line, width = 1.5, progress = 1) {
    c.beginPath();
    c.moveTo(...points[0]);
    for (let i = 1; i < points.length; i++) c.lineTo(...points[i]);
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = "round";
    c.stroke();
    if (progress >= 0 && progress < 1) {
      let lengths = points
        .slice(1)
        .map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
      let d = lengths.reduce((a, b) => a + b, 0) * progress;
      for (let i = 0; i < lengths.length; i++) {
        if (d <= lengths[i]) {
          dot(
            c,
            mix(points[i][0], points[i + 1][0], d / lengths[i]),
            mix(points[i][1], points[i + 1][1], d / lengths[i]),
            4,
            color,
          );
          break;
        }
        d -= lengths[i];
      }
    }
  }
  function fit(c, img, x, y, w, h) {
    const iw = img.videoWidth || img.naturalWidth,
      ih = img.videoHeight || img.naturalHeight;
    if (!iw || !ih) return;
    const s = Math.min(w / iw, h / ih);
    c.drawImage(
      img,
      x + (w - iw * s) / 2,
      y + (h - ih * s) / 2,
      iw * s,
      ih * s,
    );
  }
  const logoPoints = [
    [12, 12],
    [51, 10],
    [62, 33],
    [19, 60],
    [7, 38],
    [28, 25],
    [47, 49],
  ];
  const logoColors = [
    "#648da6",
    "#9584ac",
    "#d2ab59",
    "#79966b",
    "#9584ac",
    "#45a6bb",
    "#c97a65",
  ];
  const logoEdges = [
    [0, 5],
    [0, 4],
    [1, 5],
    [1, 2],
    [1, 6],
    [2, 6],
    [3, 4],
    [3, 5],
    [3, 6],
    [4, 5],
    [5, 6],
  ];
  function network(c, x, y, size, t = 1, dark = false) {
    const p = ease(t),
      scale = size / 72;
    const nodes = logoPoints.map(([a, b], i) => [
      x + mix(36 + Math.cos(i * 2.4) * 55, a, p) * scale,
      y + mix(36 + Math.sin(i * 2.4) * 48, b, p) * scale,
    ]);
    c.save();
    c.globalAlpha *= 0.2 + 0.8 * p;
    logoEdges.forEach(([a, b], i) => {
      c.save();
      c.globalAlpha *= ease((t - 0.15 - i * 0.018) * 2);
      path(c, [nodes[a], nodes[b]], dark ? "#53636b" : line, 0.55 * scale);
      c.restore();
    });
    nodes.forEach(([a, b], i) =>
      dot(
        c,
        a,
        b,
        (i === 5 ? 6.5 : i === 6 ? 5.2 : 3.7) * scale,
        logoColors[i],
      ),
    );
    c.restore();
  }
  function agent(c, img, x, y, size, t = 0) {
    fit(c, img, x, y + Math.sin(t * 1.5) * 2, size, size);
  }
  function scatter(c, x, y, w, h, p, t = 0) {
    for (let i = 0; i < 48; i++) {
      const group = i % 3 === 0,
        a = i * 2.39996,
        r = 14 + ((i * 17) % 77);
      const ix = x + w * 0.5 + (Math.cos(a) * r * w) / 210,
        iy = y + h * 0.5 + (Math.sin(a) * r * h) / 190;
      const fx =
        x + (group ? w * 0.76 : w * 0.24) + (Math.cos(a) * r * w) / 600;
      dot(
        c,
        mix(ix, fx, ease(p)),
        iy + Math.sin(t * 2 + i) * 1.5,
        i % 9 === 0 ? 4.5 : 3,
        group ? colors[1] : colors[2],
      );
    }
    c.save();
    c.globalAlpha *= ease(p);
    c.setLineDash([3, 7]);
    path(
      c,
      [
        [x + w * 0.53, y + 8],
        [x + w * 0.53, y + h - 8],
      ],
      "#a0aaa7",
      1,
    );
    c.restore();
  }
  function state(c, x, y, r, bits, active = false) {
    dot(c, x, y, r, active ? "#e8f0ec" : "#fafaf8");
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.strokeStyle = active ? "#719788" : line;
    c.lineWidth = active ? 2.5 : 1.3;
    c.stroke();
    bits.forEach((v, i) => {
      let px = x + (i - 1) * r * 0.47;
      dot(c, px, y, r * 0.13, v ? colors[i] : "#e1e4e1");
    });
  }
  const statePoints = [
    [0.06, 0.55],
    [0.3, 0.24],
    [0.3, 0.79],
    [0.57, 0.2],
    [0.57, 0.58],
    [0.57, 0.94],
    [0.92, 0.48],
  ];
  const stateEdges = [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 4],
    [2, 5],
    [3, 6],
    [4, 6],
    [5, 6],
  ];
  const route = [0, 1, 4, 6];
  function graph(c, x, y, w, h, progress = 0) {
    const ps = statePoints.map(([a, b]) => [x + a * w, y + b * h]);
    stateEdges.forEach(([a, b]) => path(c, [ps[a], ps[b]], line, 1.5));
    const advance = clamp(progress) * 3;
    for (let i = 0; i < 3; i++) {
      const a = ps[route[i]],
        b = ps[route[i + 1]],
        p = clamp(advance - i);
      if (p > 0)
        path(c, [a, [mix(a[0], b[0], p), mix(a[1], b[1], p)]], "#638b78", 3);
    }
    ps.forEach(([a, b], i) =>
      state(
        c,
        a,
        b,
        Math.min(42, w * 0.067),
        [i < 2, i > 2, i === 6],
        route.indexOf(i) >= 0 && route.indexOf(i) <= advance,
      ),
    );
    label(
      c,
      "Current",
      ps[0][0],
      ps[0][1] + Math.min(42, w * 0.067) + 24,
      15,
      muted,
    );
    label(
      c,
      "Goal",
      ps[6][0],
      ps[6][1] + Math.min(42, w * 0.067) + 24,
      15,
      muted,
    );
    return ps;
  }
  return {
    colors,
    ink,
    muted,
    line,
    clamp,
    ease,
    mix,
    label,
    dot,
    path,
    fit,
    network,
    agent,
    scatter,
    state,
    graph,
  };
})();
