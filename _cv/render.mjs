// Render _cv/cv.html to the site's CV PDF. Usage: node cv_pdf.mjs <cv.html> <out.pdf>
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
const [,, src, out] = process.argv;
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-first-run'] });
const page = await browser.newPage();
await page.goto(pathToFileURL(src).href, { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
const info = await page.evaluate(() => ({
  fonts: [...document.fonts].filter(f => f.status === 'loaded').length,
  overflow: [...document.querySelectorAll('.page')].map(p => p.scrollHeight - p.clientHeight),
  links: document.querySelectorAll('a[href]').length,
}));
await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true, tagged: true });
console.log(JSON.stringify(info));
await Promise.race([browser.close(), new Promise(r => setTimeout(r, 6000))]);
process.exit(0);
