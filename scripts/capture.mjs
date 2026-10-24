// Real movement and interactions; no teleports or fabricated gameplay captures.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const output = resolve(process.argv[2] || '/tmp/pothe-pothe-v2');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
try {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  p.on('pageerror', (e) => {
    throw e;
  });
  await p.goto(process.env.CAPTURE_URL || 'http://127.0.0.1:5173');
  await p.getByRole('button', { name: 'Begin your journey' }).waitFor();
  await p.waitForTimeout(700);
  const shot = async (name) => {
    await p.waitForTimeout(650);
    await p.screenshot({ path: resolve(output, `${name}.png`) });
  };
  await shot('menu');
  await p.getByRole('button', { name: 'Begin your journey' }).click();
  await p.waitForTimeout(3200);
  await shot('courtyard');
  const snap = () => p.evaluate(() => window.__POTHE__);
  async function axis(axis, target) {
    const s = await snap();
    if (Math.abs(s[axis] - target) < 5) return;
    const positive = target > s[axis],
      key = axis === 'x' ? (positive ? 'd' : 'a') : positive ? 's' : 'w';
    await p.keyboard.down('Shift');
    await p.keyboard.down(key);
    let reached = false;
    try {
      for (let i = 0; i < 350; i++) {
        const next = await snap();
        if (positive ? next[axis] >= target - 4 : next[axis] <= target + 4) {
          reached = true;
          break;
        }
        await p.waitForTimeout(25);
      }
    } finally {
      await p.keyboard.up(key);
      await p.keyboard.up('Shift');
    }
    await p.waitForTimeout(180);
    if (!reached) throw Error(`Blocked ${axis} to ${target}`);
  }
  const at = async (x, y) => {
    await axis('x', x);
    await axis('y', y);
  };
  const enter = async () => {
    await p.keyboard.press('e');
    await p.waitForTimeout(550);
  };
  await at(480, 350);
  await enter();
  await shot('tea-interior');
  await at(414, 258);
  await p.keyboard.press('e');
  await shot('tea-dialogue');
  await p.getByRole('button', { name: 'দুধ চা Milk tea ৳15' }).click();
  await shot('tea-purchase');
  await p.getByRole('button', { name: 'Thank you, Mama' }).click();
  await at(360, 445);
  await enter();
  await at(480, 420);
  await at(1380, 420);
  await p.waitForTimeout(1500);
  await shot('bazaar');
  await at(1274, 345);
  await enter();
  await shot('bookshop');
  await at(360, 290);
  await at(432, 290);
  await p.keyboard.press('e');
  await p.getByRole('button', { name: 'Keep the bookmark' }).click();
  await p.getByRole('button', { name: 'See you around' }).click();
  await at(360, 445);
  await enter();
  await at(1420, 400);
  await at(1380, 1110);
  await at(1380, 1280);
  await p.waitForTimeout(3200);
  await shot('residential');
  await at(1380, 1110);
  await at(690, 1110);
  await at(690, 1240);
  await shot('lily-pond');
  await at(690, 1110);
  await at(480, 1110);
  await at(480, 960);
  await p.waitForTimeout(3200);
  await shot('crossing');
  await p.keyboard.press('m');
  await shot('district-map');
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const m = await ctx.newPage();
  await m.goto(process.env.CAPTURE_URL || 'http://127.0.0.1:5173');
  await m.getByRole('button', { name: 'Begin your journey' }).waitFor();
  await m.waitForTimeout(500);
  await m.screenshot({ path: resolve(output, 'mobile-menu.png') });
  await m.getByRole('button', { name: 'Begin your journey' }).tap();
  await m.waitForTimeout(3400);
  await m.screenshot({ path: resolve(output, 'mobile-courtyard.png') });
  console.log(`Captured thirteen actual game views in ${output}`);
} finally {
  await browser.close();
}
