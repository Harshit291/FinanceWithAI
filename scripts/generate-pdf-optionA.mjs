import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath  = path.resolve(__dirname, '../public/resume_optionA.html');
const outPath   = path.resolve(__dirname, '../public/Harshit_Gupta_Resume_OptionA.pdf');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('Generating Option A PDF...');
const browser = await puppeteer.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 1500));
await page.pdf({ path: outPath, format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
await browser.close();
console.log('✅ Option A PDF saved to:', outPath);
