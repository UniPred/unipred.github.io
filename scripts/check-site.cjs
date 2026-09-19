// Browser smoke checks. Run with Node 20+ and Playwright installed; serve this repo first.
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
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400)
        errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(origin);
    await page.evaluate(() => document.fonts.ready);
    assert.deepEqual(await page.locator(".authors a").allTextContents(), [
      "Qianwei Wang",
      "Bowen Li",
      "Zhanpeng Luo",
      "Yifan Xu",
      "Vineet Kamat",
      "Carol Menassa",
      "Alexander Gray",
      "Tom Silver",
      "Sebastian Scherer",
      "Katia Sycara",
      "Yaqi Xie",
    ]);
    await page.locator(".affiliations summary").click();
    assert.match(
      await page.locator(".affiliations").innerText(),
      /Department of Civil and Environmental Engineering, University of Michigan/,
    );
    await page.locator(".affiliations summary").click();
    const paths = await page
      .locator("[src], [href], [poster]")
      .evaluateAll((nodes) =>
        nodes.flatMap((node) =>
          ["src", "href", "poster"]
            .map((key) => node.getAttribute(key))
            .filter(Boolean),
        ),
      );
    for (const ref of paths) {
      if (ref.startsWith("#")) {
        if (ref.length > 1)
          assert.equal(
            await page.locator(ref).count(),
            1,
            `Broken anchor ${ref}`,
          );
      } else if (!/^https?:|^mailto:|^data:/.test(ref))
        assert.ok(
          fs.existsSync(path.resolve(__dirname, "..", ref)),
          `Missing file ${ref}`,
        );
    }
    const film = page.locator("#overview-film");
    await film.scrollIntoViewIfNeeded();
    assert.equal(
      await film.evaluate((video) => video.paused),
      true,
      "Reduced motion must not autoplay the film",
    );
    await film.evaluate((video) => video.play());
    await page.waitForFunction(
      () => document.querySelector("#overview-film").currentTime > 0.15,
    );
    assert.equal(await film.evaluate((v) => Math.round(v.duration)), 28);
    await film.evaluate((video) => video.pause());
    await page.locator("#tab-0").focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(
      await page.locator("#tab-1").getAttribute("aria-selected"),
      "true",
    );
    await page.keyboard.press("End");
    assert.equal(await page.locator(".planning-visual").isVisible(), true);
    for (const width of [360, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (let stage = 0; stage < 4; stage++) {
        await page.locator(`#tab-${stage}`).click();
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
          `Horizontal overflow at ${width}, stage ${stage}`,
        );
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    let videoChecks = 1;
    for (const domain of ["table", "clutter"]) {
      await page.locator(`#domain-${domain}`).click();
      for (const button of await page.locator("[data-clip]").all()) {
        await button.click();
        await page.locator("#demo-video").scrollIntoViewIfNeeded();
        await page.locator("#demo-video").evaluate((video) => video.play());
        await page.waitForFunction(
          () => document.querySelector("#demo-video").currentTime > 0.15,
        );
        assert.equal(
          await page.locator("#demo-video").evaluate((v) => v.error),
          null,
        );
        await page.locator("#demo-video").evaluate((video) => video.pause());
        videoChecks++;
      }
    }
    for (const video of await page
      .locator("#recovery video, #fails video")
      .all()) {
      await video.scrollIntoViewIfNeeded();
      await video.evaluate((v) => v.play());
      await page.waitForFunction(() =>
        [...document.querySelectorAll("#recovery video, #fails video")].some(
          (v) => !v.paused && v.currentTime > 0.15,
        ),
      );
      assert.equal(await video.evaluate((v) => v.error), null);
      await video.evaluate((v) => v.pause());
      videoChecks++;
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
    await page.locator('#site-nav a[href="#demos"]').click();
    assert.equal(
      await page.locator(".menu-toggle").getAttribute("aria-expanded"),
      "false",
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.goto(origin);
    await page.screenshot({
      path: "/tmp/unipred-site-review/mobile-final.png",
    });
    await page.locator("#tab-2").click();
    await page.locator("#method-panel").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: "/tmp/unipred-site-review/mobile-method-final.png",
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(origin);
    await page.screenshot({
      path: "/tmp/unipred-site-review/desktop-final.png",
    });
    await context.close();
    const autoContext = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    });
    const autoPage = await autoContext.newPage();
    await autoPage.goto(origin);
    await autoPage.locator("#overview-film").scrollIntoViewIfNeeded();
    await autoPage.waitForFunction(
      () => document.querySelector("#overview-film").currentTime > 0.15,
    );
    await autoPage.locator("#method").scrollIntoViewIfNeeded();
    await autoPage.waitForFunction(
      () => document.querySelector("#overview-film").paused,
    );
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify(
        {
          passed: true,
          authors: 11,
          videoChecks,
          viewportWidths: [360, 390, 768, 1440],
          checks: [
            "local assets and anchors",
            "four method stages",
            "keyboard tabs",
            "all video playback",
            "domain and clip selection",
            "reduced motion",
            "viewport-based playback",
            "mobile navigation",
            "clipboard copy",
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
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
