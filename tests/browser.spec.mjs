/* Yildiz Inisi. Gercek Chromium uzerinde kabul testleri. */
import { test, expect } from "@playwright/test";

async function boot(page) {
  await page.goto("/");
  await page.waitForFunction(() => window.__yi && window.__yi.ready, null, { timeout: 45000 });
}
async function play(page) {
  await boot(page);
  await page.getByRole("button", { name: "Inise basla" }).click();
  await page.waitForFunction(() => window.__yi.state.phase === "playing");
}
const phase = (page) => page.evaluate(() => window.__yi.state.phase);
const snap = (page) => page.evaluate(() => ({
  score: window.__yi.state.score, x: window.__yi.state.x, z: window.__yi.state.z,
  health: window.__yi.state.health, combo: window.__yi.state.combo,
  airborne: window.__yi.state.airborne, mode: window.__yi.state.mode,
  frames: window.__yi.frames, speed: window.__yi.state.speed
}));

test("sayfa dogru baslikla yuklenir", async ({ page }) => {
  await boot(page);
  await expect(page).toHaveTitle(/Yildiz Inisi/);
});

test("calisma zamani hazir olur", async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => window.__yi.ready)).toBe(true);
});

test("webgl baglami acilir", async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => window.__yi.webgl)).toBe(true);
});

test("three.js 169 revizyonu yuklenir", async ({ page }) => {
  await boot(page);
  expect(String(await page.evaluate(() => window.__yi.three))).toBe("169");
});

test("canvas sahneye eklenir ve boyutlanir", async ({ page }) => {
  await boot(page);
  const box = await page.locator("#stage canvas").boundingBox();
  expect(box.width).toBeGreaterThan(300);
  expect(box.height).toBeGreaterThan(300);
});

test("acilis katmani gorunur", async ({ page }) => {
  await boot(page);
  await expect(page.locator("#startOverlay")).toBeVisible();
  await expect(page.locator("#overOverlay")).toBeHidden();
});

test("webgl fallback bolumu gizli kalir", async ({ page }) => {
  await boot(page);
  await expect(page.locator("#fallback")).toBeHidden();
});

test("basla dugmesi oyunu acar", async ({ page }) => {
  await play(page);
  await expect(page.locator("#startOverlay")).toBeHidden();
  expect(await phase(page)).toBe("playing");
});

test("kare sayaci ilerler", async ({ page }) => {
  await boot(page);
  const a = (await snap(page)).frames;
  await page.waitForTimeout(600);
  expect((await snap(page)).frames).toBeGreaterThan(a);
});

test("oynarken puan artar", async ({ page }) => {
  await play(page);
  const a = (await snap(page)).score;
  await page.waitForTimeout(700);
  expect((await snap(page)).score).toBeGreaterThan(a);
});

test("hiz zamanla yukselir", async ({ page }) => {
  await play(page);
  const a = (await snap(page)).speed;
  await page.waitForTimeout(900);
  expect((await snap(page)).speed).toBeGreaterThan(a);
});

test("hud puani gunceller", async ({ page }) => {
  await play(page);
  await page.waitForTimeout(700);
  expect(Number(await page.locator("#score").textContent())).toBeGreaterThan(0);
});

test("hud hizi km/s gosterir", async ({ page }) => {
  await play(page);
  await page.waitForTimeout(400);
  expect(Number(await page.locator("#speed").textContent())).toBeGreaterThan(30);
});

test("safak modu secilir", async ({ page }) => {
  await play(page);
  await page.getByRole("button", { name: "Safak" }).click();
  expect((await snap(page)).mode).toBe("safak");
  await expect(page.locator(".mode[data-mode=safak]")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".mode[data-mode=gece]")).toHaveAttribute("aria-pressed", "false");
});

test("tipi modu secilir", async ({ page }) => {
  await play(page);
  await page.getByRole("button", { name: "Tipi" }).click();
  expect((await snap(page)).mode).toBe("tipi");
});

test("p tusu duraklatir ve devam ettirir", async ({ page }) => {
  await play(page);
  await page.keyboard.press("p");
  expect(await phase(page)).toBe("paused");
  const z = (await snap(page)).z;
  await page.waitForTimeout(400);
  expect((await snap(page)).z).toBe(z);
  await page.keyboard.press("p");
  expect(await phase(page)).toBe("playing");
});

