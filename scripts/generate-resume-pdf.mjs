import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath  = path.resolve(__dirname, '../public/resume.html');
const outPath   = path.resolve(__dirname, '../public/Harshit_Gupta_Resume.pdf');

// Use the system Chrome installation
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

if (!fs.existsSync(htmlPath)) {
  console.error('❌  resume.html not found at:', htmlPath);
  process.exit(1);
}

console.log('🚀  Launching browser…');
const browser = await puppeteer.launch({ headless: true, executablePath: chromePath });
const page    = await browser.newPage();

// Load the file from disk (fonts load via Google Fonts CDN)
await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0', timeout: 30000 });

// Give Google Fonts an extra moment to render
await new Promise(r => setTimeout(r, 1500));

await page.pdf({
  path: outPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
});

await browser.close();
console.log('✅  PDF saved to:', outPath);
