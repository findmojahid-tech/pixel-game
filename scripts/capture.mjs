// Run against an existing dev/preview server. No screenshots are used as source art.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const output = resolve(process.argv[2] || '/tmp/pothe-pothe-captures');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(process.env.CAPTURE_URL || 'http://127.0.0.1:5173');
  await page.getByRole('button', { name: 'Begin your journey' }).waitFor();
  await page.waitForTimeout(700);
  await page.screenshot({ path: resolve(output, 'menu.png') });
  await page.getByRole('button', { name: 'Begin your journey' }).click();
  await page.waitForTimeout(3700);
  await page.screenshot({ path: resolve(output, 'street.png') });
  await page.keyboard.press('e');
  await page.waitForTimeout(3700);
  await page.screenshot({ path: resolve(output, 'interior.png') });
  const move = async (key, ms) => {
    await page.keyboard.down(key);
    await page.waitForTimeout(ms);
    await page.keyboard.up(key);
    await page.waitForTimeout(150);
  };
  await move('w', 650);
  await move('d', 550);
  await page.keyboard.press('e');
  await page.getByRole('dialog', { name: 'Conversation with Rahim Mama' }).waitFor();
  await page.screenshot({ path: resolve(output, 'dialogue.png') });
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mp = await mobile.newPage();
  await mp.goto(process.env.CAPTURE_URL || 'http://127.0.0.1:5173');
  await mp.getByRole('button', { name: 'Begin your journey' }).waitFor();
  await mp.waitForTimeout(500);
  await mp.screenshot({ path: resolve(output, 'mobile-menu.png') });
  await mp.getByRole('button', { name: 'Begin your journey' }).tap();
  await mp.waitForTimeout(3700);
  await mp.screenshot({ path: resolve(output, 'mobile-street.png') });
  console.log(`Captured six actual game views in ${output}`);
} finally {
  await browser.close();
}
