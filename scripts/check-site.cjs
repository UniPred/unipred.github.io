// Node 20+, Playwright; serve the repository first. Tests user-visible behavior.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
(async () => {
  const origin = process.env.SITE_ORIGIN || "http://127.0.0.1:8007";
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin,
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(r.status() + " " + r.url());
    });
    await page.goto(origin);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator(".authors a").count(), 11);
    assert.match(
      await page.locator(".acceptance").innerText(),
      /Accepted by IEEE.*2026/,
    );
    await page.locator(".affiliations summary").click();
    assert.match(
      await page.locator(".affiliations").innerText(),
      /Department of Civil and Environmental Engineering/,
    );
    await page.locator(".affiliations summary").click();
    assert.equal(await page.locator("#demos video").count(), 5);
    assert.equal(await page.locator("#recovery video").count(), 3);
    assert.equal(await page.locator("#fails video").count(), 3);
    for (const v of await page.locator("#demos video").all())
      assert.equal(await v.isVisible(), true);
    const refs = await page
      .locator("[src],[href],[poster]")
      .evaluateAll((nodes) =>
        nodes.flatMap((n) =>
          ["src", "href", "poster"]
            .map((k) => n.getAttribute(k))
            .filter(Boolean),
        ),
      );
    for (const ref of refs) {
      if (ref.startsWith("#")) {
        if (ref.length > 1) assert.equal(await page.locator(ref).count(), 1);
      } else if (!/^https?:|^mailto:|^data:/.test(ref))
        assert.ok(
          fs.existsSync(path.resolve(__dirname, "..", ref.split("?")[0])),
          ref,
        );
    }
    for (const width of [360, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (let step = 0; step < 4; step++) {
        await page.locator(`[data-step="${step}"]`).click();
        assert.equal(await page.locator(".story-scene:visible").count(), 1);
        assert.equal(
          await page.locator(`#learning-scene-${step}`).isVisible(),
          true,
        );
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `Overflow at ${width}, step ${step}`,
        );
        assert.ok(
          await page
            .locator(".story-scene:visible")
            .evaluate((scene) => scene.scrollHeight <= scene.clientHeight + 1),
          `Scene overflow at ${width}, step ${step}`,
        );
      }
    }
    assert.ok(
      (
        await page
          .locator(".state-strip img")
          .evaluateAll((images) =>
            images.map((img) => getComputedStyle(img).objectFit),
          )
      ).every((f) => f === "contain"),
    );
    const film = page.locator("#overview-film");
    await film.scrollIntoViewIfNeeded();
    assert.equal(await film.evaluate((v) => v.paused), true);
    await film.evaluate((v) => v.play());
    await page.waitForFunction(
      () => document.querySelector("#overview-film").currentTime > 0.15,
    );
    const duration = await film.evaluate((v) => v.duration);
    assert.ok(duration > 82 && duration < 83);
    await film.evaluate((v) => v.pause());
    // Check decoded frames in the execution segment, not just currentTime.
    // A server without HTTP Range support can report seeked without a new frame.
    await film.evaluate(async (v) => {
      v.currentTime = 35;
      await v.play();
    });
    await page.waitForFunction(
      () => document.querySelector("#overview-film").currentTime > 38,
    );
    await film.evaluate((v) => v.pause());
    const frameHashes = [];
    for (const time of [40, 54, 78]) {
      frameHashes.push(
        await film.evaluate(async (v, time) => {
          await new Promise((resolve) => {
            v.addEventListener("seeked", resolve, { once: true });
            v.currentTime = time;
          });
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          );
          const c = document.createElement("canvas");
          c.width = 160;
          c.height = 90;
          c.getContext("2d").drawImage(v, 432, 208, 960, 540, 0, 0, 160, 90);
          return c.toDataURL();
        }, time),
      );
    }
    assert.equal(
      new Set(frameHashes).size,
      3,
      "Robot footage must change after seeking; preview server must support HTTP byte ranges",
    );

    let checked = 1;
    for (const video of await page.locator(".video-grid video").all()) {
      await video.scrollIntoViewIfNeeded();
      await video.evaluate((v) => v.play());
      await page.waitForFunction(() =>
        [...document.querySelectorAll(".video-grid video")].some(
          (v) => !v.paused && v.currentTime > 0.15,
        ),
      );
      assert.equal(await video.evaluate((v) => v.error), null);
      await video.evaluate((v) => v.pause());
      checked++;
    }
    await page.locator("#copy-citation").click();
    assert.match(
      await page.evaluate(() => navigator.clipboard.readText()),
      /@misc\{wang2025/,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => scrollTo(0, 0));
    await page.locator(".menu-toggle").click();
    assert.equal(await page.locator("#site-nav").isVisible(), true);
    await page.locator('#site-nav a[href="#method"]').click();
    assert.equal(
      await page.locator(".menu-toggle").getAttribute("aria-expanded"),
      "false",
    );
    await page.goto(origin);
    await page.screenshot({
      path: "/tmp/unipred-site-review/v2-mobile-final.png",
    });
    await page.locator("#learning-diagram").screenshot({
      path: "/tmp/unipred-site-review/v2-mobile-diagram-final.png",
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(origin);
    await page.screenshot({
      path: "/tmp/unipred-site-review/v2-desktop-final.png",
    });
    const autoContext = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
    });
    const auto = await autoContext.newPage();
    auto.on("pageerror", (e) => errors.push(e.message));
    await auto.goto(origin);
    await auto.locator("#learning-diagram").scrollIntoViewIfNeeded();
    const before = await auto
      .locator("#learning-diagram")
      .getAttribute("data-phase");
    await auto.waitForFunction(
      (p) => document.querySelector("#learning-diagram").dataset.phase !== p,
      before,
      { timeout: 8000 },
    );
    await auto.locator("#learning-toggle").click();
    const pausedPhase = await auto
      .locator("#learning-diagram")
      .getAttribute("data-phase");
    await auto.waitForTimeout(4700);
    assert.equal(
      await auto.locator("#learning-diagram").getAttribute("data-phase"),
      pausedPhase,
    );
    await auto.locator('[data-step="2"]').click();
    await auto.locator("#learning-toggle").click();
    const signalPosition = () =>
      auto.locator("#feedback-signal").getAttribute("cx");
    const signalStart = await signalPosition();
    await auto.waitForTimeout(1000);
    assert.notEqual(
      await signalPosition(),
      signalStart,
      "Feedback should animate when playing",
    );
    await auto.locator("#learning-toggle").click();
    const signalPaused = await signalPosition();
    await auto.waitForTimeout(700);
    assert.equal(
      await signalPosition(),
      signalPaused,
      "Pause must freeze the feedback animation",
    );
    await auto.locator('[data-step="3"]').focus();
    await auto.keyboard.press("Enter");
    assert.equal(await auto.locator("#learning-scene-3").isVisible(), true);
    await auto.locator(".two-column").scrollIntoViewIfNeeded();
    await auto.waitForFunction(() =>
      [...document.querySelectorAll(".two-column video")].every(
        (v) => !v.paused && v.currentTime > 0.2,
      ),
    );
    await auto.locator("#motion-toggle").click();
    await auto.waitForFunction(() =>
      [...document.querySelectorAll("video")].every((v) => v.paused),
    );
    await auto.locator("#motion-toggle").click();
    await auto.waitForFunction(() =>
      [...document.querySelectorAll(".two-column video")].every(
        (v) => !v.paused,
      ),
    );
    await auto.locator("#paper").scrollIntoViewIfNeeded();
    await auto.waitForFunction(() =>
      [...document.querySelectorAll(".two-column video")].every(
        (v) => v.paused,
      ),
    );
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify(
        {
          passed: true,
          videoChecks: checked,
          filmDuration: duration,
          checks: [
            "five demos directly visible",
            "complete state images",
            "82-second film",
            "all video playback",
            "automatic learning animation",
            "one visible scene at each step",
            "manual and keyboard scene selection",
            "pause freezes feedback motion",
            "simultaneous visible demos",
            "global pause and resume",
            "offscreen pause",
            "reduced motion",
            "mobile menu",
            "clipboard",
            "no overflow at 360/390/768/1440",
            "no browser errors",
          ],
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
