/**
 * embed-fonts.mjs
 * Downloads Inter + JetBrains Mono from Google Fonts and embeds them
 * as base64 @font-face rules directly inside every resume HTML file,
 * making each file fully self-contained with no internet dependency.
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

// ── 1. Fetch the Google Fonts CSS (use a modern Chrome UA to get woff2) ──────
const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800' +
  '&family=JetBrains+Mono:wght@400;500&display=swap';

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/124.0.0.0 Safari/537.36';

console.log('📥  Fetching Google Fonts CSS…');
const cssRes  = await fetch(FONTS_URL, { headers: { 'User-Agent': CHROME_UA } });
const cssText = await cssRes.text();

// ── 2. Parse every url(...) in the CSS ───────────────────────────────────────
const urlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
const fontUrls = [...new Set([...cssText.matchAll(urlRegex)].map(m => m[1]))];
console.log(`   Found ${fontUrls.length} font files to download.`);

// ── 3. Download each font and convert to base64 data URI ─────────────────────
const fontCache = {}; // url → data:font/woff2;base64,...

for (const url of fontUrls) {
  process.stdout.write(`   Downloading ${url.split('/').pop()}… `);
  const res    = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  fontCache[url] = `data:font/woff2;base64,${buffer.toString('base64')}`;
  console.log('✓');
}

// ── 4. Rewrite the CSS: replace each url(...) with the base64 data URI ───────
let embeddedCss = cssText;
for (const [url, dataUri] of Object.entries(fontCache)) {
  embeddedCss = embeddedCss.replaceAll(url, dataUri);
}

// Wrap in a <style> block so we can drop it straight into HTML
const fontStyleBlock = `<style>\n/* ── Embedded Google Fonts (offline-safe) ── */\n${embeddedCss}\n</style>`;

// ── 5. Apply to every resume HTML file in /public ────────────────────────────
const htmlFiles = fs.readdirSync(publicDir)
  .filter(f => f.startsWith('resume') && f.endsWith('.html'))
  .map(f => path.join(publicDir, f));

console.log(`\n📝  Embedding fonts into ${htmlFiles.length} HTML file(s):`);

const GFONTS_LINK_REGEX =
  /\s*<link[^>]+fonts\.googleapis\.com[^>]*>\s*/g;
const PRECONNECT_REGEX =
  /\s*<link[^>]+rel="preconnect"[^>]*>\s*/g;

for (const filePath of htmlFiles) {
  let html = fs.readFileSync(filePath, 'utf8');

  // Skip if already embedded
  if (html.includes('data:font/woff2;base64')) {
    console.log(`   ⏭  ${path.basename(filePath)} — already embedded, skipping.`);
    continue;
  }

  // Remove the Google Fonts <link> and preconnect hints
  html = html.replace(GFONTS_LINK_REGEX, '\n');
  html = html.replace(PRECONNECT_REGEX, '\n');

  // Insert the embedded font <style> block just before </head>
  html = html.replace('</head>', `${fontStyleBlock}\n</head>`);

  fs.writeFileSync(filePath, html, 'utf8');
  const kb = Math.round(fs.statSync(filePath).size / 1024);
  console.log(`   ✅  ${path.basename(filePath)} — ${kb} KB`);
}

console.log('\n🎉  All done! Every resume HTML is now fully self-contained.');
