// Usage: NODE_PATH=/path/to/node_modules node scripts/render-overview.cjs
// A static server must be serving the repository at OVERVIEW_ORIGIN (default :8007).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { once } = require("node:events");
(async () => {
  const root = path.resolve(__dirname, "..");
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 810 },
      deviceScaleFactor: 1,
    });
    await page.goto(
      (process.env.OVERVIEW_ORIGIN || "http://127.0.0.1:8007") +
        "/scripts/render-overview.html",
    );
    await page.evaluate(() => window.filmReady);
    // Preview keyframes before encoding, or export the entire deterministic film.
    if (process.argv.includes("--preview")) {
      fs.mkdirSync("/tmp/unipred-site-review/film", { recursive: true });
      for (const [label, time] of [
        ["intro", 3],
        ["propose", 10],
        ["refine", 19],
        ["plan", 24],
      ]) {
        await page.evaluate((t) => window.renderFilm(t), time);
        await page
          .locator("canvas")
          .screenshot({ path: `/tmp/unipred-site-review/film/${label}.png` });
      }
      return;
    }
    const ffmpeg = spawn(
      process.env.FFMPEG_PATH || "ffmpeg",
      [
        "-hide_banner",
        "-loglevel",
        "warning",
        "-y",
        "-f",
        "image2pipe",
        "-vcodec",
        "mjpeg",
        "-framerate",
        "24",
        "-i",
        "pipe:0",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-crf",
        "20",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        path.join(root, "static/videos/unipred-overview.mp4"),
      ],
      { stdio: ["pipe", "inherit", "inherit"] },
    );
    const exited = once(ffmpeg, "exit");
    for (let frame = 0; frame < 28 * 24; frame++) {
      const data = await page.evaluate(async (t) => {
        await window.renderFilm(t);
        return document
          .querySelector("canvas")
          .toDataURL("image/jpeg", 0.95)
          .split(",")[1];
      }, frame / 24);
      if (!ffmpeg.stdin.write(Buffer.from(data, "base64")))
        await once(ffmpeg.stdin, "drain");
      if (frame % 96 === 0) console.log(`Rendered ${frame}/672 frames`);
    }
    ffmpeg.stdin.end();
    const [code] = await exited;
    if (code !== 0) throw new Error(`ffmpeg exited ${code}`);
    await page.evaluate(() => window.renderFilm(3.5));
    const poster = await page.evaluate(
      () =>
        document
          .querySelector("canvas")
          .toDataURL("image/jpeg", 0.94)
          .split(",")[1],
    );
    fs.writeFileSync(
      path.join(root, "static/images/posters/unipred-overview.jpg"),
      Buffer.from(poster, "base64"),
    );
    console.log("Exported 28-second overview and poster.");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
