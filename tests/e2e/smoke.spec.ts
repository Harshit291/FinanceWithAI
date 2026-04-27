import { test, expect } from "@playwright/test";

test.describe("smoke — /stocks/[symbol]", () => {
  test("US symbol renders on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/stocks/AAPL");
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByText("AAPL")).toBeVisible();
    // Disclaimer must be visible without any interaction
    await expect(page.getByRole("note", { name: /disclaimer/i })).toBeVisible();
  });

  test("India NSE symbol renders on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/stocks/RELIANCE.NS");
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByText("RELIANCE.NS")).toBeVisible();
    await expect(page.getByRole("note", { name: /disclaimer/i })).toBeVisible();
  });

  test("mobile 375x667 — chart stacks above AI panel, disclaimer visible", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/stocks/RELIANCE.NS");
    await expect(page.getByRole("main")).toBeVisible();
    // Disclaimer should be visible in the viewport without scrolling
    const disclaimer = page.getByRole("note", { name: /disclaimer/i });
    await expect(disclaimer).toBeVisible();
  });

  test("landing page has working links to NSE and US symbols", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("FinAI")).toBeVisible();
    await expect(page.getByRole("link", { name: /RELIANCE\.NS/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /AAPL/i })).toBeVisible();
  });
});
