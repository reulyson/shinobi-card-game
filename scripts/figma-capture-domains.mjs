import { chromium } from 'playwright';

const PROMPT_ID = 'a7c3e1f0-9b2d-4c8a-8e1f-6d5c4b3a2f10';
const BASE = 'http://127.0.0.1:3000';

const CAPTURES = [
  { captureId: '11013195-4d92-4053-ad54-196f472b4a00', path: '/' },
  { captureId: 'f79e01eb-8934-4514-ad41-511d60361113', path: '/grimorio' },
  { captureId: 'ddb635bb-7a07-4974-80f9-206ed1865520', path: '/montar-deck' },
  { captureId: 'a70822ed-e4c0-4f75-b322-7562fcef9a6c', path: '/guia-ninja' },
  { captureId: '4d399486-f199-42a2-891b-3cffacdde784', path: '/historico' },
];

function captureHash(captureId) {
  const endpoint = encodeURIComponent(
    `https://mcp.figma.com/mcp/capture/${captureId}/submit?bindVariables=true&promptId=${PROMPT_ID}`
  );
  return `#figmacapture=${captureId}&figmaendpoint=${endpoint}&figmadelay=2000`;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

for (const { captureId, path } of CAPTURES) {
  const url = `${BASE}${path}${captureHash(captureId)}`;
  console.log('goto', path);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  console.log('done', path);
}

await browser.close();
console.log('all submitted (poll Figma capture status)');