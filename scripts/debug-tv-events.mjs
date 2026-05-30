// Debug: capture all postMessage events from TradingView iframe and widget API surface.
import { chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", ".playwright-mcp");

const browser = await chromium.launch({ headless: false }); // headless:false so TV widget loads fully
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

// Capture ALL messages from any frame (TV widget lives in an iframe)
const messages = [];
await page.exposeFunction("__captureMsg__", (msg) => messages.push(msg));

await page.addInitScript(() => {
  const orig = window.addEventListener.bind(window);
  orig("message", (e) => {
    try {
      window.__captureMsg__(JSON.stringify({ origin: e.origin, data: e.data }));
    } catch {}
  });
});

await page.goto("http://localhost:3000/stocks/AAPL", { waitUntil: "networkidle" });

// Probe what methods exist on the widget object
const widgetApi = await page.evaluate(() => {
  // TradingView widget is created as window.TradingView.widget(...)
  // The instance is stored in the React ref but not directly accessible.
  // Check window.TradingView itself.
  const tv = window.TradingView;
  if (!tv) return { error: "TradingView global not found" };
  return {
    hasTvGlobal: true,
    tvKeys: Object.keys(tv),
    hasWidget: typeof tv.widget === "function",
  };
});
console.log("[widget api]", JSON.stringify(widgetApi, null, 2));

// Wait 8 seconds for widget to fully load and any initial messages
console.log("[debug] waiting 8s for widget to load...");
await page.waitForTimeout(8000);

console.log(`[messages] Captured ${messages.length} postMessage events:`);
messages.slice(0, 20).forEach((m, i) => {
  try {
    const parsed = JSON.parse(m);
    const dataStr = typeof parsed.data === "string"
      ? parsed.data.slice(0, 200)
      : JSON.stringify(parsed.data).slice(0, 200);
    console.log(`  [${i}] origin=${parsed.origin} data=${dataStr}`);
  } catch {
    console.log(`  [${i}] raw=${String(m).slice(0, 200)}`);
  }
});

await page.screenshot({ path: path.join(OUT, "tv-debug.png") });
await browser.close();
