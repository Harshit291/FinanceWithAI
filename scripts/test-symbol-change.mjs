// Tests that injecting a quoteUpdate postMessage causes the page to navigate.
import { chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", ".playwright-mcp");

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

await page.goto("http://localhost:3000/stocks/AAPL", { waitUntil: "networkidle" });
console.log(`[init] URL: ${page.url()}`);

// Wait for Next.js hydration (client components must mount before listener attaches)
await page.waitForTimeout(3000);

// Simulate TradingView firing quoteUpdate for NFLX (user picked NFLX in chart)
await page.evaluate(() => {
  window.postMessage(
    { name: "quoteUpdate", data: { short_name: "NFLX", exchange: "Cboe One" } },
    "*"
  );
});
console.log("[inject] posted quoteUpdate for NFLX");

// Wait for router.push to fire and navigation to complete
await page.waitForURL("**/stocks/NFLX", { timeout: 8000 }).catch(() => null);
const afterUrl = page.url();
console.log(`[after] URL: ${afterUrl}`);
console.log(`[result] Navigated to NFLX: ${afterUrl.includes("NFLX")}`);

// Test NSE symbol conversion (.NS suffix)
if (afterUrl.includes("NFLX")) {
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    window.postMessage(
      { name: "quoteUpdate", data: { short_name: "RELIANCE", exchange: "NSE" } },
      "*"
    );
  });
  console.log("[inject] posted quoteUpdate for RELIANCE NSE");
  await page.waitForURL("**/stocks/RELIANCE.NS", { timeout: 8000 }).catch(() => null);
  const nseUrl = page.url();
  console.log(`[after] URL: ${nseUrl}`);
  console.log(`[result] Navigated to RELIANCE.NS: ${nseUrl.includes("RELIANCE.NS")}`);
}

await page.screenshot({ path: path.join(OUT, "symbol-change-result.png") });
await browser.close();
console.log("✓ Symbol change test complete.");
