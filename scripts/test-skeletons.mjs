// Skeleton smoke test — verifies the stock page renders skeletons then resolves to content.
// Run with: node scripts/test-skeletons.mjs
import { chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", ".playwright-mcp");

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

const BASE = "http://localhost:3000";

// --- intercept FastAPI to add delay so skeletons are visible ---
await page.route("http://localhost:8000/**", async (route) => {
  await new Promise((r) => setTimeout(r, 1500));
  await route.continue();
});

// Navigate and immediately screenshot (skeletons should be visible)
const navPromise = page.goto(`${BASE}/stocks/AAPL`, { waitUntil: "domcontentloaded" });
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: path.join(OUT, "skeleton-state.png"), fullPage: false });
console.log("[skeleton] screenshot taken (should show skeletons)");

// Check skeleton is present
const skeletonEl = await page.locator('[aria-label="Loading AI research report"]').count();
console.log(`[skeleton] VerdictCardSkeleton present: ${skeletonEl > 0}`);
const techSkeletonEl = await page.locator('.animate-pulse').count();
console.log(`[skeleton] animate-pulse elements: ${techSkeletonEl}`);

// Wait for full page content
await navPromise;
await page.waitForTimeout(12000); // give AI calls time to complete
await page.screenshot({ path: path.join(OUT, "loaded-state.png"), fullPage: true });
console.log("[loaded] screenshot taken");

// Assertions
const h1 = await page.locator("h1").first().textContent();
console.log(`[loaded] H1: ${h1}`);

const hasReport = await page.locator('[aria-label="AI research report"]').count();
const hasUnavailable = await page.locator("text=AI fundamental analysis temporarily unavailable").count();
const hasQuotaBanner = await page.locator('[aria-label="Daily AI report quota exceeded"]').count();
console.log(`[loaded] VerdictCard present: ${hasReport > 0}`);
console.log(`[loaded] Unavailable fallback: ${hasUnavailable > 0}`);
console.log(`[loaded] Quota exceeded banner: ${hasQuotaBanner > 0}`);

// Technical panel
const hasTechnical = await page.locator("text=Technical Analysis").count();
console.log(`[loaded] Technical panel present: ${hasTechnical > 0}`);

// Header symbol
const symbolHeader = await page.locator("h1").first().textContent();
console.log(`[loaded] Symbol in header: ${symbolHeader?.trim()}`);

// Mobile viewport test
await page.setViewportSize({ width: 375, height: 667 });
await page.reload({ waitUntil: "domcontentloaded" });
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: path.join(OUT, "skeleton-mobile.png") });
console.log("[mobile] skeleton screenshot taken at 375px");

await browser.close();
console.log("\n✓ Skeleton smoke test complete. Check .playwright-mcp/ for screenshots.");
