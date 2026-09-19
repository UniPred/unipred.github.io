// Node 20+, Playwright, ffmpeg. Serve this repository at OVERVIEW_ORIGIN first.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { once } = require("node:events");
(async () => {
  const root = path.resolve(__dirname, "..");
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "unipred-film-"));
  const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox"],
  });
  function ffmpeg(args) {
    return spawn(
      ffmpegPath,
      ["-hide_banner", "-loglevel", "warning", "-y", ...args],
      { stdio: ["pipe", "inherit", "inherit"] },
    );
  }
  async function complete(proc) {
    const [code] = await once(proc, "exit");
    if (code !== 0) throw new Error("ffmpeg exited " + code);
  }
  const encoding = [
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-r",
    "24",
    "-movflags",
    "+faststart",
  ];
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
    const introDuration = await page.evaluate(() => window.filmIntroDuration);
    const frames = Math.round(introDuration * 24);
    if (process.argv.includes("--preview")) {
      fs.mkdirSync("/tmp/unipred-site-review/film-v6", { recursive: true });
      for (const [label, t] of [
        ["opening", 3],
        ["agent", 7],
        ["demonstration", 12],
        ["feedback", 23],
        ["concept", 31],
        ["state", 36],
        ["plan", 42],
        ["execution", 46],
      ]) {
        await page.evaluate((t) => window.renderFilm(t), t);
        await page.locator("canvas").screenshot({
          path: `/tmp/unipred-site-review/film-v6/${label}.png`,
        });
      }
      return;
    }
    const intro = path.join(work, "intro.mp4");
    const encoder = ffmpeg([
      "-f",
      "image2pipe",
      "-vcodec",
      "mjpeg",
      "-framerate",
      "24",
      "-i",
      "pipe:0",
      ...encoding,
      intro,
    ]);
    const encoderDone = complete(encoder);
    for (let frame = 0; frame < frames; frame++) {
      const data = await page.evaluate(async (t) => {
        await window.renderFilm(t);
        return document
          .querySelector("canvas")
          .toDataURL("image/jpeg", 0.95)
          .split(",")[1];
      }, frame / 24);
      if (!encoder.stdin.write(Buffer.from(data, "base64")))
        await once(encoder.stdin, "drain");
      if (frame % 120 === 0)
        console.log(`Rendered intro ${frame}/${frames} frames`);
    }
    encoder.stdin.end();
    await encoderDone;
    await page.evaluate(() => window.renderExecution());
    const executionPng = path.join(work, "execution.png");
    await page.locator("canvas").screenshot({ path: executionPng });
    const execution = path.join(work, "execution.mp4");
    await complete(
      ffmpeg([
        "-loop",
        "1",
        "-framerate",
        "24",
        "-i",
        executionPng,
        "-i",
        path.join(root, "static/videos/web/main_demo_1.mp4"),
        "-filter_complex",
        "[1:v]scale=960:540,setsar=1[robot];[0:v][robot]overlay=432:208:shortest=1,fps=24,setsar=1[out]",
        "-map",
        "[out]",
        ...encoding,
        execution,
      ]),
    );
    fs.writeFileSync(
      path.join(work, "concat.txt"),
      "file 'intro.mp4'\nfile 'execution.mp4'\n",
    );
    await complete(
      ffmpeg([
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        path.join(work, "concat.txt"),
        "-c",
        "copy",
        "-movflags",
        "+faststart",
        path.join(work, "silent.mp4"),
      ]),
    );
    await complete(
      ffmpeg([
        "-i",
        path.join(work, "silent.mp4"),
        "-i",
        path.join(root, "static/audio/overview-narration.wav"),
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "96k",
        "-af",
        "loudnorm=I=-18:TP=-1.5:LRA=11,apad=pad_dur=60",
        "-ar",
        "48000",
        "-shortest",
        "-movflags",
        "+faststart",
        path.join(root, "static/videos/unipred-overview.mp4"),
      ]),
    );
    await page.evaluate(() => window.renderFilm(3));
    const poster = await page.evaluate(
      () =>
        document
          .querySelector("canvas")
          .toDataURL("image/jpeg", 0.95)
          .split(",")[1],
    );
    fs.writeFileSync(
      path.join(root, "static/images/posters/unipred-overview.jpg"),
      Buffer.from(poster, "base64"),
    );
    console.log(
      "Exported narrated overview with the complete 46-second robot clip.",
    );
  } finally {
    await browser.close();
    fs.rmSync(work, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
