// Actual game input and screenshots; no state mutation, composited art, or teleports.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const out = resolve(process.argv[2] || '/tmp/pothe-sideview-captures');
await mkdir(out, { recursive: true });
const url = process.env.CAPTURE_URL || 'http://127.0.0.1:5173';
const target = new URL(url);
let proxy;
const value = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (
  value &&
  target.protocol === 'https:' &&
  !['localhost', '127.0.0.1'].includes(target.hostname)
) {
  const u = new URL(value);
  proxy = {
    server: `${u.protocol}//${u.hostname}${u.port ? ':' + u.port : ''}`,
    username: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
  };
}
const b = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  ...(proxy ? { proxy } : {}),
});
const report = { url, errors: [], failedGameAssets: [], captures: [], walkFrames: [], checks: [] };
try {
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  p.on('pageerror', (e) => report.errors.push(e.message));
  p.on('response', (r) => {
    if (r.status() >= 400 && r.url().includes('/assets/sideview/'))
      report.failedGameAssets.push({ url: r.url(), status: r.status() });
  });
  const snap = () => p.evaluate(() => window.__SIDEVIEW__);
  const shot = async (name, wait = 350) => {
    await p.waitForTimeout(wait);
    const file = resolve(out, name + '.png');
    await p.screenshot({ path: file });
    report.captures.push({ name, file, state: await snap() });
  };
  const response = await p.goto(url);
  report.httpStatus = response.status();
  await p.getByRole('button', { name: /Take a walk|Continue your walk/ }).waitFor();
  await shot('menu-2x');
  await p.getByRole('button', { name: /Take a walk|Continue your walk/ }).click();
  await p.waitForTimeout(3400);
  await shot('street-2x');
  await p.setViewportSize({ width: 640, height: 360 });
  await p.waitForTimeout(400);
  await shot('street-native');
  async function walk(x) {
    const s = await snap();
    if (Math.abs(s.x - x) < 6) return;
    const positive = x > s.x,
      key = positive ? 'd' : 'a';
    await p.keyboard.down('Shift');
    await p.keyboard.down(key);
    let reached = false;
    try {
      for (let n = 0; n < 600; n++) {
        const cur = await snap();
        if (positive ? cur.x >= x - 5 : cur.x <= x + 5) {
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
    if (!reached) throw Error('Could not reach ' + x);
  }
  async function enter(place) {
    await p.keyboard.press('e');
    for (let i = 0; i < 30; i++) {
      await p.waitForTimeout(50);
      if ((await snap()).place === place) {
        await p.waitForTimeout(400);
        return;
      }
    }
    throw Error('Transition failed ' + place);
  }
  await enter('tea');
  await shot('tea-interior-native');
  await walk(480);
  await p.keyboard.press('e');
  await p.getByRole('button', { name: 'দুধ চা Milk tea ৳15' }).waitFor();
  await shot('tea-dialogue-native');
  await p.getByRole('button', { name: 'দুধ চা Milk tea ৳15' }).click();
  await shot('tea-purchase-native');
  if ((await snap()).wallet !== 85) throw Error('Tea purchase did not deduct BDT 15');
  report.checks.push('Milk tea: 100 -> 85 BDT');
  await p.getByRole('button', { name: 'Thank you, Mama' }).click();
  await walk(48);
  await enter('street');
  await p.keyboard.down('d');
  for (let i = 0; i < 8; i++) {
    await p.waitForTimeout(80);
    const s = await snap();
    const file = resolve(out, `walking-${i + 1}.png`);
    await p.screenshot({ path: file });
    report.walkFrames.push({ file, frame: s.frame, animation: s.animation, x: s.x });
    const r = await p.locator('#game canvas').boundingBox();
    const now = await snap();
    await p.screenshot({
      path: resolve(out, `walk-detail-${i + 1}.png`),
      clip: {
        x: Math.round(r.x + (now.x - now.camera.x - 44) * now.scale),
        y: Math.round(r.y + (now.y - 90) * now.scale),
        width: 88 * now.scale,
        height: 96 * now.scale,
      },
    });
  }
  await p.keyboard.up('d');
  await p.waitForTimeout(200);
  if (new Set(report.walkFrames.map((f) => f.frame)).size < 3)
    throw Error('Animation frames did not advance');
  report.checks.push('PNG walking animation advances');
  await walk(746);
  await p.keyboard.down('Shift');
  await p.keyboard.down('d');
  await p.keyboard.press('Space');
  for (let i = 0; i < 80 && (await snap()).x < 845; i++) await p.waitForTimeout(25);
  await p.keyboard.up('d');
  await p.keyboard.up('Shift');
  await p.waitForTimeout(500);
  if ((await snap()).x < 840) throw Error('Crate collision/hop failed');
  report.checks.push('Solid crate and hop traversal');
  await walk(1350);
  await p.waitForTimeout(3300);
  await shot('river-native');
  await p.setViewportSize({ width: 1280, height: 720 });
  await p.waitForTimeout(400);
  await shot('river-2x');
  await walk(1860);
  await p.keyboard.press('e');
  await shot('district-connection-2x');
  const end = await snap();
  if (!['lalbagh', 'river', 'tea'].every((id) => end.visited.includes(id)))
    throw Error('Connected section discoveries missing');
  report.checks.push('Both outdoor sections and interior visited');
  await p.keyboard.press('Escape');
  await p.getByRole('button', { name: 'Save & title screen' }).click();
  await p.reload();
  await p.getByRole('button', { name: 'Continue your walk' }).click();
  await p.waitForTimeout(600);
  const reloaded = await snap();
  if (reloaded.wallet !== 85 || reloaded.section !== 'river') throw Error('Save/load failed');
  report.checks.push('Reload restored River Road and BDT 85');
  const c = await b.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const m = await c.newPage();
  m.on('pageerror', (e) => report.errors.push(e.message));
  await m.goto(url);
  await m.getByRole('button', { name: /Take a walk|Continue your walk/ }).tap();
  await m.waitForTimeout(3500);
  await m.screenshot({ path: resolve(out, 'mobile-street.png') });
  await m.getByRole('button', { name: 'Interact', exact: true }).tap();
  await m.waitForTimeout(650);
  const client = await c.newCDPSession(m);
  const button = await m.getByRole('button', { name: 'Move right' }).boundingBox();
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: button.x + button.width / 2, y: button.y + button.height / 2 }],
  });
  let reached = false;
  for (let i = 0; i < 220; i++) {
    if ((await m.evaluate(() => window.__SIDEVIEW__)).x > 432) {
      reached = true;
      break;
    }
    await m.waitForTimeout(25);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  if (!reached) throw Error('Mobile movement failed');
  await m.waitForTimeout(180);
  await m.getByRole('button', { name: 'Interact', exact: true }).tap();
  await m.getByRole('button', { name: 'লেবু চা Lemon tea ৳10' }).tap();
  await m.screenshot({ path: resolve(out, 'mobile-tea.png') });
  if ((await m.evaluate(() => window.__SIDEVIEW__)).wallet !== 90)
    throw Error('Mobile tea payment failed');
  await m.getByRole('button', { name: 'Thank you, Mama' }).tap();
  await m.setViewportSize({ width: 844, height: 390 });
  await m.waitForTimeout(500);
  await m.screenshot({ path: resolve(out, 'mobile-landscape.png') });
  report.checks.push('Mobile native touch movement, lemon tea (100 -> 90), orientation');
  report.fonts = await m.evaluate(() => ({
    bengali: document.fonts.check('17px Bengali'),
    pixel: document.fonts.check('8px Pixel'),
  }));
  await c.close();
  if (report.errors.length || report.failedGameAssets.length)
    throw Error('Game runtime or asset loading failure');
  report.status = 'passed';
  console.log(
    JSON.stringify({
      status: report.status,
      url,
      checks: report.checks,
      nativeCaptures: report.captures.filter((c) => c.name.includes('native')).length,
      errors: report.errors,
    }),
  );
} catch (e) {
  report.status = 'failed';
  report.failure = String(e);
  throw e;
} finally {
  await writeFile(resolve(out, 'gameplay-evidence.json'), JSON.stringify(report, null, 2));
  await b.close();
}