test("sag ok tusu saga dondurur", async ({ page }) => {
  await play(page);
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(500);
  await page.keyboard.up("ArrowRight");
  expect((await snap(page)).x).toBeGreaterThan(0.5);
});

test("sol ok tusu sola dondurur", async ({ page }) => {
  await play(page);
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(500);
  await page.keyboard.up("ArrowLeft");
  expect((await snap(page)).x).toBeLessThan(-0.5);
});

test("d tusu de dondurur", async ({ page }) => {
  await play(page);
  await page.keyboard.down("d");
  await page.waitForTimeout(500);
  await page.keyboard.up("d");
  expect((await snap(page)).x).toBeGreaterThan(0.5);
});

test("bosluk tusu ziplatir", async ({ page }) => {
  await play(page);
  await page.keyboard.press(" ");
  await page.waitForFunction(() => window.__yi.state.airborne === true, null, { timeout: 3000 });
  expect((await snap(page)).airborne).toBe(true);
});

test("carpma can dusurur ve cubugu kisaltir", async ({ page }) => {
  await play(page);
  await page.evaluate(() => window.__yi.forceCrash());
  expect((await snap(page)).health).toBe(2);
  expect(await page.locator("#healthBar").evaluate((n) => n.style.width)).toMatch(/^66\.6/);
});

test("uc carpma inisi bitirir", async ({ page }) => {
  await play(page);
  await page.evaluate(() => { for (let i = 0; i < 3; i++) { window.__yi.forceCrash(); } });
  await expect(page.locator("#overOverlay")).toBeVisible();
  expect(await phase(page)).toBe("over");
});

test("bitis ekrani istatistik gosterir", async ({ page }) => {
  await play(page);
  await page.waitForTimeout(800);
  await page.evaluate(() => { for (let i = 0; i < 3; i++) { window.__yi.forceCrash(); } });
  await expect(page.locator("#overOverlay")).toBeVisible();
  expect(Number(await page.locator("#finalScore").textContent())).toBeGreaterThan(0);
  await expect(page.locator("#finalDistance")).toContainText("m");
});

test("bitisten sonra tekrar in calisir", async ({ page }) => {
  await play(page);
  await page.evaluate(() => { for (let i = 0; i < 3; i++) { window.__yi.forceCrash(); } });
  await page.getByRole("button", { name: "Tekrar in" }).click();
  expect(await phase(page)).toBe("playing");
  expect((await snap(page)).health).toBe(3);
  await expect(page.locator("#overOverlay")).toBeHidden();
});

test("r tusu inisi sifirlar", async ({ page }) => {
  await play(page);
  await page.waitForTimeout(700);
  await page.keyboard.press("r");
  expect(await phase(page)).toBe("playing");
  expect((await snap(page)).score).toBeLessThan(20);
});

test("yildiz kombosu hud alanina yansir", async ({ page }) => {
  await play(page);
  await page.evaluate(() => window.__yi.collectStar());
  expect((await snap(page)).combo).toBe(2);
  await expect(page.locator("#combo")).toHaveText("x2");
});

test("konsol hatasi yok", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") { errors.push(m.text()); } });
  page.on("pageerror", (e) => errors.push(String(e)));
  await play(page);
  await page.waitForTimeout(1200);
  expect(errors).toEqual([]);
});

test("basarisiz ag istegi yok", async ({ page }) => {
  const failed = [];
  page.on("requestfailed", (r) => failed.push(r.url()));
  page.on("response", (r) => { if (r.status() >= 400) { failed.push(r.url() + " " + r.status()); } });
  await boot(page);
  await page.waitForTimeout(500);
  expect(failed).toEqual([]);
});

test("pencere yeniden boyutlandirmasi sahneyi kirmaz", async ({ page }) => {
  await play(page);
  await page.setViewportSize({ width: 640, height: 900 });
  await page.waitForTimeout(500);
  const box = await page.locator("#stage canvas").boundingBox();
  expect(Math.round(box.width)).toBe(640);
  expect(await phase(page)).toBe("playing");
});
