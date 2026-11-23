import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://127.0.0.1:3000';
const OUT = '/opt/cursor/artifacts/ui-audit';
const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];
const ROUTES = [
  { name: 'lobby', path: '/' },
  { name: 'grimorio', path: '/grimorio' },
  { name: 'montar-deck', path: '/montar-deck' },
  { name: 'guia-ninja', path: '/guia-ninja' },
  { name: 'historico', path: '/historico' },
];

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = [];

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  for (const route of ROUTES) {
    await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const overflowX = doc.scrollWidth > window.innerWidth + 2;
      const nav = document.querySelector('header');
      const hero = document.querySelector('.domain-page-hero');
      const main = document.querySelector('main');
      const rect = (el) =>
        el
          ? { w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) }
          : null;
      const fontSize = getComputedStyle(document.body).fontSize;
      const h1 = document.querySelector('h1');
      const h1Size = h1 ? getComputedStyle(h1).fontSize : null;
      const buttons = [...document.querySelectorAll('button')].slice(0, 8).map((b) => ({
        text: (b.textContent || '').trim().slice(0, 40),
        h: Math.round(b.getBoundingClientRect().height),
        w: Math.round(b.getBoundingClientRect().width),
      }));
      const cardsInRow = document.querySelectorAll('.grid .card6, .grid [class*="sc-v7o"]').length;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        overflowX,
        bodyFont: fontSize,
        h1Font: h1Size,
        nav: rect(nav),
        hero: rect(hero),
        mainMinH: main ? Math.round(main.getBoundingClientRect().height) : null,
        docHeight: doc.scrollHeight,
        sampleButtons: buttons,
        cardNodes: cardsInRow,
      };
    });
    const shot = `${OUT}/${route.name}-${vp.name}.png`;
    await page.screenshot({ path: shot, fullPage: true });
    report.push({ viewport: vp.name, route: route.name, path: route.path, metrics, screenshot: shot });
  }
  await page.close();
}
await browser.close();

const issues = [];
for (const row of report) {
  if (row.metrics.overflowX) {
    issues.push({
      severity: 'high',
      where: `${row.route} @ ${row.viewport}`,
      msg: `overflow horizontal scrollWidth=${row.metrics.scrollWidth} client=${row.metrics.clientWidth}`,
    });
  }
  if (row.viewport === 'mobile' && row.metrics.hero && row.metrics.hero.h > 320) {
    issues.push({
      severity: 'medium',
      where: `${row.route} @ mobile`,
      msg: `hero alto (${row.metrics.hero.h}px) — pode dominar a tela`,
    });
  }
  const hugeBtn = row.metrics.sampleButtons.find((b) => b.h > 52);
  if (hugeBtn) {
    issues.push({
      severity: 'low',
      where: `${row.route} @ ${row.viewport}`,
      msg: `botão alto (${hugeBtn.h}px): "${hugeBtn.text}"`,
    });
  }
}

const outJson = `${OUT}/report.json`;
fs.writeFileSync(outJson, JSON.stringify({ issues, report }, null, 2));
console.log(JSON.stringify({ issueCount: issues.length, issues, outJson }, null, 2));