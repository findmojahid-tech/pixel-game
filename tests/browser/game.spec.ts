import { test, expect, type Page } from '@playwright/test';
type Snapshot = {
  mode: string;
  place: string;
  zone: string;
  x: number;
  y: number;
  wallet: number;
  cups: number;
  visited: string[];
  bookmark: boolean;
  dialogue: boolean;
  scale: number;
  camera: { x: number; y: number; w: number; h: number };
};
const snap = (p: Page) =>
  p.evaluate(() => (window as unknown as { __POTHE__: Snapshot }).__POTHE__);
async function start(p: Page) {
  await p.goto('/?view=district');
  await p.getByRole('button', { name: 'Begin your journey' }).click();
  await expect.poll(async () => (await snap(p)).mode).toBe('playing');
  await p.waitForTimeout(450);
}
async function axis(p: Page, axis: 'x' | 'y', target: number) {
  const before = await snap(p);
  if (Math.abs(before[axis] - target) < 5) return;
  const positive = target > before[axis],
    key = axis === 'x' ? (positive ? 'd' : 'a') : positive ? 's' : 'w';
  await p.keyboard.down('Shift');
  await p.keyboard.down(key);
  try {
    await expect
      .poll(
        async () => {
          const s = await snap(p);
          return positive ? s[axis] >= target - 4 : s[axis] <= target + 4;
        },
        { timeout: 15000, intervals: [25, 25, 25] },
      )
      .toBe(true);
  } finally {
    await p.keyboard.up(key);
    await p.keyboard.up('Shift');
  }
  await p.waitForTimeout(170);
}
async function at(p: Page, x: number, y: number) {
  await axis(p, 'x', x);
  await axis(p, 'y', y);
}
async function enter(p: Page, place: string) {
  await p.keyboard.press('e');
  await expect.poll(async () => (await snap(p)).place).toBe(place);
  await p.waitForTimeout(450);
}
test('roam the full district loop, both interiors, tea payment, NPCs and keepsake persistence', async ({
  page,
}) => {
  test.setTimeout(100000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page);
  await at(page, 480, 350);
  await enter(page, 'stall');
  await at(page, 414, 258);
  await page.keyboard.press('e');
  await page.getByRole('button', { name: 'দুধ চা Milk tea ৳15' }).click();
  expect(await snap(page)).toMatchObject({ wallet: 85, cups: 1 });
  await page.getByRole('button', { name: 'Thank you, Mama' }).click();
  await at(page, 360, 445);
  await enter(page, 'district');
  await at(page, 480, 420);
  await at(page, 1274, 420);
  expect((await snap(page)).zone).toBe('bazaar');
  await at(page, 1274, 345);
  await enter(page, 'books');
  await at(page, 360, 290);
  await at(page, 432, 290);
  await page.keyboard.press('e');
  await page.getByRole('button', { name: 'Keep the bookmark' }).click();
  expect((await snap(page)).bookmark).toBe(true);
  await page.getByRole('button', { name: 'See you around' }).click();
  await at(page, 360, 445);
  await enter(page, 'district');
  await at(page, 1420, 400);
  await at(page, 1420, 1110);
  await at(page, 1460, 1130);
  expect((await snap(page)).zone).toBe('residential');
  expect((await snap(page)).camera.y).toBeGreaterThan(600);
  await page.keyboard.press('e');
  await expect(page.locator('.translation')).toContainText('bakul tree');
  await page.getByRole('button', { name: 'See you around' }).click();
  await at(page, 1420, 1130);
  await at(page, 480, 1110);
  await at(page, 480, 830);
  expect((await snap(page)).zone).toBe('crossing');
  await page.keyboard.press('e');
  await expect(page.locator('.translation')).toContainText('whole neighbourhood');
  await page.getByRole('button', { name: 'See you around' }).click();
  await at(page, 490, 420);
  expect((await snap(page)).visited.sort()).toEqual([
    'bazaar',
    'books',
    'courtyard',
    'crossing',
    'residential',
    'stall',
  ]);
  await page.keyboard.press('m');
  await expect(page.getByRole('dialog', { name: 'Your neighbourhood' })).toBeVisible();
  await page.getByRole('button', { name: 'Keep wandering' }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Save & main menu' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Continue your journey' }).click();
  await page.waitForTimeout(500);
  expect(await snap(page)).toMatchObject({ wallet: 85, cups: 1, bookmark: true });
  expect((await snap(page)).visited).toHaveLength(6);
  expect(errors).toEqual([]);
});
test('native mobile touch, readable signs, tea ordering, pause and orientation changes', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page);
  const client = await context.newCDPSession(page);
  async function hold(name: string, ms: number) {
    const box = await page.getByRole('button', { name, exact: true }).boundingBox();
    if (!box) throw Error('Missing touch control');
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
    });
    await page.waitForTimeout(ms);
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(180);
  }
  expect(
    await page
      .locator('[data-sign="tea"] strong')
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(15);
  await hold('Move up', 550);
  await page.locator('.touch-interact').tap();
  await expect.poll(async () => (await snap(page)).place).toBe('stall');
  await page.waitForTimeout(500);
  await hold('Move up', 950);
  await hold('Move right', 400);
  await page.locator('.touch-interact').tap();
  await page.getByRole('button', { name: 'লেবু চা Lemon tea ৳10' }).tap();
  expect((await snap(page)).wallet).toBe(90);
  await page.getByRole('button', { name: 'Thank you, Mama' }).tap();
  await page.getByRole('button', { name: 'Pause game' }).tap();
  const before = await snap(page);
  await page.waitForTimeout(200);
  expect((await snap(page)).x).toBe(before.x);
  await page.getByRole('button', { name: 'Back to the neighbourhood' }).tap();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(500);
  const box = await page.locator('canvas').first().boundingBox();
  expect(Math.abs(box!.width - 844)).toBeLessThan(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await context.close();
});
test('integer pixel scaling, compact HUD, and legacy save migration', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?view=district');
  await page.evaluate(() =>
    localStorage.setItem(
      'pothe-pothe.save.v1',
      JSON.stringify({
        version: 1,
        wallet: 55,
        cups: 3,
        place: 'stall',
        x: 370,
        y: 230,
        muted: true,
        metSeller: true,
        savedAt: 1,
      }),
    ),
  );
  await page.reload();
  await page.getByRole('button', { name: 'Continue your journey' }).click();
  await page.waitForTimeout(600);
  expect(await snap(page)).toMatchObject({ place: 'district', wallet: 55, cups: 3, scale: 2 });
  const dimensions = await page.locator('#game canvas').evaluate((el) => ({
    width: (el as HTMLCanvasElement).width,
    physical: el.getBoundingClientRect().width,
  }));
  expect(dimensions.physical / dimensions.width).toBe(2);
  const hud = await page.locator('.location').boundingBox();
  expect(hud!.height).toBeLessThan(65);
  expect(hud!.width).toBeLessThan(240);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Stay a little longer.' })).toBeVisible();
});
