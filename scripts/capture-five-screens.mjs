import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ROUTES = [
  { name: 'lobby', path: '/' },
  { name: 'grimorio', path: '/grimorio' },
  { name: 'montar-deck', path: '/montar-deck' },
  { name: 'guia-ninja', path: '/guia-ninja' },
  { name: 'historico', path: '/historico' },
];

const OUT = '/opt/cursor/artifacts';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const report = [];

for (const route of ROUTES) {
  await page.goto(`http://127.0.0.1:3000${route.path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  const outPath = path.join(OUT, `shinobi-${route.name}.png`);
  await page.screenshot({ path: outPath, fullPage: true });
  const url = page.url();
  const bodyText = await page.locator('body').innerText();
  const checks = {
    hasGrimorioTitle: bodyText.includes('Grimório Ninja'),
    hasConstrutorTitle: bodyText.includes('Construtor de Deck'),
    hasIrParaMontarDeck: bodyText.includes('Ir para Montar Deck'),
    hasDeckSelecionado: bodyText.includes('Deck Selecionado'),
    hasDocumentacao: bodyText.includes('DOCUMENTAÇÃO OFICIAL'),
    hasHistoricoStats: bodyText.includes('Taxa de Vitória'),
    hasEscolhaBaralho: bodyText.includes('ESCOLHA SEU BARALHO'),
    noDeckOnCard: (await page.locator('text=No deck:').count()) > 0,
  };
  report.push({ route: route.name, path: route.path, url, screenshot: outPath, checks });
}

await browser.close();
console.log(JSON.stringify(report, null, 2));