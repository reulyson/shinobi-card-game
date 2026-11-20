/**
 * Captura screenshots + GIF da demo Parte 4 (scroll + moeda/poof).
 * Uso: node scripts/capture-part4.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const OUT = '/opt/cursor/artifacts';
const BASE = 'http://127.0.0.1:4173/?demo=part4';
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync('/tmp/part4-frames', { recursive: true });

const browser = await chromium.launch({
  executablePath: '/usr/local/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({ viewport: { width: 1100, height: 820 }, deviceScaleFactor: 1 });

// --- Scroll opening frames ---
const scrollFrames = [0, 0.2, 0.45, 0.75, 1];
for (let i = 0; i < scrollFrames.length; i++) {
  const p = scrollFrames[i];
  await page.goto(`${BASE}&scroll=${p}&ms=60000`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const scroll = page.locator('[data-testid="historico-scroll"]');
  await scroll.screenshot({ path: path.join('/tmp/part4-frames', `scroll-${i}.png`) });
}
await page.goto(`${BASE}&scroll=1&ms=60000`, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.locator('[data-testid="historico-scroll"]').screenshot({
  path: path.join(OUT, 'historico_scroll_aberto.png'),
});

// Animated scroll: capture many frames then ffmpeg gif
await page.goto(`${BASE}&ms=60000`, { waitUntil: 'networkidle' });
for (let i = 0; i < 16; i++) {
  await page.waitForTimeout(90);
  await page.locator('[data-testid="historico-scroll"]').screenshot({
    path: path.join('/tmp/part4-frames', `scroll-anim-${String(i).padStart(2, '0')}.png`),
  });
}

// --- Coin timer + poof (fast 3.2s) ---
await page.goto(`${BASE}&scroll=1&ms=3200&side=player`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.locator('[data-testid="turn-chakra-hud"]').screenshot({
  path: path.join(OUT, 'turn_coin_cheio.png'),
});

for (let i = 0; i < 28; i++) {
  await page.waitForTimeout(160);
  await page.locator('[data-testid="turn-chakra-hud"]').screenshot({
    path: path.join('/tmp/part4-frames', `coin-anim-${String(i).padStart(2, '0')}.png`),
  });
}
await page.locator('[data-testid="turn-chakra-hud"]').screenshot({
  path: path.join(OUT, 'turn_coin_apos_poof.png'),
});

// Full demo page shot
await page.goto(`${BASE}&scroll=1&ms=60000&side=player`, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT, 'part4_demo_overview.png'), fullPage: true });

await browser.close();

function makeGif(pattern, outName, fps = 10) {
  const out = path.join(OUT, outName);
  try {
    execSync(
      `ffmpeg -y -framerate ${fps} -i ${pattern} -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" -loop 0 ${out}`,
      { stdio: 'inherit' }
    );
    console.log('gif', out);
  } catch (e) {
    console.error('gif failed', outName, e.message);
  }
}

makeGif('/tmp/part4-frames/scroll-anim-%02d.png', 'historico_unroll.gif', 12);
makeGif('/tmp/part4-frames/coin-anim-%02d.png', 'moeda_timer_poof.gif', 8);
console.log('done');
