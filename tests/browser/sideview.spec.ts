import { test, expect, type Page } from '@playwright/test';
type Snapshot = {
  mode: string;
  place: string;
  section: string;
  x: number;
  y: number;
  floor: number;
  grounded: boolean;
  wallet: number;
  cups: number;
  visited: string[];
  dialogue: boolean;
  animation: string;
  frame: number;
  scale: number;
  camera: { x: number; width: number };
  parallax: { sky: number; foliage: number; facade: number; foreground: number };
  traffic: { kind: string; x: number; frame: number }[];
};
const state = (p: Page) =>
  p.evaluate(() => (window as unknown as { __SIDEVIEW__: Snapshot }).__SIDEVIEW__);
async function begin(p: Page) {
  await p.goto('/');
  await p.getByRole('button', { name: /Take a walk|Continue your walk/ }).click();
  await expect.poll(async () => (await state(p)).mode).toBe('play');
  await p.waitForTimeout(450);
}
async function walk(p: Page, x: number) {
  const s = await state(p);
  if (Math.abs(s.x - x) < 6) return;
  const pos = x > s.x,
    k = pos ? 'd' : 'a';
  await p.keyboard.down('Shift');
  await p.keyboard.down(k);
  try {
    await expect
      .poll(
        async () => {
          const s = await state(p);
          return pos ? s.x >= x - 5 : s.x <= x + 5;
        },
        { timeout: 20000, intervals: [30, 30, 30] },
      )
      .toBe(true);
  } finally {
    await p.keyboard.up(k);
    await p.keyboard.up('Shift');
  }
  await p.waitForTimeout(180);
}
async function doorway(p: Page, place: string) {
  await p.keyboard.press('e');
  await expect.poll(async () => (await state(p)).place).toBe(place);
  await p.waitForTimeout(450);
}
test('side-view street, PNG animation/parallax, tea transaction, second section and save/load', async ({
  page,
}) => {
  test.setTimeout(65000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await begin(page);
  await doorway(page, 'tea');
  await walk(page, 480);
  await page.keyboard.press('e');
  await page.getByRole('button', { name: 'দুধ চা Milk tea ৳15' }).click();
  expect(await state(page)).toMatchObject({ wallet: 85, cups: 1 });
  await page.getByRole('button', { name: 'Thank you, Mama' }).click();
  await walk(page, 48);
  await doorway(page, 'street');
  const before = await state(page);
  await page.keyboard.down('d');
  const frames = new Set<number>();
  for (let i = 0; i < 7; i++) {
    await page.waitForTimeout(90);
    const s = await state(page);
    frames.add(Number(s.frame));
    expect(s.animation).toBe('sv-walk');
  }
  await page.keyboard.up('d');
  expect(frames.size).toBeGreaterThanOrEqual(3);
  await walk(page, 700);
  const after = await state(page);
  expect(Math.abs(after.parallax.sky - before.parallax.sky)).toBeLessThan(
    Math.abs(after.parallax.facade - before.parallax.facade),
  );
  expect(Math.abs(after.parallax.foreground - before.parallax.foreground)).toBeGreaterThan(
    Math.abs(after.parallax.facade - before.parallax.facade),
  );
  expect(after.traffic[0].x).not.toBe(before.traffic[0].x);
  await walk(page, 746);
  await page.keyboard.down('Shift');
  await page.keyboard.down('d');
  await page.keyboard.press('Space');
  await expect.poll(async () => (await state(page)).x).toBeGreaterThan(840);
  await page.keyboard.up('d');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(500);
  expect((await state(page)).grounded).toBe(true);
  await walk(page, 1300);
  expect((await state(page)).section).toBe('river');
  await walk(page, 1870);
  expect((await state(page)).visited).toEqual(expect.arrayContaining(['lalbagh', 'tea', 'river']));
  await page.keyboard.press('e');
  await expect(page.locator('.sv-toast')).toContainText('future district');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Save & title screen' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Continue your walk' }).click();
  await page.waitForTimeout(600);
  expect(await state(page)).toMatchObject({ section: 'river', wallet: 85, cups: 1 });
  expect((await state(page)).y).toBeCloseTo((await state(page)).floor, 1);
  expect(errors).toEqual([]);
});
test('side-view preserves district location and currency through the working fallback', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() =>
    localStorage.setItem(
      'pothe-pothe.save.v1',
      JSON.stringify({
        version: 2,
        wallet: 65,
        cups: 2,
        place: 'books',
        x: 360,
        y: 290,
        metSeller: true,
        muted: true,
        savedAt: 1,
        visited: ['courtyard', 'bazaar', 'books'],
        bookmark: true,
      }),
    ),
  );
  await page.reload();
  await page.getByRole('button', { name: 'Take a walk' }).click();
  await page.waitForTimeout(500);
  await doorway(page, 'tea');
  await walk(page, 480);
  await page.keyboard.press('e');
  await page.getByRole('button', { name: 'লেবু চা Lemon tea ৳10' }).click();
  expect((await state(page)).wallet).toBe(55);
  const common = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('pothe-pothe.save.v1')!),
  );
  expect(common).toMatchObject({
    place: 'books',
    x: 360,
    y: 290,
    wallet: 55,
    cups: 3,
    bookmark: true,
    muted: true,
    visited: ['courtyard', 'bazaar', 'books'],
  });
  await page.goto('/?view=district');
  await page.getByRole('button', { name: 'Continue your journey' }).click();
  await page.waitForTimeout(600);
  await expect(page.locator('#wallet')).toHaveText('55');
  expect(
    await page.evaluate(
      () => (window as unknown as { __POTHE__: { place: string } }).__POTHE__.place,
    ),
  ).toBe('books');
});
test('side-view mobile touch, Bangla clarity, tea buying and portrait/landscape layout', async ({
  browser,
}) => {
  const c = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const p = await c.newPage();
  const errors: string[] = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await begin(p);
  const sign = p.locator('.sv-tea-sign strong');
  expect(
    await sign.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(17);
  await p.getByRole('button', { name: 'Interact', exact: true }).tap();
  await expect.poll(async () => (await state(p)).place).toBe('tea');
  await p.waitForTimeout(500);
  const client = await c.newCDPSession(p);
  const b = await p.getByRole('button', { name: 'Move right' }).boundingBox();
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: b!.x + b!.width / 2, y: b!.y + b!.height / 2 }],
  });
  await expect.poll(async () => (await state(p)).x, { timeout: 7000 }).toBeGreaterThan(433);
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(180);
  await p.getByRole('button', { name: 'Interact', exact: true }).tap();
  await p.getByRole('button', { name: 'দুধ চা Milk tea ৳15' }).tap();
  expect((await state(p)).wallet).toBe(85);
  await p.getByRole('button', { name: 'Thank you, Mama' }).tap();
  await p.setViewportSize({ width: 844, height: 390 });
  await p.waitForTimeout(500);
  const rect = await p.locator('#game canvas').boundingBox();
  expect(Math.abs(rect!.width - 844)).toBeLessThan(3);
  expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await p.getByRole('button', { name: 'Pause game' }).tap();
  await expect(p.getByRole('dialog', { name: 'A little pause.' })).toBeVisible();
  expect(errors).toEqual([]);
  await c.close();
});
test('native gameplay resolution keeps the complete interaction prompt on screen', async ({
  page,
}) => {
  await page.setViewportSize({ width: 640, height: 360 });
  await begin(page);
  await expect(page.locator('.sv-prompt')).toHaveClass(/visible/);
  await expect(page.locator('.sv-help')).toBeHidden();
  const b = await page.locator('.sv-prompt').boundingBox();
  expect(b!.y + b!.height).toBeLessThanOrEqual(360);
  expect(b!.x).toBeGreaterThanOrEqual(0);
  expect(b!.x + b!.width).toBeLessThanOrEqual(640);
  await doorway(page, 'tea');
  const menuFits = await page
    .locator('.sv-room-menu span')
    .evaluateAll((els) => els.every((el) => el.scrollWidth <= el.clientWidth));
  expect(menuFits).toBe(true);
});
