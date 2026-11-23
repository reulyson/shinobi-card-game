import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

const ROUTES = ['/', '/grimorio', '/montar-deck'];

const OUT = '/opt/cursor/artifacts/responsive';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  for (const route of ROUTES) {
    const slug = route === '/' ? 'lobby' : route.slice(1);
    await page.goto(`http://127.0.0.1:3000${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const file = path.join(OUT, `${vp.name}-${slug}.png`);
    await page.screenshot({ path: file, fullPage: true });
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollW: doc.scrollWidth,
        clientW: doc.clientWidth,
        hasHorizontalOverflow: doc.scrollWidth > doc.clientWidth + 2,
      };
    });
    console.log(vp.name, slug, overflow.hasHorizontalOverflow ? 'OVERFLOW' : 'ok', overflow);
  }
  await page.close();
}

await browser.close();
console.log('done', OUT);