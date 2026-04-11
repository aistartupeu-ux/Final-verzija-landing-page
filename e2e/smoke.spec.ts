import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("home loads", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/AI Hype Academy/i);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("public waitlist count API", async ({ request }) => {
    const res = await request.get("/api/public/waitlist-count");
    expect(res.ok()).toBeTruthy();
    const json = (await res.json()) as { total?: unknown };
    expect(typeof json.total).toBe("number");
    expect(Number.isFinite(json.total as number)).toBeTruthy();
  });

  test("LP route responds", async ({ page }) => {
    await page.goto("/lp", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/AI Hype Academy/i);
  });

  test("admin login page", async ({ page }) => {
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Admin pristup" })).toBeVisible();
    await expect(page.getByPlaceholder("Pristupni kod")).toBeVisible();
  });

  /**
   * Glavni dashboard više ne sme da „visi“ na loaderu ako Meta/TikTok API ne odgovaraju
   * (vidi fetchData u AdminAnalyticsDashboard). Ovde tražimo bilo koji konačan UI:
   * login, podaci, ili čitljiva greška — ne beskonačan spinner bez teksta.
   */
  test("admin analytics route settles", async ({ page }) => {
    await page.goto("/admin/k4m8p2w7", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByText(
        /Admin pristup|Ukupno leadova|Greška pri učitavanju|Database not configured|predugo trajao|Preuzimanje analitike/i,
      ).first(),
    ).toBeVisible({ timeout: 90_000 });
  });

  test("free-guide lead form visible", async ({ page }) => {
    await page.goto("/free-guide", { waitUntil: "domcontentloaded" });
    await expect(page.getByPlaceholder("Unesi svoj email")).toBeVisible({ timeout: 30_000 });
  });
});
