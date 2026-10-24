import { test, expect, type Page } from '@playwright/test';
type Snapshot = {
  mode: string;
  place: string;
  x: number;
  y: number;
  wallet: number;
  cups: number;
  dialogue: boolean;
  phaser: string;
};
const snapshot = (page: Page) =>
  page.evaluate(() => (window as unknown as { __POTHE__: Snapshot }).__POTHE__);
async function move(page: Page, key: string, ms: number) {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
  await page.waitForTimeout(130);
}
async function start(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin your journey' })).toBeVisible();
  await page.getByRole('button', { name: 'Begin your journey' }).click();
  await page.waitForTimeout(700);
}
test('Phaser 4 street → stall → tea purchase → persistence → street', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page);
  expect((await snapshot(page)).phaser).toMatch(/^4\./);
  const before = await snapshot(page);
  await move(page, 'd', 300);
  expect((await snapshot(page)).x).toBeGreaterThan(before.x + 12);
  await move(page, 'a', 300);
  await page.keyboard.press('e');
  await page.waitForTimeout(700);
  expect((await snapshot(page)).place).toBe('stall');
  await move(page, 'w', 650);
  await move(page, 'd', 550);
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog', { name: 'Conversation with Rahim Mama' })).toBeVisible();
  await page.getByRole('button', { name: 'দুধ চা Milk tea ৳15' }).click();
  await expect(page.locator('#wallet')).toHaveText('85 BDT');
  expect((await snapshot(page)).cups).toBe(1);
  await page.getByRole('button', { name: 'Thank you, Mama' }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Save & main menu' }).click();
  await expect(page.getByRole('button', { name: 'Continue your journey' })).toBeEnabled();
  await page.reload();
  await page.getByRole('button', { name: 'Continue your journey' }).click();
  await page.waitForTimeout(700);
  expect(await snapshot(page)).toMatchObject({ wallet: 85, cups: 1, place: 'stall' });
  await move(page, 'a', 550);
  await move(page, 's', 1100);
  await page.keyboard.press('e');
  await page.waitForTimeout(650);
  expect((await snapshot(page)).place).toBe('street');
  expect(errors).toEqual([]);
});
test('keyboard pause, wall bounds, story and unaffordable tea', async ({ page }) => {
  await start(page);
  await move(page, 'w', 800);
  expect((await snapshot(page)).y).toBeGreaterThanOrEqual(236);
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await snapshot(page)).mode).toBe('paused');
  const paused = await snapshot(page);
  await move(page, 'd', 400);
  expect((await snapshot(page)).x).toBe(paused.x);
  await page.getByRole('button', { name: 'Back to the street' }).click();
  await page.keyboard.press('e');
  await page.waitForTimeout(650);
  await move(page, 'w', 650);
  await move(page, 'd', 550);
  await page.keyboard.press('e');
  await page.getByRole('button', { name: 'Tell me your story' }).click();
  await expect(page.locator('.translation')).toContainText('my father');
  await page.getByRole('button', { name: 'Another cup?' }).click();
  for (let i = 0; i < 10; i++) {
    await page.getByRole('button', { name: 'লেবু চা Lemon tea ৳10' }).click();
    if (i < 9) await page.getByRole('button', { name: 'Another cup?' }).click();
  }
  await page.getByRole('button', { name: 'Another cup?' }).click();
  await page.getByRole('button', { name: 'দুধ চা Milk tea ৳15' }).click();
  await expect(page.locator('.translation')).toContainText('short on cash');
  expect(await snapshot(page)).toMatchObject({ wallet: 0, cups: 10 });
});
test('mobile touch controls, stall entry, dialogue and no horizontal overflow', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await start(page);
  const client = await page.context().newCDPSession(page);
  async function touchHold(name: string, ms: number) {
    const box = await page.getByRole('button', { name, exact: true }).boundingBox();
    if (!box) throw Error('Touch control not visible');
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
    });
    await page.waitForTimeout(ms);
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(160);
  }
  const before = await snapshot(page);
  await touchHold('Move right', 350);
  expect((await snapshot(page)).x).toBeGreaterThan(before.x + 10);
  await touchHold('Move left', 350);
  await page.locator('.touch-interact').tap();
  await page.waitForTimeout(650);
  expect((await snapshot(page)).place).toBe('stall');
  await touchHold('Move up', 650);
  await touchHold('Move right', 550);
  await page.locator('.touch-interact').tap();
  await page.getByRole('button', { name: 'লেবু চা Lemon tea ৳10' }).tap();
  await expect(page.locator('#wallet')).toHaveText('90 BDT');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});
